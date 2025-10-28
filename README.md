# WJ Chat Prototype (Amber)

Reversão para a versão estável com **acento amarelo (amber)** na lista de conversas e badges.
Inclui placeholders para integração com **WhatsApp Business API (WABA)**.

## Rodar local
```bash
npm i
npm run dev
```

## Build
```bash
npm run build
npm start
```

## Variáveis (.env.local)
```
WABA_ACCESS_TOKEN=seu_token
WABA_BUSINESS_ID=123456789
WABA_PHONE_ID=1234567890
```

## Estrutura
- `components/ChatPrototypeWJ.tsx` — UI principal. Sem dependências externas, apenas Tailwind.
- `app/api/messages/route.ts` — endpoint placeholder para envio. Substituir por chamada real da Graph API.
- `app/page.tsx` — renderiza o componente.
- `styles/globals.css` — estilos base + utilitários Tailwind.
- `tailwind.config.ts` e `postcss.config.js` — config de build CSS.

## Observações
- Todo o **verde** foi substituído por **amber** (amarelo).
- A lista de conversas foi mantida em ordem decrescente por data, com `badge` de **não lidas** em **amber**.
- Sem erros de JSX; componente marcado como `'use client'` e tipado.
```
