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
