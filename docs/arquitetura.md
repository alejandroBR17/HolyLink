# Arquitetura do HolyLink

HolyLink é uma aplicação React/TypeScript compilada pelo Vite. A composição é feita no navegador, sem servidor próprio de contas ou banco remoto. O fluxo principal é preparar avisos no operador, projetar no pré, fechar a saída para usar Holyrics separadamente e reabrir no pós.

## Mapa do código

| Local | Responsabilidade |
|---|---|
| `src/App.tsx` | Integração das abas, estado compartilhado e composição da fila |
| `src/components/operator` | Sequência, Bíblia, Agenda, Ajustes e Monitor |
| `src/components/ProjectionStage.tsx` | Preparação da saída, tela cheia e controles da apresentação |
| `src/components/ProjectionContent.tsx` | Seleção do conteúdo exibido e tratamento da mídia |
| `src/components/slides` e componentes `Fju*` | Cartões de reuniões e identidade específica dos encontros |
| `src/components/SyncSection.tsx` | Sessão PeerJS, aprovação e transporte entre aparelhos |
| `src/hooks/useProjectionState.ts` | Preferências/estado do operador e propagação de atualizações |
| `src/hooks/useProjectionWindow.ts` | Comandos locais/remotos para abrir e fechar a saída |
| `src/hooks/useCustomMedia.ts` | Biblioteca, leitura e ciclo de vida das fontes locais |
| `src/utils.ts` | Adaptador IndexedDB e utilitários legados ainda compartilhados |
| `src/utils` | Regras menores de agenda, fila, Bíblia, autorização, mídia e backup |
| `src/utils/active-queue.ts` | Participação e ordem da fila ativa, preservando blocos FJU |
| `public/sw.js` e `public/pwa*` | Cache, instalação e ícones do aplicativo |
| `tests` | Testes nativos de regras, validação e gerenciamento de recursos |

## Estado e fronteiras de confiança

Preferências ficam em localStorage; mídias e configurações também usam IndexedDB. O estado recebido de outro aparelho é validado em `shared-state.ts`. O primeiro controle remoto exige aprovação no PC; a retomada usa identidade e prova de autorização. Autorizações locais não são exportadas como parte de um backup de conteúdo.

Comandos de janela são transitórios: têm prazo de validade e deduplicação em `projection-window.ts`. Não devem voltar após recarga, restauração ou reconexão. A geometria salva é validada antes de chegar a `window.open`; números fora dos limites usam a janela padrão. Isso não descobre uma saída HDMI nem garante foco sobre o Holyrics.

Transferência de mídia usa limites e montagem por blocos. Atualizar metadados conserva a revisão dos bytes; substituir o arquivo cria uma nova revisão local e uma nova URL. Falhas de leitura não devem ser convertidas em biblioteca vazia. As URLs temporárias precisam ser liberadas ao substituir/remover uma fonte ou desmontar a aplicação.

## Regras de produto que devem continuar explícitas

- Momentos FJU escolhidos são anúncios conectados na fila automática do pré; não conduzem atividades durante o encontro.
- Projetos seguem juntos: apresentação geral, Esportes, Cultura e Mídia.
- Eventos vinculados somente à FJU não aparecem na agenda das reuniões.
- O fim da contagem não fecha a saída nem declara que a reunião começou.
- Bíblia usa o fundo atual, sem inserir uma imagem opaca por trás do versículo.
- O Monitor não deve reproduzir um segundo áudio da mídia projetada.

## Como alterar com segurança

Extraia primeiro regras puras para `src/utils` e cubra os casos de borda antes de mudar os componentes que as chamam. Mantenha validação no recebimento de dados, efeitos com limpeza e operações assíncronas canceláveis. Evite criar novas camadas apenas para mover código de lugar.

Execute `npm run lint`, `npm test`, `npm run build` e `npm audit`. Para mudanças na janela, transporte ou reprodução, complemente com ensaio em navegador. HDMI, áudio externo, permissões e foco sobre outro programa dependem de teste físico.

`App.tsx`, `SyncSection.tsx`, `PlaylistPanel.tsx` e os estilos do operador ainda concentram responsabilidades. A separação gradual dessas áreas é trabalho de manutenção, não prova de defeito. Não misture extrações grandes, redesign e mudanças de protocolo no mesmo commit.
