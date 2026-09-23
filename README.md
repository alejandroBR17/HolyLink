# 🕊️ HolyLink — Sistema Profissional de Projeção & Transmissão P2P

> **Painel de controle dinâmico, sincronização em tempo real e projeção para telões e transmissões ao vivo.**  
> Desenvolvido com foco em alta confiabilidade, arquitetura offline-first e latência zero em eventos presenciais e híbridos.

---

## 🎯 Sobre o Projeto

O **HolyLink** foi concebido para resolver os gargalos reais de projeção e cronometragem em igrejas e eventos: necessidade de servidores caros, dependência de internet instável, quedas de sinal e complexidade operacional.

Ele opera como uma aplicação web progressiva (**PWA**) de alta performance, permitindo que o operador controle slides, avisos, versículos bíblicos e mídias a partir de qualquer dispositivo (notebook, tablet ou smartphone), enquanto a janela de projeção executa no telão em tela cheia com sincronização bidirecional instantânea.

---

## 🚀 Principais Diferenciais Técnicos

### 1. Sincronização em Tempo Real Híbrida (Sem Servidor Central)
- **Local (Mesma Máquina):** Utiliza a **`BroadcastChannel API`** para comunicação entre abas/janelas com latência sub-milissegundo, ideal para computadores com múltiplos monitores.
- **Remoto P2P (Dispositivos Distintos):** Integra **WebRTC via `PeerJS`** com canais de dados encriptados ponta a ponta. Um operador com celular na congregação comanda a projeção ligada ao HDMI no altar sem necessidade de infraestrutura de nuvem intermediária.
- **Resiliência e Fallback:** Mecanismo de contingência automático baseado em `StorageEvent` e reconciliação de estado para reconexões silenciosas.

### 2. Engine Gráfica 3D com Perfil Adaptativo de Hardware
- Renderização volumétrica construída com **Three.js** e shaders de partículas dinâmicas.
- **Anti-Lag & Hardware Scaler:** Modo inteligente que monitora o framerate e oferece 3 perfis de performance:
  - **Ultra:** Partículas 3D completas a 60 FPS com ambient illumination.
  - **Balanced:** Redução de polígonos e shaders para laptops convencionais.
  - **Light (Econômico):** Fundo 2D leve ou estático a 30 FPS para hardware modesto.

### 3. Armazenamento Offline-First para Mídias Pesadas
- **IndexedDB Nativo:** Armazena vídeos (`MP4`, `WebM`) e imagens em alta definição diretamente no cliente, contornando as limitações rígidas de 5MB do `localStorage`.
- **Chunked P2P Transfer:** Envio fragmentado de blobs binários através de canais de dados WebRTC, permitindo sincronizar mídias carregadas no celular direto para a máquina do telão.
- **Media Preloader Assíncrono:** Precarregamento antecipado do próximo slide na fila de reprodução para transições sem engasgos ou tela preta.

### 4. Funcionalidades Operacionais Críticas
- **Blackout de Emergência:** Tecla rápida (`B`) para cortar a saída de vídeo imediatamente em caso de imprevistos.
- **Mídia Fixa (Manual Override):** Fixação instantânea do tema da reunião ou vídeo prioritário pausando o carrossel temporariamente.
- **Cronômetro Inteligente:** Cálculo automatizado do tempo restante até a próxima reunião/culto cadastrado, com contagem regressiva especial nos últimos 5 minutos e no minuto final.
- **Screen Wake Lock API:** Impede que o sistema operacional entre em suspensão, desligue monitores ou ative proteções de tela durante a reunião.
- **Módulo Bíblico Completo:** Busca por referências e categorias temáticas com tipografia de alto contraste para leitura à distância.

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| **Core Framework** | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| **Build & Tooling** | [Vite 6](https://vitejs.dev/) + `@tailwindcss/vite` |
| **Estilização** | [Tailwind CSS v4](https://tailwindcss.com/) |
| **Renderização 3D** | [Three.js](https://threejs.org/) |
| **Comunicação P2P** | [PeerJS](https://peerjs.com/) (WebRTC) + Native `BroadcastChannel` |
| **Animações** | [Motion](https://motion.dev/) (Framer Motion) |
| **Ícones** | [Lucide React](https://lucide.dev/) |
| **Persistência** | IndexedDB (`customMediaStorage`) + LocalStorage Reconciled State |

---

## 📁 Estrutura do Projeto

```text
├── public/                # Manifest PWA, service worker e ícones
├── scripts/               # Utilitários de otimização de imagem e automação
├── src/
│   ├── assets/            # Imagens, marcas e recursos visuais
│   ├── components/
│   │   ├── operator/      # Painéis do operador (Playlist, Agenda, Bíblia, Controles, Monitor)
│   │   ├── slides/        # Componentes individuais de projeção (Campanha, Agenda, Doações, Vídeo)
│   │   ├── ProjectionContent.tsx  # Orquestrador do layout do telão de projeção
│   │   ├── ThreeBackground3D.tsx  # Engine 3D Three.js
│   │   └── SyncSection.tsx        # Gerenciamento de pareamento P2P WebRTC
│   ├── constants/         # Logos e configurações globais
│   ├── hooks/             # Custom hooks (Projeção, Mídia, PWA, WakeLock, Atalhos)
│   ├── utils/             # Armazenamento IndexedDB, Preloader, Cálculo de Horários
│   ├── App.tsx            # Ponto de entrada e roteador mestre da aplicação
│   ├── types.ts           # Interfaces e contratos TypeScript
│   └── main.tsx           # Bootstrap da aplicação React
├── index.html             # Entrypoint com tags OpenGraph e PWA configuradas
└── package.json           # Dependências e scripts do projeto
```

---

## 💻 Como Executar Localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/) (versão 18 ou superior)
- `npm` ou `yarn`

### Passo a Passo

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/seu-usuario/holylink.git
   cd holylink
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Inicie o ambiente de desenvolvimento:**
   ```bash
   npm run dev
   ```
   Acesse `http://localhost:3000` no seu navegador.

4. **Verificação de Tipos e Qualidade (Lint):**
   ```bash
   npm run lint
   ```

5. **Build para Produção:**
   ```bash
   npm run build
   ```
   Os arquivos otimizados para deploy estarão na pasta `dist/`.

---

## ⌨️ Atalhos de Teclado no Painel de Operação

| Tecla | Ação |
|---|---|
| `B` | Ativa/Desativa o **Blackout** (Telão Preto) |
| `Espaço` | Pausa ou Retoma o Cronômetro |
| `Setas Direita / Esquerda` | Avança ou Volta o Slide na fila |
| `Esc` | Desafixa qualquer mídia manual e retorna ao loop automático |
| `F` | Alterna modo de tela cheia |

---

## 📄 Licença

Este projeto está sob a licença [Apache 2.0](LICENSE).
