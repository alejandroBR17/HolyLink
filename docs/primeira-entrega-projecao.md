# Primeira entrega para avaliação — 14/10/2026

Alvo confirmado: HolyLink, telão 16:9 ligado por HDMI ao PC, com operação também pelo celular. Usuário autorizou uma prévia antes de publicar. Branch feat/first-projection-preview; produção main preservada.

## Mudanças

- Versículos/avisos usam composição compartilhada de 1920×1080 na prévia e na saída: fundo discreto, texto claro, referência legível e margens. Ajuste de fonte considera comprimento e altura medida; ResizeObserver limpo ao desmontar.
- Editor separa rascunho e saída. Escolher aviso, favorito, versículo aleatório ou resultado da busca da Bíblia prepara a prévia, sem transmitir. Botões da busca indicam Preparar, não uma falsa confirmação de projeção.
- Textos longos são divididos em páginas, preferindo finais de frases. Navegar na prévia não altera a saída; Enviar esta página transmite pelos mesmos campos/protocolo existentes. Anterior/Próxima no telão enviam deliberadamente a página indicada. Unicode e tokens longos não são perdidos. Espaços/quebras repetidos são normalizados para leitura.
- Rascunho versionado fica no armazenamento local com aviso se não puder salvar; avisos salvos preservam a mesma chave IndexedDB e formatos anteriores, com verificação de leitura após salvar. Não se promete sincronização do rascunho entre aparelhos. A página enviada mantém compatibilidade com o protocolo de pareamento atual.
- Controles permanentes: blackout/restaurar, limpar/mostrar texto, slide anterior/próximo. Avançar slides encerra o texto manual e fixa o slide escolhido; blackout não é desativado por engano. Cabeçalho compacto no celular, nomes Versículo 1/2/3 e botões de projeção com nomes acessíveis.
- Monitor indica Prévia local e FPS locais medidos; saiu o texto fixo SIGNAL STABLE/LIVE. Sem fingir confirmação de entrega remota. Instrução de HDMI deixa claro posicionar a janela no telão; APIs do navegador não garantem detectar o equipamento.

## Validação

TypeScript e build passam. Três testes de paginação, preservação de conteúdo, Unicode, entradas inválidas e limites de fonte passam com Node nativo: `node --experimental-strip-types --test tests/projection-text.test.ts`.

QA do fluxo em janelas isoladas: operador 390×900/1365×900 e projeção 1920×1080; rascunho preserva saída anterior, navegação de prévia não transmite, páginas 2/3 e 3/3 chegam por comunicação local, salvar aviso/recarregar mantém rascunho, voltar ao automático, blackout, limpeza e avanço de slide. APIs de sinalização/WebSocket bloqueadas apenas no teste, sem parear equipamentos reais. Fundos 3D desativados apenas na sessão de QA para separar desenho do desempenho. Não testa HDMI físico, permissão de gerenciamento de janelas ou entrega PeerJS entre celular/PC.

Revisão React: preparação por eventos, leitura inicial preguiçosa do rascunho, nenhuma gravação durante renderização, observadores limpos, guarda de componente desmontado na leitura assíncrona, ações nomeadas e alvos >=44px no novo editor/controles. Conferência de padrões comuns de credenciais sem ocorrência nos arquivos de fonte; não equivale a auditoria completa de segurança.

## Limites e próxima etapa

Esta entrega concentra-se em versículos, avisos e controles essenciais. Agenda, doações, mídia, pareamento, instalação, atalhos, carrossel e efeitos continuam disponíveis. Ainda falta revisar o visual de todos os outros slides e proteger/validar o pareamento remoto antes de uma publicação. Status remoto/ACK não foi implementado: conferir o telão continua necessário. Ícones pesados, importação 3D, lockfile ignorado e ausência de CI permanecem registrados para a etapa técnica seguinte. Não afirmar que todo o sistema está finalizado.

Prévia Vercel somente no projeto holylink, equipe alesobralcortes-9387s-projects. Nenhuma promoção/merge em main autorizada nesta etapa.
