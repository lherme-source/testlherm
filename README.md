# WJ — Next.js + Tailwind + API (Vercel)

Projeto pronto para publicar na Vercel, com:
- **UI** (seu JSX embutido como `components/ChatPrototypeWJ.tsx`)
- **/api/send-template** — Envio de template WhatsApp (real ou simulado)
- **/api/webhook** — Verificação (GET) e recepção (POST)
- **/api/templates** — Lista mock de templates

## Como publicar (Vercel + GitHub)

1. Suba este projeto para um repositório no GitHub (todos os arquivos).
2. Na Vercel: **New Project → Import Git Repository** → selecione o repo → **Deploy**.
3. Em **Settings → Environment Variables**, defina (pelo menos):
   - `SIMULATION_MODE=true` para testar sem WhatsApp real.
   - (Quando for usar de verdade) `SIMULATION_MODE=false`, `WHATSAPP_TOKEN`, `PHONE_NUMBER_ID`, `VERIFY_TOKEN`.

> Dica: copie `.env.example` para `.env.local` para rodar localmente.

## Endpoints

### POST /api/send-template
**Body JSON:**
```json
{
  "to": "+5511999999999",
  "template": "boas_vindas_wj",
  "lang": "pt_BR",
  "components": []
}
```
- Se `SIMULATION_MODE=true`, retorna `{ simulated: true, ... }`.
- Em produção, define `WHATSAPP_TOKEN` e `PHONE_NUMBER_ID` (Meta/WABA).

### GET /api/webhook
- Use `VERIFY_TOKEN` para verificar seu webhook no painel da Meta.
- Ex.: `GET /api/webhook?hub.mode=subscribe&hub.verify_token=SEU_TOKEN&hub.challenge=123` → retorna `123`.

### POST /api/webhook
- Recebe mensagens/eventos. No momento, apenas ecoa o payload (`{ ok: true, received: ... }`).

### GET /api/templates
- Retorna uma lista mock de templates para popular a UI.

## Observações
- O componente principal está como **Client Component** e a página usa `dynamic(..., { ssr:false })` para evitar problemas com APIs de browser.
- Tailwind já configurado (sem precisar instalar libs extras).
- Para usar a fonte padrão, não é necessário configurar nada adicional.
