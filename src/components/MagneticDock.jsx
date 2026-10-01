import * as React from "react";
import { cn } from "../lib/utils";
import WarmTooltip, { WarmTooltipGroup } from "./warm-tooltip";
const MOTIQ_TOKENS = `@layer motiq{
:root{
  --motiq-accent:#f5f5f5;
  --motiq-accent-text:#e5e5e5;
  --motiq-bg:#080c14;
  --motiq-border:#2e2e2e;
  --motiq-border-strong:#444444;
  --motiq-fg:#fafafa;
  --motiq-fg-secondary:#d4d4d4;
  --motiq-muted:#8f8f8f;
  --motiq-secondary-accent:#a3a3a3;
  --motiq-success:#a3a3a3;
  --motiq-surface:#151515;
  --motiq-surface-2:#1c1c1c;
  --motiq-warning:#d4d4d4;
}
.dark,[data-theme="dark"]{
  --motiq-accent:#f5f5f5;
  --motiq-accent-text:#e5e5e5;
  --motiq-bg:#080c14;
  --motiq-border:#2e2e2e;
  --motiq-border-strong:#444444;
  --motiq-fg:#fafafa;
  --motiq-fg-secondary:#d4d4d4;
  --motiq-muted:#8f8f8f;
  --motiq-secondary-accent:#a3a3a3;
  --motiq-success:#a3a3a3;
  --motiq-surface:#151515;
  --motiq-surface-2:#1c1c1c;
  --motiq-warning:#d4d4d4;
}}
.dock-panel{display:grid;grid-template-rows:0fr;transition:grid-template-rows .22s cubic-bezier(.3,.9,.3,1)}
.dock-panel[data-open="true"]{grid-template-rows:1fr}
.dock-panel>div{min-height:0;overflow:hidden}
.dock-panel__inner{transition:opacity .16s ease}
.dock-panel[data-open="false"] .dock-panel__inner{opacity:0}
@media (prefers-reduced-motion:reduce){.dock-panel{transition:none}.dock-panel__inner{transition:none}}`;
function useReducedMotion() {
  const [reduced, setReduced] = React.useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (e) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}
