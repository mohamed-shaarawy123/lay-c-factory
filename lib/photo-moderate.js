/**
 * Server-side photo checks using the project's existing camera rules:
 * - only camera JPEG/PNG/WebP data URLs of bounded size
 * - minimum dimensions and non-blank variance (properPhoto)
 * - NSFWJS thresholds: Porn > 0.5, Hentai > 0.5, or Sexy > 0.85 → reject
 * Uncertain / failed / timed-out checks never accept the photo.
 *
 * Model loading (npm + Node, not browser script tags):
 * Load MobileNetV2 from hosted model.json + weight shard under
 * /models/nsfw/mobilenet_v2/ so Vercel does not depend on NSFWJS's
 * dynamic require of model.min.js (that path breaks in serverless traces).
 */
const fs = require("fs");
const path = require("path");
const jpeg = require("jpeg-js");

const RULES = {
  maxBase64Len: 700000,
  minWidth: 160,
  minHeight: 160,
  minVariance: 40,
  pornMax: 0.5,
  hentaiMax: 0.5,
  sexyMax: 0.85,
  timeoutMs: 20000,
};

let modelPromise = null;
let modelReady = false;
let modelError = "";
let tf = null;

function parseDataUrl(dataUrl) {
  const s = String(dataUrl || "").replace(/\s+/g, "");
  const m = /^data:image\/(jpeg|jpg|png|webp);base64,([a-z0-9+/]+=*)$/i.exec(s);
  if (!m) return null;
  if (s.length > RULES.maxBase64Len) return null;
  let buf;
  try {
    buf = Buffer.from(m[2], "base64");
  } catch (e) {
    return null;
  }
  if (!buf || buf.length < 32) return null;
  return { mime: m[1].toLowerCase(), buffer: buf, dataUrl: s };
}

function decodeRaster(parsed) {
  if (parsed.mime === "jpeg" || parsed.mime === "jpg") {
    try {
      const raw = jpeg.decode(parsed.buffer, { useTArray: true, maxMemoryUsageInMB: 64 });
      if (!raw || !raw.width || !raw.height || !raw.data) return null;
      return { width: raw.width, height: raw.height, data: raw.data };
    } catch (e) {
      return null;
    }
  }
  if (parsed.mime === "png") {
    if (parsed.buffer[0] !== 0x89 || parsed.buffer[1] !== 0x50) return null;
    return { width: 0, height: 0, data: null, encodedOnly: true };
  }
  if (parsed.mime === "webp") {
    if (parsed.buffer.toString("ascii", 0, 4) !== "RIFF") return null;
    return { width: 0, height: 0, data: null, encodedOnly: true };
  }
  return null;
}

function varianceCheck(raster) {
  if (!raster || !raster.data || !raster.width || !raster.height) {
    return { ok: false, error: "Take a proper photo. The picture could not be read." };
  }
  if (raster.width < RULES.minWidth || raster.height < RULES.minHeight) {
    return { ok: false, error: "Take a proper photo. The picture is too small to save." };
  }
  const data = raster.data;
  let n = 0;
  let sum = 0;
  let sum2 = 0;
  const step = Math.max(16, Math.floor(data.length / 16000)) * 4;
  for (let i = 0; i + 2 < data.length; i += step) {
    const y = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    sum += y;
    sum2 += y * y;
    n++;
  }
  const mean = sum / Math.max(1, n);
  const variance = sum2 / Math.max(1, n) - mean * mean;
  if (variance < RULES.minVariance) {
    return { ok: false, error: "Take a proper photo. A blank or unusable picture cannot be saved." };
  }
  return { ok: true };
}

function withTimeout(promise, ms, message) {
  let timer;
  return Promise.race([
    promise.finally(() => clearTimeout(timer)),
    new Promise((_, reject) => {
      timer = setTimeout(() => {
        const err = new Error(message);
        err.code = "timeout";
        reject(err);
      }, ms);
    }),
  ]);
}

