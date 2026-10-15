// Cenas das maquetes 3D do Sincor SC (versão "Telão"): cada função exportada gera uma imagem.
// Direção de arte: maquetes brancas com detalhes dourados sobre bases laqueadas, à noite, sob canhões de luz.
import { THREE, setup, stage, box, cyl, sphere, spot, fill, curtainTower, tree, finish, gable, beam, extrude, shadowy, M } from './kit.js';

export function torre(v = {}) {
  const { scene, render } = setup({ cam: [12.5, 5.2, 15.5], target: [0, 4.1, 0], fov: 34 , ...v });
  const h0 = stage(scene, { plinth: [11, 0.32, 8] });
  // Pódio com térreo iluminado
  box(scene, 6.2, 0.18, 4.6, M.white, 0.3, h0, 0.6, 0.02);
  box(scene, 5.8, 0.62, 4.2, M.lit, 0.3, h0 + 0.18, 0.6, 0.01);
  box(scene, 6.3, 0.14, 4.7, M.white, 0.3, h0 + 0.8, 0.6, 0.02);
  for (let i = 0; i <= 10; i++) box(scene, 0.03, 0.62, 0.04, M.white, 0.3 - 2.9 + i * 0.58, h0 + 0.18, 2.72, 0);
  // Torre principal com recuo e coroa dourada
  const top = curtainTower(scene, { x: -0.5, z: 0, w: 2.9, d: 2.7, y: h0 + 0.94, floors: 15, fh: 0.46, lit: 0.32, seed: 7, mullions: 7 });
  const top2 = curtainTower(scene, { x: -0.5, z: 0, w: 2.2, d: 2.0, y: top + 0.09, floors: 3, fh: 0.42, lit: 0.6, seed: 3, mullions: 5 });
  box(scene, 2.3, 0.06, 2.1, M.gold, -0.5, top2 + 0.09, 0, 0.01);
  cyl(scene, 0.02, 0.04, 1.1, M.gold, -0.2, top2 + 0.15, 0.2, 12);
  for (let i = 0; i < 5; i++) box(scene, 0.06, top - h0 - 0.94, 0.11, M.gold, -1.6 + i * 0.55, h0 + 0.94, 1.42, 0.01);
  // Edifício vizinho
  curtainTower(scene, { x: 2.75, z: -0.9, w: 1.9, d: 1.8, y: h0 + 0.94, floors: 7, fh: 0.46, lit: 0.4, seed: 21, mullions: 4 });
  [[4.2, 3.2], [3.3, 3.5], [-3.7, 3.3], [-4.4, 2.3], [4.7, 2.0], [-2.6, 3.6]].forEach(([x, z], i) => tree(scene, x, z, 0.7 + (i % 3) * 0.1, h0));
  spot(scene, { pos: [7, 19, 11], target: [-0.3, 3, 0], angle: 0.33, intensity: 260, coneOpacity: 0.1 });
  spot(scene, { pos: [-9, 15, 2], target: [-0.5, 5, 0], color: '#bcd2ff', intensity: 70, angle: 0.25, cone: false });
  fill(scene);
  finish(render);
}

export function escritorio(v = {}) {
  const { scene, render } = setup({ cam: [6.2, 7.4, 7.6], target: [-0.6, 0.45, -0.1], fov: 30, dof: { aperture: 0.0007, maxblur: 0.0035 } , ...v });
  const h0 = stage(scene, { plinth: [10.6, 0.3, 7.6] });
  const f = h0 + 0.06;
  box(scene, 10.2, 0.06, 7.2, M.whiteSoft, 0, h0, 0, 0.02);
  box(scene, 10.2, 1.05, 0.1, M.white, 0, f, -3.55);
  box(scene, 0.1, 1.05, 7.2, M.white, -5.05, f, 0);
  // Tapete escuro sob as ilhas de trabalho
  box(scene, 5.6, 0.012, 3.6, M.navy, -2.1, f, 0.95, 0.004);
  for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) desk(scene, -3.8 + c * 1.75, f, 0.25 + r * 1.6);
  // Sala de reunião de vidro
  box(scene, 3, 1.05, 0.035, M.glassClear, 3.35, f, -0.5, 0);
  box(scene, 0.035, 1.05, 3, M.glassClear, 1.85, f, -2.05, 0);
  box(scene, 2.2, 0.06, 1, M.wood, 3.35, f + 0.48, -2.1, 0.02);
  cyl(scene, 0.05, 0.08, 0.48, M.dark, 3.35, f, -2.1, 12);
  for (let i = 0; i < 3; i++) for (const zz of [-2.85, -1.35]) chair(scene, 2.7 + i * 0.65, f, zz, zz < -2 ? -1 : 1);
  box(scene, 1.5, 0.78, 0.04, M.screen, 3.35, f + 0.28, -3.47, 0);
  // Recepção e plantas
  box(scene, 1.7, 0.56, 0.52, M.white, -3.7, f, -2.75, 0.04);
  box(scene, 1.72, 0.04, 0.54, M.gold, -3.7, f + 0.56, -2.75, 0.01);
  [[-4.6, 3.1], [0.9, -3.1], [-0.4, 3.2], [1.4, 3.1]].forEach(([x, z]) => { cyl(scene, 0.16, 0.13, 0.32, M.white, x, f, z, 20); sphere(scene, 0.3, M.plant, x, f + 0.56, z); });
  // Canhões de luz sobre as ilhas
  spot(scene, { pos: [-2.2, 11, 3.5], target: [-2.2, 0, 0.9], angle: 0.3, intensity: 170, coneOpacity: 0.12 });
  spot(scene, { pos: [3.3, 10, 0.5], target: [3.3, 0, -2.1], angle: 0.22, intensity: 110, coneOpacity: 0.1, color: '#fff0d4' });
  fill(scene, { intensity: 0.14, rim: 0.4 });
  finish(render);
}

function chair(scene, x, y, z, dir = 1) {
  box(scene, 0.36, 0.05, 0.36, M.chair, x, y + 0.26, z, 0.02);
  box(scene, 0.36, 0.34, 0.05, M.chair, x, y + 0.31, z + 0.17 * dir, 0.02);
  cyl(scene, 0.022, 0.022, 0.26, M.dark, x, y, z, 8);
}

function desk(scene, x, y, z) {
  box(scene, 1.45, 0.05, 0.75, M.white, x, y + 0.48, z, 0.02);
  for (const dx of [-0.66, 0.66]) box(scene, 0.04, 0.48, 0.7, M.white, x + dx, y, z, 0.01);
  box(scene, 0.62, 0.36, 0.03, M.dark, x, y + 0.56, z - 0.24, 0.01);
  box(scene, 0.56, 0.3, 0.012, M.screen, x, y + 0.59, z - 0.222, 0);
  box(scene, 0.05, 0.08, 0.05, M.dark, x, y + 0.53, z - 0.25, 0);
  box(scene, 0.4, 0.015, 0.13, M.whiteSoft, x, y + 0.53, z + 0.05, 0.005);
  chair(scene, x, y, z + 0.62, 1);
}

