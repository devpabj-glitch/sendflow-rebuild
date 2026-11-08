# Grupos / sendflow-rebuild — LEIA-ME de continuidade (para qualquer IA)

**Snapshot:** 08/11/2026 ~00:52 (America/Sao_Paulo, UTC−3). Pacote preparado pelo Supervisor de Progresso (`12d37f8a`), somente documentação. **Não é aceite de produção, não é homologação e não mede fidelidade em %.**

## 1. Roteiro rápido (ler nesta ordem)
1. Este arquivo: contexto, precedência e políticas.
2. `01-ESTADO-E-MATRIZ.md`: o que está pronto **no recorte**, em andamento e pendente, com evidência.
3. `06-INVENTARIO-ROTAS-SENDFLOW.md`: todas as rotas atuais do repositório, com status visual (T/P/demo) e o módulo PM candidato.
4. `05-MAPA-FUNCOES-182.md`: as 182 funções do PM por módulo, com texto integral, estado legado, rota candidata e estado no repo novo.
5. `03-PENDENCIAS-E-PROXIMOS-PASSOS.md`: divergências, riscos, ordem **proposta** e ciclo por fatia do começo ao fim.
6. `02-RESPONSABILIDADES.md`: quem faz o quê (um escritor de código por vez).
7. `fontes/`: cópias integrais com hashes (índice em `04-INDICE-FONTES.md`).

