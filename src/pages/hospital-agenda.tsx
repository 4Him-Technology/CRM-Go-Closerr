import { useMemo, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { CalendarCheck, CalendarPlus, CalendarRange, ChevronLeft, ChevronRight, Hourglass, Lock } from "lucide-react"
import { BOTAO_PRIMARIO, BOTAO_SECUNDARIO, Cartao, Kpi, Topo } from "@/components/ui"
import { MEDICO } from "@/data/crm"
import { MESES_L, TURNOS, chave, dataLonga, deChave, type TurnoId } from "@/data/espacos"
import { estadoTurno, indiceReservas, type EstadoTurno } from "@/lib/crm"
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

export function HospitalAgenda() {
  const { agora, doHospital, disp, setTurnos, avisar, setFoco } = useCrm()
  const idx = useMemo(() => indiceReservas(doHospital), [doHospital])
  const [mes, setMes] = useState(0)
  const [dia, setDia] = useState(() => chave(agora))
  const est = (k: string, t: TurnoId) => estadoTurno(k, t, disp, idx, agora)

  const base = new Date(agora.getFullYear(), agora.getMonth() + mes, 1)
  const nDias = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate()
  const diasMes = Array.from({ length: nDias }, (_, i) => chave(new Date(base.getFullYear(), base.getMonth(), i + 1)))
  const conta = (e: EstadoTurno) => diasMes.reduce((s, k) => s + TURNOS.filter((t) => est(k, t.id) === e).length, 0)

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

  return (
    <>
      <Topo
        titulo="Agenda"
        subtitulo="Informe em quais datas e turnos o centro cirúrgico está disponível. O que estiver aberto aparece para os médicos reservarem."
        acoes={
          <button type="button" className={BOTAO_SECUNDARIO} onClick={abrirUteis}>
            <CalendarPlus aria-hidden /> Abrir dias úteis do mês
          </button>
        }
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <Kpi i={0} icone={CalendarRange} rotulo={`Abertos em ${MESES_L[base.getMonth()]}`} valor={conta("livre")} detalhe="Turnos que os médicos podem reservar" />
        <Kpi i={1} icone={CalendarCheck} rotulo={`Reservados em ${MESES_L[base.getMonth()]}`} valor={conta("reservado")} detalhe="Turnos com cirurgia confirmada" />
        <Kpi i={2} icone={Hourglass} rotulo="Aguardando aceite" valor={conta("pendente")} detalhe={<a href="#hospital/notificacoes" className="font-semibold text-jade-tinta hover:underline">Responder solicitações</a>} />
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Cartao i={3}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <button type="button" onClick={() => setMes(mes - 1)} disabled={mes <= 0} aria-label="Mês anterior" className="grid size-9 place-items-center rounded-full ring-1 ring-border transition-colors hover:bg-jade-gelo disabled:opacity-30">
              <ChevronLeft className="size-4" aria-hidden />
            </button>
            <h2 className="font-heading text-lg font-bold first-letter:uppercase" aria-live="polite">
              {MESES_L[base.getMonth()]} {base.getFullYear()}
            </h2>
            <button type="button" onClick={() => setMes(mes + 1)} disabled={mes >= 2} aria-label="Próximo mês" className="grid size-9 place-items-center rounded-full ring-1 ring-border transition-colors hover:bg-jade-gelo disabled:opacity-30">
              <ChevronRight className="size-4" aria-hidden />
            </button>
          </div>

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
              const escolhido = k === dia
              const ehHoje = k === chave(agora)
              const passado = estados.every((e) => e === "passado")
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setDia(k)}
                  aria-pressed={escolhido}
                  aria-label={`${dataLonga(deChave(k))}: ${TURNOS.map((t, i) => `${t.nome.toLowerCase()} ${ESTADO[estados[i]].rotulo}`).join(", ")}`}
                  className={cn("relative flex min-h-16 flex-col justify-between gap-2 rounded-xl p-1.5 text-left transition-colors hover:bg-jade-gelo md:min-h-[78px] md:p-2", passado && "text-muted-foreground")}
                >
                  {escolhido && <motion.span layoutId="agenda-dia" className="absolute inset-0 rounded-xl ring-2 ring-jade-escuro" transition={MOLA_RAPIDA} />}
                  <span className={cn("relative grid size-6 place-items-center rounded-full text-sm font-semibold tabular", ehHoje && "bg-jade-escuro text-white")}>{deChave(k).getDate()}</span>
                  {/* turno já encerrado sem reserva não mostra ficha: o mês passado fica limpo */}
                  <span className="relative grid grid-cols-3 gap-[3px]" aria-hidden>
                    {estados.map((e, i) => (
                      <span key={i} className={cn("grid h-1.5 place-items-center rounded-full text-[10px] leading-none font-bold md:h-5 md:rounded-md", ESTADO[e].ficha, e === "passado" && "invisible")}>
                        <span className="hidden md:inline">{TURNOS[i].nome[0]}</span>
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
            <p>M, T e N são manhã, tarde e noite. Clique num dia para abrir ou fechar os turnos.</p>
          </div>
        </Cartao>

        <div className="xl:sticky xl:top-6">
          <AnimatePresence mode="wait" initial={false}>
            <motion.section key={dia} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, transition: { duration: 0.12 } }} transition={MOLA_RAPIDA} aria-labelledby="dia-titulo" className="flex flex-col gap-4 rounded-2xl bg-white p-5 sombra-card md:p-6">
              <h2 id="dia-titulo" className="font-heading text-lg font-bold first-letter:uppercase">
                {dataLonga(deChave(dia))}
              </h2>
              <ul className="flex flex-col gap-2">
                {TURNOS.map((t) => {
                  const e = est(dia, t.id)
                  const r = idx.get(`${dia}|${t.id}`)
                  return (
                    <li key={t.id} className="flex items-center gap-3 rounded-xl p-3 ring-1 ring-border">
                      <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg text-xs font-bold", ESTADO[e].ficha)} aria-hidden>
                        {t.nome[0]}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">
                          {t.nome} <span className="font-normal text-muted-foreground">· {t.horas}</span>
                        </p>
                        {r ? (
                          <a href={`#hospital/${e === "pendente" ? "notificacoes" : "locatarios"}`} onClick={() => setFoco(r.id)} className="block truncate text-sm text-jade-tinta hover:underline">
                            {e === "pendente" ? "Aguardando aceite: " : ""}
                            {MEDICO[r.medicoId].nome}, {r.procedimento}
                          </a>
                        ) : (
                          <p className="text-sm text-muted-foreground first-letter:uppercase">{ESTADO[e].rotulo}</p>
                        )}
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
                    </li>
                  )
                })}
              </ul>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" className={BOTAO_PRIMARIO} disabled={diaPassado} onClick={() => definirDia(dia, true)}>
                  Abrir o dia
                </button>
                <button type="button" className={BOTAO_SECUNDARIO} disabled={diaPassado} onClick={() => definirDia(dia, false)}>
                  Fechar o dia
                </button>
              </div>
              <p className="text-xs text-muted-foreground">Turnos reservados ou aguardando aceite não mudam por aqui. Para liberar um deles, responda a solicitação ou fale com a Gocloserr.</p>
            </motion.section>
          </AnimatePresence>
        </div>
      </div>
    </>
  )
}
