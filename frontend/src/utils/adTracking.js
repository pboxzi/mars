const META_PIXEL_ID = (process.env.REACT_APP_META_PIXEL_ID || '').trim();
const GOOGLE_TAG_ID = (process.env.REACT_APP_GOOGLE_TAG_ID || '').trim();
const GOOGLE_ADS_BOOKING_LABEL = (process.env.REACT_APP_GOOGLE_ADS_BOOKING_LABEL || '').trim();
const GOOGLE_ADS_SUBSCRIBE_LABEL = (process.env.REACT_APP_GOOGLE_ADS_SUBSCRIBE_LABEL || '').trim();
const GOOGLE_ADS_PAYMENT_UPDATE_LABEL = (process.env.REACT_APP_GOOGLE_ADS_PAYMENT_UPDATE_LABEL || '').trim();
const POSTHOG_KEY = (process.env.REACT_APP_POSTHOG_KEY || '').trim();
const POSTHOG_HOST = (process.env.REACT_APP_POSTHOG_HOST || 'https://us.i.posthog.com').trim();
const POSTHOG_ASSET_HOST = POSTHOG_HOST.replace('.i.posthog.com', '-assets.i.posthog.com').replace(/\/+$/, '');

const hasWindow = typeof window !== 'undefined';

const injectScript = (id, src) => {
  if (!hasWindow || document.getElementById(id)) {
    return;
  }

  const script = document.createElement('script');
  script.id = id;
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
};

const ensureMetaPixel = () => {
  if (!hasWindow || !META_PIXEL_ID) {
    return;
  }

  if (!window.fbq) {
    const fbq = function () {
      if (fbq.callMethod) {
        fbq.callMethod.apply(fbq, arguments);
      } else {
        fbq.queue.push(arguments);
      }
    };

    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = '2.0';
    fbq.queue = [];

    window.fbq = fbq;
    window._fbq = fbq;
    injectScript('bruno-meta-pixel', 'https://connect.facebook.net/en_US/fbevents.js');
  }

  if (!window.__brunoMetaPixelInitialized) {
    window.fbq('init', META_PIXEL_ID);
    window.__brunoMetaPixelInitialized = true;
  }
};

const ensureGoogleTag = () => {
  if (!hasWindow || !GOOGLE_TAG_ID) {
    return;
  }

  injectScript('bruno-google-tag', `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GOOGLE_TAG_ID)}`);

  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };
  }

  if (!window.__brunoGoogleTagInitialized) {
    window.gtag('js', new Date());
    window.gtag('config', GOOGLE_TAG_ID);
    window.__brunoGoogleTagInitialized = true;
  }
};

const ensurePosthog = () => {
  if (!hasWindow || !POSTHOG_KEY) {
    return;
  }

  if (!window.posthog) {
    const posthog = [];
    const attachStub = (target, methodName) => {
      target[methodName] = function stubbedPosthogMethod() {
        target.push([methodName].concat(Array.prototype.slice.call(arguments, 0)));
      };
    };

    posthog._i = [];
    posthog.init = function initPosthog(key, config, namespace) {
      let target = posthog;
      let scopedNamespace = namespace;

      if (typeof scopedNamespace !== 'undefined') {
        target = posthog[scopedNamespace] = [];
      } else {
        scopedNamespace = 'posthog';
      }

      target.people = target.people || [];
      target.toString = function stringifyPosthog(isStub) {
        let label = 'posthog';
        if (scopedNamespace !== 'posthog') {
          label += `.${scopedNamespace}`;
        }

        if (!isStub) {
          label += ' (stub)';
        }

        return label;
      };
      target.people.toString = function stringifyPosthogPeople() {
        return `${target.toString(1)}.people (stub)`;
      };

      'capture identify alias group resetGroups setPersonProperties setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroups register register_once unregister register_for_session unregister_for_session reset isFeatureEnabled getFeatureFlag getFeatureFlagPayload reloadFeatureFlags onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey canRenderSurveyAsync startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty get_session_id get_distinct_id'.split(
        ' '
      ).forEach((methodName) => attachStub(target, methodName));

      'set set_once unset increment append union track_charge clear_charges delete_user'.split(' ').forEach((personMethod) =>
        attachStub(target.people, personMethod)
      );

      posthog._i.push([key, config, scopedNamespace]);
    };

    window.posthog = posthog;
    injectScript('bruno-posthog', `${POSTHOG_ASSET_HOST}/static/array.js`);
  }

  if (!window.__brunoPosthogInitialized && typeof window.posthog.init === 'function') {
    window.posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      person_profiles: 'identified_only',
      session_recording: {
        recordCrossOriginIframes: true,
        capturePerformance: false,
      },
    });
    window.__brunoPosthogInitialized = true;
  }
};

