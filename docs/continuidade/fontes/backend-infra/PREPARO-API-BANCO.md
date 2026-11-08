# Grupos — inspeção e preparo documental Railway
Verificado: 2026-11-07 22:18:17 Brasília (UTC-3)

## Estado observado (somente leitura)
- Projeto grupos: 3cecbd5c-b863-47a1-b481-9799a8a87b22.
- Ambiente production: 2c9144fe-83f2-4010-ba39-d86dfeb27934.
- Serviço web: 6e24846c-ac17-4383-9356-c749eb3030c3.
- Sem deployments; sem revisão/commit implantado. Configuração lida não apresenta source.repo/source.branch; vínculo ao repo informado não comprovado.
- Domínio https://grupos.up.railway.app responde HTTP 404 Railway Application not found, x-railway-fallback:true.
- RAILPACK, rootDirectory /app, build npm install && npm run build, start npm run preview; runtime V2, região us-west2, 1 réplica. Compatibilidade desses comandos/caminho com repo não validada nesta inspeção.
- Nenhum serviço API/banco, volume, bucket, variável de serviço ou variável compartilhada. Nenhuma mudança staged.

## Preparação para API e banco — plano, NÃO configuração aplicada
1. Antes de qualquer alteração, validar vínculo do serviço ao repo devpabj-glitch/sendflow-rebuild, branch, raiz /app e scripts existentes; confirmar bind 0.0.0.0 e porta do servidor compatível com roteamento Railway. Não se presume que npm run preview cumpra isso.
2. Manter web separado da API futura. Escolha de runtime/comandos e banco depende do contrato e código futuros; nenhuma tecnologia imposta agora.
3. Quando autorizado, adicionar API e banco no mesmo projeto/ambiente; API acessa banco por rede privada. Browser usa endpoint público da API (ou proxy explicitamente implementado), nunca hostname privado Railway.
4. Definir variável pública de URL da API somente após validar nome esperado no front. Nenhuma credencial de banco no bundle do browser. DATABASE_URL é apenas nome candidato para API se o runtime futuro o suportar, não variável criada.
5. API futura: healthcheck, migrações controladas, CORS restrito ao domínio web, política de backup e persistência antes de uso real; não executados agora.
6. Evidência de sucesso requer deployment terminal SUCCESS + HTTP/conteúdo do aplicativo; não confundir domínio criado ou serviço live com deploy funcionando.

Nenhum código, configuração Railway, segredo ou recurso foi alterado/criado. Backend anterior segue parado. Não há logs de build/runtime a consultar porque não há deployment. Próximo passo operacional depende de vincular/confirmar origem e iniciar deploy; fora do escopo somente acompanhamento desta inspeção.
