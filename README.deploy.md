Deployment steps — Supabase (DB) + Vercel (hosting)

1. Push repo to GitHub

- Create a GitHub repo and push this project.

2. Set environment variables in Vercel

- Go to Vercel → Import Project → choose the GitHub repo.
- In Project Settings → Environment Variables, add these (Production & Preview):
  - DATABASE_URL = postgresql://postgres:YOUR_PASSWORD@.../postgres?schema=public
  - DIRECT_URL = postgresql://postgres:YOUR_PASSWORD@.../postgres
  - NEXTAUTH_URL = https://<your-vercel-domain>
  - NEXTAUTH_SECRET = (generate with node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
  - GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
  - NEXT_PUBLIC_APP_URL = https://<your-vercel-domain>
  - NEXT_PUBLIC_APP_NAME = HybridCrypto

3. Import and configure DB (Supabase)

- In Supabase, confirm connection string and service_role key if needed.

4. Apply Prisma migrations to production DB

- Locally (with `DATABASE_URL` pointing to Supabase production):
  npx prisma migrate deploy

5. Build & deploy on Vercel

- After env vars set, Vercel will build with `npm run build` and deploy.

6. Verify

- Visit https://<your-vercel-domain>
- Test register/login (Google OAuth redirect URIs must match in Google Console)
- Use Supabase Dashboard -> Table Editor to inspect tables

Notes

- Never commit `.env.local` or `.env` with secrets.
- For migrations in CI, run `npx prisma migrate deploy` in a safe job using repository secrets.
