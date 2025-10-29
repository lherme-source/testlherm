# Patch: Amber Color + Conversations UI

This package contains an updated `components/ChatPrototypeWJ.tsx` with:
- Accent color changed to **#d6a65c** (and hover adjusted).
- Conversations sidebar redesigned (pinned, unread badge, online dot, last message preview).
- Chat header shows **online agora** when applicable.
- Contact type and mocks enhanced to match the new UI.

## How to apply

1) Replace your existing file with the one in `components/ChatPrototypeWJ.tsx`.
2) Rebuild and deploy (Vercel will auto‑deploy on push).

> If you prefer a git patch, copy `wj-amber-chat.patch` and run:
> 
> ```bash
> git apply wj-amber-chat.patch
> ```

## Local development

You can run this project locally with Node.js 18+.

1) Install Node.js LTS (18 or newer) from https://nodejs.org/
2) Copy environment example file and adjust values:

```powershell
Copy-Item .env.example .env.local
```

3) Install dependencies and start the dev server:

```powershell
npm install
npm run dev
```

Open http://localhost:3000

## Environment variables

Create `.env.local` at the project root. See `.env.example` for a template.

- `VERIFY_TOKEN`: token used to verify the WhatsApp Webhook (GET /api/webhook)
- `SIMULATION_MODE`: when `true`, `POST /api/send-template` simulates sending and does not call Meta Graph API
- `WHATSAPP_TOKEN`: WhatsApp Cloud API access token (only required when `SIMULATION_MODE` is `false`)
- `PHONE_NUMBER_ID`: WhatsApp Business phone number ID (only required when `SIMULATION_MODE` is `false`)

## Deploy (Vercel)

If you prefer not to use the terminal, you can deploy by connecting this repository to Vercel:

1) Push this project to GitHub.
2) In Vercel, “Add New… > Project”, import the repo.
3) Set the same Environment Variables from `.env.local` in the Vercel dashboard.
4) Deploy. Vercel will build with Next.js automatically.

Or click to one‑click deploy the GitHub repo:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Flherme-source%2Ftestlherm)

Recommended Vercel Environment Variables:

- VERIFY_TOKEN: webhook verification token (any string you set)
- SIMULATION_MODE: true
- WHATSAPP_TOKEN: leave empty if SIMULATION_MODE=true
- PHONE_NUMBER_ID: leave empty if SIMULATION_MODE=true

