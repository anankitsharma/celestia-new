'use client';
import { useState, useEffect } from 'react';
import { UserProfileProvider, useUserProfile } from '@/lib/UserProfileContext';
import { ThemeProvider } from '@/lib/ThemeContext';
import TabBar from '@/components/TabBar';
import TodayScreen from '@/components/screens/TodayScreen';
import ChatScreen from '@/components/screens/ChatScreen';
import ChartScreen from '@/components/screens/ChartScreen';
import CircleScreen from '@/components/screens/CircleScreen';
import ReportsScreen from '@/components/screens/ReportsScreen';
import ProfileScreen from '@/components/screens/ProfileScreen';
import OnboardingScreen from '@/components/screens/OnboardingScreen';
import WelcomeScreen from '@/components/screens/WelcomeScreen';
import SplashScreen from '@/components/SplashScreen';

function AppShell() {
  const { profile, chart, partners, loading } = useUserProfile();
  const [tab, setTab] = useState('today');
  const [showSplash, setShowSplash] = useState(true);
  const [screen, setScreen] = useState('splash'); // splash | onboarding | welcome | main
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  // Determine screen based on loading state and profile
  useEffect(() => {
    if (showSplash || loading) {
      setScreen('splash');
    } else if (!profile) {
      setScreen('onboarding');
    } else if (screen === 'onboarding') {
      setScreen('welcome');
    } else if (screen === 'splash') {
      setScreen('main');
    }
  }, [showSplash, loading, profile]);

  if (screen === 'splash') {
    return (
      <SplashScreen
        onNavigate={(dest) => {
          if (dest === 'main' && profile) setScreen('main');
          else if (dest === 'onboarding') setScreen('onboarding');
        }}
      />
    );
  }

  if (screen === 'onboarding') {
    return (
      <OnboardingScreen
        onComplete={() => setScreen('welcome')}
      />
    );
  }

  if (screen === 'welcome') {
    return (
      <WelcomeScreen
        onContinue={() => setScreen('main')}
      />
    );
  }

  const screens = {
    today: TodayScreen,
    chat: ChatScreen,
    chart: ChartScreen,
    circle: CircleScreen,
    reports: ReportsScreen,
  };

  const ActiveScreen = screens[tab];

  const screenProps = {
    onNavigate: (dest) => {
      if (dest === 'profile' || dest === 'Profile') { setShowProfile(true); return; }
      if (dest === 'onboarding') { setScreen('onboarding'); return; }
      if (['today','chat','chart','circle','reports'].includes(dest)) setTab(dest);
    },
    userProfile: profile ? { ...profile, chart } : null,
    partnerProfiles: partners || [],
    isLoading: loading,
    onOpenProfile: () => setShowProfile(true),
  };

  return (
    <div className="h-full w-full relative overflow-hidden" style={{ backgroundColor: 'var(--c-bg)' }}>
      <div className="h-full overflow-hidden" style={{ paddingBottom: tab === 'chat' ? 0 : 96 }}>
        <ActiveScreen {...screenProps} />
      </div>
      <TabBar active={tab} onChange={setTab} />

      {/* Profile Modal */}
      {showProfile && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          animation: 'slideUp 0.3s ease-out',
        }}>
          {/* Close bar */}
          <div style={{
            position: 'absolute', top: 16, right: 16, zIndex: 10,
          }}>
            <button
              onClick={() => setShowProfile(false)}
              style={{
                width: 36, height: 36, borderRadius: 18,
                backgroundColor: 'rgba(255,255,255,0.1)',
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, color: '#FAF8F2',
              }}
            >
              {'\u2715'}
            </button>
          </div>
          <ProfileScreen
            onNavigate={(dest) => {
              setShowProfile(false);
              if (dest === 'onboarding') setScreen('onboarding');
            }}
          />
          <style>{`
            @keyframes slideUp {
              from { transform: translateY(100%); }
              to { transform: translateY(0); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <ThemeProvider>
      <UserProfileProvider>
        <AppShell />
      </UserProfileProvider>
    </ThemeProvider>
  );
}
