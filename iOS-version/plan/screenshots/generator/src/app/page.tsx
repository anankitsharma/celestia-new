"use client";

import { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";

// ─────────────────────────────────────────────────────────────────────────
// Celestia App Store screenshot generator
// One Next.js page → 7 marketing slides → exportable as 1320×2868 PNGs
// (with auto-scaling to 6.5"/6.3"/6.1" Apple sizes).
//
// All 7 hero captions are pre-audited against the v1 banned-word list per
// plan/03-screenshot-spec.md. Do not edit captions without re-running the
// banned-word audit.
// ─────────────────────────────────────────────────────────────────────────

// ─── Apple required iPhone sizes (portrait) ─────────────────────────────
const IPHONE_SIZES = [
  { label: '6.9" iPhone 16 Pro Max', w: 1320, h: 2868 },
  { label: '6.5" iPhone XS Max', w: 1284, h: 2778 },
  { label: '6.3" iPhone 16 Pro', w: 1206, h: 2622 },
  { label: '6.1" iPhone XR', w: 1125, h: 2436 },
] as const;

// Design at the LARGEST size and scale down for export
const DESIGN_W = 1320;
const DESIGN_H = 2868;

// ─── Theme tokens — Light Liquid Glass (matches in-app constants/theme.js)
const T = {
  bg: "#FAF8F2",
  fg: "#2A2418", // ink
  fgDim: "#6E5E64", // inkDim
  accent: "#5C2434", // clay
  gold: "#C8A84B",
  hairline: "rgba(92,36,52,0.35)",
  cream: "#FAF8F2",
} as const;

// Per-slide signal hue tints (subtle backdrop washes)
const SLIDE_TINTS = {
  hero: { from: "#FBF5EA", via: "#F7F0E2", to: "#F4ECDB" }, // splash cream
  connections: { from: "#FBF0EB", via: "#F8E8DD", to: "#F4DFD0" }, // warm rose-cream
  ask: { from: "#F4F0E5", via: "#EFE9D8", to: "#E9E1C8" }, // champagne
  compat: { from: "#FBEFE8", via: "#F5E2D8", to: "#EDD3C5" }, // mauve-clay
  today: { from: "#F2EEE5", via: "#EFEADE", to: "#EBE5D5" }, // slate-cream
  blueprint: { from: "#F4ECE5", via: "#F0E4DC", to: "#ECDCD3" }, // ivory
  privacy: { from: "#EBE5D5", via: "#E5DDC8", to: "#DED4BB" }, // dusk
} as const;

// ─── Phone mockup measurements (from skill's mockup.png) ────────────────
const MK_W = 1022;
const MK_H = 2082;
const SC_L = (52 / MK_W) * 100;
const SC_T = (46 / MK_H) * 100;
const SC_W = (918 / MK_W) * 100;
const SC_H = (1990 / MK_H) * 100;
const SC_RX = (126 / 918) * 100;
const SC_RY = (126 / 1990) * 100;

// ─── Image preload pipeline (data URIs for html-to-image reliability) ──
const IMAGE_PATHS = [
  "/mockup.png",
  "/app-icon.png",
  "/screenshots/en/01_hero.png",
  "/screenshots/en/02_connections.png",
  "/screenshots/en/03_ask-ai.png",
  "/screenshots/en/04_compat.png",
  "/screenshots/en/05_today.png",
  "/screenshots/en/06_blueprint.png",
];

const imageCache: Record<string, string> = {};

async function preloadAllImages() {
  await Promise.all(
    IMAGE_PATHS.map(async (path) => {
      const resp = await fetch(path);
      const blob = await resp.blob();
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      imageCache[path] = dataUrl;
    })
  );
}

function img(path: string): string {
  return imageCache[path] || path;
}

// ─── Phone component ────────────────────────────────────────────────────
function Phone({
  src,
  alt,
  style,
}: {
  src: string;
  alt: string;
  style?: React.CSSProperties;
}) {
  return (
    <div style={{ position: "relative", aspectRatio: `${MK_W}/${MK_H}`, ...style }}>
      <img
        src={img("/mockup.png")}
        alt=""
        style={{ display: "block", width: "100%", height: "100%" }}
        draggable={false}
      />
      <div
        style={{
          position: "absolute",
          zIndex: 10,
          overflow: "hidden",
          left: `${SC_L}%`,
          top: `${SC_T}%`,
          width: `${SC_W}%`,
          height: `${SC_H}%`,
          borderRadius: `${SC_RX}% / ${SC_RY}%`,
        }}
      >
        <img
          src={src}
          alt={alt}
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "top",
          }}
          draggable={false}
        />
      </div>
    </div>
  );
}