const deckMat = new THREE.MeshStandardMaterial({ color: '#4a3a2c', roughness: 0.7 });
const poolMat = new THREE.MeshStandardMaterial({ color: '#0a2433', emissive: '#3b8aa3', emissiveIntensity: 0.42, roughness: 0.06, metalness: 0.1 });
export function casa() {
  const { scene, render } = setup({ cam: [9.4, 4.6, 10.4], target: [0.4, 1.1, 0.4], fov: 31 });
  const h0 = stage(scene, { plinth: [10.5, 0.3, 7.4] });
  const f = h0 + 0.05;
  box(scene, 10, 0.05, 6.9, M.whiteSoft, 0, h0, 0, 0.02);
  // Térreo envidraçado e iluminado
  box(scene, 4.2, 0.95, 2.4, M.lit, -0.9, f, 0.1, 0.01);
  box(scene, 4.5, 0.08, 2.7, M.white, -0.9, f, 0.1, 0.01);
  for (let i = 0; i <= 6; i++) box(scene, 0.04, 0.95, 0.05, M.white, -0.9 - 2.1 + i * 0.7, f, 1.32, 0);
  box(scene, 0.25, 0.95, 2.4, M.white, -3.1, f, 0.1, 0.01);
  // Volume superior em balanço
  box(scene, 5.4, 1.0, 2.9, M.white, 0.2, f + 0.95, -0.15, 0.02);
  box(scene, 3.6, 0.32, 0.03, M.lit, 0.6, f + 1.3, 1.31, 0);
  box(scene, 5.7, 0.07, 3.1, M.white, 0.2, f + 1.95, -0.15, 0.01);
  // Piscina, deck e jardim
  box(scene, 3.4, 0.08, 1.9, deckMat, 2.2, f, 2.25, 0.01);
  box(scene, 2.8, 0.09, 1.1, poolMat, 2.2, f + 0.01, 2.3, 0.01);
  box(scene, 0.06, 0.35, 5.6, M.white, 4.7, f, 0.2, 0.01);
  [[-3.9, 2.4], [-4.3, -1.6], [4.1, -1.8], [-2.2, 2.7]].forEach(([x, z], i) => tree(scene, x, z, 0.85 + (i % 2) * 0.15, f));
  spot(scene, { pos: [6, 13, 9], target: [0, 0.8, 0.3], angle: 0.36, intensity: 210, coneOpacity: 0.1 });
  spot(scene, { pos: [-8, 9, 6], target: [0, 1, 0], color: '#bcd2ff', intensity: 60, angle: 0.3, cone: false });
  fill(scene);
  finish(render);
}

export function enxaimel() {
  const { scene, render } = setup({ cam: [7.6, 3.4, 8.8], target: [0.1, 1.55, 0], fov: 30 });
  const h0 = stage(scene, { plinth: [8.6, 0.3, 6.6] });
  const f = h0 + 0.05;
  box(scene, 8.2, 0.05, 6.2, M.whiteSoft, 0, h0, 0, 0.02);
  const W = 3.6, D = 2.6, H = 2.1, T = 0.09;
  box(scene, W, H, D, M.white, 0, f, 0, 0.02);
  gable(scene, W, 1.75, D, M.roof, 0, f + H, 0, 0.18);
  const zf = D / 2 + 0.03, xs = W / 2 + 0.03;
  // Estrutura de madeira aparente (fachada frontal)
  for (const y of [0.04, 1.02, H - 0.04]) beam(scene, [-W / 2, f + y], [W / 2, f + y], { z: zf }, T, M.timber);
  for (let i = 0; i <= 6; i++) { const x = -W / 2 + (W * i) / 6; beam(scene, [x, f], [x, f + H], { z: zf }, T, M.timber); }
  [[0, 1], [5, 1]].forEach(([i]) => { const x0 = -W / 2 + (W * i) / 6, x1 = x0 + W / 6; beam(scene, [x0, f + 0.04], [x1, f + 1.02], { z: zf }, T * 0.85, M.timber); beam(scene, [x0, f + 1.02], [x1, f + H - 0.04], { z: zf }, T * 0.85, M.timber); });
  // Empena com cruz de santo andré
  const gy = f + H;
  beam(scene, [-W / 2, gy], [0, gy + 1.75], { z: zf + 0.05 }, T, M.timber);
  beam(scene, [W / 2, gy], [0, gy + 1.75], { z: zf + 0.05 }, T, M.timber);
  beam(scene, [-0.7, gy], [0, gy + 1.2], { z: zf + 0.05 }, T * 0.8, M.timber);
  beam(scene, [0.7, gy], [0, gy + 1.2], { z: zf + 0.05 }, T * 0.8, M.timber);
  // Lateral
  for (const y of [0.04, 1.02, H - 0.04]) beam(scene, [-D / 2, f + y], [D / 2, f + y], { x: xs }, T, M.timber);
  for (let i = 0; i <= 4; i++) { const z = -D / 2 + (D * i) / 4; beam(scene, [z, f], [z, f + H], { x: xs }, T, M.timber); }
  beam(scene, [-D / 2, f + 1.02], [-D / 4, f + H - 0.04], { x: xs }, T * 0.85, M.timber);
  // Janelas acesas
  for (const i of [1, 2, 4]) { const x = -W / 2 + (W * (i + 0.5)) / 6; box(scene, 0.34, 0.46, 0.03, M.lit, x, f + 0.4, zf - 0.01, 0); box(scene, 0.34, 0.46, 0.03, M.lit, x, f + 1.38, zf - 0.01, 0); }
  box(scene, 0.42, 0.85, 0.04, M.timber, -W / 2 + (W * 3.5) / 6, f, zf - 0.005, 0);
  for (const i of [1, 2]) { const z = -D / 2 + (D * (i + 0.5)) / 4; box(scene, 0.03, 0.46, 0.34, M.lit, xs - 0.01, f + 1.38, z, 0); }
  box(scene, 0.32, 0.9, 0.32, M.whiteSoft, -0.9, f + H + 0.6, -0.4, 0.02);
  // Jardim
  [[2.9, 2.0], [3.4, 0.6], [-3.1, 2.1], [-3.4, -1.9], [2.8, -2.1]].forEach(([x, z], i) => tree(scene, x, z, 0.7 + (i % 3) * 0.12, f, M.plant));
  box(scene, 2.2, 0.22, 0.28, M.plant, 0, f, 2.15, 0.05);
  spot(scene, { pos: [5, 13, 8], target: [0, 1.2, 0], angle: 0.34, intensity: 200, coneOpacity: 0.1 });
  spot(scene, { pos: [-7, 9, 4], target: [0, 1.4, 0], color: '#bcd2ff', intensity: 55, angle: 0.3, cone: false });
  fill(scene);
  finish(render);
}

