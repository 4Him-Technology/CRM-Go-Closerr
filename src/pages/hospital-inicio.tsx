import { AnimatePresence } from "motion/react"
import { ArrowRight, CalendarCheck, CalendarDays, Hourglass, Inbox, TrendingUp, Wallet } from "lucide-react"
import { GraficoFaturamento } from "@/components/grafico-faturamento"
import { CartaoSolicitacao, ItemNotificacao, rotuloDia } from "@/components/reserva"
import { Avatar, BOTAO_SECUNDARIO, Cartao, ChipContato, Kpi, Vazio } from "@/components/ui"
import { RollingNumber } from "@/components/rolling-number"
import { MEDICO } from "@/data/crm"
import { MESES_L, reais } from "@/data/espacos"
import { futura, hora, inicioDe, ocupacao, resumoFinanceiro, serieMensal } from "@/lib/crm"
import { useCrm } from "@/lib/crm-estado"

const saudacao = (d: Date) => (d.getHours() < 12 ? "Bom dia" : d.getHours() < 18 ? "Boa tarde" : "Boa noite")

export function HospitalInicio() {
  const { agora, doHospital, disp, centro, notificacoes, lidas, marcarLidas, setFoco } = useCrm()
  const fin = resumoFinanceiro(doHospital, agora)
  const serie = serieMensal(doHospital, agora)
  const ocup = ocupacao(doHospital, disp, agora)
  const em7 = +agora + 7 * 864e5
  const comecoHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate())
  const proximas = doHospital.filter((r) => r.status === "confirmada" && inicioDe(r) >= comecoHoje && +inicioDe(r) <= em7)
  const pendentes = doHospital.filter((r) => r.status === "pendente" && futura(r, agora))
  const dias = [...new Set(proximas.map((r) => r.data))]
  const mes = MESES_L[agora.getMonth()]
  const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0).getDate()

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 tabIndex={-1} data-foco-proprio className="text-2xl font-bold md:text-[28px]">
            {saudacao(agora)}, {centro.nome}
          </h1>
          <p className="mt-1 text-muted-foreground">Agenda dos próximos dias, solicitações para responder e o faturamento das locações.</p>
        </div>
        <a href="#hospital/agenda" className={BOTAO_SECUNDARIO}>
          <CalendarDays aria-hidden /> Abrir agenda
        </a>
      </div>

      {/* mesmos cartões de número das telas do médico: faturado e previsão primeiro, depois a operação */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi i={0} icone={Wallet} rotulo={`Faturado em ${mes}`} valor={<RollingNumber value={fin.faturado} format={(v) => reais(Math.round(v))} />} detalhe="Locações já realizadas" />
        <Kpi
          i={1}
          icone={TrendingUp}
          rotulo={`Previsão de ${mes}`}
          valor={<RollingNumber value={fin.previsto} format={(v) => reais(Math.round(v))} />}
          detalhe={`${reais(fin.aReceberMes)} a receber até ${fimMes}/${String(agora.getMonth() + 1).padStart(2, "0")}`}
        />
        <Kpi i={2} icone={CalendarCheck} rotulo="Cirurgias em 7 dias" valor={proximas.length} detalhe={`${dias.length} ${dias.length === 1 ? "dia" : "dias"} com cirurgia`} />
        <Kpi i={3} icone={Hourglass} rotulo="Aguardando aceite" valor={pendentes.length} detalhe={<a href="#hospital/notificacoes" className="font-semibold text-jade-tinta hover:underline">Responder solicitações</a>} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Cartao
          i={4}
          className="xl:col-span-2"
          titulo="Próximos agendamentos"
          acao={
            <a href="#hospital/locatarios" className="inline-flex items-center gap-1 text-sm font-semibold text-jade-tinta hover:underline">
              Ver locatários <ArrowRight className="size-4" aria-hidden />
            </a>
          }
        >
          {dias.length === 0 ? (
            <Vazio icone={CalendarDays} titulo="Nenhuma cirurgia nos próximos 7 dias" texto="Abra mais turnos na agenda para receber reservas." />
          ) : (
            <div className="flex flex-col gap-5">
              {dias.map((k) => (
                <div key={k}>
                  <h3 className="mb-2 text-xs font-bold tracking-[0.12em] text-muted-foreground uppercase">{rotuloDia(k)}</h3>
                  <ul className="flex flex-col gap-1">
                    {proximas
                      .filter((r) => r.data === k)
                      .map((r) => (
                        <li key={r.id}>
                          <a href="#hospital/locatarios" onClick={() => setFoco(r.id)} className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl p-3 ring-1 ring-border transition-colors hover:bg-jade-gelo">
                            <span className="w-24 shrink-0 text-sm">
                              <span className="block font-semibold tabular">{hora(r.inicio)}</span>
                              <span className="block text-muted-foreground">até {hora(r.fim)}</span>
                            </span>
                            <span className="flex min-w-0 flex-1 items-center gap-3">
                              <Avatar nome={MEDICO[r.medicoId].nome} className="size-9 text-xs" />
                              <span className="min-w-0">
                                <span className="block truncate font-semibold">{r.procedimento}</span>
                                <span className="block truncate text-sm text-muted-foreground">
                                  {MEDICO[r.medicoId].nome} · {r.sala}
                                </span>
                              </span>
                            </span>
                            <ChipContato r={r} agora={agora} />
                          </a>
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </Cartao>

        <Cartao
          i={5}
          titulo={`Solicitações aguardando aceite (${pendentes.length})`}
          acao={
            pendentes.length > 2 && (
              <a href="#hospital/notificacoes" className="text-sm font-semibold text-jade-tinta hover:underline">
                Ver todas
              </a>
            )
          }
        >
          {pendentes.length === 0 ? (
            <Vazio icone={Inbox} titulo="Tudo respondido" texto="Novas solicitações aparecem aqui e em Notificações." />
          ) : (
            <ul className="flex flex-col gap-3">
              <AnimatePresence initial={false}>
                {pendentes.slice(0, 2).map((r) => (
                  <CartaoSolicitacao key={r.id} r={r} compacto />
                ))}
              </AnimatePresence>
            </ul>
          )}
        </Cartao>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Cartao i={6} className="xl:col-span-2" titulo="Faturamento por mês">
          <dl className="mb-5 grid grid-cols-1 gap-4 border-b border-border pb-5 sm:grid-cols-3">
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Próximos 30 dias</dt>
              <dd className="mt-1 font-heading text-lg font-bold tabular">{reais(fin.proximos30)}</dd>
              <dd className="text-xs text-muted-foreground">
                {fin.n30} {fin.n30 === 1 ? "locação confirmada" : "locações confirmadas"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Em solicitações abertas</dt>
              <dd className="mt-1 font-heading text-lg font-bold tabular">{reais(fin.emAprovacao)}</dd>
              <dd className="text-xs text-muted-foreground">Entram na previsão quando você aceitar</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Ocupação em 30 dias</dt>
              <dd className="mt-1 font-heading text-lg font-bold tabular">{Math.round(ocup * 100)}%</dd>
              <dd className="text-xs text-muted-foreground">Turnos reservados sobre os abertos</dd>
            </div>
          </dl>
          <GraficoFaturamento serie={serie} />
        </Cartao>
        <Cartao
          i={7}
          titulo="Notificações recentes"
          acao={
            <a href="#hospital/notificacoes" className="text-sm font-semibold text-jade-tinta hover:underline">
              Ver todas
            </a>
          }
        >
          <ul className="-mx-3 flex flex-col">
            {notificacoes.slice(0, 4).map((n) => (
              <li key={n.id}>
                <ItemNotificacao
                  n={n}
                  lida={lidas.includes(n.id)}
                  agora={agora}
                  aoAbrir={() => {
                    marcarLidas([n.id])
                    setFoco(n.reservaId)
                  }}
                />
              </li>
            ))}
          </ul>
        </Cartao>
      </div>
    </>
  )
}
