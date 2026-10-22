import { useMemo, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { CalendarCheck, CalendarPlus, CalendarRange, ChevronLeft, ChevronRight, Hourglass, Lock } from "lucide-react"
import { BOTAO_PRIMARIO, BOTAO_SECUNDARIO, Cartao, Kpi, Segmentos, Topo } from "@/components/ui"
import { MEDICO, type Reserva } from "@/data/crm"
import { MESES_L, TURNOS, chave, dataLonga, deChave, type TurnoId } from "@/data/espacos"
import { distribuir, estadoTurno, hora, horario, indiceReservas, type EstadoTurno } from "@/lib/crm"
import { useCrm } from "@/lib/crm-estado"
import { MOLA_RAPIDA } from "@/lib/motion"
import { cn } from "@/lib/utils"

const SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
// Cada turno vira uma ficha com a inicial (M, T, N). O estado não depende só da cor:
// aberto tem contorno, reservado é cheio, aguardando é claro com contorno âmbar e fechado é tracejado.
const ESTADO: Record<EstadoTurno, { rotulo: string; ficha: string }> = {
  livre: { rotulo: "aberto para reserva", ficha: "bg-white text-jade-tinta ring-1 ring-inset ring-jade-medio" },
  reservado: { rotulo: "reservado", ficha: "bg-jade-escuro text-white" },
  pendente: { rotulo: "aguardando seu aceite", ficha: "bg-amber-100 text-amber-900 ring-1 ring-inset ring-amber-400" },
  fechado: { rotulo: "fechado", ficha: "border border-dashed border-[#bccdc4] text-[#8ea398]" },
  passado: { rotulo: "encerrado", ficha: "bg-[#eef2f0] text-[#a9bab1]" },
}

// Semana: faixa de cada turno ao fundo (fechado listrado, encerrado cinza) e as cirurgias por cima
const DE = TURNOS[0].de
const ATE = TURNOS[TURNOS.length - 1].ate
const PX = 0.8 // px por minuto: 48 px por hora
const FAIXA: Record<EstadoTurno, string> = {
  livre: "bg-white",
  reservado: "bg-white",
  pendente: "bg-white",
  fechado: "bg-[repeating-linear-gradient(135deg,#eef3f0_0_5px,#ffffff_5px_11px)]",
  passado: "bg-[#f5f8f6]",
}

type Modo = "semana" | "mes"
const somaDias = (k: string, n: number) => {
  const d = deChave(k)
  d.setDate(d.getDate() + n)
  return chave(d)
}
const domingo = (k: string) => somaDias(k, -deChave(k).getDay())

export function HospitalAgenda() {
  const { agora, doHospital, disp, setTurnos, avisar, setFoco } = useCrm()
  const idx = useMemo(() => indiceReservas(doHospital), [doHospital])
  const [modo, setModo] = useState<Modo>("semana")
  const [mes, setMes] = useState(0)
  const [dia, setDia] = useState(() => chave(agora))
  const est = (k: string, t: TurnoId) => estadoTurno(k, t, disp, idx, agora)
  const doDia = (k: string) => TURNOS.flatMap((t) => idx.get(`${k}|${t.id}`) ?? [])
  const hoje = chave(agora)
  const minAgora = agora.getHours() * 60 + agora.getMinutes()

  const base = new Date(agora.getFullYear(), agora.getMonth() + mes, 1)
  const nDias = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate()
  const diasMes = Array.from({ length: nDias }, (_, i) => chave(new Date(base.getFullYear(), base.getMonth(), i + 1)))
  const diasSemana = Array.from({ length: 7 }, (_, i) => somaDias(domingo(dia), i))
  // a semana anda nos mesmos limites do mês: do começo deste mês até o fim do terceiro
  const primeiro = chave(new Date(agora.getFullYear(), agora.getMonth(), 1))
  const ultimo = chave(new Date(agora.getFullYear(), agora.getMonth() + 3, 0))

  const periodo = modo === "mes" ? diasMes : diasSemana
  const noPeriodo = periodo.flatMap(doDia)
  const conta = (e: EstadoTurno) => periodo.reduce((s, k) => s + TURNOS.filter((t) => est(k, t.id) === e).length, 0)
  const sufixo = modo === "mes" ? `em ${MESES_L[base.getMonth()]}` : "na semana"

  const mudarModo = (m: Modo) => {
    const d = deChave(dia)
    if (m === "mes") setMes(Math.min(2, Math.max(0, d.getMonth() - agora.getMonth() + 12 * (d.getFullYear() - agora.getFullYear()))))
    setModo(m)
  }
  const alternar = (k: string, t: TurnoId) => {
    const atual = disp[k] ?? []
    setTurnos({ [k]: atual.includes(t) ? atual.filter((x) => x !== t) : [...atual, t] })
  }
  const definirDia = (k: string, abrir: boolean) => setTurnos({ [k]: abrir ? TURNOS.map((t) => t.id).filter((t) => est(k, t) !== "passado") : [] })
  const abrirUteis = () => {
    const novos: Record<string, TurnoId[]> = {}
    let n = 0
    for (const k of diasMes) {
      const d = deChave(k).getDay()
      if (d === 0 || d === 6) continue
      const abrir = (["manha", "tarde"] as TurnoId[]).filter((t) => est(k, t) === "fechado")
      if (!abrir.length) continue
      novos[k] = [...(disp[k] ?? []), ...abrir]
      n += abrir.length
    }
    setTurnos(novos)
    avisar(n ? `${n} turnos de manhã e tarde abertos em ${MESES_L[base.getMonth()]}. Eles já aparecem para os médicos.` : "Os dias úteis deste mês já estavam abertos.")
  }

  const diaPassado = TURNOS.every((t) => est(dia, t.id) === "passado")
  const [d1, d7] = [deChave(diasSemana[0]), deChave(diasSemana[6])]
  const titulo =
    modo === "mes"
      ? `${MESES_L[base.getMonth()]} ${base.getFullYear()}`
      : `${d1.getDate()}${d1.getMonth() === d7.getMonth() ? "" : ` de ${MESES_L[d1.getMonth()]}`} a ${d7.getDate()} de ${MESES_L[d7.getMonth()]}`
  const voltar = modo === "mes" ? { ok: mes > 0, ir: () => setMes(mes - 1) } : { ok: diasSemana[0] > primeiro, ir: () => setDia(somaDias(dia, -7)) }
  const avancar = modo === "mes" ? { ok: mes < 2, ir: () => setMes(mes + 1) } : { ok: diasSemana[6] < ultimo, ir: () => setDia(somaDias(dia, 7)) }
  const destino = (r: Reserva) => `#hospital/${r.status === "pendente" ? "notificacoes" : "locatarios"}`
  // já terminou: no dia de hoje compara o horário; dias anteriores já passaram
  const terminou = (r: Reserva) => r.data < hoje || (r.data === hoje && r.fim <= minAgora)

  return (
    <>
      <Topo
        titulo="Agenda"
        subtitulo="Informe em quais datas e turnos o centro cirúrgico está disponível e veja cada cirurgia no seu horário."
        acoes={
          <button type="button" className={BOTAO_SECUNDARIO} onClick={abrirUteis}>
            <CalendarPlus aria-hidden /> Abrir dias úteis do mês
          </button>
        }
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <Kpi i={0} icone={CalendarRange} rotulo={`Turnos abertos ${sufixo}`} valor={conta("livre")} detalhe="Ainda sem cirurgia marcada" />
        <Kpi i={1} icone={CalendarCheck} rotulo={`Cirurgias ${sufixo}`} valor={noPeriodo.filter((r) => r.status !== "pendente").length} detalhe="Confirmadas ou já realizadas" />
        <Kpi
          i={2}
          icone={Hourglass}
          rotulo="Aguardando aceite"
          valor={noPeriodo.filter((r) => r.status === "pendente").length}
          detalhe={
            <a href="#hospital/notificacoes" className="font-semibold text-jade-tinta hover:underline">
              Responder solicitações
            </a>
          }
        />
      </div>

      <div className={cn("grid items-start gap-4", modo === "mes" && "xl:grid-cols-[minmax(0,1fr)_360px]")}>
        <Cartao i={3}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button type="button" onClick={voltar.ir} disabled={!voltar.ok} aria-label={modo === "mes" ? "Mês anterior" : "Semana anterior"} className="grid size-9 place-items-center rounded-full ring-1 ring-border transition-colors hover:bg-jade-gelo disabled:opacity-30">
                <ChevronLeft className="size-4" aria-hidden />
              </button>
              <button type="button" onClick={avancar.ir} disabled={!avancar.ok} aria-label={modo === "mes" ? "Próximo mês" : "Próxima semana"} className="grid size-9 place-items-center rounded-full ring-1 ring-border transition-colors hover:bg-jade-gelo disabled:opacity-30">
                <ChevronRight className="size-4" aria-hidden />
              </button>
              <h2 className="ml-2 font-heading text-lg font-bold first-letter:uppercase" aria-live="polite">
                {titulo}
              </h2>
            </div>
            <Segmentos<Modo>
              id="agenda-modo"
              rotulo="Visualizar por"
              valor={modo}
              mudar={mudarModo}
              itens={[
                { valor: "semana", rotulo: "Semana" },
                { valor: "mes", rotulo: "Mês" },
              ]}
            />
          </div>

          {modo === "semana" ? (
            <motion.div key={diasSemana[0]} initial={{ opacity: 0, filter: "blur(4px)" }} animate={{ opacity: 1, filter: "blur(0px)" }} transition={{ duration: 0.2 }}>
              {/* tabela larga: no celular rola para o lado dentro do cartão */}
              <div role="region" aria-label={`Cirurgias de ${titulo}`} tabIndex={0} className="-mx-1 overflow-x-auto px-1 pb-1">
                <div className="grid min-w-[720px] grid-cols-[52px_repeat(7,minmax(0,1fr))]">
                  <span />
                  {diasSemana.map((k) => {
                    const d = deChave(k)
                    return (
                      <button key={k} type="button" onClick={() => setDia(k)} aria-pressed={k === dia} aria-label={dataLonga(d)} className="flex flex-col items-center gap-1 rounded-xl pb-2 transition-colors hover:bg-jade-gelo">
                        <span className="text-xs font-semibold text-muted-foreground">{SEMANA[d.getDay()]}</span>
                        <span className={cn("grid size-8 place-items-center rounded-full font-heading text-sm font-bold tabular", k === hoje ? "bg-jade-escuro text-white" : k === dia && "ring-2 ring-jade-escuro")}>{d.getDate()}</span>
                      </button>
                    )
                  })}

                  {/* eixo: horas e o início de cada turno */}
                  <div className="relative" style={{ height: (ATE - DE) * PX }} aria-hidden>
                    {Array.from({ length: (ATE - DE) / 60 + 1 }, (_, i) => DE + i * 60).map((m) => {
                      const turno = TURNOS.find((t) => t.de === m)
                      return (
                        <span key={m} className="absolute right-2 text-right text-[11px] leading-tight text-muted-foreground tabular" style={{ top: (m - DE) * PX - 7 }}>
                          {hora(m)}
                          {turno && <span className="block text-[10px] font-semibold text-jade-tinta">{turno.nome}</span>}
                        </span>
                      )
                    })}
                  </div>

                  {diasSemana.map((k) => (
                    <div key={k} className="relative border-l border-border" style={{ height: (ATE - DE) * PX }}>
                      {TURNOS.map((t) => (
                        <div key={t.id} className={cn("absolute inset-x-0 border-t border-[#d3e1d9]", FAIXA[est(k, t.id)])} style={{ top: (t.de - DE) * PX, height: (t.ate - t.de) * PX }} />
                      ))}
                      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,#e9f0ec_1px,transparent_1px)] bg-[size:100%_48px]" aria-hidden />
                      {k === hoje && minAgora > DE && minAgora < ATE && (
                        <div className="pointer-events-none absolute inset-x-0 z-10 h-0.5 bg-destructive" style={{ top: (minAgora - DE) * PX }} aria-hidden>
                          <span className="absolute -top-[3px] -left-1 size-2 rounded-full bg-destructive" />
                        </div>
                      )}
                      {distribuir(doDia(k)).map(({ r, coluna, colunas }) => {
                        const m = MEDICO[r.medicoId]
                        const pendente = r.status === "pendente"
                        return (
                          <a
                            key={r.id}
                            href={destino(r)}
                            onClick={() => setFoco(r.id)}
                            aria-label={`${horario(r)}, ${r.procedimento}, ${m.nome}, ${r.sala}${pendente ? ", aguardando seu aceite" : ""}`}
                            title={`${horario(r)} · ${r.procedimento} · ${m.nome} · ${r.sala}`}
                            className={cn(
                              "absolute overflow-hidden rounded-lg px-1.5 py-1 text-[11px] leading-tight transition-[filter] hover:brightness-110",
                              pendente ? "bg-amber-50 text-amber-950 ring-1 ring-amber-400 ring-inset" : terminou(r) ? "bg-jade-escuro/70 text-white" : "bg-jade-escuro text-white"
                            )}
                            style={{ top: (r.inicio - DE) * PX + 1, height: (r.fim - r.inicio) * PX - 2, left: `calc(${(coluna / colunas) * 100}% + 2px)`, width: `calc(${100 / colunas}% - 4px)` }}
                          >
                            <span className="flex items-center gap-1 font-semibold tabular">
                              {pendente && <Hourglass className="size-3 shrink-0" aria-hidden />}
                              {hora(r.inicio)}
                            </span>
                            <span className="block truncate font-semibold">{r.procedimento}</span>
                            <span className="block truncate opacity-85">{m.nome}</span>
                            <span className="block truncate opacity-85">{r.sala}</span>
                          </a>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
              <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-4 text-xs text-muted-foreground" aria-label="Legenda">
                <li className="flex items-center gap-2">
                  <span className="h-4 w-6 rounded-md bg-jade-escuro" aria-hidden /> Cirurgia confirmada
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-4 w-6 rounded-md bg-amber-50 ring-1 ring-amber-400 ring-inset" aria-hidden /> Aguardando seu aceite
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-4 w-6 rounded-md bg-white ring-1 ring-border ring-inset" aria-hidden /> Turno aberto
                </li>
                <li className="flex items-center gap-2">
                  <span className={cn("h-4 w-6 rounded-md ring-1 ring-border ring-inset", FAIXA.fechado)} aria-hidden /> Turno fechado
                </li>
                <li>Cirurgias no mesmo horário, em salas diferentes, ficam lado a lado.</li>
              </ul>
            </motion.div>
          ) : (
            <>
              <motion.div key={mes} initial={{ opacity: 0, filter: "blur(4px)" }} animate={{ opacity: 1, filter: "blur(0px)" }} transition={{ duration: 0.2 }} className="grid grid-cols-7 gap-1 md:gap-1.5">
                {SEMANA.map((s) => (
                  <span key={s} className="pb-1 text-center text-xs font-semibold text-muted-foreground" aria-hidden>
                    {s}
                  </span>
                ))}
                {Array.from({ length: base.getDay() }, (_, i) => (
                  <span key={`v${i}`} />
                ))}
                {diasMes.map((k) => {
                  const estados = TURNOS.map((t) => est(k, t.id))
                  const qtd = TURNOS.map((t) => idx.get(`${k}|${t.id}`)?.length ?? 0)
                  const escolhido = k === dia
                  const passado = estados.every((e) => e === "passado")
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setDia(k)}
                      aria-pressed={escolhido}
                      aria-label={`${dataLonga(deChave(k))}: ${TURNOS.map((t, i) => `${t.nome.toLowerCase()} ${ESTADO[estados[i]].rotulo}${qtd[i] ? `, ${qtd[i]} ${qtd[i] > 1 ? "cirurgias" : "cirurgia"}` : ""}`).join("; ")}`}
                      className={cn("relative flex min-h-16 flex-col justify-between gap-2 rounded-xl p-1.5 text-left transition-colors hover:bg-jade-gelo md:min-h-[78px] md:p-2", passado && "text-muted-foreground")}
                    >
                      {escolhido && <motion.span layoutId="agenda-dia" className="absolute inset-0 rounded-xl ring-2 ring-jade-escuro" transition={MOLA_RAPIDA} />}
                      <span className={cn("relative grid size-6 place-items-center rounded-full text-sm font-semibold tabular", k === hoje && "bg-jade-escuro text-white")}>{deChave(k).getDate()}</span>
                      {/* turno já encerrado sem reserva não mostra ficha: o mês passado fica limpo */}
                      <span className="relative grid grid-cols-3 gap-[3px]" aria-hidden>
                        {estados.map((e, i) => (
                          <span key={i} className={cn("grid h-1.5 place-items-center rounded-full text-[10px] leading-none font-bold md:h-5 md:rounded-md", ESTADO[e].ficha, e === "passado" && "invisible")}>
                            <span className="hidden md:inline">
                              {TURNOS[i].nome[0]}
                              {qtd[i] > 1 && <sup className="ml-px text-[8px]">{qtd[i]}</sup>}
                            </span>
                          </span>
                        ))}
                      </span>
                    </button>
                  )
                })}
              </motion.div>

              <div className="mt-5 flex flex-col gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
                <ul className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Legenda">
                  {(["livre", "reservado", "pendente", "fechado"] as EstadoTurno[]).map((e) => (
                    <li key={e} className="flex items-center gap-2">
                      <span className={cn("h-4 w-6 rounded-md", ESTADO[e].ficha)} aria-hidden />
                      <span className="first-letter:uppercase">{ESTADO[e].rotulo}</span>
                    </li>
                  ))}
                </ul>
                <p>M, T e N são manhã, tarde e noite; o número pequeno indica mais de uma cirurgia no turno. Clique num dia para ver as cirurgias e abrir ou fechar os turnos.</p>
              </div>
            </>
          )}
        </Cartao>

        <div className={cn(modo === "mes" && "xl:sticky xl:top-6")}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.section key={dia} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, transition: { duration: 0.12 } }} transition={MOLA_RAPIDA} aria-labelledby="dia-titulo" className="flex flex-col gap-4 rounded-2xl bg-white p-5 sombra-card md:p-6">
              <h2 id="dia-titulo" className="font-heading text-lg font-bold first-letter:uppercase">
                {dataLonga(deChave(dia))}
              </h2>
              <ul className={cn("grid items-start gap-2", modo === "semana" && "md:grid-cols-3")}>
                {TURNOS.map((t) => {
                  const e = est(dia, t.id)
                  const rs = idx.get(`${dia}|${t.id}`) ?? []
                  return (
                    <li key={t.id} className="flex flex-col gap-2 rounded-xl p-3 ring-1 ring-border">
                      <div className="flex items-center gap-3">
                        <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg text-xs font-bold", ESTADO[e].ficha)} aria-hidden>
                          {t.nome[0]}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold">
                            {t.nome} <span className="font-normal text-muted-foreground">· {t.horas}</span>
                          </p>
                          <p className="text-sm text-muted-foreground first-letter:uppercase">{rs.length ? `${rs.length} ${rs.length > 1 ? "cirurgias" : "cirurgia"}` : ESTADO[e].rotulo}</p>
                        </div>
                        {e === "livre" || e === "fechado" ? (
                          <button
                            type="button"
                            role="switch"
                            aria-checked={e === "livre"}
                            aria-label={`${t.nome} aberto para reserva`}
                            onClick={() => alternar(dia, t.id)}
                            className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors", e === "livre" ? "bg-jade-escuro" : "bg-[#c9dad0]")}
                          >
                            <motion.span layout transition={MOLA_RAPIDA} className={cn("absolute top-1 size-5 rounded-full bg-white shadow", e === "livre" ? "right-1" : "left-1")} />
                          </button>
                        ) : (
                          <Lock className="size-4 shrink-0 text-muted-foreground" aria-label="Não pode ser alterado" role="img" />
                        )}
                      </div>
                      {rs.length > 0 && (
                        <ul className="flex flex-col border-t border-border pt-1">
                          {rs.map((r) => (
                            <li key={r.id}>
                              <a href={destino(r)} onClick={() => setFoco(r.id)} className="flex gap-3 rounded-lg px-1 py-1.5 text-sm transition-colors hover:bg-jade-gelo">
                                <span className="w-12 shrink-0 font-semibold tabular">{hora(r.inicio)}</span>
                                <span className="min-w-0">
                                  <span className="block truncate font-medium">{r.procedimento}</span>
                                  <span className="block truncate text-muted-foreground">
                                    {MEDICO[r.medicoId].nome} · {r.sala} · até {hora(r.fim)}
                                    {r.status === "pendente" && " · aguardando aceite"}
                                  </span>
                                </span>
                              </a>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  )
                })}
              </ul>
              <div className={cn("grid grid-cols-2 gap-2", modo === "semana" && "md:max-w-sm")}>
                <button type="button" className={BOTAO_PRIMARIO} disabled={diaPassado} onClick={() => definirDia(dia, true)}>
                  Abrir o dia
                </button>
                <button type="button" className={BOTAO_SECUNDARIO} disabled={diaPassado} onClick={() => definirDia(dia, false)}>
                  Fechar o dia
                </button>
              </div>
              <p className="text-xs text-muted-foreground">Turnos com cirurgia ou aguardando aceite não mudam por aqui. Para liberar um deles, responda a solicitação ou fale com a Gocloserr.</p>
            </motion.section>
          </AnimatePresence>
        </div>
      </div>
    </>
  )
}