export function condominio() {
  const { scene, render } = setup({ cam: [10.5, 4.4, 12.5], target: [0.2, 3.3, 0], fov: 34 });
  const h0 = stage(scene, { plinth: [10, 0.3, 7.4] });
  const f = h0 + 0.05;
  box(scene, 9.6, 0.05, 7, M.whiteSoft, 0, h0, 0, 0.02);
  const W = 3.4, D = 2.6, FH = 0.5, N = 12;
  let s = 9; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < N; i++) {
    const y = f + 0.5 + i * FH;
    box(scene, W - 0.3, FH - 0.08, D - 0.3, rnd() < 0.42 ? M.lit : M.glass, -0.4, y + 0.04, 0, 0.004);
    box(scene, W + 0.1, 0.07, D + 0.5, M.white, -0.4, y, 0.2, 0.012);
    box(scene, W + 0.1, 0.16, 0.02, M.glassClear, -0.4, y + 0.07, 1.44, 0);
  }
  box(scene, 0.2, N * FH + 0.5, D + 0.5, M.white, -0.4 - W / 2, f, 0.2, 0.01);
  box(scene, 0.2, N * FH + 0.5, D + 0.5, M.white, -0.4 + W / 2, f, 0.2, 0.01);
  box(scene, W - 0.3, 0.5, D - 0.3, M.lit, -0.4, f, 0, 0.01);
  const top = f + 0.5 + N * FH;
  box(scene, W + 0.1, 0.1, D + 0.5, M.white, -0.4, top, 0.2, 0.01);
  for (let i = 0; i < 6; i++) box(scene, 0.05, 0.05, D, M.gold, -0.4 - 1.3 + i * 0.52, top + 0.42, 0.2, 0);
  for (const [dx, dz] of [[-1.5, -1], [0.7, -1], [-1.5, 1.3], [0.7, 1.3]]) box(scene, 0.05, 0.4, 0.05, M.gold, -0.4 + dx + 0.3, top + 0.1, dz, 0);
  curtainTower(scene, { x: 2.9, z: -1.2, w: 2, d: 1.9, y: f + 0.5, floors: 7, fh: 0.5, lit: 0.35, seed: 31, mullions: 4 });
  box(scene, 2, 0.5, 1.9, M.white, 2.9, f, -1.2, 0.01);
  [[3.6, 2.4], [2.4, 2.9], [-3.6, 2.6], [-4.2, 1.2], [4.3, 1.1]].forEach(([x, z], i) => tree(scene, x, z, 0.7 + (i % 2) * 0.18, f));
  spot(scene, { pos: [7, 18, 10], target: [-0.3, 2.6, 0], angle: 0.33, intensity: 240, coneOpacity: 0.1 });
  spot(scene, { pos: [-8, 13, 3], target: [-0.4, 4, 0], color: '#bcd2ff', intensity: 60, angle: 0.25, cone: false });
  fill(scene);
  finish(render);
}

export function skyline(v = {}) {
  const { scene, render } = setup({ cam: [11, 8.5, 12.5], target: [0, 1.6, 0], fov: 32 , ...v });
  const h0 = stage(scene, { plinth: [11, 0.3, 8] });
  const f = h0 + 0.05;
  box(scene, 10.6, 0.05, 7.6, M.whiteSoft, 0, h0, 0, 0.02);
  let s = 5; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const cells = [];
  for (let gx = -2; gx <= 2; gx++) for (let gz = -1; gz <= 1; gz++) cells.push([gx * 2, gz * 2.2]);
  cells.forEach(([x, z], i) => {
    const center = Math.abs(x) < 1 && Math.abs(z) < 1;
    const floors = center ? 14 : 3 + Math.floor(rnd() * 8);
    const w = 1.2 + rnd() * 0.4, d = 1.2 + rnd() * 0.5;
    const top = curtainTower(scene, { x, z, w, d, y: f, floors, fh: 0.42, lit: 0.3, seed: 40 + i * 7, mullions: 3 });
    if (center) { box(scene, w * 0.75, 0.6, d * 0.75, M.white, x, top, z, 0.02); cyl(scene, 0.02, 0.035, 0.9, M.gold, x, top + 0.6, z, 10); box(scene, w * 0.78, 0.04, d * 0.78, M.gold, x, top + 0.6, z, 0); }
  });
  for (let i = 0; i < 9; i++) tree(scene, -5 + rnd() * 10, 3.4 + rnd() * 0.2, 0.45, f);
  spot(scene, { pos: [6, 19, 10], target: [0, 1, 0], angle: 0.36, intensity: 260, coneOpacity: 0.11 });
  spot(scene, { pos: [-9, 14, -2], target: [0, 2, 0], color: '#bcd2ff', intensity: 70, angle: 0.35, cone: false });
  fill(scene);
  finish(render);
}

export function chave() {
  const { scene, render } = setup({ cam: [4.2, 2.3, 5.8], target: [0, 1.35, 0], fov: 30, dof: { aperture: 0.0009, maxblur: 0.004 } });
  const h0 = stage(scene, { plinth: [3.4, 0.42], round: true });
  // Etiqueta em forma de casa com furo
  const tag = new THREE.Shape();
  tag.moveTo(-0.75, 0); tag.lineTo(0.75, 0); tag.lineTo(0.75, 1.05); tag.lineTo(0, 1.7); tag.lineTo(-0.75, 1.05); tag.lineTo(-0.75, 0);
  const hole = new THREE.Path(); hole.absarc(0, 1.25, 0.14, 0, Math.PI * 2, true); tag.holes.push(hole);
  const door = new THREE.Path(); door.moveTo(-0.17, 0.2); door.lineTo(0.17, 0.2); door.lineTo(0.17, 0.62); door.absarc(0, 0.62, 0.17, 0, Math.PI, false); door.lineTo(-0.17, 0.2); tag.holes.push(door);
  extrude(scene, tag, 0.16, M.gold, { bevel: 0.05, x: -0.35, y: h0 + 1.05, z: 0, ry: 0.35 });
  // Argola e chave
  const ring = shadowy(new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.035, 20, 64), M.gold)); ring.position.set(-0.08, h0 + 1.95, -0.02); ring.rotation.set(0.2, 1.2, 0.3); scene.add(ring);
  const key = new THREE.Group();
  const bow = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.06, 20, 48), M.goldSatin);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.0, 20), M.goldSatin); shaft.position.y = -0.7;
  const t1 = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.05), M.goldSatin); t1.position.set(0.1, -1.05, 0);
  const t2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.07, 0.05), M.goldSatin); t2.position.set(0.08, -0.9, 0);
  key.add(bow, shaft, t1, t2); shadowy(key); key.position.set(0.55, h0 + 1.65, 0.25); key.rotation.set(0.15, -0.5, 0.42); scene.add(key);
  spot(scene, { pos: [1.5, 9, 3], target: [0, 0.8, 0], angle: 0.24, intensity: 160, coneOpacity: 0.16 });
  spot(scene, { pos: [-5, 4, -3], target: [0, 1.2, 0], color: '#bcd2ff', intensity: 40, angle: 0.4, cone: false });
  fill(scene, { intensity: 0.1, rim: 0.5 });
  finish(render);
}