const emptySubscribe = () => () => {
};
function useHydrated() {
  return React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
function useVisibilityPause(ref, { threshold = 0.1 } = {}) {
  const [onScreen, setOnScreen] = React.useState(true);
  const [tabVisible, setTabVisible] = React.useState(true);
  React.useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => setOnScreen(entries.some((e) => e.isIntersecting)),
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, threshold]);
  React.useEffect(() => {
    const onVis = () => setTabVisible(document.visibilityState !== "hidden");
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);
  return onScreen && tabVisible;
}
function makeRng(seed) {
  let a = seed >>> 0;
  return () => {
    a = a + 1831565813 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const EASE_GROW = 30;
const EASE_LIFT = 30;
const EASE_DRIFT = 22;
const DRIFT = 0.13;
const VERTICAL_REACH = 220;
function MagneticDockBase({
  items,
  magnetRadius = 78,
  maxScale = 1.2,
  lift = 13,
  idleWave = true,
  panel,
  panelOpen = false,
  onSelect,
  seed = 1,
  pauseWhenHidden = true,
  reducedMotion,
  className,
  style,
  ...props
}) {
  const rootRef = React.useRef(null);
  const barRef = React.useRef(null);
  const rowRef = React.useRef(null);
  const panelRef = React.useRef(null);
  const iconsRef = React.useRef([]);
  const labelsRef = React.useRef([]);
  const basesRef = React.useRef([]);
  const pointerRef = React.useRef({
    x: -1e4,
    y: -1e4,
    inside: false
  });
  const focusRef = React.useRef(-1);
  const geomRef = React.useRef({ barW: -1, rootW: -1 });
  const rectRef = React.useRef(null);
  const [heldPanel, setHeldPanel] = React.useState(panel);
  if (panel && panel !== heldPanel) setHeldPanel(panel);
  React.useEffect(() => {
    if (panel) return undefined;
    const el = panelRef.current;
    if (!el) return undefined;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      setHeldPanel(null);
    };
    const onEnd = (e) => {
      if (e.propertyName === "grid-template-rows") finish();
    };
    const t = setTimeout(finish, 300);
    el.addEventListener("transitionend", onEnd);
    return () => {
      clearTimeout(t);
      el.removeEventListener("transitionend", onEnd);
    };
  }, [panel]);
  const systemReduced = useReducedMotion();
  const hydrated = useHydrated();
  const staticMode = reducedMotion === true || hydrated && systemReduced;
  const onScreen = useVisibilityPause(rootRef, { threshold: 0.06 });
  const paused = pauseWhenHidden && !onScreen;
  const animate = !staticMode && !paused;
  const count = items.length;
  const labels = items.map((i) => i.label).join("\0");
  const params = React.useRef({
    magnetRadius,
    maxScale,
    lift,
    idleWave
  });
  React.useEffect(() => {
    params.current = {
      magnetRadius,
      maxScale,
      lift,
      idleWave
    };
  });
  const filterIdBase = "dockwarp" + React.useId().replace(/:/g, "_");
  const iconWrapsRef = React.useRef([]);
  const warpAmpRef = React.useRef([]);
  const warpTargetRef = React.useRef([]);
  const warpDispRefs = React.useRef([]);
  const warpOffsetRefs = React.useRef([]);
  const warpRafRef = React.useRef(0);
  const warpLoopRef = React.useRef(null);
  const warpFrame = React.useCallback(
    (now) => {
      warpRafRef.current = requestAnimationFrame((tt) => warpLoopRef.current?.(tt));
      const t = now * 0.001;
      let active = false;
      for (let i = 0; i < count; i++) {
        const target = warpTargetRef.current[i] || 0;
        let amp = warpAmpRef.current[i] || 0;
        if (amp === 0 && target === 0) continue;
        amp += (target - amp) * (target > amp ? 0.24 : 0.13);
        if (amp < 0.002 && target === 0) amp = 0;
        warpAmpRef.current[i] = amp;
        if (amp > 0 || target > 0) active = true;
        const disp = warpDispRefs.current[i];
        const off = warpOffsetRefs.current[i];
        if (disp) disp.setAttribute("scale", (amp * 9).toFixed(2));
        if (off) {
          off.setAttribute("dx", (Math.sin(t * 2.3 + i * 1.7) * 7 * amp).toFixed(2));
          off.setAttribute("dy", (Math.cos(t * 1.9 + i * 1.1) * 7 * amp).toFixed(2));
        }
        const wrap = iconWrapsRef.current[i];
        if (wrap) {
          if (amp === 0 && target === 0) {
            wrap.style.filter = "";
          } else {
            const c = (1.7 * amp).toFixed(2);
            wrap.style.filter =
              `url(#${filterIdBase}-${i}) ` +
              `drop-shadow(${c}px 0 0 rgba(255,42,84,${(0.95 * amp).toFixed(3)})) ` +
              `drop-shadow(-${c}px 0 0 rgba(0,217,255,${(0.95 * amp).toFixed(3)}))`;
          }
        }
      }
      if (!active) {
        cancelAnimationFrame(warpRafRef.current);
        warpRafRef.current = 0;
      }
    },
    [count, filterIdBase]
  );
  React.useEffect(() => {
    warpLoopRef.current = warpFrame;
  });
  const setWarp = React.useCallback(
    (i, on) => {
      if (staticMode) return;
      warpTargetRef.current[i] = on ? 1 : 0;
      if (!warpRafRef.current) warpRafRef.current = requestAnimationFrame(warpFrame);
    },
    [staticMode, warpFrame]
  );
  React.useEffect(
    () => () => {
      if (warpRafRef.current) cancelAnimationFrame(warpRafRef.current);
    },
    []
  );
  React.useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const trackRoot = () => {
      const root = rootRef.current;
      if (root) rectRef.current = root.getBoundingClientRect();
    };
    const measure = () => {
      const root = rootRef.current;
      const barW = bar.offsetWidth;
      const rootW = root ? root.offsetWidth : -1;
      const g = geomRef.current;
      if (barW !== g.barW || rootW !== g.rootW) {
        g.barW = barW;
        g.rootW = rootW;
        const bx = bar.offsetLeft;
        const by = bar.offsetTop;
        basesRef.current = iconsRef.current.slice(0, count).map((el) => {
          if (!el) return { x: 0, y: 0 };
          const holder = el.parentElement?.classList.contains("warm-tooltip__trigger") && el.parentElement ? el.parentElement : el;
          return {
            x: bx + holder.offsetLeft + holder.offsetWidth / 2,
            y: by + holder.offsetTop + holder.offsetHeight / 2
          };
        });
      }
      trackRoot();
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(bar);
    if (rootRef.current) ro.observe(rootRef.current);
    return () => ro.disconnect();
  }, [count, labels]);
  React.useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (!animate) {
      iconsRef.current.forEach((el) => {
        if (el) el.style.transform = "";
      });
      labelsRef.current.forEach((el) => {
        if (el) el.style.transform = "";
      });
      return;
    }
    const states = Array.from(
      { length: count },
      () => ({ s: 1, y: 0, dx: 0 })
    );
    const rng = makeRng(seed);
    let idleT = rng() * 20;
    let lastSrc = "none";
    let lastX = 0;
    let raf = 0;
    let last = 0;
    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      let dt = (now - last) / 1e3;
      last = now;
      if (!(dt > 0) || dt > 0.05) dt = 0.016;
      idleT += dt;
      const cfg = params.current;
      const bases = basesRef.current;
      const p = pointerRef.current;
      const g = geomRef.current;
      const w = g.rootW > 0 ? g.rootW : 800;
      const grow = Math.max(0, cfg.maxScale - 1);
      const sigma = Math.max(8, cfg.magnetRadius);
      let px;
      let py;
      let amp;
      const fi = focusRef.current;
      const src = p.inside ? "ptr" : fi >= 0 && bases[fi] ? "focus" : cfg.idleWave ? "wave" : "none";
      if (src === "wave" && (lastSrc === "ptr" || lastSrc === "focus")) {
        const s = Math.max(-1, Math.min(1, (lastX - w / 2) / (w * 0.34)));
        const target = Math.asin(s) / 0.55;
        const period = 2 * Math.PI / 0.55;
        idleT = target + Math.round((idleT - target) / period) * period;
      }
      lastSrc = src;
      if (p.inside) {
        px = p.x;
        py = p.y;
        amp = 1;
      } else if (fi >= 0 && bases[fi]) {
        px = bases[fi].x;
        py = bases[fi].y;
        amp = 1;
      } else if (cfg.idleWave) {
        px = w / 2 + Math.sin(idleT * 0.55) * w * 0.34;
        py = bases[0]?.y ?? root.clientHeight - 70;
        amp = 0.42;
      } else {
        px = -1e4;
        py = -1e4;
        amp = 0;
      }
      if (src === "ptr" || src === "focus") lastX = px;
      for (let i = 0; i < count; i++) {
        const b = bases[i];
        const el = iconsRef.current[i];
        const st = states[i];
        if (!b || !el || !st) continue;
        const d = px - b.x;
        const vert = Math.max(
          0,
          1 - Math.abs(py - b.y) / VERTICAL_REACH
        );
        const inf = Math.exp(-(d * d) / (2 * sigma * sigma)) * amp * vert;
        st.s += (1 + grow * inf - st.s) * (1 - Math.exp(-EASE_GROW * dt));
        st.y += (cfg.lift * inf - st.y) * (1 - Math.exp(-EASE_LIFT * dt));
        st.dx += (d * DRIFT * inf - st.dx) * (1 - Math.exp(-EASE_DRIFT * dt));
        el.style.transform = `translate3d(${st.dx.toFixed(2)}px,${st.y.toFixed(2)}px,0) scale(${st.s.toFixed(3)})`;
        const lab = labelsRef.current[i];
        if (lab) {
          lab.style.transform = `translate3d(${st.dx.toFixed(2)}px,${st.y.toFixed(2)}px,0)`;
        }
      }
    };
    last = typeof performance !== "undefined" ? performance.now() : 0;
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [animate, count, seed]);
  const track = React.useCallback(
    (e) => {
      const root = rootRef.current;
      if (!root) return;
      const r = rectRef.current ?? root.getBoundingClientRect();
      pointerRef.current = {
        x: e.clientX - r.left,
        y: e.clientY - r.top,
        inside: true
      };
    },
    []
  );
  const release = React.useCallback(() => {
    pointerRef.current = { x: -1e4, y: -1e4, inside: false };
  }, []);
  return (
    <div
      ref={rootRef}
      data-motion={staticMode ? "static" : "animated"}
      data-paused={paused ? "true" : "false"}
      className={cn("relative w-full select-none", className)}
      style={{
        fontFamily: "var(--font-geist-sans, ui-sans-serif), ui-sans-serif, system-ui, sans-serif",
        touchAction: "pan-y",
        ...style
      }}
      onPointerMove={track}
      onPointerDown={track}
      onPointerLeave={release}
      onPointerCancel={release}
      {...props}
    >
      <svg
        aria-hidden="true"
        focusable="false"
        style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
      >
        <defs>
          {items.map((item, i) => (
            <filter
              key={item.id}
              id={`${filterIdBase}-${i}`}
              x="-50%"
              y="-50%"
              width="200%"
              height="200%"
              colorInterpolationFilters="sRGB"
            >
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.014 0.026"
                numOctaves="2"
                seed={3 + i}
                result="n"
              />
              <feOffset
                in="n"
                dx="0"
                dy="0"
                ref={(el) => {
                  warpOffsetRefs.current[i] = el;
                }}
                result="m"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="m"
                scale="0"
                xChannelSelector="R"
                yChannelSelector="G"
                ref={(el) => {
                  warpDispRefs.current[i] = el;
                }}
              />
            </filter>
          ))}
        </defs>
      </svg>
      <div className="flex w-full">
        <div className="flex w-full flex-col">
          <div
            ref={barRef}
            className={cn(
              "relative flex w-full flex-col items-stretch rounded-[22px] px-[23px] pt-[18px] pb-[28px]",
              "border border-[var(--motiq-border,#2e2e2e)] backdrop-blur-[14px]"
            )}
            style={{
              background: "color-mix(in oklab, var(--motiq-surface, #151515) 72%, transparent)",
              boxShadow: "0 18px 50px -18px color-mix(in oklab, var(--motiq-accent, #f5f5f5) 28%, transparent)"
            }}
          >
            <div
              ref={panelRef}
              data-open={panelOpen ? "true" : "false"}
              className="dock-panel w-full"
            >
              <div className="dock-panel__inner min-h-0 overflow-hidden">
                {heldPanel ? (
                  <>
                    <div className="border-b border-white/10 pb-3">{heldPanel}</div>
                    <div className="h-3" />
                  </>
                ) : null}
              </div>
            </div>
            <div ref={rowRef} className="flex w-full items-end justify-between">
              <WarmTooltipGroup delay={100} warmWindow={800} travel={280} lean={8}>
                {items.map((item, i) => (
                  <div key={item.id} className="flex flex-col items-center">
                    <WarmTooltip
                      content={item.label}
                      side="bottom"
                      surfaceColor="#fafafa"
                      inkColor="#080c14"
                      radius={12}
                      gap={36}
                      arrow={false}
                      popDuration={120}
                    >
                    <button
                      type="button"
                      ref={(el) => {
                        iconsRef.current[i] = el;
                      }}
                      data-dock-item={item.id}
                      aria-label={item.label}
                      onClick={() => onSelect?.(item.id)}
                      onPointerEnter={() => setWarp(i, true)}
                      onPointerLeave={() => setWarp(i, false)}
                      onFocus={() => {
                        focusRef.current = i;
                        setWarp(i, true);
                      }}
                      onBlur={() => {
                        if (focusRef.current === i) focusRef.current = -1;
                        setWarp(i, false);
                      }}
                      className={cn(
                        "relative grid h-[52px] w-[52px] shrink-0 origin-bottom place-items-center rounded-[12px]",
                        "cursor-pointer border-0 p-0 text-[15px] font-bold",
                        "[&_svg]:h-6 [&_svg]:w-6 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2",
                        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--motiq-accent,#f5f5f5)]",
                        staticMode &&
                          "transition-transform duration-150 ease-[cubic-bezier(0.2,0,0,1)] hover:translate-y-3 hover:scale-[1.06] focus-visible:translate-y-3 focus-visible:scale-[1.06]"
                      )}
                      style={{
                        color: "var(--motiq-bg, #080c14)",
                        background: "#f5f5f5",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.12), 0 8px 24px -8px rgba(0,0,0,0.45)",
                        willChange: "transform"
                      }}
                    >
                      <span
                        aria-hidden="true"
                        ref={(el) => {
                          iconWrapsRef.current[i] = el;
                        }}
                        className="grid place-items-center"
                        style={{ willChange: "filter" }}
                      >
                        {item.icon ?? item.label.slice(0, 1).toUpperCase()}
                      </span>
                    </button>
                    </WarmTooltip>
                    <span
                      ref={(el) => {
                        labelsRef.current[i] = el;
                      }}
                      className="mt-[10px] max-w-[54px] truncate text-center text-[9px] font-semibold leading-none tracking-wide text-white/55 md:hidden"
                    >
                      {item.label}
                    </span>
                  </div>
                ))}
              </WarmTooltipGroup>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export function MagneticDock(props) {
  return <><style dangerouslySetInnerHTML={{ __html: MOTIQ_TOKENS }} /><MagneticDockBase {...props} /></>;
}
export default MagneticDock;
