# HolyLink — revisão autônoma de 15/10/2026

## Autorização e limites

Trabalho autorizado pelo responsável na noite de 14/10, enquanto dorme. Somente HolyLink, branch `feat/first-projection-preview`, draft PR #1. Produção e `main` preservadas. Não apagar configurações/mídias legítimas. Não modificar Delivovo.

Retomadas agendadas: 00h50, 01h50, 02h50, 03h50, 04h50, 05h50 e 06h50 de 15/10, America/Sao_Paulo. Automação `holylink-revis-o-aut-noma-da-madrugada`. Encerrar/excluir ao fim da última rodada, às 07h ou quando o usuário voltar. Dependem de computador/app disponíveis e cota compartilhada; não contornam limites. Renovação da janela indicada pelo usuário: 04h41; limite semanal continua independente. Nenhum crédito de reset autorizado.

## Estado inicial

- HEAD: `2240235f036d5cc0924d4dfc687a31f1453a7c63`; árvore limpa.
- `origin/main`: `fc8e5e19c5324310c950918834ef90226f04753e`.
- Preview vigente: branch alias `holylink-git-feat-first-p-a549d7-alesobralcortes-9387s-projects.vercel.app` (deployment `dpl_9SU5Gs9mCu9Z9BuThdVRnP1aHHEu`). Acesso privado no arquivo fora do repositório `../data/holylink-first-preview/access.private.json`.
- Produção: `holylink.vercel.app`, deployment `dpl_HP5ZpF3HuonTDoFfYVzKx2zp6cgi`.

## Ordem de trabalho

1. Segurança do pareamento: aprovação explícita no PC, bloqueio antes de aprovação, revogação, códigos criptográficos e evitar sobrescrita automática do PC pelo celular.
2. Validar mensagens recebidas, chaves e transferências; confirmar recebimento dos comandos sem prometer HDMI confirmado.
3. Bíblia com navegação rápida/cache persistente e falhas recuperáveis.
4. Roteiros salvos e recuperação/backup com validação antes de escrever dados.
5. Operação e revisão responsiva dos fluxos alterados, preservando preto/dourado, conteúdo e efeitos.

## Rodada inicial — pareamento seguro

Mudanças (commit desta etapa: `fix: require explicit PC approval before remote control`):

- Códigos gerados por `crypto.getRandomValues`, sem caracteres visualmente ambíguos; não reutiliza código permanente de sessões anteriores. Validade de 10 minutos para novas solicitações.
- Cada conexão exige aprovação própria no PC, comparando um código de confirmação exibido também no celular. Solicitação expira em 60 segundos. Conexões lembradas precisam de nova aprovação ao reconectar.
- Dialog de aprovação acessível com foco/Escape, inclusive quando a aba Conexão está oculta. Recusa fecha o transporte. Mensagens e registro global bloqueados antes da aprovação, nos dois sentidos.
- Encerrar a conexão remove a autorização. Botão para renovar o código também desconecta celulares. Desconexão explícita esquece o último pareamento e cancela reconexão agendada.
- Conectar não copia agenda/configurações/mídias automaticamente em nenhuma direção. Isso evita excluir arquivos legítimos do outro aparelho por diferenças entre bibliotecas. Receber/enviar é uma ação separada, com confirmação de substituição e indicação de backup.
- Celular novo inicia como controle; não se anuncia equivocadamente como PC. Papel salvo prevalece sobre largura da janela.
- Mensagens deixam claro que conexão autorizada não comprova imagem física no HDMI. Corrigido estado de carregamento que ficava preso após copiar um manifesto sem mídias faltantes.

Validação:

