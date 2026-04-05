import React, { useMemo, useState } from 'react';
import { Download, Smartphone, MonitorSmartphone } from 'lucide-react';
import { usePwaInstall } from '../context/PwaInstallContext';

const AdminInstallPrompt = ({ compact = false }) => {
  const { canInstall, isStandalone, isIos, needsManualInstall, promptInstall } = usePwaInstall();
  const [installing, setInstalling] = useState(false);
  const [feedback, setFeedback] = useState('');

  const helperCopy = useMemo(() => {
    if (needsManualInstall) {
      return {
        title: 'Install on iPhone',
        description: 'Safari > Share > Add to Home Screen.',
        buttonLabel: 'Use Safari'
      };
    }

    if (canInstall) {
      return {
        title: 'Install Admin',
        description: 'Save this admin panel as an app.',
        buttonLabel: 'Install App'
      };
    }

    return {
      title: 'Install Admin',
      description: 'Open in Chrome or Edge, then refresh once.',
      buttonLabel: 'Refresh'
    };
  }, [canInstall, needsManualInstall]);

  if (isStandalone) {
    return (
      <div className={`${compact ? 'p-3' : 'p-5'} rounded-2xl border border-stone-200 bg-white`}>
        <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] sm:tracking-[0.24em] text-[#9d172b] mb-1.5 sm:mb-2">Installed</p>
        <p className={`${compact ? 'text-xs leading-5' : 'text-sm'} text-stone-600`}>Admin app is ready on this device.</p>
      </div>
    );
  }

  const handleAction = async () => {
    if (canInstall) {
      setInstalling(true);
      setFeedback('');

      try {
        const result = await promptInstall();
        if (result.outcome === 'accepted') {
          setFeedback('Install started.');
        } else if (result.outcome === 'dismissed') {
          setFeedback('Install canceled.');
        } else {
          setFeedback('Refresh and try again.');
        }
      } finally {
        setInstalling(false);
      }
      return;
    }

    if (!needsManualInstall) {
      window.location.reload();
    }
  };

  return (
    <div
      className={`${compact ? 'p-3' : 'p-5'} rounded-[24px] border border-stone-200 bg-white shadow-[0_12px_35px_rgba(48,32,11,0.05)]`}
      data-testid="admin-install-prompt"
    >
      <div className="flex items-start gap-3">
        <div className={`${compact ? 'w-9 h-9' : 'w-11 h-11'} rounded-full bg-[#f4eadf] border border-[#decab0] flex items-center justify-center shrink-0`}>
          {isIos ? (
            <Smartphone className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-[#9d172b]`} />
          ) : (
            <MonitorSmartphone className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-[#9d172b]`} />
          )}
        </div>

        <div className="min-w-0">
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] sm:tracking-[0.24em] text-[#9d172b] mb-1.5 sm:mb-2">Admin App</p>
          <h3 className={`${compact ? 'text-sm sm:text-base' : 'text-xl'} font-black text-[#151515] mb-1.5 sm:mb-2`}>
            {helperCopy.title}
          </h3>
          <p className={`${compact ? 'text-xs leading-5' : 'text-sm leading-6'} text-stone-600`}>
            {helperCopy.description}
          </p>
        </div>
      </div>

      <div className={`${compact ? 'mt-3' : 'mt-4'} flex flex-col gap-3`}>
        {!needsManualInstall && (
          <button
            type="button"
            onClick={handleAction}
            disabled={installing}
            className={`inline-flex items-center justify-center gap-2 rounded-2xl bg-[#151515] ${compact ? 'px-3 py-2.5 text-[11px] tracking-[0.15em]' : 'px-4 py-3 text-sm tracking-[0.18em]'} font-bold uppercase text-white transition hover:bg-[#2b2b2b] disabled:opacity-50`}
          >
            <Download className="w-4 h-4" />
            {installing ? 'Working...' : helperCopy.buttonLabel}
          </button>
        )}

        {!canInstall && !needsManualInstall && (
          <p className="text-xs text-stone-500">If install does not show yet, refresh once.</p>
        )}

        {feedback && <p className="text-xs text-stone-500">{feedback}</p>}
      </div>
    </div>
  );
};

export default AdminInstallPrompt;