function modelBaseUrl(opts) {
  if (opts && opts.baseUrl) return String(opts.baseUrl).replace(/\/+$/, "");
  if (process.env.NSFW_MODEL_URL) return String(process.env.NSFW_MODEL_URL).replace(/\/+$/, "");
  const req = opts && opts.req;
  const headers = (req && req.headers) || {};
  const host = String(headers["x-forwarded-host"] || headers.host || "")
    .split(",")[0]
    .trim();
  if (host) {
    const proto = String(headers["x-forwarded-proto"] || (process.env.VERCEL ? "https" : "http"))
      .split(",")[0]
      .trim();
    return proto + "://" + host + "/models/nsfw/mobilenet_v2";
  }
  if (process.env.VERCEL_URL) {
    return "https://" + String(process.env.VERCEL_URL).replace(/^https?:\/\//, "") + "/models/nsfw/mobilenet_v2";
  }
  return "http://127.0.0.1:" + (process.env.PORT || 8765) + "/models/nsfw/mobilenet_v2";
}

async function assertModelFiles(base) {
  const modelUrl = base + "/model.json";
  const res = await fetch(modelUrl, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(
      "The photo check model could not be loaded from " +
        modelUrl +
        " (HTTP " +
        res.status +
        ").",
    );
  }
  const body = await res.text();
  if (!/modelTopology|weightsManifest/.test(body)) {
    throw new Error("The photo check model file is invalid. Expected a TensorFlow.js model.json.");
  }
  return modelUrl;
}

async function loadModel(opts) {
  if (modelPromise) return modelPromise;
  modelPromise = (async () => {
    modelReady = false;
    modelError = "";
    tf = require("@tensorflow/tfjs");
    await tf.setBackend("cpu");
    await tf.ready();
    tf.enableProdMode();
    const nsfwjs = require("nsfwjs");
    const base = modelBaseUrl(opts);
    const modelUrl = await assertModelFiles(base);
    // Hosted model.json path — do not use the named "MobileNetV2" bundle on Vercel.
    // That path dynamically requires model.min.js and fails in serverless file tracing.
    const model = await nsfwjs.load(modelUrl, { size: 224 });
    modelReady = true;
    return model;
  })().catch((err) => {
    modelPromise = null;
    modelReady = false;
    modelError = (err && err.message) || "The photo check model could not be loaded.";
    throw err;
  });
  return modelPromise;
}

function downscaleRgba(raster, size) {
  const sw = raster.width;
  const sh = raster.height;
  const src = raster.data;
  const out = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    const sy = Math.min(sh - 1, Math.floor((y * sh) / size));
    for (let x = 0; x < size; x++) {
      const sx = Math.min(sw - 1, Math.floor((x * sw) / size));
      const si = (sy * sw + sx) * 4;
      const di = (y * size + x) * 4;
      out[di] = src[si];
      out[di + 1] = src[si + 1];
      out[di + 2] = src[si + 2];
      out[di + 3] = 255;
    }
  }
  return { width: size, height: size, data: out };
}

function rgbaToRgbTensor(raster) {
  const scaled = raster.width > 224 || raster.height > 224 ? downscaleRgba(raster, 224) : raster;
  const { width, height, data } = scaled;
  const rgb = new Float32Array(width * height * 3);
  let j = 0;
  for (let i = 0; i < data.length; i += 4) {
    rgb[j++] = data[i];
    rgb[j++] = data[i + 1];
    rgb[j++] = data[i + 2];
  }
  return tf.tensor3d(rgb, [height, width, 3]);
}

async function classifyNsfw(raster, opts) {
  const model = await loadModel(opts);
  const image = rgbaToRgbTensor(raster);
  try {
    const preds = await model.classify(image);
    const score = (name) => {
      const row = (preds || []).find((p) => p.className === name);
      return row ? row.probability : 0;
    };
    const porn = score("Porn");
    const hentai = score("Hentai");
    const sexy = score("Sexy");
    if (porn > RULES.pornMax || hentai > RULES.hentaiMax || sexy > RULES.sexyMax) {
      return {
        ok: false,
        rejected: true,
        error: "This photo cannot be saved. Only a legal photo is allowed.",
        scores: { porn, hentai, sexy },
      };
    }
    return { ok: true, rejected: false, scores: { porn, hentai, sexy } };
  } finally {
    image.dispose();
  }
}

async function moderatePhoto(dataUrl, opts) {
  const timeoutMs = (opts && opts.timeoutMs) || RULES.timeoutMs;
  const parsed = parseDataUrl(dataUrl);
  if (!parsed) {
    return {
      ok: false,
      rejected: true,
      error: "Choose a smaller photo, or take the picture again with the camera.",
    };
  }
  const raster = decodeRaster(parsed);
  if (!raster) {
    return { ok: false, rejected: true, error: "Take a proper photo. The picture could not be read." };
  }
  if (raster.encodedOnly) {
    return {
      ok: false,
      rejected: true,
      error: "The photo check could not finish. Please take a JPEG picture with the camera and try again.",
    };
  }
  const basic = varianceCheck(raster);
  if (!basic.ok) return { ok: false, rejected: true, error: basic.error };

  try {
    const nsfw = await withTimeout(
      classifyNsfw(raster, opts),
      timeoutMs,
      "The photo check timed out, so the picture was not saved. Please try again.",
    );
    if (!nsfw.ok) return nsfw;
    return { ok: true, rejected: false, dataUrl: parsed.dataUrl };
  } catch (err) {
    return {
      ok: false,
      rejected: true,
      error:
        (err && err.message) ||
        modelError ||
        "The photo check could not run, so the picture was not saved. Please try again.",
    };
  }
}

function warm(opts) {
  return loadModel(opts)
    .then(() => true)
    .catch(() => false);
}

function status() {
  return { ready: modelReady, error: modelError || "" };
}

function localModelDir() {
  return path.join(__dirname, "nsfw-model", "mobilenet_v2");
}

function localModelPresent() {
  try {
    return fs.existsSync(path.join(localModelDir(), "model.json"));
  } catch (e) {
    return false;
  }
}

module.exports = {
  moderatePhoto,
  warm,
  status,
  RULES,
  parseDataUrl,
  modelBaseUrl,
  localModelPresent,
};