export function escudo() {
  const { scene, render } = setup({ cam: [5.3, 2.75, 7.4], target: [0, 1.55, 0], fov: 30, dof: { aperture: 0.0007, maxblur: 0.0035 } });
  const h0 = stage(scene, { plinth: [3.8, 0.42], round: true });
  const sh = new THREE.Shape();
  sh.moveTo(-1, 2.1); sh.lineTo(1, 2.1); sh.lineTo(1, 1.0);
  sh.bezierCurveTo(1, 0.4, 0.5, 0.05, 0, -0.25); sh.bezierCurveTo(-0.5, 0.05, -1, 0.4, -1, 1.0); sh.lineTo(-1, 2.1);
  extrude(scene, sh, 0.12, M.gold, { bevel: 0.05, x: -0.1, y: h0 + 1.38, z: -0.55, ry: 0.25 });
  const inner = new THREE.Shape();
  inner.moveTo(-0.86, 1.98); inner.lineTo(0.86, 1.98); inner.lineTo(0.86, 1.0);
  inner.bezierCurveTo(0.86, 0.48, 0.43, 0.17, 0, -0.08); inner.bezierCurveTo(-0.43, 0.17, -0.86, 0.48, -0.86, 1.0); inner.lineTo(-0.86, 1.98);
  extrude(scene, inner, 0.1, M.navy, { bevel: 0.03, x: -0.07, y: h0 + 1.41, z: -0.44, ry: 0.25 });
  // Casa branca à frente
  const hx = 0.25, hz = 0.55;
  box(scene, 1.1, 0.75, 0.9, M.white, hx, h0, hz, 0.02).rotation.y = 0.25;
  const roof = gable(scene, 1.1, 0.55, 0.9, M.white, hx, h0 + 0.75, hz, 0.08); roof.rotation.y = 0.25;
  const door = box(scene, 0.22, 0.38, 0.04, M.lit, hx + 0.12, h0, hz + 0.45, 0); door.rotation.y = 0.25;
  const win = box(scene, 0.22, 0.2, 0.04, M.lit, hx - 0.25, h0 + 0.35, hz + 0.37, 0); win.rotation.y = 0.25;
  spot(scene, { pos: [1.4, 9, 3.5], target: [0, 0.9, 0], angle: 0.25, intensity: 115, coneOpacity: 0.12 });
  spot(scene, { pos: [-5, 4, -3], target: [0, 1.2, 0], color: '#bcd2ff', intensity: 45, angle: 0.4, cone: false });
  fill(scene, { intensity: 0.1, rim: 0.5 });
  finish(render);
}

export function planta(v = {}) {
  const { scene, render } = setup({ cam: [3.4, 8.6, 6.6], target: [0.1, 0, 0.2], fov: 32, dof: { aperture: 0.0006, maxblur: 0.0035 } , ...v });
  const h0 = stage(scene, { plinth: [9.6, 0.3, 6.6] });
  const f = h0 + 0.04;
  box(scene, 8, 0.04, 5, M.whiteSoft, 0, h0, 0, 0.01);
  box(scene, 3.1, 0.015, 2.3, M.wood, -2.35, f, -1.25, 0.004);
  const WH = 0.55, T = 0.08;
  const wall = (x1, z1, x2, z2) => { const w = Math.abs(x2 - x1) || T, d = Math.abs(z2 - z1) || T; box(scene, w, WH, d, M.white, (x1 + x2) / 2, f, (z1 + z2) / 2, 0.01); };
  wall(-4, -2.5, 4, -2.5); wall(-4, 2.5, -1.2, 2.5); wall(-0.2, 2.5, 4, 2.5); wall(-4, -2.5, -4, 2.5); wall(4, -2.5, 4, 2.5);
  wall(-0.8, -2.5, -0.8, -0.6); wall(-0.8, 0.4, -0.8, 2.5); wall(-4, 0, -2.2, 0); wall(-1.4, 0, -0.8, 0);
  wall(1.6, -2.5, 1.6, -0.9); wall(1.6, 0.1, 4, 0.1); wall(1.6, -0.9, 2.2, -0.9);
  // Mobiliário
  box(scene, 1.3, 0.22, 1.7, M.whiteSoft, -2.4, f, -1.3, 0.05); box(scene, 1.3, 0.12, 0.32, M.white, -2.4, f + 0.22, -2.05, 0.04);
  box(scene, 1.9, 0.26, 0.6, M.navy, 0.4, f, 1.9, 0.08); box(scene, 0.6, 0.26, 1.1, M.navy, -0.6, f, 1.45, 0.08);
  box(scene, 1.1, 0.03, 0.7, M.wood, 0.4, f + 0.18, 0.7, 0.01);
  cyl(scene, 0.55, 0.55, 0.04, M.white, 2.9, f + 0.36, 1.3, 32); cyl(scene, 0.05, 0.08, 0.36, M.dark, 2.9, f, 1.3, 12);
  for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2; box(scene, 0.3, 0.2, 0.3, M.chair, 2.9 + Math.cos(a) * 0.8, f, 1.3 + Math.sin(a) * 0.8, 0.04); }
  box(scene, 2.2, 0.38, 0.5, M.white, 2.8, f, -2.15, 0.03); box(scene, 2.2, 0.03, 0.52, M.gold, 2.8, f + 0.38, -2.15, 0);
  box(scene, 0.9, 0.24, 0.5, M.white, 2.6, f, -1.35, 0.1);
  [[-3.6, 2.1], [3.6, 2.1], [-1.1, -2.1]].forEach(([x, z]) => { cyl(scene, 0.12, 0.1, 0.22, M.white, x, f, z, 16); sphere(scene, 0.2, M.plant, x, f + 0.38, z); });
  spot(scene, { pos: [-2.4, 9, 1], target: [-2.4, 0, -1.2], angle: 0.24, intensity: 120, coneOpacity: 0.12 });
  spot(scene, { pos: [1.8, 10, 4], target: [1.6, 0, 0.6], angle: 0.3, intensity: 150, coneOpacity: 0.1 });
  fill(scene, { intensity: 0.12, rim: 0.3 });
  finish(render);
}

