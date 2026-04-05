import React, { useEffect, useRef, useState } from 'react';

export const TURNSTILE_SITE_KEY = (process.env.REACT_APP_TURNSTILE_SITE_KEY || '').trim();
export const isTurnstileEnabled = Boolean(TURNSTILE_SITE_KEY);

const TURNSTILE_SCRIPT_ID = 'bruno-turnstile-script';
const TURNSTILE_SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

let turnstileLoader;

const loadTurnstileScript = () => {
  if (!isTurnstileEnabled || typeof window === 'undefined') {
    return Promise.resolve(null);
  }

  if (window.turnstile) {
    return Promise.resolve(window.turnstile);
  }

  if (turnstileLoader) {
    return turnstileLoader;
  }

  turnstileLoader = new Promise((resolve, reject) => {
    const existing = document.getElementById(TURNSTILE_SCRIPT_ID);
    if (existing) {
      existing.addEventListener('load', () => resolve(window.turnstile));
      existing.addEventListener('error', reject);
      return;
    }

    const script = document.createElement('script');
    script.id = TURNSTILE_SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.src = TURNSTILE_SCRIPT_SRC;
    script.onload = () => resolve(window.turnstile);
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return turnstileLoader;
};

const TurnstileField = ({ token, onTokenChange, resetSignal = 0, error = '' }) => {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!isTurnstileEnabled || !containerRef.current) {
      return undefined;
    }

    let active = true;

    loadTurnstileScript()
      .then((turnstile) => {
        if (!active || !turnstile || widgetIdRef.current !== null) {
          return;
        }

        widgetIdRef.current = turnstile.render(containerRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          theme: 'light',
          callback: (nextToken) => {
            setLoadError('');
            onTokenChange(nextToken);
          },
          'expired-callback': () => onTokenChange(''),
          'error-callback': () => {
            onTokenChange('');
            setLoadError('Security check unavailable. Please refresh and try again.');
          },
        });
      })
      .catch(() => {
        setLoadError('Security check unavailable. Please refresh and try again.');
      });

    return () => {
      active = false;
      if (widgetIdRef.current !== null && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [onTokenChange]);

  useEffect(() => {
    if (!isTurnstileEnabled || widgetIdRef.current === null || !window.turnstile) {
      return;
    }

    window.turnstile.reset(widgetIdRef.current);
    onTokenChange('');
  }, [resetSignal, onTokenChange]);

  if (!isTurnstileEnabled) {
    return null;
  }

  return (
    <div className="mt-4 space-y-2">
      <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6a6055]">Security Check</div>
      <div className="rounded-[18px] border border-[#ddcfbe] bg-white px-3 py-3">
        <div ref={containerRef} />
      </div>
      {!token && !loadError && !error && (
        <p className="text-xs text-[#6a6055]">Please complete the security check before sending your request.</p>
      )}
      {(loadError || error) && <p className="text-sm text-[#b42318]">{loadError || error}</p>}
    </div>
  );
};

export default TurnstileField;
