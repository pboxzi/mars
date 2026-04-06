# Free One-Month Launch Plan

This is the safest low-cost stack for a one-month live test:

- Frontend: Vercel Hobby
- Backend: Render Free web service
- Database: MongoDB Atlas M0 free cluster
- Email: Resend free plan

## What stays free
- Frontend hosting
- Backend hosting for a light trial
- Database for early testing
- Email for low-to-moderate fan traffic

## What you still need
- A GitHub repo for this code
- Optional: a domain if you want a branded public URL and branded emails

## Step 1: Push this repo to GitHub
Create a GitHub repo and push the project.

## Step 2: Create the free MongoDB Atlas database
Create a free M0 cluster and copy the connection string.

You will use it for:
- `MONGO_URL`

## Step 3: Create the free Resend account
Create a Resend account and get:
- `RESEND_API_KEY`

If you want real fan emails, verify your domain and use a sender like:
- `bookings@yourdomain.com`

## Step 4: Deploy the backend on Render
1. Create a new web service from the GitHub repo.
2. Point it to the repo root so Render can read [render.yaml](render.yaml).
3. Fill in the required secret env vars:
   - `MONGO_URL`
   - `JWT_SECRET`
   - `FRONTEND_URL`
   - `CORS_ORIGINS`
   - `DEFAULT_ADMIN_EMAIL`
   - `DEFAULT_ADMIN_PASSWORD`
   - `ADMIN_SETUP_KEY`
   - `RESEND_API_KEY`
   - `SENDER_EMAIL`
   - `ADMIN_EMAIL`
4. Optional Cloudflare Turnstile protection:
   - Add both `TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` on the backend.
   - If only one is set, Turnstile stays off so public forms do not get stuck half-configured.
   - The frontend will read the live site key from the backend automatically.
5. After deploy, open:
   - `https://your-backend.onrender.com/api/health`

Expected result:
```json
{"status":"ok"}
```

## Step 5: Seed the first admin
Send a POST request to:
- `https://your-backend.onrender.com/api/admin/seed`

Header:
- `x-setup-key: <your ADMIN_SETUP_KEY>`

This creates the initial admin account using:
- `DEFAULT_ADMIN_EMAIL`
- `DEFAULT_ADMIN_PASSWORD`

## Step 6: Deploy the frontend on Vercel
1. Import the same GitHub repo into Vercel.
2. Set the project root directory to:
   - `frontend`
3. Add the frontend env var:
   - `REACT_APP_BACKEND_URL=https://your-backend.onrender.com`
   - `REACT_APP_SITE_URL=https://your-site.vercel.app`
   - `REACT_APP_META_PIXEL_ID=<your Meta Pixel ID>` if you want Facebook/Instagram ad tracking
4. Deploy.

The Vercel config in [frontend/vercel.json](frontend/vercel.json) already handles React route rewrites.

## Step 7: Connect the frontend and backend
Update these values so they match your final frontend URL:
- backend `FRONTEND_URL`
- backend `CORS_ORIGINS`

If your frontend is:
- `https://your-site.vercel.app`

Then set:
- `FRONTEND_URL=https://your-site.vercel.app`
- `CORS_ORIGINS=https://your-site.vercel.app`

## Step 8: Test the live flow
Run this order:
1. Open the public tour page.
2. Submit a booking request.
3. Log into the admin dashboard.
4. Approve the booking.
5. Open the booking status page from the customer side.
6. Submit a payment update.
7. Mark the booking paid in admin.
8. Confirm it.

## Required backend env vars
Use [backend/.env.example](backend/.env.example) as the template.

Most important:
- `MONGO_URL`
- `JWT_SECRET`
- `FRONTEND_URL`
- `CORS_ORIGINS`
- `DEFAULT_ADMIN_EMAIL`
- `DEFAULT_ADMIN_PASSWORD`
- `ADMIN_SETUP_KEY`
- `RESEND_API_KEY`
- `SENDER_EMAIL`
- `ADMIN_EMAIL`

Optional support info:
- `SUPPORT_EMAIL`
- `SUPPORT_PHONE`
- `SUPPORT_WHATSAPP`
- `SUPPORT_INSTAGRAM`
- `SUPPORT_HOURS`
- `TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`

## Required frontend env vars
Use [frontend/.env.example](frontend/.env.example) as the template.

Required:
- `REACT_APP_BACKEND_URL`
- `REACT_APP_SITE_URL`

Optional Meta ads:
- `REACT_APP_META_PIXEL_ID`

Optional fallback:
- `REACT_APP_TURNSTILE_SITE_KEY`

## Social-share launch notes
- The repo now includes a built-in share image at `frontend/public/social-preview.png`.
- Set `REACT_APP_SITE_URL` to your final public Vercel URL so shared links and social previews resolve to the correct canonical and image URLs.
- After each redeploy, re-share the homepage link on Instagram, Facebook, WhatsApp, or X to confirm the preview card updates.

## Free-tier warnings
- Render free instances sleep after idle time, so the first request can be slow.
- Free tiers are fine for a test month, but not ideal for a premium customer experience long term.
- Without a verified sending domain, email delivery will stay limited.

## Recommended order
1. MongoDB Atlas
2. Resend
3. Render backend
4. Admin seed
5. Vercel frontend
6. End-to-end live test
