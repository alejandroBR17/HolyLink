# Celular como origem principal, PC com biblioteca preservada

## Comportamento aprovado pelo responsável

O celular envia agenda/configurações e mescla mídias com o PC. A ausência de um arquivo no celular não exclui o arquivo do PC. Excluir exige uma ação explícita enquanto conectado.

## Implementação

- Manifestos com assinatura de conteúdo `b1:`. A assinatura usa SHA-256 de blocos fixos de 1 MiB e uma assinatura final versionada incluindo o tamanho. Não se trata do SHA-256 simples do arquivo e não deve ser comparada com hashes de outras ferramentas.
- Comparação não depende de nome/identificador/tamanho isoladamente: bytes diferentes do mesmo tamanho são atualizados; bytes iguais com outro nome/ID reutilizam o arquivo existente no PC.
- Os identificadores do celular são associados ao identificador canônico do arquivo existente no PC. As referências da sequência e os comandos seguintes são traduzidos sem renomear, apagar ou duplicar o arquivo já armazenado.
- Enviar novamente o mesmo conjunto não solicita novos blocos. Um upload feito no celular conectado também consulta primeiro o PC por manifesto de mídia, antes de enviar bytes.
- Metadados da versão do celular prevalecem nos arquivos compartilhados. Agenda/campanhas padrão são incluídas mesmo quando ainda não foram personalizadas. Sequência e pausas de arquivos exclusivos do PC são mantidas na mescla.
- A opção rara Receber do PC continua separada, com aviso de substituição dos dados do celular. Sua comparação também deixa de considerar tamanho igual suficiente.
- Catálogo de arquivos do PC via conexão autorizada, sem baixar vídeos/imagens para o celular. A biblioteca mostra os arquivos que ainda não estão representados na biblioteca local; referências equivalentes são ocultadas para evitar linhas duplicadas.
- Na mesma biblioteca: projetar, pausar/ativar e excluir arquivo do PC. Pausar preserva o arquivo; excluir requer confirmação e remove possíveis cópias nos aparelhos conectados. Exclusão por um alias resolve para o arquivo real e informa todos os aliases aos aparelhos conectados.
- Catálogo limpo ao desconectar; ações recusadas sem conexão autorizada. Mensagem de exclusão é solicitação, sem afirmar sucesso antes da atualização do catálogo.
- Manifesto inválido/arquivo acima do limite produz resposta de falha e libera o celular sem aplicar configurações do pacote rejeitado. Arquivos locais de tamanhos incompatíveis não precisam ser lidos para a comparação.
- O PC confirma fim do envio somente depois das gravações de chunks em curso. Essa confirmação libera o estado ocupado e a tela de progresso do celular. Falha/desconexão também encerra o progresso, sem anunciar conclusão bem-sucedida.
- Alterar somente metadados não abre uma tela de transferência que ficava presa no operador do PC.

## Verificação

- 34 testes nativos aprovados, incluindo igualdade de conteúdo independente do nome/ID, conteúdo diferente do mesmo tamanho, referências/aliases, manifesto malformado e assinatura com leitura por fatias/cancelamento.
- `npm run lint` e `npm run build` aprovados.
- `../data/verify-holy-merge.cjs`: duas instâncias em contextos distintos, bancos IndexedDB reais, PeerJS simulado e ponte de mensagens entre páginas. Aprovação; catálogo; projetar/pausar/ativar arquivo exclusivo do PC; mescla; preservação do exclusivo; atualização de bytes diferentes do mesmo tamanho; reutilização de arquivo com outro ID; ordem preservada; segunda sincronização sem bytes; preflight de upload duplicado sem bytes; exclusão explícita de exclusivo; exclusão de aliases/cópias conectadas; conclusão e interface liberada após confirmação; manifesto acima do limite rejeitado sem alterar configuração/arquivos; interface liberada também na falha/desconexão.
- `../data/verify-holy-remote-ui.cjs`: 320×740, 390×844, 430×932, 844×390 e 1365×900; nome longo, paginação, cancelamento da exclusão, limpeza ao desconectar e ausência de overflow.
- Sem dados legítimos modificados pelos testes e sem ensaio de HDMI/rede física.

## Limitações e próximo bloco

- Pareamento permanente/reconexão automática de aparelhos já autorizados ainda precisa de implementação própria; não enfraquecer a aprovação atual apenas por lembrar o código.
- Assinaturas são calculadas durante a comparação; grandes bibliotecas podem exigir tempo de leitura. Não há cache persistente de assinatura nesta etapa, evitando reutilizar um hash desatualizado.
- Exclusões alcançam aparelhos atualmente conectados; não há diário distribuído para dispositivos offline. Uma cópia de outro dispositivo offline poderá reaparecer se for enviada posteriormente.
- IDs distintos com bytes iguais são tratados como o mesmo arquivo do PC; seus nomes/duração/configurações seguem a última versão enviada do celular. Isso não cria entradas distintas para executar o mesmo arquivo com metadados conflitantes.
- Confirmação de gravação de mídia não comprova imagem física no telão nem cobre todos os caminhos legados do protocolo. Backups completos e envelopes legados permanecem na auditoria.

Entrega restrita à prévia do projeto Vercel holylink e à draft PR #1; produção e main preservadas.
