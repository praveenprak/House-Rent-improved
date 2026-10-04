# Deploying HouseRent on Vercel

You will create **two Vercel projects from the same GitHub repo**: one for `server/` (the API) and one for
`client/` (the website). Do the backend first, because the frontend needs its URL.

## 0. Before you start — gather 4 free services

| Service | Why | Where |
|---|---|---|
| **MongoDB Atlas** | Database (your local MongoDB isn't reachable from Vercel) | https://www.mongodb.com/atlas |
| **Cloudinary** | Stores property photos (Vercel's disk is read-only) | https://cloudinary.com |
| **Gmail App Password** (or Brevo/Resend SMTP) | Sends the verification codes | Google Account -> Security -> 2-Step Verification -> App passwords |
| **Gemini API key** | Powers the AI assistant | https://aistudio.google.com/apikey |

### MongoDB Atlas
1. Create a free **M0** cluster.
2. *Database Access* -> add a user with a password (avoid special characters in it, or URL-encode them).
3. *Network Access* -> **Add IP Address -> Allow access from anywhere (0.0.0.0/0)**. Vercel uses changing IPs,
   so this is required.
4. *Connect -> Drivers* -> copy the connection string and add the DB name:
   `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/HouseRent?retryWrites=true&w=majority`

### Create the admin accounts on Atlas (one time, from your computer)
```bash
cd server
# put the Atlas string in .env as MONGO_URI first
npm install
npm run seed
```
Then **change the default admin passwords** (edit `seed.js` before running, or the demo passwords in the
README are public).

## 1. Push the code to GitHub
```bash
git add .
git commit -m "Email OTP, AI assistant, contact admin, UI upgrade"
git push
```
`.env` files are git-ignored — never commit secrets.

## 2. Deploy the backend (API)
1. https://vercel.com/new -> import your GitHub repo.
2. **Root Directory: `server`** (click *Edit*). Framework preset: *Other*. Leave build settings empty.
3. Add **Environment Variables**:

| Name | Value |
|---|---|
| `MONGO_URI` | your Atlas string |
| `JWT_SECRET` | long random string: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `SMTP_HOST` / `SMTP_PORT` | `smtp.gmail.com` / `465` |
| `SMTP_USER` / `SMTP_PASS` | your Gmail / the 16-character app password |
| `MAIL_FROM` | `House Rent <youraddress@gmail.com>` |
| `GEMINI_API_KEY` | your key |
| `GEMINI_MODEL` | `gemini-flash-latest` |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | from the Cloudinary dashboard |
| `ADMIN_NOTIFY_EMAIL` | (optional) where to get "new support message" emails |
| `CLIENT_URL` | leave empty for now — you'll set it in step 4 |

4. **Deploy**. Open the URL it gives you (e.g. `https://houserent-api.vercel.app`). You should see
   `{"message":"House Rent API is running"}`.

## 3. Deploy the frontend
1. https://vercel.com/new -> import the **same repo again** (a second project).
2. **Root Directory: `client`**. Framework preset: *Vite* (auto-detected).
3. Add one environment variable:
   `VITE_API_URL` = the backend URL from step 2 (no trailing slash).
4. **Deploy**. This is your live website, e.g. `https://houserent.vercel.app`.

## 4. Connect them (CORS)
1. Go to the **backend** project -> Settings -> Environment Variables.
2. Set `CLIENT_URL` = your frontend URL (comma-separate if you also use a custom domain).
3. **Redeploy the backend** (Deployments -> ⋯ -> Redeploy) so it picks up the new variable.

> `VITE_API_URL` is baked in at build time: if you change it, redeploy the frontend too.

## 5. Test the live site
1. Register with a real email -> you should receive the 6-digit code -> after verifying you land on Sign In.
2. Sign in as an owner, add a property **with photos** (admin must grant the owner and approve the listing).
3. Open the chat bubble and ask: "What is a security deposit?" (answered) and "Write me a poem" (politely refused).
4. As a renter/owner open **Contact Admin**, send a message, then reply from the admin **Support** tab.

## Troubleshooting
| Symptom | Likely cause / fix |
|---|---|
| "Could not send the verification email" | Wrong `SMTP_*` values; Gmail needs an **App password** (not your normal password) and 2-Step Verification on |
| Network/CORS error in browser console | `CLIENT_URL` missing/typo (must match exactly, `https://…`, no trailing slash) -> fix and redeploy backend |
| Frontend calls itself / 404 on `/api/...` | `VITE_API_URL` not set on the frontend project -> set it and redeploy |
| "Database unavailable" | Atlas Network Access doesn't allow 0.0.0.0/0, or wrong password in `MONGO_URI` |
| Assistant: "busy right now" | Gemini free-tier rate limit; wait a minute. Check `GEMINI_MODEL` still exists |
| Photo upload fails | Cloudinary variables missing. Each request must be under ~4.5 MB (the site compresses photos automatically) |
| Refreshing `/properties` gives 404 | Make sure `client/vercel.json` is committed (SPA rewrite) |

## Good to know
- **Free tiers have limits.** The Gemini free tier is rate-limited, and Google may use free-tier prompts to
  improve its products; don't paste private data into the assistant. Gmail SMTP is limited to roughly 500
  emails/day.
- **Custom domain:** Vercel project -> Settings -> Domains. Add the new domain to `CLIENT_URL` as well.
- Rotate any secret that was ever pasted into chat, a commit or a screenshot.
