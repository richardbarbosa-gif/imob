// Kit de cena: maquetes arquitetônicas fotografadas sob canhões de luz.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export { THREE };

export const PAL = { bg: '#090f1c', floor: '#0c1424', white: '#ece8e0', gold: '#c6a15b', navy: '#13264a', warm: '#ffc77a' };

// Granulação fina + vinheta: acabamento fotográfico, tira o "limpo demais" de render
const GrainVignette = {
  uniforms: { tDiffuse: { value: null }, uAmount: { value: 0.045 }, uVig: { value: 0.42 }, uRes: { value: new THREE.Vector2(1440, 900) } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uAmount; uniform float uVig; uniform vec2 uRes; varying vec2 vUv;
    float rand(vec2 co){ return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453); }
    void main(){
      vec4 c = texture2D(tDiffuse, vUv);
      float n = rand(floor(vUv * uRes)) - .5;
      c.rgb += n * uAmount * (c.rgb + .03);
      float d = distance(vUv, vec2(.5, .48));
      c.rgb *= 1. - uVig * smoothstep(.3, .85, d);
      gl_FragColor = c;
    }`,
};

const Q = new URLSearchParams(location.search);
const SCALE = Number(Q.get('scale') || 1);
export function setup({ w = 1440 * SCALE, h = 900 * SCALE, fov = 30, cam = [10, 7, 12], target = [0, 1.5, 0], bg = PAL.bg, env = 0.12, exposure = 0.9,
  dof = { aperture: 0.00045, maxblur: 0.0028 }, bloom = { strength: 0.38, radius: 0.45, threshold: 1.05 }, ao = true } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(w, h);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = exposure;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  document.body.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = backdrop(bg);
  const pm = new THREE.PMREMGenerator(renderer);
  const envTex = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  scene.environmentIntensity = env;
  for (const [mat, k] of [[M.gold, 0.55], [M.goldSatin, 0.45], [M.plinth, 0.22], [M.glass, 0.3]]) { mat.envMap = envTex; mat.envMapIntensity = k; }
  scene.fog = new THREE.Fog(bg, 26, 60);

  const camera = new THREE.PerspectiveCamera(fov, w / h, 0.1, 300);
  camera.position.set(...cam);
  const tgt = new THREE.Vector3(...target);
  camera.lookAt(tgt);

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  if (ao) {
    const gtao = new GTAOPass(scene, camera, w, h);
    gtao.updateGtaoMaterial({ radius: 0.5, distanceExponent: 1.5, thickness: 1, scale: 1.2, samples: 16 });
    gtao.blendIntensity = 0.9;
    composer.addPass(gtao);
  }
  if (dof) composer.addPass(new BokehPass(scene, camera, { focus: camera.position.distanceTo(tgt), aperture: dof.aperture, maxblur: dof.maxblur }));
  if (bloom) composer.addPass(new UnrealBloomPass(new THREE.Vector2(w, h), bloom.strength, bloom.radius, bloom.threshold));
  const grain = new ShaderPass(GrainVignette);
  grain.uniforms.uRes.value.set(w, h);
  grain.uniforms.uAmount.value = 0.04;
  composer.addPass(grain);
  composer.addPass(new OutputPass());

  return { renderer, scene, camera, envTex, render: () => composer.render() };
}

function backdrop(bg) {
  const c = document.createElement('canvas');
  c.width = 4; c.height = 512;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, '#03050a');
  grad.addColorStop(0.55, bg);
  grad.addColorStop(1, '#101a2e');
  g.fillStyle = grad; g.fillRect(0, 0, 4, 512);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const std = (o) => new THREE.MeshStandardMaterial(o);
export const M = {
  white: std({ color: PAL.white, roughness: 0.72 }),
  whiteSoft: std({ color: '#d9d4ca', roughness: 0.85 }),
  gold: std({ color: PAL.gold, metalness: 1, roughness: 0.28 }),
  goldSatin: std({ color: '#b8924e', metalness: 1, roughness: 0.42 }),
  navy: std({ color: PAL.navy, roughness: 0.5, metalness: 0.2 }),
  floor: std({ color: PAL.floor, roughness: 0.95 }),
  plinth: std({ color: '#080d18', roughness: 0.22, metalness: 0.35 }),
  glass: std({ color: '#0e1828', roughness: 0.06, metalness: 0.92 }),
  glassClear: std({ color: '#a9c0dd', transparent: true, opacity: 0.2, roughness: 0.05, metalness: 0.2 }),
  lit: std({ color: '#3a2a15', emissive: PAL.warm, emissiveIntensity: 1.45, roughness: 0.5 }),
  litCool: std({ color: '#1a2233', emissive: '#d8e6ff', emissiveIntensity: 1.1, roughness: 0.5 }),
  screen: std({ color: '#0d1a2e', emissive: '#a9c8ff', emissiveIntensity: 1.5, roughness: 0.2 }),
  timber: std({ color: '#2e2119', roughness: 0.75 }),
  roof: std({ color: '#5a3025', roughness: 0.8 }),
  wood: std({ color: '#9c7a52', roughness: 0.6 }),
  plant: std({ color: '#6f8a76', roughness: 0.9 }),
  water: std({ color: '#1f5d99', roughness: 0.05, metalness: 0.3, emissive: '#0b3a6a', emissiveIntensity: 0.9 }),
  dark: std({ color: '#161b25', roughness: 0.55 }),
  chair: std({ color: '#262f42', roughness: 0.65 }),
  paper: std({ color: '#f4f1ea', roughness: 0.9 }),
};

export function shadowy(mesh) {
  mesh.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return mesh;
}

export function box(scene, w, h, d, mat, x = 0, y = 0, z = 0, r = 0.025) {
  const rr = Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001);
  const geo = rr > 0.002 ? new RoundedBoxGeometry(w, h, d, 2, rr) : new THREE.BoxGeometry(w, h, d);
  const m = shadowy(new THREE.Mesh(geo, mat));
  m.position.set(x, y + h / 2, z);
  scene.add(m);
  return m;
}

export function cyl(scene, rt, rb, h, mat, x = 0, y = 0, z = 0, seg = 32) {
  const m = shadowy(new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat));
  m.position.set(x, y + h / 2, z);
  scene.add(m);
  return m;
}

export function sphere(scene, r, mat, x = 0, y = 0, z = 0) {
  const m = shadowy(new THREE.Mesh(new THREE.SphereGeometry(r, 32, 20), mat));
  m.position.set(x, y, z);
  scene.add(m);
  return m;
}

// Chão + base de maquete laqueada com filete dourado
export function stage(scene, { plinth = [12, 0.35, 8], round = false } = {}) {
  const floor = new THREE.Mesh(new THREE.CircleGeometry(90, 64), M.floor);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  if (!plinth) return 0;
  const [w, h, d] = plinth;
  if (round) {
    cyl(scene, w / 2, w / 2 + 0.04, h, M.plinth, 0, 0, 0, 96);
    cyl(scene, w / 2 + 0.05, w / 2 + 0.05, 0.025, M.gold, 0, h - 0.06, 0, 96);
  } else {
    box(scene, w, h, d, M.plinth, 0, 0, 0, 0.03);
    box(scene, w + 0.03, 0.025, d + 0.03, M.gold, 0, h - 0.06, 0, 0);
  }
  return h;
}

// Canhão de luz: spot com sombra suave + cone volumétrico visível
export function spot(scene, { pos = [4, 14, 6], target = [0, 0, 0], color = '#ffe6bf', intensity = 230, angle = 0.4, penumbra = 0.75, cone = true, coneOpacity = 0.12, shadow = true } = {}) {
  const s = new THREE.SpotLight(color, intensity, 70, angle, penumbra, 1.45);
  s.position.set(...pos);
  s.target.position.set(...target);
  s.castShadow = shadow;
  s.shadow.mapSize.set(2048, 2048);
  s.shadow.bias = -0.0003;
  s.shadow.normalBias = 0.02;
  s.shadow.radius = 5;
  scene.add(s, s.target);
  if (cone) scene.add(lightCone(pos, target, angle * 0.92, color, coneOpacity));
  return s;
}

function lightCone(pos, target, angle, color, opacity) {
  const from = new THREE.Vector3(...pos), aim = new THREE.Vector3(...target);
  const dir0 = aim.clone().sub(from).normalize();
  const to = dir0.y < -0.05 ? from.clone().addScaledVector(dir0, (from.y + 0.6) / -dir0.y) : aim;
  const len = from.distanceTo(to);
  const geo = new THREE.ConeGeometry(Math.tan(angle) * len, len, 72, 1, true);
  geo.translate(0, -len / 2, 0);
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    uniforms: { uColor: { value: new THREE.Color(color) }, uOpacity: { value: opacity }, uLen: { value: len } },
    vertexShader: `varying vec3 vN; varying vec3 vV; varying float vH; uniform float uLen;
      void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); vH = -position.y / uLen; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `varying vec3 vN; varying vec3 vV; varying float vH; uniform vec3 uColor; uniform float uOpacity;
      void main(){ float f = pow(abs(dot(vN, vV)), 2.4); float h = smoothstep(0., .1, vH) * (1. - .6 * smoothstep(.45, 1., vH));
        gl_FragColor = vec4(uColor, f * h * uOpacity); }`,
  });
  const cone = new THREE.Mesh(geo, mat);
  cone.position.copy(from);
  const dir = to.clone().sub(from).normalize();
  cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir);
  return cone;
}

