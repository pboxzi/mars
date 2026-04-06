import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const PUBLIC_URL = process.env.PUBLIC_URL || '';
const SITE_URL = (process.env.REACT_APP_SITE_URL || '').trim();
const DEFAULT_DESCRIPTION =
  'Official Bruno Mars The Romantic Tour site. Explore tour dates, request premium access, and track your booking online.';
const DEFAULT_IMAGE_PATH = `${PUBLIC_URL}/social-preview.png`;

const ensureHeadTag = (selector, createTag) => {
  const existingTag = document.head.querySelector(selector);
  if (existingTag) {
    return existingTag;
  }

  const tag = createTag();
  document.head.appendChild(tag);
  return tag;
};

const normalizeSiteBaseUrl = () => {
  if (SITE_URL) {
    return SITE_URL.replace(/\/+$/, '');
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/+$/, '');
  }

  return '';
};

const buildAbsoluteUrl = (path = '') => {
  if (!path) {
    return normalizeSiteBaseUrl();
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizeSiteBaseUrl()}${normalizedPath}`;
};

const getPageMeta = (pathname) => {
  if (pathname === '/tour') {
    return {
      title: 'Bruno Mars | The Romantic Tour',
      description: 'Browse official Bruno Mars tour dates and start a premium access request for upcoming shows.',
      robots: 'index,follow,max-image-preview:large',
    };
  }

  if (pathname === '/music') {
    return {
      title: 'Music | Bruno Mars',
      description: 'Listen to Bruno Mars music, watch featured videos, and explore the latest releases.',
      robots: 'index,follow,max-image-preview:large',
    };
  }

  if (pathname === '/subscribe') {
    return {
      title: 'Subscribe | Bruno Mars',
      description: 'Join the Bruno Mars mailing list for tour updates, exclusive news, and special announcements.',
      robots: 'index,follow,max-image-preview:large',
    };
  }

  if (pathname === '/booking-status') {
    return {
      title: 'Track Booking | Bruno Mars',
      description: 'Track your Bruno Mars premium booking request and send payment updates securely online.',
      robots: 'noindex,nofollow,noarchive',
    };
  }

  if (pathname === '/admin-secret') {
    return {
      title: 'Admin Login | Bruno Mars',
      description: 'Admin access for Bruno Mars VIP booking management.',
      robots: 'noindex,nofollow,noarchive',
    };
  }

  if (pathname === '/admin-secret/dashboard') {
    return {
      title: 'Admin Dashboard | Bruno Mars',
      description: 'Admin access for Bruno Mars VIP booking management.',
      robots: 'noindex,nofollow,noarchive',
    };
  }

  if (pathname === '/admin-secret/events') {
    return {
      title: 'Events | Bruno Mars Admin',
      description: 'Admin access for Bruno Mars VIP booking management.',
      robots: 'noindex,nofollow,noarchive',
    };
  }

  if (pathname === '/admin-secret/bookings') {
    return {
      title: 'Bookings | Bruno Mars Admin',
      description: 'Admin access for Bruno Mars VIP booking management.',
      robots: 'noindex,nofollow,noarchive',
    };
  }

  if (pathname === '/admin-secret/payment-settings') {
    return {
      title: 'Payments | Bruno Mars Admin',
      description: 'Admin access for Bruno Mars VIP booking management.',
      robots: 'noindex,nofollow,noarchive',
    };
  }

  return {
    title: 'Bruno Mars | The Romantic Tour',
    description: DEFAULT_DESCRIPTION,
    robots: 'index,follow,max-image-preview:large',
  };
};

const ManifestManager = () => {
  const location = useLocation();

  useEffect(() => {
    const isAdminRoute = location.pathname.startsWith('/admin-secret');
    const manifestPath = isAdminRoute ? `${PUBLIC_URL}/admin.webmanifest` : `${PUBLIC_URL}/site.webmanifest`;
    const themeColor = isAdminRoute ? '#f7f3ec' : '#ffffff';
    const appleTitle = isAdminRoute ? 'Bruno Admin' : 'Bruno Mars';
    const pageMeta = getPageMeta(location.pathname);
    const canonicalUrl = buildAbsoluteUrl(location.pathname || '/');
    const socialImageUrl = buildAbsoluteUrl(DEFAULT_IMAGE_PATH);

    const manifestLink = ensureHeadTag('link[rel="manifest"]', () => {
      const link = document.createElement('link');
      link.rel = 'manifest';
      return link;
    });
    manifestLink.setAttribute('href', manifestPath);

    const themeMeta = ensureHeadTag('meta[name="theme-color"]', () => {
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      return meta;
    });
    themeMeta.setAttribute('content', themeColor);

    const appleTitleMeta = ensureHeadTag('meta[name="apple-mobile-web-app-title"]', () => {
      const meta = document.createElement('meta');
      meta.name = 'apple-mobile-web-app-title';
      return meta;
    });
    appleTitleMeta.setAttribute('content', appleTitle);

    const descriptionMeta = ensureHeadTag('meta[name="description"]', () => {
      const meta = document.createElement('meta');
      meta.name = 'description';
      return meta;
    });
    descriptionMeta.setAttribute('content', pageMeta.description);

    const robotsMeta = ensureHeadTag('meta[name="robots"]', () => {
      const meta = document.createElement('meta');
      meta.name = 'robots';
      return meta;
    });
    robotsMeta.setAttribute('content', pageMeta.robots);

    const canonicalLink = ensureHeadTag('link[rel="canonical"]', () => {
      const link = document.createElement('link');
      link.rel = 'canonical';
      return link;
    });
    canonicalLink.setAttribute('href', canonicalUrl);

    const openGraphTitle = ensureHeadTag('meta[property="og:title"]', () => {
      const meta = document.createElement('meta');
      meta.setAttribute('property', 'og:title');
      return meta;
    });
    openGraphTitle.setAttribute('content', pageMeta.title);

    const openGraphDescription = ensureHeadTag('meta[property="og:description"]', () => {
      const meta = document.createElement('meta');
      meta.setAttribute('property', 'og:description');
      return meta;
    });
    openGraphDescription.setAttribute('content', pageMeta.description);

    const openGraphUrl = ensureHeadTag('meta[property="og:url"]', () => {
      const meta = document.createElement('meta');
      meta.setAttribute('property', 'og:url');
      return meta;
    });
    openGraphUrl.setAttribute('content', canonicalUrl);

    const openGraphImage = ensureHeadTag('meta[property="og:image"]', () => {
      const meta = document.createElement('meta');
      meta.setAttribute('property', 'og:image');
      return meta;
    });
    openGraphImage.setAttribute('content', socialImageUrl);

    const twitterTitle = ensureHeadTag('meta[name="twitter:title"]', () => {
      const meta = document.createElement('meta');
      meta.name = 'twitter:title';
      return meta;
    });
    twitterTitle.setAttribute('content', pageMeta.title);

    const twitterDescription = ensureHeadTag('meta[name="twitter:description"]', () => {
      const meta = document.createElement('meta');
      meta.name = 'twitter:description';
      return meta;
    });
    twitterDescription.setAttribute('content', pageMeta.description);

    const twitterImage = ensureHeadTag('meta[name="twitter:image"]', () => {
      const meta = document.createElement('meta');
      meta.name = 'twitter:image';
      return meta;
    });
    twitterImage.setAttribute('content', socialImageUrl);

    document.title = pageMeta.title;
  }, [location.pathname]);

  return null;
};

export default ManifestManager;
