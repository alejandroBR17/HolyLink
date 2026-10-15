# HolyLink — revisão autônoma de 15/10/2026

## Autorização e limites

Trabalho autorizado pelo responsável na noite de 14/10, enquanto dorme. Somente HolyLink, branch `feat/first-projection-preview`, draft PR #1. Produção e `main` preservadas. Não apagar configurações/mídias legítimas. Não modificar Delivovo.

Retomadas agendadas: 00h50, 01h50, 02h50, 03h50, 04h50, 05h50 e 06h50 de 15/10, America/Sao_Paulo. Automação `holylink-revis-o-aut-noma-da-madrugada`. Encerrar/excluir ao fim da última rodada, às 07h ou quando o usuário voltar. Dependem de computador/app disponíveis e cota compartilhada; não contornam limites. Renovação da janela indicada pelo usuário: 04h41; limite semanal continua independente. Nenhum crédito de reset autorizado.

## Estado inicial

- HEAD: `2240235f036d5cc0924d4dfc687a31f1453a7c63`; árvore limpa.
- `origin/main`: `fc8e5e19c5324310c950918834ef90226f04753e`.
- Preview vigente: branch alias `holylink-git-feat-first-p-a549d7-alesobralcortes-9387s-projects.vercel.app` (deployment `dpl_9SU5Gs9mCu9Z9BuThdVRnP1aHHEu`). Acesso privado no arquivo fora do repositório `../data/holylink-first-preview/access.private.json`.
- Produção: `holylink.vercel.app`, deployment `dpl_HP5ZpF3HuonTDoFfYVzKx2zp6cgi`.

## Ordem de trabalho

1. Segurança do pareamento: aprovação explícita no PC, bloqueio antes de aprovação, revogação, códigos criptográficos e evitar sobrescrita automática do PC pelo celular.
2. Validar mensagens recebidas, chaves e transferências; confirmar recebimento dos comandos sem prometer HDMI confirmado.
3. Bíblia com navegação rápida/cache persistente e falhas recuperáveis.
4. Roteiros salvos e recuperação/backup com validação antes de escrever dados.
5. Operação e revisão responsiva dos fluxos alterados, preservando preto/dourado, conteúdo e efeitos.

## Rodada inicial — pareamento seguro

Mudanças (commit desta etapa: `fix: require explicit PC approval before remote control`):

- Códigos gerados por `crypto.getRandomValues`, sem caracteres visualmente ambíguos; não reutiliza código permanente de sessões anteriores. Validade de 10 minutos para novas solicitações.
- Cada conexão exige aprovação própria no PC, comparando um código de confirmação exibido também no celular. Solicitação expira em 60 segundos. Conexões lembradas precisam de nova aprovação ao reconectar.
- Dialog de aprovação acessível com foco/Escape, inclusive quando a aba Conexão está oculta. Recusa fecha o transporte. Mensagens e registro global bloqueados antes da aprovação, nos dois sentidos.
- Encerrar a conexão remove a autorização. Botão para renovar o código também desconecta celulares. Desconexão explícita esquece o último pareamento e cancela reconexão agendada.
- Conectar não copia agenda/configurações/mídias automaticamente em nenhuma direção. Isso evita excluir arquivos legítimos do outro aparelho por diferenças entre bibliotecas. Receber/enviar é uma ação separada, com confirmação de substituição e indicação de backup.
- Celular novo inicia como controle; não se anuncia equivocadamente como PC. Papel salvo prevalece sobre largura da janela.
- Mensagens deixam claro que conexão autorizada não comprova imagem física no HDMI. Corrigido estado de carregamento que ficava preso após copiar um manifesto sem mídias faltantes.

Validação:

- `npm run lint`: aprovado.
- `npm run build`: aprovado.
- `node --experimental-strip-types --test tests/*.test.ts`: 14 testes aprovados, incluindo 3 de sessão/códigos.
- `../data/verify-holy-pairing.cjs`: aprovado no Edge headless com PeerJS simulado, contextos descartáveis. PC em 320/390/1365 px e 844×390 em paisagem: comandos/manifesto/exclusão bloqueados antes da aprovação; foco e aprovação na aba oculta; autorização isolada por transporte, revogação, recusa e código expirado. Celular: desafio errado rejeitado, nenhum envio automático de dados, cancelamento do envio, recebimento explícito e desconexão.
- `../data/verify-holy-full-console.cjs`: seis áreas, formulários, disclosures, atalhos/instalação com foco/Escape e ausência de overflow em 320×740, 390×844, 430×932, 768×1024, 844×390, 1365×900 e 1920×1080.
- Capturas de aprovação: `../data/holylink-pairing/approval-{320,390,844,1365}.png` (fora do repositório).
- Teste usa transporte simulado e não comprova WebRTC em redes reais, conexão física HDMI ou aprovação em aparelhos reais.

## Segunda etapa — comandos e configurações recebidos

Commit da etapa anterior: `cd45e7ca4b9bfe9af4aecf5ee82b06db51a81300`. Preview anterior confirmado READY: `dpl_HbRebSdmz66Px7yUtTpZBnoGtb5T`, no alias da branch. Produção continuou em `dpl_HP5ZpF3HuonTDoFfYVzKx2zp6cgi`.

