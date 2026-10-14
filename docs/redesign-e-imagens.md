# Redesign do operador e inventário de imagens — 14/10/2026

Pedido: baixar logos/imagens hospedadas, permitir ao usuário indicar quais trocar e reduzir poluição/redundância do sistema. Continuação da mesma branch/PR de avaliação; produção preservada.

## Imagens

Três fontes estáticas externas encontradas em src/constants/logos.ts (Imgur): símbolo, nome e logo completa. Originais baixados e validados como PNG em public/brand/originals. Imagens leves da interface em public/brand/hl-*-20261014.webp, todas abaixo de 100 kB. Nenhuma referência a Imgur no código executado pelo navegador. Fonte/fallback de logotipos locais; outros serviços (Bíblia/PeerJS) não são hospedagem das imagens estáticas.

Ícones PWA locais novos em public/pwa/local-{symbol,text,full}-{dark,light,transparent}-{192,512}.png, dimensões reais e limites verificados. Cabeçalho, manifesto, ícones dinâmicos e cache do worker usam os novos arquivos. Identidade/start_url/scope do manifesto preservados; opções antigas de tipo/fundo seguem disponíveis. A escolha visual no painel não promete alterar retroativamente o ícone de uma instalação existente.

Galeria pública da prévia: /galeria-imagens.html, noindex/nofollow, acompanhada de /galeria-imagens.json. 22 grupos, números estáveis nesta entrega: 01 símbolo; 02 nome; 03 logo completa; 04–12 variantes usadas opcionalmente; 13–22 arquivos legados agrupados por hash. Quatro grupos contêm arquivos que não decodificam como imagem, apesar da extensão PNG. Os demais legados não são usados pela interface/ícones atuais; alguns manifestos alternativos antigos ainda apontam para arquivos antigos. Nenhum legado foi apagado. Seis ícones antigos de símbolo também foram reparados durante o preparo, mas a interface usa os novos arquivos local-; a galeria distingue essas cópias alternativas. Originais e todos os nomes de cópias disponíveis por links de download na galeria.

Imagens/vídeos enviados pelo usuário são dados locais da biblioteca do navegador, não arquivos do repositório: não foram extraídos de dispositivos nem substituídos. QR codes e ícones Lucide são gerados, não fotos hospedadas. A arte do nome é usada nas variantes de ícone; o cabeçalho usa o símbolo com texto tipográfico, sem afirmar que o WebP do nome é exibido ali.

## Organização do sistema

Navegação única nas seis áreas em PC/celular; removidos sidebar, monitor lateral duplicado e guias repetidos. Abrir/fechar telão como ação principal, instalação/projeção neste aparelho/conexão nas opções secundárias. Controles essenciais em faixa única horizontal, sem virar uma coluna adicional no PC.

Fila compacta com busca/filtros, lista inicial de cinco itens no celular/oito no PC e Mostrar mais, sem remover slides nem mudar sequência. Ordenação individual e organização geral recolhidas; biblioteca de mídias e comportamento de vídeos/textos em grupos expansíveis. Ajustes agrupados em projeção/efeitos/cronômetro, avisos/áudio/letreiro e desempenho/energia. Monitor em sua própria área, sem duplicar comandos de blackout/limpeza. Texturas, pulsações decorativas e títulos em caixa alta reduzidos; desenho compartilhado entre áreas.

## Verificação e limites

TypeScript/build e testes de paginação/imagens. QA de 320/390/1365px verifica seis áreas, ajustes expansíveis, comandos essenciais, envio de texto, imagens no mesmo domínio, ausência de overflow/erros JS. Galeria carrega as 18 prévias válidas; quatro grupos inválidos mostram aviso, não imagem quebrada. Testes em sessão isolada, sinalização/WebSocket bloqueados, nenhuma mídia do usuário criada/alterada em dispositivo real. Persistência e protocolo de envio existentes conservados.

O pareamento remoto ainda precisa de autorização/validação/ACK conforme relatório anterior; esta etapa não declara confirmação remota nem funcionamento no HDMI físico. Manifestos legados e arquivos sem uso estão preservados para a decisão do usuário. Nenhuma alteração em outro projeto nem promoção da prévia.
