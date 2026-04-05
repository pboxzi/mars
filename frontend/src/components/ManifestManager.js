import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const PUBLIC_URL = process.env.PUBLIC_URL || '';

const ensureHeadTag = (selector, createTag) => {
  const existingTag = document.head.querySelector(selector);
  if (existingTag) {
    return existingTag;
  }

  const tag = createTag();
  document.head.appendChild(tag);
  return tag;
};

const getDocumentTitle = (pathname) => {
  if (pathname === '/tour') {
    return 'Tour | Bruno Mars';
  }

  if (pathname === '/music') {
    return 'Music | Bruno Mars';
  }

  if (pathname === '/subscribe') {
    return 'Subscribe | Bruno Mars';
  }

  if (pathname === '/booking-status') {
    return 'Track Booking | Bruno Mars';
  }

  if (pathname === '/admin-secret') {
    return 'Admin Login | Bruno Mars';
  }

  if (pathname === '/admin-secret/dashboard') {
    return 'Admin Dashboard | Bruno Mars';
  }

  if (pathname === '/admin-secret/events') {
    return 'Events | Bruno Mars Admin';
  }

  if (pathname === '/admin-secret/bookings') {
    return 'Bookings | Bruno Mars Admin';
  }

  if (pathname === '/admin-secret/payment-settings') {
    return 'Payments | Bruno Mars Admin';
  }

  return 'Bruno Mars | Official Website';
};

const ManifestManager = () => {
  const location = useLocation();

  useEffect(() => {
    const isAdminRoute = location.pathname.startsWith('/admin-secret');
    const manifestPath = isAdminRoute ? `${PUBLIC_URL}/admin.webmanifest` : `${PUBLIC_URL}/site.webmanifest`;
    const themeColor = isAdminRoute ? '#f7f3ec' : '#ffffff';
    const appleTitle = isAdminRoute ? 'Bruno Admin' : 'Bruno Mars';
    const documentTitle = getDocumentTitle(location.pathname);

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

    document.title = documentTitle;
  }, [location.pathname]);

  return null;
};

export default ManifestManager;
