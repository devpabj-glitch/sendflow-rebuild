# Matriz de validação — sendflow-rebuild, primeira fatia real (banco/API/auth/tenant) — v1

Registro: 08/11/2026 00:35:15 America/Sao_Paulo (UTC−3), pelo `date`. Preparação documental reutilizável. **Não é auditoria nem homologação.**

Ainda não recebemos commit, contrato, artefato ou log. Por isso **todos os estados estão NÃO AVALIADO / AGUARDANDO**. Esta matriz não define APIs, rotas, códigos, IDs, config, arquitetura nem credenciais. Cada critério será instanciado só pelo contrato da fatia, quando ele chegar.

## Referências informadas (relato do coordenador Grupos, NÃO aferidas)

- Escritor único: [agente de implementação](https://cursor.com/agents/bc-ab0ec626-43a9-5ef3-a765-6d432c89cfb7), branch `main`.
- Repo: [sendflow-rebuild](https://github.com/devpabj-glitch/sendflow-rebuild).
- Domínio: [sendflow-rebuild em produção](https://sendflow-rebuild-production.up.railway.app/).

Não houve consulta ao repo, à rede, à infra nem ao Git. O demo do [PR visual 6](https://github.com/devpabj-glitch/sendflow-rebuild/pull/6) é separado e **não prova integração**. Qualquer aprovação do usuário transmitida pelo coordenador é relato e não é certificada aqui.

## Classes de fonte (nunca intercambiáveis)

- **E:** fonte estática (diff, contrato, schema).
- **L:** execução local ou descartável (testes e gates do escritor, com log).
- **H:** HTTP autenticado em ambiente autorizado.
- **P:** produção, somente leitura e checagem pública. Uma classe não substitui outra.

## Matriz

| ID | Recorte e critério verificável (conforme contrato da fatia) | Menor evidência requerida | Ambiente | Estado |
|---|---|---|---|---|
| AUTH-01 | Login aceito/recusado; sessão expira; logout invalida sessão; permissões conforme papéis contratados | Asserts nominais por caso + log de gate. Em H, resposta registrada sem segredo. | E+L; H se autorizado | NÃO AVALIADO |
| TEN-01 | Isolamento de tenant em leitura e escrita. ID foreign/inexistente recusado conforme contrato, sem vazar dado nem existência; nada alterado | Fixture com ≥2 tenants de teste. Snapshot antes/depois integral das tabelas tocadas. | L; H com contas teste | NÃO AVALIADO |
| PER-01 | Persistência após reload, nova sessão e reinício do serviço. Reinício só em ambiente descartável autorizado. | Releitura contra oráculo independente (não a própria resposta). Arquivo/DB reaberto. | L; H descartável | NÃO AVALIADO |
| ERR-01 | Erros de API exatamente conforme o contrato (status, envelope, campos). Não supor códigos. | Tabela entrada → erro esperado do contrato, com asserts. | E+L | AGUARDANDO contrato |
| UI-01 | Estados vazio, preenchido e erro da tela da fatia | Teste ou captura ligada a dado real da fatia, não demo | L; H | NÃO AVALIADO |
| UI-02 | Regressão de layout, home e login; responsividade nos breakpoints acordados | Regressão automatizada ou comparação visual identificada por revisão | L; P leitura | NÃO AVALIADO |
| MIG-01 | Migração/backfill: aplicação, idempotência, reversibilidade/rollback seguro | Execução em **cópia isolada** com tipo e proveniência do DB; contagens e IDs antes/depois; log. **Nunca produção.** | L (cópia) | AGUARDANDO evidência |
| E2E-01 | Login → operação da fatia → releitura persistida. **Login sozinho não fecha a operação.** | Roteiro com resultado de cada passo e releitura independente | H autorizado | NÃO AVALIADO |
| REG-01 | Regressão automatizada: foco da fatia + suíte + typecheck/lint/build depois do último diff | Inventário nominal antes/depois e logs com exit | L | NÃO AVALIADO |
| REL-01 | Associação commit → build → deploy SUCCESS → checagem pública e autenticada da mesma revisão | SHA de commit, ID do build/deploy e status, resposta pública (P) e autenticada (H) que identifique a revisão | P leitura; H | NÃO AVALIADO |
| CLS-01 (condicional) | Override manual **ou** limite calculado, **somente se** a fatia expuser classificação | Asserts do contrato da classificação | E+L | N/A até contrato |

**Fora da fatia:**
- Gatilho e envio externo.
- Itens legados de Grupos, que **não** são transportados automaticamente.
- Módulos fora da fatia não bloqueiam a fatia.
- Não se exige teste universal. Cada item só se aplica depois do contrato que o define.

## Insumos finitos pendentes

1. Revisão e commit (SHA e pai) e o diff integral da fatia.
2. Contrato da fatia: operações, papéis, erros, tenant e estados de UI.
3. Ambiente: tipo (local, descartável, staging) e autorização de uso.
4. DB: tipo e proveniência, e se é cópia isolada para migração.
5. Evidência de migração/backfill/rollback com log.
6. Logs de foco e gates e inventário nominal.
7. Artefatos de build/deploy com status e ID.
8. Contas de tenant de teste seguras, fornecidas por fluxo seguro e **sem segredos neste documento**.

## Limites

- Nenhuma mutação, seed, restart ou envio externo em produção.
- A validação autenticada depende de autorização, de fluxo seguro e de evidência registrada.
- Não há homologação global nem porcentagem.
- Screenshot ou demo não prova produção nem integração.
- Classificação final possível por item: suficiente, falta de prova ou bug demonstrável. A decisão é do coordenador.