// ─── Caption component ──────────────────────────────────────────────────
function Caption({
  pre,
  hero,
  sub,
  align = "left",
  canvasW,
}: {
  pre?: string;
  hero: React.ReactNode;
  sub?: React.ReactNode;
  align?: "left" | "center";
  canvasW: number;
}) {
  const heroSize = canvasW * 0.095;
  const subSize = canvasW * 0.029;
  const preSize = canvasW * 0.022;
  return (
    <div
      style={{
        textAlign: align,
        width: "100%",
        paddingLeft: canvasW * 0.06,
        paddingRight: canvasW * 0.06,
      }}
    >
      {pre && (
        <div
          style={{
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            fontWeight: 600,
            color: T.accent,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            fontSize: preSize,
            marginBottom: canvasW * 0.018,
          }}
        >
          {pre}
        </div>
      )}
      <div
        style={{
          fontFamily: "var(--font-playfair), serif",
          fontWeight: 600,
          color: T.fg,
          fontSize: heroSize,
          lineHeight: 1.04,
          letterSpacing: "-0.01em",
          marginBottom: canvasW * 0.018,
        }}
      >
        {hero}
      </div>
      {sub && (
        <div
          style={{
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            fontWeight: 400,
            color: T.fgDim,
            fontSize: subSize,
            lineHeight: 1.35,
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────
function Hairline({ w = 80, color = T.hairline }: { w?: number; color?: string }) {
  return <div style={{ width: w, height: 2, backgroundColor: color, borderRadius: 1 }} />;
}

function GradientBg({
  from,
  via,
  to,
}: {
  from: string;
  via: string;
  to: string;
}) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `linear-gradient(180deg, ${from} 0%, ${via} 50%, ${to} 100%)`,
      }}
    />
  );
}

// ─── Slide 1 — Brand hook ───────────────────────────────────────────────
function Slide1Hero({ canvasW }: { canvasW: number }) {
  return (
    <>
      <GradientBg
        from={SLIDE_TINTS.hero.from}
        via={SLIDE_TINTS.hero.via}
        to={SLIDE_TINTS.hero.to}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          paddingTop: canvasW * 0.12,
        }}
      >
        <Caption
          hero={
            <>
              Understand the patterns
              <br />
              in your relationships.
            </>
          }
          sub={
            <>
              Why you love who you love.
              <br />
              Why you keep doing what you do.
            </>
          }
          canvasW={canvasW}
          align="left"
        />
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: 0,
            transform: "translateX(-50%) translateY(11%)",
            width: "85%",
          }}
        >
          <Phone src={img("/screenshots/en/01_hero.png")} alt="Onboarding hero" />
        </div>
      </div>
    </>
  );
}

// ─── Slide 2 — Multi-relationship breadth ───────────────────────────────
function Slide2Connections({ canvasW }: { canvasW: number }) {
  return (
    <>
      <GradientBg
        from={SLIDE_TINTS.connections.from}
        via={SLIDE_TINTS.connections.via}
        to={SLIDE_TINTS.connections.to}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          paddingTop: canvasW * 0.12,
        }}
      >
        <Caption
          pre="Every Connection"
          hero={
            <>
              Map every relationship
              <br />
              that matters.
            </>
          }
          sub={
            <>
              Partner, friend, family, colleague —
              <br />
              see how each one works.
            </>
          }
          canvasW={canvasW}
        />
        <div
          style={{
            position: "absolute",
            right: "-8%",
            bottom: 0,
            width: "82%",
            transform: "rotate(-1deg) translateY(10%)",
          }}
        >
          <Phone src={img("/screenshots/en/02_connections.png")} alt="Connections list" />
        </div>
      </div>
    </>
  );
}

