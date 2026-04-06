# Facebook Autopost Setup

This repo now includes a simple Facebook Page autopost flow.

It does one thing well:
- publishes a rotating post to your Facebook Page using the Meta Graph API

It does not create or launch ad campaigns automatically.

## Files
- Publisher script: `backend/scripts/facebook_page_autopost.py`
- Rotating content library: `automation/facebook-posts.json`
- GitHub Actions schedule: `.github/workflows/facebook-page-autopost.yml`

## What you need
- Your Facebook Page ID
- A Page access token with permission to publish to that Page
- Your live site URL

Recommended secrets in GitHub:
- `META_PAGE_ID`
- `META_PAGE_ACCESS_TOKEN`
- `SITE_URL`

## How it works
- The workflow runs every Monday, Wednesday, and Friday at 14:00 UTC.
- It selects one message from `automation/facebook-posts.json`.
- The selected message is posted to your Facebook Page feed.

The default rotation is based on the UTC day, so the message changes over time without extra storage.

## Test It Safely First
Run the script locally in preview mode:

```powershell
cd C:\Mars\mars
python backend\scripts\facebook_page_autopost.py --content-file automation\facebook-posts.json --site-url https://your-live-site.vercel.app --dry-run
```

That prints the exact message and link without publishing anything.

## Publish One Post Manually
After setting environment variables:

```powershell
cd C:\Mars\mars
$env:META_PAGE_ID="your-page-id"
$env:META_PAGE_ACCESS_TOKEN="your-page-access-token"
$env:SITE_URL="https://your-live-site.vercel.app"
python backend\scripts\facebook_page_autopost.py --content-file automation\facebook-posts.json
```

## Trigger From GitHub
1. Push this repo to GitHub.
2. Open the repo `Settings` > `Secrets and variables` > `Actions`.
3. Add:
   - `META_PAGE_ID`
   - `META_PAGE_ACCESS_TOKEN`
   - `SITE_URL`
4. Open the `Actions` tab.
5. Run `Facebook Page Autopost` manually in `dry_run=true` mode first.
6. If the preview looks right, run again with `dry_run=false`.

## Edit The Post Library
Update `automation/facebook-posts.json` to change the wording or add more posts.

Each post supports:
- `message`
- `link`

Template placeholders supported in both values:
- `{site_url}`
- `{tour_url}`
- `{today}`
- `{weekday}`

## Notes
- If Meta rejects the publish request, the workflow log will show the API error.
- Do not post the exact same message too often.
- Make sure `SITE_URL` points to the live public site, not localhost.
