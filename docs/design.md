# Direção visual do painel

Referência aprovada pelo cliente em 2026-10-21: as telas da primeira versão do painel (Início, Financeiro, Fale conosco e Cadastro do médico; Cadastro, Locatários, Notificações e o gráfico do Início do hospital). Minimalista e sofisticado: conteúdo claro em cartões brancos sobre fundo verde-gelo e barra lateral verde-noite. A tentativa de refazer tudo no molde do Airbnb (fundo branco, pílulas pretas, uma só fonte) foi rejeitada no mesmo dia; não voltar a ela.

Telas criadas ou refeitas depois disso (Entrada, topo do Início do hospital, Agenda) seguem as mesmas peças. Antes de mexer numa tela, compare com uma das aprovadas.

## Paleta (`src/index.css`)

Jade Horizon, da identidade enviada pelo cliente, mais o verde-limão da logo.

| Uso | Classe |
| --- | --- |
| Fundo do conteúdo | `bg-jade-gelo` (#eef5f1) |
| Cartões | `bg-white` com `sombra-card` (anel fino e sombra quase invisível); `hover:sombra-card-forte` só em cartão clicável |
| Texto | `text-foreground` (#0d1f19) e `text-muted-foreground` (#4f625a) |
| Verde de ação e links | `jade-escuro` (#1a5140) no botão primário, `jade-tinta` (#1f7a55) em link e texto verde sobre branco |
| Barra lateral e entrada | `FUNDO_ESCURO` (verde-noite com brilho jade suave) e `GRADE` fina com máscara, ambos em `src/components/moldura.tsx` |
| Destaque | `marca` (#a6e22e): só preenchimento (indicador do menu, contador, botão "Reservar nova sala"), sempre com texto escuro |
| Estados | confirmado em jade, aguardando em âmbar, recusado e cancelado em vermelho, sempre com ícone ou texto junto da cor |

## Tipografia

Montserrat 700 nos títulos e números (`font-heading`), Geist 400 a 600 no resto (`font-sans`).

- h1 da tela: 28px. Subtítulo em `muted-foreground`.
- Título de cartão: 16px bold.
- Números de cartão (`Kpi`): 28px, `tabular`.
- Rótulos pequenos em caixa alta com espaçamento só no menu ("Painel do hospital") e nos dias da lista de agendamentos.

## Peças (`src/components/ui.tsx`)

- `Topo`: h1, subtítulo e ações à direita.
- `Kpi`: rótulo, ícone num círculo verde-gelo, número grande e uma linha de detalhe ou link. Toda tela que abre com números usa uma fileira de `Kpi` (médico: 3; hospital: 4; agenda: 3).
- `Cartao`: bloco branco com título, ação opcional à direita e entrada animada.
- `Segmentos`: pílula branca com o item ativo em `jade-escuro` (períodos, filtros de lista).
- `Selo`, `ChipContato`, `Avatar` (iniciais em degradê jade claro), `Vazio`, `Info`, `Campo` e `CAMPO`.
- Botões: `BOTAO_PRIMARIO` (pílula verde-limão `marca` com texto `jade-noite`, pulsando devagar com `pulsante`; nos dois perfis), `BOTAO_SECUNDARIO` (pílula branca com anel), `BOTAO_PERIGO`. Toggles, abas e segmentos continuam em `jade-escuro`.

## Layout

- `MolduraCrm`: barra lateral de 272px a partir de 1024px, com logo, rótulo do painel, menu (item ativo com fundo `white/10` e traço limão à esquerda) e cartão da conta embaixo. No celular e tablet, cabeçalho verde-noite com o menu em rolagem horizontal.
- Menu lateral em escolha pelo cliente (issue #2): cinco variações além da atual (verde sólido, claro, flutuante, trilho de ícones, degradê suave), trocadas pelo seletor no rodapé do protótipo ou por `?menu=<id>` no endereço. Escolhida uma, as outras e o seletor saem.
- Faixa de aviso do protótipo e data no topo do conteúdo, largura máxima de 1240px.
- Entrada: a mesma divisão do painel, faixa verde-noite à esquerda com a mensagem e cartões brancos de perfil à direita.
- Agenda: abre na semana, com as horas das 7h às 23h, a faixa de cada turno ao fundo (aberto branco, fechado listrado, encerrado cinza) e cada cirurgia no seu horário com procedimento, médico e sala; cirurgias simultâneas em salas diferentes ficam lado a lado. No mês, cada dia mostra manhã, tarde e noite como fichas M, T e N (aberto com contorno verde, reservado cheio, aguardando âmbar claro, fechado tracejado) e um número pequeno quando o turno tem mais de uma cirurgia. O painel do dia lista as cirurgias de cada turno.
- Nada rola para o lado na largura de celular; só tabelas largas, dentro do próprio cartão.

## Motion

`src/lib/motion.ts`: entrada com opacidade, 8px e blur, mola sem quique, cartões em cascata (`atraso`). Saídas mais curtas. Valores de dinheiro do Início do hospital rolam até o número (`RollingNumber`). Animações contínuas, pedidas pelo cliente em 2026-10-22: o botão principal pulsa (halo `pulso`, parado quando desabilitado) e uma faixa de luz atravessa o menu lateral escuro na diagonal e volta (`animate-lanterna`). As duas param com `prefers-reduced-motion`.

## Gráfico

Faturado em #1f7a55 e previsto em #5cc395 (paleta conferida com a skill dataviz), com legenda, rótulo do mês atual, tooltip e tabela.
