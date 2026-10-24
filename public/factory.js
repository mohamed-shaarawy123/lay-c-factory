(() => {
  const $ = (s) => document.querySelector(s),
    TAU = Math.PI * 2,
    app = $("#app"),
    W = () => app.clientWidth,
    H = () => app.clientHeight;
  let R;
  try {
    R = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch (e) {
    $("#err").style.display = "block";
    return;
  }
  const scene = new THREE.Scene(),
    cam = new THREE.PerspectiveCamera(33, 1, 0.1, 150);
  R.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  R.outputEncoding = THREE.sRGBEncoding;
  R.toneMapping = THREE.ACESFilmicToneMapping;
  R.toneMappingExposure = 1.1;
  R.shadowMap.enabled = true;
  $("#scene").appendChild(R.domElement);
  const ctrl = new THREE.OrbitControls(cam, R.domElement);
  Object.assign(ctrl, {
    enableDamping: true,
    dampingFactor: 0.065,
    enablePan: false,
    minDistance: 7,
    maxDistance: 55,
    minPolarAngle: 0.09,
    maxPolarAngle: Math.PI * 0.475,
    rotateSpeed: 0.5,
    zoomSpeed: 0.7,
    autoRotateSpeed: 0.24,
  });
  scene.add(new THREE.HemisphereLight(0xdbe5f4, 0x1a2a66, 0.95));
  const key = new THREE.DirectionalLight(0xffffff, 1.7);
  key.position.set(-4, 12, 7);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, {
    left: -10,
    right: 10,
    top: 9,
    bottom: -9,
    near: 0.5,
    far: 35,
  });
  key.shadow.bias = -0.0004;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xc4d4ed, 0.8);
  rim.position.set(3, 7, -8);
  scene.add(rim);
  const fr = new THREE.DirectionalLight(0xffffff, 0.5);
  fr.position.set(5, 3, 10);
  scene.add(fr);
  const pl = new THREE.PointLight(0xcfdcff, 0.9, 22);
  pl.position.set(-4, 5, 3);
  scene.add(pl);
  const m = (c, me = 0.25, ro = 0.45, x = {}) =>
    new THREE.MeshStandardMaterial({ color: c, metalness: me, roughness: ro, ...x });
  const OR = 0x4169e1,
    CREAM = 0xffffff,
    GRAY = 0x45464a;
  const M = {
    body: m(0x2c4fd0, 0.35, 0.4),
    base: m(0x1d3aa8, 0.4, 0.4),
    edge: m(0xaab8f0, 0.4, 0.35),
    chrome: m(0xffffff, 0.35, 0.3),
    dark: m(0x14307f, 0.2, 0.5),
    ivory: m(0xf4f7ff, 0.15, 0.45),
    orange: m(OR, 0.2, 0.4),
    copper: m(0xbfd0ff, 0.4, 0.4),
    light: m(OR, 0.2, 0.3, { emissive: OR, emissiveIntensity: 1.4 }),
    liquid: m(GRAY, 0, 0.2, { emissive: GRAY, emissiveIntensity: 0.5 }),
    paper: m(0xffffff, 0, 0.85),
  };
  const box = (p, w, h, d, x, y, z, mt) => {
    const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mt);
    o.position.set(x, y, z);
    o.castShadow = o.receiveShadow = true;
    p.add(o);
    return o;
  };
  const cyl = (p, r, h, x, y, z, mt, r2 = r) => {
    const o = new THREE.Mesh(new THREE.CylinderGeometry(r, r2, h, 28), mt);
    o.position.set(x, y, z);
    o.castShadow = o.receiveShadow = true;
    p.add(o);
    return o;
  };
  const ctex = (w, h, fn) => {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    fn(c.getContext("2d"), w, h);
    const t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    t.anisotropy = 4;
    return t;
  };
  const txt = (c, s, x, y, sz, col, wt = 600) => {
    c.fillStyle = col;
    c.font = wt + " " + sz + "px system-ui,sans-serif";
    c.fillText(s, x, y);
  };
  const scr = (p, w, h, x, y, z, t) => {
    const o = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ map: t, toneMapped: false }),
    );
    o.position.set(x, y, z);
    p.add(o);
    return o;
  };
  const machine = new THREE.Group();
  scene.add(machine);
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(70, 70),
    new THREE.ShadowMaterial({ opacity: 0.25 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.43;
  floor.receiveShadow = true;
  scene.add(floor);
  // plate
  box(machine, 13.6, 0.38, 8.9, 0, -0.09, 0, M.base);
  box(machine, 13.4, 0.06, 8.7, 0, 0.13, 0, M.edge);
  box(machine, 13.3, 0.09, 8.6, 0, 0.19, 0, M.body);
  for (const x of [-6, 6])
    for (const z of [-3.6, 3.6]) cyl(machine, 0.36, 0.2, x, -0.33, z, M.dark);
  // small street telephone booth on the front-left corner of the base
  const phG = new THREE.Group();
  phG.position.set(6.1, 0.235, -3.6);
  phG.scale.setScalar(0.6);
  machine.add(phG);
  {
    const PW = 1.05,
      PH = 2.6,
      glassM = new THREE.MeshPhysicalMaterial({
        color: 0xcfe0ff,
        transparent: true,
        opacity: 0.2,
        roughness: 0.1,
        metalness: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
    box(phG, PW + 0.12, 0.12, PW + 0.12, 0, 0.06, 0, M.dark);
    for (const sx of [-1, 1])
      for (const sz of [-1, 1]) box(phG, 0.08, PH, 0.08, (sx * PW) / 2, 0.12 + PH / 2, (sz * PW) / 2, M.body);
    for (const y of [0.3, 2.42])
      for (const s of [-1, 1]) {
        box(phG, PW, 0.06, 0.06, 0, y, (s * PW) / 2, M.body);
        box(phG, 0.06, 0.06, PW, (s * PW) / 2, y, 0, M.body);
      }
    for (const s of [-1, 1]) {
      for (const g of [
        box(phG, PW - 0.08, 2, 0.015, 0, 1.36, (s * PW) / 2, glassM),
        box(phG, 0.015, 2, PW - 0.08, (s * PW) / 2, 1.36, 0, glassM),
      ])
        g.castShadow = false;
    }
    box(phG, PW + 0.18, 0.14, PW + 0.18, 0, PH + 0.2, 0, M.body);
    box(phG, PW + 0.06, 0.05, PW + 0.06, 0, PH + 0.3, 0, M.edge);
    box(phG, 0.5, 0.04, 0.5, 0, PH + 0.11, 0, M.light);
    const phTex = ctex(260, 70, (c, w, h) => {
      c.fillStyle = "#ffffff";
      c.fillRect(0, 0, w, h);
      c.textAlign = "center";
      c.textBaseline = "middle";
      txt(c, "TELEPHONE", w / 2, h / 2, 40, "#0f2a8a", 800);
    });
    scr(phG, PW - 0.06, 0.26, 0, 2.56, PW / 2 + 0.012, phTex);
    const phS2 = scr(phG, PW - 0.06, 0.26, PW / 2 + 0.012, 2.56, 0, phTex);
    phS2.rotation.y = Math.PI / 2;
    box(phG, 0.34, 0.46, 0.1, -0.2, 1.45, -PW / 2 + 0.1, M.dark);
    box(phG, 0.07, 0.36, 0.07, -0.4, 1.45, -PW / 2 + 0.19, M.chrome);
    box(phG, 0.2, 0.1, 0.02, -0.2, 1.58, -PW / 2 + 0.16, M.chrome);
    box(phG, 0.16, 0.02, 0.12, -0.2, 1.28, -PW / 2 + 0.18, M.orange);
    box(phG, PW - 0.1, 0.02, PW - 0.1, 0, 0.14, 0, M.dark);
  }
  let openMeet = null;
  let openOrders = null;
  let openReviews = null;
  let waveFlag = null;
  // flag on the front-left corner of the base
  const flagG = new THREE.Group();
  flagG.position.set(-6.2, 0.235, 3.7);
  flagG.scale.setScalar(0.65);
  machine.add(flagG);
  cyl(flagG, 0.2, 0.08, 0, 0.04, 0, M.chrome);
  cyl(flagG, 0.035, 2.6, 0, 1.3, 0, M.chrome);
  const flagBall = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 12), M.chrome);
  flagBall.position.y = 2.64;
  flagBall.castShadow = true;
  flagG.add(flagBall);
  const FW = 1.3,
    FH = 0.82,
    flagTex = ctex(260, 164, (c, w, h) => {
      c.fillStyle = "#4169e1";
      c.fillRect(0, 0, w, h);
      c.fillStyle = "#ffffff";
      c.fillRect(0, h * 0.82, w, h * 0.18);
      c.textAlign = "center";
      c.textBaseline = "middle";
      txt(c, "LAY C", w / 2, h * 0.43, 58, "#ffffff", 800);
    });
  const flagGeo = new THREE.PlaneGeometry(FW, FH, 18, 6),
    flagMat = new THREE.MeshStandardMaterial({ map: flagTex, side: THREE.DoubleSide, roughness: 0.8, metalness: 0 });
  const flagMesh = new THREE.Mesh(flagGeo, flagMat);
  flagMesh.position.set(FW / 2 + 0.04, 2.15, 0);
  flagMesh.castShadow = true;
  flagG.add(flagMesh);
  const flagBase = Float32Array.from(flagGeo.attributes.position.array);
  waveFlag = function (tm) {
    const a = flagGeo.attributes.position;
    for (let i = 0; i < a.count; i++) {
      const x = flagBase[i * 3],
        u = (x + FW / 2) / FW;
      a.setZ(i, Math.sin(u * 5 - tm * 3.2) * 0.09 * u + Math.sin(u * 9 - tm * 4.1) * 0.02 * u);
      a.setY(i, flagBase[i * 3 + 1] - Math.sin(u * 5 - tm * 3.2) * 0.015 * u);
    }
    a.needsUpdate = true;
  };
  waveFlag(0);
  // envelope for customer reviews, on the last empty corner of the base (back-left)
  const envG = new THREE.Group();
  envG.position.set(-6.2, 0.235, -3.6);
  envG.scale.setScalar(1);
  envG.rotation.y = -0.55;
  machine.add(envG);
  const envB = new THREE.Group();
  envB.position.set(0, 0.05, 0);
  envB.rotation.x = -Math.PI / 2 + 0.03;
  envB.rotation.z = 0.12;
  envG.add(envB);
  box(envB, 1.3, 0.88, 0.07, 0, 0, 0, M.ivory);
  box(envB, 1.34, 0.04, 0.09, 0, 0.44, 0, M.edge);
  box(envB, 1.34, 0.04, 0.09, 0, -0.44, 0, M.edge);
  box(envB, 0.04, 0.88, 0.09, -0.65, 0, 0, M.edge);
  box(envB, 0.04, 0.88, 0.09, 0.65, 0, 0, M.edge);
  {
    const sh = new THREE.Shape();
    sh.moveTo(-0.62, 0.42);
    sh.lineTo(0.62, 0.42);
    sh.lineTo(0, -0.08);
    sh.lineTo(-0.62, 0.42);
    const fg = new THREE.ExtrudeGeometry(sh, { depth: 0.025, bevelEnabled: false }),
      fl = new THREE.Mesh(fg, M.orange);
    fl.position.z = 0.036;
    fl.castShadow = true;
    envB.add(fl);
  }
  const sealM = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.04, 24), M.light);
  sealM.rotation.x = Math.PI / 2;
  sealM.position.set(0, -0.08, 0.075);
  envB.add(sealM);
  scr(
    envB,
    0.9,
    0.2,
    0,
    -0.3,
    0.039,
    ctex(540, 120, (c, w, h) => {
      c.fillStyle = "#f4f7ff";
      c.fillRect(0, 0, w, h);
      c.textAlign = "center";
      c.textBaseline = "middle";
      txt(c, "REVIEWS", w / 2, h / 2, 64, "#0f2a8a", 800);
    }),
  );
  envG.traverse((o) => {
    if (o.isMesh) o.castShadow = o.receiveShadow = true;
  });
  // selfie key on the front-right corner of the platform
  const CAMX = 6.0,
    CAMZ = 3.6,
    CAMY = 0.235;
  const camProp = new THREE.Group();
  camProp.position.set(CAMX, CAMY, CAMZ);
  machine.add(camProp);
  let camDown = false;
  let camHot = false;
  let camBtnEl = null;
  let albBtnEl = null;
  let openCamera = null;
  const camRing = M.light.clone();
  camRing.emissiveIntensity = 0.6;
  box(camProp, 0.98, 0.03, 0.72, 0, -0.005, 0, M.dark);
  box(camProp, 0.9, 0.01, 0.64, 0, 0.012, 0, camRing);
  for (const z of [-0.34, 0.34]) box(camProp, 0.98, 0.04, 0.04, 0, 0.02, z, M.dark);
  for (const x of [-0.47, 0.47]) box(camProp, 0.04, 0.04, 0.64, x, 0.02, 0, M.dark);
  const camKey = new THREE.Group();
  camKey.position.y = 0.036;
  camProp.add(camKey);
  const kcSide = m(0x4169e1, 0.05, 0.5),
    kcTop = m(0x4169e1, 0.05, 0.4);
  const kcGeo = new THREE.CylinderGeometry(0.84 / Math.SQRT2, 0.84 / Math.SQRT2, 0.07, 4, 1);
  kcGeo.rotateY(Math.PI / 4);
  const kcSkirt = new THREE.Mesh(kcGeo, kcSide);
  kcSkirt.scale.z = 0.58 / 0.84;
  kcSkirt.position.y = 0.035;
  kcSkirt.castShadow = kcSkirt.receiveShadow = true;
  camKey.add(kcSkirt);
  box(camKey, 0.84, 0.012, 0.58, 0, 0.076, 0, kcTop);
  const camDraw = (c, dx, dy, lw, col) => {
    c.save();
    c.translate(dx, dy);
    c.strokeStyle = col;
    c.fillStyle = col;
    c.lineWidth = lw;
    c.lineJoin = "round";
    c.beginPath();
    if (c.roundRect) c.roundRect(28, 40, 164, 86, 14);
    else c.rect(28, 40, 164, 86);
    c.stroke();
    c.beginPath();
    c.rect(70, 22, 40, 22);
    c.stroke();
    c.beginPath();
    c.arc(110, 84, 34, 0, Math.PI * 2);
    c.stroke();
    c.beginPath();
    c.arc(110, 84, 15, 0, Math.PI * 2);
    c.fill();
    c.restore();
  };
  const camIconTex = ctex(220, 150, (c, w, h) => {
    const kg = c.createLinearGradient(0, 0, 0, h);
    kg.addColorStop(0, "#5b82ee");
    kg.addColorStop(1, "#3d62d8");
    c.fillStyle = kg;
    c.fillRect(0, 0, w, h);
    camDraw(c, 3, 3, 10, "#8fa9f5");
    camDraw(c, -1.5, -1.5, 9, "#14307f");
    camDraw(c, 0.8, 0.8, 7, "#2a4cc0");
  });
  const camBump = ctex(220, 150, (c, w, h) => {
    c.fillStyle = "#ffffff";
    c.fillRect(0, 0, w, h);
    try {
      c.filter = "blur(1.4px)";
    } catch (e) {}
    camDraw(c, 0, 0, 9, "#000000");
  });
  const camIcon = new THREE.Mesh(
    new THREE.PlaneGeometry(0.72, 0.49),
    new THREE.MeshStandardMaterial({
      map: camIconTex,
      bumpMap: camBump,
      bumpScale: 6,
      roughness: 0.4,
      metalness: 0.05,
    }),
  );
  camIcon.rotation.x = -Math.PI / 2;
  camIcon.position.set(0, 0.0825, 0);
  camKey.add(camIcon);
  camProp.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = o.receiveShadow = true;
      o.userData.cam3d = true;
    }
  });
  camIcon.castShadow = false;
  camIcon.visible = false;
  camProp.userData.cam3d = true;
  scr(
    machine,
    0.95,
    0.34,
    5.9,
    -0.09,
    4.452,
    ctex(840, 300, (c, w, h) => {
      c.fillStyle = "#10267a";
      c.fillRect(0, 0, w, h);
      c.fillStyle = "#ffffff";
      c.font = "700 100px system-ui,sans-serif";
      c.textAlign = "center";
      c.textBaseline = "middle";
      const tw = c.measureText("TAKE A SELFIE").width,
        fs = Math.floor(100 * Math.min(1, (w * 0.9) / tw));
      c.font = "700 " + fs + "px system-ui,sans-serif";
      c.fillText("TAKE A SELFIE", w / 2, h / 2 + fs * 0.04);
    }),
  );
  scr(
    machine,
    6.5,
    0.3,
    0,
    -0.09,
    4.452,
    ctex(1300, 60, (c, w, h) => {
      c.fillStyle = "#10267a";
      c.fillRect(0, 0, w, h);
      txt(c, "BEANIE No. 001", 24, 40, 30, "#d9d8cd", 650);
      txt(c, "ORDER  ›  KNIT  ›  DYE  ›  POM-POM  ›  PAID", 420, 40, 26, "#9db4ff", 500);
    }),
  );
  // belt (ellipse, flow counter-clockwise from the left)
  const RX = 3.5,
    RZ = 1.9,
    BY = 0.8,
    A0 = (150 * Math.PI) / 180,
    STEP = (60 * Math.PI) / 180;
  const ell = (rx, rz, y, n = 72) => {
    const p = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      p.push(new THREE.Vector3(rx * Math.cos(a), y, rz * Math.sin(a)));
    }
    return new THREE.CatmullRomCurve3(p, true);
  };
  const belt = new THREE.Group();
  machine.add(belt);
  const fm = new THREE.Mesh(new THREE.TubeGeometry(ell(RX, RZ, 0), 120, 0.35, 8, true), M.dark);
  fm.scale.y = 0.3;
  fm.position.y = 0.5;
  belt.add(fm);
  for (const k of [-0.36, 0.36]) {
    const o = new THREE.Mesh(
      new THREE.TubeGeometry(ell(RX + k, RZ + k, BY + 0.09), 140, 0.028, 6, true),
      M.chrome,
    );
    belt.add(o);
  }
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * TAU;
    cyl(belt, 0.045, 0.55, RX * Math.cos(a), 0.52, RZ * Math.sin(a), M.chrome);
  }
  const NS = 120,
    slats = new THREE.InstancedMesh(new THREE.BoxGeometry(0.13, 0.06, 0.62), M.body, NS);
  slats.receiveShadow = true;
  belt.add(slats);
  const dm = new THREE.Object3D();
  function updBelt(t) {
    for (let i = 0; i < NS; i++) {
      const a = ((i / NS + t * 0.012) % 1) * TAU;
      dm.position.set(RX * Math.cos(a), BY, RZ * Math.sin(a));
      dm.rotation.set(0, -Math.atan2(RZ * Math.cos(a), -RX * Math.sin(a)), 0);
      dm.updateMatrix();
      slats.setMatrixAt(i, dm.matrix);
    }
    slats.instanceMatrix.needsUpdate = true;
  }
  updBelt(0);
  // beanie
  const knit = ctex(128, 64, (c, w, h) => {
    c.fillStyle = "#fff";
    c.fillRect(0, 0, w, h);
    c.fillStyle = "#cfcfcf";
    for (let i = 0; i < 16; i++) c.fillRect(i * 8 + 4, 0, 3, h);
  });
  knit.wrapS = knit.wrapT = THREE.RepeatWrapping;
  const logoCanvas = document.createElement("canvas");
  logoCanvas.width = 256;
  logoCanvas.height = 256;
  const logoMap = new THREE.CanvasTexture(logoCanvas);
  logoMap.encoding = THREE.sRGBEncoding;
  logoMap.anisotropy = 4;
  const logoOpts = {
    map: logoMap,
    transparent: true,
    polygonOffset: true,
    polygonOffsetFactor: -4,
    polygonOffsetUnits: -4,
    depthWrite: false,
  };
  const logoMat = new THREE.MeshStandardMaterial({ ...logoOpts, roughness: 0.62, metalness: 0 });
  const logoGeo = new THREE.SphereGeometry(0.362, 32, 24, Math.PI / 2 - 0.5, 1.0, 0.4, 0.86);
  {
    const img = new Image();
    img.onload = () => {
      const w = 256,
        h = 256,
        tmp = document.createElement("canvas");
      tmp.width = w;
      tmp.height = h;
      const tctx = tmp.getContext("2d");
      const mark = 188;
      tctx.drawImage(img, (w - mark) / 2, (h - mark) / 2, mark, mark);
      const px = tctx.getImageData(0, 0, w, h);
      const d = px.data;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i] + d[i + 1] + d[i + 2] < 42) d[i + 3] = 0;
      }
      tctx.putImageData(px, 0, 0);
      const c = logoCanvas.getContext("2d");
      c.clearRect(0, 0, w, h);
      c.drawImage(tmp, 2, 3);
      c.globalCompositeOperation = "source-atop";
      c.fillStyle = "rgba(8, 24, 90, 0.55)";
      c.fillRect(0, 0, w, h);
      c.globalCompositeOperation = "source-over";
      c.drawImage(tmp, 0, 0);
      c.strokeStyle = "#10267a";
      c.lineWidth = 2;
      c.setLineDash([2, 3]);
      c.beginPath();
      c.ellipse(128, 128, 86, 86, 0, 0, TAU);
      c.stroke();
      logoMap.needsUpdate = true;
    };
    img.src = "logo.png";
  }
  function makeBeanie() {
    const g = new THREE.Group(),
      mat = m(CREAM, 0, 0.95, { map: knit, side: THREE.DoubleSide }),
      pm = m(GRAY, 0, 0.95, { flatShading: true });
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(0.34, 28, 18, 0, TAU, 0, Math.PI / 2),
      mat,
    );
    dome.scale.y = 1.05;
    dome.position.y = -0.02;
    dome.castShadow = true;
    const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.34, 0.17, 28, 1, true), mat);
    cuff.position.y = -0.1;
    cuff.castShadow = true;
    const pom = new THREE.Mesh(new THREE.IcosahedronGeometry(0.14, 2), pm);
    pom.position.y = 0.37;
    pom.castShadow = true;
    const logo = new THREE.Mesh(logoGeo, logoMat);
    logo.scale.y = 1.05;
    logo.position.y = -0.02;
    logo.castShadow = false;
    logo.receiveShadow = false;
    g.add(dome, cuff, pom, logo);
    return { g, mat, pm, pom, logo, parts: [dome, cuff] };
  }
  // stations
  const defs = [
    {
      name: "Orders",
      out: "order",
      desc: "Customers place orders for gray beanies. Every order starts the machine.",
    },
    {
      name: "Knitter",
      out: "knit",
      desc: "Yarn spools feed a circular knitting head that turns thread into a ribbed beanie shell.",
    },
    {
      name: "Dye vat",
      out: "colour",
      desc: "The shell takes a dip and comes out in the signature gray.",
    },
    {
      name: "Embroidery Machine",
      label: "EMBROIDERY",
      out: "finish",
      desc: "The needle head stitches the LAY C logo into the front of the knitted beanie.",
    },
    {
      name: "Marketing",
      label: "POM-POM",
      out: "market",
      open: "marketing",
      desc: "A pom-pom is wound and sewn on here. Tap to book ads or creator content.",
    },
    {
      name: "Checkout",
      out: "payment",
      desc: "Payment received, tag attached, receipt printed. The machine runs.",
    },
  ];
  const ST = [],
    anim = {};
  defs.forEach((d, i) => {
    const a = A0 + i * STEP,
      px = (RX + 2.15) * Math.cos(a),
      pz = (RZ + 1.45) * Math.sin(a),
      g = new THREE.Group();
    g.position.set(px, 0.24, pz);
    g.rotation.y = Math.atan2(-px, -pz);
    machine.add(g);
    const gm = M.light.clone();
    gm.emissiveIntensity = 0.5;
    box(g, 2.05, 0.22, 1.78, 0, 0.11, 0, M.dark);
    box(g, 1.97, 0.04, 1.7, 0, 0.24, 0, gm);
    scr(
      g,
      1.5,
      0.2,
      0,
      0.11,
      0.892,
      ctex(512, 70, (c, w, h) => {
        c.fillStyle = "#0f2a80";
        c.fillRect(0, 0, w, h);
        txt(c, "0" + (i + 1), 22, 50, 38, "#4169e1", 600);
        txt(c, (d.label || d.name).toUpperCase(), 100, 48, 34, "#d7d9d7", 600);
      }),
    );
    ST.push({ ...d, g, gm, i, base: new THREE.Vector3(px, 0.24, pz) });
  });
  const [sO, sK, sD, sP, sM, sC] = ST.map((s) => s.g);
  // Orders: cabinet
  box(sO, 1.7, 1.5, 0.9, 0, 1.01, -0.25, M.body);
  box(sO, 1.5, 0.12, 1, 0, 1.82, -0.25, M.orange);
  box(sO, 1.3, 0.07, 0.3, 0, 0.6, 0.35, M.chrome);
  scr(
    sO,
    1.3,
    1.18,
    0,
    1.1,
    0.205,
    ctex(480, 460, (c, w, h) => {
      c.fillStyle = "#10267a";
      c.fillRect(0, 0, w, h);
      txt(c, "BEANIE ORDERS", 26, 50, 27, "#e8e8d8");
      txt(c, "Today · 3 new", 26, 80, 16, "#b8c7ff", 500);
      [
        ["Mariam Sa3b", "1 gray beanie"],
        ["Michael", "2 gray beanies"],
        ["Maria", "1 gray beanie"],
      ].forEach((n, i) => {
        const y = 105 + i * 105;
        c.fillStyle = "#1c3a9c";
        c.fillRect(22, y, 436, 88);
        c.fillStyle = ["#4169e1", "#ffffff", "#9db4ff"][i];
        c.beginPath();
        c.arc(62, y + 44, 20, 0, TAU);
        c.fill();
        txt(c, n[0][0], 53, y + 52, 20, "#1b2828");
        txt(c, n[0], 98, y + 38, 24, "#e6e8dc");
        txt(c, n[1], 98, y + 66, 16, "#b8c7ff", 500);
      });
    }),
  );
  const inc = new THREE.Group();
  sO.add(inc);
  box(inc, 0.86, 0.42, 0.04, 0, 0, 0, M.light);
  scr(
    inc,
    0.82,
    0.38,
    0,
    0,
    0.022,
    ctex(432, 204, (c, w, h) => {
      c.fillStyle = "#4169e1";
      c.fillRect(0, 0, w, h);
      c.fillStyle = "#ffffff";
      c.beginPath();
      c.arc(58, 100, 32, 0, TAU);
      c.fill();
      txt(c, "M", 44, 114, 34, "#4169e1");
      txt(c, "Mariam Sa3b", 108, 92, 34, "#ffffff");
      txt(c, "1 gray beanie", 108, 140, 24, "#e6edff", 500);
    }),
  );
  // Nudge Designing (Orders) a little right in the overview camera frame
  sO.position.x += 0.7;
  sO.position.z -= 0.3;
  ST[0].base.set(sO.position.x, sO.position.y, sO.position.z);
  // Knitter
  box(sK, 1.7, 0.62, 1.25, 0, 0.58, 0, M.ivory);
  box(sK, 1.5, 0.08, 1.1, 0, 0.92, 0, M.body);
  for (const x of [-0.72, 0.72]) cyl(sK, 0.06, 1.9, x, 1.85, -0.25, M.chrome);
  box(sK, 1.84, 0.26, 0.45, 0, 2.78, -0.25, M.orange);
  const head = new THREE.Group();
  head.position.set(0, 1.9, 0.05);
  sK.add(head);
  cyl(head, 0.34, 0.2, 0, 0, 0, M.chrome);
  cyl(head, 0.22, 0.26, 0, -0.02, 0, M.dark);
  const needles = [];
  for (let j = 0; j < 14; j++) {
    const a = (j / 14) * TAU,
      n = box(head, 0.04, 0.22, 0.04, Math.cos(a) * 0.3, 0.16, Math.sin(a) * 0.3, M.chrome);
    needles.push(n);
  }
  const tube = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.3, 1, 24, 1, true),
    m(CREAM, 0, 0.95, { map: knit, side: THREE.DoubleSide }),
  );
  tube.position.set(0, 1.4, 0.05);
  sK.add(tube);
  const spools = [];
  [
    [-0.95, 2.35, CREAM],
    [0.95, 2.3, GRAY],
  ].forEach(([x, y, col]) => {
    const sp = new THREE.Group();
    sp.position.set(x, y, 0.15);
    sK.add(sp);
    const core = cyl(sp, 0.28, 0.4, 0, 0, 0, m(col, 0, 0.95));
    core.rotation.x = Math.PI / 2;
    for (const z of [-0.22, 0.22]) {
      const f = cyl(sp, 0.4, 0.05, 0, 0, z, M.chrome);
      f.rotation.x = Math.PI / 2;
    }
    spools.push(sp);
  });
  for (const [x, c] of [
    [-0.95, CREAM],
    [0.95, GRAY],
  ]) {
    const th = new THREE.Mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(x, 2.05, 0.15),
          new THREE.Vector3(x * 0.5, 2.45, 0.25),
          new THREE.Vector3(x * 0.15, 2.0, 0.12),
        ]),
        20,
        0.02,
        6,
      ),
      m(c, 0, 0.9),
    );
    sK.add(th);
  }
  // Dye vat
  cyl(sD, 0.84, 0.75, 0, 0.64, 0, M.body);
  const rimM = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.06, 10, 36), M.chrome);
  rimM.rotation.x = Math.PI / 2;
  rimM.position.y = 1.02;
  sD.add(rimM);
  const liq = cyl(sD, 0.74, 0.02, 0, 1.0, 0, M.liquid);
  cyl(sD, 0.07, 1.9, 0.88, 1.2, -0.5, M.chrome);
  const arm = box(sD, 1.5, 0.1, 0.14, 0.2, 2.2, -0.5, M.orange);
  const bub = [];
  for (let j = 0; j < 6; j++) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.05 + (j % 3) * 0.015, 10, 8), M.liquid);
    b.position.y = 1;
    sD.add(b);
    bub.push(b);
  }
  const hang = new THREE.Group();
  hang.position.set(0, 1.9, -0.2);
  sD.add(hang);
  cyl(hang, 0.025, 0.7, 0, 0.35, 0, M.chrome);
  box(hang, 0.55, 0.04, 0.04, 0, 0.7, -0.15, M.chrome);
  const mini = makeBeanie();
  mini.g.scale.setScalar(1.1);
  mini.g.position.y = -0.2;
  mini.pom.visible = false;
  mini.logo.visible = false;
  mini.parts.forEach((p) => (p.castShadow = false));
  hang.add(mini.g);
  // Embroidery machine: needle head, thread rack, hoop and a beanie under the needle
  box(sP, 1.7, 0.55, 1.3, 0, 0.54, 0, M.body);
  box(sP, 1.8, 0.06, 1.4, 0, 0.85, 0, M.ivory);
  box(sP, 0.9, 0.08, 0.7, 0, 0.96, 0.12, M.dark);
  const hoopE = new THREE.Group();
  hoopE.position.set(0, 1.08, 0.12);
  sP.add(hoopE);
  const hr = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.055, 12, 40), M.orange);
  hr.rotation.x = Math.PI / 2;
  hoopE.add(hr);
  const hr2 = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.028, 10, 36), M.chrome);
  hr2.rotation.x = Math.PI / 2;
  hr2.position.y = 0.03;
  hoopE.add(hr2);
  for (const x of [-0.5, 0.5]) {
    cyl(hoopE, 0.035, 0.22, x, -0.08, 0, M.chrome);
    box(hoopE, 0.08, 0.04, 0.16, x, -0.18, 0, M.body);
  }
  const hoopBeanie = makeBeanie();
  hoopBeanie.g.scale.setScalar(0.78);
  hoopBeanie.g.rotation.x = -Math.PI / 2;
  hoopBeanie.g.position.y = 0.08;
  hoopBeanie.pom.visible = false;
  hoopBeanie.logo.visible = false;
  const lcTex = ctex(256, 128, (c, w, h) => {
    const pad = 6,
      r = 10;
    c.clearRect(0, 0, w, h);
    c.beginPath();
    c.moveTo(pad + r, pad);
    c.arcTo(w - pad, pad, w - pad, h - pad, r);
    c.arcTo(w - pad, h - pad, pad, h - pad, r);
    c.arcTo(pad, h - pad, pad, pad, r);
    c.arcTo(pad, pad, w - pad, pad, r);
    c.closePath();
    c.fillStyle = "#1239b0";
    c.fill();
    c.lineWidth = 7;
    c.strokeStyle = "#f2c14d";
    c.stroke();
    c.fillStyle = "#ffffff";
    c.font = "800 " + Math.round(h * 0.56) + "px system-ui,sans-serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("LC", w / 2, h / 2 + 2);
  });
  const embMark = new THREE.Mesh(
    new THREE.PlaneGeometry(0.22, 0.11),
    new THREE.MeshBasicMaterial({
      map: lcTex,
      transparent: true,
      toneMapped: false,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    }),
  );
  embMark.position.set(0, 0.02, 0.33);
  hoopBeanie.g.add(embMark);
  hoopE.add(hoopBeanie.g);
  const embRoof = cyl(sP, 0.2, 0.045, 0, 1.02, 0.22, M.paper);
  embRoof.scale.x = 1.5;
  const embRoofMark = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.19), embMark.material);
  embRoofMark.rotation.x = -Math.PI / 2;
  embRoofMark.position.set(0, 1.05, 0.22);
  sP.add(embRoofMark);
  box(sP, 0.18, 1.35, 0.18, 0, 1.62, -0.58, M.body);
  box(sP, 0.16, 0.12, 0.95, 0, 2.28, -0.12, M.chrome);
  const eNeedle = new THREE.Group();
  eNeedle.position.set(0, 1.72, 0.12);
  sP.add(eNeedle);
  box(eNeedle, 0.28, 0.16, 0.22, 0, 0.42, 0, M.body);
  box(eNeedle, 0.16, 0.08, 0.16, 0, 0.3, 0.02, M.orange);
  cyl(eNeedle, 0.02, 0.55, 0, 0.05, 0, M.chrome);
  box(eNeedle, 0.1, 0.025, 0.1, 0, -0.2, 0, M.chrome);
  const embSpools = [];
  [
    [-0.62, "#1d3fbf"],
    [-0.28, "#f4f1ea"],
    [0.28, "#ffd24a"],
    [0.62, "#9db4ff"],
  ].forEach(([x, col]) => {
    const sp = new THREE.Group();
    sp.position.set(x, 1.55, -0.48);
    sP.add(sp);
    const core = cyl(sp, 0.11, 0.22, 0, 0, 0, m(col, 0, 0.9));
    core.rotation.z = Math.PI / 2;
    for (const z of [-0.12, 0.12]) {
      const f = cyl(sp, 0.16, 0.025, z, 0, 0, M.chrome);
      f.rotation.z = Math.PI / 2;
    }
    embSpools.push(sp);
    const th = new THREE.Mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(x, 1.55, -0.32),
          new THREE.Vector3(x * 0.35, 2.05, -0.2),
          new THREE.Vector3(0, 2.05, 0.02),
        ]),
        16,
        0.012,
        5,
      ),
      m(col, 0, 0.85),
    );
    sP.add(th);
  });
  // Media buying booth: pom-pom winder, the shape under pin 05 in the reference
  box(sM, 1.7, 0.55, 1.3, 0, 0.54, 0, M.body);
  box(sM, 1.8, 0.06, 1.4, 0, 0.85, 0, M.ivory);
  cyl(sM, 0.07, 0.85, -0.42, 1.28, -0.15, M.body);
  cyl(sM, 0.16, 0.06, -0.42, 0.92, -0.15, M.orange);
  const spinPom = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.36, 2),
    m(CREAM, 0, 0.95, { flatShading: true }),
  );
  spinPom.position.set(-0.42, 1.72, -0.05);
  spinPom.castShadow = true;
  sM.add(spinPom);
  const cutter = new THREE.Group();
  cutter.position.set(0.42, 1.15, 0.12);
  sM.add(cutter);
  cyl(cutter, 0.38, 0.05, 0, 0, 0, M.orange);
  cyl(cutter, 0.16, 0.08, 0, 0.02, 0, M.ivory);
  cyl(cutter, 0.05, 0.55, 0, 0.28, 0, M.chrome);
  [
    [0.62, 0.98, -0.38],
    [0.28, 0.98, -0.48],
    [0.55, 0.98, 0.05],
  ].forEach((p, i) => {
    const o = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.13, 1),
      m(i === 1 ? CREAM : OR, 0.05, 0.85, { flatShading: true }),
    );
    o.position.set(...p);
    o.castShadow = true;
    sM.add(o);
  });
  // Checkout
  box(sC, 1.9, 0.62, 1.3, 0, 0.58, -0.05, M.ivory);
  box(sC, 1.02, 0.25, 0.9, -0.33, 1.05, -0.03, M.body);
  box(sC, 0.64, 0.6, 0.52, 0.58, 1.04, -0.15, M.body);
  cyl(sC, 0.06, 0.65, -0.35, 1.6, -0.56, M.chrome);
  box(sC, 1.13, 0.46, 0.19, -0.35, 1.98, -0.56, M.body);
  scr(
    sC,
    1.015,
    0.349,
    -0.35,
    1.98,
    -0.459,
    ctex(512, 176, (c, w, h) => {
      c.fillStyle = "#10267a";
      c.fillRect(0, 0, w, h);
      txt(c, "PAYMENT RECEIVED", 22, 44, 23, "#cfdcff", 500);
      txt(c, "+ 400 L.E", 26, 131, 60, "#ffffff", 500);
    }),
  );
  const rcp = new THREE.Group();
  rcp.position.set(0.59, 1.37, -0.1);
  rcp.rotation.x = -0.16;
  sC.add(rcp);
  const rs = scr(
    rcp,
    0.41,
    0.83,
    0,
    0.415,
    0.01,
    ctex(280, 540, (c, w, h) => {
      c.fillStyle = "#f4f1ea";
      c.fillRect(0, 0, w, h);
      txt(c, "BEANIE CO.", 25, 52, 24, "#333d36", 650);
      txt(c, "SALES RECEIPT", 32, 87, 19, "#566059");
      txt(c, "Gray beanie", 25, 154, 22, "#333d36");
      txt(c, "1 × 400 L.E", 25, 190, 21, "#333d36");
      txt(c, "PAID", 25, 263, 31, "#333d36", 650);
      txt(c, "Thank you!", 25, 317, 24, "#687067");
    }),
  );
  rs.material.side = THREE.DoubleSide;
  const coin = new THREE.Group();
  sC.add(coin);
  const cd = cyl(coin, 0.22, 0.065, 0, 0, 0, M.orange);
  cd.rotation.x = Math.PI / 2;
  scr(
    coin,
    0.28,
    0.28,
    0,
    0,
    0.04,
    ctex(128, 128, (c, w, h) => {
      c.textAlign = "center";
      txt(c, "L.E", 64, 80, 52, "#ffffff", 650);
    }),
  ).material.transparent = true;
  ST.forEach((s) => s.g.traverse((o) => (o.userData.st = s.i)));
  // packets (orders travelling the belt)
  const slipTex = ctex(256, 352, (c, w, h) => {
    c.fillStyle = "#4169e1";
    c.fillRect(0, 0, w, h);
    txt(c, "NEW", 21, 52, 26, "#ffffff", 700);
    txt(c, "ORDER", 21, 84, 26, "#ffffff", 700);
    c.strokeStyle = "#cfdcff";
    c.lineWidth = 2;
    c.strokeRect(23, 112, 210, 139);
    txt(c, "Mariam", 42, 180, 34, "#ffffff");
    txt(c, "Sa3b", 42, 220, 34, "#ffffff");
    txt(c, "BEANIE / 01", 23, 320, 17, "#e6edff");
  });
  const tagTex = ctex(160, 100, (c, w, h) => {
    c.fillStyle = "#e6edff";
    c.fillRect(0, 0, w, h);
    txt(c, "PAID ✓", 18, 62, 34, "#1d3fbf", 700);
  });
  const P = [];
  for (let i = 0; i < 6; i++) {
    const g = new THREE.Group(),
      b = makeBeanie(),
      slip = new THREE.Group();
    box(slip, 0.5, 0.72, 0.04, 0, 0, 0, M.paper);
    scr(slip, 0.46, 0.68, 0, 0, 0.025, slipTex);
    const tag = scr(g, 0.34, 0.21, 0.3, -0.05, 0.08, tagTex);
    tag.material.side = THREE.DoubleSide;
    const mark = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.14), embMark.material);
    mark.position.set(0, 0.02, 0.34);
    mark.visible = false;
    b.logo.visible = false;
    b.g.add(mark);
    const halo = new THREE.Mesh(
      new THREE.RingGeometry(0.4, 0.414, 40),
      new THREE.MeshBasicMaterial({
        color: OR,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    halo.rotation.x = -Math.PI / 2;
    halo.position.y = -0.2;
    g.add(slip, b.g, halo);
    machine.add(g);
    P.push({ g, b, slip, tag, halo, mark, s: -1, ph: 0, d: 0 });
  }
  // state
  let mode = "assembled",
    camMode = "overview",
    playing = true,
    t = 0,
    ft = 0,
    spread = 0,
    sel = 0,
    hov = -1,
    dragging = false,
    camAnim = true,
    sized = false,
    mobile = false,
    baseD = 24,
    lastInt = performance.now(),
    jPrev = -1;
  const dPos = new THREE.Vector3(),
    dTgt = new THREE.Vector3(0, 0.9, 0),
    VD = new THREE.Vector3(10.5, 10.8, 17).normalize();
  const J = [
    ["New order", "Orders · Mariam Sa3b wants a gray beanie"],
    ["Knitting the shell", "Knitter · thread becomes a ribbed cap"],
    ["Dyeing it gray", "Dye vat · one dip, full colour"],
    ["Stitching the logo", "Embroidery Machine · the LAY C mark is sewn into the front"],
    ["Sewing on the pom-pom", "Pom-Pom Station · fluffy finishing"],
    ["Checked and paid", "Checkout · inspected, tagged and paid"],
  ];
  function goal() {
    const ex = mode === "stations" ? 1.2 : 1;
    if (camMode === "station") {
      dTgt.copy(ST[sel].g.position).add(new THREE.Vector3(0, 1.2, 0));
      dPos.copy(dTgt).addScaledVector(VD, mobile ? 9 : 11);
    } else {
      dTgt.set(0, 0.9, 0);
      const d = baseD * ex;
      if (camMode === "side") dPos.set(13, 5, 20).normalize().multiplyScalar(d).add(dTgt);
      else if (camMode === "top") dPos.set(0.01, d, 0.8).add(dTgt);
      else dPos.copy(VD).multiplyScalar(d).add(dTgt);
    }
  }
  function layout() {
    const w = W(),
      h = H();
    if (!w || !h) return;
    // Continuous space factor (0 cramped → 1 roomy) instead of a hard width cutoff.
    const room = Math.max(0, Math.min(1, (Math.min(w, h * 1.35) - 360) / 540));
    mobile = room < 0.55;
    R.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5 + 0.25 * room));
    R.setSize(w, h, false);
    const canvas = R.domElement;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    cam.aspect = w / h;
    // Keep a little top bias on tall phones so the machine sits under the header.
    const yOff = Math.min(h * (0.035 + 0.015 * room), 18 + 14 * room);
    cam.setViewOffset(w, h, 0, yOff, w, h);
    cam.updateProjectionMatrix();
    const th = 2 * Math.tan((cam.fov * Math.PI) / 360);
    const aspectPad = 0.84 + 0.08 * room;
    const heightPad = 0.62 + 0.08 * room;
    baseD = Math.max(13.5 / (th * cam.aspect * aspectPad), 10.5 / (th * heightPad));
    baseD = Math.max(baseD, 13.5 + 2.5 * (1 - room));
    ctrl.maxDistance = Math.max(55, baseD * 1.6);
    ctrl.minDistance = 7 + 1.5 * (1 - room);
    goal();
    if (!sized) {
      sized = true;
      cam.position.copy(dPos);
      ctrl.target.copy(dTgt);
      ctrl.update();
    } else camAnim = true;
  }
  function sync() {
    document
      .querySelectorAll("[data-mode]")
      .forEach((b) => b.setAttribute("aria-pressed", b.dataset.mode === mode));
    document
      .querySelectorAll("[data-cam]")
      .forEach((b) => b.setAttribute("aria-pressed", b.dataset.cam === camMode));
    $("#journey").classList.toggle("v", mode === "order");
  }
  function setMode(n) {
    if (!["assembled", "stations", "order"].includes(n)) return false;
    mode = n;
    lastInt = performance.now();
    if (n === "order") {
      t = 0;
      play();
      camMode = "overview";
    } else if (camMode === "station") camMode = "overview";
    goal();
    camAnim = true;
    sync();
    return true;
  }
  function setCam(n) {
    if (!["overview", "side", "top", "station", "flight"].includes(n)) return false;
    camMode = n;
    if (mode === "order") mode = "assembled";
    ft = 0;
    lastInt = performance.now();
    goal();
    camAnim = true;
    sync();
    return true;
  }
  function focus(i) {
    if (!ST[i]) return false;
    sel = i;
    return setCam("station");
  }
  function play() {
    playing = true;
    sp();
  }
  function pause() {
    playing = false;
    sp();
  }
  function sp() {
    const b = $("#play");
    b.textContent = playing ? "❚❚" : "▶";
    b.setAttribute("aria-label", playing ? "Pause the animation" : "Resume the animation");
    $("#status").classList.toggle("p", !playing);
    $("#st").textContent = playing ? "Machine running" : "Machine stopped";
    return true;
  }
  window.__machine = {
    setMode,
    setCamera: setCam,
    focusStation: (id) =>
      focus(ST.findIndex((s) => s.name.toLowerCase() === String(id).toLowerCase())),
    play,
    pause,
  };
  document
    .querySelectorAll("[data-mode]")
    .forEach((b) => (b.onclick = () => setMode(b.dataset.mode)));
  document.querySelectorAll("[data-cam]").forEach((b) => (b.onclick = () => setCam(b.dataset.cam)));
  $("#play").onclick = () => (playing ? pause() : play());
  addEventListener("resize", layout);
  if (window.visualViewport) {
    visualViewport.addEventListener("resize", layout);
    visualViewport.addEventListener("scroll", layout);
  }
  new ResizeObserver(layout).observe(app);
  layout();
  ctrl.addEventListener("start", () => {
    dragging = true;
    camAnim = false;
    lastInt = performance.now();
  });
  ctrl.addEventListener("end", () => {
    dragging = false;
    lastInt = performance.now();
  });
  // pointer
  const rc = new THREE.Raycaster(),
    pt = new THREE.Vector2(),
    tip = $("#tip");
  let dx = 0,
    dy = 0,
    moved = false;
  function hit(e) {
    const r = R.domElement.getBoundingClientRect();
    pt.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    rc.setFromCamera(pt, cam);
    if (rc.intersectObject(walk, true).length) return -2;
    if (camProp && rc.intersectObject(camProp, true).length) return -3;
    if (phG && rc.intersectObject(phG, true).length) return -4;
    if (flagG && rc.intersectObject(flagG, true).length) return -5;
    if (envG && rc.intersectObject(envG, true).length) return -6;
    const h = rc.intersectObjects(
      ST.map((s) => s.g),
      true,
    );
    if (!h.length) return -1;
    let o = h[0].object;
    while (o && (o.userData == null || o.userData.st == null)) o = o.parent;
    return o && o.userData ? o.userData.st : -1;
  }
  R.domElement.addEventListener("pointerdown", (e) => {
    dx = e.clientX;
    dy = e.clientY;
    moved = false;
    tip.classList.remove("v");
  });
  R.domElement.addEventListener("pointermove", (e) => {
    if (Math.hypot(e.clientX - dx, e.clientY - dy) > 5) moved = true;
    if (dragging) return;
    const i = hit(e);
    hov = i;
    R.domElement.style.cursor =
      i >= 0 || i === -2 || i === -3 || i === -4 || i === -5 || i === -6 ? "pointer" : "grab";
    tip.classList.toggle("v", i >= 0 || i === -3 || i === -4 || i === -5 || i === -6);
    if (i >= 0 || i === -3 || i === -4 || i === -5 || i === -6) {
      tip.querySelector("b").innerHTML =
        i === -3
          ? "<span>•</span>Selfie"
          : i === -4
            ? "<span>•</span>Telephone"
            : i === -5
              ? "<span>•</span>Your order"
              : i === -6
                ? "<span>•</span>Reviews"
                : "<span>0" + (i + 1) + "</span>" + ST[i].name;
      tip.querySelector("p").textContent =
        i === -3
          ? "Take a photo. It stays in your private binder."
          : i === -4
            ? "Join a private room with the access code for your signed-in account."
            : i === -5
              ? "See your order and its stage."
              : i === -6
                ? "Read and leave a customer review."
                : ST[i].desc;
      const r = app.getBoundingClientRect();
      tip.style.left = Math.min(r.width - 250, Math.max(10, e.clientX - r.left + 16)) + "px";
      tip.style.top = Math.max(10, Math.min(r.height - 95, e.clientY - r.top - 60)) + "px";
    }
  });
  R.domElement.addEventListener("pointerleave", () => {
    hov = -1;
    tip.classList.remove("v");
  });
  R.domElement.addEventListener("pointerup", (e) => {
    if (moved) return;
    const i = hit(e);
    if (i >= 0) {
      focus(i);
      if (SV[i]) go(i);
    } else if (i === -2) gOpen(-1);
    else if (i === -3 && openCamera) openCamera();
    else if (i === -4 && openMeet) openMeet();
    else if (i === -5 && openOrders) openOrders();
    else if (i === -6 && openReviews) openReviews();
  });
  R.domElement.addEventListener("pointerdown", (e) => {
    if (hit(e) === -3) camDown = true;
  });
  addEventListener("pointerup", () => {
    camDown = false;
  });
  addEventListener("pointercancel", () => {
    camDown = false;
  });
  // services
  const money = (n) => {
    n = Math.round(n * 100) / 100;
    return (Number.isInteger(n) ? n.toLocaleString("en-US") : n.toFixed(2)) + " L.E";
  };
  // EDIT PRICES HERE. q.m = choose several, q.x = quantity multiplier, q.h = hour stepper (min, max, rate), s.u = unit the base prices are per.
  const SV = [
    {
      n: "Designing",
      slug: "designing",
      mb: 1,
      s: "Logos, brand identity and apparel graphics.",
      q: [
        {
          t: "What do you need designed?",
          o: [
            ["Logo and identity", 8000],
            ["Apparel graphics", 2000],
            ["Packaging", 1000],
            ["Full brand kit", "?*"],
          ],
        },
        {
          t: "How many designs do you need?",
          x: 1,
          o: [
            ["1", 1],
            ["2", 2],
            ["3", 3],
            ["5", 5],
            ["10", 10],
          ],
        },
        {
          t: "What else should we deliver?",
          m: 1,
          np: 1,
          o: [
            ["PDF file", 0],
            ["PNG of the design", 0],
            ["Editable source files", 0],
            ["Brand guidelines PDF", 0],
            ["Product mockups", 0],
          ],
        },
        {
          t: "How fast do you need it?",
          o: [
            ["Standard (7 days)", 0],
            ["Rush (3 days)", 1000],
          ],
        },
      ],
    },
    {
      n: "Clothing manufacturing",
      slug: "manufacturing",
      s: "Made-to-order garments. Prices are confirmed after we review your order.",
      q: [
        {
          t: "What are we making?",
          o: [
            ["T-shirt", "?*"],
            ["Polo", "?*"],
            ["Long sleeve polo", "?*"],
            ["Long sleeve", "?*"],
            ["Sweatshirt", "?*"],
            ["Sweatpants", "?*"],
            ["Hoodie", "?*"],
            ["Quarter zip", "?*"],
            ["Zip-up jacket", "?*"],
            ["Jacket", "?*", 1],
            ["Jersey", "?*"],
            ["Hat", "?*"],
            ["Beanie", "?*"],
            ["Something weird", "?*", 1],
          ],
        },
        {
          t: "Which fabric?",
          o: [
            ["Parasola", "?*"],
            ["Bolivar", "?*"],
            ["Interlock", "?*"],
            ["Polo", "?*"],
            ["Melton", "?*"],
            ["Summer melton", "?*"],
            ["French terry", "?*"],
            ["Jersey", "?*"],
            ["Waterproof", "?*"],
            ["Gokh", "?*"],
            ["Gabardine", "?*"],
            ["Knitted", "?*"],
            ["Synthetic leather", "?*"],
          ],
        },
        {
          t: "How should it be decorated?",
          o: [
            ["None", 0],
            ["Screen print", "?*"],
            ["Embroidery", "?*"],
            ["Print and embroidery", "?*"],
            ["DTF print", "?*"],
            ["Rubber print", "?*"],
            ["Puff print", "?*"],
          ],
        },
        {
          t: "How should it be packed? (all options come individually bagged)",
          o: [
            ["Bulk boxes", 135, 0, 1, "box"],
            ["Individually bagged", "?*"],
            ["Branded hang tags", "?*"],
          ],
        },
        {
          t: "How many pieces?",
          x: 1,
          o: [
            ["50", 50],
            ["100", 100],
            ["250", 250],
            ["500", 500],
            ["1000", 1000],
          ],
        },
      ],
    },
    {
      n: "Seniors uniform",
      slug: "seniors",
      u: "student",
      free: "Free hat",
      disc: (n) => (n > 100 ? 0.1 : n >= 50 ? 0.05 : 0),
      s: "Graduating-class uniforms and merch. Prices are per student. Class discounts: 5% for 50 to 100 students, 10% for over 100.",
      q: [
        {
          t: "What does each student get? (every student also gets a free hat)",
          m: 1,
          req: 1,
          o: [
            ["T-shirt", 600],
            ["Polo", 600],
            ["Jersey", [800, 1500]],
            ["Hoodie", 850],
            ["Sweatshirt", 800],
            ["Sweatpants", 800],
            ["Cargo pants", 900],
            ["Knitted polo", 1100],
            ["Beanie", 400],
            ["Jacket", [900, 2500]],
          ],
        },
        {
          t: "Which personal touches?",
          m: 1,
          o: [
            ["Name printed", 50],
            ["Name embroidered", 220],
            ["Metal piece", 120],
          ],
        },
        {
          t: "When do you need it?",
          o: [
            ["Standard delivery (3 weeks)", 0],
            ["Rush delivery", 5, 0, 0, 0, "%"],
          ],
        },
        {
          t: "How many students?",
          x: 1,
          o: [
            ["25", 25],
            ["50", 50],
            ["75", 75],
            ["100", 100],
            ["150", 150],
            ["200", 200],
          ],
        },
      ],
    },
    {
      n: "Marketing",
      slug: "marketing",
      pick: [10, 11],
      s: "Choose what you would like to book.",
      q: [],
    },
    {
      n: "Web developing",
      slug: "web",
      s: "Websites, stores and web apps built by our agents and developers.",
      q: [
        {
          t: "What kind of site?",
          o: [
            ["Landing page", 8000],
            ["Business website", 20000],
            ["Online store", [60000, 100000]],
            ["Web app", [80000, 200000]],
          ],
        },
        {
          t: "Which back end do you need?",
          o: [
            ["Shopify", 2500],
            ["Custom back end", [30000, 90000]],
          ],
        },
        {
          t: "How big is it?",
          o: [
            ["Up to 5 pages", 0],
            ["6 to 15 pages", [15000, 30000]],
            ["16 pages or more", [35000, 70000]],
          ],
        },
        {
          t: "How should it look?",
          o: [
            ["Polished template", 0],
            ["Fully custom design", [10000, 40000]],
          ],
        },
        {
          t: "Which extras?",
          m: 1,
          o: [
            ["Booking system", [8000, 20000]],
            ["Blog", [3000, 8000]],
            ["Online payments", [6000, 18000]],
            ["SEO setup", [5000, 15000]],
            ["Admin dashboard", [12000, 35000]],
          ],
        },
        {
          t: "How fast do you need it?",
          o: [
            ["Standard (4 to 6 weeks)", 0],
            ["Rush (2 weeks)", 25, 0, 0, 0, "%"],
          ],
        },
      ],
    },
    {
      n: "Photo shoots",
      slug: "photo",
      pick: [6, 7],
      s: "Choose what you would like to book.",
      q: [],
    },
    {
      n: "Book a shoot",
      slug: "photo-shoot",
      par: 2,
      s: "Product, portrait, event and brand photography with our photographer.",
      q: [
        {
          t: "What kind of shoot?",
          o: [
            ["Portrait", "?*"],
            ["Product", "?*"],
            ["Event", "?*"],
            ["Brand and lifestyle", "?*"],
          ],
        },
        {
          t: "How long?",
          o: [
            ["1 hour", "?*"],
            ["2 hours", "?*"],
            ["Half day", "?*"],
            ["Full day", "?*"],
          ],
        },
        {
          t: "How many edited photos?",
          o: [
            ["10 photos", "?*"],
            ["25 photos", "?*"],
            ["50 photos", "?*"],
          ],
        },
        {
          t: "Which extras?",
          m: 1,
          o: [
            ["Model", "?*"],
            ["Styling", "?*"],
            ["Rush editing", "?*"],
          ],
        },
        {
          t: "Where?",
          o: [
            ["In our studio", "?*"],
            ["On site, local", "?*"],
            ["On site, travel", "?*"],
          ],
        },
      ],
    },
    {
      n: "Book a studio",
      slug: "photo-studio",
      par: 2,
      cal: 1,
      s: "Hire the studio at 350 L.E per hour, 2 hours minimum. Open 8 AM to 4 AM. Choose Area 1 or Area 2, then pick a date and an exact start time.",
      q: [
        { t: "How many hours do you need the studio?", h: 1, min: 2, max: 20, rate: 350 },
        {
          t: "Which area?",
          np: 1,
          o: [
            ["Area 1", 0],
            ["Area 2", 0],
          ],
        },
        {
          t: "Which extras?",
          m: 1,
          o: [
            ["Lighting kit", "?*"],
            ["Backdrop", "?*"],
            ["Studio assistant", "?*"],
          ],
        },
      ],
    },
  ];
  SV.push(Object.assign({}, SV[2], { slug: "seniors-uniform", par: 5 }), {
    n: "Rooms",
    slug: "seniors-rooms",
    par: 5,
    s: "Enter the 6 digit password you got at checkout on the Seniors uniform page to open your class order sheet.",
    q: [],
  });
  SV.push(
    {
      n: "Media buying",
      slug: "media-buying",
      par: 4,
      s: "Paid ads planned, bought and tuned by our team. You set the budget and the schedule.",
      q: [
        { t: "What are your sales?", sp: "si" },
        { t: "What sales do you expect?", sp: "sw" },
        { t: "Set your daily ad budget for each platform", bt: 1 },
        { t: "How many days per month should the ads run?", sp: "d" },
        { t: "For how many months?", sp: "m" },
        {
          t: "What is your goal?",
          o: [
            ["Brand awareness", 0],
            ["Website traffic", 0],
            ["Leads and messages", 0],
            ["Online sales", 0],
            ["App installs", 0],
          ],
        },
        {
          t: "How much should we handle?",
          o: [
            ["Campaign setup only", "?*"],
            ["Setup and monthly management", "?*"],
            ["Full service with creatives", "?*"],
          ],
        },
        {
          t: "Anything extra?",
          m: 1,
          np: 1,
          o: [
            ["Creative and video production", 0],
            ["Audience research", 0],
            ["Monthly report", 0],
            ["Landing page", 0],
            ["Pixel and tracking setup", 0],
          ],
        },
        { t: "Would you like a personal account manager?", sp: "am" },
      ],
    },
    {
      n: "UGC",
      slug: "ugc",
      par: 4,
      s: "Real-looking creator videos and photos for your brand. Prices are confirmed after we review your brief.",
      q: [
        { t: "How many creators do you need?", ug: 1 },
        {
          t: "What content do you need?",
          o: [
            ["UGC video ad", "?*"],
            ["Product review video", "?*"],
            ["Unboxing video", "?*"],
            ["Testimonial video", "?*"],
            ["Photos only", "?*"],
          ],
        },
        {
          t: "How long is each video?",
          o: [
            ["Up to 15 seconds", "?*"],
            ["Up to 30 seconds", "?*"],
            ["Up to 60 seconds", "?*"],
          ],
        },
        {
          t: "Where will you use it?",
          o: [
            ["Organic posts only", "?*"],
            ["Paid ads included", "?*"],
          ],
        },
        {
          t: "Which extras?",
          m: 1,
          o: [
            ["Raw footage", "?*"],
            ["Subtitles", "?*"],
            ["Hook variations", "?*"],
            ["We ship the product to the creator", "?*"],
          ],
        },
        {
          t: "How fast do you need it?",
          o: [
            ["Standard (10 days)", 0],
            ["Rush (5 days)", "?*"],
          ],
        },
      ],
    },
  );
  SV[2].pick = [8, 9];
  SV[2].s = "Choose what you would like to open.";
  // Station order: 01 Designing, 02 Clothing, 03 Photo shoots, 04 Web, 05 Marketing, 06 Seniors
  {
    const o = [0, 1, 5, 4, 3, 2, 6, 7, 8, 9].map((i) => SV[i]);
    SV.splice(0, o.length, ...o);
  }

  const pg = $("#page"),
    pins = $("#pins");
  let cur = -1,
    ans = [],
    oth = [],
    det = {},
    txtOut = "",
    quotePack = { title: "", rows: [], total: "", extra: "" },
    hrs = 2;
  const MBP = [
    "Facebook",
    "Instagram",
    "TikTok",
    "YouTube",
    "Google Ads",
    "Snapchat",
    "LinkedIn",
    "X (Twitter)",
    "ChatGPT Ads",
  ];
  let mbv = {
    b: MBP.map(() => 0),
    d: 10,
    m: 1,
    si: 100,
    sw: 200,
    am: false,
    ugS: 1,
    ugB: 0,
    ugA: 0,
  };
  const UG = {
    S: { n: "Class S", min: 1 },
    B: { n: "Class B", base: 12000, min: 4, ex: 2000 },
    A: { n: "Class A", base: 24000, min: 4, ex: 6000 },
  };
  const ugPrice = (c, n) => (n <= 0 || c === "S" ? 0 : UG[c].base + Math.max(0, n - UG[c].min) * UG[c].ex);
  const mbBtn = (k, d, l) =>
    '<button type="button" class="mbb" data-k="' +
    k +
    '" data-step="' +
    d +
    '" aria-label="' +
    l +
    '">' +
    (d < 0 ? "&minus;" : "+") +
    "</button>";
  function mbHTML(q, j) {
    if (q.ug)
      return (
        "<fieldset><legend>" +
        (j + 1) +
        ". " +
        q.t +
        "</legend>" +
        ["S", "A", "B"]
          .map(
            (c) =>
              '<div class="stp" style="margin-bottom:10px"><div class="stn" style="flex:1 1 140px"><b style="font-size:14px;color:var(--fg)">' +
              UG[c].n +
              "</b><br>" +
              (c === "S"
                ? "Price confirmed after we review your brief<br>" +
                  (UG[c].min > 1 ? UG[c].min + " creators" : "1 creator") +
                  " minimum"
                : money(UG[c].base) +
                  " for " +
                  UG[c].min +
                  " creators<br>+" +
                  money(UG[c].ex) +
                  " for each additional creator") +
              "</div>" +
              mbBtn("ug" + c, -1, "Fewer " + UG[c].n + " creators") +
              '<output id="mb-ug' +
              c +
              '"></output>' +
              mbBtn("ug" + c, 1, "More " + UG[c].n + " creators") +
              "</div>",
          )
          .join("") +
        "</fieldset>"
      );
    if (q.bt)
      return (
        "<fieldset><legend>" +
        (j + 1) +
        ". " +
        q.t +
        '</legend><table class="mbt"><tr><th>Platform</th><th style="text-align:right">Per day</th></tr>' +
        MBP.map(
          (n, i) =>
            "<tr><td>" +
            n +
            '</td><td><div class="mbc">' +
            mbBtn(i, -1, "Less for " + n) +
            '<output id="mb-b' +
            i +
            '"></output>' +
            mbBtn(i, 1, "More for " + n) +
            "</div></td></tr>",
        ).join("") +
        '<tr><td><b>Total per day</b></td><td style="text-align:right"><b id="mb-t"></b></td></tr><tr><td><b>Total ad spend</b><br><small>per day x days x months</small></td><td style="text-align:right"><b id="mb-s"></b></td></tr><tr id="mb-fr"><td><b>Agency fee</b><br><small>fixed fee, to be confirmed</small></td><td style="text-align:right"><b>?*</b></td></tr><tr><td><b>Agency percentage</b><br><small>of total sales, to be confirmed</small></td><td style="text-align:right"><b>?*</b></td></tr></table></fieldset>'
      );
    if (q.sp === "am")
      return (
        "<fieldset><legend>" +
        (j + 1) +
        ". " +
        q.t +
        ' <small>(optional)</small></legend><div class="mbr"><button type="button" class="mbb" data-k="am" data-step="0" id="mb-am" style="width:auto;padding:0 14px"></button><span><b>Personal account manager</b><br><small>' +
        money(10000) +
        " per month</small></span></div></fieldset>"
      );
    return (
      "<fieldset><legend>" +
      (j + 1) +
      ". " +
      q.t +
      '</legend><div class="mbr">' +
      mbBtn(q.sp, -1, "Fewer") +
      '<output id="mb-' +
      q.sp +
      '"></output>' +
      mbBtn(q.sp, 1, "More") +
      "</div></fieldset>"
    );
  }
  function mbUpd() {
    const o = (id, t) => {
        const e = document.getElementById(id);
        if (e) e.textContent = t;
      },
      ugT = (n) => (n <= 0 ? "Not added" : n + (n > 1 ? " creators" : " creator"));
    o("mb-ugS", ugT(mbv.ugS));
    o("mb-ugB", ugT(mbv.ugB));
    o("mb-ugA", ugT(mbv.ugA));
    const T = mbv.b.reduce((a, b) => a + b, 0);
    MBP.forEach((n, i) => o("mb-b" + i, money(mbv.b[i])));
    o("mb-si", mbv.si + " items");
    o("mb-sw", mbv.sw + " items");
    o("mb-d", mbv.d + (mbv.d > 1 ? " days" : " day"));
    o("mb-m", mbv.m + (mbv.m > 1 ? " months" : " month"));
    o("mb-t", money(T));
    o("mb-s", money(T * mbv.d * mbv.m));
    const ab = document.getElementById("mb-am");
    if (ab) {
      ab.textContent = mbv.am ? "Added \u2713" : "Add";
      ab.setAttribute("aria-pressed", String(mbv.am));
      ab.style.background = mbv.am ? "var(--amber)" : "";
      ab.style.color = mbv.am ? "#fff" : "";
    }
    const fr = document.getElementById("mb-fr");
    if (fr) fr.style.display = mbv.si < 100 ? "" : "none";
  }
  const mbNext = (v, st) => {
    const f = (x) => (x < 100 ? 10 : x < 1000 ? 50 : x < 10000 ? 100 : 1000);
    return st > 0 ? Math.min(1000000, v + f(v)) : Math.max(0, v - f(v - 1));
  };
  const esc = (x) =>
    String(x).replace(
      /[&<>"]/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
    );
  const pinB = SV.slice(0, 6).map((s, i) => {
    const b = document.createElement("button");
    b.className = "pin";
    b.innerHTML = "<i>0" + (i + 1) + "</i><span class=\"pn\">" + s.n + "</span>";
    b.setAttribute("aria-label", "0" + (i + 1) + " " + s.n);
    b.onclick = () => go(i);
    pins.appendChild(b);
    return b;
  });
  const pv = new THREE.Vector3();
  function pinUpdate() {
    const aw = W(),
      ah = H();
    if (!aw || !ah || !pinB.length) return;
    const room = Math.max(0, Math.min(1, (Math.min(aw, ah * 1.35) - 360) / 540));
    const padX = 36 + 34 * room;
    const padTop = 56 + 24 * room;
    const padBot = Math.max(140 + 50 * room, ah * (0.22 + 0.06 * (1 - room)));
    const placed = [];
    const sepX = 42 + 12 * room;
    const sepY = 24 + 4 * room;
    pinB.forEach((b, i) => {
      const st = ST[Math.min(i, ST.length - 1)];
      if (!st) return;
      pv.copy(st.g.position);
      pv.y += 3.6 + 0.6 * room;
      pv.project(cam);
      let x = (pv.x * 0.5 + 0.5) * aw,
        y = (-pv.y * 0.5 + 0.5) * ah;
      x = Math.max(padX, Math.min(aw - padX, x));
      y = Math.max(padTop, Math.min(ah - padBot, y));
      // Nudge overlapping pins when space is tight so labels stay tappable.
      if (room < 0.75) {
        for (let n = 0; n < 8; n++) {
          let hit = false;
          for (let j = 0; j < placed.length; j++) {
            const p = placed[j];
            if (Math.abs(x - p.x) < sepX && Math.abs(y - p.y) < sepY) {
              y = p.y + (y >= p.y ? sepY : -sepY);
              y = Math.max(padTop, Math.min(ah - padBot, y));
              hit = true;
              break;
            }
          }
          if (!hit) break;
        }
      }
      placed.push({ x, y });
      b.style.transform = "translate(" + x + "px," + y + "px) translate(-50%,-100%)";
    });
    if (camBtnEl) {
      pv.copy(camProp.position);
      pv.project(cam);
      let bx = (pv.x * 0.5 + 0.5) * aw,
        by = (-pv.y * 0.5 + 0.5) * ah;
      const edge = 18 + 8 * room;
      bx = Math.max(edge, Math.min(aw - edge, bx));
      by = Math.max(edge, Math.min(ah - edge, by));
      const gap = 44 + 10 * room;
      camBtnEl.style.transform = "translate(" + bx + "px," + (by - 18) + "px) translate(-50%,-50%)";
      if (albBtnEl) albBtnEl.style.transform = "translate(" + (bx + gap) + "px," + (by - 18) + "px) translate(-50%,-50%)";
    }
  }
  // STUDIO CALENDAR. Demo availability only: Fridays are closed and other days are booked by a repeatable pattern.
  // To use real bookings, replace dayBooked() and hourBooked() with a lookup of your own data.
  let kal = {};
  const OPEN = 8,
    CLOSE = 28,
    CLOSED_DAYS = [5],
    HRS = [1, 2, 4, 10];
  const isoD = (d) =>
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0");
  const parseD = (x) => {
    const p = x.split("-");
    return new Date(+p[0], +p[1] - 1, +p[2]);
  };
  const hsh = (x) => {
    let h = 2166136261;
    for (let i = 0; i < x.length; i++) {
      h ^= x.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0) % 100;
  };
  const dayBooked = (k) => hsh(k + "/day") < 18;
  const hourBooked = (k, h) => {
    if (hsh(k + "/blk") >= 45) return false;
    const s0 = OPEN + (hsh(k + "/s") % 8),
      len = 1 + (hsh(k + "/l") % 3);
    return h >= s0 && h < s0 + len;
  };
  const fmtT = (h) => {
    const x = h % 24;
    return (x % 12 || 12) + ":00 " + (x < 12 ? "AM" : "PM");
  };
  const fmtD = (x, long) =>
    parseD(x).toLocaleDateString(
      "en-GB",
      long
        ? { weekday: "long", day: "numeric", month: "long" }
        : { weekday: "short", day: "numeric", month: "short", year: "numeric" },
    );
  function durH() {
    return hrs;
  }
  function slotOk(d, h, n) {
    const k = isoD(d),
      now = new Date();
    for (let x = h; x < h + n; x++) {
      if (x + 1 > CLOSE || hourBooked(k, x) || (k === isoD(now) && x <= now.getHours()))
        return false;
    }
    return true;
  }
  function dayOk(d) {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    if (d < t || CLOSED_DAYS.includes(d.getDay()) || dayBooked(isoD(d))) return false;
    const n = durH();
    for (let h = OPEN; h + n <= CLOSE; h++) if (slotOk(d, h, n)) return true;
    return false;
  }
  function drawCal() {
    const el = $("#cal");
    if (!el) return;
    const n = durH();
    if (kal.day) {
      const d = parseD(kal.day);
      if (!dayOk(d)) {
        kal.day = null;
        kal.time = null;
      } else if (kal.time != null && !slotOk(d, kal.time, n)) kal.time = null;
    }
    const sg = isoD(kal.m) + "|" + kal.day + "|" + kal.time + "|" + n;
    if (kal.sig === sg) return;
    kal.sig = sg;
    const y = kal.m.getFullYear(),
      mo = kal.m.getMonth(),
      lead = (new Date(y, mo, 1).getDay() + 6) % 7,
      dim = new Date(y, mo + 1, 0).getDate(),
      now = new Date(),
      tk = isoD(now);
    const first = new Date(now.getFullYear(), now.getMonth(), 1).getTime(),
      last = new Date(now.getFullYear(), now.getMonth() + 11, 1).getTime();
    let g =
      ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        .map((x) => '<span class="dw">' + x + "</span>")
        .join("") + '<span class="e"></span>'.repeat(lead);
    for (let dd = 1; dd <= dim; dd++) {
      const d = new Date(y, mo, dd),
        k = isoD(d),
        ok = dayOk(d);
      g +=
        '<button type="button" data-d="' +
        k +
        '" class="' +
        (ok ? "a" : "u") +
        (k === kal.day ? " sel" : "") +
        (k === tk ? " tdy" : "") +
        '"' +
        (ok ? "" : " disabled") +
        ' aria-label="' +
        fmtD(k, 1) +
        ", " +
        (ok ? "available" : "unavailable") +
        '" aria-pressed="' +
        (k === kal.day) +
        '">' +
        dd +
        "</button>";
    }
    let sl = "";
    if (!kal.day) sl = '<p class="m">Pick a date first, then choose your start time.</p>';
    else {
      const d = parseD(kal.day);
      sl =
        '<p class="m" style="margin:0 0 10px">' +
        fmtD(kal.day, 1) +
        " &middot; " +
        n +
        (n > 1 ? " hours" : " hour") +
        '</p><div class="sl">';
      for (let h = OPEN; h + n <= CLOSE; h++) {
        const ok = slotOk(d, h, n);
        sl +=
          '<button type="button" data-h="' +
          h +
          '" class="' +
          (kal.time === h ? "sel" : "") +
          '"' +
          (ok ? "" : " disabled") +
          ' aria-pressed="' +
          (kal.time === h) +
          '">' +
          fmtT(h) +
          (n > 1 ? " to " + fmtT(h + n) : "") +
          "<small>" +
          (ok ? (h >= 24 ? "Available, after midnight" : "Available") : "Booked") +
          "</small></button>";
      }
      sl += "</div>";
    }
    const q = SV[cur].q.length;
    el.innerHTML =
      "<fieldset><legend>" +
      (q + 1) +
      '. Pick a date <small>(browse the months)</small></legend><div class="cal"><div class="cn"><button type="button" data-nav="-1" aria-label="Previous month"' +
      (kal.m.getTime() <= first ? " disabled" : "") +
      ">&larr;</button><b>" +
      kal.m.toLocaleDateString("en-GB", { month: "long", year: "numeric" }) +
      '</b><button type="button" data-nav="1" aria-label="Next month"' +
      (kal.m.getTime() >= last ? " disabled" : "") +
      '>&rarr;</button></div><div class="cg">' +
      g +
      '</div><div class="lg"><span><i class="la"></i>Available</span><span><i class="lu"></i>Unavailable</span><span><i class="ls"></i>Selected</span></div></div></fieldset><fieldset><legend>' +
      (q + 2) +
      ". Pick the exact time <small>(studio open " +
      fmtT(OPEN) +
      " to " +
      fmtT(CLOSE) +
      " next day)</small></legend>" +
      sl +
      "</fieldset>";
  }
  function calc() {
    const s = SV[cur];
    if (s.cal) drawCal();
    let sum = 0,
      mul = 1,
      rows = [],
      done = true,
      cust = false,
      b = 0,
      fl = 0,
      pct = 0,
      pl = "",
      pt = "",
      hi = 0;
    s.q.forEach((q, j) => {
      const a = ans[j];
      if (q.ug) {
        let any = 0;
        ["S", "A", "B"].forEach((c) => {
          const n = mbv["ug" + c];
          if (n > 0) {
            any = 1;
            const p = ugPrice(c, n),
              ex = n - UG[c].min;
            sum += p;
            if (c === "S") cust = true;
            rows.push([
              "Creators",
              UG[c].n +
                ": " +
                n +
                (n > 1 ? " creators" : " creator") +
                (ex > 0 ? " (" + UG[c].min + " + " + ex + " additional)" : ""),
              c === "S" ? "?*" : money(p),
            ]);
          }
        });
        if (!any) done = false;
        return;
      }
      if (q.bt) {
        let ds = 0;
        MBP.forEach((nm, i) => {
          const v = mbv.b[i];
          if (v > 0) {
            ds += v;
            sum += v * mbv.d * mbv.m;
            rows.push(["Ad budget", nm + " (" + money(v) + " per day)", money(v * mbv.d * mbv.m)]);
          }
        });
        if (!ds) done = false;
        else {
          cust = true;
          if (mbv.si < 100) rows.push(["Fixed fee to be confirmed", "Agency fee", "?*"]);
          rows.push(["% of total sales to be confirmed", "Agency percentage", "?*"]);
        }
        return;
      }
      if (q.sp) {
        if (q.sp === "si") rows.push(["Sales", mbv.si + " items sold now", "Included"]);
        else if (q.sp === "sw") rows.push(["Expected sales", mbv.sw + " items expected", "Included"]);
        else if (q.sp === "m")
          rows.push([
            "Schedule",
            mbv.d + " days per month for " + mbv.m + (mbv.m > 1 ? " months" : " month"),
            "Included",
          ]);
        else if (q.sp === "am" && mbv.am) {
          const am = 10000 * mbv.m;
          sum += am;
          rows.push([
            money(10000) + " per month for " + mbv.m + (mbv.m > 1 ? " months" : " month"),
            "Personal account manager",
            "+" + money(am),
          ]);
        }
        return;
      }
      if (q.h) {
        sum += hrs * q.rate;
        rows.push([
          q.t.replace(/\?$/, ""),
          hrs + (hrs > 1 ? " hours" : " hour"),
          money(hrs * q.rate),
        ]);
        return;
      }
      if (!a.length && (!q.m || q.req)) done = false;
      a.forEach((k) => {
        const t = q.t.replace(/\?$/, "");
        if (k === q.o.length) {
          const w = (oth[j] || "").trim();
          if (!w) done = false;
          if (q.x) {
            const n = parseFloat(w);
            if (n > 0) mul = n;
            else done = false;
            rows.push([t, "Other: " + (w || "..."), n > 0 ? "x " + n : "Enter a number"]);
          } else {
            cust = true;
            rows.push([t, "Other: " + (w || "..."), "Priced later"]);
          }
          return;
        }
        const o = q.o[k];
        let lab = o[0],
          nn = 1;
        if (o[2]) {
          const dd = det[j + "-" + k] || {};
          if (!dd.text && !dd.img) done = false;
          lab += (dd.text ? ": " + dd.text : "") + (dd.img ? " (image: " + dd.img + ")" : "");
        }
        if (o[4]) {
          const dd = det[j + "-" + k] || {};
          nn = dd.n || 0;
          if (!nn) done = false;
          lab += " (x" + nn + ")";
        }
        if (Array.isArray(o[1])) {
          sum += o[1][0];
          if (j === 0) b = o[1][0];
          hi += o[1][1] - o[1][0];
          rows.push([t, lab, (j ? "+" : "") + money(o[1][0]) + " to " + money(o[1][1])]);
          return;
        }
        if (o[5]) {
          pct += o[1];
          pl = lab;
          pt = t;
          return;
        }
        if (typeof o[1] === "string") {
          cust = true;
          rows.push([t, lab, o[1]]);
          return;
        }
        if (q.x) mul = o[1];
        else if (o[3]) fl += o[1] * nn;
        else {
          sum += o[1];
          if (j === 0) b = o[1];
        }
        rows.push([
          t,
          lab,
          q.x ? "x " + o[1] : o[1] ? (j ? "+" : "") + money(o[1] * nn) : "Included",
        ]);
      });
    });
    if (s.cal) {
      if (!kal.day || kal.time == null) done = false;
      else {
        rows.push(["Date", fmtD(kal.day), "Requested"]);
        rows.push(["Time", fmtT(kal.time) + " to " + fmtT(kal.time + durH()), "Requested"]);
      }
    }
    const t0 = (s.mb ? b * mul + (sum - b) : sum * mul) + fl,
      d = s.disc ? s.disc(mul) : 0,
      hs = hi;
    if (!s.mb) hi *= mul * (1 - d);
    if (d) rows.push(["Group discount", Math.round(d * 100) + "% off", "-" + money(t0 * d)]);
    let tot = t0 * (1 - d);
    if (pct) {
      const ru = (tot * pct) / 100,
        ru2 = ((tot + hi) * pct) / 100;
      rows.push([pt, pl, "+" + money(ru) + (hi ? " to " + money(ru2) : "")]);
      tot += ru;
      hi = hi * (1 + pct / 100);
    }
    if (s.free && rows.length) rows.push(["Included with every order", s.free, "Free"]);
    const tmax = tot + hi;
    quotePack = {
      title: s.n + " quote",
      rows: rows.map((r) => ({ q: r[0], item: r[1], val: r[2] })),
      total:
        "Total: " +
        money(tot) +
        (hi ? " to " + money(tmax) : "") +
        (cust ? " + ?*" : ""),
      extra: "",
    };
    txtOut =
      quotePack.title +
      "\n" +
      quotePack.rows.map((r) => "- " + r.item + " (" + r.q + "): " + r.val).join("\n") +
      "\n" +
      quotePack.total;
    $("#sum").innerHTML =
      "<h3>Your estimate</h3>" +
      (rows.length
        ? rows
            .map(
              (r) =>
                '<div class="r"><span>' +
                esc(r[1]) +
                "<small>" +
                esc(r[0]) +
                "</small></span><b>" +
                r[2] +
                "</b></div>",
            )
            .join("")
        : '<p class="m">Pick an option to start.</p>') +
      (s.u && mul > 1
        ? '<div class="r"><span>Per ' +
          s.u +
          "</span><b>" +
          money(sum) +
          (hs ? " to " + money(sum + hs) : "") +
          "</b></div>"
        : "") +
      '<div class="tot"><span>Total' +
      (done ? "" : " so far") +
      "</span><b>" +
      money(tot) +
      (hi ? " to " + money(tmax) : "") +
      (cust ? " + ?*" : "") +
      "</b></div>" +
      (cust
        ? '<p class="m">Includes items marked ?* or custom requests that will be priced after review.</p>'
        : "") +
      '<button id="req"' +
      (done ? "" : " disabled") +
      '>Get this quote</button><p class="m">Estimates only. The final price is confirmed after we review your brief.</p><div id="out"></div>';
  }
  const stepHTML = (q, j) =>
    "<fieldset><legend>" +
    (j + 1) +
    ". " +
    q.t +
    '</legend><div class="stp"><button type="button" class="sb" data-j="' +
    j +
    '" data-step="-1" aria-label="Fewer hours">&minus;</button><output id="hv"></output><button type="button" class="sb" data-j="' +
    j +
    '" data-step="1" aria-label="More hours">+</button><span class="stn">' +
    money(q.rate) +
    " per hour. Minimum " +
    q.min +
    " hours.</span></div></fieldset>";
  function stp() {
    const q = SV[cur].q.find((x) => x.h),
      v = pg.querySelector("#hv");
    if (!q || !v) return;
    v.innerHTML = "<b>" + hrs + "</b> " + (hrs > 1 ? "hours" : "hour");
    pg.querySelector('[data-step="-1"]').setAttribute("aria-disabled", hrs <= q.min);
    pg.querySelector('[data-step="1"]').setAttribute("aria-disabled", hrs >= q.max);
  }
  const ACC_KEY = "lcaccount";
  let pendingQuote = null;
  let accDismissed = true;
  function accGet() {
    try {
      return JSON.parse(localStorage.getItem(ACC_KEY) || "null");
    } catch (e) {
      return null;
    }
  }
  function accSet(a) {
    if (a) localStorage.setItem(ACC_KEY, JSON.stringify(a));
    else localStorage.removeItem(ACC_KEY);
    paintAcc();
  }
  let accMode = "login";
  function signedIn() {
    const a = accGet();
    return Boolean(a && a.token && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a.email || ""));
  }
  function accOk() {
    const a = accGet();
    return Boolean(
      signedIn() && String(a.name || "").trim() && String(a.phone || "").trim().length >= 6,
    );
  }
  function seniorsOpen() {
    return cur >= 0 && SV[cur] && String(SV[cur].slug).indexOf("seniors") === 0;
  }
  function paintAcc() {
    const a = accGet();
    const on = signedIn();
    const label = on ? a.email : "Sign in";
    const btn = $("#accbtn");
    if (btn) btn.textContent = label;
    const mail = $("#menuemail");
    if (mail) mail.textContent = on ? a.email : "Not signed in";
    ["mlogin", "msignup"].forEach((id) => {
      const el = $("#" + id);
      if (el) el.hidden = on;
    });
    const leave = $("#mlogout");
    if (leave) leave.hidden = !on;
    const bar = pg.querySelector("#accbar");
    if (bar) bar.textContent = label;
    const out = $("#accout");
    if (out) out.hidden = !on;
    syncAccPanel();
  }
  function syncAccPanel() {
    const box = $("#account");
    const btn = $("#accbtn");
    const close = $("#accx");
    if (seniorsOpen()) {
      if (box) box.hidden = true;
      if (btn) btn.hidden = true;
      return;
    }
    if (btn) btn.hidden = false;
    const tablet = pg && pg.style.display === "block";
    if (tablet || accDismissed) {
      if (box) box.hidden = true;
      fillAccForm();
      return;
    }
    if (box) box.hidden = false;
    if (close) close.hidden = !accOk();
    fillAccForm();
  }
  function fillAccForm() {
    const a = accGet() || {};
    const n = $("#accname"),
      e = $("#accemail"),
      p = $("#accphone");
    if (n) n.value = a.name || "";
    if (e) e.value = a.email || "";
    if (p) p.value = a.phone || "";
  }
  function setAccMode(mode) {
    accMode = mode === "login" ? "login" : mode === "account" ? "account" : "signup";
    const signedView = accMode === "account";
    const signup = $("#accsignup");
    const login = $("#acclogin");
    const tabs = document.querySelector("#accform .acc-mode");
    if (tabs) tabs.hidden = signedView;
    if (signup) signup.setAttribute("aria-pressed", accMode === "signup" ? "true" : "false");
    if (login) login.setAttribute("aria-pressed", accMode === "login" ? "true" : "false");
    const name = $("#accname");
    const phone = $("#accphone");
    const pass = $("#accpass");
    const nameL = name && name.closest("label");
    const phoneL = phone && phone.closest("label");
    const passL = pass && pass.closest("label");
    if (nameL) nameL.hidden = accMode === "login";
    if (phoneL) phoneL.hidden = accMode === "login";
    if (passL) passL.hidden = signedView;
    if (name) name.required = accMode === "signup";
    if (phone) phone.required = accMode === "signup";
    if (pass) {
      pass.required = !signedView;
      pass.autocomplete = accMode === "login" ? "current-password" : "new-password";
    }
    const note = $("#accnote");
    if (note) {
      note.textContent = signedView
        ? "This email is saved in this browser. Close the page and open it again, and you stay signed in. Log out if this is not your account."
        : accMode === "login"
          ? "Enter the email and password you created. Once it is saved, closing the page will not sign you out."
          : "Create a password the first time. Anything you do after this, including orders and photos, stays connected to this email.";
    }
    const title = document.querySelector("#accform .acc-h b");
    if (title) title.textContent = signedView ? "Your email" : accMode === "login" ? "Sign in" : "Sign up";
    const submit = accForm && accForm.querySelector('button[type="submit"]');
    if (submit) {
      submit.hidden = signedView;
      submit.textContent = accMode === "login" ? "Sign in" : "Sign up";
    }
  }
  function openAcc(then, mode) {
    pendingQuote = typeof then === "function" ? then : null;
    accDismissed = false;
    const next = mode === "signup" ? "signup" : signedIn() && mode !== "login" ? "account" : "login";
    setAccMode(next);
    fillAccForm();
    const err = $("#accerr");
    if (err) {
      err.hidden = true;
      err.textContent = "";
    }
    const box = $("#account");
    if (box) box.hidden = false;
    const close = $("#accx");
    if (close) close.hidden = false;
    const em = $("#accemail");
    if (em && next !== "account") {
      em.focus();
      if (typeof em.select === "function") em.select();
    }
  }
  function closeAcc() {
    pendingQuote = null;
    accDismissed = true;
    const box = $("#account");
    if (box) box.hidden = true;
  }
  function signOut() {
    pendingQuote = null;
    accDismissed = true;
    if ($("#accpass")) $("#accpass").value = "";
    accSet(null);
    const box = $("#account");
    if (box) box.hidden = true;
  }
  function barHTML() {
    return (
      '<div class="wrap"><div class="bar"><button class="back" id="back">&larr; Back to the machine</button><div class="bar-r">' +
      '<button class="ask" id="askg" type="button"><span class="av" aria-hidden="true"></span>Ask the guide</button></div></div>'
    );
  }
  function customerBlock(acc) {
    const a = acc || {};
    const name = String(a.name || "").trim();
    const email = String(a.email || "").trim();
    const phone = String(a.phone || "").trim();
    const lines = [];
    if (name) lines.push("Name: " + name);
    if (email) lines.push("Email: " + email);
    if (phone) lines.push("Phone: " + phone);
    return lines.join("\n");
  }
  function startQuote() {
    if (!(SV[cur] && SV[cur].slug === "seniors-uniform") && !accOk()) {
      openAcc(startQuote);
      return;
    }
    const req = pg.querySelector("#req");
    if (req) req.disabled = true;
    if (SV[cur] && SV[cur].slug === "seniors-uniform") {
      roomCheckout();
      return;
    }
    const out = pg.querySelector("#out") || $("#out");
    if (out) {
      out.innerHTML = '<pre></pre><button id="cp">Copy summary</button>';
      const pre = out.querySelector("pre");
      if (pre) pre.textContent = txtOut;
    }
    mailQuote();
  }
  function openStudioAsk() {
    pg.innerHTML =
      barHTML() +
      '<div id="studio-ask"><div class="bx"><h3>Where do you want the studio to open?</h3>' +
      "<p>Book a studio is coming soon. Tell us where you would like it, and we will use your answer to choose the next location.</p>" +
      '<input id="stl" maxlength="80" placeholder="City or area, for example Zayed, Tagamo3, Zamalek" aria-label="Location">' +
      '<div class="stc" role="group" aria-label="Suggestions">' +
      '<button type="button" data-v="Zayed" aria-pressed="false">Zayed</button>' +
      '<button type="button" data-v="Tagamo3" aria-pressed="false">Tagamo3</button>' +
      '<button type="button" data-v="Zamalek" aria-pressed="false">Zamalek</button>' +
      '<button type="button" data-v="Maadi" aria-pressed="false">Maadi</button>' +
      '<button type="button" data-v="Heliopolis" aria-pressed="false">Heliopolis</button>' +
      "</div>" +
      '<input id="stn" maxlength="40" placeholder="Your name (optional)" aria-label="Your name (optional)">' +
      '<input id="stp" maxlength="25" inputmode="tel" placeholder="Phone number (optional)" aria-label="Phone number (optional)">' +
      '<button class="sub" id="stsub" type="button">Send</button>' +
      '<p class="msg" id="stm" role="status"></p>' +
      '<button type="button" id="stx">Close</button></div></div></div>';
    pg.style.display = "block";
    pg.scrollTop = 0;
    const loc = $("#stl");
    if (loc) {
      loc.focus({ preventScroll: true });
      loc.addEventListener("input", () => {
        const v = loc.value.trim();
        pg.querySelectorAll("#studio-ask .stc button").forEach((b) =>
          b.setAttribute("aria-pressed", b.dataset.v === v ? "true" : "false"),
        );
      });
    }
  }
  function show(i) {
    endCall();
    cur = i;
    const s = SV[i];
    ans = s.q.map(() => []);
    mbv = {
      b: MBP.map(() => 0),
      d: 10,
      m: 1,
      si: 100,
      sw: 200,
      am: false,
      ugS: 1,
      ugB: 0,
      ugA: 0,
    };
    oth = [];
    det = {};
    hrs = (s.q.find((x) => x.h) || { min: 2 }).min;
    {
      const n0 = new Date();
      kal = { m: new Date(n0.getFullYear(), n0.getMonth(), 1), day: null, time: null, sig: "" };
    }
    if (s.pick) {
      pg.innerHTML =
        barHTML() +
        '<div class="hd"><span>0' +
        (i + 1) +
        " / 06</span><h1>" +
        s.n +
        "</h1><p>" +
        s.s +
        '</p></div><div class="wins">' +
        s.pick
          .map((k) => {
            const soon = s.slug === "photo" && SV[k].slug === "photo-studio";
            return (
              '<button class="win' +
              (soon ? " soon" : "") +
              '" data-i="' +
              k +
              '"><span class="wt">' +
              SV[k].n +
              '</span><span class="wd">' +
              SV[k].s +
              '</span><span class="wg">' +
              (soon ? "Coming soon" : "Open &rarr;") +
              "</span></button>"
            );
          })
          .join("") +
        "</div></div>";
      pg.style.display = "block";
      pg.scrollTop = 0;
      tip.classList.remove("v");
      (pg.querySelector(".win:not(.soon)") || pg.querySelector(".win")).focus({
        preventScroll: true,
      });
      syncAccPanel();
      return;
    }
    pg.innerHTML =
      barHTML() +
      '<div class="hd"><span>0' +
      ((s.par != null ? s.par : i) + 1) +
      " / 06</span><h1>" +
      s.n +
      "</h1><p>" +
      s.s +
      '</p></div><div class="cols"><div>' +
      s.q
        .map((q, j) =>
          q.h
            ? stepHTML(q, j)
            : q.bt || q.sp || q.ug
              ? mbHTML(q, j)
              : "<fieldset><legend>" +
                (j + 1) +
                ". " +
                q.t +
                (q.m ? " <small>(choose any)</small>" : "") +
                "</legend>" +
                q.o
                  .map(
                    (o, k) =>
                      '<label><input type="' +
                      (q.m ? "checkbox" : "radio") +
                      '" name="q' +
                      j +
                      '" value="' +
                      k +
                      '"><span>' +
                      o[0] +
                      "</span><b>" +
                      (Array.isArray(o[1])
                        ? (j ? "+" : "") + money(o[1][0]) + " to " + money(o[1][1])
                        : typeof o[1] === "string"
                          ? o[1]
                          : q.np
                            ? ""
                            : o[5]
                              ? "+" + o[1] + "% of total"
                              : q.x
                                ? "x " +
                                  o[1] +
                                  (s.disc && s.disc(o[1])
                                    ? " (" + Math.round(s.disc(o[1]) * 100) + "% off)"
                                    : "")
                                : o[1]
                                  ? (j ? "+" : "") +
                                    money(o[1]) +
                                    (o[4]
                                      ? " per " + o[4]
                                      : o[3]
                                        ? " (one-time)"
                                        : s.u && !q.x
                                          ? " /" + s.u.slice(0, 2)
                                          : "")
                                  : "Included") +
                      "</b></label>" +
                      (o[4]
                        ? '<div class="det" data-j="' +
                          j +
                          '" data-k="' +
                          k +
                          '" hidden><small>How many boxes?</small><input class="nb" data-key="' +
                          j +
                          "-" +
                          k +
                          '" type="number" min="1" placeholder="Number of boxes"></div>'
                        : "") +
                      (o[2]
                        ? '<div class="det" data-j="' +
                          j +
                          '" data-k="' +
                          k +
                          '" hidden><small>Tell us what you need, or upload an image</small><textarea class="dt" data-key="' +
                          j +
                          "-" +
                          k +
                          '" placeholder="Describe it: style, details, measurements"></textarea><input class="fi" data-key="' +
                          j +
                          "-" +
                          k +
                          '" type="file" accept="image/*"><img class="pv" hidden alt=""></div>'
                        : ""),
                  )
                  .join("") +
                '<label><input type="' +
                (q.m ? "checkbox" : "radio") +
                '" name="q' +
                j +
                '" value="' +
                q.o.length +
                '"><span>Other</span><b>' +
                (q.x ? "type a number" : "priced after review") +
                '</b></label><input class="ot" data-j="' +
                j +
                '" type="' +
                (q.x ? "number" : "text") +
                '"' +
                (q.x ? ' min="1"' : "") +
                ' placeholder="' +
                (q.x ? "How many?" : "Tell us what you want") +
                '" hidden></fieldset>',
        )
        .join("") +
      "" +
      (s.cal ? '<div id="cal"></div>' : "") +
      '</div><aside id="sum"></aside></div></div>';
    pg.style.display = "block";
    pg.scrollTop = 0;
    tip.classList.remove("v");
    stp();
    mbUpd();
    calc();
    const focusEl = pg.querySelector("input,.sb,.mbb");
    if (focusEl) focusEl.focus({ preventScroll: true });
    syncAccPanel();
  }
  function hide() {
    endCall();
    cur = -1;
    pg.style.display = "none";
    pg.innerHTML = "";
    last = performance.now();
    syncAccPanel();
  }
  function go(i) {
    if (i == null || i !== i || !SV[i]) return;
    show(i);
    try {
      location.hash = SV[i].slug;
    } catch (e) {}
  }
  function back() {
    hide();
    try {
      history.replaceState(null, "", location.pathname + location.search);
    } catch (e) {
      try {
        location.hash = "";
      } catch (_) {}
    }
  }
  // FLOATING TABLET. The six station pages open in a floating tablet that flies out of the pin; Zoom expands it to a full display.
  const tcalm = matchMedia("(prefers-reduced-motion:reduce)").matches;
  const tf = document.createElement("div");
  tf.id = "tabf";
  tf.innerHTML =
    '<div class="fly"><div class="tin"><div class="scr"><div class="tbar"><b id="tbt"></b><span class="tbs">Pinch or double-tap the frame to zoom</span><button type="button" class="tbtn" id="tz"></button><button type="button" class="tbtn" id="tx" aria-label="Close the tablet">&times;</button></div><div class="tbody"></div></div></div></div>';
  app.appendChild(tf);
  tf.querySelector(".tbody").appendChild(pg);
  const fly = tf.querySelector(".fly"),
    tin = tf.querySelector(".tin"),
    tz = $("#tz"),
    tbt = $("#tbt");
  let tfull = false,
    closing = false,
    fa = null,
    tLast = 0;
  function setFull(f) {
    tfull = f;
    tf.classList.toggle("full", f);
    tz.innerHTML = f ? "&#10530; Shrink" : "&#10529; Zoom in";
    tz.setAttribute("aria-label", f ? "Shrink back to the tablet" : "Zoom in to full screen");
    syncAccPanel();
  }
  function preferTabFull() {
    const w = W(),
      h = H();
    if (!w || !h) return true;
    // Prefer full tablet when the floating frame would be cramped by width or height.
    return Math.min(w / 860, h / 640) < 0.92;
  }
  function pinFrom(i) {
    const b = pinB[i];
    if (!b || !b.style.transform) return null;
    const pr = b.getBoundingClientRect(),
      fr = fly.getBoundingClientRect();
    return [
      pr.left + pr.width / 2 - (fr.left + fr.width / 2),
      pr.top + pr.height / 2 - (fr.top + fr.height / 2),
    ];
  }
  const _show = show,
    _hide = hide;
  show = function (i) {
    if (closing) {
      closing = false;
      if (fa) fa.cancel();
    }
    const was = tf.classList.contains("on");
    tf.classList.add("on");
    // Phones: open the tablet full-screen so forms stay readable and tappable.
    if (!was) setFull(preferTabFull());
    _show(i);
    const s = SV[i],
      n = s.par != null ? s.par : i;
    tbt.textContent = (n < 6 ? "0" + (n + 1) + " / 06 \u00b7 " : "") + s.n;
    if (!was && !tcalm) {
      const o = pinFrom(i);
      if (o)
        fa = fly.animate(
          [
            {
              transform: "translate(" + o[0] + "px," + o[1] + "px) scale(.08) rotate(-14deg)",
              opacity: 0,
            },
            {
              transform:
                "translate(" +
                o[0] * 0.25 +
                "px," +
                (o[1] * 0.25 - 30) +
                "px) scale(.72) rotate(-4deg)",
              opacity: 1,
              offset: 0.6,
            },
            { transform: "none", opacity: 1 },
          ],
          { duration: 750, easing: "cubic-bezier(.2,.8,.25,1)" },
        );
    }
  };
  hide = function () {
    endCall();
    if (!tf.classList.contains("on")) {
      _hide();
      return;
    }
    if (closing) return;
    const fin = () => {
      closing = false;
      tf.classList.remove("on");
      setFull(false);
      _hide();
    };
    if (tcalm) {
      fin();
      return;
    }
    closing = true;
    const o = pinFrom(lastPin()) || [0, 160];
    fa = fly.animate(
      [
        { transform: "none", opacity: 1 },
        {
          transform: "translate(" + o[0] + "px," + o[1] + "px) scale(.08) rotate(-12deg)",
          opacity: 0,
        },
      ],
      { duration: 380, easing: "cubic-bezier(.5,0,.8,.4)" },
    );
    fa.onfinish = () => {
      if (closing) fin();
    };
  };
  function lastPin() {
    const s = SV[cur];
    return s ? (s.par != null ? s.par : cur) : 0;
  }
  // TELEPHONE. A 6-digit code is the Jitsi room name. No API key is required.
  const MT = { name: "", code: "", host: false, api: null, poll: 0, filled: "" };
  function endCall() {
    if (MT.api) {
      try {
        MT.api.dispose();
      } catch (e) {}
      MT.api = null;
    }
  }
  function mtEsc(t) {
    return String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  }
  function mtName() {
    const saved = accGet();
    return MT.name || (saved && saved.name) || "";
  }
  function loadJitsi() {
    if (window.JitsiMeetExternalAPI) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://meet.ffmuc.net/external_api.js";
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("The video service could not be loaded."));
      document.head.appendChild(s);
    });
  }
  function stopInvitePoll() {
    if (MT.poll) {
      clearInterval(MT.poll);
      MT.poll = 0;
    }
  }
  async function pullInvite() {
    const saved = accGet() || {};
    const codeEl = $("#mc");
    if (!saved.token || !codeEl) return;
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: "my_invite", token: saved.token }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok || !data.pending || !data.access_code || !$("#mc")) return;
      const mailEl = $("#meail");
      const nameEl = $("#mn");
      if (mailEl && data.email && !mailEl.value.trim()) mailEl.value = data.email;
      if (nameEl && data.name && !nameEl.value.trim()) nameEl.value = data.name;
      if (codeEl.value.trim() !== data.access_code) {
        codeEl.value = data.access_code;
        MT.filled = data.access_code;
        const note = $("#me");
        if (note) note.textContent = "Your access code was filled in. Press Join a Room.";
      }
    } catch (e) {}
  }
  function mtHome(err) {
    endCall();
    stopInvitePoll();
    const saved = accGet() || {};
    pg.innerHTML =
      '<div id="mt"><div class="bx"><h3>Telephone</h3><p>Sign in with the account that was chosen. The access code fills in here. It is not sent by Gmail.</p><input id="mn" placeholder="Your name" maxlength="24" autocomplete="name" value="' +
      mtEsc(mtName()) +
      '"><input id="meail" type="email" placeholder="The email you are signed in with" autocomplete="email" value="' +
      mtEsc(saved.email || "") +
      '"><div class="r"><input id="mc" placeholder="Access code for your account" maxlength="40" autocomplete="one-time-code"><button type="button" class="p" id="mj">Join a Room</button></div><div class="er" id="me">' +
      mtEsc(err || "") +
      '</div><div class="r"><button type="button" class="g" id="mx">Close</button></div></div></div>';
    const readName = () => {
      MT.name = ($("#mn").value || "").trim().slice(0, 24);
      return MT.name;
    };
    $("#mx").onclick = () => mtClose();
    $("#mj").onclick = () => {
      if (!readName()) {
        $("#me").textContent = "Enter your name.";
        return;
      }
      const email = ($("#meail").value || "").trim().toLowerCase();
      const access = ($("#mc").value || "").trim();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        $("#me").textContent = "Enter the email you are signed in with.";
        return;
      }
      if (access.length < 8) {
        $("#me").textContent = "Enter the access code for your signed-in account.";
        return;
      }
      $("#me").textContent = "Checking your invite…";
      fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: "redeem", email, access_code: access }),
      })
        .then((res) => res.json().then((data) => ({ res, data })))
        .then(({ res, data }) => {
          if (!res.ok || !data.ok) {
            $("#me").textContent = (data && data.error) || "That invite could not be used.";
            return;
          }
          mtOpen(false, data.room || data.link, data);
        })
        .catch(() => {
          $("#me").textContent = "The invite could not be checked. Try again in a moment.";
        });
    };
    if (saved.token) {
      pullInvite();
      MT.poll = setInterval(pullInvite, 4000);
    }
  }
  async function mtOpen(host, roomName, meta) {
    stopInvitePoll();
    MT.host = host;
    const room = String(roomName || "").replace(/^https?:\/\/meet\.ffmuc\.net\//, "") || "LAYC-000000";
    MT.code = room.replace(/^LAYC-/, "");
    const title = (meta && meta.name) || "Lay C meeting";
    pg.innerHTML =
      '<div id="mt"><div class="bx"><h3>Telephone</h3>' +
      (host
        ? '<div class="cd"><small>Room</small><b>' + mtEsc(MT.code) + "</b></div>"
        : "<p>Joined <b>" + mtEsc(title) + "</b> as " + mtEsc(MT.name) + ".</p>") +
      '<div class="call" id="mv"></div><p class="er" id="me">Opening the meeting…</p><div class="r"><a class="g" id="mlink" href="https://meet.ffmuc.net/' +
      mtEsc(room) +
      '" target="_blank" rel="noopener">Open the video call in a new tab</a></div><div class="r"><button type="button" class="g" id="mx">Close</button></div></div></div>';
    $("#mx").onclick = () => mtClose();
    try {
      await loadJitsi();
      const parent = $("#mv");
      if (!parent || !window.JitsiMeetExternalAPI) throw new Error("The video service could not be loaded.");
      MT.api = new window.JitsiMeetExternalAPI("meet.ffmuc.net", {
        roomName: room,
        parentNode: parent,
        width: "100%",
        height: "100%",
        userInfo: { displayName: MT.name },
        configOverwrite: {
          prejoinPageEnabled: true,
          disableDeepLinking: true,
          enableLobby: false,
          startWithAudioMuted: false,
          startWithVideoMuted: false,
        },
      });
      $("#me").textContent = "";
    } catch (e) {
      $("#me").textContent = (e && e.message) || "The video call could not open here. Use the button below.";
    }
  }
  function mtClose() {
    stopOrderPoll();
    stopInvitePoll();
    endCall();
    closing = false;
    if (fa) {
      try {
        fa.cancel();
      } catch (e) {}
    }
    tf.classList.remove("on");
    setFull(false);
    _hide();
    try {
      history.replaceState(null, "", location.pathname + location.search);
    } catch (e) {}
  }
  function openTelephone() {
    if (closing) {
      closing = false;
      if (fa) fa.cancel();
    }
    const was = tf.classList.contains("on");
    tf.classList.add("on");
    if (!was) setFull(preferTabFull());
    cur = -1;
    pg.style.display = "block";
    tbt.textContent = "Telephone";
    mtHome();
    syncAccPanel();
    try {
      history.replaceState(null, "", location.pathname + location.search);
    } catch (e) {}
  }
  openMeet = openTelephone;
  const RV = { list: [], star: 0, busy: false };
  const rvEsc = (x) =>
    String(x).replace(
      /[&<>"]/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
    );
  function rvStars(n) {
    const on = Math.max(0, Math.min(5, Number(n) || 0));
    return (
      "🍉".repeat(on) +
      (on < 5 ? '<span class="off">' + "🍉".repeat(5 - on) + "</span>" : "")
    );
  }
  function rvDrawList() {
    const el = $("#rvl"),
      avgEl = $("#rva");
    if (!el || !avgEl) return;
    const L = RV.list.slice().sort((a, b) => (b.ts || 0) - (a.ts || 0));
    const avg = L.length ? L.reduce((a, r) => a + r.r, 0) / L.length : 0;
    avgEl.textContent = L.length
      ? avg.toFixed(1) +
        " out of 5 from " +
        L.length +
        (L.length === 1 ? " review" : " reviews")
      : "No reviews yet. Be the first!";
    el.innerHTML = L.map((r) => {
      const when = r.ts ? new Date(r.ts).toLocaleDateString() : "";
      return (
        '<div class="rc"><b>' +
        rvEsc(r.n || "Customer") +
        '</b><span class="st" aria-label="' +
        r.r +
        ' out of 5">' +
        rvStars(r.r) +
        "</span>" +
        (when ? "<small>" + rvEsc(when) + "</small>" : "") +
        "<p>" +
        rvEsc(r.t || "") +
        "</p></div>"
      );
    }).join("");
  }
  function rvDrawRating() {
    const sr = $("#rvs");
    if (!sr) return;
    sr.innerHTML = [1, 2, 3, 4, 5]
      .map(
        (i) =>
          '<button type="button" data-s="' +
          i +
          '" class="' +
          (i <= RV.star ? "on" : "") +
          '" aria-label="' +
          i +
          " watermelon" +
          (i > 1 ? "s" : "") +
          '" aria-pressed="' +
          (i === RV.star ? "true" : "false") +
          '">🍉</button>',
      )
      .join("");
  }
  async function rvLoad() {
    const m = $("#rvm");
    try {
      const res = await fetch("/api/reviews", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        if (m) m.textContent = (data && data.error) || "Reviews could not be loaded.";
        return;
      }
      RV.list = Array.isArray(data.reviews) ? data.reviews : [];
      rvDrawList();
      if (m && /could not be loaded/i.test(m.textContent || "")) m.textContent = "";
    } catch (e) {
      if (m) m.textContent = "Reviews could not be loaded.";
    }
  }
  function rvClose() {
    closing = false;
    if (fa) {
      try {
        fa.cancel();
      } catch (e) {}
    }
    tf.classList.remove("on");
    setFull(false);
    _hide();
    try {
      history.replaceState(null, "", location.pathname + location.search);
    } catch (e) {}
  }
  function rvForm() {
    RV.star = 0;
    RV.busy = false;
    const saved = accGet();
    const name = (saved && saved.name) || "";
    pg.innerHTML =
      '<div id="rv"><div class="bx"><h3>Customer reviews</h3><p class="avg" id="rva">Loading reviews…</p>' +
      '<label class="visually-hidden" for="rvn">Your name</label>' +
      '<input id="rvn" maxlength="30" placeholder="Your name" autocomplete="name" value="' +
      rvEsc(name) +
      '">' +
      '<div class="sr" id="rvs" role="group" aria-label="Rating, 1 to 5 watermelons"></div>' +
      '<label class="visually-hidden" for="rvt">Your review</label>' +
      '<textarea id="rvt" maxlength="400" placeholder="Tell us about your experience with LAY C"></textarea>' +
      '<button class="sub" id="rvsub" type="button">Send my review</button>' +
      '<div class="msg" id="rvm" aria-live="polite"></div>' +
      '<div id="rvl"></div>' +
      '<button type="button" class="tbtn" id="rvx">Close</button></div></div>';
    rvDrawRating();
    rvDrawList();
    $("#rvs").onclick = (e) => {
      const b = e.target.closest("[data-s]");
      if (!b || RV.busy) return;
      RV.star = +b.dataset.s;
      rvDrawRating();
      const m = $("#rvm");
      if (m && /rating/i.test(m.textContent || "")) m.textContent = "";
    };
    $("#rvx").onclick = () => rvClose();
    $("#rvsub").onclick = async () => {
      if (RV.busy) return;
      const n = ($("#rvn").value || "").trim().slice(0, 30);
      const t = ($("#rvt").value || "").trim().slice(0, 400);
      const m = $("#rvm");
      const b = $("#rvsub");
      if (!n) {
        m.textContent = "Please enter your name.";
        $("#rvn").focus();
        return;
      }
      if (!(RV.star >= 1 && RV.star <= 5)) {
        m.textContent = "Please choose a rating from 1 to 5.";
        return;
      }
      if (!t) {
        m.textContent = "Please write a few words about your experience.";
        $("#rvt").focus();
        return;
      }
      RV.busy = true;
      b.disabled = true;
      m.textContent = "Sending…";
      const idem =
        "rv-" +
        Date.now().toString(36) +
        "-" +
        Math.random().toString(36).slice(2, 8);
      try {
        const res = await fetch("/api/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ n, r: RV.star, t, idempotency_key: idem }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) {
          m.textContent = (data && data.error) || "Sorry, the review could not be saved.";
          return;
        }
        $("#rvt").value = "";
        RV.star = 0;
        rvDrawRating();
        m.textContent = "Thank you! Your review was added.";
        await rvLoad();
      } catch (e) {
        m.textContent = "Sorry, the review could not be saved.";
      } finally {
        RV.busy = false;
        b.disabled = false;
      }
    };
  }
  function openReviewsUi() {
    if (closing) {
      closing = false;
      if (fa) fa.cancel();
    }
    const was = tf.classList.contains("on");
    tf.classList.add("on");
    if (!was) setFull(preferTabFull());
    cur = -1;
    pg.style.display = "block";
    tbt.textContent = "Customer reviews";
    rvForm();
    rvLoad();
    syncAccPanel();
    try {
      history.replaceState(null, "", location.pathname + location.search);
    } catch (e) {}
  }
  openReviews = openReviewsUi;
  try {
    app.openReviews = openReviewsUi;
  } catch (e) {}
  const ORDER_STAGES = {
    manufacturing: ["Viewing order", "Gathering materials", "Manufacture started", "Printing", "Accessories", "Finishing", "Delivery"],
    seniors: ["Viewing order", "Gathering materials", "Manufacture started", "Printing", "Accessories", "Finishing", "Delivery"],
    "seniors-uniform": ["Viewing order", "Gathering materials", "Manufacture started", "Printing", "Accessories", "Finishing", "Delivery"],
    designing: ["Viewing order", "Creating the design"],
    web: [
      "Viewing order",
      "Discovery & Planning",
      "Wireframing & UI/UX Design",
      "Front-End & Back-End Development",
      "Content Integration & Populating Data",
      "Testing, QA & Optimization",
      "Deployment & Launch",
      "Post-Launch Maintenance & Handover",
    ],
    photo: ["Viewing order", "Mood boards", "Scouting location", "Confirmation", "Equipment", "Day of the shoot", "Photo selection", "Coloring", "Delivery"],
    "photo-shoot": ["Viewing order", "Mood boards", "Scouting location", "Confirmation", "Equipment", "Day of the shoot", "Photo selection", "Coloring", "Delivery"],
    "photo-studio": ["Viewing order", "Confirmation", "Day of the shoot", "Delivery"],
    "media-buying": ["Viewing order", "Strategy & planning", "Campaign setup", "Launch", "Optimization", "Reporting"],
    ugc: ["Viewing order", "Brief & creator matching", "Filming", "Editing", "Review & revisions", "Delivery"],
  };
  function orderStages(slug) {
    return ORDER_STAGES[slug] || ["Viewing order", "Confirmed", "Done"];
  }
  function orderQuote(order) {
    const lines = Array.isArray(order.lines) ? order.lines : [];
    const body = lines
      .map((line) => {
        const name = line.name || "Item";
        const qty = line.quantity != null ? " x" + line.quantity : "";
        const price = line.line_total != null && line.line_total !== "" ? ": " + line.line_total + " L.E" : "";
        return "- " + name + qty + price;
      })
      .join("\n");
    const extra = order.extra ? "\n" + order.extra : "";
    const total = order.total != null ? "\nTotal: " + order.total + " L.E" : "";
    return (body + extra + total).trim();
  }
  function paintOrders(orders, err) {
    const esc = (t) => String(t == null ? "" : t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
    let html = '<div id="od"><div class="bx"><h3>Your orders</h3>';
    if (err) html += '<p class="er">' + esc(err) + '</p><button type="button" id="odlogin">Sign in</button>';
    else if (!orders.length) html += "<p>You have no order yet. Pick a service, build your request and tap Request.</p>";
    orders.forEach((order) => {
      const stages = Array.isArray(order.stages) && order.stages.length ? order.stages : orderStages(order.slug);
      const stage = Number.isInteger(order.stage) && order.stage >= 0 ? order.stage : 0;
      const fin = stage >= stages.length;
      const ix = fin ? stages.length - 1 : Math.min(stage, stages.length - 1);
      html +=
        '<article class="ord"><b>' +
        esc(order.title || "Order") +
        "</b><p>Placed " +
        esc(order.created_at ? new Date(order.created_at).toLocaleString() : "") +
        "</p><pre>" +
        esc(orderQuote(order) || "No quote details were saved with this order.") +
        "</pre><b>" +
        (fin ? "Order complete" : "Now: " + esc(stages[ix])) +
        "</b>";
      html += stages
        .map((name, i) => {
          const gold = i === stages.length - 1 || name === "Day of the shoot";
          const cls = (i < ix || fin ? "d" : i === ix ? "n" : "") + (gold ? " g" : "");
          return (
            '<div class="ost ' +
            cls +
            '"><i>' +
            (i < ix || fin ? "✓" : i + 1) +
            "</i><div><b>" +
            esc(name) +
            "</b>" +
            (gold ? '<span class="sp" aria-hidden="true">✦</span><span class="sp" aria-hidden="true">✦</span>' : "") +
            "</div></div>"
          );
        })
        .join("");
      html += "</article>";
    });
    html += '<button type="button" id="odx">Close</button></div></div>';
    pg.innerHTML = html;
    const close = $("#odx");
    if (close) close.onclick = () => mtClose();
  }
  let orderPoll = null;
  function stopOrderPoll() {
    if (orderPoll) {
      clearInterval(orderPoll);
      orderPoll = null;
    }
  }
  function bindOrderLogin(stale) {
    const btn = $("#odlogin");
    if (!btn) return;
    btn.onclick = () => {
      const saved = stale || accGet() || {};
      mtClose();
      openAcc(openOrderList, "signup");
      const name = $("#accname");
      const email = $("#accemail");
      const phone = $("#accphone");
      if (name && saved.name) name.value = saved.name;
      if (email && saved.email) email.value = saved.email;
      if (phone && saved.phone) phone.value = saved.phone;
    };
  }
  async function loadOrders(quiet) {
    const acc = accGet();
    if (!acc || !acc.token || String(acc.token).length < 16) {
      paintOrders([], "Sign in with the email you used for the order. The order is saved to that email.");
      bindOrderLogin(acc);
      return;
    }
    if (!quiet) pg.innerHTML = '<div id="od"><div class="bx"><h3>Your orders</h3><p>Loading your orders…</p></div></div>';
    try {
      const res = await fetch("/api/quote?token=" + encodeURIComponent(acc.token));
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        const stale = { name: acc.name, email: acc.email, phone: acc.phone };
        accSet(null);
        paintOrders([], "That sign-in expired. Sign in again with the same email. Your order is saved to that email.");
        bindOrderLogin(stale);
        return;
      }
      if (!res.ok || !data.ok) throw new Error(data.error || "Your orders could not be loaded.");
      if (quiet && !$("#od")) return;
      paintOrders(data.orders || [], "");
    } catch (err) {
      if (quiet && $("#od")) return;
      paintOrders([], (err && err.message) || "Your orders could not be loaded.");
    }
  }
  function openOrderList() {
    if (closing) {
      closing = false;
      if (fa) fa.cancel();
    }
    endCall();
    const was = tf.classList.contains("on");
    tf.classList.add("on");
    if (!was) setFull(preferTabFull());
    cur = -1;
    pg.style.display = "block";
    tbt.textContent = "Your orders";
    stopOrderPoll();
    loadOrders();
    orderPoll = setInterval(() => {
      if (!tf.classList.contains("on") || !$("#od")) {
        stopOrderPoll();
        return;
      }
      loadOrders(true);
    }, 8000);
    syncAccPanel();
    try {
      history.replaceState(null, "", location.pathname + location.search);
    } catch (e) {}
  }
  openOrders = openOrderList;
  tz.onclick = () => setFull(!tfull);
  $("#tx").onclick = () => back();
  tin.addEventListener("dblclick", (e) => {
    if (!tfull && !e.target.closest("#page")) setFull(true);
  });
  tin.addEventListener(
    "wheel",
    (e) => {
      if (e.ctrlKey && !tfull && e.deltaY < 0) {
        e.preventDefault();
        if (Date.now() - tLast > 600) {
          tLast = Date.now();
          setFull(true);
        }
      }
    },
    { passive: false },
  );
  {
    let pd = 0;
    const dist = (e) =>
      Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
    tin.addEventListener(
      "touchstart",
      (e) => {
        pd = e.touches.length === 2 ? dist(e) : 0;
      },
      { passive: true },
    );
    tin.addEventListener(
      "touchmove",
      (e) => {
        if (pd && e.touches.length === 2 && !tfull && dist(e) > pd * 1.3) {
          setFull(true);
          pd = 0;
        }
      },
      { passive: true },
    );
    tin.addEventListener(
      "touchend",
      () => {
        pd = 0;
      },
      { passive: true },
    );
  }
  addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Escape" && cur >= 0 && tfull && gd.hidden) {
        e.stopImmediatePropagation();
        setFull(false);
      }
    },
    true,
  );
  // Tap or click outside the tablet to send it back (a drag to rotate the scene does not count).
  {
    let dn = null;
    const out = (t) =>
      !t.closest(".tin") &&
      !t.closest(".pin") &&
      !t.closest("#guide") &&
      !t.closest("#mas") &&
      !t.closest("#talk");
    app.addEventListener(
      "pointerdown",
      (e) => {
        dn =
          tf.classList.contains("on") && !tfull && !closing && out(e.target)
            ? [e.clientX, e.clientY]
            : null;
      },
      true,
    );
    app.addEventListener(
      "pointerup",
      (e) => {
        if (
          dn &&
          Math.hypot(e.clientX - dn[0], e.clientY - dn[1]) < 6 &&
          out(e.target) &&
          gd.hidden
        )
          back();
        dn = null;
      },
      true,
    );
  }
  setFull(false);
  pg.addEventListener("change", (e) => {
    const el = e.target;
    if (el.classList.contains("fi")) {
      const f = el.files[0],
        k = el.dataset.key,
        pv = el.nextElementSibling;
      det[k] = det[k] || {};
      det[k].img = f ? f.name : "";
      if (f) {
        pv.src = URL.createObjectURL(f);
        pv.hidden = false;
      } else pv.hidden = true;
      calc();
      return;
    }
    if (!el.name) return;
    const j = +el.name.slice(1);
    ans[j] = [...pg.querySelectorAll("input[name=q" + j + "]:checked")].map((x) => +x.value);
    const ot = pg.querySelector('.ot[data-j="' + j + '"]'),
      on = ans[j].includes(SV[cur].q[j].o.length);
    ot.hidden = !on;
    if (on) ot.focus();
    pg.querySelectorAll('.det[data-j="' + j + '"]').forEach(
      (d) => (d.hidden = !ans[j].includes(+d.dataset.k)),
    );
    calc();
  });
  pg.addEventListener("input", (e) => {
    if (e.target.classList.contains("ot")) {
      oth[+e.target.dataset.j] = e.target.value;
      calc();
    } else if (e.target.classList.contains("nb")) {
      const k = e.target.dataset.key;
      det[k] = det[k] || {};
      det[k].n = Math.max(0, Math.floor(parseFloat(e.target.value)) || 0);
      calc();
    } else if (e.target.classList.contains("dt")) {
      const k = e.target.dataset.key;
      det[k] = det[k] || {};
      det[k].text = e.target.value.trim();
      calc();
    }
  });
  pg.addEventListener("click", (e) => {
    const mbb = e.target.closest(".mbb");
    if (mbb) {
      e.stopPropagation();
      const k = mbb.dataset.k,
        st = +mbb.dataset.step;
      if (k === "d") mbv.d = Math.max(1, Math.min(31, mbv.d + st));
      else if (k === "m") mbv.m = Math.max(1, Math.min(12, mbv.m + st));
      else if (k === "si" || k === "sw") mbv[k] = mbNext(mbv[k], st);
      else if (k === "am") mbv.am = !mbv.am;
      else if (k === "ugS" || k === "ugB" || k === "ugA") {
        const c = k.slice(2),
          n = mbv[k];
        mbv[k] = st > 0 ? (n <= 0 ? UG[c].min : Math.min(500, n + 1)) : n <= UG[c].min ? 0 : n - 1;
      } else mbv.b[+k] = Math.max(0, Math.min(100000, mbv.b[+k] + st * 100));
      mbUpd();
      calc();
      return;
    }
    const place = e.target.closest("#studio-ask .stc button[data-v]");
    if (place) {
      const loc = $("#stl");
      if (loc) {
        loc.value = place.dataset.v;
        loc.focus();
      }
      pg.querySelectorAll("#studio-ask .stc button").forEach((b) =>
        b.setAttribute("aria-pressed", b === place ? "true" : "false"),
      );
      const note = $("#stm");
      if (note) note.textContent = "";
      return;
    }
    if (e.target.closest("#stsub")) {
      const loc = $("#stl");
      const note = $("#stm");
      const where = loc ? loc.value.trim() : "";
      if (!where) {
        if (note) note.textContent = "Please tell us where you want the studio.";
        if (loc) loc.focus();
        return;
      }
      if (note)
        note.textContent =
          "This request cannot be sent yet. There is no studio-location save on the server.";
      return;
    }
    if (e.target.closest("#stx")) {
      show(cur);
      return;
    }
    const w = e.target.closest(".win[data-i]");
    if (w) {
      if (w.classList.contains("soon")) {
        openStudioAsk();
        return;
      }
      go(+w.dataset.i);
      return;
    }
    if (e.target.closest("#askg")) {
      gOpen(cur);
      return;
    }
    const sb = e.target.closest(".sb");
    if (sb) {
      const q = SV[cur].q[+sb.dataset.j];
      hrs = Math.max(q.min, Math.min(q.max, hrs + +sb.dataset.step));
      stp();
      calc();
      return;
    }
    const cb = e.target.closest("#cal button");
    if (cb) {
      if (cb.dataset.nav)
        kal.m = new Date(kal.m.getFullYear(), kal.m.getMonth() + +cb.dataset.nav, 1);
      else if (cb.dataset.d) {
        kal.day = cb.dataset.d;
        kal.time = null;
      } else if (cb.dataset.h) kal.time = +cb.dataset.h;
      kal.sig = "";
      drawCal();
      calc();
      const sel = cb.dataset.nav
        ? '[data-nav="' + cb.dataset.nav + '"]'
        : cb.dataset.d
          ? '[data-d="' + cb.dataset.d + '"]'
          : '[data-h="' + cb.dataset.h + '"]';
      const f = $("#cal").querySelector(sel);
      if (f && !f.disabled) f.focus({ preventScroll: true });
      return;
    }
    const id = e.target.id;
    if (id === "back") {
      const pr = SV[cur].par;
      if (pr != null) go(pr);
      else back();
    } else if (id === "req") {
      startQuote();
    } else if (id === "accbar") {
      openAcc();
    } else if (id === "cp") {
      try {
        navigator.clipboard.writeText(txtOut);
        e.target.textContent = "Copied";
      } catch (x) {
        e.target.textContent = "Select the text above to copy";
      }
    }
  });
  addEventListener("keydown", (e) => {
    if (e.key === "Escape" && $("#account") && !$("#account").hidden) {
      closeAcc();
      return;
    }
    if (e.key === "Escape" && cur >= 0 && gd.hidden) back();
  });
  addEventListener("hashchange", () => {
    const i = SV.findIndex((s) => s.slug === location.hash.slice(1));
    if (i < 0) hide();
    else if (i !== cur) show(i);
  });
  const accForm = $("#accform");
  if ($("#accbtn")) $("#accbtn").addEventListener("click", () => openAcc(null, signedIn() ? "account" : "login"));
  const menuListEl = document.querySelector("#menu .ml");
  const menuSearch = $("#msearch");
  const menuIdx = SV.map((x, i) => ({
    i,
    h: (
      x.n +
      " " +
      (x.s || "") +
      " " +
      (x.q || [])
        .map((q) => (q.t || "") + " " + (q.o || []).map((o) => String(o[0])).join(" "))
        .join(" ")
    ).toLowerCase(),
  }));
  function menuBtn(i, icon) {
    const b = document.createElement("button");
    b.type = "button";
    b.dataset.go = String(i);
    const mark = document.createElement("i");
    mark.textContent = icon;
    const label = document.createElement("span");
    label.textContent = SV[i].n;
    b.appendChild(mark);
    b.appendChild(label);
    return b;
  }
  function menuList(q) {
    if (!menuListEl) return;
    q = String(q || "").trim().toLowerCase();
    menuListEl.textContent = "";
    if (!q) {
      SV.slice(0, 6).forEach((x, i) => menuListEl.appendChild(menuBtn(i, "0" + (i + 1))));
      return;
    }
    const words = q.split(/\s+/);
    const hits = menuIdx.filter((o) => words.every((word) => o.h.includes(word))).slice(0, 8);
    hits.forEach((o) => menuListEl.appendChild(menuBtn(o.i, "\u2192")));
    if (!hits.length) {
      const empty = document.createElement("p");
      empty.className = "mno";
      empty.textContent = "No match for \u201c" + (menuSearch ? menuSearch.value.trim() : q) + "\u201d.";
      menuListEl.appendChild(empty);
    }
  }
  menuList("");
  function menuSet(on) {
    const menu = $("#menu");
    const scrim = $("#mscrim");
    const btn = $("#menub");
    const app = $("#app");
    if (menu) {
      menu.classList.toggle("on", on);
      if (on) menu.removeAttribute("inert");
      else menu.setAttribute("inert", "");
    }
    if (scrim) scrim.hidden = !on;
    if (app) app.classList.toggle("menu-open", on);
    if (btn) {
      btn.setAttribute("aria-expanded", on ? "true" : "false");
      btn.setAttribute("aria-label", on ? "Close the menu" : "Open the menu");
    }
    if (on && menuSearch) {
      menuSearch.value = "";
      menuList("");
    }
  }
  if ($("#menub")) $("#menub").addEventListener("click", () => menuSet(!$("#menu").classList.contains("on")));
  if ($("#mscrim")) $("#mscrim").addEventListener("click", () => menuSet(false));
  if ($("#mlogin"))
    $("#mlogin").addEventListener("click", () => {
      menuSet(false);
      openAcc(null, "login");
    });
  if ($("#msignup"))
    $("#msignup").addEventListener("click", () => {
      menuSet(false);
      openAcc(null, "signup");
    });
  if ($("#mlogout"))
    $("#mlogout").addEventListener("click", () => {
      menuSet(false);
      signOut();
    });
  if (menuSearch) menuSearch.addEventListener("input", () => menuList(menuSearch.value));
  if (menuListEl)
    menuListEl.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-go]");
      if (!b) return;
      menuSet(false);
      go(Number(b.dataset.go));
    });
  if ($("#mdod"))
    $("#mdod").addEventListener("click", () => {
      menuSet(false);
      gOpen(-1);
    });
  if ($("#accx")) $("#accx").addEventListener("click", closeAcc);
  if ($("#accout")) $("#accout").addEventListener("click", signOut);
  if ($("#accsignup")) $("#accsignup").addEventListener("click", () => setAccMode("signup"));
  if ($("#acclogin")) $("#acclogin").addEventListener("click", () => setAccMode("login"));
  if (accForm)
    accForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (accMode === "account") return;
      const err = $("#accerr");
      const body = {
        mode: accMode,
        customer_name: ($("#accname") && $("#accname").value.trim()) || "",
        customer_email: ($("#accemail") && $("#accemail").value.trim()) || "",
        customer_phone: ($("#accphone") && $("#accphone").value.trim()) || "",
        password: ($("#accpass") && $("#accpass").value) || "",
      };
      if (err) {
        err.hidden = true;
        err.textContent = "";
      }
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.customer_email);
      const signupOk = body.customer_name && emailOk && body.customer_phone.length >= 6 && body.password.length >= 6;
      const loginOk = emailOk && body.password.length >= 6;
      if (accMode === "login" ? !loginOk : !signupOk) {
        if (err) {
          err.hidden = false;
          err.textContent =
            accMode === "login"
              ? "Enter the email you signed up with and its password."
              : "Enter your name, a valid email, a phone number and a password of at least 6 characters.";
        }
        return;
      }
      const submit = accForm.querySelector('button[type="submit"]');
      if (submit) submit.disabled = true;
      try {
        const res = await fetch("/api/account", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) throw new Error(data.error || "Could not save your email.");
        accDismissed = true;
        accSet({
          name: data.customer_name || body.customer_name,
          email: data.customer_email || body.customer_email,
          phone: data.customer_phone || body.customer_phone,
          token: data.token || "",
        });
        if (data.created) {
          try {
            await sendQuoteEmail(
              {
                order_summary:
                  "Someone created an email account.\nName: " +
                  body.customer_name +
                  "\nEmail: " +
                  body.customer_email +
                  "\nPhone: " +
                  body.customer_phone +
                  "\nOrders and photos from this person stay connected to this email.",
                products: "New account",
                quantities: body.customer_email,
                total_price: "Account",
              },
              null,
              "eyadellithy80@gmail.com",
            );
          } catch (mailErr) {}
        }
        if ($("#accpass")) $("#accpass").value = "";
        const next = pendingQuote;
        pendingQuote = null;
        if (next) next();
      } catch (ex) {
        let msg = (ex && ex.message) || "Could not save your email.";
        if (location.protocol === "file:") {
          msg = "Open http://127.0.0.1:8765 in the browser. A page opened from a file cannot sign up.";
        } else if (/failed to fetch|networkerror|load failed/i.test(msg)) {
          msg =
            location.hostname === "127.0.0.1" || location.hostname === "localhost"
              ? "Could not reach the local server. Refresh http://127.0.0.1:8765 and try Sign up again."
              : "Could not reach the server. Refresh the page and try Sign up again.";
        }
        if (/invalid api key/i.test(msg)) {
          msg = "The account was not saved. The live database key is not set, so sign up cannot be stored.";
        }
        if (/already has an account/i.test(msg)) setAccMode("login");
        if (/sign up first/i.test(msg)) setAccMode("signup");
        if (err) {
          err.hidden = false;
          err.textContent = msg;
        }
      } finally {
        const submit = accForm.querySelector('button[type="submit"]');
        if (submit) submit.disabled = false;
      }
    });
  paintAcc();
  restoreAcc();

  async function restoreAcc() {
    const saved = accGet();
    if (!saved || !saved.token) return;
    try {
      const res = await fetch("/api/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "session", token: saved.token }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 404) {
        accSet(null);
        return;
      }
      if (!res.ok || !data.ok || !data.token) return;
      accSet({
        name: data.customer_name || saved.name || "",
        email: data.customer_email || saved.email || "",
        phone: data.customer_phone || saved.phone || "",
        token: data.token,
      });
    } catch (e) {}
  }

  // CAMERA AND SHARED PHOTO BINDER. The selfie key opens the same welcome, camera, and binder as the factory page. Pictures are stored with the signed-in email.
  {
    const appEl = $("#app");
    const ICON =
      '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h3l1.6-2.4h6.8L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.6"/></svg>';
    const SHARE =
      '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="2.2"/><circle cx="6" cy="12" r="2.2"/><circle cx="18" cy="19" r="2.2"/><path d="M8.2 11.1 15.8 6.2M8.2 12.9l7.6 4.9"/></svg>';
    const cb = document.createElement("button");
    cb.id = "cambtn";
    cb.type = "button";
    cb.className = "cambtn";
    cb.setAttribute("aria-label", "Open the camera and photo binder");
    cb.innerHTML = ICON + "<em hidden></em>";
    appEl.appendChild(cb);
    camBtnEl = cb;
    const alb = document.createElement("button");
    alb.id = "albbtn";
    alb.type = "button";
    alb.className = "albbtn";
    alb.hidden = true;
    alb.setAttribute("aria-label", "Open your photo binder");
    alb.innerHTML =
      '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M21 16l-5-4-4 3-2-2-5 5"/></svg>';
    appEl.appendChild(alb);
    albBtnEl = alb;
    cb.addEventListener("pointerdown", () => {
      camDown = true;
    });
    cb.addEventListener("pointerenter", () => {
      camHot = true;
    });
    cb.addEventListener("pointerleave", () => {
      camHot = false;
    });
    const box = document.createElement("div");
    box.id = "cam";
    box.className = "cam";
    box.hidden = true;
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-label", "Lay C camera and photo binder");
    appEl.appendChild(box);
    let tab = "all";
    let view = "";
    let facing = "user";
    let last = null;
    let count = 0;
    let albumMeta = { mine: 0, locked: true, private: true, published: false, reason: "" };
    let shareChoice = false;
    let stream = null;
    let pendingCam = null;
    let shooting = false;
    function primeCamera() {
      if (stream || pendingCam) return pendingCam;
      pendingCam = navigator.mediaDevices
        .getUserMedia({
          video: { facingMode: facing, width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        })
        .then((s) => {
          pendingCam = null;
          return s;
        })
        .catch((err) => {
          pendingCam = null;
          throw err;
        });
      return pendingCam;
    }
    const esc = (s) =>
      String(s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    const stop = () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
        stream = null;
      }
    };
    function canvasToJpeg(canvas, q) {
      return new Promise((ok, no) => {
        if (canvas.toBlob) {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                no(new Error("The picture could not be prepared."));
                return;
              }
              const reader = new FileReader();
              reader.onload = () => ok(String(reader.result || ""));
              reader.onerror = () => no(new Error("The picture could not be prepared."));
              reader.readAsDataURL(blob);
            },
            "image/jpeg",
            q,
          );
          return;
        }
        try {
          ok(canvas.toDataURL("image/jpeg", q));
        } catch (e) {
          no(e);
        }
      });
    }
    function frameFromVideo(video, maxEdge) {
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      const k = Math.min(1, maxEdge / Math.max(vw, vh));
      const w = Math.max(1, Math.round(vw * k));
      const h = Math.max(1, Math.round(vh * k));
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      const g = c.getContext("2d", { alpha: false });
      if (facing === "user") {
        g.translate(w, 0);
        g.scale(-1, 1);
      }
      g.drawImage(video, 0, 0, w, h);
      return c;
    }
    function makeThumb(canvas, maxEdge, q) {
      const k = Math.min(1, maxEdge / Math.max(canvas.width, canvas.height));
      const t = document.createElement("canvas");
      t.width = Math.max(1, Math.round(canvas.width * k));
      t.height = Math.max(1, Math.round(canvas.height * k));
      t.getContext("2d", { alpha: false }).drawImage(canvas, 0, 0, t.width, t.height);
      return canvasToJpeg(t, q).finally(() => {
        t.width = 0;
        t.height = 0;
      });
    }
    async function albumList() {
      const acc = accGet() || {};
      const q = new URLSearchParams();
      if (acc.token) q.set("token", acc.token);
      if (tab === "mine") q.set("mine", "1");
      const res = await fetch("/api/album?" + q.toString(), { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || "The album could not be opened.");
      albumMeta = {
        mine: data.mine || 0,
        locked: Boolean(data.locked),
        private: data.private !== false,
        published: Boolean(data.published || data.publish_locked),
        reason: data.reason || "",
      };
      return data.photos || [];
    }
    function properPhoto(canvas) {
      if (!canvas || canvas.width < 160 || canvas.height < 160) {
        throw new Error("Take a proper photo. The picture is too small to save.");
      }
      const t = document.createElement("canvas");
      t.width = 24;
      t.height = 24;
      const g = t.getContext("2d", { alpha: false, willReadFrequently: true });
      g.drawImage(canvas, 0, 0, 24, 24);
      const data = g.getImageData(0, 0, 24, 24).data;
      let n = 0;
      let sum = 0;
      let sum2 = 0;
      for (let i = 0; i < data.length; i += 4) {
        const y = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        sum += y;
        sum2 += y * y;
        n++;
      }
      const mean = sum / Math.max(1, n);
      const variance = sum2 / Math.max(1, n) - mean * mean;
      if (variance < 40) throw new Error("Take a proper photo. A blank or unusable picture cannot be saved.");
    }
    function setBusy(on, text) {
      const frame = box.querySelector(".cv");
      const msg = box.querySelector("#cmsg");
      const shut = box.querySelector(".shut");
      const flip = box.querySelector('[data-a="flip"]');
      if (frame) frame.classList.toggle("busy", Boolean(on));
      if (shut) shut.disabled = Boolean(on);
      if (flip) flip.disabled = Boolean(on);
      if (!msg) return;
      if (on) {
        msg.hidden = false;
        msg.classList.add("busy");
        const p = msg.querySelector("p");
        if (p) p.textContent = text || "Checking your photo…";
      } else {
        msg.classList.remove("busy");
      }
    }
    function badge(n) {
      count = n;
      const mark = cb.querySelector("em");
      if (mark) {
        mark.hidden = !n;
        mark.textContent = n;
      }
      if (albBtnEl) albBtnEl.hidden = !n;
    }
    function when(ts) {
      const d = new Date(ts || Date.now());
      return d.toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
    }
    function needAccount() {
      const acc = accGet() || {};
      if (acc.token) return false;
      stop();
      box.hidden = true;
      openAcc();
      return true;
    }
    async function refreshCount() {
      const prev = tab;
      tab = "all";
      try {
        const photos = await albumList();
        badge(albumMeta.mine || 0);
        return photos;
      } catch (e) {
        return [];
      } finally {
        tab = prev;
      }
    }
    function grid(list) {
      return list
        .map(
          (p, i) =>
            '<figure class="sl" style="--r:' +
            [-1.5, 1, -0.5, 1.5][i % 4] +
            'deg"><button type="button" data-a="view" data-id="' +
            esc(p.id) +
            '"><img src="' +
            esc(p.thumb) +
            '" alt="Photo from ' +
            esc(p.email) +
            '"><span class="nm">' +
            esc(p.email) +
            "</span></button><figcaption>" +
            esc(p.email) +
            (p.pending ? " · Review" : p.publish_locked || p.shared ? " · Public" : " · Private") +
            "</figcaption></figure>",
        )
        .join("");
    }
    async function setView(next, arg) {
      view = next;
      if (next !== "camera") stop();
      const acc = accGet() || {};
      if (next === "welcome") {
        box.innerHTML =
          '<div class="cbox"><button type="button" class="cx" data-a="close" aria-label="Close">&times;</button><div class="cic">' +
          ICON +
          "</div><h2>Welcome to the LAY C family</h2><p>We are so happy to have you with us. Take a picture and we will keep it safe in your LAY C photo binder.</p>" +
          (acc.token
            ? '<label class="shr"><input type="checkbox" id="shon"' +
              (albumMeta.published || shareChoice ? " checked" : "") +
              (albumMeta.published ? " disabled" : "") +
              "> Also share my pictures in the family album, where everyone who took a picture can see them. Every picture is checked by AI first.</label>" +
              '<p class="sst" id="shhint">' +
              (albumMeta.published
                ? "This album is already public. Sharing is permanent and cannot be reversed. A new approved photo is published with it."
                : "Leave this off and the photo stays in My pictures. Turn it on to publish that photo after it is approved. Publication cannot be undone, and other photos stay as they are.") +
              "</p>"
            : "") +
          '<button type="button" class="cp" data-a="cam">Take a picture</button>' +
          (count ? '<button type="button" class="cs" data-a="album">Open the photo binder (' + count + ")</button>" : "") +
          (acc.token ? "" : '<button type="button" class="cs" data-a="signin">Sign in</button>') +
          "</div>";
      } else if (next === "camera") {
        box.innerHTML =
          '<div class="cbox cc"><div class="cv"><video id="cvid" playsinline muted autoplay></video><div class="cmsg" id="cmsg" hidden><p>Use the camera in this browser. Only a legal photo can be saved.</p></div></div><div class="cbar"><button type="button" class="cs" data-a="back">Cancel</button><button type="button" class="shut" data-a="shot" aria-label="Take the picture"></button><button type="button" class="cs" data-a="flip">Flip</button></div></div>';
        const video = box.querySelector("#cvid");
        // Warm the server-side NSFW model once while the camera preview starts.
        fetch("/api/album?warm=1", { cache: "no-store" }).catch(() => {});
        try {
          const ready = stream ? Promise.resolve(stream) : pendingCam || primeCamera();
          const next = await ready;
          if (view !== "camera" || box.hidden) {
            if (next && next !== stream) next.getTracks().forEach((t) => t.stop());
            return;
          }
          stream = next;
          video.srcObject = stream;
          video.classList.toggle("mir", facing === "user");
          await video.play();
        } catch (e) {
          const msg = box.querySelector("#cmsg");
          if (msg) msg.hidden = false;
          const shut = box.querySelector(".shut");
          const flip = box.querySelector('[data-a="flip"]');
          if (shut) shut.hidden = true;
          if (flip) flip.hidden = true;
        }
      } else if (next === "saved" && arg) {
        box.innerHTML =
          '<div class="cbox"><button type="button" class="cx" data-a="close" aria-label="Close">&times;</button><div class="ph"><img src="' +
          esc(arg.thumb) +
          '" alt="The picture you just took"></div><h2>' +
          esc(arg.heading || "Saved to your photo binder") +
          '</h2><p class="sst">Uploaded ' +
          esc(when(arg.ts)) +
          '</p><p class="sst" id="sst">' +
          esc(arg.note || "The photo was saved.") +
          '</p><button type="button" class="cp" data-a="album">Open the photo binder (' +
          count +
          ')</button><button type="button" class="cs" data-a="cam">Take another picture</button></div>';
      } else if (next === "album") {
        const all = tab !== "mine";
        let body = '<p class="em">No pictures yet.</p>';
        let n = 0;
        try {
          const photos = await albumList();
          badge(albumMeta.mine || 0);
          n = photos.length;
          const empty = all ? "No shared pictures yet. Be the first!" : "Your binder is empty. Take a picture with the camera.";
          body = photos.length ? grid(photos) : '<p class="em">' + esc(albumMeta.locked ? albumMeta.reason || empty : empty) + "</p>";
        } catch (ex) {
          body = '<p class="em">' + esc(ex.message || "The album could not be opened.") + "</p>";
        }
        const shareBtn =
          '<button type="button" class="sharebtn" data-a="' +
          (albumMeta.published ? "share-locked" : "share-album") +
          '" aria-pressed="' +
          (albumMeta.published ? "true" : "false") +
          '" aria-label="' +
          (albumMeta.published ? "Sharing is permanent" : "Share this album") +
          '">' +
          SHARE +
          "</button>";
        box.classList.toggle("prot", all && !albumMeta.locked && (albumMeta.mine || 0) > 0);
        box.innerHTML =
          '<div class="cbox ca"><button type="button" class="cx" data-a="close" aria-label="Close">&times;</button><div class="ah"><b>LAY C family photo binder</b><span>' +
          n +
          " photo" +
          (n === 1 ? "" : "s") +
          "</span>" +
          shareBtn +
          '</div><div class="tabs"><button type="button" data-a="tab" data-t="all" aria-pressed="' +
          all +
          '">Everyone\'s album</button><button type="button" data-a="tab" data-t="mine" aria-pressed="' +
          !all +
          '">My pictures (' +
          (albumMeta.mine || 0) +
          ')</button></div><div class="bind"><div class="rings" aria-hidden="true"></div><div class="pgs">' +
          body +
          '</div></div><div class="abar"><button type="button" class="cp" data-a="cam">Take a picture</button></div></div>';
        return;
      } else if (next === "view" && arg) {
        const actions =
          '<div class="row"><button type="button" class="cs" data-a="album">Back to binder</button>' +
          (arg.can_publish
            ? '<button type="button" class="cp" data-a="publish" data-id="' + esc(arg.id) + '">Make public</button>'
            : "") +
          (arg.can_delete
            ? '<button type="button" class="cs" data-a="delphoto" data-id="' + esc(arg.id) + '">Delete</button>'
            : "") +
          "</div>" +
          (arg.pending
            ? '<p class="sst">Waiting for review. This photo is private and is not published.</p>'
            : arg.publish_locked || arg.shared
              ? '<p class="sst">This photo is public. It cannot be made private, edited, or deleted.</p>'
              : arg.own
                ? '<p class="sst">Private photo in My pictures. Only you can see it. You can delete it, or share the album from the binder. Publishing cannot be undone.</p>'
                : "");
        box.innerHTML =
          '<div class="cbox cv2"><button type="button" class="cx" data-a="album" aria-label="Close">&times;</button><div class="ph"><img src="' +
          esc(arg.image || arg.thumb) +
          '" alt="Photo from ' +
          esc(arg.email) +
          '"><span class="nm">' +
          esc(arg.email) +
          "</span></div><p>Uploaded " +
          esc(when(arg.ts)) +
          " · " +
          esc(arg.email) +
          (arg.pending ? " · In review" : arg.shared ? " · Public" : arg.own ? " · Private" : "") +
          "</p>" +
          actions +
          "</div>";
      }
      box.classList.remove("prot");
    }
    async function upload(canvas) {
      if (needAccount()) return;
      properPhoto(canvas);
      const acc = accGet() || {};
      const [image, thumb] = await Promise.all([canvasToJpeg(canvas, 0.7), makeThumb(canvas, 220, 0.62)]);
      const res = await fetch("/api/album", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: acc.token,
          image,
          thumb,
          source: "camera",
          share: Boolean(shareChoice || albumMeta.published),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        const err = new Error(data.error || "The picture was not saved.");
        err.rejected = Boolean(data.rejected);
        err.pending = Boolean(data.pending);
        throw err;
      }
      await refreshCount();
      tab = data.pending || !data.publish_locked ? "mine" : "all";
      const statusNote = data.note
        ? data.note
        : data.pending || data.moderation_status === "pending"
          ? "This photo needs a review before it can be shared. It stays private and is not published."
          : data.publish_locked
            ? "Approved and published. This photo cannot be made private, edited, or deleted."
            : "Approved and saved privately to " + (acc.email || "your email") + ". Only you can see it until you share the album.";
      last = {
        thumb,
        ts: Date.now(),
        note: statusNote,
        heading: data.pending ? "Waiting for review" : data.duplicate ? "Already in your album" : "Saved to your photo binder",
      };
      if (view === "saved") {
        const head = box.querySelector("h2");
        const note = box.querySelector("#sst");
        const btn = box.querySelector('[data-a="album"]');
        const shot = box.querySelector(".ph canvas.shot");
        if (head) head.textContent = last.heading;
        if (note) note.textContent = last.note;
        if (btn) btn.textContent = "Open the photo binder (" + count + ")";
        if (shot && thumb) {
          const im = document.createElement("img");
          im.src = thumb;
          im.alt = "The picture you just took";
          shot.replaceWith(im);
        }
        canvas.width = 0;
        canvas.height = 0;
        return;
      }
      canvas.width = 0;
      canvas.height = 0;
      await setView("saved", last);
    }
    function closeCam() {
      stop();
      box.hidden = true;
      view = "";
      cb.focus({ preventScroll: true });
    }
    openCamera = () => {
      box.hidden = false;
      primeCamera();
      refreshCount();
      setView("camera");
    };
    cb.onclick = () => openCamera();
    alb.onclick = async () => {
      if (!count) return;
      box.hidden = false;
      tab = "all";
      await setView("album");
    };
    box.addEventListener("click", async (e) => {
      const t = e.target.closest("[data-a]");
      if (e.target === box && view !== "camera") {
        closeCam();
        return;
      }
      if (!t) return;
      const a = t.dataset.a;
      if (a === "close") closeCam();
      else if (a === "cam") {
        if (needAccount()) return;
        setView("camera");
      } else if (a === "album") {
        setView("album");
      } else if (a === "back") setView(count ? "album" : "welcome");
      else if (a === "signin") {
        box.hidden = true;
        openAcc(null, "login");
      } else if (a === "tab") {
        tab = t.dataset.t === "mine" ? "mine" : "all";
        if (tab === "mine" && needAccount()) return;
        setView("album");
      } else if (a === "flip") {
        facing = facing === "user" ? "environment" : "user";
        stop();
        setView("camera");
      } else if (a === "shot") {
        if (shooting) return;
        const video = box.querySelector("#cvid");
        const msg = box.querySelector("#cmsg");
        const showMsg = (text) => {
          if (!msg) return;
          msg.hidden = false;
          msg.classList.remove("busy");
          const p = msg.querySelector("p");
          if (p) p.textContent = text;
        };
        if (needAccount()) return;
        if (!video || !video.videoWidth) {
          showMsg("The camera is not ready yet. Wait a moment, then take the picture.");
          return;
        }
        shooting = true;
        const frame = box.querySelector(".cv");
        if (frame) frame.classList.add("fl");
        let c = null;
        try {
          c = frameFromVideo(video, 512);
          properPhoto(c);
        } catch (ex) {
          if (frame) frame.classList.remove("fl");
          shooting = false;
          showMsg(ex.message || "This photo cannot be saved. Only a legal photo is allowed.");
          return;
        }
        stop();
        last = {
          thumb: "",
          ts: Date.now(),
          note: "Saving your photo…",
          heading: "Photo taken",
        };
        await setView("saved", last);
        const preview = box.querySelector(".ph img");
        if (preview) {
          c.className = "shot";
          preview.replaceWith(c);
        }
        shooting = false;
        upload(c).catch((ex) => {
          const head = box.querySelector("h2");
          const note = box.querySelector("#sst");
          if (head) head.textContent = "This photo was not saved";
          if (note) note.textContent = ex.message || "This photo cannot be saved. Only a legal photo is allowed.";
        });
      } else if (a === "view" && t.dataset.id) {
        const acc = accGet() || {};
        const res = await fetch("/api/album?id=" + encodeURIComponent(t.dataset.id) + (acc.token ? "&token=" + encodeURIComponent(acc.token) : ""));
        const data = await res.json().catch(() => ({}));
        if (data.photo) setView("view", data.photo);
        else alert((data && data.error) || "That picture was not found.");
      } else if (a === "share-locked") {
        const hint = box.querySelector("#shhint");
        const message = "This album is public. Sharing is permanent and cannot be reversed.";
        if (hint) hint.textContent = message;
        else alert(message);
      } else if (a === "share-album") {
        if (needAccount()) return;
        const ok = confirm("Publish this album? Every photo is checked first. If any photo is still in review or was not approved, the album stays private. Once it is public, you cannot make it private or delete its photos.");
        if (!ok) return;
        const acc = accGet() || {};
        const button = t;
        button.disabled = true;
        const res = await fetch("/api/album", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: acc.token, action: "publish_album", confirm: true, confirm_public: true }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok || !data.publish_locked) {
          button.disabled = false;
          alert((data && data.error) || "The album was not published.");
          return;
        }
        albumMeta.published = true;
        albumMeta.private = false;
        await refreshCount();
        setView(view === "album" ? "album" : "welcome");
      } else if (a === "publish" && t.dataset.id) {
        if (!confirm("Publish this photo to the family album? Once public, you cannot make it private or delete it.")) return;
        const acc = accGet() || {};
        const res = await fetch("/api/album", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: acc.token, action: "publish", id: t.dataset.id, confirm: true, confirm_public: true }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok || !data.publish_locked) {
          alert((data && data.error) || "The photo was not published.");
          return;
        }
        await refreshCount();
        setView("album");
      } else if (a === "delphoto" && t.dataset.id) {
        if (!confirm("Delete this private photo from your binder? This cannot be undone.")) return;
        const acc = accGet() || {};
        const res = await fetch("/api/album", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: acc.token, action: "delete", id: t.dataset.id }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) { alert(data.error || "The photo was not deleted."); return; }
        await refreshCount();
        setView("album");
      }
    });
    box.addEventListener("change", (e) => {
      if (e.target.id !== "shon") return;
      if (albumMeta.published) {
        e.target.checked = true;
        shareChoice = true;
        return;
      }
      if (e.target.checked) {
        const agreed = confirm(
          "Share the next photos you take while this is checked? After a photo is approved it is published, and you cannot make that photo private or delete it. Photos already in your album are not changed.",
        );
        if (!agreed) {
          e.target.checked = false;
          shareChoice = false;
          return;
        }
      }
      shareChoice = e.target.checked;
    });
    refreshCount();
  }

  // ROOMS. Checkout makes a 6 digit password. Each password opens its own sheet where students pick sizes, write name and phone and quantities. Totals and the 50% deposit are automatic.
  const RS = ["XS", "S", "M", "L", "XL", "XXL", "3XL"],
    rstore = { db: null },
    rkey = (c) => "lcroom" + c;
  (async () => {
    try {
      rstore.db = await window.claude.use("db");
    } catch (e) {}
  })();
  function rLocal(c) {
    try {
      const local = JSON.parse(localStorage.getItem(rkey(c)) || "null");
      if (local && local.items) return local;
    } catch (e) {}
    return null;
  }
  function roomCode(v) {
    return String(v || "")
      .replace(/\D/g, "")
      .slice(0, 6);
  }
  async function rGet(c) {
    c = roomCode(c);
    if (!/^\d{6}$/.test(c)) return null;
    const res = await fetch("/api/room?code=" + encodeURIComponent(c), { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.room && data.room.items) {
      try {
        localStorage.setItem(rkey(c), JSON.stringify(data.room));
      } catch (e) {}
      return data.room;
    }
    if (res.status === 404) return rLocal(c);
    if (data && data.error) {
      const err = new Error(data.error);
      err.status = res.status;
      throw err;
    }
    return rLocal(c);
  }
  async function rPut(c, d) {
    try {
      localStorage.setItem(rkey(c), JSON.stringify(d));
    } catch (e) {}
    const acc = typeof accGet === "function" ? accGet() || {} : {};
    const res = await fetch("/api/room", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: c,
        items: d.items,
        rows: d.rows || [],
        ex: d.ex || null,
        customer_email: acc.email || "",
        customer_name: acc.name || "",
        customer_phone: acc.phone || "",
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) throw new Error((data && data.error) || "The room was not saved for other people.");
    return true;
  }
  function roomCsv(it, rows, rt) {
    const q = (v) => '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"';
    const h = [
      "Name",
      "Phone",
      ...it.map((x) => x.n + " size"),
      ...it.map((x) => x.n + " qty"),
      "Full payment",
      "Deposit 50%",
      "Balance",
    ];
    const L = [h.map(q).join(",")];
    rows.forEach((x) => {
      const v = rt(x);
      L.push(
        [x.n, x.p, ...x.l.map((l) => l.s), ...x.l.map((l) => l.q), v, v / 2, v / 2].map(q).join(","),
      );
    });
    const tt = rows.reduce((a, x) => a + rt(x), 0);
    L.push(["TOTAL", "", ...it.map(() => ""), ...it.map(() => ""), tt, tt / 2, tt / 2].map(q).join(","));
    if (typeof roomSummaryLines === "function") {
      roomSummaryLines(it, rows, rt).forEach((line) => L.push(line.map(q).join(",")));
    }
    return L.join("\r\n");
  }
  function roomSummaryLines(it, rows, rt) {
    const counts = it.map((x, k) => {
      const cn = RS.map((z) => rows.reduce((a, r) => a + (r.l[k] && r.l[k].s === z ? +r.l[k].q || 0 : 0), 0));
      const n = cn.reduce((a, b) => a + b, 0);
      return { n: x.n, cn, pieces: n, price: +x.p || 0, total: n * (+x.p || 0) };
    });
    const lines = [
      [],
      ["SUMMARY: PIECES OF EACH SIZE, PERSONAL TOUCHES AND DELIVERY"],
      ["Item", ...RS, "Total pieces", "Unit price", "Item total"],
    ];
    counts.forEach((o) => lines.push([o.n, ...o.cn, o.pieces, o.price, o.total]));
    const grandPieces = counts.reduce((a, o) => a + o.pieces, 0);
    const bySize = RS.map((z, j) => counts.reduce((a, o) => a + o.cn[j], 0));
    const moneyTotal = rows.reduce((a, x) => a + rt(x), 0);
    lines.push(["Grand total", ...bySize, grandPieces, "", moneyTotal]);
    return lines;
  }
  function saveRoomFile(name, csv) {
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 1500);
  }
  async function mailRoomSheet(c, it, rows, rt, csv, note) {
    if (note) {
      note.hidden = false;
      note.textContent = "Sending the Excel…";
    }
    const tt = rows.reduce((a, x) => a + rt(x), 0);
    const filled = rows.filter((x) => (x.n || "").trim() || (x.p || "").trim());
    const fields = {
      order_summary:
        "Seniors class sheet\nRoom password: " +
        c +
        "\nOpen Seniors, then Rooms, and enter this password to see the names.\n\n" +
        csv,
      products: it.map((x) => "- " + x.n + ": " + money(x.p)).join("\n") || "—",
      quantities:
        (filled.length ? filled : rows)
          .map((x) => "- " + (x.n || "Student") + (x.p ? " · " + x.p : ""))
          .join("\n") || "—",
      total_price: "Room " + c + " · " + money(tt),
    };
    const file = new File([new Blob(["\ufeff" + csv], { type: "text/csv" })], "room-" + c + ".csv", {
      type: "text/csv",
    });
    try {
      await rPut(c, { items: it, rows });
      await sendQuoteEmails(fields, file);
      if (note) {
        note.textContent =
          "Excel sent by email. Password " + c + " opens this sheet again with the same names.";
      }
    } catch (err) {
      if (note) {
        note.textContent =
          "The email was not sent. " + ((err && err.message) || "Download the Excel and try again.");
      }
    }
  }
  async function roomCheckout() {
    const out = pg.querySelector("#out") || $("#out");
    if (out) {
      out.innerHTML = '<pre></pre><button id="cp">Copy summary</button>';
      const pre = out.querySelector("pre");
      if (pre) pre.textContent = txtOut;
    }
    let extra = "";
    try {
      const q = SV[cur] && SV[cur].q[0];
      const it = q
        ? [...pg.querySelectorAll('input[name="q0"]:checked')]
            .map((x) => +x.value)
            .filter((k) => k < q.o.length)
            .map((k) => {
              const o = q.o[k];
              const p = Array.isArray(o[1]) ? o[1][0] : +o[1] || 0;
              return { n: o[0], p };
            })
        : [];
      if (it.length) {
        const q1 = SV[cur].q[1],
          q2 = SV[cur].q[2],
          a1 = ans[1] || [],
          dk = (ans[2] || [])[0],
          dop = dk != null && q2 && dk < q2.o.length ? q2.o[dk] : null;
        const ex = {
          t: q1
            ? a1.filter((k) => k < q1.o.length).map((k) => ({ n: q1.o[k][0], p: +q1.o[k][1] || 0 }))
            : [],
          ct: q1 ? a1.some((k) => k >= q1.o.length) : false,
          dl: dop ? dop[0] : "",
          pc: dop && dop[5] ? +dop[1] || 0 : 0,
        };
        let c,
          n = 0;
        do {
          c = String(Math.floor(100000 + Math.random() * 900000));
          n++;
        } while (n < 20 && (await rGet(c)));
        await rPut(c, { items: it, rows: [], ex });
        rstore.auto = c;
        try {
          localStorage.setItem("lclast", c);
        } catch (e) {}
        extra = "\n\nRoom password: " + c;
        if (out) {
          const box = document.createElement("div");
          box.className = "pwbox";
          box.innerHTML =
            "<small>Your room password</small><b>" +
            c +
            '</b><p class="m">Give this password to your class. Each student opens the same sheet from the Rooms page, writes a name and phone, and picks sizes. Download the Excel or email it. The password opens this sheet again so you can see every name.</p><button id="ropen" data-c="' +
            c +
            '">Open the sheet</button>';
          out.appendChild(box);
        }
      }
    } catch (e) {
      extra = "";
      if (out) {
        const note = document.createElement("p");
        note.className = "m";
        note.textContent = (e && e.message) || "The room password was not saved. Try the order again.";
        out.appendChild(note);
      }
    }
    mailQuote(extra);
  }
  // EmailJS. Paste the three IDs from https://dashboard.emailjs.com (Account → General for Public Key, Email Services for Service ID, Email Templates for Template ID).
  const EMAILJS_PUBLIC_KEY = "mJF5b2OR8PYShW5wd";
  const EMAILJS_SERVICE_ID = "service_7cpdfst";
  const EMAILJS_TEMPLATE_ID = "template_w9j36v9";
  function loadScript(src, ok) {
    return new Promise((resolve, reject) => {
      if (ok()) return resolve();
      const s = document.createElement("script");
      s.src = src;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("Failed to load " + src));
      document.head.appendChild(s);
    });
  }
  function qtyRow(r) {
    return /^x\s/i.test(r.val) || /how many|students|pieces|hours/i.test(r.q);
  }
  function formatQuoteFields(pack) {
    const lines = (pack.rows || []).map((r) => "- " + r.item + " (" + r.q + "): " + r.val);
    const products = (pack.rows || [])
      .filter((r) => !qtyRow(r))
      .map((r) => "- " + r.item + ": " + r.val);
    const quantities = (pack.rows || []).filter(qtyRow).map((r) => "- " + r.q + ": " + r.val);
    const extra = pack.extra ? "\n" + pack.extra.trim() : "";
    return {
      order_summary:
        pack.title +
        "\n\n" +
        lines.join("\n") +
        "\n\n" +
        pack.total +
        extra,
      products: products.join("\n") || "—",
      quantities: quantities.join("\n") || "—",
      total_price: pack.total,
    };
  }
  async function makeQuotePdf(pack) {
    await loadScript("https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js", () =>
      Boolean(window.jspdf && window.jspdf.jsPDF),
    );
    const JsPDF = window.jspdf.jsPDF;
    const doc = new JsPDF({ unit: "pt", format: "a4" });
    const f = formatQuoteFields(pack);
    const w = 515,
      x = 48;
    let y = 56;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Lay C Factory", x, y);
    y += 22;
    doc.setFontSize(13);
    doc.text(pack.title || "Quote", x, y);
    y += 28;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Order summary", x, y);
    y += 16;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    const wrap = (label, body) => {
      doc.setFont("helvetica", "bold");
      doc.text(label, x, y);
      y += 16;
      doc.setFont("helvetica", "normal");
      const text = doc.splitTextToSize(body || "—", w);
      doc.text(text, x, y);
      y += text.length * 14 + 14;
      if (y > 760) {
        doc.addPage();
        y = 56;
      }
    };
    wrap("Products", f.products);
    wrap("Quantities", f.quantities);
    wrap("Total", f.total_price);
    if (pack.extra) wrap("Notes", pack.extra.trim());
    wrap("Full summary", f.order_summary);
    const blob = doc.output("blob");
    return new File([blob], "Lay C-quote.pdf", { type: "application/pdf" });
  }
  function offerPdfDownload(file) {
    const out = pg.querySelector("#out") || $("#out");
    if (!out || !file) return;
    let a = out.querySelector("#pdfdl");
    if (!a) {
      a = document.createElement("a");
      a.id = "pdfdl";
      a.innerHTML =
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 3v12l4-4 1.4 1.4L12 18.8 6.6 12.4 8 11l4 4V3h0zm-7 16h14v2H5v-2z"/></svg><span>Download PDF</span>';
      const cp = out.querySelector("#cp");
      if (cp) cp.after(a);
      else out.insertBefore(a, out.firstChild);
    }
    if (a.dataset.url) {
      try {
        URL.revokeObjectURL(a.dataset.url);
      } catch (e) {}
    }
    const url = URL.createObjectURL(file);
    a.dataset.url = url;
    a.href = url;
    a.download = file.name || "Lay C-quote.pdf";
    a.setAttribute("aria-label", "Download order PDF");
  }
  async function sendQuoteEmail(fields, file, toEmail) {
    const svc = SV[cur] && SV[cur].n ? SV[cur].n : "Lay C";
    const acc = accGet() || {};
    const client = (acc.email || "").trim();
    const details = customerBlock(acc);
    const textParams = {
      to_email: toEmail || "eyadellithy80@gmail.com",
      service: svc,
      order_summary: fields.order_summary,
      products: fields.products,
      quantities: fields.quantities,
      total_price: fields.total_price,
      customer_details: details || svc,
      customer_name: (acc.name || "").trim(),
      customer_phone: (acc.phone || "").trim(),
      customer_email: client,
      client_email: client,
    };
    const fd = new FormData();
    fd.append("service_id", EMAILJS_SERVICE_ID);
    fd.append("template_id", EMAILJS_TEMPLATE_ID);
    fd.append("user_id", EMAILJS_PUBLIC_KEY);
    Object.keys(textParams).forEach((k) => fd.append(k, textParams[k]));
    if (file) fd.append("quote_pdf", file, file.name);
    const formRes = await fetch("https://api.emailjs.com/api/v1.0/email/send-form", {
      method: "POST",
      body: fd,
    });
    if (formRes.ok) return;
    const formErr = await formRes.text();
    let b64 = "";
    if (file) {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const step = 0x8000;
      for (let i = 0; i < bytes.length; i += step) {
        b64 += String.fromCharCode.apply(null, bytes.subarray(i, i + step));
      }
      b64 = btoa(b64);
    }
    const jsonRes = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY,
        template_params: textParams,
        attachments: file ? [{ filename: file.name, data: b64 }] : [],
      }),
    });
    if (jsonRes.ok) return;
    throw new Error((await jsonRes.text()) || formErr || "send failed");
  }
  async function sendQuoteEmails(fields, file) {
    const shop = "eyadellithy80@gmail.com";
    const acc = accGet() || {};
    const client = (acc.email || "").trim();
    await sendQuoteEmail(fields, file, shop);
    if (client && client.toLowerCase() !== shop) {
      try {
        await sendQuoteEmail(fields, null, client);
      } catch (e) {}
    }
  }
  function orderLines() {
    const s = SV[cur];
    const lines = [];
    if (!s || !s.q) return lines;
    s.q.forEach((q, j) => {
      if (q.ug) {
        ["S", "A", "B"].forEach((c) => {
          const n = mbv["ug" + c];
          if (n > 0)
            lines.push({
              name: UG[c].n,
              question: q.t,
              quantity: n,
              custom: c === "S",
              line_total: c === "S" ? "" : ugPrice(c, n),
            });
        });
        return;
      }
      if (q.bt) {
        MBP.forEach((nm, i) => {
          const v = mbv.b[i];
          if (v > 0)
            lines.push({
              name: nm,
              question: q.t,
              quantity: 1,
              daily: v,
              days: mbv.d,
              months: mbv.m,
              line_total: v * mbv.d * mbv.m,
            });
        });
        return;
      }
      if (q.sp) {
        if (q.sp === "si")
          lines.push({ name: mbv.si + " items sold now", question: q.t, quantity: mbv.si });
        else if (q.sp === "sw")
          lines.push({ name: mbv.sw + " items expected", question: q.t, quantity: mbv.sw });
        else if (q.sp === "d")
          lines.push({ name: mbv.d + " days per month", question: q.t, quantity: mbv.d });
        else if (q.sp === "m")
          lines.push({ name: mbv.m + (mbv.m > 1 ? " months" : " month"), question: q.t, quantity: mbv.m });
        else if (q.sp === "am" && mbv.am)
          lines.push({
            name: "Personal account manager",
            question: q.t,
            quantity: mbv.m,
            line_total: 10000 * mbv.m,
          });
        return;
      }
      if (q.h) {
        lines.push({ name: "Studio hours", question: q.t, quantity: hrs, hours: hrs });
        return;
      }
      (ans[j] || []).forEach((k) => {
        if (k === q.o.length) {
          const detail = (oth[j] || "").trim();
          lines.push({
            name: "Other",
            question: q.t,
            quantity: q.x ? parseFloat(detail) || 1 : 1,
            custom: true,
            detail,
          });
          return;
        }
        const o = q.o[k];
        const dd = det[j + "-" + k] || {};
        lines.push({
          name: o[0],
          question: q.t,
          quantity: q.x ? o[1] : dd.n || 1,
          hours: q.h ? hrs : undefined,
          custom: typeof o[1] === "string",
          detail: dd.text || "",
        });
      });
    });
    return lines;
  }
  async function mailQuote(extra) {
    const box = $("#out");
    if (!box) return;
    const note = document.createElement("p");
    note.className = "m";
    note.textContent = "Sending your order…";
    box.appendChild(note);
    const acc = accGet() || {};
    quotePack.extra = [extra || "", customerBlock(acc)].filter(Boolean).join("\n");
    const fields = formatQuoteFields(quotePack);
    const s = SV[cur] || {};
    const idempotency_key =
      (crypto.randomUUID && crypto.randomUUID()) || String(Date.now()) + Math.random();
    try {
      const file = await makeQuotePdf(quotePack);
      offerPdfDownload(file);
      const saved = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: s.slug,
          service: s.n,
          lines: orderLines(),
          hours: hrs,
          extra: quotePack.extra,
          idempotency_key,
          customer_name: acc.name || "",
          customer_email: acc.email || "",
          customer_phone: acc.phone || "",
          token: acc.token || "",
          delivery_address: "",
          email_fields: fields,
        }),
      });
      const data = await saved.json().catch(() => ({}));
      const dbReady = saved.ok && data.ok;
      if (!dbReady) {
        const missingDb = /Supabase is not configured/i.test(data.error || "");
        if (!missingDb) throw new Error(data.error || "save failed");
        await sendQuoteEmails(fields, file);
        note.textContent =
          "Quote emailed. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to the .env file to save orders.";
        return;
      }
      if (!data.email_sent) {
        try {
          await sendQuoteEmails(fields, file);
          note.textContent =
            "Order saved. Notification sent. Click Download PDF to open the quote.";
          return;
        } catch (mailErr) {
          note.textContent =
            "Order saved, but the email notification failed. Click Download PDF to keep a copy.";
          return;
        }
      }
      note.textContent =
        "Order saved and sent as a PDF. Click Download PDF to open it, or open the file in your email.";
    } catch (err) {
      note.textContent =
        "The order was not saved. " +
        ((err && err.message) || "Please try again in a moment.");
    }
  }
  function roomEntry() {
    if (pg.querySelector("#pwin")) return;
    const h = pg.querySelector(".hd");
    if (!h) return;
    const d = document.createElement("div");
    d.className = "pwbox";
    d.innerHTML =
      '<small>Already have a room password?</small><div class="pwrow"><input id="pwin" inputmode="numeric" maxlength="6" placeholder="6 digit password" aria-label="Room password"><button id="pwgo" type="button">Open sheet</button></div><p class="m" id="pwerr" hidden>No sheet found for that password.</p>';
    h.after(d);
    const c = pg.querySelector(".cols");
    if (c) c.remove();
  }
  function roomWin() {
    const w = pg.querySelector('.win[data-i="9"]');
    if (!w) return;
    const d = document.createElement("div");
    d.className = "win";
    d.innerHTML =
      '<span class="wt">Rooms</span><span class="wd">Enter the 6 digit password you got at checkout to open your class order sheet.</span><div class="pwrow" style="width:100%"><input id="pwin" inputmode="numeric" maxlength="6" placeholder="6 digit password" aria-label="Room password"><button id="pwgo" type="button">Open</button></div><span class="wg" id="pwerr" hidden>No sheet found for that password.</span>';
    w.replaceWith(d);
    const n = d.querySelector("#pwin");
    try {
      n.value = localStorage.getItem("lclast") || "";
    } catch (e) {}
    const go1 = () => {
      d.querySelector("#pwerr").hidden = true;
      roomSheet(roomCode(n.value));
    };
    ["click", "input", "change", "keydown"].forEach((v) =>
      d.addEventListener(v, (e) => {
        e.stopPropagation();
        if (v === "input") d.querySelector("#pwerr").hidden = true;
        if (v === "click" && e.target.closest("#pwgo")) go1();
        if (v === "keydown" && e.key === "Enter") go1();
      }),
    );
  }
  const _sh = show;
  show = function (i) {
    _sh(i);
    syncAccPanel();
    if (SV[i] && SV[i].slug === "seniors") roomWin();
    if (SV[i] && SV[i].slug === "seniors-rooms") {
      roomEntry();
      let l = rstore.auto;
      if (!l)
        try {
          l = localStorage.getItem("lclast");
        } catch (e) {}
      const n = pg.querySelector("#pwin");
      if (n && l) n.value = l;
      if (rstore.auto) {
        const c = rstore.auto;
        rstore.auto = null;
        roomSheet(c);
      }
    }
  };
  async function roomSheet(c) {
    c = roomCode(c);
    let r = null;
    try {
      r = await rGet(c);
    } catch (ex) {
      const e = pg.querySelector("#pwerr");
      if (e) {
        e.hidden = false;
        e.textContent = (ex && ex.message) || "The room could not be opened.";
      }
      return;
    }
    if (!r) {
      const e = pg.querySelector("#pwerr");
      if (e) {
        e.hidden = false;
        e.textContent = "No sheet found for that password.";
      }
      return;
    }
    const it = r.items,
      N = it.length,
      EX = Object.assign({ t: [], ct: false, dl: "", pc: 0 }, r.ex || {}),
      T = EX.t.reduce((a, x) => a + (+x.p || 0), 0),
      PC = +EX.pc || 0,
      tl = EX.t.length
        ? EX.t.map((x) => x.n + " " + money(x.p)).join(" + ") + (EX.ct ? " + custom, priced later" : "")
        : EX.ct
          ? "Custom, priced later"
          : "None",
      dlab = (EX.dl || "Standard delivery") + (PC ? " +" + PC + "%" : "");
    let rows = (r.rows || []).map((x) => ({
        ...x,
        l: x.l.map((l) => ({ ...l, s: RS.includes(l.s) ? l.s : "M", q: Math.max(1, Math.floor(+l.q || 1)) })),
      })),
      t = 0;
    const blank = () => ({ n: "", p: "", l: it.map(() => ({ s: "M", q: 1 })) });
    if (!rows.length) rows = [blank()];
    pg.innerHTML =
      '<div class="wrap"><div class="bar"><button class="back" id="rback">&larr; Back</button></div><div class="hd"><span>ROOM ' +
      c +
      '</span><h1>Class order sheet</h1><p>Write each student\'s name and phone, then choose a size and quantity. The minimum is 1 of each item. Download the Excel or email it. Password <b>' +
      c +
      '</b> opens this same sheet again.</p></div><div id="shx"><div class="shw"><table class="sht"><thead><tr><th>#</th><th>Name</th><th>Phone</th>' +
      it.map((x) => "<th>" + esc(x.n) + "<small>" + money(x.p) + "</small></th>").join("") +
      "<th>Personal touches<small>" +
      esc(tl) +
      "</small></th><th>Delivery fee<small>" +
      esc(dlab) +
      '</small></th><th>Full payment</th><th>Deposit 50%</th><th>Balance</th><th></th></tr></thead><tbody></tbody><tfoot><tr><td colspan="' +
      (3 + N) +
      '">All customers</td><td id="tt"></td><td id="tdl"></td><td id="tf"></td><td id="td"></td><td id="tb"></td><td></td></tr></tfoot></table></div><div class="shb"><button id="radd" type="button">+ Add customer</button><button id="rdl" type="button">Download Excel</button><button id="rml" type="button">Email Excel</button></div><h2 class="sh2">Summary: pieces of each size, personal touches and delivery</h2><p class="m">Updates automatically as customers fill in the sheet. Sizes available: ' +
      RS.join(", ") +
      '.</p><div class="shw"><table class="sht" id="sumt"><thead><tr><th>Item</th>' +
      RS.map((z) => "<th>" + z + "</th>").join("") +
      '<th>Total pieces</th><th>Unit price</th><th>Item total</th></tr></thead><tbody id="sumb"></tbody><tfoot><tr id="sumf"></tr></tfoot></table></div><p class="m" id="rnote" hidden></p></div></div>';
    const tb = pg.querySelector("tbody"),
      sx = pg.querySelector("#shx");
    let tm;
    const it0 = (x) => x.l.reduce((a, l, k) => a + (+l.q || 0) * it[k].p, 0),
      dl = (x) => ((it0(x) + T) * PC) / 100,
      rt = (x) => it0(x) + T + dl(x);
    const sumRows = () =>
      it.map((x, k) => {
        const cn = RS.map((z) => rows.reduce((a, row) => a + (row.l[k] && row.l[k].s === z ? +row.l[k].q || 0 : 0), 0));
        const n = cn.reduce((a, b) => a + b, 0);
        return { x, cn, n, m: n * (+x.p || 0) };
      });
    const exRows = () => {
      const n = rows.length;
      const o = EX.t.map((x) => ({ n: "Personal touch: " + x.n, u: +x.p || 0, c: n + " students", m: (+x.p || 0) * n }));
      if (EX.ct) o.push({ n: "Custom personal touch", u: "Priced later", c: "", m: 0 });
      o.push({
        n: "Delivery: " + (EX.dl || "Standard delivery") + (PC ? " (" + PC + "% fee)" : ""),
        u: PC ? PC + "%" : money(0),
        c: "",
        m: rows.reduce((a, x) => a + dl(x), 0),
      });
      return o;
    };
    const sumDraw = () => {
      const R = sumRows(),
        E = exRows(),
        tb2 = pg.querySelector("#sumb"),
        tf2 = pg.querySelector("#sumf");
      if (!tb2 || !tf2) return;
      tb2.innerHTML =
        R.map(
          (o) =>
            "<tr><td>" +
            esc(o.x.n) +
            "</td>" +
            o.cn.map((v) => "<td" + (v ? "" : ' class="z"') + ">" + v + "</td>").join("") +
            "<td><b>" +
            o.n +
            "</b></td><td>" +
            money(+o.x.p || 0) +
            "</td><td><b>" +
            money(o.m) +
            "</b></td></tr>",
        ).join("") +
        E.map(
          (o) =>
            "<tr><td>" +
            esc(o.n) +
            "</td>" +
            RS.map(() => '<td class="z">-</td>').join("") +
            "<td>" +
            (o.c === "" ? "" : "<b>" + o.c + "</b>") +
            "</td><td>" +
            (typeof o.u === "number" ? money(o.u) : esc(o.u)) +
            "</td><td><b>" +
            money(o.m) +
            "</b></td></tr>",
        ).join("");
      tf2.innerHTML =
        "<td>Grand total</td>" +
        RS.map((z, j) => "<td>" + R.reduce((a, o) => a + o.cn[j], 0) + "</td>").join("") +
        "<td>" +
        R.reduce((a, o) => a + o.n, 0) +
        "</td><td></td><td>" +
        money(R.reduce((a, o) => a + o.m, 0) + E.reduce((a, o) => a + o.m, 0)) +
        "</td>";
    };
    const save = () => {
      clearTimeout(tm);
      tm = setTimeout(() => rPut(c, { items: it, rows, ex: EX }), 400);
    };
    const sums = () => {
      let f = 0;
      rows.forEach((x, i) => {
        const v = rt(x),
          tr = tb.children[i];
        f += v;
        tr.querySelector(".tt").textContent = money(T);
        tr.querySelector(".tdl").textContent = money(dl(x));
        tr.querySelector(".tf").textContent = money(v);
        tr.querySelector(".td").textContent = money(v / 2);
        tr.querySelector(".tbl").textContent = money(v / 2);
      });
      pg.querySelector("#tt").textContent = money(T * rows.length);
      pg.querySelector("#tdl").textContent = money(rows.reduce((a, x) => a + dl(x), 0));
      pg.querySelector("#tf").textContent = money(f);
      pg.querySelector("#td").textContent = money(f / 2);
      pg.querySelector("#tb").textContent = money(f / 2);
      sumDraw();
    };
    const draw = () => {
      tb.innerHTML = rows
        .map(
          (x, i) =>
            '<tr data-i="' +
            i +
            '"><td>' +
            (i + 1) +
            '</td><td><input data-f="n" value="' +
            esc(x.n) +
            '" placeholder="Name"></td><td><input data-f="p" type="tel" value="' +
            esc(x.p) +
            '" placeholder="Phone"></td>' +
            x.l
              .map(
                (l, k) =>
                  '<td class="itc"><select data-k="' +
                  k +
                  '" data-f="s">' +
                  RS.map(
                    (z) => "<option" + (z === l.s ? " selected" : "") + ">" + z + "</option>",
                  ).join("") +
                  '</select><input data-k="' +
                  k +
                  '" data-f="q" type="number" min="1" step="1" value="' +
                  Math.max(1, l.q || 1) +
                  '" aria-label="Quantity"></td>',
              )
              .join("") +
            '<td class="tt"></td><td class="tdl"></td><td class="tf"></td><td class="td"></td><td class="tbl"></td><td><button type="button" class="rx" data-del="' +
            i +
            '" aria-label="Remove">&times;</button></td></tr>',
        )
        .join("");
      sums();
    };
    const stop = (e) => e.stopPropagation();
    sx.addEventListener("input", (e) => {
      stop(e);
      const t = e.target,
        tr = t.closest("tr");
      if (!tr) return;
      const x = rows[+tr.dataset.i];
      if (t.dataset.k != null) {
        const l = x.l[+t.dataset.k];
        if (t.dataset.f === "q") l.q = Math.max(1, Math.floor(+t.value || 1));
        else l.s = t.value;
      } else x[t.dataset.f] = t.value;
      sums();
      save();
    });
    sx.addEventListener("change", (e) => {
      stop(e);
      const t = e.target,
        tr = t.closest("tr");
      if (tr && t.dataset.f === "q") {
        const l = rows[+tr.dataset.i].l[+t.dataset.k];
        t.value = l.q;
      }
    });
    sx.addEventListener("click", (e) => {
      stop(e);
      const t = e.target;
      if (t.id === "radd") {
        rows.push(blank());
        draw();
        save();
      } else if (t.dataset.del != null) {
        rows.splice(+t.dataset.del, 1);
        if (!rows.length) rows.push(blank());
        draw();
        save();
      } else if (t.id === "rdl" || t.id === "rml") {
        const csv = roomCsv(it, rows, rt);
        const note = pg.querySelector("#rnote");
        // Flush sheet to Supabase so admin Orders has the same Excel copy.
        rPut(c, { items: it, rows, ex: EX }).catch(() => {});
        if (t.id === "rdl") {
          saveRoomFile("room-" + c + ".csv", csv);
          if (note) {
            note.hidden = false;
            note.textContent = "Excel downloaded. Open it in Excel, or use password " + c + " to open this sheet again.";
          }
        } else {
          mailRoomSheet(c, it, rows, rt, csv, note);
        }
      }
    });
    pg.querySelector("#rback").onclick = (e) => {
      e.stopPropagation();
      go(5);
    };
    draw();
    pg.scrollTop = 0;
  }
  pg.addEventListener("click", (e) => {
    const t = e.target;
    if (t.id === "ropen") roomSheet(roomCode(t.dataset.c));
    else if (t.id === "pwgo" || t.closest("#pwgo"))
      roomSheet(roomCode(pg.querySelector("#pwin").value));
  });
  pg.addEventListener("keydown", (e) => {
    if (e.target.id === "pwin" && e.key === "Enter") roomSheet(roomCode(e.target.value));
  });
  {
    const i = SV.findIndex((s) => s.slug === location.hash.slice(1));
    if (i >= 0) show(i);
  }
  // GUIDE. A scripted helper that answers from the same price data as the quote builders.
  const mas = $("#mas"),
    gd = $("#guide"),
    glog = $("#glog"),
    gch = $("#gchips"),
    gin = $("#gin");
  const calm = matchMedia("(prefers-reduced-motion:reduce)").matches;
  const nv = (i, j, k) => SV[i].q[j].o[k][1];
  const pr = (i, j, k) => {
    const v = nv(i, j, k);
    return Array.isArray(v)
      ? money(v[0]) + " to " + money(v[1])
      : typeof v === "string"
        ? "?*"
        : money(v);
  };
  let gStarted = false,
    gBusy = false,
    gCtx = -2;
  function gAdd(who, text, acts) {
    const d = document.createElement("div");
    d.className = "gm " + who;
    String(text)
      .split("\n")
      .forEach((t) => {
        const p = document.createElement("p");
        p.textContent = t;
        d.appendChild(p);
      });
    (acts || []).forEach((a) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "act";
      b.textContent = a[0] + " →";
      b.onclick = () => {
        gClose(true);
        go(a[1]);
      };
      d.appendChild(b);
    });
    glog.appendChild(d);
    glog.scrollTop = glog.scrollHeight;
    return d;
  }
  function gChips(list) {
    gch.innerHTML = "";
    list.forEach((c) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "chip";
      b.textContent = c[0];
      b.onclick = () => {
        gAdd("me", c[0]);
        c[1]();
      };
      gch.appendChild(b);
    });
  }
  function say(text, o) {
    o = o || {};
    gBusy = true;
    gch.innerHTML = "";
    const t = gAdd("bot typing", "...");
    setTimeout(
      () => {
        t.remove();
        gAdd("bot", text, o.acts);
        gBusy = false;
        gChips(o.chips || MENU());
      },
      calm ? 0 : 450,
    );
  }
  const ELSE = ["Something else", () => say("Sure. What else would you like to look at?")];
  function MENU() {
    return [
      ...(AI ? AIC() : []),
      ["Clothes or merch for my brand", fClothes],
      ["Uniforms for my graduating class", fSeniors],
      ["Logo or brand design", fDesign],
      ["Website or online store", fWeb],
      ["Marketing, ads or UGC", fMarket],
      ["Photo shoot or studio", fPhoto],
      ["I am not sure where to start", fStart],
    ];
  }
  function fStart() {
    say("No problem. Which of these sounds closest to what you want?", {
      chips: [
        ["Launch my own clothing brand", fBrand],
        ["Outfit a group like a class or team", fSeniors],
        ["Show my business online", () => fWebK(0)],
        ["Get great photos of my products", fShoot],
      ],
    });
  }
  function fBrand() {
    say(
      "A common path for a clothing brand has four steps:\n1. Designing: your logo and apparel graphics.\n2. Clothing manufacturing: making the pieces.\n3. Photo shoots: product photos.\n4. Web developing: an online store.\nYou can start anywhere. Where are you now?",
      {
        chips: [
          ["I have no logo or brand yet", fDesign],
          ["I have a design and want it made", fClothes],
          ["I have products and need photos", fPhoto],
          ["I want to sell online", fWeb],
        ],
      },
    );
  }
  function fClothes() {
    say(
      "Clothing manufacturing makes garments to order: T-shirts, polos, hoodies, jackets, hats, beanies and more. You choose the garment, fabric, decoration and packing, and how many pieces (50 to 1,000, or your own number).\nPrices are confirmed after we review your order, so the quote shows ?* for now. Do you already have a design?",
      {
        acts: [["Open the clothing quote", 1]],
        chips: [
          [
            "Yes, I have a design",
            () =>
              say(
                "Good. In the quote, pick the garment, fabric and decoration that match it, then send the quote and we will review your order and confirm the price.",
                {
                  acts: [["Open the clothing quote", 1]],
                  chips: [
                    ["Which decoration should I pick?", fPrint],
                    ["How many pieces should I order?", fQty],
                    ELSE,
                  ],
                },
              ),
          ],
          ["No, I need one made", fDesign],
          ["Which decoration should I pick?", fPrint],
          ["How many pieces should I order?", fQty],
        ],
      },
    );
  }
  function fPrint() {
    say(
      "A quick guide to decoration:\nScreen print: simple designs with few colors, good on bigger orders.\nEmbroidery: stitched logos, a premium look on polos, hats and jackets.\nDTF print: full-color, detailed artwork, works for smaller runs.\nPuff print: raised, 3D-looking print for bold shapes.\nRubber print: a soft, rubbery finish.\nNone: a plain garment.\nTell me what you are making and I can narrow it down.",
      {
        acts: [["Open the clothing quote", 1]],
        chips: [["How many pieces should I order?", fQty], ELSE],
      },
    );
  }
  function fQty() {
    say(
      "The quote offers 50, 100, 250, 500 or 1,000 pieces, and you can type your own number under Other. If you are testing a new design, 50 is a safe start. For a bigger run, we confirm the price per piece when we review your order.",
      {
        acts: [["Open the clothing quote", 1]],
        chips: [["Which decoration should I pick?", fPrint], ELSE],
      },
    );
  }
  function fSeniors() {
    say(
      `Seniors uniform is for graduating classes. Every student also gets a free hat. You choose what each student receives (for example a T-shirt at ${pr(8, 0, 0)} or a hoodie at ${pr(8, 0, 3)}), add personal touches like a printed name, and tell us how many students there are. Prices are per student.\nHow many students are in the class?`,
      {
        acts: [["Open the seniors quote", 8]],
      chips: [
          ["Under 50", () => fSN(0)],
          ["50 to 100", () => fSN(1)],
          ["Over 100", () => fSN(2)],
          ["Not sure yet", () => fSN(3)],
        ],
      },
    );
  }
  function fSN(k) {
    const tx = [
      "With under 50 students there is no class discount. At 50 students the class gets 5% off.",
      "You get the 5% class discount. Going over 100 students raises it to 10%.",
      "You get the 10% class discount, the biggest we offer.",
      "No problem, you can change the number in the quote any time. The discount is 5% for 50 to 100 students and 10% for over 100.",
    ][k];
    const pack = nv(8, 0, 0) + nv(8, 0, 3) + nv(8, 1, 0);
    say(
      tx +
        `\nA simple starter pack: a T-shirt, a hoodie and a printed name comes to ${money(pack)} per student before the discount, plus the free hat.`,
      {
        acts: [["Open the seniors quote", 8]],
        chips: [
          ["What are the personal touches?", fTouch],
          ["Jerseys and jackets?", fJJ],
          ["How fast can it be ready?", fRush],
          ELSE,
        ],
      },
    );
  }
  function fTouch() {
    say(
      `Name printed is ${pr(8, 1, 0)} per student, Name embroidered is ${pr(8, 1, 1)}, and a Metal piece is ${pr(8, 1, 2)}. Embroidery looks more premium, and printing is the cheaper choice.`,
      {
        acts: [["Open the seniors quote", 8]],
        chips: [["Jerseys and jackets?", fJJ], ["How fast can it be ready?", fRush], ELSE],
      },
    );
  }
  function fJJ() {
    say(
      `Jerseys are ${pr(8, 0, 2)} and jackets are ${pr(8, 0, 9)} per student. The exact price inside that range depends on the style, and we confirm it after we review your order.`,
      {
        acts: [["Open the seniors quote", 8]],
        chips: [["What are the personal touches?", fTouch], ELSE],
      },
    );
  }
  function fRush() {
    say("Standard delivery takes 3 weeks. Rush delivery adds 5% to the total.", {
      acts: [["Open the seniors quote", 8]],
      chips: [["What are the personal touches?", fTouch], ELSE],
    });
  }
  function fDesign() {
    say(
      "Designing covers logos, brand identity, apparel graphics and packaging. What do you need?",
      {
        acts: [["Open the designing quote", 0]],
        chips: [
          ["A logo and brand identity", () => fDes(0)],
          ["Graphics for clothing", () => fDes(1)],
          ["Packaging", () => fDes(2)],
          ["A full brand kit", () => fDes(3)],
        ],
      },
    );
  }
  function fDes(k) {
    const t = [
      `A logo and identity is ${pr(0, 0, 0)} per design.`,
      `Apparel graphics are ${pr(0, 0, 1)} per design. They pair well with Clothing manufacturing.`,
      `Packaging design is ${pr(0, 0, 2)} per design.`,
      "A full brand kit is custom, so the price shows ?* and is confirmed after we review what you need.",
    ][k];
    say(
      t +
        `\nYou choose how many designs you want (1 to 10) and what we deliver: PDF, PNG, editable source files, brand guidelines or product mockups, at no extra cost. Standard delivery takes 7 days. Rush delivery in 3 days adds ${pr(0, 3, 1)}.`,
      { acts: [["Open the designing quote", 0]], chips: [["Logo or full brand kit?", fKit], ELSE] },
    );
  }
  function fKit() {
    say(
      "A logo and identity is the right start for a new brand. A full brand kit is for when you need the whole set. Tell us what you need in the quote and we will price it after we review.",
      { acts: [["Open the designing quote", 0]], chips: [ELSE] },
    );
  }
  function fWeb() {
    say("What should your site do for you?", {
      acts: [["Open the web quote", 3]],
      chips: [
        ["Introduce my business", () => fWebK(0)],
        ["Promote one offer or event", () => fWebK(1)],
        ["Sell products online", () => fWebK(2)],
        ["Let people log in, book or manage things", () => fWebK(3)],
      ],
    });
  }
  function fWebK(k) {
    const t = [
      `A Business website is ${pr(3, 0, 1)} and works well for pages like About, Services and Contact. Up to 5 pages are included. 6 to 15 pages add ${pr(3, 2, 1)}, and 16 or more add ${pr(3, 2, 2)}.`,
      `A Landing page is ${pr(3, 0, 0)}. It is one focused page for a single offer, launch or campaign.`,
      `An Online store is ${pr(3, 0, 2)}. You also pick a back end: Shopify is ${pr(3, 1, 0)} and is the lower-cost option, or a Custom back end is ${pr(3, 1, 1)} if you need something special.`,
      `A Web app is ${pr(3, 0, 3)}. It suits products where people sign in and do things, like bookings, accounts or dashboards. You can add a booking system, online payments or an admin dashboard.`,
    ][k];
    say(t, {
      acts: [["Open the web quote", 3]],
      chips: [["How long does it take?", fWebTime], ["Template or custom design?", fWebLook], ELSE],
    });
  }
  function fWebTime() {
    say("Standard delivery is 4 to 6 weeks. Rush delivery in 2 weeks adds 25% to the total.", {
      acts: [["Open the web quote", 3]],
      chips: [["Template or custom design?", fWebLook], ELSE],
    });
  }
  function fWebLook() {
    say(
      `A polished template is included. A fully custom design adds ${pr(3, 3, 1)}. A template is the faster, cheaper route, and custom suits a brand that needs to stand out.`,
      { acts: [["Open the web quote", 3]], chips: [["How long does it take?", fWebTime], ELSE] },
    );
  }
  function fPhoto() {
    say("Do you need our photographer, or just the studio space?", {
      chips: [
        ["I need the photographer too", fShoot],
        ["Just the studio, I have my own photographer", fStudio],
        ["What kinds of shoots are there?", fKinds],
      ],
    });
  }
  function fShoot() {
    say(
      "Book a shoot includes our photographer. You choose the kind of shoot, how long, how many edited photos (10, 25 or 50), extras like a model or styling, and where: our studio or on site.\nPrices show ?* and are confirmed after we review your brief.",
      {
        acts: [["Open Book a shoot", 6]],
        chips: [
          ["What kinds of shoots are there?", fKinds],
          ["Can I rent just the studio?", fStudio],
          ELSE,
        ],
      },
    );
  }
  function fStudio() {
    const q = SV[7].q[0];
    say(
      `Book a studio hires the space on its own at ${money(q.rate)} per hour, with a ${q.min} hour minimum (${money(q.rate * q.min)}). It is open ${fmtT(OPEN)} to ${fmtT(CLOSE)} the next day. You choose Area 1 or Area 2, a date and an exact start time. Extras like a lighting kit, backdrop or studio assistant are priced after review.`,
      {
        acts: [["Open Book a studio", 7]],
        chips: [["Do I need your photographer too?", fShoot], ELSE],
      },
    );
  }
  function fKinds() {
    say(
      "Portrait: people, headshots and personal shoots.\nProduct: your items for a catalog, store or social media.\nEvent: coverage of a day, launch or party.\nBrand and lifestyle: photos that show your brand in real settings.",
      {
        acts: [["Open Book a shoot", 6]],
        chips: [["I need the photographer", fShoot], ["Just the studio", fStudio], ELSE],
      },
    );
  }
  function fMarket() {
    say("Marketing has two booking paths: Media buying for paid ads across platforms, and UGC for creator videos and photos. Which one do you want?", {
      acts: [["Open Marketing", 4]],
      chips: [
        [
          "Paid ads / media buying",
          () => {
            gClose(true);
            go(10);
          },
        ],
        [
          "UGC creators",
          () => {
            gClose(true);
            go(11);
          },
        ],
        ELSE,
      ],
    });
  }
  function gRoute(q) {
    const s = q.toLowerCase(),
      h = (r) => r.test(s);
    if (h(/thank|thx|cheers/))
      return say("You are welcome. Is there anything else I can help you with?");
    if (h(/(start|launch|open|build|create).{0,24}(brand|clothing|apparel|label)/)) return fBrand();
    if (h(/studio|area ?[12]/)) return fStudio();
    if (h(/photo|shoot|camera|portrait|headshot|picture/)) return fPhoto();
    if (h(/senior|graduat|\bclass\b|student|school|\bprom\b|uniform/)) return fSeniors();
    if (h(/logo|identity|graphic|packag/)) return fDesign();
    if (h(/market|media.?buy|ugc|creator|ad budget|facebook ads|tiktok ads|instagram ads/))
      return fMarket();
    if (
      h(/\bweb|website|\bsites?\b|store|shop|shopify|landing|\bapps?\b|ecommerce|e-commerce|online/)
    )
      return fWeb();
    if (
      h(
        /shirt|\btees?\b|polo|hoodie|jacket|\bhats?\b|beanie|jersey|sweat|cloth|merch|garment|fabric|print|embroider|manufactur|\bpieces?\b|bulk|apparel/,
      )
    )
      return fClothes();
    if (h(/design|brand/)) return fDesign();
    if (h(/price|cost|how much|budget|cheap|expens|discount|\bquote/))
      return say(
        "Prices depend on the service, and anything marked ?* is confirmed after we review your order. Which service do you want to know about?",
      );
    if (h(/not sure|know|help|start|recommend|suggest|choose|which one|what do you/))
      return fStart();
    if (h(/^\s*(hi|hello|hey|hola|salam)\b/))
      return say("Hello! What would you like to make or book today?");
    say(
      "I am not sure I got that. I can help with clothing, uniforms, design, websites, marketing and photos. Tap a choice below or tell me what you want to make.",
    );
  }
  const CTX = {
    0: fDesign,
    1: fClothes,
    2: fPhoto,
    3: fWeb,
    4: fMarket,
    5: fSeniors,
    6: fShoot,
    7: fStudio,
    8: fSeniors,
    10: fMarket,
    11: fMarket,
  };
  function gOpen(ctx) {
    gd.hidden = false;
    mas.classList.add("seen");
    if (!gStarted) {
      gStarted = true;
      if (ctx >= 0) {
        gCtx = ctx;
        CTX[ctx]();
      } else
        say(
          AI
            ? "Hi, I am DOD, the Lay C AI guide. Ask me anything: our services and prices, ideas, advice to improve your work, ask me to draw an image of your product, or send me a photo and I will read it and identify the item. Type below or tap a choice."
            : "Hi, I am the Lay C guide. Tell me what you are trying to do and I will help you pick the right service and understand your options. Tap a choice below or type your own question.",
        );
    } else if (ctx >= 0 && ctx !== gCtx) {
      gCtx = ctx;
      CTX[ctx]();
    }
    if (Math.min(W() / 760, H() / 500) >= 1) setTimeout(() => gin.focus({ preventScroll: true }), 0);
  }
  function gClose(quiet) {
    gd.hidden = true;
    if (quiet) return;
    const a = $("#askg");
    (cur >= 0 && a ? a : mas).focus({ preventScroll: true });
  }
  mas.onclick = () => gOpen(-1);
  $("#gx").onclick = () => gClose();
  gd.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      gClose();
    }
  });
  $("#gform").addEventListener("submit", (e) => {
    e.preventDefault();
    const q = gin.value.trim();
    if (!q || gBusy) return;
    gin.value = "";
    gAdd("me", q);
    gRoute(q);
  });

  // AI GUIDE. DOD answers with Claude (sample capability), draws product images as SVG, and gives advice. Falls back to the scripted guide when Claude is unavailable.
  let AI = null,
    DL = null,
    IMG = null,
    aiHist = [],
    aiCtl = null,
    pend = [];
  try {
    if (window.claude && claude.use) {
      claude
        .use("sample")
        .then((x) => {
          if (x) {
            AI = x;
            x.limits()
              .then((l) => {
                if (l && l.images) {
                  IMG = l.images;
                  const b = $("#gatt"),
                    f = $("#gfile");
                  if (l.images.mediaTypes && l.images.mediaTypes.length)
                    f.accept = l.images.mediaTypes.join(",");
                  b.hidden = false;
                }
              })
              .catch(() => {});
          }
        })
        .catch(() => {});
      claude
        .use("downloads")
        .then((x) => {
          if (x) DL = x;
        })
        .catch(() => {});
    }
  } catch (e) {}
  const lb = document.createElement("div");
  lb.id = "lb";
  lb.innerHTML = '<img alt="Product image">';
  app.appendChild(lb);
  lb.onclick = () => lb.classList.remove("on");
  function AIC() {
    return [
      ...(IMG ? [["Send a photo: read it and identify the item", () => $("#gfile").click()]] : []),
      [
        "Draw an image of my product",
        () =>
          aiAsk(
            "Draw a nice product image for me. If you do not know my product yet, draw a gray beanie mockup in Lay C brand style and ask what I make so you can redraw it.",
          ),
      ],
      [
        "Advice to improve my work",
        () =>
          aiAsk(
            "Give me practical advice to improve my business and my product. If you need to know what I do first, ask me one short question.",
          ),
      ],
      [
        "Compare prices and options",
        () =>
          aiAsk(
            "Compare the Lay C services and their prices and tell me the best value for a small new clothing brand.",
          ),
      ],
    ];
  }
  function priceTxt(o) {
    const v = o[1];
    return Array.isArray(v)
      ? money(v[0]) + " to " + money(v[1])
      : typeof v === "string"
        ? "priced after review"
        : o[5]
          ? "+" + v + "% of total"
          : money(v);
  }
  function kbase() {
    return SV.map(
      (sv) =>
        'SERVICE "' +
        sv.n +
        '" (page slug: ' +
        sv.slug +
        ")" +
        (sv.u ? " [prices per " + sv.u + "]" : "") +
        ": " +
        sv.s +
        (sv.free ? " Free: " + sv.free + "." : "") +
        "\n" +
        (sv.q || [])
          .map(
            (q) =>
              "  - " +
              q.t +
              " " +
              (q.h
                ? "Hourly " + money(q.rate) + "/hour, " + q.min + " to " + q.max + " hours"
                : (q.o || []).map((o) => o[0] + " (" + priceTxt(o) + ")").join("; ")),
          )
          .join("\n"),
    ).join("\n");
  }
  function aiRules() {
    return (
      "You are DOD, the friendly and very smart AI guide of Lay C, a creative studio and clothing factory in Egypt. Prices are in Egyptian pounds (L.E). You can answer ANY question (business, design, fashion, marketing, writing, maths, general knowledge, tech, life) with accurate, useful, honest answers. Be especially strong at helping Lay C customers: explain services, help them choose, give concrete advice, and critique their ideas constructively so they can improve their brand, product quality, pricing, photos, website and marketing. When someone describes their work, name what is good, what to fix, and the next 2 or 3 actions.\n" +
      "RULES: Reply in the same language and dialect the person writes in (English, Arabic, Egyptian Arabic or Franco-Arabic). Be warm, concise (usually under 140 words), plain text with short paragraphs. No markdown headings or bold. For Lay C prices use ONLY the data below; never invent Lay C prices; items marked priced after review are confirmed after the team reviews the order. If unsure, say so. Be honest that you are an AI.\n" +
      'IMAGES: When the person asks for an image, picture, mockup, logo idea, design or "how it would look", draw it as ONE self-contained SVG inside a fenced block that starts with ```svg and ends with ```. Make it look as REALISTIC and 3D as SVG allows, like a studio product render: (1) Soft studio background with a subtle radial gradient and a floor shadow (blurred ellipse using feGaussianBlur). (2) Volume: build every form from several layers, a base shape plus a light-side highlight and a dark-side shade using linearGradient and radialGradient, with the light coming from the top left, soft inner shadows along folds, seams and edges, and a thin darker outline of the same hue, never black. (3) Fabric texture: use repeating <pattern> ribs or weave lines, or feTurbulence with feDiffuseLighting or feComposite at low opacity, clipped to the product with clipPath. (4) Depth: overlapping parts cast soft shadows (feGaussianBlur plus feOffset) and rounded edges, with no flat single colour fills. (5) Add a small realistic detail layer, such as stitching as dashed strokes, a woven label, folds, a fluffy pom-pom built from many small overlapping circles, and drawstrings with eyelets.\n' +
      'RATIOS: Use correct real-world proportions and a canvas that suits the product. Garments and tall items: viewBox="0 0 600 750" (4:5). Beanies, caps, mugs and bags: viewBox="0 0 600 600" (1:1). Banners, screens and web mockups: viewBox="0 0 800 450" (16:9). Keep the product about 70 to 80 percent of the canvas width and centred. Proportions to respect: a beanie is about as tall as it is wide, with a folded cuff about one quarter of its height and a pom-pom about one third of its width; a t-shirt body is about 1.15 times taller than it is wide, sleeves about 0.3 of the body width, neck opening about 0.3 of the chest width; a hoodie is like a t-shirt with long sleeves, a hood and a front pocket; a cap brim is about one third of the crown width. If the person gives sizes or a ratio, follow them exactly. Keep both sides symmetrical unless the design is asymmetric.\n' +
      "IMAGE RULES: Use the colours, text and logo they asked for, and Lay C blue (#4169e1) accents when no colours are given; the factory beanie is dark gray. No scripts, no external links, no external fonts (font-family sans-serif), no embedded photos. Keep the SVG under about 9000 characters so it finishes. Write 1 or 2 sentences before or after the block saying what you drew and offer to change colours, text, angle or style. You make vector illustrations rendered in 3D style, not photographs, so say so if they ask for a photo.\n" +
      "PHOTOS: The person may attach photos. Look carefully and (1) read ALL visible writing exactly as written, in any language including Arabic and handwriting, and say clearly which words are unclear instead of guessing; (2) identify the item: type of product or garment, colours, fabric or material, print or embroidery technique, logo, label, size marks, condition and visible defects; (3) say what Lay C service and options match it and quote prices only from the data below; (4) give honest, specific advice to improve it, such as design, quality, colours, placement, photo quality or presentation; (5) if it is a handwritten or printed order, list, receipt or quote, transcribe it as a tidy list and check the maths. Never identify real people from their faces; describe only what is visible. If the photo is blurry, dark or cropped, say what you could not read and ask for a clearer one.\n" +
      "ACTIONS: If a Lay C page would help, end your answer with [[open:slug]] using a page slug from the data (at most 2).\n" +
      "The demo machine on this page makes a dark gray beanie priced 400 L.E.\n\nLay C DATA:\n" +
      kbase()
    );
  }
  function cleanSvg(x) {
    x = (x || "").trim();
    if (!/^<svg[\s>]/i.test(x) || !/<\/svg>\s*$/i.test(x)) return null;
    x = x
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, "")
      .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*')/gi, "")
      .replace(/(xlink:)?href\s*=\s*("|')\s*(?!#)[^"']*\2/gi, "");
    if (!/xmlns\s*=/.test(x)) x = x.replace(/^<svg/i, '<svg xmlns="http://www.w3.org/2000/svg"');
    return x;
  }
  const figs = new Map();
  function aiFig(raw) {
    const svg = cleanSvg(raw);
    if (!svg) return null;
    if (figs.has(svg)) return figs.get(svg);
    const f = document.createElement("figure");
    f.className = "fig";
    const im = document.createElement("img");
    im.alt = "AI drawn product image";
    im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    im.onclick = () => {
      lb.firstChild.src = im.src;
      lb.classList.add("on");
    };
    f.appendChild(im);
    const a = document.createElement("div");
    a.className = "fa";
    const z = document.createElement("button");
    z.type = "button";
    z.textContent = "View larger";
    z.onclick = im.onclick;
    a.appendChild(z);
    if (DL) {
      const sv = document.createElement("button");
      sv.type = "button";
      sv.textContent = "Save image";
      sv.onclick = () => {
        DL.save({ filename: "lay-c-image.svg", data: svg }).catch(() => {});
      };
      a.appendChild(sv);
    }
    f.appendChild(a);
    figs.set(svg, f);
    return f;
  }
  function aiRender(d, text, fin) {
    d.textContent = "";
    const acts = [];
    text = text.replace(/\[\[open:([a-z0-9-]+)\]\]/g, (m, sl) => {
      const i = SV.findIndex((x) => x.slug === sl);
      if (i >= 0 && !acts.includes(i) && acts.length < 2) acts.push(i);
      return "";
    });
    const re = /```svg\s*([\s\S]*?)```/g;
    let last = 0,
      m;
    const parts = [];
    while ((m = re.exec(text))) {
      parts.push(["t", text.slice(last, m.index)]);
      parts.push(["s", m[1]]);
      last = re.lastIndex;
    }
    let rest = text.slice(last),
      drawing = false;
    const o = rest.indexOf("```");
    if (o >= 0) {
      drawing = true;
      rest = rest.slice(0, o);
    }
    parts.push(["t", rest]);
    parts.forEach(([k, v]) => {
      if (k === "t") {
        v.split("\n")
          .map((x) =>
            x
              .replace(/\*\*/g, "")
              .replace(/^#+\s*/, "")
              .trim(),
          )
          .filter(Boolean)
          .forEach((l) => {
            const p = document.createElement("p");
            p.textContent = l;
            d.appendChild(p);
          });
      } else {
        const f = aiFig(v);
        if (f) d.appendChild(f);
      }
    });
    if (drawing && !fin) {
      const p = document.createElement("p");
      p.className = "dr";
      p.textContent = "Drawing the image...";
      d.appendChild(p);
    }
    if (fin)
      acts.forEach((i) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "act";
        b.textContent = "Open " + SV[i].n + " →";
        b.onclick = () => {
          gClose(true);
          go(i);
        };
        d.appendChild(b);
      });
    if (!d.firstChild && fin) d.textContent = "...";
  }
  const _route = gRoute;
  gRoute = function (q) {
    if (AI) aiAsk(q);
    else _route(q);
  };
  async function aiAsk(q, imgs) {
    imgs = imgs || [];
    if (gBusy) return;
    gBusy = true;
    gch.innerHTML = "";
    const d = gAdd("bot", "Thinking...");
    d.classList.add("typing");
    const st = document.createElement("button");
    st.type = "button";
    st.className = "chip";
    st.textContent = "Stop";
    aiCtl = new AbortController();
    const ctl = aiCtl;
    st.onclick = () => ctl.abort();
    gch.appendChild(st);
    const turns = [
      { role: "user", content: aiRules() },
      { role: "assistant", content: "Understood. I am DOD, ready to help." },
      ...aiHist.slice(-12),
      {
        role: "user",
        content: imgs.length
          ? q +
            "\n\n[The person attached " +
            imgs.length +
            " image" +
            (imgs.length > 1 ? "s" : "") +
            ". Look at them now.]"
          : q,
      },
    ];
    let ok = false,
      full = "";
    try {
      const r = await AI(
        turns,
        Object.assign(
          {
            cache: false,
            signal: ctl.signal,
            modelTier:
              imgs.length ||
              /image|picture|draw|mockup|mock-up|logo|design|render|look like|\u0635\u0648\u0631/i.test(
                q,
              )
                ? "complex"
                : "default",
            onText: ({ text }) => {
              full = text;
              d.classList.remove("typing");
              aiRender(d, text, false);
              glog.scrollTop = glog.scrollHeight;
            },
          },
          imgs.length ? { images: imgs } : {},
        ),
      );
      full = r.text;
      d.classList.remove("typing");
      aiRender(d, full, true);
      ok = true;
      aiHist.push(
        {
          role: "user",
          content: q + (imgs.length ? " [attached " + imgs.length + " image(s); not re-sent]" : ""),
        },
        { role: "assistant", content: full.replace(/```svg[\s\S]*?```/g, "[image drawn]") },
      );
    } catch (e) {
      d.classList.remove("typing");
      const c = e && e.code;
      if (c === "cancelled") {
        if (e.text) aiRender(d, e.text, true);
        else d.remove();
      } else if (c === "image_rejected" || c === "images_unavailable") {
        d.textContent = "";
        const p = document.createElement("p");
        p.textContent =
          c === "image_rejected"
            ? "I could not open that image. Please send a JPG, PNG, WebP or GIF under 20 MB."
            : "Photos are not available right now. Describe the item to me and I will help.";
        d.appendChild(p);
      } else if (c === "not_granted" || c === "unavailable" || c === "tools_unavailable") {
        AI = null;
        d.remove();
        gAdd(
          "bot",
          "I need your permission to use my AI brain. I will keep helping with the basic guide for now.",
        );
        gBusy = false;
        _route(q);
        return;
      } else if (c === "rate_limited") {
        if (e.text) aiRender(d, e.text, true);
        else {
          d.textContent = "";
          const p = document.createElement("p");
          p.textContent =
            "I am getting many questions at once. Please wait a few seconds and ask again.";
          d.appendChild(p);
        }
      } else {
        d.remove();
        gBusy = false;
        _route(q);
        return;
      }
    }
    gBusy = false;
    glog.scrollTop = glog.scrollHeight;
    gChips(AIC());
  }

  // PHOTO ATTACH. Pick, paste or drop photos; DOD reads the writing and identifies the item.
  {
    const gatt = $("#gatt"),
      gfile = $("#gfile"),
      gprev = $("#gprev"),
      gform = $("#gform");
    const rd = (f) =>
      new Promise((r) => {
        const x = new FileReader();
        x.onload = () => r(x.result);
        x.onerror = () => r("");
        x.readAsDataURL(f);
      });
    async function drawPrev() {
      gprev.innerHTML = "";
      for (let i = 0; i < pend.length; i++) {
        const w = document.createElement("div");
        w.className = "pv2";
        const im = document.createElement("img");
        im.alt = "Attached photo " + (i + 1);
        im.src = await rd(pend[i]);
        const x = document.createElement("button");
        x.type = "button";
        x.setAttribute("aria-label", "Remove photo");
        x.innerHTML = "&times;";
        x.onclick = () => {
          pend.splice(i, 1);
          drawPrev();
        };
        w.appendChild(im);
        w.appendChild(x);
        gprev.appendChild(w);
      }
    }
    function addFiles(list) {
      if (!IMG) return;
      const max = IMG.maxCount || 4;
      let big = false,
        bad = false;
      [...list].forEach((f) => {
        if (!/^image\//.test(f.type)) {
          bad = true;
          return;
        }
        if (IMG.maxInputBytes && f.size > IMG.maxInputBytes) {
          big = true;
          return;
        }
        if (pend.length < max) pend.push(f);
      });
      drawPrev();
      if (big || bad || list.length + pend.length > max + list.length) {
      }
      if (big || bad)
        gAdd(
          "bot",
          big
            ? "That photo is too large. Please send one under " +
                Math.round((IMG.maxInputBytes || 20971520) / 1048576) +
                " MB."
            : "Please attach an image file (JPG, PNG, WebP or GIF).",
        );
      gin.focus({ preventScroll: true });
    }
    gatt.onclick = () => gfile.click();
    gfile.onchange = () => {
      addFiles(gfile.files);
      gfile.value = "";
    };
    gin.addEventListener("paste", (e) => {
      const fs = [...((e.clipboardData && e.clipboardData.files) || [])].filter((f) =>
        /^image\//.test(f.type),
      );
      if (fs.length && IMG) {
        e.preventDefault();
        addFiles(fs);
      }
    });
    gd.addEventListener("dragover", (e) => {
      if (IMG && e.dataTransfer && [...e.dataTransfer.types].includes("Files")) {
        e.preventDefault();
        gd.classList.add("drop");
      }
    });
    gd.addEventListener("dragleave", () => gd.classList.remove("drop"));
    gd.addEventListener("drop", (e) => {
      gd.classList.remove("drop");
      if (IMG && e.dataTransfer && e.dataTransfer.files.length) {
        e.preventDefault();
        addFiles(e.dataTransfer.files);
      }
    });
    gform.addEventListener(
      "submit",
      async (e) => {
        if (!pend.length) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        if (gBusy || !AI) return;
        const imgs = pend.slice(),
          typed = gin.value.trim(),
          q =
            typed ||
            "Look at this photo. Read any writing in it exactly, identify the item, tell me how Lay C can help, and how I can improve it.";
        gin.value = "";
        pend = [];
        const urls = await Promise.all(imgs.map(rd));
        gprev.innerHTML = "";
        const b = gAdd("me", typed || "Sent a photo");
        const t = document.createElement("div");
        t.className = "thumbs";
        urls.forEach((u) => {
          const im = document.createElement("img");
          im.alt = "Attached photo";
          im.src = u;
          t.appendChild(im);
        });
        b.appendChild(t);
        glog.scrollTop = glog.scrollHeight;
        aiAsk(q, imgs);
      },
      true,
    );
  }

  // WALKER. A small 3D guide patrols the floor around the machine, clear of the stations and the belt.
  const talk = $("#talk");
  const WS = 0.95,
    FLOOR = -0.43;
  const walk = new THREE.Group();
  scene.add(walk);
  const MAN_H = 1.5,
    ST_ON = 1;
  const manTex = new THREE.TextureLoader().load("man.png");
  manTex.encoding = THREE.sRGBEncoding;
  manTex.anisotropy = 4;
  const man = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: manTex,
      transparent: true,
      alphaTest: 0.05,
      toneMapped: false,
    }),
  );
  man.center.set(0.5, 0);
  man.scale.set((MAN_H * 285) / 720, MAN_H, 1);
  walk.add(man);
  const hitbox = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, MAN_H, 0.5),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  hitbox.position.y = MAN_H / 2;
  walk.add(hitbox);
  // PATH
  const PHX = 7.9,
    PHZ = 5.7,
    PR = 2.2,
    PSX = PHX - PR,
    PSZ = PHZ - PR,
    PQ = (PR * Math.PI) / 2;
  const PSEG = [2 * PSZ, PQ, 2 * PSX, PQ, 2 * PSZ, PQ, 2 * PSX, PQ],
    PL = PSEG.reduce((a, b) => a + b);
  function pathAt(s) {
    s = ((s % PL) + PL) % PL;
    let i = 0;
    while (s > PSEG[i]) {
      s -= PSEG[i];
      i++;
    }
    const u = s,
      c = [
        [PSX, PSZ],
        [-PSX, PSZ],
        [-PSX, -PSZ],
        [PSX, -PSZ],
      ];
    if (i === 0) return { x: PHX, z: -PSZ + u, tx: 0, tz: 1 };
    if (i === 2) return { x: PSX - u, z: PHZ, tx: -1, tz: 0 };
    if (i === 4) return { x: -PHX, z: PSZ - u, tx: 0, tz: -1 };
    if (i === 6) return { x: -PSX + u, z: -PHZ, tx: 1, tz: 0 };
    const k = (i - 1) / 2,
      ang = (k * Math.PI) / 2 + u / PR,
      cs = Math.cos(ang),
      sn = Math.sin(ang);
    return { x: c[k][0] + PR * cs, z: c[k][1] + PR * sn, tx: -sn, tz: cs };
  }
  const STOPS = ST.map((st, n) => {
    const a = A0 + n * STEP,
      sx = (RX + 2.15) * Math.cos(a),
      sz = (RZ + 1.45) * Math.sin(a);
    let best = 0,
      bd = 1e9;
    for (let s = 0; s < PL; s += 0.1) {
      const p = pathAt(s),
        d = (p.x - sx) ** 2 + (p.z - sz) ** 2;
      if (d < bd) {
        bd = d;
        best = s;
      }
    }
    return best;
  }).sort((a, b) => a - b);
  // END PATH
  const LINES = [
    "boom",
    "efham bas",
    "ana gadet",
    "ya rab",
    "ya sater",
    "ya waly el n3am",
    "ya rab el shift y5las",
    "enta btetfrg 3la eh",
    "bos 3del ya",
    "m3ksh bo2 maya",
    "samo 3lakoo",
  ];
  let deck = [],
    lastLine = "";
  function nextLine() {
    if (!deck.length) {
      deck = LINES.slice();
      for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
      }
      if (deck[deck.length - 1] === lastLine) {
        [deck[0], deck[deck.length - 1]] = [deck[deck.length - 1], deck[0]];
      }
    }
    lastLine = deck.pop();
    return lastLine;
  }
  const YP = 0.24,
    RRX = 2.55,
    RRZ = 1.1;
  const caster = new THREE.Mesh(
    new THREE.PlaneGeometry((MAN_H * 285) / 720, MAN_H),
    new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, colorWrite: false, depthWrite: false }),
  );
  caster.customDepthMaterial = new THREE.MeshDepthMaterial({
    depthPacking: THREE.RGBADepthPacking,
    map: manTex,
    alphaTest: 0.5,
    side: THREE.DoubleSide,
  });
  caster.position.y = MAN_H / 2;
  caster.rotation.y = Math.atan2(key.position.x, key.position.z);
  caster.castShadow = true;
  caster.renderOrder = -1;
  walk.add(caster);
  const wk = {
      si: 1,
      th: A0 + STEP - 0.7,
      mode: "walk",
      t: 0,
      ph: 0,
      sp: 0,
      bt: 0,
      since: 0,
      vis: true,
      on: true,
      vt: 0,
      fl: 1,
      st: 0,
    },
    pv2 = new THREE.Vector3();
  const rf = (th) => Math.hypot(RRX * Math.sin(th), RRZ * Math.cos(th));
  function wSay() {
    talk.textContent = nextLine();
    wk.bt = 3;
    wk.since = 0;
  }
  const occ = new THREE.Raycaster(),
    ov = new THREE.Vector3(),
    od = new THREE.Vector3();
  function wSeen() {
    ov.set(walk.position.x, walk.position.y + 0.75, walk.position.z);
    od.copy(ov).sub(cam.position);
    const L = od.length();
    od.normalize();
    occ.set(cam.position, od);
    occ.far = Math.max(0, L - 0.6);
    return occ.intersectObjects(machine.children, true).length === 0;
  }
  function walkUpdate(dt) {
    const sz = mobile ? 1.3 : 1,
      k = calm ? 0.25 : 1;
    let v = 0;
    if (playing) {
      wk.t += dt;
      wk.vt -= dt;
      if (wk.vt <= 0) {
        wk.vt = 0.15;
        wk.vis = wSeen();
      }
      if (wk.mode === "walk") {
        const tg = A0 + wk.si * STEP,
          f = rf(wk.th),
          dth = tg - wk.th,
          d = dth * f;
        wk.sp += (1.1 - wk.sp) * Math.min(1, dt * 3);
        v = Math.min(wk.sp, 0.25 + d * 1.2);
        wk.th += Math.min(dth, (v * dt) / f);
        wk.ph += dt * v * 5.6;
        wk.since += dt;
        if (tg - wk.th < 0.01) {
          wk.st = wk.si % ST.length;
          wk.mode = "work";
          wk.t = 0;
          wk.sp = 0;
          wSay();
        }
      } else if (wk.t > 3.6) {
        wk.mode = "walk";
        wk.si++;
        wk.t = 0;
      }
      if (wk.bt > 0) wk.bt -= dt;
    }
    const th = wk.th,
      x = RRX * Math.cos(th),
      z = RRZ * Math.sin(th),
      working = wk.mode === "work",
      talking = working && wk.bt > 0,
      amp = Math.min(1, v) * k;
    walk.position.set(
      x,
      YP +
        Math.abs(Math.sin(wk.ph)) * 0.05 * amp +
        (talking && !calm ? Math.abs(Math.sin(wk.t * 7)) * 0.03 : 0),
      z,
    );
    walk.scale.setScalar(sz);
    pv.set(x, YP, z).project(cam);
    if (working) {
      const b = ST[wk.st].base;
      pv2.set(b.x, YP, b.z).project(cam);
    } else {
      const tx = -RRX * Math.sin(th),
        tz = RRZ * Math.cos(th),
        tl = Math.hypot(tx, tz);
      pv2.set(x + (tx / tl) * 0.3, YP, z + (tz / tl) * 0.3).project(cam);
    }
    if (Math.abs(pv2.x - pv.x) > 1e-4) wk.fl = pv2.x > pv.x ? 1 : -1;
    man.scale.set(
      ((MAN_H * 285) / 720) * wk.fl,
      MAN_H * (1 + (calm ? 0 : Math.sin(wk.t * 1.8) * 0.007)),
      1,
    );
    caster.scale.x = wk.fl;
    pv.set(x, walk.position.y + MAN_H * sz * 1.03, z);
    pv.project(cam);
    wk.on = Math.abs(pv.x) < 1 && Math.abs(pv.y) < 1 && pv.z < 1;
    const aw = W(),
      ah = H();
    let px = (pv.x * 0.5 + 0.5) * aw,
      py = (-pv.y * 0.5 + 0.5) * ah;
    px = Math.max(70, Math.min(aw - 70, px));
    py = Math.max(60, Math.min(ah - 90, py));
    talk.style.transform =
      "translate(" + px + "px," + py + "px) translate(-50%,-100%) translateY(-4px)";
    talk.classList.toggle("v", wk.bt > 0 && wk.vis && wk.on && gd.hidden);
  }
  talk.onclick = () => gOpen(-1);

  // loop
  const v3 = new THREE.Vector3();
  let last = performance.now(),
    lastDraw = -1;
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(Math.max(0, (now - last) / 1000), 0.045);
    last = now;
    if (document.hidden || !sized || cur >= 0) return;
    if (playing) {
      t += dt;
      ft += dt;
    }
    const tact = (t * TAU) / 4,
      beat = (t / 4) % 1,
      sm = 1 - Math.exp(-dt * 5);
    spread += ((mode === "stations" ? 1 : 0) - spread) * sm;
    ST.forEach((s, i) => {
      const p = s.g.position;
      p.copy(s.base);
      p.x *= 1 + spread * 0.29;
      p.z *= 1 + spread * 0.37;
      p.y += spread * (i % 2 ? 0.32 : 0.55);
      const pulse = Math.pow(Math.max(0, Math.sin(tact - i * 0.9)), 7);
      s.gm.emissiveIntensity +=
        ((hov === i || (camMode === "station" && sel === i) ? 3 : 0.5 + pulse * 0.7) -
          s.gm.emissiveIntensity) *
        sm;
    });
    camKey.position.y +=
      ((camDown ? 0.018 : hov === -3 || camHot ? 0.03 : 0.036) - camKey.position.y) * Math.min(1, sm * 2);
    camRing.emissiveIntensity +=
      (((hov === -3 || camHot || camDown) ? 3 : 0.6 + Math.pow(Math.max(0, Math.sin(tact)), 7) * 0.8) -
        camRing.emissiveIntensity) *
      sm;
    belt.scale.set(1 + spread * 0.12, 1, 1 + spread * 0.15);
    // station animation
    const ib = mode === "order" ? Math.min(1, ((t / 26) % 1) / 0.15) : beat;
    inc.position.set(Math.sin(ib * Math.PI) * 0.2, 2.7 - ib * 2, 1.05 - ib * 0.6);
    inc.scale.setScalar(Math.min(1, ib * 8 + 0.15, (1 - ib) * 7 + 0.1));
    inc.rotation.z = Math.sin(ib * Math.PI) * -0.14;
    head.rotation.y = t * 1.6;
    needles.forEach((n, j) => (n.position.y = 0.16 + Math.max(0, Math.sin(t * 5 + j)) * 0.08));
    const h = 0.15 + beat * 0.8;
    tube.scale.y = h;
    tube.position.y = 1.78 - h / 2;
    spools.forEach((s, i) => (s.rotation.z = t * (i ? -0.9 : 1.1)));
    const dip = Math.sin(tact);
    hang.position.y = 1.75 + dip * 0.28;
    const dm2 = Math.max(0, Math.min(1, (0.2 - dip) * 2.2));
    mini.mat.color.setHex(CREAM).lerp(new THREE.Color(GRAY), dm2);
    liq.material.emissiveIntensity = 0.5 + Math.sin(t * 2) * 0.2;
    bub.forEach((b, j) => {
      const u = (t * 0.35 + j / 6) % 1;
      b.position.set(
        Math.cos(j * 2.1) * 0.5 * (1 - u * 0.2),
        1.02 + u * 0.45,
        Math.sin(j * 2.1) * 0.5,
      );
      b.scale.setScalar(1 - u * 0.7);
    });
    eNeedle.position.y = 1.62 + Math.abs(Math.sin(t * 9)) * 0.16;
    embSpools.forEach((s, i) => (s.rotation.x = t * (i % 2 ? -1.5 : 1.7)));
    hoopE.position.x = Math.sin(t * 1.4) * 0.06;
    hoopE.position.z = 0.12 + Math.cos(t * 1.1) * 0.04;
    spinPom.rotation.y = t * 2;
    spinPom.scale.setScalar(0.85 + (Math.sin(tact) + 1) * 0.12);
    cutter.rotation.y = t * 6;
    const op = (t / 26) % 1,
      cb = mode === "order" ? Math.max(0, Math.min(1, (op - 0.88) / 0.12)) : beat;
    rcp.visible = coin.visible = mode !== "order" || op > 0.88;
    rcp.scale.y = 0.2 + Math.min(1, cb * 1.5) * 0.8;
    coin.position.set(1.04, 2.7 - Math.min(1, cb * 1.7) ** 2 * 2.17, 0.55);
    coin.rotation.y = t * 3.5;
    coin.scale.setScalar(cb > 0.9 ? 1 - (cb - 0.9) * 8 : 1);
    if (t - lastDraw > 1 / 30 || lastDraw < 0) {
      updBelt(t);
      if (waveFlag) waveFlag(t);
      lastDraw = t;
    }
    // packets
    P.forEach((p, i) => {
      const ph = (t / 26 + i / 6) % 1;
      p.ph = ph;
      const th = A0 + ph * STEP * 6,
        d = (th - A0) / STEP,
        s = d < 1.1 ? 0 : Math.min(5, Math.floor(d - 0.1));
      p.d = d;
      p.g.position.set(
        RX * Math.cos(th) * (1 + spread * 0.12),
        1.1,
        RZ * Math.sin(th) * (1 + spread * 0.15),
      );
      p.g.rotation.y = -Math.atan2(RZ * Math.cos(th), -RX * Math.sin(th)) + Math.PI / 2;
      if (p.s !== s) {
        p.s = s;
        p.slip.visible = s === 0;
        p.b.g.visible = s > 0;
        p.b.parts.forEach((x) => (x.visible = true));
        p.b.mat.color.setHex(s >= 2 ? GRAY : CREAM);
        p.b.pom.visible = s >= 4;
        p.tag.visible = s === 5;
      }
      p.b.logo.visible = false;
      if (p.mark) p.mark.visible = d >= 3;
      p.g.visible = mode !== "order" || i === 0;
      p.halo.visible = mode === "order" && i === 0;
      let sc = mode === "order" ? 1.5 : 1.25;
      if (ph > 0.94) sc *= Math.max(0.05, (1 - ph) / 0.06);
      if (ph < 0.04) sc *= Math.max(0.05, ph / 0.04);
      p.g.scale.setScalar(sc);
    });
    walkUpdate(dt);
    if (mode === "order") {
      const p = P[0],
        n = Math.min(5, Math.round(p.d));
      if (n !== jPrev) {
        $("#jt").textContent = J[n][0];
        $("#jd").textContent = J[n][1];
        jPrev = n;
      }
      $("#jp").style.width = p.ph * 100 + "%";
      const prog = $("#jprog");
      if (prog) prog.textContent = "";
      if (!dragging && playing) {
        dTgt.copy(p.g.position);
        dPos.copy(dTgt).addScaledVector(VD, mobile ? 10 : 14);
        camAnim = true;
      }
    } else if (camMode === "flight" && playing && !dragging) {
      const a = ft * 0.12,
        d = baseD * (mode === "stations" ? 1.2 : 1);
      dTgt.set(0, 0.9, 0);
      dPos
        .set(
          Math.sin(a + 0.55) * d * 0.83,
          d * (0.5 + Math.sin(a * 0.7) * 0.09),
          Math.cos(a + 0.55) * d * 0.83,
        )
        .add(dTgt);
      camAnim = true;
    } else if (camMode === "station" && camAnim) goal();
    if (camAnim && !dragging) {
      const sp2 = 1 - Math.exp(-dt * (mode === "order" ? 2.2 : 3));
      cam.position.lerp(dPos, sp2);
      ctrl.target.lerp(dTgt, sp2);
      if (
        camMode !== "flight" &&
        mode !== "order" &&
        cam.position.distanceTo(dPos) < 0.015 &&
        ctrl.target.distanceTo(dTgt) < 0.015
      )
        camAnim = false;
    }
    ctrl.autoRotate =
      playing &&
      !dragging &&
      !camAnim &&
      mode !== "order" &&
      camMode === "overview" &&
      now - lastInt > 6500;
    ctrl.update();
    R.render(scene, cam);
    pinUpdate();
  }
  (function welcomeTour() {
    const STEPS = [
      {
        k: "WELCOME",
        t: "Welcome to LAY C Factory",
        b: "Our machine turns your ideas into real products. Take a quick tour of our six stations and meet DOD, your personal assistant.",
      },
      {
        k: "STATION 01 OF 06",
        t: "Designing",
        b: "Logos, brand identity and apparel graphics. Start here when you need a look for your brand.",
        pin: 0,
      },
      {
        k: "STATION 02 OF 06",
        t: "Clothing manufacturing",
        b: "Made-to-order garments. Send us your order and we confirm the price after we review it.",
        pin: 1,
      },
      {
        k: "STATION 03 OF 06",
        t: "Photo shoots",
        b: "Book our photographer for product, portrait, event and brand shoots, or ask about renting the studio.",
        pin: 2,
      },
      {
        k: "STATION 04 OF 06",
        t: "Web developing",
        b: "Websites, stores and web apps built by our agents and developers.",
        pin: 3,
      },
      {
        k: "STATION 05 OF 06",
        t: "Marketing",
        b: "Paid ads planned and bought by our team, and creator videos and photos for your brand.",
        pin: 4,
      },
      {
        k: "STATION 06 OF 06",
        t: "Seniors uniform",
        b: "Uniforms and merch for graduating classes, priced per student. You get a free hat, plus 5% off for 50 to 100 students and 10% off for over 100.",
        pin: 5,
      },
      {
        k: "EXTRAS",
        t: "The flag",
        b: "The blue LAY C flag on the front left of the base shows your orders and the stage each one has reached. Tap it to track your order.",
        w3: "flag",
      },
      {
        k: "EXTRAS",
        t: "The mail box",
        b: "The mail box on the back left holds customer reviews. Tap it to read them, rate us with watermelons and write a few words.",
        w3: "mail",
      },
      {
        k: "EXTRAS",
        t: "The telephone booth",
        b: "Tap the little phone booth to start an online meeting, or join one with the 6-digit code the host gives you.",
        w3: "phone",
      },
      {
        k: "EXTRAS",
        t: "Take a selfie",
        b: "Press the camera key on the front right of the base to take a selfie. It goes into our family photo binder, and you can see photos from everyone.",
        w3: "cam",
      },
      {
        k: "GOOD TO KNOW",
        t: "The menu",
        b: "Open the menu any time to jump straight to a service, search, or change the language.",
        el: "#menub",
      },
      {
        k: "YOUR ACCOUNT",
        t: "Create an account",
        b: "Open the menu to sign in or create an account. You need that account to use all the services.",
        el: "#menub",
      },
      {
        k: "MEET DOD",
        t: "This is DOD",
        b: "DOD is your personal assistant. Tap him any time to ask a question, get advice, or send a photo.",
        dod: 1,
      },
    ];
    const LAST = STEPS.length - 1;
    const spot = new THREE.Vector3();
    function screenBox(obj) {
      if (!obj) return null;
      const box = new THREE.Box3().setFromObject(obj);
      if (box.isEmpty()) return null;
      const el = R.domElement.getBoundingClientRect();
      const xs = [box.min.x, box.max.x];
      const ys = [box.min.y, box.max.y];
      const zs = [box.min.z, box.max.z];
      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;
      xs.forEach((x) =>
        ys.forEach((y) =>
          zs.forEach((z) => {
            spot.set(x, y, z).project(cam);
            const sx = (spot.x * 0.5 + 0.5) * el.width + el.left;
            const sy = (-spot.y * 0.5 + 0.5) * el.height + el.top;
            minX = Math.min(minX, sx);
            minY = Math.min(minY, sy);
            maxX = Math.max(maxX, sx);
            maxY = Math.max(maxY, sy);
          }),
        ),
      );
      if (!isFinite(minX) || maxX - minX < 2) return null;
      return { left: minX, top: minY, width: maxX - minX, height: maxY - minY, right: maxX, bottom: maxY };
    }
    window.LAYC_PROJ = (key) =>
      screenBox({ flag: flagG, mail: envG, phone: phG, cam: camProp }[key]);
    let tries = 0;
    function boot() {
      const er = $("#err");
      if (er && getComputedStyle(er).display !== "none") return;
      const pins = document.querySelectorAll("#pins .pin");
      const ready = pins.length >= 6 && [...pins].every((b) => b.style.transform);
      const pg = $("#page");
      const busy = pg && getComputedStyle(pg).display !== "none";
      if (!ready || busy) {
        if (++tries < 80) setTimeout(boot, 300);
        return;
      }
      setTimeout(begin, 400);
    }
    function begin() {
      if (document.getElementById("tour")) return;
      const acc = $("#account");
      const holdAcc = !!(acc && !acc.hidden);
      if (holdAcc) acc.hidden = true;
      const root = document.createElement("div");
      root.id = "tour";
      root.setAttribute("role", "dialog");
      root.setAttribute("aria-modal", "true");
      root.setAttribute("aria-label", "Welcome tour");
      root.innerHTML =
        '<div class="tsp"></div><div class="tc" tabindex="-1"><div class="tk"></div><h3 class="tt"></h3><p class="tb"></p><div class="td"></div><div class="tr"><button type="button" class="tskip"></button><span class="tgap"></span><button type="button" class="tback">Back</button><button type="button" class="tnext"></button></div></div>';
      document.body.appendChild(root);
      const sp = root.querySelector(".tsp"),
        card = root.querySelector(".tc"),
        kk = root.querySelector(".tk"),
        tt = root.querySelector(".tt"),
        tb = root.querySelector(".tb"),
        dots = root.querySelector(".td"),
        skip = root.querySelector(".tskip"),
        back = root.querySelector(".tback"),
        next = root.querySelector(".tnext");
      STEPS.forEach(() => dots.appendChild(document.createElement("i")));
      let i = 0,
        raf = 0,
        mvT = 0,
        done = false;
      function rectFor(s) {
        if (s.pin != null) {
          const b = document.querySelectorAll("#pins .pin")[s.pin];
          return b ? b.getBoundingClientRect() : null;
        }
        if (s.el) {
          const b = $(s.el);
          return b ? b.getBoundingClientRect() : null;
        }
        if (s.w3) return window.LAYC_PROJ(s.w3);
        if (s.dod) {
          const t = $("#talk");
          if (t && t.style.transform) {
            const q = t.getBoundingClientRect(),
              h = Math.min(190, Math.max(110, innerHeight * 0.19)),
              w = h * 0.55,
              cx = q.left + q.width / 2;
            return { left: cx - w / 2, top: q.bottom + 2, width: w, height: h, right: cx + w / 2, bottom: q.bottom + 2 + h };
          }
          const b = $("#mas");
          return b ? b.getBoundingClientRect() : null;
        }
        return null;
      }
      const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
      function frameTour() {
        if (done) return;
        const s = STEPS[i],
          r = rectFor(s),
          vw = innerWidth,
          vh = innerHeight,
          m = 12,
          pad = 8;
        if (r && r.width) {
          sp.classList.remove("none");
          sp.style.left = r.left - pad + "px";
          sp.style.top = r.top - pad + "px";
          sp.style.width = r.width + pad * 2 + "px";
          sp.style.height = r.height + pad * 2 + "px";
        } else {
          sp.classList.add("none");
          sp.style.left = vw / 2 + "px";
          sp.style.top = vh / 2 + "px";
          sp.style.width = "0px";
          sp.style.height = "0px";
        }
        const cw = card.offsetWidth,
          ch = card.offsetHeight;
        let x, y;
        if (!r || !r.width) {
          x = (vw - cw) / 2;
          y = (vh - ch) / 2;
        } else {
          x = r.left + r.width / 2 - cw / 2;
          if (r.bottom + pad + ch + 14 <= vh - m) y = r.bottom + pad + 14;
          else if (r.top - pad - ch - 14 >= m) y = r.top - pad - ch - 14;
          else y = vh - ch - m;
        }
        card.style.left = clamp(x, m, Math.max(m, vw - cw - m)) + "px";
        card.style.top = clamp(y, m, Math.max(m, vh - ch - m)) + "px";
        raf = requestAnimationFrame(frameTour);
      }
      function render(n) {
        i = n;
        const s = STEPS[i];
        kk.textContent = s.k;
        tt.textContent = s.t;
        tb.textContent = s.b;
        [...dots.children].forEach((d, j) => d.classList.toggle("on", j === i));
        back.hidden = i === 0;
        skip.textContent = i === LAST ? "Finish" : "Skip tour";
        next.textContent = i === 0 ? "Start the tour" : i === LAST ? "Chat with DOD" : "Next";
        sp.classList.add("mv");
        clearTimeout(mvT);
        mvT = setTimeout(() => sp.classList.remove("mv"), 480);
        next.focus({ preventScroll: true });
      }
      function finish(openDod) {
        if (done) return;
        done = true;
        cancelAnimationFrame(raf);
        clearTimeout(mvT);
        removeEventListener("keydown", onKey, true);
        root.remove();
        if (holdAcc && !accOk()) acc.hidden = false;
        if (openDod) {
          try {
            $("#mas").click();
          } catch (e) {}
        }
      }
      function onKey(e) {
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          finish(false);
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          e.stopPropagation();
          if (i < LAST) render(i + 1);
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          e.stopPropagation();
          if (i > 0) render(i - 1);
        }
      }
      next.addEventListener("click", () => {
        if (i < LAST) render(i + 1);
        else finish(true);
      });
      back.addEventListener("click", () => {
        if (i > 0) render(i - 1);
      });
      skip.addEventListener("click", () => finish(false));
      root.addEventListener("click", (e) => e.stopPropagation());
      addEventListener("keydown", onKey, true);
      render(0);
      frameTour();
    }
    if (document.readyState === "complete") boot();
    else addEventListener("load", boot);
  })();
  sync();
  sp();
  requestAnimationFrame(frame);
})();