const paperMat = new THREE.MeshStandardMaterial({ color: '#e6e1d6', roughness: 0.92 });
export function documento() {
  const { scene, render } = setup({ cam: [2.5, 3.1, 3.4], target: [0, 0.05, 0.05], fov: 30, dof: { aperture: 0.0012, maxblur: 0.005 } });
  stage(scene, { plinth: null });
  box(scene, 7, 0.08, 5, std2('#141c2b', 0.35), 0, -0.08, 0, 0.02);
  // Pasta navy e folhas
  box(scene, 2.1, 0.03, 2.8, M.navy, -0.15, 0, 0.05, 0.02).rotation.y = 0.12;
  for (let i = 0; i < 3; i++) { const p = box(scene, 1.9, 0.012, 2.6, M.paper, -0.12 + i * 0.03, 0.03 + i * 0.013, 0.02 - i * 0.03, 0.004); p.rotation.y = 0.12 - i * 0.05; p.material = paperMat; }
  const top = 0.03 + 3 * 0.013;
  const lines = new THREE.Group();
  for (let i = 0; i < 9; i++) { const l = new THREE.Mesh(new THREE.BoxGeometry(i % 3 === 0 ? 1.0 : 1.35, 0.004, 0.035), M.dark); l.position.set(-0.08 + (i % 3 === 0 ? -0.17 : 0), top + 0.004, -0.95 + i * 0.17); lines.add(l); }
  const title = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.005, 0.08), M.navy); title.position.set(-0.3, top + 0.005, -1.1); lines.add(title);
  lines.rotation.y = 0.02; scene.add(lines);
  // Selo dourado com fitas
  const rib1 = box(scene, 0.12, 0.006, 0.55, M.navy, 0.38, top, 0.85, 0); rib1.rotation.y = 0.35;
  const rib2 = box(scene, 0.12, 0.006, 0.55, M.navy, 0.56, top, 0.82, 0); rib2.rotation.y = -0.25;
  cyl(scene, 0.27, 0.27, 0.05, M.gold, 0.47, top + 0.005, 0.62, 48);
  cyl(scene, 0.2, 0.2, 0.012, M.goldSatin, 0.47, top + 0.055, 0.62, 48);
  // Caneta tinteiro
  const pen = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 1.2, 24), M.navy);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.058, 0.42, 24), M.navy); cap.position.y = 0.78;
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.05, 24), M.gold); band.position.y = 0.58;
  const clip = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.32, 0.03), M.gold); clip.position.set(0, 0.8, 0.07);
  const nib = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.22, 24), M.gold); nib.position.y = -0.71; nib.rotation.z = Math.PI;
  pen.add(body, cap, band, clip, nib); shadowy(pen); pen.position.set(1.15, 0.07, -0.1); pen.rotation.set(Math.PI / 2, 0, 0.55); scene.add(pen);
  spot(scene, { pos: [0.8, 7, 2], target: [0, 0, 0], angle: 0.28, intensity: 34, coneOpacity: 0.05 });
  spot(scene, { pos: [-4, 3, -2], target: [0, 0, 0], color: '#bcd2ff', intensity: 18, angle: 0.5, cone: false });
  fill(scene, { intensity: 0.1, rim: 0.3 });
  finish(render);
}

function std2(color, roughness, metalness = 0.1) { return new THREE.MeshStandardMaterial({ color, roughness, metalness }); }

export function reuniao(v = {}) {
  const { scene, render } = setup({ cam: [4.6, 3.1, 4.6], target: [-0.2, 0.75, -0.4], fov: 33, dof: { aperture: 0.0009, maxblur: 0.004 } , ...v });
  stage(scene, { plinth: null });
  box(scene, 8, 0.06, 6, M.whiteSoft, 0, 0, 0, 0.01);
  box(scene, 8, 2.4, 0.1, M.white, 0, 0.06, -2.6, 0.01);
  box(scene, 0.1, 2.4, 6, M.white, -3.5, 0.06, 0, 0.01);
  { const c = document.createElement('canvas'); c.width = 1280; c.height = 500; const g = c.getContext('2d');
    const bg = g.createLinearGradient(0, 0, 1280, 500); bg.addColorStop(0, '#16305c'); bg.addColorStop(1, '#0b1730'); g.fillStyle = bg; g.fillRect(0, 0, 1280, 500);
    g.fillStyle = '#c6a15b'; g.fillRect(70, 70, 360, 26); g.fillStyle = 'rgba(233,237,245,.85)'; for (let i = 0; i < 4; i++) g.fillRect(70, 150 + i * 46, 300 - (i % 2) * 80, 16);
    g.strokeStyle = 'rgba(233,237,245,.25)'; g.lineWidth = 2; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(560, 120 + i * 70); g.lineTo(1200, 120 + i * 70); g.stroke(); }
    g.strokeStyle = '#d8b878'; g.lineWidth = 8; g.beginPath(); [300, 330, 290, 260, 270, 210, 190, 150].forEach((v, i) => { const x = 570 + i * 88; i ? g.lineTo(x, v) : g.moveTo(x, v); }); g.stroke();
    g.fillStyle = '#5fd39a'; g.beginPath(); g.arc(1186, 150, 12, 0, Math.PI * 2); g.fill();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.25), new THREE.MeshStandardMaterial({ color: '#000', emissive: '#fff', emissiveMap: t, emissiveIntensity: 0.8, roughness: 0.3 }));
    scr.position.set(-0.2, 1.375, -2.5); scene.add(scr); }
  box(scene, 3.32, 1.37, 0.03, M.dark, -0.2, 0.69, -2.56, 0.01);
  // Mesa longa e cadeiras
  box(scene, 3.6, 0.07, 1.2, M.wood, -0.2, 0.72, 0, 0.03);
  box(scene, 0.12, 0.72, 0.8, M.white, -1.5, 0.06, 0, 0.02); box(scene, 0.12, 0.72, 0.8, M.white, 1.1, 0.06, 0, 0.02);
  for (let i = 0; i < 4; i++) for (const s of [-1, 1]) { const x = -1.55 + i * 0.9, z = s * 0.95; box(scene, 0.48, 0.07, 0.48, M.chair, x, 0.45, z, 0.03); box(scene, 0.48, 0.5, 0.07, M.chair, x, 0.5, z + s * 0.24, 0.03); cyl(scene, 0.03, 0.03, 0.4, M.dark, x, 0.06, z, 8); }
  // Pendente linear dourado
  box(scene, 2.8, 0.06, 0.12, M.gold, -0.2, 1.9, 0, 0.02); box(scene, 2.7, 0.015, 0.08, M.lit, -0.2, 1.885, 0, 0);
  for (const x of [-1.4, 1]) box(scene, 0.012, 0.6, 0.012, M.gold, x, 1.96, 0, 0);
  cyl(scene, 0.22, 0.18, 0.45, M.white, 2.6, 0.06, -1.9, 20); sphere(scene, 0.42, M.plant, 2.6, 0.9, -1.9);
  spot(scene, { pos: [-0.2, 6, 1.2], target: [-0.2, 0.7, 0], angle: 0.36, intensity: 80, coneOpacity: 0.12 });
  spot(scene, { pos: [3, 5, 3], target: [-0.5, 0.6, -0.6], color: '#fff0d4', intensity: 40, angle: 0.4, cone: false });
  fill(scene, { intensity: 0.12, rim: 0.25 });
  finish(render);
}

