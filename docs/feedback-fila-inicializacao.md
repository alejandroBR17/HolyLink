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

## Refinamento após avaliação no celular

O destaque deixou a barra lateral grossa/quadrada e passou a cartão arredondado com padding próprio (grid no celular), ícone contido e selo discreto “Exibindo”. A faixa atual foi reduzida a título e ações; mantidos localizar item e abrir monitor. Não repete descrições, posição, textos explicativos e parágrafos de estado. Blackout/Limpar tela mantêm rótulos estáveis e estado somente visual (contraste, borda, ícone), com `aria-pressed` preservado. Retirados os textos Ativo/Inativo; corrigida especificidade da regra antiga que sobrescrevia o fundo dos controles essenciais.

### Permissões antes da entrada

Após a preparação real dos recursos, a abertura mostra checagem e solicitações de áudio, persistência de armazenamento e tela acesa. O usuário entra pelo botão final ou pode pular a preparação enquanto ela ocorre. Os métodos antigos existiam, mas o caminho executado da abertura saltava a etapa de permissões. Ela agora faz parte explícita do fluxo.

Cada solicitação é iniciada por toque e atualiza o estado verificado. Áudio usa um contexto compartilhado e confere estado `running`; falha não vira concedido. Persistência é proteção opcional contra limpeza e não equivale ao funcionamento básico do IndexedDB. Tela acesa é concedida somente quando existe solicitação ativa, não pela simples presença da API. Erro/ausência/timeout são informados, sem bloquear a entrada permanentemente. Notificações de sistema não são pedidas sem uma função que as utilize; abertura de segunda tela é conferida pela ação real de abrir a janela.

A checagem vale para aparelho/aba em uso, não concede acesso ao PC remotamente, não testa HDMI físico nem garante autoplay em outra janela. O fluxo orienta conferir áudio/pop-ups na segunda tela.

### Apenas permissões pendentes e resultado da proteção local

A lista omite recursos já concedidos e desaparece quando não há pendências. A solicitação de proteção local mostra “Solicitando…” e verifica o estado efetivo após a resposta. Recusa, exceção ou timeout deixam explicação junto ao recurso, sem repetir um botão “Permitir” que aparentava não fazer nada. A recusa é lembrada apenas nesta sessão; reconsultar verifica o estado real, sem insistir automaticamente. Entrar continua disponível durante a solicitação opcional.

Persistência não é permissão para ler/gravar a biblioteca: é proteção extra contra remoção automática. Chrome pode decidir silenciosamente, sem janela; não podemos forçar concessão. A interface distingue isso do armazenamento comum e não promete recuperar arquivos já removidos. Referência: [Persistent storage — web.dev](https://web.dev/articles/persistent-storage).

Validação desta correção: TypeScript/build e 40 testes nativos aprovados; navegador em 320/390/768/1365 px com concessão e recusa simuladas; casos adicionais de exceção, timeout, todas concedidas, reconsulta após recusa e entrada sem bloqueio. Nenhuma concessão simulada foi usada como evidência do aparelho físico.

Validação atual: 40 testes nativos, TypeScript/build, revisão das seis áreas em sete tamanhos e teste dedicado em 320/390/768/1365: solicitações e estados por APIs simuladas, recusa/ausência sem falso sucesso, continuação disponível, faixa atual compacta, ícone dentro do padding e contraste visual dos controles com rótulos estáveis. Capturas foram inspecionadas; não foi um ensaio no celular físico do responsável.

## Revisão funcional da Sequência

Filtros Ativos/Ocultos e estado de cada linha agora seguem a fila efetiva: arquivos com `enabledInLoop=false` também estão fora dela, mesmo sem constar em `disabledSlides`. Ativar uma mídia grava sua participação e retira o bloqueio anterior quando existente; ocultar preserva o arquivo e o retira apenas do ciclo. Há bloqueio de cliques concorrentes enquanto essa gravação acontece e erro explícito se falhar.

Projetar pela lista da fila, biblioteca em lista/galeria ou prévia ampliada limpa o versículo manual anterior de forma consistente. Retomar também remove a passagem sobreposta e o slide fixado. Blackout e ocultação de conteúdo continuam sob seus controles próprios; projetar uma mídia não os desliga silenciosamente. O status da fila identifica uma passagem bíblica sobreposta.

Setas da biblioteca usam a posição na coleção completa, não o índice dos resultados de busca. A galeria deixou de esconder ações sob hover e de sobrepô-las aos selos da miniatura; no celular pequeno isso impedia tocar em Projetar. Ações de prévia/projeção ficam abaixo da imagem com 44 px e rótulos acessíveis; grade usa uma coluna nas telas estreitas.

Ensaios em quatro larguras com IndexedDB descartável: mídia com ambos os bloqueios, ativar/ocultar e filtros, mover sob busca, substituir passagem pelos três caminhos de biblioteca, retomar, cancelar edição e salvar/reabrir ordem. TypeScript/build e 40 testes nativos; revisão geral das seis áreas em sete viewports. Sem dados reais, pareamento físico ou HDMI. A aba Bíblia é a próxima frente; sua revisão funcional completa não está incluída nesta etapa.

## Permissões sem confirmação repetida

O botão antes identificado apenas por ícone agora diz Verificar; só gira e informa Verificando durante uma consulta. O componente compartilhado fica na abertura e em Ajustes → Desempenho e energia → Acessos deste aparelho.

Na abertura, áudio e tela acesa não exigem confirmações separadas: a entrada por gesto solicita a sessão atual, sem salvar concessões falsas. A proteção persistente concedida continua verificada pelo navegador. A recusa passa a ser lembrada neste navegador para não repetir o pedido após recarga; pode ser solicitada novamente em Ajustes. Se o navegador conceder posteriormente, a consulta real reconhece isso. Se uma concessão anterior for perdida, volta a ser oferecida. Esta regra substitui o tratamento anterior de recusa somente em memória da sessão.

APIs indisponíveis/negadas continuam descritas em Ajustes, sem bloquear a entrada. A decisão salva é apenas preferência do fluxo, não substitui `persisted()` nem garante proteção ao limpar os dados do site. Ajustes mostra somente recursos não concedidos; quando todos estão disponíveis, informa o resultado da checagem.
