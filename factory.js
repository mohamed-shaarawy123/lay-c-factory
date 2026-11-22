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
  const hemi = new THREE.HemisphereLight(0xdbe5f4, 0x1a2a66, 0.95);
  scene.add(hemi);
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
  // Overhead lamp. It stays at daylight until the chain or the slider is moved.
  const LAMP_HI = 6.55,
    LAMP_LO = 3.05,
    CHAIN_TOP = 8.55;
  const lampRig = new THREE.Group();
  scene.add(lampRig);
  const brass = new THREE.MeshStandardMaterial({ color: 0xd4b06a, metalness: 0.74, roughness: 0.3 });
  const shadeMat = new THREE.MeshStandardMaterial({
    color: 0xf7f1e4,
    roughness: 0.5,
    metalness: 0.04,
    side: THREE.DoubleSide,
    emissive: 0xffd7a2,
    emissiveIntensity: 0.12,
  });
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0xffe7c0,
    transparent: true,
    opacity: 0.045,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const mount = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 0.07, 18), brass);
  mount.position.y = CHAIN_TOP;
  mount.castShadow = true;
  lampRig.add(mount);
  const linkGeo = new THREE.TorusGeometry(0.055, 0.012, 6, 12);
  const links = [];
  for (let i = 0; i < 24; i++) {
    const link = new THREE.Mesh(linkGeo, brass);
    link.rotation.x = Math.PI / 2;
    link.rotation.y = i % 2 ? 0 : Math.PI / 2;
    link.castShadow = true;
    lampRig.add(link);
    links.push(link);
  }
  const shade = new THREE.Group();
  lampRig.add(shade);
  const shadeMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.38, 0.32, 28, 1, true), shadeMat);
  shadeMesh.castShadow = true;
  shade.add(shadeMesh);
  const shadeCap = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), shadeMat);
  shadeCap.position.y = 0.02;
  shade.add(shadeCap);
  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.075, 16, 12),
    new THREE.MeshBasicMaterial({ color: 0xfff4d2 }),
  );
  bulb.position.y = -0.05;
  shade.add(bulb);
  const pull = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.46, 8), brass);
  pull.position.y = -0.4;
  shade.add(pull);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.012, 8, 16), brass);
  ring.position.y = -0.64;
  ring.castShadow = true;
  shade.add(ring);
  const beam = new THREE.Mesh(new THREE.ConeGeometry(1.35, 2.6, 28, 1, true), beamMat);
  beam.position.y = -1.45;
  shade.add(beam);
  const lampSpot = new THREE.SpotLight(0xffe0b0, 0.85, 18, 0.78, 0.72, 1.15);
  const lampPt = new THREE.PointLight(0xffe6c2, 0.3, 7, 2);
  scene.add(lampSpot);
  scene.add(lampSpot.target);
  scene.add(lampPt);
  const skyDay = new THREE.Color(0xf4f7ff),
    skyNight = new THREE.Color(0x24344f),
    skyNow = new THREE.Color(),
    keyDay = new THREE.Color(0xffffff),
    keyNight = new THREE.Color(0xffe2b8);
  let lampT = 0;
  let lampAnim = 0;
  const lampBtn = $("#lampb");
  function setLamp(t) {
    lampT = Math.max(0, Math.min(1, t));
    const y = LAMP_HI + (LAMP_LO - LAMP_HI) * lampT,
      k = 1 - lampT;
    shade.position.y = y;
    const top = CHAIN_TOP - 0.08,
      bot = y + 0.2;
    links.forEach((link, i) => {
      link.position.y = top + ((bot - top) * (i + 0.5)) / links.length;
    });
    lampSpot.position.set(0, y - 0.12, 0);
    lampSpot.target.position.set(0, 0.15, 0);
    lampPt.position.set(0, y - 0.16, 0);
    lampSpot.intensity = 0.85 + lampT * 9.5;
    lampPt.intensity = 0.3 + lampT * 3.4;
    shadeMat.emissiveIntensity = 0.12 + lampT * 0.85;
    beamMat.opacity = 0.04 + lampT * 0.08;
    hemi.intensity = 0.2 + 0.75 * k;
    key.intensity = 0.26 + 1.44 * k;
    rim.intensity = 0.1 + 0.7 * k;
    fr.intensity = 0.06 + 0.44 * k;
    pl.intensity = 0.08 + 0.82 * k;
    key.position.set(-4 * k + 0.4 * lampT, 12 * k + (y + 0.2) * lampT, 7 * k + 0.25 * lampT);
    key.color.copy(keyDay).lerp(keyNight, lampT);
    R.toneMappingExposure = 0.76 + 0.34 * k;
    if (lampT < 0.02) scene.background = null;
    else scene.background = skyNow.copy(skyDay).lerp(skyNight, lampT);
    if (lampBtn) {
      const down = lampT > 0.45;
      lampBtn.setAttribute("aria-pressed", down ? "true" : "false");
      lampBtn.setAttribute("aria-label", down ? "Raise the lamp" : "Lower the lamp");
      lampBtn.title = down ? "Raise the lamp" : "Lower the lamp";
    }
  }
  function moveLamp(to) {
    if (lampAnim) cancelAnimationFrame(lampAnim);
    const from = lampT;
    const dest = Math.max(0, Math.min(1, to));
    const t0 = performance.now();
    const step = (now) => {
      if (lampDrag) {
        lampAnim = 0;
        return;
      }
      const u = Math.min(1, (now - t0) / 700);
      setLamp(from + (dest - from) * (1 - Math.pow(1 - u, 3)));
      lampAnim = u < 1 ? requestAnimationFrame(step) : 0;
    };
    lampAnim = requestAnimationFrame(step);
  }
  setLamp(document.documentElement.classList.contains("dark") ? 0.82 : 0);
  // plate
  box(machine, 13.6, 0.38, 8.9, 0, -0.09, 0, M.base);
  box(machine, 13.4, 0.06, 8.7, 0, 0.13, 0, M.edge);
  box(machine, 13.3, 0.09, 8.6, 0, 0.19, 0, M.body);
  for (const x of [-6, 6])
    for (const z of [-3.6, 3.6]) cyl(machine, 0.36, 0.2, x, -0.33, z, M.dark);
  // LAY C rug in the middle of the platform. The pin and a click open Interior.
  let rugMesh = null;
  let RUG = -1;
  {
    const RW = 5.4;
    const RD = RW / (1736 / 1134);
    const tex = new THREE.TextureLoader().load("rug-layc.jpg?v=home");
    tex.encoding = THREE.sRGBEncoding;
    tex.anisotropy = Math.min(8, R.capabilities.getMaxAnisotropy());
    const rugSide = m(0x2a4fd0, 0, 0.95);
    const rugTop = m(0xffffff, 0, 0.92, { map: tex });
    rugMesh = new THREE.Mesh(new THREE.BoxGeometry(RW, 0.03, RD), [
      rugSide,
      rugSide,
      rugTop,
      rugSide,
      rugSide,
      rugSide,
    ]);
    rugMesh.position.set(0, 0.25, 0);
    rugMesh.castShadow = rugMesh.receiveShadow = true;
    rugMesh.name = "lay-c-rug";
    machine.add(rugMesh);
  }
  // small street telephone booth. The door stays open until a call comes in.
  let phoneDoor = null;
  let phoneOpenNow = 1;
  let phoneOpenTarget = 1;
  let phoneInCall = false;
  let phoneIncoming = false;
  function applyPhone(k) {
    if (phoneDoor) phoneDoor.rotation.y = -1.15 * k;
  }
  function syncPhoneDoor() {
    phoneOpenTarget = phoneInCall || phoneIncoming ? 0 : 1;
  }
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
      const panes = [box(phG, 0.015, 2, PW - 0.08, (s * PW) / 2, 1.36, 0, glassM)];
      if (s < 0) panes.push(box(phG, PW - 0.08, 2, 0.015, 0, 1.36, (s * PW) / 2, glassM));
      for (const g of panes) g.castShadow = false;
    }
    const doorW = PW - 0.14;
    phoneDoor = new THREE.Group();
    phoneDoor.position.set(-PW / 2 + 0.07, 0, PW / 2);
    phG.add(phoneDoor);
    box(phoneDoor, doorW, 2.02, 0.05, doorW / 2, 1.36, 0, M.body);
    const doorGlass = box(phoneDoor, doorW - 0.14, 1.62, 0.02, doorW / 2, 1.46, 0.025, glassM);
    doorGlass.castShadow = false;
    box(phoneDoor, 0.04, 0.18, 0.07, doorW - 0.12, 1.28, 0.045, M.chrome);
    applyPhone(1);
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
  // light-blue mailbox for customer reviews, in the envelope's corner
  // Open until this person leaves a review, then the slot closes. Other accounts stay open.
  let mailDoor = null;
  let mailOpenNow = 1;
  let mailOpenTarget = 1;
  function mailWho() {
    try {
      const a = JSON.parse(localStorage.getItem("lcaccount") || "null");
      const email = a && a.email ? String(a.email).trim().toLowerCase() : "";
      return email || "guest";
    } catch (e) {
      return "guest";
    }
  }
  function mailReviewed() {
    try {
      const all = JSON.parse(localStorage.getItem("lcreviewed") || "{}");
      return !!(all && all[mailWho()]);
    } catch (e) {
      return false;
    }
  }
  function applyMail(k) {
    if (mailDoor) mailDoor.rotation.x = k * 1.45;
  }
  function syncMail(snap) {
    mailOpenTarget = mailReviewed() ? 0 : 1;
    if (snap) {
      mailOpenNow = mailOpenTarget;
      applyMail(mailOpenNow);
    }
  }
  function markMailReviewed() {
    try {
      const all = JSON.parse(localStorage.getItem("lcreviewed") || "{}") || {};
      all[mailWho()] = Date.now();
      localStorage.setItem("lcreviewed", JSON.stringify(all));
    } catch (e) {}
    syncMail(false);
    const door = $("#rvdoor");
    if (door) door.textContent = "Thank you. Your mailbox is now closed.";
  }
  const envG = new THREE.Group();
  envG.position.set(-6.2, 0.235, -3.6);
  envG.scale.setScalar(0.9);
  envG.rotation.y = -0.55;
  machine.add(envG);
  const mbArch = (r, h) => {
    const sh = new THREE.Shape();
    sh.moveTo(-r, 0);
    sh.lineTo(r, 0);
    sh.lineTo(r, h);
    sh.absarc(0, h, r, 0, Math.PI, false);
    sh.lineTo(-r, 0);
    return sh;
  };
  box(envG, 0.62, 0.05, 0.62, 0, 0.025, 0, M.dark);
  box(envG, 0.16, 0.95, 0.16, 0, 0.5, 0, M.chrome);
  const mb = new THREE.Group();
  mb.position.set(0, 0.96, 0);
  mb.scale.setScalar(0.7);
  envG.add(mb);
  const bm = new THREE.Mesh(new THREE.ExtrudeGeometry(mbArch(0.34, 0.34), { depth: 1.1, bevelEnabled: false }), M.body);
  bm.position.z = -0.55;
  bm.castShadow = bm.receiveShadow = true;
  mb.add(bm);
  const hole = new THREE.Mesh(new THREE.ExtrudeGeometry(mbArch(0.28, 0.28), { depth: 0.012, bevelEnabled: false }), M.dark);
  hole.position.set(0, 0.04, 0.55);
  mb.add(hole);
  const l1 = box(mb, 0.3, 0.2, 0.012, -0.02, 0.2, 0.567, M.ivory);
  l1.rotation.z = 0.1;
  const l2 = box(mb, 0.28, 0.18, 0.012, 0.04, 0.17, 0.575, M.edge);
  l2.rotation.z = -0.07;
  mailDoor = new THREE.Group();
  mailDoor.position.set(0, 0.015, 0.55);
  mb.add(mailDoor);
  const mailDoorMesh = new THREE.Mesh(new THREE.ExtrudeGeometry(mbArch(0.31, 0.31), { depth: 0.05, bevelEnabled: false }), M.ivory);
  mailDoorMesh.castShadow = true;
  mailDoor.add(mailDoorMesh);
  box(mailDoor, 0.34, 0.035, 0.04, 0, 0.505, 0.07, M.dark);
  box(mailDoor, 0.11, 0.11, 0.06, 0, 0.105, 0.08, M.chrome);
  scr(
    mailDoor,
    0.5,
    0.14,
    0,
    0.285,
    0.0525,
    ctex(480, 134, (c, w, h) => {
      c.fillStyle = "#f4f7ff";
      c.fillRect(0, 0, w, h);
      c.textAlign = "center";
      c.textBaseline = "middle";
      txt(c, "REVIEWS", w / 2, h / 2, 64, "#0f2a8a", 800);
    }),
  );
  scr(
    mb,
    0.7,
    0.16,
    0.3405,
    0.22,
    -0.05,
    ctex(540, 124, (c, w, h) => {
      c.fillStyle = "#4169e1";
      c.fillRect(0, 0, w, h);
      c.textAlign = "center";
      c.textBaseline = "middle";
      txt(c, "REVIEWS", w / 2, h / 2, 66, "#ffffff", 800);
    }),
  ).rotation.y = Math.PI / 2;
  const mailFlagMat = m(0xe8453c, 0.2, 0.5);
  box(mb, 0.03, 0.03, 0.03, 0.37, 0.18, -0.25, M.chrome);
  box(mb, 0.03, 0.46, 0.03, 0.385, 0.4, -0.25, M.chrome);
  box(mb, 0.025, 0.15, 0.3, 0.385, 0.62, -0.4, mailFlagMat);
  envG.traverse((o) => {
    if (o.isMesh) o.castShadow = o.receiveShadow = true;
  });
  syncMail(true);
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
      txt(c, "LAY C", 25, 52, 24, "#0f2a8a", 650);
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
  const UI = {
    en: {
      dark: "Dark mode",
      auto: "Auto",
      on: "On",
      off: "Off",
      services: "Services",
      search: "Search services, prices, options",
      help: "Help from DOD",
      help2: "Ask anything, get advice or send a photo",
      signin: "Sign in",
      signup: "Sign up",
      logout: "Log out",
      guest: "Not signed in",
      running: "Machine running",
      stopped: "Machine stopped",
      assembled: "Assembled",
      stations: "Stations",
      beanie: "One beanie",
      view: "VIEW",
      overview: "Overview",
      side: "Side",
      top: "Top",
      station: "Station",
      flight: "Flight",
      openmenu: "Open the menu",
      closemenu: "Close the menu",
      nomatch: "No match for",
      youremail: "Your email",
      notein: "This email is saved in this browser. Close the page and open it again, and you stay signed in. Log out if this is not your account.",
      notelogin: "Enter the email and password you created. Once it is saved, closing the page will not sign you out.",
      notesign: "Create a password the first time. Anything you do after this, including orders and photos, stays connected to this email.",
    },
    ar: {
      dark: "الوضع الداكن",
      auto: "تلقائي",
      on: "تشغيل",
      off: "إيقاف",
      services: "الخدمات",
      search: "ابحث عن الخدمات والأسعار",
      help: "مساعدة من DOD",
      help2: "اسأل أي شيء أو أرسل صورة",
      signin: "تسجيل الدخول",
      signup: "إنشاء حساب",
      logout: "تسجيل الخروج",
      guest: "لم تسجل الدخول",
      running: "الماكينة تعمل",
      stopped: "الماكينة متوقفة",
      assembled: "مجمّع",
      stations: "المحطات",
      beanie: "قبعة واحدة",
      view: "العرض",
      overview: "عام",
      side: "جانب",
      top: "أعلى",
      station: "محطة",
      flight: "تحليق",
      openmenu: "افتح القائمة",
      closemenu: "أغلق القائمة",
      nomatch: "لا توجد نتيجة لـ",
      youremail: "بريدك",
      notein: "هذا البريد محفوظ في المتصفح. أغلق الصفحة وافتحها وستبقى داخل الحساب. سجّل الخروج إن لم يكن حسابك.",
      notelogin: "أدخل البريد وكلمة المرور التي أنشأتها. بعد الحفظ، إغلاق الصفحة لا يخرجك من الحساب.",
      notesign: "أنشئ كلمة مرور في أول مرة. كل ما تفعله بعد ذلك، بما فيه الطلبات والصور، يبقى مرتبطاً بهذا البريد.",
    },
  };
  const SVC_AR = {
    Designing: "التصميم",
    "Clothing manufacturing": "تصنيع الملابس",
    "Photo shoots": "جلسات التصوير",
    "Web developing": "تطوير المواقع",
    Marketing: "التسويق",
    "Seniors uniform": "يونيفورم الخريجين",
    Interior: "التصميم الداخلي",
    "Interior design": "تصميم داخلي",
    Execution: "التنفيذ",
    "Book a shoot": "احجز جلسة",
    "Book a studio": "احجز استوديو",
    Rooms: "الغرف",
    "Media buying": "شراء الإعلانات",
    UGC: "محتوى المستخدم",
  };
  let lang = "en";
  try {
    lang = localStorage.getItem("lclang") === "ar" ? "ar" : "en";
  } catch (e) {}
  function ui(k) {
    return (UI[lang] && UI[lang][k]) || UI.en[k] || k;
  }
  function svcName(n) {
    return lang === "ar" && SVC_AR[n] ? SVC_AR[n] : n;
  }
  function nightNow() {
    const h = new Date().getHours();
    return h >= 18 || h < 6;
  }
  function readAuto() {
    try {
      return localStorage.getItem("lcauto") === "1";
    } catch (e) {
      return false;
    }
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
    $("#st").textContent = playing ? ui("running") : ui("stopped");
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
    const lampHit = lampRig ? rc.intersectObject(lampRig, true)[0] : null;
    const walkHit = rc.intersectObject(walk, true)[0];
    if (lampHit && (!walkHit || lampHit.distance < walkHit.distance)) return -8;
    if (walkHit) return -2;
    if (camProp && rc.intersectObject(camProp, true).length) return -3;
    if (phG && rc.intersectObject(phG, true).length) return -4;
    if (flagG && rc.intersectObject(flagG, true).length) return -5;
    if (envG && rc.intersectObject(envG, true).length) return -6;
    const h = rc.intersectObjects(
      ST.map((s) => s.g),
      true,
    );
    const rugHit = rugMesh ? rc.intersectObject(rugMesh, true)[0] : null;
    if (rugHit && (!h.length || rugHit.distance < h[0].distance)) return -7;
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
      i === -8 ? "ns-resize" : i >= 0 || i === -2 || i === -3 || i === -4 || i === -5 || i === -6 || i === -7 ? "pointer" : "grab";
    tip.classList.toggle("v", i >= 0 || i === -3 || i === -4 || i === -5 || i === -6 || i === -7 || i === -8);
    if (i >= 0 || i === -3 || i === -4 || i === -5 || i === -6 || i === -7 || i === -8) {
      tip.querySelector("b").innerHTML =
        i === -3
          ? "<span>•</span>Selfie"
          : i === -4
            ? "<span>•</span>Telephone"
            : i === -5
              ? "<span>•</span>Your order"
              : i === -6
                ? "<span>•</span>Reviews"
                : i === -7
                  ? "<span>07</span>Interior"
                  : i === -8
                    ? "<span>•</span>Lamp"
                    : "<span>0" + (i + 1) + "</span>" + ST[i].name;
      tip.querySelector("p").textContent =
        i === -3
              ? "Take a photo. It is saved in your album. Sign in first."
          : i === -4
            ? "The door stays open until a call comes in. It closes for the call, then opens again when the call is finished."
            : i === -5
              ? "See your order and its stage."
              : i === -6
                ? "Read and leave a review. The blue mailbox stays open until you send one, then it closes."
                : i === -7
                  ? "Open interior design or execution for this space."
                  : i === -8
                    ? "Drag the light, pull the chain to lower it."
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
    else if (i === -7 && RUG >= 0) go(RUG);
  });
  R.domElement.addEventListener("pointerdown", (e) => {
    if (hit(e) === -3) camDown = true;
  });
  let lampDrag = false,
    lampY0 = 0,
    lampT0 = 0;
  R.domElement.addEventListener(
    "pointerdown",
    (e) => {
      if (e.button != null && e.button !== 0) return;
      if (hit(e) !== -8) return;
      if (lampAnim) cancelAnimationFrame(lampAnim);
      lampAnim = 0;
      lampDrag = true;
      lampY0 = e.clientY;
      lampT0 = lampT;
      ctrl.enabled = false;
      e.preventDefault();
      e.stopPropagation();
    },
    true,
  );
  addEventListener("pointermove", (e) => {
    if (!lampDrag) return;
    setLamp(lampT0 + (e.clientY - lampY0) / 220);
  });
  addEventListener("pointerup", () => {
    if (!lampDrag) return;
    lampDrag = false;
    ctrl.enabled = true;
  });
  addEventListener("pointercancel", () => {
    if (!lampDrag) return;
    lampDrag = false;
    ctrl.enabled = true;
  });
  if (lampBtn)
    lampBtn.addEventListener("click", () => {
      moveLamp(lampT > 0.45 ? 0 : 0.82);
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
  {
    const IX = SV.length;
    SV.push(
      {
        n: "Interior design",
        slug: "interior-design",
        lab: "Interior",
        par: IX + 2,
        s: "Name your space, add its measurements and design it in 3D, then tell us what you need. Prices are confirmed after we review your brief.",
        q: [
          {
            t: "What kind of space is it?",
            o: [
              ["Apartment", "?*"],
              ["Villa", "?*"],
              ["Office", "?*"],
              ["Shop or restaurant", "?*"],
            ],
          },
          {
            t: "What do you need?",
            m: 1,
            req: 1,
            o: [
              ["Layout plan", "?*"],
              ["3D visuals", "?*"],
              ["Mood board and styling", "?*"],
              ["Furniture selection", "?*"],
              ["Lighting plan", "?*"],
            ],
          },
          {
            t: "How big is the space?",
            np: 1,
            o: [
              ["Up to 50 m2", 0],
              ["50 to 100 m2", 0],
              ["100 to 200 m2", 0],
              ["Over 200 m2", 0],
            ],
          },
          {
            t: "Which style do you like?",
            np: 1,
            o: [
              ["Modern", 0],
              ["Classic", 0],
              ["Minimalist", 0],
              ["Industrial", 0],
              ["Not sure yet", 0],
            ],
          },
          {
            t: "How fast do you need it?",
            o: [
              ["Standard (3 weeks)", 0],
              ["Rush (1 week)", "?*"],
            ],
          },
        ],
      },
      {
        n: "Execution",
        slug: "interior-execution",
        lab: "Interior",
        par: IX + 2,
        s: "We build and fit out the approved design on site. Prices are confirmed after a site review.",
        q: [
          {
            t: "What work do you need?",
            m: 1,
            req: 1,
            o: [
              ["Full fit-out", "?*"],
              ["Painting and finishing", "?*"],
              ["Carpentry and furniture", "?*"],
              ["Electrical and lighting", "?*"],
              ["Flooring and ceilings", "?*"],
            ],
          },
          {
            t: "Do you already have an approved design?",
            np: 1,
            o: [
              ["Yes, I have the drawings", 0],
              ["Partly", 0],
              ["No, I also need the design", 0],
            ],
          },
          {
            t: "How big is the space?",
            np: 1,
            o: [
              ["Up to 50 m2", 0],
              ["50 to 100 m2", 0],
              ["100 to 200 m2", 0],
              ["Over 200 m2", 0],
            ],
          },
          {
            t: "Which materials level?",
            o: [
              ["Standard", "?*"],
              ["Premium", "?*"],
              ["Luxury", "?*"],
            ],
          },
          {
            t: "When should we start?",
            np: 1,
            o: [
              ["Within 2 weeks", 0],
              ["Within a month", 0],
              ["I am flexible", 0],
            ],
          },
        ],
      },
      {
        n: "Interior",
        slug: "interior",
        pick: [IX, IX + 1],
        tag: "Rug",
        s: "Choose what you would like to open.",
        q: [],
      },
    );
    RUG = IX + 2;
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
  const rugB = document.createElement("button");
  rugB.type = "button";
  rugB.className = "pin rugb";
  rugB.innerHTML = '<i>07</i><span class="pn">Interior</span>';
  rugB.setAttribute("aria-label", "Interior: Interior design and Execution");
  rugB.onclick = () => go(RUG);
  pins.appendChild(rugB);
  const pv = new THREE.Vector3();
  function pinUpdate() {
    const aw = W(),
      ah = H();
    if (!aw || !ah || !pinB.length) return;
    const room = Math.max(0, Math.min(1, (Math.min(aw, ah * 1.35) - 360) / 540));
    const narrow = aw < 760;
    const padX = Math.max(36 + 34 * room, narrow ? Math.min(96, aw * 0.24) : 0);
    const padTop = 56 + 24 * room;
    const padBot = Math.max(140 + 50 * room, ah * (0.22 + 0.06 * (1 - room)));
    const placed = [];
    const sepX = narrow ? 96 : 42 + 12 * room;
    const sepY = narrow ? 38 : 24 + 4 * room;
    if (rugB) {
      pv.set(0, 0.27, 0);
      machine.localToWorld(pv);
      pv.project(cam);
      const rby = (-pv.y * 0.5 + 0.5) * ah;
      pv.set(0, 4.75, 0);
      machine.localToWorld(pv);
      pv.project(cam);
      let rx = (pv.x * 0.5 + 0.5) * aw;
      let ry = (-pv.y * 0.5 + 0.5) * ah;
      rx = Math.max(padX, Math.min(aw - padX, rx));
      ry = Math.max(padTop, Math.min(ah - padBot, ry));
      rugB.style.setProperty("--stem", Math.max(14, rby - ry) + "px");
      rugB.style.transform = "translate(" + rx + "px," + ry + "px) translate(-50%,-100%)";
      placed.push({ x: rx, y: ry });
    }
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
        for (let n = 0; n < 10; n++) {
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
    const label = on ? a.email : ui("signin");
    const btn = $("#accbtn");
    if (btn) btn.textContent = label;
    const mail = $("#menuemail");
    if (mail) mail.textContent = on ? a.email : ui("guest");
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
    try {
      syncMail(false);
    } catch (e) {}
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
        ? ui("notein")
        : accMode === "login"
          ? ui("notelogin")
          : ui("notesign");
    }
    const title = document.querySelector("#accform .acc-h b");
    if (title) title.textContent = signedView ? ui("youremail") : accMode === "login" ? ui("signin") : ui("signup");
    const submit = accForm && accForm.querySelector('button[type="submit"]');
    if (submit) {
      submit.hidden = signedView;
      submit.textContent = accMode === "login" ? ui("signin") : ui("signup");
    }
    const forgot = $("#accforgot");
    if (forgot) forgot.hidden = signedView;
    const reset = $("#accreset");
    if (reset && signedView) reset.hidden = true;
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
        '<div class="hd"><span>' +
        (s.slug === "interior" ? "07" : "0" + (i + 1) + " / 06") +
        "</span><h1>" +
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
      '<div class="hd"><span>' +
      (s.lab === "Interior" ? "07" : "0" + ((s.par != null ? s.par : i) + 1) + " / 06") +
      "</span><h1>" +
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
    const b = pinB[i] || (i === RUG ? rugB : null);
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
    tbt.textContent =
      (s.lab === "Interior" || s.slug === "interior" ? "07 \u00b7 " : n < 6 ? "0" + (n + 1) + " / 06 \u00b7 " : "") +
      s.n;
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
    phoneInCall = false;
    syncPhoneDoor();
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
    if (!saved.token) {
      phoneIncoming = false;
      syncPhoneDoor();
      return;
    }
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: "my_invite", token: saved.token }),
      });
      const data = await res.json().catch(() => ({}));
      phoneIncoming = !!(res.ok && data.ok && data.pending && data.access_code);
      syncPhoneDoor();
      const codeEl = $("#mc");
      if (!phoneIncoming || !codeEl) return;
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
    phoneInCall = true;
    syncPhoneDoor();
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
      const reopen = () => {
        phoneInCall = false;
        syncPhoneDoor();
        pullInvite();
      };
      MT.api.addListener("videoConferenceLeft", reopen);
      MT.api.addListener("readyToClose", reopen);
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
    pullInvite();
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
  if (!MT.doorWatch) {
    MT.doorWatch = setInterval(() => {
      if (!MT.poll) pullInvite();
    }, 5000);
    pullInvite();
  }
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
    const doorNote = mailReviewed()
      ? "Your mailbox is closed. You can still read reviews."
      : "The mailbox stays open until you send a review.";
    pg.innerHTML =
      '<div id="rv"><div class="bx"><h3>Customer reviews</h3><p class="avg" id="rvdoor">' +
      doorNote +
      '</p><p class="avg" id="rva">Loading reviews…</p>' +
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
        markMailReviewed();
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
      (SVC_AR[x.n] || "") +
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
    label.textContent = svcName(SV[i].n);
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
      if (RUG >= 0) menuListEl.appendChild(menuBtn(RUG, "07"));
      return;
    }
    const words = q.split(/\s+/);
    const hits = menuIdx.filter((o) => words.every((word) => o.h.includes(word))).slice(0, 8);
    hits.forEach((o) => menuListEl.appendChild(menuBtn(o.i, "\u2192")));
    if (!hits.length) {
      const empty = document.createElement("p");
      empty.className = "mno";
      empty.textContent = ui("nomatch") + " \u201c" + (menuSearch ? menuSearch.value.trim() : q) + "\u201d.";
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
      btn.setAttribute("aria-label", on ? ui("closemenu") : ui("openmenu"));
    }
    if (on && menuSearch) {
      menuSearch.value = "";
      menuList("");
    }
  }
  function paintMood() {
    const dark = document.documentElement.classList.contains("dark");
    const auto = readAuto();
    const d = $("#darkmode");
    const a = $("#automode");
    if (d) {
      d.setAttribute("aria-pressed", dark ? "true" : "false");
      const b = d.querySelector("b");
      const s = $("#darkstate");
      if (b) b.textContent = ui("dark");
      if (s) s.textContent = ui(dark ? "on" : "off");
    }
    if (a) {
      a.setAttribute("aria-pressed", auto ? "true" : "false");
      const b = a.querySelector("b");
      const s = $("#autostate");
      if (b) b.textContent = ui("auto");
      if (s) s.textContent = ui(auto ? "on" : "off");
    }
  }
  function applyMood(dark) {
    document.documentElement.classList.toggle("dark", !!dark);
    try {
      localStorage.setItem("lcdark", dark ? "1" : "0");
    } catch (e) {}
    moveLamp(dark ? 0.82 : 0);
    paintMood();
  }
  function applyChrome() {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    try {
      localStorage.setItem("lclang", lang);
    } catch (e) {}
    const set = (sel, key) => {
      const el = document.querySelector(sel);
      if (el) el.textContent = ui(key);
    };
    set(".svc", "services");
    set("#mdod b", "help");
    set("#mdod small", "help2");
    set("#mlogin", "signin");
    set("#msignup", "signup");
    set("#mlogout", "logout");
    set("#accsignup", "signup");
    set("#acclogin", "signin");
    if (menuSearch) menuSearch.placeholder = ui("search");
    const modes = { assembled: "assembled", stations: "stations", order: "beanie" };
    document.querySelectorAll("[data-mode]").forEach((b) => {
      if (modes[b.dataset.mode]) b.textContent = ui(modes[b.dataset.mode]);
    });
    const cams = { overview: "overview", side: "side", top: "top", station: "station", flight: "flight" };
    document.querySelectorAll("[data-cam]").forEach((b) => {
      if (cams[b.dataset.cam]) b.textContent = ui(cams[b.dataset.cam]);
    });
    const cap = document.querySelector("#cams .cap");
    if (cap) cap.textContent = ui("view");
    const ln = $("#langname");
    if (ln) ln.textContent = lang === "ar" ? "العربية" : "English";
    document.querySelectorAll("#langpop button").forEach((b) => {
      b.setAttribute("aria-pressed", b.dataset.lang === lang ? "true" : "false");
    });
    paintMood();
    paintAcc();
    if ($("#account") && !$("#account").hidden) setAccMode(accMode);
    sp();
    menuList(menuSearch ? menuSearch.value : "");
  }
  if ($("#darkmode"))
    $("#darkmode").addEventListener("click", () => {
      try {
        localStorage.setItem("lcauto", "0");
      } catch (e) {}
      applyMood(!document.documentElement.classList.contains("dark"));
    });
  if ($("#automode"))
    $("#automode").addEventListener("click", () => {
      const on = !readAuto();
      try {
        localStorage.setItem("lcauto", on ? "1" : "0");
      } catch (e) {}
      if (on) applyMood(nightNow());
      else paintMood();
    });
  if ($("#langb"))
    $("#langb").addEventListener("click", (e) => {
      e.stopPropagation();
      const pop = $("#langpop");
      if (!pop) return;
      pop.hidden = !pop.hidden;
      $("#langb").setAttribute("aria-expanded", pop.hidden ? "false" : "true");
    });
  document.querySelectorAll("#langpop button").forEach((b) => {
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      lang = b.dataset.lang === "ar" ? "ar" : "en";
      const pop = $("#langpop");
      if (pop) pop.hidden = true;
      if ($("#langb")) $("#langb").setAttribute("aria-expanded", "false");
      applyChrome();
    });
  });
  document.addEventListener("click", (e) => {
    const pop = $("#langpop");
    if (!pop || pop.hidden) return;
    if (e.target.closest("#langpop") || e.target.closest("#langb")) return;
    pop.hidden = true;
    if ($("#langb")) $("#langb").setAttribute("aria-expanded", "false");
  });
  applyChrome();
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
        let data = {};
        let res = null;
        let netErr = null;
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            const ctrl = new AbortController();
            const timer = setTimeout(() => ctrl.abort(), 20000);
            res = await fetch("/api/account", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
              signal: ctrl.signal,
            });
            clearTimeout(timer);
            data = await res.json().catch(() => ({}));
            netErr = null;
            break;
          } catch (ex) {
            netErr = ex;
            if (attempt === 0) await new Promise((r) => setTimeout(r, 700));
          }
        }
        if (netErr) throw netErr;
        if (!res || !res.ok || !data.ok) throw new Error((data && data.error) || "Could not save your email.");
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
        const verb = accMode === "login" ? "Sign in" : "Sign up";
        let msg = (ex && ex.message) || "Could not save your email.";
        if (location.protocol === "file:") {
          msg = "Open http://127.0.0.1:8765 in the browser. A page opened from a file cannot sign up.";
        } else if ((ex && ex.name === "AbortError") || /failed to fetch|networkerror|load failed|aborted/i.test(msg)) {
          msg =
            ex && ex.name === "AbortError"
              ? "The server took too long to answer. Refresh the page and try " + verb + " again."
              : location.hostname === "127.0.0.1" || location.hostname === "localhost"
                ? "Could not reach the local server. Refresh http://127.0.0.1:8765 and try " + verb + " again."
                : "Could not reach the server. Refresh the page and try " + verb + " again.";
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
  function togglePass(input, button) {
    if (!input || !button) return;
    const on = input.type === "password";
    input.type = on ? "text" : "password";
    button.textContent = on ? "Hide" : "Show";
    button.setAttribute("aria-pressed", on ? "true" : "false");
    button.setAttribute("aria-label", on ? "Hide password" : "Show password");
  }
  if ($("#accsee")) $("#accsee").addEventListener("click", () => togglePass($("#accpass"), $("#accsee")));
  if ($("#accseenew")) $("#accseenew").addEventListener("click", () => togglePass($("#accnew"), $("#accseenew")));
  if ($("#accforgot"))
    $("#accforgot").addEventListener("click", () => {
      const box = $("#accreset");
      if (!box) return;
      box.hidden = !box.hidden;
    });
  async function accountPost(payload) {
    const res = await fetch("/api/account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) throw new Error(data.error || "The request failed.");
    return data;
  }
  if ($("#accsend"))
    $("#accsend").addEventListener("click", async () => {
      const err = $("#accerr");
      const email = ($("#accemail") && $("#accemail").value.trim()) || "";
      if (err) {
        err.hidden = true;
        err.textContent = "";
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        if (err) {
          err.hidden = false;
          err.textContent = "Enter the email on the account, then send the code.";
        }
        return;
      }
      $("#accsend").disabled = true;
      try {
        await accountPost({ mode: "forgot", customer_email: email });
        if (err) {
          err.hidden = false;
          err.textContent = "If that email has an account, we sent a 6-digit code. It expires in 15 minutes.";
        }
      } catch (ex) {
        if (err) {
          err.hidden = false;
          err.textContent = (ex && ex.message) || "The reset email could not be sent.";
        }
      } finally {
        $("#accsend").disabled = false;
      }
    });
  if ($("#accset"))
    $("#accset").addEventListener("click", async () => {
      const err = $("#accerr");
      const email = ($("#accemail") && $("#accemail").value.trim()) || "";
      const code = ($("#acccode") && $("#acccode").value.trim()) || "";
      const next = ($("#accnew") && $("#accnew").value) || "";
      if (err) {
        err.hidden = true;
        err.textContent = "";
      }
      if (!/^\d{6}$/.test(code) || next.length < 6) {
        if (err) {
          err.hidden = false;
          err.textContent = "Enter the 6-digit code and a new password of at least 6 characters.";
        }
        return;
      }
      $("#accset").disabled = true;
      try {
        await accountPost({ mode: "reset", customer_email: email, code, password: next });
        if ($("#accpass")) $("#accpass").value = "";
        if ($("#accnew")) $("#accnew").value = "";
        if ($("#acccode")) $("#acccode").value = "";
        if ($("#accreset")) $("#accreset").hidden = true;
        setAccMode("login");
        if (err) {
          err.hidden = false;
          err.textContent = "Password updated. Sign in with the new password.";
        }
      } catch (ex) {
        if (err) {
          err.hidden = false;
          err.textContent = (ex && ex.message) || "The new password was not saved.";
        }
      } finally {
        $("#accset").disabled = false;
      }
    });
  function toggleInsta() {
    const pop = $("#ipop");
    const btn = $("#minstapay");
    if (!pop) return;
    pop.hidden = !pop.hidden;
    if (btn) btn.setAttribute("aria-expanded", pop.hidden ? "false" : "true");
  }
  if ($("#minstapay"))
    $("#minstapay").addEventListener("click", (e) => {
      e.stopPropagation();
      toggleInsta();
    });
  document.addEventListener("click", (e) => {
    const pop = $("#ipop");
    if (!pop || pop.hidden) return;
    if (e.target.closest("#ipop") || e.target.closest("#minstapay")) return;
    pop.hidden = true;
    if ($("#minstapay")) $("#minstapay").setAttribute("aria-expanded", "false");
  });
  function paintRain(on) {
    let layer = $("#rain");
    if (!layer) {
      layer = document.createElement("div");
      layer.id = "rain";
      layer.setAttribute("aria-hidden", "true");
      document.body.appendChild(layer);
    }
    layer.hidden = !on;
    if (!on) {
      layer.innerHTML = "";
      return;
    }
    if (layer.childElementCount) return;
    for (let i = 0; i < 56; i++) {
      const drop = document.createElement("i");
      drop.style.left = Math.random() * 100 + "%";
      drop.style.animationDuration = 0.65 + Math.random() * 0.95 + "s";
      drop.style.animationDelay = -Math.random() * 1.8 + "s";
      drop.style.opacity = String(0.35 + Math.random() * 0.5);
      layer.appendChild(drop);
    }
  }
  async function pollRain() {
    try {
      const res = await fetch("/api/site");
      const data = await res.json();
      paintRain(!!data.rain);
    } catch (e) {}
  }
  pollRain();
  setInterval(pollRain, 8000);
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
    cb.setAttribute("aria-label", "Open the camera and your album");
    cb.innerHTML = ICON + "<em hidden></em>";
    appEl.appendChild(cb);
    camBtnEl = cb;
    const alb = document.createElement("button");
    alb.id = "albbtn";
    alb.type = "button";
    alb.className = "albbtn";
    alb.hidden = true;
    alb.setAttribute("aria-label", "Open your album");
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
    box.setAttribute("aria-label", "Lay C camera and album");
    appEl.appendChild(box);
    let tab = "all";
    let view = "";
    let facing = "user";
    let last = null;
    let count = 0;
    let albumMeta = { mine: 0, locked: true, private: true, published: false, reason: "" };
    let stream = null;
    let pendingCam = null;
    let shooting = false;
    let shotComment = "";
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
      const data = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
      let n = 0;
      let sum = 0;
      let sum2 = 0;
      const step = Math.max(16, Math.floor(data.length / 16000)) * 4;
      for (let i = 0; i < data.length; i += step) {
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
            (p.comment ? '<span class="ccmt">' + esc(p.comment) + "</span>" : "") +
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
          "</div><h2>Welcome to the LAY C family</h2><p>We are so happy to have you with us. Take a picture and we will save it in your album.</p>" +
          (acc.token
            ? '<p class="sst">' +
              (albumMeta.published
                ? "Your album is public. A new photo is saved in that album, and the album cannot be made private."
                : "Your photo is saved in your album. Use the share icon on the album if you want to make it public. That cannot be undone.") +
              "</p>"
            : "") +
          '<button type="button" class="cp" data-a="cam">Take a picture</button>' +
          (count ? '<button type="button" class="cs" data-a="album">Open your album (' + count + ")</button>" : "") +
          (acc.token ? "" : '<button type="button" class="cs" data-a="signin">Sign in</button>') +
          "</div>";
      } else if (next === "camera") {
        box.innerHTML =
          '<div class="cbox cc"><div class="cv"><video id="cvid" playsinline muted autoplay></video><div class="cmsg" id="cmsg" hidden><p>Use the camera in this browser. Only a legal photo can be saved.</p></div></div><label class="cnote-l">Comment<textarea id="cnote" class="cnote" maxlength="280" placeholder="Write a comment for this photo"></textarea></label><div class="cbar"><button type="button" class="cs" data-a="back">Cancel</button><button type="button" class="shut" data-a="shot" aria-label="Take the picture"></button><button type="button" class="cs" data-a="flip">Flip</button></div></div>';
        const note = box.querySelector("#cnote");
        if (note) {
          note.value = shotComment;
          note.addEventListener("input", () => {
            shotComment = note.value.slice(0, 280);
          });
        }
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
          esc(arg.heading || "Saved to your album") +
          '</h2><p class="sst">Uploaded ' +
          esc(when(arg.ts)) +
          '</p><p class="sst" id="sst">' +
          esc(arg.note || "The photo was saved.") +
          "</p>" +
          (arg.comment ? '<p class="ccmt">' + esc(arg.comment) + "</p>" : "") +
          '<button type="button" class="cp" data-a="album">Open your album (' +
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
          const empty = all ? "No shared pictures yet. Be the first!" : "Your album is empty. Take a picture with the camera.";
          body = photos.length ? grid(photos) : '<p class="em">' + esc(albumMeta.locked ? albumMeta.reason || empty : empty) + "</p>";
        } catch (ex) {
          body = '<p class="em">' + esc(ex.message || "The album could not be opened.") + "</p>";
        }
        const shareBtn = albumMeta.published
          ? '<button type="button" class="sharebtn" disabled aria-pressed="true" aria-label="This album is public and cannot be made private">' +
            SHARE +
            "</button>"
          : '<button type="button" class="sharebtn" data-a="share-album" aria-pressed="false" aria-label="Share this album">' +
            SHARE +
            "</button>";
        box.classList.toggle("prot", all && !albumMeta.locked && (albumMeta.mine || 0) > 0);
        box.innerHTML =
          '<div class="cbox ca"><button type="button" class="cx" data-a="close" aria-label="Close">&times;</button><div class="ah"><b>Your album</b><span>' +
          n +
          " photo" +
          (n === 1 ? "" : "s") +
          "</span>" +
          shareBtn +
          '</div><div class="tabs"><button type="button" data-a="tab" data-t="all" aria-pressed="' +
          all +
          '">Everyone\'s album</button><button type="button" data-a="tab" data-t="mine" aria-pressed="' +
          !all +
          '">My album (' +
          (albumMeta.mine || 0) +
          ')</button></div><div class="bind"><div class="rings" aria-hidden="true"></div><div class="pgs">' +
          body +
          '</div></div><div class="abar"><button type="button" class="cp" data-a="cam">Take a picture</button></div></div>';
        return;
      } else if (next === "view" && arg) {
        const actions =
          '<div class="row"><button type="button" class="cs" data-a="album">Back to album</button>' +
          (arg.can_delete && !albumMeta.published
            ? '<button type="button" class="cs" data-a="delphoto" data-id="' + esc(arg.id) + '">Delete</button>'
            : "") +
          "</div>" +
          (arg.pending
            ? '<p class="sst">Waiting for review. This photo stays in your album and is not public yet.</p>'
            : albumMeta.published || arg.publish_locked || arg.shared
              ? '<p class="sst">This photo is in a public album. The album cannot be made private, and this photo cannot be deleted.</p>'
              : arg.own
                ? '<p class="sst">This photo is in your album. Only you can see it until you share the album. Sharing cannot be undone.</p>'
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
          (arg.comment ? '<p class="ccmt">' + esc(arg.comment) + "</p>" : "") +
          actions +
          "</div>";
      }
      box.classList.remove("prot");
    }
    async function upload(canvas, comment) {
      const caption = String(comment || "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 280);
      if (needAccount()) return;
      await refreshCount();
      properPhoto(canvas);
      const acc = accGet() || {};
      const image = await canvasToJpeg(canvas, 0.78);
      const thumb = await makeThumb(canvas, 280, 0.7);
      canvas.width = 0;
      canvas.height = 0;
      const res = await fetch("/api/album", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: acc.token,
          image,
          thumb,
          source: "camera",
          share: Boolean(albumMeta.published),
          comment: caption,
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
            : "Saved to your album. Only you can see it until you share the album. Sharing cannot be undone.";
      last = {
        thumb,
        ts: Date.now(),
        note: statusNote,
        comment: data.comment || caption,
        heading: data.pending ? "Waiting for review" : data.duplicate ? "Already in your album" : "Saved to your album",
      };
      shotComment = "";
      await setView("saved", last);
    }
    function closeCam() {
      stop();
      box.hidden = true;
      view = "";
      cb.focus({ preventScroll: true });
    }
    function startCamera() {
      const acc = accGet() || {};
      if (!acc.token) {
        openAcc(startCamera, "login");
        return;
      }
      box.hidden = false;
      primeCamera();
      refreshCount();
      setView("camera");
    }
    openCamera = startCamera;
    cb.onclick = () => startCamera();
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
      else if (a === "cam") startCamera(); else if (a === "album") {
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
        if (!video || !video.videoWidth) {
          showMsg("The camera is not ready yet. Wait a moment, then take the picture.");
          return;
        }
        shooting = true;
        const frame = box.querySelector(".cv");
        if (frame) frame.classList.add("fl");
        let c = null;
        try {
          c = frameFromVideo(video, 640);
          setBusy(true, "Saving your photo…");
          await upload(c, shotComment);
        } catch (ex) {
          if (frame) frame.classList.remove("fl");
          setBusy(false);
          showMsg(ex.message || "This photo cannot be saved. Only a legal photo is allowed.");
        } finally {
          shooting = false;
          if (c) {
            c.width = 0;
            c.height = 0;
          }
          const shut = box.querySelector(".shut");
          const flip = box.querySelector('[data-a="flip"]');
          if (shut) shut.disabled = false;
          if (flip) flip.disabled = false;
        }
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
        const ok = confirm("Make your album public? Every approved photo in your album is shared. You cannot make the album private again.");
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
        setView("album");
      } else if (a === "delphoto" && t.dataset.id) {
        if (!confirm("Delete this private photo from your album? This cannot be undone.")) return;
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
  const RECEIPT_TERMS = [
    "A 50% deposit is due before we start. The balance is due before delivery or handover.",
    "Prices shown as ?* are confirmed after we review your request. This receipt is the request until we confirm the final price.",
    "Work starts after you approve the design, colours and quantities.",
    "You approve designs, mockups and product details before production. Changes after approval can change the price and the date.",
    "Small differences in colour, size or finish can happen between a screen preview and the finished item.",
    "Check the order on delivery and tell us within 48 hours about any defect so we can fix it. Custom-made items are made for you.",
    "The finalized receipt is sent on WhatsApp and by email.",
  ];
  function receiptNo() {
    return "LC-" + Math.random().toString(36).slice(2, 8).toUpperCase();
  }
  function showReceipt(pack, meta) {
    const host = $("#receipt");
    const card = $("#receiptcard");
    if (!host || !card || !pack) return;
    const acc = accGet() || {};
    const when = new Date().toLocaleString("en-US");
    const no = (meta && meta.no) || pack.receiptNo || receiptNo();
    pack.receiptNo = no;
    const service = String(pack.title || "Request").replace(/ quote$/i, "");
    const lines = (pack.rows || [])
      .map((r) => "<li><span>- " + esc(r.item) + " (" + esc(r.q) + ")</span><b>" + esc(r.val) + "</b></li>")
      .join("");
    card.innerHTML =
      '<button type="button" id="receiptx" aria-label="Close receipt">&times;</button>' +
      '<div class="rlogo" aria-hidden="true"><i></i><i></i><i></i><i></i></div>' +
      '<h2>Lay C wishes you a happy life</h2>' +
      '<p class="rk">SALES RECEIPT</p>' +
      '<dl><div><dt>Receipt no.</dt><dd>' +
      esc(no) +
      "</dd></div><div><dt>Date</dt><dd>" +
      esc(when) +
      "</dd></div><div><dt>Service</dt><dd>" +
      esc(service) +
      "</dd></div>" +
      (acc.name ? "<div><dt>Customer</dt><dd>" + esc(acc.name) + "</dd></div>" : "") +
      "</dl><ul>" +
      (lines || "<li><span>Request received</span><b>—</b></li>") +
      '</ul><p class="rtot">' +
      esc(pack.total || "Total: —") +
      '</p><h3>ORDER RECEIVED</h3><p class="rsent">The finalized receipt will be sent to you on WhatsApp &amp; as an Email.</p><h4>TERMS AND CONDITIONS</h4><ol>' +
      RECEIPT_TERMS.map((t) => "<li>" + esc(t) + "</li>").join("") +
      "</ol>";
    host.hidden = false;
    const close = $("#receiptx");
    if (close) close.onclick = () => {
      host.hidden = true;
    };
    host.onclick = (e) => {
      if (e.target === host) host.hidden = true;
    };
  }
  async function makeQuotePdf(pack) {
    await loadScript("https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js", () =>
      Boolean(window.jspdf && window.jspdf.jsPDF),
    );
    const JsPDF = window.jspdf.jsPDF;
    const doc = new JsPDF({ unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const left = 48;
    const right = pageW - 48;
    let y = 54;
    const blue = [65, 105, 225];
    const navy = [15, 42, 138];
    doc.setFillColor(...blue);
    doc.rect(pageW / 2 - 16, y, 13, 13, "F");
    doc.rect(pageW / 2 + 1, y, 13, 13, "F");
    doc.rect(pageW / 2 - 16, y + 17, 13, 13, "F");
    doc.setFillColor(...navy);
    doc.rect(pageW / 2 + 1, y + 17, 13, 13, "F");
    y += 48;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...blue);
    doc.text("Lay C wishes you a happy life", pageW / 2, y, { align: "center" });
    y += 22;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(90, 100, 120);
    doc.text("SALES RECEIPT", left, y);
    y += 16;
    const pair = (k, v) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(20, 24, 40);
      doc.text(k, left, y);
      doc.setFont("helvetica", "normal");
      doc.text(String(v || "—"), right, y, { align: "right" });
      y += 16;
    };
    pair("Receipt no.", pack.receiptNo || receiptNo());
    pair("Date", new Date().toLocaleString("en-US"));
    pair("Service", String(pack.title || "Request").replace(/ quote$/i, ""));
    y += 4;
    doc.setDrawColor(197, 208, 240);
    doc.line(left, y, right, y);
    y += 16;
    doc.setFontSize(10);
    (pack.rows || []).forEach((r) => {
      const text = doc.splitTextToSize("- " + r.item + " (" + r.q + "): " + r.val, right - left);
      doc.text(text, left, y);
      y += text.length * 13 + 4;
      if (y > 740) {
        doc.addPage();
        y = 56;
      }
    });
    y += 6;
    doc.line(left, y, right, y);
    y += 18;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(pack.total || "Total: —", right, y, { align: "right" });
    y += 28;
    doc.setTextColor(...navy);
    doc.text("ORDER RECEIVED", pageW / 2, y, { align: "center" });
    y += 16;
    doc.setFontSize(10);
    doc.setTextColor(...blue);
    const sent = doc.splitTextToSize("The finalized receipt will be sent to you on WhatsApp & as an Email.", right - left);
    doc.text(sent, pageW / 2, y, { align: "center" });
    y += sent.length * 13 + 14;
    doc.setFontSize(8);
    doc.setTextColor(90, 100, 120);
    doc.text("TERMS AND CONDITIONS", left, y);
    y += 12;
    doc.setFont("helvetica", "normal");
    RECEIPT_TERMS.forEach((term, i) => {
      const text = doc.splitTextToSize(i + 1 + ". " + term, right - left);
      if (y + text.length * 10 > 800) {
        doc.addPage();
        y = 56;
      }
      doc.text(text, left, y);
      y += text.length * 10 + 3;
    });
    const blob = doc.output("blob");
    return new File([blob], "Lay C-receipt.pdf", { type: "application/pdf" });
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
    if (!quotePack.receiptNo) quotePack.receiptNo = receiptNo();
    showReceipt(quotePack);
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
  // INTERIOR DESIGN. The rug opens this workflow. State stays in memory for the visit.
  {const RM=[];
// name, icon, coins, default color, bottom height, wall piece (1 = snaps to a wall)
const F=[['Sofa','🛋️',3500,'#5b7db1',0,0],['Armchair','💺',1800,'#c27b5a',0,0],['Bed','🛏️',4500,'#8fa8c8',0,0],['Dining table','🍽️',2500,'#a47148',0,0],['Coffee table','☕',1200,'#8b5e3c',0,0],['Chair','🪑',500,'#a47148',0,0],['Desk','🖥️',2200,'#c9a27a',0,0],['Wardrobe','🗄️',3800,'#b88a5e',0,0],['TV unit','📺',3000,'#3b3b3f',0,0],['Bookshelf','📚',1800,'#a47148',0,0],['Plant','🪴',400,'#c9784a',0,0],['Floor lamp','💡',900,'#f2d28b',0,0],['Rug','🟫',1100,'#b34b4b',0,0],['Kitchen counter','🍳',4000,'#f1efe9',0,0],['Fridge','🧊',3500,'#dfe3e6',0,0],['Bathtub','🛁',4000,'#f4f6f7',0,0],['Toilet','🚽',1200,'#f4f6f7',0,0],['Window','🪟',1200,'#f5f5f5',.9,1],['Door','🚪',1500,'#a47148',0,1],['Picture','🖼️',300,'#e0b84f',1.4,1]];
const BD={
'Sofa':(B,C)=>{const L='#4a3524';[[-.86,-.36],[.86,-.36],[-.86,.36],[.86,.36]].forEach(p=>C(.035,.12,p[0],0,p[1],['wood',L],0,.024));
B(2,.26,.9,0,.1,0,0,1,.05);[-.53,0,.53].forEach(x=>B(.52,.17,.68,x,.36,.09,0,1,.07));B(2,.52,.22,0,.36,-.34,0,1,.08);
[-.53,0,.53].forEach(x=>B(.52,.42,.2,x,.5,-.2,0,1,.08,-.14));B(.22,.38,.9,-.89,.36,0,0,1,.09);B(.22,.38,.9,.89,.36,0,0,1,.09);
B(.42,.4,.13,.62,.55,-.02,['fabric','#e6d8bd'],0,.06,-.3,.25);B(.4,.38,.12,-.62,.55,-.04,['fabric','#8a9a80'],0,.06,-.3,-.2)},
'Armchair':(B,C)=>{[[-.35,-.32],[.35,-.32],[-.35,.32],[.35,.32]].forEach(p=>C(.03,.14,p[0],0,p[1],['wood','#4a3524'],0,.02));
B(.9,.24,.85,0,.12,0,0,1,.05);B(.58,.15,.66,0,.36,.07,0,1,.07);B(.9,.52,.2,0,.36,-.33,0,1,.08);B(.58,.36,.14,0,.5,-.2,0,1,.07,-.16);
B(.16,.3,.85,-.37,.36,0,0,1,.07);B(.16,.3,.85,.37,.36,0,0,1,.07)},
'Bed':(B)=>{const W='#6b4a2f';B(1.7,.3,2.1,0,.08,0,['wood',W],0,.03);[[-.8,-1],[.8,-1],[-.8,1],[.8,1]].forEach(p=>B(.07,.1,.07,p[0],0,p[1],['wood',W],0,.01));
B(1.62,.24,2.02,0,.38,0,['fabric','#f1efe9'],0,.07);B(1.7,.12,1.45,0,.54,.3,0,1,.06);B(1.72,.14,.4,0,.58,-.12,0,1,.06);
B(.62,.15,.4,-.4,.6,-.78,['fabric','#fbfbfa'],0,.07,-.12);B(.62,.15,.4,.4,.6,-.78,['fabric','#fbfbfa'],0,.07,-.12);
B(1.8,.95,.1,0,.08,-1.05,['wood',W],0,.035);B(1.5,.55,.05,0,.5,-.985,['fabric','#c9b9a3'],0,.03)},
'Dining table':(B,C)=>{B(1.6,.05,.9,0,.73,0,0,1,.015);B(1.42,.09,.72,0,.64,0,0,1,.01);[[-.7,-.38],[.7,-.38],[-.7,.38],[.7,.38]].forEach(p=>C(.04,.72,p[0],0,p[1],['wood','#4a3524'],0,.026))},
'Coffee table':(B,C)=>{B(1,.05,.6,0,.38,0,0,1,.02);B(.88,.025,.48,0,.12,0,['wood','#6b4a2f'],0,.008);[[-.45,-.25],[.45,-.25],[-.45,.25],[.45,.25]].forEach(p=>C(.022,.38,p[0],0,p[1],['metal','#2b2b2e'],0,.018))},
'Chair':(B,C)=>{B(.45,.05,.45,0,.45,0,0,1,.02);B(.43,.08,.04,0,.92,-.2,0,1,.015);[-.15,0,.15].forEach(x=>B(.05,.38,.025,x,.54,-.2,0,1,.01));
[[-.19,-.19],[.19,-.19],[-.19,.19],[.19,.19]].forEach(p=>C(.024,.45,p[0],0,p[1],['wood','#2d2d2d'],0,.017));B(.04,.5,.04,-.19,.5,-.2,['wood','#2d2d2d'],0,.01);B(.04,.5,.04,.19,.5,-.2,['wood','#2d2d2d'],0,.01)},
'Desk':(B,C,g,S,E)=>{const D='#2a2a2d';B(1.4,.04,.7,0,.72,0,0,1,.012);B(.05,.72,.66,-.65,0,0,0,1,.01);B(.05,.72,.66,.65,0,0,0,1,.01);B(1.25,.3,.02,0,.38,-.3,0,1,.005);
C(.08,.012,0,.76,-.2,['metal',D],0,.07);B(.04,.12,.03,0,.76,-.21,['metal',D],0,.008);B(.54,.33,.03,0,.86,-.2,['rubber','#0b0b0c'],0,.01);E(.5,.29,.004,0,.88,-.183,'#000',.8,'tv');
B(.4,.016,.13,0,.76,.08,['rubber','#1d1d20'],0,.005);B(.07,.025,.1,.3,.76,.1,['rubber','#222'],0,.01)},
'Wardrobe':(B)=>{B(1.2,1.95,.6,0,.05,0,0,1,.012);B(1.1,.05,.5,0,0,0,['rubber','#161616'],0,.005);B(.58,1.78,.016,-.295,.12,.305,0,1,.006);B(.58,1.78,.016,.295,.12,.305,0,1,.006);
B(.01,1.9,.02,0,.1,.31,['rubber','#111'],0,.003);B(.02,.3,.026,-.05,.95,.325,['metal','#d4af37'],0,.008);B(.02,.3,.026,.05,.95,.325,['metal','#d4af37'],0,.008)},
'TV unit':(B,C,g,S,E)=>{B(1.6,.45,.4,0,.04,0,0,1,.015);[[-.7,-.15],[.7,-.15],[-.7,.15],[.7,.15]].forEach(p=>C(.02,.04,p[0],0,p[1],['wood','#222'],0,.015));
B(.012,.38,.01,-.265,.08,.205,['rubber','#111'],0,.003);B(.012,.38,.01,.265,.08,.205,['rubber','#111'],0,.003);B(.16,.014,.02,-.4,.36,.21,['metal','#c9c9c9'],0,.005);B(.16,.014,.02,.4,.36,.21,['metal','#c9c9c9'],0,.005);
B(.45,.015,.2,0,.49,0,['metal','#1a1a1a'],0,.005);B(.06,.1,.03,0,.5,-.02,['metal','#1a1a1a'],0,.008);B(1.25,.72,.04,0,.6,-.02,['rubber','#0a0a0a'],0,.01);E(1.2,.67,.004,0,.625,.002,'#000',.75,'tv')},
'Bookshelf':(B)=>{const Wd='#3a2a1c';B(.04,1.9,.3,-.48,0,0,0,1,.006);B(.04,1.9,.3,.48,0,0,0,1,.006);B(.92,1.9,.012,0,0,-.144,['wood',Wd],0,.002);
[0,.42,.82,1.22,1.62,1.87].forEach(y=>B(.92,.03,.3,0,y,0,0,1,.006));
const cs=['#8c2f2b','#2d5d8a','#2f6b4a','#c98a2b','#5a4a7a','#d8d2c4','#a8553a','#3b3b44'];let s=3;const r=()=>{s=(s*9301+49297)%233280;return s/233280};
[.03,.45,.85,1.25].forEach(y0=>{let x=-.44;while(x<.4){const w=.025+r()*.035,h=.22+r()*.12,ln=r()<.06;if(r()<.12){x+=.08+r()*.1;continue}B(w,h,.2+r()*.04,x+w/2,y0,.02,['paper',cs[Math.floor(r()*cs.length)]],0,.004,0,ln?.18:0);x+=w+.002}})},
'Plant':(B,C,g,S)=>{C(.2,.35,0,0,0,0,1,.16);C(.155,.02,0,.335,0,['rubber','#2a1c12']);C(.018,.55,0,.34,0,['wood','#5a4630'],0,.012);
const gc=['#2f8f4e','#3aa35c','#277a43','#43b06a'];for(let i=0;i<20;i++){const a=i*2.39996,t=i/19,y=.62+t*.62,rr=.07+.1*(1-Math.abs(t-.35)*1.2),sz=.15-.04*t;S(sz,Math.cos(a)*rr,y,Math.sin(a)*rr,['leaf',gc[i%4]],0,1.5,.1,.7,0,-a,.5+.3*(1-t))}},
'Floor lamp':(B,C,g)=>{C(.18,.03,0,0,0,['metal','#2a2a2a'],0,.17);C(.012,1.5,0,.03,0,['metal','#2a2a2a']);C(.22,.3,0,1.4,0,0,1,.15);const l=new THREE.PointLight(0xffd9a0,0,7);l.position.set(0,1.6,0);g.add(l);g.userData.pl=l},
'Rug':(B)=>{B(2.4,.014,1.6,0,0,0,0,1,.006);B(2.1,.017,1.3,0,0,0,['rug','#efe6d2'],0,.004)},
'Kitchen counter':(B,C)=>{B(2,.8,.62,0,.06,-.015,0,1,.01);B(1.94,.06,.58,0,0,0,['rubber','#141414'],0,.004);[-.67,0,.67].forEach(x=>B(.64,.7,.016,x,.1,.31,0,1,.005));
B(2.04,.05,.69,0,.85,0,['stone','#4d4d52'],0,.008);B(.5,.012,.4,-.5,.9,0,['metal','#b4b8bd'],0,.004);C(.014,.22,-.5,.9,-.24,['metal','#c8ccd0'],0,.012);B(.02,.02,.16,-.5,1.1,-.17,['metal','#c8ccd0'],0,.008);
B(.58,.008,.5,.5,.9,0,['ceramic','#0f0f12'],0,.003);[[.38,.1],[.62,.1],[.38,-.1],[.62,-.1]].forEach(p=>C(.065,.008,p[0],.908,p[1],['metal','#2a2a2a'],0,.06));
[-.67,0,.67].forEach(x=>B(.34,.016,.024,x,.75,.33,['metal','#c9ccd1'],0,.007))},
'Fridge':(B)=>{B(.75,1.8,.7,0,0,0,0,1,.035);B(.742,.014,.012,0,1.07,.352,['rubber','#222'],0,.003);B(.03,.55,.035,.3,1.16,.372,['metal','#bfc3c8'],0,.012);B(.03,.38,.035,.3,.4,.372,['metal','#bfc3c8'],0,.012)},
'Bathtub':(B,C)=>{B(1.7,.55,.14,0,0,-.33,0,1,.06);B(1.7,.55,.14,0,0,.33,0,1,.06);B(.14,.55,.8,-.78,0,0,0,1,.06);B(.14,.55,.8,.78,0,0,0,1,.06);B(1.7,.1,.8,0,0,0,0,1,.05);
B(1.44,.01,.52,0,.34,0,['water','#8fd0e6'],0,.002);C(.02,.22,.72,.55,0,['metal','#c8ccd0'],0,.015);B(.02,.02,.16,.72,.74,.07,['metal','#c8ccd0'],0,.008);C(.025,.04,.72,.55,.2,['metal','#c8ccd0']);C(.025,.04,.72,.55,-.2,['metal','#c8ccd0'])},
'Toilet':(B,C,g,S)=>{C(.14,.3,0,0,.1,0,1,.1);S(.2,0,.4,.1,0,1,1,.72,1.35);S(.2,0,.52,.1,['ceramic','#fbfbfb'],0,.97,.1,1.32);B(.4,.4,.18,0,.4,-.25,0,1,.04);B(.42,.03,.2,0,.8,-.25,['ceramic','#fbfbfb'],0,.015);C(.03,.012,0,.83,-.25,['metal','#c8ccd0'])},
'Window':(B,C,g,S,E)=>{E(1.1,1.1,.004,0,.05,-.004,'#fff',1,'sky');B(1.1,1.1,.01,0,.05,.012,'glass');B(1.2,.06,.08,0,0,0,0,1,.01);B(1.2,.06,.08,0,1.14,0,0,1,.01);B(.06,1.2,.08,-.57,0,0,0,1,.01);B(.06,1.2,.08,.57,0,0,0,1,.01);
B(.04,1.1,.05,0,.05,.005,0,1,.006);B(1.1,.035,.05,0,.6,.005,0,1,.006);B(1.34,.04,.17,0,-.045,.06,0,1,.01)},
'Door':(B,C,g,S)=>{B(.95,2.05,.07,0,0,0,0,1,.01);[-.18,.18].forEach(x=>{B(.3,.8,.02,x,1.1,.04,0,1,.006);B(.3,.7,.02,x,.18,.04,0,1,.006)});
B(.06,2.1,.1,-.505,0,0,['paint','#f2efe8'],0,.008);B(.06,2.1,.1,.505,0,0,['paint','#f2efe8'],0,.008);B(1.07,.06,.1,0,2.05,0,['paint','#f2efe8'],0,.008);
B(.13,.02,.025,.32,1,.075,['metal','#cfcfd2'],0,.008);S(.025,.37,1,.06,['metal','#cfcfd2'])},
'Picture':(B,C,g,S,E)=>{B(.9,.65,.05,0,0,0,0,1,.01);B(.78,.53,.012,0,.06,.025,['paint','#f4f1ea'],0,.004);E(.62,.4,.006,0,.125,.034,'#fff',1,'art')}};
const KD=F.findIndex(f=>f[0]==='Door'),KW=F.findIndex(f=>f[0]==='Window'),TT=['Intern','Planner','Designer','Venue pro','Mogul','Legend'],CH=['Nice choice!','Looks great!','Guests will love it!','Stylish!','Smart move!'];
const D={},PL={img:'',name:'',room:-1,sel:-1,uid:0};let box=null,R3=null,sc=null,cam=null,ctl=null,rg=null,wl=[],objs=new Map(),selH=null,hemi=null,dl=null,drag=null,dn=null,LT=0;
const fm=n=>Number(n).toLocaleString('en-US'),star=n=>'★'.repeat(n)+'☆'.repeat(5-n),cl=(v,a,b)=>Math.max(a,Math.min(b,v)),DD=()=>D[PL.room],GL=new THREE.MeshPhysicalMaterial({color:0xd6ecff,transparent:true,opacity:.22,roughness:.04,metalness:0,clearcoat:1,clearcoatRoughness:.03,depthWrite:false}),MC={};
const stl=document.createElement('style');stl.textContent='.ixg{margin:0 0 22px;padding:16px;border:2px solid var(--amber);border-radius:16px;background:var(--panel);width:100%;max-width:100%;min-width:0;box-sizing:border-box}.ixg h3{margin:0 0 6px;font-size:18px}.ixg .sm{margin:0 0 12px;color:var(--mut);font-size:13px;line-height:1.5}.ixup{display:block;padding:18px;border:2px dashed var(--amber);border-radius:12px;text-align:center;cursor:pointer;font-weight:700;color:var(--amber);margin-bottom:12px}.ixup input{display:none}.ixth{display:block;max-width:100%;max-height:150px;margin:0 auto 12px;border-radius:10px;border:1px solid var(--line)}.ixrms{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px}.ixrm{display:flex;flex-direction:column;align-items:center;gap:4px;padding:16px 8px;border:2px solid var(--line);border-radius:14px;background:#fff;color:var(--fg);font:700 13px system-ui;cursor:pointer}.ixrm span{font-size:34px;line-height:1}.ixrm small{color:var(--mut);font-weight:500}.ixrm:hover{border-color:var(--amber);transform:translateY(-3px)}.ixrm.dn{border-color:var(--amber);background:rgba(65,105,225,.08)}.ix3{position:relative;width:100%;max-width:100%;height:min(44vh,440px);border-radius:12px;overflow:hidden;border:1px solid var(--line);background:#e7eef8;touch-action:none}.ix3 canvas{position:absolute;left:0;top:0;z-index:1;width:100%;height:100%}#ixwrap,#ixgame,#ixed,#ixrooms{width:100%;max-width:100%;min-width:0;box-sizing:border-box}.ixhd{margin:8px 0;font:700 13px system-ui}.ixg details{margin:10px 0;border:1px solid var(--line);border-radius:10px;padding:8px 12px;background:#fff}.ixg summary{cursor:pointer;font-weight:700;font-size:14px}.ixp{position:relative;z-index:2;left:auto;right:auto;bottom:auto;display:flex;flex-wrap:nowrap;gap:8px;width:100%;max-width:100%;min-width:0;box-sizing:border-box;margin:10px 0 0;padding:8px;max-height:none;overflow-x:auto;overflow-y:hidden;border-radius:12px;background:#fff;border:1px solid var(--line);box-shadow:none;touch-action:pan-x}.ixgh{position:fixed;z-index:80;pointer-events:none;padding:8px 10px;border-radius:12px;background:#fff;border:2px solid var(--amber);font:700 12px system-ui,sans-serif;box-shadow:0 8px 20px rgba(0,0,0,.25)}.ixpb{display:flex;flex-direction:column;align-items:center;gap:2px;min-width:78px;padding:8px 6px;border:1px solid var(--line);border-radius:12px;background:#fff;color:var(--fg);font:600 11px system-ui;cursor:pointer}.ixpb span{font-size:22px;line-height:1}.ixpb em{font-style:normal;color:var(--mut);font-weight:500}.ixpb:hover{border-color:var(--amber)}.ixpb{flex:0 0 auto;cursor:grab}.ixpb:active{cursor:grabbing}.ixf{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-top:10px}.ixf label{display:flex;flex-direction:column;gap:4px;font-size:12px;color:var(--mut)}.ixf input[type=color]{width:100%;height:34px;padding:0;border:1px solid var(--line);border-radius:8px;background:none}.ixf select{padding:8px;border:1px solid var(--line);border-radius:8px}.ixbtns{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:0 0 8px}.ixbtns button,.ixsb button{padding:8px 12px;border:1px solid var(--line);border-radius:8px;background:var(--panel);color:var(--fg);font-weight:600;cursor:pointer}.ixsb{margin-top:10px;padding:12px;border:2px solid var(--amber);border-radius:12px}.tktp{max-height:min(72dvh,520px);overflow:auto}@media (max-width:760px){.ix3{height:min(42dvh,340px)}.ixf{grid-template-columns:1fr}.ixbtns button,.ixpb{min-height:40px}.ixp{max-height:none}}';document.head.appendChild(stl);
const RBC={};
let zCL=[],zCM=[],zSG=null;
function zuv(g){const p=g.attributes.position,n=g.attributes.normal,u=g.attributes.uv;for(let i=0;i<p.count;i++){const ax=Math.abs(n.getX(i)),ay=Math.abs(n.getY(i)),az=Math.abs(n.getZ(i));if(ax>=ay&&ax>=az)u.setXY(i,p.getZ(i),p.getY(i));else if(ay>=az)u.setXY(i,p.getX(i),p.getZ(i));else u.setXY(i,p.getX(i),p.getY(i))}}
function rbg(w,h,d,rad){const r=Math.max(0,Math.min(rad==null?.015:rad,Math.min(w,h,d)/2.2)),k=[w,h,d,r].join();if(RBC[k])return RBC[k];
if(r<.002){const g0=new THREE.BoxGeometry(w,h,d);zuv(g0);return RBC[k]=g0}
const K=r>=.08?5:r>=.03?4:2,n=2*K+1,g=new THREE.BoxGeometry(w,h,d,n,n,n);
const bp=a=>{const p=[];for(let i=0;i<=K;i++)p.push(-(a-r)-r*Math.cos(i/K*Math.PI/2));const q=p.slice();for(let i=K;i>=0;i--)q.push(-p[i]);return q};
const B3=[bp(w/2),bp(h/2),bp(d/2)],hx=[w/2,h/2,d/2],ih=[w/2-r,h/2-r,d/2-r],P=g.attributes.position,N=g.attributes.normal,v=[0,0,0],o=[0,0,0];
for(let i=0;i<P.count;i++){v[0]=P.getX(i);v[1]=P.getY(i);v[2]=P.getZ(i);let L=0;
for(let a=0;a<3;a++){const ix=Math.round((v[a]+hx[a])/(2*hx[a])*n);v[a]=B3[a][Math.max(0,Math.min(n,ix))];const c=Math.max(-ih[a],Math.min(ih[a],v[a]));o[a]=v[a]-c;v[a]=c;L+=o[a]*o[a]}
L=Math.sqrt(L);if(L>1e-9){for(let a=0;a<3;a++){o[a]/=L;v[a]+=o[a]*r}N.setXYZ(i,o[0],o[1],o[2])}P.setXYZ(i,v[0],v[1],v[2])}
zuv(g);return RBC[k]=g}
function zsph(){return zSG||(zSG=new THREE.SphereGeometry(1,28,18))}
const zCV={},zTX={};
function zrnd(s){return()=>{s=(s*1664525+1013904223)%4294967296;return s/4294967296}}
function zcv(k,S,fn){if(!zCV[k]){const cv=document.createElement('canvas');cv.width=cv.height=S;fn(cv.getContext('2d'),S);zCV[k]=cv}return zCV[k]}
function zt1(k,S,fn,rep,enc){const kk=k+S;if(!zTX[kk]){const t=new THREE.CanvasTexture(zcv(kk,S,fn));t.wrapS=t.wrapT=THREE.RepeatWrapping;if(enc)t.encoding=THREE.sRGBEncoding;t.anisotropy=R3?R3.capabilities.getMaxAnisotropy():8;if(rep)t.repeat.set(rep,rep);zTX[kk]=t}return zTX[kk]}
function zgWood(x,S,m){const r=zrnd(11),N=10,ph=S/N;x.fillStyle=m?'#808080':'#ededed';x.fillRect(0,0,S,S);
for(let i=0;i<N;i++){const y0=i*ph,segs=[];let a=-r()*S*.7;
while(a<S){const L=S*(.42+r()*.5),ln=[],nl=Math.max(8,Math.round(ph/(S>1200?3:2.4)));
for(let k=0;k<nl;k++)ln.push([y0+r()*ph,.03+r()*.1,(S>1200?.8:.5)+r()*1.3,(r()-.5)*ph*.07,(r()-.5)*ph*.07]);
segs.push({a:a,b:a+L,t:r(),ln:ln,kn:r()<.14?[a+L*(.2+r()*.6),y0+ph*(.3+r()*.4),ph*(.1+r()*.08)]:null});a+=L}
segs.forEach(s=>{[-S,0,S].forEach(dx=>{const xa=s.a+dx,xb=s.b+dx;if(xb<0||xa>S)return;
if(!m){x.fillStyle=s.t>.5?'rgba(255,248,235,'+((s.t-.5)*.22)+')':'rgba(70,40,20,'+((.5-s.t)*.2)+')';x.fillRect(xa,y0,xb-xa,ph)}
s.ln.forEach(l=>{x.strokeStyle=m?'rgba(0,0,0,'+(l[1]*1.3)+')':'rgba(60,35,15,'+l[1]+')';x.lineWidth=l[2];x.beginPath();x.moveTo(xa,l[0]);x.bezierCurveTo(xa+(xb-xa)*.33,l[0]+l[3],xa+(xb-xa)*.66,l[0]+l[4],xb,l[0]);x.stroke()});
if(s.kn){for(let q=3;q>=1;q--){x.strokeStyle=m?'rgba(0,0,0,.28)':'rgba(50,28,10,.22)';x.lineWidth=1.2;x.beginPath();x.ellipse(s.kn[0]+dx,s.kn[1],s.kn[2]*q*1.7,s.kn[2]*q*.6,0,0,6.283);x.stroke()}}
x.fillStyle=m?'#161616':'rgba(20,12,5,.55)';x.fillRect(xb-1.5,y0,3,ph)})});
x.fillStyle=m?'#101010':'rgba(20,12,5,.6)';x.fillRect(0,y0-1.5,S,3);x.fillStyle=m?'rgba(200,200,200,.5)':'rgba(255,255,255,.18)';x.fillRect(0,y0+1.5,S,1.5)}
x.fillStyle=m?'#101010':'rgba(20,12,5,.6)';x.fillRect(0,S-1.5,S,3)}
function zgTile(x,S,m){const r=zrnd(21),N=4,ts=S/N,g=Math.max(3,Math.round(S/340));x.fillStyle=m?'#a0a0a0':'#f3f3f3';x.fillRect(0,0,S,S);
for(let i=0;i<N;i++)for(let j=0;j<N;j++){const x0=i*ts,y0=j*ts,tn=r();
if(!m){x.fillStyle=tn>.5?'rgba(255,255,255,'+((tn-.5)*.2)+')':'rgba(80,85,95,'+((.5-tn)*.16)+')';x.fillRect(x0,y0,ts,ts);
const nv=2+Math.floor(r()*3);for(let k=0;k<nv;k++){const sx=x0+r()*ts,sy=y0+r()*ts,ex=x0+r()*ts,ey=y0+r()*ts;x.strokeStyle='rgba(110,118,130,'+(.1+r()*.16)+')';x.lineWidth=.8+r()*(S/700);x.beginPath();x.moveTo(sx,sy);x.bezierCurveTo(sx+(r()-.5)*ts*.6,sy+(r()-.5)*ts*.6,ex+(r()-.5)*ts*.6,ey+(r()-.5)*ts*.6,ex,ey);x.stroke()}
for(let k=0;k<120;k++){x.fillStyle='rgba('+(r()>.5?'255,255,255':'90,95,105')+','+(r()*.1)+')';x.fillRect(x0+r()*ts,y0+r()*ts,1.5,1.5)}}}
x.fillStyle=m?'#181818':'#9a9a9a';for(let k=0;k<=N;k++){x.fillRect(k*ts-g/2,0,g,S);x.fillRect(0,k*ts-g/2,S,g)}}
function zgCarp(x,S,m){const id=x.createImageData(S,S),d=id.data,r=zrnd(5);for(let j=0;j<S;j+=2)for(let i=0;i<S;i+=2){const v=r(),g=m?v*255:196+v*52;for(let a=0;a<2;a++)for(let b=0;b<2;b++){const k=((j+a)*S+i+b)*4;d[k]=d[k+1]=d[k+2]=g;d[k+3]=255}}x.putImageData(id,0,0)}
function zgPl(x,S,m,base){const id=x.createImageData(S,S),d=id.data,r=zrnd(base||7);for(let i=0;i<S*S;i++){const v=r(),g=m?112+v*40:(base||236)+v*14,k=i*4;d[k]=d[k+1]=d[k+2]=g;d[k+3]=255}x.putImageData(id,0,0);
if(!m){const q=zrnd(13);for(let i=0;i<26;i++){const cx=q()*S,cy=q()*S,rr=S*(.12+q()*.2),gr=x.createRadialGradient(cx,cy,2,cx,cy,rr);gr.addColorStop(0,'rgba(90,85,75,.05)');gr.addColorStop(1,'rgba(90,85,75,0)');x.fillStyle=gr;x.fillRect(cx-rr,cy-rr,rr*2,rr*2)}}}
function zgWAO(x,S){x.fillStyle='#fff';x.fillRect(0,0,S,S);const e=(x0,y0,x1,y1,a,rx,ry,rw,rh)=>{const g=x.createLinearGradient(x0,y0,x1,y1);g.addColorStop(0,'rgba(0,0,0,'+a+')');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(rx,ry,rw,rh)};
e(0,S,0,S*.88,.42,0,S*.88,S,S*.12);e(0,0,0,S*.08,.34,0,0,S,S*.08);e(0,0,S*.05,0,.3,0,0,S*.05,S);e(S,0,S*.95,0,.3,S*.95,0,S*.05,S)}
function zgFab(x,S){x.fillStyle='#e8e8e8';x.fillRect(0,0,S,S);const c=4;for(let j=0;j<S/c;j++)for(let i=0;i<S/c;i++){if((i+j)&1){x.fillStyle='rgba(0,0,0,.14)';x.fillRect(i*c,j*c,c,c)}}const r=zrnd(3);for(let k=0;k<2500;k++){x.fillStyle='rgba(0,0,0,'+(r()*.08)+')';x.fillRect(r()*S,r()*S,1,1)}}
function zgWF(x,S){x.fillStyle='#efefef';x.fillRect(0,0,S,S);const r=zrnd(8);for(let k=0;k<160;k++){const y=r()*S,a=.03+r()*.14,w=.5+r()*1.6,w1=(r()-.5)*14,w2=(r()-.5)*14,dk=r()>.3;x.strokeStyle=dk?'rgba(40,25,10,'+a+')':'rgba(255,255,255,'+(a*.5)+')';x.lineWidth=w;x.beginPath();x.moveTo(0,y);x.bezierCurveTo(S*.33,y+w1,S*.66,y+w2,S,y);x.stroke()}}
function zgSt(x,S){x.fillStyle='#e6e6e6';x.fillRect(0,0,S,S);const r=zrnd(4);for(let k=0;k<3500;k++){const l=r()>.5,q=.6+r()*1.6;x.fillStyle=l?'rgba(255,255,255,'+(.15+r()*.3)+')':'rgba(0,0,0,'+(.1+r()*.3)+')';x.fillRect(r()*S,r()*S,q,q)}}
function zkt(k){if(k==='fabric')return zt1('fab',256,zgFab,6,1);if(k==='wood')return zt1('wd',512,zgWF,1.8,1);if(k==='rug')return zt1('rug',256,(x,s)=>zgCarp(x,s,0),8,1);if(k==='stone')return zt1('st',256,zgSt,3,1);return null}
function zsp(k,S,fn){if(!zTX[k]){const cv=document.createElement('canvas');cv.width=cv.height=S;fn(cv.getContext('2d'),S);const t=new THREE.CanvasTexture(cv);t.encoding=THREE.sRGBEncoding;zTX[k]=t}return zTX[k]}
function zskT(){return zsp('sky',256,(x,S)=>{const g=x.createLinearGradient(0,0,0,S);g.addColorStop(0,'#5fa4e6');g.addColorStop(.55,'#b9dcf6');g.addColorStop(.72,'#e9f3fa');g.addColorStop(.73,'#7f9f79');g.addColorStop(1,'#587a52');x.fillStyle=g;x.fillRect(0,0,S,S);const r=zrnd(9);
for(let i=0;i<7;i++){const cx=r()*S,cy=20+r()*100,rr=20+r()*30,rg=x.createRadialGradient(cx,cy,2,cx,cy,rr);rg.addColorStop(0,'rgba(255,255,255,.75)');rg.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=rg;x.fillRect(cx-rr,cy-rr,rr*2,rr*2)}
for(let i=0;i<26;i++){const cx=r()*S,cy=176+r()*10,rr=10+r()*14;x.fillStyle='rgba('+Math.floor(60+r()*30)+','+Math.floor(100+r()*40)+','+Math.floor(60+r()*20)+',.9)';x.beginPath();x.arc(cx,cy,rr,0,6.283);x.fill()}})}
function ztvT(){return zsp('tv',256,(x,S)=>{x.fillStyle='#0c1830';x.fillRect(0,0,S,S);const g=x.createRadialGradient(S*.6,S*.45,5,S*.6,S*.45,S*.7);g.addColorStop(0,'#3d73c2');g.addColorStop(1,'rgba(12,24,48,0)');x.fillStyle=g;x.fillRect(0,0,S,S);const l=x.createLinearGradient(0,0,S,S);l.addColorStop(0,'rgba(255,255,255,.12)');l.addColorStop(.4,'rgba(255,255,255,0)');x.fillStyle=l;x.fillRect(0,0,S,S)})}
function zartT(){return zsp('art',256,(x,S)=>{const g=x.createLinearGradient(0,0,0,S);g.addColorStop(0,'#f3c98b');g.addColorStop(.55,'#e8826a');g.addColorStop(.62,'#3b6f8f');g.addColorStop(1,'#1f4660');x.fillStyle=g;x.fillRect(0,0,S,S);x.fillStyle='#fff3d0';x.beginPath();x.arc(S*.62,S*.45,S*.11,0,6.283);x.fill();x.fillStyle='#2c4a5a';x.beginPath();x.moveTo(0,S*.62);x.lineTo(S*.25,S*.42);x.lineTo(S*.5,S*.62);x.fill();x.beginPath();x.moveTo(S*.35,S*.62);x.lineTo(S*.7,S*.5);x.lineTo(S,S*.62);x.fill()})}
function zcsT(){return zsp('cs',128,(x,S)=>{const g=x.createRadialGradient(S/2,S/2,0,S/2,S/2,S/2);g.addColorStop(0,'rgba(0,0,0,.55)');g.addColorStop(.5,'rgba(0,0,0,.28)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,S,S)})}
let zCSM=null;function zcsM(){return zCSM||(zCSM=new THREE.MeshBasicMaterial({map:zcsT(),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}))}
const zMK={'Sofa':'fabric','Armchair':'fabric','Bed':'fabric','Dining table':'wood','Coffee table':'wood','Chair':'wood','Desk':'wood','Wardrobe':'wood','TV unit':'wood','Bookshelf':'wood','Plant':'ceramic','Floor lamp':'shade','Rug':'rug','Kitchen counter':'lacquer','Fridge':'fridge','Bathtub':'ceramic','Toilet':'ceramic','Window':'paint','Door':'wood','Picture':'gilt'},zXK={leaf:1,water:1},zNOA={glass:1,leaf:1,water:1};
function zPM(kind,col){const P=THREE.MeshPhysicalMaterial,St=THREE.MeshStandardMaterial;let T=null;try{T=zkt(kind)}catch(e){}const C=new THREE.Color(col);
switch(kind){
case'fabric':return new P({color:C,roughness:.92,map:T,bumpMap:T,bumpScale:1.2,sheen:1,sheenRoughness:.5,sheenColor:C.clone().lerp(new THREE.Color(1,1,1),.45)});
case'rug':return new St({color:C,roughness:1,map:T,bumpMap:T,bumpScale:2});
case'wood':return new P({color:C,roughness:.55,map:T,bumpMap:T,bumpScale:.45,clearcoat:.3,clearcoatRoughness:.35});
case'lacquer':return new P({color:C,roughness:.32,clearcoat:.6,clearcoatRoughness:.15});
case'fridge':return new P({color:C,roughness:.3,metalness:.45,clearcoat:.4,clearcoatRoughness:.2});
case'ceramic':return new P({color:C,roughness:.14,clearcoat:1,clearcoatRoughness:.05});
case'gilt':return new P({color:C,roughness:.35,metalness:.6,clearcoat:.2});
case'stone':return new P({color:C,roughness:.3,map:T,bumpMap:T,bumpScale:.15,clearcoat:.5,clearcoatRoughness:.15});
case'metal':return new St({color:C,roughness:.28,metalness:.85});
case'paint':return new St({color:C,roughness:.45});
case'leaf':return new St({color:C,roughness:.5,side:THREE.DoubleSide});
case'water':return new P({color:C,roughness:.04,transparent:true,opacity:.62,clearcoat:1,depthWrite:false});
case'shade':{const m=new St({color:C,roughness:.9,emissive:C,emissiveIntensity:.2,side:THREE.DoubleSide});m.userData.shade=1;return m}
default:return new St({color:C,roughness:.6})}}
function fin(o,g){const t=[[.75,0],[.5,.05],[.2,.1],[.32,.85]][o.f||0];g.userData.mm.forEach(m=>{if(o.f){m.roughness=t[0];m.metalness=t[1];if(m.clearcoat!==undefined)m.clearcoat=o.f===2?1:.3}else{m.roughness=m.userData.br;m.metalness=m.userData.bm}});g.userData.am.forEach(m=>{if(o.f&&!(m.userData.bm>.5)){m.roughness=t[0];m.metalness=t[1]}else{m.roughness=m.userData.br;m.metalness=m.userData.bm}})}
function mkg(o){const g=new THREE.Group(),mm=[],am=[],xm=[],f=F[o.k],mc={};const add=(m,x,y,z)=>{m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m};
const reg=(m,w)=>{m.userData.br=m.roughness==null?.6:m.roughness;m.userData.bm=m.metalness||0;(w===1?mm:w===2?xm:am).push(m);return m};
const mt=(col,main)=>{if(main)return mc.M||(mc.M=reg(zPM(zMK[f[0]]||'plain',o.c),1));if(col==='glass')return GL;let kind='plain';if(Array.isArray(col)){kind=col[0];col=col[1]}
const cc=(o.a&&!zNOA[kind])?o.a:(col||'#888'),key=kind+cc;return mc[key]||(mc[key]=reg(zPM(kind,cc),zXK[kind]?2:0))};
const B=(w,h,d,x,y,z,col,main,rad,rx,rz)=>{const m=add(new THREE.Mesh(rbg(w,h,d,rad),mt(col,main)),x,y+h/2,z);if(rx)m.rotation.x=rx;if(rz)m.rotation.z=rz;return m},
C=(r,h,x,y,z,col,main,r2)=>add(new THREE.Mesh(new THREE.CylinderGeometry(r2==null?r:r2,r,h,28),mt(col,main)),x,y+h/2,z),
Sp=(r,x,y,z,col,main,sx,sy,sz,rx,ry,rz)=>{const m=add(new THREE.Mesh(zsph(),mt(col,main)),x,y,z);m.scale.set(r*(sx||1),r*(sy||1),r*(sz||1));m.rotation.set(rx||0,ry||0,rz||0);return m},
Em=(w,h,d,x,y,z,col,it,tk)=>{let m;try{if(tk==='sky'){m=new THREE.MeshBasicMaterial({map:zskT(),toneMapped:false});m.userData.sky=1}else if(tk==='art')m=new THREE.MeshStandardMaterial({map:zartT(),roughness:.7});else if(tk==='tv')m=new THREE.MeshStandardMaterial({color:'#050505',roughness:.12,metalness:.2,emissive:'#ffffff',emissiveMap:ztvT(),emissiveIntensity:it||.8});else m=new THREE.MeshStandardMaterial({color:'#000',emissive:col,emissiveIntensity:it||1})}catch(e){m=new THREE.MeshStandardMaterial({color:col||'#888'})}
reg(m,2);const ge=rbg(w,h,d,.002).clone(),p=ge.attributes.position,u=ge.attributes.uv;for(let i=0;i<u.count;i++)u.setXY(i,p.getX(i)/w+.5,p.getY(i)/h+.5);const me=new THREE.Mesh(ge,m);me.position.set(x,y+h/2,z);me.castShadow=tk==='art';me.receiveShadow=true;g.add(me);return me};
g.userData.o=o;BD[f[0]](B,C,g,Sp,Em);if(g.userData.cm)mm.push(...g.userData.cm);if(g.userData.ca)am.push(...g.userData.ca);g.userData.id=o.id;g.userData.mm=mm;g.userData.am=am;g.userData.xm=xm;fin(o,g);
if(o.skin&&!f[5]){try{g.updateMatrixWorld(true);const bb=new THREE.Box3().setFromObject(g),sz=bb.getSize(new THREE.Vector3()),ct=bb.getCenter(new THREE.Vector3()),tx=new THREE.CanvasTexture(o.skin);tx.encoding=THREE.sRGBEncoding;tx.anisotropy=8;const pln=new THREE.Mesh(new THREE.PlaneGeometry(Math.max(.08,sz.x*.94),Math.max(.08,sz.y*.94)),new THREE.MeshStandardMaterial({map:tx,roughness:.5,metalness:.04}));pln.position.set(ct.x,ct.y,bb.max.z+.012);pln.castShadow=false;pln.receiveShadow=true;g.add(pln)}catch(e){}}
return g}
function place(o){const g=objs.get(o.id);if(!g)return;g.position.set(o.x,F[o.k][4],o.z);g.rotation.y=o.r*Math.PI/180;g.scale.set(o.s*(o.sx||1),o.s*(o.sy||1),o.s)}
function fit(o){const c=DD().cfg,hw=c.w/2,hd=c.d/2;if(F[o.k][5]){const d=[o.z+hd,hd-o.z,o.x+hw,hw-o.x],i=d.indexOf(Math.min(...d));if(i===0){o.z=-hd+.05;o.r=0;o.x=cl(o.x,-hw+.7,hw-.7)}else if(i===1){o.z=hd-.05;o.r=180;o.x=cl(o.x,-hw+.7,hw-.7)}else if(i===2){o.x=-hw+.05;o.r=90;o.z=cl(o.z,-hd+.7,hd-.7)}else{o.x=hw-.05;o.r=-90;o.z=cl(o.z,-hd+.7,hd-.7)}}else{o.x=cl(o.x,-hw+.3,hw-.3);o.z=cl(o.z,-hd+.3,hd-.3)}}
function put(o){const g=mkg(o);if(!F[o.k][5]&&F[o.k][0]!=='Rug'){try{const bb=new THREE.Box3().setFromObject(g),sx=bb.max.x-bb.min.x,sz=bb.max.z-bb.min.z;if(isFinite(sx)&&isFinite(sz)&&sx>0&&sz>0){const p=new THREE.Mesh(new THREE.PlaneGeometry(1,1),zcsM());p.geometry.boundingBox=new THREE.Box3();p.rotation.x=-Math.PI/2;p.position.set((bb.max.x+bb.min.x)/2,.004,(bb.max.z+bb.min.z)/2);p.scale.set(sx*1.5+.1,sz*1.5+.1,1);p.raycast=()=>{};p.renderOrder=1;g.add(p)}}catch(e){}}sc.add(g);objs.set(o.id,g);place(o);light()}
function ftex(c){const S=window.innerWidth>800?2048:1024,k=({wood:1,tile:1,carpet:1,plain:1})[c.ft]?c.ft:'plain',sp={wood:[zgWood,.9,.5,.35,.3],tile:[zgTile,.7,.28,.6,.12],carpet:[zgCarp,2.6,1,0,0],plain:[(x,s,m)=>zgPl(x,s,m,222),.5,.8,.1,.4]}[k];
return{map:zt1('f'+k+'c',S,(x,s)=>sp[0](x,s,0),0,1),bump:zt1('f'+k+'b',S,(x,s)=>sp[0](x,s,1),0,0),bs:sp[1],r:sp[2],cc:sp[3],cr:sp[4]}}
function light(){if(!sc)return;const t=DD().cfg.light;sc.background=new THREE.Color('#e7eef8').lerp(new THREE.Color('#0a1030'),t);hemi.intensity=.62-.48*t;dl.intensity=1.9-1.78*t;dl.color.copy(new THREE.Color('#fff0d8').lerp(new THREE.Color('#8ea6ff'),t));
const em=.1+1.3*Math.max(0,(t-.15)/.85);objs.forEach(g=>{if(g.userData.pl)g.userData.pl.intensity=t>.25?(t-.25)/.75*2.2:0;(g.userData.mm||[]).forEach(m=>{if(m.userData.shade){m.emissive.copy(m.color);m.emissiveIntensity=em}});(g.userData.xm||[]).forEach(m=>{if(m.userData.sky)m.color.copy(new THREE.Color('#ffffff').lerp(new THREE.Color('#1c2a58'),t))})});
zCL.forEach(l=>{l.intensity=.18+1.5*t});zCM.forEach(m=>m.color.setRGB(.86+.8*t,.82+.62*t,.74+.3*t));
sc.traverse(m=>{if(m.material&&m.material.isMeshStandardMaterial)m.material.envMapIntensity=1.1*(1-.88*t)});if(R3)R3.toneMappingExposure=1.35-.25*t}
function wmat(c,wi){const col=(c.wc&&c.wc[wi])||c.wall;let pm=null,pb=null,ao=null;try{pm=zt1('plc',512,(x,s)=>zgPl(x,s,0,236),0,1);pb=zt1('plb',512,(x,s)=>zgPl(x,s,1,236),0,0);ao=zt1('wao',256,zgWAO,0,0)}catch(e){}
const m=new THREE.MeshStandardMaterial({color:col,transparent:true,roughness:.92,map:pm,bumpMap:pb,bumpScale:.35,aoMap:ao,aoMapIntensity:.9});
if(wi===0&&c.ph&&c.pho){m.bumpMap=null;m.aoMap=null;const ar=c.w/c.h,t=new THREE.TextureLoader().load(c.ph,i=>{const ia=i.image.width/i.image.height;if(ia>ar){i.repeat.x=ar/ia;i.offset.x=(1-i.repeat.x)/2}else{i.repeat.y=ia/ar;i.offset.y=(1-i.repeat.y)/2}m.needsUpdate=true});t.encoding=THREE.sRGBEncoding;m.map=t;m.emissiveMap=t;m.emissive.set(0x666666);m.color.set('#ffffff');m.roughness=.8}return m}
function bld(){const c=DD().cfg;if(rg){sc.remove(rg);rg.traverse(m=>{if(m.geometry)m.geometry.dispose()})}rg=new THREE.Group();wl=[];zCL=[];zCM=[];
const pln=c.ft==='plan'&&PL.img;let fm;
if(pln){const t=new THREE.TextureLoader().load(PL.img);t.encoding=THREE.sRGBEncoding;fm=new THREE.MeshStandardMaterial({map:t,roughness:.9})}
else{let f={};try{f=ftex(c)}catch(e){}fm=new THREE.MeshPhysicalMaterial({color:c.floor,map:f.map||null,bumpMap:f.bump||null,bumpScale:f.bs||0,roughness:f.r==null?.7:f.r,clearcoat:f.cc||0,clearcoatRoughness:f.cr||.3})}
const fg=new THREE.PlaneGeometry(c.w,c.d);if(!pln){const u=fg.attributes.uv;for(let i=0;i<u.count;i++)u.setXY(i,u.getX(i)*c.w/2,u.getY(i)*c.d/2)}
const fl=new THREE.Mesh(fg,fm);fl.rotation.x=-Math.PI/2;fl.receiveShadow=true;fl.userData.surf='floor';rg.add(fl);
[[0,-c.d/2,c.w,0,0,-1],[0,c.d/2,c.w,0,0,1],[-c.w/2,0,c.d,Math.PI/2,-1,0],[c.w/2,0,c.d,Math.PI/2,1,0]].forEach((a,wi)=>{const ph=wi===0&&c.ph&&c.pho,bg=new THREE.BoxGeometry(a[2],c.h,.1);bg.setAttribute('uv2',bg.attributes.uv.clone());if(!ph){const u=bg.attributes.uv;for(let i=0;i<u.count;i++)u.setXY(i,u.getX(i)*a[2]/1.2,u.getY(i)*c.h/1.2)}
const m=new THREE.Mesh(bg,wmat(c,wi));m.userData.surf='wall';m.userData.wi=wi;const bmt=new THREE.MeshStandardMaterial({color:'#f6f3ec',transparent:true,roughness:.4}),bm=new THREE.Mesh(rbg(a[2],.11,.03,.006),bmt),cr=new THREE.Mesh(rbg(a[2],.07,.05,.012),bmt),zo=-(a[4]+a[5]);
bm.position.set(0,.055-c.h/2,zo*.065);cr.position.set(0,c.h/2-.035,zo*.075);bm.receiveShadow=cr.receiveShadow=true;m.add(bm,cr);if(ph)bm.visible=cr.visible=false;
m.position.set(a[0]+a[4]*.05,c.h/2,a[1]+a[5]*.05);m.rotation.y=a[3];m.receiveShadow=true;rg.add(m);wl.push({m:m,n:a,b:bm})});
const cm=new THREE.Mesh(new THREE.PlaneGeometry(c.w,c.d),new THREE.MeshStandardMaterial({color:c.ceil||'#f8f6f1',roughness:.9}));cm.rotation.x=Math.PI/2;cm.position.y=c.h;cm.receiveShadow=true;cm.raycast=()=>{};rg.add(cm);
const dm=new THREE.MeshBasicMaterial({color:0xdcd3c0}),rm=new THREE.MeshStandardMaterial({color:'#e8e5de',roughness:.4,metalness:.3}),nx=Math.max(1,Math.round(c.w/2.4)),nz=Math.max(1,Math.round(c.d/2.4));zCM.push(dm);
for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){const x=-c.w/2+c.w*(i+.5)/nx,z=-c.d/2+c.d*(j+.5)/nz;[new THREE.Mesh(new THREE.CircleGeometry(.075,28),dm),new THREE.Mesh(new THREE.RingGeometry(.075,.095,28),rm)].forEach(q=>{q.rotation.x=Math.PI/2;q.position.set(x,c.h-.004,z);q.raycast=()=>{};rg.add(q)})}
const spots=(Array.isArray(c.lights)&&c.lights.length)?c.lights.map(p=>({x:cl(+p.x,-c.w/2+.25,c.w/2-.25),z:cl(+p.z,-c.d/2+.25,c.d/2-.25)})):(c.w>6?[{x:-c.w/4,z:0},{x:c.w/4,z:0}]:[{x:0,z:0}]);
const bulbM=new THREE.MeshStandardMaterial({color:'#fff8ee',emissive:'#ffe2b0',emissiveIntensity:1.15,roughness:.22});
spots.forEach(p=>{const l=new THREE.PointLight(0xffe4bd,0,Math.max(c.w,c.d)*1.4,1.6);l.position.set(p.x,c.h-.4,p.z);rg.add(l);zCL.push(l);const b=new THREE.Mesh(new THREE.SphereGeometry(.05,16,12),bulbM);b.position.set(p.x,c.h-.07,p.z);b.castShadow=false;b.raycast=()=>{};rg.add(b)});
const R=Math.hypot(c.w,c.d)/2+1.2,s=dl.shadow.camera;s.left=s.bottom=-R;s.right=s.top=R;s.updateProjectionMatrix();
sc.add(rg);DD().items.forEach(o=>{fit(o);place(o)});light()}

const ray=new THREE.Raycaster(),nd=new THREE.Vector2(),pln=new THREE.Plane(new THREE.Vector3(0,1,0),0),hv=new THREE.Vector3();
function aim(e){const r=R3.domElement.getBoundingClientRect();nd.set((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height*2-1));ray.setFromCamera(nd,cam)}
function pick(id){PL.sel=id;PL.surf=null;if(selH){sc.remove(selH);selH=null}if(id>=0&&objs.get(id)){selH=new THREE.BoxHelper(objs.get(id),0x4169e1);sc.add(selH)}selUI()}
function pd(e){aim(e);const h=ray.intersectObjects(Array.from(objs.values()),true);let g=null;if(h.length){g=h[0].object;while(g&&!(g.userData&&g.userData.id))g=g.parent}
if(g){ctl.enabled=false;const o=DD().items.find(x=>x.id===g.userData.id);pick(o.id);ray.ray.intersectPlane(pln,hv);drag={o:o,dx:o.x-hv.x,dz:o.z-hv.z};try{R3.domElement.setPointerCapture(e.pointerId)}catch(x){}}else{pick(-1);dn={x:e.clientX,y:e.clientY}}}
function pm(e){if(!drag)return;aim(e);if(!ray.ray.intersectPlane(pln,hv))return;const o=drag.o;o.x=hv.x+drag.dx;o.z=hv.z+drag.dz;fit(o);place(o)}
function surf(e){aim(e);const h=ray.intersectObjects(rg.children,true).filter(x=>x.object.material&&x.object.material.opacity>.5)[0];if(!h)return;let m=h.object;while(m&&!m.userData.surf)m=m.parent;if(!m)return;PL.surf=m.userData.surf;PL.wi=m.userData.wi||0;PL.sel=-1;if(selH){sc.remove(selH);selH=null}selH=new THREE.BoxHelper(m,0xf5a623);sc.add(selH);selUI();hud('Editing the '+(PL.surf==='wall'?'wall':'floor')+'. Change it below.')}
function pu(e){if(drag){drag=null;ctl.enabled=true;calc()}else if(dn&&e&&e.type==='pointerup'&&Math.hypot(e.clientX-dn.x,e.clientY-dn.y)<6)surf(e);dn=null}
function stats(ri){const dd=D[ri];let cost=0,n=0,lamp=false;const kinds=new Set();dd.items.forEach(o=>{if(!o.fr){cost+=F[o.k][2];n++;kinds.add(o.k);if(F[o.k][0]==='Floor lamp')lamp=true}});return{cost:cost,n:n,b:RM[ri][7],stars:n?Math.min(5,1+Math.round(Math.min(kinds.size,8)/8*3)+(lamp?1:0)):0}}
function hud(msg){if(!box)return;const q=s=>box.querySelector(s);let xp=0;Object.keys(D).forEach(r=>{const s=stats(r);xp+=s.n*10+(s.n?30:0)});const lv=Math.floor(xp/80)+1;
q('#ixmsg').textContent=msg||'Click any piece, wall or floor to customize it. Drag a piece to move it, drag empty space to look around, scroll or pinch to zoom.'}
function selUI(){if(!box)return;const p=box.querySelector('#ixsel'),sp=box.querySelector('#ixsrf'),o=PL.room>=0?DD().items.find(x=>x.id===PL.sel):null;p.hidden=!o;sp.hidden=!(PL.room>=0&&PL.surf&&!o);
if(!sp.hidden){const c=DD().cfg,w=PL.surf==='wall',q=s=>sp.querySelector(s);q('#ixsrn').textContent=w?'Selected: 🧱 '+['Back','Front','Left','Right'][PL.wi]+' wall':'Selected: 🪵 Floor';q('#ixsrw').hidden=!w;q('#ixsrfl').hidden=w;q('#ixsrb').hidden=!w;q('#ixwq').value=(c.wc&&c.wc[PL.wi])||c.wall;q('#ixfq').value=c.floor;q('#ixtq').value=c.ft==='plan'?'plain':c.ft}
if(!o)return;const f=F[o.k];p.querySelector('#ixsn').textContent='Selected: '+f[1]+' '+f[0];p.querySelector('#ixic').value=o.c;p.querySelector('#ixis').value=o.s;p.querySelector('#ixir').value=((o.r%360)+360)%360;p.querySelector('#ixirw').hidden=!!f[5];p.querySelector('#ixac').value=o.a||'#888888';p.querySelector('#ixfn').value=o.f||0;p.querySelector('#ixsx').value=o.sx||1;p.querySelector('#ixsy').value=o.sy||1}
function ui0(){const q=s=>box.querySelector(s),c=DD().cfg;q('#ixrn').textContent=RM[PL.room][1]+' '+RM[PL.room][0];[['ixwc','wall'],['ixfc','floor'],['ixft','ft'],['ixw','w'],['ixd','d'],['ixh','h'],['ixl','light']].forEach(p=>q('#'+p[0]).value=c[p[1]]);const po=q('#ixpo');po.parentNode.hidden=!c.ph;po.checked=!!c.pho;q('#ixready').hidden=false;if(!c.wsig)c.wsig=ixRP.sig(c)}
function loop(tk){if(tk!==LT||!R3)return;if(!box||!box.isConnected){kill();return}requestAnimationFrame(()=>loop(tk));try{wl.forEach(w=>{const v=cam.position,d=(v.x-w.m.position.x)*w.n[4]+(v.z-w.m.position.z)*w.n[5];w.m.material.opacity=d>.1?.1:1;w.m.material.depthWrite=d<=.1;w.b.material.opacity=w.m.material.opacity;w.b.material.depthWrite=d<=.1});ctl.update();if(selH)selH.update();R3.render(sc,cam)}catch(e){if(!loop.er){loop.er=1;try{hud('3D view problem: '+e.message)}catch(x){}}}}
function kill(){LT++;if(R3){R3.dispose();if(R3.domElement.parentNode)R3.domElement.remove()}R3=null;ctl=null;sc=null;rg=null;objs=new Map();selH=null;drag=null}
function init3(){const h=box.querySelector('#ix3');R3=new THREE.WebGLRenderer({antialias:true});R3.shadowMap.enabled=true;R3.shadowMap.type=THREE.PCFSoftShadowMap;R3.outputEncoding=THREE.sRGBEncoding;R3.toneMapping=THREE.ACESFilmicToneMapping;R3.toneMappingExposure=1.2;R3.setPixelRatio(Math.min(2,devicePixelRatio||1));h.appendChild(R3.domElement);R3.domElement.style.cssText='display:block;width:100%;height:100%;touch-action:none';
sc=new THREE.Scene();sc.background=new THREE.Color(0xe7eef8);cam=new THREE.PerspectiveCamera(50,1,.1,100);hemi=new THREE.HemisphereLight(0xf2f6ff,0x8a7f72,.62);dl=new THREE.DirectionalLight(0xfff0d8,1.9);dl.position.set(4,8,5);dl.castShadow=true;dl.shadow.mapSize.set(window.innerWidth>800?4096:2048,window.innerWidth>800?4096:2048);dl.shadow.bias=-.0004;dl.shadow.normalBias=.03;dl.shadow.radius=4;const s=dl.shadow.camera;s.left=s.bottom=-8;s.right=s.top=8;s.far=30;sc.add(hemi,dl);{const fl2=new THREE.DirectionalLight(0xfff4e4,.55);fl2.position.set(-6,3.4,-4);sc.add(fl2)}{const pm=new THREE.PMREMGenerator(R3),es=new THREE.Scene();es.background=new THREE.Color(0xbfd8f2);[[0,6,0,8,.2,8,6],[-6,2,0,.2,5,6,3],[6,2,2,.2,5,5,3],[0,-4,0,30,.2,30,.32],[0,2,-6,7,3.5,.2,4.5]].forEach(a=>{const m=new THREE.Mesh(new THREE.BoxGeometry(a[3],a[4],a[5]),new THREE.MeshBasicMaterial({color:new THREE.Color(1,1,1).multiplyScalar(a[6])}));m.position.set(a[0],a[1],a[2]);es.add(m)});sc.environment=pm.fromScene(es,.04).texture;pm.dispose()}
const dom=R3.domElement;dom.addEventListener('pointerdown',pd);dom.addEventListener('pointermove',pm);dom.addEventListener('pointerup',pu);dom.addEventListener('pointercancel',pu);
ctl=new THREE.OrbitControls(cam,dom);ctl.enableDamping=true;ctl.maxPolarAngle=Math.PI/2.02;ctl.minDistance=2;ctl.maxDistance=22;
['touchstart','touchmove'].forEach(v=>h.addEventListener(v,e=>e.stopPropagation(),{passive:true}));
if(window.ResizeObserver)new ResizeObserver(()=>{const w=h.clientWidth,hh=h.clientHeight;if(R3&&w&&hh){R3.setSize(w,hh,false);cam.aspect=w/hh;cam.updateProjectionMatrix()}}).observe(h);loop(++LT)}
function view(top){const c=DD().cfg;cam.fov=50;cam.updateProjectionMatrix();ctl.minDistance=2;ctl.maxDistance=22;ctl.enableZoom=true;ctl.enablePan=true;ctl.rotateSpeed=1;ctl.minPolarAngle=0;ctl.maxPolarAngle=Math.PI/2.02;if(top){cam.position.set(0,Math.max(c.w,c.d)*1.5,.01);ctl.target.set(0,0,0)}else{cam.position.set(c.w*.8,c.h*1.2,c.d*1.1);ctl.target.set(0,1,0)}ctl.update()}
function enter(ri){agentMount();tourEnter();PL.room=ri;if(!D[ri]){const r=RM[ri];D[ri]={cfg:{w:r[2],d:r[3],h:r[8]||2.8,wall:r[4],floor:r[5],ft:r[6],light:0,ph:r[9]||'',pho:r[9]?1:0},items:[{id:++PL.uid,k:KD,x:0,z:r[3]/2,r:180,s:1,c:F[KD][3],fr:1}].concat(r[9]?[]:[{id:++PL.uid,k:KW,x:0,z:-r[3]/2,r:0,s:1,c:F[KW][3],fr:1}])}}
const q=s=>box.querySelector(s);q('#ixrooms').hidden=true;q('#ixed').hidden=false;kill();init3();DD().items.forEach(put);bld();ui0();view(false);PL.sel=-1;selUI();hud('Welcome to your '+RM[ri][0].toLowerCase()+'! Add pieces below.');calc()}
const EMO=[[/workshop|ورشة/,'🔧'],[/bed|master|guest|dorm|سرير|نوم/,'🛏️'],[/kid|child|baby|nursery|play ?room|اطفال|أطفال/,'🧸'],[/kitchen|cook|pantry|مطبخ/,'🍳'],[/bath|toilet|\bwc\b|restroom|lavatory|حمام|تواليت/,'🛁'],[/shower|دش/,'🚿'],[/laundry|مغسلة|غسيل/,'🧺'],[/office|study|work|desk|مكتب/,'🖥️'],[/restaurant|dining|diner|cafe|coffee|مطعم|سفرة|كافيه/,'🍽️'],[/storage|warehouse|مخزن/,'📦'],[/barber|hair|beauty|صالون/,'💇'],[/shop|\bstore\b|boutique|market|محل|متجر/,'🛍️'],[/\bgym\b|fitness|workout|جيم/,'🏋️'],[/garage|parking|\bcar\b|جراج/,'🚗'],[/garden|yard|terrace|balcony|patio|roof|حديقة|بلكونة|تراس/,'🌿'],[/library|book|reading|مكتبة/,'📚'],[/studio|\bart\b|paint|ستوديو/,'🎨'],[/music|piano|\bband\b|موسيقى/,'🎵'],[/cinema|movie|theat|\btv\b|سينما/,'🎬'],[/game|gaming|arcade|العاب|ألعاب/,'🎮'],[/clinic|doctor|hospital|dental|medical|عيادة/,'🏥'],[/school|class|lecture|فصل/,'🏫'],[/meeting|conference|board/,'🧑‍💼'],[/closet|wardrobe|dressing|دريسنج/,'👗'],[/hall|lobby|entry|entrance|corridor|hallway|ريسبشن|مدخل/,'🚪'],[/\bbar\b|\bpub\b/,'🍸'],[/pool|\bspa\b|sauna|مسبح/,'🏊'],[/living|lounge|sitting|family|salon|معيشة|جلوس|صالة/,'🛋️']],emo=n=>{const l=String(n).toLowerCase();for(const e of EMO)if(e[0].test(l))return e[1];return'🏠'};
function rooms(){const q=s=>box.querySelector(s);kill();PL.room=-1;q('#ixed').hidden=true;q('#ixrooms').hidden=false;q('#ixrg').innerHTML=RM.length?RM.map((r,i)=>'<button type="button" class="ixrm'+(D[i]&&stats(i).n?' dn':'')+'" data-r="'+i+'"><span>'+r[1]+'</span>'+esc(r[0])+'<small>'+(D[i]&&stats(i).n?star(stats(i).stars)+' · '+stats(i).n+' pieces':r[2]+' x '+r[3]+' m')+'</small></button>').join(''):'<p class="sm">No spaces yet. Name your first space above and type its measurements.</p>'}
const PH={};
function flood(d,w,h,seeds,ok){const seen=new Uint8Array(w*h),st=[],push=(X,Y,f)=>{if(X<0||Y<0||X>=w||Y>=h)return;const p=Y*w+X;if(seen[p]||!ok(p*4,f))return;seen[p]=1;st.push(p)};seeds.forEach(s=>push(s[0],s[1],-1));while(st.length){const p=st.pop(),X=p%w,Y=(p-X)/w;d[p*4+3]=0;push(X+1,Y,p*4);push(X-1,Y,p*4);push(X,Y+1,p*4);push(X,Y-1,p*4)}}
function bgpal(d,w,h){const bins={};let n=0;const add=(X,Y)=>{const i=(Y*w+X)*4,k=(d[i]>>5)*64+(d[i+1]>>5)*8+(d[i+2]>>5),b=bins[k]||(bins[k]=[0,0,0,0]);b[0]+=d[i];b[1]+=d[i+1];b[2]+=d[i+2];b[3]++;n++};for(let X=0;X<w;X+=3){add(X,0);add(X,h-1)}for(let Y=0;Y<h;Y+=3){add(0,Y);add(w-1,Y)}const all=Object.values(bins).sort((a,b)=>b[3]-a[3]);let l=all.filter(b=>b[3]>=n*.1).slice(0,4);if(!l.length)l=[all[0]];return l.map(b=>[b[0]/b[3],b[1]/b[3],b[2]/b[3]])}
function cut(img,tol,rm){const mx=640,k=Math.min(1,mx/Math.max(img.width,img.height)),w=Math.max(4,Math.round(img.width*k)),h=Math.max(4,Math.round(img.height*k)),cv=document.createElement('canvas');cv.width=w;cv.height=h;const x=cv.getContext('2d',{willReadFrequently:true});x.drawImage(img,0,0,w,h);const id=x.getImageData(0,0,w,h),d=id.data;
let hasA=false;for(let i=3;i<d.length;i+=28)if(d[i]<200){hasA=true;break}
if(rm&&!hasA){const pal=bgpal(d,w,h),pd=i=>{let m=1e9;for(const c of pal){const v=Math.hypot(d[i]-c[0],d[i+1]-c[1],d[i+2]-c[2]);if(v<m)m=v}return m},seeds=[];for(let X=0;X<w;X++)seeds.push([X,0],[X,h-1]);for(let Y=0;Y<h;Y++)seeds.push([0,Y],[w-1,Y]);
flood(d,w,h,seeds,(i,f)=>{const v=pd(i);return v<tol||(f>=0&&v<tol*2.2&&Math.hypot(d[i]-d[f],d[i+1]-d[f+1],d[i+2]-d[f+2])<12)});
const z=new Uint8Array(w*h);for(let p=0;p<w*h;p++)z[p]=d[p*4+3]===0?1:0;for(let Y=1;Y<h-1;Y++)for(let X=1;X<w-1;X++){const p=Y*w+X;if(!z[p]&&(z[p-1]||z[p+1]||z[p-w]||z[p+w]))d[p*4+3]=0}}
x.putImageData(id,0,0);let x0=w,y0=h,x1=-1,y1=-1;for(let Y=0;Y<h;Y++)for(let X=0;X<w;X++)if(d[(Y*w+X)*4+3]>128){if(X<x0)x0=X;if(X>x1)x1=X;if(Y<y0)y0=Y;if(Y>y1)y1=Y}
if(x1<0||(x1-x0)*(y1-y0)<w*h*.03){x.clearRect(0,0,w,h);x.drawImage(img,0,0,w,h);x0=0;y0=0;x1=w-1;y1=h-1}
const c2=document.createElement('canvas');c2.width=x1-x0+1;c2.height=y1-y0+1;c2.getContext('2d',{willReadFrequently:true}).drawImage(cv,x0,y0,c2.width,c2.height,0,0,c2.width,c2.height);return c2}
function wand(cv,X,Y,tol){const x=cv.getContext('2d',{willReadFrequently:true}),w=cv.width,h=cv.height;if(X<0||Y<0||X>=w||Y>=h)return;const id=x.getImageData(0,0,w,h),d=id.data,s=(Y*w+X)*4,c=[d[s],d[s+1],d[s+2]];flood(d,w,h,[[X,Y]],i=>d[i+3]>0&&Math.hypot(d[i]-c[0],d[i+1]-c[1],d[i+2]-c[2])<Math.max(tol,24));x.putImageData(id,0,0)}
function st(m){const e=box&&box.querySelector('#ixps');if(e)e.textContent=m;hud(m)}
function phUpd(){const q=s=>box.querySelector(s);if(!PH.img)return;PH.cv=cut(PH.img,+q('#ixpq').value,q('#ixpr').checked);const v=q('#ixpv');v.src=PH.cv.toDataURL('image/png');v.hidden=false}
function phLoad(f){const q=s=>box.querySelector(s);if(!f||(f.type&&f.type.indexOf('image/')!==0)){st('That is not an image file. Use a JPG or PNG.');return}if(PL.room<0){spLoad(f);return}
const r=new FileReader();r.onerror=()=>st('Could not read that file.');r.onload=()=>{const im=new Image();im.onerror=()=>st('Could not read that image. Try a JPG or PNG.');im.onload=()=>{try{PH.img=im;PH.k=null;q('#ixpn').value=((f.name&&!/^image\.\w+$/i.test(f.name))?f.name.replace(/\.[^.]+$/,''):'My furniture').slice(0,24);phUpd();mk3d()}catch(x){st('Something went wrong with that photo: '+x.message)}};im.src=r.result};r.readAsDataURL(f)}
function mk3d(){const q=s=>box.querySelector(s);if(!PH.cv){st('Drop, paste or choose a photo first.');return}if(PL.room<0){st('Open a room first.');return}
const w=cl(parseFloat(q('#ixpw').value)||1.2,.2,6),th=cl(parseFloat(q('#ixpt').value)||.5,.02,3),flat=q('#ixpm').value==='flat',cv=PH.cv,hh=w*cv.height/cv.width,fresh=!(PH.kimg===PH.img&&PH.k!=null&&F[PH.k]);let nm;
if(fresh){nm=(q('#ixpn').value.trim()||'My furniture').slice(0,24);const base=nm;let n=2;while(F.some(f=>f[0]===nm))nm=base+' '+n++;PH.k=F.push([nm,'🖼️',0,'#ffffff',0,0])-1;PH.kimg=PH.img}else nm=F[PH.k][0];const k=PH.k;
const tex=new THREE.CanvasTexture(cv);tex.encoding=THREE.sRGBEncoding;tex.anisotropy=8;
/* SOLID REBUILD: the photo becomes the front, a softened mirror of it becomes the back, and the 4 sides, top and bottom are extruded from the photo's own edge colours and patterns */
const T=flat?Math.max(.015,Math.min(th,.05)):th;
const bcv=document.createElement('canvas');bcv.width=cv.width;bcv.height=cv.height;
{const bx=bcv.getContext('2d'),sm=document.createElement('canvas');sm.width=Math.max(2,cv.width>>2);sm.height=Math.max(2,cv.height>>2);sm.getContext('2d').drawImage(cv,0,0,sm.width,sm.height);bx.imageSmoothingQuality='high';bx.drawImage(sm,0,0,bcv.width,bcv.height);bx.globalCompositeOperation='source-atop';bx.fillStyle='rgba(0,0,0,.18)';bx.fillRect(0,0,bcv.width,bcv.height);bx.globalCompositeOperation='destination-in';bx.drawImage(cv,0,0)}
const tb=new THREE.CanvasTexture(bcv);tb.encoding=THREE.sRGBEncoding;tb.anisotropy=4;
const mkW=G=>{const gk=G/Math.max(cv.width,cv.height),gw=Math.max(3,Math.round(cv.width*gk)),gh=Math.max(3,Math.round(cv.height*gk)),gcv=document.createElement('canvas');gcv.width=gw;gcv.height=gh;const gcx=gcv.getContext('2d',{willReadFrequently:true});gcx.drawImage(cv,0,0,gw,gh);const sd=gcx.getImageData(0,0,gw,gh).data;
const sol=(X,Y)=>X>=0&&Y>=0&&X<gw&&Y<gh&&sd[(Y*gw+X)*4+3]>127;
const PP=[],NN=[],CC=[],cw=w/gw,chh=hh/gh,SS=[0,1/3,2/3,1],SH=[.86,1,.86];
const cc=(X,Y)=>{let r=0,gg=0,bb=0,n=0;for(const e of[[0,0],[1,0],[-1,0],[0,1],[0,-1]]){const x=X+e[0],y=Y+e[1];if(sol(x,y)){const i=(y*gw+x)*4;r+=sd[i];gg+=sd[i+1];bb+=sd[i+2];n++}}n=n||1;return[r/n/255,gg/n/255,bb/n/255]};
const qd=(a,b,c,d,n,col)=>{for(const p of[a,b,c,a,c,d]){PP.push(p[0],p[1],p[2]);NN.push(n[0],n[1],n[2]);CC.push(col[0],col[1],col[2])}};
for(let Y=0;Y<gh;Y++)for(let X=0;X<gw;X++){if(!sol(X,Y))continue;
const base=cc(X,Y),hs=((X*73856093)^(Y*19349663))>>>0,nz=1+((hs%97)/97-.5)*.12,x0=-w/2+X*cw,x1=x0+cw,yt=hh-Y*chh,yb=yt-chh;
for(let i=0;i<3;i++){const za=-T/2+T*SS[i],zb=-T/2+T*SS[i+1],col=base.map(v=>Math.pow(Math.min(1,v*SH[i]*nz),2.2));
if(!sol(X-1,Y))qd([x0,yb,za],[x0,yb,zb],[x0,yt,zb],[x0,yt,za],[-1,0,0],col);
if(!sol(X+1,Y))qd([x1,yb,zb],[x1,yb,za],[x1,yt,za],[x1,yt,zb],[1,0,0],col);
if(!sol(X,Y-1))qd([x0,yt,za],[x0,yt,zb],[x1,yt,zb],[x1,yt,za],[0,1,0],col);
if(!sol(X,Y+1))qd([x0,yb,zb],[x0,yb,za],[x1,yb,za],[x1,yb,zb],[0,-1,0],col.map(v=>v*.85))}}
const wg=new THREE.BufferGeometry();wg.setAttribute('position',new THREE.Float32BufferAttribute(PP,3));wg.setAttribute('normal',new THREE.Float32BufferAttribute(NN,3));wg.setAttribute('color',new THREE.Float32BufferAttribute(CC,3));wg.computeBoundingSphere();return wg};
let wg=null;try{wg=mkW(110);if(wg.attributes.position.count>120000)wg=mkW(56)}catch(e){wg=null;st('The sides could not be detailed ('+e.message+'). A plain solid body was used instead.')}
BD[nm]=(B,C,g)=>{const o=g.userData.o||{},cm=[],ca=[],reg=(m,arr)=>{m.userData.br=m.roughness;m.userData.bm=0;arr.push(m);return m},mf=t=>reg(new THREE.MeshStandardMaterial({map:t,color:o.c||'#ffffff',alphaTest:.5,side:THREE.DoubleSide,roughness:.75}),cm),sub=new THREE.Group(),cs=!flat,cap=(m,z)=>{const p=new THREE.Mesh(new THREE.PlaneGeometry(w,hh),m);p.position.set(0,hh/2,z);p.castShadow=cs;p.receiveShadow=true;sub.add(p)};
cap(mf(tex),T/2);cap(mf(tb),-T/2);
if(wg){const wm=reg(new THREE.MeshStandardMaterial({vertexColors:true,color:o.a||'#ffffff',side:THREE.DoubleSide,roughness:.8}),ca),wmesh=new THREE.Mesh(wg,wm);wmesh.castShadow=cs;wmesh.receiveShadow=true;sub.add(wmesh)}else{const wm=reg(new THREE.MeshStandardMaterial({color:o.a||'#8a8a8a',roughness:.8}),ca),bm=new THREE.Mesh(new THREE.BoxGeometry(w*.99,hh*.99,T*.98),wm);bm.position.set(0,hh/2,0);bm.castShadow=cs;bm.receiveShadow=true;sub.add(bm)}
if(flat){sub.rotation.x=-Math.PI/2;sub.position.set(0,T/2,hh/2)}
g.add(sub);g.userData.cm=cm;g.userData.ca=ca};
if(fresh){const b=document.createElement('template');b.innerHTML='<button type="button" class="ixpb" draggable="true" data-k="'+k+'"><span>🖼️</span>'+esc(nm)+'<em>My photo</em></button>';q('.ixp').appendChild(b.content.firstChild);q('.ixpb[data-k="'+k+'"]').click();st('Done. Your photo was rebuilt as a solid 3D piece with all six sides: front, back, left, right, top and bottom. Click it to move, resize or recolor.')}
else{const its=DD().items.filter(o=>o.k===k);if(its.length){its.forEach(o=>{const g=objs.get(o.id);if(g)sc.remove(g);objs.delete(o.id);put(o)});pick(PL.sel);st('Updated.')}else q('.ixpb[data-k="'+k+'"]').click()}}
const SP={};
function hexc(c){return '#'+c.map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('')}
function spLoad(f){const q=s=>box.querySelector(s),m=t=>{q('#ixqs').textContent=t};if(!f||(f.type&&f.type.indexOf('image/')!==0)){m('That is not an image file. Use a JPG or PNG.');return}const r=new FileReader();r.onerror=()=>m('Could not read that file.');r.onload=()=>{const im=new Image();im.onerror=()=>m('Could not read that image. Try a JPG or PNG.');im.onload=()=>{try{const k=Math.min(1,1280/Math.max(im.width,im.height)),w=Math.round(im.width*k),h=Math.round(im.height*k),cv=document.createElement('canvas');cv.width=w;cv.height=h;const x=cv.getContext('2d',{willReadFrequently:true});x.drawImage(im,0,0,w,h);
const avg=(x0,y0,x1,y1)=>{const d=x.getImageData(Math.floor(w*x0),Math.floor(h*y0),Math.max(1,Math.floor(w*(x1-x0))),Math.max(1,Math.floor(h*(y1-y0)))).data;const s=[0,0,0];let n=0;for(let i=0;i<d.length;i+=16){s[0]+=d[i];s[1]+=d[i+1];s[2]+=d[i+2];n++}return s.map(v=>v/n)};
SP.cv=cv;SP.url=cv.toDataURL('image/jpeg',.85);cv.toBlob(b=>{SP.blob=b},'image/jpeg',.85);SP.wall=hexc(avg(.15,.1,.85,.4));SP.floor=hexc(avg(.15,.82,.85,.98));const v=q('#ixqv');v.src=SP.url;v.hidden=false;q('#ixqw').value=Math.round(cl(2.8*w/h,3,12)*10)/10;SP.aw=q('#ixqw').value;const n=q('#ixqn');if(!n.value)n.value=((f.name&&!/^image\.\w+$/i.test(f.name))?f.name.replace(/\.[^.]+$/,''):'My space').slice(0,24);q('#ixql').closest('details').open=true;m(SP.smp&&SP.img?'Photo ready. Name your space, then click Build. Claude will rebuild the room in 3D.':'Photo ready. Name your space, then click Build.')}catch(e){m('Something went wrong with that photo: '+e.message)}};im.src=r.result};r.readAsDataURL(f)}
const DM={};
function dimsOf(k){if(DM[k])return DM[k];const g=mkg({id:-1,k:k,x:0,z:0,r:0,s:1,c:F[k][3]}),v=new THREE.Vector3();new THREE.Box3().setFromObject(g).getSize(v);return DM[k]={x:Math.max(.05,v.x),y:Math.max(.05,v.y),z:Math.max(.05,v.z)}}
function aiPrompt(w,d,uw,ud){const L=F.map((f,k)=>[f,k]).filter(x=>x[0][2]>0).map(x=>{const m=dimsOf(x[1]);return x[0][0]+' ('+m.x.toFixed(1)+' x '+m.z.toFixed(1)+' x '+m.y.toFixed(1)+' m'+(x[0][5]?', wall piece':'')+')'}).join(', ');
return 'Rebuild the room in the attached photo as a simple 3D scene so a person can feel they are standing in it. Reply with ONLY one JSON object and no other text.\n'+
'Coordinates are in metres. The room is a box centred on 0,0. The camera that took the photo is at the front, looking at the back wall (z = -depth/2). x grows to the right and z grows towards the camera. Rotation is in degrees: 0 = the piece faces the camera, 90 = faces right, 180 = faces the back wall, 270 = faces left.\n'+
'Estimate real sizes from familiar objects (a door is about 2.05 m high, a sofa seat about 0.45 m high). '+((uw||ud)?'The customer says the room is about '+(uw?w+' m wide ':'')+(ud?d+' m deep':'')+'. ':'')+'\n'+
'Use only these piece kinds, with default size width x depth x height: '+L+'. Choose the closest kind for anything else and skip what fits none (curtains, cables, small decor). Study furniture, doors, windows, colours, texture, electronics, walls, floor, ceiling and lighting. Include every large piece you can see, keep positions, sizes and colors as close to the photo as you can, and keep pieces inside the room and not overlapping.\n'+
'Wall pieces (Window, Door, Picture) use "wall" (back, front, left or right) and "offset": metres along that wall from its centre (back and front: positive is right; left and right: it is the z position, positive towards the camera). Give their "w" and "h" too.\n'+
'JSON shape: {"room":{"width":4.5,"depth":4,"height":2.7,"wall_color":"#e8e2d6","wall_colors":{"back":"#e8e2d6","left":"#e8e2d6","right":"#e8e2d6"},"floor_color":"#b98b5e","floor_type":"wood"},"items":[{"kind":"Sofa","x":0,"z":-1,"rotation":0,"color":"#5b7db1","w":2.1,"d":0.9,"h":0.85},{"kind":"Window","wall":"back","offset":0,"color":"#f5f5f5","w":1.2,"h":1.2}]}. floor_type is one of wood, tile, carpet, plain. Leave out wall_colors entries that match wall_color. Use at most 30 items. Also set ceiling_color, and lights as an array of {x,z} for ceiling lamps. A television is kind TV unit. A standing lamp is Floor lamp.'}
function aiBuild(j,nm,w0,d0,uw,ud){const R=j.room||{},hx=v=>typeof v==='string'&&/^#[0-9a-f]{6}$/i.test(v)?v:null,num=(v,a,b,df)=>cl(v!==null&&v!==''&&isFinite(+v)?+v:df,a,b);
const w=uw?w0:Math.round(num(R.width,3,12,w0)*10)/10,d=ud?d0:Math.round(num(R.depth,3,12,d0)*10)/10,h=Math.round(num(R.height,2.4,4,2.8)*10)/10,wall=hx(R.wall_color)||SP.wall,fl=hx(R.floor_color)||SP.floor,ft=['wood','tile','carpet','plain'].indexOf(R.floor_type)>=0?R.floor_type:'wood',wc=R.wall_colors||{};
const ceil=hx(R.ceiling_color)||'#f4f1ea',lights=Array.isArray(R.lights)?R.lights.filter(p=>p&&isFinite(+p.x)&&isFinite(+p.z)).slice(0,6).map(p=>({x:Math.round(+p.x*100)/100,z:Math.round(+p.z*100)/100})):null;
RM.push([nm,'📷',w,d,wall,fl,ft,Math.min(150000,Math.max(25000,Math.round(w*d*1.5)*1000)),h,SP.url]);const ri=RM.length-1;
D[ri]={cfg:{w:w,d:d,h:h,wall:wall,floor:fl,ft:ft,light:0,ph:SP.url,pho:0,wc:[hx(wc.back),hx(wc.front),hx(wc.left),hx(wc.right)],ceil:ceil,lights:lights&&lights.length?lights:null},items:[]};PL.room=ri;
(Array.isArray(j.items)?j.items:[]).slice(0,40).forEach(it=>{const k=F.findIndex(f=>f[2]>0&&f[0].toLowerCase()===String(it.kind||'').toLowerCase());if(k<0)return;const f=F[k],dm=dimsOf(k),o={id:++PL.uid,k:k,x:0,z:0,r:0,s:1,sx:1,sy:1,a:'',f:0,c:hx(it.color)||f[3],fr:(f[0]==='Door'||f[0]==='Window')?1:0};
if(f[5]){const of=num(it.offset,-20,20,0),wl=it.wall;if(wl==='front'){o.x=of;o.z=d/2}else if(wl==='left'){o.x=-w/2;o.z=of}else if(wl==='right'){o.x=w/2;o.z=of}else{o.x=of;o.z=-d/2}if(+it.w>0)o.sx=cl(it.w/dm.x,.4,2.5);if(+it.h>0)o.sy=cl(it.h/dm.y,.4,2.5)}
else{o.x=num(it.x,-20,20,0);o.z=num(it.z,-20,20,0);o.r=((+it.rotation||0)%360+360)%360;const rw=+it.w>0?it.w/dm.x:1,rd=+it.d>0?it.d/dm.z:1,rh=+it.h>0?it.h/dm.y:1;o.s=cl(rd,.5,2.2);o.sx=cl(rw/o.s,.4,2.5);o.sy=cl(rh/o.s,.4,2.5)}
fit(o);if(it.skin)o.skin=it.skin;D[ri].items.push(o)});return ri}
function stampSkins(ri,scan){const dd=D[ri];if(!dd||!scan||!Array.isArray(scan.items))return;const pool=scan.items.filter(it=>it&&it.skin);dd.items.forEach(o=>{if(o.skin||F[o.k][5])return;const kind=F[o.k][0];let bi=-1,bd=2.8;pool.forEach((it,i)=>{if(it.used||it.kind!==kind)return;const dx=(+it.x||0)-o.x,dz=(+it.z||0)-o.z,d=dx*dx+dz*dz;if(d<bd){bd=d;bi=i}});if(bi>=0){o.skin=pool[bi].skin;pool[bi].used=true}});dd.items.forEach(o=>{if(!o.skin)return;const g=objs.get(o.id);if(g){sc.remove(g);objs.delete(o.id)}put(o)})}
function localScan(cv,W,Dp){
const G=128,H=Math.max(64,Math.round(G*cv.height/cv.width)),t=document.createElement('canvas');t.width=G;t.height=H;const tx=t.getContext('2d',{willReadFrequently:true});tx.drawImage(cv,0,0,G,H);const px=tx.getImageData(0,0,G,H).data;
const P=(x,y)=>{const i=(y*G+x)*4;return[px[i],px[i+1],px[i+2]]},LU=c=>.299*c[0]+.587*c[1]+.114*c[2],dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
const med=(x0,y0,x1,y1)=>{const a=[[],[],[]];for(let y=Math.floor(H*y0);y<Math.ceil(H*y1);y++)for(let x=Math.floor(G*x0);x<Math.ceil(G*x1);x++){const c=P(x,y);for(let k=0;k<3;k++)a[k].push(c[k])}return a.map(v=>{v.sort((p,q)=>p-q);return v[v.length>>1]||128})};
const wB=med(.3,.08,.7,.3),wL=med(.0,.08,.1,.3),wR=med(.9,.08,1,.3),fC=med(.2,.88,.8,1);
let fy=Math.round(H*.7);for(let y=Math.round(H*.4);y<H*.9;y++){const m=med(0,y/H,1,(y+1)/H);if(dist(m,fC)<dist(m,wB)){fy=y;break}}
let gx=0,gy=0,n=0;for(let y=Math.floor(H*.86);y<H-1;y++)for(let x=0;x<G-1;x++){const c=LU(P(x,y));gx+=Math.abs(c-LU(P(x+1,y)));gy+=Math.abs(c-LU(P(x,y+1)));n++}gx/=n;gy/=n;const v=gx+gy,ft=v<2.5?'plain':(gx>gy*1.4&&v>=3.5?'wood':(v>=6?'tile':'carpet'));
const mask=new Uint8Array(G*H);for(let y=Math.floor(H*.1);y<H;y++)for(let x=0;x<G;x++){const c=P(x,y),ref=x<G*.1?wL:x>G*.9?wR:wB;mask[y*G+x]=y<fy?(dist(c,ref)>38?1:0):(dist(c,fC)>44&&dist(c,ref)>44?1:0)}
const seen=new Uint8Array(G*H),bl=[];for(let s=0;s<G*H;s++){if(!mask[s]||seen[s])continue;const st=[s];seen[s]=1;let x0=G,y0=H,x1=0,y1=0,cnt=0,r=0,g=0,b=0;while(st.length){const p=st.pop(),x=p%G,y=(p/G)|0;cnt++;x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);const c=P(x,y);r+=c[0];g+=c[1];b+=c[2];[[1,0],[-1,0],[0,1],[0,-1]].forEach(d=>{const nx=x+d[0],ny=y+d[1];if(nx<0||ny<0||nx>=G||ny>=H)return;const q=ny*G+nx;if(mask[q]&&!seen[q]){seen[q]=1;st.push(q)}})}if(cnt>G*H*.004)bl.push({x0:x0,y0:y0,x1:x1,y1:y1,cnt:cnt,c:[r/cnt,g/cnt,b/cnt]})}
bl.sort((a,b)=>b.cnt-a.cnt);const fyN=fy/H,items=[],cl2=(v,a,b)=>Math.max(a,Math.min(b,v));
const skinCanvas=o=>{try{const sx=cv.width/G,sy=cv.height/H,x0=Math.max(0,Math.floor(o.x0*sx)),y0=Math.max(0,Math.floor(o.y0*sy)),ww=Math.max(2,Math.min(cv.width-x0,Math.ceil((o.x1-o.x0+1)*sx))),hh=Math.max(2,Math.min(cv.height-y0,Math.ceil((o.y1-o.y0+1)*sy))),c=document.createElement('canvas'),s=Math.min(1,360/Math.max(ww,hh));c.width=Math.max(2,Math.round(ww*s));c.height=Math.max(2,Math.round(hh*s));const gx=c.getContext('2d');gx.imageSmoothingQuality='high';gx.drawImage(cv,x0,y0,ww,hh,0,0,c.width,c.height);return c}catch(e){return null}};
bl.slice(0,14).forEach(o=>{const bw=(o.x1-o.x0+1)/G,bh=(o.y1-o.y0+1)/H,fill=o.cnt/((o.x1-o.x0+1)*(o.y1-o.y0+1)),cx=(o.x0+o.x1+1)/2/G,top=o.y0/H,bot=(o.y1+1)/H,lum=LU(o.c),col=hexc(o.c),tt=cl2((bot-fyN)/(1-fyN),0,1),vw=W*(1-.35*tt),wm=bw*vw,hm=bh*2.7*(1-.3*tt)*1.1,floor=bot>fyN-.03&&bot>.6,asp=bw/bh;let k=null;
if(o.c[1]>o.c[0]+10&&o.c[1]>o.c[2]+10&&bh>.1)k='Plant';
else if(!floor){if(lum>170&&fill>.7&&bw>.05)k='Window';else if(fill>.55)k='Picture'}
else if(bh>.38&&asp<.55&&bw<.15&&fill>.72)k='Door';
else if(bh>.38&&bw>=.12&&bw<.4&&asp<1)k=fill<.72?'Bookshelf':'Wardrobe';
else if(bw<.1&&bh>.22&&lum>130)k='Floor lamp';
else if(lum<70&&fill>.75&&asp>1.4&&asp<2.6&&top<.6)k='Picture';
else if(bh<.2&&bw>.25&&top>fyN+.08)k='Rug';
else if(lum<100&&asp>1.35&&asp<3.2&&bh>=.08&&bh<.28&&bw>.16)k='TV unit';
else if(bw>.38&&bh>.22&&lum>120)k='Bed';
else if(bw>.25&&bh>.15&&bh<.5&&asp>1.4)k='Sofa';
else if(bw>.2&&bh<.3)k=lum<110?'Desk':'Dining table';
else if(bw>.1&&bh<.2)k='Coffee table';
else if(bw<.14&&bh<.4)k='Chair';
else if(bw>.14)k='Armchair';
if(!k)return;
if(k==='Window'||k==='Picture'||k==='Door'){const side=cx<.06?'left':cx>.94?'right':'back',it={kind:k,wall:side,offset:side==='back'?(cx-.5)*W:0,w:cl2(wm,k==='Door'?.8:.3,k==='Window'?2.2:k==='Door'?1.1:1.6),h:cl2(hm,k==='Door'?2:.3,k==='Door'?2.1:k==='Window'?1.8:1.2)};if(k!=='Window')it.color=col;items.push(it);return}
let x=(cx-.5)*W*(1-.35*tt),z=-Dp/2+tt*Dp*.85+.45,rot=0;if(cx<.12&&bw>.15){x=-W/2+.55;rot=90}else if(cx>.88&&bw>.15){x=W/2-.55;rot=270}
x=cl2(x,-W/2+.4,W/2-.4);z=cl2(z,-Dp/2+.4,Dp/2-.5);const it={kind:k,x:x,z:z,rotation:rot,w:cl2(wm,.3,W*.7),h:cl2(hm,.3,2.2)};if(k!=='Plant')it.color=col;{const sk=skinCanvas(o);if(sk)it.skin=sk}items.push(it)});
const wc={};if(dist(wL,wB)>16)wc.left=hexc(wL);if(dist(wR,wB)>16)wc.right=hexc(wR);
const cC=med(.28,.0,.72,.08),cLum=LU(cC),lights=[],seenL=new Uint8Array(G*H);
for(let y=1;y<Math.floor(H*.2);y++)for(let x=1;x<G-1;x++){const i=y*G+x;if(seenL[i])continue;if(LU(P(x,y))<Math.max(198,cLum+36))continue;const st=[[x,y]];seenL[i]=1;let cnt=0,sx=0;while(st.length){const q=st.pop();cnt++;sx+=q[0];[[1,0],[-1,0],[0,1],[0,-1]].forEach(dd=>{const nx=q[0]+dd[0],ny=q[1]+dd[1];if(nx<1||ny<1||nx>=G-1||ny>=H*.2)return;const p2=ny*G+nx;if(seenL[p2]||LU(P(nx,ny))<Math.max(198,cLum+36))return;seenL[p2]=1;st.push([nx,ny])})}if(cnt>8&&cnt<G*H*.012){const lx=(sx/cnt/G-.5)*W;if(!lights.some(q=>Math.abs(q.x-lx)<.55))lights.push({x:Math.round(lx*100)/100,z:Math.round((-Dp/2+.4)*100)/100})}}
return{room:{width:W,depth:Dp,height:2.7,wall_color:hexc(wB),floor_color:hexc(fC),floor_type:ft,wall_colors:wc,ceiling_color:dist(cC,wB)>18?hexc(cC):'#f4f1ea',lights:lights.slice(0,6)},items:items}}
const AG={busy:0,h:[]};
const AGC={white:'#ffffff',black:'#1a1a1a',gray:'#9a9a9a',grey:'#9a9a9a',red:'#c0392b',blue:'#3b6fd4',navy:'#1f2f5c',green:'#4f9a5b',sage:'#9caf88',yellow:'#e8c44a',orange:'#e08a3c',brown:'#7a5230',beige:'#d8c8a8',cream:'#f1e8d2',pink:'#e79ab5',purple:'#7d5ba6',gold:'#c9a24a',teal:'#2f8f8f'};
const KS=[[/coffee table|center table/,'Coffee table'],[/sofa|couch|settee/,'Sofa'],[/arm ?chair|recliner/,'Armchair'],[/\bbed\b/,'Bed'],[/dining|table/,'Dining table'],[/chair|stool/,'Chair'],[/desk/,'Desk'],[/wardrobe|closet|cupboard/,'Wardrobe'],[/\btv\b|television/,'TV unit'],[/book ?shelf|shelf|shelves/,'Bookshelf'],[/plant|flower/,'Plant'],[/lamp/,'Floor lamp'],[/\brug\b|carpet|\bmat\b/,'Rug'],[/kitchen|counter/,'Kitchen counter'],[/fridge|refrigerator/,'Fridge'],[/bath ?tub/,'Bathtub'],[/toilet/,'Toilet'],[/window/,'Window'],[/\bdoor\b/,'Door'],[/picture|painting|frame|\bart\b/,'Picture']];
function agentState(){const dd=DD(),c=dd.cfg;return{room:{width:c.w,depth:c.d,height:c.h,wall_color:c.wall,wall_colors:c.wc||null,floor_color:c.floor,floor_type:c.ft==='plan'?'plain':c.ft,light:c.light},items:dd.items.map(o=>({id:o.id,kind:F[o.k][0],x:+o.x.toFixed(2),z:+o.z.toFixed(2),rotation:Math.round(o.r),color:o.c,scale:+o.s.toFixed(2),width_scale:+(o.sx||1).toFixed(2),height_scale:+(o.sy||1).toFixed(2),finish:o.f||0}))}}
function agentPrompt(t){return 'You are the room design assistant inside a 3D room editor. The customer asks: "'+t.replace(/"/g,"'")+'"\n'+(AG.h.length?'Earlier requests: '+AG.h.join(' | ')+'\n':'')+'Current room (metres, room centred on 0,0; back wall at z=-depth/2, camera side at +z; x grows right; rotation in degrees: 0 faces the camera, 90 faces right, 180 faces the back wall, 270 faces left):\n'+JSON.stringify(agentState())+'\nFurniture kinds you can add: '+F.map(f=>f[0]).join(', ')+'. Window, Door and Picture are wall pieces: give "wall" (back, front, left or right) and "offset" (metres along the wall from its centre; on left and right walls it is the z position).\nReply with ONLY one JSON object: {"say":"one short friendly sentence about what you did","actions":[...]}. Each action is one of:\n{"op":"add","kind":"Sofa","x":0,"z":0,"rotation":0,"color":"#rrggbb","w":2,"d":0.9,"h":0.85} (w, d, h in metres, all optional)\n{"op":"update","id":12,"color":"#rrggbb","accent":"#rrggbb","finish":0 to 3 (matte, satin, glossy, metallic),"x":0,"z":0,"rotation":0,"w":1.5,"h":1,"scale":1} (only the fields to change)\n{"op":"remove","id":12}\n{"op":"clear"} (removes all furniture, keeps doors and windows)\n{"op":"room","wall_color":"#rrggbb","wall_colors":{"back":"#rrggbb","front":"","left":"","right":""},"floor_color":"#rrggbb","floor_type":"wood or tile or carpet or plain","width":5,"depth":4,"height":2.8,"light":0 to 1 (0 day, 1 night)} (only the fields to change)\nUse the ids in the current room to change or remove things. Put new pieces where they make sense: inside the room, not overlapping other pieces, seating facing the middle or the TV. Do only what the customer asked. If the request is not about the room, return an empty actions list and answer in "say".'}
function agentLocal(t){const s=t.toLowerCase(),acts=[],dd=DD(),hm=s.match(/#[0-9a-f]{6}/),cw=Object.keys(AGC).find(k=>new RegExp('\\b'+k+'\\b').test(s)),col=hm?hm[0]:(cw?AGC[cw]:null),NU={a:1,an:1,two:2,three:3,four:4,five:5},nm=s.match(/\b(\d+|two|three|four|five)\b/),cnt=nm?Math.max(1,Math.min(6,NU[nm[1]]||+nm[1]||1)):1;
let kind=null;for(const e of KS)if(e[0].test(s)){kind=e[1];break}
const room={op:'room'};let rc=0;
if(/evening|dusk/.test(s)){room.light=.55;rc++}else if(/night|dark/.test(s)){room.light=1;rc++}else if(/\bday|bright|sunny|morning/.test(s)){room.light=0;rc++}
const ft=/wood|parquet/.test(s)?'wood':/tile|marble|ceramic/.test(s)?'tile':/plain|concrete/.test(s)?'plain':(/floor/.test(s)&&/carpet/.test(s))?'carpet':null,isF=/floor|ground/.test(s),isW=/wall/.test(s);
if(isF){if(ft){room.floor_type=ft;rc++}if(col){room.floor_color=col;rc++}}
if(isW&&col){room.wall_color=col;rc++}
if(/(bigger|larger|expand|enlarge).*room|room.*(bigger|larger)/.test(s)){room.width=dd.cfg.w+1;room.depth=dd.cfg.d+1;rc++}else if(/(smaller|shrink).*room|room.*smaller/.test(s)){room.width=dd.cfg.w-1;room.depth=dd.cfg.d-1;rc++}
if(rc)acts.push(room);
const rem=/remove|delete|take out|get rid|clear/.test(s),add=/\b(add|put|place|need|want|new|insert|bring|include)\b/.test(s);
if(rem&&!kind&&/everything|all|empty|room/.test(s))acts.push({op:'clear'});
else if(kind&&!(isF&&ft&&!add)){const same=dd.items.filter(o=>F[o.k][0]===kind);
if(rem)same.forEach(o=>acts.push({op:'remove',id:o.id}));
else if(add||!same.length){for(let i=0;i<cnt;i++){const a={op:'add',kind:kind};if(col)a.color=col;acts.push(a)}}
else same.forEach(o=>{const u={op:'update',id:o.id};if(col)u.color=col;if(/bigger|larger|\bbig\b/.test(s))u.scale=Math.min(2.2,o.s*1.25);if(/smaller|\bsmall\b|shrink/.test(s))u.scale=Math.max(.5,o.s*.8);if(/rotate|turn/.test(s))u.rotation=(o.r+90)%360;acts.push(u)})}
return{say:acts.length?'Done.':'I could not understand that. Try: add a green sofa, paint the walls beige, make the floor tile, or make it night.',actions:acts}}
function agentApply(j){const dd=DD(),c=dd.cfg,hx=v=>typeof v==='string'&&/^#[0-9a-f]{6}$/i.test(v)?v:null,nu=(v,a,b)=>(v!==null&&v!==undefined&&v!==''&&isFinite(+v))?cl(+v,a,b):null;let n=0,rb=false,rs=false;
const redo=o=>{const g=objs.get(o.id);if(g)sc.remove(g);objs.delete(o.id);put(o)},del=o=>{const g=objs.get(o.id);if(g)sc.remove(g);objs.delete(o.id);dd.items=dd.items.filter(x=>x!==o)};
(Array.isArray(j.actions)?j.actions:[]).slice(0,30).forEach(a=>{if(!a||typeof a!=='object')return;try{
if(a.op==='room'){let ch=0;if(hx(a.wall_color)){c.wall=a.wall_color;c.wc=null;ch++}
if(a.wall_colors&&typeof a.wall_colors==='object'){const ix={back:0,front:1,left:2,right:3};Object.keys(ix).forEach(k=>{if(hx(a.wall_colors[k])){c.wc=c.wc||[null,null,null,null];c.wc[ix[k]]=a.wall_colors[k];ch++}})}
if(hx(a.floor_color)){c.floor=a.floor_color;ch++}if(['wood','tile','carpet','plain'].indexOf(a.floor_type)>=0){c.ft=a.floor_type;ch++}
[['width','w',3,12],['depth','d',3,12],['height','h',2.4,4]].forEach(p=>{const v=nu(a[p[0]],p[2],p[3]);if(v!==null){c[p[1]]=Math.round(v*10)/10;ch++;if(p[1]!=='h')rs=true}});
const l=nu(a.light,0,1);if(l!==null){c.light=l;ch++}if(ch){rb=true;n++}}
else if(a.op==='add'){const k=F.findIndex(f=>f[2]>0&&f[0].toLowerCase()===String(a.kind||'').toLowerCase());if(k<0)return;const f=F[k],dm=dimsOf(k),o={id:++PL.uid,k:k,x:0,z:0,r:0,s:1,sx:1,sy:1,a:'',f:0,c:hx(a.color)||f[3],fr:(f[0]==='Door'||f[0]==='Window')?1:0};
if(f[5]){const of=nu(a.offset,-20,20)||0,wl2=a.wall;if(wl2==='front'){o.x=of;o.z=c.d/2}else if(wl2==='left'){o.x=-c.w/2;o.z=of}else if(wl2==='right'){o.x=c.w/2;o.z=of}else{o.x=of;o.z=-c.d/2}const w=nu(a.w,.2,6),h=nu(a.h,.2,3);if(w!==null)o.sx=cl(w/dm.x,.4,2.5);if(h!==null)o.sy=cl(h/dm.y,.4,2.5)}
else{const x=nu(a.x,-20,20),z=nu(a.z,-20,20),r=nu(a.rotation,-720,720);o.x=x===null?(Math.random()-.5)*c.w*.5:x;o.z=z===null?(Math.random()-.5)*c.d*.5:z;o.r=r===null?0:((r%360)+360)%360;const w=nu(a.w,.1,8),d=nu(a.d,.1,8),h=nu(a.h,.1,4),rw=w!==null?w/dm.x:1,rd=d!==null?d/dm.z:1,rh=h!==null?h/dm.y:1;o.s=cl(rd,.5,2.2);o.sx=cl(rw/o.s,.4,2.5);o.sy=cl(rh/o.s,.4,2.5)}
fit(o);dd.items.push(o);put(o);n++}
else if(a.op==='update'){const o=dd.items.find(x=>x.id===+a.id);if(!o)return;const dm=dimsOf(o.k);if(hx(a.color))o.c=a.color;if(hx(a.accent))o.a=a.accent;const fn=nu(a.finish,0,3);if(fn!==null)o.f=Math.round(fn);
const x=nu(a.x,-20,20),z=nu(a.z,-20,20),r=nu(a.rotation,-720,720),s=nu(a.scale,.5,2.2),w=nu(a.w,.1,8),h=nu(a.h,.1,4);if(x!==null)o.x=x;if(z!==null)o.z=z;if(r!==null&&!F[o.k][5])o.r=((r%360)+360)%360;if(s!==null&&!F[o.k][5])o.s=s;if(w!==null)o.sx=cl(w/(dm.x*o.s),.4,2.5);if(h!==null)o.sy=cl(h/(dm.y*o.s),.4,2.5);fit(o);redo(o);n++}
else if(a.op==='remove'){const o=dd.items.find(x=>x.id===+a.id);if(o){del(o);n++}}
else if(a.op==='clear'){dd.items.filter(o=>!o.fr).forEach(o=>{del(o);n++})}}catch(e){}});
if(rb){bld();if(rs)view(false);ui0()}pick(-1);light();calc();return n}
async function agentGo(){const q=s=>box.querySelector(s),inp=q('#ixagi'),lg=q('#ixaglog'),btn=q('#ixagb'),t=inp.value.trim();if(!t||PL.room<0||AG.busy)return;AG.busy=1;btn.disabled=true;let j=null,via='';
if(SP.smp){lg.textContent='Thinking...';try{j=await SP.smp.json(agentPrompt(t),{modelTier:'default',cache:false});via='ai'}catch(e){j=null}}
if(!j||typeof j!=='object'||!Array.isArray(j.actions)){j=agentLocal(t);via='local'}
let n=0;try{n=agentApply(j)}catch(e){n=0}AG.h.push(t.slice(0,80));if(AG.h.length>4)AG.h.shift();
const say=String(j.say||(n?'Done.':'I did not find anything to change.')).slice(0,300);lg.textContent=say+(n?' ('+n+' change'+(n===1?'':'s')+')':'')+(via==='local'?' (built-in assistant)':'');hud(say);inp.value='';AG.busy=0;btn.disabled=false}
function agentMount(){if(!box||box.querySelector('#ixag'))return;const el=document.createElement('div');el.className='ixsb';el.id='ixag';
el.innerHTML='<b>✨ Room assistant</b><p class="sm" id="ixaglog" role="status">Tell me what to add or change in your room, in your own words.</p><div style="display:flex;gap:8px;margin-top:8px"><input id="ixagi" type="text" maxlength="300" placeholder="e.g. Add a green sofa and paint the walls beige" style="flex:1;min-width:0;padding:10px;border:1px solid var(--line);border-radius:8px;font:inherit"><button type="button" id="ixagb" style="padding:10px 14px;border-radius:8px;background:var(--amber);color:var(--on);font-weight:600">Send</button></div><div class="ixbtns" style="margin-top:8px;flex-wrap:wrap">'+['Make it a cozy evening','Add a desk and a plant','Make the floor tile','Paint the walls sage green'].map(x=>'<button type="button" data-ag="'+x+'">'+x+'</button>').join('')+'</div>';
box.querySelector('#ixsel').before(el);el.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.id==='ixagb')agentGo();else if(b.dataset.ag){el.querySelector('#ixagi').value=b.dataset.ag;agentGo()}});el.addEventListener('keydown',e=>{if(e.target.id==='ixagi'&&e.key==='Enter'){e.preventDefault();agentGo()}})}

const TR={on:0,i:0,raf:0,nv:0,sp:null,tp:null,el:null};
const tkq=s=>box&&box.querySelector(s),tkd=s=>{const e=tkq(s);return e&&e.closest('details')};
function tkSeen(){try{return localStorage.getItem('layc3dtour')==='1'}catch(e){return false}}
function tkSofa(){const dd=DD();let o=dd.items.find(x=>!x.fr);if(!o){const k=F.findIndex(f=>f[0]==='Sofa'),c=dd.cfg;o={id:++PL.uid,k:k,x:0,z:-c.d/2+1.1,r:0,s:1,c:F[k][3]};fit(o);dd.items.push(o);put(o);calc()}pick(o.id)}
function tkSample(){RM.push(['Living room','🛋️',5,4,'#e8e2d6','#b98b5e','wood',30000,2.8]);enter(RM.length-1)}
const TS=[
{ph:'A',t:'Name and measure your space',x:'Type a name for your space, then its width, depth and height in metres. The designer picks an icon from the name.',el:()=>tkq('#ixnm').closest('.ixf')},
{ph:'A',t:'Add it',x:'Tap Add this space. Your room then appears in the list underneath.',el:()=>tkq('#ixadd')},
{ph:'A',t:'Or start from a photo',x:'Have a room you love? Add its photo here and press Build. Furniture, doors, windows, colours, texture, electronics, walls, floor, ceiling and lighting are read from the photo and rebuilt in 3D. You start out standing inside.',el:()=>{const d=tkd('#ixql');if(d)d.open=true;return d}},
{ph:'A',t:'Open your room',w:1,x:'Tap a room in this list to open it in 3D. The guide continues inside the room. No room yet? Let us make a sample one for you.',el:()=>tkq('#ixrg'),act:['Make a sample room',tkSample]},
{ph:'B',t:'Your room in 3D',x:'Drag empty space to look around. Scroll or pinch to zoom. Drag any piece to move it across the floor.',el:()=>tkq('#ix3')},
{ph:'B',t:'Change your view',x:'All rooms takes you back to your list. 3D view and Top view help you plan the layout. Stand inside lets you walk around at eye level. Clear room empties it.',el:()=>tkq('#ixed .ixbtns')},
{ph:'B',t:'Room assistant',x:'Just say what you want, for example “add a green sofa and paint the walls beige”, and the assistant changes the room for you.',el:()=>tkq('#ixag')},
{ph:'B',t:'Add furniture',x:'Tap any item to place it in the room. Windows, doors and pictures snap onto the walls.',el:()=>tkq('.ixp')},
{ph:'B',t:'Make furniture from a photo',x:'Own a special piece? Add a straight-on photo, enter its real width and thickness, and it becomes a 3D piece in your room.',el:()=>{const d=tkd('#ixph');if(d)d.open=true;return d}},
{ph:'B',t:'Edit any piece',x:'Tap a piece to edit it. We selected a sample sofa so you can see the options: color, details color, finish, size, width, height and rotation. You can also reset, duplicate or remove it.',pre:tkSofa,el:()=>tkq('#ixsel')},
{ph:'B',t:'Walls and floor',x:'Tap a wall or the floor in the room to recolor it. For the floor you can also choose wood, tile, carpet or plain. “Paint all walls” colors every wall at once.',pre:()=>{PL.surf='floor';PL.sel=-1;selUI()},el:()=>tkq('#ixsrf')},
{ph:'B',t:'Size and lighting',x:'Change the wall colors, floor, width, depth and height here. Slide Day to night to see the room in daylight or evening light, with shadows that follow.',el:()=>{const d=tkd('#ixwc');if(d)d.open=true;return d}},
{ph:'B',t:'You are ready',x:'That is everything. Design freely, and tap ❓ Guide at the top any time to see this tour again.',el:()=>null}];
function tkUI(){if(TR.sp)return;const st=document.createElement('style');st.textContent='.tksp{position:fixed;z-index:2147483000;pointer-events:none;border-radius:12px;box-shadow:0 0 0 3px #fff,0 0 0 9999px rgba(8,16,60,.62);transition:all .25s}.tktp{position:fixed;z-index:2147483001;width:min(340px,calc(100vw - 16px));box-sizing:border-box;background:#fff;color:#0f2a8a;border:2px solid #4169e1;border-radius:14px;padding:14px 16px;box-shadow:0 12px 40px rgba(0,0,0,.35);font:14px/1.5 system-ui,-apple-system,sans-serif}.tktp b{display:block;font-size:16px;margin:2px 0 4px}.tktp p{margin:0 0 8px}.tktp small{color:#4f68c4}.tktp label{display:block;font-size:12px;color:#4f68c4;margin:6px 0}.tkb{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap}.tkb button{padding:8px 13px;border-radius:8px;border:1px solid #4169e1;background:#fff;color:#4169e1;font:600 13px system-ui,sans-serif;cursor:pointer}.tkb button.p{background:#4169e1;color:#fff}.tkb button:disabled{opacity:.4;cursor:default}@media (prefers-reduced-motion:reduce){.tksp{transition:none}}';document.head.appendChild(st);
TR.sp=document.createElement('div');TR.sp.className='tksp';TR.tp=document.createElement('div');TR.tp.className='tktp';TR.tp.setAttribute('role','dialog');TR.tp.setAttribute('aria-label','Design your space in 3D guide');document.body.append(TR.sp,TR.tp);
TR.tp.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const s=TS[TR.i],k=b.dataset.k;if(k==='x')tkEnd();else if(k==='b'){TR.i--;tkShow()}else if(k==='a'){s.act[1]()}else if(k==='n'){TR.i++;tkShow()}});
TR.tp.addEventListener('change',e=>{if(e.target.id==='tkz')TR.nv=e.target.checked});
['scroll','resize'].forEach(v=>window.addEventListener(v,tkPos,true));document.addEventListener('keydown',e=>{if(TR.on&&e.key==='Escape')tkEnd()})}
function tkRender(s){const n=TS.length,last=TR.i===n-1,pb=TR.i>0&&TS[TR.i-1].ph===s.ph;
TR.tp.innerHTML='<small>Step '+(TR.i+1)+' of '+n+'</small><b></b><p></p><label><input type="checkbox" id="tkz"'+(TR.nv?' checked':'')+'> Do not show this guide automatically again</label><div class="tkb"><button type="button" data-k="x">'+(last?'Close':'Skip')+'</button><button type="button" data-k="b"'+(pb?'':' disabled')+'>Back</button>'+(s.w?(s.act?'<button type="button" class="p" data-k="a">'+s.act[0]+'</button>':''):(last?'':'<button type="button" class="p" data-k="n">Next</button>'))+'</div>';
TR.tp.querySelector('b').textContent=s.t;TR.tp.querySelector('p').textContent=s.x;TR.tp.style.display='block';const f=TR.tp.querySelector('.p')||TR.tp.querySelector('button');if(f)try{f.focus({preventScroll:true})}catch(e){}}
function tkShow(){const s=TS[TR.i];if(!s){tkEnd();return}tkUI();try{if(s.ph==='B'&&PL.room>=0)pick(-1);if(s.pre&&PL.room>=0)s.pre()}catch(e){}
let el=null;try{el=s.el&&s.el()}catch(e){}TR.el=el;if(el&&el.scrollIntoView)try{el.scrollIntoView({block:'center',inline:'nearest'})}catch(e){}
tkRender(s);tkPos();setTimeout(tkPos,120);setTimeout(tkPos,400)}
function tkPos(){if(!TR.on||!TR.sp)return;cancelAnimationFrame(TR.raf);TR.raf=requestAnimationFrame(()=>{const sp=TR.sp,tp=TR.tp,vw=innerWidth,vh=innerHeight;let r=null;const el=TR.el;
if(el&&el.isConnected){const b=el.getBoundingClientRect();if(b.width>2&&b.height>2){const t=Math.max(6,b.top-6),l=Math.max(6,b.left-6),rr=Math.min(vw-6,b.right+6),bb=Math.min(vh-6,b.bottom+6);if(bb>t&&rr>l)r={t:t,l:l,w:rr-l,h:bb-t}}}
const q=r||{t:vh/2,l:vw/2,w:0,h:0};sp.style.display='block';sp.style.top=q.t+'px';sp.style.left=q.l+'px';sp.style.width=q.w+'px';sp.style.height=q.h+'px';
const th=tp.offsetHeight,tw=tp.offsetWidth;let top,left;
if(!r){top=(vh-th)/2;left=(vw-tw)/2}else{if(q.t+q.h+th+14<vh)top=q.t+q.h+12;else if(q.t-th-14>0)top=q.t-th-12;else top=vh-th-12;left=Math.max(8,Math.min(vw-tw-8,q.l+q.w/2-tw/2))}
tp.style.top=Math.max(8,Math.min(top,Math.max(8,vh-th-8)))+'px';tp.style.left=Math.max(8,Math.min(left,Math.max(8,vw-tw-8)))+'px'})}
function tkEnd(){if(!TR.on)return;TR.on=0;if(TR.nv){try{localStorage.setItem('layc3dtour','1')}catch(e){}}if(TR.sp){TR.sp.style.display='none';TR.tp.style.display='none'}try{if(PL.room>=0)pick(-1)}catch(e){}}
function tourStart(force){if(!box||TR.on)return;if(!force&&tkSeen())return;TR.on=1;TR.nv=0;TR.i=TS.findIndex(s=>s.ph===(PL.room>=0?'B':'A'));tkShow()}
function tourEnter(){if(TR.on&&TS[TR.i]&&TS[TR.i].w){TR.i++;setTimeout(()=>{if(TR.on)tkShow()},550)}}
function tourMount(){const o=tkq('#ixopen'),w=tkq('#ixwrap');if(!o||!w)return;const b=document.createElement('button');b.type='button';b.id='ixtour';b.textContent='❓ Guide';b.style.cssText='padding:8px 14px;border-radius:999px;background:var(--panel);border:1px solid var(--line);color:var(--fg);font-weight:600;cursor:pointer;margin-bottom:8px';w.insertBefore(b,w.firstChild);b.addEventListener('click',()=>{tkEnd();tourStart(true)});o.addEventListener('click',()=>setTimeout(()=>{if(!w.hidden)tourStart(false)},80))}

function fpv(){if(!cam||!ctl||PL.room<0)return;const c=DD().cfg,z=c.d/2-.6;cam.fov=72;cam.updateProjectionMatrix();ctl.minDistance=.02;ctl.maxDistance=.02;ctl.enableZoom=false;ctl.enablePan=false;ctl.rotateSpeed=-.45;ctl.minPolarAngle=.8;ctl.maxPolarAngle=2.4;cam.position.set(0,1.55,z+.02);ctl.target.set(0,1.55,z);ctl.update()}
async function mkroom(){const q=s=>box.querySelector(s),m=t=>{q('#ixqs').textContent=t};if(SP.busy)return;if(!SP.url){m('Drop, paste or choose a photo of your space first.');return}const nm=(q('#ixqn').value.trim().replace(/\s+/g,' ')||'My space').slice(0,24),w=parseFloat(q('#ixqw').value),d=parseFloat(q('#ixqd').value);if(!(w>=3&&w<=12)||!(d>=3&&d<=12)){m('Width and depth must each be between 3 and 12 metres.');return}
const uw=q('#ixqw').value!==SP.aw,ud=q('#ixqd').value!=='4',done=ri=>{SP.url=null;SP.blob=null;q('#ixqv').hidden=true;q('#ixqn').value='';m('')},
studied=n=>'Studied your photo and rebuilt it as a realistic 3D room: furniture, doors, windows, colours, texture, electronics, walls, floor, ceiling and lighting'+(n?' ('+n+' piece'+(n===1?'':'s')+' placed)':'')+'. Drag to look around. Click anything to change it.';
m('Studying the photo: furniture, doors, windows, colours, texture, electronics, walls, floor, ceiling and lighting.');
await new Promise(r=>setTimeout(r,40));
let scan=null;try{if(SP.cv)scan=localScan(SP.cv,w,d)}catch(e){scan=null}
plain=msg=>{let li=-1;try{if(scan){li=aiBuild(scan,nm,w,d,uw,ud);if(li>=0){const n=D[li].items.length;done();enter(li);fpv();hud(studied(n));return}}}catch(e){li=-1}RM.push([nm,'📷',Math.round(w*10)/10,Math.round(d*10)/10,SP.wall,SP.floor,'wood',Math.min(150000,Math.max(25000,Math.round(w*d*1.5)*1000)),2.8,SP.url]);const ri=RM.length-1;done();enter(ri);if(msg)hud(msg)};
if(SP.smp&&SP.img&&SP.blob){SP.busy=1;const btn=q('[data-a="mkroom"]');btn.disabled=true;m('Studying the photo and building a realistic 3D room. This can take up to a minute.');let ri=-1,err=null;try{const j=await SP.smp.json(aiPrompt(w,d,uw,ud),{images:[SP.blob],modelTier:'default',cache:false});if(!j||typeof j!=='object')throw{code:'bad_answer'};if(scan&&scan.room){j.room=j.room||{};if(!j.room.ceiling_color)j.room.ceiling_color=scan.room.ceiling_color;if((!j.room.lights||!j.room.lights.length)&&scan.room.lights)j.room.lights=scan.room.lights;if(!j.room.floor_type)j.room.floor_type=scan.room.floor_type}ri=aiBuild(j,nm,w,d,uw,ud)}catch(e){err=e}
SP.busy=0;btn.disabled=false;if(ri>=0){done();enter(ri);try{if(scan)stampSkins(ri,scan)}catch(e){}fpv();hud(studied(D[ri].items.length))}else plain('The photo could not be fully read'+(err&&err.code?' ('+err.code+')':'')+', so it is shown on the back wall instead. You can still add and change anything.')}
else plain()}
function mount(){const col=pg.querySelector('.cols > div');if(!col)return;col.style.minWidth='0';col.style.maxWidth='100%';box=document.createElement('section');box.className='ixg';
const inp=(l,t,id,ex)=>'<label>'+l+'<input type="'+t+'" id="'+id+'"'+(ex||'')+'></label>';
box.innerHTML='<button type="button" id="ixopen" aria-expanded="false" style="display:block;width:100%;padding:18px 20px;border-radius:14px;background:var(--amber);color:var(--on);font:700 17px system-ui,sans-serif;cursor:pointer;box-shadow:0 6px 20px rgba(65,105,225,.35)">🏟️ Design your space in 3D</button><div id="ixwrap" hidden style="margin-top:14px"><p class="sm">Step 1: name your space and type its measurements, then add it. Step 2: click it to open it in 3D. Step 3: customize everything: size, walls, floor, lighting, furniture, colors and layout.</p><div id="ixgame"><div id="ixrooms"><div class="ixf">'+inp('Name your space','text','ixnm',' maxlength="24" placeholder="e.g. Living room, Gym, Bakery" style="width:100%;padding:8px;border:1px solid var(--line);border-radius:8px;font:inherit"')+inp('Width (m)','number','ixnw',' min="3" max="12" step="0.1" placeholder="3 to 12" style="width:100%;padding:8px;border:1px solid var(--line);border-radius:8px;font:inherit"')+inp('Depth (m)','number','ixnd',' min="3" max="12" step="0.1" placeholder="3 to 12" style="width:100%;padding:8px;border:1px solid var(--line);border-radius:8px;font:inherit"')+inp('Height (m)','number','ixnh',' min="2.4" max="4" step="0.1" value="2.8" style="width:100%;padding:8px;border:1px solid var(--line);border-radius:8px;font:inherit"')+'</div><div class="ixbtns" style="margin:10px 0"><button type="button" id="ixadd">➕ Add this space</button><span id="ixem" title="Emoji picked from your name" style="font-size:28px;margin-left:10px">🏠</span></div><p class="sm" id="ixerr" role="status"></p><details style="margin:10px 0"><summary>📷 Or start from a photo of a furnished space</summary><p class="sm">Drop, paste or choose a photo of a room you like. The photo is studied piece by piece: furniture, doors, windows, colours, texture, electronics, walls, floor, ceiling and lighting, then rebuilt as a realistic 3D room. You start out standing inside it. Then change anything you want. Width and depth are optional: type them if you know them, otherwise Claude estimates them from the photo. If Claude cannot be reached, the photo becomes the back wall of the room instead.</p><label class="ixup" id="ixql" style="padding:12px">📷 Drop, paste or tap to choose a photo of the space<input type="file" id="ixqp" accept="image/*"></label><img class="ixth" id="ixqv" alt="Space photo" hidden><p class="sm" id="ixqs" role="status"></p><div class="ixf">'+inp('Name this space','text','ixqn',' maxlength="24" placeholder="e.g. My living room"')+inp('Width (m)','number','ixqw',' min="3" max="12" step="0.1" value="4.5"')+inp('Depth (m)','number','ixqd',' min="3" max="12" step="0.1" value="4"')+'</div><div class="ixbtns" style="margin-top:10px"><button type="button" data-a="mkroom">✨ Build this room in 3D</button></div></details><p class="sm"><b>Click the space you want to design</b></p><div class="ixrms" id="ixrg"></div></div>'
+'<div id="ixed" hidden><div class="ixbtns"><button type="button" data-a="back">← All rooms</button><b id="ixrn"></b><button type="button" data-a="orb">3D view</button><button type="button" data-a="top">Top view</button><button type="button" data-a="fpv">👁 Stand inside</button><button type="button" data-a="reset">Clear room</button></div><div class="ix3" id="ix3"></div><p class="sm" id="ixmsg" role="status"></p>'
+'<div class="ixsb" id="ixsel" hidden><b id="ixsn"></b><div class="ixf">'+inp('Color','color','ixic')+inp('Size','range','ixis',' min="0.5" max="2.2" step="0.05"')+inp('Details color','color','ixac')+'<label>Finish<select id="ixfn"><option value="0">Matte</option><option value="1">Satin</option><option value="2">Glossy</option><option value="3">Metallic</option></select></label>'+inp('Width','range','ixsx',' min="0.4" max="2.5" step="0.05"')+inp('Height','range','ixsy',' min="0.4" max="2.5" step="0.05"')+'<label id="ixirw">Rotation<input type="range" id="ixir" min="0" max="360" step="5"></label></div><div class="ixbtns" style="margin-top:10px"><button type="button" data-a="rst">↺ Reset piece</button><button type="button" data-a="dup">Duplicate</button><button type="button" data-a="del">🗑 Remove</button></div></div>'
+'<div class="ixsb" id="ixsrf" hidden><b id="ixsrn"></b><div class="ixf" id="ixsrw">'+inp('This wall color','color','ixwq')+'</div><div class="ixf" id="ixsrfl">'+inp('Floor color','color','ixfq')+'<label>Floor type<select id="ixtq"><option value="wood">Wood</option><option value="tile">Tile</option><option value="carpet">Carpet</option><option value="plain">Plain</option></select></label></div><div class="ixbtns" style="margin-top:10px" id="ixsrb"><button type="button" data-a="wall-all">Paint all walls this color</button></div></div>'
+'<details open><summary>📷 Make furniture from a photo</summary><p class="sm">Drop a photo here, paste one (Ctrl or ⌘ + V), or tap to choose. A straight-on photo on a plain background works best. It is rebuilt as a solid 3D piece with all six sides (front, back, left, right, top and bottom) that keep the colors, patterns and textures of your photo. If some background is left, click it in the preview to erase it.</p><label class="ixup" style="padding:12px">📷 Drop, paste or tap to choose a photo<input type="file" id="ixph" accept="image/*"></label><img class="ixth" id="ixpv" alt="Cut-out preview" hidden style="cursor:crosshair;background:repeating-conic-gradient(#ddd 0 25%,#fff 0 50%) 0 0/16px 16px"><p class="sm" id="ixps" role="status"></p><div class="ixf">'+inp('Name','text','ixpn',' maxlength="24" placeholder="e.g. My sofa"')+inp('Real width (m)','number','ixpw',' min="0.2" max="6" step="0.05" value="1.2"')+inp('Depth / thickness (m)','number','ixpt',' min="0.02" max="3" step="0.05" value="0.5"')+'<label>Photo type<select id="ixpm"><option value="stand">Front view (stands up)</option><option value="flat">Top view (lies flat, like a rug)</option></select></label><label><input type="checkbox" id="ixpr" checked> Remove background</label>'+inp('Background strength','range','ixpq',' min="15" max="90" step="1" value="40"')+'</div><div class="ixbtns" style="margin-top:10px"><button type="button" data-a="mk3d">➕ Make 3D and place in room</button></div></details>'
+'<div class="ixp" id="ixdock">'+F.map((f,k)=>'<button type="button" class="ixpb" draggable="true" data-k="'+k+'"><span>'+f[1]+'</span>'+f[0]+'<em>'+fm(f[2])+'</em></button>').join('')+'</div>'
+'<details><summary>Room style, size and lighting</summary><div class="ixf">'+inp('Wall color','color','ixwc')+inp('Floor color','color','ixfc')+'<label>Floor type<select id="ixft"><option value="wood">Wood</option><option value="tile">Tile</option><option value="carpet">Carpet</option><option value="plain">Plain</option></select></label>'+inp('Width','range','ixw',' min="3" max="12" step="0.5"')+inp('Depth','range','ixd',' min="3" max="12" step="0.5"')+inp('Wall height','range','ixh',' min="2.4" max="4" step="0.1"')+inp('Day to night','range','ixl',' min="0" max="1" step="0.05"')+'<label><input type="checkbox" id="ixpo"> Show my photo on the back wall</label></div></details><button type="button" id="ixready" data-a="ready" hidden style="display:block;width:100%;margin:12px 0 4px;padding:18px 20px;border-radius:14px;background:#0f2a8a;color:#fff;font:800 17px system-ui,sans-serif;letter-spacing:1px;cursor:pointer;box-shadow:0 6px 20px rgba(15,42,138,.4)">YOUR SPACE IS READY</button></div></div></div>';
col.insertBefore(box,col.firstChild);
{const stage=box.querySelector('#ix3'),dock=box.querySelector('#ixdock');if(stage&&dock)stage.insertAdjacentElement('afterend',dock);
let arm=null,ghost=null;
const clearGhost=()=>{if(ghost){ghost.remove();ghost=null}};
const onMove=e=>{if(!arm||e.pointerId!==arm.pid)return;const dx=e.clientX-arm.x,dy=e.clientY-arm.y;if(!arm.moved){if(Math.hypot(dx,dy)<8)return;const over=document.elementFromPoint(e.clientX,e.clientY);if(Math.abs(dx)>Math.abs(dy)&&dock.contains(over))return;arm.moved=true}
if(!ghost){ghost=document.createElement('div');ghost.className='ixgh';ghost.textContent=arm.label;document.body.appendChild(ghost)}ghost.style.left=(e.clientX+14)+'px';ghost.style.top=(e.clientY-18)+'px'};
const onUp=e=>{if(!arm||e.pointerId!==arm.pid)return;const k=arm.k,moved=arm.moved;arm=null;clearGhost();window.removeEventListener('pointermove',onMove);window.removeEventListener('pointerup',onUp);window.removeEventListener('pointercancel',onUp);if(!moved||PL.room<0)return;const r=stage.getBoundingClientRect(),d=dock.getBoundingClientRect();const onDock=e.clientX>=d.left&&e.clientX<=d.right&&e.clientY>=d.top&&e.clientY<=d.bottom;const onStage=e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom;if(onDock){box.dataset.dragged='1';return}if(!onStage)return;aim(e);if(!ray.ray.intersectPlane(pln,hv)){placePiece(k);return}placePiece(k,hv.x,hv.z)};
if(dock)dock.addEventListener('pointerdown',e=>{const p=e.target.closest('.ixpb');if(!p||PL.room<0)return;arm={k:+p.dataset.k,x:e.clientX,y:e.clientY,moved:false,pid:e.pointerId,label:(p.textContent||'Piece').trim()};window.addEventListener('pointermove',onMove);window.addEventListener('pointerup',onUp);window.addEventListener('pointercancel',onUp)});
let dragK=-1;
if(dock)dock.addEventListener('dragstart',e=>{const p=e.target.closest('.ixpb');if(!p||!e.dataTransfer)return;dragK=+p.dataset.k;try{e.dataTransfer.setData('text/plain',p.dataset.k)}catch(x){}e.dataTransfer.effectAllowed='copy'});
if(dock)dock.addEventListener('dragend',()=>{setTimeout(()=>{dragK=-1},0)});
if(stage)stage.addEventListener('dragover',e=>{if(!(dragK>=0))return;const types=e.dataTransfer?[...(e.dataTransfer.types||[])]:[];if(types.indexOf('Files')>=0)return;e.preventDefault();if(e.dataTransfer)e.dataTransfer.dropEffect='copy'});
if(stage)stage.addEventListener('drop',e=>{if(!(dragK>=0))return;e.preventDefault();const k=dragK;dragK=-1;if(PL.room<0)return;const d=dock.getBoundingClientRect();if(e.clientX>=d.left&&e.clientX<=d.right&&e.clientY>=d.top&&e.clientY<=d.bottom)return;aim(e);if(!ray.ray.intersectPlane(pln,hv)){placePiece(k);return}placePiece(k,hv.x,hv.z)})}
const addSp=()=>{const q=s=>box.querySelector(s),nm=q('#ixnm').value.trim().replace(/\s+/g,' '),w=parseFloat(q('#ixnw').value),d=parseFloat(q('#ixnd').value),h=parseFloat(q('#ixnh').value)||2.8,er=q('#ixerr');
if(!nm){er.textContent='Please type a name for your space.';return}
if(!(w>=3&&w<=12)||!(d>=3&&d<=12)){er.textContent='Width and depth must each be between 3 and 12 metres.';return}
if(!(h>=2.4&&h<=4)){er.textContent='Height must be between 2.4 and 4 metres.';return}
const wet=/kitchen|bath|toilet|\bwc\b|restroom|laundry|restaurant|مطبخ|حمام/.test(nm.toLowerCase()),em=emo(nm);
RM.push([nm,em,Math.round(w*10)/10,Math.round(d*10)/10,wet?'#f1efe9':'#e8e2d6',wet?'#cfd2d6':'#b98b5e',wet?'tile':'wood',Math.min(150000,Math.max(25000,Math.round(w*d*1.5)*1000)),Math.round(h*10)/10]);
er.textContent='Added '+em+' '+nm+'. Click it below to design it.';q('#ixnm').value='';q('#ixem').textContent='🏠';rooms();calc()};
tourMount();rooms();const nmI=box.querySelector('#ixnm');
nmI.addEventListener('input',()=>{box.querySelector('#ixem').textContent=emo(nmI.value)});
box.querySelector('#ixopen').addEventListener('click',()=>{const w=box.querySelector('#ixwrap'),b=box.querySelector('#ixopen'),open=w.hidden;w.hidden=!open;b.setAttribute('aria-expanded',open);b.textContent=open?'✕ Close the 3D designer':'🏟️ Design your space in 3D';if(open)w.scrollIntoView({behavior:'smooth',block:'nearest'});else{rooms();calc()}});
box.querySelector('#ixadd').addEventListener('click',function(){if(box.dataset.adding==='1')return;box.dataset.adding='1';try{addSp()}finally{box.dataset.adding=''}});
const q9=s=>box.querySelector(s);let rt;const re=()=>{clearTimeout(rt);rt=setTimeout(()=>{if(PH.cv&&PH.k!=null)mk3d()},250)};
q9('#ixph').addEventListener('change',e=>{phLoad(e.target.files[0]);e.target.value=''});
q9('#ixqp').addEventListener('change',e=>{spLoad(e.target.files[0]);e.target.value=''});
SP.smp=null;SP.img=false;try{if(window.claude&&window.claude.use)window.claude.use('sample').then(s=>{if(!s)return;SP.smp=s;return Promise.resolve(s.limits&&s.limits()).then(l=>{SP.img=!!(l&&l.images)})}).catch(()=>{})}catch(e){}
['#ixpq','#ixpr'].forEach(s=>q9(s).addEventListener('input',()=>{phUpd();re()}));['#ixpw','#ixpt','#ixpm'].forEach(s=>q9(s).addEventListener('input',re));
q9('#ixpv').addEventListener('click',e=>{if(!PH.cv)return;const v=e.currentTarget,r=v.getBoundingClientRect();wand(PH.cv,Math.floor((e.clientX-r.left)/r.width*PH.cv.width),Math.floor((e.clientY-r.top)/r.height*PH.cv.height),+q9('#ixpq').value);v.src=PH.cv.toDataURL('image/png');re()});
{const wr=q9('#ixwrap'),zn=q9('.ixup'),fl=e=>e.dataTransfer&&[...(e.dataTransfer.types||[])].indexOf('Files')>=0;['dragenter','dragover'].forEach(v=>wr.addEventListener(v,e=>{if(fl(e)){e.preventDefault();zn.style.background='rgba(65,105,225,.15)'}}));wr.addEventListener('dragleave',e=>{if(!wr.contains(e.relatedTarget))zn.style.background=''});wr.addEventListener('drop',e=>{zn.style.background='';const f=e.dataTransfer&&e.dataTransfer.files[0];if(f){e.preventDefault();phLoad(f)}})}
if(window.__ixp){document.removeEventListener('paste',window.__ixp);document.removeEventListener('dragover',window.__ixd);document.removeEventListener('drop',window.__ixd)}
window.__ixp=e=>{if(!box||!box.isConnected||box.querySelector('#ixwrap').hidden)return;const it=[...(e.clipboardData&&e.clipboardData.items||[])].find(x=>x.type&&x.type.indexOf('image/')===0);if(!it)return;e.preventDefault();phLoad(it.getAsFile())};
window.__ixd=e=>{if(box&&box.isConnected&&!box.querySelector('#ixwrap').hidden&&e.dataTransfer&&[...(e.dataTransfer.types||[])].indexOf('Files')>=0)e.preventDefault()};
document.addEventListener('paste',window.__ixp);document.addEventListener('dragover',window.__ixd);document.addEventListener('drop',window.__ixd);
['#ixnm','#ixnw','#ixnd','#ixnh'].forEach(x=>box.querySelector(x).addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();addSp()}}));
function placePiece(k,x,z){if(!(k>=0)||!F[k]||PL.room<0||!DD())return;const dropped=x!=null;if(dropped){const now=Date.now();if(now-(placePiece.at||0)<400)return;placePiece.at=now}const fd=F[k],c=DD().cfg;const o={id:++PL.uid,k:k,x:x==null?(Math.random()-.5)*c.w*.4:x,z:z==null?(fd[5]?-c.d/2:(Math.random()-.5)*c.d*.4):z,r:0,s:1,c:fd[3]};fit(o);DD().items.push(o);put(o);pick(o.id);hud(CH[Math.floor(Math.random()*CH.length)]);calc()}
box.addEventListener('click',e=>{const rb=e.target.closest('.ixrm');if(rb){enter(+rb.dataset.r);return}
const p=e.target.closest('.ixpb');if(p){if(box.dataset.dragged==='1'){box.dataset.dragged='';return}placePiece(+p.dataset.k);return}
const a=e.target.closest('[data-a]');if(!a)return;const t=a.dataset.a;if(t==='back'){rooms();calc();return}if(t==='top'){view(true);return}if(t==='orb'){view(false);return}
if(t==='ready'){ixRP.go();return}if(t==='mk3d'){mk3d();return}
if(t==='mkroom'){mkroom();return}
if(t==='fpv'){fpv();hud('You are standing inside the room. Drag to look around. Use 3D view to step back out.');return}
if(t==='wall-all'){const c=DD().cfg;c.wall=box.querySelector('#ixwq').value;c.wc=null;box.querySelector('#ixwc').value=c.wall;ixRP.wdone();bld();hud('All walls painted.');calc();return}
if(t==='rst'){const o=DD().items.find(x=>x.id===PL.sel);if(o){o.a='';o.f=0;o.sx=o.sy=1;o.s=1;o.c=F[o.k][3];sc.remove(objs.get(o.id));objs.delete(o.id);put(o);pick(o.id);hud('Piece reset.');calc()}return}
if(t==='reset'){DD().items.filter(o=>!o.fr).forEach(o=>{const g=objs.get(o.id);if(g)sc.remove(g);objs.delete(o.id)});DD().items=DD().items.filter(o=>o.fr);pick(-1);hud('Room cleared.');calc();return}
const o=DD().items.find(x=>x.id===PL.sel);if(!o)return;if(t==='del'){if(o.fr&&!confirm('Remove this door or window?'))return;sc.remove(objs.get(o.id));objs.delete(o.id);DD().items=DD().items.filter(x=>x!==o);pick(-1)}else if(t==='dup'){const n=Object.assign({},o,{id:++PL.uid,x:o.x+.5,z:o.z+.5,fr:0});fit(n);DD().items.push(n);put(n);pick(n.id)}hud();calc()});
box.addEventListener('input',e=>{const id=e.target.id,v=e.target.value;if(PL.room<0||!DD())return;const c=DD().cfg,o=DD().items.find(x=>x.id===PL.sel);
if(id==='ixwc')c.wc=null;if(id==='ixwc'||(id==='ixwq'&&PL.surf==='wall'))ixRP.wdone();
if(id==='ixwc'||id==='ixfc'||id==='ixft'||id==='ixw'||id==='ixd'||id==='ixh'){c[{ixwc:'wall',ixfc:'floor',ixft:'ft',ixw:'w',ixd:'d',ixh:'h'}[id]]=(id==='ixwc'||id==='ixfc'||id==='ixft')?v:+v;bld();if(id==='ixw'||id==='ixd')view(false);calc()}
else if(id==='ixl'){c.light=+v;light()}else if(o&&id==='ixic'){o.c=v;objs.get(o.id).userData.mm.forEach(m=>m.color.set(v));light();calc()}else if(o&&id==='ixis'){o.s=+v;place(o)}else if(o&&id==='ixir'){o.r=+v;place(o)}
else if(o&&id==='ixac'){o.a=v;objs.get(o.id).userData.am.forEach(m=>m.color.set(v))}else if(o&&id==='ixfn'){o.f=+v;fin(o,objs.get(o.id))}else if(o&&id==='ixsx'){o.sx=+v;place(o)}else if(o&&id==='ixsy'){o.sy=+v;place(o)}
else if(id==='ixwq'&&PL.surf==='wall'){c.wc=c.wc||[null,null,null,null];c.wc[PL.wi]=v;wl[PL.wi].m.material.color.set(v);calc()}
else if(id==='ixfq'){c.floor=v;box.querySelector('#ixfc').value=v;bld();calc()}else if(id==='ixtq'){c.ft=v;box.querySelector('#ixft').value=v;bld();calc()}else if(id==='ixpo'){c.pho=e.target.checked?1:0;bld()}});
['change','input','click','keydown'].forEach(v=>box.addEventListener(v,e=>e.stopPropagation()))}
const ixRP={};
{/* YOUR SPACE IS READY: 2 A4 sheets (plan, 2 x 3D, 2 x inside, materials). Preview opens at once, PDF downloads from it. */
const CN=[['White','#ffffff'],['Off-white','#f1efe9'],['Ivory','#e8e2d6'],['Beige','#d8c4a0'],['Sand','#c9a27a'],['Light grey','#c8cacd'],['Grey','#8a8d92'],['Charcoal','#3b3b3f'],['Black','#111111'],['Cream yellow','#f2d28b'],['Mustard','#e0b84f'],['Orange','#e08a3c'],['Terracotta','#c9784a'],['Red','#b34b4b'],['Burgundy','#7a2430'],['Pink','#e3a6b4'],['Purple','#7b5ea7'],['Light blue','#a9c6e8'],['Steel blue','#8fa8c8'],['Royal blue','#4169e1'],['Navy','#1d2c68'],['Teal','#3a8f8f'],['Mint','#a8d5b8'],['Sage green','#8a9a80'],['Green','#4f9a5a'],['Olive','#7a7a3c'],['Oak','#b98b5e'],['Walnut','#8b5e3c'],['Dark wood','#5b3d26']];
const h2r=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)),okc=h=>/^#[0-9a-f]{6}$/i.test(h||''),cname=h=>{const a=h2r(h);let b=CN[0],d=1e9;CN.forEach(n=>{const r=h2r(n[1]),e=(a[0]-r[0])**2+(a[1]-r[1])**2+(a[2]-r[2])**2;if(e<d){d=e;b=n}});return b[0]};
const MAT={fabric:'Upholstery fabric',wood:'Solid wood, clear lacquer',lacquer:'High-gloss lacquer',fridge:'Lacquered steel',ceramic:'Glazed ceramic',shade:'Linen lamp shade',rug:'Woven wool rug',paint:'Painted timber',gilt:'Gilded metal frame'},FT={wood:'Oak plank flooring',tile:'Porcelain tile',carpet:'Loop-pile carpet',plain:'Polished screed'},FN=['Matte','Satin','Glossy','Metallic'];
const NV='#0f2a8a',MU='#4f68c4',BL='#4169e1',nm=o=>F[o.k]?F[o.k][0]:'Custom piece';
ixRP.wdone=()=>{if(!box||PL.room<0||!DD())return;DD().cfg.wd=1;const b=box.querySelector('#ixready');if(b)b.hidden=false};
const fade=v=>wl.forEach(w=>{const d=(v.position.x-w.m.position.x)*w.n[4]+(v.position.z-w.m.position.z)*w.n[5],a=d>.1?.1:1;w.m.material.opacity=a;w.m.material.depthWrite=d<=.1;w.b.material.opacity=a;w.b.material.depthWrite=d<=.1});
function snap(cm,W,H,bg){const ob=sc.background;if(bg)sc.background=new THREE.Color(bg);try{R3.setPixelRatio(1);R3.setSize(W,H,false);fade(cm);R3.render(sc,cm);return R3.domElement.toDataURL('image/jpeg',.9)}finally{sc.background=ob}}
function shots(){const h=box.querySelector('#ix3'),cw=h.clientWidth,ch=h.clientHeight,pr=R3.getPixelRatio();try{return shots0()}finally{R3.setPixelRatio(pr);R3.setSize(cw,ch,false);if(selH)selH.visible=true}}
function shots0(){const c=DD().cfg,hw=c.w/2+1,hd=c.d/2+1,PW=1100,PH=Math.round(PW*hd/hw),W=1000,H=667;
if(selH)selH.visible=false;const op=new THREE.OrthographicCamera(-hw,hw,hd,-hd,.1,60);op.position.set(0,30,0);op.up.set(0,0,-1);op.lookAt(0,0,0);op.updateMatrixWorld();
const S={plan:{u:snap(op,PW,PH,'#ffffff'),W:PW,H:PH,hw,hd}},pc=(f,p,t)=>{const k=new THREE.PerspectiveCamera(f,W/H,.1,100);k.position.set(...p);k.lookAt(...t);k.updateMatrixWorld();return k};
S.v=[['A','3D view from the front-right corner',pc(50,[c.w*.8,c.h*1.2,c.d*1.1],[0,1,0])],['B','3D view from the back-left corner',pc(50,[-c.w*.8,c.h*1.2,-c.d*1.1],[0,1,0])],['C','Standing inside, facing the back wall',pc(72,[0,1.55,c.d/2-.7],[0,1.25,-c.d/2])],['D','Standing in the back-left corner, facing the room',pc(72,[-c.w/2+.7,1.55,-c.d/2+.7],[c.w/4,1.1,c.d/4])]].map(a=>({id:a[0],t:a[1],cam:a[2],u:snap(a[2],W,H)}));
const OW=1000,OH=560,wo=(len,p,t)=>{let a=len/2+.3,b=c.h/2+.3;if(b*OW/OH<a)b=a*OH/OW;else a=b*OW/OH;const k=new THREE.OrthographicCamera(-a,a,b,-b,.1,80);k.position.set(...p);k.lookAt(...t);k.updateMatrixWorld();return k};
S.w=[['W1','Back wall',c.w,[0,c.h/2,c.d/2+12],[0,c.h/2,-c.d/2]],['W2','Front wall',c.w,[0,c.h/2,-c.d/2-12],[0,c.h/2,c.d/2]],['W3','Left wall',c.d,[c.w/2+12,c.h/2,0],[-c.w/2,c.h/2,0]],['W4','Right wall',c.d,[-c.w/2-12,c.h/2,0],[c.w/2,c.h/2,0]]].map(a=>{const k=wo(a[2],a[3],a[4]);return{id:a[0],t:a[1],len:a[2],cam:k,u:snap(k,OW,OH,'#ffffff')}});
return S}
const wb=(g,rot)=>{const b=new THREE.Box3(),R=new THREE.Matrix4().makeRotationY(rot?-g.rotation.y:0);g.updateMatrixWorld(true);g.traverse(m=>{if(m.isMesh&&m.renderOrder!==1&&m.geometry){if(!m.geometry.boundingBox)m.geometry.computeBoundingBox();b.union(m.geometry.boundingBox.clone().applyMatrix4(R.clone().multiply(m.matrixWorld)))}});return b};
const dims=o=>{const g=objs.get(o.id);if(!g)return'';const s=wb(g,1).getSize(new THREE.Vector3());return s.x.toFixed(2)+' x '+s.z.toFixed(2)+' x '+s.y.toFixed(2)};
const FNT='Helvetica,Arial,sans-serif',bdg=(x,px,py,t,s,col)=>{x.beginPath();x.arc(px,py,s,0,6.3);x.fillStyle=col||BL;x.fill();x.lineWidth=s*.14;x.strokeStyle='#fff';x.stroke();x.fillStyle='#fff';x.font='700 '+s*(String(t).length>1?.85:1.05)+'px '+FNT;x.textAlign='center';x.textBaseline='middle';x.fillText(t,px,py+s*.05)};
const lab=(x,t,px,py,s)=>{x.font='700 '+s+'px '+FNT;x.textAlign='center';x.textBaseline='middle';x.lineWidth=s*.3;x.strokeStyle='#fff';x.strokeText(t,px,py);x.fillStyle=NV;x.fillText(t,px,py)};
const ann=(u,fn)=>new Promise(r=>{const im=new Image();im.onload=()=>{const cv=document.createElement('canvas');cv.width=im.width;cv.height=im.height;const x=cv.getContext('2d');x.drawImage(im,0,0);fn(x,cv.width,cv.height);r(cv.toDataURL('image/jpeg',.9))};im.src=u});
async function marks(S,its,c){const p=S.plan,M={};
M.plan=await ann(p.u,(x,W,H)=>{const s=W*.016,sx=v=>(v+p.hw)/(2*p.hw)*W,sy=v=>(v+p.hd)/(2*p.hd)*H;its.forEach(a=>bdg(x,sx(a.o.x),sy(a.o.z),a.n,s));
[['W1',0,-c.d/2-.5],['W2',0,c.d/2+.5],['W3',-c.w/2-.5,0],['W4',c.w/2+.5,0]].forEach(a=>bdg(x,sx(a[1]),sy(a[2]),a[0],s*1.15,NV));bdg(x,sx(-c.w/2+.45),sy(c.d/2-.45),'F',s,NV);
x.strokeStyle=NV;x.lineWidth=3;const y0=sy(c.d/2+.85),x0=sx(c.w/2+.85);x.beginPath();x.moveTo(sx(-c.w/2),y0);x.lineTo(sx(c.w/2),y0);x.moveTo(x0,sy(-c.d/2));x.lineTo(x0,sy(c.d/2));x.stroke();
lab(x,c.w+' m',sx(-c.w/4),y0-s*.9,s*1.1);lab(x,c.d+' m',x0-s*.2,sy(-c.d/4),s*1.1)});
M.v=[];for(const v of S.v){const hit=[],u=await ann(v.u,(x,W,H)=>{const s=W*.016;its.forEach(a=>{const g=objs.get(a.o.id);if(!g)return;const q=wb(g).getCenter(new THREE.Vector3()).project(v.cam);if(Math.abs(q.x)<.94&&Math.abs(q.y)<.9&&q.z>-1&&q.z<1){bdg(x,(q.x+1)/2*W,(1-q.y)/2*H,a.n,s);hit.push(a)}});x.fillStyle='rgba(15,42,138,.88)';x.fillRect(0,0,s*4.6,s*2.3);x.fillStyle='#fff';x.font='700 '+s*1.2+'px '+FNT;x.textAlign='left';x.textBaseline='middle';x.fillText('VIEW '+v.id,s*.8,s*1.2)});M.v.push({u,t:v.t,id:v.id,hit})}
M.w=[];const nearW=(id,o)=>id==='W1'?Math.abs(o.z+c.d/2)<=1.2:id==='W2'?Math.abs(o.z-c.d/2)<=1.2:id==='W3'?Math.abs(o.x+c.w/2)<=1.2:Math.abs(o.x-c.w/2)<=1.2;
for(const v of S.w){const hit=[],u=await ann(v.u,(x,W,H)=>{const s=W*.016;its.forEach(a=>{if(!nearW(v.id,a.o))return;const g=objs.get(a.o.id);if(!g)return;const q=wb(g).getCenter(new THREE.Vector3()).project(v.cam);if(Math.abs(q.x)<.97&&Math.abs(q.y)<.95){bdg(x,(q.x+1)/2*W,(1-q.y)/2*H,a.n,s);hit.push(a)}});x.fillStyle='rgba(15,42,138,.88)';x.fillRect(0,0,s*7.4,s*2.3);x.fillStyle='#fff';x.font='700 '+s*1.2+'px '+FNT;x.textAlign='left';x.textBaseline='middle';x.fillText('SECTION '+v.id,s*.8,s*1.2)});M.w.push({u,t:v.t,id:v.id,hit})}
return M}
function rows(its,c){const r=[];['Back wall','Front wall','Left wall','Right wall'].forEach((n,i)=>r.push({n:'W'+(i+1),e:n,m:(i===0&&c.ph&&c.pho)?'Printed photo panel':'Matt emulsion paint on plaster',c:(c.wc&&c.wc[i])||c.wall,s:(i<2?c.w:c.d)+' x '+c.h}));
r.push({n:'S',e:'Skirting and cornice',m:'Satin lacquered MDF',c:'#f6f3ec',s:'height 0.11'},{n:'C',e:'Ceiling',m:'Matt white paint, recessed downlights',c:'#f8f6f1',s:c.w+' x '+c.d},{n:'F',e:'Floor',m:(FT[c.ft==='plan'?'plain':c.ft]||'Floor covering')+(c.ft==='tile'||c.ft==='plain'?', satin':', matte'),c:c.floor,s:c.w+' x '+c.d});
const G={};its.forEach(a=>{const o=a.o,col=okc(o.c)?o.c:'#888888',k=[o.k,col,o.a||'',o.f||0].join();if(G[k]){G[k].n.push(a.n);G[k].q++;return}const kind=zMK[nm(o)]||'plain';G[k]={n:[a.n],q:1,e:nm(o),m:(nm(o)==='Window'?'Painted timber frame, clear glazing':(MAT[kind]||'Painted finish'))+', '+FN[o.f||0].toLowerCase()+(o.a&&okc(o.a)?'. Details '+o.a.toUpperCase():''),c:col,s:dims(o)}});
Object.values(G).forEach(g=>{g.e+=g.q>1?' x'+g.q:'';r.push(g)});return r}
const jsp=()=>window.jspdf?Promise.resolve():new Promise((ok,no)=>{const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';s.onload=ok;s.onerror=no;document.head.appendChild(s)});
async function report(){const bt=box.querySelector('#ixready');if(!bt||bt.dataset.busy==='1'||PL.room<0||!DD())return;bt.dataset.busy='1';const c=DD().cfg,rm=RM[PL.room],t0=bt.textContent;bt.disabled=true;bt.textContent='Preparing your 3 A4 pages...';
try{await jsp();await new Promise(r=>setTimeout(r,40));const its=DD().items.map((o,i)=>({o,n:i+1})),S=shots(),M=await marks(S,its,c),RW=rows(its,c),pg=[[],[],[]],md=new jspdf.jsPDF({unit:'mm',format:'a4'});let cp=0;
const A=o=>pg[cp].push(o),R=(x,y,w,h,f,s)=>A(['r',x,y,w,h,f,s]),T=(t,x,y,z,col,b,al)=>A(['t',t,x,y,z,col||NV,b,al||'left']),I=(u,x,y,w,h)=>A(['i',u,x,y,w,h]),L=(x1,y1,x2,y2,col,w)=>A(['l',x1,y1,x2,y2,col,w||.2]);
const wr=(t,w,z,b)=>{md.setFont('helvetica',b?'bold':'normal');md.setFontSize(z);return md.splitTextToSize(String(t),w)},TL=(ls,x,y,lh,z,col,b)=>ls.forEach((l,i)=>T(l,x,y+i*lh,z,col,b));
const hdr=()=>{R(0,0,210,22,BL);T('YOUR SPACE IS READY',10,10,15,'#fff',1);T(rm[0]+'  |  '+c.w+' x '+c.d+' x '+c.h+' m  |  '+(c.w*c.d).toFixed(1)+' sq m floor',10,17,8.5,'#e6ecff');T('LAY C  |  Interior design',200,10,8.5,'#fff',1,'right');T(new Date().toLocaleDateString('en-GB'),200,17,8.5,'#e6ecff',0,'right');T('Page '+(cp+1)+' of 3',10,292,6.5,MU);T('Colour codes are sRGB hex values from your 3D design. Ask for a physical sample before ordering.',200,292,6.5,MU,0,'right')},
sec=(n,t,y)=>{R(10,y-4.2,5.6,5.6,BL);T(n,12.8,y,8,'#fff',1,'center');T(t,18,y,9.5,NV,1);L(10,y+1.8,200,y+1.8,'#c9d3f3',.2)};
hdr();sec('1','PLAN',30);const pr=S.plan.W/S.plan.H,pw=Math.min(112,76*pr),ph=pw/pr;I(M.plan,10,34,pw,ph);R(10,34,pw,ph,null,'#9aa9e0');
const rx=10+pw+6,rw=200-rx;T('Space details',rx,37,8,NV,1);
[['Room',rm[0]],['Floor area',(c.w*c.d).toFixed(1)+' sq m'],['Size',c.w+' x '+c.d+' x '+c.h+' m'],['Volume',(c.w*c.d*c.h).toFixed(1)+' cu m'],['Floor',FT[c.ft==='plan'?'plain':c.ft]||'Floor covering'],['Lighting',(c.light<.3?'Daylight':c.light<.7?'Evening':'Night')+' preset'],['Pieces placed',String(its.length)]].forEach((d,i)=>{T(d[0],rx,42+i*4.6,7,MU);TL(wr(d[1],rw-22,7,1).slice(0,1),rx+22,42+i*4.6,3,7,NV,1)});
T('Annotations',rx,80,8,NV,1);const PA=[].concat(wr('Plan view, looking straight down. Width '+c.w+' m (bottom line), depth '+c.d+' m (right line).',rw,7),wr('W1 back wall (top), W2 front wall (bottom), W3 left wall, W4 right wall, F floor.',rw,7),wr('Numbered circles show where each piece stands. Windows and doors sit on the wall shown. Materials and colours are on page 3.',rw,7));TL(PA,rx,85,3.1,7,'#1b2f7a');
const sy=Math.max(34+ph,85+PA.length*3.1)+8;sec('2','SECTIONS: THE FOUR WALLS',sy+2);
M.w.forEach((v,i)=>{const x=i%2?107:10,y=sy+7+Math.floor(i/2)*66,r4=RW[i];I(v.u,x,y,93,52);R(x,y,93,52,null,'#9aa9e0');T(v.id+' '+v.t+'  ('+S.w[i].len+' x '+c.h+' m)',x,y+56,7.4,NV,1);TL(wr((r4?cname(r4.c)+' '+r4.c.toUpperCase()+'. ':'')+'On this wall: '+(v.hit.map(a=>a.n+' '+nm(a.o)).join(', ')||'no furniture'),93,6.6).slice(0,2),x,y+60,2.9,6.6,'#1b2f7a')});
cp=1;hdr();sec('3','3D VIEWS',30);sec('4','STANDING INSIDE THE SPACE',150);
M.v.forEach((v,i)=>{const y=(i<2?35:155)+(i%2)*56,cam=S.v[i].cam.position,fv=Math.round(S.v[i].cam.fov);I(v.u,10,y,78,52);R(10,y,78,52,null,'#9aa9e0');T('View '+v.id,94,y+4,8.5,NV,1);TL(wr(v.t,106,7.6,1).slice(0,2),94,y+9,3.3,7.6,NV,1);
TL(wr('Camera '+cam.y.toFixed(1)+' m above the floor, '+fv+' degree lens. '+(i<2?'The walls nearest the camera fade so you can see in.':'Eye-level view, as if you were standing there.'),106,6.8).slice(0,4),94,y+17,3,6.8,'#1b2f7a');
TL(wr('Shows: '+(v.hit.map(a=>a.n+' '+nm(a.o)).join(', ')||'walls, floor and ceiling'),106,6.8).slice(0,6),94,y+30,3,6.8,'#1b2f7a')});
T('Numbered circles on the pictures match the numbers on page 1 and the Code column on page 3.',10,277,7,MU);
cp=2;hdr();sec('5','MATERIALS AND COLOURS',30);const X=[10,24,58,112,150,176];R(10,34,190,6,BL);['#','Element','Material and finish','Colour','Code','Size (m)'].forEach((t,i)=>T(t,X[i]+(i?0:2),38.2,7,'#fff',1));
const RH=7.6,mx=Math.floor((247-40)/RH);let rr=RW;if(rr.length>mx){rr=RW.slice(0,mx-1);rr.push({n:'',e:'+ '+(RW.length-mx+1)+' more',m:'Smaller items are in your design file',c:null,s:''})}
let y=40;rr.forEach((r,i)=>{if(i%2)R(10,y,190,RH,'#f3f6ff');const nn=Array.isArray(r.n)?(r.n.length>3?r.n[0]+'-'+r.n[r.n.length-1]:r.n.join(',')):r.n;T(nn,12,y+4.7,7.5,NV,1);TL(wr(r.e,32,7.2,1).slice(0,2),X[1],y+3.4,2.9,7.2,NV,1);TL(wr(r.m,52,6.6).slice(0,2),X[2],y+3.4,2.9,6.6,'#1b2f7a');
if(r.c){R(X[3],y+1.3,5,5,r.c,'#8a96c8');T(cname(r.c),X[3]+7,y+4.7,7.2,NV);T(r.c.toUpperCase(),X[4],y+3.6,7.5,NV,1);T('RGB '+h2r(r.c).join(' '),X[4],y+6.6,5.8,MU)}T(r.s,X[5],y+4.7,6.6,'#1b2f7a');L(10,y+RH,200,y+RH,'#d5ddf6',.15);y+=RH});
const ws=[...new Set(RW.slice(0,4).map(r=>r.c.toUpperCase()))],lt=c.light<.3?'daylight':c.light<.7?'evening':'night';y+=5;R(10,y,190,Math.min(40,287-y),'#f3f6ff','#c9d3f3');T('Annotations',14,y+5.5,8,NV,1);
TL([].concat(wr('A. Walls: '+(ws.length===1?'all four walls share '+cname(ws[0])+' ('+ws[0]+').':'the walls use '+ws.length+' colours: '+RW.slice(0,4).map(r=>r.n+' '+cname(r.c)+' '+r.c.toUpperCase()).join(', ')+'.'),180,7),wr('B. Floor: '+RW[6].m+', '+cname(c.floor)+' '+c.floor.toUpperCase()+'. Skirting and ceiling are kept off-white so the wall colours lead.',180,7),wr('C. Finish key: Matte = no sheen, Satin = soft sheen, Glossy = mirror-like, Metallic = brushed metal look. Sizes are width x depth x height.',180,7),wr('D. Numbers in the Code column match the circles on page 1. The 3D preview was set to '+lt+' lighting.',180,7)),14,y+10.5,3.2,7,'#1b2f7a');
const IM={};await Promise.all([M.plan,...M.v.map(v=>v.u),...M.w.map(v=>v.u)].map(u=>new Promise(r=>{const im=new Image();im.onload=r;im.src=u;IM[u]=im})));
const cvs=pg.map(p=>{const k=5,cv=document.createElement('canvas');cv.width=210*k;cv.height=297*k;const x=cv.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,cv.width,cv.height);p.forEach(o=>{const t=o[0];if(t==='r'){if(o[5]){x.fillStyle=o[5];x.fillRect(o[1]*k,o[2]*k,o[3]*k,o[4]*k)}if(o[6]){x.strokeStyle=o[6];x.lineWidth=.25*k;x.strokeRect(o[1]*k,o[2]*k,o[3]*k,o[4]*k)}}else if(t==='t'){x.font=(o[6]?'700 ':'400 ')+o[4]*.3528*k+'px '+FNT;x.fillStyle=o[5];x.textAlign=o[7]==='center'?'center':o[7]==='right'?'right':'left';x.textBaseline='alphabetic';x.fillText(o[1],o[2]*k,o[3]*k)}else if(t==='i')x.drawImage(IM[o[1]],o[2]*k,o[3]*k,o[4]*k,o[5]*k);else{x.strokeStyle=o[5];x.lineWidth=o[6]*k;x.beginPath();x.moveTo(o[1]*k,o[2]*k);x.lineTo(o[3]*k,o[4]*k);x.stroke()}});return cv});
const toPdf=()=>{const d=new jspdf.jsPDF({unit:'mm',format:'a4',compress:true});pg.forEach((p,i)=>{if(i)d.addPage();p.forEach(o=>{const t=o[0];if(t==='r'){if(o[5])d.setFillColor(o[5]);if(o[6]){d.setDrawColor(o[6]);d.setLineWidth(.25)}d.rect(o[1],o[2],o[3],o[4],o[5]&&o[6]?'FD':o[5]?'F':'S')}else if(t==='t'){d.setFont('helvetica',o[6]?'bold':'normal');d.setFontSize(o[4]);d.setTextColor(o[5]);d.text(o[1],o[2],o[3],{align:o[7]})}else if(t==='i')d.addImage(o[1],'JPEG',o[2],o[3],o[4],o[5]);else{d.setDrawColor(o[5]);d.setLineWidth(o[6]);d.line(o[1],o[2],o[3],o[4])}})});return d.output('blob')};
const old=app.querySelector('#ixrep');if(old)old.remove();const ov=document.createElement('div');ov.id='ixrep';ov.style.cssText='position:absolute;inset:0;z-index:95;background:#2b3a78;display:flex;flex-direction:column';
ov.innerHTML='<div style="display:flex;gap:8px;align-items:center;padding:10px 14px;background:#fff;border-bottom:1px solid var(--line)"><b style="margin-right:auto;font-size:13px">Your space | A4 PDF | 3 pages | 9 views</b><button type="button" class="tbtn" id="ixrp">Print</button><button type="button" class="tbtn" id="ixrd">Save as PDF</button><button type="button" class="tbtn" id="ixrx">Close</button></div><p id="ixrm" style="margin:0;padding:0 14px;background:#fff;font-size:11px;color:var(--mut)"></p><div style="flex:1;overflow:auto;padding:16px;display:flex;flex-direction:column;align-items:center;gap:16px"></div>';
const bx=ov.lastChild;cvs.forEach(cv=>{cv.style.cssText='width:min(100%,794px);height:auto;background:#fff;box-shadow:0 8px 30px rgba(0,0,0,.35)';bx.appendChild(cv)});app.appendChild(ov);const mg=ov.querySelector('#ixrm');
ov.querySelector('#ixrx').onclick=()=>ov.remove();const fn='your-space-'+(String(rm[0]).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'design')+'.pdf';
ov.querySelector('#ixrd').onclick=async()=>{try{const blob=toPdf();let dw=null;try{dw=window.claude&&window.claude.use?await window.claude.use('downloads'):null}catch(e){dw=null}
if(dw)await dw.save({filename:fn,data:blob});else{const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=fn;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},4000)}mg.textContent='PDF saved.'}catch(e){mg.textContent=e&&e.code==='declined'?'Download cancelled.':'Could not save the PDF here. Try Print instead.'}};
ov.querySelector('#ixrp').onclick=()=>{try{const old=document.getElementById('ixprint');if(old)old.remove();const pa=document.createElement('div');pa.id='ixprint';cvs.forEach(cv=>{const im=new Image();im.src=cv.toDataURL('image/jpeg',.92);pa.appendChild(im)});
let st=document.getElementById('ixprintcss');if(!st){st=document.createElement('style');st.id='ixprintcss';st.textContent='#ixprint{display:none}@media print{html,body{height:auto!important;overflow:visible!important;background:#fff!important}body>*:not(#ixprint){display:none!important}#ixprint{display:block!important}#ixprint img{display:block;width:210mm;height:297mm;break-after:page;page-break-after:always}@page{size:A4;margin:0}}';document.head.appendChild(st)}
document.body.appendChild(pa);window.addEventListener('afterprint',()=>pa.remove(),{once:true});window.print();mg.textContent='If no print window opened, press Save as PDF and print the saved file.'}catch(e){mg.textContent='Printing is not available here. Press Save as PDF and print the saved file.'}};
}catch(e){bt.textContent=(e&&e.message)||'Could not build the sheets. Check your connection and try again.';setTimeout(()=>{bt.textContent=t0},3500);bt.disabled=false;bt.dataset.busy='';return}bt.disabled=false;bt.dataset.busy='';bt.textContent=t0}
ixRP.sig=c=>c.wall+'|'+(c.wc||[]).join(',');ixRP.chk=()=>{if(!box||PL.room<0||!DD())return;const c=DD().cfg;if(c.wsig&&c.wsig!==ixRP.sig(c))ixRP.wdone()};setInterval(()=>{try{ixRP.chk()}catch(e){}},500);ixRP.go=report}

