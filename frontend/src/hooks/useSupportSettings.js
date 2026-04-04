import { useEffect, useState } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const emptySupportSettings = {
  support_email: '',
  support_phone: '',
  support_whatsapp: '',
  support_instagram: '',
  support_hours: ''
};

const useSupportSettings = () => {
  const [supportSettings, setSupportSettings] = useState(emptySupportSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchSupportSettings = async () => {
      try {
        const response = await axios.get(`${API}/site-settings`);
        if (isMounted) {
          setSupportSettings({
            support_email: response.data.support_email || '',
            support_phone: response.data.support_phone || '',
            support_whatsapp: response.data.support_whatsapp || '',
            support_instagram: response.data.support_instagram || '',
            support_hours: response.data.support_hours || ''
          });
        }
      } catch (error) {
        console.error('Error fetching support settings:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchSupportSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  return { supportSettings, loading };
};

export default useSupportSettings;
