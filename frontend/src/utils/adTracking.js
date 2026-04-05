const META_PIXEL_ID = (process.env.REACT_APP_META_PIXEL_ID || '').trim();
const GOOGLE_TAG_ID = (process.env.REACT_APP_GOOGLE_TAG_ID || '').trim();
const GOOGLE_ADS_BOOKING_LABEL = (process.env.REACT_APP_GOOGLE_ADS_BOOKING_LABEL || '').trim();
const GOOGLE_ADS_SUBSCRIBE_LABEL = (process.env.REACT_APP_GOOGLE_ADS_SUBSCRIBE_LABEL || '').trim();
const GOOGLE_ADS_PAYMENT_UPDATE_LABEL = (process.env.REACT_APP_GOOGLE_ADS_PAYMENT_UPDATE_LABEL || '').trim();

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

export const loadAdTracking = () => {
  ensureMetaPixel();
  ensureGoogleTag();
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
