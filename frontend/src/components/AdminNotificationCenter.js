import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import {
  Bell,
  ExternalLink,
  Globe,
  MapPin,
  Monitor,
  RefreshCcw,
  Smartphone,
  Tablet,
} from 'lucide-react';

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || '').trim().replace(/\/+$/, '');
const API = `${BACKEND_URL}/api`;
const POLL_INTERVAL_MS = 10000;

const getNotificationPermission = () => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return window.Notification.permission;
};

const formatRelativeTime = (value) => {
  if (!value) {
    return 'Just now';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'Just now';
  }

  const seconds = Math.max(1, Math.round((Date.now() - parsed.getTime()) / 1000));
  if (seconds < 60) {
    return `${seconds}s ago`;
  }

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.round(hours / 24);
  return `${days}d ago`;
};

const formatLocation = (visit) => {
  const parts = [visit.location_city, visit.location_region, visit.location_country].filter(Boolean);
  if (parts.length > 0) {
    return parts.join(', ');
  }

  if (visit.timezone) {
    return visit.timezone;
  }

  return 'Location unavailable';
};

const formatReferrer = (visit) => {
  if (visit.referrer_domain) {
    return visit.referrer_domain;
  }

  if (visit.referrer) {
    return visit.referrer;
  }

  return 'Direct visit';
};

const formatIpAddress = (visit) => {
  if (visit.ip_address) {
    return visit.ip_address;
  }

  return 'IP unavailable';
};

const getDeviceIcon = (deviceType) => {
  const normalized = (deviceType || '').toLowerCase();
  if (normalized.includes('mobile')) {
    return Smartphone;
  }
  if (normalized.includes('tablet')) {
    return Tablet;
  }
  return Monitor;
};

const buildDesktopNotificationBody = (visit) => {
  const detailParts = [visit.source, visit.path, formatLocation(visit), formatIpAddress(visit)].filter(Boolean);
  return detailParts.join(' | ');
};

