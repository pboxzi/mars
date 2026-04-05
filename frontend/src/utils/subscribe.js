const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export async function subscribeEmail(email, source, protection = {}) {
  if (!BACKEND_URL) {
    throw new Error('Backend URL is not configured.');
  }

  const response = await fetch(`${API}/subscriptions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email,
      source,
      captcha_token: protection.captchaToken || undefined,
      website: protection.website || undefined
    })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || 'Subscription failed. Please try again.');
  }

  return data;
}
