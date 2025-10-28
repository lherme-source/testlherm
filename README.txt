# WJ — Protótipo WhatsApp UI (sem terminal)

Este pacote foi feito para você publicar **sem usar comandos**.

## Como publicar (100% via navegador)

### Opção A — GitHub + Vercel (recomendado)
1. Acesse https://github.com e crie um repositório novo (público ou privado).
2. Clique em **Add file → Upload files** e envie os arquivos deste ZIP (index.html + pasta assets).
3. Vá em https://vercel.com → **New Project** → **Import Git Repository** → selecione o repositório.
4. Framework: **Other** (ou Static). Não precisa build.
5. Deploy. Pronto! O link fica disponível na Vercel.

### Opção B — Netlify Drop (alternativa super simples)
1. Acesse https://app.netlify.com/drop
2. Arraste e solte a **pasta** (conteúdo descompactado) aqui.
3. Ele gera um link automaticamente.

## Como editar
- Abra `index.html` no seu editor (VS Code) e modifique o JSX dentro da tag `<script type="text/babel">`.
- Se quiser usar sua fonte, coloque o arquivo `PPNEUEMONTREAL-VARIABLE.TTF` na pasta `assets`.

> Observação: Este pacote usa **React e Tailwind via CDN** e **Babel no navegador**.
> É excelente para *protótipo e validação sem setup*. Para produção, migre para Next.js (com build).