const ixKeep={};
const _s2=show;show=function(i){const prev=cur>=0&&SV[cur]&&SV[cur].slug;if(prev==='interior-design'||prev==='interior-execution')ixKeep[prev]={ans:ans.map(function(a){return a.slice()}),oth:oth.slice()};const slug=SV[i]&&SV[i].slug,g=slug==='interior-design';kill();if(g){PL.room=-1;PL.sel=-1;box=null}_s2(i);const keep=(slug==='interior-design'||slug==='interior-execution')&&ixKeep[slug];if(keep){ans=keep.ans.map(function(a){return a.slice()});oth=keep.oth.slice();ans.forEach(function(a,j){a.forEach(function(k){const inp=pg.querySelector('input[name="q'+j+'"][value="'+k+'"]');if(inp)inp.checked=true})});oth.forEach(function(v,j){const ot=pg.querySelector('.ot[data-j="'+j+'"]');if(ot&&v){ot.value=v;ot.hidden=false}})}if(g){mount();calc()}else if(keep)calc();if(slug==='interior-design'){const hd=pg.querySelector('.hd');if(hd&&!pg.querySelector('#ixguide')){const el=document.createElement('aside');el.id='ixguide';el.className='ixguide';el.innerHTML='<b>Interior design guideline</b><ol><li>Name the room by how people use it, then measure length, width and ceiling height.</li><li>Keep a clear path of about 90 cm through halls and 75 cm around a dining table.</li><li>Leave 40 to 60 cm of free space in front of cabinets, desks and the bed.</li><li>Put the brightest light where people sit or work, and a softer light for the rest of the room.</li><li>Choose one main colour and one wood or metal finish, then repeat them so the room feels calm.</li><li>Note doors, windows and columns before placing furniture in the 3D plan.</li><li>Send photos of the empty room with this request so the plan matches the real space.</li></ol>';hd.after(el)}}};
const _cx=calc;calc=function(){_cx();const s=SV[cur];if(!s||s.slug!=='interior-design')return;const sm=$('#sum');if(!sm)return;let h='',t='';
Object.keys(D).forEach(r=>{const S=stats(r);if(!S.n)return;const dd=D[r],cnt={};dd.items.forEach(o=>{if(!o.fr){const n=F[o.k][0];cnt[n]=(cnt[n]||0)+1}});const lst=Object.keys(cnt).map(n=>n+(cnt[n]>1?' x'+cnt[n]:'')).join(', '),c=dd.cfg;
h+='<div class="r"><span>'+esc(RM[r][0])+': '+esc(lst)+'<small>3D design ('+S.n+' pieces)</small></span><b>'+star(S.stars)+'</b></div>';t+='\n3D room: '+RM[r][0]+' '+c.w+' x '+c.d+' x '+c.h+' m, walls '+c.wall+', floor '+c.ft+' '+c.floor+'. Pieces: '+lst+'. Rating '+S.stars+'/5, '+fm(S.cost)+' of '+fm(S.b)+' game coins'});
const tot=sm.querySelector('.tot');if(tot)tot.insertAdjacentHTML('beforebegin',h);txtOut+=t}}
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
    MAN_WH = 564 / 1417,
    ST_ON = 1;
  const manTex = new THREE.TextureLoader().load("man.png?v=sin");
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
  man.scale.set(MAN_H * MAN_WH, MAN_H, 1);
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
    new THREE.PlaneGeometry(MAN_H * MAN_WH, MAN_H),
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
  const manShade = new THREE.Mesh(
    new THREE.PlaneGeometry(MAN_H * MAN_WH, MAN_H),
    new THREE.MeshBasicMaterial({
      map: manTex,
      color: 0x000000,
      transparent: true,
      opacity: 0.42,
      alphaTest: 0.2,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  manShade.rotation.order = "YXZ";
  manShade.visible = false;
  manShade.renderOrder = 2;
  walk.add(manShade);
  man.material.depthWrite = false;
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
      MAN_H * MAN_WH * wk.fl,
      MAN_H * (1 + (calm ? 0 : Math.sin(wk.t * 1.8) * 0.007)),
      1,
    );
    caster.scale.x = wk.fl;
    const gx = cam.position.x - walk.position.x,
      gz = cam.position.z - walk.position.z,
      gy = cam.position.y - walk.position.y,
      steep = gy > Math.hypot(gx, gz) * 1.8;
    man.material.depthTest = !steep;
    man.renderOrder = steep ? 12 : 0;
    caster.castShadow = !steep;
    manShade.visible = steep;
    if (steep) {
      const llen = Math.hypot(key.position.x, key.position.z) || 1,
        sc = walk.scale.y || 1;
      manShade.position.set(
        ((-key.position.x / llen) * 0.72) / sc,
        (-0.4 - walk.position.y) / sc,
        ((-key.position.z / llen) * 0.72) / sc,
      );
      manShade.rotation.y = Math.atan2(gx, gz);
      manShade.rotation.x = -Math.PI / 2;
      manShade.scale.x = wk.fl;
    }
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
    if (mailDoor) {
      mailOpenNow += (mailOpenTarget - mailOpenNow) * Math.min(1, dt * 4);
      applyMail(mailOpenNow);
    }
    if (phoneDoor) {
      phoneOpenNow += (phoneOpenTarget - phoneOpenNow) * Math.min(1, dt * 4);
      applyPhone(phoneOpenNow);
    }
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
        b: "The mailbox on the back-left corner of the base holds customer reviews. It stays open until you leave a review, then it closes. Anyone who has not reviewed still sees it open. Tap it to rate us with watermelons and write a few words.",
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
        b: "Sign in, then press the camera key. The photo is saved in your album. The share icon publishes that album, and it cannot be made private again.",
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