- `npm run lint`: aprovado.
- `npm run build`: aprovado.
- `node --experimental-strip-types --test tests/*.test.ts`: 14 testes aprovados, incluindo 3 de sessão/códigos.
- `../data/verify-holy-pairing.cjs`: aprovado no Edge headless com PeerJS simulado, contextos descartáveis. PC em 320/390/1365 px e 844×390 em paisagem: comandos/manifesto/exclusão bloqueados antes da aprovação; foco e aprovação na aba oculta; autorização isolada por transporte, revogação, recusa e código expirado. Celular: desafio errado rejeitado, nenhum envio automático de dados, cancelamento do envio, recebimento explícito e desconexão.
- `../data/verify-holy-full-console.cjs`: seis áreas, formulários, disclosures, atalhos/instalação com foco/Escape e ausência de overflow em 320×740, 390×844, 430×932, 768×1024, 844×390, 1365×900 e 1920×1080.
- Capturas de aprovação: `../data/holylink-pairing/approval-{320,390,844,1365}.png` (fora do repositório).
- Teste usa transporte simulado e não comprova WebRTC em redes reais, conexão física HDMI ou aprovação em aparelhos reais.

## Segunda etapa — comandos e configurações recebidos

Commit da etapa anterior: `cd45e7ca4b9bfe9af4aecf5ee82b06db51a81300`. Preview anterior confirmado READY: `dpl_HbRebSdmz66Px7yUtTpZBnoGtb5T`, no alias da branch. Produção continuou em `dpl_HP5ZpF3HuonTDoFfYVzKx2zp6cgi`.

- Contrato explícito de estados compartilháveis, com tipos, enumerações, limites de tamanho e estruturas de agenda/campanha/listas. Chaves de identidade e propriedades desconhecidas não são comandos válidos.
- Validação antes de aplicar `UPDATE_STATE` no receptor, no celular e no listener compartilhado entre janelas. Texto e referência nulos continuam válidos para limpar uma passagem; valores numéricos inválidos deixam de poder provocar erro em `volume.toString()`.
- Configurações recebidas por sincronismo e restauração são analisadas por completo antes do primeiro `localStorage.setItem`: uma configuração conhecida inválida rejeita o conjunto, sem aplicar parcialmente os campos anteriores. Chaves de outros apps e de identidade são ignoradas. Sinais de ciclo de vida da janela não são restaurados por backup/cópia.
- Manifestos enviados contêm somente configurações compartilháveis, preservando preferências locais de desempenho e identidade de cada dispositivo.
- Corrigida atualização visual de `tickerText` recebida remotamente: antes era persistida sem atualizar o estado React.
- Isso não conclui validação do arquivo inteiro de backup nem da mídia: ainda é preciso validar todos os itens antes de qualquer escrita, além de limitar chunks e cancelar tarefas revogadas.

Validação desta etapa:

- `npm run lint` e `npm run build`: aprovados.
- 18 testes nativos aprovados (4 novos de contrato de estado).
- Teste de pareamento ampliado: além das provas anteriores, um aparelho autorizado não altera identidade, não injeta chave externa, volume nulo, enum inválido ou lista/agenda malformada. Um conjunto de configurações inválido não escreve os campos válidos anteriores. Letreiro remoto é conferido no DOM do Monitor.
- `../data/verify-holy-unified.cjs`: busca, seleção, projeção, paginação, histórico, falha de busca, comunicação entre janelas e ausência de overflow aprovados em 320/390/430/1365 px. API de Bíblia simulada nesse teste.
- Primeira etapa também validada online na prévia em 390 e 1365 px, seis áreas, formulários, foco/Escape e ausência de overflow.

## Rodada iniciada às 00h12 — mídia por conexão e gravação cancelável

