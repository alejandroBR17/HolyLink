# Contribuir com HolyLink

Use Node.js 24 e instale com `npm ci`. Consulte o [README](README.md) para iniciar o projeto e o [mapa da arquitetura](docs/arquitetura.md) antes de alterar os fluxos de operação.

Faça mudanças pequenas, com nomes que expliquem a intenção. Regras de agenda, fila, autorização e validação pertencem a funções testáveis; componentes cuidam da interação e apresentação. Preserve conteúdo e dados locais durante migrações. Não registre tokens, códigos de pareamento ou arquivos pessoais em logs, testes ou commits.

Antes de abrir uma PR:

```sh
npm run lint
npm test
npm run build
npm audit
```

Descreva o problema, o comportamento resultante e a validação realizada. Informe quando um ensaio dependeu de transporte simulado ou quando não houve acesso ao equipamento físico. Testes de navegador devem usar contextos isolados e não alterar a biblioteca legítima do operador.

O código segue Apache-2.0. Não inclua marcas, fotos, músicas ou vídeos sem autorização do titular; a licença do repositório não concede direitos sobre esses materiais.
