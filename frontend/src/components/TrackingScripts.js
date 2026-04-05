import { useEffect } from 'react';
import { loadAdTracking } from '../utils/adTracking';

const TrackingScripts = () => {
  useEffect(() => {
    loadAdTracking();
  }, []);

  return null;
};

export default TrackingScripts;
