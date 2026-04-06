# WhatsApp Click Alerts Setup

This project can send a private WhatsApp alert to your own number whenever someone lands on the public site.

These alerts are separate from the public WhatsApp number shown on the website.

## What the alert contains

Each alert can include:

- source or referrer like Facebook, Instagram, WhatsApp, or direct
- page path opened, for example `/tour`
- visit time
- device type
- browser language
- timezone
- best-effort city, region, and country if the hosting platform forwards geo headers
- campaign tags like `utm_source`, `utm_medium`, and `utm_campaign`

## Important security note

Do not store your WhatsApp access token in the repo.

If you pasted a token into chat during setup, generate a fresh token before going live and only save it in your backend host environment variables.

## Backend environment variables

Add these to your backend host:

```text
WHATSAPP_ACCESS_TOKEN=<fresh Meta WhatsApp access token>
WHATSAPP_PHONE_NUMBER_ID=1117792631406656
WHATSAPP_WABA_ID=1659147508440662
WHATSAPP_ALERT_TO_NUMBER=2349064325891
WHATSAPP_ALERT_TEMPLATE_NAME=
WHATSAPP_ALERT_TEMPLATE_LANGUAGE=en_US
WHATSAPP_ALERT_TEXT_FALLBACK=1
```

## What each variable means

- `WHATSAPP_ACCESS_TOKEN`
  The token used to call the WhatsApp Cloud API.

- `WHATSAPP_PHONE_NUMBER_ID`
  The sender phone number ID from the Meta WhatsApp API setup page.

- `WHATSAPP_WABA_ID`
  Your WhatsApp Business Account ID. It is saved for reference and future management tasks.

- `WHATSAPP_ALERT_TO_NUMBER`
  Your own private WhatsApp number in digits only, no spaces. Example: `2349064325891`

- `WHATSAPP_ALERT_TEMPLATE_NAME`
  Leave blank for now. This is for the permanent approved WhatsApp alert template.

- `WHATSAPP_ALERT_TEMPLATE_LANGUAGE`
  Template language code. Keep `en_US` unless your approved template uses another language.

- `WHATSAPP_ALERT_TEXT_FALLBACK`
  Set this to `1` only for testing while your private number has an open WhatsApp session with the Meta test sender.

## Render backend setup

If your backend is on Render:

1. Open your Render dashboard.
2. Open the backend service.
3. Go to `Environment`.
4. Add each variable above.
5. Click `Save Changes`.
6. Redeploy the backend service.

## Other backend hosts

If you use another host, add the same variables in that provider's environment variable screen and restart or redeploy the backend.

## Testing the alert

Before testing text fallback alerts:

1. Send any message like `start` from your private WhatsApp to the Meta test sender number.
2. Make sure your backend has:
   `WHATSAPP_ALERT_TEXT_FALLBACK=1`
3. Redeploy the backend.
4. Open the public site from another phone, browser, or incognito window.
5. Wait a few seconds.

You should receive a WhatsApp alert containing visit details.

## Moving from testing to permanent alerts

The text fallback is only for short-lived testing while the WhatsApp message window is open.

For reliable always-on alerts:

1. Create a WhatsApp message template in Meta.
2. Get it approved.
3. Set:

```text
WHATSAPP_ALERT_TEMPLATE_NAME=<approved_template_name>
WHATSAPP_ALERT_TEMPLATE_LANGUAGE=en_US
WHATSAPP_ALERT_TEXT_FALLBACK=
```

After that, the backend will send template-based alerts instead of session-based plain text alerts.

### Recommended template to create in Meta

Use this exact configuration:

- Template name: `site_visit_alert_v1`
- Category: `Utility`
- Language: `English (US)`

Body:

```text
New Bruno Mars Tour site visit alert.

Traffic: {{1}}.
Geo: {{2}}.
Device: {{3}}.
Campaign: {{4}}.
```

### Sample values for Meta approval

Use sample values like:

- `Instagram | /tour`
- `Lagos, NG | 102.89.45.10`
- `Mobile | en-US | April 06, 2026 at 02:43 PM UTC`
- `facebook / paid / launch | l.facebook.com`

### Important variable order

The backend currently sends the template body values in this order:

1. Source and page path
2. Location and IP address
3. Device, language, and time
4. Campaign and referrer
6. Time
7. Campaign
8. Referrer

That order comes from the current template payload builder in [server.py](C:/Mars/mars/backend/server.py).

## How the code is wired

The backend alert sender is implemented in:

- [server.py](C:/Mars/mars/backend/server.py)

The env placeholders are listed in:

- [backend/.env.example](C:/Mars/mars/backend/.env.example)
