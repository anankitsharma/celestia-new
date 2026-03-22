'use client';
import { useState, useEffect } from 'react';
import { Star, Sparkles, Compass, Users, ScrollText } from 'lucide-react';
import { useTheme } from '@/lib/ThemeContext';

const TABS = [
  { key: 'today', label: 'Today', Icon: Star },
  { key: 'chat', label: 'Ask', Icon: Sparkles },
  { key: 'chart', label: 'Chart', Icon: Compass },
  { key: 'circle', label: 'Circle', Icon: Users },
  { key: 'reports', label: 'Reports', Icon: ScrollText },
];

// colors provided by useTheme() inside the component

export default function TabBar({ active, onChange, hideTabBar }) {
  const { colors, isDark } = useTheme();
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Detect virtual keyboard via viewport resize (iOS PWA behavior)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initialHeight = window.innerHeight;
    let threshold = initialHeight * 0.75;

    const handleResize = () => {
      const currentHeight = window.visualViewport
        ? window.visualViewport.height
        : window.innerHeight;
      setKeyboardVisible(currentHeight < threshold);
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      return () => window.visualViewport.removeEventListener('resize', handleResize);
    } else {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // Hide tab bar when AskAI (chat) is active or keyboard is visible
  if (keyboardVisible || active === 'chat' || hideTabBar) return null;

  return (
    <div style={{ ...styles.outerContainer, borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#EAE3D6' }}>
      <div style={styles.blurContainer}>
        <div style={{ ...styles.container, backgroundColor: isDark ? 'rgba(26,23,20,0.82)' : 'rgba(250,248,242,0.92)' }}>
          {TABS.map(({ key, label, Icon }) => {
            const isActive = active === key;

            return (
              <button
                key={key}
                onClick={() => {
                  if (key === 'chat') {
                    // Navigate to chat — could pass previousTab if needed
                    onChange('chat');
                  } else {
                    onChange(key);
                  }
                }}
                style={styles.tab}
              >
                <div style={styles.iconContainer}>
                  {isActive && <div style={styles.pill} />}
                  <Icon
                    size={24}
                    color={isActive ? 'var(--c-gold)' : 'var(--c-text-muted)'}
                    strokeWidth={isActive ? 2.5 : 2}
                    style={{ position: 'relative', zIndex: 1 }}
                  />
                </div>
                <span
                  style={{
                    ...styles.label,
                    color: isActive ? 'var(--c-heading)' : 'var(--c-text-muted)',
                    fontWeight: isActive ? '700' : '500',
                  }}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const styles = {
  outerContainer: {
    position: 'fixed',
    left: 16,
    right: 16,
    bottom: 24,
    borderRadius: 34,
    overflow: 'hidden',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgba(255,255,255,0.06)',
    boxShadow: '0 8px 16px rgba(0,0,0,0.12)',
    zIndex: 50,
  },
  blurContainer: {
    width: '100%',
    height: '100%',
    backdropFilter: 'blur(90px)',
    WebkitBackdropFilter: 'blur(90px)',
  },
  container: {
    display: 'flex',
    flexDirection: 'row',
    height: 72,
    alignItems: 'center',
    paddingLeft: 10,
    paddingRight: 10,
    backgroundColor: 'rgba(26,23,20,0.82)',
  },
  tab: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'none',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
    outline: 'none',
  },
  iconContainer: {
    width: 64,
    height: 34,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    position: 'relative',
  },
  pill: {
    position: 'absolute',
    width: 56,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(200,168,75,0.15)',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  },
  label: {
    fontSize: 10,
    letterSpacing: 0.3,
    fontFamily: "'DM Sans', sans-serif",
    lineHeight: '14px',
  },
};