- Reconstrução de chunks isolada por conexão autorizada: IDs iguais de dois aparelhos não se misturam. Validação de versão, metadados, total de blocos, índice, base64 e tamanho exato de cada bloco antes de armazenar. Blocos repetidos não completam arquivo indevidamente. Metadados desconhecidos são descartados.
- Limite técnico de 128 MiB por arquivo e por soma pendente em cada conexão, até duas transferências simultâneas. Isso limita alocações remotas; arquivos maiores continuam utilizáveis localmente. A interface informa o limite, e falha de envio informa que a cópia local foi preservada.
- Transferências sem atividade por 60 segundos são descartadas pela verificação a cada 10 segundos; desconectar/erro libera imediatamente os buffers daquela conexão.
- Envio lê somente fatias de 64 KiB em vez do vídeo inteiro para um ArrayBuffer. Aguarda a fila RTC/PeerJS drenar quando há pressão, com limite de espera de 30 segundos e checagem de autorização. Falha de envio interrompe os próximos blocos.
- Broadcast de arquivo usa uma lista fixa de destinatários autorizados: quem entra durante o envio não recebe blocos sem cabeçalho. Aparelhos que desconectam saem da lista sem impedir os demais de receber. Sem destinatário não há leitura/conversão de arquivo.
- Renomear, reordenar, alterar duração, enquadramento, áudio ou habilitação da mídia envia apenas metadados. Antes isso relia e reenviava o arquivo inteiro (e reordenar reenviava todos os arquivos em paralelo).
- Persistência de mídia aceita cancelamento: desconectar cancela a gravação de chunks ainda em curso. Sucesso só é retornado após completar a transação IndexedDB. Abort durante a escrita preserva a versão anterior; atualizações somente de metadados continuam preservando o Blob. Commits já concluídos não são apagados ao desconectar.
- O progresso de arquivo salvo só é anunciado depois da confirmação de gravação. Callbacks cancelados deixam de sobrescrever a mensagem de uma conexão encerrada.

Validação:

- `npm run lint`, `npm run build` aprovados.
- 29 testes nativos aprovados: 8 novos de reconstrução/isolamento/limites/expiração de chunks; 3 de fila cheia, revogação e timeout do envio.
- `../data/verify-holy-transfers.cjs`, Edge headless com IndexedDB real em contexto descartável: bytes exatos de três blocos, sender que proíbe ler o arquivo inteiro, gravação completa, desconexão antes de abrir o banco, abort após `put` com rollback real, manutenção do Blob ao editar metadados, isolamento entre conexões, descarte de parcial, interrupção após erro de envio e ausência de anúncio de gravação em um arquivo cancelado.
- `../data/verify-holy-pairing.cjs` ampliado: metadados geram somente `MEDIA_SAVE`; inclusão explícita de arquivo gera cabeçalho+blocos; arquivo acima do limite é recusado antes de leitura/envio e informa que a cópia local está salva. Pareamento/estado continuam aprovados em 320/390/844 paisagem/1365 px.
- `../data/verify-holy-console-actions.cjs`: upload local, preview, cancelamento de exclusão, agenda salva/recarregada e diagnóstico/foco/Escape aprovados em 320/390/1365 px.
- Não foi ensaiado um arquivo real de 128 MiB por redes físicas; limite técnico não é promessa de velocidade. O teste de fila cheia usa transporte simulado. Nenhum arquivo legítimo foi apagado ou substituído pelos testes.

## Pendências para a próxima autorização

1. Continuar validação dos envelopes/mídias e do arquivo inteiro de backup. Estados/configurações já têm contrato explícito; não repetir essa etapa sem uma falha concreta. Não declarar auditoria de segurança concluída.
2. Chunks já estão isolados/limitados/canceláveis e validados. Ainda auditar os caminhos legados `MEDIA_SAVE`, `DELTA_MEDIA_ITEMS`, `FULL_SYNC` e manifesto: esses podem escrever/excluir itens fora do caminho de chunks. Validar envelope/mídia integralmente antes da primeira escrita e cancelar as demais tarefas assíncronas após revogação. O relay PC → outros celulares ainda usa `broadcastToPeers` síncrono para os blocos recebidos: aplicar controle de fila também nesse caminho, sem reordenar cabeçalho/blocos, antes de considerar redes com vários controles validadas. Não repetir o trabalho de chunks sem falha nova.
3. Corrigir `SYNC_COMPLETE`: hoje o emissor pode anunciá-lo antes da última gravação assíncrona no receptor. Depois, confirmação por mensagem de comandos recebidos; não confundir com imagem física confirmada. Rever reconexões em loop constante.
4. Cache persistente da Bíblia (atual cache é apenas em memória do componente), navegação rápida sem busca repetitiva e recuperação offline das passagens já consultadas.
5. Roteiros nomeados persistidos e backup validado antes de qualquer escrita. Preservar arquivos/configurações existentes. Conferir também cópia de configurações padrão não persistidas: manifesto atual envia somente as chaves salvas, então defaults ausentes não substituem uma customização antiga no destino. Definir cópia/mescla claramente antes de alterar a regra.
6. Revisão visual dos fluxos novos e consolidar relatório final às 06h50, excluindo a automação.

