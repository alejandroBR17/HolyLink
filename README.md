# HolyLink

Operador web para a projeção de avisos, Bíblia, agenda e mídias antes e depois de reuniões e encontros. O PC envia a composição 16:9 ao telão; um celular autorizado pode controlar a operação por PeerJS/WebRTC.

[Versão publicada](https://holylink.vercel.app/) · [Guia de operação](docs/operacao-biblia-efeitos.md) · [Conexão e backup](docs/sincronizacao-celular-pc.md)

A reformulação foi integrada na [PR #1](https://github.com/alejandroBR17/HolyLink/pull/1) e publicada. O teste físico de som, HDMI e foco sobre o Holyrics permanece separado dos testes automatizados.

## Fluxo de uso

1. No PC, prepare a segunda tela e mova a janela para a saída desejada. Conecte o celular na aba Conexão e aprove o primeiro acesso no PC.
2. Antes, use Pré-reunião ou Pré-encontro. No modo FJU, escolha os momentos que serão anunciados; eles passam juntos na fila automática. Projetos e eventos usam as escolhas e a agenda salvas.
3. Durante, feche somente a janela de projeção do HolyLink para usar o Holyrics separadamente. O fim da contagem não fecha a janela nem afirma que a reunião começou.
4. Depois, selecione Pós-reunião/Pós-encontro e reabra a saída. Celular autorizado pode solicitar abertura e fechamento ao PC, com confirmação ou indicação de bloqueio.

Pop-ups precisam estar permitidos no PC. A primeira preparação, tela cheia, áudio e foco sobre outro programa podem exigir uma ação no computador. Reabrir tenta recuperar a posição anterior; o navegador não garante descoberta de HDMI nem controle nativo do Holyrics.

## Recursos

- Sequência com conteúdo atual, fixação, participação, ordem e biblioteca de mídias.
- Bíblia com livros/capítulos, intervalos, rascunho, histórico, paginação e cache local limitado.
- Agenda semanal/pontual com vínculos independentes Igreja/FJU/ambos.
- Ajustes de operação, efeitos e desempenho; Monitor com prévia silenciosa e diagnóstico.
- Pareamento com aprovação no PC, retomada entre aparelhos lembrados e revogação de acesso.
- Transferência de mídias por blocos, comparação de conteúdo e preservação de arquivos exclusivos.
- Backup validado antes de aplicar; armazenamento local em IndexedDB e preferências no navegador.
- Instalação PWA, ícones locais, cache do aplicativo e atualização por ação explícita.
- Vídeo com tratamento de áudio bloqueado, falha, tentativa de recuperação e leitura inicial de metadados limitada a 12 segundos.

## Executar e verificar

Use Node.js 24 (também indicado em `.nvmrc`) e npm. Não são exigidas chaves de IA nem credenciais de backend.

```sh
git clone https://github.com/alejandroBR17/HolyLink.git
cd HolyLink
npm ci
npm run dev
```

Abra `http://localhost:3000`. Verificações:

```sh
npm run lint
npm test
npm run build
npm audit
```

`lint` verifica os tipos TypeScript. Os testes nativos cobrem regras de agenda/contagem/fila, validação de comandos, Bíblia, mídia, autorização, backup e PWA. O workflow `Verificar HolyLink` executa instalação pelo lockfile, auditoria, tipos, testes e build nas PRs e em main; não publica nem usa credenciais de produção.

Ensaios de navegador e limites da validação estão no [relatório de desenvolvimento](docs/relatorio-madrugada-2026-10-15.md). Testes automatizados não comprovam HDMI, som externo, foco do Windows/Holyrics ou instalação em todos os aparelhos.

## Dados e limites

Os dados ficam neste navegador/aparelho; apagar o armazenamento pode removê-los. Exporte backup e preserve os arquivos originais. P2P ainda depende de sinalização e condições de rede. Wake Lock é uma solicitação ao navegador, não uma garantia contra toda suspensão do sistema.

Transferência remota e backup JSON têm limites explícitos de tamanho; consulte o guia antes de bibliotecas grandes. A ausência de um arquivo no celular não manda apagá-lo no PC. Exclusão remota exige conexão e confirmação; não é um diário de exclusões para aparelhos offline.

## Projeto e licença

Projeto de Alejandro Cortes, desenvolvido com assistência de IA. Código em `src`, verificações em `tests` e documentação em `docs`. Consulte o [mapa da arquitetura](docs/arquitetura.md) e o [guia de contribuição](CONTRIBUTING.md) para entender as responsabilidades e preparar alterações.

O código segue a [licença Apache-2.0](LICENSE). Logotipos, marcas, versículos e mídias mantêm os direitos e condições dos seus respectivos titulares; a licença do código não concede direitos sobre esses materiais.
