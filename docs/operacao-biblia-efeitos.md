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