## Publicação e checkpoint às 00h12

- Código atual publicado na prévia: `d47d1679249b534e95deea764e8e445054779df4` (`fix: validate shared projection state before applying remote data`).
- Preview READY: `dpl_sPqQKBPr4skEAjVwPYyZaPeHRFZh`. Alias: `https://holylink-git-feat-first-p-a549d7-alesobralcortes-9387s-projects.vercel.app/`.
- Acesso de teste já preparado fora do repositório: `../data/holylink-overnight-access.private.json`. Não publicar seu conteúdo. O alias continua protegido; não alterar proteção.
- Conferência online da segunda etapa aprovada nas seis áreas em 390×844 e 1365×900, formulários, foco/Escape e ausência de overflow.
- Produção conferida e preservada em `dpl_HP5ZpF3HuonTDoFfYVzKx2zp6cgi`. Nenhum merge/promote realizado.
- Draft PR #1 atualizada até o código `d47d167`; continua rascunho.
- Servidor local 3012 encerrado após os testes. Bibliotecas/configurações dos testes são descartáveis e não usam o perfil real do usuário.
- Checkpoint documental `1dec077` será incluído no push desta rodada junto do código de transferência. Após publicar, verificar o SHA mais recente no Git/Vercel. A próxima rodada deve começar pelos envelopes legados, backup e confirmação de conclusão, sem repetir o que já passou.

As retomadas planejadas eram 00h50–06h50, incluindo 04h50 após a renovação prevista para 04h41. A automação foi encerrada na conferência final descrita abaixo. Não retomar por heartbeats antigos após o encerramento.


## Encerramento — conferência final às 07h42 de 15/10

A consulta final de horário retornou `2026-10-15 10:42:03 UTC` (07h42 America/Sao_Paulo). O relógio da consulta anterior retornara 00h26; não atribuir uma causa a essa diferença sem evidência. Esta rodada foi iniciada pelo heartbeat de 00h12. Nenhuma nova etapa foi iniciada após a verificação final do horário; apenas encerramento e registro.

- Automação `holylink-revis-o-aut-noma-da-madrugada` **excluída**, confirmado pelo aplicativo (`deleteStatus: deleted`). Não executar novas alterações por mensagens antigas desta automação.
- Neste histórico estão confirmadas a rodada inicial e a retomada de 00h12; não há execução registrada das demais retomadas planejadas. Não afirmar que todas ocorreram ou que houve trabalho contínuo em cada hora.
- Último commit de código: `967b0a40f7a62ce3e6a121fcc42eb4d661e7de6d`, criado às 00h29 (`fix: isolate media transfers and cancel revoked database writes`). Já enviado ao GitHub.
- Preview confirmado READY: `dpl_4Tm8xTUNzfBcmYbqZQC7YQGyvPUN`, SHA `967b0a4`, projeto `holylink`, ambiente Preview. Alias: `https://holylink-git-feat-first-p-a549d7-alesobralcortes-9387s-projects.vercel.app/`.
- Conferência online dessa versão passou nas seis áreas em 390×844 e 1365×900, sem overflow/erros de página; diálogos, formulários e foco/Escape aprovados.
- Produção preservada em `dpl_HP5ZpF3HuonTDoFfYVzKx2zp6cgi`; nenhum merge/promote. Draft PR #1 atualizada até `967b0a4`, continua em rascunho.
- `npm run lint`, build Vite e 29 testes nativos aprovados. Ensaios de mídia/persistência, pareamento e interfaces descritos nesta seção passaram em contextos descartáveis. HDMI físico e aparelhos/redes reais continuam pendentes.
- Servidor local 3012 encerrado. Nenhum produto/pedido/dado de outro projeto alterado. Credenciais permanecem fora do repositório.
- Última consulta de cota antes de encerrar: janela de cinco horas usada 34%, semanal usada 82%; não representa necessariamente a cota atual. Nenhum crédito de reset foi usado e nenhum recurso foi comprado.
- Este fechamento documental fica em commit local para o próximo push autorizado, evitando publicar um deployment somente por documentação. Código funcional e descrição da PR já estão atualizados remotamente.

