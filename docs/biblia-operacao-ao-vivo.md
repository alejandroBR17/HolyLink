# Bíblia para operação ao vivo — 14/10/2026

A aba Bíblia agora começa pela busca de referência, com seleção opcional de livro/capítulo/versículo ou intervalo. O texto é obtido na tradução Almeida do provedor existente; não há edição manual de corpo ou título. Buscar prepara e leva à passagem, sem alterar o telão; enviar é uma ação explícita. A aparência 16:9 ficou recolhida para não afastar os comandos no celular. Passagens longas continuam divididas em páginas sem descartar texto, com navegação independente na prévia e na saída.

Removidos desta aba os avisos prontos, a mistura de sugestões, o versículo aleatório e a parede de botões. Seus dados antigos de avisos/rascunho/favoritos não foram apagados. Favoritos existentes ficam numa seção secundária; o histórico mostra somente passagens enviadas por esta nova área, limitado a oito, sem repetir entradas idênticas. Repetir inicia a passagem pela primeira página. O histórico pertence a este navegador, não ao servidor ou ao celular pareado.

Busca somente por ação explícita; cancelamento da solicitação anterior, prazo de 10 segundos, validação de resposta e cache de até 20 buscas durante a sessão da aba. Erros mantêm a passagem preparada anterior claramente identificada e não mudam a saída. Nenhum novo serviço, dependência, banco ou pré-carregamento da Bíblia. Cabeçalho ajustado para 320px e controles reduzidos em altura no celular deitado.

Validação: TypeScript e build; sete testes de histórico, paginação e imagens. QA isolado de 320x700, 360x800, 390x844, 430x932, 768x1024, 844x390, 1365x900 e 1920x1080: referência, seleção, erro de busca, paginação, repetição sem duplicar, persistência e envio por BroadcastChannel à janela de projeção. Respostas controladas somente no teste. Consulta real de João 3:16 (Almeida) validada na interface, incluindo as seis áreas sem overflow horizontal em 320/390/430/844/1365/1920px. Corrida entre buscas, cancelamento e cache testados. Capturas revisadas em celular pequeno e PC. Nenhum teste em HDMI ou dispositivo físico/pareamento remoto; ACK e segurança de conexão continuam pendentes. Produção preservada; somente a branch de avaliação/PR draft #1 é atualizada.

## Ajuste após avaliação: uma seção contínua

Busca, passagem encontrada, envio, páginas, prévia opcional e histórico foram reunidos em um único cartão. Removidos o grid de cartões e o espaço reservado antes da primeira busca. História e favoritos ficam recolhidos dentro da própria seção; resultados não provocam rolagem automática. A seleção de livro recolhe após uma busca bem-sucedida, deixando o texto logo abaixo da referência. Dados e protocolo preservados.

TypeScript/build e QA de busca, páginas, transmissão local, repetição e persistência em 320/390/430/1365px, incluindo histórico recolhido. Esta alteração atende à avaliação do usuário sobre fragmentação visual; não substitui a validação física do telão/pareamento.
