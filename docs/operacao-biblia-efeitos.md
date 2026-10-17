# Bíblia, fila e efeitos — revisão de operação

## Seleção sem digitar

- Livro com Antigo/Novo Testamento e somente os capítulos existentes (66 livros, 1.189 capítulos).
- O capítulo selecionado vem da API parametrizada Almeida. As opções de versículo são as que a resposta realmente contém; não se oferece um limite genérico de 150 para todos os livros.
- Toque em um número para preparar; os seletores “Do/Até” montam um intervalo. O capítulo inteiro também pode ser preparado. Projetar permanece uma ação separada.
- Consultas de capítulos têm cancelamento, espera curta para agrupar mudanças rápidas e limite de dez segundos. As últimas 24 respostas válidas ficam no navegador, para voltar sem rede; não se baixa a Bíblia inteira. API indisponível ou limitação de consultas gera aviso com nova tentativa.
- A digitação de referência é uma opção secundária. A tradução permanece Almeida.

Contrato consultado: [documentação bible-api.com](https://bible-api.com/), API `/data/almeida/BOOK_ID/CHAPTER`. O serviço externo tem limites e não garante disponibilidade; cache não equivale à Bíblia completa offline.

## Fixar e voltar à fila

Batismo e Despedida usam `manualSlideOverride`, independentemente de estarem na fila. O botão muda para Soltar enquanto fixado; “Voltar à fila normal” também fica visível. A fila e seu modo pré/pós-reunião são preservados. Isso substitui o uso anterior de `advanceToSlide`, que só tentava avançar para um item já existente na fila e não o fixava. A sequência continua seu relógio ao fundo; voltar à fila não significa voltar ao exato segundo anterior.

## Fundos

Aurora, Véu e Aura usam o renderer/shader WebGL existente; Automático escolhe Aurora ou Aura conforme encontro jovem. Partículas 2D usam canvas. Sem efeito desliga a camada animada, não as imagens e vídeos dos slides. Os controles agora separam visual, limite de FPS e intensidade; não alteram silenciosamente a qualidade geral local.

A prévia ao lado dos controles usa o mesmo motor e configurações, montado apenas enquanto aberta, com composição 16:9. Ela demonstra a camada isolada; fotos/vídeos em tela cheia podem cobri-la e blackout cobre toda a saída. No modo Automático, esta demonstração mostra Aurora. O Monitor mostra a composição local da reunião. Nenhum deles é uma captura/ACK do HDMI do PC remoto. Falta de WebGL/contexto perdido é informada na demonstração. Canvas 2D agora acompanha a largura/altura da prévia em vez de ficar com dimensões CSS intrínsecas de 1920×1080. ResizeObserver acompanha mudanças no tamanho do contêiner 3D.

## Atalhos e diagnóstico

Uma lista compartilhada por Ajustes e Monitor agrupa fila, saída e seções. O Monitor oferece os mesmos comandos por toque, com callbacks diretos. O teclado ignora modificadores, repetição, campos/seletor e diálogo modal; Espaço/Enter num botão não dispara também o avanço da fila.

Dados exibidos são deste aparelho/aba. Processadores lógicos vêm do navegador; RAM é estimada/arredondada quando disponível; heap, GPU e rede podem estar ocultos. Ausência não vira mais “4 núcleos”, “≥4 GB”, “10 MB” ou “Wi-Fi”. FPS conta atualizações da aba, não é uma medição específica do shader nem do PC remoto. Pontuação é indicativa; limpar cache de pré-carregamento não controla toda a RAM. Resolução física derivada de tela/DPR é indicada como estimativa.

## Validação

- 37 testes nativos, incluindo catálogo, validação de capítulo e cache limitado.
- Lint TypeScript e build Vite.
- Navegador isolado em 320, 390, 768 e 1365 px: escolha/intervalo, capítulo de livro com um capítulo, cache sem nova consulta, fixar/soltar ambos os slides, cinco estilos, controles e atalhos protegidos. Respostas bíblicas simuladas nesse ensaio, sem modificar dados legítimos.
- Motor WebGL real no navegador: frames mudam com o tempo, Aurora/Véu diferem, sem erro de shader; fechar demonstração desmonta canvas.
- Revisão das seis áreas em sete tamanhos, 320–1920 px, formulários, diálogos, foco/Escape, sem overflow ou erro de página.
- Não foi um ensaio em celular físico, rede da igreja ou HDMI. Pareamento permanente continua pendente.

## Revisão integral de Ajustes após retorno do celular

A aba foi reorganizada em Operação da reunião, Fundos e efeitos, Avisos/áudio/letreiro, Desempenho/energia e Atalhos. Cartões e formulários ganharam tipografia legível, rótulos, áreas de toque de pelo menos 44 px, quebra de textos e disposição própria no celular. O retorno da mídia fixada ocupa a largura do cartão com altura mínima de 52 px, sem encolher no flex. O teste encontrou uma regra global de maior especificidade que limitava esse ajuste; o seletor corrigido foi medido em oito larguras.

Corrigidos também o indicador de janela aberta após bloqueio de popup e os ajustes de tempo durante pausa. Letreiro agora tem rascunho e envio explícito, em vez de publicar cada tecla. Os cinco avisos rápidos continuam imediatos; formulários de texto, carro e criança foram preservados, com histórico reutilizável e exclusão acessível ao toque. O mixer foi redesenhado sem textos de 8–9 px, com controles de volume, silêncio e presets. Limpar cache e manter tela acesa têm nomes e mensagens próprios.

### Portabilidade do fundo preto

O shader usava `smoothstep` com bordas invertidas e `mediump` em permutações que excedem a faixa mínima dessa precisão. São defeitos de portabilidade que podem produzir resultado diferente entre desktop e GPU móvel; não foi confirmada a GPU exata do responsável. As máscaras agora usam bordas crescentes e o cálculo pede `highp`, com tempo relativo ao início. Referência: [especificação GLSL ES, precisão e smoothstep](https://registry.khronos.org/OpenGL/specs/es/2.0/GLSL_ES_Specification_1.00.pdf), seções 4.5 e 8.3.

Sem WebGL/precisão necessária, erro de shader ou perda de contexto, o motor mostra uma composição CSS compatível do estilo escolhido. Essa alternativa também vale para a projeção que não tenha suporte gráfico. A prévia identifica a versão compatível; não a apresenta como o mesmo shader 3D. O botão “Usar prévia leve neste aparelho” permite escolhê-la localmente, sem mudar o estilo/configuração enviados ao PC. Fechar a prévia desmonta os recursos gráficos.

Ensaios: oito tamanhos (320, 360, 390, 430, 768, 844 em paisagem, 1365 e 1920); altura do retorno, operação/pausa/avisos/letreiro/volume/cache/popups, ausência de overflow e alvos de toque. Navegador em viewport móvel: animação de Aurora/Véu/Aura com WebGL real, sem WebGL por simulação, perda de contexto e troca manual leve/3D sem alterar configuração compartilhada. O aparelho físico do responsável e o HDMI continuam necessários para confirmação final.

## Continuidade da Bíblia — preparação e envio independentes

Respostas de busca antiga são canceladas/desconsideradas ao escolher outro livro/capítulo, editar a referência, preparar ou enviar outra passagem. Erro de referência aparece no formulário correspondente, sem sugerir recarregar o capítulo errado. Versículos carregados pertencem explicitamente ao livro/capítulo atual; o primeiro não é apresentado como escolhido antes do toque. Intervalo começa em Escolher e só libera o final após definir o início.

A passagem preparada e sua página ficam em um único rascunho local validado, preservado ao mudar de aba/recarregar; conteúdo inválido é ignorado e falta de armazenamento não impede preparar/projetar. O cabeçalho identifica Passagem preparada. Isso não envia o rascunho automaticamente nem substitui o histórico de oito últimas passagens enviadas.

Os controles Anterior/Próxima no telão seguem a última passagem enviada mesmo se outra estiver sendo preparada. Funcionam ao reabrir a aba por reconhecimento da página no histórico local, sem descartar a nova preparação. Paginação do histórico é memorizada e só recalculada quando texto/referência/histórico mudam. Retomar remove o texto bíblico e a fixação, mantendo controles deliberados de Blackout/ocultação separados.

Validação: TypeScript/build e 40 testes nativos. Navegador em 320/390/768/1365 px com respostas controladas: seleção inicial, capítulos existentes, intervalo, passagem longa em páginas, preparação sem mudar envio, próxima página do envio preservando rascunho diferente, ida/volta entre abas, recarga e resposta antiga ignorada. Consulta direta ao serviço Almeida confirmou João 3 (36 versículos) e Judas 1 (25); textos sintéticos ficam apenas em contextos descartáveis de teste. Não equivale a teste físico no telão nem a revisão concluída da Agenda.

## Ajustes — estado compartilhado e última alteração preservada

A preferência de manter a tela acesa pertence ao navegador/aparelho, sem ser transmitida ao PC remoto. Desligar persiste a escolha e impede reativação automática no retorno à aba, na recarga e no gesto de entrada. Uma ativação explícita em Ajustes ou Acessos deste aparelho pode habilitá-la novamente. Preferência não equivale à concessão: a interface informa separadamente se o navegador está mantendo a tela acesa.

Uma única aquisição é compartilhada entre consumidores locais. Desativar durante a solicitação invalida a resposta; concessão tardia é liberada. Liberação pelo navegador atualiza todos os indicadores, sem ciclo de pedidos imediatos; retorno à aba visível tenta novamente somente se a preferência continuar ativa. Aba oculta não é apresentada como tendo recebido concessão tardia. Falta de armazenamento conserva a escolha apenas durante a sessão.

O volume mantém resposta local e limita transmissões intermediárias a uma janela de 40 ms. O último valor é confirmado por teclado, fim/cancelamento da interação, perda de foco/captura e saída da aba de Ajustes. Presets atualizam o mesmo valor corrente. Atualizações recebidas fora de um arrasto são refletidas; durante um arrasto, a confirmação final preserva a escolha atual do operador.

O letreiro tem rascunho local limitado a 500 caracteres, validado ao ler. Trocar de aba/recarregar não apaga a preparação. Um texto recebido de outro controle atualiza a faixa em exibição sem substituir o rascunho editado. Exibir publica explicitamente; Retirar remove a faixa ao vivo sem descartar uma próxima mensagem já preparada. Descartar rascunho retorna ao texto vigente. Sem armazenamento, o formulário continua utilizável, sem promessa de persistência.

Validação: 52 testes nativos, incluindo aquisições concorrentes, desativação com resposta pendente, retorno visível, recusa e liberação pelo navegador. Ensaios em 320/390/768/1365 px cobriram escolha após recarga, permissão por caminho alternativo, volume por teclado/arrasto/atualização recebida/saída imediata e rascunho de letreiro entre abas/recarga/envio/retirada/descarte. APIs e mensagens remotas foram simuladas em contextos descartáveis; não confirmam repouso ou áudio físicos no aparelho da igreja. As seis áreas passaram em sete viewports.


## Ajustes — instalação, ícones e atualizações

A proteção dos arquivos locais é uma solicitação opcional de armazenamento persistente: reduz o risco de o navegador remover dados por pressão de espaço. Não substitui backup, não impede limpeza manual/desinstalação e não envia arquivos para a nuvem.

A instalação é PWA: Chrome/Edge em PC e Chrome Android oferecem instalação quando o navegador disponibiliza o convite. Em iPhone/iPad, usar Compartilhar → Adicionar à Tela de Início; o diálogo reconhece também iPad com identificação de computador e permite escolher instruções manualmente. Um navegador comum não consegue enumerar de forma confiável todos os apps instalados. Aceitar o convite não é tratado como instalação concluída: a confirmação vem de appinstalled ou execução standalone. Convites consumidos, inclusive recusados/com erro, não são reutilizados; consumidores compartilham o mesmo estado.

Personalização antes alterava a miniatura mas mantinha o manifesto padrão. Agora nove manifestos locais usam a seleção validada, preservam a identidade canônica / e abrem na raiz. Bootstrap anterior ao React carrega a escolha antes da avaliação de instalação. Alterar estilo/fundo oferece aplicação explícita com recarga, sem reutilizar convite obtido para outro ícone. O diálogo reabre após aplicar; seleção e prévia são compartilhadas entre consumidores. Baixar imagem PNG entrega a variante local de 512 px; arquivos sem fundo têm alfa real e versões claras são brancas. O sistema pode impor fundo/recorte no ícone instalado e controla quando atualiza um ícone já existente; não se recomenda apagar o app como rotina. O modal rola internamente em telas baixas, tem instruções selecionáveis, estados acessíveis e preserva Escape/foco.

Atualizações do service worker aguardam ação explícita e não recarregam uma projeção por conta própria. Atualizar não remove registros de service worker, todos os caches ou dados locais. Limpeza na ativação se limita ao prefixo do próprio aplicativo. Cache de recursos locais limitado a 120 entradas; não captura API/Bíblia/P2P nem terceiros. Navegação usa uma chave canônica sem tokens/query strings e tenta os fallbacks offline de forma assíncrona correta, com erro 503 quando não há shell. Offline cobre apenas recursos já carregados; não garante novas consultas/conexões.

Validação: TypeScript/build; 58 testes nativos ao todo (52 anteriores + seis de PWA). Revisão das seis áreas em sete viewports; personalização/aplicação/reabertura, PNG real, convite de uso único e confirmação de instalação em 320/390/844 paisagem/1365 px. Nove manifestos e seus PNGs conferidos por HTTP. Armazenamento simulado e sinal appinstalled sintético não equivalem à instalação física. Service worker real no Edge headless, build local: abertura offline depois de carregamento online; nova versão aguardando sem recarregar a sessão; atualização explícita com preferências e cache alheio preservados. Diagnóstico Chromium sem erros de manifesto; limitação in-incognito esperada do contexto automatizado. Captura móvel inspecionada. Ainda faltam ensaios físicos PC/Android/iPhone e HDMI; Preview pode exigir autenticação Vercel para recursos acessados pelo instalador do sistema. Produção/main preservadas.


## Ajustes — refinamento móvel e iconografia

Retorno do responsável: aviso de nova versão comprimindo ação em até três linhas e PNG com fundo quadrado. O aviso agora é um componente comum ao painel e ao diálogo: ação Atualizar curta, sem encolhimento, altura mínima de 44 px e empilhamento abaixo de 380 px. Atualização continua exclusivamente por ação do operador, sem perder preservação de dados.

Diálogo reorganizado em instalação/instruções, personalização recolhível e download de imagem separado. Botões de estilo/fundo têm nomes curtos e alvo mínimo de 44 px; diálogo limita altura e rola internamente, com foco/Escape. PNG exportado em canvas usa a arte transparente local sobre fundo preto profundo/branco, com raio 112/512 e cantos realmente transparentes. Sem fundo preserva a arte transparente. A prévia usa a mesma geometria. Recursos de instalação permanecem quadrados para receber a máscara do sistema, sem prometer arredondamento idêntico em cada launcher. Erro ao gerar PNG aparece no próprio diálogo.

Phosphor React 2.1.10, MIT, aplicada com peso duotone em Ajustes, fundos, permissões, instalação e navegação principal. Importações individuais evitam carregar o catálogo. Sequência usa playlist; projeção usa telão; limpar conteúdo usa seleção cortada; letreiro usa caixa de texto; volume usa alto-falantes; atualizar usa seta circular sem brilhos decorativos. Textos continuam identificando as ações. Outras seções internas ainda podem usar Lucide; não foi declarada migração integral do aplicativo.

Validação: lint/build e 58 testes nativos. Cenários com atualização pendente em 320/390/430/844 paisagem/1365 px confirmaram ação em uma linha e >=44 px, sem overflow no diálogo, personalização/aplicação/reabertura, download real e Escape. Os nove PNGs foram decodificados no navegador e conferidos nos pixels: cantos alfa zero, fundo preto #030305 ou branco, dimensão 512. Arquivo baixado salvo e lido separadamente confirmou esses pixels. Capturas móveis de aviso e diálogo inspecionadas. Revisão geral das seis áreas em sete viewports. Cenário de nova versão usa registro simulado; o fluxo real de atualização/serviço permanece coberto pela rodada anterior. Instalação/HDMI físicos continuam pendentes.


## Ícones de instalação — arquivos apropriados por plataforma

Feedback após instalação física informou cantos quadrados. A correção anterior arredondava somente a exportação, deixando os recursos do manifesto antigos e sem propósito adaptável nas variantes. Corrigido sem mudar a identidade do aplicativo: nove manifestos e o manifesto padrão agora contêm versões any arredondadas e maskable próprias, opacas, com toda a arte dentro de um círculo de raio igual a 38% do lado (margem diante dos 40% da área segura). Há apple-touch-icon opaco de 180 px, separado do favicon e do ícone de 192 px. Transparente continua no PNG/any; para Android adaptável e Apple usa base preta. O formato externo adaptável pertence ao launcher do aparelho; não se promete um raio uniforme entre sistemas nem atualização imediata de ícone já instalado.

36 arquivos novos usam nomes v2 para evitar o cache imutável de um ano dos endereços antigos. Bootstrap escolhe arquivos próprios por função, antes da avaliação do instalador. A prévia mostra a arte da plataforma escolhida, em vez de somente desenhar uma borda sobre a imagem antiga. Renderer compartilhado entre download e geração estática; scripts/generate-launcher-icons.cjs reproduz os recursos contra Vite local usando Playwright instalado (caminho opcional na variável HOLY_PLAYWRIGHT_MODULE). Service worker recebe nova versão, mantendo atualização exclusivamente explícita.

Interface: celular Phosphor DeviceMobileCamera com tela inteira/câmera frontal, substituindo modelo de molduras antigas; peso regular uniforme, armazenamento protegido com escudo, limpeza de cache com vassoura, aviso com caixa de texto, Automático com setas de ciclo e Aura com anel tracejado. Não se trocou novamente toda a biblioteca.

Validação: lint/build; 59 testes nativos ao todo (incluindo prova dos pixels de canto nos arquivos de instalação). Navegador em 320/390/844 paisagem/1365 verificou arquivos de prévia para Android/iOS/PC, apple-touch-icon, foco/Escape e geometria. Os 36 PNGs dos manifestos/Apple foram decodificados: any com cantos alfa zero, adaptáveis/Apple totalmente opacos, e cada pixel de arte adaptável dentro da área segura de 40%. Revisão das seis áreas em sete tamanhos passou. Service worker real em build local manteve abertura offline após carregamento online, preferências e cache alheio. Chromium não apontou erro de manifesto; contexto automatizado conserva a limitação in-incognito. Não equivale a teste de instalação física nem confirma atualização imediata do ícone no aparelho do responsável. Referência: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Define_app_icons .


Conferência posterior encontrou o celular anterior ainda importado diretamente em Conexão, Monitor, projeção, slides e diagnóstico. Todos esses usos agora importam o símbolo moderno compartilhado; os demais ícones dessas áreas não foram migrados integralmente. Lint/build e revisão das seis áreas em 390/1365 px passaram após essa correção adicional. No Chrome 144+, mudanças relevantes de ícone podem exigir revisão/aceitação no menu do aplicativo; URLs foram alteradas para permitir essa detecção. Fonte: https://developer.chrome.com/blog/improvements-to-web-app-updates . Não orientar desinstalação como rotina, pois há dados locais a preservar.


## Monitor — composição local e operação

O Monitor mostra o conteúdo atual respeitando blackout, passagem enviada/prioridade, cronômetro, modo de reunião e conteúdo oculto, além do próximo item real da fila. Os nomes usam o mesmo descritivo para conteúdo atual e seguinte. Retomar fila remove passagem/fixação; no modo de reunião já iniciado também libera o carrossel. O cronômetro não é desligado implicitamente. Indicadores de aviso e letreiro mostram estados ativos, sem afirmar recebimento físico pelo HDMI.

A prévia é silenciosa e pode ser ampliada num diálogo 16:9, com Escape/foco preservados. Há somente uma composição local montada, inclusive quando ampliada. Pausar a prévia desmonta seu renderer e reduz o trabalho deste aparelho, mantendo leitura do conteúdo atual e a operação/projeção. Essa pausa não é persistida entre entradas; vídeos da prévia podem reiniciar ao ampliar/recolher/retomar e não são um espelho sincronizado do instante do vídeo no telão.

O cabeçalho completo (marca, abrir telão/opções e aviso de reunião) recolhe ao rolar para baixo. Navegação e controles rápidos ficam acessíveis. Rolar para cima restaura; a seta Mostrar topo permite restaurar mesmo quando o recolhimento fez toda a página caber na tela. Menu de opções aberto ou foco de teclado no cabeçalho impedem ocultação inesperada. Elementos recolhidos ficam inert, com animação reduzida conforme a preferência do aparelho.


## Ajuda de projeção e diagnóstico do Monitor

A ajuda reúne guia para PC no telão/celular no controle, solução de tela preta, falta de som, controle remoto e travamentos, com acesso a Conexão, áudio, atalhos e qualidade. Trocar o guia não altera o papel do aparelho. Ações de retirar blackout/mostrar conteúdo aparecem apenas para estados ativos e exigem toque explícito. Dados de atualização da aba, perfil efetivo e RAM aproximada são locais.

O diálogo Diagnóstico e qualidade substitui o antigo Testar & Otimizar. Consultar aparelho faz uma consulta direta limitada a quatro segundos e não troca perfil. Fechar invalida respostas atrasadas; timeout libera os controles. Perfis Automático/Leve/Equilibrado/Detalhado só são gravados quando escolhidos; falha de armazenamento não altera a escolha da sessão nem informa sucesso. Informações técnicas são recolhíveis, identificam valores não informados/estimados e não prometem zero lag, teste de HDMI ou velocidade real da rede. O cache limpo é de pré-carregamento, sem apagar mídias/roteiro/autorizações. A sondagem WebGL libera o contexto isolado após a consulta.


## Preparação da saída e recuperação de mídia

Abrir telão cria uma janela de preparação, separada do operador. Mova essa janela para a saída desejada e escolha Iniciar em tela cheia ou Iniciar na janela. Projetar neste aparelho tem preparação própria e permite voltar ao operador. Não há seleção automática de uma saída HDMI nem confirmação física do telão. A janela secundária aguarda a leitura da biblioteca; não exige repetir a entrada no operador.

A composição permanece em 1920×1080 e os pontos de mudança de estilo seguem essa área, incluindo no celular e na prévia. Textos se ajustam novamente quando as fontes ficam prontas. A Bíblia continua usando a paginação existente de até 320 caracteres; textos arbitrários antigos muito extensos precisam ser divididos antes da projeção. As preferências de movimento reduzido eliminam a entrada escalonada dos cartões e deixam os fundos parados; no modo normal os efeitos continuam animados. Perda de WebGL preserva a alternativa compatível.

Mova o ponteiro, toque ou pressione Tab para mostrar os controles da saída; Ocultar controles os retira imediatamente. Sair/Esc volta à preparação ou ao operador, conforme o modo. O navegador pode consumir o primeiro Esc para sair da tela cheia. Esses controles são desenhados na própria janela de saída, portanto podem aparecer no telão enquanto abertos. Toasts, confirmação de operações e progresso de transferência não fazem parte da composição pública.

Vídeo tem um player por conteúdo, sem uma segunda reprodução apenas para fazer o desfoque. A prévia permanece silenciosa; alterar volume não reinicia a mídia. Bloqueio de reprodução/áudio permite tentar sem som e mostra o estado nos controles. Permitir áudio depende de gesto nessa janela; uma ação remota não garante autorização do navegador. Ao trocar de conteúdo o vídeo anterior é interrompido. O modo de fim de vídeo existente (repetir ou liberar fixação) é preservado.

Arquivo inválido, imagem sem carregamento por 12 segundos ou vídeo sem progresso por 15 segundos recebem uma composição neutra. O nome do arquivo fica no controle técnico, não na mensagem ao público. Tentar mídia novamente relê o arquivo local; Próximo conteúdo permite seguir a fila. Tentar não repara bytes corrompidos nem torna um codec incompatível em compatível: reimporte uma versão válida se necessário. Ocultar/minimizar a janela suspende o vídeo e ele tenta retomar quando visível; não feche/minimize a janela enviada ao telão.

Validação em navegador não confirma cabo HDMI, posição física da janela, overscan, distância de leitura, alto-falantes ou políticas do navegador do aparelho real. Faça um ensaio no equipamento da igreja, incluindo volume, fim do vídeo e perda/recuperação de mídia, antes do uso ao vivo.


## Globo e QR de doações

O cartão Desligue-se do mundo mantém os 7,5 segundos de globo rotativo antes de Ligue-se com Deus, agora com chama de geometria 3D, iluminação e movimento. Os dois seguem os mesmos controles existentes de Fundos e efeitos: Sem efeito deixa os símbolos parados; Partículas 2D ou perfil Leve usa alternativas CSS/SVG. Outros fundos permitem 3D, seguindo FPS/detalhe e o perfil de desempenho. Equilibrado limita a 30 FPS e detalhe médio; Detalhado permite o limite escolhido. Movimento reduzido mantém os símbolos parados. Falha/perda de WebGL troca para alternativa compatível. Geometria, materiais, textura, canvas, quadros e contexto são liberados na saída/troca de perfil. Janela oculta suspende animação. Não há opção adicional para os símbolos nem promessa de FPS no equipamento real.

O desenho geográfico local `public/media/earth-land.svg` deriva de Natural Earth 1:110m land (domínio público), com coordenadas projetadas para uma textura SVG sem requisições externas. Fonte: https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_land.geojson . Termos: https://www.naturalearthdata.com/about/terms-of-use/ . O mapa entra no cache local de instalação, sem ampliar o cache para arquivos de mídia arbitrários.

O QR renderizado codifica exatamente `https://universal.org/doar` (domínio `.org`). Seu painel branco oferece margem externa de 52 px para os módulos de 320 px; a URL fica fora do quadrado branco, no painel escuro. Decodificação independente da captura real foi conferida em PC e composição móvel. Isso confirma o conteúdo do QR, não a disponibilidade ou procedimentos de recebimento do site externo.


## Contagem e início da reunião — revisão de 16/10

A contagem usa a agenda e o ajuste existente, com horas/minutos no cabeçalho, últimos cinco minutos em composição dividida, último minuto em círculo e versículo ao atingir o horário previsto. Não troca a identidade da reunião por passar do horário durante uma pausa. Pausa/ajuste guardam a referência do encontro, compartilhada com a saída e persistida na recarga; Retomar calcula o deslocamento sem truncar milissegundos. Restaurar limpa referência e ajustes. Remover da agenda o encontro pausado exige Restaurar, sem escolher outro encontro silenciosamente. Uma pausa em zero não inicia a reunião. A abertura mantém a janela existente de 30 minutos e pode ser dispensada sem rearmar imediatamente. Pós-reunião não mostra contagem de início.

O último minuto preserva vídeo dividido e o comportamento existente de vídeo fixado em tela cheia. Blackout, passagem enviada e conteúdo oculto conservam sua prioridade. A revisão não representa teste de áudio físico. O banco no cartão de assento é um SVG próprio no padrão visual dos ícones. Batismo usa orientação após a reunião no pré e orientação direta no pós; concentração e mensagens da contagem foram encurtadas.


### Linguagem e horário previsto — ajuste após avaliação humana

A contagem indica o horário previsto, não o início real da reunião. Ao zerar mantém o versículo existente sem faixa/título anunciando que a reunião começou. O pastor pode iniciar antes ou depois; o operador continua livre para projetar outra passagem/conteúdo e usar os controles existentes de pausa/ajuste/retorno à fila. Não há detecção automática da presença ou início do pastor.

Retiradas as expressões “Prepare seu coração”, “Acolha este momento de fé”, “Vamos começar”, “Começamos em” e promessas de início “em instantes”. Cartões usam orientações diretas sobre fé, concentração e silêncio; mundo/fogo e variantes FJU perderam slogans e promessas de transformação. Despedida FJU não presume próximo sábado. Textos bíblicos, agenda e mensagens do usuário não foram alterados.


### Composição ao lado da contagem

A área do cartão mantém um palco próprio de 1920×1080, reduzido proporcionalmente dentro da coluna de 65%. O contêiner de consultas de tamanho pertence ao palco, não à coluna estreita do cronômetro. Estilos de título da contagem são limitados ao seu próprio título, sem modificar títulos/linhas/alinhamento dos cartões. A área não encolhe como item flex. Fotos/vídeos e modos de ajuste existentes são preservados.


### Luz dourada substitui Aura

O antigo portal de anéis azul/índigo foi substituído por faixas douradas difusas nas bordas, com deslocamento lento e centro escuro para leitura. A opção agora se chama Luz dourada. O identificador interno fju_aura foi preservado para manter preferências/backup e o Automático no encontro jovem. A alternativa CSS também usa faixas douradas, sem anéis. FPS, intensidade, movimento reduzido, janela oculta e descarte mantêm os controles existentes. Não há novo botão nem recurso remoto.


## Identidade FJU — controle manual e automático

Ajustes → Operação da reunião → Identidade da projeção reúne Automático, FJU ligado e FJU desligado. Automático mantém a detecção existente: encontro jovem em andamento ou próximo, na janela de quatro horas antes/90 minutos depois. FJU ligado independe da agenda; FJU desligado impede ativação automática. A escolha persiste, é validada no protocolo/configuração e acompanha Monitor, Bíblia e saída conectada. Não altera agenda, horário, conteúdo fixado ou fila. Para voltar à agenda escolha Automático.

O cabeçalho mostra a marca FJU e Encontro Jovem; versículo/contagem recebem identificação discreta fora do texto. Detalhes em azul-marinho/branco/dourado mantêm preto profundo e leitura. O modo normal conserva a identidade anterior. A marca local veio do site https://forcajovemuniversal.com/ e tem origem/direitos em public/brand/FJU-SOURCE.md. Incluída no preparo/cache para não depender de servidor externo durante o uso. Não é uma mudança de logotipo de instalação do HolyLink nem uma nova cópia dos arquivos do usuário.


## Encontro Jovem — identidade e ciclo próprios (16/10, substitui apresentação FJU anterior)

O modo FJU usa logo branca horizontal fornecida pelo operador (PNG alfa original, 1278×461, sem deformar ou colocar placa), azul/branco/marinho, tipografia forte inclinada, cortes diagonais e composições próprias. As três versões recebidas e o recurso anterior estão identificados em public/brand/FJU-SOURCE.md. O visual normal das reuniões mantém preto/dourado.

A fila FJU é própria: boas-vindas, assentos, Bíblia, primeira visita, banheiro, participação, celular, apoio, mundo/Deus e agenda real de encontros. O pós-encontro tem agradecimento próprio, apoio, participação e próximos encontros. Agenda semanal das reuniões, campanhas/propósitos, dízimos/ofertas, batismo e despedida das reuniões ficam fora, conforme autorização humana. O Instagram da igreja também não é anunciado como rede da FJU. Não há anúncios de música/esportes/dança ou horários inventados. Novos cartões permanentes: Bom ter você aqui, É sua primeira vez?, Ninguém fica de fora, Quer conversar? e Valeu pela presença, com três composições distintas.

A escolha do modo preserva cadastros, ordem e participação salvos. Conteúdo fixado que não pertence ao modo atual não é exibido nesse modo; o registro continua disponível ao retornar ao contexto correspondente. Mídias e passagens escritas pelo operador não são reescritas. A biblioteca/Monitor mostram os nomes dos cartões do encontro. Ajustes oferece boas-vindas/encerramento FJU no lugar de fixar batismo/despedida da reunião.

No modo FJU, a contagem/agenda da projeção considera apenas reuniões cadastradas com tema FJU/jovem, mantendo a detecção automática e a escolha manual existentes. Um encontro manual não herda a contagem de uma reunião normal próxima. Sem encontro cadastrado não se inventa horário. A agenda jovem mostra até três ocorrências futuras reais, incluindo datas pontuais e recorrências, sem impor sábado ou 16h.

O versículo é transparente em ambos os modos: sem imagem/gradiente opaco, placa de referência, camada de escurecimento ou desfoque próprios. Permanece sobre o fundo já escolhido; a instância do renderer do fundo é preservada ao enviar a passagem. Sombra do texto e ajuste de fonte preservam legibilidade. Monitor e rascunho usam o mesmo princípio. Fundos/partículas/globo/fogo acompanham a paleta azul no modo FJU, mantendo formas, limites de FPS/detalhe e alternativas compatíveis existentes; não é usado filtro de cor sobre o canvas inteiro.

### Agenda jovem com eventos
Em Agenda, use Agenda de FJU para incluir eventos com qualquer título (vigília, encontro ou programação especial). O cartão Próximos eventos FJU mostra as três próximas ocorrências em ordem cronológica, misturando semanal e pontual. Eventos expirados e itens marcados Igreja ficam fora. Cadastros antigos sem categoria continuam reconhecidos por FJU/Jovem/Algo a Mais; a categoria explícita prevalece. Modelos editáveis: Encontro Jovem sábado15h e Algo a Mais sexta19h. Horários já salvos não são migrados automaticamente; adicione os modelos ou edite os registros existentes conforme a programação local.

### Divulgação nas duas agendas
Agenda de oferece três destinos: FJU (somente jovem), Igreja (somente reuniões) ou FJU e reuniões (ambas). O vínculo compartilhado usa um cadastro, sem cópia. Eventos legados reconhecidos como FJU ficam exclusivos do modo jovem até escolha explícita de ambos. A filtragem também vale para contagem, Monitor, fila, cartões diários e eventos fixados. Filtros temporais e limpeza de passados respeitam o contexto atual; Todas permite consultar a base administrativa completa.

### Identidade dos projetos
O redesenho das reuniões de 16/10 foi revertido a pedido do responsável; componentes e visual anterior foram restaurados.

Nos cartões individuais de Esportes/Cultura/Mídia, a paleta acompanha a identidade do projeto no fundo, cabeçalho, efeitos, avisos e contagem. Não há filtros sobre os PNGs. Mudanças de paleta mantêm o mesmo renderer e respeitam movimento reduzido, efeitos desligados e perda de WebGL; nenhum controle adicional é necessário. Overview mantém azul FJU. Para comparar a identidade normal na prévia, use Ajustes → FJU desligado.

### Momentos preparados do Encontro Jovem
Em Sequência com FJU ligado, escolha os momentos de Música, Palavra, Gincana e Esportes após o encontro. A escolha fica salva e acompanha os dispositivos sincronizados; confira antes de cada encontro. Cada botão exibe um cartão fixado. Use Retomar sequência (ou toque no momento fixado) para voltar. Desmarcar o momento ao vivo também retoma. São cartões manuais, fora da fila automática; não reproduzem música/vídeo e não programam atividades. Blackout e limpar tela continuam tendo prioridade.

### Biblioteca durante a operação
Se o armazenamento falhar temporariamente, o operador mantém a última biblioteca carregada e oferece Tentar ler biblioteca. A falha não equivale a uma biblioteca vazia. Substituir um arquivo com o mesmo ID atualiza sua fonte local; mudar apenas nome, ordem ou som preserva a fonte para não interromper reprodução. Arquivos antigos são liberados da memória após a transição. O botão Tentar mídia novamente continua relendo a fonte quando necessário.