export function fill(scene, { intensity = 0.12, rim = 0.35 } = {}) {
  scene.add(new THREE.HemisphereLight('#8ea6d4', '#05080f', intensity));
  if (rim) {
    const d = new THREE.DirectionalLight('#7f9fe0', rim);
    d.position.set(-10, 7, -9);
    scene.add(d);
  }
}

// Torre com pele de vidro: lajes brancas, montantes e andares acesos
export function curtainTower(scene, { x = 0, z = 0, w = 2.6, d = 2.4, y = 0, floors = 12, fh = 0.46, lit = 0.35, seed = 1, mullions = 6, slab = M.white, cap = true }) {
  let s = seed;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let f = 0; f < floors; f++) {
    const fy = y + f * fh;
    box(scene, w, fh - 0.05, d, rnd() < lit ? (rnd() < 0.8 ? M.lit : M.litCool) : M.glass, x, fy + 0.05, z, 0.004);
    box(scene, w + 0.07, 0.05, d + 0.07, slab, x, fy, z, 0.01);
  }
  const top = y + floors * fh;
  if (cap) box(scene, w + 0.07, 0.09, d + 0.07, slab, x, top, z, 0.012);
  const H = floors * fh;
  for (let i = 0; i <= mullions; i++) {
    const t = -w / 2 + (w * i) / mullions;
    box(scene, 0.025, H, 0.035, slab, x + t, y, z + d / 2 + 0.02, 0);
    const u = -d / 2 + (d * i) / mullions;
    box(scene, 0.035, H, 0.025, slab, x + w / 2 + 0.02, y, z + u, 0);
  }
  return top;
}

