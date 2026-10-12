# HolyLink

Aplicação web para controlar projeções, slides e mídias em eventos. Inclui comunicação entre janelas e pareamento entre dispositivos, além de recursos locais de armazenamento.

[Versão publicada](https://holylink.vercel.app/)

## Recursos e implementação

- Interface de operação e janela de projeção.
- Comunicação local com BroadcastChannel e sincronização remota com PeerJS/WebRTC.
- Armazenamento de mídias em IndexedDB e preferências no navegador.
- Recursos de apresentação, temporização, tela cheia e efeitos visuais com Three.js.

O comportamento depende do navegador, da rede e do equipamento. A conexão entre dispositivos pode depender de serviços de sinalização e da configuração de rede; P2P não significa ausência de infraestrutura. Não foram publicados benchmarks que comprovem latência submilissegundo, taxa fixa de quadros ou funcionamento sem falhas.

Wake Lock é um pedido ao navegador para manter a tela ativa quando suportado; não impede todas as formas de suspensão do sistema. Armazenamento local pode ser removido pelo usuário ou pelo navegador. Verifique o funcionamento no equipamento do evento antes de usá-lo.

## Execução local

Use Node.js compatível com Vite e os plugins, como Node.js 24.

```sh
git clone https://github.com/alejandroBR17/HolyLink.git
cd HolyLink
npm install
npm run dev
```

Abra `http://localhost:3000`. Para verificar tipos e gerar a interface:

```sh
npm run lint
npm run build
```

O script `lint` executa TypeScript. O repositório não oferece atualmente um comando `npm test` nem um CI que comprove a entrega entre dispositivos; esses fluxos exigem verificação nos aparelhos.

## Decisões e participação

Projeto pessoal de Alejandro Cortes, desenvolvido com assistência de IA. A proposta reúne controle e projeção em uma interface web, usando APIs do navegador para comunicação e armazenamento. O código organiza telas, hooks e utilitários em `src`; a separação facilita revisar sincronização, mídia e apresentação de forma independente.

A implementação documenta recursos existentes, sem apresentar metas de desempenho como resultados medidos. Mídias e textos exibidos devem respeitar os direitos de seus titulares.

## Licença

Consulte [LICENSE](LICENSE) para o código e as condições próprias das dependências e mídias.