### Resumo para o responsável

Entregues três frentes: pareamento com aprovação real no PC, validação das configurações/comandos e transferências de mídia com isolamento, limites, controle de fila e cancelamento de gravação. Reduzido consumo de memória/rede, especialmente nas alterações de metadados. Mantidos design, efeitos, bibliotecas e produção.

**Não está 100% concluído.** Próximo bloco prioritário: validar backups e envelopes legados antes de escrever/excluir dados, confirmar conclusão de sincronização e comandos recebidos, finalizar cache persistente/navegação da Bíblia e roteiros salvos. A lista detalhada de pendências acima continua válida. Testes físicos também são necessários antes de recomendar publicação.


## Continuidade manual após o responsável acordar

O responsável definiu a direção principal celular → PC, preservando arquivos exclusivos do PC, deduplicando conteúdo e permitindo excluir pelo celular conectado. Nova etapa documentada em `docs/sincronizacao-celular-pc.md`: mescla por assinatura, aliases sem duplicar arquivos do PC, catálogo remoto na mesma biblioteca, projetar/pausar/ativar/excluir pelo celular, comparação antes de novos uploads e confirmação de término após gravar mídia. 34 testes nativos e teste entre duas instâncias isoladas, mais UI responsiva, aprovados. Nenhuma automação foi reativada. Pareamento permanente continua pendente e não deve ser apresentado como pronto.

Conferência da entrega manual: commits `cc61a0f` e `087d174` enviados; Preview `dpl_6chTwTopJysoskuoBXVGJzH7Uxri` READY para `087d1749b925a4bc9910d6f22f0faf49673b7177`. A versão online passou novamente nas seis áreas em 390×844 e 1365×900, sem erros de página ou overflow. Lint, build e 34 testes aprovados; o ensaio de mescla também confirmou rejeição de manifesto inválido sem alterar configurações e liberação da interface após falha. Transporte simulado entre contextos: não equivale a teste físico de HDMI/WebRTC. Produção não promovida e PR #1 permanece rascunho. Servidor local 3012 encerrado. Este fechamento documental fica local para evitar implantação redundante.

### Operação da Bíblia, slides especiais, efeitos e diagnóstico

Nova solicitação humana: agilizar escolha de livro/capítulo/versículo, reverter Batismo/Despedida, reorganizar fundos/ícones/atalhos e conferir dados do dispositivo. Implementação e limites em `docs/operacao-biblia-efeitos.md`. Seletores com capítulos existentes, números de versículos da resposta, intervalos por toque, cache persistente limitado; fixação real com retorno explícito; controles de atmosfera com prévia isolada, tratamento de WebGL indisponível e correção do tamanho CSS das partículas; guia compartilhado de atalhos e bloqueio durante diálogos/campos/modificadores. Diagnóstico deixa de inventar hardware quando o navegador não informa e identifica estimativas locais. Produção preservada; nenhuma automação reativada. Pareamento permanente não foi implementado nesta etapa.

Entrega: `5e8635473a4b539d23a7bfcf34597a94fa010369`, Preview READY `dpl_bHBrttVWrbD8Gp4KgSgEGHiioSX5`, alias de branch conferido. PR #1 atualizada e ainda em rascunho; produção conferida no deployment original `dpl_HP5ZpF3HuonTDoFfYVzKx2zp6cgi`. Lint/build/37 testes aprovados; UI de seis áreas em sete tamanhos e integração dos novos controles em quatro tamanhos aprovadas. Renderer WebGL real mostrou animação e estilos diferentes, sem erro de shader; nenhuma alegação de HDMI físico. Prévia online conferida em 390×844 e 1365×900. Servidor local encerrado. Checkpoint documental local para não gerar deploy redundante.

