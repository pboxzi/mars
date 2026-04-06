import { useEffect, useState } from 'react';
import axios from 'axios';

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || '').trim();
const API = BACKEND_URL ? `${BACKEND_URL}/api` : '';
const ENV_TURNSTILE_SITE_KEY = (process.env.REACT_APP_TURNSTILE_SITE_KEY || '').trim();

const buildTurnstileConfig = ({ siteKey = '', enabled } = {}) => {
  const normalizedSiteKey = String(siteKey || '').trim();

  return {
    siteKey: normalizedSiteKey,
    enabled: typeof enabled === 'boolean' ? enabled && Boolean(normalizedSiteKey) : Boolean(normalizedSiteKey),
  };
};

const fallbackConfig = buildTurnstileConfig({ siteKey: ENV_TURNSTILE_SITE_KEY });

let cachedTurnstileConfig = null;
let turnstileConfigPromise = null;

const normalizeApiConfig = (data = {}) =>
  buildTurnstileConfig({
    siteKey: data.turnstile_site_key,
    enabled: data.captcha_enabled,
  });

const fetchTurnstileConfig = async () => {
  if (cachedTurnstileConfig) {
    return cachedTurnstileConfig;
  }

  if (!API) {
    cachedTurnstileConfig = fallbackConfig;
    return cachedTurnstileConfig;
  }

  if (!turnstileConfigPromise) {
    turnstileConfigPromise = axios
      .get(`${API}/public-config`)
      .then((response) => {
        cachedTurnstileConfig = normalizeApiConfig(response.data);
        return cachedTurnstileConfig;
      })
      .catch((error) => {
        console.error('Error fetching Turnstile config:', error);
        cachedTurnstileConfig = fallbackConfig;
        return cachedTurnstileConfig;
      })
      .finally(() => {
        turnstileConfigPromise = null;
      });
  }

  return turnstileConfigPromise;
};

const useTurnstileConfig = () => {
  const [config, setConfig] = useState(() => cachedTurnstileConfig || fallbackConfig);
  const [loading, setLoading] = useState(() => !cachedTurnstileConfig && Boolean(API));

  useEffect(() => {
    let isMounted = true;

    if (!API) {
      cachedTurnstileConfig = fallbackConfig;
      setLoading(false);
      return () => {
        isMounted = false;
      };
    }

    fetchTurnstileConfig().then((nextConfig) => {
      if (!isMounted) {
        return;
      }

      setConfig(nextConfig);
      setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    siteKey: config.siteKey,
    isTurnstileEnabled: !loading && config.enabled,
    isLoadingTurnstileConfig: loading,
  };
};

export default useTurnstileConfig;
