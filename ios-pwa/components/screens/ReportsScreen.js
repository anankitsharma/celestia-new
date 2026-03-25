'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useUserProfile } from '@/lib/UserProfileContext';
import { generateFullReport } from '@/lib/geminiService';
import { getNarrativeContext } from '@/lib/narrativeService';
import { generateReportPDF } from '@/lib/pdfService';
import { incrementCounter } from '@/lib/engagementService';
import { T } from '@/lib/constants';

const CURRENT_YEAR = new Date().getFullYear();
const CURRENT_MONTH = new Date().getMonth();
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTH_NAME = MONTH_NAMES[CURRENT_MONTH];

const MONTH_ZODIAC_ENERGY = [
  'Capricorn season wraps up & Aquarius rises',
  'Aquarius winds down & Pisces dreams begin',
  'Pisces season closes & Aries ignites',
  'Aries fire cools & Taurus grounds you',
  'Taurus steadies & Gemini sparks curiosity',
  'Gemini fades & Cancer nurtures deeply',
  'Cancer retreats & Leo takes the stage',
  'Leo\'s fire mellows & Virgo refines',
  'Virgo organizes & Libra seeks balance',
  'Libra harmonizes & Scorpio intensifies',
  'Scorpio transforms & Sagittarius explores',
  'Sagittarius winds down & Capricorn builds',
];

const REPORT_THEMES = {
  love: { gradient: ['#2D0A1E','#1A0828','#0D0515'], accent: '#E85090', title: 'Love Report' },
  career: { gradient: ['#0A1628','#0C1E3A','#081020'], accent: '#5090E8', title: 'Career Map' },
  lunar: { gradient: ['#0D0D20','#141030','#0A0818'], accent: '#A080E0', title: 'Lunar Guide' },
  purpose: { gradient: ['#1A1408','#201810','#0E0A04'], accent: '#C8A84B', title: 'Life Purpose' },
  solar_return: { gradient: ['#1A1408','#12102A','#0D1527'], accent: '#C8A84B', title: 'Solar Return' },
  monthly: { gradient: ['#12082A','#1A1040','#0D0820'], accent: '#B388FF', title: `${MONTH_NAME} Forecast` },
  yearly: { gradient: ['#0A1A2A','#0D2030','#081518'], accent: '#4ECDC4', title: 'Yearly Forecast' },
  transit: { gradient: ['#1A0A1A','#2A0A20','#120818'], accent: '#FF6B6B', title: 'Transit Report' },
};

const REPORTS = [
  { icon: '\u2640', bg: ['#3A0A3A','#1A1060'], accent: '#E85090', name: 'Love Report', desc: 'Venus, attachment style & why you love like this', type: 'love', tier: 'pro' },
  { icon: '\u2644', bg: ['#0A2A3A','#1A1060'], accent: '#5090E8', name: 'Career Map', desc: 'Midheaven, Saturn & your professional destiny', type: 'career', tier: 'pro' },
  { icon: '\u263d', bg: ['#1A0A3A','#0E0E22'], accent: '#A080E0', name: 'Lunar Guide', desc: 'Moon rituals aligned with your natal chart', type: 'lunar', tier: 'pro' },
  { icon: '\u260a', bg: ['#2A1A0A','#1A1060'], accent: '#C8A84B', name: 'Life Purpose', desc: 'North Node decoded -- where your soul is headed', type: 'purpose', tier: 'pro' },
  { icon: '\u2643', bg: ['#0A1A2A','#0E0E22'], accent: '#4ECDC4', name: 'Year-Ahead Forecast', desc: `Month-by-month roadmap for ${CURRENT_YEAR}`, type: 'yearly', tier: 'pro' },
  { icon: '\u263f', bg: ['#1A0A1A','#2A0A2A'], accent: '#FF6B6B', name: 'Transit Report', desc: 'Current planetary weather hitting your chart', type: 'transit', tier: 'pro' },
  { icon: '\u2609', bg: ['#0E0E22','#2A1A6E'], accent: '#C8A84B', name: `Solar Return ${CURRENT_YEAR}`, desc: 'Your complete year ahead from birthday to birthday', type: 'solar_return', tier: 'pro' },
];

const isPro = false;

// Simplified: Monthly = free, everything else = Pro subscription
const isReportAccessible = (reportType) => {
  if (reportType === 'monthly') return true;
  return isPro;
};

