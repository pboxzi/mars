import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { recordPublicVisit, trackPageView } from '../utils/adTracking';

const TrackingScripts = () => {
  const location = useLocation();
  const lastTrackedPathRef = useRef('');

  useEffect(() => {
    const currentPath = `${location.pathname}${location.search}${location.hash}`;
    if (lastTrackedPathRef.current === currentPath) {
      return;
    }

    lastTrackedPathRef.current = currentPath;
    trackPageView({
      path: currentPath,
      title: document.title,
    });
    recordPublicVisit({
      path: currentPath,
      title: document.title,
    });
  }, [location.hash, location.pathname, location.search]);

  return null;
};

export default TrackingScripts;
