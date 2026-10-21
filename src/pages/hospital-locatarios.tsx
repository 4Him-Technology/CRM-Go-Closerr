import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Ban, Check, Lock, Mail, Phone, Search, Users } from "lucide-react"
import { rotuloDia, turnoPt } from "@/components/reserva"
import { Avatar, BOTAO_PERIGO, BOTAO_PRIMARIO, BOTAO_SECUNDARIO, CAMPO, ChipContato, Info, Segmentos, Selo, Topo, Vazio } from "@/components/ui"
import { MEDICO, type Reserva } from "@/data/crm"
import { dataLonga, deChave, reais } from "@/data/espacos"
import { contatoLiberado, duracao, futura, inicioDe, liberaEm, realizada } from "@/lib/crm"
import { useCrm } from "@/lib/crm-estado"
import { MOLA_RAPIDA } from "@/lib/motion"
import { cn } from "@/lib/utils"

type Filtro = "proximas" | "pendentes" | "realizadas" | "todas"
const diaHora = (d: Date) => `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")} às ${String(d.getHours()).padStart(2, "0")}h${d.getMinutes() ? String(d.getMinutes()).padStart(2, "0") : ""}`

function filtroDe(r: Reserva | undefined, agora: Date): Filtro {
  if (!r) return "proximas"
  if (r.status === "pendente") return "pendentes"
  return r.status === "confirmada" && futura(r, agora) ? "proximas" : "realizadas"
}