const deskTop = new THREE.MeshStandardMaterial({ color: '#1a2130', roughness: 0.45, metalness: 0.1 });
export function monitor() {
  const { scene, render } = setup({ cam: [1.75, 1.42, 2.55], target: [-0.05, 1.08, -0.35], fov: 34, dof: { aperture: 0.0016, maxblur: 0.005 } });
  stage(scene, { plinth: null });
  box(scene, 2.8, 0.06, 1.3, deskTop, 0, 0.72, -0.1, 0.02);
  box(scene, 0.06, 0.72, 1.2, M.dark, -1.3, 0, -0.1, 0.01); box(scene, 0.06, 0.72, 1.2, M.dark, 1.3, 0, -0.1, 0.01);
  // Monitor curvo com painel de dados
  const c = document.createElement('canvas'); c.width = 1024; c.height = 400; const g = c.getContext('2d');
  g.fillStyle = '#0c1830'; g.fillRect(0, 0, 1024, 400);
  g.fillStyle = '#13264a'; g.fillRect(24, 24, 300, 352); g.fillRect(348, 24, 652, 168); g.fillRect(348, 208, 316, 168); g.fillRect(684, 208, 316, 168);
  g.strokeStyle = '#c6a15b'; g.lineWidth = 6; g.beginPath(); [40, 70, 58, 96, 88, 120, 112, 150, 138].forEach((v, i) => { const x = 370 + i * 76, y = 175 - v; i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke();
  g.fillStyle = '#5fd39a'; for (let i = 0; i < 7; i++) g.fillRect(370 + i * 40, 360 - (30 + ((i * 37) % 90)), 24, 30 + ((i * 37) % 90));
  g.fillStyle = '#e8edf6'; for (let i = 0; i < 6; i++) g.fillRect(48, 60 + i * 48, 200 - (i % 3) * 40, 14);
  g.fillStyle = '#c6a15b'; g.beginPath(); g.arc(842, 292, 58, -Math.PI / 2, Math.PI * 0.9); g.lineTo(842, 292); g.fill();
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.wrapS = THREE.RepeatWrapping; tex.repeat.x = -1;
  const scr = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 0.62, 96, 1, true, Math.PI - 0.364, 0.728), new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: '#ffffff', emissiveIntensity: 0.9, roughness: 0.3, side: THREE.BackSide }));
  scr.position.set(0, 1.18, 1.78); scene.add(scr);
  const back = new THREE.Mesh(new THREE.CylinderGeometry(2.235, 2.235, 0.68, 96, 1, true, Math.PI - 0.37, 0.74), new THREE.MeshStandardMaterial({ color: '#1a1f2a', roughness: 0.5, side: THREE.DoubleSide }));
  back.position.set(0, 1.18, 1.78); scene.add(shadowy(back));
  box(scene, 0.08, 0.32, 0.06, M.dark, 0, 0.78, -0.5, 0.01); box(scene, 0.4, 0.02, 0.25, M.dark, 0, 0.78, -0.47, 0.01);
  box(scene, 0.9, 0.025, 0.28, M.whiteSoft, -0.05, 0.78, 0.22, 0.01); sphere(scene, 0.05, M.whiteSoft, 0.55, 0.81, 0.25).scale.set(1, 0.6, 1.5);
  cyl(scene, 0.07, 0.06, 0.16, M.white, -0.95, 0.78, 0.15, 20); cyl(scene, 0.12, 0.1, 0.2, M.white, 1.05, 0.78, -0.4, 20); sphere(scene, 0.22, M.plant, 1.05, 1.15, -0.4);
  box(scene, 0.42, 0.03, 0.3, M.navy, -0.85, 0.78, -0.15, 0.01);
  spot(scene, { pos: [-0.8, 4.5, 1.4], target: [0, 0.8, 0], angle: 0.42, intensity: 42, coneOpacity: 0.05 });
  spot(scene, { pos: [0, 1.4, -2.5], target: [0, 1.1, 0.5], angle: 0.6, intensity: 6, color: '#a9c8ff', cone: false, shadow: false });
  fill(scene, { intensity: 0.1, rim: 0.25 });
  finish(render);
}

export function trofeu() {
  const { scene, render } = setup({ cam: [3.4, 2.2, 5.2], target: [0, 1.55, 0], fov: 30, dof: { aperture: 0.001, maxblur: 0.004 } });
  const h0 = stage(scene, { plinth: [2.6, 0.5], round: true });
  cyl(scene, 0.55, 0.62, 0.4, M.navy, 0, h0, 0, 64);
  cyl(scene, 0.63, 0.63, 0.03, M.gold, 0, h0 + 0.37, 0, 64);
  const pts = [[0, 0], [0.38, 0], [0.38, 0.06], [0.16, 0.12], [0.1, 0.28], [0.07, 0.62], [0.12, 0.72], [0.34, 0.82], [0.5, 1.05], [0.56, 1.35], [0.57, 1.62], [0.53, 1.62], [0.5, 1.38], [0.43, 1.12], [0.3, 0.95], [0, 0.9]].map(([x, y]) => new THREE.Vector2(x, y));
  const cup = shadowy(new THREE.Mesh(new THREE.LatheGeometry(pts, 96), M.gold)); cup.position.y = h0 + 0.4; scene.add(cup);
  for (const s of [-1, 1]) { const hnd = shadowy(new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.035, 16, 48, Math.PI), M.gold)); hnd.position.set(s * 0.55, h0 + 0.4 + 1.25, 0); hnd.rotation.set(0, 0, s > 0 ? -Math.PI / 2 : Math.PI / 2); scene.add(hnd); }
  spot(scene, { pos: [0.6, 8, 1.6], target: [0, 1, 0], angle: 0.2, intensity: 175, coneOpacity: 0.14 });
  spot(scene, { pos: [-4, 3, -3], target: [0, 1.4, 0], color: '#bcd2ff', intensity: 30, angle: 0.4, cone: false });
  fill(scene, { intensity: 0.08, rim: 0.45 });
  finish(render);
}

