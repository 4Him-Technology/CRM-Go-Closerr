# Gocloserr Painel (CRM) - regras do projeto

Valem para qualquer pessoa ou agente, de qualquer modelo. Visão do produto e telas no [README](README.md).

Este repositório é só o painel de gestão da operação. O site público da Gocloserr (marketplace) é outro repositório e não deve ser alterado a partir daqui; o painel apenas aponta para ele pelo endereço público (`SITE` em `src/data/crm.ts`).

## Fluxo de trabalho

- Toda tarefa (correção, melhoria ou função nova) tem uma issue no GitHub antes de começar.
- Nada vai direto para a `main` depois do commit inicial. Cada tarefa tem uma branch (`feat/...`, `fix/...`, `chore/...`) e um PR que menciona a issue (`Closes #N`).
- Commits em Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`).
- TDD: o teste vem antes da implementação. `npm test` precisa passar.
- Todo deploy tem plano de rollback escrito no PR.
- Pendente: Commitlint com Husky, CI (tipos, testes, auditoria de dependências) e review automático de PR bloqueando merge em falha crítica.

## Convenções

- Código, nomes, textos e commits em português do Brasil. Nunca usar travessão (U+2014): use hífen.
- Marca: "Gocloserr" (dois "r"), logo em `public/marca.png` (manter). Visual definido em [docs/design.md](docs/design.md) e aprovado pelo cliente em 2026-10-21: cartões brancos sobre fundo verde-gelo, barra lateral verde-noite (paleta Jade Horizon), Montserrat nos títulos e Geist no texto. A versão no molde do Airbnb (branco, pílulas pretas, só Geist) foi rejeitada: não voltar a ela. Antes de criar ou mudar uma tela, ler docs/design.md, comparar com uma tela aprovada e usar as peças de `src/components/ui.tsx`.
- Datas e nomes: nada de `capitalize` em datas pt-BR (use `first-letter:uppercase`) e nada de `toLowerCase()` em nomes de procedimento ou listas (estraga siglas).
- Motion: entradas com opacidade, deslocamento curto e blur, mola sem quique (`src/lib/motion.ts`); saídas mais discretas que as entradas; só `transform`, `opacity` e `filter`; sempre respeitar `prefers-reduced-motion` (`MotionConfig reducedMotion="user"`).
- Gráficos: seguir a skill dataviz (paleta validada, legenda, tooltip e tabela).
- Acessibilidade: label em todo campo, alt em toda imagem com conteúdo, navegação por teclado, foco visível, cor nunca sozinha para indicar estado.
- Fotos: só de bancos com licença livre para uso comercial, registradas em `docs/creditos-fotos.md`.
- Dados pessoais: protótipo só com dados fictícios. Nenhum segredo no repositório nem no front-end.

## Arquitetura

- `src/App.tsx`: rotas por hash (`#hospital/...`, `#medico/...`; vazio é a entrada) e as telas.
- `src/pages`: entrada, 5 telas do hospital e 4 do médico. `src/components`: moldura (menu e topo), gráfico de faturamento, solicitação, notificação e peças de UI.
- `src/lib/crm.ts`: regras (contato em 48 h, faturamento, notificações, agenda), testadas em `crm.test.ts`. Regra central: o contato do médico só aparece para o hospital 48 horas antes da cirurgia (`JANELA_CONTATO`).
- `src/lib/crm-estado.tsx`: estado em memória (reservas, agenda, cadastro, notificações lidas).
- `src/lib/validacao.ts`: CPF, CNPJ, CEP, máscaras e regras de formulário, com testes. `src/lib/formulario.ts`: hook de formulário.
- `src/data/crm.ts` e `src/data/espacos.ts`: dados fictícios gerados com semente a partir de hoje.
