# Conferência de entrega — HolyLink — 16/10/2026

## Estado

Candidata à entrega técnica em Preview. A publicação definitiva ainda não foi executada. O responsável adiou o teste no equipamento físico; essa pendência continua explícita e não equivale a uma falha confirmada do código.

## Correção de envio de vídeos

- Leitura de metadados limitada a 12 segundos; timeout não deixa o envio preso.
- Vídeo vazio, corrompido ou sem duração válida informa erro e não entra na fila com duração presumida.
- Sucesso, erro, timeout e cancelamento liberam a URL temporária e o decodificador.
- Sair da aplicação cancela a leitura; sinais tardios não salvam o arquivo nem atualizam a interface desmontada.
- Campo de arquivo é limpo para permitir nova tentativa; trava imediata evita envios concorrentes pelo mesmo controle.

## Verificações

| Área | Evidência |
|---|---|
| Tipos e compilação | TypeScript e build Vite |
| Regras e proteção de dados | 107 testes nativos: Bíblia, agenda, contagem, fila, autorização, transporte, backup, PWA e mídias |
| Envio de vídeo | Navegador com espera sem evento, arquivo corrompido, nova tentativa, WebM real válido e cancelamento ao desmontar |
| Fluxo pré/pós | Anúncios escolhidos automáticos e conectados no pré; fora do pós; escolha preservada em recarga |
| Janela pelo celular | Dois contextos com transporte controlado e aprovação: abrir, fechar por Ajustes, reabrir já preparada, mensagens e bloqueios |
| Reprodução e recuperação | WebM real, fim natural, watchdog, fonte sem reiniciar ao alterar volume, áudio bloqueado/liberado e recuperação de imagem/vídeo |
| Dependências | npm audit não reportou vulnerabilidades conhecidas na conferência; lockfile passa a ser versionado |
| Credenciais | Nenhum padrão comum de chave/token privado encontrado nos arquivos de texto rastreados; URLs de registro no lockfile sem credenciais/query |
| Repositório | README e exemplo de ambiente corrigidos; npm test e workflow de verificação adicionados |

A conferência de padrões não é garantia de ausência de todo segredo, e auditoria de dependências não é prova de segurança absoluta. Os ensaios de navegador não confirmam HDMI, caixas de som, foco do Windows/Holyrics ou permissões de cada aparelho.

O workflow instala pelo lockfile e executa auditoria, tipos, testes e build com Node 24. Usa permissões de leitura, ações fixadas por SHA e não publica. O resultado efetivo da primeira execução remota e a prévia desta rodada estão no fechamento do relatório de desenvolvimento.

## Conclusão e próxima decisão

Não foi identificada nesta revisão necessidade de outro redesign ou funcionalidade obrigatória para o fluxo confirmado. A correção técnica pendente do upload está resolvida. A revisão final fica condicionada ao build/deploy/CI da rodada passarem; seus resultados são registrados no relatório.

O próximo passo operacional é testar no PC da igreja: preparar uma vez, fechar HolyLink pelo celular, operar Holyrics, selecionar o pós e reabrir HolyLink, conferindo posição, tela cheia e som. Se esse teste continuar adiado, a entrega técnica pode ser encerrada com essa limitação documentada, sem chamá-la de validação física completa. Produção depende de autorização posterior; a PR segue em rascunho.

## Fechamento confirmado

Código af66319fea97e22c94e40ee8375d8a653f305442. Preview READY dpl_EYGTs3Ar9TnnJk48ZboqF1yVwqox, alias confirmado. CI Verificar HolyLink #1 aprovado integralmente em instalação limpa no GitHub: https://github.com/alejandroBR17/HolyLink/actions/runs/38990652719 . Upload e controle da janela também passaram na versão online. Não foi encontrado outro bloqueador de código nesta revisão. Entrega técnica pronta para avaliação final/publicação autorizada, mantendo a pendência física declarada acima. Produção/main preservadas.
