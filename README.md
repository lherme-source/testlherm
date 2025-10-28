# WJ WhatsApp Cloud — Ajustes de UI (âmbar #d6a65c) e Conversas

Este pacote contém **apenas os arquivos alterados** para aplicar no seu projeto Next.js.

## O que mudou
- Tema em **âmbar** atualizado para `#d6a65c` (rgb(214, 166, 92)).
- Correção do texto literal `/{WABA_ID}/phone_numbers` (sem JSX).
- Ordenação e visual da lista de **Conversas** como no print.
- Badges (pino, não lidas) e tabs com o mesmo âmbar.
- Removidos resquícios de tons esverdeados.

## Como aplicar
1. Copie `components/ChatPrototypeWJ.tsx` para o mesmo caminho no seu repositório.
2. `git add . && git commit -m "style(ui): amber #d6a65c + conversas"`
3. `npm run build` e depois `npm run dev` para validar localmente.
4. Faça o push para o Git (Vercel fará o deploy).

Se algo divergir do seu setup local (ex.: path, fontes), me avise que eu gero um patch sob medida.
