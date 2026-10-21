# Gocloserr Painel

Protótipo navegável do CRM de gestão da operação da Gocloserr, para quem aluga e para quem loca centros cirúrgicos. O site público (marketplace) é outro projeto: https://4him-technology.github.io/Go-Closerr/

> Protótipo com dados fictícios. Sem login nem backend nesta fase: a tela de entrada escolhe o perfil, e tudo fica em memória até recarregar a página.

## Telas

Os dois perfis leem a mesma lista de reservas. O que o hospital aceita aparece confirmado para o médico.

| Perfil | Tela | O que mostra |
| --- | --- | --- |
| Hospital ou clínica (locador) | Início | Previsão de faturamento do mês (faturado e a receber), agendamentos em 7 dias, solicitações aguardando aceite, ocupação, próximos agendamentos, faturamento por mês e notificações recentes |
| | Cadastro | Fotos do centro (checagem de tipo, tamanho e conteúdo, capa, legenda), informações, especialidades, equipamentos e salas (adicionar, pausar, retirar, valor por turno) |
| | Locatários | Quem reservou, quando, procedimento, porte, anestesia e o que vai precisar. Telefone e e-mail do médico só aparecem 48 horas antes da cirurgia, com contagem regressiva |
| | Notificações | Solicitações para aceitar ou recusar, contato liberado (aparece sozinha ao entrar nas 48 horas), repasses e cancelamentos |
| | Agenda | Calendário com manhã, tarde e noite: abrir e fechar turnos, o dia inteiro ou os dias úteis do mês |
| Médico (locatário) | Início | Próximas agendas e o detalhe da reserva, com o andamento (solicitação, aceite, contato compartilhado, cirurgia) |
| | Financeiro | Relatório de locações por período, pagamentos, nota fiscal de exemplo (imprimir ou salvar PDF) e exportação em planilha |
| | Fale conosco | Formulário com assunto e reserva relacionada, canais de atendimento e perguntas frequentes |
| | Cadastro | Nome, CRM e UF, CPF ou CNPJ, endereço, telefone e e-mail, com máscara e validação |

## Como rodar

Precisa de Node 20 ou mais novo.

```bash
npm install
npm run dev
```

Abre em `http://localhost:5175`.

| Comando | Para quê |
| --- | --- |
| `npm test` | Testes das regras do painel (contato em 48 horas, faturamento, notificações, agenda) e das validações |
| `npm run build` | Build em `dist/` |
| `npm run lint` | ESLint |

O workflow `.github/workflows/pages.yml` publica no GitHub Pages a cada push na `main` (em Settings > Pages, escolher "GitHub Actions").

## Stack

Vite, React 19, TypeScript, Tailwind CSS 4, Motion e Vitest. Ícones Lucide. Fotos de banco de imagens com licença livre (`docs/creditos-fotos.md`). Direção visual em `docs/design.md`: cartões brancos sobre fundo verde-gelo e barra lateral verde-noite (paleta Jade Horizon).

## Limitações do protótipo

- Hospitais, médicos, reservas e contatos são fictícios.
- A janela de 48 horas, as regras de aceite e recusa, o ISS de 5% e o modelo da nota fiscal são exemplos e precisam ser validados.
- Nenhuma mensagem, e-mail ou nota fiscal é enviada de verdade.

## Próximos passos

- Login com perfis (hospital e médico), backend e banco, com isolamento por hospital.
- Notificações por e-mail, emissão real da nota fiscal pelo hospital e repasse financeiro.