// ─── Slide 3 — Ask AI advisor ───────────────────────────────────────────
function Slide3Ask({ canvasW }: { canvasW: number }) {
  return (
    <>
      <GradientBg
        from={SLIDE_TINTS.ask.from}
        via={SLIDE_TINTS.ask.via}
        to={SLIDE_TINTS.ask.to}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          paddingTop: canvasW * 0.12,
        }}
      >
        <Caption
          pre="Ask Anything"
          hero={
            <>
              A calm advisor for
              <br />
              the questions you have.
            </>
          }
          sub={<>Psychology-led. Personal. Always available.</>}
          canvasW={canvasW}
        />
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: 0,
            transform: "translateX(-50%) translateY(13%)",
            width: "84%",
          }}
        >
          <Phone src={img("/screenshots/en/03_ask-ai.png")} alt="Ask AI chat" />
        </div>
      </div>
    </>
  );
}

// ─── Slide 4 — Compatibility depth ──────────────────────────────────────
function Slide4Compat({ canvasW }: { canvasW: number }) {
  return (
    <>
      <GradientBg
        from={SLIDE_TINTS.compat.from}
        via={SLIDE_TINTS.compat.via}
        to={SLIDE_TINTS.compat.to}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          paddingTop: canvasW * 0.12,
        }}
      >
        <Caption
          pre="Real Depth"
          hero={
            <>
              Not generic
              <br />
              compatibility.
            </>
          }
          sub={<>Strengths, friction, and what to do — without the jargon.</>}
          canvasW={canvasW}
        />
        <div
          style={{
            position: "absolute",
            left: "-8%",
            bottom: 0,
            width: "84%",
            transform: "rotate(1deg) translateY(11%)",
          }}
        >
          <Phone src={img("/screenshots/en/04_compat.png")} alt="Compatibility detail" />
        </div>
      </div>
    </>
  );
}

// ─── Slide 5 — Today / Mindfulness alignment ────────────────────────────
function Slide5Today({ canvasW }: { canvasW: number }) {
  return (
    <>
      <GradientBg
        from={SLIDE_TINTS.today.from}
        via={SLIDE_TINTS.today.via}
        to={SLIDE_TINTS.today.to}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          paddingTop: canvasW * 0.12,
        }}
      >
        <Caption
          pre="Daily Reflection"
          hero={
            <>
              One question.
              <br />
              A thoughtful read back.
            </>
          }
          sub={
            <>
              Designed to glance at —
              <br />
              not obsess over.
            </>
          }
          canvasW={canvasW}
        />
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: 0,
            width: "86%",
            transform: "translateX(-50%) translateY(12%)",
          }}
        >
          <Phone src={img("/screenshots/en/05_today.png")} alt="Today tab" />
        </div>
      </div>
    </>
  );
}

// ─── Slide 6 — Personality blueprint ────────────────────────────────────
function Slide6Blueprint({ canvasW }: { canvasW: number }) {
  return (
    <>
      <GradientBg
        from={SLIDE_TINTS.blueprint.from}
        via={SLIDE_TINTS.blueprint.via}
        to={SLIDE_TINTS.blueprint.to}
      />
      {/* Subtle gold halo to cue "moment of reveal" */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "62%",
          width: canvasW * 0.7,
          height: canvasW * 0.7,
          transform: "translate(-50%, -50%)",
          background:
            "radial-gradient(circle, rgba(200,168,75,0.18) 0%, rgba(200,168,75,0) 60%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          paddingTop: canvasW * 0.12,
        }}
      >
        <Caption
          pre="Your Blueprint"
          hero={
            <>
              Your attachment style,
              <br />
              decoded.
            </>
          }
          sub={<>How you connect, where you get stuck, what you need.</>}
          canvasW={canvasW}
        />
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: 0,
            transform: "translateX(-50%) translateY(13%) rotate(-2deg)",
            width: "82%",
          }}
        >
          <Phone src={img("/screenshots/en/06_blueprint.png")} alt="Personality blueprint" />
        </div>
      </div>
    </>
  );
}

