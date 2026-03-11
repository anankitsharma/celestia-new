import { useState, useEffect, useRef, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════════════
   CELESTIA — Definitive Interactive iOS Mockup
   All screens · All states · All micro-interactions
   iPhone 16 spec: 393×852pt · Dynamic Island · 2026 iOS standards
═══════════════════════════════════════════════════════════════════════ */

const T = {
  navy:    "#0E0E22",
  navyMid: "#16163A",
  navyLt:  "#1E1E4A",
  gold:    "#C8A84B",
  goldLt:  "#E2C46A",
  goldDim: "rgba(200,168,75,0.12)",
  cream:   "#FAF8F2",
  warm:    "#F3EDE2",
  stone:   "#97907F",
  ink:     "#2A2418",
  border:  "#EAE3D6",
  white:   "#FFFFFF",
};

/* ─── GLOBAL CSS ──────────────────────────────────────────────────────── */
const G = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500&family=DM+Sans:wght@300;400;500;600&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; }

/* ── PAGE SHELL ─────────────────────────────────────────────────────── */
.root {
  min-height: 100vh;
  background: #E8E3DA;
  background-image:
    radial-gradient(ellipse 800px 500px at 15% 0%, rgba(200,168,75,0.08) 0%, transparent 55%),
    radial-gradient(ellipse 600px 800px at 85% 100%, rgba(14,14,34,0.06) 0%, transparent 55%);
  font-family: 'DM Sans', sans-serif;
  padding: 52px 20px 100px;
  display: flex; flex-direction: column; align-items: center;
}

