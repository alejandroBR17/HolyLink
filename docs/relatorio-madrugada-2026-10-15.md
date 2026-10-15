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

## Próxima rodada / pendências concretas

1. Validar formatos/limites das mensagens de um aparelho já autorizado. Ainda existem handlers legados permissivos e cópia de chaves arbitrárias no sincronismo/backup. Não declarar auditoria de segurança concluída.
2. Limitar transferências incompletas e isolá-las por conexão; buffers de chunks hoje globais. Garantir cancelamento de tarefas assíncronas após revogar conexão e não aceitar chunks com índices/tamanhos inválidos.
3. Confirmação por mensagem de comandos recebidos; não confundir com imagem física confirmada. Rever reconexões em loop constante.
4. Cache persistente da Bíblia (atual cache é apenas em memória do componente), navegação rápida sem busca repetitiva e recuperação offline das passagens já consultadas.
5. Roteiros nomeados persistidos e backup validado antes de qualquer escrita. Preservar arquivos/configurações existentes.
6. Revisão visual dos fluxos novos e consolidar relatório final às 06h50, excluindo a automação.

## Publicação e limites

Etapa restrita à branch de prévia. Não fazer merge nem promover produção. Consultar o Git/Vercel para obter o SHA/deployment desta etapa; o alias de prévia permanece o registrado acima. Atualizar este bloco na retomada após confirmar o deployment. Nenhuma credencial deve entrar neste relatório.
