# Console completo: conteúdo, profundidade e unidade visual

Continuação autorizada da prévia, após o usuário aprovar preto/dourado e rejeitar a simplificação excessiva. O objetivo desta entrega é aplicar a mesma linguagem nas demais áreas sem retirar os conteúdos e recursos que explicam a operação.

- Sequência: identificação visual por tipo de slide, descrições novamente visíveis, miniatura da imagem quando houver mídia e acesso direto para adicionar arquivo. Edição em rascunho preservada.
- Agenda: reuniões e campanhas visíveis ao entrar, em duas colunas no PC e uma no celular. Cabeçalho mostra contagens reais de reuniões semanais, eventos pontuais e campanhas. Seções independentes, sem mudar de largura ou fechar uma à força. Modelos preservados numa opção secundária. Formulários com rótulos associados.
- Ajustes: cabeçalho com estado atual de saída, cronômetro e áudio. Grupos com ícone, explicação e resumo; projeção/efeitos/tempo abertos inicialmente. Recursos existentes preservados, organizados em uma ou duas colunas conforme a tela. Corrigida a quebra dos seletores de avisos no celular pequeno.
- Conexão: instrução visual de PC/celular/conferência, papel deste aparelho e estado da sincronização. Código/QR e backup preservados; diagnóstico disponível em seção secundária. Status online não é apresentado como confirmação de telão conectado e o teste não promete “100% operacional”. Protocolo e permissões de pareamento não foram alterados.
- Monitor: moldura, hierarquia e diagnóstico harmonizados. Estilos do painel excluem a superfície de projeção em escala, para não interferir na composição dos slides.
- Bíblia: mantém o fluxo numa seção; identificação visual da tradução restaurada, sem voltar à lista de sugestões ou à edição manual.
- Instalação, diagnóstico, confirmação, atalhos e prévia de mídia: desenho compartilhado em preto/dourado, limites de altura, rolagem, foco contido, Esc e restauração de foco. Toasts com superfície escura e indicação semântica discreta. Prévia de mídia limpa o texto bíblico manual ao enviar, como o botão da sequência.
- Inicialização: preserva logo, progresso e permissões, com o acabamento da mesma identidade. Nenhum novo pedido de permissão ou animação de carregamento artificial. Pulso discreto dos emblemas respeita movimento reduzido.

Verificado com TypeScript/build e oito testes existentes. QA isolado em 320x740, 390x844, 430x932, 768x1024, 844x390, 1365x900 e 1920x1080: seis áreas, formulários de reunião/campanha abertos, grupos de ajustes/diagnóstico abertos, instalação e atalhos, foco/Esc e ausência de overflow horizontal. Em 320/390/1365: envio de mídia local, prévia, cancelamento da exclusão, cadastro e persistência de reunião e janela de hardware. Dados de avaliação somente em contextos descartáveis do navegador, sem pareamento com dispositivos e sem dados enviados a banco remoto. Capturas revistas em PC e celular.

Produção/main preservados. Mudanças visuais não substituem a etapa de segurança/ACK do pareamento ou o teste físico no HDMI e nos aparelhos reais. Sem alteração em outros projetos, dados/configurações legítimos ou imagens da marca.
