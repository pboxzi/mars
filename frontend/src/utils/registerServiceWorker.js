const registerServiceWorker = () => {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${process.env.PUBLIC_URL || ''}/sw.js`)
      .catch((error) => {
        console.error('Service worker registration failed:', error);
      });
  });
};

export default registerServiceWorker;