- Contrato explícito de estados compartilháveis, com tipos, enumerações, limites de tamanho e estruturas de agenda/campanha/listas. Chaves de identidade e propriedades desconhecidas não são comandos válidos.
- Validação antes de aplicar `UPDATE_STATE` no receptor, no celular e no listener compartilhado entre janelas. Texto e referência nulos continuam válidos para limpar uma passagem; valores numéricos inválidos deixam de poder provocar erro em `volume.toString()`.
- Configurações recebidas por sincronismo e restauração são analisadas por completo antes do primeiro `localStorage.setItem`: uma configuração conhecida inválida rejeita o conjunto, sem aplicar parcialmente os campos anteriores. Chaves de outros apps e de identidade são ignoradas. Sinais de ciclo de vida da janela não são restaurados por backup/cópia.
- Manifestos enviados contêm somente configurações compartilháveis, preservando preferências locais de desempenho e identidade de cada dispositivo.
- Corrigida atualização visual de `tickerText` recebida remotamente: antes era persistida sem atualizar o estado React.
- Isso não conclui validação do arquivo inteiro de backup nem da mídia: ainda é preciso validar todos os itens antes de qualquer escrita, além de limitar chunks e cancelar tarefas revogadas.

Validação desta etapa:

- `npm run lint` e `npm run build`: aprovados.
- 18 testes nativos aprovados (4 novos de contrato de estado).
- Teste de pareamento ampliado: além das provas anteriores, um aparelho autorizado não altera identidade, não injeta chave externa, volume nulo, enum inválido ou lista/agenda malformada. Um conjunto de configurações inválido não escreve os campos válidos anteriores. Letreiro remoto é conferido no DOM do Monitor.
- `../data/verify-holy-unified.cjs`: busca, seleção, projeção, paginação, histórico, falha de busca, comunicação entre janelas e ausência de overflow aprovados em 320/390/430/1365 px. API de Bíblia simulada nesse teste.
- Primeira etapa também validada online na prévia em 390 e 1365 px, seis áreas, formulários, foco/Escape e ausência de overflow.

## Próxima rodada / pendências concretas

1. Continuar validação dos envelopes/mídias e do arquivo inteiro de backup. Estados/configurações já têm contrato explícito; não repetir essa etapa sem uma falha concreta. Não declarar auditoria de segurança concluída.
2. Limitar transferências incompletas e isolá-las por conexão; buffers de chunks hoje globais. Garantir cancelamento de tarefas assíncronas após revogar conexão e não aceitar chunks com índices/tamanhos inválidos.
3. Confirmação por mensagem de comandos recebidos; não confundir com imagem física confirmada. Rever reconexões em loop constante.
4. Cache persistente da Bíblia (atual cache é apenas em memória do componente), navegação rápida sem busca repetitiva e recuperação offline das passagens já consultadas.
5. Roteiros nomeados persistidos e backup validado antes de qualquer escrita. Preservar arquivos/configurações existentes. Conferir também cópia de configurações padrão não persistidas: manifesto atual envia somente as chaves salvas, então defaults ausentes não substituem uma customização antiga no destino. Definir cópia/mescla claramente antes de alterar a regra.
6. Revisão visual dos fluxos novos e consolidar relatório final às 06h50, excluindo a automação.

## Publicação e checkpoint às 00h12

- Código atual publicado na prévia: `d47d1679249b534e95deea764e8e445054779df4` (`fix: validate shared projection state before applying remote data`).
- Preview READY: `dpl_sPqQKBPr4skEAjVwPYyZaPeHRFZh`. Alias: `https://holylink-git-feat-first-p-a549d7-alesobralcortes-9387s-projects.vercel.app/`.
- Acesso de teste já preparado fora do repositório: `../data/holylink-overnight-access.private.json`. Não publicar seu conteúdo. O alias continua protegido; não alterar proteção.
- Conferência online da segunda etapa aprovada nas seis áreas em 390×844 e 1365×900, formulários, foco/Escape e ausência de overflow.
- Produção conferida e preservada em `dpl_HP5ZpF3HuonTDoFfYVzKx2zp6cgi`. Nenhum merge/promote realizado.
- Draft PR #1 atualizada até o código `d47d167`; continua rascunho.
- Servidor local 3012 encerrado após os testes. Bibliotecas/configurações dos testes são descartáveis e não usam o perfil real do usuário.
- Este checkpoint documental ficará em commit local para ser incluído junto da próxima etapa no próximo push, evitando outra implantação só para documentação. Nenhuma alteração de código pendente. A próxima rodada deve começar pelas transferências/mídias e backup, conforme a lista acima, sem repetir o que já passou.

Retomadas continuam às 00h50–06h50, incluindo 04h50 após a renovação prevista para 04h41. Não consumir créditos de reset. Novo contexto automático do ambiente não é retorno humano; mensagens humanas de pausa/retorno prevalecem. Finalizar/excluir automação na rodada final.