// ─── Slide 7 — Privacy (designed panel, no phone) ───────────────────────
function Slide7Privacy({ canvasW }: { canvasW: number }) {
  const heroSize = canvasW * 0.092;
  const subSize = canvasW * 0.032;
  const bulletSize = canvasW * 0.028;
  return (
    <>
      <GradientBg
        from={SLIDE_TINTS.privacy.from}
        via={SLIDE_TINTS.privacy.via}
        to={SLIDE_TINTS.privacy.to}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: canvasW * 0.18,
          paddingLeft: canvasW * 0.08,
          paddingRight: canvasW * 0.08,
        }}
      >
        {/* Lock icon — drawn in CSS */}
        <div
          style={{
            width: canvasW * 0.18,
            height: canvasW * 0.18,
            borderRadius: "50%",
            background: T.cream,
            border: `${canvasW * 0.005}px solid ${T.accent}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: canvasW * 0.04,
            boxShadow: `0 ${canvasW * 0.01}px ${canvasW * 0.03}px rgba(92,36,52,0.10)`,
          }}
        >
          <svg
            width={canvasW * 0.09}
            height={canvasW * 0.09}
            viewBox="0 0 24 24"
            fill="none"
            stroke={T.accent}
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        <Hairline w={canvasW * 0.04} />
        <div style={{ height: canvasW * 0.025 }} />

        <div
          style={{
            fontFamily: "var(--font-playfair), serif",
            fontWeight: 600,
            color: T.fg,
            fontSize: heroSize,
            lineHeight: 1.04,
            letterSpacing: "-0.01em",
            textAlign: "center",
            marginBottom: canvasW * 0.022,
          }}
        >
          Privacy by default.
        </div>
        <div
          style={{
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            fontWeight: 400,
            color: T.fgDim,
            fontSize: subSize,
            lineHeight: 1.35,
            textAlign: "center",
            marginBottom: canvasW * 0.06,
          }}
        >
          Your data lives on your device.
          <br />
          No tracking. No selling. Ever.
        </div>

        {/* Bullet card */}
        <div
          style={{
            background: "rgba(255,253,247,0.7)",
            border: `1px solid rgba(92,36,52,0.10)`,
            borderRadius: canvasW * 0.025,
            padding: canvasW * 0.045,
            width: "92%",
            boxShadow: `0 ${canvasW * 0.01}px ${canvasW * 0.04}px rgba(92,36,52,0.06)`,
          }}
        >
          {[
            "No sign-in required",
            "No data sold",
            "AI requests sent without your name",
            "Reset all data anytime",
          ].map((item) => (
            <div
              key={item}
              style={{
                display: "flex",
                alignItems: "center",
                gap: canvasW * 0.022,
                paddingTop: canvasW * 0.014,
                paddingBottom: canvasW * 0.014,
              }}
            >
              <div
                style={{
                  width: canvasW * 0.034,
                  height: canvasW * 0.034,
                  borderRadius: "50%",
                  background: T.accent,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg
                  width={canvasW * 0.018}
                  height={canvasW * 0.018}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={T.cream}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div
                style={{
                  fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                  fontWeight: 500,
                  color: T.fg,
                  fontSize: bulletSize,
                  lineHeight: 1.3,
                }}
              >
                {item}
              </div>
            </div>
          ))}
        </div>

        {/* Footer signature */}
        <div
          style={{
            position: "absolute",
            bottom: canvasW * 0.06,
            display: "flex",
            alignItems: "center",
            gap: canvasW * 0.014,
          }}
        >
          <img
            src={img("/app-icon.png")}
            alt="Celestia"
            style={{
              width: canvasW * 0.04,
              height: canvasW * 0.04,
              borderRadius: canvasW * 0.008,
            }}
          />
          <div
            style={{
              fontFamily: "var(--font-playfair), serif",
              fontWeight: 600,
              color: T.fg,
              fontSize: canvasW * 0.024,
              letterSpacing: "0.04em",
            }}
          >
            Celestia
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Slide registry ─────────────────────────────────────────────────────
type SlideDef = {
  id: string;
  filename: string;
  Component: React.FC<{ canvasW: number }>;
};

const SLIDES: SlideDef[] = [
  { id: "01_hero", filename: "01_hero", Component: Slide1Hero },
  { id: "02_connections", filename: "02_connections", Component: Slide2Connections },
  { id: "03_ask-ai", filename: "03_ask-ai", Component: Slide3Ask },
  { id: "04_compat", filename: "04_compat", Component: Slide4Compat },
  { id: "05_today", filename: "05_today", Component: Slide5Today },
  { id: "06_blueprint", filename: "06_blueprint", Component: Slide6Blueprint },
  { id: "07_privacy", filename: "07_privacy", Component: Slide7Privacy },
];

// ─── Slide canvas (full-resolution, used by both preview and export) ────
function SlideCanvas({ slide }: { slide: SlideDef }) {
  return (
    <div
      style={{
        width: DESIGN_W,
        height: DESIGN_H,
        position: "relative",
        overflow: "hidden",
        background: T.bg,
      }}
    >
      <slide.Component canvasW={DESIGN_W} />
    </div>
  );
}

// ─── Scaled preview card with hidden full-res export node ───────────────
function PreviewCard({
  slide,
  exportSize,
  onExport,
  registerExportNode,
}: {
  slide: SlideDef;
  exportSize: { w: number; h: number };
  onExport: (slide: SlideDef) => void;
  registerExportNode: (id: string, el: HTMLDivElement | null) => void;
}) {
  const previewRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.18);

  useEffect(() => {
    if (!previewRef.current) return;
    const obs = new ResizeObserver(() => {
      const cw = previewRef.current?.clientWidth ?? 0;
      if (cw > 0) setScale(cw / DESIGN_W);
    });
    obs.observe(previewRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <div className="bg-white rounded-2xl border border-stone-200 p-3 shadow-sm">
        <div
          ref={previewRef}
          className="relative w-full overflow-hidden rounded-xl bg-stone-100"
          style={{ aspectRatio: `${DESIGN_W}/${DESIGN_H}` }}
        >
          <div
            style={{
              width: DESIGN_W,
              height: DESIGN_H,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          >
            <SlideCanvas slide={slide} />
          </div>
        </div>
        <div className="flex items-center justify-between px-1 mt-2">
          <div className="text-xs font-mono text-stone-500">{slide.id}</div>
          <div className="text-xs text-stone-400">
            {exportSize.w}×{exportSize.h}
          </div>
        </div>
      </div>
      <button
        onClick={() => onExport(slide)}
        className="w-full px-3 py-1.5 text-xs rounded-md border border-stone-300 hover:bg-stone-50"
      >
        Export this frame
      </button>

      {/* Full-res export-ready clone, kept fully VISIBLE (no opacity, no transform,
          no negative coords) so html-to-image can clone it cleanly. We hide it with
          an outer 0-height overflow:hidden wrapper — the inner box still lays out
          at its full DESIGN_W × DESIGN_H, the wrapper just clips the pixels.
          This pattern survives Tailwind v4 + Next 16 + html-to-image 1.11.13. */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: 0,
          height: 0,
          overflow: "hidden",
          pointerEvents: "none",
        }}
      >
        <div
          ref={(el) => registerExportNode(slide.id, el)}
          style={{ width: DESIGN_W, height: DESIGN_H }}
        >
          <SlideCanvas slide={slide} />
        </div>
      </div>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────
export default function Page() {
  const [ready, setReady] = useState(false);
  const [sizeIdx, setSizeIdx] = useState(0); // 6.9" by default (largest)
  const [exporting, setExporting] = useState(false);
  const exportRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    preloadAllImages().then(() => setReady(true));
  }, []);

  const exportSize = IPHONE_SIZES[sizeIdx];

  function registerExportNode(id: string, el: HTMLDivElement | null) {
    exportRefs.current[id] = el;
  }

  async function exportOne(slide: SlideDef) {
    const node = exportRefs.current[slide.id];
    if (!node) {
      console.error("[export] no node registered for slide", slide.id);
      return;
    }

    try {
      // Wait for web fonts (Playfair Display + DM Sans via next/font/google).
      // Without this, html-to-image can snapshot before the font swap finishes.
      if (typeof document !== "undefined" && document.fonts?.ready) {
        await document.fonts.ready;
      }
      // Two animation frames so React commit + browser paint both flush before
      // we walk the DOM. One frame is sometimes not enough on a fresh load.
      await new Promise<void>((r) => requestAnimationFrame(() => r()));
      await new Promise<void>((r) => requestAnimationFrame(() => r()));

      // Sanity check: log node dimensions before capture. If width/height are 0
      // here, the layout collapsed and the export would be blank — surface it.
      const rect = node.getBoundingClientRect();
      console.log(
        `[export ${slide.id}] node ${rect.width}×${rect.height} at (${rect.left}, ${rect.top})`
      );
      if (rect.width === 0 || rect.height === 0) {
        throw new Error(
          `Export node has zero dimensions (${rect.width}×${rect.height}) — layout did not render. Check that the slide content has explicit width/height.`
        );
      }

      // html-to-image renders the node into an SVG sized to (width × pixelRatio,
      // height × pixelRatio). We want the output at exactly exportSize.w × .h,
      // so pixelRatio MUST be 1. Earlier code passed `exportSize.w / DESIGN_W`
      // here — which compounded with `width` and produced undersized PNGs at
      // every size except 6.9" (where the ratio happened to equal 1).
      const dataUrl = await toPng(node, {
        width: exportSize.w,
        height: exportSize.h,
        pixelRatio: 1,
        cacheBust: true,
        backgroundColor: T.bg,
      });

      if (!dataUrl || dataUrl === "data:,") {
        throw new Error("toPng returned empty data URL");
      }

      const a = document.createElement("a");
      a.download = `${slide.filename}_${exportSize.w}x${exportSize.h}.png`;
      a.href = dataUrl;
      a.click();
      console.log(`[export ${slide.id}] ✓ ${a.download}`);
    } catch (err) {
      console.error(`[export ${slide.id}] FAILED`, err);
      alert(`Export failed for ${slide.id}. Check browser console for details.`);
    }
  }

  async function exportAll() {
    setExporting(true);
    try {
      for (const slide of SLIDES) {
        await exportOne(slide);
        await new Promise((r) => setTimeout(r, 250));
      }
    } finally {
      setExporting(false);
    }
  }

  if (!ready) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <p className="text-stone-500">Loading images…</p>
      </main>
    );
  }

  return (
    <main className="flex-1 px-6 py-6">
      <header className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1
            style={{ fontFamily: "var(--font-playfair), serif" }}
            className="text-2xl font-semibold"
          >
            Celestia — Screenshot Generator
          </h1>
          <p className="text-sm text-stone-500">
            7 frames · iPhone portrait · captions audited per
            <code className="ml-1 px-1.5 py-0.5 bg-stone-100 rounded">
              03-screenshot-spec.md
            </code>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-stone-600">
            Export size:
            <select
              value={sizeIdx}
              onChange={(e) => setSizeIdx(parseInt(e.target.value, 10))}
              className="ml-2 border border-stone-300 rounded px-2 py-1 text-sm bg-white"
            >
              {IPHONE_SIZES.map((s, i) => (
                <option key={s.label} value={i}>
                  {s.label} ({s.w}×{s.h})
                </option>
              ))}
            </select>
          </label>
          <button
            disabled={exporting}
            onClick={exportAll}
            className="px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50"
            style={{ background: T.accent, color: T.cream }}
          >
            {exporting ? "Exporting…" : `Export all (${SLIDES.length})`}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {SLIDES.map((slide) => (
          <PreviewCard
            key={slide.id}
            slide={slide}
            exportSize={exportSize}
            onExport={exportOne}
            registerExportNode={registerExportNode}
          />
        ))}
      </div>
    </main>
  );
}
