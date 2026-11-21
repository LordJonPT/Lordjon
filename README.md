# LORDJON — desenvolvimento

Projeto: `LordJonPT/Lordjon` (HTML estático + funções Vercel em `/api`).

## Funcionalidades implementadas em código

- **Twitch:** `GET /api/live` lê a transmissão via Helix, indicando live/offline, título, jogo e número de espetadores. Usa OAuth Client Credentials no servidor. Nunca mostra “em direto” sem confirmação da Twitch.
- **YouTube:** `GET /api/videos` lê a playlist de uploads do canal via YouTube Data API v3, devolvendo os três últimos vídeos públicos. O site mostra thumbnail, título e link direto.
- **Catálogo:** `GET /api/catalog` lê artigos publicados e campanhas ativas de uma base de dados dedicada.
- **Administração:** `/admin.html` gere produtos e campanhas via `GET/POST /api/admin`, protegido por token de administração configurado no servidor. O token é inserido no navegador apenas durante a sessão de gestão; não é guardado em localStorage.
- **Estrutura de pontos:** `database/lordjon_schema.sql` contém carteira, movimentos e encomendas com RLS. Atribuição de pontos, OAuth dos espectadores, resgates e pagamentos **não estão ativos**.

## Configuração na Vercel

Abra Project → Settings → Environment Variables e configure as seguintes variáveis no ambiente Production (e Preview, se pretender testar):

| Variável | Fonte | Necessária |
|---|---|---|
| `TWITCH_CLIENT_ID` | Aplicação criada em https://dev.twitch.tv/console/apps | Twitch |
| `TWITCH_CLIENT_SECRET` | Segredo da mesma aplicação Twitch | Twitch |
| `TWITCH_LOGIN` | `lordjon_pt` (opcional; é o valor por defeito) | Twitch |
| `YOUTUBE_API_KEY` | Chave de API no Google Cloud, com YouTube Data API v3 ativa | YouTube |
| `YOUTUBE_HANDLE` | `lordjon_pt` (opcional; é o valor por defeito) | YouTube |
| `SUPABASE_URL` | URL de um **projeto dedicado** ao LORDJON | Catálogo/admin |
| `SUPABASE_SECRET_KEY` | Chave secreta de servidor da Supabase, nunca no frontend | Catálogo/admin |
| `LORDJON_ADMIN_TOKEN` | Segredo aleatório com >=32 caracteres | Admin |

Alternativa legada à `SUPABASE_SECRET_KEY`: `SUPABASE_SERVICE_ROLE_KEY`. Nunca publicar quaisquer segredos em GitHub, HTML ou JavaScript do navegador.

Faça novo deploy depois de configurar as variáveis de ambiente. Para a loja, num projeto Supabase **dedicado**, reveja e execute `database/lordjon_schema.sql` no SQL Editor antes de abrir o painel.

## Segurança e limitações

1. Uma visualização da Twitch por si só **não comprova** quantos minutos determinada pessoa assistiu. Não conceda pontos a partir de um clique ou temporizador do browser.
2. A estrutura de saldo existe, mas os endpoints de creditar/deduzir pontos e de checkout não estão implementados. Não anuncie resgates/compras como disponíveis.
3. Catálogo e parceiros mantêm os links existentes quando a base de dados ainda não estiver configurada. Produtos e campanhas criados no painel aparecem no site apenas após publicação.
4. Configurar OAuth para espectadores e transações atómicas de carteira, validação de audiência e pagamento é uma fase de implementação separada.
5. Recomenda-se trocar a chave de administração se alguém tiver tido acesso à mesma. Não a guardar no dispositivo em ficheiros ou scripts.
6. Os pedidos aos serviços externos usam timeouts e devolvem um estado indisponível em caso de falha.

## Testar

- `/api/status`: relatório de configuração sem divulgar segredos.
- `/api/live`: resposta JSON com `configured: true` e `live: true/false` quando a integração estiver ativa.
- `/api/videos`: `configured: true` e a lista `videos`.
- `/api/catalog`: `configured: true` quando existe ligação segura à BD.
- `/admin.html`: gestão de catálogo, mediante token de administração.

## Deploy

O GitHub está ligado à Vercel pelo utilizador. Este repositório é a origem do código. O conector Vercel disponível nesta conversa não permite confirmar o projeto publicado no mesmo âmbito de conta, pelo que os commits aqui feitos não devem ser descritos como deploy confirmado.
