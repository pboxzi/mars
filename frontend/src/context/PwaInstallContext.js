import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const PwaInstallContext = createContext({
  canInstall: false,
  isStandalone: false,
  isIos: false,
  needsManualInstall: false,
  promptInstall: async () => ({ outcome: 'unavailable' })
});

let deferredPromptEvent = null;

const isStandaloneMode = () =>
  window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

const isiOSDevice = () => /iphone|ipad|ipod/i.test(window.navigator.userAgent);

export const PwaInstallProvider = ({ children }) => {
  const [installEvent, setInstallEvent] = useState(deferredPromptEvent);
  const [isStandalone, setIsStandalone] = useState(() => isStandaloneMode());
  const [isIos] = useState(() => isiOSDevice());

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      deferredPromptEvent = event;
      setInstallEvent(event);
    };

    const handleAppInstalled = () => {
      deferredPromptEvent = null;
      setInstallEvent(null);
      setIsStandalone(true);
    };

    const handleDisplayChange = () => {
      setIsStandalone(isStandaloneMode());
    };

    const mediaQuery = window.matchMedia('(display-mode: standalone)');

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('focus', handleDisplayChange);
    document.addEventListener('visibilitychange', handleDisplayChange);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleDisplayChange);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleDisplayChange);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('focus', handleDisplayChange);
      document.removeEventListener('visibilitychange', handleDisplayChange);

      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleDisplayChange);
      } else if (mediaQuery.removeListener) {
        mediaQuery.removeListener(handleDisplayChange);
      }
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPromptEvent) {
      return { outcome: 'unavailable' };
    }

    const activePrompt = deferredPromptEvent;
    await activePrompt.prompt();
    const result = await activePrompt.userChoice;

    if (result.outcome !== 'dismissed') {
      deferredPromptEvent = null;
      setInstallEvent(null);
    }

    return result;
  };

  const value = useMemo(
    () => ({
      canInstall: Boolean(installEvent),
      isStandalone,
      isIos,
      needsManualInstall: !installEvent && !isStandalone && isIos,
      promptInstall
    }),
    [installEvent, isIos, isStandalone]
  );

  return <PwaInstallContext.Provider value={value}>{children}</PwaInstallContext.Provider>;
};

export const usePwaInstall = () => useContext(PwaInstallContext);
