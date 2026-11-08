# Estado de infraestrutura Railway — leitura apenas
Inspeção: 08/11/2026 00:34:00 Brasília (UTC-3)

## Escopo e fontes
MCP Railway: describe-environment, describe-service (ambos os serviços), list-deployments (últimos 2 do front). HTTP GET somente na raiz pública. Nenhum checkout/repo analisado, segredo solicitado, query de banco, mudança, provisionamento ou redeploy.
Projeto grupos: 3cecbd5c-b863-47a1-b481-9799a8a87b22.
Ambiente production: 2c9144fe-83f2-4010-ba39-d86dfeb27934. Sem alterações staged.

## Serviços presentes
### sendflow-rebuild
ID a9da17b7-ca32-4ef4-a361-90eac9ae5832. Serviço de aplicação com fonte GitHub devpabj-glitch/sendflow-rebuild, branch main, rootDirectory /app; source.image=null no inventário (não é fonte de imagem de banco).
Builder RAILPACK, buildEnvironment V3, buildCommand npm install && npm run build.
Start configurado npm run preview; runtime V2; us-west2, uma réplica; sem cron, volumes/mounts ou TCP proxy. Tracing e auto-instrumentação desligados.
Domínio https://sendflow-rebuild-production.up.railway.app, domain ID 09152b26-8ce4-43c0-ab35-2340fbece948, targetPort=null. Sem domínio customizado.
Deployment e151577d-66c2-4dfb-8f17-a5d0111f9776 SUCCESS; criado 08/11/2026 00:09:16 Brasília, atualizado 00:09:59 Brasília.
Commit implantado confirmado: 81d75b91d8c0628dab3537e9be8942fa173d6cc8, main; mensagem Merge pull request #5 from cursor/fix-auth-layout-c444 / Centraliza o login e contém o banner de cookies.
O deployment anterior 41ccc0d7-08ca-47ef-8e96-823f4c6055c4 está REMOVED, commit cb6d400fae9127ab917e759cb9bc0ab670a4e31e.
Nomes de variáveis de serviço retornados: lista vazia (sem pedir valores). Não inclui garantia de ausência de variáveis automáticas Railway.

### web (remanescente)
ID 6e24846c-ac17-4383-9356-c749eb3030c3. Sem source.repo/branch/image apresentado; latestDeployment=null. O estado de recurso live NÃO significa aplicação implantada.
Raiz /app; RAILPACK, buildEnvironment V3; build npm install && npm run build.
Start __VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS=grupos.up.railway.app npm run preview -- --host 0.0.0.0 --port $PORT.
Runtime V2; us-west2, uma réplica; sem cron, volumes/mounts ou TCP proxy; tracing desligado.
Domínio https://grupos.up.railway.app, ID c0e1556a-4235-46cd-bf07-c3f880a42656, targetPort=null. Nenhum domínio customizado. HTTP deste domínio não verificado nesta rodada.
Nomes de variáveis de serviço retornados: lista vazia.

## Persistência / API / banco
Inventário completo deste ambiente contém somente os dois serviços acima: nenhum serviço dedicado de banco ou API identificado; nenhum serviço com imagem de banco. Total de volumes 0, mounts 0, buckets 0; nomes de variáveis compartilhadas: lista vazia.
Logo, persistência por volume Railway não está provisionada neste ambiente. Não há metadados de backups/retention de banco local a relatar porque não foi encontrado recurso de banco neste inventário.
API dentro do mesmo bundle/processo, autenticação real, armazenamento externo, backups externos e banco fora deste projeto NÃO VERIFICADOS; não deduzir inexistência global a partir deste inventário. Não houve análise de código nem consultas a endpoints API. Conteúdo/merge de PR6 não verificado, e não demonstrado como implantado pela revisão atual.

## HTTP público observado
08/11/2026 00:33:43 Brasília: GET / retorna HTTP 200 text/html, cache-control no-cache, server railway-hikari, título Orbit — Gestão de Grupos e Campanhas de WhatsApp.
HTML referencia /assets/index-D2j9YhFl.js e /assets/index-C_dDulu4.css. Não foram consultados esses assets nesta rodada. Cabeçalhos não provam processo servidor específico nem funcionalidade API.

## Preparação sugerida, condicionada (não aplicada)
Após o escritor confirmar arquitetura, modelo/auth e contrato do repo atual: definir serviço API separado ou runtime integrado conforme implementação efetiva; escolher banco e persistência compatíveis, política de backup e migração; API→banco por rede privada e browser→API por endpoint público ou proxy implementado; segredos só no servidor. Nenhuma escolha de tecnologia, nome de variável, cobrança, criação de recurso ou integração está contratada por este documento.
Não tratar front SUCCESS/HTTP200 como API/banco produção prontos. Logs não consultados: inventário/revisão/HTTP bastaram para esta fatia, evitando exposição desnecessária de dados.
