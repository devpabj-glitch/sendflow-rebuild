# 02 — Responsabilidades (snapshot 08/11/2026 ~00:55 Brasília)

| Papel | Identificador | Faz | Não faz | Estado atual |
|---|---|---|---|---|
| Usuário / dono do produto | Loigo Soares | Decide produto (DEC/LAC); autoriza merge, deploy, provisionamento e envios externos | — | 00:32 pediu integração banco/API; 00:35 pediu a documentação no GitHub; 00:38 confirmou o repositório sendflow-rebuild como destino e pediu o mapa de todas as funções |
| Coordenador "grupos" | `6b330ef9-b86a-4d48-a676-a8e1d296fe5f` | Orquestra; escolhe **um** escritor; encaminha pacotes; registra aceites limitados; entrega esta documentação ao escritor único | Não escreve código em paralelo; não cria escritor ou documentação paralelos | Coordena `bc-ab0ec626`; aguarda este pacote (`fontes/contribuicoes/CONTRIBUICAO-COORDENADOR-20261108.md`) |
| Escritor de código ÚNICO (atual) | cloud `bc-ab0ec626-43a9-5ef3-a765-6d432c89cfb7` | 1ª fatia real: persistência/API/auth + testes, a partir do `main` | Não desenvolve módulos extras; não usa credencial do código; não faz deploy, migração em produção ou seed demo antes de commit + QA + autorização | Em andamento; nada entregue até o snapshot |
| Escritor visual (encerrado) | cloud `bc-54a329e5-9765-558b-8ef0-9577e62ac444` | PR #6 demo | — | Concluído; PR #6 não mergeado |
| Backend (execução) | `6c50bea4-b248-464b-a590-6eef0a00573a` | Contratos técnicos; inventário de infraestrutura Railway (leitura); nomes de variáveis sem valores; riscos de migração/rollback | Não provisiona, configura, migra nem faz deploy sem coordenação; não investiga código em checkout paralelo | Inventário 00:34 (`fontes/backend-infra/ESTADO-INFRA-20261108.md`); contribuição `fontes/backend-infra/CONTRIBUICAO-CONTINUIDADE-20261108.md` |
| Qualidade e Integrações | `ae1bf203-6d13-490e-ba78-2769ab0769f5` | Auditoria independente documental por recorte (contrato → fonte → asserts → logs); matriz de validação da integração | Não escreve produto; não certifica Git, execução ou produção por logs alheios; não faz teste destrutivo nem envio externo | Matriz pronta, tudo NÃO AVALIADO (`fontes/contribuicoes/CONTRIBUICAO-QUALIDADE-20261108.md`) |
| Referência Visual | `b598a796-5bb6-499f-bfb0-c6059ebcee9f` | Guarda o PM e o estudo do vídeo (textos sanitizados); pareceres de aderência; prints; proveniência | Não decide produto; não implementa; não publica vídeo, frames ou logs brutos | Contribuição em `fontes/contribuicoes/CONTRIBUICAO-REFERENCIA-20261108.md` |
| Supervisor de Progresso | `12d37f8a-762a-4167-968c-a13b7074d079` | Lê transcripts, arquivos e o GitHub (somente leitura) e relata o estado **com evidência**; preparou este pacote local | Não envia mensagens a agentes neste pedido; não altera repositório nem cloud; não publica | Pacote local pronto para o coordenador |
| Escritor legado (parado) | cloud `bc-68876892-0c2c-553d-9afb-372723d790a3` (Cursor Origin) | — | Não é retomado | Último commit relatado `c244ad1` (07/11 22:01) |

## Limite entre evidência e inferência (Supervisor e qualquer IA)
- **Evidência:** arquivo e linha, SHA de commit, saída de teste com contagem, resposta HTTP, posição de transcript com fala literal, horário com fuso. Só isso sustenta "feito".
- **Relato:** algo que um agente disse ter feito sem artefato verificado. Escrever "relatado por X".
- **Inferência:** conclusões a partir de silêncio ou de padrões ("travado", "memória cheia", "pronto"). Proibida sem dado; quando inevitável, marcar como hipótese.

## Restrição operacional vigente
- **Um único agente por frente de trabalho.** Não abrir agentes concorrentes, nem repetir a mesma consulta ou pergunta ao dono por vários agentes.
- Sem publicação do sistema e sem frentes novas sem ordem expressa do usuário.
- A ordem de 00:32 abriu apenas a integração banco/API do sendflow-rebuild, com um escritor.
- A ordem de 00:35/00:38 autoriza **somente documentação** no GitHub, entregue pelo coordenador ao escritor único.
