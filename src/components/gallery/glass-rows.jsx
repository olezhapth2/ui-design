/* eslint-disable react-refresh/only-export-components */
"use strict";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import * as THREE from "three";
const GAP = 24;
const ROW_PAD = 12;
const ROW_GAP = 20;
const BLEED = 40;
const RADIUS = 16;
const TEX_FPS = 24;
const BG_FPS = 30;
const SCROLL_EASE = 9;
const DRAG_EASE = 30;
const FLING = 0.16;
const AXIS_LOCK = 6;
export const SWITCH_IN_MS = 125;
export const SWITCH_OUT_MS = 210;
const PEAK_PX = 6e3;
const SLOW_FACTOR = 0.12;
const CARD_ALPHA = 0.6;
const sstep = (u) => u * u * (3 - 2 * u);
export function cardWidthFor(vw, vh, rowCount) {
  const nonCard = rowCount * (2 * ROW_PAD) + (rowCount - 1) * ROW_GAP + 2 * BLEED;
  const byWidth = vw < 640 ? Math.round(vw * 0.8) : Math.min(900, Math.max(440, Math.round(vw * 0.36)));
  const byHeight = Math.floor((vh - nonCard) / rowCount * (16 / 9));
  return Math.max(100, Math.min(byWidth, byHeight));
}
export function blockHeightFor(cardW, rowCount) {
  const cardH = cardW * 9 / 16;
  return Math.round(
    rowCount * (cardH + 2 * ROW_PAD) + (rowCount - 1) * ROW_GAP + 2 * BLEED
  );
}
const IMG_RE = /\.(png|jpe?g|webp|gif)(\?|#|$)/i;
const mediaCache = /* @__PURE__ */ new Map();
let mediaLayer = null;
const isImg = (m) => m.tagName === "IMG";
const mediaReady = (m) =>
  !!m && (isImg(m) ? m.complete && m.naturalWidth > 0 : m.readyState >= 2 && m.videoWidth > 0);
const mediaTime = (m) => (mediaReady(m) ? (isImg(m) ? 0 : m.currentTime) : -1);
function getMedia(src) {
  const hit = mediaCache.get(src);
  if (hit) return hit;
  let el;
  if (IMG_RE.test(src)) {
    el = new Image();
    el.decoding = "async";
  } else {
    el = document.createElement("video");
    el.muted = true;
    el.loop = true;
    el.playsInline = true;
    el.autoplay = true;
    el.preload = "auto";
    el.disablePictureInPicture = true;
    el.style.cssText = "position:fixed;left:0;top:0;width:2px;height:2px;opacity:0.01;pointer-events:none;z-index:9999;";
  }
  if (!mediaLayer) {
    mediaLayer = document.createElement("div");
    mediaLayer.style.cssText = "position:fixed;left:0;top:0;width:0;height:0;z-index:9999;pointer-events:none;";
    document.body.appendChild(mediaLayer);
  }
  mediaLayer.appendChild(el);
  el.src = src;
  if (!isImg(el)) {
    el.play().catch(() => {
    });
  }
  mediaCache.set(src, el);
  return el;
}
function pathRoundRect(ctx, x, y, w, h, r) {
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function drawCard(ctx, x, y, w, h, media) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  pathRoundRect(ctx, 0, 0, w, h, RADIUS);
  ctx.save();
  ctx.clip();
  if (mediaReady(media)) {
    const sw = isImg(media) ? media.naturalWidth : media.videoWidth;
    const sh = isImg(media) ? media.naturalHeight : media.videoHeight;
    const scale = Math.max(w / sw, h / sh);
    const dw = sw * scale;
    const dh = sh * scale;
    ctx.drawImage(media, (w - dw) / 2, (h - dh) / 2, dw, dh);
  } else {
    ctx.fillStyle = "#120F17";
    ctx.fillRect(0, 0, w, h);
    const sheen = ctx.createLinearGradient(0, 0, 0, h * 0.5);
    sheen.addColorStop(0, "rgba(255,255,255,0.045)");
    sheen.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = sheen;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.restore();
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.stroke();
  ctx.restore();
}
function buildRowTexture(cards, cardH, dpr) {
  const ws = cards.map((c) => Math.round(cardH * c.iw / c.ih));
  const xs = [];
  let x = 0;
  for (const w of ws) {
    xs.push(x);
    x += w + GAP;
  }
  const period = x;
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(period * dpr);
  canvas.height = Math.ceil(cardH * dpr);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.scale(dpr, dpr);
  ctx.globalAlpha = CARD_ALPHA;
  cards.forEach((_, i) => drawCard(ctx, xs[i], 0, ws[i], cardH));
  ctx.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  return { tex, period, ctx, xs, ws };
}
const LENS = {
  sizeX: 0.42,
  sizeY: 0.78,
  rotation: 65,
  zoom: 1.4,
  dispersion: 7,
  glow: 3,
  whiteGlow: 0.2,
  novaSize: 12,
  blueRing: 3,
  ringRadius: 0.49,
  ringWidth: 0.014,
  shimmer: true,
  shimmerFreq: 12,
  shimmerSpeed: 3.5,
  shimmerDepth: 0.1,
  rimStart: 0.578,
  rimTangential: 0.5,
  rimInward: 0,
  rimFreq1: 2,
  rimFreq2: 1,
  blueColor: "#9aa3b2",
  rimLine: 1,
  rimLinePos: 0.488,
  rimLineWidth: 3e-3,
  samples: 16,
  scale: 2.25
};
const LENS_VERTEX = (
  /* glsl */
  `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`
);
const LENS_FRAGMENT = (
  /* glsl */
  `
#define PI 3.14159265
precision highp float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uCenter;
uniform float uSizeX;
uniform float uSizeY;
uniform float uAspect;
uniform float uZoom;
uniform float uDispersion;
uniform float uGlow;
uniform float uWhiteGlow;
uniform float uNovaSize;
uniform float uBlueRing;
uniform float uRingRadius;
uniform float uRingWidth;
uniform float uShimmer;
uniform float uShimmerFreq;
uniform float uShimmerSpeed;
uniform float uShimmerDepth;
uniform float uTime;
uniform float uRimStart;
uniform float uRimTangential;
uniform float uRimInward;
uniform float uRimFreq1;
uniform float uRimFreq2;
uniform vec3 uBlueColor;
uniform float uRimLine;
uniform float uRimLinePos;
uniform float uRimLineWidth;
uniform float uRotation;
uniform int uSamples;

const int MAX_SAMPLES = 16;

void discLens(
  vec2 center,
  out vec4 content,
  out vec4 deco,
  out float mask,
  out float inLens
) {
  content = vec4(0.0);
  deco = vec4(0.0);
  mask = 0.0;
  inLens = 0.0;

  vec2 p = vUv - center;
  p.x *= uAspect;
  float ca = cos(uRotation), sa = sin(uRotation);
  p = mat2(ca, -sa, sa, ca) * p;
  vec2 halfSize = vec2(uSizeX, uSizeY);
  float dist = length(p / halfSize);
  if (dist > 1.0) return;
  inLens = 1.0;
  mask = smoothstep(1.0, 0.93, dist);
  // \u043D\u0430 \u043A\u0440\u043E\u043C\u043A\u0435 \u043B\u0438\u043D\u0437\u044B \u0438\u0441\u043A\u0430\u0436\u0435\u043D\u0438\u0435 \u0433\u0430\u0441\u043D\u0435\u0442 \u0432 \u043D\u043E\u043B\u044C: \u043A\u043E\u043D\u0442\u0435\u043D\u0442 \u0441\u043E\u0432\u043F\u0430\u0434\u0430\u0435\u0442 \u0441
  // \u0431\u0430\u0437\u043E\u0439 \u2192 \u0433\u0440\u0430\u043D\u0438\u0446\u044B \u043D\u0435 \u0432\u0438\u0434\u043D\u043E \u0438 \u043D\u0438\u0447\u0435\u0433\u043E \u043D\u0435 \u043F\u0435\u0440\u0435\u043A\u0440\u044B\u0432\u0430\u0435\u0442\u0441\u044F \u043F\u043E\u043B\u0443\u043F\u0440\u043E\u0437\u0440\u0430\u0447\u043D\u043E
  float settle = smoothstep(1.0, 0.82, dist);

  float nd = clamp(dist, 0.0, 1.0);
  vec2 offset = vUv - center;
  vec2 radialDir = normalize(offset + 1e-6);
  vec2 tangentDir = vec2(-radialDir.y, radialDir.x);
  float angle = atan(p.y, p.x);

  float pull = uZoom * 0.30 * nd * nd * settle;
  float rimStrength = smoothstep(uRimStart, 1.0, nd);
  float fluidWave = sin(angle * uRimFreq1) * 0.55 + sin(angle * uRimFreq2) * 0.25;
  float rScreen = (uSizeX + uSizeY) * 0.5;
  vec2 rimOff =
    tangentDir * fluidWave * rimStrength * rScreen * uRimTangential * settle;
  vec2 rimPull = -radialDir * rimStrength * rScreen * uRimInward * settle;
  vec2 baseUV = center + offset * (1.0 - pull) + rimOff + rimPull;

  float rimMask = smoothstep(0.55, 1.0, nd);
  vec2 dispDir = offset * uDispersion * 0.004 * rimMask * settle;
  int N = uSamples;
  if (N < 2) N = 2;
  if (N > MAX_SAMPLES) N = MAX_SAMPLES;
  vec4 col = vec4(0.0);
  vec4 wsum = vec4(0.0);
  for (int i = 0; i < MAX_SAMPLES; i++) {
    if (i >= N) break;
    float t = float(i) / float(N - 1);
    vec4 s = texture2D(uTex, baseUV + dispDir * (t - 0.5));
    vec3 w = vec3(
      exp(-pow((t - 0.00) / 0.38, 2.0)),
      exp(-pow((t - 0.50) / 0.38, 2.0)),
      exp(-pow((t - 1.00) / 0.38, 2.0))
    );
    float wa = (w.x + w.y + w.z) / 3.0;
    col += vec4(s.rgb * w, s.a * wa);
    wsum += vec4(w, wa);
  }
  col /= max(wsum, vec4(0.001));
  content = col;
  // \u0437\u0430\u0442\u0435\u043C\u043D\u0435\u043D\u0438\u0435/\u0442\u0438\u043D\u0442 \u0433\u0430\u0441\u043D\u0443\u0442 \u0432\u043C\u0435\u0441\u0442\u0435 \u0441 settle \u2192 \u043D\u0430 \u043A\u0440\u043E\u043C\u043A\u0435 content == base
  content.rgb *= mix(1.0, mix(0.91, 1.0, smoothstep(0.0, 0.38, nd)), settle);

  float r2 = nd * nd * 0.25;
  float gs = max(uNovaSize * uGlow * 0.003, 0.004);
  float nova = exp(-r2 / gs) + exp(-r2 / (gs * 7.0)) * 0.18;
  nova *= uWhiteGlow * (uGlow / 17.0) * 1.15;
  vec3 d = vec3(nova);
  float da = nova;

  float dC = dist * 0.5;
  float tR = clamp(uRingRadius, 0.1, 0.49);
  float rW = max(uRingWidth, 0.003);
  float ring = exp(-pow((dC - tR) / rW, 2.0));
  ring *= uBlueRing * (uGlow / 17.0) * 1.8;
  if (uShimmer > 0.5) {
    ring *= sin(angle * uShimmerFreq + uTime * uShimmerSpeed) * uShimmerDepth
      + (1.0 - uShimmerDepth);
  }
  float ringAura = exp(-pow((dC - tR) / (rW * 6.0), 2.0)) * 0.28
    * uBlueRing * (uGlow / 17.0);
  d += uBlueColor * (ring + ringAura);
  da += (ring + ringAura) * 0.9;

  float rimT = exp(-pow((dC - uRimLinePos) / max(uRimLineWidth, 0.0001), 2.0))
    * uRimLine;
  d += vec3(rimT);
  da += rimT;

  // \u043C\u043E\u0440\u043E\u0437\u043D\u044B\u0439 \u0442\u0438\u043D\u0442 \u0438 \u0431\u043B\u0438\u043A \u2014 \u0442\u043E\u043B\u044C\u043A\u043E \u043F\u043E \u0441\u043E\u0434\u0435\u0440\u0436\u0438\u043C\u043E\u043C\u0443 \u0438 \u0442\u043E\u043B\u044C\u043A\u043E \u043F\u043E\u043A\u0430
  // \u0438\u0441\u043A\u0430\u0436\u0435\u043D\u0438\u0435 \u0435\u0449\u0451 \u0430\u043A\u0442\u0438\u0432\u043D\u043E (settle): \u043D\u0430 \u043A\u0440\u043E\u043C\u043A\u0435 content == base
  float contentA = content.a;
  float bandPos = fract(uTime * 0.03) * 2.4 - 0.7;
  float band = exp(-pow(((vUv.x * 0.7 + vUv.y * 0.7) - bandPos) / 0.16, 2.0))
    * 0.14 * contentA * settle;
  content.rgb += vec3(band);
  content.rgb += vec3(0.10) * contentA * settle;

  deco = vec4(d, clamp(da, 0.0, 0.95));
}

void main(){
  vec4 base = texture2D(uTex, vUv);
  vec4 content;
  vec4 deco;
  float mask;
  float inLens;
  discLens(uCenter, content, deco, mask, inLens);

  // \u0432\u043D\u0443\u0442\u0440\u0438 \u043B\u0438\u043D\u0437\u044B \u2014 \u0442\u043E\u043B\u044C\u043A\u043E \u0438\u0441\u043A\u0430\u0436\u0451\u043D\u043D\u044B\u0439 \u0441\u043B\u043E\u0439, \u0431\u0435\u0437 \u0441\u043C\u0435\u0448\u0435\u043D\u0438\u044F \u0441 \u0431\u0430\u0437\u043E\u0439:
  // \u043F\u043E\u043B\u0443\u043F\u0440\u043E\u0437\u0440\u0430\u0447\u043D\u043E\u0441\u0442\u0438 \u043D\u0435\u0442, \xAB\u043F\u0440\u0438\u0437\u0440\u0430\u043A\u0430\xBB \u043E\u0431\u044B\u0447\u043D\u043E\u0433\u043E \u0441\u043B\u043E\u044F \u043F\u043E\u0434 \u043D\u0438\u043C \u043D\u0435\u0442
  vec3 rgb;
  float a;
  if (inLens > 0.5) {
    rgb = content.rgb;
    a = content.a;
  } else {
    rgb = base.rgb;
    a = base.a;
  }

  // \u0434\u0435\u043A\u043E\u0440 (\u043A\u043E\u043B\u044C\u0446\u043E, rim, nova) \u2014 \u0441 \u043F\u043B\u043E\u0442\u043D\u043E\u0439 \u043C\u0430\u0441\u043A\u043E\u0439, \u0447\u0451\u0442\u043A\u0438\u0439
  float dw = deco.a * mask;
  rgb = rgb * (1.0 - dw) + deco.rgb * dw;
  a = a + dw * (1.0 - a);
  gl_FragColor = vec4(rgb, a);
}
`
);
function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
let sharedRenderer = null;
function getSharedRenderer(dpr, W, H) {
  if (!sharedRenderer) {
    try {
      sharedRenderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        premultipliedAlpha: false
      });
    } catch {
      return null;
    }
  }
  const renderer = sharedRenderer;
  renderer.setPixelRatio(dpr);
  renderer.setSize(W, H, false);
  renderer.setClearColor(0, 0);
  renderer.domElement.style.display = "block";
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  renderer.domElement.setAttribute("aria-hidden", "true");
  return renderer;
}
function createGlassEngine(mount, opts) {
  const reduced = prefersReducedMotion();
  const { rows, cardW } = opts;
  const cardH = cardW * 9 / 16;
  const w0 = Math.max(1, mount.clientWidth);
  const dpr = Math.min(window.devicePixelRatio || 1, 1440 / w0);
  const texDpr = Math.min(dpr, 1.5);
  let W = w0;
  let H = Math.max(1, mount.clientHeight);
  const rendererOrNull = getSharedRenderer(dpr, W, H);
  if (!rendererOrNull) return null;
  const renderer = rendererOrNull;
  if (renderer.domElement.parentNode !== mount) {
    mount.appendChild(renderer.domElement);
  }
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-W / 2, W / 2, H / 2, -H / 2, -100, 100);
  camera.position.z = 10;
  const rowMeshes = [];
  for (const def of rows) {
    const built = buildRowTexture(def.cards, cardH, texDpr);
    if (!built) {
      rowMeshes.forEach((r) => {
        r.mesh.geometry.dispose();
        r.mat.dispose();
        r.tex.dispose();
      });
      return null;
    }
    const mat = new THREE.MeshBasicMaterial({
      map: built.tex,
      transparent: true,
      depthWrite: false
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
    scene.add(mesh);
    rowMeshes.push({
      mesh,
      mat,
      tex: built.tex,
      ctx: built.ctx,
      cards: def.cards,
      xs: built.xs,
      ws: built.ws,
      period: built.period,
      offset: rowMeshes.length * 0.35,
      target: rowMeshes.length * 0.35,
      dragging: false,
      speed: 2 / def.duration * SLOW_FACTOR,
      rowTop: 0,
      lastT: Array.from({ length: def.cards.length }, () => -1),
      lastA: Array.from({ length: def.cards.length }, () => CARD_ALPHA)
    });
  }
  rowMeshes.forEach((r, i) => {
    r.rowTop = BLEED + ROW_PAD + i * (cardH + 2 * ROW_PAD + ROW_GAP);
  });
  const activeSrcs = new Set(rows.flatMap((def) => def.cards.map((c) => c.src)));
  for (const [src, media] of mediaCache) {
    if (isImg(media)) continue;
    if (activeSrcs.has(src)) {
      if (media.paused) media.play().catch(() => {
      });
    } else if (!media.paused) {
      media.pause();
    }
  }
  const rt = new THREE.WebGLRenderTarget(W * dpr, H * dpr, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter
  });
  const lensScene = new THREE.Scene();
  const lensCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const rad = (a) => a * Math.PI / 180;
  const uniforms = {
    uTex: { value: rt.texture },
    uCenter: { value: new THREE.Vector2(0.5, 0.5) },
    uSizeX: { value: LENS.sizeX * LENS.scale },
    uSizeY: { value: LENS.sizeY * LENS.scale },
    uAspect: { value: W / H },
    uZoom: { value: LENS.zoom },
    uDispersion: { value: LENS.dispersion },
    uGlow: { value: LENS.glow },
    uWhiteGlow: { value: LENS.whiteGlow },
    uNovaSize: { value: LENS.novaSize },
    uBlueRing: { value: LENS.blueRing },
    uRingRadius: { value: LENS.ringRadius },
    uRingWidth: { value: LENS.ringWidth },
    uShimmer: { value: reduced || !LENS.shimmer ? 0 : 1 },
    uShimmerFreq: { value: LENS.shimmerFreq },
    uShimmerSpeed: { value: LENS.shimmerSpeed },
    uShimmerDepth: { value: LENS.shimmerDepth },
    uTime: { value: 0 },
    uRimStart: { value: LENS.rimStart },
    uRimTangential: { value: LENS.rimTangential },
    uRimInward: { value: LENS.rimInward },
    uRimFreq1: { value: LENS.rimFreq1 },
    uRimFreq2: { value: LENS.rimFreq2 },
    uBlueColor: { value: new THREE.Color(LENS.blueColor) },
    uRimLine: { value: LENS.rimLine },
    uRimLinePos: { value: LENS.rimLinePos },
    uRimLineWidth: { value: LENS.rimLineWidth },
    uRotation: { value: rad(LENS.rotation) },
    uSamples: { value: LENS.samples }
  };
  const lensMat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: LENS_VERTEX,
    fragmentShader: LENS_FRAGMENT,
    transparent: true,
    depthWrite: false,
    depthTest: false
  });
  const lensQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), lensMat);
  lensScene.add(lensQuad);
  function layout() {
    rowMeshes.forEach((r) => {
      r.mesh.scale.set(W, cardH, 1);
      const centerY = H / 2 - (r.rowTop + cardH / 2);
      r.mesh.position.set(0, centerY, 0);
      if (r.mat.map) r.mat.map.repeat.x = W / r.period;
    });
  }
  function resize() {
    W = Math.max(1, mount.clientWidth);
    H = Math.max(1, mount.clientHeight);
    renderer.setSize(W, H, false);
    camera.left = -W / 2;
    camera.right = W / 2;
    camera.top = H / 2;
    camera.bottom = -H / 2;
    camera.updateProjectionMatrix();
    rt.setSize(W * dpr, H * dpr);
    uniforms.uAspect.value = W / H;
    const mob = W < 768;
    uniforms.uZoom.value = mob ? 1.6 : LENS.zoom;
    uniforms.uDispersion.value = mob ? 9 : LENS.dispersion;
    layout();
  }
  resize();
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(mount);
  const canvas = renderer.domElement;
  canvas.style.touchAction = "pan-y";
  canvas.style.cursor = "grab";
  function rowAtLocal(clientY) {
    const rect = canvas.getBoundingClientRect();
    const y = clientY - rect.top;
    let best = null;
    let bd = Infinity;
    for (const r of rowMeshes) {
      const top = r.rowTop;
      const bot = r.rowTop + cardH;
      const d = y < top ? top - y : y > bot ? y - bot : 0;
      if (d < bd) {
        bd = d;
        best = r;
      }
    }
    return best;
  }
  function hitCard(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    for (const r of rowMeshes) {
      if (y < r.rowTop || y > r.rowTop + cardH) continue;
      let u = x / r.period + r.offset;
      u -= Math.floor(u);
      const cx = u * r.period;
      for (let i = 0; i < r.cards.length; i++) {
        if (cx >= r.xs[i] && cx <= r.xs[i] + r.ws[i]) return r.cards[i];
      }
    }
    return null;
  }
  const onWheel = (e) => {
    const row = rowAtLocal(e.clientY);
    if (!row) return;
    if (Math.abs(e.deltaY) >= Math.abs(e.deltaX) && document.documentElement.scrollHeight > window.innerHeight + 1) {
      return;
    }
    e.preventDefault();
    let d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (e.deltaMode === 1) d *= 16;
    else if (e.deltaMode === 2) d *= W;
    row.target += d / row.period;
  };
  let gesture = null;
  const onPointerDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (gesture) return;
    const row = rowAtLocal(e.clientY);
    if (!row) return;
    gesture = {
      id: e.pointerId,
      row,
      axis: null,
      sx: e.clientX,
      sy: e.clientY,
      lastX: e.clientX,
      lastT: performance.now(),
      vel: 0
    };
    canvas.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!gesture || e.pointerId !== gesture.id) return;
    if (!gesture.axis) {
      const adx = Math.abs(e.clientX - gesture.sx);
      const ady = Math.abs(e.clientY - gesture.sy);
      if (adx < AXIS_LOCK && ady < AXIS_LOCK) return;
      gesture.axis = adx >= ady ? "x" : "y";
      if (gesture.axis === "x") {
        gesture.row.dragging = true;
        canvas.style.cursor = "grabbing";
      }
    }
    if (gesture.axis !== "x") return;
    const dx = e.clientX - gesture.lastX;
    const now = performance.now();
    const dts = Math.max(1e-3, (now - gesture.lastT) / 1e3);
    gesture.row.target -= dx / gesture.row.period;
    gesture.vel = gesture.vel * 0.75 + dx / dts * 0.25;
    gesture.lastX = e.clientX;
    gesture.lastT = now;
  };
  const endGesture = (e, fling) => {
    if (!gesture || e.pointerId !== gesture.id) return;
    const g = gesture;
    gesture = null;
    if (fling && g.axis === null) {
      const card = hitCard(g.sx, g.sy);
      if (card) opts.onCardClick?.(card);
    }
    if (g.axis === "x") {
      if (fling && !reduced) {
        g.row.target -= g.vel * FLING / g.row.period;
      }
      g.row.dragging = false;
      canvas.style.cursor = "grab";
    }
    if (canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }
  };
  const onPointerUp = (e) => endGesture(e, true);
  const onPointerCancel = (e) => endGesture(e, false);
  const hover = { x: 0, y: 0, inside: false };
  let hoverDirty = false;
  const onHoverMove = (e) => {
    if (e.pointerType === "touch") return;
    const rect = canvas.getBoundingClientRect();
    hover.x = e.clientX - rect.left;
    hover.y = e.clientY - rect.top;
    hover.inside = true;
    hoverDirty = true;
  };
  const onHoverLeave = () => {
    hover.inside = false;
    hoverDirty = true;
  };
  canvas.addEventListener("wheel", onWheel, { passive: false });
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerCancel);
  canvas.addEventListener("pointermove", onHoverMove);
  canvas.addEventListener("pointerleave", onHoverLeave);
  let raf = 0;
  let running = true;
  let visible = true;
  let last = performance.now();
  let phase = opts.startPhase;
  let phaseAge = 0;
  let texTimer = 0;
  const accelIn = () => {
    phase = "in";
    phaseAge = 0;
  };
  function tick() {
    if (!running) return;
    if (!visible || document.hidden) {
      raf = 0;
      last = performance.now();
      return;
    }
    const now = performance.now();
    if (now - last < 1e3 / BG_FPS) {
      raf = requestAnimationFrame(tick);
      return;
    }
    const dt = Math.min(0.05, (now - last) / 1e3);
    last = now;
    let peakK = 0;
    if (phase === "in") {
      phaseAge += dt;
      const u = Math.min(1, phaseAge / (SWITCH_IN_MS / 1e3));
      peakK = sstep(u);
    } else if (phase === "out") {
      phaseAge += dt;
      const u = Math.min(1, phaseAge / (SWITCH_OUT_MS / 1e3));
      peakK = 1 - sstep(u);
      if (u >= 1) phase = null;
    }
    const peakPx = PEAK_PX * peakK;
    rowMeshes.forEach((r) => {
      if (!reduced) {
        r.target -= (r.speed + peakPx / r.period) * dt;
      }
      const lam = r.dragging ? DRAG_EASE : SCROLL_EASE;
      r.offset += (r.target - r.offset) * (1 - Math.exp(-lam * dt));
      if (r.mat.map) r.mat.map.offset.x = r.offset;
    });
    texTimer += dt;
    if (hoverDirty || texTimer >= 1 / TEX_FPS) {
      texTimer = 0;
      hoverDirty = false;
      for (let ri = 0; ri < rowMeshes.length; ri++) {
        const r = rowMeshes[ri];
        let hi = -1;
        if (hover.inside && hover.y >= r.rowTop && hover.y <= r.rowTop + cardH) {
          let u = hover.x / r.period + r.offset;
          u -= Math.floor(u);
          const cx = u * r.period;
          for (let i = 0; i < r.cards.length; i++) {
            if (cx >= r.xs[i] && cx <= r.xs[i] + r.ws[i]) {
              hi = i;
              break;
            }
          }
        }
        let dirty = false;
        for (let i = 0; i < r.cards.length; i++) {
          const v = getMedia(r.cards[i].src);
          const t = mediaTime(v);
          const base =
            W < 768
              ? ri === 0
                ? 1
                : ri === 1
                  ? 0.9
                  : 0.8
              : ri <= 1
                ? 0.9
                : CARD_ALPHA;
          const a = i === hi ? 1 : base;
          if (t === r.lastT[i] && a === r.lastA[i]) continue;
          r.lastT[i] = t;
          r.lastA[i] = a;
          r.ctx.clearRect(r.xs[i] - 1, 0, r.ws[i] + 2, cardH);
          r.ctx.globalAlpha = a;
          drawCard(r.ctx, r.xs[i], 0, r.ws[i], cardH, v);
          r.ctx.globalAlpha = 1;
          dirty = true;
        }
        if (dirty) r.tex.needsUpdate = true;
      }
    }
    uniforms.uTime.value = now * 1e-3;
    renderer.setRenderTarget(rt);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    renderer.render(lensScene, lensCam);
    raf = requestAnimationFrame(tick);
  }
  function startLoop() {
    if (!running || raf) return;
    last = performance.now();
    raf = requestAnimationFrame(tick);
  }
  startLoop();
  const intersection = new IntersectionObserver(([entry]) => {
    const box = entry?.boundingClientRect;
    if (!box || box.width === 0 || box.height === 0) return;
    visible = entry?.isIntersecting ?? true;
    if (visible) startLoop();
  });
  intersection.observe(mount);
  const onVisibility = () => {
    if (!document.hidden) startLoop();
  };
  document.addEventListener("visibilitychange", onVisibility);
  function destroy() {
    running = false;
    cancelAnimationFrame(raf);
    resizeObserver.disconnect();
    intersection.disconnect();
    document.removeEventListener("visibilitychange", onVisibility);
    canvas.removeEventListener("wheel", onWheel);
    canvas.removeEventListener("pointerdown", onPointerDown);
    canvas.removeEventListener("pointermove", onPointerMove);
    canvas.removeEventListener("pointerup", onPointerUp);
    canvas.removeEventListener("pointercancel", onPointerCancel);
    canvas.removeEventListener("pointermove", onHoverMove);
    canvas.removeEventListener("pointerleave", onHoverLeave);
    for (const media of mediaCache.values()) if (!isImg(media)) media.pause();
    rowMeshes.forEach((r) => {
      r.mesh.geometry.dispose();
      r.mat.dispose();
      r.tex.dispose();
    });
    lensQuad.geometry.dispose();
    lensMat.dispose();
    rt.dispose();
  }
  return { destroy, accelIn };
}
export function GlassRows({
  rows,
  fallback,
  className,
  switchSignal = 0,
  transition = "idle",
  onCardClick
}) {
  const mountRef = useRef(null);
  const [failed, setFailed] = useState(false);
  const [vp, setVp] = useState({ w: 1280, h: 800 });
  const engineRef = useRef(null);
  const transitionRef = useRef(transition);
  useEffect(() => {
    transitionRef.current = transition;
  });
  const cardClickRef = useRef(onCardClick);
  useEffect(() => {
    cardClickRef.current = onCardClick;
  });
  const sigRef = useRef(switchSignal);
  useEffect(() => {
    if (sigRef.current !== switchSignal) {
      sigRef.current = switchSignal;
      engineRef.current?.accelIn();
    }
  });
  useLayoutEffect(() => {
    const onResize = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const cardW = cardWidthFor(vp.w, vp.h, rows.length);
  const blockH = blockHeightFor(cardW, rows.length);
  useEffect(() => {
    if (failed) return;
    const mount = mountRef.current;
    if (!mount) return;
    const engine = createGlassEngine(mount, {
      rows,
      cardW,
      startPhase: transitionRef.current === "out" ? "out" : null,
      onCardClick: (card) => cardClickRef.current?.(card)
    });
    if (!engine) {
      setFailed(true);
      return;
    }
    engineRef.current = engine;
    return () => {
      engineRef.current = null;
      engine.destroy();
    };
  }, [rows, cardW, blockH, failed]);
  if (failed) return <>{fallback}</>;
  return <div className={className} style={{ height: blockH }}>{
    /* только горизонтальная маска по бокам блока: сверху/снизу
       искажение не обрезаем (BLEED + гашение у кромки линзы) */
  }<div
    ref={mountRef}
    aria-hidden="true"
    className="marquee-mask absolute inset-0"
  /></div>;
}