## 2. O projeto (fatos com fonte)
- **Produto:** "Grupos", gestão de campanhas e grupos de WhatsApp (link único, distribuição entre grupos, filas, automações). Referência funcional e visual qualitativa: vídeo público de uma ferramenta de mercado (YouTube `xbsH9OoQlt4`). Identidade própria; não copiar marca, textos ou dados (PM §0.5).
- **Repositório ATUAL (destino):** https://github.com/devpabj-glitch/sendflow-rebuild (público), branch `main`, app em `/app` (Vite + React + TypeScript).
  - Produção: `81d75b91d8c0628dab3537e9be8942fa173d6cc8` (PR #5), deployment Railway `e151577d…` SUCCESS 08/11 00:09:59; `GET /` HTTP 200 às 00:33:43.
  - Domínio: https://sendflow-rebuild-production.up.railway.app/
  - O usuário confirmou este repositório como destino da documentação às 00:38.
- **No `main` tudo é front:** os dados e o login ficam só no navegador (localStorage). Não há chamada a API nem servidor de aplicação. Ver `06-INVENTARIO-ROTAS-SENDFLOW.md`.
- **PR #6** (`cursor/demo-module-visual-c444`, head `19c4c8c`): demo visual com dados fictícios e interruptor Vazio/Demonstração. **Não mergeado, não publicado, não é backend.**
- **Repositório LEGADO (não é GitHub):** Cursor Origin, escritor `bc-68876892-0c2c-553d-9afb-372723d790a3` (Next.js + SQLite, `/api/v1`). Último commit relatado `c244ad180c43c4b2325f990e111754211ed8fdb0`. Parado desde 07/11 22:15 (manutenção). **A portabilidade e a equivalência para o sendflow-rebuild não foram verificadas.**
- **Infra Railway (00:34, leitura da Backend):** só o serviço front `sendflow-rebuild` e um `web` remanescente sem deploy. Nenhum serviço dedicado de API/banco, 0 volumes, listas de variáveis vazias. Banco ou API externos não foram verificados.

## 3. Arquitetura conhecida vs. desconhecida
- **Conhecido:** front Vite/React, servido por `vite preview` no Railway (RAILPACK). 12 telas com interação local, 7 placeholders. Modelo de tela em `app/src/types.ts`.
- **Desconhecido ou inexistente no repo novo:** API, banco, autenticação de servidor, tenant, migrações, backup, variáveis. A 1ª fatia da integração (`bc-ab0ec626-43a9-5ef3-a765-6d432c89cfb7`, iniciada ~00:34) deve entregar isso; **nada foi recebido até este snapshot**.
- **Legado (referência, não obrigatória):** `fontes/legado/aderencia-prompt-mestre-v1-legado-R88.md`. Não importar o backend antigo inteiro por analogia.

## 4. Precedência de fontes
1. **Ordem direta mais recente do usuário**, verificada no transcript (posição e hora).
   - 08/11 00:32 (Referência, pos. 276): integrar banco e API no sendflow-rebuild para produção.
   - 00:35: documentação no GitHub.
   - 00:38 (coordenador, pos. 1004): destino é o repositório sendflow-rebuild; mapear todas as funções do site, do começo ao fim.
2. Ordens anteriores compatíveis e a restrição operacional vigente (`02-RESPONSABILIDADES.md`).
3. Decisões de produto registradas:
   - DEC-06: considerar os dois sinais de cheio, cada um basta (`fontes/backend-infra/DECISAO-DEC06-GRUPO-CHEIO.md`). Ver a divergência de redação em 03 §2.
   - Gatilho "encher grupo": QI/Q3/Q4 adiadas (relato do coordenador).
4. **PM-GRUPOS v1.0** (`fontes/prompt-mestre/PROMPT-MESTRE-GRUPOS.md`, 787 linhas, 182 IDs, 29 módulos, sha256 `5f74532b2c2889d3a0c14c5deb3f906dbd846ffcf52c14fab70768b6fc52017c`, cópia byte a byte).
   - O próprio documento se declara **consolidação derivada e proposta**. Não é o original histórico, que segue ausente.
   - O coordenador **relata** aprovação do usuário em 07/11. As duas procedências ficam registradas, sem decretar original. [PROP] continua exigindo decisão.
5. Contratos técnicos, pareceres da Referência e auditorias da Qualidade, por fatia.
6. Relatos de agentes e dumps: **relato não é prova**. O dump do cloud legado não é inventário global.

## 5. Políticas obrigatórias
- **Um único escritor de código por vez**; um agente por frente.
- **Sem deploy, merge, provisionamento, migração em produção, seed demo em produção ou envio externo** (WhatsApp/SMS/e-mail) sem autorização específica do usuário para aquela ação. "Pronto para produção" é exigência de qualidade, não autorização.
- **Integração** (ordem de 00:32): só pelo escritor `bc-ab0ec626`, a partir do `main`. Coordenador (pos. 994): "Não provisionar/configurar/migrar/deploy ainda; coordenaremos um deploy após commit+QA."
- **Documentação** (00:35/00:38): **somente docs** no GitHub, entregues pelo coordenador ao escritor único. Sem sobrescrever código, sem merge ou publicação do PR #6, sem alterar branch alheia.
- Nada de segredos, tokens, bancos, dados pessoais, vídeos, frames ou logs brutos no repositório, que é **público**. Variáveis só por nome.
- Nenhuma função é "pronta" sem contrato, testes dirigidos, regressão e gates depois do último diff, e auditoria. O aceite é sempre **limitado ao recorte**. Demo ou screenshot não prova integração. Não inventar percentuais.
- O executor não decide DEC/LAC nem inventa semântica (viral, score, métricas, gatilho).

## 6. Lacunas exatas deste pacote
1. Sem nenhum artefato da 1ª fatia de integração (`bc-ab0ec626`): nem commit, nem contratos.
2. Responsivo e home/login: aprovação **relatada**; a Qualidade não auditou. Faltam evidências de Contas e Contas×Campanhas no PR #6 (Referência).
3. PM original histórico ausente; status de aprovação do PM divergente (ver 03 §2).
4. Recortes legados sem auditoria QA localizada: CTA-04/MET-03, GRU-05, CRG-10, FIL-02/04, MSG-04, PRJ-03, ASP-02, AUT-04 duplicar, PRJ-01 exclusão, CMP-05 arquivamento.
5. Aceite do coordenador com fonte direta só para GRU-02 (R85). AUT-04 massa e DEC06 têm aceite por relato.
6. Conteúdo de `capturas/`, `capture/`, `checks/` e `investigation.cany/` do repositório não foi revisado (risco de privacidade).
7. O vínculo rota → ID GRP é por nome do módulo, não por contrato; `/whats/webhooks` é ambígua entre WHE e WHS.
8. Os estudos sanitizados da Referência (PARTE-01…09, CONSOLIDADO-FINAL etc.) estão indexados, mas não copiados.