export default function ReportsScreen() {
  const { profile, chart } = useUserProfile();

  const sunSign = chart?.planets?.find(p => p.name === 'Sun')?.sign;

  const [reportModal, setReportModal] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportTitle, setReportTitle] = useState('');
  const [reportType, setReportType] = useState('');
  const [narrativeCtx, setNarrativeCtx] = useState(null);

  // Toast
  const [toast, setToast] = useState(null);
  const toastTimeout = useRef(null);

  const showToast = (message) => {
    setToast(message);
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    return () => { if (toastTimeout.current) clearTimeout(toastTimeout.current); };
  }, []);

  useEffect(() => {
    getNarrativeContext(profile?.id || 'default', chart)
      .then(ctx => setNarrativeCtx(ctx))
      .catch(() => { });
  }, [profile?.id]);

  const userProfile = { ...profile, chart };

  const getReportDescription = (type) => {
    const defaults = {
      love: 'Deep romantic insights based on your Venus & 7th house',
      career: 'Professional destiny through your 10th house & Saturn',
      lunar: 'Moon phase rituals aligned with your natal Moon',
      purpose: 'North Node & soul path decoded for your chart',
      solar_return: `Your complete ${CURRENT_YEAR} year ahead -- every transit, season & lunar cycle`,
      monthly: 'This month\'s cosmic forecast in detail',
      yearly: `Your ${CURRENT_YEAR} roadmap -- profections, transits & quarterly outlook`,
      transit: 'Current planetary weather hitting your natal chart right now',
    };
    if (!narrativeCtx) return defaults[type] || defaults.love;
    const windows = narrativeCtx.today?.cosmicWindows || [];
    const loveWindows = windows.filter(w => ['Venus','Moon'].includes(w.planet) || ['Venus','Moon'].includes(w.natalPlanet));
    const careerWindows = windows.filter(w => ['Saturn','Jupiter','Mars'].includes(w.planet));
    if (type === 'love' && loveWindows.length > 0) return `${loveWindows[0].planet} is active in your chart -- perfect timing for a love deep-dive`;
    if (type === 'career' && careerWindows.length > 0) return `${careerWindows[0].planet} is reshaping your ambitions -- this report guides you through`;
    return defaults[type] || defaults.love;
  };

  const handleReport = async (r) => {
    if (!chart) {
      window.alert('Complete onboarding to generate reports.');
      return;
    }
    if (!isReportAccessible(r.type)) {
      window.alert('This report is included with Celestia Pro. Subscribe to unlock all reports.');
      return;
    }
    setReportTitle(r.name);
    setReportType(r.type);
    setReportData(null);
    setReportModal(true);
    setReportLoading(true);
    try {
      const data = await generateFullReport(userProfile, r.type, narrativeCtx);
      setReportData(data);
      incrementCounter('reports').catch(() => {});
    } catch (e) {
      console.error('Report generation error:', e);
      window.alert('Failed to generate report. Please try again.');
      setReportModal(false);
    } finally {
      setReportLoading(false);
    }
  };

  const handleMonthlyReport = () => {
    handleReport({ name: `${MONTH_NAME} Forecast`, type: 'monthly' });
  };

  const handleShareText = async () => {
    if (!reportData) return;
    const sections = (reportData.sections || []).map((s, i) => `${i + 1}. ${s.heading}\n${s.body}`).join('\n\n');
    try {
      await navigator.share({
        text: `${reportData.title}\n\n${reportData.summary}\n\n${sections}\n\n${reportData.keyInsight ? `\u2726 ${reportData.keyInsight}` : ''}\n\n-- Celestia`,
      });
    } catch (e) { }
  };

  return (
    <div style={{ flex: 1, backgroundColor: 'var(--c-bg)', minHeight: '100vh' }}>
      <div className="scroll-container" style={{ paddingBottom: 112 }}>
        {/* Header */}
        <div style={{ paddingTop: 70, paddingLeft: 22, paddingRight: 22, paddingBottom: 4 }}>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 32, color: 'var(--c-heading)', marginBottom: 5 }}>Reports</h1>
          <p style={{ fontSize: 13, color: 'var(--c-text-secondary)', lineHeight: 1.55, marginBottom: 18 }}>
            {sunSign
              ? `AI-powered reports written for your ${sunSign} Sun chart.`
              : 'Premium cosmic intelligence, written by AI using your exact birth chart.'}
          </p>
        </div>

        {/* Featured -- Monthly Forecast */}
        <button onClick={handleMonthlyReport} style={{ display: 'block', margin: '0 20px 18px', borderRadius: 21, overflow: 'hidden', border: 'none', cursor: 'pointer', width: 'calc(100% - 40px)', boxShadow: '0 12px 40px rgba(0,0,0,0.14)' }}>
          <div style={{ height: 148, background: 'linear-gradient(135deg, #12082A, #2A1060, #0C1840)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <span style={{ fontSize: 56, color: '#B388FF' }}>{'\u263d'}</span>
            <div style={{ position: 'absolute', top: 14, left: 14, backgroundColor: T.gold, borderRadius: 100, padding: '4px 12px' }}>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: T.navy }}>{MONTH_NAME.toUpperCase()}</span>
            </div>
          </div>
          <div style={{ padding: '17px 19px 19px', backgroundColor: 'var(--c-card-bg-alpha)', textAlign: 'left' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--c-heading)', marginBottom: 4 }}>Your {MONTH_NAME} Forecast</h3>
            <p style={{ fontSize: 12, color: 'var(--c-text-secondary)', lineHeight: 1.5, marginBottom: 13 }}>
              {sunSign
                ? `${MONTH_ZODIAC_ENERGY[CURRENT_MONTH]} See how it hits your ${sunSign} chart week by week.`
                : `${MONTH_ZODIAC_ENERGY[CURRENT_MONTH]} Your personalized week-by-week cosmic guide.`}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'baseline' }}>
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: 28, color: 'var(--c-heading)' }}>Free</span>
                <span style={{ fontSize: 12, textDecoration: 'line-through', color: 'var(--c-text-secondary)', marginLeft: 6 }}>$12</span>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #C9A0FF, #B388FF, #9060E0)', borderRadius: 12, padding: '10px 18px', boxShadow: `0 4px 12px rgba(200,168,75,0.3)` }}>
                <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 13, color: '#fff' }}>Get {MONTH_NAME} Report</span>
              </div>
            </div>
          </div>
        </button>

        {/* Report Grid */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, paddingLeft: 20, paddingRight: 20, marginBottom: 18 }}>
          {REPORTS.map((r, i) => (
            <button key={i} onClick={() => handleReport(r)}
              style={{ width: 'calc(50% - 5px)', borderRadius: 17, overflow: 'hidden', border: '1px solid var(--c-card-border-alpha)', cursor: 'pointer', backgroundColor: 'var(--c-card-bg-alpha)' }}>
              <div style={{ height: 74, background: `linear-gradient(135deg, ${r.bg.join(', ')})`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <span style={{ fontSize: 32, color: r.accent }}>{r.icon}</span>
                {!isReportAccessible(r.type) && (
                  <div style={{ position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 10 }}>{'\ud83d\udd12'}</span>
                  </div>
                )}
              </div>
              <div style={{ padding: '11px 13px 13px', textAlign: 'left' }}>
                <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--c-heading)', marginBottom: 2 }}>{r.name}</h4>
                <p style={{ fontSize: 10, color: 'var(--c-text-secondary)', lineHeight: 1.4, marginBottom: 9 }}>{getReportDescription(r.type)}</p>
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: isReportAccessible(r.type) ? 19 : 14, color: isReportAccessible(r.type) ? T.cream : T.gold }}>
                  {isReportAccessible(r.type) ? (r.type === 'monthly' ? 'Free' : 'In Pro') : 'Pro'}
                </span>
              </div>
            </button>
          ))}
        </div>

        <div style={{ height: 20 }} />
      </div>

      {/* Report Display Modal */}
      {reportModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, backgroundColor: 'var(--c-bg)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottom: '1px solid var(--c-card-border-alpha)' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--c-heading)', flex: 1, marginRight: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{reportData?.title || reportTitle}</h2>
            <button onClick={() => setReportModal(false)} style={{ background: 'none', border: 'none', fontSize: 18, color: 'var(--c-text-secondary)', cursor: 'pointer' }}>{'\u2715'}</button>
          </div>

          {reportLoading ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingBottom: 60 }}>
              <div className="spinner-lg" />
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--c-heading)', marginTop: 20 }}>Consulting the stars...</h3>
              <p style={{ fontSize: 13, color: 'var(--c-text-secondary)', marginTop: 6 }}>Generating your personalized report</p>
            </div>
          ) : reportData ? (
            <>
              <div className="scroll-container" style={{ flex: 1, padding: 20 }}>
                {/* Summary */}
                <div style={{ background: 'linear-gradient(135deg, #0E0E22, #1A1060)', borderRadius: 18, padding: 20, marginBottom: 16 }}>
                  <p style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--c-heading)', lineHeight: 1.6, fontStyle: 'italic' }}>{reportData.summary}</p>
                </div>

                {/* Sections */}
                {reportData.sections?.map((section, i) => (
                  <div key={i} style={{ backgroundColor: 'var(--c-card-bg-alpha)', borderRadius: 18, padding: 18, marginBottom: 12, border: '1px solid var(--c-card-border-alpha)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: 'var(--c-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(200,168,75,0.3)', flexShrink: 0 }}>
                        <span style={{ fontFamily: 'var(--font-serif)', fontSize: 14, color: T.gold }}>{i + 1}</span>
                      </div>
                      <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, color: 'var(--c-heading)', flex: 1 }}>{section.heading}</h4>
                    </div>
                    <p style={{ fontSize: 13.5, color: 'var(--c-text)', lineHeight: 1.65, marginBottom: 12 }}>{section.body}</p>
                    {section.remedy && (
                      <div style={{ backgroundColor: 'rgba(200,168,75,0.06)', borderRadius: 12, padding: 12, marginBottom: 8, borderLeft: `2px solid ${T.gold}` }}>
                        <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: 1.5, color: T.gold, marginBottom: 4, textTransform: 'uppercase' }}>REMEDY</p>
                        <p style={{ fontSize: 13, color: 'var(--c-text)', lineHeight: 1.55 }}>{section.remedy}</p>
                      </div>
                    )}
                    {section.affirmation && (
                      <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 12, textAlign: 'center' }}>
                        <p style={{ fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--c-heading)', fontStyle: 'italic' }}>"{section.affirmation}"</p>
                      </div>
                    )}
                  </div>
                ))}

                {/* Key Insight */}
                {reportData.keyInsight && (
                  <div style={{ background: 'linear-gradient(135deg, #2A1A6E, #0E0E22)', borderRadius: 18, padding: 20, marginBottom: 16, textAlign: 'center' }}>
                    <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: 2, color: 'rgba(200,168,75,0.6)', marginBottom: 8, textTransform: 'uppercase' }}>KEY INSIGHT</p>
                    <p style={{ fontFamily: 'var(--font-serif)', fontSize: 17, color: 'var(--c-heading)', lineHeight: 1.45 }}>{reportData.keyInsight}</p>
                  </div>
                )}

                <div style={{ height: 20 }} />
              </div>

              {/* Bottom action bar */}
              <div style={{ display: 'flex', gap: 10, padding: '10px 20px 30px', borderTop: '1px solid var(--c-card-border-alpha)', backgroundColor: 'var(--c-bg)' }}>
                <button onClick={handleShareText} style={{ flex: 1, height: 48, border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', cursor: 'pointer' }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--c-text-secondary)' }}>Share {'\u2197'}</span>
                </button>
                <button onClick={async () => { try { await generateReportPDF(reportData, reportTitle, profile?.name); showToast('PDF downloaded!'); } catch (e) { showToast('PDF generation failed. Try again.'); } }} style={{ flex: 1.5, borderRadius: 14, overflow: 'hidden', border: 'none', cursor: 'pointer' }}>
                  <div style={{ height: 48, background: `linear-gradient(135deg, ${T.navy}, #1A1060)`, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 14 }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--c-heading)' }}>Download PDF {'\u2193'}</span>
                  </div>
                </button>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 60, left: 20, right: 20, backgroundColor: '#0D1527', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 8px 20px rgba(0,0,0,0.25)', zIndex: 999, animation: 'fadeInDown 0.3s ease' }}>
          <div style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(80,200,120,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 16 }}>{'\u2713'}</span>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#FAF8F3', marginBottom: 2 }}>{toast}</p>
          </div>
        </div>
      )}

      <style>{`
        .spinner-lg {
          width: 32px; height: 32px; border: 3px solid rgba(200,168,75,0.2);
          border-top-color: ${T.gold}; border-radius: 50%; animation: spin 0.8s linear infinite;
        }
        .spinner {
          width: 20px; height: 20px; border: 2px solid rgba(200,168,75,0.2);
          border-top-color: ${T.gold}; border-radius: 50%; animation: spin 0.8s linear infinite;
          margin: 0 auto;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