export function tree(scene, x, z, s = 1, y = 0, mat = M.whiteSoft) {
  cyl(scene, 0.025 * s, 0.035 * s, 0.45 * s, M.timber, x, y, z, 8);
  sphere(scene, 0.38 * s, mat, x, y + 0.7 * s, z);
}

export function finish(render) {
  render();
  requestAnimationFrame(() => { render(); window.done = true; });
}

// Telhado de duas águas (prisma)
export function gable(scene, w, rise, d, mat, x, y, z, over = 0.14) {
  const sh = new THREE.Shape();
  sh.moveTo(-w / 2 - over, 0); sh.lineTo(0, rise); sh.lineTo(w / 2 + over, 0); sh.lineTo(-w / 2 - over, 0);
  const geo = new THREE.ExtrudeGeometry(sh, { depth: d + over * 2, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2 });
  geo.translate(0, 0, -(d + over * 2) / 2);
  const m = shadowy(new THREE.Mesh(geo, mat));
  m.position.set(x, y, z);
  scene.add(m);
  return m;
}

// Viga numa fachada: plano z constante (front) ou x constante (side)
export function beam(scene, a, b, plane, t, mat) {
  const [p1, q1] = a, [p2, q2] = b;
  const L = Math.hypot(p2 - p1, q2 - q1);
  let m;
  if (plane.z !== undefined) {
    m = new THREE.Mesh(new THREE.BoxGeometry(L, t, t * 0.6), mat);
    m.position.set((p1 + p2) / 2, (q1 + q2) / 2, plane.z);
    m.rotation.z = Math.atan2(q2 - q1, p2 - p1);
  } else {
    m = new THREE.Mesh(new THREE.BoxGeometry(t * 0.6, t, L), mat);
    m.position.set(plane.x, (q1 + q2) / 2, (p1 + p2) / 2);
    m.rotation.x = -Math.atan2(q2 - q1, p2 - p1);
  }
  scene.add(shadowy(m));
  return m;
}

export function extrude(scene, shape, depth, mat, { bevel = 0.04, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0 } = {}) {
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 4, curveSegments: 48 });
  geo.center();
  const m = shadowy(new THREE.Mesh(geo, mat));
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  scene.add(m);
  return m;
}