### Segunda revisão manual — aba Ajustes completa e fundo preto no celular

Após o responsável relatar retorno achatado e fundo preto, a aba inteira foi reorganizada com cartões/formulários para toque e seções próprias. Botão de retorno fixado em 52 px, corrigida regra global de maior especificidade; textos, áudio, avisos, histórico e energia padronizados. Corrigidos ajuste do cronômetro pausado e falsa indicação de janela aberta quando popup bloqueado; letreiro ganhou preparação/envio explícito. Shader com máscaras GLSL indefinidas corrigidas e precisão alta; animação compatível CSS em falha gráfica e opção leve somente na prévia local. Detalhes e limitações em `docs/operacao-biblia-efeitos.md`. Não inferir que GPU física do usuário foi testada. Produção/main preservadas, pareamento permanente ainda pendente.

Entrega `14154679353ef09604b01b9a1c5ccd99cb186cd5`, Preview READY `dpl_4EYe6vd8dkUxjgGMfUoMvnNKFfAz`, alias conferido; PR #1 atualizada e rascunho. 37 testes nativos, lint e build aprovados; operação completa dos ajustes passou em oito tamanhos e revisão final do mixer em 320/1365. Fundos animados passaram em viewport móvel com WebGL, ausência simulada de WebGL, perda de contexto e opção leve manual sem alterar o estilo compartilhado. As seis áreas passaram em sete tamanhos localmente e em 390/1365 online. Produção continua em `dpl_HP5ZpF3HuonTDoFfYVzKx2zp6cgi`. Servidor local encerrado. Checkpoint documental fica local para evitar outro deploy.

### Continuidade manual — feedback de saída, fila, confirmação e carregamento

Ativo/Inativo explícito para Blackout/ocultação; grupos de tempo distintos. Cartão atual antes dos filtros, localização além da paginação e versículo selecionado pelo mesmo helper do renderer. Modal de exclusão redesenhado preservando confirmação e foco/Escape. Revisão da abertura encontrou progresso temporizado e aquecimento de toda biblioteca sujeito a descarte; substituído por leitura local aguardada, marcas e mídias atual/seguinte, progresso por tarefas e pendências explícitas. Preloader deduplica trabalho em andamento, informa falhas e cancela preparações descartadas. 40 testes nativos/lint/build e ensaios UI de quatro tamanhos aprovados; seis áreas revistas em sete tamanhos. Limitações e explicação em `docs/feedback-fila-inicializacao.md`. Sem alteração de produção, outros projetos ou mídias legítimas. Pareamento permanente segue pendente.

Publicado `7db0e91254175fbb3e29b24ca40518a69318c473`, Preview READY `dpl_9N87ebBZjTbdgNWepkQmfme2wjy3`, alias conferido. PR #1 atualizada em rascunho. Prévia online passou nas seis áreas em 390×844 e 1365×900. Produção conferida no deployment original `dpl_HP5ZpF3HuonTDoFfYVzKx2zp6cgi`. Servidor local encerrado. Checkpoint documental local, sem novo deploy somente por registro.

### Refinamento solicitado — destaque discreto e permissões na abertura

Responsável pediu retirar textos de estado e excesso de informações, corrigir aparência/corte da linha atual no celular e restaurar checagem de permissões. Linha atual arredondada com padding/grid móvel e selo discreto; faixa atual compacta. Blackout/Limpar com rótulos estáveis, realce visual corrigindo regra CSS de maior especificidade e `aria-pressed`, sem Ativo/Inativo visível. Etapa de permissões executada após preparação: áudio, persistência e tela acesa, solicitações por gesto, verificação do resultado e continuação acessível em recusa/ausência. Removidos falsos “concedidos” do utilitário antigo; contexto de áudio compartilhado. 40 testes nativos e ensaios dedicados em quatro tamanhos, mais seis áreas em sete tamanhos, aprovados. Concessão/recusa de APIs foram simuladas nos ensaios; não declarar teste físico do aparelho/HDMI. Detalhes atualizados em `docs/feedback-fila-inicializacao.md`. Produção preservada, pareamento permanente ainda pendente.

