# Feedback de saída, sequência e inicialização

## Saída e contagem

Blackout e ocultação de conteúdo têm texto Ativo/Inativo e contraste de estado na faixa de controles e em Ajustes. Aumentar e diminuir contagem têm grupos, legendas e tratamentos visuais distintos. Ícones continuam acompanhados de rótulos, sem depender só de cor.

## O conteúdo atual não pode desaparecer na paginação

A sequência limitava a lista a cinco itens no celular (oito no desktop). Se o slide atual estivesse além desse recorte ou sob um filtro, o único destaque ficava invisível. Além disso, um slide selecionado na fila não equivale à composição final quando há versículo, contagem ou blackout.

O cartão “Agora no operador” fica antes dos filtros e mostra conteúdo/posição atual, imagem quando aplicável, referência e texto do versículo, ou motivo de sobreposição. Usa a mesma seleção de versículo do renderer. “Localizar na fila” limpa filtros e abre os itens necessários, sem editar ordem nem trocar o slide. A linha visível tem contraste e EXIBINDO AGORA. O estado é do operador; não é ACK/captura física do HDMI remoto. “Ver no Monitor” abre a composição local.

A seleção de versículos agora normaliza índices de ciclos negativos, evitando referência indefinida antes da origem do carrossel, com testes de precedência e limite.

## Confirmação

O modal compartilhado recebeu a linguagem preto/dourado, variante de risco e botão Excluir para exclusões. Outras ações de risco continuam usando Confirmar. Conteúdo longo quebra e rola; botões têm área de toque, foco permanece contido, Escape/backdrop cancelam. O redesenho não remove a confirmação nem executa exclusão antecipadamente.

## O que a tela de abertura faz

Antes havia uma porcentagem avançada por pausas fixas. Havia também preparação real de imagens/vídeos, mas iniciada sem esperar a biblioteca e tentando percorrer todos os arquivos enquanto o cache descartava os mais distantes. Timeout/erro eram tratados como conclusão, permitindo texto “Tudo pronto” sem distinguir falha.

Agora a abertura espera a leitura da biblioteca local. Progresso vem de tarefas concluídas: marcas da interface e mídias dos slides atual/seguinte, quando houver. Erros/leitura indisponível viram pendência com continuação explícita. É possível entrar sem aguardar; isso não apaga arquivos. O serviço compartilha requisições em andamento, diferencia falha/sucesso e cancela preparações descartadas para impedir cache tardio após timeout/cancelamento.

Não carrega toda a biblioteca na RAM, não faz benchmark completo nessa tela, não pré-compila todos os shaders e não garante ausência de travamentos. Buffer de vídeo, codecs, armazenamento, rede, GPU/CPU e composição permanecem fatores. A contagem de tarefas mede verificação/preparação inicial, não porcentagem de bytes de vídeo totalmente carregados. O cache do serviço é limitado; a memória total e decodificação efetiva são gerenciadas pelo navegador.

## Validação

- TypeScript, build Vite e 40 testes nativos.
- Teste do preloader: deduplicação de promessa/requisição, falha não cacheada, cancelamento, escolha somente atual/seguinte e progresso por tarefa. Testes do seletor bíblico compartilhado, incluindo origem negativa.
- Navegador isolado em 320/390/768/1365: atual após paginação e busca, destaque/Blackout/ocultação, grupos de tempo, modal real de exclusão, Escape/foco e ausência de overflow. Fixtures só no IndexedDB descartável dos testes.
- Falha de imagem de marca simulada: abertura informa pendência e permite prosseguir conscientemente.
- Revisão das seis áreas em sete tamanhos; não houve ensaio com hardware da igreja ou HDMI físico.