export function HospitalLocatarios() {
  const { agora, doHospital, foco, setFoco } = useCrm()
  const [filtro, setFiltro] = useState<Filtro>(() => filtroDe(doHospital.find((r) => r.id === foco), agora))
  const [busca, setBusca] = useState("")

  const comecoHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate())
  const grupos: Record<Filtro, Reserva[]> = {
    proximas: doHospital.filter((r) => r.status === "confirmada" && inicioDe(r) >= comecoHoje),
    pendentes: doHospital.filter((r) => r.status === "pendente" && futura(r, agora)),
    realizadas: doHospital.filter((r) => realizada(r, agora) || r.status === "cancelada" || r.status === "recusada").reverse(),
    todas: [...doHospital].reverse(),
  }
  const termo = busca.trim().toLowerCase()
  const lista = grupos[filtro].filter((r) => !termo || `${MEDICO[r.medicoId].nome} ${r.procedimento} ${r.id}`.toLowerCase().includes(termo))
  const sel = lista.find((r) => r.id === foco) ?? lista[0]

  const escolher = (id: string) => {
    setFoco(id)
    if (matchMedia("(max-width: 1279px)").matches) setTimeout(() => document.getElementById("detalhe")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50)
  }

  return (
    <>
      <Topo titulo="Locatários" subtitulo="Quem reservou suas salas e o que vai precisar. Telefone e e-mail do médico aparecem 48 horas antes da cirurgia." />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Segmentos
          id="locatarios"
          rotulo="Filtrar reservas"
          valor={filtro}
          mudar={setFiltro}
          itens={[
            { valor: "proximas", rotulo: "Próximas", contador: grupos.proximas.length },
            { valor: "pendentes", rotulo: "Aguardando aceite", contador: grupos.pendentes.length },
            { valor: "realizadas", rotulo: "Histórico" },
            { valor: "todas", rotulo: "Todas" },
          ]}
        />
        <label className="relative ml-auto w-full sm:w-72">
          <span className="sr-only">Buscar por médico, procedimento ou código</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar médico, procedimento ou código" className={cn(CAMPO, "rounded-full pl-9")} />
        </label>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 rounded-2xl bg-white p-2 sombra-card">
          <div className="hidden grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_180px] gap-4 px-4 pt-3 pb-2 text-xs font-semibold text-muted-foreground md:grid" aria-hidden>
            <span>Locatário e procedimento</span>
            <span>Data e turno</span>
            <span>Situação</span>
          </div>
          {lista.length === 0 ? (
            <div className="p-4">
              <Vazio icone={Users} titulo="Nenhuma reserva aqui" texto={termo ? "Tente buscar por outro nome ou procedimento." : "Quando houver reservas neste filtro, elas aparecem nesta lista."} />
            </div>
          ) : (
            <ul className="flex flex-col">
              {lista.map((r) => {
                const m = MEDICO[r.medicoId]
                const ativo = sel?.id === r.id
                return (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => escolher(r.id)}
                      aria-pressed={ativo}
                      aria-controls="detalhe"
                      className="relative grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 rounded-xl px-3 py-3 text-left transition-colors hover:bg-jade-gelo md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_180px] md:gap-4 md:px-4"
                    >
                      {ativo && <motion.span layoutId="loc-sel" className="absolute inset-0 rounded-xl bg-jade-gelo ring-1 ring-jade-claro" transition={MOLA_RAPIDA} />}
                      <span className="relative flex min-w-0 items-center gap-3">
                        <Avatar nome={m.nome} className="size-9 text-xs" />
                        <span className="min-w-0">
                          <span className="block truncate font-semibold">{m.nome}</span>
                          <span className="block text-sm text-muted-foreground">
                            {r.procedimento} · {r.sala}
                          </span>
                        </span>
                      </span>
                      <span className="relative min-w-0 text-sm max-md:text-right">
                        <span className="block font-semibold">{rotuloDia(r.data)}</span>
                        <span className="block text-muted-foreground">{turnoPt(r)}</span>
                      </span>
                      <span className="relative flex flex-wrap items-center gap-x-3 gap-y-1.5 max-md:col-span-2 max-md:pl-12 md:flex-col md:items-start">
                        <Selo status={r.status} />
                        {(r.status === "confirmada" || r.status === "pendente") && <ChipContato r={r} agora={agora} />}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div id="detalhe" className="scroll-mt-32 xl:sticky xl:top-6">
          <AnimatePresence mode="wait" initial={false}>
            {sel && (
              <motion.div key={sel.id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, transition: { duration: 0.12 } }} transition={MOLA_RAPIDA}>
                <Detalhe r={sel} agora={agora} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  )
}

function Detalhe({ r, agora }: { r: Reserva; agora: Date }) {
  const { responder } = useCrm()
  const [recusando, setRecusando] = useState(false)
  const m = MEDICO[r.medicoId]
  const liberado = contatoLiberado(r, agora)
  const lib = liberaEm(r, agora)
  const ini = inicioDe(r)

  return (
    <section aria-label={`Reserva ${r.id}`} className="flex flex-col gap-5 rounded-2xl bg-white p-5 sombra-card md:p-6">
      <div className="flex items-start gap-3">
        <Avatar nome={m.nome} className="size-12" />
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold">{m.nome}</h2>
          <p className="text-sm text-muted-foreground">
            {m.especialidade} · {m.crm}
          </p>
        </div>
        <Selo status={r.status} />
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <Info rotulo="Código">{r.id}</Info>
        <Info rotulo="Valor">{reais(r.valor)}</Info>
        <div className="col-span-2">
          <Info rotulo="Data">
            <span className="inline-block first-letter:uppercase">{dataLonga(deChave(r.data))}</span>
          </Info>
        </div>
        <Info rotulo="Turno">{turnoPt(r)}</Info>
        <Info rotulo="Sala">{r.sala}</Info>
        <Info rotulo="Procedimento">{r.procedimento}</Info>
        <Info rotulo="Porte">{r.porte}</Info>
        <Info rotulo="Anestesia">{r.anestesia}</Info>
        <Info rotulo="Solicitada em">{diaHora(r.solicitadaEm)}</Info>
      </dl>

      <div>
        <h3 className="mb-2 text-xs font-medium text-muted-foreground">O que vai precisar</h3>
        <ul className="flex flex-wrap gap-1.5">
          {r.necessidades.map((n) => (
            <li key={n} className="rounded-full bg-jade-gelo px-3 py-1 text-sm font-medium text-jade-escuro">
              {n}
            </li>
          ))}
        </ul>
        {r.observacoes && <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">Observação do médico: {r.observacoes}</p>}
      </div>

      <div className="rounded-2xl bg-jade-gelo p-4">
        <h3 className="mb-2 text-sm font-bold">Contato do locatário</h3>
        {liberado ? (
          <div className="flex flex-col gap-2 text-sm">
            <a href={`tel:+55${m.tel.replace(/\D/g, "")}`} className="inline-flex items-center gap-2 font-semibold text-jade-tinta hover:underline">
              <Phone className="size-4" aria-hidden /> {m.tel}
            </a>
            <a href={`mailto:${m.email}`} className="inline-flex items-center gap-2 font-semibold break-all text-jade-tinta hover:underline">
              <Mail className="size-4 shrink-0" aria-hidden /> {m.email}
            </a>
            <p className="text-muted-foreground">Liberado em {diaHora(new Date(+ini - 48 * 36e5))}, 48 horas antes da cirurgia.</p>
          </div>
        ) : (
          <div className="flex items-start gap-3 text-sm">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-jade-tinta">
              <Lock className="size-4" aria-hidden />
            </span>
            <p className="text-muted-foreground">
              {lib ? (
                <>
                  Telefone e e-mail ficam ocultos até 48 horas antes da cirurgia. Libera em <strong className="text-foreground">{duracao(+lib - +agora)}</strong> ({diaHora(lib)}), e você recebe uma notificação.
                </>
              ) : r.status === "pendente" ? (
                "Aceite a solicitação. O contato aparece 48 horas antes da cirurgia."
              ) : (
                "Reserva encerrada. O contato não é compartilhado."
              )}
            </p>
          </div>
        )}
      </div>

      {r.status === "pendente" && (
        <div className="flex flex-wrap gap-2">
          {recusando ? (
            <>
              <p className="w-full text-sm font-medium text-red-800">Recusar esta solicitação? O médico é avisado e o turno volta para a agenda.</p>
              <button type="button" className={BOTAO_PERIGO} onClick={() => responder(r.id, false)}>
                <Ban aria-hidden /> Sim, recusar
              </button>
              <button type="button" className={BOTAO_SECUNDARIO} onClick={() => setRecusando(false)}>
                Voltar
              </button>
            </>
          ) : (
            <>
              <button type="button" className={BOTAO_PRIMARIO} onClick={() => responder(r.id, true)}>
                <Check aria-hidden /> Aceitar reserva
              </button>
              <button type="button" className={BOTAO_SECUNDARIO} onClick={() => setRecusando(true)}>
                Recusar
              </button>
            </>
          )}
        </div>
      )}
    </section>
  )
}
