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

