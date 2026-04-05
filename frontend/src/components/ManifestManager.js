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

const ManifestManager = () => {
  const location = useLocation();

  useEffect(() => {
    const isAdminRoute = location.pathname.startsWith('/admin-secret');
    const manifestPath = isAdminRoute ? `${PUBLIC_URL}/admin.webmanifest` : `${PUBLIC_URL}/site.webmanifest`;
    const themeColor = isAdminRoute ? '#f7f3ec' : '#ffffff';
    const appleTitle = isAdminRoute ? 'Bruno Admin' : 'Bruno VIP';
    const documentTitle = isAdminRoute ? 'Bruno Mars Admin' : 'Bruno Mars VIP Concierge';

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
