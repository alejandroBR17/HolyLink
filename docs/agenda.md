# Agenda: datas, edição e operação

Reuniões semanais e eventos pontuais continuam separados pela frequência. A lista permite buscar tema/dia/horário e filtrar semanais, eventos futuros (incluindo hoje) ou passados. Eventos pontuais são ordenados pela data real; semanais, pelo dia e horário. O selo Hoje compara a data completa de um evento, sem confundi-lo com outra semana.

Os formulários são formulários HTML com envio por teclado, nomes de ação Adicionar/Salvar alterações e validação inline. Tema/nome, hora e data precisam ser válidos; datas impossíveis não são normalizadas silenciosamente. Abrir a edição leva ao formulário e posiciona o foco. Edição detecta alteração/exclusão do mesmo registro por outro controle e bloqueia sobrescrita até reabrir a versão atual.

Cartões usam títulos com quebra de linha, ações com 44 px e disposição própria no celular. Limpar eventos passados, excluir e restaurar campanhas exigem confirmação na integração atual. Confirmar uma exclusão filtra a coleção mais recente, preservando registros recebidos enquanto o diálogo estava aberto. Cancelar formulários/diálogos não altera o cadastro.

## Datas e contagem regressiva

O cálculo anterior procurava somente nos próximos sete dias e usava o primeiro registro para inventar uma reunião no dia seguinte quando não encontrava resultado. Agora compara o próximo início de cada semanal e a data real de cada evento, mesmo distante. Sem reunião futura, retorna ausência explícita: Ajustes informa Sem próxima reunião e desativa controles de contagem sem destino; o aviso Começa em instantes não é acrescentado por uma contagem fictícia.

O período existente de 90 minutos usado para identificar uma reunião em andamento foi preservado, incluindo a virada da meia-noite. Não mede a duração real do culto. Datas/horários seguem o calendário local do aparelho, usando operações de calendário em vez de somar blocos fixos de 24 horas.

A validação de sincronização rejeita datas impossíveis e divergência entre horário escrito e horas/minutos. Campanhas permanecem ativas até o fim da data limite; depois saem da seleção automática sem apagar o cadastro. Eventos passados saem da fila e uma fixação de evento vencido é liberada pelo operador.

## Verificação

- TypeScript, build e 46 testes nativos: ano bissexto, data impossível, horário inválido, eventos além de sete dias, lista vazia/passada, competição semanal/pontual, selo Hoje e reunião após meia-noite.
- Navegador isolado em 320/390/768/1365 px: criar/editar/cancelar, validação, evento 28 dias à frente, filtros, conflito de edição, campanhas, limite inclusivo, confirmação/cancelamento, exclusão preservando cadastro concorrente e recarga.
- Revisão geral das seis áreas em sete tamanhos. Conteúdo sintético apenas em contextos locais descartáveis; nenhum cadastro legítimo modificado nos testes.
- Não foi ensaio de HDMI físico ou sincronização em rede real. Pareamento permanente e demais pendências do relatório continuam separados desta entrega.