const AdminNotificationCenter = ({ compact = false }) => {
  const [feed, setFeed] = useState({ unread_count: 0, notifications: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [permission, setPermission] = useState(getNotificationPermission);
  const panelRef = useRef(null);
  const fetchFeedRef = useRef(async () => {});
  const knownIdsRef = useRef(new Set());
  const hasLoadedRef = useRef(false);
  const panelClasses = compact
    ? 'fixed inset-x-3 top-[4.75rem] z-50 max-h-[calc(100vh-6.5rem)] overflow-hidden rounded-[24px] border border-stone-200 bg-[#fcfaf6] shadow-[0_18px_50px_rgba(48,32,11,0.18)]'
    : 'absolute right-0 top-full z-50 mt-3 w-[min(94vw,26rem)] overflow-hidden rounded-[24px] border border-stone-200 bg-[#fcfaf6] shadow-[0_18px_50px_rgba(48,32,11,0.18)]';
  const feedBodyClasses = compact
    ? 'max-h-[calc(100vh-14rem)] overflow-y-auto px-3.5 py-3.5'
    : 'max-h-[24rem] overflow-y-auto px-4 py-4';

  const markAllRead = async () => {
    const token = localStorage.getItem('admin_token');
    if (!token || !BACKEND_URL) {
      return;
    }

    const readAt = new Date().toISOString();

    try {
      await axios.post(
        `${API}/admin/public-visits/read`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setFeed((currentFeed) => ({
        unread_count: 0,
        notifications: currentFeed.notifications.map((visit) => ({
          ...visit,
          read_at: visit.read_at || readAt,
        })),
      }));
    } catch (requestError) {
      console.error('Unable to mark public visits as read:', requestError);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const maybeNotifyDesktop = (visit) => {
      if (typeof window === 'undefined' || !('Notification' in window) || window.Notification.permission !== 'granted') {
        return;
      }

      const desktopNotification = new window.Notification('New public link visit', {
        body: buildDesktopNotificationBody(visit),
      });

      desktopNotification.onclick = () => {
        window.focus();
      };
    };

    const fetchFeed = async (isBackgroundRefresh = false) => {
      const token = localStorage.getItem('admin_token');
      if (!token || !BACKEND_URL) {
        if (isMounted && !isBackgroundRefresh) {
          setLoading(false);
        }
        return;
      }

      try {
        const response = await axios.get(`${API}/admin/public-visits`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!isMounted) {
          return;
        }

        const nextFeed = {
          unread_count: response.data?.unread_count || 0,
          notifications: Array.isArray(response.data?.notifications) ? response.data.notifications : [],
        };

        if (hasLoadedRef.current) {
          const newVisits = nextFeed.notifications.filter((visit) => !knownIdsRef.current.has(visit.id));
          if (newVisits.length > 0) {
            maybeNotifyDesktop(newVisits[0]);
          }
        }

        knownIdsRef.current = new Set(nextFeed.notifications.map((visit) => visit.id));
        hasLoadedRef.current = true;
        setFeed(nextFeed);
        setError('');
      } catch (requestError) {
        if (!isMounted) {
          return;
        }

        if (!isBackgroundRefresh) {
          setError('Live alerts are unavailable right now.');
        }
        console.error('Unable to fetch public visit notifications:', requestError);
      } finally {
        if (isMounted && !isBackgroundRefresh) {
          setLoading(false);
        }
      }
    };

    fetchFeedRef.current = fetchFeed;
    fetchFeed(false);

    const intervalId = window.setInterval(() => {
      fetchFeed(true);
    }, POLL_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchFeed(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!panelRef.current || panelRef.current.contains(event.target)) {
        return;
      }
      setIsOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [isOpen]);

  const handleTogglePanel = async () => {
    const nextOpenState = !isOpen;
    setIsOpen(nextOpenState);
    if (nextOpenState && feed.unread_count > 0) {
      await markAllRead();
    }
  };

  const handleEnableDesktopAlerts = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPermission('unsupported');
      return;
    }

    const nextPermission = await window.Notification.requestPermission();
    setPermission(nextPermission);
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={handleTogglePanel}
        className={`relative inline-flex items-center rounded-full border border-stone-200 bg-white text-sm font-semibold text-[#151515] shadow-sm transition hover:border-stone-300 ${
          compact
            ? 'h-10 w-10 justify-center'
            : 'h-11 gap-2 px-4'
        }`}
        aria-label="Open live notifications"
      >
        <Bell className="h-4 w-4" />
        {!compact && <span className="hidden sm:inline">Live Alerts</span>}
        <span className={`inline-flex rounded-full bg-emerald-500 ${compact ? 'absolute right-2 top-2 h-2 w-2' : 'h-2.5 w-2.5'}`} />
        {feed.unread_count > 0 && (
          <span className={`absolute inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#9d172b] px-1.5 text-[10px] font-bold text-white ${
            compact ? '-right-1 -top-1' : '-right-1 -top-1'
          }`}>
            {feed.unread_count > 9 ? '9+' : feed.unread_count}
          </span>
        )}
      </button>

      {isOpen && (
        <div className={panelClasses}>
          <div className={`border-b border-stone-200 ${compact ? 'px-3.5 py-3.5' : 'px-4 py-4'}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-[#9d172b]">Live Traffic</p>
                <h3 className={`mt-1 font-black text-[#151515] ${compact ? 'text-base' : 'text-lg'}`}>Public Link Visits</h3>
                <p className="mt-1 text-xs text-stone-500">
                  {compact ? 'Recent fan visits appear here.' : 'New landings appear here within a few seconds.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => fetchFeedRef.current(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-500"
                aria-label="Refresh live visits"
              >
                <RefreshCcw className="h-4 w-4" />
              </button>
            </div>

            {permission === 'default' && (
              <div className={`mt-4 rounded-2xl border border-[#9d172b]/15 bg-[#9d172b]/5 ${compact ? 'p-2.5' : 'p-3'}`}>
                <p className="text-sm font-semibold text-[#151515]">Desktop alerts are off</p>
                <p className="mt-1 text-xs leading-5 text-stone-600">
                  Turn them on if you want the browser to alert you as soon as a new fan opens the public link.
                </p>
                <button
                  type="button"
                  onClick={handleEnableDesktopAlerts}
                  className="mt-3 inline-flex rounded-full bg-[#151515] px-4 py-2 text-xs font-semibold text-white"
                >
                  Enable Desktop Alerts
                </button>
              </div>
            )}

            {permission === 'denied' && (
              <div className={`mt-4 rounded-2xl border border-stone-200 bg-white ${compact ? 'p-2.5' : 'p-3'}`}>
                <p className="text-sm font-semibold text-[#151515]">Desktop alerts are blocked</p>
                <p className="mt-1 text-xs leading-5 text-stone-600">
                  Browser notifications are blocked for this admin session. You can still watch live visits here from the bell.
                </p>
              </div>
            )}
          </div>

          <div className={feedBodyClasses}>
            {loading ? (
              <p className="text-sm text-stone-500">Loading live visits...</p>
            ) : error ? (
              <p className="text-sm text-red-600">{error}</p>
            ) : feed.notifications.length === 0 ? (
              <p className="text-sm text-stone-500">No public visits yet.</p>
            ) : (
              <div className="space-y-3">
                {feed.notifications.map((visit) => {
                  const DeviceIcon = getDeviceIcon(visit.device_type);

                  return (
                    <div
                      key={visit.id}
                      className={`rounded-2xl border ${compact ? 'p-2.5' : 'p-3'} ${
                        visit.read_at ? 'border-stone-200 bg-white' : 'border-[#9d172b]/20 bg-[#9d172b]/5'
                      }`}
                    >
                      <div className={`gap-2.5 ${compact ? 'flex flex-col' : 'flex items-start justify-between'}`}>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#151515]">
                            {visit.source || 'Direct'} opened <span className="font-mono break-all">{visit.path}</span>
                          </p>
                          <p className="mt-1 text-xs text-stone-500 break-words">
                            {visit.page_title || visit.page_url || 'Public page visit'}
                          </p>
                        </div>
                        <span className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-400">
                          {formatRelativeTime(visit.created_at)}
                        </span>
                      </div>

                      <div className={`mt-3 grid gap-2 text-xs text-stone-600 ${compact ? '' : ''}`}>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-[#9d172b]" />
                          <span className="break-words">{formatLocation(visit)}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Globe className="h-3.5 w-3.5 shrink-0 text-[#9d172b]" />
                          <span className="break-all">IP: {formatIpAddress(visit)}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Globe className="h-3.5 w-3.5 shrink-0 text-[#9d172b]" />
                          <span className="break-words">{formatReferrer(visit)}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <DeviceIcon className="h-3.5 w-3.5 shrink-0 text-[#9d172b]" />
                          <span className="break-words">
                            {visit.device_type || 'Device unavailable'}
                            {visit.language ? ` | ${visit.language}` : ''}
                          </span>
                        </div>

                        {(visit.utm_source || visit.utm_campaign) && (
                          <div className="text-xs text-stone-500 break-words">
                            Campaign: {[visit.utm_source, visit.utm_campaign].filter(Boolean).join(' / ')}
                          </div>
                        )}
                      </div>

                      {visit.page_url && (
                        <a
                          href={visit.page_url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#9d172b]"
                        >
                          Open public page
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNotificationCenter;