Entrega `fc6f84f7557d1b2aa652d4ec448aeab0af6dafd4`, Preview READY `dpl_H5yc7b2zXW17ZQd3q3F3PUMtXbcf`, alias conferido; PR #1 reescrita para o estado final e mantida em rascunho. Conferência online das seis áreas e entrada após permissões passou em 390×844 e 1365×900. TypeScript/build aprovados. Produção ainda em `dpl_HP5ZpF3HuonTDoFfYVzKx2zp6cgi`. Capturas de linha atual, faixa compacta e permissões inspecionadas; servidor local encerrado. Checkpoint local sem implantação redundante.

### Correção manual — proteção local e permissões pendentes

Investigado relato de clique sem retorno: o navegador podia recusar persistência silenciosamente e a checagem restaurava o mesmo botão. Agora há progresso visível, verificação efetiva e resultado inline para recusa/erro/timeout, sem falso sucesso ou bloqueio da entrada. Recursos concedidos somem da lista; com todos concedidos, seção inteira é omitida. Proteção extra é diferenciada do armazenamento local comum. Estado de recusa somente em memória da sessão; reconsulta não dispara outra solicitação. Produção/main e arquivos legítimos preservados.

Validação local: lint/build e 40 testes nativos aprovados. Ensaios de navegador em 320/390/768/1365 px; cenários concedido, recusado, API ausente, exceção, timeout, todos concedidos e reconsulta. Captura da recusa em 320 px inspecionada. APIs simuladas, sem alegar teste no celular físico. Detalhes em docs/feedback-fila-inicializacao.md.

Entrega `931699667a0b4fe88d3a4775b34cff2069e3bc6d`, Preview READY `dpl_yt95ZixfVyvk16hNL5mQKPY2fvY5`, alias da branch conferido. PR #1 atualizada e mantida em rascunho. Revisão online das seis áreas aprovada em 390×844 e 1365×900. Produção conferida sem alteração (`dpl_HP5ZpF3HuonTDoFfYVzKx2zp6cgi`). Servidor local encerrado; checkpoint documental local para não gerar deploy redundante.

### Continuidade manual — operação da Sequência

Encontrados problemas reais ainda nesta aba: participação de mídia desativada no próprio arquivo não refletida em filtros/ícones; ativar não corrigia o bloqueio duplo; projetar pela biblioteca não limpava passagem anterior; setas sob busca dependiam do índice filtrado. Corrigidos seguindo a fila efetiva, persistência antes de sincronização e ações comuns de projetar/retomar. Retomar remove passagem manual e fixação, sem alterar Blackout/ocultação deliberados.

Teste móvel revelou selo de duração interceptando o botão Projetar na galeria. Ações passaram para faixa própria, sempre visíveis, fora da imagem, com área de toque de 44 px e rótulos acessíveis; grade adaptada às telas estreitas. Preservados arquivos, design, produção/main e outros projetos. Detalhes em docs/feedback-fila-inicializacao.md. Próxima frente: Bíblia, particularmente coerência entre referência preparada/selecionada e resposta tardia de consulta; não declarar a revisão integral dessa aba concluída.

Entrega `744616a66733bdcb6f791fd43c09622779cac74c`, Preview READY `dpl_9S8P3aZ1B2phqQVNwqi71mrrpEqu`, alias conferido. Lint/build e 40 testes nativos aprovados; fluxo de Sequência com IndexedDB descartável em 320/390/768/1365 px validou bloqueio duplo, ativar/ocultar, mover com busca, substituir passagem em lista/galeria/modal, retomar, cancelar e salvar/reabrir ordem. Revisão das seis áreas em sete tamanhos aprovada; online em 390×844 e 1365×900 também. Captura da galeria móvel inspecionada. PR #1 atualizada e rascunho; produção continua em `dpl_HP5ZpF3HuonTDoFfYVzKx2zp6cgi`. Servidor local encerrado. Checkpoint documental local sem novo deploy apenas por registro.
