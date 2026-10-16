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
    STEP = (72 * Math.PI) / 180;
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
    g.add(dome, cuff, pom);
    return { g, mat, pm, pom, parts: [dome, cuff] };
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
    { name: "Pom-pom", out: "finish", desc: "A fluffy pom-pom is wound, trimmed and sewn on top." },
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
        txt(c, d.name.toUpperCase(), 100, 48, 34, "#d7d9d7", 600);
      }),
    );
    ST.push({ ...d, g, gm, i, base: new THREE.Vector3(px, 0.24, pz) });
  });
  const [sO, sK, sD, sP, sC] = ST.map((s) => s.g);
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
  mini.parts.forEach((p) => (p.castShadow = false));
  hang.add(mini.g);
  // Pom-pom
  box(sP, 1.7, 0.55, 1.3, 0, 0.54, 0, M.body);
  box(sP, 1.8, 0.06, 1.4, 0, 0.85, 0, M.ivory);
  cyl(sP, 0.06, 0.9, -0.45, 1.35, -0.2, M.chrome);
  const spinPom = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.34, 2),
    m(GRAY, 0, 0.95, { flatShading: true }),
  );
  spinPom.position.set(-0.45, 1.3, 0.2);
  spinPom.castShadow = true;
  sP.add(spinPom);
  const cutter = new THREE.Group();
  cutter.position.set(0.45, 1.1, 0.1);
  sP.add(cutter);
  cyl(cutter, 0.4, 0.03, 0, 0, 0, M.chrome);
  cyl(cutter, 0.1, 0.08, 0, 0, 0, M.dark);
  [
    [0.6, 0.96, -0.4],
    [0.35, 0.96, -0.45],
    [0.55, 0.96, -0.1],
  ].forEach((p) => {
    const o = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.12, 1),
      m(GRAY, 0, 0.95, { flatShading: true }),
    );
    o.position.set(...p);
    o.castShadow = true;
    sP.add(o);
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
    P.push({ g, b, slip, tag, halo, s: -1, ph: 0, d: 0 });
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
    ["Sewing on the pom-pom", "Pom-pom · fluffy finishing"],
    ["Payment received", "Checkout · tag on, coin in"],
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
    mobile = w <= 900;
    R.setSize(w, h);
    cam.aspect = w / h;
    cam.setViewOffset(w, h, 0, h * 0.05, w, h);
    const th = 2 * Math.tan((cam.fov * Math.PI) / 360);
    baseD = Math.max(13.5 / (th * cam.aspect * 0.92), 10.5 / (th * 0.7));
    ctrl.maxDistance = Math.max(55, baseD * 1.6);
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
    $("#st").textContent = playing ? "Machine running" : "Machine paused";
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
    const h = rc.intersectObjects(
      ST.map((s) => s.g),
      true,
    );
    return h.length ? h[0].object.userData.st : -1;
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
    R.domElement.style.cursor = i >= 0 || i === -2 ? "pointer" : "grab";
    tip.classList.toggle("v", i >= 0);
    if (i >= 0) {
      tip.querySelector("b").innerHTML = "<span>0" + (i + 1) + "</span>" + ST[i].name;
      tip.querySelector("p").textContent = ST[i].desc;
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
    if (i >= 0) focus(i);
    else if (i === -2) gOpen(-1);
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
      pick: [5, 6],
      s: "Choose what you would like to book.",
      q: [],
    },
    {
      n: "Book a shoot",
      slug: "photo-shoot",
      par: 4,
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
      par: 4,
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
  SV.push(Object.assign({}, SV[2], { slug: "seniors-uniform", par: 2 }), {
    n: "Rooms",
    slug: "seniors-rooms",
    par: 2,
    s: "Enter the 6 digit password you got at checkout on the Seniors uniform page to open your class order sheet.",
    q: [],
  });
  SV[2].pick = [7, 8];
  SV[2].s = "Choose what you would like to open.";

  const pg = $("#page"),
    pins = $("#pins");
  let cur = -1,
    ans = [],
    oth = [],
    det = {},
    txtOut = "",
    quotePack = { title: "", rows: [], total: "", extra: "" },
    hrs = 2;
  const esc = (x) =>
    String(x).replace(
      /[&<>"]/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
    );
  const pinB = SV.slice(0, 5).map((s, i) => {
    const b = document.createElement("button");
    b.className = "pin";
    b.innerHTML = "<i>0" + (i + 1) + "</i>" + s.n;
    b.onclick = () => go(i);
    pins.appendChild(b);
    return b;
  });
  const pv = new THREE.Vector3();
  function pinUpdate() {
    const aw = W(),
      ah = H();
    pinB.forEach((b, i) => {
      pv.copy(ST[i].g.position);
      pv.y += 4.2;
      pv.project(cam);
      let x = (pv.x * 0.5 + 0.5) * aw,
        y = (-pv.y * 0.5 + 0.5) * ah;
      x = Math.max(70, Math.min(aw - 70, x));
      y = Math.max(80, Math.min(ah - 190, y));
      b.style.transform = "translate(" + x + "px," + y + "px) translate(-50%,-100%)";
    });
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
  function accOk() {
    const a = accGet();
    return Boolean(a && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a.email || ""));
  }
  function seniorsOpen() {
    return cur >= 0 && SV[cur] && String(SV[cur].slug).indexOf("seniors") === 0;
  }
  function paintAcc() {
    const a = accGet();
    const label = a && a.email ? a.email : "Your details";
    const btn = $("#accbtn");
    if (btn) btn.textContent = label;
    const bar = pg.querySelector("#accbar");
    if (bar) bar.textContent = label;
    const out = $("#accout");
    if (out) out.hidden = !a;
    syncAccPanel();
  }
  function syncAccPanel() {
    const box = $("#account");
    const btn = $("#accbtn");
    if (seniorsOpen()) {
      if (box) box.hidden = true;
      if (btn) btn.hidden = true;
      return;
    }
    if (btn) btn.hidden = false;
    const tab = $("#tabf");
    const full = Boolean(tab && tab.classList.contains("on") && tab.classList.contains("full"));
    if (full) {
      if (box) box.hidden = true;
      return;
    }
    if (box) box.hidden = false;
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
  function openAcc(then) {
    pendingQuote = then || null;
    fillAccForm();
    const err = $("#accerr");
    if (err) {
      err.hidden = true;
      err.textContent = "";
    }
    paintAcc();
    const box = $("#account");
    if (box) box.hidden = false;
    const em = $("#accemail");
    if (em) em.focus();
  }
  function closeAcc() {
    const tab = $("#tabf");
    if (tab && tab.classList.contains("full")) {
      const box = $("#account");
      if (box) box.hidden = true;
    }
  }
  function barHTML() {
    const a = accGet();
    const seniors = seniorsOpen();
    return (
      '<div class="wrap"><div class="bar"><button class="back" id="back">&larr; Back to the machine</button><div class="bar-r">' +
      (seniors
        ? ""
        : '<button class="acc" id="accbar" type="button">' +
          (a && a.email ? a.email : "Your details") +
          "</button>") +
      '<button class="ask" id="askg" type="button"><span class="av" aria-hidden="true"></span>Ask the guide</button></div></div>'
    );
  }
  function customerBlock(acc) {
    const a = acc || {};
    const email = (a.email || "").trim();
    const who = [a.name, a.phone].map((v) => String(v || "").trim()).filter(Boolean).join(" · ");
    const lines = [];
    if (who) lines.push("Customer: " + who);
    if (email) lines.push("Email: " + email);
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
  function show(i) {
    cur = i;
    const s = SV[i];
    ans = s.q.map(() => []);
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
        " / 05</span><h1>" +
        s.n +
        "</h1><p>" +
        s.s +
        '</p></div><div class="wins">' +
        s.pick
          .map(
            (k) =>
              '<button class="win" data-i="' +
              k +
              '"><span class="wt">' +
              SV[k].n +
              '</span><span class="wd">' +
              SV[k].s +
              '</span><span class="wg">Open &rarr;</span></button>',
          )
          .join("") +
        "</div></div>";
      pg.style.display = "block";
      pg.scrollTop = 0;
      tip.classList.remove("v");
      pg.querySelector(".win").focus({ preventScroll: true });
      syncAccPanel();
      return;
    }
    pg.innerHTML =
      barHTML() +
      '<div class="hd"><span>0' +
      ((s.par != null ? s.par : i) + 1) +
      " / 05</span><h1>" +
      s.n +
      "</h1><p>" +
      s.s +
      '</p></div><div class="cols"><div>' +
      s.q
        .map((q, j) =>
          q.h
            ? stepHTML(q, j)
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
    calc();
    pg.querySelector("input,.sb").focus({ preventScroll: true });
    syncAccPanel();
  }
  function hide() {
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
  // FLOATING TABLET. The five station pages open in a floating tablet that flies out of the pin; Zoom expands it to a full display.
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
    if (!was) setFull(false);
    _show(i);
    const s = SV[i],
      n = s.par != null ? s.par : i;
    tbt.textContent = (n < 5 ? "0" + (n + 1) + " / 05 \u00b7 " : "") + s.n;
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
    const w = e.target.closest(".win[data-i]");
    if (w) {
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
  if ($("#accbtn")) $("#accbtn").addEventListener("click", () => openAcc());
  if ($("#accx")) $("#accx").addEventListener("click", closeAcc);
  if ($("#accout"))
    $("#accout").addEventListener("click", () => {
      accSet(null);
      fillAccForm();
      syncAccPanel();
    });
  if (accForm)
    accForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const err = $("#accerr");
      const body = {
        customer_name: ($("#accname") && $("#accname").value.trim()) || "",
        customer_email: ($("#accemail") && $("#accemail").value.trim()) || "",
        customer_phone: ($("#accphone") && $("#accphone").value.trim()) || "",
      };
      if (err) {
        err.hidden = true;
        err.textContent = "";
      }
      try {
        const res = await fetch("/api/account", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) throw new Error(data.error || "Could not save your email.");
        accSet({
          name: data.customer_name || body.customer_name,
          email: data.customer_email || body.customer_email,
          phone: data.customer_phone || body.customer_phone,
        });
        if (err) {
          err.hidden = false;
          err.textContent = "Saved.";
        }
        const next = pendingQuote;
        pendingQuote = null;
        if (next) next();
      } catch (ex) {
        if (err) {
          err.hidden = false;
          err.textContent = (ex && ex.message) || "Could not save your email.";
        }
      }
    });
  paintAcc();

  // ROOMS. Checkout makes a 6 digit password. Each password opens its own sheet where students pick sizes, write name and phone and quantities. Totals and the 50% deposit are automatic.
  const RS = ["XS", "S", "M", "L", "XL", "XXL", "3XL"],
    rstore = { db: null },
    rkey = (c) => "lcroom" + c;
  (async () => {
    try {
      rstore.db = await window.claude.use("db");
    } catch (e) {}
  })();
  async function rGet(c) {
    try {
      return JSON.parse(localStorage.getItem(rkey(c)));
    } catch (e) {}
    try {
      if (rstore.db) {
        const d = await rstore.db.doc("rooms/" + c).get();
        return d.exists ? d.data() : null;
      }
    } catch (e) {}
    return null;
  }
  async function rPut(c, d) {
    try {
      if (rstore.db) {
        await rstore.db.doc("rooms/" + c).set(d);
        return;
      }
    } catch (e) {}
    try {
      localStorage.setItem(rkey(c), JSON.stringify(d));
    } catch (e) {}
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
        let c,
          n = 0;
        do {
          c = String(Math.floor(100000 + Math.random() * 900000));
          n++;
        } while (n < 20 && (await rGet(c)));
        await rPut(c, { items: it, rows: [] });
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
            '</b><p class="m">Give this password to your class. Each student opens the sheet from the Rooms page, picks sizes, writes a name and phone number and the quantity of each item. Payment and the 50% deposit are calculated automatically. Items with a price range use the lowest price until we confirm it.</p><button id="ropen" data-c="' +
            c +
            '">Open the sheet</button>';
          out.appendChild(box);
        }
      }
    } catch (e) {}
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
    doc.text("LAY C Factory", x, y);
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
    return new File([blob], "LAY-C-quote.pdf", { type: "application/pdf" });
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
    a.download = file.name || "LAY-C-quote.pdf";
    a.setAttribute("aria-label", "Download order PDF");
  }
  async function sendQuoteEmail(fields, file, toEmail) {
    const svc = SV[cur] && SV[cur].n ? SV[cur].n : "LAY C";
    const acc = accGet() || {};
    const client = (acc.email || "").trim();
    const details = [acc.name, acc.phone, client].filter(Boolean).join(" · ");
    const textParams = {
      to_email: toEmail || "eyadellithy80@gmail.com",
      service: svc,
      order_summary: fields.order_summary,
      products: fields.products,
      quantities: fields.quantities,
      total_price: fields.total_price,
      customer_details: details || svc,
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
    const w = pg.querySelector('.win[data-i="8"]');
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
      roomSheet(n.value.trim());
    };
    ["click", "input", "change", "keydown"].forEach((v) =>
      d.addEventListener(v, (e) => {
        e.stopPropagation();
        if (v === "click" && e.target.id === "pwgo") go1();
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
    const r = await rGet(c);
    if (!r) {
      const e = pg.querySelector("#pwerr");
      if (e) e.hidden = false;
      return;
    }
    const it = r.items,
      N = it.length;
    let rows = (r.rows || []).map((x) => ({
        ...x,
        l: x.l.map((l) => ({ ...l, q: Math.max(1, Math.floor(+l.q || 1)) })),
      })),
      t = 0;
    const blank = () => ({ n: "", p: "", l: it.map(() => ({ s: "M", q: 1 })) });
    if (!rows.length) rows = [blank()];
    pg.innerHTML =
      '<div class="wrap"><div class="bar"><button class="back" id="rback">&larr; Back</button></div><div class="hd"><span>ROOM ' +
      c +
      '</span><h1>Class order sheet</h1><p>Write your name and phone, choose a size and the quantity of each item. The minimum is 1 of each item. Your total and 50% deposit are calculated automatically.</p></div><div id="shx"><div class="shw"><table class="sht"><thead><tr><th>#</th><th>Name</th><th>Phone</th>' +
      it.map((x) => "<th>" + esc(x.n) + "<small>" + money(x.p) + "</small></th>").join("") +
      '<th>Full payment</th><th>Deposit 50%</th><th>Balance</th><th></th></tr></thead><tbody></tbody><tfoot><tr><td colspan="' +
      (3 + N) +
      '">All customers</td><td id="tf"></td><td id="td"></td><td id="tb"></td><td></td></tr></tfoot></table></div><div class="shb"><button id="radd" type="button">+ Add customer</button><button id="rdl" type="button">Download for Excel</button></div></div></div>';
    const tb = pg.querySelector("tbody"),
      sx = pg.querySelector("#shx");
    let tm;
    const rt = (x) => x.l.reduce((a, l, k) => a + (+l.q || 0) * it[k].p, 0);
    const save = () => {
      clearTimeout(tm);
      tm = setTimeout(() => rPut(c, { items: it, rows }), 400);
    };
    const sums = () => {
      let f = 0;
      rows.forEach((x, i) => {
        const v = rt(x),
          tr = tb.children[i];
        f += v;
        tr.querySelector(".tf").textContent = money(v);
        tr.querySelector(".td").textContent = money(v / 2);
        tr.querySelector(".tbl").textContent = money(v / 2);
      });
      pg.querySelector("#tf").textContent = money(f);
      pg.querySelector("#td").textContent = money(f / 2);
      pg.querySelector("#tb").textContent = money(f / 2);
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
            '<td class="tf"></td><td class="td"></td><td class="tbl"></td><td><button type="button" class="rx" data-del="' +
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
      } else if (t.id === "rdl") {
        const q = (v) => '"' + String(v).replace(/"/g, '""') + '"',
          h = [
            "Name",
            "Phone",
            ...it.map((x) => x.n + " size"),
            ...it.map((x) => x.n + " qty"),
            "Full payment",
            "Deposit 50%",
            "Balance",
          ],
          L = [h.map(q).join(",")];
        rows.forEach((x) => {
          const v = rt(x);
          L.push(
            [x.n, x.p, ...x.l.map((l) => l.s), ...x.l.map((l) => l.q), v, v / 2, v / 2]
              .map(q)
              .join(","),
          );
        });
        const tt = rows.reduce((a, x) => a + rt(x), 0);
        L.push(
          ["TOTAL", "", ...it.map(() => ""), ...it.map(() => ""), tt, tt / 2, tt / 2]
            .map(q)
            .join(","),
        );
        (async () => {
          try {
            const d = await window.claude.use("downloads");
            if (d)
              await d.save({ filename: "room-" + c + ".csv", data: "\ufeff" + L.join("\r\n") });
          } catch (x) {}
        })();
      }
    });
    pg.querySelector("#rback").onclick = (e) => {
      e.stopPropagation();
      go(2);
    };
    draw();
    pg.scrollTop = 0;
  }
  pg.addEventListener("click", (e) => {
    const t = e.target;
    if (t.id === "ropen") roomSheet(t.dataset.c);
    else if (t.id === "pwgo") roomSheet(pg.querySelector("#pwin").value.trim());
  });
  pg.addEventListener("keydown", (e) => {
    if (e.target.id === "pwin" && e.key === "Enter") roomSheet(e.target.value.trim());
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
      `Seniors uniform is for graduating classes. Every student also gets a free hat. You choose what each student receives (for example a T-shirt at ${pr(2, 0, 0)} or a hoodie at ${pr(2, 0, 3)}), add personal touches like a printed name, and tell us how many students there are. Prices are per student.\nHow many students are in the class?`,
      {
        acts: [["Open the seniors quote", 7]],
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
    const pack = nv(2, 0, 0) + nv(2, 0, 3) + nv(2, 1, 0);
    say(
      tx +
        `\nA simple starter pack: a T-shirt, a hoodie and a printed name comes to ${money(pack)} per student before the discount, plus the free hat.`,
      {
        acts: [["Open the seniors quote", 7]],
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
      `Name printed is ${pr(2, 1, 0)} per student, Name embroidered is ${pr(2, 1, 1)}, and a Metal piece is ${pr(2, 1, 2)}. Embroidery looks more premium, and printing is the cheaper choice.`,
      {
        acts: [["Open the seniors quote", 7]],
        chips: [["Jerseys and jackets?", fJJ], ["How fast can it be ready?", fRush], ELSE],
      },
    );
  }
  function fJJ() {
    say(
      `Jerseys are ${pr(2, 0, 2)} and jackets are ${pr(2, 0, 9)} per student. The exact price inside that range depends on the style, and we confirm it after we review your order.`,
      {
        acts: [["Open the seniors quote", 7]],
        chips: [["What are the personal touches?", fTouch], ELSE],
      },
    );
  }
  function fRush() {
    say("Standard delivery takes 3 weeks. Rush delivery adds 5% to the total.", {
      acts: [["Open the seniors quote", 7]],
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
        acts: [["Open Book a shoot", 5]],
        chips: [
          ["What kinds of shoots are there?", fKinds],
          ["Can I rent just the studio?", fStudio],
          ELSE,
        ],
      },
    );
  }
  function fStudio() {
    const q = SV[6].q[0];
    say(
      `Book a studio hires the space on its own at ${money(q.rate)} per hour, with a ${q.min} hour minimum (${money(q.rate * q.min)}). It is open ${fmtT(OPEN)} to ${fmtT(CLOSE)} the next day. You choose Area 1 or Area 2, a date and an exact start time. Extras like a lighting kit, backdrop or studio assistant are priced after review.`,
      {
        acts: [["Open Book a studio", 6]],
        chips: [["Do I need your photographer too?", fShoot], ELSE],
      },
    );
  }
  function fKinds() {
    say(
      "Portrait: people, headshots and personal shoots.\nProduct: your items for a catalog, store or social media.\nEvent: coverage of a day, launch or party.\nBrand and lifestyle: photos that show your brand in real settings.",
      {
        acts: [["Open Book a shoot", 5]],
        chips: [["I need the photographer", fShoot], ["Just the studio", fStudio], ELSE],
      },
    );
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
      "I am not sure I got that. I can help with clothing, uniforms, design, websites and photos. Tap a choice below or tell me what you want to make.",
    );
  }
  const CTX = { 0: fDesign, 1: fClothes, 2: fSeniors, 3: fWeb, 4: fPhoto, 5: fShoot, 6: fStudio };
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
            ? "Hi, I am DOD, the LAY C AI guide. Ask me anything: our services and prices, ideas, advice to improve your work, ask me to draw an image of your product, or send me a photo and I will read it and identify the item. Type below or tap a choice."
            : "Hi, I am the LAY C guide. Tell me what you are trying to do and I will help you pick the right service and understand your options. Tap a choice below or type your own question.",
        );
    } else if (ctx >= 0 && ctx !== gCtx) {
      gCtx = ctx;
      CTX[ctx]();
    }
    if (innerWidth > 760) setTimeout(() => gin.focus({ preventScroll: true }), 0);
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
            "Draw a nice product image for me. If you do not know my product yet, draw a gray beanie mockup in LAY C brand style and ask what I make so you can redraw it.",
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
            "Compare the LAY C services and their prices and tell me the best value for a small new clothing brand.",
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
      "You are DOD, the friendly and very smart AI guide of LAY C, a creative studio and clothing factory in Egypt. Prices are in Egyptian pounds (L.E). You can answer ANY question (business, design, fashion, marketing, writing, maths, general knowledge, tech, life) with accurate, useful, honest answers. Be especially strong at helping LAY C customers: explain services, help them choose, give concrete advice, and critique their ideas constructively so they can improve their brand, product quality, pricing, photos, website and marketing. When someone describes their work, name what is good, what to fix, and the next 2 or 3 actions.\n" +
      "RULES: Reply in the same language and dialect the person writes in (English, Arabic, Egyptian Arabic or Franco-Arabic). Be warm, concise (usually under 140 words), plain text with short paragraphs. No markdown headings or bold. For LAY C prices use ONLY the data below; never invent LAY C prices; items marked priced after review are confirmed after the team reviews the order. If unsure, say so. Be honest that you are an AI.\n" +
      'IMAGES: When the person asks for an image, picture, mockup, logo idea, design or "how it would look", draw it as ONE self-contained SVG inside a fenced block that starts with ```svg and ends with ```. Make it look as REALISTIC and 3D as SVG allows, like a studio product render: (1) Soft studio background with a subtle radial gradient and a floor shadow (blurred ellipse using feGaussianBlur). (2) Volume: build every form from several layers, a base shape plus a light-side highlight and a dark-side shade using linearGradient and radialGradient, with the light coming from the top left, soft inner shadows along folds, seams and edges, and a thin darker outline of the same hue, never black. (3) Fabric texture: use repeating <pattern> ribs or weave lines, or feTurbulence with feDiffuseLighting or feComposite at low opacity, clipped to the product with clipPath. (4) Depth: overlapping parts cast soft shadows (feGaussianBlur plus feOffset) and rounded edges, with no flat single colour fills. (5) Add a small realistic detail layer, such as stitching as dashed strokes, a woven label, folds, a fluffy pom-pom built from many small overlapping circles, and drawstrings with eyelets.\n' +
      'RATIOS: Use correct real-world proportions and a canvas that suits the product. Garments and tall items: viewBox="0 0 600 750" (4:5). Beanies, caps, mugs and bags: viewBox="0 0 600 600" (1:1). Banners, screens and web mockups: viewBox="0 0 800 450" (16:9). Keep the product about 70 to 80 percent of the canvas width and centred. Proportions to respect: a beanie is about as tall as it is wide, with a folded cuff about one quarter of its height and a pom-pom about one third of its width; a t-shirt body is about 1.15 times taller than it is wide, sleeves about 0.3 of the body width, neck opening about 0.3 of the chest width; a hoodie is like a t-shirt with long sleeves, a hood and a front pocket; a cap brim is about one third of the crown width. If the person gives sizes or a ratio, follow them exactly. Keep both sides symmetrical unless the design is asymmetric.\n' +
      "IMAGE RULES: Use the colours, text and logo they asked for, and LAY C blue (#4169e1) accents when no colours are given; the factory beanie is dark gray. No scripts, no external links, no external fonts (font-family sans-serif), no embedded photos. Keep the SVG under about 9000 characters so it finishes. Write 1 or 2 sentences before or after the block saying what you drew and offer to change colours, text, angle or style. You make vector illustrations rendered in 3D style, not photographs, so say so if they ask for a photo.\n" +
      "PHOTOS: The person may attach photos. Look carefully and (1) read ALL visible writing exactly as written, in any language including Arabic and handwriting, and say clearly which words are unclear instead of guessing; (2) identify the item: type of product or garment, colours, fabric or material, print or embroidery technique, logo, label, size marks, condition and visible defects; (3) say what LAY C service and options match it and quote prices only from the data below; (4) give honest, specific advice to improve it, such as design, quality, colours, placement, photo quality or presentation; (5) if it is a handwritten or printed order, list, receipt or quote, transcribe it as a tidy list and check the maths. Never identify real people from their faces; describe only what is visible. If the photo is blurry, dark or cropped, say what you could not read and ask for a clearer one.\n" +
      "ACTIONS: If a LAY C page would help, end your answer with [[open:slug]] using a page slug from the data (at most 2).\n" +
      "The demo machine on this page makes a dark gray beanie priced 400 L.E.\n\nLAY C DATA:\n" +
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
            "Look at this photo. Read any writing in it exactly, identify the item, tell me how LAY C can help, and how I can improve it.";
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
  const manTex = new THREE.TextureLoader().load(
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAR0AAALQCAYAAACt9KSMAAEAAElEQVR42uz9d5xkV3kmjj/vOTfUraqOkxVGcZQDSMhCEhkEGGwDDizgBMb24g1ee+31Om34en/r9dprr9nFCdvrgBMOJJOzMSCEMsojjaTR5NCxwq0bznl/f5x7q6urq6tu9fT0dDjv51OaUU91hXvPec7zPm8iWFtNE9kDANIe/+75/tj5jpNepjXtA+hiIr4A4POZsZuIKswcENG2Xi/OzDUimgOgAX6emepE/DxAzxPxs1qLZ4D0UBiGx8xzlpgEQAA4+3e2t8zaWhvZS7BqQKO7N7rvj14uhL5eCH6x1vQCIr4EoD0AqgCBqA0mK759C6+BDEN4lpmOEOEZZv6WEHiEiB6q1+vPAmgtA0J6GZCyZs2Czjq6bqKDMQAAgiA4XwjxEq3xaoBuI8JVROR0MJX2X7s2OXXdi+XuC/f4O3d9JvM/ROh63+cBvh+gb2iNb5TL3gPT09PzXa/vWBZkzYLO+mM1BEAtsJmxS4VI3wDQdxLhxUQ02gUwKtvA1PU4W8ZdD8oYTRuIss92FOBvMtPnpMSX6/X6Y8sAkLK33ZoFnbU32clORkdHJ5VSb2Cm7wNwJxEFHZs5BxmxBgCzUiCSBoPaIKSZ8SDAn2Smz7Ra9W9gsSblWBfMmgWdtQObtqtRqVRuYKZ3M+P7hKA9HUCTdrg3G+WadrpRTs6EzNfRTwD0Ca3x0Var/s89mJ51v6xZ0DkLbhTyk71SqbyGmX4SwLcTkdPBaLDBgGYQE9KdLIiZwYwHiPAhIfD39Xr9Cct+rFnQWf3rIXJACYKR7yLi/0hEt3exGrnJr53uAUAxM74kBP+54zifnJubm+0CXav9WLOgswJXSgFAqTRyOxH/khD0hlzzwGKdZitZDkBOhwZ0FMBfA/oDzWbzoeXcUWvWLOgsfw0IgA6C4HzA+a9E/G4iogxsOt2ts3oT8ig3YXEcHF3/346V8+J/WwMXLL8eMmM/ihmfA/D+MKx/pOOjWPCxZkFnELspl6vvBvCrRLSzQ7ORq45utBhImAHFgGI2lIIHJwsSEQQBkgAB83fR43X57AKQ6mQ/WvP9RPi9ZrP+AQBR9/W1Zs2CjhFC0yAILiAS7yMSb+rQbJzVBhkGkGogYYbS3H6CLwhlKVB1BEZcgapDGHUkNBjMwK6SAwbjZEuBMpCZSxTqKaOeajSURiNlRFq3UYaI4AmCk4ERcjA7e+yHABJEALN+DKD/3WzW/wxAgi5R3po12qLfOXOnqm8C8HtC0B5mVquh2RDMRs9BJtIMZgYRYcIT2FNycHHFxd6ygwvLDnb5DiY8AzqBJDhEcAW12Y7MmITK/p+IkGhGqhmhZjRSjdlY42SkcChM8XwzweFmiiNhiulYIckAzhUGiPLPdhaYUO5OSSKC1nw/gP9fGNY/3AnydstZ22qgk9dIIQgqvyKE+E+rwW46gSbWjFiZ7TzpS1xedfHC8RKuHPFwScXBdl+iLEU72UUxL7hXvAAI6KHloEP7yd9TgOAIA055XUakGTOxwpEwxePzMR6ei7G/HuN4K0WsDAD6kuBmn1nz2QAfkhnz+YgQ9AtZuD3/iFbrsaCzpfSbcrlc+Usi8eYzFYpzHSXWQKQ0QMD5gYubJ3zcMlHCDWM+dpYkSpKQagNIaQYy3S7YSm7GcoKyIMAhw25cIigGZhOF55opHphp4Z7pFvbXE8zFCiAgkALO6gOQBsBEJJm5xsy/HIaN/2O1Hmu0lQCnXC7vAcTHiOhFzLxidpPrJM2UoZmx3Ze4dVsJr9hRxg1jPrb7Rn9uKUaSMZhuEflsW6cLRQAcAXgZCEWacSRMce90C1+dCvGt2QjzsYYUhJI0LtgqakAK7WgXPgqon2g2m8esu2VBZzObAyCtVCrXMuPvicRVKwUcSSbS1Ew1BBGuG/Pw2l0VvGxHgPMC83Kh0kj0Yia0HqwThAQZACoJQsqMZxspvj4V4osnmnisFkNpRkkKuGLVwIcBqCyb+zmt6R2tVu0uCzwWdDYt4JTL5RsB+hyR2LESwOkEm7Ij8OJtJbz5vCpunighkIRQMSLNa85mzhQFcgbmS0IgCA3FeGi2hc8cb+JrUyGmIgU3Yz+r5Hrl1z7Umt/dajX+2gKPBZ3N6FLdyGwABxgOcAQZdtDIwOZVO8v4FxeO4KpRD2CgoTQ0ry9GcyYAJAkIJEES4VAzxRdONvCPRxt4rpFACkJ5dcBHAxBGx+IfaDQaf2mBx4LOZjABk2F8ASDvIaLdAA+V7CcJaKQMQcDrdpXxtr2juGbUQ6IZYaYEi0149XJ3yheEskOYihS+cjrE3x2q4fH5GESEikPt554B8ICIBKAt8FjQ2RyAMzIysk0p/c+AuHoYwGmzm0Tj2nEf/+qyMbx4W4BEM5qK26HqzW45o3EIqDoCtVTja6dDfOhIHffNtCDIMJ8z0HwYgCYiqXX6XWEY/qMFHgs6G/X7CAAiCKqfFYJeMYyGIwgmx4aAH7poFD988ShKwmy4rQI2/VyvqiOQaMYXTzbx5wfn8cR83NZ8Vgg+WTYzGkT84kaj8Sg6cqmsWdDZCJaVNlTeL4T4sWEARxLQVIxtnsR/vmYSL9keYC7RUNmGG3qztksS1hGAdKHCsJ9NZfpV1RFophqfP9nEnz83j+caCXwp4AksykEq+rIASWb92M6djZsPHkQCWyy6qU1uQsD511mmcQLAHUa/OT9w8L4X7sT1Yz5mEt0upBwGYPKHlABlKYckzg5LKgIiRIDIijukBETHg7LXKAqQuWDeUgwi4IYxH6/bXcG4K7C/FmM21otKLYZwh1MhxK5Gw51MkuTjWGgPa80ynXUNnioIghcTOV/N1muhOqqc4ZxXcvDeF+7ABYGDWspwCoINAfB8wPMI0sk2eMcG5q75DauW8dvjtYToDTrtjGda+vm1BlQKRDEjibPvVHBVqEzzGXEEng9T/Mmzc/jk8QaUBsoODct6FEBSa9zRatW+Dpu1bEFnA+g4QblcuR8Q+4oKx4KASJmM4t+5aScuCBzUUy7kTjEb5lCtElxvefbRCwTWWpPpxxk6P0+aAmGTEUXFP2eu+fiCEDiEe6Za+N9PzeCJuRgVV4CoMNAqIkhmvq/ZbNyKpWN6rFn3ar2xnOrvCyFePWwujmbgV6/fjuvGfMwPwXBcDxgZJTjuYKDZMBdSAr5PkA4hSYqxnlxgVwBCxbi44uL1uysACA/ORSYCJqiIryQM8IjzpXQfTdPkESz0YbZmQWfdAc5bhKBfG0Y4dgiopxo/eNEY3nrhCGYS3RdwOKuNFgIoVwiVCkGIzQM4i66NA7ieAR6ti7GeHHxa2jDFl+8McN2Yh29ORZhPtWnXUYg4EQG4Kk3jP7KAY0FnXbqGY2NjY0rxpwBUUHDOlCQjhl4QuPhP10wi7SjIRI/QL5HZiEGZUB0heN4WWBjS6FRJXBx4cpeVATQUY1/Vw4smS/jKqRBNpdu9gQawHS0E7XYc7740jZ+wbMeCznr77FpK57eEEK/EwvSCgZsiVoxEM37+mklcP+YjZIaTibBCANLJTnsXKJUI5QohKC/WbraCCQG4LiGOhz8NRBYRvKTiwBGEfzoZtmu4Bnm8pj81xtM0/kssbgttbTMw6Y26H4xbNXoLoN+Tdf0rLBzvCiR+7du24dt2lNBMGdu6TuDOiE+ne8VbbOkzG/CtjhBq85z7P8UoaMYo60rjsooLVxaOZknTaRGv9n3/4iiKDsJGsjbXYbaBXStJpP5vezZugV9QWZTl/96xA684L0BTMaRYnF/TGerufGxVYwY8z7iWyBIlez1cIviC2pG/PKpVlgLzqUaquehio4zteEI4/xkLLYGE3a7WvTqXn1lVKpW3E4mfLMpyJAGNWOMnrx/Hd19SwclQw7XLuLB5HtBKgGZiOh+m2SPRBsznU42pWEESwZPU7sk8HWu896lZnIxU0ShWm8kKIW5yHFemafIFLIw/tq7WBjfagJ+XAJTK5epjAPZiYQheX7eqlTIuGXXxD6/ZDaKF49NaAZGFgYpLuP9UjH/7tVPwJC1qkSpgolYtpTHqSoy7Am7Geo6GKU62VFE9p9tU1u70b5WSPx9Fc892yALKApDVdNaK5aRBUH0nEV1UlOUAgNKMn75+HCOewFysV1RPtWVPJgISxTivIhFqjamY4RBBZ3ue2TTIEQScilIcby10KXQFEDi00kxsycyKiN4qpXpdpVL9Q6XS97VarYMWfKx7tVYshwGUPc/7awCjRdiaQ0At0vjuy6r4N9eOWcBZ4YVPGdgRSKQMfO1wE45D8KWAQwQpFqimzEbotEfegM4UEfLZ8gER3U4k3um63g4pxZNpms50rGMLPBZ0zgor00FQ+XEhxNtRYAKnICBMGXtHXbz39h1t1LKYszK2E2vGrTtLGC1JPD6TYKqlEGUjbfKUA+56rJLlo2sUgHIGPu9yXU8mSXw/zERRCzwWdM4Gy9lT9rw4ZzmFEgE1A799+3ZcNeahqXhL9sRZTUsZuH1XCW/cW8a+MRe+I3C6pTDT0iBhxt6cpfoy6gE+r3Jd9y2u6z6dJMlTRdeENQs6Q7Ac/JgQ9A4USASUBNRjjR+7Zgw/vG8EM7EuVFdlbfDODxWj4hBeuL2Eb99bwRv3VrCn4mD/TIKpSCHWDEEE9+y09OgCH7ELED/gOH6QpvEXsaBtW9azjtfQRvmcThBUvkVEV2JAxEqQCe3euM3DX716N1Jt199qW2eD9pIk6Bbw3IzC3dMhvno6xEOzEU5HJp/vLI807hzq9zkh8I56vX4aNqHQgs4ZsjEVBNU3CUEfKRqxUprxZ6/chVt2lFBLrHh8NrWeep1RbwC+Y5IBNQPHWinun2nhnpkIj8xFOBqmZq56lkToiiwLcPUAKCEiV2t+UErcmQGPbX1qQWdFlk12qH5OCHp1NgpY9nOrapHGD1w5il+9ZRJTkXWrztbCIQKiCKjNczv3Kc/f8bLeyQAwEys800jw4GyEh2Yj7K/HOB1paOZFLGgVACglIkdrfkBKvLZer091EDNrFnSKA061Wr1aa3wrAxvq92UUmwX/93fuwkVVFy0rHg+9EKjLjer+s/Pv83OMOFnosJ77O6oDgByRsxtCrBknWymerCW4d9q4YcfCBLFieMJkMwNn1GExNZNE9T81m43XYKEZmAWedWLORgAdpfhtQghnUL8cQWZ0zOsuruKKMQ+zNidnCZBQDxDRGUBoABomkU9nG3/hT1oQUDqykWuKjWZGSzWfTtWFFUPD1F+5roObt7u4ZUcZtUTj2XqMr59q4r7pEIebCQSAchaDXwH4OMycEImXB0H518Kw+bNW37GgM4ypTDd4bWFmxsDL9gQWWDpYSQ4cKgMUxebCKqZFgMM9AIP6vU/W7D1Nlz6PevxS7hMrZjRSNsVUBFwz7uOGiRLmYoX7plv4/LE6vjXTAgOoOCsab+MwcyqE+JlSaeQfsrnpFnise1Xos/HY2Nh4kqQHAJpEgdw+zcDfvHoXrp3w0Ew3p2vVC1w6gSUvyFQdQKOxNGGPznAREBnAqdXOTKvNQcUhIHAEUs14cKaFvzs4h4dnWihJgiOGLqVQAEmA724267d3eH7WLNPpb0mSBAD5RZ7LAFxpan24x7/li1Zmo1TyjbqeXbBOYMhBI2cpKQMJm7+rTM/qBBbq8edqftW8347nEaKIV5wUKDraYdQTgws3Twa4YbyEzx+r46+em8NsnKLiiGEmTEiAFRHdWi6XX9NsNj8LO0F03Wgm69qklHFRWpxXk89Gun2CKl4YlTLmCYx7ol1L5AvCpC/W1UC8PPON2q4IEDGhpgmzijCVCpxOBKZS8/8NTYgyZtP5+wJrk57LbLorilVaSfmssUaqkTDjOy4Ywa/ftAvXja8o9SHDYHpPL6nJmnWvlgNFnY0IvnNQjk4eLv/5mybxMzeM4XRLoyQJBOB4M8U3T0X46vEQj80miFPGREngpbsDfP++EbjnoMl6N4vRGRgmTEgYSNm4SrqLvZzrm0adw/TYDBOMWox6YzHbGeZ69hwUCCBlRiAFmIH3PTmFzx+rY8QtzHhydzxkVvvCMDwCm7tj3asioAPwxwC6c9BJpRnwHcJfPFXDVeMudgUSz9dTfOloiH86FuJYwzBrkSWn7T9tYjI/cuXISsbhrhhocpBRDCQgJNoATcoLfRq6XaJzDTQ6GylMbABG6Wz2FwFEBNaAn9GQ/PsZN7aI9m8agy1cF26/pyRCmGoIIvzkVdsQSIF/PDSHqieLaDwE05MnIBIvBfA3FnQs0ynIdEa/jUjfjQJCMgFItFnEJUlopKbfqCepvSlMaJ2xb8zFX71qNwKHECs+K27WIpABkGhCzAsgozu+1Lm+Gflgvl66UOAQUgUcmU7BeoGd1BOFpMe0CCJgLjZ1WP2Ah2ESBMc92Z6zNeoKCBBKDsElIyLnn8UThP/12Gl86kgNVVcUAZ48b+f3ms3Gv7K6jmU6hfYBUfo8MzWJqDwIeEzjKIKbZbhWXQJ1hIqJgFgBVVfgt27bjhGXCk/1HBZkNICYgVgbdynJQ9RdDIbOwUVdyLUxn0ZkvY4dYTa5pAXwSTXjaCPFHzwyjYdOteBnYWwiQjPVSDS3x/d0XohYLTCYfp9FkNHXcrCqOAZ0RlyBsiMw4Uls8yW2+xJ7AhffecEIDjZiPDUfwxc0iLZQ9l1vzEmb3faW6RSxoFSq7BeCLsgWjTiTLxumGu97yU688cIypiPd7gVzpkCjM5cpZiPuJpoWuUu0xsDSi7UYcDH9b5yO8oNEMeqpxlSocKyZ4HA9xZFGgkaiMRNpPDETYS5W8LO2owsuFKEH3rQrcqngxFTdCdbM7WijefAiBlV1JAJJqCW6yOvnH/f5HTu2XXnw4MEW7Fgby3QKWEhEswAuOCNfLROaf/rGcXzH3rKpyxJnDjQxEyJtokwpLy4JONtg0wtc8ghQJ2vJS0RCpTEbKUxHCofrCY42DLgcbaQ4FaaYiRSaCS/Z6CUpUHXFEnGYlzm9qItRFT0QCICTI4nIf06LcpJSzZjTQ7PTXfPz8zsAHLagY0Fn0FrkXbt2VWq1xuSZsDNHAPMtjTddUsVPXjeOmRUUguYAogBEWag6zoCmk82Isw4ui10iVxIcWmgdEStGI9U43kpxuqVwpJ7gaDPF4XqCk80Up1oKtVijpXQbIamD/ZQzl7TbHVurDiGdkbFeb0k0VCMoynQdP4qSbwfwftipoda9GgQ6QRCcD4iniCjACjqOSjJJZ9dP+viLV+2CJAzUGnoBTawJrUyjOZtuU3fPmTa4ZMwl71AVKcZ8rHG6leJoI8XRhnGLDteTrJufQjObOZV/GUkL7Ee0o0t8NvrcrCfLyedhxxEvmJ+fn4Yti7BMpx/oMMuLhcCKACef6rkzcPDbt29HSRLCAeUR3YymG2hWM/Guc7Pnmkve2NyhTnBRON1SONpIcaie4FAtwZFGgpNNhdnYgEuOGJ2sxXcIQfZJuUNDWcjQ3hJehoAZ4HdhmupPjo2NvX5ubm7WAo8FneUWCwP6NiKJLDnQGQax8kP+f966DZeOuMu2Le3UaCImtLQBnNUEmm42IbsARsOI3KdCw1YO1hI8O59k2kuCuVgvAheR/Z4jCFVXLC705IU/7a4ylysbZ3NrkqhPdwCPzduxoLOEFjORePVK3MFcOP7lF03iVecFSxp6dYa3EwZCTW0xeDWAZmHzm1wVKdCefgkAzQ6AeXouxtNzMQ7VEhxvppiLNVSGmJT1G14Al6Uuke3IWszTZua0C3jmLPBYTWcRJQ6C4Hwi8SRAlWHcK4eA+UjjHVeM4Fdv2YbZWGcaxsIjBdDShFaWR6NXg810vI6TgwwZIJuPTcToqbkYT87EeHouwrHGYoCRGfPpnCW1yfWWc2F5wuDdzWbj5QDijkttbQszndwPfzuRqAxq4LXoOCNgPta4dXcJ/+mmyXahoOhwn8IO9+lMok6dgCAJKDmm/aZiYDpSeHwmwmPTER6ZivDsfIyToUIr1YsApuSYoXSLXm+DuUWLOg+e4VG2BgDrGMYjbi2XK3/dbDa+r5NZW1jYmkwn/1xeuVz5FkBXoGBSoCAgShk7AokPvmY3dpUkWorBZFhNmLEaxspD253ujCtMDoskoJZoHKoneGQqwkOnW3h8JsLJMEWShcpy/UbSxmEw1AUktAzg5j1xFPNCQh8N/24yz4ymheukz941SojIZdbvbzYb/xK2RGJLg44DM7P8u4Wgfyg6AaJTOP6zV+zELTt8nI4YCQzYqDNwn/KNRUCbnQDA6dCwmXtPhnjodAvP1xOEWU+YXL85S6NXzgqwdIvRpjUIZ9XuS7+AFMZ9DKRheCOuQFkSxl0JDS50rbnj3k3HGnOJwnSeRwSjZXmdpRmrex2zKRL6p8Kw8V4LPFsXdAQALper3wToZoAHDtfLv0gj0fifL96O77lsBIea2rTk5JUPfctPWU+YrnaagRPNFA+cbuHuE008MhXhaCMxFdfCFJXKdQwy1AUueU1awmyquztSjD1BKEuBUVdg1BGY9CQmPYFtvsSYa/5/1Mn+3RXwBaHiCDjZ764E2CPFaCrGiVaKZxsJHpmP8dBshOebCaKMMfpiIRmyU4hZ4fXOa3GFUvyaKGp8CTaUvuVAJ59zNTTLaaQa77liAm+7dAzTiYbvETzXiLLDRHfy+h9JhMAxrtPJMMW9J0N8/ZhhNKfCtM1mvKxnT2fT8vV0g0WHm5IwI9EAZx/UzdjJDk9iZ0liT8nBeYGDXSUH2zOQGXVFm8nktVad10m1G7hzG6RXGk3LSzhcMiyRAMynGs82Ejw4E+HemRaeric4Hau2+A4yCZN5jlOe3zTEZ8hd96NC4AUdo2tsRGsLgE7u/TjlcvVRgC7LtrEYtFDricY7L5vA2y8Zw0y00GFOCMD3Cb5vutv1A4V8w5SkcZ/qsca3piJ86XAd95xc6MfjO+JsDItbdSajGIg0tzenJwk7fIkLAxeXVFxcXHFwccXFLt/BhGeAJa970lhwqxZ0mqXftZ/ms1Lrlc9UyqKACTOmIoUDjQRP1xMcaqY40UrRVIy5RONEK0Uj1ZCCUJZDNXXPI1ofbTYbb7Zu1tYBHQlAlcsjP0KEPy7CcvLWlnfsqOAXr9+BeqKXuFLMZmpBEBA8j9o/69RqBJmxJ4KAg7UEXzzcwFeONLB/LobWC/141oPb1L3R858pNr2EkgxkAkdgb9nBZVUX1436uGLEw4WBgzFXwBPUFn4TbTr0dW9QWmUwORPTHVnbrjDuWw6QSQaOLcU43kpx70wLnznexKNzUZupFmQ9GfDwjzWb9T+ybtbmBx0CgMnJyZFWK34cwB4MCDLlTMOVwG/evAc7Sw6iZYbr5SDjuoQgIDjOAqeuOAItxbj/VIjPHKzj7hMhZlsKUhICh9ac0VD2n27Rmzs0mMWujPmL7xB2lxxcXnVx80QJ1415uKjsouqYgHzCjDhrcNZRjrVI49kI1g38+XcQmbvoC0JTaXzoSB2/f2AOKZtBfgWAJyvW5zmAr2k2myewkKhubZVsPeXpSABpq9X6cSJ5XpG8nJzlvP78UVxYdjHXp3F3fmInCSNJGEICY2WBBMDHDtXw8edqeGQ6gtaMkiMw4ksw+Kxn+nZvetO6AUgVI+WOnhVkyh58Sai6hIojUXWN7jHpC1wUuHjZtjIuLDkYdQUcIsQZyMwn2rwELWRZb+QhhNSDieXXLtKMMDt4fuiiUVw94uGXHpnCbKzgyYHAQwA0kZjQmn8LwDuwAYYXWKZzBp9j27Zt1WYzepIIu4t8PgYgQfj1m3fh/LI7sOVozhQ8YUK8j85G+OOnp/HYTLRmrKZT2GUAiTatKDjbDUISRl2BHYHEnrLE+RUH55cd7ClLbC9JjPtmokUgBcoOZb1uCIIJUcpoxowoZaSpifkxo91edDkg3hDspuOGCGGawRMArc2j1/dJNLDNF7hnuoV/98CpNrgXuLcKIKk1v7TVqn/Vulmbk+lIAGmjEb5HSrlnGC3n27aVsbfi9h2stwhsHMKxMMUHDs/jU0friJTGiC/OWv1SJ5PRMB364mxAlZCGpVw86eHKMReXjZrH+RUH20sSVSeL4FDuVhnmlXa6VwzUEwbDfH+vBHhY0K3yTakVoDSgFbd/lmc+54+hvxudPWDpfh/pAK5r3GPHQXvkDbMZ+NcKGXG8+DO5ApiKNL5tsoQfv2wM790/U3iSBBEgBP8GgNtgs5Q3HdMhAJiYmBhttZLHM5YzMGKV98j56Wu24849Vcz3cK1yEPGzcO/JVoovn2jgY4dqmIrStnC82mDTyWZiDURZsyxHEnaXJa4a9/DCbT6umfBw2aiLnYFpvwkyXfFSvdBcvudEziHFXVpG42o/9AJAMQwwAQv/n/+988OsFKgGfc78IYR5SIcgpQkE5N+j+33zn4dNoNFYynZNnhXhJ+47gUfmYgROIX1HEZHUmr8vDOt/b9nO5mI6mZaTvE0I2lM0LyfRjAlf4vrxElpqIWKVF1w6WYNvADjYiPHF4w18+UQDp1spfEntE2+1ACcHmjzBLUlNItuOQOKqHQFu2enj5u0lXD7qYntJwhVGu4m00V1a2UanTmF0lY6EfgyChBm+W+Qs6qy2PZugs9x3WO798p+XK+Z+hs3Fr5Oz3HfsHcUvPHy68McxuUz8KwA+bNnO5gGdvFdWiYh/hrlYFbkgoJkybtsRYFfJQS0roBS0wGrmEo27TjXx5RN1PDjTQj3RKEmBkWxsyWrMueoJNIJwcdXBt+0s4Y7dJbxwm489ZQlPElLNiBSjngu7Ha7XORN2h9Sv+CxrQmcCZFoD5TIhjhhKLXw+SUA91bhjewlXjXrYX4tRGiwqCwBKCHF1uTzy+maz9gnLdjYH6EiYGqs3EtG+oizHAAzhjh1lqGxuUlkSIs14uhbjrlNNfPN0E4eaCTSbfJXVBJscICLFiFMGCWBv1cVtu0p41XkBbtruY0dJQsPkjjRTRiPlVWcw1nqzJd8Hms2lrnbgCHzXeVX82uNToKFQXv8igE9YtrM5QCeLO/BPMhMXAxsgTBn7Rjy8ZGcZKTOmohSfmQrxjVNNPDkfoaUyIMrcq9UAmzzcrBioxeZjn19x8LI9AV51XoAXZkCjYLr/zcQL7MuCzNqa6y6NUQkCmkrjlTsD/OVBFyeiFC7RIBSRzKyJ6LYgCG4Nw/Buy3Y2Nuhk2cflmwF6aUasB7Kc3C2587wq7j4d4tNHa3hszsxkEkQoScKIS+20/dViNWHKSBWj4gm8+vwyvn1vGS/ZXcKesgOlzWiXTqCRFmjOmQnZY+IoTAh9py/xhj0V/MHTs/A9KnIYaYAcQP44gLuxsfIo1ycbPdegEwSVPxJCvLtoky6GEYnHPInDjQSA6WfjitVr25lrNYqBZtam4spxD99+YRl3XlDGVeMeJJl2oxnOtLsSWjv3xgzMznDPGV0uAadjhR+55wQa2WRXLnDOMfNMGDqXAXMzsHOzNiToEACuVqvblcJ+IkxgiFakDEBl9VD5IluNFZC7ULEGokSj5ArcvquEN19cwcv3BJjwTblEmHJ7HK4FmvWn6ShlQKeXKQbGXYH/8cQ0/u5QrWjeTlaTpd7VbDb/FLYYdEO6VxJAqjW+WwiaGEZAzhHLLVZLU4yOZ+ARKkaaMraXJf7FpaP47ksquH7SgyRCPdGYjvSiHBxr69O07r92Ys34rvOq+PixxlBaHzO9FcCfWpazMUFHmZvIP7RiCr2KYNNIGVoxLht38ZaLq/iuiyq4aMRBrLid7SutTrNx3Kss2bFXSF+QOVyuGvFw27YSvnSiiepgtiOZGUR4ablc3t1sNo/DTpDYUKAjAOhqtXqV1ngx8hKqtfwA2WJsJAxmxo3bfXzfJVW88aIKtvkCjZQxY1nNxmU6BU+k79xTxT+dDIvkBhEARSSqSulXAPgbCzobEHSU4rcLIeQwUx5WC2zqiYYA4abtHn5g3yhed0EZFZdQy1woG33a4EyHB6+DptK4ecLHvhEPT9VjBIIGIQgDYCK8PgMd62JtINBRBnjozVnLTLGWYEMgvHR3gHddOYo7dpXgSaPXzERswWYLWS4o37krwBPzkUkWHJChzMxERC8D4GFhVpa1IW2tt5gAoMvl8gsAcf/Z/gy5ZlNPzGp6ye4S3nXlKF66u2TE4VRDswWaTbWgCQhDoFEf3ObEE6bjwLvvPYGWGhg+b/d/J+IXNBqNh62LtTGYTnaTxJuIiM6Wa7VIINaMW3aW8BPXjLXBppZoKw7b0xaRYlxYdnDDmId/Ph2i4oh+rhmhHTrHtwGwoLNBQCdLH+fXLzTlXN2FlJdJpJrxgu0+3nnFKF53YRklSZiPF8DG2tawThDp1fJCEuGl2wN85VRYeDEy84sB/LG9uusfdAQA7fv+xQBuWk09J6/SbmUFmJePe3j3VSN488VVBJIwn2hEyoLNVjFBC2DjOIDnE1TKiKLFwCMIiLTGTZMljHkSkWZI9HWxhFm3dNPiQ9TaugYdKb1XEMEbNiFwOZNk+tI0Yo3zqg5+aN8I3n75CMY8sQhsLOBsHWbjekC5bBqA+b7pGQQm6FlGkixughYr4LySg31VF/fPRCg7NMjFAsCXjI2NTczN2ZKI9Q46+dCX12X37oxuVN7HphZpjJckfnDfGN515QjOrziYjzVmY23BZqvqNQRUqh0lMjqbf1YiJMniZadhJoZeP+7j3ukWqL+TRQCYiCaSJLkYgAWddQw6ebMuD+Bbs5NErHRBCQC1RMMlwpsvqeJfXTuKq8c91BK2eTbWFmk5DEClmQqc9F6YmoErqh5ocKsLANBEJJWiKwA8AFt+t25BRwBQlUrlSma6CAV6IPf8sFkKe6IYt+0O8JPXjuHFu0qINeN0S0MKCzbWFlttzrhUnYdW9yGWMGNv2UEgC8/GghB0+WKXy9p6ZDrQmm4XgsSwofJcGJyPNC4YcfFvrx3DWy6pQBJhLjblCo6dTmStC0xUikUaznKmmDHhSYy6AtOxKtLcC8x8ib3K6xt0crt12F+QWT9kQcC7rhrFe64Zw+6yxFxkw9/WioFP0VNxiKcCoD2dzMfa+gOdrPQBL2IuTkklGaH4ygkP//nmCbx0d4B6Yooxpe1lY60vEzFTLoTo3+piJTiWVZxvz/7fJgeuQ9ARAHSpVLqACPtyl3jgqZMBzlsureI/3zyJMVdgKrIRKWtDLDwCPB9oNhaG8y0BJ5gEwVNRiplYwykmJoOZJyzTWTkgnHWGa26S3AeglJ0MA2GjkTB+6sZx/NZt2+ELYD7RcCy7sTYk2ymXCZ7XMUiQFx4qGzA44gh8+ngDLaWHOdAs2KxjpkMAIASuJyIws+4HdoKAeqzxH26cwE9dP4bTLX1u50JZG0obWY82Nk6o1RkqAly5kPznCIJDwN8fruFDh+soO2KIToLU6FjfFoDWGejkN+S6QU+UZMa7vPmSKv7NdWM41dK2D/FasQIszm3pdnWTlJEmi2uZhFzn2y2DA0GE7WWJA2GCozUFRxiWcyRM8ZVTIb54sgmXqCh6cHZ4Hu3wFmw5xHoEHSJc2U9EzkeETJYkfvr6MYT5cDp7j1YF8XsBSs4sRQb4jqRMM6M2s0k10KwzVGSGvtOG8y8ILc348nQD731qFsdaKZysv3akjAacj5/m4dbzs51M3tr6AR0yGs7lPnD8gvx+LedWNWKN77t0FBePuJiOjIZjrThL6QUoksxJ72Rgkg//Y5jTPlFmjvpcrDEXa0xHCqdbGseaKU62FI7VFeLYTDHdiCaIcKKV4tH5GAKmhw5nIFt1F4YxDisXaM1325W3fkGHg2BmG4Dd/U4GBkCC8LI9JSi2x0dRcJFkMrVdSXAEtbskmpOc0Uw1aonGbKQwFWmcaimcDBWmWgonWwqnW8oATqRRTzXClKF0x5tQ5kBsYNVCECHIxxV1/HyF00QEM7eI9Jey/7eu1ToEHQDJBQAFGcnviSepBsZ9gctGXcRK24boWDw8MM+6diXBFcYNUmxGGM8nGieaCsdChRNNhUONBMeaCidChemWwnyi0UgYkWJo7gIUylyq7DVLDkF03aKNrJISVm8IIwBFRJJZfzYMwyOwTbzWraYDQO/JWSl6tLMwPhgjkAJluXrzrDYyi5FkXAFPGtco0cYFemY+xcF6gqfmEhyYT3CokeJ0qDAdaYSKF6EUEWX1aAZQyi4tqaLu1Hzyz2CP7j63iAFm+d+tnrPumQ7OJ1M/xQPv6ha58J0ejMhYjO8YF4nZNJE/0khxYD7BozMxnpiNsX8uwclQoZHo9jxUkYV9HUGodoFK+3ryqp72W9VSInKV4v/datW+mR2eFp/XL9OhC+wRuTA3WRIQOAQv02BainE6VHiunuKJ2RiPzhiAOVRPMRdrsDYilyPN71S9BQeo87UtqJy125cSkcvMX2i16v8xAxzrVq1n0CHSY2uT/Lz+3CRBZgSyLwiOMNrVfKLx3FyCJ2ZjPDkb45GZGM/VUpwKFdIMOYQwAFPpYC86e20LLmt6O0FErtb8qTCsfy8WZpjbu7BOQSe/Mef384Hz+pd6YsK2k75EonlDZMF2g4xDgJexGMqaxJ8MVdtNenQmxtPzCY420gU3KdNufEkIHFr0uusXYLitBfXfgzTgQBr+d9bwC1IGMr8ZhvVf6PiZBZz1714Npjn5jOnpSGPfGIEVr9ut1hlRcju0GM3AXKxxcM4AzMPTMR6fjfFcLcF0pKGzXABHEFxJGPHEEuBaf1+blwWWdvJm12APOmMM4UW/yss8pTMUyqsLXAyAmHGMGW9ttWpf7fi6FnDWOegocxrShf0SA3NUShXjaDOFXEeeGPOC8y6yiJKfZe5GijEVaTx9OsbjsxEePB1jfxeLoYzFlB0COYvdpPUDMLx0q1IXG8luH2cgxABU1jOC2eT2ZMEC6CX0jM98q9LiXGgSwqRVsPk32ZFjIYVJLKKstAHZn0OwRgaQAPSWVqt2NwDX/L+1jcR0qOitPtxIzym57gQZSYCfuT25q3SsmWL/XIJHpmM8MBXhmXkTUUo7WIzXg8WsBzepcwpCxmEMgLAZSqhZQ2d/5+4sRGG0JSkJrpQQRBipBGBmlDwXZd+DZoYUhIlqGUTUBqTAdzFWCaCHdJmZjbbVaMWoNVvmNZlBglBrRgijGEIIKK0x32wZQNeMZmQm/sZJCqUZpsYYKHlu9rmo/fl6HZRZLs6nw7BuAWcDg05haDown0IzrxnwdLpL3SDTSDQO1lM8OhPjW9MRHp02esx0pAwyCYKXuVfBOmAxuZezOLLF0NqASaq0YSG5v5QxBNd1EPguyiUPgeditFxCpeRhrBygEniolnxUAx+B78J3XYwEPkDAaFACALiOhO86MM2tCK4jF90/onyT84q+FXMGgh1fNE01lNYgImjWaEaJEWC0Rr0ZgYgw32whTlOEUYLpWgN3P3EQB09Ow5FyIO1jxhesO7XJQYdhsmKfq8VoZO1Jz9b7dIavc5ARbZAxeswDp2M8NB3h2VqK+Ui1XSVfEqquaK9G5nOTUEcdzIXZZBqnWmfAorPWeQQpJQLPQdn3MV4NMDlSxni1jMlqgG1jVYwEPsYqJVRLPkqeC8914DoSUhBEBxtoM6LsgUXu1cLfwYwkUkN7V9RPXOnxBMrALAfQSsnLfk6YrJbb6wlMcF2J6VoTn7zn8UEjZjqAUtQs4Gx20GHjmhxraky1NHYGWQRrFV67MxEvZyauIESKcbiR4vHZGPefjnDPqQjP1hLMR0aPEdKEus+Nq9Sls2RMgZmhFCPVCkot6EYlz8V4tYyJSoCdEyPYMVbFzvER7BirYKJaQTXwUCn5bUBpu5IZE1LagAkzI4qT9nelHshAHQymF3jIbj+uwFflIQF3yT1u3xRGVjyOOAOkMDa/U/Zd1JotOIXQhKWFhy3AdBwCZmOFI40U51ckYrWy5lGdbCZPxPOz8oqTocK9pyN882SEB6YiPDEbY6pl3CWRsZ5ukFlbV4k7GAyglEaiFHS2kxxHYrRcwuRoBXsmR3HB9nGcv20MO8ZHMFEto1Ly4LlGc+FsMyqlodi4I0nG2jp3MHUBiKAeTYy6gCFnPp3gxOiKKXePylzmZhIwtNbDWKaMr8sNIxA0MzxHYqTs4+jUHAoOlrUsZytoOoJMBOvp+Rh37C6Bh7jvnQKwK4DAEZDClBM8OZvggakI3zzZwoNTEY41FZRiQBBKPdyltdZj8j2utUaiNJJUAcyQUmC0EmDneBUXbJ/ARTsncOGOCeyaGMFIuYSS50CQ2VRKGddKaY1GSy0q6iRQ+z3aUZ4OEMm1n8WNvHiRbyOy1xJZJMhxzDUTguBKAWaGIwUcIcBgCCL4jlxwkQjwu7Se/N9cKUz5R0GWkyiNtIMF5x9TMyNKdft5SmvEqQYD8F0HE9WyYUREFlIs6CxehY/PFgsW6C5tpiTNwj0VKnzjRBNfP9HCPaciPD2foBlrgABPkqmkduicRpbMLC9GohTixICM6zrYPlrBxbsmccme7bhk1yTO2z6O8UoA33XMLCdlgElpjUYYL2ErbWDhztorbvcIzsGEskZdggiSCI5jAMORBEcIuFJASoLnGNbkOQIE8ycyoKAM0KQwoXQianfBoF7MZpkh4SuTl3tpvF0MLWNEWmuMV8q4bNcEvv7wMxAkoNhWMWx20OGiTyIBPDWXIEy5Z0ZhDjQic5tK0mgzz9dT3Hc6wteOh7j/dIQjDQWtGSIDoxF/oWHTuaqkzkaXQGuNZhRDSIntoxVcet52XHH+Tlx+3nacv20cI+USpCAozUhShVRrJGG0wIo6wIXRGaXiRaAiyOSsOI6AKyU8R8B3hIk2OQZY3IydSGmEY0HUBpMOP6lHB0LuKCTl7NqyYYnUH2QKq8iDqG2RZUaAUmwG6lUDu+O3EOjIouuoJAWemotxpJHivIqDluL26SkJqDgmDyZMGU/OJvjaiRB3nWjhoakYs1nUxJPUbuOQh8TPVSKeCfVyWyuJUoXAd/G6F12Na/buxiW7t2G8WoYUhDRzrZpRnAEHFthDVn1uTm5uh6cFERxJcKUD3xUoORK+K1FyJTxHGlCRBJkl0y2ACS8u4cj+34jJvfSYwfiwJMp0NvMehnjt3LUcr1jQ2Qqgkzc5Op01sx7Y2sIRwFyk8ZGDDfyXmyZM29KsfUMt0XhgKsY3T7bwleMhHp6OjdskDFjlArA+58l4GSigs4kUI9WMEU/ih15zM15z83VoRjESpdrJbLmLZERgNqxM63ajLUcK+I6DkicRuA4Cz8nAJXOHsgQ+UJdGk0WlUu4ltBYAjw1vRvfaPloGsmtrbfOCTuba81zRVazYiMB/8sQ8fEG4ZYeP2VjjwakIXzvewhOzMeLUZKUGjnGbzpUA3JPatze7cTVyUbXiu9hZLeHCiQqu3bsLs40QSikIIdoRFg0GsXGbPMfk11R8Ay5lT8LPmIsQJtmOO96LGaZCnXlZZrL5wGSoYwBl393Ys3Qs6AzjYlCdhqTDCsD/emjGaBuZjySk6XXr++fWbeosI9B5fgu4LXC2QcOVGC15GA1cjJU8SGGiPK2UUco/OzM8KRB4Lsq+g5GS22YwjjAA0xZEu8GlO29mC4PKwPWkGeOVAK4rwWyZzqZnOgCOLa/0Le+XjXiiPQ70XOkzS2MkJvNXM0NmYWHfNe5OOdNSSq4DLxNphaB2QWScKpR9F2OVEraNlFB2JUYCAzKeFFkGcOZWZZm/KuUlrpAFl5Vpa2XfzYDfXo+twHSOr8RZUTwkUq3yIuUu1ynXaUZLHrZVfIyVPARexkhoQaDVWaav0gylNQQRSo5ElKTYt3sMd1xxHjjXbjpKC1QmRFF3hbe1VbmfubCeKt2v4NPaZgAdKfUxtNPL1q/lhaZSiCzRjdqAIkmg4kuMlByMBR6kIJPtmwnEmboCQhaqJlORLbPcF5Wk8CXwqhdcDiklWknaFn3JAsxZZqsm/WC8GqAa+Jiab8J1yDKeTQo6+W091m+653oAG0mEEd9D4BhXR2aV0ZqBkiswVnZQyoazKc1IM7fHlUDgmNEtpayMwm0XSxJaiUIjSjEyMYrveMkLceO+vYgStaiY0toa3WedFcNa2/ygkyTiqOOwgsnX4fUEPpo1Kq6L8VIJbtY9LHetlNYYDRyMl12ITIzMyy0CFxj1TQ/jkiS4wuQRUVbzpLRGFCfYMVLBa2+9Hi+89kqUfB+tKLbU/py4V6YFh+c6luFsBdCJ49JRKcPTRNi1jpYhtNYY8X1sKwft6NACGAETZRdjFTdzo/JKeGB3hTDmZ32QO8SXRGukSoG1QrlUwouu34dbbrgGE6MjaEWJaTplAWft3Ssyh8BIycNEtYQjp+dBkDZfZxODjgBO1YmqjwO0E+CeA/fOhQkijPl+l2hs3K2JiouxwIFSpnRBZnlB51cJgYuOWiZjcZKi7LvYu2sbLtt7AS7eeyG2T4wjTlI0wwiiqz+NtXNxzMCynC0AOkCWlaw1/6OU9ApeN8dL3umP0Vn7rJkxGjgYDRwwgJIj4EpTFLmnyvClGSOTZw+bcLjG9ZddgBuuuBQ7d+yCXwqQKoVmKzLCsp2RbM3amoKOAkCtlvMnQZD+AhFty352ztmOhglTu9J0oFOaUfEldlS9drW1pGzOeonhCjaAk4nMadbn5s7bXoBrr7gcwvGhNaMVRW0mZc2ataUsZC1YrQDmZpjxb8ioqOti8HyecJj3Yqn4Di6aDFD2JDwhIADEijFWEtheceBIF67jmKiW1gh8H69/2W144fXXA8KDUgrtKQQWcNapvmPvy1YAnZztyFar8UFm9cMAovUAPCbDWUOQQNl1cdFkCa5cyN9INWO8JLF33Ifv+gh8H2W/hJLrgQG8+c6X46brrkIrTtpgY219mtZmasXusSq00kVyooS9ahsbdNrA02w2/5yZXsGMk9n7n5Mh9PmaEyTgS4nzxj240tR5UQY4YyUHF0/42TynrM5KMyqeg9uuvRS7tk2g0QytG7VhWA4Wzcfq/1zRtFds44NODjxuGNbuFoLvzIDnnA2jzzvp7Rl3UfYEFGdD/zRjrCRx8YSXtYlAe6bTztESdlR97JocB0nbu3ujWYEohjC9ivTh4r9ibT2DDmAGlzmNRuNbHcCz9q4WGcodeAJVX0LpbsDxwR2AE7gS540FGPGN9u6VbEOoTQ1OzJa+biLQAcxQeqfRaHyLSL8WQD13vdeabifKVIwTLQacvLxcs3Gndo8GcCQh1aYBebkcgLUt9rZmbaOATg48brPZfIgZ7ySinO2sDZ1lE71KlJkWsAhwsMBwKp6DXSOlvIAczAzXc+D7JdOXxeo5G8rs7draoJO7Wm4Y1v8B0P+LiJy1ZjtKM1LVBTgZwHhSYEe11P4ZEcCa4XseXM+3zaA2nsuEVNmCz60OOjnjkY1G4xe15oeJSGINIloGRAhRqlH1BS6Z9E0IveMZkxW/PXEhOyfBzPBLJUhZbE6ktXWy0AWhFac4PluHkIUaedmQ+SYGnfz2J8z4CebVG0hE2QgWmTfZyoBGZn1yzLQF4LxRr90hkLITseQ5qHjOoiLQ/OOWKwGIhGU6m5AMZUtAATjVtT6tbSLQAdrJg/WvMePvzpTt5I24UqVRq4eo1UPUW7HpTxynqDVamK83EScpFDOiVC1K7GMAFU8uA2SEclC24sDmNQLASrnz9lKcHVtPEz4ZAHme/IUkUW8C4K8IRbMxu7V6iF3bRvGyW6/GTZedhz0TI9gxVkEtjDE138DDz53Alx5+Bk8ePokoVZDkIc0ONUmEwHWWtD7gbNRvUC7bcuXNTnmYbRLWFgAdDUDOzc09GwTVjwhBb2PmoQpDc7/dlQL/5k23452vugnnbRvNpmqahuqCTAvR77n9Wvz78A588J8fwaFnDyBJUwghoZnhCFNV3o0rmgHPkSj5pSzMbtnOJnazrOK8BUCng97SbzPjbRgiDUYIQitKsWeiit/+8e/AS6+9GPPNCLONsP2y2bAF5B2NXSnwo699EY5PXYbP/vM3MTUzC891Te8b0YPMaIXLLr4YfqlshuBZ2yCsxQwqnG9GmKmHZiJEH6mGGdNRNHfaajqbW9Pp1HYQhrV7AL7PTDYfrO0IIiSJwuRIgA/87Ftx+9V7cXKujlSptpAssyZaQmTN0oWAZmC61sTYSBVvfNUd2D4xjjCK4UqJvCdgzmbSJMXll1+K8y+51K7CjSjUEMxM+LRQsae2TGfrgA4yd0oT0V9li2PgHmcASZrif77z9bjy/B2m27+UA90fgjkBozhFuVTCq++4BbvHqxgPnDbgKKWgtcbV116NSy7fZ/M8NjLwoJj+TwRlGc7WAh0NAEnCn+zQdLifW9VsxXjnnbfg9Tfvw3S9CdcZTgMUghDFMSbHx3DLDVeD0xSp0kiSBEEQ4OYXvQh7L74YSZLYsocNKdCY0pWpWhPzzQhy+TydrLCFjwEI0WvWorVNqelkzdzrTztO5QBAV2RARL0oc5wo7JoYwb/9ztvQaMWQKxR3hRCIkwS7zz8faRQibDRQGR3F7gv2wvd9JLGd4rAZtB3NXKQVib3RWxB0HAApM90lBF2RJQyKpVqOQBxFePltF2PnWAVzDSMSnhH1EwK7d+8yY2jHJqGUMgzHAs7GpvREqIcRlNKQrlyO6bCJdOJkhyeg7NXb/O5Vp93d/+RiCCnwhhddmYWazhwYWGs4QRVeZQxJmppRwhZwNjzDEYIw12wh6UoE7UlziOYt49l6oMPZYnk0KzUQvVyrKE1x/vYx3HjxbjTjBKs1dIGy2LpdcZsGdkAgzDVaRZM6p+w127KgIw/DVKILdAl6eZj82r07sX20jDTVlpFY6+tezTUjgBk04Dhh5ml7xbYo6ETR3Enm9qnTdUQZ5/uqC3bAkXZao7XBNlMPiz71pL1aWw90cmsRcdQblRgQApftmcwqwS3Lsdb/FJsuCDpCwDKds2jOOv5sWY4E1ZZ9ghAYrwbQ2rIca30WEhGUVjg93wCEQL+0L2aGUjjem11b2+zuVdbXhKcyrWbRAjBN1R3sHKtCaW07TVjre3rFqcZ0PQQJ6gclBEA5TruXjrUt6F4BINX79ALiVGG+2YLoURFuzdqCuyTQjBJM15pZsWffgy7WWk9bprM1QUcAADMf7LUAiAhpqjBTDyGEpTnWlkGSbF5ZrdnCXDPK2s/ycqADADNhGFrQ2cpMh4ie682DTfTqyOn5LAvZrg9rvZHEERIzjRYarcgwnb5LhWcBxLCRia0LOsx4rMPfXuJjPXroZI8+xtastdcPHEk4MVtHK0r7jRVm03ifDsGUPtiTbAuCjgYAx6FvMXPa/VmZGY7r4L4DRzBTD+HYEb/WlsESIQSOTdeyxmvLg04WjDiy7CFnbdODDgNArVZ7BuBnskXQbmajmVFyHTx/Ygb3Pn0EZd+FsqFzaz1ddODQqdmCJRB8yF6xrQ06WbU5/pmIlvStNU22ND5816NZuwILOtaWmlIah07PAQXWCDM/Y6/Y1gUdLKwQ+lTGdBZRXq01gpKHLz50AI8fOomy71l9x9riBS4EWnGKo9PzICH69SAVprhYPLt47VnbaqCjAcDz5Be11jPo6iLIABwpMV9v4f2fuQe+K+0APGuLzBECc2GEk7MNo/vpZQ83ASBhFscs6FimI+fm5mYA+miWmbwoWVBpjUqlhA9//VF8/fHnMVIuQdlJDdZgdD9HCpyYrWGq3oTriL45OsyYiqL5oxZ0tjbodPja9P7lPjORAZ//9sEvIYrTflmn1raQMTNcR+L5k3NotZK+4XIiAhE/B6AJ2xt5y4OOAiBardpdWuuvkqE7i9iO1oxyyceDTx3Gb3/0a5ioBlB2aoM1AFIQnjk+PTBcnh1sz2y0w9iCztmzbLXQby63coybFeB3P/EN/MPXH8W20bIdF2MNzIxnT8ygSNoNUZ9EVGtbDnQUABGG9Y8x67sBklimYbbnSvzCn34aDxw4htGyb4FnS7McgWYrwYHjUyCnb6M308ZgIfvdmgWd9sLQWtN/WK6NBTPDcSTqrRg/9n8/hGPTNVQDzwLPFmU4jhQ4Nd/AoVNz8BwB1n376Ggh+KncY7dX0IJOznZkq1X/Z2b+GyKSANLuJ2nNCHwPR6fm8a73/gNOzzct49mSoAO4jsTR6RpmGmHW0rb3UwEQM05Wq1Wbo2NBp+cCEUT8U8z6VPb5l6CJ0hqVwMejB0/gB3/zb/HcyVmMVUoWeLYS6IDhSoFHDp5AEiX9BuzpbPrHMydOnGjAFnpa0OleIACo0Wic0Br/lojEclRYaY3RSgmPHzqFt/7aX+GhZ49h20iAVGm7oraEGZB57NDJQQPMGQCI8NAG3RMWdNbOzWp8kFn9BRE5vdwsAEiVRjXwcXq+ibf9z7/Bh7/xOHaMVUxPSlscuqlNCkI9jPHEoVMQskimOt1nr5oFnUGMR46MjLxHa340Ax61HOPxPQeJ0vjXv/tR/MpffxGOFBjJBGZbNbEJXassKfDYTA3PnZyF5/QFHcnMYBYPdawtaxZ0elJiPnHiRMNx6LuZeR7L6DuAEZelFCiXPLzvY1/D23/jg3jo2ePYNlqGIykDH+5auCaNXrOdqLXxQAfwXYmnjk5hrh7CkWKAiMxTpZJ8qtPdsnYWWehGXlsAZBzHp4Vw7xOCvh8LSV203C8EJQ/PHJ/Bh77+KGphjBsu2Y0dYxUozUgy8MlPypLnwJUSmjWU1v3ESGvriQYzo1Ly8HdffRh3P3EQvu8tx3Q0EQlmvqdWm/8DWBHZgk5B4HGUSp52XecQkXhzxnZoOeDRzCh5ZtzX1x95Fp+8dz9acYILd4xj51gFFd9D4Lk4Nd/AgWNTmK6HGAlKmKyWESUpNLMdX7wBjED4nU/cjcNTc3CdZcPlmogEEf1tksSfz/aDda/O+r3ZHOYCSMrl6ruJ6I+YOe9x2/f7SSHQShIkUYKdk6O4Zd/5uOGSPZiab+IT9z6J0/MNSCFw4fYxfO8d1+Jdd74IAkCUKDuBYh27Vq4jcGquge/8bx/AfDMy7lVvpqMAkszpm8Iw/FgGOspeRQs6ZwI8hAG6FRFBECFOU0RRkrW0JLi+C1eaX41ThTSOccd1l+L/vue7MFEpoRWnFnjWoSnNGCv7+Mz9T+Hd/+dDqJSWbeyWz7mKfN+9YmZm5nn00QWtrZ5tppyEBIDTbNb/mJl/NMtYHriImBlKaxPRqpQwUi1jpBrAcxY8z5LrYGykiq898ize9dt/j3orNpTdhr7WpccthcBdTx4CK9XPFc6mP+DRmZmZQ+jqwW3Ngk5RS3Pg0Zq/D0Ar+44DKTOzOSWVNqJxJ6BoZiRKYWy0goeePoxf/ovPoeQ5Nty+Dk2SQL0V476nj0BIp9/BoIkAInw9Yz12nIgFnTMDnjCs/z0zvQLAoeXqtIamUqnCSLWCj379UXz0G49hrFKySYbryDQzfM/Bsyem8eSRU/A9p1/P7Lyy/Iv2ylnQWUXgqd3NrG5j5i93JBCeEYVmZriug9/+2Ncx2+ibA2JtrR0rZviuxD1PHUaj0YIjRR/XCpKZG0Lw13PMslfQgs5qAI8Mw/BIs1m/k5l/s0PnWTHrMSF3F08dOomP3/MkRgIP2vZkXhdGRNCa8ZVHngP6j5rWWUfSexuNxglYAdmCzipaHjpXzWb9Z5nxHQCezViPzsBHZY8hCAtDSIkP3/UooljZpMF1wnI8R+LI1DweeOYYvP6uVTbNkz67RfaBBZ21dvWzP51ms/YJxxEv0hp/CJAgIsewH5KZj58DUH8k04yS7+L+A0fxyPMnEPiunbd1rm8yM8q+i7uePIQT0/PwHdlP6BfMrAH9mQ53y5oFndU9CHN3a35+fjoMaz9OpO/Umv+EmT8I6HsBrhGRzFwwDAIfKQSiVowvP/wsfNex4fN1Ajyff/Dp7IZTv0NIAHi22Ww+BBsqt6CzBu4WARCNRuPzYVj/kWaz/rZms3ELwFdqzW/Vmj+R6QN9s1M1M6Tr4NP378d8owUpLEMfCAqahwZnzYN/xwjIDg6fnsfd+w/B991s+kPvl8xGVH8iP4gs07GgsxasR2eLzcn+pGazeSwM638XhvXvYKbbtOZPZcDDvRYlMyPwPDx28ATuevIQqiXPDvkbADbVwIPnOu18qOXAJE/YZGZUfA+e4/Tt+qiZEXguvvHkIZycrplWFv3XPCnFH7GulQWdc8F6ciE5T4mXAGQY1r4RhvU3APqnu8BqsZHZTH/y+ftNIahdT0vAQGmNkbIP33Vw1xPP48jUPMYrJUxUA7iOzJIxeVFyputITFTLKHku7nv6MI5Mz2PHWMXctB7Abibj5a7VsrW+bddKaz4WRY17On5mbQ3NsZdgEajk7pQEwI1G47fL5fKTgPhIx7WizhO8HPj450eewRceOoA7X3g55qyrlTEV017CcyTueuJ5vPdjX8NXHn0W20YquPXKC/CaG/fh9qv3Yu+OcQBAM0pQ8hwIQTh4chZffOghfOzux3H/gSOYqJbxr97wYrzjFS/AWKWEuUYEIkAQZa6Vi2dPzOBrjx2EX3L7pTBkrSz0pwHUs3ua2qW/tmYP5/7mAkhKpcrbhBB/DbBCV7q8IEIrTnDF+Tvw4V/6fhABmrfmhWUASmn4roORwMPDB0/gDz51Nz5016NQqUI58JEojSSKAQDbJ0bwsmsvwWtv2oebLzsfTxw+hY/d/Ri++K0DmJqtAUIiKHlIlEIaxbjukvPwM295KV570z6kqUa9FQNgbBut4A8+9U38lw98FiPVcj83V5tbxq9uNBpfhK0qt6CzTs0DEAdB5deFEP8hq15fBDxSCNTqTfzLN96GX/n+V+P0fLNfNuzm9FWzotnRcgmHT8/hDz9zD/7yyw+g3ggRlAMIMu5TzlAAU9mfRAlAhB0TI5iab0KnCVzfz3QZhtamf5EQhEYYA8z49hddiZ/6rjtw46V7UGtGEILw9t/4IO7dfxjl5avKNUyo/LkwbFzRwXCsprPGZovcCkgTAGSaTn7NdeMfADDeoQG13Qnfc3H3E89j3/nb8cJLz0O9FUNugdYXSmsQEcbKJYRxij/89D34uT/5FL780FMgKVHy/SwC1el+mWsmBcH3PLiuRDOK4bkOfM/L2GL375jkP9eRePy54/jQXY/i1HwDd1xzMR4/dAq//dGvobR8h0AAUMa1ovenafyZzLWyeo5lOuta+0qDoPJvhRD/h5nTbj2MiIxr4Uj81c+9DS+8dA+m62G7J8+mQ+Ks0HW07CNKFT7yjcfwux+/C08fOQnH81DyHKiucT8EgAQts+jIjP3lpS5bN5BIIaC0Rits4sq952G8GuD+p4/Ad/smaWYHhb6p2Ww+AFv6YEFnY1ynsbEgSJ8moslsES9CFCEIrSjBnokRfOBn3oorzt+O6XoTrtw8hJKzZvXVwAeB8KWHD+B9//h1fPOJ5yEcicD3luTWCEEgEJJUIU6S5R0aQUv63xDItJelBaDLb4iQAmGUtEPm+fN7sRzD6vnuZrNxG2xCoAWdDcZ2fk0I8R97sZ38FG62Yuwar+J9P/FdeMk1F+H0fKPdoXDjgo1xpQLfRdlzcff+Q/i9T34Dn75vP0BApeS3AcnghwGQVGvTkVErjI9Wce3eXfBcuSjFgAFIIsw0WqiHkYlKwczIS5XGgWNTgGaUy/4ilpW/D4D2+xKoV+OulIgcZv6xZrP+R7BRKws6G8QEAK5UKjuZsR+gKpZJCpHCnMCB5+D/+/7X4G0vuwGtOEEYpxtSYFZaw3MkRgIf+4+exu9+4hv4+68/giRKUK6U2kCQA43SGq04AZRCuRzgxkt24w03X4lX3HAZ9u4Ya4NK90KMEoVEqSzvZuHnX338IP7w09/E3U88DxChHHhLwGfpwm6DT3vMjOc5++bm5maARW9hzYLOujYJQJXL1Z8nov+xHNvJXQqlNMJWjO968TX4pX/xSuzdMY6ZetgRwdkASEuEsUoJJ2br+MPPfBMf+NIDmJmrIwhKEEJAM7fzZcI4AacpXN/DdXt34dU3XobX33QFLj9vO3zXQRgniJJ0WcVFCDITgLvgoBL4iNMUX3jwafzhZ+/B3Y8b8Cn57oDFTSCijOXo9zebjX8JGya3oLMBrxcBkEFQeYiIrl7QC3o8mQiCgFq9hd3bRvGLb30Fvuf2a5EohUYrgZRiXd8AIsM+/uwL9+MPPvUN1BoN+KUAJc/NZsIzojiFShJASlx9wU68/PpL8PqbrsD1F+9GxffQSlK04qQNTisZ35PPHBstlxCnCp978Cn8v8/di/sPHO2pAeXXPrNMu9G3NJvN+y3orI+T29rwwKNcN7iHiH+kC4x6aiFByUMtjPHxu5/AY4dO4tqLdmHvznFESbpuh/hxxtaaUYIDx6bgey4UE6bqIVphC0mSIkkV9u6cwJtvuxY/+5aX4mfe8lK8/uYrsHOsiihVaEYx0uz7rRRwOvWhME4Qpwq3X3URRssl/MPXHoHrOh0AL0CL30dl9XP/1Gw2fg02YmWZziZws36MiN6fuVmy3/Vss55GhLFqCf/6jS/GO19zMyold1Fa/3oDHilMDo7SjFNzdTx+6BS++thzODlXxytvuAy3X7UXO8erSJVGoxW383bO1ndhZrhS4u3/64O4Z/9hVAKvn7ajiEhqzd8dhvUPwwrIFnQ2uOXRrH8thHhfFiJWg9ijFAKJUmiFEW649Hz89Jtvx50v3AelNeqhSShcbxNE87ICV0oEnpv1hTbJe40oRpIqEOiszwFTWmOsUsKn7t2PH/s/H0Kl7PcFHIAEs348DBs3YKG7gDXrXm1Y0wCcNE3udl3nMECvBcjDwljjZU9qIQhBycPhqXl85K7HsP/oaVy6exKX7p6E0ow4VZmbsD6+aO4eaQBRkiKME7TiFK1ELXJ/1uKEFCTwC3/+WRydmofr9u0OyEQkAPxSksT3wo4MtqCzmYAnSZL7XNf5BEA3EdEFg4AHMHklniPheQ4eefY4PvSNx3Bipo6r9+7E+ZMjSFLV1kPWEy3OXae2TrOGbGusEuAT9zyJ93/qblTKpX4sJ+sOyM80m433YOge2NYs6GwM4Dk6MlL92zRV/wLABLrqs5bTTJjRrhn65hMH8Y/3PIn5MML1F+/GtpEywjgFM9ady3VOdAACfukDn8Ox6ZqZsNoHo4yArH8tSZKvwNZZWdDZpMDjhWHYdF1vnIheiYVJFAMtLxkolTw0WjG++vAz+NyDBzBRDXDd3l3wHIEoSdtMY6uZ0hqjlRI+c//T+INP3o1K4PerscqqyXHK85x3RVEUWZZjQWczH8bacbw3EtEdCxS/uJnKa4Gg5OHUXBP/ePfjeOCZY7hszzZctmfbgt4jaEtFAHKw/cU//5zRcvqzHE1EQmv+L41G7UuW5VjQ2dTsH4Dvuu7vZO4VUDA6mGoFZm4ntmlmuI6E7znYf+Q0PnTXYzg+U8O1e3dhz+QI4lSt2/yes8NyAnzm/qfw+5/4htFyBrIcfrbVavwwbMTKgs4mNgeACoLqu4UQP4g+ofPclcrdpLwBOWdgwx1VR8xAKauevueJ5/Gxbz6BOFG4/uJdmKgEiLYA+ORZl7/4gc8ViVjpLGL1c0kS3wMbsbKgs8lZTsXz3L8GMLYcy2EGKpWyqZ5O0wxodE9g6mwNQWRC7I0oxpcfehqfffAAyiUPV12wHdXARytJoRmbDnzyiNVnH8hZTpG8HH4kDOv/Got7XluzoLOpzIXJTv45IvEWLIy3WXqxpcDExBiCoATHkWjFMZRSbdZDHQ8z94bBrAHO5mxJiZLv4dR8A5+8+wn88+MHsX20jCvO246y76K1xpEuzv6T8zNm0x867ww4+LHwOkse2fdIlcbP/r9P4dRcA67sq+VkeTn63UmSPIGsK4Bdnuv3lLa2crcq9f3Ry6TUDwIIssW+5LpqzahUAoyPj5g2EEJAKYVavYFarQ6ldc8pEnmLhrwWirBQx1RvxWBm3HH1XvzY627Ba15wOZgZtdA0Pl/NdqkMgHUOL1mejiBIQZBCgAjZn5Ql8REWNczpei3KmEzeN7kXy5moBvijz9yLn/nDjw9quJ6XO3whDOuvgS3qtKCzCa+ZyB4JgKBcrnwJELf2mhbRaZOT4/A8t0PXAYgEkiTBfK2OZjM0gnLHLhQkIJYZaZOXHdSbEYgIr7tpH370dbfgxVdeCAJQCyNoPnPwMU3XJcq+KYFQWiNKFJqtGGGcYLbRQpwqTNdChFlF+dGpmmFngjAfRjg91zCflxdqumbqIWYbrZ5uoc4G7X3rueM4OVuH48jl+h93iMX6RdmoYGFBx4LOZrAcaNoFg6VS6UIi50+FoFf1mhLRqdH4vofJyfGeGycHmWYzRL3RhEktybJ/hYCg/pF3KUwtVL0RwXUlXnPjZXjby2/Ey6+7GK4jUQtjaK0hxHCtNPJ2FKPlEqZrTdx34AgePHAMz5yYxtGpGqbrIWphhEYUI0014lQtzJwqMu3UoG4fesXwfReOlP0arnf3y7FFnRZ0NgWr0R1OglsqVW8VAm8F+B1EYls/wMlBZ3JyHH6faQVaM5Qyh3McJ2g0m4jjGFLKZUFHaQ0NDYckiIybo5nRaEaAINxx9V786GtfhJdddwnKvot6GCNWCrJArZTSGmXfhdKMP/38/fjrrzyEA8emwUoBRCAhIKWAFHlLibwGK3efii4tXvanhFwj6hsiJ4CniXBto9E41fFzaxZ0NpTlANKm6OVy+UZmeisR3gLQ1ZR1y8OAJEBmRqnkY2JirN/mgdYaaaoWMZ9WFKHZCPsCQx79IiLIrJ9Mm/mEEQiEF1y6Bz/wyhfgtS/Yhx3jFYRRgjBOlq0MT5XGeKWEZ47P4D/8ySfxjceea094yMEkD/MD3C+EfbYt13J+Igzrv29ZjgWdjXgtZOeiNf2Q6TsB/kGAXmrmJuUxm3YuzsBruH37BBzH6Qs6aadr0mFzc7Vlx+QqrZYkyonMJSMYkZcBNFsxdKpxyXnb8KZbr8ZbbrsG+87bBs1Y1AMn/3w7xir40sPP4t/87kdxcq6B0YoprtS8roJBebnDQ2FYvwkLEx5sxMqCzoZjNaJUqt5BRD9EpN9MJLbnJ3sGSAIFyxu0ZoyPj6BSCfo2Ec9dqm6dJ44T1Gr1ZV2hPJO5pwBFYkm0qxUnSOIE4yMVvOL6S/C9L7kOt+y7AGOVEqIkhSMlCMBffPlB/H9/9QXEqULgm9ak69BSInKUUj/fajV/HYAPI+xb4LGgszG0mkqlsgvAO7SmHyTCCztO/jYYDXO9tNaoVMoYGxvpy3AAM/8713M6QadeN6JyL9BhZsRp0t2ecymidgjReVuKRCm0WjGEFLj6wp34zm+7CrdfdRGOTM/jw3c9is/e/xRKWaRqEFieQ1NEJJn17zebjZ/ocZBY8LGgsy6sRwSq+lIi/iEivJlIbF+J+9QLcIKghImJ0UJ6R5IkS57HzJibq/UELK0Z1WoA6UjMzdWQpGlf8DEir2yHpgmAEALMjGacQCcpPN9DnE1qqAZ+z8ma69ByvfmLAP5Ja3yx1ap/o+P+WvCxoHNOwYZy1jIxMTEWRcn3AvxOgF7SwWqGcp96sQ9T6hBgbKxaCHCWYzlh2EKzGS7DcoBt28ZRKnlIU4VGs4larVEAfBbE5k4NiIiykHpeD7ax9mj+fcw95MeZ6b1hWP/jDvBxYBt5WdBZQ7BBdtrB90cvE0K9m4h+gIguzBbqGbGanHkQAVJKVCplVKtBIbeEmZH0mAPVj+UwM1zXxbZt41mpANrZzY1miFq9gSTp73Z1is2bxHJAkQaDCFrzQ0T6t5rN5t8AiDuYj00atKBz9plNqTRyu5T848z4XiKqdGk1K6o/y1mNlAK+7yEISvA8d1EUaLBblS557iAtR2vG2FgV1Wp5CbAZ8NFohiHq9QaiOO4LPkY43nRLIHenpLkX+jGA/qLZ9H4HmJ7vPoisWdBZje/TDnuXStU7hMB/BPCdXS7UGbIague5CAIfvu/DcUS7yLGoLQc4URSjXm8sCxRSCmzbNtFXPBZCQOscfJpoxXF7gmbnezliU9f7doEPP03Ev9xoND5oXS4LOqtlbeps3Cj9n4jww9mCy+tzxEq+c85qHEfA932UyyW4rgsirCi6k6bpkt8jIqRpivn5el/AGxsbKey+5WJx2GqhXm8ibLWyaRRis7Kc5cBHA3Ayt+vjQvAvNhqNhzvAR1vmY0FnWLDRAHhsbGwijtN/R0T/nohGOsBmRUd6rtUYVhOgVPIg5fCsZpH4oBRUV95LDji1WmPZ12VmOI6D7dsnhvc1s0LLKE5QbzTQakUgNlXgW6jnsoZpfyGZuQXgD4j4fzQajRMd68h2GrSgU1i3oXK5+iMAfpmILu5wo5zhWQ3AbIojSyUfQVCC73srZjXdIJamac+fz8+bzOPlQMDUb43B9/0VA16u76RpijCMEIat9udZz+DTXXl/hqZyl0trPkGEv1RK/G4UzR/oWFdW87Ggs7xuU61WX6Y1/gcR3X4mmk3eWMpxHASBjyAI2q0xVytfpVc+DgAT7s4iTsuB1chIBaOjlVVJ1qOM4WjNiKIYYdhCFMVt0FsvAJS7gq7rII6T1QSfNgPO3O86M/4BoN8Lw9rd3e66ta0NOot0G8fR/5kZP5QtHIWFTOOh9RrXdVAulxAEJcislcJqJsctl4/TarXQaIR9AadUWr4txpkDELV1piiK0WpFiOM02+DnhgF1amjVagWO42TsrNUuF1lF8FG53pO972eE4J9rNBrfgk0u3NKgk4OJAuCXy9WfAvALRDSW6Ta8UrDxfRflcoBSyW9Hfc6GDZt1nP+757mYnBzLQvFn8QLnbSmy3KEoShBFcSZ66/Z753t9NcGoux+0lBKu67TvSSfDSZIUrdZZAR8NQBARMXPIjH+fVa5b1rMFQad9wyuVyqu1pt8Qgl64Ut0mBxvPc1GtllEq+aui1/TXchbaVnRurmYzRBi2lq2tchwH27aNtzfemi2KzMViNj1+0lQhTdP237XW0FovEcRX+j5CCEgp4TgSjuNASrFsvtNZBp9Fmg8z/63ryvfMzc3NwLbN2BKg02Y31Wp1u1L0q0T8Y1nb8qF1m05mU6kEGdjQmhQ09mpbwQzMz9eglO7ZPI8I2LZtcEuMtQOhBXcvj8AliQEirU0D+fxzLk1apPbrCJFVv5NpAibyvsodF6HI910AnwRhGCFJVt/tyjoSPgbwDzWbzfss8Gxu0GmzmyCovoUI/5uILmJuz2sRw4KNYTZrCzbLuVaD2lb0yzpeL5ZH+Qzg8LLu0iAgOFNAzVlSHMdoNJqrzXyyVqjcIOL3NBqNv7A6z+ps7vUGgk7ObqT0/q8Q9GsAxjFkVGoBbByMjY1gdLQC13WzzbKWm5N75uW0WhHSVC3ZHKa2yslaYqzj04rQwVBo0ViZtdKehRBwHAmiPBAQwHWdzPVTqwE+bR2RSHy363pIkvhLHSzcAs8GB512fkS5XH4dM320o+H5UJ9Vaw3HcTA6WsXo6Ag8z1lzsOlk6r2yj1utVs+8nLxKvVTywBtgSVM+iqbtKq3Ne+baT7d5npOlOzht7SkvXTmDdckw00Nf5TjexWkafxILHQks8GxQ9yp3p2QQjPwqEX4uu5dDCcVaM6QUqFQClMsBpJRnLRo1DAB2i8jA8m1ImRnbto3D87yN0M+m771Yzv06M4ATPcFmKQuiLBlTtduE5BMxzsRTJiJXa/5UGNa/B0CIhWZw1jYI6LQT/Txv5ErH0X9MJO4YVrvJF3W5HKBaLcNxnHMONv1AR2uNubnashtr+/aJdq7QZrDc9coBaNjvJUQuQIsVARURkCQKzWaIVquFNNU9G9IPqfPcIwTeWK/XT8GG1DcM6OTUlEulytuFoN8lonFmLsxu8mxh33cxMlLJRrysr453w4BO3ipj+/aJTV0Tld+fhdHCvAxYGL1oNS7FQgmIAZ9mM2xHDldwrVMicrTmh6TEnRnwWMazzkEnDz165XLlvUTiPR09bmSxzWxcqZGRCsrlYNFiXl9uhgWd9WZCEJTSCEOTDW4E/aHBxwLPGWz+cwI4IyMjVyrFf0pEL87EYlEEcHJgqVRyV0qu5+bh1tap3kREqFYrCIJSVvwaIo7TYcDHYeZECLpRa/0hAK+BmUZBsOJyX1vL6FU72a9Sqbxda3yYiC7vcKeoyGJxXQfj46OoVssgEute98i1jO6fRVG87ClcLgeW6azRvSEi+L6LICjBdR2kqcrcLiq6f1IicbHjeC9M0/gvsf7SULYs6LQTqsrl6v8iEr8JoJS5U06RxQEQRkbKGB8fXRdZuhZ0NhP4mD89z7SdBTBMkqEAkApBV7muuzNJko9joTGYtXMEOrmyXw2C6j8IQe8cpiJcaw3P8zAxMYpKpbzhIjoWdDbWvQKQsR4XURQXbachACRE4sWO486maXKXBZ5zBzoSgCqVJvZ6nvMJIeiVzJwUcafyBVCtVjJ2szFDyBZ0Nib4uK4D3/eRJElRd0vAJBC+XkrvS2kaP4eFboTWui7UWQac0l4hki8Q0S2ZfuMWYTdSSkxOjmFsrLoIhKxZWwvTmuE4MkvUdIsEKwgLcwz/plqtbscKWq5Y0Dmz180Ax/lCl2A88JSpVMrZMDnfRqasnVPGQySyNrFukYNPwITSz9Oa34+FYQDWzrJ7JQDwtm3bRpTSXyYSVw4DOHlx5tluWmXdK2tFjUggCEqIoriIq5UBj7jWdZ3nkiR5AFbfOatMJ6eYFIbRPxCJa4oATg4uExNjqFTKWbq8vTnW1hPjIUxMjEGIQtqiMKU89L+DIDgPJpBiGc9ZAh0JQAVB5X8S0Z0donFfwCECJifHEASldVMzZc1aN/BIKTE+PoICKWUCABOJCSL5WzDajqWuZwF0JIC0XC6/UQjxs8PUUE1MmNEqFnCsrXfgKZU8jIwUaq4mTWoI/YtKpfIqDFHiY0Gn+Ovw6OjoJLP446xZ+sBpmsyM8fEqSiXPAo61DWFaM6rVclFhmQBmrek3YHvvrDroEACdJOrXhaBdKKDa5zevXA5shMraBjPC6Gi1cO6OEHRTuVz+AZzBtFkLOkvdKh0EI7cSiXdn2cayGE2tWsCxtiHdLM9zix6YxMzMTL8MwIeNYq0K6GRzp/R/LRrlFUJgbGzErl5rGxp4qtUAjiOK7DEthNhXqVS+N9svzla+dmcKOhKALpVGbiOi12cd/+Qgt2pkpLJhyxqsWTOgA0gp2ykeBXHqp2B77qyOpiME/1Tm3+pBV91M1CxZt8rahjetGUFQKnKASmZmInpRqVR9Kba4tiPO8HeVSX7iN2YRq4EXslqtwKYsWNssJqXJVi5A2jVAEAI/sdWv2ZmCDoicdxCJCkweAvVnOV7Wx9iyHGubxc0ybKdAo3eZHcyvr1Qqu7CFs5TP5EtrAzL6+7L/H3jVy+WyXaXWNhnoAK4rs+TWvocpwYwqHmOm71xNeWOrgI4AoH3fvwigF2TMRfQ7DUx/EteyHGubEniCwC86tYKZ8b0dB7cFnWF+Twj3DUTkwUx2oH43pVTyz2TWkDVr69rF8jwXUg6UNKXRk/HSrBB0S7a+WOkXzugKf3uhNxEE3/dt5bi1TWtSiiLNvnIXq8wsXrFVXayVfGGCEcEqAN1c1LVyXce6VtY2tfm+V8TFYgAgwp2LD/CtYyvJjBQAVLlcvhzAbgxoychsuuwTYUsynV5jdAeBb69/ZwDCNvZat6a1cbGEGDgWSWT/fFu2/7bcOOKVgA4ZpKbrAKJBLSyIAM9ztxzgMIDTU9NI4qRHYeBCN8Huy6I04fjJ0z2BKCiVsG1izJYqr1sXS8J1HURR3K8YlAAGEV3ueSOXxnFtP7ZYlvKK/UmtcWVRX3erlTwQEZRSaLUiaGZorbse3AesGEppKKWWPMJWC9q6qOv4viObyTZYniAi6Ti4/Uz34VYBncwnpUuLuBaO4xRR9Tct+Kx08RLRoocQAkTUHolrbT260oDnOYV1HUC/eCtepxWDDsAXZojeN1Tuug7sHlmtRc0wNbXW1q+L5RTtswNmXJ07DhZ0+lNDDcAF6Lyc9Jwh3bRmbdMcClKKIsyesmbvl1x00UUltLP7LegsBzoAKpMA9iz+WW/3wnUduxqtbZ1TXAhIOTCCle+ZXfPz8zsH7SMLOgDKZecCgCro0+W+E/Vtfo61rWJEyNZ8IZnCa7Vae7YcMK8EdIRQFxfxRaWUW1r0XCnYsvH3Fz9gRytvFHOcQoETne2NC7Ya01mR76M1rs6S/Xj5DZeDztZLCsxnJJVKfpans/TaLAcg+TDsXq/peS6IhAWfDeBiFTxbwEyXWdApcKEAXF/kyVs1VJ6voMnxccRxjFSpJQDSbDSXXbCjoyM9GaL5mQWcwS4OtYG+H8CfnQPH5KYV7xfeBp2twwSHJTkAqCPUJ/rTzK09SVWILL9GL55/zQNmfOU5Ob03lJ1OO0hTCcMW4jhps03XlWvaHlcImd2nwWIyczvJdsuEzYcBHQLAlUpll9Z86SBKaBLcxJYOl7ejd0SLLpTWuid4mBHLIsttsslNKwH5RiPE7Ox8vlxRrzdRLpcwMlJZQ9dawHEEkiTtWw6RMbBLYUbTRFvmPg37XCHEpVl7Uo0B4XIpxTnZ6Outb4+Fj7VzbcIwaq8Bo60w6vUGTp+eQasVr9kadByn0H4iot1jY/75K9iPWwJ0CADSlG/MwFsP9qvXbrvl7xWGLTSbLbsDtyTocM/x1EIIJEmCMGyt0Vo0mclFmrUTkZskct9WOp9WgKx8c1EQIKI1EfGIAKUUpqZmMDMzj5mZOczMzNtdaG3RemTWa6btuG6xsHn25/UWdHqbyjb4jYMad52LBRWGLURR0qbVrVYL9XrTtki11t7PSmloffbb1zCbXB0pizZNFjfkf7Wgs9i14tHR0UlmDKSCeZ7KWrlXzECaqkUAQ0SmtYQd6mctY8PG/eI1WI8MIUTBhl4MADdioa5x05+Sw4AO4pivJKJx9Cl/yEHAdZ01ZRndvnze0ybu2UTL2mZ1ofoFL5hNr6I12VhCQEqn0L4i4ksrlcpOy3R6PI9I35pt4IEcdS0LPZc7TbTmDHTshrS20BpkrXRG15VFGnppgKppWiz3bSuBTn6Nbi56wQsWva3iYur9OeI4tq01tpALNWjdKaXXLEPZcQr1ktImxI8XDJItthLo5NMfBBEXmv4ghEmOWqubq3XvhURESJIUaZpaF8ta37Wy+gchhk3yvGmr3IOiTId9398Lkz05EI0dR0IIuYYLia2LZQ3A4Hq/XEw+28AzhJicDzp4QbYfN/10iCKgIwFACPcFRMLPLgqtAq1cRdeq/wKyLpa1tWY6Zs+IIm0u8gjWvlKpdD4GjHTaSkwHAN2a7/NBz1xbEXlBIOxdmQ3EcWpD51vAilR451HOtVgPQ06HKAnh3jj8vtycoJPFGPUdRVyrvO5k7URkjUGfRylldZ0tYv3ucZ4hbw4qvQZrszDrz3rr6Fu3wj0aBDoEQE9MTIwR4dpiIjKtaYvS3L1aydRMa1sLdBaYsV6zQ9F1CyXJkvk8bW9iU7e5EEX+vdmMXwjQJApkTAohi3ZOWyXXauFhzZoQ/QuNFw6os5+dnGfmF9gPlJGdGwBUsMkzk4swHUhJL85upB4EAq4rsUaY0070sl6TtWGAwOg6a9OFseB0CAGAibAzCEavHUL62JSgkw/Wu63oCxboI7KqTAdY24iEtfUNKEVaquRrZR2JyYARkwlQt3Qe+FsNdPKkwAozfVuRyvK1FpG11oXEYVOTI+2u3AJWZD3kYKP12kgnw0Rziegliw/8rQU6AgCCILiWCLsz10oM8qdNXsLaXi/LcqwNe1it1drJI1gFip9l9lm+DbjZRYF8uM3KdCCEeGkxPYezHiJrU3PVGbGyOTjWFg6+wRpKvl7WYlLEgphcGD/2et7+Szazi9UPdLLcAdxW7OKuv0xka9YGMeO1WEOmUbssUg6hiMhxnPae25Risuh3AQD4AN1ctFPgWorInexmkG/eOQfJ2lY3agceiNZSTHaLjhoGM798U7PRfq5VuVy+CsBFKFAPIgQV6R+yqqdVEdGwM6JhmdEWgBSiQsXG+VJYuzYXhQIZWR0W3w4zHirdSqAjzA2hl5gw3uDK1zxCtDZtA3jNKbK1zQJKS9fP2U8SLCwm52NpLh8dHb1os7pYoh/NI8Jri4KA4zhrFpbuBhkrJFsbdv3k6RZ5sfDZfj/T7qUQfigikkmib+r0OjY76BAAtWvXrgoz3ZJtcDkIyU2NyVotGrtxrC3PZEz0qujBtVZjkgp7AtmBz6/cSqAjAGB+vnkdEe1BwTqQtRWR9ZJTq59JKdasHsza+gCeou75WonJeQ5bAXwT5vPR7Tnz2SpMh4TQLykyyXPhgjprKiJbs7aaa2gt1lTBzORM18E1IyMj+7AJm3qJZegdM+PlRendAorzmi8WC0LWljJbOfQ6WisxuaAEoYjIVUrd3mefbhrQIQBq27ZtI0XrrXIRea3cl25XKqfKtkGXtTNdR2f7sBwiYz/L16FNma8jev1/q9W6WQjahQJ6ztpnIg//fKvnbCW3ydzvIrrOWrPlhZ7JA99LZMmLt8MEcVJsIkG5F9MBc7vStVAscW17Ii98pIWQ54AmtJYFbSkrVmnemzGf3c9VuM2FMMhEl3neSKEJLBsZdHR2Wry66Bc1mcjOGhZ5nhnzsbb5zTAdWtH6Ots2xAGticiRkl+1zF7dFKBDAHS1Wt0OcOF6q7wd47kSka1ZG5bpEFHP2VfrKDMZWEjQfWXn/2820BHmwtOLhRAjKKTnDJVpeVZAp0jXQOtebR0r2j2wzz4/q59NykLtS4GFeVi3AvCwifrrdDMdAPyaTldrEHKb0alr82FXehINmoVkbfMxnUHnoNZ6ia5j2M/Zd/0KRrAyXQcXBcHoppqH1fklVIauL10MQv1uLuC67po37bIul7X+G5tAtFKX/+yLyZ7nFn26IiISQhXekxsJdAQA9v2xi4jouqJ6TsGxqavmDxd1uaxZpjPI5c9nmne7YWtREuG6blHmTcyA1nRnUe9jo4EOpNQvIyIPBfICFic7rYWIrC3oWBsKeNbShR/m8BxCB83mYfEtAEaxSeZhia4N/JphLt4QiL0q7tVyvvkgOmsnQWw1wEEWUR0EMHrN3au8Z3LBsiEBEzrf5vuVW3rt2Y0KOpQxmxIRXlbUtTJ6zrlpT2qZjrVBttKDZp0lCSIDHQhRPHduI4BONmpm5EYAe1Fg1AxgTpK1EpH7sRkLOtZ6g85gQrDc2lmLsTRDRH0FM0BEOehs+FYXbdAhUq8qMmomvylrq+cs/znWamCatY1jReuvlls7ayMmO0V1p3zO+fWl0sSF2AStLsQCcorX5H2NitzUUsmHlHQGiVjDLCI9NCB1U21LiLaWrbQUYtB6W531vNDet8ChnY+mCaSM7+jYtxsadDRQ3c6MWzJELeBaEZrNFmZna2i1WkjTNPNVKcuRWF0g6sd01nNbi/w69Hqs6PcslhTe1Pk6XAnTWYshfEPWLLL5vPTazv/fqOYAQBDQ7UJghJkVBvRDzi1NUyRJCqJ8hrmE4zhwXaeN4iYTeGHm1ErGfiwn7BERlFLrVtMhouwaJVCKl5ykPRMdAWhmRFG8ZMMwGO4a9i3a6Jbn6iilVgxcZ/MwYwZ830Oz2Sqo6zAAfik2wWgax9wg/bp86sxwp/jC/ydJijjOGY9BciFkW/vJ/8z7FS+c4Mszmn6AM8yCOBdESGmNk6enkKaqJ0PJPz8v+T2Fk6enem4C3/exe8c2WE+xOMvsBx79DqyzeZjln833vcJ1WACYiC4vl8vXNZvNBxe8lI0JOi5zu5JVnNmFXAwgaZoiTdM2mOSsSAjRnjnd+WcORqYK1/yZpktZgTm9CHGcDDyR8tdd6wWvlYJSekVu0XLfRykFbbskFr6GUgokyfAs2rgyjNVI7+pm+lprJEmCOE4Rx/Ew57wiIocZdwJ4aEODTrk8dj2g9hXVc1ayebr3iFIaSikkyWJ2kz9v4ff6n1BbqU1pfmprrbMcD8t3BrHbfBTNSpbIMHqhecpicMnvlVK6ffgmiYJSKpMFFg7hol/JvLa4E8BvYAOXRDiAep1B0OJ6zmosiDxI1u+a25YVa0v7N5v1SxDsHDPdrTkud/D1kgKYNZTi9kGapmrRn6b1ymKm3+0VFLRc17lldHR0cn5+fjrbRLwBQYd/gBka2JxSwVqE9K2tTxvkVmvNSFPVbqqVrxWTp2O2hBGjddu9ZV4AmLw9hta8qClYJ2NfIcAsx3S0EGI8SfgOAP+IRSkvGwh0mOkoEV1jvgDn4LMpipU6GzpZhrDVGOHgBEFmRq1WX3JAdWs9C+48erKeHFjW4HDT5u34dRnobMjTVIRh/U5m/m6Av0FEgohywEmxSUrprVkrekj16kSZg5GJyC7ORVtjFi2YmZj5lRngbMiSCAGAwrD+4WazfpvW/D3M/IXsQjtYUMjTNt+0NtQiXu5xNn7P2qY3ApAIQdcEQfAibNCSCKfDnVJhWP8QgA+Vy+WbAfE2AN9NRJdioV9rzoDERvmy+am0lhuWmeFIiZGRKuIo6kn9l0taIwCO56I70M7M8Dz3DDribcEdunmkPJ09HCJyAT7G7DjZctlw37L7A8suRlOuVCq3M9O3M+PVRLiOiORGWfQmoc7D5OT4OdmoWjOSJEGqFBiLNYJGrbEMSAqMj48tS9uFINsfqBDgmIzw06dnNixR7pA3ZHZwzhLhjwD+jUajcRIbN3q1yFSH2yUANBuNxucBfB4AKpXKtVrjJUT8owDdXITetcdtcH51eMsUX3aKi6tROZU3p7K2eT3yLqCR2SH1rNb6z5nV/2u1Ws93EIYNuZOcAXSO0NHoq9FoPArg0VKpfLWU4kVZbo9YnmkA9TBeOKEz4U12FYUuigT0uAvgjn/ghT/WO+PKa9KWMiANItHzehGJYdoeWNt0BK0NNHVm/Rlm+mAY1j8JoLGMN7JpQKdzz6tOuQEAC0EXD3QtmFFyHbzihkvQaMWYrYeot2I0owRhnCJVClFiarVSpRfvvK7jvRNviABBBCkEHDmo+bZJECOyk0CtrXuGQwCOMuuvE+EjWqt/7mA1+V5V2ARNvJwhL4zKUHayX+8dIoJKFSYmA7zrNTeDCEiURpwqJKlCsxUjShXmmxGYGdP1EKwZUZJiptEyzMd0S8NMPUSUpBDZyR8rjShRmKmFODlXa//cmrVzRk+6DkcQwJqLUhENM/XhPUHg/fX09PR8x7/Jjuekm+V6Ddvk2Hg7TGNtqaLPE11HohUnUJrb+kbJdVD2XeNmEQEZc2nrHrSUMXXevVRr+K6Dv//qI/jrLz+IkbIPpS2Nsdb78CsSuRRZch/3ARVGt3vP7RorxYBmZTKTmcGaUfJdSKIiwKOz9JQkAxy/43BXm/G+DAM6BIB37dpVmZ9v7MhHLS/3RKU1xoISPNdBGCdtjUIxQ6Wc3bbFNxI9HNVuIqM1w3ME4jQtvPCsbUF/pSMbXWeH3nLWjBLT0It6aLPd3n4WGHGkhCSC60j4rkTF91AJPIwEHraNlHHf00cx2wjhCFGQ8ehbAfxJBjTpZr43Q49zaLVaLsD+wPQABgJ/6bB46vgPLfphcehjBmYbLaDASWKjPdb6naKpZtxyxQWYHAmg9MJYKcKCLjlRDbKWIsC2kTIEESqBh8Bz4WfMveQ68FwJQYSxSgl/+Ol78OGvPwpvMBPPV/8NWBy9sqCTMx1m3kZE44OBgTFS9tHuK03L48swzhGRYTu1ZmRYjPWsrJ2B+xWnCV5xwyV42XWXoB5GHa5+Hrigpe4+0C7wZDYulWZGonS7jOKFl52HT9zzZPv5/T6GeR1xGYAqgDo2cDj8rDCdNE2rMOPpB16UbdUAgSsQtqh9w3rdg8Uhc+rrXiFz3ZpRDGE9J2tnSHVYM07O1NEIY9Sb8RJmviwv6fxrJiITACkEEqVx8c4JXLB9DIdOzcJz+w4GyLoC8qTnVffGcf0xCzrdnhHRTmZCVpEul30iMy7dOYprzhvFqTkHnFHZRDFSpbO/m14jidJZ3o0RijspUNpFTYUQiFKFWjOGHOAvdzZysmZtOVNZI/f8sVJXbeFQZIyUPVy2ZxLPHJ+G7w1suqaJSEqJywE8hg3cFfCsMB2lMDlIJmEGSAhMVktt4VcKgR7BqUWUlXnh74IIjUjh6ZP1rjYCQJSkCOMUViO21s/yVrh5e9vlbKYeFgKTXnKACa4ubn2hNENpxr7ztuFzDzxd5KOaqAzxNQA+ZjWdJUwHe7Jku/7qmBColNy2S7Wca9V9Y2WGJKJH8yNm8/MoUe3cHVv8aO1MXawoUctO5+glArd7fRPgiCxRVRAcKeA5Aq4gjJU98NXn4U8+5xQe3seMq7bCJR+a6RDRhUXoqu9KTFaDLBS5/KnR60YzAEFAkmpoZjhZlIrBhgFlyYWiwPwoG72y1m+xERHmGi3DsBe1I2X4jsT2ca99WLpSQGR5ZY6kdmmPKetZyDfj7NC8dOcYdo5VcHSmBq9/X2syJTB8Wb6FLOgM8TtEgFKMsYqP8YqPVPOKix17HRCCCM2Wqdz23cGTO22ejrV+B5wgQjNKkGaTOxb9myDsGi0tUXXzekDOqpjbemTHYkxYYyTwceH2URw8NQff7VuKk4d4LwYQAAixicVkscJ7NYAmGh3Hd89sakGs9JJ3FoIw32wtWSTWrK3k0KGMOaeKFx2NJpyu0UoUUs2LHirPPF6cLN+OYFG2Vl1H4KKdY4BmFIyJ7SiVJnaguGOwZUCnqH96xnpLrxwHAlBrxYUrOC0wbW3r616zabzeaMVoJQmEWEg2zZMDU21ceuoGlQJnMxHhwu2j2VqlQaCjAfhAcqEFnRUwndWypIvpZBI/amFU6K4sDO6zYrO1ZTZAFg2N4nSRRpiDTqIYK8tBJSjNuGCyCpKF0tp0tl4vtaCzQh3IKPxn5m93M50sJRpz9bBQCYQ1a0U0nShJUW/FBnQWTYEAkhXOQjeZ8xo7x6vw3GEiWPqyTQ/0K/idE4PcKiEI9VaCWhhDCgIPCQ85uKQ9ThlmRhgXL/a07pW1/kyHkKQatWYMQUuTTaN0ZTl6BEKiNCYrJVRKrgmoFFuKF621R7HuQYcZp4rcyFacohbGKw5Zm9yepSCilMZsswUp+nPexTOv7Obaipa3d+17/8mU1cw2QuOKdz03SY1gTCt4b60ZI4GH0cAz7V0G6DrZqOHLLOgs0XLU0X4NvHLQieIUx2cbcMTKijKZseRGERFiZZqACRqeQVnbisBDBdYaY7YeLh4bnAFHnOoVB0S0ZpT9rEpd6wJ7kcFMewC42MRlEEODDhEdzf66rDpGBLDWODpVNyfN0NQU7crd7teNU4VmlAwx2N6atcE2U2/1XD+J1lArPNs0GK4jMRp4S5IP+2yzbcDoSMdWsKBDRIeZudH/gph/evr4dHZKDHnXyGQ15z1M8tNICEIzStGKUxPeHPCyZqysRR5r/Ve1EAKzjdD006HFC1FpU4S8kmXEDDhCYPtoGWAuhCBENOZ5vN2CTgfjbDQapwE8v5AC1ZuuCkfiyaNTaEaJKfYc5k2ycGM30xFECOMEcYESCGvWANNlYNB6E1kpRJLqJZNJVNYNYaVZ9USEkucUySvLcnVIeB7vsqCz+PmKCE9mN6en36mZ4TkSz56Yx5HpGlxHYtg2xqZJ0uLFIYnQDGPEqSroXllgsprO4DUgBKHWihAnKUTHaKA8ipqkK83VMS7VrrFKv+6+i37BRO35fAs63X4T6L5BT3SlxHw9xLeeO4mSK8Gsh1goaPfaoc77R4R6FA/seZtTW+Ne2Y1nrf9CEUSot2I0WknWuWDxU7qTVIc11ym8zdgcuNi1mS/5sKCT9/34Wt72ZtAvfO2JIyuKMS3XYbAexkVaQFqz1l4zA90rQQijFPNhlorRtWJXmqsDmKbwO8fKgBCFo61CiPMs6HR4PQDQaDgPMOsZ9IlgadbwPBfffOoojk/Xs9L+4m8U9yiBICLTkL2gKCdsP9OtTmIKsV1BhESlmKmHptNkN+tO9YpydXLzHFn0l/Owyc7OQ94yHUAAc7MA3ZX5y2q5G+67Asenavjyo8+j7LtDMZReGhAzUG/Fxb+c7aVjrSAb0ooxVQsXuVd5UCPpEdQoDnxmooQUxZNUmXmbZTq9f+cThU4aSfjHe5/KxN/ib5J0UdpMYMN8s2XrrqytLiPKSMZUrdlJN9rcI1W6PTByWDBTmrFtJIDnyCJJhpQ9Z1enZ2FBJ7sQzOnHmbkF05x9GReLEfgeHjhwHPc8fRTVklf4xOhVApEqjflm1FPs63XDpZS2BGKLmxCyEOMlAqZrzZ6Zw6nO6gBX6GApzUOhBzMF1r1aCjqi1Wo9z4y7snNBL+8vA0mq8GdffLjQZWy3FMgSsnjRzdNoxakNhVtbdaojhMDpuSbiVKMToyg7AOMVRrAYgCOp3fu7iKZDhMldu3ZVFus8Wxt02r/HrP+UBsC/0oxK4OMrjz6Pu/cfRTUrfhvklvXK0YmSFI1WBCmL9cix2GStKDBISZhvRu1mXp0osFzHg8EIYgqUJ6sBqiUPqmBmMzOX4jh2Nuv1XinoKABotUof0Vqfylws3Ze9aMbvfvo+KK37Dslb6NimlxR7RkmKVlIsG9k2ZbfGHfOs+uopzJBEqIcR5psRJC2tTF952HxF5kVRVLag04M1AtPzRPTnmbujl9dnGJXAxTceP4QP3fUkxiolpH3oajfTQbZ4wjhtu1dWq7G2mkxHECFMUsw1o6xIefECi9WagE4+0HKEiCate9Vb24FSye8wc4w+gnIOPL7v4b0fvwcHT84hWCaEniv+ndGCfFHUwmioEggiYedibXHL10GR56WpwvR8c0mvpp4Z8kMxruH7hQsh0s16T84UdGQURc8y89+QQQLV78J7jsCpuQb++99/HW6fQjzVY5KfIKARJVBKF77xVnC2VrR7ZJ6ScWquYZh0BwvKuwAqvYLqK2a4K5iMorX2Legsz0zJccSvMnOEPhnKQD7juYQvPHAA7//sA5isBovcrLzxutK8+AYxIEhgPhuKNrjuyrhjFnSsme6Bg93xfO2dmq2brpNdr2FydYZrcUFZi5Zq4GKsUqh7IAAoIx9s3qLPMwUdDUDUarUnAfweGR6rBiA4ymUf/+fj9+CzDz6zBHjydgLoQWUbUTLkCWc3nbWCjJcBKQinak3TyoK62TdWPDhyiUa5xW01wjvauKD471rr04PYTq7PCEH4+T//Eh5+/iTGKv4i4FG6R2kcAfONyM67sja0Deqpk69LKQRmaiFacbIk8qk1zDga2IFG6wF0GADV6/XTROJnC7GdrN/OfBjhp/74czgyVUM18NrAky5JRza/M98MDZgUuOu2a6C1hbVQrE+yFIT5MDIDBWghzJ5PKI9SvYmnUW0s0EEGMrLZrP2Z1vwFInIGAY/SjLLv4flT8/jR930Cx2fqGCv77TqXXm5ZI4oLu0wWcKzlro0QstC6EUIgjGLM1lvwHLlktnmcKntB1xHotBmP1smPMvMsFkal9gEejUrJwzMnZvGj7/sEnjo6jbFyCa1k8c0VREhTjflmXKjRu23gZW0lBxABSBXjuZOzmA8ThHFq1hIRpKBFDHwFnb+tnQXQyUPoz2nN/6qIm5UDTzXw8ezJOfzwe/8R9zx9FKNlf5GuQ0SIsikQJhuZV22hWdsK7tUwPboZh6dqOFVr4ehsiMMzDRybDzHXjDEfJkiUhhQER5h6KrIgdE5BBwBSAE6r1fhrZv27ROQCSIoAT6XkYr4V40fe9wl85BtPYLzityNZRECsVJaNvPoLzdrmZzrF2Q5hpt6AoDxUzqi3Ekw1Ijx3uoHHj9Zw4GQdx+ZaqLUSpFm7UycDos6EVgtCve1sFJVl+k7jJ8vl6jVE9ApmTge9l9IM35FQWuN9H78bTx2dxve/4kYEnoNUaTRbMaIkLdzWQghbKmHNbP88Z2tQcp6JYBFm660sbG6YTM5nmBmtVCHRGrPNBESAJwVKrkTZk6iUHASuhCcXXPszaK1LFnSG03YYAAuB79NafwUQVwOsYEollvfPsqS+auDhM/ftxzPHp/HO19yEGy7ejedPzSJOFRxRrIHXemhVmhedCupqvdrn1CUsH3ljZlvWcQZMZ/C1M+uv1mwhUUsLi82oa4YvTEMuhgmjx2mCuTABzQNuBkIVT6LsSwSuhO/KYRBEZJ/zaMd+sqBTUN8R9Xr9tO+PvUGI9B4i2p6zoL63PatTGSn7eOb4DH7lr76It7/iRmwbKSNVCo50B+bqmM0uz/lCb0URolbUXqCd4KF7TMfgLAFtvlbredAFJR+u61rgGeYE5MWg08/NYgYcKTFda+KpI6dw0+UXYL7Zgsh+X8O0uICLDr0RbXBimPtXayWYD42q4EqBwJVItCmoKHDnKJMHWpbprAx4ZBTNPVcul+8ExOcAbC/CeHJ3K/AcKK3xZ194ANtHyyh5xepXiAq0MzjLgKOUwumpaSils7nri1cVdSzURd9bATOz8z1Zjud52LNrh0WSFd6ToiglhcAn7n4Mo+USLj9vO6IkhVJmpnmcKmjtQMNkJ3enjREyEOpwr+pRYrKZaai9s2ntbKutmb7TfBBQdwL6NEASRnAefOUzka7iu5hvRoU1GiHEOXevNHNH6J5MFnb2oALuVffDtF5laG1Zzsrc3GLrwTT0EmjFCT7w+XvxqW8+jpOzdQCA7zrwXRfVwEPJc+FIc5hobe6Lzhht5wMZCBWFvOyAmSeiU9a9OjPgcZrN5oOG8fCHiejiIuJyWyBiLqzlmGJPsSl1OAM6ClJaF+usMZ18vUkJzYwvPfQU7nr8OWwbrWC8EmDP5Agu2z2BPZMj2D5axmi5BN+X7R7eiVJQakF7I8LQLSyJqFkqlaJarWbdqzOwNAeeIAheAsiPEtHNRYFnWLiXUhQUDq1tDcAx7NHoO8WBhwCUfTNM4MRMDUen5vDIc8fwWQC+K1ENfOwcq+CCbWO4cOcYLtoxjl0TIxgNPHhZK4tEaWhVuDqdARAzpk6dOlW3TGd1gEeGYXgEwMvK5cpfEYk3sZk3TKtFTZjNFAjTH8VuOGvDM51uNxkAXEfCw8LQPNaMRhhjfz3E44dOAczwXAfjlRJ2jldx8a4JXLRjDBftmkC15LVHFg9YlJwdlic65A9tQefMXS0BoNlsNt4cBJX/JoT4ZTaURK+WxuQ40u4ya4vsTJNF2xHIDsyQgiClu5AQqBlzzRamak088txxINMjRyslzDdbcKQoRFuIcDzbmw5Mcm23TGRBZ9jDI2M1Igwb/6lcHnkWwO8DcFEgpD4MlbZm7UyZzkCXPwsYtDeUFHDlAiPSmjE134QjReGXJKL7M8+gO+AisVDTuGFB6FxTAjdJ4vtc17kboDcQUSW70OJMFle1Wj6nZRC5nlSvN6B17/aq/fNFlkZBcoG8WqkU6g9jbdHVhtYarVa0JjV5jMWNu8zIpIIf1DwmHMfd57r+Pt93J6SsqDRt1bNDWXeAjYMNGDFZDx/YAZBWKpXrmOkjRHTZMAJzt54jBGH79olzXntFRKjVGwjDVs9lmSTpslTN89wlHeqYGSXfRxCULOis4F5EUYzp6dkNUwi8qK0GcwvggwA9wIyvSIkv1+v1J7qYzoZhQevlDuTAsysDnhevBHiYjZ6zffv4uvhqrBlxkiBVagmA1Gv1ZbWH8fGx3psjmw0vpdWsht3ASZJgamp2xaz1HEgQuYAscubfTihlVsx4nAhfAvQnXNf95tzc3Mwyrhh3vBZb0Fl6kRSAUrlc+QCR+F5mzoVnKgY6DM9zsW3b+DrRdAyjSbuaP2lm1OaXB53JybFlT+SiDamsLQaONE1x+vTM0L+bJAk8z8t0Qj5X9W/d3rbTCUJa80kivouZPtvBgnpFvUSXG6fOBRCtt+XbDhGWy9XfJqJ/N0xInZlRKvmYmBhbNzk6WuuloKM15uZqPZmalALbt0/YfkBn4T6cPj1TeF0wM6SU2LljJw4fOYw4boFIwnVdOI7TZpvnCIi4g8EIAKKDBWlmfgKgbwD4JjM9LKU+0Gg0TqN3f6ucSXGXXnRW3Zp1tTYycBHNZv2nyuXyESL569kN5SLAY/voWFtuXQghkKZpIUAXQqDVauEdb38HxsfHcd/99+LZZ5/D84eex9TUFJpNw1SldOF5HhzHWUsQyg9hsYCRnAOGQ0TXENE1AH7EfBbUyuXKSQBHmCkCEBHhY0T8sUajcaIHK5J99prGGeYOrcch7TniOs1m8zdKpcpBIej9AEYGsbPONqU2ZG6tl5s1DEilaYJjx4/h5S9/Ofbt2wdmxvz8PI4fP4Z6o4knn9qPRx7+Fp5//nnUanPt5en7Jbiu2+H+6LUAIdnJgjIQygCERgCMENFlHZfgO5jxa0FQvZuIvqQ1vialfrrRaJzE4I6f+futCICcdbo+GCZ07rVajb8tl0cCIvxppvHI/ovFuiXWegPOStbG8ePH0Ww2MTc/B0c6CIIAl15yGa678UZs27Yd09NTOHLkKPbvfwIPPPAAHnnkYTz99FM4deoUtDYRStf14LreWrlk3SyoE4i633BSCPp2AN8uBENrzAVB9TCAgwAfA2hGCEBrPigEXAAntdb/FIbhYSzkEEksFqs3LOh0UjkJsJMRnIF3yYKOtd6gg6xSv1j9lem9I3DixAloreFIB0IIKKUQxzGOHz8OKU2azKWXXoarr74ab3nL96DVinDixDEcOHAADz74AL71rW/hiScew9GjR9sumRBO5pK57XHGZ9klW04T7XTLJBGNARgjoms7n965p4ioUS5X7gXEx5WK/z6Kouc6wKeQJuRsgPWitNaTRcLEJhtZWtfKWk8bJr8pF5KnpqfQarXaWmHeDTKJYwgpobVGFIUIw2Z7g27fvgPnn38BXvWqVyNNFaanp3Dw4EE8/PBDePjhb+Hhh7+FQ4eex+zsTBsTXNfoQrk2tEb6EHV5Dp2MiJd5foVIvBzAy6V0/0ul4n5Ia/E7YTj/zQ7wURsddABTImHN2hnZsEEGx3EwNzeHWq2GiYmJtggthEArbEJrnQGRQOeZmCQJ4jjO2BIQBAFuuOFGvOhFtwBg1Go1HD16BPv3P4n7778fjz76CJ5//iBOnTrVoQ11MiKnM0dnLVyzAXjcZkdVgH6ISP9gEFT+CND/NQzDo4NYj7MxFgtdVNRvt4lz1nrvlIXuA0WZjhACjUYDM7Mz2LFjB9I0bbc8jaIIaZLAcZZ2s+yePqGUQrPZQKORR7wkLrroYlxxxZX4ru96M6IowtzcHI4dO4rnnnsOTz75BPbvfxLPPvsMDh8+gvn5ubY+BIg2EHWuddPcbU1C94tE61xnFUL8mNb0plKp8pOtVuODHZoSb1SmY0crWlsF90oONSVECIEwDDE1NQV5lWwDTp5smCZJ1rNa9yUIvUbgRFGEMAzb/x4EAa688mpcf/0NeNOb3gylFOr1Ok6cOIHDhw/hiScex1NP7ceBA0/j8OEjOH36VFsjMt/NhO4NsK4JK8oByMneKyXCTiHE35TL1Vuazfp/6LgovJFAJ/+w53V8yb4nk23eZW359UGZGFws0GLWksKJEycgSHR0AzQ9sKM4QrlSGao52HKsXCmFNG2i2eRFIHnhhRfi0ksvxate9WozAqfVwvT0NI4ePYIDBw7giScex4EDT+O5557F8ePHMT8/1942RLLNinLX8iwCkZMzHyL6mXK5el6zWX9HL8azIUCHmapFbqo5UewGs7Y8c5FSIk1VoZwdszEJp06dAmPxJAkjIK9e1fpyAwGjKEKr1WqDhBACY2Nj2LFjB26++RYIYerKarUajh8/jmeffQZPP/0U9u83rOjIkcOYmZlBkkTtc9uE8N0M9Ex51irlEhEAh5kTInp7EFQRhvV3dGs8G8W9smnG1lZhYxtxuNWKhzqccsG42+IoWoPPvBSM0jRFkiSLmJfjOLjkkktw5ZVXQsrvADOj0Wjg9OnTOHz4EA4cOIAnn3wCTz21H88//zxOnDi+SLT2/QCe5y0Cn043bUhzmTkRgt4eBJVnw7DxSxnWpOsddPIyfUHEF+TXof9JRrZmyVof5gLTNoRWZ3GmaXJOyrZ7AVHOvHKdKHfPduzYgfPPPx933PFSEKEtWh8+fAgHDz6H/fv346mn9uOuu76O06dPolSqwHUdKKWRJEkGSH42FGCo5GPHAI/4xXJ55KvNZu1TGeNRG4Hp8LA3w2o61pZzl1zXaVeMnyltSuIErPW6OOjyz9Adve0M3+fPC4IA1157HV7wghe2Na6DB5/DX/3VX+DP/uxPMD8/i3K5ih07dkJrjWPHDgMglMsVSCmhVKG4DgGQWc7PHwAT1wMzNQC07t2WycnJEYDGOr7I/5+9946T7CrvvL/n3Fyh00RNUJ5RAIkkkAARvAQDXmMcABuvcVzvOu1rr40D67XXNi8Ou+uF9YLXgEnveo1tbIJNMphkwEiAUABJSMxoZjR5ejpV1c33nPePc291da6e6enpnqnDp+hRd3X1veee8zvP83ue5/cMxmCc87AsC8ex1+RgqkLoG9ulFF0uy0TvZBnCD5mammJiYoLp6Sl27tzJb/7mb/PhD3+Ul73suwnDNkWR83M/9wu89a1v5847n0NRFLRa00u2vV6CFimEEHuDIH196blsfAm6OI5roOuD7TIYa8XreJ57XlnrVei8KPLVuhwbEogsyyJNU86eHeeaa67hHe94F3/wB/+NM2dO8zu/85tYlsVHPvKPvO99f8NLXvIy2u0WRVH0m2xpaa2VEOLnarXaFUC+4UFHaz0gkQdjTXkdx7HXhNe5SIJeFwyIbNsmiiKmp6f5yZ/8t/yf//M+RkZG+Xf/7if4//6/9/Cv/tULePvb38Wb3/wWXNchTdN+gEcASghRV0q8pjJ/Nuw8lJOxE0SdPvV0BmMwVgKKys04H7yoEgSLorikgheVBXT69Gle+MIX8ba3vZN6vcFv/uZvcPfdd5PnOT/4gz/E//k/76Ner5FlGWJllkZqjZZS/OBGd6+qa9tZPtQBOzwYa8brGMJ1sKSWGo7jcPr0Ke688zn87u/+v0xNTfCGN/wOUkpOnz7NM5/5LH7/9/9rGeHSfexlLYAn1ev1mzaBeyWuKf+pBkthMNYOePpf+pdrGobjuIyPj/NDP/TDvPSl383nPvdp/umfPsWWLVs5efIk3/u938/3fd8P0Om0+ql5LIQQjlK8cDPwJdsHW2Qw1pa/mNXW6cfL7w05X46jKBQ///P/Acuy+eu/fl/pokriOOKnf/rfUas1FuiALwPgt20G0Nk72CaDsfbA05/1YlkWp06f6pc0vSRd0U6nzS233MpTn/p0vvjFL3Dq1Al8PyAMQ2688Sae/vRnEMfhStaOKIH7hkFkaDAGY0nX3hQRz8zMkKbpZetmaa3xPI/nPve5tFrTHD16FNd1KYoCz/N45jOfzawk8zImoxlXyEtrchhkIw/GullFSxVpXqLQw7Zt27ogVN1/nufccsstCGH1u/eKSwp01kF1fzAukcPJhLrP7/SvhLQulzU3v/xBCMN3XXnllYyMjJDneT9z718yoCOEQCmFUnpQ9DkYq95A57rmLqe1Nv9eqz3XaDSp1+uo5evQyrw7tm8G0On7GrXWtFrtgabOYCy7cYxgVv9JffPBpSoqdhz3sm7uWM1lvV7vWjp9NTLcBDfWXs0kxHFCpxMPOn0OxhJrBOI46Us9sNpUI6MjeJ43t85KaxzXQaxFxfqmdFFnhb8cx8Hz/L7nYTPszCOrRd+ZmRZhGA30dQZjwVBKE4Zx3/3RlCrYOrYVx3bmbCqN0Zm5HFdXFc1qNpvnJH8qN8EiOdLrE/Y7pqZmmJycKathB+AzGKauqN3ukGV5X++v1sw111yzQKdJCIEf1C5LK8fzPB599BE+9alP4jjuqudgI4OOMgtFf6sUAlrVtQohCMOY8fFJpqZaJEnalSSoQGgARJcT4Ag6nZB2O+zbyjF5KD779u0jy7M54uaWZVErQedyW0a1Wo23vvVP+Kmf+lGiKFx1BG8jKwdqgDAMH6rV6sdB7C6BSK5moRmt2IgwjLAsC9s2Ik5VN0XLkqUoEd20+EHY/dLhb4SQKKWYnm7T6YSrIo+TJOGqq67iyr1XzhFhV0rh+z5ul+e5vFCnOrw9z+ubPN5MoGMBMfBlIcT3lZ0FV22dVSdbUSiKougKc1diRrZt4zhWCUSzCmvVXA7AaLOAjOiCTZWLE8cRYRiTZfmq+txLKcnzlNufcTv1ep2ZmZluTymtNfVGE9txyLPsss5UPpd73+gaycKcLHzQsvj+8z1SzPzMbVNTFEW5OJkDRMYqkt0EMNs2QDTb05o5BYMDQLp44GJaqGjTAC8vym4J5lUUquxxv7qlk2UZo6NbeN5zn0eSJHOioVprhoaGB+JO5zg2OugUhriyP5Km+aQQYoQ1FvPqXcBdMkkZi6jqMDIfjCxLdi2i6r97dWN7LaQBb3Tuz2T+XJowrUYpAyYVyJiDQ3VDuFXzu4q/W/WmsGxmwim+62Xfxe7du5menu4WM2qtcV2XoeHhS07AawA6PS7W9PT0ZK3WeI8Q4he11vl6XPdijfsq96wyairLqeocWYFPBUTVQlVKdxf/5UxgL8xo7bUUZ+U/i6JAKd0Fk1lQMV9nw7SznzEL+OfXcFEIQRiFXHHFbr77X383YRj2WLem1mh0bAzf98+JzxiMzdFsT5nnrX9fKf0jQohRLpJ06WLuWXX6mVN3rstVnbbVy0TNJP12K52/MXs36NIY3c/7VnO//VltC+dkrttZJZNVpSqz/1ZdK6X3Z7O/N/fz1wpcluMpbNvmJ3/8JxkbHaPdac9xrQSwdetA4ulSBx0NWJ1O53St1vyPQvAerXUGOBuVZ1hsIZsTXC956le/q5Ti7NmpLpFdWUtG6W7WqqpkF0yEjpK3kAsosXNxL3otu/lAUmXlCkHX6uh976yLMwse5uvCPtrzAXo+qCw1nxdqSCnpdDo865nP4o477pjjVlVWzvDwCMMjIwPXat7aX00FwGZpK1wAVhi23lur1Z8thPzpiws8i5kQom9gWmn0VusuZq30foyJpsxaVYttpHM2MRdpr2IKaudaMYtd5/xLmV+7tN6A0u+wpOTMmdO02+05olRVbs7uvVd2I1gD0DEEfRzHtNvtvteavYnuTxng6fy7IKg7UsofP9cQ+rmZ3WpZ0BHCWrO/tRiR2o8btFgErR+5gdWA5HzAW811bvgFpgocx+bEieOcPXuWnTt3dsW7KrerqsEaAM7soRZFETMz030nCW6mqkhdAo+Mos5PKKV+t/zvgWD7CsBxrq/Lahj/r5Tn7PD440ewbXuOYFWapnTKE32QInHu7tVmK8WuCGQhZfrXWisxaCMyGOcPNqprvQohUFpx8OCBOSd3Ze20262BlXOew96E1ywAXRTWT0mJpbXKDXiK7o+rKNN8l0MgBu36Lmt86eFhtEJXQNOzKKr3HDh4kCzrrbeqCkZbA/fqfF2yTQg4BSCFEC8pAUXO5VmqCIkJwbqeQ60W4LgO0pot2DuXkvyVjbDB2EgA0/uSUuJ5bvmzWcBZ7Pdcx+XYsaPd6JVZIxohJVEYzqnDGoxL39KRQFGr1W7VWu8rd7qcxaOFQOB5Hp5nyu+V1ugyL6SbcFYmoi2urywGKoQbHFgW5xcEUvZkjNuzWeNTk9PkeWXx6EU/07ZtJicnOHHyBDfecGNX2tSEzTOiKBwkB15GoCMAoZT611JKa6XsZCkllpSzuSWA7GYKz0bbK8CpktTysmZnrjUkBtbMRQaU3oNASoGQVvcZyxJUqtwlk58kFnyetCTkczz1hetGSJI05dBjj/HEJzwRpZQp9sSkDHTabcbGtgwe0mUCOgrQQogXl4tILLdoLcvqulSz31/oClWnY5WXkZfdH3vdryiKVjzZlnfVLm+rabF5X8xKqb5alkQI2U2GrL6K8t/LRdmqEonF/p61SJRFo+fyOuXvHThwYJH8I0G7NbNoDtPleDBYls3Zs6eZmZnpO6q3mUBHAioIgt3A0+e6VosPy7YWKL71sylmFy19hZCN1EENy7K66fxaa3SP26a0hjlZuefGBS0gw9e6IGTe5/UDFsuBbDVvBijoloFUBbKiApN54mrLz7k+Z7kRy7YWMZ71QhfLsjl0+FBXpKr6vpSSMIrI0gzbsS/70LkQgizLVuVqbhbQERXoaK3fJqUMtNYFRm9nyV1nW9Y6Tj64rrPkIqyApiIlldJd167XxRMICqXKYidQhZ6zKarfW/jZek0WkJCLZTWLOY9CWmKOC1sBYRXpkQZdFtSe9VozS2Oe7t7uhdjQVh9rohIbP336FOPj43OSBKWUZGlKFIcMeyNr0srmUgCefg/3zQQ6FpAHQfDfhRAvmws4S0+E7azf7fUTDevdhJa1GvNkXq2SngvHBoj0mi2e+Z8/17gSq56X/l3QdTCXpTTAquefaQvBqd1uc+TxI+zZs2eBcmC73WZkZHRQDnGJcjoWkPu+/2tCiP/Yr7SF2dir77441/W5ePzGinbfPEtECHFesCN6QU0sxDzNubmDG42DqMjmYl7fq/leajdJ8MAB7nz2cxaIsrdbLeMyD8YlBzoWUPi+/xohxB+UFo7dz+JyHGdd09WtdXTllgay86NyLhdXwJKSgmKRu1+YJHjwsYPk+awkafX9OArJe5IHB2MV1uYGvzbl+/5eIcTbKHV1lt4yvS9MI7SB2TsY81aJEALbthesl0UPLtvpJgn21mFJKUmShDiOStC5PC2eKkJ85szpnrnY3KAjMOHx3xdC1FlFJwghIPB9nG7HB2uOnOiFtBgGY4OeYEJgWxaObXeTRfuxlicmJjhx4gSO48yxloqioN1uldb05TuvVfRqNaUhGxV0LEx4/HYhxGv6davAkHxBEHQXlizN6WrBrQREepH8i7kJgktP/mBsrM0gq+fuOOaZlydx1dVhxc0hJWmW8tihg9i2PSc3RwBhuzOoNj+Htb+hW9BorX9bLJWvvgy30mw2llwMQpRpYPNIRKroU6lyV4FN9dUg+eLsx6Bx38axZoSU5usSz6ObNFpmqs8lk+clCWqTF2WSBPVcXkdKOp32oBTiHMZGBB0LKIIguAN4SSnU1beVMzw8tOBU6sePo6tjLBeIYmVZvrT5qE1qvRADjZX19r1FCTJCCJMbtIqDybJslEpXOPVM+cPhw4eJormcRcXrJHFMrV4fyJeu5nDYwNf2i6WV0xd6VK1B6vX6OaeoK6Xn6fZWesRLf55GdztBzFpFuvwsPUeP5bIWyVrK6uwRra/C2WKR3vNz3CXbnuMyyXOYS8ex++JiHMfh1KmTjI+P4zjOnOdZFAVhGA6e5Sa3dCRQeJ53LfC9ZQ/zvmPRQ0NNpBSLZu326dEt+t08L5YFO8/zcB3HFInS0+mg6nKgVaktPFsKIHvS/+eD0FztYb3pgGTh9xY2JuxtNaNUMQekTeTIxnVd3AsQhZwbwVq+vMWyLNqdxZME0Zp2a4Zt23dcluBh8p4sTpw4AehNWwYhASWl/FEhhNtvImC18Y1+rT6vSVzse8unugtc1ykn3XAAlm33fgCqa/2obkfRLM3N97Tqrv3qNO+tlq44CsRcsal5tNQFj6DMb7G82Lx128zMqzsreuRDDMAYENZKlzwKZWtnB88zQOPYzqIlGWu1WWzbXrxYdB6vU6X3HzhwgDvvnJckKAVh2EGp4rLuZZam6aa2dArA0lr/4GrcP601QeCvqv5j8c9hSdBZis+WUpQ5HEuDlzlZJWAhhGMQZg4YFd12uHlekKQJhSrMxp3nnlUWUsVNVPc82/J4NtHNsuQ5zcF897Sy3IQQ3X+DQKmirCdTc91JTRdMZq+9tO4siee6c7qjWpaN6zo9Kn36glt4VZvofkLnUkgee+wAeZrNuUYpLaIoJkkSPM+7bDm9zRy9qrKP7xRC7KfPvJyKywmC4LzlBhYDC9PRUy97YvZTbjG315OeA1qW5eC67gL3Qyk1pzd3kefkRU6WZggBaZIu+bm9DqNYw0U1y3OVUSABQtpYruyWnlTSFL1W2yxJP1dOdv79rpdbUIFelmUrKgg4js2xo8eYnpmmVqv19P4qRb3CkCCozclcHozNATrV03pleXr3nQw4NNQ8bytnKfeqEvNaajFVZvr5WViLn+zVxvB9b47VYa6HrnXR69r0TqcqilXXBy20mJjXp10ghSwJ9FmhrKV0beY4Lnp5rZt19eOl6UdfVY8v74o5TEyaJMEbb7xxTiSrEmvfsnXrAE02IegUgC2EeOFc7eP+uJwLATgGdIq+uIELYVr3AspilsdK7tO5nborF7xWEhzzNYg23eK3HSDqi9dJs5RDhx7jlifeQqjDOZZq2OkMxNo3IehIQNVqtVu01jfQh0BXNRqN+hpt8MW/r1Sx7KburclZ79GvSzcYi4Or49irAooDB76N0mpe8ackDEOyNMV2nMtyzldb9LpR8nRk6Tq8sHygRT8bznXdNSPwlo5cqRVBZzA2IeRoloxgLXo6W/aiSYKm9ijtfv9yAx0h4NSpU5sSdKqd/byVtI97ASEIgjU0aRcHnVmzefHyB+PiDCyKzQc6s2TySkChlMK2bU6fOcPZibMLOn8qpeh02pete9XptDcd6FRZxw0hxG39XldFsK5VxGMx3mS5iIpZtPKyrzLe7G7BUu7x/L5YlmXRas9w9PHH52QmV2ul3W5ftu7sZnSvBEAQBDcCO+gjyquUca3WUjhrMWxZLlxeLcQBebi5R69kxUobSynFgXnthqscqSgMyfN8IOq1SUCnuoZn9MvnmCZ67hpv+MXD5ctZRqvhBAZjY7pYjuP0qbNUKgnOazdcWTppaoo/B+thc4BONW5bjTnnuu6ambNLFXSupPR/sSVKB+P8QafKTO4LoGyHo0ePMjMzM8faMUmCOZ1O+7Ikkzcj6BSA0Fo/qR8SuVooaxmqXjpcvnLkarDANveoSjH6VxI8y8mTJxd1yzqdzmBCNwHoSEA3m80xIcR1/VzTrOj62pmxS9VcmRwdsSToDCydS2ADSLmAGJ51uOd+z7QbTjh06LE5mk3dJnyd9kBXZwX+QmtOX2zQEaUbcxUwRJ+lQuaUWUvQ0YtaOUaOojtfCxbrhcpEHoz1HSYzuf/x7QPfXrTdcBzHpL3SF4OxyGFNsiFARyl1QynYVax80QLbXuvMz4Xh8t66psVAqpK8HIxNfvzq/jOTlVZY0uLIkSPEcTTH0pVSkmUZYRQOeJ0VtrDcIA/+5tWYw2vt1izuXqlBuPwyAZ1KKaCfUSkJTkxMLOD0tNaEnc5gXfTBqWwAk0vc3O8CqaRB15JEXqq6fKXrGCyuS2QTlAfZSrxOBVCtVoujR5dKErw8On9WUiWbEXQqpvaafssf1t7CWHyBLFfoaXiAAYl8KYGO0UzWfW22QhUcOHgAKRcmCcZRNEfs61IdptlgfE6H/8WcmaqgqQHs7vneshbGWoPOUpO2Urjcsgbh8ktp9EsmV7IeBw8epCjyBQJnaZoSx9ElbQVrrbnmmmu45ZZbz0k872KDDq7r7hRCjPUDOhfCwlgKN4pCXxDTcjA25iYyaRj9JQnats3x48dpt9tzuKBKabITdi5pMrnVavELv/BL/MVf/PU53edFBx0hxFUYXR+1EujM5sboC74ITZayWMIcF2vKKw3GxQedVWUmOw7j42c4derkQl4HCNvtS1p3QCmF4zjUy35fm829Ari2NEX7stHWuqp7qRwdrRfv6FkJNw0sncuH11mQJCglcRxz+PBhnJ70jarzZxh2KC7hzp+OY8pB7rnnq0smVm5U0Kke4L6+UeoCZAEvJmlRJQYuNc6ly8JgbOyxuvwvgUbz7QPfXmAMd5MEV9Be3syj0WjwP//nH/Oa17yKKIpXvScv5u4p06L1das5jdbDwliJGBvk6Fyaw/Qv62/pWlJy+NAhkiRZ0G44z3Oi8NJNEuxty3QuHTAuJuhUpMnV/RZ6rnXpwVJdGJYDHRNBG0haXIobybbtVfA6LqdOnWJycnJBjo/W+rJWEtyooFOFy4eAvf1ei2WtT0LecomBA/fq0gWd5eRL5ycJWpbF5PQkx44fWzRJ0HSI0Jck8PS2I9pMnE4VLt/VEy7va1Gsx0Ncjs+pdJEHkSsuyc1kNlF/rn5RFDx28OCccoiukmAUkufZJTlP7XabX/qlX+Ev//L9eJ636giWfTFBx7Ks60vgKzAdPlewMNb2chcHDr2kqFe1MKUcZCNfqqDjug5hGK7k7XeTBA8c+PYCOYvZJMGYRqNxycldZFnGnj17GR4eJT+HKN1FtXSA68VS2hGLWhjWmloYi/M5K3eAGITLL2Vep3/5Utu2OHrsKJ1OZ0GSoFJFWfx56a2VClTD8NyKW+VFfsg3reZG15pLWUwTZSlyudd0HujoXMqg0z+v4zguZ86c4fSZM4uqSJrWLJfmOtmMBZ+V/3LtPMtnRT/6Qls6y7Wdqa5hYOlcusOyrL5LbaSUhFHIkcOHFyWTozActBveSKBz8803u8C1qwmXr0+Ojl7WMhoAzqU9VhORqSzeg48dmHMgmvVqEccRaZoO1swGAB0J8Nhjj20TQuzs9zrWL3K1UgeIwQK6xJ2svuVwtdZIITl8+BBJshBc8jwnjqKBO74BQEeUD+xqIKDPmqsLIWmxFJG83IIcZCNf4pCj6Vv4vyr+PHbsGDMz04N2wxsddKSU1/Vb6Lm+OTpqRT9+MC5l0NElr2P3nSQ4PT3NyZMnFvyOEIIwDAdWzgYAneqB3bia96+XW7PcAqlydAaLaPG56fe14TfFMj3OF3tvkiY8VralmQWnkkyOwku64vxcxsVIDqwKPfeVD0L0s6DXI0dnttfVcqAjL1tQ6f1q5k93u2ZUr6KoJEEW36DVHPaCUC8Bu1GGSRLs//0HDhyYe/1l8COJY5IkIajVVq2wNwCdNfRgysV7fb+6yOvZ2K7qWb006IjLCFx0CcSaPM8pioKiKMhz89VIgBjtoYoLW8lSrF6VGLrj2DiOg23b3d7wF3tzVkmC/R4wtmVz9PHHieN47u8IQZHnxHFMrV5fdm0NQOfC8jl6bGxsKAzD3f1aOsup9a+lpWOykXWvQbbAf7+U5Ap6AabKT8rzgjzPu6+iyCmKClz0HKJ0/ufM//dS866UoigKsiwjinQXiBzHIQh8giC4yPNsemFJKVcEwEpF7+TJk4yPn2H79h1kmZF7EMxWnG/ZunVg4lxM0EmSZK8QYmvP95ZdpBei3cvi2ciqr5N6s/MulVtUAUuaZuR51rVg5oNLLzitxf0vBVJpmpIkCe12h5GRYXzfWyGaeKEsnVklwThe2LFTY+quqmFZFu1Om+MnTrB79545Al5CCDqd9oAHvMigg9b6yvLffRZ6WuuS61CBznLu1WbKuZgPMlmWkaYZWZaSZQZwKoCZDywXA1yrv1sUBWfPTrB16xZc170o8z2rJBivOBfdtjQHvs3tz7hjQcV5EsfkeT7o/HmRQWd/uXn1ykCgLwjonIt4l21bCAEbdd30gqJSiizLS6BJybKsy8PMB5cLBzCLF832cx9KacIwxHXdi8bruG7/xZ8CweFDh1Bq8YrzpIfXGYDOxXmgN65moV+Yxna6LyCazy2d60ZaH5AxlkwvyMx3ky589E0s8d/6HNbJxZvbXiXBldZFlST4+OOP02q1cF23K2dhJD1zwiik3mgMyOSLADpV5Ora1Uau1uOEWIk/uNgyBf2CzFpzMKsHmn7eo1d4n8bzvIvqzlZKghUxvBJAnZ04y5kzp7nqqqvnCFsZMrnD9u2DyBWg1xN0RAk6Eriq39V6oTpALLaOl1/clbSGvmggk6ZpF2SqEPbFAZl+gWb1v296yyvq9Rq1WnBRw+eGTHYW7eywKJncbnP48GGuu24fcRzPeS5R2Bnk6ZRTte7uVaPRGCuK4op+Vm5FxK2fpXNxSyA2NsisDeCs7MJa1Ot1GqUrcrGH67p0Op0+HXbNY4ceK3m/eWRyFJFlWd+ZzpewoTOz3paOVkrtBpqlybDi6jW5MWKNG+ytHnSEWPtGf6sBmY1YRrBSesFi/+5Nf5Cyuh9jRdq2jeu6uK6zITam4Wr67xAhheTIkSML3DEhBGmWkSbJOQmZXypoY/a7OLGeoCMBpbW+SgghtNYrhsu1pnSt1pq81Uu4XBe+f7n5DE1RVCHspAxjZ4uAjOTcMEavy4Y0GcVOGV1kQf+n+eC6HBhVypAbKSWh4mosy1pRC3i24vwo01NT1Hu0kXvJ5EazeZmTyVraF+FB9q2L3CslceFzdHRfOTrnY9UopQjDkDhO5oSwq9P+3EFmOfdnrefNPAvf96jX632HlJf6fgXms1bPxhpVpnSe530B1NTUFKdOn+KG0dE5ZLIAok4HBmUQ619lvpo2wnBhwuXLbYLluKVzTe4y1cYRZ86cYWJikjAMu4tYSqsEmwuZK9P7WhsLp16vzwHr5V5LWY22beM49rr1MztX0FnK3Vusx3mapRw+cgTbtue666XMxUC+dH1D5lV1+TWLHMdLPvD1IJGrLNjZv6PX9LOzLGdqaroLXmux+c+Va5nr2pzbfVaFmat5LlWx7IUoabnwvE6/SYLm64FvPzrHfawsujiOyLNs3YqXL3fQqcLlAti9WtBZ+4W0+t85Hzcvy7Iu4KwtIa4XTHO1sSuXxbhtolu8qLWiKFRpaYkVrH29yGPUfT2T2WREsalr1np5nZX6V2mtsKTF0aNHF1ScVz3OszTFqddRRXHZulrrCjrDw8MjaZr2BTrGjJfrVq9SVVEvx+mc6zAREOu8TOv5c1ABcvWybasHbOSy16y1KfZstzvn1AhuMXmPhTo5lxAHUbqC/XSydByHU6dPMTU1xcjISJeArsjkKIpMZvIFt3cHoANAFEU7LMtqruZhX4jcmNWC2Pn0u6rM89HREdrtDlmWrSpJrFqwBlwklmV3ezMt5qr0Xt9y1+q6DkNDTaanZ1Z9T/P/ZnVtl+qoeJ3ehL/l+K7p6WmOHTvGtm3b5oTPtdZlg7rtA/dqnSwdhBC7yr9ZZSavADomR2c95A2KQq1qo60WeFzXYWRkuFuAmedF+bkLXb8KTCpLr9eCmP+552oFKmU2iOe5RFHc9/2Z67K7ILPZ5T76f37uovc5PzNZSkle5Bw+fIjbbrttiV5Yl3f91XqDzpWltbAi6FSnxoVaRKvndNYiR0fgeSb5bVYUq//rPR83c6nqeNt2gHiZx6bnbjGtse31yxLfMBul5HVWslKrOTl8+PAcd9okDwqSJKYo8gHorOPYu7qNfiESA5c6+YsLZuksbi1Y80LLqwOXxa5nbnnEwu8ZuVF1XvdVlaVcTqM6APsjkzWWtHj86ONEUTQ3SVJKkiQlTRL8Wg19mdZirTfo7FmNcXRhIlfnlmcjpbXm4LeSa2IuVS86N4Mcs4vB67gkSdJXZvL4mdNMTk2ydcvWObxOUVSayQ1yXVyWFs96sX+6fHB7+n/IrKsJfyE5nfNxiRZv43KugDsAj/NZwq7bX+dPy7KYabc4cfx4qT44q2mktS67fl6+M7meoCO01lesRkdno7R7qa7lUty0K0fSxJxT/Hwysze3i0VZZyYXWdwLM5OLouDxx48sODiFgCi6vBvwrceurhIDPSHEtgUreQkT9UIt7qV0dC7XRWA4/cHoxy1frvPnYi780WPH0FrNK2yVRFFU9ge7PM2d9QIdarXaKDDWD+hUp8V69pjqr8Jcb/qNs9DSGfhcq7F4+9XDsaTFsWPH5nBA1WGapgl5liIu08aN63bXWZaNAX6/O/dC1eisttiz1yy+FMdKUbvBmAcmVn/aOrZtc2b8NEmSdDWTC1V0dZOSJOn2xboUwHg1b183S8eyrDGMfs6KGeC9HSDWywK4kLIWG8jWWXDfKxHo63UYbJpTWvYPOhNnJ3jXu99JmqYEQcBQc4ih5hCe55lcnZL7MQ0Ni27u1maznuM4Xg0cZPZ6gY4QYme/bWf6PVHWa1KrosXNfCgtlohYKRauDCKzuVKXM+CYw9DuKzO5ymL+3Oc+y8Pf+hY7d+xkz57d7Nmzlx3bd+B6Hlu3bWdkZKSb/1MJ7RdFvqCLx0bVGiqKglOnTvU1faWm1MF1y9NRSg2XeTd9u1frcdpX4loXQtZio5vEc+U8BuNCWHqe53HmzBlOnDjB1+75KgCO4zIyMsLu3bu59trruP7667npppu58sqr2blzJ0NDQ90mg7NlM/miPcsu9hqqiof7LV8VYh27QUgp96zmZtaTuO1HLHwzdfZc/B4XPQj6lM6cG/K9fIfuVvP3U7Sry7IRx7G7tVuVKz8zM8PZs+Pce+891Sqj2WyyffsOrrzySm666Wauv/56rr9+P3v27GF0dJQgqCEEZRPF2bZDFWOxkrrA2nsAkjAMOXHiOFL2n1O3nhnJtdW82eQ3DE7WCzlWy+dcqG6rmwm4jcyFRZIUi7alWcLKXwDWRjXR6UrVam00jg4fPsSBA4/wmc98qrSUArZs2cLevVeyb9/+rlW0Z88etm/fwcjISDcvaG7/MyNfdSGtItu2OX36FCdOnFiV4Px6gE51JVet3tJZH6umKNRlIJa92H0PIlfn4lI4jkMcJ+etPDB/LUop8TyPIAjmPKPx8XGOHz/OXXd9qTyQHYaHh9m1azf79+/n+uv3ccMNN3DdddezY8dOms0mjuOiVDHHPVtLnqgoCoIg4P7772dycpx6vdmX9aeUPrKelo5azYPdKAAw28N8s7tXq+vdvhRYmRq0y9jBWkbmYjWAv9wzmn8YOI4z529WAv8PPvhNvvGN+6pdw9DQMDt27OTqq6/m5ptvZt++G7j22mvZs2cvIyMjuK4HGJ6oevXLE/Uun9518/73/02/Lp00B7v85npaOjv6KYGoTPjLMdV+vTfPuVg6l7uoeFXQufr1ee5agYtZRZZlUavV5rhnWZbx2GMHePTRh/nkJz8OgO/X2LlzJ1deeSXXX7+Pm256Avv338Du3bvZsmULQRB0VQ173bPqeqtAixCCu+66C4BGo8m2bdt597vfyWc+8ylqteZKa6ksg2ImCNyvrhvoaK2HVyMUtb4LSV0Gm2WhlbNal7ISFrvcD4NKvnSxdsPLAcdaruul3TOfIKjNcYOOHTvGoUOP8fnPf7bkiXzGxrawZ89ebrjhxq6Lds0117Jt2zYajQaWZaNUQZ7n1Go1vvzlf+HjH/8HXvzil/K0pz2N97znnfz6r78Ox3H7seQUCCmEfnBiYuLoerpXfR+rF5KsXH0PczZM4elauVcL0wRWt+Eu91H1OF9J5uJiPeP5VofrunieN8c9O3v2LCdPnuArX/lyeU82Y2Nj7Nq1i2uvvY4bb7yJPXv2sHXrNoQQ/MZv/BpKaYaHh3nNa17NJz7xMTzPw7L6KgvRQiCKQr8f1jd6JfqduI3W6VGISwt0ek/K5TfN4mLwg2F4lnMw+FXPXhDr+eznP//5PJHWmlarxTe+8Q3uv//eHgPA6QKt6/q8//1/jdaKRmOo30JpXfI5oRDqr9YbdFZxkgwW9oUEHHPaFefwXOSAa2O2zOEcrD451+WYA0LyYgPR/DA+6DmksdaKer3RTSzt18MRQtha63dGUXQUsDco6KyvZbHafJXNzueYez73jhgDEF9dkiBdFll9SWvZFILrgJooTeh5CpGzLO5atmY9RyBaeFitaq8oQCqlJoTQbyyBVW040LnQZOW58Rhi02+S1c/Dwp9fzomBi7ncSyUJLrb5hBCW1voPoqj9977v77Us6zql9BOE4FbgRq3FPiG4QghhLfKMLqpVdD7nuRDCUUr/fBSFJzAF34XNYKwIgpvfpVgt6OglXYoB6MweRKtIEqwiuDcBfx/H8ePA48BnZ9+ypVmvx9eAvlkpniAETwJuBLEbRE0IFrOK8nkckdhAYJQKIVyt9VviuPOXJZWTb1hOZzA2gqWzcNj2gGvrHasnk7v7zWG2zXZpyZxtdTrcD9zf+/4gCHZKKW8sCm4VQtwqBDdora8TQmwTQtgrWEXyIgCRBnIDOOoDYdj5fyoLZ/4krMvh0LcjOFCzu+CczupPdtm3at7lw+usmky+umdjzmdiRY/r1N28Jfl6FPhU9cbh4eGRLMuu1ZpbtBY3g7hVCH0DiN1CCLf6jB6rqPfvXUj3rAAs41Kpt0dR52d6AFCvJ+hUYizHhRBPXUlPx2i8FOtqxl/q6nmLhctXe88D0Fnc9V5jC0Ezt1xoMbepmJ6engLuKV/V8DxveJdlZTcIIZ6gtbhNa/aDvkYIMVpZRRcAiHQP2Fha645S6vVR1PmfPZ+nFzP3LjToIIQI+/0Fo88xGBfKtSoKtSph8N5ozQB0zstFFecIRKxgFSkgSZLpx4DHgI9Xb2w0GluLQlwH+kmgnww8WWv2CyG2LAJElbWi5/2dpa5JArIMiaO1/qs853fStPNQ6VKpxa5/3dwrIcRkv6dHluWrDc1d0NNsM2fhzt8YJsciX1Vafm+R4wB0esG7WG15w5F1tIo0ULTb7XFgHLireuPQ0NBYlnE9qCeBfipwq9bcUAKRtXD99Boss33XSrA6qrX6qNbqHVEUfaV8o8UyFQjrZukAx/vd5Hmek+f5qjQ6NpEZva5jMX4sSdJV37/neQPAmb95Sk6nP8lXADoX8nxZxirqdZ2KmZmZCeDu8tUFojzPr1RK7hOCm4TgOqXYCWybK+KmYq3FY8D9QuivdTr+XXC21WP5wAolT+tm6RRFcazfFHqlVFdFfy0X+uW5afQCQO9tc7vc+2ddKxvHGfA58+elUkPowyqvJvvYopN84RdA0ScQTQD3ru7jO5VlM9/yWnLIdVz1x1bT3TOK4g3jYm3ejbHQ0omieFXgobXG9/1Bacr8jSMlcZysAOCzby/dsMMXAXSWA6K8fOkeILJ7XnIRt02UIGOXX0X5WX1v1nUDHaXU4+XFrSh+LIQgTVPCMBxUNa+RZScEXUnL1XA5lmVRr9cGVs4ic9PpdPpNDBRa67aU8rENAjpLXafqAaKcWSJ4/qsCrOJc7mXdQCfLsse01qfp7WeyAvC0Wm3yPB/U+5zzxpjLM/ZKVvbjWlW8xfx+3AMrR9LphP1KW1QTd6DT6fS9/i/p+Vsn0LGAUAhxX7++n4myKKampgar/BxH5VpV+jlRFK1atCvPTSO4AfDPzkmW5bRarX6tcCWE0JjoUbUXLm/QXq9nVX79uFjF6pVSEMcJExOTl1CXzfV1rSpXdXp6hjxffRJkUSimp2e6n3W5A47WmsnJydXwjUJrLYQQH9/ArtUlCTqq3Agf0FrHzLLdfZmyURQxMTF5GXRsWNtRFAXtdpuZmdYK1ope8nEY4I8ZHx8nTdNut9PL0aUyinsT/ZLHXStfaz3puu5nevfCAHTWB3SsOI6PAB8srZ1iNQ88iiLOnKkW/kDXZbm50lrTbneYnp7pVkH3GyJf6oRP04zx8bNMTEyR5/ll8wyq5FADvGdXK1FalO99f1m60Pdhe0nP6ToDnKrX609USt3L3DTuVbkMtVpAo9HoJg+uhuRM02zBopqZmSFNq9Nr4Wdt3bplwyQqLrUxKt4mDCM6nQ55XqxKirR/nkghpcT3Per1+oLOlZcK0PS2zO10OnQ64bm4mAogz/OnZFl2Pytk6l4uYz1JLQ1YWZadchznBiHErZiwm1ztYkjTlCiKyDIT2arqgvpZEPNVAoUQJEmybC1SrVbbkNrA5p4hzwvC0Fg2YRiiNedl2az0DCrwjqKIJEnRWnUT5TZjioOxZkRXC7soCuI47rqmSXJO1nVelhT8ZZIkfzoAnItj6VR/T9Rqte1KqQeEEFvKXXBOK7VKP7dtu1S8d3Ecp9wAVT8gPcdK2syWTu8JbHJuMuI4LkGzKH8u19y6Wcn6rPJ5qq4Dnud2Qaj3PRsFYGa/apQyc1n1B0/TrBuxM/3Bz2mLVCdbB7gpiqLj5dofZLuy/iJeGpBhGJ4MguCngA+W6H9OQkPVoq5S+zudTleCoRKZdhy7WyOzGLexEXmJ2Y1BFziVUt2GaEmSkKZZ12qTcqWiVL0uQBjHMVEUdZ+B6zo4jovj2F0Q6u0+0Pv1woLLLPAVRdGt7ZsFmBylZrtjrEGRbyGEcIqi+MUkSY4NrJyLa+n0gl3u+/6vSSn/QGudld9bk+vpPVmrBSSlLDV+JZYlu98ziV6dZS2dbdu2LlkHdq6bZj7Y9W5CpVQpP5GTZTl5npHnBUVRdK27pcFSrAvYrOYZmLmXWJbdPRAsyypfsqel7cIludT8Lrx/jdazf9fMYVGCTNG1Xqo5nN/Xew1HVolYxXH80/TIdA7GxQWdLvAEQfAGIcR/0lpXFo+8UJtgsVtebPHOH57n4bpO6bosbO96TkdhobrmvVIKpYquqV9tivm9qTZztGi+ZdNrUfQeCsZqs7oAZFlywZKdFSET5dwptDZA3fvflfWymOVzgUYmhHC01v8QRdH3MSsdOkjn3iCgUwFM4fv+bwgh3ljtRy4owb3SLetlT+2VT9zVguDCz7mc0gF6BaQWm+Ol5mKl967zHOrSpbKVUv8Qx/H39Vg3A8DZQKDTNRaAIgiCHwDeIYQY1lrnzFawruMtX3bro5fYHFTWniN/g5HqRCn1Z3Ec/0IJOAPieAODTtfVcl13v2VZfyaEeH55kl1A8Lmsh1oEaHSPlTmY7/7mUJe6wC2l1C8lSfLnLKELPBhzrYyN8gCtoijG8zx/j23bZ7TWT5VSDpcPsTo5Bpvh/OdZ9QDLo1rrQ0KIGBgrO05W2eKD+V7cFO4CthBCKqU+oJT6wTRNP8lsxvEAcDaBpdNr4mtA1+v1HUqpXwF+RghRLy2fSr9DDtyBVW8UUW4UlFJflVL+ThiGnwAywPd9/3bg1UKI7xdCbO+xNAdzPQvYskcn+l+AP4yi6EO9NMFgmjYf6DD/Adbr9VuUUv9Ra/1dUsptMIdE7LWABifzPNO/msuKVFVK3QO8KY7j/8vc9iPdCW00GlvzPP9xIcQvCCH29oB9dShcznOcaa0/IYR4exRFH57nog74m00OOtW1yWrBNxqNbXme/yshxHcC3wFcPT/RjLnN5y+nDdKr4GbDnKS4Ka31p6SU7ywtG9UD7GrefPUCzKjv+/9WCPHTQojreuZ5fosSLnFAUgghtFIfsm37P7Xb7QcXOxwH49IAnfmLuffh+rVa7Wat9bOA5wJPBa6ttHp6QEj3cBib7sGshhiYB8CHgH/RWn9MSvnJMAxPztsoy+WOVBq4Vci35nneq6SUrwKeLYQYmuO7bbIizyr/R5T/1hrUEvdQfjcXQthK6z9Ioug3ALdciwOwuYRBZ77lwyIP3HFdd5+U8onAM4UQT9ZaP6Hs99zXxhCYcoL5XX6W2pp6NRPcD4L0/FGlNYXSSNFXvkkCfFlrfb+U8l7ga2EYPgJE84AGVpeoNh98qNVqVwBPUUrdAlwPbBFC7DTYo68XQmzvsZyWBcje5ONl57ucO73SghWLTHP5e1rr8rPNvCptkjK1UiAFgess93wr0PnLJIr+TbkGBxnGlwnozL/uCoQWa7FRNhTL9gPfB/zKcvcrgFwp0jRf7Fhc9BeslWpzyq3XmxW7/PvLzFkpcW2LZuCR5DlZj0SFXsjbSK318SSOdy/Bi60WaJYD+2VlZr0g+O9SiP9Y5ljZyy2sNC9QWqMLtRApFplzIQWyx5JbtNf9InMsy2xm17awpERKQd1zaQQuzcBj15YhbMviE/c8smBxLAI6702i6EcZlDWc97A36XXP73C4oM1q2cfny8AjfhD8IuAsdgoLIUiznKt3jvGvbr2Ok5Omb5gUgukwJkqyeZmukOWKqU7UF44M1Tx8d+UK9ZFGwNahGtuGG2wbqlH3Pf7g/Z/l1FQb116mna8QGRBgolCih3Mp1nCul+p5XWn+5vM7uM6/WikFUZzyquc+mVuv3snZmZBWFKO0ZnwmRABxljPVjhZkFreipHwOpuxkuO7PfZJaM9oIcB2znLcP1RFCMNwIcCxJ0zdFp0IImoGH79jYlqRZc/nWsbN89KvfwpZ9C6wPxmUKOiuBUPek9zxvdKVjPC8U24frfM8dN9NJsjmnql70UNWkRdHXVdmWXNkqKjclQKE0QmgmWwbwZEU8LLUJtD5ZulLr0WVgqcZtSsNxsRJHpTRSCJ507RW0whTHlgtAejFwzcsCWA3UbIFnW2QaJBpbQqogU5KabUysTmEuKJCKTEFUaGrSuFhpoRFo8iKjHWlUFvdr7g8afw1Ap68NooQQ+XKbUZfm+2Q7ZqIdzXFnlgWJPmt7kizvDwnKN2kBjhQUm0cP2lx5URzXBlyXRdgz023COKOTpFjpXLdRLOMAC8Cz4N4JeHgmZ6evqdvQyeGrkxJbFFxb17RywaGOYJunGfMgsOCFOxSfOS05FsHuAFxL0LAkVzYFD3QCU7SriqXcaVEC4ZU97upgDEBn6c0Qx/G45/vjQohdS5GcQgiiNKdQJofOKO+VS10sngDUNxtbkaarYNdkv7+zgeZZKXWmtOjEYvOstfFNpzqmw6jVw9Os9OGuhELDVycED7cEuwJ4sCWRAqICtvmabZ7gWCg5ncB1Tc2YK3g8FFzbUHz4uIXS4Ej4+pSgbsM2T3PXpKATO/iORZgUK2VADiydNRqXQ6apWnGva41jCa7dWmfvWMC2pseQ7+A5EksYEMqVnvNSpeu1WLBlta/ejVno2c/fTDSCbdunMJE0sRR4SEsyHcakRbEAcDQmajf/jh0BJyLB3x6VHI0EtjDg86VxwVU1zZOGFbkSfPqUoF3A08Y0p2LBP54UhLnmsY5gOjMu2F1nBQ/NwHO3FkwkmpMxbHE1SdHXRhhwOgNLp+9RCCE6S68kjWVJpsIIiWb3SI2sVOQrlCZXiqzQpIUiyxVprsiUJi8UeaEpyjCsASDNuaStCAGWEDi2wLEshgKHrGZjydJoEGK5JX+xjSINEEXRlOf7k2UIfdG3SSFohQlxmuM5NkprYxZpcGyJawmSvNTBKeffseCeScE2D6ZS+Ma0ud1X7lU8cVgz5Aq+OqmpO5I7xgpcCQ9oyRU1QeBoarbmeCQ4EQuaHvybfZJH2pLtTYstTcnZmYxUaVyxIqoM3KoB6PS1GQSQaq3PCiH2LcvtaMiLWUvG5MiAa0s8W8xx96vcD6WMZaJ6rJ+8mLWC0mLpdWpLgVW+bCmwLYljGZej7jk8fGycVpRiSbkUkOkyB+l4j9VaXMR5DoHTwM6l3CtLCjpxQjtOqHkOKlddHkUKuG5bo5ujpIE0V/iW4BkUHOlo/ul0wfdcbdN04OB0QWhZFMB3XS24eVTyD4czHpnUND3BG57u8cWTBY+3NcfGc56700IK0EJw1bBNK9V8/mTB6ZbAcyxUki7J6ZT/t7XcLwWD1sAD0FnBe9JCiHA5sJFS0o5TpsKY7cN1sqLo7pmlLJgqo9WRAiyBT6+u8Sp3bZkV1+teVbksK/Ies1bcxRZkU8BRIcSteon4vhSSKMuZ6SRcMTpEVmKkEJBkBVFW0PQrC0gQOEZB8Hl7bB6ZKnjCmM1t2yzCAsZjTVJo0gKeutViOtV855WClwn44smCN9yT8J+e6vPWbyZ879U2L9xtd5HiiprggYmCa4Ykexser3vI58CJkMAVi7p45hnpIWYTAwc1fgPQWZazUhpOSWMV6KV2TFEoojRnqei2WBYwSmA6D89fLAA0sZp73BjzLOWR5fiPql3OZDvC6sn+FhiiOEwr0AHRzQgwP79lTCKFoJNrfAnXNESXpO9k5r1P3iI5HWl+/gkub30w4U0PJDQcwUv32uypS+JCm2tQ8LStlulLrnSXIV6WRRNi4F4NQGc1loQeX84EkVIQJwUTrWjWnRHnBxzrzalsiKHUoyyXk1Rm9JyZbhtQnTfPYZqjtbfonIZ5xQsZkyop86x16ZpZ5XvGPEE71/z7mz1mUo0jwRLQygzgUIJYp/w8RN8TONDJGYDOKo5hKU8vDxYmAW+qE5fYpLnYFrTs39KxNhDoHNBCLI+/Ak5MtuYkAZbRdOKs6JLLC+djEXAXs/+2SvDIS1AJM41rlVydnvv7vZ+nYEmXat7JZZf7JRvAxvmbxZe+pVMUx/shVk5PdzZEQp4Ugpmw6jq6EqUjpjcC3ADYtn2I5ZonalNbdnKyTVYUc+5NCEFamKjgOfFi8wCpN5F7addY49kWI40ArfRSbxTl9W0JgmDLBuDPBqCz0fGm/HqsPFmXXSzHJ9pcbKUGQ2wLpsPlWx33XvZGmecwDA9rrSdZQpTcJAVKzrY6tOdF5gyvZlIT1is1UgOOlNQ9hz4evNBaD8BmADr9bQat9SFmpTf1wjdpsCwOnpokybLVuDYX3b3SWlsbZJ4FMA0cXopr0phatMl2xPhMiG3NPg5RujlZSfbqdbxwpQdUzQB01hh00jQ9gdZTLJFfobXGtS0ePTHBkfEWnmNvJnGqjXKhRpRciIfFLDG28E1SkKY5B0+exbGtBQZGXqx/kKjfRy0GEawB6KziBJ7RRk1v8RO4zIidaUd869g4rmNqdQZj9UNo/bWVNrgQcM+BY4vyN1mxvhMvBAuq3ee/pfLESpGyFd30wbi8Qac6gRFw13InMGUE6/GzM1ji4iecrsLQ2ijwWLmyXyutRLmEO4jj2Bw8McHZmRDbmmvtFOuI9lprbEuyc6QOelkuSQNSKVUfQMYAdFYz/kX3cUqpi27iaKQUnJhqg+qDVFXq0AaZXwWQJMlXtdany7WlFt29QtCOU05Pt3EsySZKfxm4VwPQWY0ZLaLNdL39chvCKAduFEvHAtoI8cnSqlz0JqQQ5EXBZCcyutR6rruzwd31wRiATr9nlNopNtHCWcXm20jb1OS0aP3AuV64a6//kuw3aKDnp0sPxgB0lsUcKfeseIgJwY6RehlC3TRc4UYE0U2V6b59eEWqRgkhEELs3YBAPwCdDTyuWv4UM7Klo3V/Q+RtrCJXaCNu8HPulmDJ9d/PNc8ZIMEAdNbWyCm/7l0uK1kpjes6bB+q91V+cKFHK0pX9E6Mpo86swEtnh3n6l7ZFwF0BsmBA9BZa45BYVQvdy+11oWAXGuavstoIyBX+qLbz+OtsK89a1nWxMabdTG60ia3bZvRRq3sfnFxfcVVJIIO0GkAOv0dpkEQbMMo2i0OOgiKQjHWDBiquf3WPG0I92qDlEHM2ZRa69F+HoxliQXgfzFKUDynTw9Vyr0DyBiATr8W/C5MQzq1qFUvQCvFzpE6Nc+h2Fzmtt5w1yLE2FKubFVjFbg2zcCnKMoOHCXQ2mUIXazT8lBKm+RAKVlJ4EJrPUgOHIBO36CzVxjTRS3+JgFKsWdsqKwH0pvxHjfCdWiMtM3oStdmSYltyQ2BmKu4hkFy4AB0+vbZr+/nfbvGmhvpmvt62wZKDqz2r9AwtDQ0GVe2HrjUXIdCKcTmCUAPQGcAOv3epbx++Z2iQUquGGuUZRAXbxcIIchyZcogxJImfyWUlWqtT2wQN0sANBqNUTELOktOpGNZyHnSppXY/Qa2dAbu1QB0+ltPWqm9y1kOWmts22LXaGPDnLzFJi1zL4rCw/BnSyJToRTDNQ/PmXVlNUa8zO6DW1k7gDfXsq0Z4DhWP3V3AyJ5ADor7wFMPdCepU5es/A0Nd9hrBlQFJqN0NR3E6a8CmNUyjFMwuKyJqNjWxsC3LUG17H7jVYOQuYD0Olr3wbAtuX2cnXyDtc8cqU2xIbfrKu7KIo6y4nFlx0hRhu15RoJrjPwDLBkADprCDq+74+K2WS1JXN0tjVr1H2XXKmLamYIZruH9nEdYqMZRVrr2mbDzaoj66VrhA5AZz33ryWLYgxwljL3RXnyDtd9bCmxhOgmqF2sRke5UoRJthyrWiXhTcZxPLlBNnnVNWHXcrIW1R1tHarNuWgj2m7m/kIbHr3PVQM118ax5XIWjyh/dkX5K4Mo1gB0lry3IhdiN0sIsvcu+lrgc7KVcaad0klMvWLVb1yIuYtVX4ANUL2q6FUrSmYb0i25FUQMpBtozlchuSi6JRCy7NQpS7tN6/OfY73I8zJ/o+wdLwUSUXZ1tal7jum5tXQbGi1MTZnHRmiMtonHpdpszwIyz/N+GiF+j6UykcsT1nVt7j1wnHf/09d5ynW72b2lie9IHAmBY+E7Fq4t5xQjLtXjfDGTQyxqEhjXrneRF6WZH6Y5uV65K0L542SDbICqb3y8vPtl0KWd5EyGGVle4FgKS0CgLSwhEHLuHNMnCPXOa9eKrdxVDWmhyApFkivSXJMWGiEEZ2aSMlq45IRLoECIG70geG8SRa9e7iAbjJU356V4T4Xv+6+XlvU/MLkVy3IfUprmdl9/9ChffuQIx8+2kNLCth0yJWgnBdNRRivOibKCNC8otJ5TnVy5ZNWJXb3mFDOWiz9XmjRXxFlBJy1oJTnTUc5MVDAdFbQSxT/e8wgzYYxlyeUOc8dxnE/leX6MqhvDRbQqgbpt278thLhxOUtaSslEK2R8pkOhwLJtciVICoUlBWFakOQFudJopbsnRlUqIeY90EIZsM6VJssVSV4QZQXtOGc6zpmOCqainOm4YCYumApzTs9EHDw1ydcOHOMf73mUI6enVopgSaCQcIuU8u6iKB69yHO+qXmPSw5wvHr9hVLrT2qtq15XK7qRlZmfFYo0zbBtm71bh7n5yh3s27WV3VuGGG3W8F0Hx5LG7QKkBIlAitm+2k4PUFS9nCxp6ouKwhQW5UqjlDYnb1YQJhkzYczpqTZHzkzyT/d+mzBdtgdXlQ7wWBxFtwKdi8TtSEA3Go2tWZ5/XEr5VK21WmnOi0KRFQWuY7N32yjX79rG9bu28sS9W2kEHq5tIYXoArcUwlSny7kJDVIK8mJW/bpQhoTPlCLLC6I0oxUmTHViTk+3OTExw9HxaU5MtphsRSRpCkLgu31p6uRCCEtp/d4kin6s9BTyAYxc3qAjAOEHwb3AE0u3ylr1B5RFh0mWo/ICpKDue2xp1tg6VGPLUI2xZo2hwKdZ87AtyXA9WJKIlELQihLiLCfPC6bCmDBOmQ5jptoxU+2ImTCmFadESQZK4XpOPxXXuRDCVkXxU0mS/PlF2gQSkF4Q/JMU4rkl0Nv9gLwQpuAyzQuUUri2zUgjYMdIg+0jDcYaAaONgGbNB2C0HiCEQDMrPTLZiVHKuE3TnYgky5lsR8yECdOdmOkwohWmRGlGnhdVC1Vsy7xkeVr0qaljwFTrr8VxfNvqOKzBuBRBp3Kr7kTKf6aP03bljVFyLtqcoLkqjKWiVcX6ghBIKXBta1F2sfpeVqiyohpMPJxu3r+UxnKypDTug+g7IzlHCEtr/RdJFP1INQfrzAnmXq32ExL+XGudYSKFq5/n0iosSgBBzZ1jIcC1rRJ0ZqfPAJaeO68G6RHCzKklzTMSPRGBpfi4PkHnm3EcP3EAHwMiudrv318GQM4bdHRP/oZZ9DbCrsjKKm5dRkj04sJf1fdc20LYVvezdA8qVYUAujpxV5czIrTWV1wk16oALKHUL2vT/dI653muFqQlcSxrwRxXrur8k9Jz7O5/z5/X6kv1HNcwCXAQMh+AzuxC0HAHptH9mltx3c2hz29jrSE0CAzY1S8C6EhAObXaE9H6prWynHsjVhdxXvu598G4zCev0sppANf2swGEENi2fdEVAs8baM31H7sIz1MCSK3vKLWKisto32QD6BhYOgLQnudtX67kobtbpCSKIrRSSMsiCExRdFFszn0jhJi+aH9b6xv7qdy0LKskjhVKbVrvpEye0ser27rMwHZg6cynTqSUW1mm5MGyLJI45nte/nI+99nP8vM///NcddVVdNptOu22QWHb7m6QTXPjWj+2Vu7NqjYgoE3G94qj027TbrUIw7BrZc7X01lnoDYEvmVh2+bs7QMMdTnBpy7CfA9AZyPuPWD3snU/QqC1Zs+ePTznOc/hT/7kT/j6Pffwzne+k+c9//mooqDdatFpt8myDCkltm13gUhKeUHAaP4GWMWGrOqdHr4op765gK1L6iGXlo3nebzrXe/il3/lV7jliU8kjuMuAFVA351jIdZsjqt5XWxu8zwn7HS6YKiUol6v009IS0l5aAAdA/fK7AKta+WCXXblXHHFFRRFQZqmDA8P8+M//uP8+I//OPfeey8f/ehH+fznP8/999/PiZMn5yxCISWO43QtofM5qU1ERaOUIs9zsixbsOBrtdpy+SPaUCpaF3n+rS7HczF4pT42//d///fzYz/2Y2RvfCN33303f/VXf8VnPvMZHnn0Udqt1uwpWILDuc7x/HnN8xy9iAUzOjbGtddey0033cTTnvpUvuM7voO3vf3t/Olb30qtXl/W1ZZKfXsAHQPQ6eJJP2+qgMO27S7HIKXkyU9+Mk9+8pN5/etfz/j4OA8//DD33HMPDz38MN/61rc4cuQIZ8+epd1uk2drwCUKged5NJtNdmzfzt69e7nq6qu56cYb2bFzJz/3cz9HGIZLbbwKdE5mWXaw1/q4GBbPSkAwMTFBEATYts2zn/1snv3sZ5NlGQ899BB33303X//61/nmgw/y+OOPc/bsWVqtFupcOTYh8H2foaEhxsbG2LF9O7t37+aaa6/lumuvZd++fVx33XXs2TO30/Tx48dXCqvL8uePXcT5HoDOhrJ0hGiIFRY/wL59+1BKdf/bskx6SVEUXQDaunUrd955J3feeWf396Mo4uzZs5wZH+fUqVNMTEwwOTHB2bNnkZbFsaNH6VQg0SPDKYArr7oKx3EQQnDVlVfi+z67d+9maGiILVu2sHXrVhxnNq/uS1/6ElNTU9SXPnV1aUU8hCmBkOto6VTRQtkD9EsW1DqOg+/72LZNURTdeXcch1tvvZVbb711lvvpdDh95gwnT5xgptXi7NmzZGnKiRMnED3zWo2itGh2bN9OUKtRr9fZuWMHIyMjjI2NMTY2hud5S66H6nq01hw4cKDrgi8F8pgC26MD0BmATrWKRvuJpHz729/mO7/zO3Fd1/gHWptIVun/V6RiLzBVUa49e/YsOCHXalQun+M4fPaznwWtl+M3dMmZ3NvDz10M98pfzq3Ksozt27ezZcuWLlFbgXw1x9XGdxyHer3ONfU611x99ZzPyrJsUUDoBeql5jSbZ5WKkjeqnreUklOnTnHy5Eks217W2tFwKonjMwPQGYBOtZq2rWTmO67Ln/3Zn3HNNdewZ88eduzYwY4dO6DcCNWCE0J0N0eXvOgBoep0XGyjLWdlLbb4q9+RUuK6LlJKvvq1ry35e/NMjq9dbKhfbr5t22ZycpI4jmk0GnPAQCk1J3oEcOTIEb76ta/x1a98hW9885scOXyY02fOdKNevc9Ha83IyAjDw8Ps2rWLa665hhtvuIEnPvGJ7N+/nz179mBZVvc55nnenefqeRZFgeu6jI+PMzkxgeO6S815lXH9GBBfRJAfgM4GGarcgNuXiqRUC92yLN773veyfft2vv71r/OZz34W27K4+eabefrTn06tVlsSOMQaRlbmE59VpKf6Ow899NBypj6ApbVWlmXdv1FPXa01nudx8sQJfvjf/Bt+/41vpFarMTo6yvDwcBcM7rvvPj7ykY/w0Y99jAe/+U0mJyfn3ugy0byZVgt96BD333ffnO+PbdnC/v37ueP223n+85/Ps5/9bLZu3bpwEstreNvb3kZRFHhSLunOCiFQ8PBFtiw3v21wKd2H5/tfFUI8lVnZhwWm/ujoKA8/9BBjY2Pdn4VhSLvdZnh4uOtyrSWgzLeKei2bxTbT3/7d3/GaH/qh5Ux9VZKaR5M43leevOtZ8dyVt/GD4FvA9SxS6yalJI5jrrn6at75rnfRbDQ4dPgwM9PTtFot0jTlIx/5CP/8hS+QpUYA0fW8Lve12NwtZVn2HghKKbIs634mwBW7dvHsZz2LV7/61bzoRS9CKcXp06cZHx/nDW94Ax//+Mep1evL5erkQgi7UOqX0zj+YwayFpc16FQbwPd8/1EhxJ4lN0AUcc2113L/ffcRBAFFUSxwo863KLA3GjbfPVtsxHHM+Nmz3Qfx5je/mTe9+c1dQFrieoykBfx9EoYvZ/0zY/sGnSiK2L9/Pw8/9BAAZ8+e5W1vfzv/881v5uTJk4YUKqNalfu6FoWZvbyN1pokSboRx6uuugo/CPiFn/95XvWqVzExMcH3vOIVPProo3iet/ycF8VPJknyzgHoXN7ulQB0rVYbVVqPLQemSinGxsao1WpGCLyHx9HLk7Z9AU2VX1J9bhiGPHboEAcPHuSxgweZnJzkyOOPk+c5qig4fOQIx48fx7YsbrzpJp5z552MjI6yfft2Tp8+vWKOilDqKxf58FhRMrqa5+PHj/O2t72NN73pTUxPT2M7Do1mE61UNwJ1IdzWynJxHKcbxTp6zJSq/e7v/R733HMPr3vd62g2m6jyEFoB9Abk8cDSKaudHecWy7bvZQlpUsuy6LTbfPfLX86HP/Qh8jzvyxJZblS+fy8Rev/99/OpT32KL3zhC9z/wAMcPXaMJIqWfgBl1nNFag4PD6OUIk3T5UCwQAgLpX4ojuO/Ki2dfJ3XjR4aGhpLs+xRYIwlSk+UUjSbTYIg4Ojjj+O4Lp7nzQmdr/uiL+c1z3OyNO1eU54t24Gjcq9el8bxfxtYOgNLByHEXma1eq2lFtquK644bzeqcssqsDl48CDvf//7+eAHP8jX7rmHNEkMGloWrutSbzQWBZBezqL6eRzHc653hc3TKTe7Xd73uu7ioigcTHeEpU8EKWm1WkxNTdFoNimKYs2tmnOxggBsy8JtNLph9T7nfOcANgagU4HO7tI0Xnbj7dq167z4ml7L5tOf/jR/9ra38YlPfILpqakuP9FoNueY9/1Ur/eGgvvdOwruAP4JCHue53qAT9X5YQt9tGSp+K3zAZtqXtbSOtI91uoq5r0zgI0B6FQru6+MvavnJZ31ezJWnA3AP3360/zxH/8xH/voR00LG8+j0Wx2uZ11OMkttNYCXu8HwasR4r2WEP+70+mc7v7cELv6AoIOeZ6PIIRNn6UQ5wIKVCJdPekEXcnS8+DhzuPkOTqAjQHoVIk5e1Za9EKIrqXT72ItiqJbmfzFL36RN77xjXzsYx9Da02tXu/m11wEl6GKIF0n4HfyovhZv1b7U0uIP50HPsWFAh0hxC5t9GXOWap00YdZ/gG71Iy2bRvXD7CkJIlj4jgCIbAsmzzPyEtrZT2kMoQQ4QA2BqBTrdOrl0sMVErhuK7JPu4DdHpdqePHj/Nbv/3bvPc97yHLsi7YbADRr1LPXCshxA4B/6VQ6mf8Wu1/xmH4P4DoAls9e0rkO+/Prg4FW0psaWFJiecYsK8Pj3RrrjzbRmrwawH1RrNbOtJqtwij8Fzc1L5t6dJlPsagC8T5TeQlAjpSa7299xSezwfkeU6z2exmpS63KKvMZcuyeMef/znPeMYz+PN3vAPbcag3Gn3zNOv4DG2zb3UO7BDw//pB8BU3CL67h+OxLsAmvHpNwAaoeR5DQY1GUDMC+D0cTl4m+mVpihAwNDxMrW6eA1rjey7DzSZbR0Zp1Oo4jlPG8s3/1tjSSZgt/hyMyxB0qhOniekzvaSlk+c5W7Zs6WYizwed3kiSbdscPXqUV7ziFfzbn/opTp0+3SWHzwdsehPWLkBJhZgHPk+Q8GEvCN5dr9e3l+Bjr+HfUghx43LW5fInRVlpbtnUPJ+652FJge/5s/VPFfAURc+cSbRWZElMniYUWWqihWU+0NatW2nW6gSOg++4OFYPgK2FQSbEH2FSBDIuzQ65A9Dph1vwPG+LEGJsuc2ulWLXFVfgeV7XdeoNV1cZwEII/uZv/obb77iDD33oQzSaTRzHWRPOpvp7eZ5TFIUpepxXKrEGG6MCHwUoKcSP5kXxNbdWexkmr0Ry7vlZ1WdnXq32k8B3cA4NDTVgS4vA9fAcxyg0ej5erYbjud1nkuUFluOYcpAet7eyQqWUXdEvAMtxEFKilcISEkfa+I5LzfXmANA5RsBkuZbu9IPgi57nXV0CuTOAkcuL06m0kbfr2b7Si7pXADt37uy6T72SoO12m5npaU6dPMkf/OEf8td/8zdYtk2j2TxvsOlN669ArRbUsB0bKS1UnqHyHA3kRVH2vlJdMDoPfkKWfz8XQuwRWn/EC4LfTaLot3t+rlb5eRrIfd//VbT+w9XyGlUvcs+ysedV9UspTeNB26Y5PEwURUxMTJSqf4KpqSmyPDeuk1L4vt9tpqcNscXI2Bhaa6anp03WORpVKGr1On4QMDUxgWNbpHlOnKYUSq12bgVmPm9EiA8GQfCvoyg6ymxC6qAA9HIBHa31lcLU2Cx66lYLa8+ePcZ9chwEcHZ8nEOPPUYcRTz++OP8wX/9r9x3333UG42uRXK+YGPbNrWgZiIvUYRlWYyOjXUBSAHh9BRoSPK8e8qbzqKaJM/JigKly5Dx6o2UyupBCvFbvu/fEsfxTwBT9B/dqgDK8X3/zUj5M2XEqu/+YlprbMui4fsIaXJ2qshfZfUJIUiiCOk43PyEJ7B7924e/uY3CYKA22+/g6NHH+fRRx/lO1/yEnzf59ChQ1x/3XWMjo7ieB5hGOI4Dvd9/V7+/M/fQa1WA8DzfbwgwHYcdJETOA6e45Bk2bmAj621LhDiSRruC4Lgd6MoenMPbzboDnGJg44xueFqa/YwXXJce+21CCE4dvQojx85wpkzZ2g2Gjz40EO84fd/nxPHj6+JdaOUwnEcRkdGjVVTVovHUYRWBaooKMq/IeYUdRrAaTQaJHGEFALXcYiSFKUVeVmnpLRaLfhUVk8mpPxez/evEfCKOI4P97FRJKAajcbWvCjeJ4R4QckZWasBHMey8B0HtMZ1HfzAR1qSTqtDnufdBMKp6Wl+7Md/nKc95SkcPXaMZz3zmViW5B8/+UmuvupqfuInf5K3vf3tHHzsIL/4H/4fGs0mf/Rf/4jnPuc5vPs970FrzRt+9/d4+ZmX80+f+Qzbtm83VedJgpQSz2+Q5xlkmQEf2yZKU+LVyc9WEcExhHiTHwQvQ+t/G8fxEQblEX1N3mbnpJRt268SQtzOEq2EK1mLH/iBH8B3Xb5x332EYcjWrVv5whe/yG/+1m8x02pRq9XOmSiuxEmlkAw1GobM9H1QmjzP0FrPkTHtio5r4wIUJaBUGjSu7yOlhWXbpFmGJSS2ZWGXHRO01qjVkzOWZVm5lHKXUuqVlpQfK4riNLOu6aLzGwTBLqX1p4UQt/f0KxfLcWi9gOO7Lg3f71aRq6JAlOR+lhmLxy9/7nseP/pjP8q//9mf4XOf+xyTkxM8+ui3UYXiw3//YT728Y/z2KHHuP666/nzd72TPbt38+73vIfdu3fznS/+Tg4dPsTjRx/njttv5/Of/zy1Wo08My6sbds4rktQayAtiyRNsSwLx7JQWpOV1lfvtS9jAVVBjEIIsU9r/Rrbsr5eFMWBXutyMC49IrkKnVype9ytxSwP27aZmZri2NGjWLbN1q1bef/f/i3/+b/8l26blHMBnK7OspD4tsvObdupB3WT9p9lFHlmKqnzlDxL52i+VC6FFwQUSuN6PsMjI3hBgOcF3Y4IZnXrbojYc1yG63VqrrNqYrQoCltrXdi2vVva9qdc172ptHTkYq4rUNdaf0AIcXMP4LAc4FTqhwC+61L3PKQQOLbhcpTWFHmOznOkMHxMNR9SSkZHRrnxhhtI0oQDBw8ipexKU9x6y60kScI3vvkNrrjiCt7yp29lZGSEXbt28+73vJvJyUle9cpX8eijjyKFIIvjUuB9NvKolcJ1PYZGxvCCgFxpHMum2WjOuZeVpFArYl1rXQghdggpP+H7/mtKS8cewMul6V5VKLGXpXovIdBKU6/V2TI2itaasdFR/u4DH+CP3/Qm/CCYo9rXP9oZq8axbGxLIsWsFRM06oTtDgKjemc2kwGQMAxJ0xTLtsmzrLtB8zzHDQIKrWl12sxMTtFsNAiCoAsqjUYdylB7liTYQlJ3XdKiIO3hg/pw/ywhRGFJuUs4zsdI01uBVg93I0rrJ/d8//8KKZ/RD+CUplRXo0iVUSRd0vu9KQO9D0srRRiGFErx5Kc8hfsfuJ/bb7+D3bt38+QnP5kbbriRf/iHv+dXf/XXeO5znsMD3/gGMzMzPPtZz+Lo0aMkScKuXbt45h134LouX7/nHj78wQ/g2hZxFM4Betu2cRwTIbOkJEcgLePibt+xg5OnTtJut/E94/5VVnKf7pZEiL/wfZ84jv/vwNVahojdxNeu2bMn8MbHHxWm0+Sc6JXALPAsy9i2bRt/8qb/wRVXXMFf/OVf8pa3vhW/bCe8GkuhcpMcyzIhWHO8G+JYKfxajZGxMZI47r6GhobMpioKtm3bRqvd5vSpUzzlKU9h27ZtPPzww4xt2cITb72VsNNhz549COArd93FI48+2s26rdVrSCHJs5Q0TWevxbZJ85wwSShWB565bdu2FOKDMzMz38tswagECt/3f0tI+Tv9Ag6A67pd6yzJMiQwVKuB0ggp5llFkOYFnhfgeh4a2LljBzfesI/t23dwzXXX8egjj/DQgw/y1Kc9jemZGT769x/mxhtvZGRkhMOHD6OU4uzEBCCp1QKyLOPM6TM4tkVR5ORFgSxBUGsNUlKrN9FaoYrC8ErtjpEqDQImpiaNbrNld9MXVlEZX02+0Eq9IEmSzwzI5UsLdMypHAR7fPg28yQWBLOnahiG7N+/n3e/4+2872/+hje9+c2mf/kqXBOtNVIIAs9DAJ4fUKvXmTx7FjUv+jEyNoa0bXbu2MEPvfpVjIyMMjk5SZHnDI+OgDblFWEYcuz4MZ5+29NpNpt85atf4dZbbuWd73on0rJ47Y+8ljf98R9z1113GaJVSmxLGldEKRN2FrOUcpYXpEVBnKXYltVvdXvmuq4jpPztmamp3wVcILWD4Ok2fJnZPJy+1opT5t1UcxbHMdu2bsO1beKwY7puCIGQkrwo8IM6tUYDrSFPE9IspTU9hQaC5hCT4+PoQpEVGa7jUq/XyNMUaVnUG02SJCaOk26bG6uUE1GqIC6tJwBLmvQkx/NIk8SAiBQ0m03iKCaOY8IkxnYcHNuZky+1GumLHktxWiv1lCRJDjHQU75kiGQBaNtxbpDwM71WTgU4FceQJDHPePrTsR2H33vDG7ou1WoAx3McmkGAZ9vkeUHQaHRDsgjRDcP7vo9WiiRJ+OX/+B/53Oc/z/v/9v0gIEkT3vLWt/LPX/hntm7dwlve+hYeeuhh7n/gfr7j+d/Ba3/sR0mShFarzQP3388DDzzA93zP9/D3f//3plGdlIjSTbGqDN3ZiyRTBXFiNmDFR6zkNgohpFKqkFK+oF6r/VMZ0XId2/6wEOKKfrm/6jp6ZVqlNACZFTljY1uwXY8iL4zLmRekWYYf1HAchyxNUEXeJctdx8FzXRqNBrYtCYIaruuiNdiOy1CpZ13Ji7q2ZeY9zYwmkZBY0oIymbBKQ3Bdv4zza4SUuJ6HEDDTbnf1j+YnaFbc2yrWpQJqwB1Fnr93ADOXDpEsyhvY22va9gJOBRiO43Ls+Al+/4/+yCQF9gk4FUfSDAKaQYDAmOeu56FK1TnP9xkeHaVWq9FoNEzkyXXRRcHWLVt55JFv8fjjj/PItx5hamqaf/PDP4zWmv/23/87cZJw++3P4Etf+hKv/83Xk+c5SZoSRSEzrRbbtm0lzzJECTBZkS8wN7pZ1bZDVFoAdulK9NkTXQCizJJ+O6C8IPhxKeWTmM1gXv5o1xrf83Bse457p7XGdV2SODYSpbZNY3gYx/NQogTrkvMq8qwrWVGUaQVxp0MahdhSYknRfR5V+xpRAoLukb2QPT+vDTWxXW/2gBESpDA5TyWPl8YJ0+22SUJynEXXRVEUeI7DcLO5XJvn+Yd5LqW8wwuC31mCqB9YOpv02pXlOC+SQry0IvKkWPhsbdvm5KmTpFnWzZnpB3Bc22YoCIyrohR+rUGt0TQnKIbDKYqCoodoNJZVwvXXX8/V11zDmbPjHD58mEa9we23P4N3v+c9jAyP8Pa3v8201X34YX71da+jXm/wjKc/g1e/8lXEScJtT7uNV73ylbzjne+i0Nr0NS8KVGHck4qA1VLSGB5hptMmyzJz8i8SvVvp8CkjMNv9IJgu8vynEWI7fSb/CSFo+j5ZmeTXKwNbHQBJkjA0NGQ2cZ5385QazaEyUdL8oTRNCaPIkPtaU5Sh7Ly0mLKioNCKLMsJ44h2FJJkJs8mzjKSPCdXBUmW0glDcmVI9iwvQAgC3++G7T0/YLrVIkkTfN9finQ3GeyWRd3zKVRB3p/lIwAl4E7hun+vsuw4S6cmDDidTRR5y4Mg+K8I8Stlwpq9GOgorVatPGdJSaNshYuUOI5LrVZHadPeJE8TY6RrjVZF90S0LIu80DzlqU/hCU94Anv27GH79u1YlmR6app6o44lLf7lS1/kqmuuZWRkhFMnT5JlGVMzM+YEVwUIyRe+8AWOHTtGY2i4GzaemjiLY1m4nosWglqjyUxrptsrfP6oCGeN7iehUAsphV4FGV3l4TR9nzDL6EQRnuctsDbTNGW4OYRjWXi+R9gJSZOEenMIaVtEUUSaGE6n6GlqqLTuinXNFm7S9aYFc9vQLGYF9pZa1PwAKQW2kNTqdU6cOb2kRVhFrvI8p+EHeLaFFoLpToeirI5fMbpqtKw/G8fxdwy4ndmNu6mH1vrqshp58V7a6HOKUAkhSLIc23VpNJpYlt0ljIXWpD1axpVioGVZIC1qtYCHHnyQxw8fIYpN6UOaJLTabepBQBxHzMy0DOMoBGmWYkmLxtAQlhSErRmk5TC2ZQu+75PGEY7r4Tg2tm2T5TmulNTrDaIkZmLiLJ7nL8pTFUrRCAKU1kRxvNIJvSrAqe7fcxyQkkZziE4ULQjdV9eUxjG5MO5NVuTEeUbn7Bkzf2VVhSzJf9u2EWXJiuO4pElMkmV4ZRYxQnSLwYCu9bdg12uN5TjESUIUx7RDozbqOs6KISWtNYVSuI7DyOgYYXsGoTXNWo3pTl+qpRZaF0LK57tB8Io0ij44iGZtbtBZMUdntWBTia1XEhZ5XnTN86HGULcRXxLHmOhrqRpYFFhllbrbk3l7duIscRSR5TnDw8OMjo6amqMSYLoRH9vqFkAqpQi2bEUjumRwBSaW5eAHNVoz00ghieKIM+PjOI47GxJexK2SQOD5xKVg/FoNpRSNeh3PD7As2xSxilnupdLKKcoM5KqGrJ3EqPJnUkq8kg9ybBtbWqbhnuvRmZmi3hzGcV2mJiZIpiZLt7eMLvXcr170eUKRm/c3a8aqqRIQ0zwnac2YXJ0sw+6JuvWuHVUUeEENz/fJ84wsTQhcD2HbTExO9qVWqEFLrX8L+PDAvdrcoKMBVwtxhVjmpFrNqMK9Va+mCnxm2m1a7Tau4yLLCJVlm8hIlQhnTl1BHMckpb6LY1vUAo+8cLAtu6v5osGUAkhZVayaXlg915tmOWmWEZQRMrsqjiy5EI2m3e6URPlCArSywCoLQGhF3fdpl3zJmkQhpKTRaCKFQBU5WWIiU70cUlbKeAghyEs31LYsvDJL2XNcUzGOIXW01l3i3HK9ntC6j9OyDHChzXz33Mf84ICmSkbUJGmKY9sIIbEsGK7VupXmaTnvaZbi2E730KkIa5Nh7RB1OuRZRq3RJIoims0hWq02eZGvNJ+VtfOUIAheEUXR313u1s5mBR0B6CAItmqttyzmXq1WNa6q+p7f/rcKP1c6yEop4jzDEgLXsvA9D9vEsakPDzEzPYMquR2NyZ3Ji4K03TK9lYqCJE3Kvk/mNNaJuVLDP/RUVCUwU7oDVdhXl1GbThSR58WSJ20FmJ7r0mwOEXXa+I5Dluck/eecLB+xcj1810MVOZ0wNfctBHnFx5RzFrgujm1jSclUp4PnuuzYtt1EkIqCLE1Ly6W89qJAWjZBUKtuBqcEp8nWDK12m8B1EeW9V8/FLcFXlNrKqSroRDGO45IlCUWeUZQth3VRMBTUyAozH2mZAKjR3QOi6tSq85xOYjg8z3XxXQ+JoBYETLdm+ppLbdqU/Arwd5e7tbOpQScXYocF9cVI8dVyOFUi3fx6m15Nm8q9qiIaUZaRFQXNWg1p28y027TDsLt4KyCpspbbUWjKAcqwvpDSkM+lxWNZ9qx7p2bDwosJvyftdpdgXaqFsakp8/FrdbI8R5X5MqfHxylWPqFXfACNep0iz8iyFISZuyTPuhs2zTJqnkfN88z3yrnUShGFHbygZpIbS+Gt5f+gKTNp1Go89SlPNTVddZOikOUZeZYTRhFXXHEF7XaLJDHpDKMjI5ydmCRNU/LCpDls37aVmalJvvSFL1Cr1UxWdxlmb0URylK4rmv4HNtGFWVtnjLtiW3HQamCmu/T6rT743ZACSHu8H3/eXEcf+5ytnY2a8hcAtq27WcIIX6InjyI1RZAaq3xXGPq52XOR2X1LMf9VJs8L+ueOmFIp9MpM2IdXNcl8D2a9TpDzSYWYFs2nu3gOg5bt25laGiIVruF57p4tott29RrNUZHxxgeGqbZHKJZbxD4Pr7rESUxnuNiS4nnuUanx5IkadqNuHUJr3ITDdXrZcEj2K6LQGDZNlFPTdI5kPe4rsvoyLCR6wBqjQZZllKU+j9FUeBaFo2e2jGAOMvwSqvHcT2klF2XsXd+pWWZyFT5LKIwpNNp89KXvJTTZ8Y5PX6GoFbn1OnTHD1+DOlYHDp8hPGz41x51VUcP36Chx9+mFa7xeNHj3Ly5EmyLKcTdgijiH//Mz9DkRfcd999WI5jrrcMGqRZRpqmIAS+45hDouThpGWRxLF5v+Og0CRp0s9cFkIIS2s9XOT5X8EcHnxg6WwSSwcLrqyIunN1q4QQDNVqpqNAYVwhVfIky5GEeZ6XFg1dcnL7tu0EflDyC4ZMTuKIyYlJQxCX0hnNoSH8Wg1d6u7keY7r2eRFQbvVIo5imkNDpd5MC8uy8MrCUK01Nc9FaWNpWJbF9OQErTju8jsVn2NJSZHlxGGE6zoEtTpCWtQ8n+lSce9cQafmB+RJglYFrh+UcyWMGqLW2GXKwWJkr8mkNi1k4ihkemoa3/e6If9eCdk8z2nNTJPEMZ7ncd111/GlL9+FEBqlctqdNidOnGD87BksaSGlZmR4mHq9huc6BEHAyRMnybKURqNuonxobNth9+7daK1wbQu0ot5s4gemvOX0mdNEUUSSZQw3mwiMK2jZtmkFbVnEUQfPceiIvvL+LK21FkK8zPO865IkOcBlGkK3NyngVMfK1YvSy6vYPIHrgioQAkaaQyR5RicMSdIEt4wKLTiyylocE3kq/X8wgFMCg5CGiM4LzXd+zys4dewoX/3yl2kODeH5fpf3CWo12jMzWFIgpV1+vmJqcmKO1ZYkiVmh2tRcKaWYmZ4CTD3WcK3GTBiSZpk5gZUyOjGqIAh8siwny1KENIWqvu/TCcNz6hVVbbo0SXD8wJC9mdEMCtPEuF61mnEfq1qrko+adTch7LQJO21sy+QgVRZkFIY4XorrurTbLVQl8iWNPEa9VmPbti381m/+Z9729rcTdjqMbRnjxMmTPOnWJ/HCF7yQ7/2eV1Cv1zlx8gS//uu/QZ7nhkzGJItqpcjyrHttRtkxxLJtpCXZsX0HYRRy9uxZJmdmGKrVSOIY1/NwPQ9pSbIkxsIkHPYxlwLTD93TUv4k8PoB6Gx8oLEwafkao8Tf2wJF9Fo6fftoZQGnqsodhkcYBjpBh+l2iziOSykEZ3bVlIBjSYnvugSuS5ymdJKE1tQE9aGRrlB4mqb82utex3fu3cu47/JLv/t7PPTNbzKyZYsJJec5eZoSxTFDjSZSK8MDiXIlal1yQIa4ldIiybPZFjnSZErnhYmUDdfrzIQhSZKgMZ0WlDIA2BxpkCYJcRwjfJ9GrU5U5hqt1sqxS10cE7kpc42iiJl2CyEEe3bvxrbNnHVaLfIk7kYDqyS/KIpROuwKs1tKdvu4AyRRSByFSCnwPLcbeu+EES984Qu48sorOXT4CE9+8pO5/vrrQEg++tGP0Ol0+MY3v8GhQ4cYHR2j0ajzvOc9z9SAZRlKa5qNOkEQUBSqG+WSUpqIohBGpsQW1PwAMbaFqdYMrTAkyAukFEjbIQ6jLrnv9LTMWWnJlYfIDwO/a0IFl18PLXuTAI4uAYd6vb5dSlm0Wq2zWohd50qFKqUYHRnBkibKFHguUadjOAStGak3aKEJk7TLYeSlxETd8wjKkG9vR8pKZEtKSbvV4tnPeQ4veeGL+Pbrf5WRl7+C7/6+7+Mb992HLgqSJMGxbW6//Q6++dCDdFotfNsmjOO5BU+l7yhUgWNZJFlKXqhuXk81srzAc2xG6nWmw9Bca5EzHDSM+1fyJJWFYkkjhZqk6aq5HauMOglpMonr9TpREpPmOVfsvALX9boup1+r0U6TbsRLo8mVkVs17pCxDHNVkOseS6hMFKx6YGVZztj27Rw9dpSPfeITjI2OcvLUKaQQjI2Ncc011/LiF72YT/zjP/KRj36kS1zfdddd3HHHM+m02xw+fIidO6+g1Wpx57PvJAoNBydsmyRJTMnF5ASWtHBch1pQY2h4BMu2OX7iOFGaUNM1RFGQZyloqDd8irJQtQ9ZEQkUUogrXdd9QZqmH+Ey1NyxNwngeM3h4Z8TQvyIVuoaVRRFrdH4uiqK/T0Ps//TGpMrMjw0QpLExoySFp1ouqxOlmR5Tt0P8IM6k9NT3WzerVu24Fo2SRSRqaLcNKWrVm9il1aRFoKnP+02lCXZ+uuvJ00Sbh4d5fp9+2i1WgD86q/9Os9/6tN4fPw0v/yf/hNHDnzbhOfnE6uA57lYJaBlqsDTC2vIKn2duuczE4VkeU4rDKl7vhE8t22TvJhnpFFM4PtdEno1c+d5PrZtEScpQilUXhClKc1G0zQj7OlTpfVsEp8BFNEtxzDFnYp2HBOnKXnvtQjRrSCveS6WY9rQDDUafN8rvoe9e/bw8EMPE0YxzWYT13PZunUbz3jG7Xzyk5/gF37hP3D27DhDjQajY2NopXjyrbfwhCfcwj9/8Qsmx6g5RJimpJOThJ32HHvDsm3qtTpbt20lqNUI/IAwjphut6m7Ho4lSbOcPC+o1eskeU477IucN8asZb0G+MjlSCbbGxxwJCD8IPiHIs9fWBGk5WZ7Qc8DFquLWClqtQa6KHBsI6uQpymO5+EHRlM3C0MKrSkyc0r7nsvQ0DBDzSGjZVNmyeZ5Rq5Mop9dkrhJkhBHEVu2jNGs10jCDkiLej3Btm3OnD7N9//AD/CCF7yAg7/48zSe/x18z6texf/43d9hKAhwpCTNi26IuSKM4zDEsSxypbBdjyQPF7s5HEuW7k9BkmZGCF4pmkNN8rxA5QWWbWEJ0z9qNdINQhh3RzoOKoqxpGRyehqALVu2EHU63RbOQgg6rZYhloUo65XEnP3Xjk15w1CzyRNuvpm9e/aQZhkPP/wwBw4eJEwTbEviuS6dVouiUNTrTY4eP8no1m0kJ0+yfedOijznXe96F5ZtGu695z3v4eYnPIGXvPRl3Pv1e7v3+cA3HmD37t00h5pGcTHLcH2fm29+Ajfs30+tVuPYsWM8+NBDTExMMD4+zs7tO2g0GsRJbELvWcZI2Vrach1s16MW1AhLMr8PQlmg9YuBIWDmcnOxNjLoWJgeS28VQrxQKZVqrW0xuzuU1lqafSBWFSq3pEWjOURRGH4kSU3tk19vGCunm8EKU50O9aDGti1bsFy3m+VreR5+LSBPMyw0aatNEoWE7YJrr72OF77gX/G1r32Nj3z0I0xPz+D7Po1GnRtuuoktW7Zy57PvNCn1r/0xVC1g96kzBI1G2e1Bz5p5SpuX1DRGRtDtFhOTk4hS+yXuqafKygp0rTW2tMjKxLwky4jShHpRR+e5cYkaDQNQZa7Q6lh8geN62E5MlsREacKO7TuIOx2SMhSfhAKt6YqdK6UW5OKYHl+mbfB3vfSl/OCrX11yV5KpqSn+3ze+kYe/9S2KMs+nXquRpAn/8LGPoVTBrbc8iZOnTvLP//x5tmwZI0lSGo0Gt99+B1/72ld531/+Jf/4iY+bv6MKtu/YQRIn7Nq9ix/4/u835DWCK/fu5dd/9VfZsmVLt4bu/X/7t7z7Pe8hz3OmJ84iS1fQkhKlNNNhyNjwiElTkBLf93FsmzhNl6wD65nCQkq51Q2CF6RR9IHK7RqAzsYAnFcLKX+mlMt0553GVq9b0TeXozV1z8exLKJ2RJHnBM2mqcYuk/DSNEMXOa04wvd9xkZGEOVJmWdZt1lfszmEKnLOjJ/Fsk0vp6c85Slcv28f//hPnyIIfJ51++3c/oyno4qM4ydOcOTIUeIs4/DjR8nSBO/qq8jSjOP3fL0UZ/dol8WEQghs10Fpheeavk2u4yIExEmMLa25fmgpBQGUGjTSJC8GAdNhyEy7RWDbOLZFkiQ0m01qeY0kn1lVikEVsXNsm8npmEaZhxTHIbZtdaPkQoAuLbO0lKeQUnRByLZtXByyLOODH/oQ9953H3v37iVJEg4+9hgnTpzAcRwsKbHKEoWh5hBKKa686kpuf8Zt/MNHPoooxcLCMGRkZASlFDfecBO3Pe02Ou0WH/nYx3A9l6BWw/N8XNclywuGhobQaA4+9hi/+Z//M/tvuAHXcTh+/AQHDnzbEOalWiOAX7YDqvs+UZow2Zphm2OThCYvybFsEvpyVzWmHuu7gA+wudUeLgnQkYBuNBpbszz/E5ZooHc+Plvge12XA7ThUCoJhPJ77SRGAUO1urE+0pROu90NDQshGNu6Fc/3cVyHqZlpnvakJ7Pvhht439/8FT/4ylfxyu99BXXfw7IMcMgy4nPvvffyv9/xTu5/4H5e90u/iOM6nBkfpxOGNMtGf77vd5PRRFlmkcQxuihwXY8ojgkct7ta8x45CADf9xhybCZmZsgsywBPp4PyAwLHpiittUApWmFnQfuV5SJ+eVEgs4wwikAIGkHNkLJyFnCMnAY92j96thK/57AYaQ6BhjCOeOCBB3jggQeqP4TneriWje8HRm1QFVxz7TW8+IUvZPuOHbzsZd9FHCd8+9ED7LlyDzMzLW68YT/Pec6d3SjbI488yvj4WVPrZVlkWUaj3jSWU73O8PAISiuOHjvGkSNHutfmeqblcd3zFDDPqgAAQytJREFUAAOSnmOE0tI87/Jm45OTbBkeMflew8NEZTFrH1EsATwPoz2dDUDn4nM5RZ7nb5RSbqt0ctbigzUma9cqxdorucp2u202gyqMhIUwbkHDD4iiCB2Gc076KuckTRI830eUPaluu+3pfOTjH+UXfvbn+NcveiGTU1Nk9SHwTdJbkaUUWcJtT3s6b3vq0/j3P/+z/K8/ezs/9RM/xic/+UlDEqcZlm0xNDradRkrfeYoDHFsm8DzmWm3cC2bQmuSLC0Xuu7eaKoKmr6P77pEWcaQZVHzPDpxhGM3CXzjsri+j+95pHm2ot6O0grP8XBshziOmG63qAcBUaeDVar2VVX3ZT0cjm1T81ziKC4jX7I7j1Vh6NaxMTqdDgUax3XRyhTGSiFoTxsrzLZtZqan+fznP8+v/MrriKKYk6dO8cxnPpPv/M6XIATYjk0cx0zPTPO/3vIWHrj/AZ773Ofya7/x66Rls70kScnzHNu2eOzAASwhaNQaONLCdh3yzBSouraFW6oa5nlulAUty8xnkhiBt1qdVhgy1W4xUm/gljrN7U5npZydsj5YXOu67r40TR/kMsrZ2WigYwHKqdWehNY/pbUu1tLK0UrRGBrCdlySKMTzA5Suemybn3fSkFYUzQmJL2UBVARsGIZcf/31nB4/w2233cbL/tXzmZiaYsSv0/nnz9GensauN/H378e75hqyOEKg+O3/9Hr+wy+/jr9pDjE9OUWhFFEU4peJdb0cSFF2BfU9D881LVRMglrRTcDrBpsFFEVOJ45NHlGWEWUZNddFCsF0p43jOhSZKYC0pNVfx1BtSjksS9KOIqSUSG0iUFiCotBdbSFZgpAu3bBao04rCqnVAoq86Hb1rCwex3FwgObwyOx9C2FI/VIRMQhqfOXuu/nR1/4Ifq3G9MwMRZ6xd88eVKE4Oz1JUSg67Q6TkxMAvO+v3senP/sZ6vUaI8MjJGFElhuFwZnJKSQQlYl9Oi+QYFIL5KzKgC6vRWmF7ziGMJYwPDKMsCRTrRmKLGMr4DkubfrS2imEELaw7WdzmYHORqu9EoB2LettSHljeXSvmbasEILhoSFsaSGlheN5uIHfzQ0RUjLVbpv6KMspSQndPbUXA7F6o8H42XGe8pSnoJTih175/XiOTUMJTr/nnSjfxXIsZNhm4jOfInzwW9RvfgJaWOzcto1HDzzKI48e5KqrruLhhx8i8E2TPS8I5nQDrfikqk9WGEcIjBZPXhRzqrSNdyJxylY5QkqSPMd3XfwSsKY7HTzHRWiN5/smT2WFKFalEpgmKa1O27h30kKhybUiLxTllaDK91vlHKZ5TpwkNBsNitxwIL7vd4toi6Iw8hKeb9on61miI+x0uvftuC7tdpvTp08x027hux5pnHD81ElOj48TRRH79+/jhS98Ibfddhvbtm3jyOOPc/LECc6enSDsdOi0O4aMlxK3SnHoURisgNsq3doqeVRphWOb0H2UpNRrZcvovCDOTca3a1kkfbarEUJIlDqT5/mHB6Bz8bgc5dRqT5Hw35htSL82Vk5JrroCwijCdT2sMnO4DIExMdMyGi+2jV8LGN2yhTRNF92MFRAAFFpxyxNvYffu3TzzKU9G+j6tv/pL1K7dfGVsGx/46j0cqTW5+iUvxT5znPaX76Jx29NxHJvx8TN8+e6v8OIXv5gv/cuX8FzXiLGD6VqBkd3IktSk4ZebL8tzojjGsx1saWFJiec4uLaN7zhG+gG6nRXiMgfGte2ycrqgkyTUPN9IbqhiTiRsuYcUpabjxFCjSZqnFKWNVekcd3cVmG4M0hSl5kphMetWVbIheZYZlUTPx0oiGlJTswWJFnTCkCJNjVCaZSJIQWBI9ThLSz0eUwybpSk/9trX8ou/+Ivs27ePG264gec85znceuut/MuXv9yV+vAcByENWDuVzlGZZV09a9uS3caGvVKpeVHgOw5xlpGlGTov78WyCNO026VjFTrKeZ7nbx+EzC+elYPU+heFELLkcs7LyrHLbNYqBb4xNIRtO+TKqPkpjHaL53mcnZ6iKPKy57amVuZhNIeGmBgf726USqaCEgw6rRbSkoxt2cLN+/YhfY/4rrsRtSYP79zJn//hH/EzP/OzHD9+jDf84R/yK7/xeoIPvI/2g9+kfsftbN0yhpSCHTt3EJTN4oKynml6Zpo0SVFaGQK7MNcwPDxM4Jl6n7wosKVEShvPsedYJaLU/hVCELgunSTBdxzssvp7uhNyZuIs20ZGjdWzwiYRQpCUnUS3btlCc2iIYlzRjsI5glpVPNy2LGRpQRRKmYiaEHOO86IoqDeaeK5LLZ7gmm0WvqM5OZ2yxbI56FjE0kIVBe1220S8qmLckizWpZSGZdt84h//kU4YctWVV5rQ+/Q0d919N3EUzYlgWlXnCW2AsDk8jOM4nD19uisZ0gXa0g2UWhDnKa4Q1DyPdhxj9dRuDTcatEqrrE/AAbh6bGxsaGJi4rLJ17E3EOAU9Xp9R1EU36fXyArrzd8xSW0+usixy4JHhKAAOnFMWiZ8aa3BksiyqNJ2HIZGRkzpQBkqjqMI13VNaUSek6MZGRpix57dFMePU3z969Re88P8xW//Z374R36U537Hd+D5Ho8fPcrnP/tZXtGok5w8huV4uI7D6NgoYyOj3YZJtmNzdmqS9szCUHaSpyAFjZpJGCxU0W05M7/pXy9nUnE7nSRhuFQj9D2XMEmYmJlmqFYzCYWlhs9yLlYjqHUr5j3fI45iLEuaModyri0hcHoiVXlRGCEvy4TxjRFkrjeoBSST47zseodvz0hecZNHUig++60EWzhEmUcnjJECvMC4n61ybqI4QqiCWllDd/zECd73vvcZIa8e2QwvCKj7PpaQXWtGIsjynFpjqJvM6HoecRjONjEso3CV++3bxh30SusxyTMC1zNa1LWa0eRZmUieBR0htrTTdA/w4AB01t/Ny3OlfkBK2VgLAtmyLNI05bu+62WA4EMf+hCWgLSnRUqeJIRhyHQU4jsOVinLoEotGln6836tRlACUhrH5gQvLYhCFaakoDkERw8TPnqA+AUv4g/e9MdsHdnCS17yEj74gb9jcnKSLVu2MDQ8hJqIcP0atm1x/MQJdmw3Pe2iKMIvI1NJmnL99ddz6623smPHDqanp3nwwQd55JFHmG61TCsaIFcFrjJ9nPJC4djWkgDc8H2mw5Aky0wmdimtkSQJYZri2jZ5kizJYVUh85Gx0dnTX0qkAFfKsm2wmC17qE6T0tKp9dQnVZ0WbMtCSJumKzk4pblpKzx6OuG51wY8/TrBpx+JGfFsZtqKRnPIJDWWgNUKO90qcVtKhoMA33Eoyg6oSinsmmnSF7imH5kqDw0vCLDCkFa7RWOo2e0q0ZXUKGVOqmTNypqpwNQqo4EzUYRTKiYmaYrneoRR3G/hsUIIKbS+ogd0Bu7VOo3K4n6VXq2w8TIjCAJuvfVWjp84YULccWIa5RUFUdvUP0VZimNZNOoNGo1mVzIi6nS6p5tddh/Iy97ccp4IehhFnB0/TXgqp3311fzlBz7ADdfdwL9++ctptWd49zvfyTOe/gyaw0Nc1WygJk7jDo1QZCkHHzvEM26/ncOHD5GlGV55aqI1L33JS3jRi17U1cY5dPgwb/yDP+D06dO4vo/jukxMmexkrRRCLMdGaiOcJS06ScrebduRnTadMKTm+0RJgteHW6DKiE6aJCilSdMEadtI1yVLUqSY65ogRNfasKWkKMwmriJbYRTh2BZntc+dQyEv3BfwJ1+aIUw0j3c0e5uChyYsarWaqb8q591xDNHfW2RZuZFd91JauJ6PZcnZpoTlukAIglJuNElTI3VaWmRRlpLHBckiVfiWY+O7HoHrGj7NSkmylLofkCZmfdlloqjub91LURS7uYzGRgAdAaggCHZpeDqzNVfnzkiX4k/XXHMNvu/z6U9/2kRwstREJWyjr9uOItqdjlH2s20syyZLQ+r1+qwlUxRkWYpSZtNaPe16q80VxzE2gkPbtnPowYf44Ve+mv037ufwocd465/8CVNTU/i+z/Zt2xg/O4HbqCOUYmJygonJKZ72tKfxv//0rd1EOikEwrJ4+5//OR/56EdLCc42hw4fphN2yh5cNRzbZWpmGizJ1q3baE1PkZZ9zHu5FQ3keYHt+WzfMcSx48eYmZmh7vu4TRtLWky3Z5hut5B9CFLFUYxfblKJ2bz1oSGSKCLqtLvN6bqtZ/LczJ0lUdpIgTaaTSjdm/GJsybTW8C3TqW86ok1fFcSHUw5ORkytu0qtu4JeOTRR0xtXJoSh+Gii0RrTZ4b960xVO8+q0XeCKVU7NTUJKPNYQpV0Ak7Jg/HcbjzzjvZv38/9VqNLM85fvw4X/7ylzl95gyFUggfaq5ndKxti+Eh0zGkmNKkMzNdDecVw7WwbR7PMwCd9XCtgGcjRMAqXKte/eL5roTWmuuuu86kp9sOlmUxPjFBvV7nip27UEA0NcXzn/c8Hnr4YSanp6jX6vQWlU63WnSisNuwzrZtfM+jVqrPWZZtQsRKUWjN6Mgo/g0Bu/fu4q1v+V/80yc/SWumxVCzyYEDB3jtj/4Yf/eRf2Dq6r2MBh7/cvddPPHWJ5MkMf/ypS9Rq9WMG1Ke1lmec/Cxxzh48KA53V2XwPMZajTI0xRLSJqNJq1Wi61btuF6PlEUAQJLivJkNsqE0vVKIt1mZGSEickJrLEteK5LoQo818OW4YrZtJV4vFO6KgJMQ7os6wpczUxNkSZxF/yyosC2bNKsoNZoUKs3TC6OlHiug45mcPKcM50h9m23mUrh/iMJXzoQ0p5p86Ifehpf+NKXKJRpZRO2ZrraN3Ofu5H4qOrSFhtdPkdKXNejUavR6nSwbIsiU8RJwtjIKL/0i/8P11133WyVfPm3XvHyl/O2d7yDu+++m9i22bljJ7bvcfbsWYaGhrFLN12vAkG01qMDS+ciDK31nWUv677cK41pmIbWJHm+oMguCAKuvfYapJT88A+/htOnTnPffffyla98lQOPHQQ0t912Gy968Qv5xje/2VX9c1yXTmuGThTSLvmbHTt24Hkek5OThGFIVpLOqsiJ0hTf9/nkJz7BC/7wj9i1axdvecv/4l3vehfbt2whCEy72m9/+1EOHDzAE5/wRJIk5JF77+GgsHjlK76PP/3TtzBx9iz1RoMwiVEaap5PfdsQSiuiTgddFFi2Y6wwTEJeEse4jkuuCjqdNoHnG/K0FPbyShCwbAe/JI+LomB0ZJROxwiVDZftiik5C10lwy0z0rL+LM8zwOj0VLo4AM3hYWamNLZtkaWmY6fnGH7Mdtyuq5MXmutGHTxXEalharbP5w8UxBQ8HDbYdf3VvPJFLyGKQu677162bt1W/g2x0A3UpoepLSXSNqAzv7NHkiTkadIlmcEQ3kqpecp/untPeRmtq1IX7B7hfsuysGyb4aHhbu7Q1tEx3JLz6ZcpEELsvJxAZ6Pk6WjLcX4L2Eu/CYFlpmuz7F6ZlSdY5RJdeeWVPPOZzyTPc7Is4+v33sv+G/bzvOc/D9exOX3qNN/7fd/L8eMnuOvuu9m6ZSuO7ZBnaVk5bboc3Hjjjfy7n/5pXvyiFxEEAd/4xjdM0aNl4Xk+YWpM8TzLOH36FBNnz/K+972v5IFMPk1QCxDSot1us3//Pr52772cTnNe/qpX8dCD3+R//cn/IggCExrPczzXYWh42BRP5jlCGdEuIcC2nTlqdxLTubNQBcPDI6Rp0uVQHNcxLXQdtxudqX7PsR2mp6fnCGXlRdGdx2V2CFopbKqe5BmO52I77pwN7noeAk2UpoarKsPctXoDISVZktAcGmZ70+bpIx1OJRZnI/Adi68dmeTf//t/xy/80i/TnpnmDW98A3GSIAXkZd6UFII4y0yLZcdFVLwNwhTsllnOvdeUZ1k3HG7myITOc6WI0xTftii0Zqbd5ktf+hInT56kVfY8O3jgAHfdfTfvfe97efChh3A9j5rvU6sZV9y2LKamp0yaRaNh8ovmRRMX43SEEBKtv5Ln+T9wmSQIXmxLp4oSN9D62uXaA8+3coQQXRmBLcOjTLVnaIcdXMelKAr279+HXSrCeZ7H1VdfxV/8xf9l9+7dPOtZz+JJT3oSO3bs4Itf/CKObeOXbXmrpneubZHYNt/61rd44+//Pq7j0Gq3TTvbsh9W5br4tRqNep2777qbz332c91FXhQFjuNg2w6WZTJyPddlz/6beM7zn8vU2XH+2x/911l+SM/Wh6VRWCYfakTJs/SGpCtXx7IsfM+nXeojN5pDTKbjXcEsKYz+cFY16Stb9dZrNWpBQDuKcCwLx7IWqBEumdtQRocq3iZLElw/mOOCVRZXRRSjNZ4fIC3z7ziOuG5smNtf+CIe+fwHCLOT7K6naGFzx1Uupyam+bc/9ZN8+a67ylY6npmXSulQmxB9N3sboyMdlkJaaWmB9l6T6/skUdh1l/Kyo0PgukyXINH0fVPnliR8+tOf5tOf/vRsZnoZRKjVathC0qg3ulE4C8Ho8CgT01PU/ADP80j77y8mBpbO+g0JaNd1r5JS/krP9YjlOIXezZHlOZYlGRkaRpbRDNu2ed7znk+9Xuue7jt37uTaa6/l85//PHd9+cvs2LmTnTt38rGPfQyv5EriJCHsdNBlpKcSQO8uZkxGb8PzcBwXBMx02gSujyoUhTIaurYU3Z5XQRB0T1ylFD/y2tdy44038uA3HuANv/t7HD161Fg5SmFbpt2tW7Zo6eWrjD6z6naq6AVgz/PphB0TFq83CMOwW+XdCkOmZ2aYmDjL9PQ0MzPTRFFEHMc9BaMZfsmBpH1o62hdRsLKxLw8L/B833RKqDJ3s4yw0zZZ046LlBbN4SFklSeD5syZM4wMD3Pnd/8Qu/Y/mdbhBxDhGXY98xWcnJjhQx/6IH5ZtOpa9pzM4KKUy2jUG7jldVhlFXkvL1UliJqXmdOirKgvenrQZ2XDPs8x7YPGxrYSBD5+CSCe59JsNgl8H6kh8H3qzWb381RREHg+aZbSiUJcx+kHdCpL52uXk6WzIUDHtu1bhRA/UYUQV/qlZhCUesHmocZJAloxOjxCu9Nh+87t3Hnns004Oww5ffo0cRSzd+8edu3axUMPPczzn/88zpw5w1e++lU8xyUKO0RhSK3M6yhy01XBdxwjwO6ZMGngeWUdDsRpSpbnSAFZWWZgl1EvxzI5P8Iy3IFSijiOOXr0KJ/42Md497vezfT0tBEIr7J1pSRK00WtDqMjrLocg9sNDZueU3lu2rE4tk1SljN0ktgUS7ou+/bvZ9/11+MHAa1WKTrvODTrddphaHSiXde0AV7ZLTAulG2jtHH5wjAkzzLSJCHqdJBSMN1qGalV2wYBtXpjNgdIG47k4Ycf5u4v/TNbx4bZd+d3M3LDM9l/85P4y//zXtIkoe77BKWmTqF6xM3Q5EVBs0ySrK4pyzKE1riOqRCPk5QsyyjKAlNRtkDWPRHIKqs4LPOXqusLfB/XdnBdh3pQIwg8dKHI8hzHdfGrnl5CoEu31Pc8OlHUr/b0ZQk6G8G9Qgixs4w4LQs6lethlxozWZ4Tl8DTCkMs2yFJE/Zdv49arcYj33qEe+65B9/3ybKMffv3ccstt/Da176WnTt38vGPf8IUTVoSiUTbJv+jioxURGBV+Ef1PSEI6nVmTp8ym8r1THZwns0u/qIgKXI6raQLFFJK/v4j/2CAs1bvtis2YfLlc2PyHgskKzV9qmuJwhCrTGibmprEtR0KVXQlMX72Z3+W59x5Z2lhwEc/9jHe8c53kqQmv6QRBLRKN8u1bZI8X9beFyUPYqwLSVCvodttkijqtvVNc9P9tOH7RkO67OpZbwyVeU6KPM2p1+vMzMzwtre9nec8505uuvFG3vv2/83pU6cYKjN8ZzksQaHK4stCdTub9hK2Smu0gKSU2OjtjOpmKbZlI7TCkRJZtiGWQuC7LmGakmvFlsYQk1NTRFHHpErYFo1GA5VDkqZIKUmTxEibBGXPL2VKVayyr1irtDxXcfgOolfrHLlqiP7e2DWXtdbUg8C0MylPlZl2Cyklu3fvIgxDvvGNbzA2Nsbhw4fZs3cvDz/0LbZs2cK1115Du93m4MGDeK5r6nDKCIUuxbaENA3YKrADun2bas0h01q2NOmbQ0PYnkdr4iyq7PjZiiLiKEJIyfDwsFmoaUo7Sbrtdz1E78G/5Ea3yt7clVuRF6rL7bRaLYrC5MG4lmnY59pOV/48V4q/+uu/5v7772doaIgzZ87w8Le+VWbYWjiOg18YGdZWHHflL/pxsYqytxblPIgScMIkoRWGjI4M4TkuYcfwLGG73eVkXNc1GeBqtp7s7rvu5otf+CLDw0MEtdqckoxKJrV6GhX4dN3PkuPLlOm0kaYptXqdRpnBXBRFOVeFSU2wLLyqP3z5+zXXpRNFDDUaBL5nlCSLCrwKbNvqZiujNa3p6VLylK4+tlIKoU2ZRJr33eTh6AB01n/s7fuCy5Otyp+oeR4AUeneOI7D0NAQp0+dplarEccxcRxz4vhxdu3ezZkzZ9izdw9HjjzOxMQEdX9u21utQUqB47rEYWhS+7WBBct2cIOg1HKZJs9zGs0hLNs2YuSeT9xpE6VGKOrWW2/lpS99KVfs3GkiNlnGwYMH+eAHP8iZ8XGkkMb1KMFECzmnBKFaxEnp8hQ96oCTM9NluFfj2g6OZTp2zkQReZFjS5tGvU4njjl8+DCHHnts9lgt842Gm01TuW2ZyvNCKTpJ0jfoZEVBrVafawEVhdFjrgfUgxpa9WQoC0GRmwr6VpwQBKbC3SQTSkaGhxACVKkyKOZZubMHg6bQ5ueVkFqWZXSikDAM2b17N89/3vPYv2+fkSQtLcVTJ09y1913d8lpAXiVG6s1vucRZRkzrTZ1zy3/nnFlgyAgy1Ic1yEPZ3Wfkx7+rNlsmho4raj7PjqKSPtQZBRCTA9AZ719LCH6FqW2hMB2HHOySEmRz7aBybXqdt80lkXGmTNn6HQ67N+/H8/zypICi0cfecTUV0mJifPMzamQ0nQv0LkqE+0EjaZpMaOUMhXP0jJ6wT1V59UCVEXBM57xDO589rNJkqT786uvvJJ77rmHEydOYNXrCCHLXuOCXBWzGjpAkud0ksRo3eS5yaWxbYqyu6jturiOg1sCsWvbOJZFmhdIR1JzfRr1OlG9bmQrSotJapPj5FbuhZTkhSIorZy4z6iLKk/46hAI04ROkmAJQbNWLzNy1RxX1bHtEtTyrkVi3EvR8zyYG6WDbvmEqeUyBPBQowlSooBMKaIo4uabbuLnf/ZnaQ4NGVK5R8Vw29atPPUpT+HGG280outKIZmNBHq+z3CjydnpKdyyo0blzsbx/9/et8Vall1XjbnW2s/zunVvVXX7lbSj4ACKHVmJ248oEsJxbIGwkAAFIiEEX4B/+OGHH4IipAgiwQeIHxOwEix+CBAiAsKJYxM/1H7EFpGt0HJCu9ztrtete885+70efMy11tnnPk+17e7qvndLpe6uvo+991lrrjnHHHOMhq2mR4xtIkLmRzO6QaOqKv8+CZKwU/D21+3roPPql1dy148nKwqUszlAvFwoJzS1hGo7KKGwrNa4d+8e3vWud+Ho+AjPPPMMbt++jdlshjt37uCZtz+D5XKJP/6TP0GiFDLf+u6aGoJETNnDaSu8EJYDUC+PMbux7xdhi4mf4wrcjzAkqvy4xCc+8Ql84YtfxI+94x1sIdO2+NrXv44XX3wRSZpy2eWAYy8oFTam8A4DIeDcvHkTP/PTP41nnnkGk+kUR0dHeP755/H7n/sc6rpGRYS5LzWLNMWyaWCdRNd2SBS3x3U/YDLhrGTwVimxtR0JgYSpB0e7S07oANrefXAfdpSFTX072WjNOj0jcSwpRMxUQqUUMlYSKcrZDIIEHBy6pkHfNrEjGUotpjVYSCWxf3AQA6m2LAw2nU6x2NtD27ZMfxgNmBpjUOQ59oMULIIGEKEzBom1mJQlltUaVdthURYQKoHruviurLOjspe2WPHh3621kEmBHAJNf7RLpvOOUUJ33TJ/FbpXNkmS9xLRz17WvRJCYD6Z+g93w19xcFFy0vgT773vfS+EEHjh/30baZrgxRdfxNt+6Ifw7ne/G8899yV87WtfwyQvUHqm7jD0GLSJTNSmaTYgr6At47ij1QpGa0yLAr3PqrKiQN/UsJrBUfiN8N2XXsI3v/nNOCG+Wq1QFAVu3LjBHlrGoGkaxis8OD6fzVnF8PgYT92+jX/6S7+EZ599Fjdv3sT+/j7e9ta34v3vfz/e+eM/js99/vPcofKYQvC70sZAkcSgBx7jAHdjnLXoBwZ5lS8Lm6aJM1rKd912EWp3YOwiy3JIQSjTDPPpDA68wVWi0NRNdPscT8Az52hTquVlibwofYYjvGUvC7oPgRVMBEeEpu8wn80xKSc+SwwzVxrfvnMHL7zwAvb39zGdTKI6obUWy9UKn/nsZ/Hrn/wktDHIvKAZiDMpgJnsUgis6op1h6YzaK0hhQSI586cA5TcuEQEjGlcos8WewAR1tX6ovfowCLtK631x68znVf3ejwgzXIZ5SSb3imVIknYyqTIMrzwwgv43d/9ND784Z/DrZu3cPfeXbzzXe/E29/+drzwwgv4vc98htvhWbaRaJAKdmhRVxWakQbPyaBXVWus6xqLsoyyCuv1GtZbzaZ5AaUU9ucLzOcL9MMArQdYw6dzoli8O0kSGGNQVxWPK6R+nKFlj+yQZVV1jc9/4Qt49j3vwcQLixljcOfOHTz3pS9xi9izjGOZoBIsmxqpNKyX7BxmsxmDx0qxZYvWWK/XW5lLfM7HsBnO0wxpkqL2m5bb+Qm6rsVquYodNkHbYjHObh/qUnKZwjZAAysOSgWRS8gkQdu23ALvewgpMZ/NN4HI8cjHfDbHEks89+Uv42tf/zpu3bqF/f19FnVfLvHgwQMcHx8jy3Pm43ghMOulQcIBIL2yQNV1mPmfXVUVqA3rgg+icQAdDwCz3IeILfodure3sbEXfsNr6tATEPR0URR/GUT/eRcdndsHNyMpDc5BpZkvjxocPTrkTUk8+f3eZ5/F+97/PkwmExhj8Pzzz+NTn/odrNdrTPICi/l8awJ5U5NzeWD8xk9HJ/SjqmKVuIJF3Qe94XxkWYZJEAJzDjJJoLxR3EkQFgB3c7oO0+mUwdWqwtFqiadv3oKUEo+WxzherWCGAU+/6U1485vfzPjLMODbd+7g8OFDqDTF3nyOMk1ZWiEvkJcTHD46xGq9wiTLkec5Cl82haC1ZdLnW/BCMPdmMAbLut4t6KgklipFnqMoS8ajPKGSA7qEkoJVBD0WJYRA7bMgpRRuHBwAIAxde2YpR0RYVxUePDrEwf4+Dg5uQhu9JSgvSKDtWlTVGv0wRN3nEAiSJGEhMSIkowlwzuw2wmJxPXQt5tMZbiwWWC6XGIYNJSKRvhQHkOQ5tDZo2hbOWuR5joNbt9E0Db7z0ncuy3QIwFJJ+aPr9fr+VQg6r3WmE17ud/xGvJSv0I90aENp5azl0yvL0HUdFrMZ0iTB57/wBXz1D/4ARVnAGovVasUzUWCfpSRJUHiqvPM+SOHnWstfb40BpGD50JqnsBdedXCsmTJu34ZOjfY2N9ZatE2Die9uhK8d+j6ykYPusRxxT4o0g5hzK/j+/ft4+bvfjT8+SVNMplNMigLTyQR926KcLVj5rm2QZxnW1RqdHjBT062AJ4SI+A486L1arWDtxu5mRywOeVEg9x2oJEkiZpOmKZqmQZplmHtfqL7r0KyXXAYmCZQaoLXGbD6HEBJ66M/Fj5q2xeHymBUTQbFZML4XCxZOnwWvsolF3/cYhj423FMpT+1qGv2eUG4Ho8Oj5RKlD9pd16EoJ5j5jlhXVxh6VpRM0pRJiGCyZtu2WK9Xu2Q6jogKAAcArkTQea0xHQIzkiWI/i7YeOxCVQBjNBLv9hg2H5Fg18u2ZZsW7+U0KSeQSqHyZURZFOj8wKBzPCjZ9UOk9G/5TAkBqRTKKbNoj1ZL9FpjUZbMNvbg5nhjGK9KKD3/Q/uOU9/3aKoK5WwWA2bnT8XxSEPgGZU5D7Gu12vMpzNMixJlOcFibw/z+Rzz+QJk2ZlhNpt573Av6nX4ANay7rNSCVbVGmmikKXZuWp2gghpnqOYTAE4GK13dTRAopJYRoTyKHJnhMBsvkDbNhwI8wJplsMazV04w+DvbL6I2ZId2foEN9F1VeHB0SHyNMWt/YNYyiSjSfL1cokkTWG0hvMYklKKhfW1iTuZOZ60Fayct9EpyxJ5nrOzp+J31vY96rZFmeeQHuNpmwYODnk58T5fmomqXYvBaNR1jaPjI5ZS3SGAE5F01v6a1vpFBE+s60znB5vptG17Ny+KuwCeuSzo2C1OjcNquURe5NCDRt91W5lKXpRItIYZBuRFjq7pcHDjAG3XYuWVA9u+Q9d3yNIMs8kk4jwBJ+iNwcPjI2hjcGM2gxp1mc66qqrCZMJs47ZtMUkSns2xFscPHyLNMgzDgK5tI4eEg6nB4G1iqqqKQdVaxq0Sx9KkeZah8XNg4fuEEEizHMvjI9b8yXO0bYv5bIFhGPBotYzWNmd1W5xzUGkKmSR+Ml1g1bbQzl3KTF5Va6yq9Va2J/whIKRE3bXMp+l7LFdLTGdzOE+gdJ413LTszmFHPCRtDEzbYlVX7HxaTtneGcwAbz3JUiYJhq5D2zTIiwLaS6BKIdB2HWdEJIDoVDHKSL0LRD6dMaYzYnoHLGoxneHBo0McLZeYzec4Xi3R1DVzobwdTWCcb9VMhF10kk8yEK6B5Fcp6EgAPYA/GgWd8z8ZZ+OHaS1rzTQeOwiLqVpXyIsCRSmxXq+QF+zCWUzYy3o+n2NSljh8dMgi4c6h88EnzzIUWQ5tNBrfsi7LEk/ffiqm0NXx0QlC4fYth1OaOzgJM5N9xtO2bcQXxsBj07ax5R6+d0zz74ceVVVhPbJEMcZgvVpjNl/4QtMiTXNobTGZMHB8cHCAru9w7/ABnjpgrEgb44HaDdHSWRtN7rLJFPJ4CW0u1kveCl7+n9ZaGPiOkufgjEvPhw8fbLGIAeDu/XvR2FD4trr1jOfAdgaAQ//eWaaCZ82UlxUxxmK5XPLQLbFKYdt2Efgd36/QFA8wISVa/+y9t/6xXhd5nPV2Q4/2wX240DV1Dl2/KQfJ3zd5FQJBhEQl6IZ+JzsaIrq2oHm1wWwHfFkQffgyjWRjmV2apRkTy3znZvxtwzAg93IHQVpCCAEhJBwcjLGYThn3OTw8RNt3vlRyaLsObdexvEWS4C1vfgsmk0l0rkySBNYhSmJKKaGU4tkrL+iutR7JWmzKNillnDoPGymAzuu6QpZmsY1urIXwgcdaxiaC75M94fzJC9ohzwsIsSnveMNIPP3U03jxpRdx/9EhZkXJpDnLIluz+QxJxrY7W9mK2EXSyGE2mSLLGL9xDpBBH3jUDg9zYKEsCjwdN+oxh6xqnO2Ms9Z1XW1JTAS3BuezWyLCslpvAJHQfdz6nu0jLXzdSSLiWZhW+BpBPGDCozIEJRXSNEXXtuyfJiiC20IwFoiLJ/dDZv+mJ6S5cyWCjgMASfS//Va6dLXXbQMlJbqug5ISiRJ+RsZGjMJZx04OccyB4JyFMRpGa+hBQkg+nUqPd3Sev+L4fuCsxfHyGMYaTMoJlFIY+iFyQ9I0QVGUp4YOh2HAerVin3OPLQghMJ1ON04UPjClaYq6bdH1PRaeE6Ikz0RlfpI8tIsTpaCkwKAxclWA39RguQ1/aS+3AHDgubV/gLsP7uPRcIxpXiBLFYw2aOoGUvVoaga60zyDHbW/L3P8zPIM0DxvJIkgSUAlKeZ7N7Z0f6JFr7NwDlivV+j7LnLBRRh/QPCyAqw1MVKEgE5SxnKJP+PNvYqRDMiJ9OYUanwS+HejuT7taQhh1itNUxYfI4qYnRh5sksp8eDe3a3DIDCsnW/HX7b+LdHkOtN59S7rM4YvW62PASwuwnWEl7Ig5zwXgo9M6an8YZEZXzZtcAuLoe829ihehJuI3RmZ0s5Dem3fY/DZRl3XaJoGx+kxFvMFrNExC5pOp7DWRWA6ZFxJkqAoyzgykXphqPD/jTFo6woqyyHTFI/u30eWZdi/eRNNXWO9Xkf3y7Zt0XUdl1qeASsFwdgTJYOULK8gBEuEDv3m92nGkGZFgabvseoa5Ja1fNuq4nKL2BkjZCThpL6stGrqGsmIVmCMhnU8E+U5vyAvAzuWoOiaGk5IEAkIya16bQwGbSKg6yyXlX3P6oQhAxv6HlZrpHkGZxkeb9sWk9kUQkgcP3rkgXQV57VCwKnrGkM/YLZYoJxOIl/o6OHDCD4Pso96RsYYiCTBpCj8M/GgbHi3oQs5DjhsUUMYNAfYXVIXIrrGdF7lTEesVquHeVE8ByAwk+VF39BpjWmWRywgHGhMVvZTz0LAGQ2QQN+2ILgtPIEIka8RglOw3dXGoO56DEZHIa97D+5BEkt95kqiqiruehQlmqbh0smDi6nfZMKbuik/SkHEXBSVJJjO53j57ssAHJ5+6uk4sS6lxPHhYZxLIq+1E6oDNyoNrHOecbyOtP/e0/at8+MJlkuczd4jtP0AYNi8OOtgjQYc4mjBjn3zLecH9la3rEfku0vWaPSdQ+o5Sy5kAf7TFCS2yHV1XXOJ5oHmxf4+/6ywaJME1fER7KCRes/3NEmQeCrDdDqFEpvh2XEJOp1MsLJrdG2LcrLR4lFJgr5tIeDi8CyAaCfTNkzadNagbzXzw87RQfa/6rFIllfpelIYyQKAdcB/E0QfugzXodDtsRqJyk598Hz6dH5zp5saX2wCjtYa9gyqf/hZSgjMyhLZZIJ1tUblMwLrHLqhR3fURwO2putgDSvZpUkCIXkQlaRE6SyGrh8RBDlIGAccv/QSuq7FYrFA27WomxrwhEPtHJzWsc3dbbV4XRyKBIDm0eGZgPb4feBE+rgVfMGuEaFVbL1Put1BWPz0++Os042CHGcFNgZQN8pAw/eE7pL0oyxd18FZi9neXvQqC9lkkqbIihJdXUEZ79XlM8jwPOFZ+75H23Uo8ix2FheLOZqmwdHhIfb29yMGligJIegklzNmmJt3Buihh5Q870YjDC18AYPizMQ21j2Ots510HmVLgMA5Nx/ccAvAygva50zYayDEjLKVY47KYBDvTqGkArldH5qcrnvew+mnl5km86GQJ4XyPMci9kcx8dHaLqNKFfocsAzY4e2QdVsd9KOjo/O7/iA5TRXqxWW0UL4bLcDd2IWns44XsOG27SuyWd7liefPZ8mdFfCvwNAmueYzBeMBw0D7t69i7bvXvFm0YOGVDqWOOGPNQZdXW3xec77fMljW25U7vVdh2rtvbUE427k7Z6dMSAv0RFKQ601hr5nzRuVoKoq7l5OJqjrhoW3pEReFGj0cOZaYJynjzSGMSJttEZbV2dnPCfxpOvriQo6DoBs2/ZOnuefghAf9UfjheRFR4R122JRlszkFcKDj2HTU5ygttZCKnGqG3HeYU5EcHpA19RI8hwEYDGbocgyLJdLkJSQUqEf+lgqhM5LmDg/E8gMGYkPEHbEUI4T7mHy2ou1kw8YgblM2GriQEkFAUCmCYpigr5ro1unA1CtVmfbDbsNXbBrW8gkZRzKmJgVXpLmnIn68zOwxEjYqMYYWGNQr5Zb0+2CNh5dgRJxFhUhZKfHjx5xoBECJLhjKJXiks3/e5qm0Uonz1lwv21bloY1Buv1mvWOixzSu2tchl8Ng0aa2TgXx/czoF4eASA/Dc94G53ojl1fT2bQiWvLCfGvybmP7tprt9Zi1TTY8zM/Wyk7HJK88GUQxfzAxZT5khLOOd6MfoOEK01TTCbTuADD5g3cDq01ZKJAXuLBDIMPSNtYYZj3CUtUeCU/+MAZFALzPEdZlui7DnpgB4zBeLkHB6QJf4zFdAYhJMhzmQKIqpTicueiTpR1HijdbPZdDOPonPbySafQ0L6WKoEJ4w6numOE1FMhQjeqb5sIyK+OjqIcauQz6QHa0xbgMymZJJEtHkYbiCiWj0GcvixLWKOZzT4iXJ61FoSgKOJOBD8zlkSlg00puenYUcCVrrOdJzboGADU1fXv5Hn+DRD9Gewg1B7U6lhqM4sbxVgLCEKRsJfVeHGHVHuw9jxsFIPHb4zrRmQ+3sDT6WwboPRZixJs9wKjuaXrnG8lA1KKU4+ihOQW/ag0dFpzVuJPznFpkqQpC5L7TRmCXbDtJSI2kyNs4QtplqJvm3Pb3oMPbtZ7d7PoO+0U9GnMgxn/P0FRJMx3J9mrLEuhh97jRdu/I/WjBlpraK2RJApm6HF8eBhB8vA5ypGsxNC1MIPkwVKffYXPJhwMmVeYJCJMJtMYB6zPwIahZ57NeZ2OLT4YRc0jlaQY+u4Uo5WEQFFOUAX7n+vAswXgPkmX5ATD/QqFdsNu7UZ0w4Cq30htMotXw1oT25/jjaaSBOqEC+RWNRQWpXWoqgpVxSLdUULi1CnP81Rm6CIuwlwcvRU4xn+4NPI/L0y0FwUsuMUfBOjHshVpmrEMh90uQwatmV8zvnmETp6CSvNznnVU2liLuqrYhsft1sG1I8vdrferFKRSW7/HGFZuCB3BzTSCQ+K7QYGECRdGNAlWD1sBR/mu4NZ9GI2h79CuV6iXxxi6Fr1neZ+8tyxYCIVnrmtobdBrE/lPpzp0SXqqBLN6gJBqpPezib+p91HbtbpyzonroPNaZjtd9x+cc9/CY1hyEBHLGYykNokI69Ua9ZZl7GihJ2m0uT2VTm+14nmqebVaoa4bdG2Dpqq2NoIx2pPKNqSxU5PnZ30AIxwny3PMb9xAPp3BWYfpfI4bN2+esshNRu3j8fMvj4/Re7eC08+aQCbppVa3gXeidxDxgu82be0s33JP0tNdRecc+r6L7Oew6UnIKHtK3sgwzzMwBYsw8R7hoeSSZ+FN4V2P79kxfeDkPYQsSGvGd/rRuMbJA4pFsyWSM7zRnWeKj5/HWAupEu94sduZCQDCueV10HntAGUBoIdz/+hxsp0YePQQxbBpJMwUdIrHgSCcsCS2QVbjHLTZFgYP5c/Q9wxkwrG6oOcEad/efkVZtN9sWZ7DepaySFLIRG3JeIR7lr6rE4DrjUymQXvBs6Zp6nWLR12m0IE7sYHdJcOe4012cguFU3787oQQ6FoWSTspAbK1oZ3DZDrF/OAAJCXyskQ5myHLsksZ0mcFIuOZ36Gx0LYt2oYJmOv1+pRj6qlAQQLZyCl0/DxVVaHr2vhOxy19jIZpdwk6AO6O8ec38iWfwHtyAKTW+g+lUh8URM/4DEjsGngCwKqk9FwJHrbshyF6P43ZsWFeSopt4uB4wbBWsoBSm++DY+O1jSgWWNbyMS7rA1yW5yin07jZhWSMwniS3MloFszeCq+LY7WO99b1PXOBPPgdOkgMvJpYym0yLWxldUqKiGnRZR+U15CO70lKKL/pzgr8UZs4/C4/FX+S4yKVwjAMSDLuHJKg0Tve7ayM3UEhkKYp2raBGQYo73sebJxPYTdj22bPDB8H8fB5Bzud8ToJqpDhWtfbGfE5a5bg3Me11i/hWtriNb45rT9mlPrK6IPY2Ri60wNIEGZ5DusclJMw1kD3PcuKpln0umbjPrMpFyJuwMJaiZJbp2G8PynRa41Ob/SGtTaQUmy3Tc+5R5ZFMBvHTg8KuFBCjfviJ07wZCTBMbQtE9uIAAEYx+11azQazYE2+noToRt0/HryQvJEHPxSJXfP1kJg8aMoxhiQVJGf0nsJjzCSEt6jsQ7zvT227jEG7qR2j596L7xbBmNE7F4xDD0gdwzsxJnYUNdcdnoA2nm2sFCSrX0MUx4SKUZ2zkzqS0+4h4Y5OIDZ19ylSjBdzDm7GWkKmRGF4oK4Tc65hoCXwzl0nem8htnOYO3LKk0FiP7842Q7466WsRapUjHjUUpABQcEh6itzE6QbBcMwLOPbTzNT5P1vJg3CeztH2AynSHLC2/MNsQWurU2dofigvZlibYsrQCfyeRFcSqqBreJk6m9kBJwQFNX6JttzCpgE1LK+KxCcFu5a1te6ULCgaKERBAmD7NsrZfm3CXAK19eDtrEmbFhGNDWdezcJUpG+14pmLSYZlnEPk5mc8KPsZzEmrqOVQBPNQdGQTCWjsZAJimyvIB11lMJ6AQmRZEPNfZUCwPEmQ/ufd+zREnI7vzzhJm4JMuQZlnUnw68ovUFrfjRK2ylEP9iGIYKV2DKXD7p96eH4TNSyo8Q0Q+90sCj/YR28McKGY01gWQmMF0sUE6nyIsCWVEgybI4/wMQjyO4EEi89ILg0qTzBndZnkN5ESwhFVSSIkmyqMOj/YmqjYFMU8z29jCdzbj8qCpYrxcsPOckbEI34pxozYC1SlMIKbwC4cV6LdJP3QffrPneHoqyRFGWLDdalAymOruxgNlBOTCc5lmWIxvhOEHqQQpEW59TWNCgN9ma5zptgY1SbukNsXbQCmmWQSWpB7oRQfhBG1i34WFZxy34xd4e0ixn/RuvC+1OYFfWKxIEfR0SEiSZthAUArq2gZKs03PycZyzsNZtsCmf6dRNs6VFfV6mQ8B367r+Zz7LuZa2eI2zHQfAwrlfANFXAcyxA3fnVDfGGBzXNaZ5jkwpPt09ZrE8XmK2t0CSpp6JKzwZjC1GpJNbnlRnrQnrrB8gnLJrZ5ZHMqAxJrpchs5JkiSY37gRiXhC8JR4Uzf8c6ZTTKZTnvPy5EQhBJ+c6zUPdQ4DFjduQCkF3bpzeSDObyZtNKq6xmJ/H0LKrUlyozWUIIDUVlmw6zVojZu3brHhXlWxILuzlzK+wztZr9eQQmyBxTTKLtumQeX1qqf7+6wD3bRYHj2KQ68sPzHZ0BEAJGkGYyyOHj0EWYvUG+NZX8Ju5tD4z3Sx2JSh/t113h5anFFeb1IVlk0hIWCGAXVdI1GK1RB2cUsFDkPn9hpIfkLKLGPMoUiSbxDwN0YfDj1O4HEAuiHIUqTIJyWE5Jirh4FT41GrvV6tYEZA4cW6Mt6q1zNfg7CYVApd12G92u6GzhaLiAHx1HkHWLMBgtsOfdehrWu0TcOli8cTWK4zhbPWy2aOxz62L20shEqQlxOfGUkMfR8zjPB91XK5hatoa7eoB5d2DL34+WQyRds0WK/XPDhpT2sSRyxICqg0xXq5ROeN8ULZGFwcpFJYL5dYLZce15HxORLPwu5ObOzQ2ZPJplPXtg1PnQOnZs9CuSc8kXCMpQV7oaZp+H2dsw4cwDweybIawzCw6uQJUupZfQSuaOm5YRj+o9+P10HnCQk8ymj9TaFUJYT4CNgf6LHunfyJNhgDbS3KyQSz2Rx5WcZW8jjosNCXjvbFF538sZM1DFB+/CGe5n7RjxdfORLzgndG0HoAWRv1fXs/OkEjDZ4gVC6IuGSCQ98PZ2Ic1jpACCz2D5CmKXe78hyZ1/bZunfw1HQg6DVdh2EHic3xz+i6Dk3dAHBY7N1AOZ1BZVnkyZxyytDs+SXAciLWy38OfY9hYIPApmn4vlTCmkdgh1fpZUKklOiaxj8vZ5WT6SySEkNncui6cwNGyF6IQsmXx2CktUbftphMpyjKCYRS6Puzvd4HrdFUFRLB5Vd1hpXOWUGH2FXgv+ph+JRf09dA8hNyWR94fl9IeVsI8T6wGMxj339oea5WK/R9jzRJWecFoyl0j31Ya5FmGQ8FWtaICSMPOMOIzwzMUI0Kfn7xtk2zlS1lvqVstIbTmk/ulK1jQnC07oxyxIO24wxrI5gxAqr9ZpNJgrzIT0uAngg6YYA08VnEcoc279ll7ACtfatdEPKMlROHruMsLojQe50cKTZ+4cJjM2OLHu4QqdjizqczpHkON8ru6pE/V5IkscQCmLBZLY8gLslUkywDgcca0hGYT0QoJpMIeCfeascM7CASPl/ju5bkXV1XbbvzgUpEAkL8S93337wq5ZV6Hd2rAaD6tv1YVhR7gugXnHMD2LbmsQNPSJ3rusZsNsN8Nt9i/mq9kWUAWG9GqIRxGj1Eq5SwQrTmUzKL8qi8k4W3YanWK+9QwbyTaIcLwPQ9RJJsGcdFwS7noBKFLMvRjxfzWZo045NbsOymHQuwjzo84+8NpQ27O1TRNfRxL+Hb26vVij3GJDONyTkYZxmbIoIxztsG0VZ2ORbc3/xMr/UsuXzVXcdBJ5ZGjEkBzLoOtAMGn/3znsPrcc4hzdi6x1rLs1RKReA+3EskDVrL3ClrYR0DyMaD2A4OZrCPG6ylA3o3DF8dHa5v+Ov1hpSH1ZPkRfFbRPSzzjn9vQbPsDGnkymm0ynyPEfvs5P4ojy1PwKMbYvV8jj+t3MOB7duR6bwOHSQ7wjpvgesOfMocwDaqopJiDY2sn3LSYkkSbBerSC9Xa2QkgXkR37rY5Ied+0slFJI89zzRwyMsewbXpZxc3VNAyUk2r7DAy8I9n2rjU+0+7fEzQUrKpKXhnBESNIEvXdxgJeS9Q+IcjrzE+obLeTgXa+SBJPpFEpupDSICHVVofWUgtAtN5YxJeElQTbi8Xy4GK25xR68y4CovjgWUdsSfAe2Do0ds3cBoq+0df1TVyXLeT0GnRB4LIAiL4rf9IHnFWU8ZwUfIkKRF0iTBIXX2Y2Ao0r9qAO/tkeHD6GHAXmeM6NZKRRFyYet550Iwa1X58l6F4HSuu8x9B2XJMZEx83JdAIpBbS2m85akqCuqi0glQmNfrTBd8wCSEojXMU6h2wyRVGW0canbhqsvRjVD1rlLgpnnB4gix+w23kB0wawc5uBXDMqwYI+0WjCdPteLsPrLvjv7+HSRKTg3D9pmuYXsfEyvw46r6PA8z1nPOT5OON2cpok3O3KcmRFEUHEAAS3dQ0pxZY1zAVyh2cAmLTFtR76DnXdjBQQgSRNUJYTZEWB3juDBmGq4LEV56+ClYtXGhR+QzpPAgx4j/FDoGPLnMc0h3syuw4n7GteSentXh3hLQfAKCl/Yr1efwOPMdx8HXSehMCT579BQnzk+xF4zlrE0fNoJFieJGlUpeu7zgch9xg/N5R1wktmUPz7zgurS8nDg+Q9uwis8Ad4FrHv2AS+jzuVTVxwipPnloCu9XtfG3xSAPh02zQfvEoB5/UedMaBh/Ki+LdE9Ledc+ED/YE820ZVz40UxemVyVKeJ4BFFCv8U+m/H7wP+MF1wHh9Bh0ikgT8hbqufxteR+o66Ly+Ag8A2Lws/zEBv+gDg8EPmBIQyrFX54OiqEb4BJzSQYJEXMePV/T+JIi+2Nb1+69algO8fng6l9XGAM9pfVpJ+TyIfg5ADgbmrjfG9++yACQx+5HwmLNw1xeP9RCRUEL89b7v7+AKSFmclyW8ET5MA0C1bftJI8QH4NxXiEj5v7fX6/17vjQRCQd80jr39wH8IRHJ6/f72O9QOeBfrdfrz121suqNlOmcPImVHYaXtda/pqRcgNnL5LOex5rZur62Nwuc+9W2af6W0frLWut/p6SckBAfGL3f66zn4neYOOe+2r7lLT+Pw0Nc1WAt34DPFKbQB631bwulvk7ATxLRreuS4BVdg98s/75tmr/j14wC0Gut/6eS8o8c0bOC6MYIs7h+vyfeIZhH9i049xf1vXsPcYXIgFch6IRyiwBIo/U3tdafSFiz8z1ElPjAZK83x+Ulqw84v9c2zV8ZbZQw6S+11v/H5PmvK2OmIHq3L2mBV6AG8AZ8fxY8X6UA/F8496G2bV/AFQSPr0LQGX/wEkCrtf5faZr+lrP2Noj+rB8FDwvjuuzavgwAQUTCWfsbSZL8zb7vmzNOZ36/fV9prf87pelvEr/fH/N4T8gs7Ynvo9fxegr/dKPDa/xnJAFN3OFz7j9JKf9q0zQv4YpMkl900RV6TuE3ALIs+xAJ8Q9B9CFeQg4jTOIqZz8RkAfQOqKPdXX9q6N36HZ5v2VZvts49w8I+CiI9sauoSezgDPWIp2xNun7HDTOCiLnfQ2w4X2dYSF/hmU0X0cg+qwz5t90Xfc/Rj/nyoPuV+10FyPcB1mW/TkhxN9zwF8iosIFL+INLnGVMiANQPkxgK8S8LGmab44Opnd477fsizfpJ17DwE/Q8BPAfhhALcBTE5u2B18v+0ZAeOiIEg7/N3JCHK2w+fmvjo414LoEM6tQHTogBfJuSMAd5xz950Q9xXRi0T0YlVVd0fvxV1VDOeqB51xWRk3Upqmf0oI8fMA/hqI3nVi/mZMhnvSgpC7JP3fNUgI/8xLOPfLbdv+CjZ6Ra+kpTvm8YyvtCzLAwBv0sBTBDxN1r4NRD/snNsD0VPk3MwR3YBzCRHt++fIzo4R54tynXP1o685BNHg18FLABycexlEFTl3CCEeOufuk3NHzrl7QoiVc+5lpVS7Xq8fYbfhzPPew3XQucKXHKX6ACDzPH+fI/ooOfdBEP1EAEZPLOTxyU+vsBRwj/nfJ38XXXxo76DNOw6sRB93xvzzruu+9X0sBWi08exj/LwMQJLn+T4AGCln0pgbI7wERHTLOTc759mPnXMPR++RiKh3zgWbF7Rte+gDqxsHo1cYXOmMDOw6s7kOOpcuHnHy9PIZ0AcAPOuAnwTwo0R0EFJxvLYjCc7fr3ac3oOAhw5o/cl6x//dkSO6D4DIuYfOuUO/CbvwNdba+33ff+OsLPAHtN7ogs1qX6N9QBdksmdlkNcB5TrofN/eRzi9TqXPZVk+ba39ESfEn4ZzzwD4EQBvJeAp59zUlylP43IwunPO3ffBy8E5ImAZgwOg4dwfjzb/t4hIW6K141KApHMvG2MqIhq6yeQenCM8erT8HjaDfA03/UXB6by1etnadZf83WXg8fX1A7r+P/P3vwa7+chgAAAAAElFTkSuQmCC",
  );
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
      lastDraw = t;
    }
    // packets
    P.forEach((p, i) => {
      const ph = (t / 26 + i / 6) % 1;
      p.ph = ph;
      const th = A0 + ph * STEP * 4.5,
        d = (th - A0) / STEP,
        s = d < 1.1 ? 0 : Math.min(4, Math.floor(d - 0.1));
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
        p.b.pom.visible = s >= 3;
        p.tag.visible = s === 4;
      }
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
        n = Math.min(4, Math.round(p.d));
      if (n !== jPrev) {
        $("#jt").textContent = J[n][0];
        $("#jd").textContent = J[n][1];
        jPrev = n;
      }
      $("#jp").style.width = p.ph * 100 + "%";
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
  sync();
  sp();
  requestAnimationFrame(frame);
})();
