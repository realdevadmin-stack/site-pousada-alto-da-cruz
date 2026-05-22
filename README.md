Pousada Alto da Cruz — Estrutura do Repositório

Resumo rápido:
- `site_pousadaaltodacruz/`: site público (HTML/CSS/JS para clientes)
- `src/`: painel administrativo e código interno (admin.html, admin.js, firebase module)
- `firebase/`: regras e configurações do Firebase (firestore.rules, firestore.indexes.json, firebase.json)
- `cloudflare/`: arquivos relacionados ao deploy no Cloudflare (workers/config, etc.)
- `docs/`: documentação e propostas
- `backups/`: backups automáticos antes de refatorações

Como funciona:
- O frontend público está em `/site_pousadaaltodacruz`. Ele carrega `./styles.css` e `./script.js` (módulo ES). O código do Firebase permanece em `/src/firebase.js` e é importado por `site_pousadaaltodacruz/script.js` como `../src/firebase.js`.
- O painel administrativo está em `/src/admin.html` e usa `/src/admin.js`. A autenticação e lógica de reservas permanecem inalteradas (módulos originais mantidos).
- Os arquivos `admin.html`, `admin.js` e `firebase.js` foram removidos da raiz e agora estão centralizados em `/src`.

Comandos úteis:
- Instalação (se houver dependências): `npm install`
- Build (mantido): `npm run build`

Notas sobre deploy:
- Preserve as configurações do Cloudflare e Firebase. Se você usa um pipeline que publica a raiz do repositório, a pasta `site_pousadaaltodacruz` deve ser configurada como diretório público.

Backup:
- Antes de mover arquivos, versões de backup foram salvas em `/backups/backup-20260522-120000/`.
- Os arquivos públicos antigos da raiz (`index.html`, `script.js`, `styles.css`, `favicon.png`) foram removidos depois da reorganização.

Commit automático:
- commit: "refactor: organizar estrutura profissional do projeto"
