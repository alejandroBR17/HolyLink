# Direção visual: preto profundo e dourado luminoso

Avaliação do usuário: o fundo estático eliminou a intenção original dos efeitos; a interface ficou pouco tecnológica/reverente e a organização da sequência era confusa. Esta entrega inicia uma nova linguagem visual sobre o fluxo existente, sem tratar todo o app como finalizado.

A camada de leitura opaca foi substituída por uma proteção de contraste translúcida. Aurora/véu/aura/partículas configuradas voltam a aparecer atrás do texto; a opção de desligar continua valendo. Preto profundo, dourado mais saturado, luz discreta nas bordas e referência em uma moldura. Paginação e dimensionamento do texto preservados. A prévia bíblica usa o efeito escolhido e o contexto FJU, com 30fps/intensidade baixa; o renderizador só existe com a prévia aberta e é descartado ao fechar. A imagem em miniatura não promete desempenho idêntico ao HDMI físico.

Sequência redesenhada: uma lista numerada, busca/filtro numa faixa única, projeção/visibilidade por item e apenas uma ação Editar ordem. Não existem mais menus separados de organizar/ordenar nem ações automáticas de agrupar/intercalar na interface. Edição usa setas em um rascunho local; salvar transmite a ordem, cancelar descarta. Uma mudança externa na sequência bloqueia aplicar a edição antiga. Slides ocultos e mídias não são removidos; editar ordem não muda inclusão/ocultação. Projetar um item da sequência limpa uma passagem bíblica manual anterior para evitar que ela encubra o slide selecionado.

Paleta do operador harmonizada com preto e dourado vivo; linguagem de console com menos cartões/menus e sem alertas decorativos em movimento. Inicialização e permissões não foram reescritas nesta etapa. Biblioteca de mídias, agenda, ajustes, conexão e segurança do pareamento seguem como trabalho posterior; esta entrega não declara renascimento completo do aplicativo.

Validação: TypeScript/build e oito testes (incluindo a janela de contexto FJU compartilhada entre prévia e projeção). QA em 320/390/430/768/1365/1920px: editar/mover/salvar/cancelar, conflito externo, projetar após Bíblia, busca bíblica real, ausência de overflow nas seis áreas. Efeito ao vivo medido em dois quadros (mudança de pixels numa área sem texto); captura visual inspecionada. Abrir/fechar prévia cria/destrói o canvas. Texto extremo cabe no quadro 1920x1080 com margens e referência, fonte ajustada a 45px. Sessões isoladas, nenhum pareamento com aparelho real, produção preservada.

Partículas 2D corrigidas para iniciar/parar ao trocar o efeito, não apenas ao montar o componente.