/* ── SECTION DIVIDERS ───────────────────────────────────────────────── */
.section-block {
  width: 100%; max-width: 1700px;
  margin-bottom: 88px;
}
.section-header {
  display: flex; align-items: center; gap: 14px;
  margin-bottom: 40px;
}
.section-num {
  font-size: 11px; font-weight: 600;
  color: ${T.gold}; letter-spacing: 1px;
  background: rgba(200,168,75,0.1);
  border: 1px solid rgba(200,168,75,0.2);
  border-radius: 100px; padding: 4px 12px;
}
.section-name {
  font-size: 11px; font-weight: 600;
  letter-spacing: 2.5px; text-transform: uppercase;
  color: ${T.stone};
}
.section-line { flex: 1; height: 1px; background: linear-gradient(90deg, #CFC9BE, transparent); }
.section-interactive-note {
  font-size: 11px; color: rgba(200,168,75,0.7);
  letter-spacing: 0.5px;
  background: rgba(200,168,75,0.08);
  border: 1px solid rgba(200,168,75,0.15);
  border-radius: 100px; padding: 3px 12px;
}

.screens-row {
  display: flex; gap: 32px; flex-wrap: wrap; justify-content: center;
}
.screen-unit {
  display: flex; flex-direction: column; align-items: center; gap: 16px;
}
.screen-label {
  font-size: 10px; font-weight: 600; letter-spacing: 1.8px;
  text-transform: uppercase; color: ${T.stone};
  background: rgba(255,255,255,0.55);
  border: 1px solid rgba(0,0,0,0.07);
  border-radius: 100px; padding: 5px 16px;
}

/* ── PHONE FRAME ────────────────────────────────────────────────────── */
.phone {
  width: 393px; height: 852px;
  border-radius: 54px;
  position: relative; overflow: hidden;
  background: ${T.cream};
  box-shadow:
    0 0 0 1px rgba(0,0,0,0.1),
    0 0 0 2.5px rgba(255,255,255,0.25),
    0 30px 70px rgba(0,0,0,0.22),
    0 8px 20px rgba(0,0,0,0.1),
    inset 0 1px 0 rgba(255,255,255,0.65);
  flex-shrink: 0;
  transition: transform 0.25s cubic-bezier(0.34,1.2,0.64,1);
}
.phone:hover { transform: translateY(-6px) scale(1.005); }

/* Dynamic Island */
.island {
  position: absolute; top: 12px; left: 50%; transform: translateX(-50%);
  width: 128px; height: 37px;
  background: #060610; border-radius: 20px; z-index: 999;
  transition: all 0.4s cubic-bezier(0.34,1.2,0.64,1);
}
.island.wide { width: 210px; }

/* Status bar */
.statusbar {
  position: absolute; top: 0; left: 0; right: 0; height: 58px;
  display: flex; align-items: flex-end; justify-content: space-between;
  padding: 0 26px 9px; z-index: 200; pointer-events: none;
}
.sb-time {
  font-family: 'DM Sans', sans-serif;
  font-size: 15.5px; font-weight: 600; letter-spacing: -0.3px;
}
.sb-icons { display: flex; gap: 6px; align-items: center; font-size: 13px; }

/* ── ANIMATIONS ─────────────────────────────────────────────────────── */
@keyframes fadeUp { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
@keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
@keyframes scaleIn { from { opacity:0; transform:scale(0.88); } to { opacity:1; transform:scale(1); } }
@keyframes bounceIn { 0% { opacity:0; transform:scale(0.7); } 65% { transform:scale(1.08); } 100% { opacity:1; transform:scale(1); } }
@keyframes slideInRight { from { transform:translateX(40px); opacity:0; } to { transform:translateX(0); opacity:1; } }
@keyframes slideInLeft { from { transform:translateX(-40px); opacity:0; } to { transform:translateX(0); opacity:1; } }
@keyframes slideInUp { from { transform:translateY(30px); opacity:0; } to { transform:translateY(0); opacity:1; } }
@keyframes shimmer { 0% { background-position:-300% 0; } 100% { background-position:300% 0; } }
@keyframes glowPulse { 0%,100% { box-shadow:0 0 24px rgba(200,168,75,0.3); } 50% { box-shadow:0 0 48px rgba(200,168,75,0.6), 0 0 80px rgba(200,168,75,0.2); } }
@keyframes orbitCW  { from { transform:rotate(0deg); }   to { transform:rotate(360deg); } }
@keyframes orbitCCW { from { transform:rotate(0deg); }   to { transform:rotate(-360deg); } }
@keyframes twinkle  { 0%,100% { opacity:0.5; transform:scale(1); } 50% { opacity:1; transform:scale(1.4); } }
@keyframes float    { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-9px); } }
@keyframes dotBlink { 0%,100% { opacity:1; } 50% { opacity:0; } }
@keyframes typingBounce { 0%,60%,100% { transform:translateY(0); opacity:0.4; } 30% { transform:translateY(-5px); opacity:1; } }
@keyframes ripple { from { transform:scale(0); opacity:0.35; } to { transform:scale(3.5); opacity:0; } }
@keyframes checkmark { 0% { stroke-dashoffset:20; } 100% { stroke-dashoffset:0; } }
@keyframes progressBar { from { width:0; } to { width:var(--w); } }
@keyframes tabPop { 0% { transform:scale(0.6); } 60% { transform:scale(1.15); } 100% { transform:scale(1); } }
@keyframes chartSpin { from { transform:rotate(0deg); } to { transform:rotate(1deg); } }
@keyframes notifSlide { from { transform:translateY(-20px); opacity:0; } to { transform:translateY(0); opacity:1; } }

/* Press feedback for all interactive elements */
.press { cursor:pointer; user-select:none; -webkit-tap-highlight-color:transparent; }
.press:active { filter:brightness(0.92); transform:scale(0.965) !important; transition:transform 0.1s ease, filter 0.1s ease !important; }

/* Scroll container */
.scroller {
  position:absolute; inset:0; overflow-y:auto; overflow-x:hidden;
  scrollbar-width:none; -webkit-overflow-scrolling:touch;
}
.scroller::-webkit-scrollbar { display:none; }

/* ── TAB BAR ────────────────────────────────────────────────────────── */
.tabbar {
  position:absolute; bottom:0; left:0; right:0; height:86px;
  background:rgba(250,248,242,0.93);
  backdrop-filter:blur(28px) saturate(180%);
  -webkit-backdrop-filter:blur(28px) saturate(180%);
  border-top:1px solid rgba(0,0,0,0.07);
  display:flex; align-items:flex-start; justify-content:space-around;
  padding:10px 4px 0; z-index:90;
}
.tab {
  display:flex; flex-direction:column; align-items:center; gap:3px;
  flex:1; padding-top:2px;
  transition:transform 0.18s cubic-bezier(0.34,1.56,0.64,1);
}
.tab:active { transform:scale(0.84) !important; }
.tab-bubble {
  width:48px; height:30px; border-radius:15px;
  display:flex; align-items:center; justify-content:center;
  transition:background 0.2s ease;
  position:relative;
}
.tab-bubble.on { background:rgba(200,168,75,0.13); }
.tab-bubble.on::after {
  content:''; position:absolute; bottom:-5px;
  width:4px; height:4px; border-radius:50%;
  background:${T.gold};
  animation:tabPop 0.3s cubic-bezier(0.34,1.56,0.64,1) both;
}
.tab-glyph { font-size:19px; transition:all 0.2s ease; }
.tab-text {
  font-size:9.5px; font-weight:500; letter-spacing:0.2px;
  transition:color 0.2s ease;
}

/* ══════════════════════════════════════════════════════════════════════
   SPLASH
══════════════════════════════════════════════════════════════════════ */
.splash-bg {
  position:absolute; inset:0;
  background:radial-gradient(ellipse at 45% 35%, #1A0A55 0%, #0E0E22 45%, #07070F 100%);
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  overflow:hidden;
}
.splash-halo {
  position:absolute; border-radius:50%;
  background:radial-gradient(circle, rgba(200,168,75,0.1) 0%, transparent 65%);
  width:340px; height:340px; top:10%; left:50%; transform:translateX(-50%);
  animation:glowPulse 5s ease-in-out infinite;
}
.splash-orb-system {
  position:relative; margin-bottom:46px;
  animation:float 5.5s ease-in-out infinite;
}
.splash-ring { position:absolute; border-radius:50%; border-style:solid; border-color:transparent; }
.splash-ring-1 {
  inset:-30px; border-width:0.8px; border-color:rgba(200,168,75,0.22);
  animation:orbitCW 16s linear infinite;
}
.splash-ring-2 {
  inset:-52px; border-width:0.5px; border-color:rgba(200,168,75,0.12);
  animation:orbitCCW 24s linear infinite;
}
.splash-ring-3 {
  inset:-76px; border-width:0.4px; border-color:rgba(200,168,75,0.07);
  animation:orbitCW 38s linear infinite;
}
.splash-ring-dot {
  position:absolute; width:7px; height:7px; border-radius:50%;
  background:${T.gold}; top:-3.5px; left:50%; transform:translateX(-50%);
  box-shadow:0 0 8px ${T.gold};
}
.splash-ring-dot-sm {
  position:absolute; width:4px; height:4px; border-radius:50%;
  background:rgba(200,168,75,0.5); top:-2px; right:-2px;
}
.splash-sun {
  width:100px; height:100px; border-radius:50%; position:relative; z-index:2;
  background:radial-gradient(circle at 38% 32%, #EDD060 0%, #C8A84B 38%, #8C6C18 72%, #4A3808 100%);
  box-shadow:0 0 40px rgba(200,168,75,0.55), 0 0 90px rgba(200,168,75,0.18), inset 0 -10px 22px rgba(0,0,0,0.3);
  animation:glowPulse 4s ease-in-out infinite;
}
.splash-wordmark {
  font-family:'Playfair Display', serif;
  font-size:46px; font-weight:400; letter-spacing:10px;
  color:#FAF8F2; text-transform:uppercase; text-align:center;
  margin-bottom:8px; line-height:1;
  animation:fadeUp 0.9s 0.2s both ease;
}
.splash-tagline {
  font-size:11px; font-weight:300; letter-spacing:4px;
  text-transform:uppercase; color:rgba(250,248,242,0.36);
  margin-bottom:56px;
  animation:fadeUp 0.9s 0.38s both ease;
}
.splash-btn-wrap { animation:fadeUp 0.9s 0.55s both ease; display:flex; flex-direction:column; align-items:center; gap:16px; }
.splash-cta {
  width:292px; height:58px; border-radius:29px; border:none;
  background:linear-gradient(140deg, #E2C46A 0%, #C8A84B 45%, #A07820 100%);
  font-family:'DM Sans', sans-serif;
  font-size:16px; font-weight:500; color:#0E0E22;
  letter-spacing:0.3px; cursor:pointer; position:relative; overflow:hidden;
  box-shadow:0 6px 26px rgba(200,168,75,0.38), 0 2px 8px rgba(0,0,0,0.18);
  transition:transform 0.14s ease, box-shadow 0.14s ease;
}
.splash-cta::before {
  content:'';
  position:absolute; top:0; left:-100%; width:55%; height:100%;
  background:linear-gradient(90deg, transparent, rgba(255,255,255,0.28), transparent);
  animation:shimmer 3.2s 1.8s infinite;
}
.splash-cta:active { transform:scale(0.96) !important; box-shadow:0 3px 12px rgba(200,168,75,0.25) !important; }
.splash-login-text {
  font-size:13px; color:rgba(250,248,242,0.38);
}
.splash-login-text span { color:rgba(200,168,75,0.75); border-bottom:1px solid rgba(200,168,75,0.3); }

/* ══════════════════════════════════════════════════════════════════════
   ONBOARDING — SHARED
══════════════════════════════════════════════════════════════════════ */
.onb {
  position:absolute; inset:0; background:${T.cream};
  display:flex; flex-direction:column; padding:0 24px;
  overflow:hidden;
}
.onb-nav {
  display:flex; align-items:center; gap:12px;
  padding-top:66px; margin-bottom:30px;
}
.onb-back {
  width:38px; height:38px; border-radius:12px;
  background:white; border:1px solid ${T.border};
  display:flex; align-items:center; justify-content:center;
  font-size:17px; box-shadow:0 2px 8px rgba(0,0,0,0.06);
  transition:all 0.14s ease;
}
.onb-back:active { background:#F3EDE2; transform:scale(0.9) !important; }
.prog-track {
  flex:1; height:3px; background:#E8E0D0; border-radius:2px; overflow:hidden;
}
.prog-fill {
  height:100%; background:${T.gold}; border-radius:2px;
  transition:width 0.5s cubic-bezier(0.34,1.2,0.64,1);
}
.onb-step {
  font-size:12px; font-weight:500; color:${T.stone}; white-space:nowrap;
}
.onb-h1 {
  font-family:'Playfair Display', serif;
  font-size:31px; font-weight:400; color:${T.navy}; line-height:1.22;
  margin-bottom:10px; animation:fadeUp 0.45s ease both;
}
.onb-h1 em { font-style:italic; color:#7A5E14; }
.onb-body {
  font-size:13.5px; font-weight:300; color:${T.stone};
  line-height:1.62; margin-bottom:26px;
  animation:fadeUp 0.45s 0.06s ease both;
}

/* ── INPUT FIELDS ───────────────────────────────────────────────────── */
.fgroup { margin-bottom:13px; animation:fadeUp 0.45s 0.1s ease both; }
.flabel {
  display:block; font-size:10px; font-weight:600;
  letter-spacing:1.8px; text-transform:uppercase;
  color:${T.stone}; margin-bottom:7px;
}
.finput {
  width:100%; height:54px; background:white;
  border:1.5px solid ${T.border}; border-radius:15px;
  padding:0 18px; display:flex; align-items:center; justify-content:space-between;
  cursor:text; transition:border-color 0.2s ease, box-shadow 0.2s ease;
}
.finput.focused {
  border-color:${T.gold};
  box-shadow:0 0 0 3.5px rgba(200,168,75,0.1);
}
.finput.filled { border-color:rgba(200,168,75,0.45); background:#FFFEF7; }
.finput-val { font-size:15px; color:${T.navy}; }
.finput-ph  { font-size:15px; color:#C4B8A4; }
.finput-ic  { font-size:14px; color:#C4B8A4; }
.cursor-blink {
  display:inline-block; width:1.5px; height:18px;
  background:${T.gold}; margin-left:1px; vertical-align:middle;
  animation:dotBlink 1s step-end infinite;
}
.frow { display:grid; grid-template-columns:1fr 1fr; gap:11px; }

/* hint */
.hint {
  background:#FFFAEF; border:1px solid rgba(200,168,75,0.2);
  border-radius:13px; padding:13px 15px;
  display:flex; gap:10px; align-items:flex-start;
  margin-bottom:22px; animation:fadeUp 0.45s 0.18s ease both;
}
.hint-ic { font-size:15px; flex-shrink:0; }
.hint-txt { font-size:12px; color:#7A5E14; line-height:1.55; }

/* primary button */
.pbtn {
  width:100%; height:56px; background:${T.navy};
  border-radius:17px; border:none;
  font-family:'DM Sans', sans-serif;
  font-size:15px; font-weight:500; color:${T.cream};
  cursor:pointer; position:relative; overflow:hidden;
  box-shadow:0 4px 18px rgba(14,14,34,0.22);
  transition:box-shadow 0.2s ease, transform 0.12s ease;
  animation:fadeUp 0.45s 0.22s ease both;
}
.pbtn:hover { box-shadow:0 7px 24px rgba(14,14,34,0.28); }
.pbtn:active { transform:scale(0.97) !important; box-shadow:0 2px 10px rgba(14,14,34,0.15) !important; }

/* persona cards */
.pgrid { display:grid; grid-template-columns:1fr 1fr; gap:11px; margin-bottom:18px; }
.pcard {
  background:white; border:1.5px solid ${T.border};
  border-radius:18px; padding:16px 14px; cursor:pointer;
  transition:all 0.2s cubic-bezier(0.34,1.3,0.64,1);
}
.pcard:hover { transform:translateY(-2px); border-color:rgba(200,168,75,0.35); }
.pcard.on { border-color:${T.gold}; background:#FFFDF6; box-shadow:0 0 0 3px rgba(200,168,75,0.09), 0 3px 14px rgba(0,0,0,0.07); }
.pcard:active { transform:scale(0.95) !important; }
.pcard-top { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:10px; }
.pcard-icon {
  width:38px; height:38px; border-radius:12px;
  display:flex; align-items:center; justify-content:center; font-size:20px;
}
.pcard-check {
  width:20px; height:20px; border-radius:50%; background:${T.gold};
  display:flex; align-items:center; justify-content:center;
  color:white; font-size:11px; font-weight:700;
  animation:bounceIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both;
}
.pcard-name { font-size:13.5px; font-weight:600; color:${T.navy}; margin-bottom:4px; }
.pcard-desc { font-size:11px; color:${T.stone}; line-height:1.45; }

/* depth toggle */
.dtoggle {
  background:#EDE6D8; border-radius:13px; padding:4px;
  display:flex; margin-bottom:20px;
}
.dbtn {
  flex:1; height:38px; border-radius:9px; border:none;
  font-family:'DM Sans', sans-serif; font-size:13px; cursor:pointer;
  transition:all 0.2s ease; background:transparent; color:${T.stone};
}
.dbtn.on { background:white; color:${T.navy}; font-weight:600; box-shadow:0 1px 5px rgba(0,0,0,0.09); }

/* ══════════════════════════════════════════════════════════════════════
   CHART REVEAL / WELCOME
══════════════════════════════════════════════════════════════════════ */
.welcome-bg {
  position:absolute; inset:0;
  background:linear-gradient(168deg, #0E0E22 0%, #1A1060 50%, #0C1E3C 100%);
  display:flex; flex-direction:column; align-items:center;
  padding:70px 24px 36px; overflow:hidden;
}
.welcome-cosmos {
  position:relative; margin-bottom:30px;
  animation:float 6s ease-in-out infinite;
}
.wc-ring {
  position:absolute; border-radius:50%;
  border:1px solid rgba(200,168,75,0.14);
}
.wc-ring-1 { inset:-48px; animation:orbitCW  38s linear infinite; }
.wc-ring-2 { inset:-28px; border-style:dashed; border-color:rgba(200,168,75,0.1); animation:orbitCCW 22s linear infinite; }
.wc-ring-3 { inset:-10px; border-color:rgba(200,168,75,0.2); animation:orbitCW 14s linear infinite; }
.wc-ring-dot { position:absolute; width:6px; height:6px; border-radius:50%; background:rgba(200,168,75,0.65); top:-3px; left:50%; transform:translateX(-50%); }
.welcome-zodiac {
  width:232px; height:232px; border-radius:50%;
  border:1px solid rgba(200,168,75,0.2);
  display:flex; align-items:center; justify-content:center;
  position:relative;
  animation:scaleIn 0.8s 0.3s cubic-bezier(0.34,1.2,0.64,1) both;
}
.welcome-name-text {
  font-family:'Playfair Display', serif;
  font-size:33px; font-weight:400; color:${T.cream};
  margin-bottom:12px; text-align:center;
  animation:fadeUp 0.6s 0.75s ease both;
}
.welcome-big3 {
  display:flex; gap:7px; margin-bottom:16px;
  animation:fadeUp 0.6s 0.88s ease both;
}
.b3pill {
  background:rgba(200,168,75,0.1);
  border:1px solid rgba(200,168,75,0.2);
  border-radius:100px; padding:5px 14px;
  font-size:12px; color:rgba(250,248,242,0.72);
}
.welcome-desc {
  font-size:13px; font-weight:300; color:rgba(250,248,242,0.4);
  text-align:center; line-height:1.65; padding:0 8px; margin-bottom:32px;
  animation:fadeUp 0.6s 1s ease both;
}
.gold-btn {
  width:100%; height:56px; border-radius:18px; border:none;
  background:linear-gradient(140deg, #E2C46A 0%, #C8A84B 45%, #A07820 100%);
  font-family:'DM Sans', sans-serif;
  font-size:15px; font-weight:500; color:#0E0E22; cursor:pointer;
  box-shadow:0 7px 26px rgba(200,168,75,0.35); position:relative; overflow:hidden;
  transition:transform 0.12s ease, box-shadow 0.12s ease;
  animation:fadeUp 0.6s 1.1s ease both;
}
.gold-btn::before {
  content:''; position:absolute; top:0; left:-100%; width:50%; height:100%;
  background:linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent);
  animation:shimmer 2.8s 1.5s infinite;
}
.gold-btn:active { transform:scale(0.97) !important; box-shadow:0 3px 12px rgba(200,168,75,0.2) !important; }

/* ══════════════════════════════════════════════════════════════════════
   HOME
══════════════════════════════════════════════════════════════════════ */
.home-hero {
  background:linear-gradient(172deg, #0E0E22 0%, #1A1060 55%, #0C1E3C 100%);
  padding:64px 22px 26px; position:relative; overflow:hidden;
}
.home-hero-glow {
  position:absolute; width:260px; height:260px; border-radius:50%;
  background:radial-gradient(circle, rgba(200,168,75,0.1) 0%, transparent 70%);
  right:-60px; top:-60px; pointer-events:none;
}
.home-greeting { font-size:11px; letter-spacing:1.5px; text-transform:uppercase; color:rgba(250,248,242,0.36); margin-bottom:5px; }
.home-name-row { display:flex; align-items:center; justify-content:space-between; }
.home-name {
  font-family:'Playfair Display', serif;
  font-size:30px; font-weight:400; color:${T.cream};
}
.home-avi {
  width:44px; height:44px; border-radius:50%;
  background:linear-gradient(135deg, #E2C46A, #8C6C18);
  display:flex; align-items:center; justify-content:center;
  font-family:'Playfair Display', serif; font-size:20px; color:white;
  box-shadow:0 3px 14px rgba(0,0,0,0.3);
  transition:transform 0.2s cubic-bezier(0.34,1.56,0.64,1);
}
.home-avi:active { transform:scale(0.86) !important; }
.moon-strip {
  margin-top:16px; background:rgba(255,255,255,0.05);
  border:1px solid rgba(255,255,255,0.07); border-radius:12px;
  padding:10px 14px; display:flex; align-items:center; gap:9px;
}
.moon-strip-txt { font-size:12px; color:rgba(250,248,242,0.5); }
.moon-strip-txt strong { color:rgba(250,248,242,0.82); }
.home-bg-fade {
  height:28px; margin-top:-28px; position:relative; z-index:5;
  background:linear-gradient(180deg, transparent, ${T.cream}); pointer-events:none;
}

/* daily card */
.daily-card {
  border-radius:22px; overflow:hidden; margin-bottom:16px;
  box-shadow:0 6px 28px rgba(0,0,0,0.1);
  animation:fadeUp 0.5s ease both;
}
.daily-hd {
  background:linear-gradient(145deg, #1E1B38 0%, #1A1060 50%, #0C213C 100%);
  padding:20px 21px 17px; position:relative; overflow:hidden;
}
.daily-hd::before {
  content:'✦'; position:absolute; right:14px; top:50%; transform:translateY(-50%);
  font-size:80px; color:rgba(200,168,75,0.045); line-height:1;
}
.daily-date-txt { font-size:10px; font-weight:500; letter-spacing:2px; text-transform:uppercase; color:rgba(250,248,242,0.35); margin-bottom:6px; }
.daily-headline {
  font-family:'Playfair Display', serif;
  font-size:21px; font-weight:400; color:${T.cream}; line-height:1.3; margin-bottom:12px;
}
.tchips { display:flex; gap:6px; flex-wrap:wrap; }
.tchip {
  background:rgba(200,168,75,0.12); border:1px solid rgba(200,168,75,0.22);
  border-radius:100px; padding:3px 10px;
  font-size:10px; font-weight:500; color:rgba(200,168,75,0.9); letter-spacing:0.3px;
}
.daily-body { background:white; padding:17px 21px 19px; }
.daily-txt {
  font-size:13.5px; color:${T.ink}; line-height:1.68; margin-bottom:15px;
}
.daily-txt em { font-style:italic; color:#8B6214; }
.daily-acts { display:flex; gap:9px; }
.btn-outline {
  flex:1; height:40px; border:1.5px solid ${T.border};
  border-radius:12px; background:transparent;
  font-family:'DM Sans', sans-serif; font-size:12px; font-weight:500; color:#6B6050;
  cursor:pointer; transition:all 0.14s ease;
}
.btn-outline:hover { border-color:#D4CEBC; background:${T.warm}; }
.btn-outline:active { transform:scale(0.95) !important; }
.btn-fill {
  flex:1; height:40px; background:${T.navy};
  border-radius:12px; border:none;
  font-family:'DM Sans', sans-serif; font-size:12px; font-weight:500; color:${T.cream};
  cursor:pointer; transition:all 0.14s ease;
}
.btn-fill:active { transform:scale(0.95) !important; opacity:0.88; }

/* energy */
.egrid { display:grid; grid-template-columns:repeat(3,1fr); gap:9px; margin-bottom:15px; }
.ecard {
  background:white; border-radius:17px; padding:13px 10px;
  text-align:center; border:1px solid rgba(0,0,0,0.04);
  box-shadow:0 1px 8px rgba(0,0,0,0.04);
  transition:all 0.18s cubic-bezier(0.34,1.3,0.64,1);
}
.ecard:hover { transform:translateY(-3px); box-shadow:0 6px 18px rgba(0,0,0,0.09); }
.ecard:active { transform:scale(0.93) !important; }
.ecard-icon { font-size:22px; margin-bottom:5px; }
.ecard-tag { font-size:9.5px; font-weight:600; letter-spacing:1px; text-transform:uppercase; color:${T.stone}; margin-bottom:4px; }
.ecard-val { font-family:'Playfair Display', serif; font-size:14px; color:${T.navy}; margin-bottom:7px; }
.ebar { height:3px; background:#F0E8D6; border-radius:2px; overflow:hidden; }
.ebar-fill { height:100%; background:linear-gradient(90deg,#E2C46A,#C8A84B); border-radius:2px; }

/* planet strip */
.pstrip { display:flex; gap:7px; overflow-x:auto; padding-bottom:3px; scrollbar-width:none; margin-bottom:15px; }
.pstrip::-webkit-scrollbar { display:none; }
.pchip {
  flex-shrink:0; background:white; border-radius:13px;
  padding:9px 13px; display:flex; align-items:center; gap:8px;
  border:1px solid ${T.border}; box-shadow:0 1px 6px rgba(0,0,0,0.04);
  transition:all 0.15s ease;
}
.pchip:hover { border-color:rgba(200,168,75,0.3); transform:translateY(-2px); }
.pchip:active { transform:scale(0.93) !important; }
.pchip-glyph { font-size:18px; }
.pchip-name { font-size:9.5px; font-weight:600; letter-spacing:0.7px; text-transform:uppercase; color:${T.stone}; }
.pchip-pos { font-family:'Playfair Display', serif; font-size:13.5px; color:${T.navy}; }

/* promo */
.promo {
  border-radius:20px; padding:19px 20px;
  background:linear-gradient(142deg, #2A1A6E 0%, #1A1060 40%, #0C2A40 100%);
  margin-bottom:15px; position:relative; overflow:hidden;
  transition:transform 0.15s ease;
}
.promo:hover { transform:translateY(-2px); }
.promo:active { transform:scale(0.98) !important; }
.promo::after { content:'◉'; position:absolute; right:12px; bottom:-14px; font-size:90px; color:rgba(255,255,255,0.03); }
.promo-lbl { font-size:10px; letter-spacing:2px; text-transform:uppercase; color:rgba(200,168,75,0.58); margin-bottom:5px; }
.promo-title { font-family:'Playfair Display', serif; font-size:22px; color:white; margin-bottom:3px; }
.promo-sub { font-size:12px; color:rgba(255,255,255,0.42); margin-bottom:14px; }
.promo-row { display:flex; align-items:center; justify-content:space-between; }
.promo-price { font-family:'Playfair Display', serif; font-size:28px; color:white; }
.promo-was { font-size:12px; color:rgba(255,255,255,0.28); text-decoration:line-through; margin-left:7px; font-family:'DM Sans', sans-serif; }
.promo-cta {
  background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.16);
  border-radius:11px; padding:8px 15px;
  font-size:12px; font-weight:500; color:white; cursor:pointer;
  transition:background 0.14s ease;
}
.promo-cta:hover { background:rgba(255,255,255,0.18); }

/* journal card */
.journal-card {
  background:white; border-radius:18px; padding:16px 18px; margin-bottom:15px;
  border:1px solid ${T.border}; box-shadow:0 1px 8px rgba(0,0,0,0.04);
}
.jcard-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
.jcard-title { font-size:10px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; color:${T.stone}; }
.jcard-badge { background:#F0E8D6; border-radius:100px; padding:3px 10px; font-size:10px; color:#6B6050; }
.jcard-prompt {
  font-family:'Playfair Display', serif;
  font-size:16px; color:${T.navy}; line-height:1.4; margin-bottom:12px; font-style:italic;
}
.jcard-btn {
  height:36px; width:100%; background:${T.warm}; border-radius:10px; border:none;
  font-family:'DM Sans', sans-serif; font-size:12px; color:${T.ink};
  cursor:pointer; font-weight:500;
  transition:background 0.14s ease;
}
.jcard-btn:hover { background:#EDE6D8; }

/* ══════════════════════════════════════════════════════════════════════
   BIRTH CHART
══════════════════════════════════════════════════════════════════════ */
.chart-hero {
  background:${T.navy}; padding-top:64px; padding-bottom:22px;
  display:flex; flex-direction:column; align-items:center;
  position:relative; overflow:hidden;
}
.chart-hero-glow {
  position:absolute; inset:0;
  background:radial-gradient(ellipse 300px 200px at 50% 45%, rgba(80,50,200,0.12) 0%, transparent 60%);
  pointer-events:none;
}
.chart-top-row { width:100%; padding:0 22px; display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; position:relative; z-index:2; }
.chart-screen-title { font-family:'Playfair Display', serif; font-size:27px; font-weight:400; color:${T.cream}; }
.house-pill {
  background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.1);
  border-radius:100px; padding:5px 14px;
  font-size:11px; color:rgba(250,248,242,0.48); cursor:pointer;
  transition:background 0.14s ease;
}
.house-pill:hover { background:rgba(255,255,255,0.13); }
.chart-tabs-bar {
  background:#EDE6D8; border-radius:13px; padding:4px;
  display:flex; margin:16px 20px 0;
}
.ctab {
  flex:1; height:38px; border-radius:9px; border:none;
  font-family:'DM Sans', sans-serif; font-size:12.5px;
  color:${T.stone}; background:transparent; cursor:pointer;
  transition:all 0.2s ease;
}
.ctab.on { background:white; color:${T.navy}; font-weight:600; box-shadow:0 1px 5px rgba(0,0,0,0.09); }
.placement-list { padding:6px 20px 0; }
.plrow {
  display:flex; align-items:center; gap:13px;
  padding:12px 0; border-bottom:1px solid #F0E8DA; cursor:pointer;
  transition:background 0.14s ease;
}
.plrow:last-child { border-bottom:none; }
.plrow:active { background:rgba(200,168,75,0.04); }
.plrow-icon { width:40px; height:40px; border-radius:50%; background:${T.warm}; display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0; }
.plrow-body { flex:1; }
.plrow-planet { font-size:10px; font-weight:600; letter-spacing:1px; text-transform:uppercase; color:${T.stone}; margin-bottom:2px; }
.plrow-sign { font-family:'Playfair Display', serif; font-size:17.5px; color:${T.navy}; }
.plrow-meta { text-align:right; }
.plrow-deg { font-size:11px; color:${T.stone}; margin-bottom:2px; }
.plrow-house { font-size:10px; color:#C0B8A8; }
.plrow-arrow { font-size:12px; color:#D8D0C0; margin-left:4px; }

/* ══════════════════════════════════════════════════════════════════════
   AI CHAT
══════════════════════════════════════════════════════════════════════ */
.chat-wrap { position:absolute; inset:0; background:${T.cream}; display:flex; flex-direction:column; }
.chat-hd {
  background:rgba(250,248,242,0.96); backdrop-filter:blur(22px);
  border-bottom:1px solid ${T.border}; padding:62px 22px 13px; flex-shrink:0;
}
.chat-ai-row { display:flex; align-items:center; gap:11px; margin-bottom:11px; }
.chat-orb {
  width:46px; height:46px; border-radius:50%;
  background:linear-gradient(135deg, #0E0E22, #1A1060);
  display:flex; align-items:center; justify-content:center; font-size:21px;
  box-shadow:0 3px 12px rgba(14,14,34,0.22); position:relative; flex-shrink:0;
}
.chat-orb-dot {
  position:absolute; bottom:1px; right:1px;
  width:12px; height:12px; border-radius:50%;
  background:#4CAF50; border:2.5px solid ${T.cream};
}
.chat-ai-name { font-family:'Playfair Display', serif; font-size:20px; color:${T.navy}; margin-bottom:1px; }
.chat-ai-sub { font-size:11px; color:${T.stone}; }
.free-pill {
  margin-left:auto;
  background:linear-gradient(135deg,#E2C46A,#C8A84B); border-radius:100px; padding:4px 12px;
  font-size:10px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:#0E0E22;
}
.ctx-bar { display:flex; gap:6px; overflow-x:auto; scrollbar-width:none; }
.ctx-bar::-webkit-scrollbar { display:none; }
.ctx-chip {
  flex-shrink:0; background:${T.warm}; border-radius:100px; padding:4px 11px;
  font-size:11px; color:#5A5040;
}
.chat-msgs { flex:1; overflow-y:auto; padding:17px 17px; display:flex; flex-direction:column; gap:15px; scrollbar-width:none; }
.chat-msgs::-webkit-scrollbar { display:none; }
.mrow { display:flex; gap:9px; }
.mrow.user { flex-direction:row-reverse; }
.morb { width:28px; height:28px; border-radius:50%; flex-shrink:0; margin-top:3px; display:flex; align-items:center; justify-content:center; font-size:12px; }
.morb.ai  { background:linear-gradient(135deg,#0E0E22,#1A1060); }
.morb.usr { background:linear-gradient(135deg,#E2C46A,#8C6C18); }
.mbub {
  max-width:73%; border-radius:18px; padding:11px 14px;
  font-size:13.5px; line-height:1.62;
  animation:fadeUp 0.3s ease both;
}
.mbub.ai {
  background:white; color:${T.ink};
  border-bottom-left-radius:5px;
  box-shadow:0 1px 7px rgba(0,0,0,0.07);
}
.mbub.usr { background:${T.navy}; color:${T.cream}; border-bottom-right-radius:5px; }
.mbub em { color:${T.gold}; font-style:italic; }
.mtime { font-size:10px; color:#C0B8A4; margin-top:4px; padding:0 4px; }
.mtime.r { text-align:right; }
.typing-wrap { display:flex; align-items:center; gap:4px; background:white; border-radius:18px; border-bottom-left-radius:5px; padding:12px 16px; box-shadow:0 1px 7px rgba(0,0,0,0.07); }
.tdot { width:6px; height:6px; border-radius:50%; background:${T.stone}; }
.tdot:nth-child(1) { animation:typingBounce 1.2s 0s infinite; }
.tdot:nth-child(2) { animation:typingBounce 1.2s 0.2s infinite; }
.tdot:nth-child(3) { animation:typingBounce 1.2s 0.4s infinite; }
.suggest-strip { padding:7px 17px; display:flex; gap:7px; overflow-x:auto; scrollbar-width:none; flex-shrink:0; }
.suggest-strip::-webkit-scrollbar { display:none; }
.schip {
  flex-shrink:0; background:white; border:1px solid ${T.border};
  border-radius:100px; padding:7px 14px;
  font-size:12px; color:${T.ink}; cursor:pointer; white-space:nowrap;
  transition:all 0.14s ease;
}
.schip:hover { border-color:rgba(200,168,75,0.38); background:#FFFDF6; }
.schip:active { transform:scale(0.94) !important; }
.chat-input-bar {
  padding:9px 17px 28px; background:${T.cream};
  border-top:1px solid ${T.border}; display:flex; gap:9px; align-items:center; flex-shrink:0;
}
.chat-input-field {
  flex:1; height:48px; background:white;
  border:1.5px solid ${T.border}; border-radius:24px;
  padding:0 17px; font-family:'DM Sans', sans-serif;
  font-size:14px; color:#B0A898; display:flex; align-items:center;
}
.chat-send {
  width:48px; height:48px; border-radius:50%; background:${T.navy};
  border:none; display:flex; align-items:center; justify-content:center;
  font-size:17px; color:white; cursor:pointer; flex-shrink:0;
  box-shadow:0 3px 12px rgba(14,14,34,0.22);
  transition:transform 0.14s cubic-bezier(0.34,1.56,0.64,1);
}
.chat-send:active { transform:scale(0.86) !important; }

/* ══════════════════════════════════════════════════════════════════════
   TRANSITS
══════════════════════════════════════════════════════════════════════ */
.transit-hero {
  background:linear-gradient(180deg, #0E0E22 0%, rgba(14,14,34,0) 100%);
  padding:64px 22px 18px; position:relative; overflow:hidden;
}
.transit-title { font-family:'Playfair Display', serif; font-size:27px; font-weight:400; color:${T.cream}; margin-bottom:3px; }
.transit-sub { font-size:12px; color:rgba(250,248,242,0.36); }
.transit-list { padding:6px 19px 94px; }
.tcard {
  background:white; border-radius:17px; margin-bottom:9px;
  border:1px solid ${T.border}; overflow:hidden;
  transition:box-shadow 0.2s ease;
}
.tcard:hover { box-shadow:0 5px 22px rgba(0,0,0,0.09); }
.tcard-head {
  padding:14px 15px; display:flex; align-items:center; gap:11px;
  cursor:pointer; transition:background 0.14s ease;
}
.tcard-head:active { background:#FAFAF7; }
.ticons { display:flex; }
.ticon { width:37px; height:37px; border-radius:50%; background:${T.warm}; display:flex; align-items:center; justify-content:center; font-size:16px; flex-shrink:0; border:2px solid white; }
.ticon:not(:first-child) { margin-left:-9px; background:#EDE6D4; }
.tinfo { flex:1; }
.taspect { font-family:'Playfair Display', serif; font-size:17px; color:${T.navy}; }
.tplanets { font-size:11px; color:${T.stone}; margin-top:1px; }
.torb { background:${T.warm}; border-radius:7px; padding:4px 8px; font-size:10px; color:#6B6050; font-weight:500; flex-shrink:0; }
.tintensity { display:flex; gap:3px; margin-top:6px; }
.tidot { width:6px; height:6px; border-radius:50%; background:${T.gold}; }
.tidot.off { background:${T.border}; }
.tchev { font-size:12px; color:${T.stone}; margin-left:4px; flex-shrink:0; transition:transform 0.24s ease; }
.tchev.open { transform:rotate(180deg); }
.tcard-body { border-top:1px solid #F5F0E6; padding:0 15px 15px; animation:fadeUp 0.24s ease; }
.tbody-txt { font-size:13px; color:${T.ink}; line-height:1.62; margin-top:13px; }
.tbody-meta { display:flex; align-items:center; justify-content:space-between; margin-top:11px; }
.tbody-dur { font-size:11px; color:${T.stone}; }
.tbody-ai {
  background:${T.warm}; border-radius:9px; padding:5px 11px;
  font-size:11px; font-weight:500; color:${T.ink};
  cursor:pointer; border:none; font-family:'DM Sans', sans-serif;
  transition:background 0.14s ease;
}
.tbody-ai:hover { background:#EDE6D4; }

/* ══════════════════════════════════════════════════════════════════════
   REPORTS
══════════════════════════════════════════════════════════════════════ */
.reports-top { padding:64px 22px 4px; }
.reports-h1 { font-family:'Playfair Display', serif; font-size:32px; font-weight:400; color:${T.navy}; margin-bottom:5px; }
.reports-sub { font-size:13px; color:${T.stone}; line-height:1.55; margin-bottom:18px; }
.featured-wrap {
  margin:0 20px 18px; border-radius:21px; overflow:hidden;
  box-shadow:0 12px 40px rgba(0,0,0,0.14);
  transition:transform 0.2s ease;
}
.featured-wrap:hover { transform:translateY(-4px); }
.featured-wrap:active { transform:scale(0.985) !important; }
.featured-img {
  height:148px; position:relative; overflow:hidden;
  background:linear-gradient(142deg, #0E0E22, #2A1A6E, #0C2840);
  display:flex; align-items:center; justify-content:center;
}
.featured-badge-chip {
  position:absolute; top:14px; left:14px;
  background:${T.gold}; border-radius:100px; padding:4px 12px;
  font-size:9px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:${T.navy};
}
.featured-yr { font-family:'Playfair Display', serif; font-size:90px; font-weight:400; color:rgba(255,255,255,0.05); position:absolute; right:8px; bottom:-16px; line-height:1; }
.featured-body { background:white; padding:17px 19px 19px; }
.featured-title { font-family:'Playfair Display', serif; font-size:22px; color:${T.navy}; margin-bottom:4px; }
.featured-desc { font-size:12px; color:${T.stone}; line-height:1.5; margin-bottom:13px; }
.featured-foot { display:flex; align-items:center; justify-content:space-between; }
.featured-price { font-family:'Playfair Display', serif; font-size:28px; color:${T.navy}; }
.featured-was { font-family:'DM Sans', sans-serif; font-size:12px; color:#C0B8A4; text-decoration:line-through; margin-left:6px; }
.report-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; padding:0 20px 94px; }
.rtile {
  background:white; border-radius:17px; overflow:hidden;
  border:1px solid ${T.border}; box-shadow:0 1px 6px rgba(0,0,0,0.04);
  transition:all 0.17s cubic-bezier(0.34,1.3,0.64,1);
}
.rtile:hover { transform:translateY(-3px); box-shadow:0 6px 20px rgba(0,0,0,0.09); }
.rtile:active { transform:scale(0.95) !important; }
.rtile-color { height:74px; display:flex; align-items:center; justify-content:center; font-size:32px; position:relative; overflow:hidden; }
.rtile-body { padding:11px 13px 13px; }
.rtile-name { font-family:'Playfair Display', serif; font-size:16px; color:${T.navy}; margin-bottom:2px; }
.rtile-desc { font-size:10px; color:${T.stone}; line-height:1.4; margin-bottom:9px; }
.rtile-price { font-family:'Playfair Display', serif; font-size:19px; color:${T.navy}; display:flex; align-items:baseline; gap:4px; }
.rtile-unit { font-family:'DM Sans', sans-serif; font-size:10px; color:${T.stone}; }

/* bundles */
.bundle-strip { padding:0 20px; margin-bottom:18px; }
.bundle-lbl { font-size:10px; font-weight:600; letter-spacing:2px; text-transform:uppercase; color:${T.stone}; margin-bottom:10px; }
.bundle-card {
  background:${T.warm}; border-radius:16px; padding:14px 16px;
  border:1px solid ${T.border}; margin-bottom:9px;
  display:flex; align-items:center; justify-content:space-between;
  transition:all 0.15s ease;
}
.bundle-card:hover { background:#EDE6D8; }
.bundle-card:active { transform:scale(0.97) !important; }
.bundle-name { font-size:14px; font-weight:500; color:${T.navy}; margin-bottom:2px; }
.bundle-includes { font-size:11px; color:${T.stone}; }
.bundle-price { font-family:'Playfair Display', serif; font-size:22px; color:${T.navy}; }

/* ══════════════════════════════════════════════════════════════════════
   REPORT DETAIL
══════════════════════════════════════════════════════════════════════ */
.rdetail-hero {
  height:258px; position:relative; overflow:hidden;
  background:linear-gradient(158deg, #0E0E22 0%, #1A1060 42%, #0C2040 100%);
  display:flex; flex-direction:column; justify-content:flex-end; padding:22px;
}
.rdh-rings { position:absolute; inset:0; pointer-events:none; }
.rdh-ring { position:absolute; border-radius:50%; border:1px solid rgba(200,168,75,0.1); }
.back-btn {
  position:absolute; top:62px; left:20px;
  width:36px; height:36px; border-radius:50%;
  background:rgba(255,255,255,0.09); border:1px solid rgba(255,255,255,0.13);
  display:flex; align-items:center; justify-content:center;
  font-size:16px; color:white; cursor:pointer;
  transition:all 0.14s ease;
}
.back-btn:hover { background:rgba(255,255,255,0.16); }
.back-btn:active { transform:scale(0.88) !important; }
.rdh-label { font-size:10px; letter-spacing:2px; text-transform:uppercase; color:rgba(200,168,75,0.6); margin-bottom:7px; }
.rdh-title { font-family:'Playfair Display', serif; font-size:36px; font-weight:400; color:white; line-height:1.12; margin-bottom:9px; }
.rdh-meta { display:flex; gap:12px; }
.rdh-tag { font-size:11px; color:rgba(250,248,242,0.36); }
.rdetail-body { padding:20px 21px 8px; }
.chapters-lbl { font-size:10px; font-weight:600; letter-spacing:2px; text-transform:uppercase; color:${T.stone}; margin-bottom:13px; }
.chrow {
  background:white; border-radius:14px; padding:14px 16px;
  margin-bottom:8px; display:flex; align-items:center; gap:12px;
  border:1px solid ${T.border}; cursor:pointer;
  transition:all 0.15s ease;
}
.chrow:hover { transform:translateX(3px); box-shadow:0 3px 12px rgba(0,0,0,0.06); }
.chrow:active { transform:scale(0.97) !important; }
.chnum { width:32px; height:32px; border-radius:50%; background:${T.warm}; display:flex; align-items:center; justify-content:center; font-family:'Playfair Display', serif; font-size:15px; color:#8B6214; flex-shrink:0; }
.chbody { flex:1; }
.chtitle { font-family:'Playfair Display', serif; font-size:16px; color:${T.navy}; margin-bottom:2px; }
.chpreview { font-size:11px; color:${T.stone}; line-height:1.4; }
.chlock { font-size:14px; color:#D0C8B4; flex-shrink:0; }
.chfree { font-size:10px; font-weight:700; letter-spacing:0.5px; color:rgba(200,168,75,0.78); flex-shrink:0; }
.purchase-footer {
  position:sticky; bottom:0; background:rgba(250,248,242,0.96);
  backdrop-filter:blur(22px); border-top:1px solid ${T.border};
  padding:15px 22px 28px;
  display:flex; align-items:center; justify-content:space-between;
}
.pf-pricing {}
.pf-was { font-size:11px; color:#C0B8A4; text-decoration:line-through; }
.pf-price { font-family:'Playfair Display', serif; font-size:36px; color:${T.navy}; line-height:1; }
.pf-btn {
  height:52px; padding:0 26px;
  background:linear-gradient(140deg,#E2C46A,#C8A84B,#A07820);
  border-radius:17px; border:none;
  font-family:'DM Sans', sans-serif; font-size:15px; font-weight:500; color:${T.navy};
  cursor:pointer; position:relative; overflow:hidden;
  box-shadow:0 6px 22px rgba(200,168,75,0.36);
  transition:all 0.12s ease;
}
.pf-btn:active { transform:scale(0.95) !important; box-shadow:0 3px 10px rgba(200,168,75,0.2) !important; }
.pf-btn::before {
  content:''; position:absolute; top:0; left:-100%; width:50%; height:100%;
  background:linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent);
  animation:shimmer 2.5s 1s infinite;
}

/* ══════════════════════════════════════════════════════════════════════
   PROFILE
══════════════════════════════════════════════════════════════════════ */
.profile-hero {
  background:linear-gradient(158deg, #0E0E22 0%, #2A1A6E 60%, #0C2040 100%);
  padding:64px 22px 25px; position:relative; overflow:hidden;
}
.profile-hero-glyph { position:absolute; right:8px; bottom:-22px; font-family:'Playfair Display', serif; font-size:128px; color:rgba(200,168,75,0.04); line-height:1; }
.profile-avi {
  width:72px; height:72px; border-radius:50%;
  background:linear-gradient(135deg,#E2C46A,#8C6C18);
  display:flex; align-items:center; justify-content:center;
  font-family:'Playfair Display', serif; font-size:30px; color:white;
  box-shadow:0 4px 18px rgba(0,0,0,0.3); margin-bottom:13px;
  border:3px solid rgba(255,255,255,0.14); cursor:pointer;
  transition:transform 0.2s cubic-bezier(0.34,1.56,0.64,1);
}
.profile-avi:active { transform:scale(0.88) !important; }
.profile-name { font-family:'Playfair Display', serif; font-size:28px; font-weight:400; color:white; margin-bottom:9px; }
.profile-signs-row { display:flex; gap:6px; flex-wrap:wrap; }
.profile-sbadge { background:rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.11); border-radius:100px; padding:4px 11px; font-size:11px; color:rgba(250,248,242,0.58); }
.profile-body-wrap { padding:18px 19px 94px; }
.pstats { display:grid; grid-template-columns:1fr 1fr; gap:9px; margin-bottom:18px; }
.pstat { background:white; border-radius:15px; padding:15px; border:1px solid ${T.border}; }
.pstat-num { font-family:'Playfair Display', serif; font-size:32px; color:${T.navy}; line-height:1; }
.pstat-lbl { font-size:11px; color:${T.stone}; margin-top:3px; }
.pstat-tags { display:flex; gap:5px; margin-top:7px; flex-wrap:wrap; }
.mini-tag { background:${T.warm}; border-radius:100px; padding:3px 9px; font-size:10px; color:#6B6050; }
.psec-lbl { font-size:10px; font-weight:600; letter-spacing:2px; text-transform:uppercase; color:${T.stone}; margin-bottom:9px; }
.pcard { background:white; border-radius:17px; border:1px solid ${T.border}; overflow:hidden; margin-bottom:18px; }
.prow { display:flex; align-items:center; padding:14px 16px; border-bottom:1px solid #F5F0E6; cursor:pointer; transition:background 0.14s ease; }
.prow:last-child { border-bottom:none; }
.prow:active { background:#FAF8F2; }
.prow-icon { width:34px; height:34px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:16px; margin-right:11px; flex-shrink:0; }
.prow-label { font-size:14px; color:${T.navy}; flex:1; }
.prow-val { font-size:13px; color:${T.stone}; }
.prow-arr { font-size:12px; color:#D0C8B4; margin-left:5px; }
.astro-id-card {
  background:linear-gradient(140deg,#0E0E22,#1A1060); border-radius:16px;
  padding:18px 18px; margin-bottom:18px; position:relative; overflow:hidden;
  border:1px solid rgba(200,168,75,0.15);
}
.astro-id-card::after { content:'✦'; position:absolute; right:14px; bottom:-2px; font-size:60px; color:rgba(200,168,75,0.05); }
.astro-id-lbl { font-size:10px; letter-spacing:2px; text-transform:uppercase; color:rgba(200,168,75,0.55); margin-bottom:8px; }
.astro-id-main { font-family:'Playfair Display', serif; font-size:20px; color:white; margin-bottom:10px; }
.astro-id-row { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:12px; }
.astro-chip { background:rgba(200,168,75,0.1); border:1px solid rgba(200,168,75,0.2); border-radius:100px; padding:4px 12px; font-size:11px; color:rgba(250,248,242,0.7); }
.astro-share { background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.12); border-radius:10px; padding:7px 14px; font-size:12px; color:rgba(250,248,242,0.6); display:inline-block; cursor:pointer; transition:background 0.14s ease; }
.astro-share:hover { background:rgba(255,255,255,0.14); }

/* ══════════════════════════════════════════════════════════════════════
   OUTER SHELL / PAGE DESIGN
══════════════════════════════════════════════════════════════════════ */
.page-wordmark {
  text-align:center; margin-bottom:64px;
}
.wordmark-text {
  font-family:'Playfair Display', serif;
  font-size:58px; font-weight:400; letter-spacing:12px;
  color:${T.navy}; text-transform:uppercase; line-height:1;
  margin-bottom:10px;
}
.wordmark-stars { color:${T.gold}; font-size:28px; letter-spacing:0; margin:0 18px; }
.wordmark-sub { font-size:11px; font-weight:500; letter-spacing:3.5px; text-transform:uppercase; color:${T.stone}; }
.design-system-card {
  max-width:780px; width:100%; background:white; border-radius:24px;
  border:1px solid ${T.border}; padding:38px 40px; margin-top:32px;
}
.ds-title { font-family:'Playfair Display', serif; font-size:28px; color:${T.navy}; margin-bottom:24px; }
.ds-row { display:flex; gap:18px; padding:14px 0; border-bottom:1px solid #F0E8DA; }
.ds-row:last-child { border-bottom:none; padding-bottom:0; }
.ds-key { min-width:148px; font-size:10px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; color:${T.stone}; padding-top:2px; }
.ds-val { font-size:13px; color:${T.ink}; line-height:1.55; }
.swatch { display:inline-block; width:13px; height:13px; border-radius:4px; margin-right:5px; vertical-align:middle; border:1px solid rgba(0,0,0,0.08); }

/* ══════════════════════════════════════════════════════════════════════
   DARK MODE  — .dk class applied to phone wrapper
══════════════════════════════════════════════════════════════════════ */
.dk { background: #0A0A18 !important; }
.dk .scroller { background: #0A0A18; }
.dk .daily-body    { background: #13131F !important; }
.dk .daily-card    { box-shadow: 0 6px 28px rgba(0,0,0,0.4) !important; }
.dk .ecard         { background: #13131F !important; border-color: rgba(255,255,255,0.06) !important; }
.dk .pchip         { background: #13131F !important; border-color: rgba(255,255,255,0.06) !important; }
.dk .journal-card  { background: #13131F !important; border-color: rgba(255,255,255,0.06) !important; }
.dk .jcard-badge   { background: #1E1E30 !important; color: #9A8FA0 !important; }
.dk .jcard-btn     { background: #1E1E30 !important; color: #C8B8D8 !important; }
.dk .pchip-name    { color: #7A7090 !important; }
.dk .pchip-pos     { color: #E8E0F0 !important; }
.dk .ecard-tag     { color: #7A7090 !important; }
.dk .ecard-val     { color: #E8E0F0 !important; }
.dk .ebar          { background: #1E1E30 !important; }
.dk .daily-txt     { color: #C8C0D8 !important; }
.dk .daily-txt em  { color: #C8A84B !important; }
.dk .btn-outline   { border-color: rgba(255,255,255,0.1) !important; color: #9A90A8 !important; background: transparent !important; }
.dk .btn-fill      { background: #E2C46A !important; color: #0A0A18 !important; }
.dk .tabbar        { background: rgba(10,10,24,0.94) !important; border-top-color: rgba(255,255,255,0.06) !important; }
.dk .tcard         { background: #13131F !important; border-color: rgba(255,255,255,0.06) !important; }
.dk .tcard-head:active { background: rgba(255,255,255,0.03) !important; }
.dk .taspect       { color: #E8E0F0 !important; }
.dk .tplanets      { color: #7A7090 !important; }
.dk .torb          { background: #1E1E30 !important; color: #9A90A8 !important; }
.dk .tintensity .tidot.off { background: #1E1E30 !important; }
.dk .tbody-txt     { color: #C8C0D8 !important; }
.dk .tbody-dur     { color: #7A7090 !important; }
.dk .tbody-ai      { background: #1E1E30 !important; color: #C8B8D8 !important; }
.dk .tcard-body    { border-top-color: rgba(255,255,255,0.06) !important; }
.dk .tchev         { color: #7A7090 !important; }
.dk .plrow         { border-bottom-color: rgba(255,255,255,0.06) !important; }
.dk .plrow-icon    { background: #1E1E30 !important; }
.dk .plrow-planet  { color: #7A7090 !important; }
.dk .plrow-sign    { color: #E8E0F0 !important; }
.dk .plrow-deg     { color: #7A7090 !important; }
.dk .plrow-house   { color: #4A4460 !important; }
.dk .plrow-arrow   { color: #3A3450 !important; }
.dk .chart-tabs-bar { background: #13131F !important; }
.dk .ctab          { color: #7A7090 !important; }
.dk .ctab.on       { background: #1E1E30 !important; color: #E8E0F0 !important; }
.dk .chat-wrap     { background: #0A0A18 !important; }
.dk .chat-hd       { background: rgba(10,10,24,0.96) !important; border-bottom-color: rgba(255,255,255,0.06) !important; }
.dk .chat-ai-name  { color: #E8E0F0 !important; }
.dk .chat-ai-sub   { color: #7A7090 !important; }
.dk .ctx-chip      { background: #1E1E30 !important; color: #9A90A8 !important; }
.dk .mbub.ai       { background: #13131F !important; color: #C8C0D8 !important; box-shadow: 0 1px 7px rgba(0,0,0,0.3) !important; }
.dk .mbub em       { color: #C8A84B !important; }
.dk .mtime         { color: #4A4460 !important; }
.dk .typing-wrap   { background: #13131F !important; }
.dk .tdot          { background: #7A7090 !important; }
.dk .schip         { background: #13131F !important; border-color: rgba(255,255,255,0.06) !important; color: #C8C0D8 !important; }
.dk .chat-input-bar { background: #0A0A18 !important; border-top-color: rgba(255,255,255,0.06) !important; }
.dk .chat-input-field { background: #13131F !important; border-color: rgba(255,255,255,0.08) !important; color: #6A6080 !important; }
.dk .chat-orb-dot  { border-color: #0A0A18 !important; }
.dk .reports-h1    { color: #E8E0F0 !important; }
.dk .reports-sub   { color: #7A7090 !important; }
.dk .featured-body { background: #13131F !important; }
.dk .featured-title { color: #E8E0F0 !important; }
.dk .featured-desc  { color: #7A7090 !important; }
.dk .featured-price { color: #E8E0F0 !important; }
.dk .featured-was   { color: #4A4460 !important; }
.dk .bundle-card   { background: #13131F !important; border-color: rgba(255,255,255,0.06) !important; }
.dk .bundle-name   { color: #E8E0F0 !important; }
.dk .bundle-includes { color: #7A7090 !important; }
.dk .bundle-price  { color: #E8E0F0 !important; }
.dk .rtile         { background: #13131F !important; border-color: rgba(255,255,255,0.06) !important; }
.dk .rtile-name    { color: #E8E0F0 !important; }
.dk .rtile-desc    { color: #7A7090 !important; }
.dk .rtile-price   { color: #E8E0F0 !important; }
.dk .rtile-unit    { color: #7A7090 !important; }
.dk .rdetail-body  { background: #0A0A18 !important; }
.dk .chrow         { background: #13131F !important; border-color: rgba(255,255,255,0.06) !important; }
.dk .chnum         { background: #1E1E30 !important; }
.dk .chtitle       { color: #E8E0F0 !important; }
.dk .chpreview     { color: #7A7090 !important; }
.dk .purchase-footer { background: rgba(10,10,24,0.97) !important; border-top-color: rgba(255,255,255,0.06) !important; }
.dk .pf-was        { color: #4A4460 !important; }
.dk .pf-price      { color: #E8E0F0 !important; }
.dk .chapters-lbl  { color: #7A7090 !important; }
.dk .profile-body-wrap { background: #0A0A18 !important; }
.dk .pstat         { background: #13131F !important; border-color: rgba(255,255,255,0.06) !important; }
.dk .pstat-num     { color: #E8E0F0 !important; }
.dk .pstat-lbl     { color: #7A7090 !important; }
.dk .mini-tag      { background: #1E1E30 !important; color: #9A90A8 !important; }
.dk .pcard         { background: #13131F !important; border-color: rgba(255,255,255,0.06) !important; }
.dk .prow          { border-bottom-color: rgba(255,255,255,0.06) !important; }
.dk .prow:active   { background: #1E1E30 !important; }
.dk .prow-label    { color: #E8E0F0 !important; }
.dk .prow-val      { color: #7A7090 !important; }
.dk .prow-arr      { color: #3A3450 !important; }
.dk .psec-lbl      { color: #7A7090 !important; }
.dk .astro-id-card { border-color: rgba(200,168,75,0.2) !important; }

/* Dark mode toggle */
.toggle-row {
  display:flex; align-items:center; padding:14px 16px; cursor:pointer;
  border-bottom:1px solid #F5F0E6; transition:background 0.14s ease;
}
.toggle-row:active { background:#FAF8F2; }
.dk .toggle-row    { border-bottom-color:rgba(255,255,255,0.06) !important; }
.dk .toggle-row:active { background:#1E1E30 !important; }
.toggle-track {
  width:50px; height:28px; border-radius:14px; background:#E0D8C8;
  position:relative; transition:background 0.3s ease; flex-shrink:0; margin-left:auto;
}
.toggle-track.on   { background:#C8A84B; }
.dk .toggle-track  { background:#2A2440 !important; }
.dk .toggle-track.on { background:#C8A84B !important; }
.toggle-knob {
  position:absolute; top:3px; left:3px;
  width:22px; height:22px; border-radius:50%;
  background:white; box-shadow:0 1px 4px rgba(0,0,0,0.22);
  transition:transform 0.28s cubic-bezier(0.34,1.56,0.64,1);
}
.toggle-track.on .toggle-knob { transform:translateX(22px); }

/* ══════════════════════════════════════════════════════════════════════
   COMPATIBILITY SCREEN
══════════════════════════════════════════════════════════════════════ */
.compat-hero {
  background:linear-gradient(158deg, #0E0E22 0%, #3A0A3A 50%, #1A0A2E 100%);
  padding:64px 22px 22px; position:relative; overflow:hidden;
}
.compat-title { font-family:'Playfair Display',serif; font-size:27px; font-weight:400; color:#FAF8F2; margin-bottom:3px; }
.compat-sub   { font-size:12px; color:rgba(250,248,242,0.35); }
.pair-display {
  display:flex; align-items:center; justify-content:center;
  gap:0; padding:20px 0 4px; position:relative; z-index:2;
}
.pair-person { display:flex; flex-direction:column; align-items:center; gap:7px; }
.pair-orb {
  width:66px; height:66px; border-radius:50%;
  display:flex; align-items:center; justify-content:center;
  font-family:'Playfair Display',serif; font-size:25px;
  box-shadow:0 4px 18px rgba(0,0,0,0.35);
  border:2.5px solid rgba(255,255,255,0.14);
}
.pair-name { font-size:12px; font-weight:500; color:rgba(250,248,242,0.68); }
.pair-sign { font-size:11px; color:rgba(250,248,242,0.38); }
.pair-connector { display:flex; flex-direction:column; align-items:center; gap:4px; margin:0 -4px; }
.pair-heart {
  width:36px; height:36px; border-radius:50%;
  background:linear-gradient(135deg,#E85090,#C82870);
  display:flex; align-items:center; justify-content:center; font-size:16px;
  box-shadow:0 0 18px rgba(232,80,144,0.45), 0 3px 10px rgba(0,0,0,0.3);
  animation:glowPulse 3s ease-in-out infinite;
  position:relative; z-index:3;
}
.pair-line { width:38px; height:1px; background:linear-gradient(90deg,rgba(200,168,75,0.3),rgba(232,80,144,0.4),rgba(200,168,75,0.3)); }
.score-belt {
  display:flex; gap:10px; padding:16px 22px 4px; position:relative; z-index:2;
}
.score-main {
  background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08);
  border-radius:16px; padding:14px 12px; display:flex; flex-direction:column;
  align-items:center; gap:5px; flex-shrink:0; min-width:92px;
}
.score-ring-wrap { position:relative; }
.score-num {
  position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
  font-family:'Playfair Display',serif; font-size:22px; color:white; line-height:1;
}
.score-lbl { font-size:9px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; color:rgba(250,248,242,0.38); text-align:center; }
.score-verdict { font-family:'Playfair Display',serif; font-size:12px; font-style:italic; color:rgba(250,248,242,0.6); text-align:center; line-height:1.35; }
.score-bars { flex:1; display:flex; flex-direction:column; gap:8px; justify-content:center; }
.sbar-row { display:flex; flex-direction:column; gap:3px; }
.sbar-top { display:flex; justify-content:space-between; }
.sbar-name { font-size:10px; color:rgba(250,248,242,0.5); }
.sbar-pct  { font-size:10px; color:rgba(200,168,75,0.8); font-weight:500; }
.sbar-track { height:5px; background:rgba(255,255,255,0.08); border-radius:3px; overflow:hidden; }
.sbar-fill  { height:100%; border-radius:3px; }
.compat-body { padding:16px 20px 0; background:#FAF8F2; }
.dk .compat-body { background:#0A0A18 !important; }
.compat-sum-card { border-radius:18px; overflow:hidden; margin-bottom:12px; box-shadow:0 4px 18px rgba(0,0,0,0.09); }
.compat-sum-hd {
  background:linear-gradient(140deg,#2A0A2A 0%,#1A0A2E 100%);
  padding:15px 17px 13px;
}
.compat-sum-lbl { font-size:10px; letter-spacing:2px; text-transform:uppercase; color:rgba(200,168,75,0.58); margin-bottom:5px; }
.compat-sum-title { font-family:'Playfair Display',serif; font-size:18px; color:#FAF8F2; line-height:1.3; }
.compat-sum-body { background:white; padding:13px 17px 15px; }
.dk .compat-sum-body { background:#13131F !important; }
.compat-sum-txt { font-size:13px; color:#2A2418; line-height:1.65; margin-bottom:11px; }
.dk .compat-sum-txt { color:#C8C0D8 !important; }
.compat-sum-txt em { color:#8B3060; font-style:italic; }
.dim-lbl { font-size:10px; font-weight:600; letter-spacing:2px; text-transform:uppercase; color:#97907F; margin-bottom:9px; }
.dk .dim-lbl { color:#7A7090 !important; }
.dim-grid { display:grid; grid-template-columns:1fr 1fr; gap:9px; margin-bottom:12px; }
.dim-card {
  background:white; border-radius:15px; padding:13px 13px;
  border:1px solid #EAE3D6; box-shadow:0 1px 6px rgba(0,0,0,0.04);
  transition:all 0.17s ease;
}
.dim-card:hover { transform:translateY(-2px); box-shadow:0 5px 16px rgba(0,0,0,0.09); }
.dim-card:active { transform:scale(0.95) !important; }
.dk .dim-card { background:#13131F !important; border-color:rgba(255,255,255,0.06) !important; }
.dim-icon { font-size:20px; margin-bottom:6px; }
.dim-name { font-size:9.5px; font-weight:600; letter-spacing:1px; text-transform:uppercase; color:#97907F; margin-bottom:4px; }
.dk .dim-name { color:#7A7090 !important; }
.dim-score-row { display:flex; align-items:center; justify-content:space-between; margin-bottom:5px; }
.dim-score { font-family:'Playfair Display',serif; font-size:20px; color:#0E0E22; }
.dk .dim-score { color:#E8E0F0 !important; }
.dim-tag { font-size:9.5px; font-weight:600; border-radius:100px; padding:2px 8px; }
.dim-bar { height:4px; background:#F0E8D6; border-radius:2px; overflow:hidden; }
.dk .dim-bar { background:#1E1E30 !important; }
.dim-bar-fill { height:100%; border-radius:2px; }
.aspect-item {
  background:white; border-radius:14px; padding:12px 14px; margin-bottom:7px;
  border:1px solid #EAE3D6; display:flex; align-items:flex-start; gap:11px;
}
.aspect-item:hover { box-shadow:0 3px 14px rgba(0,0,0,0.07); }
.dk .aspect-item { background:#13131F !important; border-color:rgba(255,255,255,0.06) !important; }
.aspect-sym { width:34px; height:34px; border-radius:50%; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-size:14px; }
.aspect-title { font-family:'Playfair Display',serif; font-size:15px; color:#0E0E22; margin-bottom:3px; }
.dk .aspect-title { color:#E8E0F0 !important; }
.aspect-desc { font-size:11.5px; color:#97907F; line-height:1.5; }
.dk .aspect-desc { color:#7A7090 !important; }
.aspect-badge { font-size:9.5px; font-weight:600; padding:2px 8px; border-radius:100px; margin-top:5px; display:inline-block; }
.share-card {
  background:linear-gradient(140deg,#1A0820 0%,#2E1040 50%,#1A1060 100%);
  border-radius:19px; padding:18px 18px; margin-bottom:12px;
  position:relative; overflow:hidden; border:1px solid rgba(200,168,75,0.14);
}
.share-card::before { content:'♥'; position:absolute; right:12px; bottom:-12px; font-size:78px; color:rgba(232,80,144,0.06); }
.share-lbl { font-size:10px; letter-spacing:2px; text-transform:uppercase; color:rgba(200,168,75,0.52); margin-bottom:5px; }
.share-title { font-family:'Playfair Display',serif; font-size:19px; color:white; margin-bottom:3px; }
.share-sub { font-size:12px; color:rgba(255,255,255,0.4); margin-bottom:13px; }
.share-btns { display:flex; gap:8px; }
.share-btn-gold {
  flex:1; height:40px; background:linear-gradient(135deg,#E2C46A,#C8A84B);
  border-radius:12px; border:none; font-family:'DM Sans',sans-serif;
  font-size:12px; font-weight:600; color:#0E0E22; cursor:pointer;
  transition:all 0.14s ease;
}
.share-btn-gold:active { transform:scale(0.95) !important; }
.share-btn-ghost {
  height:40px; padding:0 14px; background:rgba(255,255,255,0.08);
  border:1px solid rgba(255,255,255,0.14); border-radius:12px;
  font-family:'DM Sans',sans-serif; font-size:12px; color:rgba(255,255,255,0.58);
  cursor:pointer; transition:all 0.14s ease;
}
.share-btn-ghost:active { transform:scale(0.95) !important; }
.add-partner {
  background:white; border-radius:17px; padding:16px 16px; margin-bottom:12px;
  border:1.5px dashed #D4CFC4; display:flex; align-items:center; gap:13px; cursor:pointer;
  transition:all 0.2s ease;
}
.add-partner:hover { border-color:rgba(200,168,75,0.5); background:#FFFDF6; }
.add-partner:active { transform:scale(0.97) !important; }
.dk .add-partner { background:#13131F !important; border-color:rgba(255,255,255,0.1) !important; }
.add-partner-icon {
  width:42px; height:42px; border-radius:50%;
  background:rgba(200,168,75,0.08); border:1.5px dashed rgba(200,168,75,0.3);
  display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0;
}
.add-partner-title { font-size:14px; font-weight:500; color:#0E0E22; margin-bottom:2px; }
.dk .add-partner-title { color:#E8E0F0 !important; }
.add-partner-sub { font-size:11.5px; color:#97907F; }
.dk .add-partner-sub { color:#7A7090 !important; }
`;

/* ─── STAR FIELD ────────────────────────────────────────────────────────── */
function Stars({ n = 24, light = false }) {
  const stars = useRef(Array.from({ length: n }, () => ({
    x: Math.random() * 100, y: Math.random() * 100,
    s: 0.6 + Math.random() * 1.4, d: 2 + Math.random() * 4, delay: Math.random() * 3,
  }))).current;
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {stars.map((s, i) => (
        <div key={i} style={{
          position: "absolute", left: `${s.x}%`, top: `${s.y}%`,
          width: s.s, height: s.s, borderRadius: "50%",
          background: light ? "rgba(14,14,34,0.5)" : "white",
          opacity: 0.3 + Math.random() * 0.5,
          animation: `twinkle ${s.d}s ${s.delay}s ease-in-out infinite`,
        }} />
      ))}
    </div>
  );
}

/* ─── BIRTH CHART SVG ───────────────────────────────────────────────────── */
function ChartWheel({ size = 276 }) {
  const c = size / 2;
  const signs = ["♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓"];
  const planets = [
    { g: "☉", a: 247, col: "#F0C040" },{ g: "☽", a: 166, col: "#C8D4E8" },
    { g: "♀", a: 222, col: "#E8A0C0" },{ g: "♂", a: 86, col: "#E86050" },
    { g: "☿", a: 252, col: "#A8C0C0" },{ g: "♃", a: 140, col: "#C0A860" },
    { g: "♄", a: 36, col: "#A89878" }, { g: "♅", a: 312, col: "#80C8C0" },
  ];
  const rad = (deg) => (deg - 90) * Math.PI / 180;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {[128, 110, 76, 50, 33].map((r, i) => (
        <circle key={i} cx={c} cy={c} r={r} fill="none"
          stroke={`rgba(200,168,75,${0.22 - i * 0.04})`} strokeWidth="0.6" />
      ))}
      {Array.from({ length: 12 }, (_, i) => {
        const a = rad(i * 30);
        return <line key={i} x1={c + 33 * Math.cos(a)} y1={c + 33 * Math.sin(a)}
          x2={c + 110 * Math.cos(a)} y2={c + 110 * Math.sin(a)}
          stroke="rgba(200,168,75,0.1)" strokeWidth="0.5" />;
      })}
      {signs.map((s, i) => {
        const a = rad(i * 30 + 15);
        return <text key={i} x={c + 119 * Math.cos(a)} y={c + 119 * Math.sin(a)}
          textAnchor="middle" dominantBaseline="middle" fontSize="9.5" fill="rgba(200,168,75,0.52)">{s}</text>;
      })}
      {[[0,2],[0,4],[2,5],[1,3],[4,6]].map(([a, b], i) => {
        const ra = rad(planets[a].a), rb = rad(planets[b].a);
        return <line key={i}
          x1={c + 76 * Math.cos(ra)} y1={c + 76 * Math.sin(ra)}
          x2={c + 76 * Math.cos(rb)} y2={c + 76 * Math.sin(rb)}
          stroke="rgba(200,168,75,0.09)" strokeWidth="0.5" strokeDasharray="2,3" />;
      })}
      {planets.map((p, i) => {
        const a = rad(p.a), x = c + 90 * Math.cos(a), y = c + 90 * Math.sin(a);
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={11.5} fill="rgba(14,14,34,0.88)" stroke={`${p.col}4A`} strokeWidth="1" />
            <text x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize="10" fill={p.col}>{p.g}</text>
          </g>
        );
      })}
      <circle cx={c} cy={c} r={26} fill="rgba(200,168,75,0.06)" stroke="rgba(200,168,75,0.2)" strokeWidth="0.6" />
      <text x={c} y={c - 5} textAnchor="middle" fontSize="17" fill="rgba(200,168,75,0.78)">♓</text>
      <text x={c} y={c + 11} textAnchor="middle" fontSize="7" fill="rgba(250,248,242,0.24)" letterSpacing="1.8">ASC</text>
    </svg>
  );
}

/* ─── STATUS BAR ────────────────────────────────────────────────────────── */
function SB({ light }) {
  const c = light ? "rgba(250,248,242,0.88)" : "rgba(14,14,34,0.82)";
  return (
    <>
      <div className="island" />
      <div className="statusbar">
        <span className="sb-time" style={{ color: c }}>9:41</span>
        <div className="sb-icons" style={{ color: c }}>
          <span style={{fontSize:11}}>●●●</span>
          <span style={{fontSize:11}}>WiFi</span>
          <span style={{fontSize:11}}>▮</span>
        </div>
      </div>
    </>
  );
}

/* ─── TAB BAR ───────────────────────────────────────────────────────────── */
const TABS_DEF = [
  { g: "◎", l: "Today"   },
  { g: "✦", l: "Chart"   },
  { g: "☽", l: "Sky"     },
  { g: "♡", l: "Match"   },
  { g: "✧", l: "Ask AI"  },
  { g: "◑", l: "Reports" },
];
function TabBar({ active, onTab }) {
  return (
    <div className="tabbar">
      {TABS_DEF.map((t, i) => {
        const on = active === i;
        return (
          <div key={i} className="tab press" onClick={() => onTab(i)}>
            <div className={`tab-bubble ${on ? "on" : ""}`}>
              <span className="tab-glyph" style={{ color: on ? T.gold : "#C0B8A4", fontSize: on ? 20 : 18 }}>{t.g}</span>
            </div>
            <span className="tab-text" style={{ color: on ? T.navy : "#C0B8A4" }}>{t.l}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   SCREEN COMPONENTS
══════════════════════════════════════════════════════════════════════════ */

/* SPLASH */
function Splash() {
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <SB light />
      <div className="splash-bg">
        <Stars n={34} />
        <div className="splash-halo" />
        <div className="splash-orb-system">
          <div className="splash-ring splash-ring-3">
            <div className="splash-ring-dot" />
            <div className="splash-ring-dot-sm" style={{ bottom: -2, left: -2, top: "auto", right: "auto" }} />
          </div>
          <div className="splash-ring splash-ring-2" />
          <div className="splash-ring splash-ring-1">
            <div className="splash-ring-dot" />
          </div>
          <div className="splash-sun" />
        </div>
        <div className="splash-wordmark">Celestia</div>
        <div className="splash-tagline">Navigate your cosmos</div>
        <div className="splash-btn-wrap">
          <button className="splash-cta press">Begin Your Journey ✦</button>
          <div className="splash-login-text">Already exploring? <span>Sign in</span></div>
        </div>
      </div>
    </div>
  );
}

/* ONBOARD 1 — BIRTH DATA */
function OB1() {
  const [focus, setFocus] = useState("name");
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <SB />
      <div className="onb">
        <div className="onb-nav">
          <div className="onb-back press">‹</div>
          <div className="prog-track"><div className="prog-fill" style={{ width: "33%" }} /></div>
          <div className="onb-step">1 of 3</div>
        </div>
        <div className="onb-h1">Tell us when you<br /><em>entered the world</em></div>
        <div className="onb-body">Your exact birth details allow us to cast a precise natal chart — the celestial blueprint of your entire life.</div>
        <div className="fgroup">
          <label className="flabel">Your Name</label>
          <div className={`finput ${focus === "name" ? "focused" : "filled"}`} onClick={() => setFocus("name")}>
            <span className="finput-val">Sofia Marchetti{focus === "name" && <span className="cursor-blink" />}</span>
          </div>
        </div>
        <div className="frow" style={{ marginBottom: 13 }}>
          <div className="fgroup" style={{ marginBottom: 0 }}>
            <label className="flabel">Date of Birth</label>
            <div className="finput filled">
              <span className="finput-val">Mar 14, 1997</span>
              <span className="finput-ic">📅</span>
            </div>
          </div>
          <div className="fgroup" style={{ marginBottom: 0 }}>
            <label className="flabel">Birth Time</label>
            <div className={`finput ${focus === "time" ? "focused" : ""}`} onClick={() => setFocus("time")}>
              <span className="finput-ph">07:30 AM</span>
              <span className="finput-ic">⏰</span>
            </div>
          </div>
        </div>
        <div className="fgroup">
          <label className="flabel">City of Birth</label>
          <div className={`finput ${focus === "city" ? "focused" : ""}`} onClick={() => setFocus("city")}>
            <span className="finput-ph">Search birthplace...</span>
            <span className="finput-ic">⌕</span>
          </div>
        </div>
        <div className="hint">
          <span className="hint-ic">🕐</span>
          <div className="hint-txt">Birth time determines your Rising sign and house placements. If unknown, we'll calculate a noon chart and note reduced accuracy.</div>
        </div>
        <button className="pbtn press">Continue →</button>
      </div>
    </div>
  );
}

/* ONBOARD 2 — PERSONA */
function OB2() {
  const [sel, setSel] = useState(0);
  const [depth, setDepth] = useState(1);
  const personas = [
    { icon: "🌙", bg: "#F2ECF8", name: "Poetic", desc: "Lyrical, evocative. Rich in metaphor and imagery." },
    { icon: "🧠", bg: "#EAF0F8", name: "Psychological", desc: "Therapeutic lens. Self-reflective depth." },
    { icon: "⚡", bg: "#FFF2E4", name: "Direct", desc: "Clear and actionable. No mystical fluff." },
    { icon: "✨", bg: "#F8F8E8", name: "Spiritual", desc: "Soul-focused. Karmic growth & purpose." },
  ];
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <SB />
      <div className="onb">
        <div className="onb-nav">
          <div className="onb-back press">‹</div>
          <div className="prog-track"><div className="prog-fill" style={{ width: "66%" }} /></div>
          <div className="onb-step">2 of 3</div>
        </div>
        <div className="onb-h1">How should your<br /><em>readings feel?</em></div>
        <div className="onb-body">Celestia tailors all AI readings to your chosen style and depth. You can update this any time in Settings.</div>
        <div className="pgrid">
          {personas.map((p, i) => (
            <div key={i} className={`pcard press ${sel === i ? "on" : ""}`} onClick={() => setSel(i)}>
              <div className="pcard-top">
                <div className="pcard-icon" style={{ background: p.bg }}>{p.icon}</div>
                {sel === i && <div className="pcard-check">✓</div>}
              </div>
              <div className="pcard-name">{p.name}</div>
              <div className="pcard-desc">{p.desc}</div>
            </div>
          ))}
        </div>
        <div className="onb-body" style={{ marginBottom: 8 }}>Depth preference</div>
        <div className="dtoggle">
          {["Beginner", "Enthusiast", "Expert"].map((d, i) => (
            <button key={i} className={`dbtn ${depth === i ? "on" : ""}`} onClick={() => setDepth(i)}>{d}</button>
          ))}
        </div>
        <button className="pbtn press">Continue →</button>
      </div>
    </div>
  );
}

/* ONBOARD 3 — CHART REVEAL */
function OB3() {
  const planets = [
    { sym: "☽", style: { top: -16, left: "50%", transform: "translateX(-50%)" } },
    { sym: "♀", style: { top: 46, right: -16 } },
    { sym: "♂", style: { bottom: 46, right: -16 } },
    { sym: "♃", style: { bottom: -16, left: "50%", transform: "translateX(-50%)" } },
    { sym: "☉", style: { bottom: 46, left: -16 } },
    { sym: "♄", style: { top: 46, left: -16 } },
  ];
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <SB light />
      <div className="welcome-bg">
        <Stars n={22} />
        <div className="welcome-cosmos" style={{ marginTop: 16 }}>
          <div className="wc-ring wc-ring-1">
            <div className="wc-ring-dot" />
          </div>
          <div className="wc-ring wc-ring-2" />
          <div className="wc-ring wc-ring-3" />
          <div className="welcome-zodiac">
            {planets.map((p, i) => (
              <div key={i} style={{
                position: "absolute", width: 32, height: 32, borderRadius: "50%",
                background: "rgba(14,14,34,0.88)", border: "1px solid rgba(200,168,75,0.35)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
                animation: `bounceIn 0.4s ${0.3 + i * 0.09}s ease both`, ...p.style,
              }}>{p.sym}</div>
            ))}
            <div style={{ textAlign: "center", zIndex: 2 }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 52, color: T.gold, lineHeight: 1, textShadow: `0 0 28px ${T.gold}55` }}>♓</div>
              <div style={{ fontSize: 8, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: "rgba(250,248,242,0.28)", marginTop: 4 }}>RISING</div>
            </div>
          </div>
        </div>
        <div className="welcome-name-text">Welcome, Sofia ✦</div>
        <div className="welcome-big3">
          <div className="b3pill">☉ Pisces</div>
          <div className="b3pill">☽ Scorpio</div>
          <div className="b3pill">↑ Virgo</div>
        </div>
        <div className="welcome-desc">A Pisces sun, Scorpio moon, and Virgo rising — an intuitive soul who moves between worlds, feeling everything deeply while navigating with quiet precision.</div>
        <div style={{ width: "100%" }}>
          <button className="gold-btn press">Enter Your Chart →</button>
        </div>
      </div>
    </div>
  );
}

/* HOME */
function Home({ onTab }) {
  return (
    <div style={{ position: "absolute", inset: 0, background: T.cream }}>
      <SB light />
      <div className="scroller">
        <div style={{ paddingBottom: 92 }}>
          <div className="home-hero">
            <div className="home-hero-glow" />
            <Stars n={14} />
            <div className="home-greeting">Sunday, March 8, 2026</div>
            <div className="home-name-row">
              <div className="home-name">Good morning, Sofia</div>
              <div className="home-avi press">S</div>
            </div>
            <div className="moon-strip">
              <span style={{ fontSize: 18 }}>🌒</span>
              <div className="moon-strip-txt">Waxing Crescent · <strong>Taurus 18°</strong> · 18% illuminated</div>
            </div>
          </div>
          <div className="home-bg-fade" />
          <div style={{ padding: "18px 19px 0" }}>
            {/* Daily card */}
            <div className="daily-card">
              <div className="daily-hd">
                <div className="daily-date-txt">Today's Personal Reading</div>
                <div className="daily-headline">Mars stirs ambition in your 10th house</div>
                <div className="tchips">
                  <div className="tchip">♂ Cap 11°</div>
                  <div className="tchip">☿ △ ♃</div>
                  <div className="tchip">☽ ♉</div>
                  <div className="tchip">☉ ♓ 17°</div>
                </div>
              </div>
              <div className="daily-body">
                <div className="daily-txt">
                  With Mars transiting your 10th house, ambition surges quietly but powerfully. <em>This is not the time to wait for permission.</em> Mercury's trine to your natal Jupiter opens conversations that could shift your trajectory — speak with authority today.
                </div>
                <div className="daily-acts">
                  <button className="btn-outline press" onClick={() => onTab && onTab(3)}>💬 Ask AI</button>
                  <button className="btn-fill press">Full Reading →</button>
                </div>
              </div>
            </div>

            {/* Energy */}
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", color: T.stone, marginBottom: 11, marginTop: 20 }}>Today's Energy</div>
            <div className="egrid">
              {[
                { e: "💼", t: "Career", v: "Expansive", p: 82 },
                { e: "❤️", t: "Love", v: "Reflective", p: 44 },
                { e: "🔋", t: "Vitality", v: "Steady", p: 68 },
              ].map((x, i) => (
                <div key={i} className="ecard press">
                  <div className="ecard-icon">{x.e}</div>
                  <div className="ecard-tag">{x.t}</div>
                  <div className="ecard-val">{x.v}</div>
                  <div className="ebar"><div className="ebar-fill" style={{ width: `${x.p}%` }} /></div>
                </div>
              ))}
            </div>

            {/* Planets */}
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", color: T.stone, marginBottom: 10 }}>Sky Now</div>
            <div className="pstrip">
              {[
                { g: "☉", n: "Sun", p: "Pisces 17°" },
                { g: "☽", n: "Moon", p: "Taurus 23°" },
                { g: "♂", n: "Mars", p: "Cap 11°" },
                { g: "♀", n: "Venus", p: "Aries 4°" },
                { g: "☿", n: "Mercury", p: "Pisces 2°" },
                { g: "♃", n: "Jupiter", p: "Gemini 14°" },
                { g: "♄", n: "Saturn", p: "Pisces 8°" },
                { g: "♆", n: "Neptune", p: "Aries 0°" },
              ].map((p, i) => (
                <div key={i} className="pchip press">
                  <div className="pchip-glyph">{p.g}</div>
                  <div>
                    <div className="pchip-name">{p.n}</div>
                    <div className="pchip-pos">{p.p}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Journal prompt */}
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", color: T.stone, marginBottom: 10 }}>Today's Reflection</div>
            <div className="journal-card">
              <div className="jcard-header">
                <div className="jcard-title">AI Journal Prompt</div>
                <div className="jcard-badge">Mars transit</div>
              </div>
              <div className="jcard-prompt">"Where in your life have you been waiting for permission that only you can grant yourself?"</div>
              <button className="jcard-btn press">Open Journal ›</button>
            </div>

            {/* Promo */}
            <div className="promo press">
              <div className="promo-lbl">✦ Personalized for you</div>
              <div className="promo-title">Your Year Ahead 2026</div>
              <div className="promo-sub">Jupiter enters your 2nd house in April</div>
              <div className="promo-row">
                <div><span className="promo-price">$9.99</span><span className="promo-was">$14.99</span></div>
                <div className="promo-cta">Get Report →</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <TabBar active={0} onTab={onTab} />
    </div>
  );
}

/* BIRTH CHART */
function Chart({ onTab }) {
  const [tab, setTab] = useState(0);
  const placements = [
    { g: "☉", pl: "Sun",     sg: "Pisces",    deg: "17°24'", h: "7th" },
    { g: "☽", pl: "Moon",    sg: "Scorpio",   deg: "3°41'",  h: "3rd" },
    { g: "↑", pl: "Rising",  sg: "Virgo",     deg: "28°12'", h: "1st" },
    { g: "♀", pl: "Venus",   sg: "Aquarius",  deg: "8°55'",  h: "6th" },
    { g: "♂", pl: "Mars",    sg: "Capricorn", deg: "11°33'", h: "5th" },
    { g: "☿", pl: "Mercury", sg: "Pisces",    deg: "2°07'",  h: "7th" },
    { g: "♃", pl: "Jupiter", sg: "Gemini",    deg: "14°21'", h: "10th" },
    { g: "♄", pl: "Saturn",  sg: "Pisces",    deg: "8°44'",  h: "7th" },
    { g: "♆", pl: "Neptune", sg: "Aries",     deg: "0°12'",  h: "8th" },
  ];
  return (
    <div style={{ position: "absolute", inset: 0, background: T.cream }}>
      <SB light />
      <div className="scroller">
        <div style={{ paddingBottom: 92 }}>
          <div className="chart-hero">
            <div className="chart-hero-glow" />
            <Stars n={16} />
            <div className="chart-top-row">
              <div className="chart-screen-title">Birth Chart</div>
              <div className="house-pill press">Placidus ⌄</div>
            </div>
            <ChartWheel size={276} />
          </div>
          <div className="chart-tabs-bar">
            {["Planets", "Houses", "Aspects", "Notes"].map((t, i) => (
              <button key={i} className={`ctab ${tab === i ? "on" : ""}`} onClick={() => setTab(i)}>{t}</button>
            ))}
          </div>
          <div className="placement-list">
            {placements.map((p, i) => (
              <div key={i} className="plrow press" style={{ animation: `fadeUp 0.4s ${i * 0.05}s ease both` }}>
                <div className="plrow-icon">{p.g}</div>
                <div className="plrow-body">
                  <div className="plrow-planet">{p.pl}</div>
                  <div className="plrow-sign">{p.sg}</div>
                </div>
                <div className="plrow-meta">
                  <div className="plrow-deg">{p.deg}</div>
                  <div className="plrow-house">{p.h} House</div>
                </div>
                <div className="plrow-arrow">›</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <TabBar active={1} onTab={onTab} />
    </div>
  );
}

/* TRANSITS */
function Transits({ onTab }) {
  const [open, setOpen] = useState(0);
  const data = [
    { p1: "☿", p2: "♃", asp: "Trine", label: "Mercury trine natal Jupiter", orb: "1.2°", intensity: 4, text: "Mercury trining your natal Jupiter is among the most auspicious aspects for communication and broad thinking. Ideas flow with natural clarity and land with conviction. Your Pisces intuition is sharpened into something concrete and persuasive. Excellent for presentations, negotiations, and pitching creative visions.", dur: "Exact Mar 9 · 0.8° orb" },
    { p1: "♂", p2: "♑", asp: "10th House Transit", label: "Mars moving through career sector", orb: "11° in", intensity: 3, text: "Mars energizes your sector of career and public reputation. Drive and ambition operate just beneath the surface — this is disciplined, strategic ambition rather than reactive force. An excellent period to initiate professional moves you've been building toward.", dur: "Active · Ends Apr 3" },
    { p1: "♄", p2: "☉", asp: "Conjunction", label: "Saturn conjunct natal Sun", orb: "3.4°", intensity: 2, text: "A significant, slow-moving transit. Saturn demands you build something real and lasting. Shortcuts dissolve. Identity is being refined through pressure — what survives this period will be genuinely and permanently yours.", dur: "Separating · Mar–May 2026" },
    { p1: "☽", p2: "♉", asp: "Moon Transit", label: "Moon moving through 9th House", orb: "23°", intensity: 3, text: "Moon in Taurus activates your 9th house of philosophy, learning, and long-range thinking. A day for grounded wisdom over reactive emotion. Good for reading, study, and quiet reflection.", dur: "Daily transit · Ends 11:44 PM" },
    { p1: "♆", p2: "♈", asp: "Ingress", label: "Neptune entering Aries", orb: "0°", intensity: 3, text: "Neptune's once-per-generation move into Aries marks a collective awakening around identity, sovereignty, and spiritual courage. For you, this activates your 8th house — expect subtle but profound shifts in how you relate to power, shared resources, and transformation.", dur: "Generational · 2025–2039" },
  ];
  return (
    <div style={{ position: "absolute", inset: 0, background: T.cream }}>
      <SB light />
      <div className="scroller">
        <div>
          <div className="transit-hero">
            <Stars n={12} />
            <div className="transit-title">Live Transits</div>
            <div className="transit-sub">Planetary influences active in your chart right now</div>
          </div>
          <div className="transit-list">
            {data.map((t, i) => (
              <div key={i} className="tcard" style={{ animation: `fadeUp 0.4s ${i * 0.06}s ease both` }}>
                <div className="tcard-head" onClick={() => setOpen(open === i ? -1 : i)}>
                  <div className="ticons">
                    <div className="ticon">{t.p1}</div>
                    <div className="ticon">{t.p2}</div>
                  </div>
                  <div className="tinfo">
                    <div className="taspect">{t.asp}</div>
                    <div className="tplanets">{t.label}</div>
                    <div className="tintensity">
                      {[0,1,2,3,4].map(d => <div key={d} className={`tidot ${d < t.intensity ? "" : "off"}`} />)}
                    </div>
                  </div>
                  <div className="torb">{t.orb}</div>
                  <div className={`tchev ${open === i ? "open" : ""}`}>⌄</div>
                </div>
                {open === i && (
                  <div className="tcard-body">
                    <div className="tbody-txt">{t.text}</div>
                    <div className="tbody-meta">
                      <div className="tbody-dur">📅 {t.dur}</div>
                      <button className="tbody-ai press">Ask AI ›</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <TabBar active={2} onTab={onTab} />
    </div>
  );
}

/* AI CHAT */
function AskAI({ onTab }) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setPhase(1), 2000);
    const t2 = setTimeout(() => setPhase(2), 2400);
    return () => { clearTimeout(t); clearTimeout(t2); };
  }, []);
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div className="chat-wrap">
        <SB />
        <div className="chat-hd">
          <div className="chat-ai-row">
            <div className="chat-orb">
              ✦
              <div className="chat-orb-dot" />
            </div>
            <div>
              <div className="chat-ai-name">Celestia AI</div>
              <div className="chat-ai-sub">Chart-aware · Always listening</div>
            </div>
            <div className="free-pill">FREE ∞</div>
          </div>
          <div className="ctx-bar">
            <div className="ctx-chip">☉ Pisces</div>
            <div className="ctx-chip">☽ Scorpio</div>
            <div className="ctx-chip">↑ Virgo</div>
            <div className="ctx-chip">Mars 10H</div>
            <div className="ctx-chip">☿ △ ♃</div>
            <div className="ctx-chip">Saturn Rx</div>
          </div>
        </div>
        <div className="chat-msgs">
          <div className="mrow" style={{ animation: "fadeUp 0.4s ease" }}>
            <div className="morb ai">✦</div>
            <div style={{ maxWidth: "73%" }}>
              <div className="mbub ai">Good morning, Sofia. Mars is activating your 10th house today — the sector of career and public life. With your <em>natal Moon in Scorpio</em>, this registers as deep, private ambition rather than a loud push. What's on your mind?</div>
              <div className="mtime">9:12 AM</div>
            </div>
          </div>
          <div className="mrow user" style={{ animation: "fadeUp 0.4s 0.1s ease both" }}>
            <div className="morb usr">S</div>
            <div style={{ maxWidth: "73%" }}>
              <div className="mbub usr">I have a big presentation at work today. Is now a good time?</div>
              <div className="mtime r">9:14 AM</div>
            </div>
          </div>
          {phase === 1 && (
            <div className="mrow" style={{ animation: "fadeIn 0.3s ease" }}>
              <div className="morb ai">✦</div>
              <div className="typing-wrap">
                <div className="tdot" /><div className="tdot" /><div className="tdot" />
              </div>
            </div>
          )}
          {phase >= 2 && (
            <div className="mrow" style={{ animation: "fadeUp 0.35s ease" }}>
              <div className="morb ai">✦</div>
              <div style={{ maxWidth: "73%" }}>
                <div className="mbub ai">Yes — and here's why this is auspicious <em>specifically for you</em>. Mercury trines your natal Jupiter today, making communication land with weight and ease. The Taurus moon grounds your Pisces fluency into something concrete. Go in prepared, then trust your intuition in the room — it knows more than your notes do.</div>
                <div className="mtime">9:14 AM</div>
              </div>
            </div>
          )}
        </div>
        <div className="suggest-strip">
          {["What does Venus in Aquarius mean for me?", "When is Mercury retrograde?", "My Saturn return — when?"].map((s, i) => (
            <div key={i} className="schip press">{s}</div>
          ))}
        </div>
        <div className="chat-input-bar">
          <div className="chat-input-field">Ask anything about your chart...</div>
          <button className="chat-send press">↑</button>
        </div>
      </div>
    </div>
  );
}

/* REPORTS */
function Reports({ onTab, onDetail }) {
  const tiles = [
    { bg: "linear-gradient(135deg,#667eea,#764ba2)", e: "🌟", n: "Natal Chart",    d: "Your full cosmic blueprint",    p: "$4.99" },
    { bg: "linear-gradient(135deg,#f093fb,#f5576c)", e: "❤️", n: "Compatibility", d: "Synastry + composite chart",      p: "$6.99" },
    { bg: "linear-gradient(135deg,#4facfe,#00f2fe)", e: "🌙", n: "Solar Return",  d: "Your birthday year forecast",    p: "$6.99" },
    { bg: "linear-gradient(135deg,#43e97b,#38f9d7)", e: "💼", n: "Career Report", d: "Purpose & vocational path",      p: "$6.99" },
    { bg: "linear-gradient(135deg,#fa709a,#fee140)", e: "🪐", n: "Saturn Return", d: "Ages 27–31 deep dive",           p: "$6.99" },
    { bg: "linear-gradient(135deg,#a18cd1,#fbc2eb)", e: "🌗", n: "Lunar Guide",   d: "Monthly moon ritual guide",      p: "$2.99" },
    { bg: "linear-gradient(135deg,#f6d365,#fda085)", e: "🌑", n: "Eclipse Guide", d: "Personal eclipse impact",        p: "$3.99" },
    { bg: "linear-gradient(135deg,#84fab0,#8fd3f4)", e: "💬", n: "Retro Guide",   d: "Mercury retrograde survival",    p: "$1.99" },
  ];
  return (
    <div style={{ position: "absolute", inset: 0, background: T.cream }}>
      <SB />
      <div className="scroller">
        <div style={{ paddingBottom: 92 }}>
          <div className="reports-top">
            <div className="reports-h1">Reports</div>
            <div className="reports-sub">AI-generated deep-dives from your exact natal chart.<br />Pay once. Yours forever.</div>
          </div>
          <div className="featured-wrap press" onClick={onDetail}>
            <div className="featured-img">
              <Stars n={12} />
              <div className="featured-badge-chip">⭐ Most Popular</div>
              <div className="featured-yr">2026</div>
            </div>
            <div className="featured-body">
              <div className="featured-title">Year Ahead Forecast 2026</div>
              <div className="featured-desc">Month-by-month: transits, progressions, eclipse impacts, and key dates tailored to your exact natal chart.</div>
              <div className="featured-foot">
                <div><span className="featured-price">$9.99</span><span className="featured-was">$14.99</span></div>
                <button className="btn-fill press" style={{ height: 40, padding: "0 20px", borderRadius: 12 }}>Get Report</button>
              </div>
            </div>
          </div>

          {/* Bundles */}
          <div className="bundle-strip">
            <div className="bundle-lbl">Value Bundles</div>
            {[
              { n: "Relationship Pack", inc: "Compatibility + Love Report", p: "$12.99" },
              { n: "Full Year Pack", inc: "Year Ahead + Solar Return + 2× Monthly", p: "$14.99" },
              { n: "Deep Dive Pack", inc: "Natal + Year Ahead + Compatibility", p: "$19.99" },
            ].map((b, i) => (
              <div key={i} className="bundle-card press">
                <div>
                  <div className="bundle-name">{b.n}</div>
                  <div className="bundle-includes">{b.inc}</div>
                </div>
                <div className="bundle-price">{b.p}</div>
              </div>
            ))}
          </div>

          <div style={{ padding: "0 20px", fontSize: 10, fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", color: T.stone, marginBottom: 10 }}>All Reports</div>
          <div className="report-grid">
            {tiles.map((r, i) => (
              <div key={i} className="rtile press" style={{ animation: `fadeUp 0.4s ${i * 0.04}s ease both` }}>
                <div className="rtile-color" style={{ background: r.bg }}><span>{r.e}</span></div>
                <div className="rtile-body">
                  <div className="rtile-name">{r.n}</div>
                  <div className="rtile-desc">{r.d}</div>
                  <div className="rtile-price">{r.p}<span className="rtile-unit">one-time</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <TabBar active={5} onTab={onTab} />
    </div>
  );
}

/* REPORT DETAIL */
function ReportDetail({ onBack }) {
  const chapters = [
    { n: "1", t: "2026 Overview",         prev: "Jupiter enters your 2nd house in April, bringing financial expansion and deepened self-worth...",        locked: false },
    { n: "2", t: "January — March",       prev: "Saturn stations in your 7th house — relationships crystallize into something real or dissolve under pressure...", locked: false },
    { n: "3", t: "April — June",          prev: "The Jupiter–Neptune conjunction in Aries activates your 8th house of shared resources...",               locked: true },
    { n: "4", t: "July — September",      prev: "Mars retrograde in Leo activates your 12th house — internalized ambition, retreat, reflection...",        locked: true },
    { n: "5", t: "October — December",    prev: "Eclipse season strikes your natal nodes — fated connections and releases are imminent...",                 locked: true },
    { n: "6", t: "Love & Relationships",  prev: "Venus spends an extended stay in your 5th house of romance and creative self-expression...",             locked: true },
    { n: "7", t: "Career & Finances",     prev: "Your solar arc Midheaven moves into Gemini — a fundamental shift in your public identity...",            locked: true },
    { n: "8", t: "Health & Wellbeing",    prev: "Neptune activates the 6th house — subtle undermining or inspired healing depending on your attention...", locked: true },
    { n: "9", t: "Spiritual Growth",      prev: "The North Node moves into Pisces — your destiny this year is deeply woven with surrender and faith...",   locked: true },
  ];
  return (
    <div style={{ position: "absolute", inset: 0, background: T.cream }}>
      <SB light />
      <div className="scroller" style={{ paddingBottom: 0 }}>
        <div className="rdetail-hero">
          <div className="rdh-rings">
            <div className="rdh-ring" style={{ width: 280, height: 280, top: -88, right: -88 }} />
            <div className="rdh-ring" style={{ width: 200, height: 200, top: -50, right: -50 }} />
            <div className="rdh-ring" style={{ width: 130, height: 130, top: -14, right: -14 }} />
          </div>
          <Stars n={18} />
          <div className="back-btn press" onClick={onBack}>‹</div>
          <div className="rdh-label">✦ Year Ahead Forecast</div>
          <div className="rdh-title">Your 2026<br />Cosmic Map</div>
          <div className="rdh-meta">
            <div className="rdh-tag">📄 9 chapters</div>
            <div className="rdh-tag">⏱ 45 min read</div>
            <div className="rdh-tag">🤖 AI-crafted</div>
            <div className="rdh-tag">🔒 Forever yours</div>
          </div>
        </div>
        <div className="rdetail-body">
          <div className="chapters-lbl">Chapter Preview</div>
          {chapters.map((c, i) => (
            <div key={i} className="chrow press" style={{ animation: `fadeUp 0.4s ${i * 0.04}s ease both` }}>
              <div className="chnum">{c.n}</div>
              <div className="chbody">
                <div className="chtitle">{c.t}</div>
                <div className="chpreview">{c.prev}</div>
              </div>
              {c.locked ? <div className="chlock">🔒</div> : <div className="chfree">PREVIEW</div>}
            </div>
          ))}
        </div>
        <div className="purchase-footer">
          <div className="pf-pricing">
            <div className="pf-was">Regular $14.99</div>
            <div className="pf-price">$9.99</div>
          </div>
          <button className="pf-btn press">Unlock Report ✦</button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   COMPATIBILITY SCREEN — FREE · VIRAL CARD · ALL MICRO-INTERACTIONS
══════════════════════════════════════════════════════════════════════════ */
function ScoreArc({ score, size = 80, color = "#C8A84B" }) {
  const r = (size - 10) / 2, cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={`${filled} ${circ}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 1.2s cubic-bezier(0.34,1.1,0.64,1)" }} />
    </svg>
  );
}

function CompatViralCard({ personA, personB, score, tagline, highlights }) {
  const [pressed, setPressed] = useState(false);
  const [shared, setShared] = useState(false);
  const [heartBurst, setHeartBurst] = useState(false);

  const handleShare = () => {
    setShared(true);
    setHeartBurst(true);
    setTimeout(() => setHeartBurst(false), 700);
    setTimeout(() => setShared(false), 2200);
  };

  return (
    <div
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{
        borderRadius: 24,
        background: "linear-gradient(145deg, #1A0830 0%, #2E1055 40%, #1A1060 75%, #0C1E3C 100%)",
        border: "1px solid rgba(200,168,75,0.2)",
        padding: "22px 20px 20px",
        position: "relative", overflow: "hidden",
        transform: pressed ? "scale(0.975)" : "scale(1)",
        transition: "transform 0.15s cubic-bezier(0.34,1.2,0.64,1), box-shadow 0.2s ease",
        boxShadow: pressed
          ? "0 4px 20px rgba(0,0,0,0.35)"
          : "0 10px 40px rgba(0,0,0,0.35), 0 0 0 1px rgba(200,168,75,0.1)",
        cursor: "pointer", userSelect: "none",
        marginBottom: 14,
      }}
    >
      {/* Animated nebula bg */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 220px 160px at 30% 40%, rgba(180,80,200,0.1) 0%, transparent 60%), radial-gradient(ellipse 180px 180px at 75% 60%, rgba(80,120,220,0.08) 0%, transparent 60%)",
      }} />

      {/* FREE badge */}
      <div style={{
        position: "absolute", top: 14, right: 14,
        background: "linear-gradient(135deg,#E2C46A,#C8A84B)", borderRadius: 100,
        padding: "3px 11px", fontSize: 9, fontWeight: 700,
        letterSpacing: 1.2, textTransform: "uppercase", color: "#0E0E22",
      }}>FREE ✦</div>

      {/* Pair header */}
      <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 16, position: "relative", zIndex: 2 }}>
        {/* Person A */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: personA.gradient, border: "2.5px solid rgba(255,255,255,0.18)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'Playfair Display',serif", fontSize: 22, color: "white",
            boxShadow: "0 4px 16px rgba(0,0,0,0.35)",
            animation: "float 5s ease-in-out infinite",
          }}>{personA.initial}</div>
          <div style={{ fontSize: 11, fontWeight: 500, color: "rgba(250,248,242,0.65)", textAlign: "center" }}>{personA.name}</div>
          <div style={{ fontSize: 10, color: "rgba(250,248,242,0.38)" }}>{personA.sign}</div>
        </div>

        {/* Connector */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, position: "relative" }}>
          <div style={{ width: "100%", height: 1, background: "linear-gradient(90deg, rgba(200,168,75,0.25), rgba(232,80,144,0.5), rgba(200,168,75,0.25))" }} />
          <div style={{
            width: 38, height: 38, borderRadius: "50%",
            background: "linear-gradient(135deg,#E85090,#C82870)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 17, boxShadow: "0 0 20px rgba(232,80,144,0.5), 0 3px 12px rgba(0,0,0,0.3)",
            position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
            animation: `${heartBurst ? "bounceIn" : "glowPulse"} ${heartBurst ? "0.5s" : "3s"} ease ${heartBurst ? "both" : "infinite"}`,
          }}>♥</div>
          <div style={{ width: "100%", height: 1, background: "linear-gradient(90deg, rgba(200,168,75,0.25), rgba(232,80,144,0.5), rgba(200,168,75,0.25))", marginTop: 28 }} />
        </div>

        {/* Person B */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: personB.gradient, border: "2.5px solid rgba(255,255,255,0.18)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'Playfair Display',serif", fontSize: 22, color: "white",
            boxShadow: "0 4px 16px rgba(0,0,0,0.35)",
            animation: "float 5.5s 0.4s ease-in-out infinite",
          }}>{personB.initial}</div>
          <div style={{ fontSize: 11, fontWeight: 500, color: "rgba(250,248,242,0.65)", textAlign: "center" }}>{personB.name}</div>
          <div style={{ fontSize: 10, color: "rgba(250,248,242,0.38)" }}>{personB.sign}</div>
        </div>
      </div>

      {/* Score + tagline */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16, position: "relative", zIndex: 2 }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <ScoreArc score={score} size={76} color={score >= 80 ? "#C8A84B" : score >= 60 ? "#A870D0" : "#E85090"} />
          <div style={{
            position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
            fontFamily: "'Playfair Display',serif", fontSize: 22, color: "white", lineHeight: 1,
            textAlign: "center",
          }}>
            <div>{score}</div>
            <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: 1, color: "rgba(250,248,242,0.4)", marginTop: 1 }}>/ 100</div>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: "rgba(200,168,75,0.6)", marginBottom: 5 }}>
            Overall Compatibility
          </div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, fontStyle: "italic", color: "rgba(250,248,242,0.9)", lineHeight: 1.35 }}>
            {tagline}
          </div>
        </div>
      </div>

      {/* Highlight chips */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16, position: "relative", zIndex: 2 }}>
        {highlights.map((h, i) => (
          <div key={i} style={{
            background: h.bg, border: `1px solid ${h.border}`,
            borderRadius: 100, padding: "4px 11px",
            fontSize: 11, fontWeight: 500, color: h.color,
            animation: `fadeUp 0.4s ${0.08 * i}s ease both`,
          }}>{h.icon} {h.label}</div>
        ))}
      </div>

      {/* Share CTA */}
      <div style={{ display: "flex", gap: 8, position: "relative", zIndex: 2 }}>
        <button className="press" onClick={handleShare} style={{
          flex: 1, height: 44,
          background: shared
            ? "linear-gradient(135deg,#E85090,#C82870)"
            : "linear-gradient(135deg,#E2C46A,#C8A84B)",
          borderRadius: 14, border: "none",
          fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600,
          color: shared ? "white" : "#0E0E22", cursor: "pointer",
          transition: "all 0.3s ease",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        }}>
          {shared ? "♥ Link Copied!" : "↗ Share Cosmic Match"}
        </button>
        <button className="press" style={{
          height: 44, padding: "0 14px",
          background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)",
          borderRadius: 14, fontFamily: "'DM Sans',sans-serif",
          fontSize: 12, color: "rgba(255,255,255,0.58)", cursor: "pointer",
        }}>Save ↓</button>
      </div>
    </div>
  );
}

function Compat({ onTab }) {
  const [partnerStep, setPartnerStep] = useState("result"); // "empty" | "input" | "result"
  const [activeSection, setActiveSection] = useState(0);
  const [expandedAspect, setExpandedAspect] = useState(null);

  const sections = ["Overview", "Synastry", "Composite", "Advice"];
  const dimensions = [
    { icon: "❤️", name: "Romance",   score: 88, tag: "Magnetic",  tagColor: "#E85090", tagBg: "rgba(232,80,144,0.12)", tagBdr: "rgba(232,80,144,0.25)", barColor: "linear-gradient(90deg,#E85090,#C82870)" },
    { icon: "🗣️", name: "Communication", score: 74, tag: "Fluid",   tagColor: "#C8A84B", tagBg: "rgba(200,168,75,0.12)", tagBdr: "rgba(200,168,75,0.28)", barColor: "linear-gradient(90deg,#E2C46A,#C8A84B)" },
    { icon: "🔥", name: "Passion",   score: 92, tag: "Intense",  tagColor: "#E86050", tagBg: "rgba(232,96,80,0.12)", tagBdr: "rgba(232,96,80,0.25)", barColor: "linear-gradient(90deg,#FF8060,#E86050)" },
    { icon: "🌿", name: "Long-term", score: 68, tag: "Growing",  tagColor: "#4CAF50", tagBg: "rgba(76,175,80,0.1)", tagBdr: "rgba(76,175,80,0.22)", barColor: "linear-gradient(90deg,#6ECB6E,#4CAF50)" },
    { icon: "🧠", name: "Values",    score: 81, tag: "Aligned",  tagColor: "#80C8E0", tagBg: "rgba(128,200,224,0.1)", tagBdr: "rgba(128,200,224,0.22)", barColor: "linear-gradient(90deg,#80C8E0,#50A0C0)" },
    { icon: "✨", name: "Soul",      score: 95, tag: "Twin flame",tagColor: "#A870D0", tagBg: "rgba(168,112,208,0.12)", tagBdr: "rgba(168,112,208,0.28)", barColor: "linear-gradient(90deg,#C890E8,#A870D0)" },
  ];
  const aspects = [
    { sym: "☉♃", icon: "☉", icon2: "♃", iconBg: "rgba(200,168,75,0.15)", iconBg2: "rgba(200,168,75,0.1)", title: "Sun trine Jupiter", desc: "Your core identity expands in each other's presence. Marco's Jupiter amplifies Sofia's Piscean vision — together you dream bigger and more boldly.", type: "Harmonious", typeColor: "#4CAF50", typeBg: "rgba(76,175,80,0.1)", typeBdr: "rgba(76,175,80,0.22)", orb: "2.1°" },
    { sym: "☽♇", icon: "☽", icon2: "♂", iconBg: "rgba(200,210,232,0.15)", iconBg2: "rgba(232,96,80,0.15)", title: "Moon square Mars", desc: "Emotional rhythms clash occasionally. Sofia's Scorpio moon can feel overwhelmed by Marco's Aries Mars directness — requires conscious softening on both sides.", type: "Tense", typeColor: "#E86050", typeBg: "rgba(232,96,80,0.1)", typeBdr: "rgba(232,96,80,0.22)", orb: "3.7°" },
    { sym: "♀♄", icon: "♀", icon2: "♄", iconBg: "rgba(232,160,192,0.15)", iconBg2: "rgba(168,152,120,0.15)", title: "Venus conjunct Saturn", desc: "A karmic bond. This aspect suggests the relationship has weight, durability, and a sense of destiny — both partners feel they've known each other before.", type: "Karmic", typeColor: "#A870D0", typeBg: "rgba(168,112,208,0.1)", typeBdr: "rgba(168,112,208,0.25)", orb: "0.9°" },
    { sym: "☿♆", icon: "☿", icon2: "♆", iconBg: "rgba(168,192,192,0.15)", iconBg2: "rgba(128,200,224,0.15)", title: "Mercury trine Neptune", desc: "Telepathic communication. You finish each other's sentences. Creative, artistic, and spiritual conversations flow effortlessly and meaningfully.", type: "Harmonious", typeColor: "#4CAF50", typeBg: "rgba(76,175,80,0.1)", typeBdr: "rgba(76,175,80,0.22)", orb: "1.4°" },
  ];

  return (
    <div style={{ position: "absolute", inset: 0, background: T.cream }}>
      <SB light />
      <div className="scroller">
        <div style={{ paddingBottom: 92 }}>

          {/* Hero */}
          <div style={{
            background: "linear-gradient(158deg, #0E0E22 0%, #3A0A3A 50%, #1A0A2E 100%)",
            padding: "64px 22px 22px", position: "relative", overflow: "hidden",
          }}>
            <Stars n={18} />
            <div style={{ fontSize: 27, fontFamily: "'Playfair Display',serif", fontWeight: 400, color: "#FAF8F2", marginBottom: 3 }}>Compatibility</div>
            <div style={{ fontSize: 12, color: "rgba(250,248,242,0.35)" }}>Discover your cosmic connection — free forever</div>
          </div>

          <div style={{ padding: "18px 20px 0" }}>

            {/* THE VIRAL CARD */}
            <CompatViralCard
              personA={{ name: "Sofia", initial: "S", sign: "☉ Pisces · ☽ Scorpio", gradient: "linear-gradient(135deg,#E2C46A,#8C6C18)" }}
              personB={{ name: "Marco", initial: "M", sign: "☉ Gemini · ☽ Aries",  gradient: "linear-gradient(135deg,#A870D0,#5020A0)" }}
              score={84}
              tagline={"An electric soul union with karmic depth"}
              highlights={[
                { icon: "🔥", label: "Intense Chemistry",  bg: "rgba(232,96,80,0.1)",  border: "rgba(232,96,80,0.25)",  color: "#E86050" },
                { icon: "🌊", label: "Deep Emotional Bond", bg: "rgba(80,160,220,0.1)", border: "rgba(80,160,220,0.25)", color: "#50A0DC" },
                { icon: "✨", label: "Soul Connection",     bg: "rgba(168,112,208,0.1)",border: "rgba(168,112,208,0.28)",color: "#A870D0" },
                { icon: "⚡", label: "Growth Potential",   bg: "rgba(200,168,75,0.1)", border: "rgba(200,168,75,0.28)", color: "#C8A84B" },
              ]}
            />

            {/* Section tabs */}
            <div style={{
              background: "#EDE6D8", borderRadius: 13, padding: 4,
              display: "flex", marginBottom: 16,
            }}>
              {sections.map((s, i) => (
                <button key={i} className="press" onClick={() => setActiveSection(i)} style={{
                  flex: 1, height: 36, borderRadius: 9, border: "none",
                  fontFamily: "'DM Sans',sans-serif", fontSize: 11.5,
                  background: activeSection === i ? "white" : "transparent",
                  color: activeSection === i ? T.navy : T.stone,
                  fontWeight: activeSection === i ? 600 : 400,
                  boxShadow: activeSection === i ? "0 1px 5px rgba(0,0,0,0.09)" : "none",
                  cursor: "pointer", transition: "all 0.2s ease",
                }}>{s}</button>
              ))}
            </div>

            {/* Score breakdown */}
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", color: T.stone, marginBottom: 10 }}>
              Score Breakdown
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              {dimensions.map((d, i) => (
                <div key={i} className="press" style={{
                  background: "white", borderRadius: 15, padding: "13px 13px",
                  border: `1px solid #EAE3D6`, boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
                  animation: `fadeUp 0.4s ${i * 0.06}s ease both`,
                  transition: "all 0.17s ease",
                }}>
                  <div style={{ fontSize: 20, marginBottom: 5 }}>{d.icon}</div>
                  <div style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", color: T.stone, marginBottom: 4 }}>{d.name}</div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                    <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, color: T.navy }}>{d.score}</div>
                    <div style={{ fontSize: 9.5, fontWeight: 600, borderRadius: 100, padding: "2px 8px", background: d.tagBg, border: `1px solid ${d.tagBdr}`, color: d.tagColor }}>{d.tag}</div>
                  </div>
                  <div style={{ height: 4, background: "#F0E8D6", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 2, background: d.barColor, width: `${d.score}%`, transition: "width 1s cubic-bezier(0.34,1.1,0.64,1)" }} />
                  </div>
                </div>
              ))}
            </div>

            {/* AI summary */}
            <div style={{ borderRadius: 18, overflow: "hidden", marginBottom: 16, boxShadow: "0 4px 18px rgba(0,0,0,0.09)" }}>
              <div style={{ background: "linear-gradient(140deg,#2A0A2A 0%,#1A0A2E 100%)", padding: "15px 17px 13px" }}>
                <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "rgba(200,168,75,0.58)", marginBottom: 5 }}>✦ Celestia AI · Synastry Reading</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, color: "#FAF8F2", lineHeight: 1.3 }}>
                  "A Pisces–Gemini pairing of rare depth"
                </div>
              </div>
              <div style={{ background: "white", padding: "14px 17px 16px" }}>
                <div style={{ fontSize: 13, color: T.ink, lineHeight: 1.65, marginBottom: 12 }}>
                  The Scorpio moon and Aries moon between you create an <span style={{ color: "#8B3060", fontStyle: "italic" }}>electric push-pull tension</span> — uncomfortable at times, but the friction is generative. Where Sofia internalizes, Marco externalizes. This polarity, if honored, creates a remarkably complete emotional ecosystem.
                </div>
                <div style={{ fontSize: 13, color: T.ink, lineHeight: 1.65, marginBottom: 14 }}>
                  Venus conjunct Saturn in your composite chart is the anchor. <span style={{ color: "#8B3060", fontStyle: "italic" }}>This relationship was not accidental.</span> There is karmic weight here — likely from another lifetime. Saturn rewards the work you put in together.
                </div>
                <button className="press" style={{
                  width: "100%", height: 40,
                  background: T.navy, borderRadius: 12, border: "none",
                  fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 500, color: T.cream,
                  cursor: "pointer",
                }}>Get Full Synastry Report — $6.99 →</button>
              </div>
            </div>

            {/* Individual aspects */}
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", color: T.stone, marginBottom: 10 }}>
              Key Aspects
            </div>
            {aspects.map((a, i) => (
              <div key={i} className="press" onClick={() => setExpandedAspect(expandedAspect === i ? null : i)} style={{
                background: "white", borderRadius: 15, padding: "13px 14px",
                marginBottom: 8, border: "1px solid #EAE3D6",
                boxShadow: expandedAspect === i ? "0 4px 18px rgba(0,0,0,0.1)" : "0 1px 6px rgba(0,0,0,0.04)",
                animation: `fadeUp 0.4s ${i * 0.06}s ease both`,
                transition: "box-shadow 0.2s ease",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                  {/* Planet pair icons */}
                  <div style={{ display: "flex", flexShrink: 0 }}>
                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: a.iconBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, border: "2px solid white" }}>{a.icon}</div>
                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: a.iconBg2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, marginLeft: -9, border: "2px solid white" }}>{a.icon2}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, color: T.navy, marginBottom: 2 }}>{a.title}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ fontSize: 9.5, fontWeight: 600, padding: "2px 8px", borderRadius: 100, background: a.typeBg, border: `1px solid ${a.typeBdr}`, color: a.typeColor }}>{a.type}</div>
                      <div style={{ fontSize: 10, color: T.stone }}>Orb {a.orb}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: "#D0C8B4", transform: expandedAspect === i ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.24s ease" }}>⌄</div>
                </div>
                {expandedAspect === i && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #F0E8DA", fontSize: 13, color: T.ink, lineHeight: 1.62, animation: "fadeUp 0.24s ease" }}>
                    {a.desc}
                    <div style={{ marginTop: 10 }}>
                      <button className="press" style={{
                        background: "#F5F0E8", border: "none", borderRadius: 9,
                        padding: "5px 12px", fontSize: 11, fontWeight: 500, color: T.ink,
                        cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
                      }}>Ask AI about this ›</button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Add partner CTA */}
            <div className="press" style={{
              background: "white", borderRadius: 17, padding: "16px 16px", marginBottom: 12,
              border: "1.5px dashed #D4CFC4",
              display: "flex", alignItems: "center", gap: 13, cursor: "pointer",
              transition: "all 0.2s ease", marginTop: 4,
            }}>
              <div style={{
                width: 42, height: 42, borderRadius: "50%",
                background: "rgba(200,168,75,0.08)", border: "1.5px dashed rgba(200,168,75,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0,
              }}>＋</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: T.navy, marginBottom: 2 }}>Check another match</div>
                <div style={{ fontSize: 11.5, color: T.stone }}>Enter any birth details — no account needed</div>
              </div>
            </div>

          </div>
        </div>
      </div>
      <TabBar active={3} onTab={onTab} />
    </div>
  );
}

/* PROFILE */
function Profile({ onTab, dark, onToggleDark }) {
  const iconBg = dark ? "#1E1E30" : "#EDE6D4";
  return (
    <div style={{ position: "absolute", inset: 0, background: dark ? "#0A0A18" : T.cream }}>
      <SB light />
      <div className="scroller">
        <div style={{ paddingBottom: 92 }}>
          <div className="profile-hero">
            <div className="profile-hero-glyph">♓</div>
            <Stars n={10} />
            <div className="profile-avi press">S</div>
            <div className="profile-name">Sofia Marchetti</div>
            <div className="profile-signs-row">
              <div className="profile-sbadge">☉ Pisces</div>
              <div className="profile-sbadge">☽ Scorpio</div>
              <div className="profile-sbadge">↑ Virgo</div>
              <div className="profile-sbadge">♀ Aquarius</div>
            </div>
          </div>
          <div className="profile-body-wrap">
            {/* Astro ID card */}
            <div className="astro-id-card press" style={{ marginBottom: 20 }}>
              <div className="astro-id-lbl">✦ My Astro ID</div>
              <div className="astro-id-main">Sofia Marchetti · Pisces Sun</div>
              <div className="astro-id-row">
                <div className="astro-chip">☉ Pisces 17°</div>
                <div className="astro-chip">☽ Scorpio 3°</div>
                <div className="astro-chip">↑ Virgo 28°</div>
                <div className="astro-chip">♀ Aquarius</div>
              </div>
              <div className="astro-share press">Share My Chart Card ↗</div>
            </div>

            <div className="pstats">
              <div className="pstat">
                <div className="pstat-num">3</div>
                <div className="pstat-lbl">Reports purchased</div>
                <div className="pstat-tags">
                  <div className="mini-tag">Natal</div>
                  <div className="mini-tag">Year Ahead</div>
                  <div className="mini-tag">Compat.</div>
                </div>
              </div>
              <div className="pstat">
                <div className="pstat-num">47</div>
                <div className="pstat-lbl">Days with Celestia</div>
                <div className="pstat-tags">
                  <div className="mini-tag">🔥 12-day streak</div>
                </div>
              </div>
            </div>

            <div className="psec-lbl">My Charts</div>
            <div className="pcard">
              {[
                { i: "🧑", bg: "#FFF3E0", l: "Sofia (you)", v: "Pisces ☉ · Scorpio ☽" },
                { i: "👩", bg: "#FCE4EC", l: "Mom — Elena", v: "Virgo ☉ · Cancer ☽" },
                { i: "🧑‍🤝‍🧑", bg: "#E3F2FD", l: "Marco (partner)", v: "Gemini ☉ · Aries ☽" },
                { i: "＋", bg: dark ? "#1A1A2C" : T.warm, l: "Add a chart", v: "" },
              ].map((r, i) => (
                <div key={i} className="prow press">
                  <div className="prow-icon" style={{ background: r.bg }}>{r.i}</div>
                  <div className="prow-label">{r.l}</div>
                  <div className="prow-val">{r.v}</div>
                  <div className="prow-arr">›</div>
                </div>
              ))}
            </div>

            <div className="psec-lbl">Preferences</div>
            <div className="pcard">
              {[
                { i: "🌙", l: "Reading Style", v: "Poetic" },
                { i: "📊", l: "Depth", v: "Enthusiast" },
                { i: "🔔", l: "Notifications", v: "Configured" },
                { i: "🏠", l: "House System", v: "Placidus" },
                { i: "🌐", l: "Language", v: "English" },
              ].map((r, i) => (
                <div key={i} className="prow press">
                  <div className="prow-icon" style={{ background: iconBg }}>{r.i}</div>
                  <div className="prow-label">{r.l}</div>
                  <div className="prow-val">{r.v}</div>
                  <div className="prow-arr">›</div>
                </div>
              ))}

              {/* ── DARK MODE TOGGLE ── */}
              <div className="toggle-row press" onClick={onToggleDark}
                style={{ borderBottom: "none", background: "transparent" }}>
                <div className="prow-icon" style={{ background: iconBg, borderRadius: 10, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, marginRight: 11, flexShrink: 0 }}>
                  {dark ? "🌙" : "☀️"}
                </div>
                <div className="prow-label">Appearance</div>
                <div className="prow-val" style={{ marginRight: 10 }}>{dark ? "Dark" : "Light"}</div>
                <div className={`toggle-track ${dark ? "on" : ""}`}>
                  <div className="toggle-knob" />
                </div>
              </div>
            </div>

            <div className="psec-lbl">Account</div>
            <div className="pcard">
              {[
                { i: "📤", l: "Export My Data", v: "" },
                { i: "🎁", l: "Gift a Report", v: "" },
                { i: "❓", l: "Help & FAQ", v: "" },
              ].map((r, i) => (
                <div key={i} className="prow press">
                  <div className="prow-icon" style={{ background: iconBg }}>{r.i}</div>
                  <div className="prow-label">{r.l}</div>
                  <div className="prow-val">{r.v}</div>
                  <div className="prow-arr">›</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <TabBar active={5} onTab={onTab} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   INTERACTIVE PHONE WRAPPER
══════════════════════════════════════════════════════════════════════════ */
function IPhone({ start, label }) {
  const [screen, setScreen] = useState(start);
  const [key, setKey] = useState(0);
  const [dark, setDark] = useState(false);

  const go = useCallback((s) => {
    setScreen(s);
    setKey(k => k + 1);
  }, []);

  const handleTab = useCallback((i) => {
    const map = ["home", "chart", "transits", "compat", "chat", "reports"];
    go(map[i]);
  }, [go]);

  const toggleDark = useCallback(() => {
    setDark(d => !d);
  }, []);

  const render = () => {
    switch (screen) {
      case "splash":    return <Splash />;
      case "ob1":       return <OB1 />;
      case "ob2":       return <OB2 />;
      case "ob3":       return <OB3 />;
      case "home":      return <Home onTab={handleTab} />;
      case "chart":     return <Chart onTab={handleTab} />;
      case "transits":  return <Transits onTab={handleTab} />;
      case "compat":    return <Compat onTab={handleTab} />;
      case "chat":      return <AskAI onTab={handleTab} />;
      case "reports":   return <Reports onTab={handleTab} onDetail={() => go("detail")} />;
      case "detail":    return <ReportDetail onBack={() => go("reports")} />;
      case "profile":   return <Profile onTab={handleTab} dark={dark} onToggleDark={toggleDark} />;
      default:          return <Home onTab={handleTab} />;
    }
  };

  return (
    <div className="screen-unit">
      <div className={`phone ${dark ? "dk" : ""}`} style={{ transition: "background 0.35s ease" }}>
        <div key={key} style={{ position: "absolute", inset: 0, animation: "fadeIn 0.25s ease" }}>
          {render()}
        </div>
      </div>
      <div className="screen-label">{label}</div>
    </div>
  );
}

function SPhone({ children, label }) {
  return (
    <div className="screen-unit">
      <div className="phone">{children}</div>
      <div className="screen-label">{label}</div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   ROOT APP
══════════════════════════════════════════════════════════════════════════ */
export default function App() {
  return (
    <>
      <style>{G}</style>
      <div className="root">

        {/* ── WORDMARK ────────────────────────────────────────────────── */}
        <div className="page-wordmark">
          <div className="wordmark-text">
            <span className="wordmark-stars">✦</span>
            Celestia
            <span className="wordmark-stars">✦</span>
          </div>
          <div className="wordmark-sub">Complete iOS App Mockup · 2026 Design Standards · Fully Interactive</div>
        </div>

        {/* ═══ FLOW 01 — ONBOARDING ═══ */}
        <div className="section-block">
          <div className="section-header">
            <div className="section-num">01</div>
            <div className="section-name">Onboarding Flow</div>
            <div className="section-line" />
          </div>
          <div className="screens-row">
            <SPhone label="Splash Screen"><Splash /></SPhone>
            <SPhone label="Birth Data Entry"><OB1 /></SPhone>
            <SPhone label="Reading Style Selector"><OB2 /></SPhone>
            <SPhone label="Chart Reveal · Welcome"><OB3 /></SPhone>
          </div>
        </div>

        {/* ═══ FLOW 02 — CORE (INTERACTIVE) ═══ */}
        <div className="section-block">
          <div className="section-header">
            <div className="section-num">02</div>
            <div className="section-name">Core App Screens</div>
            <div className="section-line" />
            <div className="section-interactive-note">✦ Click tab bar to navigate between screens</div>
          </div>
          <div className="screens-row">
            <IPhone start="home"     label="Home · Daily Reading" />
            <IPhone start="chart"    label="Birth Chart · Placements" />
            <IPhone start="transits" label="Live Transits · Expandable" />
          </div>
        </div>

        {/* ═══ FLOW 03 — AI CHAT + REPORTS (INTERACTIVE) ═══ */}
        <div className="section-block">
          <div className="section-header">
            <div className="section-num">03</div>
            <div className="section-name">AI Chat · Reports Store</div>
            <div className="section-line" />
            <div className="section-interactive-note">✦ Click featured report to see detail view</div>
          </div>
          <div className="screens-row">
            <SPhone label="AI Chat · Typing Animation"><AskAI onTab={() => {}} /></SPhone>
            <IPhone start="reports" label="Reports Store · Bundles" />
            <SPhone label="Report Detail · Purchase"><ReportDetail onBack={() => {}} /></SPhone>
          </div>
        </div>

        {/* ═══ FLOW 05 — COMPATIBILITY ═══ */}
        <div className="section-block">
          <div className="section-header">
            <div className="section-num">05</div>
            <div className="section-name">Compatibility · Viral Match Card</div>
            <div className="section-line" />
            <div className="section-interactive-note">✦ Click aspects to expand · Press Share to animate</div>
          </div>
          <div className="screens-row">
            <IPhone start="compat" label="Compatibility · Full Flow" />
          </div>
        </div>

        {/* ═══ FLOW 04 — PROFILE + DARK MODE ═══ */}
        <div className="section-block">
          <div className="section-header">
            <div className="section-num">04</div>
            <div className="section-name">Profile · Dark Mode Toggle</div>
            <div className="section-line" />
            <div className="section-interactive-note">✦ Toggle "Appearance" in Preferences to switch theme</div>
          </div>
          <div className="screens-row">
            <IPhone start="profile" label="Profile · Light Mode (default)" />
            <SPhone label="Profile · Dark Mode — toggled on">
              <div className="dk" style={{position:"absolute",inset:0}}>
                <Profile onTab={()=>{}} dark={true} onToggleDark={()=>{}} />
              </div>
            </SPhone>
          </div>
        </div>

        {/* ═══ DESIGN SYSTEM ═══ */}
        <div className="design-system-card">
          <div className="ds-title">✦ Celestia Design System</div>
          {[
            ["Typeface", "Display: Playfair Display (serif, 400–600) · UI: DM Sans (300–600) · No system fonts ever"],
            ["Color Palette", <>
              <span><span className="swatch" style={{background:"#0E0E22"}}/>#0E0E22 Deep Navy</span> ·{" "}
              <span><span className="swatch" style={{background:"#C8A84B"}}/>#C8A84B Celestial Gold</span> ·{" "}
              <span><span className="swatch" style={{background:"#FAF8F2"}}/>#FAF8F2 Warm Cream</span> ·{" "}
              <span><span className="swatch" style={{background:"#F3EDE2"}}/>#F3EDE2 Warm Stone</span>
            </>],
            ["iOS 18 Spec", "iPhone 16 · 393×852pt · Dynamic Island 128×37pt · Status bar 58pt · Tab bar 86pt · Home indicator 34pt · Corner radius 54px"],
            ["Micro-interactions", "Buttons: scale(0.965) + brightness(0.92) on press · Tabs: bounceIn dot + active bubble bg · Chevrons: rotate(180deg) 0.24s · Cards: translateY(-3px) hover · Typing: 3-dot bounce animation · Shimmer on CTAs · orbitCW/orbitCCW ring animations · float on hero orb"],
            ["Transitions", "Screen swap: fadeIn 0.25s · List items: fadeUp staggered 0–0.4s · Modal: slideInUp · Bounce: cubic-bezier(0.34,1.56,0.64,1) · All press states: 0.12s ease"],
            ["Spacing", "Page: 22px · Cards: 19–21px inner · Row gaps: 9–11px · Section gaps: 18–20px · Label tracking: 1.5–2.5px"],
            ["Corner System", "Phone: 54px · Hero cards: 22px · Cards: 17–18px · Inputs: 15px · Buttons: 17px · Pills: 100px · Chips: 100px"],
            ["Typography Scale", "Hero: 46–58px · Screen titles: 27–33px · Card titles: 21–24px · Body: 13–13.5px · Labels: 10–11px (caps)"],
            ["Free vs Paid", "AI Chat: FREE ∞ badge · Unlimited chat is free anchor · Reports: à la carte $1.99–$9.99 · Bundles: $12.99–$19.99 · Paywall: first 2 chapters free with preview text, rest locked · No subscription pressure"],
            ["Accessibility", "All tap targets ≥44×44pt · Color contrast ≥4.5:1 on body text · Press states on every interactive element · Semantic grouping maintained"],
          ].map(([k, v], i) => (
            <div key={i} className="ds-row">
              <div className="ds-key">{k}</div>
              <div className="ds-val">{v}</div>
            </div>
          ))}
        </div>

      </div>
    </>
  );
}
