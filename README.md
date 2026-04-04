# Bruno Mars VIP Concierge

This repo contains the Bruno Mars-style VIP concierge site and admin system.

## Apps
- Frontend: React + CRACO in [frontend](frontend)
- Backend: FastAPI in [backend](backend)

## Local URLs
- Public site: `http://localhost:3000`
- Backend API: `http://127.0.0.1:8000`
- Admin: `http://localhost:3000/admin-secret`

## Default Local Admin
- Email: `admin@brunomars.com`
- Password: `admin123`

## Free One-Month Hosting Files
- Render backend blueprint: [render.yaml](render.yaml)
- Vercel frontend config: [frontend/vercel.json](frontend/vercel.json)
- Backend env template: [backend/.env.example](backend/.env.example)
- Frontend env template: [frontend/.env.example](frontend/.env.example)
- Deployment guide: [DEPLOY_FREE_MONTH.md](DEPLOY_FREE_MONTH.md)

## Local Start
Backend:
```powershell
cd C:\Mars\mars\backend
.\.venv\Scripts\python.exe -m uvicorn server:app --reload --host 127.0.0.1 --port 8000
```

Frontend:
```powershell
cd C:\Mars\mars\frontend
yarn start
```

## Production Notes
- Use a real `MONGO_URL` in production so data does not reset.
- Use a real verified `SENDER_EMAIL` and `RESEND_API_KEY` so fan/admin emails send.
- Change the default admin password before launch.