export const loadAdTracking = () => {
  ensureMetaPixel();
  ensureGoogleTag();
  ensurePosthog();
};

const sendGoogleConversion = (label, payload) => {
  if (!hasWindow || !GOOGLE_TAG_ID || !window.gtag) {
    return;
  }

  if (label) {
    window.gtag('event', 'conversion', {
      send_to: `${GOOGLE_TAG_ID}/${label}`,
      ...payload,
    });
  }
};

const cleanPayload = (payload) =>
  Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined && value !== null && value !== ''));

export const trackPageView = ({ path, title } = {}) => {
  loadAdTracking();

  const pagePath =
    path ||
    (hasWindow && window.location
      ? `${window.location.pathname}${window.location.search}${window.location.hash}`
      : undefined);
  const pageLocation =
    hasWindow && window.location && pagePath
      ? `${window.location.origin}${pagePath}`
      : undefined;

  const payload = cleanPayload({
    page_path: pagePath,
    page_title: title,
    page_location: pageLocation,
  });

  if (hasWindow && window.fbq) {
    window.fbq('track', 'PageView');
  }

  if (hasWindow && window.gtag) {
    window.gtag('event', 'page_view', payload);
  }

  if (hasWindow && window.posthog && typeof window.posthog.capture === 'function') {
    window.posthog.capture('$pageview', payload);
  }
};

export const trackBookingSubmitted = ({ value, currency = 'USD', ticketType, quantity, eventId, source = 'booking-modal' } = {}) => {
  loadAdTracking();
  const payload = cleanPayload({
    value,
    currency,
    content_name: 'Bruno Mars Premium Request',
    content_category: ticketType,
    num_items: quantity,
    event_id: eventId,
    source,
  });

  if (hasWindow && window.fbq) {
    window.fbq('track', 'Lead', payload);
    window.fbq('trackCustom', 'BookingSubmitted', payload);
  }

  if (hasWindow && window.gtag) {
    window.gtag('event', 'generate_lead', payload);
    window.gtag('event', 'booking_submitted', payload);
  }

  sendGoogleConversion(GOOGLE_ADS_BOOKING_LABEL, payload);
};

export const trackSubscribeSubmitted = ({ source = 'subscribe-page' } = {}) => {
  loadAdTracking();
  const payload = cleanPayload({
    method: source,
    content_name: 'Bruno Mars Subscription',
  });

  if (hasWindow && window.fbq) {
    window.fbq('track', 'CompleteRegistration', payload);
    window.fbq('trackCustom', 'SubscribeSubmitted', payload);
  }

  if (hasWindow && window.gtag) {
    window.gtag('event', 'sign_up', payload);
    window.gtag('event', 'subscribe_submitted', payload);
  }

  sendGoogleConversion(GOOGLE_ADS_SUBSCRIBE_LABEL, payload);
};

export const trackPaymentUpdateSubmitted = ({ paymentMethod, value, currency = 'USD', confirmationNumber } = {}) => {
  loadAdTracking();
  const payload = cleanPayload({
    payment_type: paymentMethod,
    value,
    currency,
    transaction_id: confirmationNumber,
  });

  if (hasWindow && window.fbq) {
    window.fbq('trackCustom', 'PaymentUpdateSubmitted', payload);
  }

  if (hasWindow && window.gtag) {
    window.gtag('event', 'submit_application', payload);
    window.gtag('event', 'payment_update_submitted', payload);
  }

  sendGoogleConversion(GOOGLE_ADS_PAYMENT_UPDATE_LABEL, payload);
};
