'use client';

import React, { useEffect, useState } from 'react';
import { useUserProfile } from '@/lib/UserProfileContext';

export default function SplashScreen({ onNavigate }) {
  const { profile, loading } = useUserProfile();
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    // Trigger fade-in after mount
    const t = setTimeout(() => setFadeIn(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!loading && profile?.chart) {
      onNavigate?.('main');
    }
  }, [loading, profile]);

  return (
    <div
      style={{
        background: 'linear-gradient(180deg, #1A0A55 0%, #0E0E22 45%, #07070F 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Stars */}
      <Stars count={34} />

      {/* Glow halo */}
      <div
        style={{
          position: 'absolute',
          width: 340,
          height: 340,
          borderRadius: 170,
          top: '10%',
          alignSelf: 'center',
          backgroundColor: 'rgba(200,168,75,0.06)',
        }}
      />

      {/* Orb system */}
      <div
        className="animate-float"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 250,
          height: 250,
          marginBottom: 46,
          position: 'relative',
        }}
      >
        {/* Ring 3 - outermost */}
        <div
          className="animate-spin-slow"
          style={{
            position: 'absolute',
            width: 252,
            height: 252,
            borderRadius: 999,
            border: '0.4px solid rgba(200,168,75,0.07)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: -3.5,
              left: '50%',
              marginLeft: -3.5,
              width: 7,
              height: 7,
              borderRadius: 3.5,
              backgroundColor: '#C8A84B',
              boxShadow: '0 0 8px rgba(200,168,75,0.8)',
            }}
          />
        </div>

        {/* Ring 2 */}
        <div
          className="animate-spin-slow-reverse"
          style={{
            position: 'absolute',
            width: 204,
            height: 204,
            borderRadius: 999,
            border: '0.5px solid rgba(200,168,75,0.12)',
          }}
        />

        {/* Ring 1 */}
        <div
          className="animate-spin-slow"
          style={{
            position: 'absolute',
            width: 160,
            height: 160,
            borderRadius: 999,
            border: '0.8px solid rgba(200,168,75,0.22)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: -3.5,
              left: '50%',
              marginLeft: -3.5,
              width: 7,
              height: 7,
              borderRadius: 3.5,
              backgroundColor: '#C8A84B',
              boxShadow: '0 0 8px rgba(200,168,75,0.8)',
            }}
          />
        </div>

        {/* Sun */}
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: 50,
            background: 'linear-gradient(180deg, #EDD060 0%, #C8A84B 38%, #8C6C18 72%, #4A3808 100%)',
            boxShadow: '0 0 40px rgba(200,168,75,0.55)',
          }}
        />
      </div>

      {/* Wordmark */}
      <h1
        className="font-serif"
        style={{
          fontSize: 46,
          letterSpacing: 10,
          color: '#FAF8F2',
          textTransform: 'uppercase',
          textAlign: 'center',
          marginBottom: 8,
          opacity: fadeIn ? 1 : 0,
          transform: fadeIn ? 'translateY(0)' : 'translateY(30px)',
          transition: 'opacity 0.9s ease 0.2s, transform 0.9s ease 0.2s',
        }}
      >
        CELESTIA
      </h1>

      <p
        className="font-sans"
        style={{
          fontSize: 11,
          fontWeight: 300,
          letterSpacing: 4,
          textTransform: 'uppercase',
          color: 'rgba(250,248,242,0.36)',
          marginBottom: 56,
          opacity: fadeIn ? 1 : 0,
          transform: fadeIn ? 'translateY(0)' : 'translateY(30px)',
          transition: 'opacity 0.9s ease 0.2s, transform 0.9s ease 0.2s',
        }}
      >
        NAVIGATE YOUR COSMOS
      </p>

      {/* CTA */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          opacity: fadeIn ? 1 : 0,
          transform: fadeIn ? 'translateY(0)' : 'translateY(30px)',
          transition: 'opacity 0.9s ease 0.2s, transform 0.9s ease 0.2s',
        }}
      >
        <button
          onClick={() => onNavigate?.('onboarding')}
          style={{
            width: 292,
            height: 58,
            borderRadius: 29,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #E2C46A 0%, #C8A84B 50%, #A07820 100%)',
            boxShadow: '0 6px 26px rgba(200,168,75,0.38)',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <span
            className="font-sans"
            style={{
              fontWeight: 500,
              fontSize: 16,
              color: '#0E0E22',
              letterSpacing: 0.3,
            }}
          >
            Begin Your Journey ✦
          </span>
        </button>

        <button
          onClick={() => onNavigate?.('auth')}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <span style={{ fontSize: 13, color: 'rgba(250,248,242,0.38)' }}>
            Already exploring?{' '}
            <span
              style={{
                color: 'rgba(200,168,75,0.75)',
                borderBottom: '1px solid rgba(200,168,75,0.3)',
              }}
            >
              Sign in
            </span>
          </span>
        </button>
      </div>

      <style jsx>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-slow-reverse {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-9px); }
        }
        .animate-spin-slow {
          animation: spin-slow 16s linear infinite;
        }
        .animate-spin-slow-reverse {
          animation: spin-slow-reverse 24s linear infinite;
        }
        .animate-float {
          animation: float 5.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

/* Simple Stars component for the splash screen */
function Stars({ count = 34 }) {
  const [stars, setStars] = useState([]);

  useEffect(() => {
    const generated = Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.5 + 0.15,
      delay: Math.random() * 4,
      duration: Math.random() * 3 + 2,
    }));
    setStars(generated);
  }, [count]);

  return (
    <>
      {stars.map((star) => (
        <div
          key={star.id}
          style={{
            position: 'absolute',
            left: `${star.left}%`,
            top: `${star.top}%`,
            width: star.size,
            height: star.size,
            borderRadius: '50%',
            backgroundColor: 'rgba(250,248,242,0.6)',
            opacity: star.opacity,
            animation: `twinkle ${star.duration}s ease-in-out ${star.delay}s infinite`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </>
  );
}
