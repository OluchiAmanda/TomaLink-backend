# Deploying TomaLink Backend to Render

This can't be done from here — it needs your GitHub account (to push the repo) and
your Render account (to connect it). Steps to do it yourself:

## 1. Push to GitHub
```bash
cd TomaLink-backend
git init                        # if not already done
git add .
git commit -m "Initial commit: Phase 1 — foundation, scaffold, Auth model"
git branch -M main
git remote add origin https://github.com/<your-username>/tomalink-backend.git
git push -u origin main
```

## 2. Create the Render Web Service
1. Go to https://dashboard.render.com → **New** → **Web Service**.
2. Connect your GitHub account and select the `tomalink-backend` repo.
3. Configure:
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free (or paid, your choice)

## 3. Add Environment Variables
In Render's dashboard → **Environment**, add every variable from `.env.example`
with real values (Mongo Atlas URI, JWT secrets, Paystack keys, Cloudinary
credentials, etc.). Never commit `.env` to Git — it's already in `.gitignore`.

## 4. Database
Use a **MongoDB Atlas** free-tier cluster (not a local Mongo instance) since
Render doesn't host MongoDB itself:
1. Create a cluster at https://cloud.mongodb.com
2. Add a database user + whitelist `0.0.0.0/0` (or Render's static IPs, for tighter security)
3. Copy the connection string into Render's `DATABASE_URL` variable

## 5. Deploy & Verify
Render auto-deploys on every push to `main`. Once live, confirm it's working:
```bash
curl https://<your-app>.onrender.com/health
```
You should see the same JSON the local `/health` route returns, and your Render
logs should show the `🚀 TomaLink server is running on port ... and connected to
the database` message.

## 6. Give the frontend dev the live URL
Once confirmed, share `https://<your-app>.onrender.com` — that's the base URL
they point their API calls at instead of `localhost`.

---
**Note:** Render's free tier spins down after inactivity and takes ~30–60s to
wake on the next request — worth mentioning to your frontend dev so a "slow
first request" doesn't look like a bug.
