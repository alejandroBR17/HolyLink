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
