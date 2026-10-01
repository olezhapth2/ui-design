import { useEffect, useMemo, useRef, useState } from 'react';
import { Boxes, Sparkles, CheckCheck, Bot } from 'lucide-react';
import WarpText from './WarpText.jsx';
import MagneticDock from './components/MagneticDock.jsx';
import {
  GlassRows,
  SWITCH_IN_MS,
  SWITCH_OUT_MS,
} from './components/gallery/glass-rows.jsx';
import { CLIPS } from './data/clips.js';
import { CAPTIONS } from './data/captions.js';

const BASE_WIDTH = 400;
const FONT_RATIO = 0.16;
const IMG_RE = /\.(png|jpe?g|webp|gif)(\?|#|$)/i;

const SERVICES = [
  {
    id: 'fidelity',
    title: 'UX',
    desc: {
      ru: 'Типографика, иерархия, плотность, адаптивы и доступность по WCAG. Основная глубина в JAVHD и Corgday, где каждый экран измеряется конверсией или временем обработки.',
      en: 'Typography, hierarchy, density, responsive layouts and WCAG accessibility. Most depth is in JAVHD and Corgday, where every screen is measured by conversion or processing time.',
    },
    icon: <span>UX</span>,
  },
  {
    id: 'systems',
    title: 'System',
    desc: {
      ru: 'Токены, компоненты в Figma, документация состояний и governance, чтобы системой пользовались, а не хранили в доке. 1 кодовая база, 20+ скинов, −60% времени на передачу макетов.',
      en: 'Tokens, Figma components, state docs and governance, so teams use the system instead of archiving it. 1 codebase, 20+ skins, −60% handoff time.',
    },
    icon: <Boxes />,
  },
  {
    id: 'motion',
    title: 'Motion',
    desc: {
      ru: 'Интерактивные прототипы для проверки до вёрстки: микровзаимодействия и Smart Animate. Идею показываю в действии, 300+ итераций на геймификации.',
      en: 'Interactive prototypes to validate before development, with micro-interactions and Smart Animate. Ideas shown in action: 300+ gamification iterations.',
    },
    icon: <Sparkles />,
  },
  {
    id: 'qa',
    title: 'Metrics',
    desc: {
      ru: 'Спеки для разработки, парная работа с фронтом и попиксельный ревью стейджинга. Вёрстку делаю сам: Figma → Cursor / Claude Code → GitHub Pages.',
      en: 'Dev-ready specs, pairing with frontend and pixel-level staging review. I also code layouts myself: Figma → Cursor / Claude Code → GitHub Pages.',
    },
    icon: <CheckCheck />,
  },
  {
    id: 'ai',
    title: 'AI Flow',
    desc: {
      ru: 'Генеративные воркфлоу в ежедневной работе и дизайн AI-взаимодействий: чаты, адаптивные паттерны, human-in-the-loop. 3 года ежедневно, конвейер на n8n и 10 000+ креативов с ревью.',
      en: 'Generative workflows in daily work and AI interaction design: chats, adaptive patterns, human-in-the-loop. 3 years daily, an n8n pipeline and 10,000+ creatives with review.',
    },
    icon: <Bot />,
  },
];

const DOCK_ITEMS = SERVICES.map((service) => ({
  id: service.id,
  label: service.title,
  icon: service.icon,
}));

const GALLERIES = [
  ...SERVICES.map((service) => ({
    id: service.id,
    label: service.title,
    cards: CLIPS[service.id],
  })),
  { id: 'ui', label: 'UI', cards: CLIPS.ui },
];

/* Названия проектов в подписях: первое вхождение → заголовок панели */
const PROJECT_NAMES = [
  'JAVHD', 'Corgday', 'GARAGE', 'korona•tech', 'MiraiTech',
  'PNB Agency', 'PNB', 'White Label', 'ShugarAi', 'GATE19', 'Gate19',
  'AdRider', 'DAOmars', 'TeamLead Siberia', 'WOW IMAGE',
];
/* Ссылка проектов: показываем только адрес, без https:// */
const PROJECT_URLS = {
  javhd: { url: 'https://olezhapth2.github.io/PRODUCT-DESIGNER/', label: 'olezhapth2.github.io/PRODUCT-DESIGNER' },
  gate19: { url: 'https://olezhapth2.github.io/PRODUCT-DESIGNER/', label: 'olezhapth2.github.io/PRODUCT-DESIGNER' },
  pnb: { url: 'https://pnb.agency', label: 'pnb.agency' },
  'pnb agency': { url: 'https://pnb.agency', label: 'pnb.agency' },
  miraitech: { url: 'https://miraitech.co', label: 'miraitech.co' },
};
/* Карточки без проекта → список проектов на od */
const OD_PROJECTS = {
  url: 'https://olezhapth2.github.io/od/#projects',
  label: 'olezhapth2.github.io/od',
};

function detectProject(caption) {
  let best = null;
  let bestIdx = Infinity;
  for (const name of PROJECT_NAMES) {
    const i = caption.indexOf(name);
    if (i >= 0 && i < bestIdx) {
      bestIdx = i;
      best = name;
    }
  }
  return best;
}

/* Плашка профиля по клику на заголовок: имя, почта и две кнопки */
function ProfilePanel({ lang }) {
  const btn =
    'rounded-[10px] px-3 py-1.5 text-[12.5px] font-bold transition-transform duration-150 ease-[cubic-bezier(0.2,0,0,1)] hover:scale-[1.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--motiq-accent,#f5f5f5)]';
  const t = {
    ru: {
      name: 'Девятов Олег Анатольевич',
      cv: 'Скачать CV',
      cvFile: import.meta.env.BASE_URL + 'Oleg-Devyatov-CV-RU.pdf',
      download: 'Oleg-Devyatov-CV-RU.pdf',
      write: 'Написать',
    },
    en: {
      name: 'Oleg Devyatov',
      cv: 'Download CV',
      cvFile: import.meta.env.BASE_URL + 'Oleg-Devyatov-CV-EN.pdf',
      download: 'Oleg-Devyatov-CV-EN.pdf',
      write: 'Email me',
    },
  }[lang];
  return (
    <div>
      <p className="text-[14px] font-bold leading-snug text-white">
        {t.name}
      </p>
      <p className="mt-1 text-[12.5px] font-bold leading-snug text-zinc-300">
        olegdevyatow@gmail.com
      </p>
      <div className="mt-2.5 flex items-center gap-2">
        <a
          href={t.cvFile}
          download={t.download}
          className={`${btn} bg-[#f5f5f5] text-[#080c14]`}
        >
          {t.cv}
        </a>
        <a
          href="mailto:olegdevyatow@gmail.com"
          className={`${btn} border border-white/25 text-white hover:bg-white/10`}
        >
          {t.write}
        </a>
      </div>
    </div>
  );
}

/* Карточка DOM-fallback (без WebGL): та же геометрия, что и в канвасе */
function GlowCard({ card }) {
  const h = 240;
  const isImg = IMG_RE.test(card.src);
  return (
    <div
      className="shrink-0 overflow-hidden rounded-2xl border border-white/15"
      style={{
        height: h,
        width: Math.round((h * card.iw) / card.ih),
        background: '#120f17',
      }}
    >
      {isImg ? (
        <img
          src={card.src}
          alt=""
          className="h-full w-full object-cover"
        />
      ) : (
        <video
          src={card.src}
          muted
          loop
          autoPlay
          playsInline
          className="h-full w-full object-cover"
        />
      )}
    </div>
  );
}

/* Дрейфующий ряд: трек из двух одинаковых половин, едет слева направо */
function DriftRow({ cards, duration }) {
  const half = [...cards, ...cards];
  return (
    <div className="marquee-mask overflow-hidden py-3">
      <div
        className="marquee-track flex w-max gap-6 pr-6"
        style={{ animationDuration: duration }}
      >
        {[0, 1].map((copy) => (
          <div key={copy} className="flex gap-6" aria-hidden={copy === 1}>
            {half.map((card, i) => (
              <GlowCard key={`${copy}-${i}-${card.h}`} card={card} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function WarpPage() {
  const frameRef = useRef(null);
  const [width, setWidth] = useState(BASE_WIDTH);
  const [panelState, setPanelState] = useState(null);
  const [bgOn, setBgOn] = useState(true);
  const [activeId, setActiveId] = useState(GALLERIES[0].id);
  const [transition, setTransition] = useState('out');
  const [switchSignal, setSwitchSignal] = useState(0);
  const [dip, setDip] = useState(false);
  const [cardView, setCardView] = useState(null);
  const [lang, setLang] = useState('en');
  const openedAtRef = useRef(0);
  const swipeRef = useRef(null);
  const swipedAtRef = useRef(0);
  const busyRef = useRef(false);

  useEffect(() => {
    document.title =
      lang === 'ru'
        ? 'Олег Девятов: Senior Product Designer'
        : 'Oleg Devyatov: Senior Product Designer';
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    const t = window.setTimeout(
      () => setTransition('idle'),
      SWITCH_OUT_MS + 80
    );
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return undefined;
    const observer = new ResizeObserver(([entry]) => {
      const next = Math.round(entry.contentRect.width);
      if (next > 0) setWidth((prev) => (prev === next ? prev : next));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!cardView) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setCardView(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cardView]);

  const handleSelect = (id) => {
    setCardView(null);
    const closing = panelState?.id === id && panelState.open;
    setPanelState({ id, open: !closing });
    if (closing || busyRef.current || !bgOn) return;
    const target = GALLERIES.find((g) => g.id === id);
    if (!target || target.id === activeId) return;
    busyRef.current = true;
    setDip(true);
    setTransition('in');
    setSwitchSignal((s) => s + 1);
    window.setTimeout(() => {
      setActiveId(target.id);
      setTransition('out');
      window.setTimeout(() => setDip(false), 140);
      window.setTimeout(() => {
        setTransition('idle');
        busyRef.current = false;
      }, SWITCH_OUT_MS + 80);
    }, SWITCH_IN_MS + 30);
  };

  const profileOpen = Boolean(panelState?.open) && panelState?.id === 'ui';
  const shownService =
    panelState?.open && !profileOpen
      ? SERVICES.find((service) => service.id === panelState.id) ?? null
      : null;

  const stepCard = (dir) => {
    const cards = GALLERIES.find((g) => g.id === activeId)?.cards ?? [];
    const i = cards.findIndex((c) => c.h === cardView?.h);
    if (i < 0 || !cards.length) return;
    const next = cards[(i + dir + cards.length) % cards.length];
    setCardView(next);
    setPanelState({ id: activeId, open: true, card: next });
  };

  const handleCard = (card) => {
    openedAtRef.current = performance.now();
    setCardView(card);
    setPanelState({ id: activeId, open: true, card });
  };

  const shownCardInfo = panelState?.open && panelState.card
    ? (() => {
        const dir =
          SERVICES.find((service) => service.id === panelState.id) ?? {
            title: 'UI',
            desc: {
              ru: 'Интерфейсные экраны, макеты и редизайн-проекты.',
              en: 'Interface screens, layouts and redesign projects.',
            },
          };
        const cardCaptions = CAPTIONS[panelState.id]?.[panelState.card.h];
        const caption = cardCaptions?.[lang] ?? cardCaptions?.ru;
        const proj = caption ? detectProject(caption) : null;
        const link = proj ? PROJECT_URLS[proj.toLowerCase()] ?? null : OD_PROJECTS;
        return {
          title: proj ?? dir.title,
          link,
          desc: caption ?? dir.desc[lang],
        };
      })()
    : null;

  const active = GALLERIES.find((g) => g.id === activeId) ?? GALLERIES[0];
  const reversed = useMemo(() => [...active.cards].reverse(), [active]);
  const rotated = useMemo(
    () => [...active.cards.slice(2), ...active.cards.slice(0, 2)],
    [active]
  );
  const rows = useMemo(
    () => [
      { cards: active.cards, duration: 75 },
      { cards: reversed, duration: 105 },
      { cards: rotated, duration: 90 },
    ],
    [active, reversed, rotated]
  );

  const fontSize = Math.round(width * FONT_RATIO);

  return (
    <main className="relative flex min-h-screen w-full flex-col items-center justify-end overflow-x-clip bg-[#06030f] px-4 pb-9 pt-3">
      {bgOn && (
        <div className="fixed inset-0 z-0 flex items-center justify-center overflow-hidden">
          <div className="w-screen">
            <GlassRows
              rows={rows}
              className="relative w-full"
              switchSignal={switchSignal}
              transition={transition}
              onCardClick={handleCard}
              fallback={
                <div className="space-y-5">
                  <DriftRow cards={active.cards} duration="75s" />
                  <DriftRow cards={reversed} duration="105s" />
                  <DriftRow cards={rotated} duration="90s" />
                </div>
              }
            />
          </div>
        </div>
      )}
      {/* фон: градиент снизу вверх на всех размерах — низ уходит
          в темноту под блоком, верх и середина ленты видны */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[60]"
        style={{
          background:
            'linear-gradient(to top, #06030f 0%, rgba(6,3,15,0.92) 14%, rgba(6,3,15,0.45) 30%, rgba(6,3,15,0) 46%)',
        }}
      />
      {/* dip свапа: ниже контента (80) — заголовок и док остаются яркими */}
      {bgOn && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[70] bg-black"
          style={{
            opacity: dip ? 0.55 : 0,
            transition: `opacity ${dip ? 160 : 260}ms ${
              dip ? 'ease-out' : 'ease-in-out'
            }`,
          }}
        />
      )}
      {/* фулскрин карточки: под блоком (80), над строками и дипом */}
      {cardView && (() => {
        const hdSrc = cardView.hd || cardView.src;
        const fallback = (e) => {
          const el = e.currentTarget;
          if (el.dataset.fb) return;
          el.dataset.fb = '1';
          el.src = cardView.src;
        };
        return (
          <div
            className="fixed inset-0 z-[75] flex cursor-pointer items-center justify-center bg-black p-4 md:p-10"
            onClick={() => {
              if (performance.now() - openedAtRef.current < 400) return;
              if (performance.now() - swipedAtRef.current < 500) return;
              setCardView(null);
            }}
            onTouchStart={(e) => {
              const t = e.touches[0];
              swipeRef.current = { x: t.clientX, y: t.clientY, dx: 0, dy: 0 };
            }}
            onTouchMove={(e) => {
              const s0 = swipeRef.current;
              if (!s0) return;
              const t = e.touches[0];
              s0.dx = t.clientX - s0.x;
              s0.dy = t.clientY - s0.y;
            }}
            onTouchEnd={() => {
              const s0 = swipeRef.current;
              swipeRef.current = null;
              if (!s0) return;
              if (Math.abs(s0.dx) > 50 && Math.abs(s0.dx) > Math.abs(s0.dy) * 1.2) {
                swipedAtRef.current = performance.now();
                stepCard(s0.dx < 0 ? 1 : -1);
              }
            }}
            role="presentation"
          >
            {IMG_RE.test(cardView.src) ? (
              <img
                key={hdSrc}
                src={hdSrc}
                alt=""
                onError={fallback}
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <video
                key={hdSrc}
                src={hdSrc}
                autoPlay
                loop
                muted
                playsInline
                onError={fallback}
                className="max-h-full max-w-full object-contain"
              />
            )}
          </div>
        );
      })()}
      <div
        ref={frameRef}
        className="relative z-[80] flex w-full max-w-[400px] flex-col gap-5"
      >
        {/* мягкая чёрная тень вверх от дока, только во фулскрине */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute bottom-0 left-1/2 h-[300px] w-screen -translate-x-1/2 transition-opacity duration-300 ease-out ${
            cardView ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            background:
              'linear-gradient(to top, rgba(0,0,0,0.65), rgba(0,0,0,0.4) 55%, rgba(0,0,0,0) 100%)',
          }}
        />
        <button
          type="button"
          onClick={() => handleSelect('ui')}
          aria-hidden={cardView ? true : undefined}
          tabIndex={cardView ? -1 : undefined}
          className={`block w-full cursor-pointer border-0 bg-transparent p-0 text-left [font:inherit] transition-opacity duration-300 ease-out ${
            cardView ? 'pointer-events-none' : ''
          }`}
          style={{ opacity: cardView ? 0 : 1 }}
        >
          <WarpText
            text="UI DESIGNER"
            color="#f8f5ff"
            warpStrength={0.35}
            warpScale={1.7}
            speed={1.15}
            pointerInfluence={0.6}
            pointerStrength={0.25}
            refraction={0.04}
            ripple
            fontSize={fontSize}
            fontWeight={800}
            lineHeight={0.87}
            style={{ height: fontSize, minHeight: 0 }}
          />
        </button>
        <MagneticDock
          items={DOCK_ITEMS}
          onSelect={handleSelect}
          panelOpen={Boolean(panelState?.open)}
          panel={
            shownCardInfo ? (
              <div key={lang}>
                {shownCardInfo.link ? (
                  <a
                    href={shownCardInfo.link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block break-all text-[14px] font-bold leading-snug text-white underline decoration-white/40 underline-offset-2 transition-colors hover:decoration-white"
                  >
                    {shownCardInfo.link.label}
                  </a>
                ) : (
                  <p className="text-[14px] font-bold leading-snug text-white">
                    {shownCardInfo.title}
                  </p>
                )}
                <p className="mt-1 text-[12.5px] font-bold leading-snug text-zinc-300">
                  {shownCardInfo.desc}
                </p>
              </div>
            ) : profileOpen ? (
              <ProfilePanel lang={lang} />
            ) : shownService ? (
              <div>
                <p className="text-[14px] font-bold leading-snug text-white">
                  {shownService.title}
                </p>
                <p className="mt-1 text-[12.5px] font-bold leading-snug text-zinc-300">
                  {shownService.desc[lang]}
                </p>
              </div>
            ) : null
          }
        />
      </div>
      <div className="fixed right-4 top-4 z-[90] flex items-center gap-2 md:right-6 md:top-6">
        <div className="flex items-center gap-0.5 rounded-full border border-white/15 bg-black/40 p-1 text-[11px] font-bold uppercase tracking-[0.14em] backdrop-blur-md">
          {['ru', 'en'].map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              aria-pressed={lang === l}
              className={`rounded-full px-2.5 py-1 transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70 ${
                lang === l
                  ? 'bg-white/90 text-[#080c14]'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setBgOn((v) => !v)}
          aria-pressed={bgOn}
          className="flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-white/80 backdrop-blur-md transition-colors duration-150 hover:border-white/30 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70"
        >
          <span
            className={`h-2 w-2 rounded-full ${
              bgOn ? 'bg-emerald-400' : 'bg-white/30'
            }`}
          />
          bg {bgOn ? 'on' : 'off'}
        </button>
      </div>
    </main>
  );
}