// Vidro de redoma: fresnel + dois reflexos verticais (lê como vidro sobre fundo escuro sem precisar de transmissão)
function glassMat(side) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side,
    vertexShader: `varying vec3 vN; varying vec3 vV;
      void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `varying vec3 vN; varying vec3 vV;
      void main(){
        vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
        float f = pow(1. - abs(dot(n, normalize(vV))), 2.2);
        float s1 = smoothstep(.50, .56, n.x) * (1. - smoothstep(.60, .70, n.x));
        float s2 = smoothstep(-.80, -.74, n.x) * (1. - smoothstep(-.70, -.66, n.x));
        float top = smoothstep(.82, .95, n.y) * .35;
        float a = .025 + .5 * f + .4 * s1 + .18 * s2 + top * .5;
        gl_FragColor = vec4(vec3(.86, .9, 1.) * (1. + s1 * 1.1), a);
      }`,
  });
}

export function redoma() {
  const { scene, render } = setup({ cam: [4.9, 2.5, 6.9], target: [0, 1.5, 0], fov: 30, dof: { aperture: 0.0007, maxblur: 0.0035 } });
  const h0 = stage(scene, { plinth: [3.9, 0.42], round: true });
  cyl(scene, 1.42, 1.48, 0.14, M.navy, 0, h0, 0, 96);
  cyl(scene, 1.5, 1.5, 0.025, M.gold, 0, h0 + 0.11, 0, 96);
  const b = h0 + 0.14;
  // Casa-maquete
  box(scene, 1.05, 0.7, 0.82, M.white, -0.1, b, 0.05, 0.02);
  gable(scene, 1.05, 0.52, 0.82, M.white, -0.1, b + 0.7, 0.05, 0.07);
  box(scene, 0.13, 0.32, 0.13, M.whiteSoft, 0.2, b + 0.92, -0.12, 0.01);
  box(scene, 0.2, 0.36, 0.03, M.lit, 0.12, b, 0.47, 0);
  box(scene, 0.22, 0.2, 0.03, M.lit, -0.32, b + 0.32, 0.47, 0);
  box(scene, 0.03, 0.2, 0.22, M.lit, 0.43, b + 0.32, 0.05, 0);
  tree(scene, 0.85, 0.55, 0.55, b, M.plant); tree(scene, -0.85, -0.5, 0.65, b, M.plant); tree(scene, 0.75, -0.65, 0.45, b, M.plant);
  box(scene, 0.5, 0.012, 0.75, M.whiteSoft, 0.12, b, 0.85, 0.004);
  // Redoma de vidro (sino) com pegador dourado
  const R = 1.32, H = 1.7, C = 0.85, pts = [];
  for (let i = 0; i <= 8; i++) pts.push(new THREE.Vector2(R, (H * i) / 8));
  for (let i = 1; i <= 24; i++) { const a = (i / 24) * (Math.PI / 2); pts.push(new THREE.Vector2(Math.cos(a) * R, H + Math.sin(a) * C)); }
  const geo = new THREE.LatheGeometry(pts, 128);
  for (const [side, order] of [[THREE.BackSide, 1], [THREE.FrontSide, 2]]) { const m = new THREE.Mesh(geo, glassMat(side)); m.position.y = b; m.renderOrder = order; scene.add(m); }
  cyl(scene, 0.05, 0.07, 0.12, M.gold, 0, b + H + C - 0.02, 0, 32);
  sphere(scene, 0.11, M.gold, 0, b + H + C + 0.18, 0);
  spot(scene, { pos: [1.2, 9.5, 2.8], target: [0, 1, 0], angle: 0.24, intensity: 112, coneOpacity: 0.12 });
  spot(scene, { pos: [-5, 4, -3], target: [0, 1.4, 0], color: '#bcd2ff', intensity: 50, angle: 0.4, cone: false });
  fill(scene, { intensity: 0.1, rim: 0.5 });
  finish(render);
}

// Auditório de gala: palco, telão, plateia em arco e canhões de luz cruzados
async function ledWall() {
  const f = new FontFace('Schibsted', 'url(../../src/assets/fonts/schibsted-grotesk-latin-wght-normal.woff2)', { weight: '400 900' });
  await f.load(); document.fonts.add(f);
  const c = document.createElement('canvas'); c.width = 1600; c.height = 900; const g = c.getContext('2d');
  const bg = g.createRadialGradient(800, 430, 40, 800, 450, 900); bg.addColorStop(0, '#1d3766'); bg.addColorStop(0.55, '#0f1f3d'); bg.addColorStop(1, '#050b17');
  g.fillStyle = bg; g.fillRect(0, 0, 1600, 900);
  g.strokeStyle = 'rgba(198,161,91,.55)'; g.lineWidth = 3;
  for (const r of [250, 290]) { g.beginPath(); g.arc(800, 430, r, 0, Math.PI * 2); g.stroke(); }
  g.fillStyle = '#d8b878'; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  g.font = '800 300px Schibsted'; g.fillText('65', 800, 520);
  g.font = '700 46px Schibsted'; g.letterSpacing = '18px'; g.fillText('ANOS', 812, 600);
  g.fillStyle = '#e9edf5'; g.font = '600 40px Schibsted'; g.letterSpacing = '10px'; g.fillText('MELHORES DO ANO 2026', 805, 800);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

export async function auditorio(v = {}) {
  const tex = await ledWall();
  const { scene, render } = setup({ cam: [1.2, 3.3, 8.6], target: [0, 1.75, -4], fov: 38, env: 0.08, dof: { aperture: 0.00035, maxblur: 0.0025 }, bloom: { strength: 0.45, radius: 0.5, threshold: 1.0 }, ...v });
  scene.fog = new THREE.Fog('#090f1c', 14, 40);
  stage(scene, { plinth: null });
  const SZ = -4.2, SH = 0.62;
  box(scene, 10, SH, 3.4, M.plinth, 0, 0, SZ, 0.02);
  box(scene, 10.04, 0.025, 0.03, M.gold, 0, SH - 0.08, SZ + 1.7, 0);
  box(scene, 12, 5, 0.2, M.dark, 0, 0, SZ - 1.8, 0);
  // Telão de LED
  const led = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 3.15), new THREE.MeshStandardMaterial({ color: '#000000', emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0.85, roughness: 0.4 }));
  led.position.set(0, SH + 0.45 + 1.575, SZ - 1.68); scene.add(led);
  box(scene, 5.75, 3.3, 0.06, M.dark, 0, SH + 0.38, SZ - 1.72, 0.01);
  // Púlpito e mesa
  box(scene, 0.62, 1.05, 0.46, M.navy, 2.5, SH, SZ + 0.5, 0.03);
  box(scene, 0.66, 0.035, 0.5, M.gold, 2.5, SH + 1.05, SZ + 0.5, 0.01);
  box(scene, 3.2, 0.06, 0.7, M.whiteSoft, -1.6, SH + 0.72, SZ + 0.1, 0.02);
  box(scene, 3.1, 0.66, 0.04, M.navy, -1.6, SH + 0.06, SZ + 0.43, 0.01);
  for (let i = 0; i < 4; i++) box(scene, 0.42, 0.5, 0.06, M.chair, -2.75 + i * 0.77, SH + 0.45, SZ - 0.45, 0.02);
  // Plateia em arco, em degraus
  const seat = new THREE.BoxGeometry(0.46, 0.1, 0.42), back = new THREE.BoxGeometry(0.46, 0.5, 0.08);
  const fabric = new THREE.MeshStandardMaterial({ color: '#1b2a4a', roughness: 0.85 });
  const cx = 0, cz = SZ - 1.0;
  for (let r = 0; r < 9; r++) {
    const R = 4.6 + r * 0.95, y = Math.max(0, r - 2) * 0.16, span = 0.62;
    if (y > 0) { const tier = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.48, R + 0.48, y, 96, 1, false, Math.PI - span - 0.06, (span + 0.06) * 2), M.floor); tier.position.set(cx, y / 2, cz); tier.receiveShadow = true; scene.add(tier); }
    const n = Math.floor((2 * span * R) / 0.56);
    for (let i = 0; i <= n; i++) {
      const a = Math.PI - span + (2 * span * i) / n;
      const x = cx + Math.sin(a) * R, z = cz + Math.cos(a) * -R;
      if (Math.abs(x) < 0.55) continue;
      const grp = new THREE.Group();
      const s1 = new THREE.Mesh(seat, fabric); s1.position.y = 0.42;
      const s2 = new THREE.Mesh(back, fabric); s2.position.set(0, 0.68, 0.22); s2.rotation.x = -0.12;
      grp.add(s1, s2); shadowy(grp);
      grp.position.set(x, y, z); grp.rotation.y = -(a - Math.PI); scene.add(grp);
    }
  }
  // Canhões de luz cruzados sobre o palco
  spot(scene, { pos: [-5.5, 8.5, 2.5], target: [1.6, SH, SZ + 0.4], angle: 0.13, intensity: 210, coneOpacity: 0.16 });
  spot(scene, { pos: [5.5, 8.5, 2.5], target: [-1.4, SH, SZ + 0.2], angle: 0.13, intensity: 190, coneOpacity: 0.16, color: '#fff3dc' });
  spot(scene, { pos: [2.5, 9.5, -1.5], target: [2.5, SH, SZ + 0.5], angle: 0.1, intensity: 110, coneOpacity: 0.12 });
  spot(scene, { pos: [0, 3.2, SZ - 1.2], target: [0, 0.6, 5], angle: 0.75, intensity: 55, color: '#8fb0ff', cone: false, shadow: false });
  spot(scene, { pos: [0, 7, 6], target: [0, 0, 1.5], angle: 0.5, intensity: 30, cone: false, color: '#9fb6e8' });
  fill(scene, { intensity: 0.08, rim: 0.2 });
  finish(render);
}

export const planta_b = () => planta({ cam: [0.6, 10.8, 2.4], target: [0.1, 0, 0.15], fov: 33 });
export const reuniao_b = () => reuniao({ cam: [-2.9, 2.5, 3.7], target: [0.1, 0.8, -0.7], fov: 35 });

export const auditorio_b = () => auditorio({ cam: [-4.6, 2.3, 2.2], target: [0.6, 1.9, -4.6], fov: 40, dof: { aperture: 0.0005, maxblur: 0.003 } });

// Clínica: edifício de saúde com placa de cruz médica (benefício Saúde)
export function clinica() {
  const { scene, render } = setup({ cam: [9.6, 4.4, 10.6], target: [0.2, 1.3, 0.2], fov: 31 });
  const h0 = stage(scene, { plinth: [10.6, 0.3, 7.4] });
  const f = h0 + 0.05;
  box(scene, 10.2, 0.05, 7, M.whiteSoft, 0, h0, 0, 0.02);
  // Térreo envidraçado (recepção acesa)
  box(scene, 5.4, 1.0, 2.3, M.lit, -0.6, f, -0.4, 0.01);
  for (let i = 0; i <= 9; i++) box(scene, 0.035, 1.0, 0.04, M.white, -3.3 + i * 0.6, f, 0.77, 0);
  // Dois pavimentos brancos com faixa de janelas de luz fria
  for (let k = 0; k < 2; k++) {
    const y = f + 1.0 + k * 0.95;
    box(scene, 6.2, 0.95, 2.8, M.white, -0.5, y, -0.4, 0.02);
    box(scene, 5.6, 0.36, 0.03, M.litCool, -0.5, y + 0.3, 1.01, 0);
    for (let i = 0; i <= 8; i++) box(scene, 0.05, 0.36, 0.05, M.white, -3.3 + i * 0.7, y + 0.3, 1.03, 0);
  }
  box(scene, 6.4, 0.08, 3.0, M.white, -0.5, f + 2.9, -0.4, 0.01);
  // Marquise de entrada com pilares dourados
  box(scene, 2.4, 0.08, 1.5, M.white, 1.0, f + 1.0, 1.35, 0.01);
  for (const x of [0.0, 2.0]) cyl(scene, 0.03, 0.03, 1.0, M.gold, x, f, 2.0, 12);
  // Totem com cruz médica (luz fria)
  box(scene, 0.62, 1.7, 0.18, M.white, 3.7, f, 1.9, 0.02);
  box(scene, 0.36, 0.11, 0.04, M.litCool, 3.7, f + 1.18, 2.0, 0);
  box(scene, 0.11, 0.36, 0.04, M.litCool, 3.7, f + 1.055, 2.0, 0);
  box(scene, 0.64, 0.03, 0.2, M.gold, 3.7, f + 1.7, 1.9, 0);
  // Caminho, estacionamento e árvores
  box(scene, 1.4, 0.012, 2.4, M.white, 1.0, f, 2.6, 0.004);
  for (let i = 0; i < 4; i++) box(scene, 0.03, 0.006, 0.9, M.white, -3.9 + i * 0.7, f, 2.4, 0);
  [[-4.4, 2.4], [-4.5, -2.2], [4.3, -2.0], [4.4, 0.4], [-2.2, 2.9]].forEach(([x, z], i) => tree(scene, x, z, 0.8 + (i % 2) * 0.15, f, M.plant));
  spot(scene, { pos: [6, 13, 9], target: [0, 0.8, 0.3], angle: 0.36, intensity: 200, coneOpacity: 0.1 });
  spot(scene, { pos: [-8, 9, 6], target: [0, 1, 0], color: '#bcd2ff', intensity: 60, angle: 0.3, cone: false });
  fill(scene);
  finish(render);
}
