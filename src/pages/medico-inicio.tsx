import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { CalendarCheck, Check, Hourglass, MapPin, MessageCircle, Search, Wallet } from "lucide-react"
import { turnoPt } from "@/components/reserva"
import { BOTAO_DESTAQUE, BOTAO_SECUNDARIO, Cartao, Info, Kpi, Selo, Topo, Vazio } from "@/components/ui"
import { FotoSala } from "@/components/foto-sala"
import { SITE, type Reserva } from "@/data/crm"
import { ESPACO, MESES_L, dataLonga, deChave, reais } from "@/data/espacos"
import { contatoLiberado, futura, inicioDe, juntar, liberaEm, resumoFinanceiro } from "@/lib/crm"
import { useCrm } from "@/lib/crm-estado"
import { MOLA_RAPIDA, atraso } from "@/lib/motion"
import { cn } from "@/lib/utils"

const DIAS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"]
const diaHora = (d: Date) => `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")} às ${String(d.getHours()).padStart(2, "0")}h`

export function MedicoInicio() {
  const { agora, daMedica, medico, setFoco } = useCrm()
  const proximas = daMedica.filter((r) => (r.status === "confirmada" || r.status === "pendente") && futura(r, agora))
  const [selId, setSelId] = useState(proximas[0]?.id)
  const sel = proximas.find((r) => r.id === selId) ?? proximas[0]
  const fin = resumoFinanceiro(daMedica, agora)
  const primeiroNome = medico.nome.split(" ").slice(0, 2).join(" ")

  return (
    <>
      <Topo
        titulo={`Olá, ${primeiroNome}`}
        subtitulo="Suas próximas cirurgias e os detalhes de cada reserva."
        acoes={
          <a href={`${SITE}#espacos`} className={BOTAO_DESTAQUE}>
            <Search aria-hidden /> Reservar nova sala
          </a>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi icone={CalendarCheck} rotulo="Cirurgias confirmadas" valor={proximas.filter((r) => r.status === "confirmada").length} detalhe="A partir de hoje" />
        <Kpi i={1} icone={Hourglass} rotulo="Aguardando o hospital" valor={proximas.filter((r) => r.status === "pendente").length} detalhe="O hospital costuma responder em até 24 h" />
        <Kpi i={2} icone={Wallet} rotulo={`Locações em ${MESES_L[agora.getMonth()]}`} valor={reais(fin.previsto)} detalhe={<a href="#medico/financeiro" className="font-semibold text-jade-tinta hover:underline">Ver relatório e notas</a>} />
      </div>

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <Cartao i={3} titulo="Próximas agendas">
          {proximas.length === 0 ? (
            <Vazio icone={CalendarCheck} titulo="Nenhuma cirurgia agendada" texto="Encontre um centro cirúrgico e reserve pelo site." />
          ) : (
            <ul className="flex flex-col gap-2">
              {proximas.map((r, i) => {
                const d = deChave(r.data)
                const ativo = sel?.id === r.id
                return (
                  <motion.li key={r.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={atraso(i)}>
                    <button type="button" aria-pressed={ativo} aria-controls="detalhe-reserva" onClick={() => setSelId(r.id)} className="relative flex w-full items-center gap-4 rounded-2xl p-3 text-left ring-1 ring-border transition-colors hover:bg-jade-gelo">
                      {ativo && <motion.span layoutId="med-sel" className="absolute inset-0 rounded-2xl bg-jade-gelo ring-2 ring-jade-escuro" transition={MOLA_RAPIDA} />}
                      <span className={cn("relative flex w-14 shrink-0 flex-col items-center rounded-xl py-1.5", ativo ? "bg-jade-escuro text-white" : "bg-jade-gelo text-jade-escuro")}>
                        <span className="text-[11px] font-semibold uppercase">{DIAS[d.getDay()]}</span>
                        <span className="font-heading text-2xl leading-none font-bold tabular">{d.getDate()}</span>
                        <span className="text-[11px] font-semibold uppercase">{MESES_L[d.getMonth()].slice(0, 3)}</span>
                      </span>
                      <span className="relative min-w-0 flex-1">
                        <span className="block truncate font-semibold">{ESPACO[r.espacoId].nome}</span>
                        <span className="block truncate text-sm text-muted-foreground">
                          {r.procedimento} · {turnoPt(r)}
                        </span>
                        <Selo status={r.status} className="mt-1.5" />
                      </span>
                    </button>
                  </motion.li>
                )
              })}
            </ul>
          )}
        </Cartao>

        <div id="detalhe-reserva" className="lg:sticky lg:top-6">
          <AnimatePresence mode="wait" initial={false}>
            {sel && (
              <motion.div key={sel.id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, transition: { duration: 0.12 } }} transition={MOLA_RAPIDA}>
                <Detalhe r={sel} agora={agora} aoFalar={() => setFoco(sel.id)} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  )
}

function Detalhe({ r, agora, aoFalar }: { r: Reserva; agora: Date; aoFalar: () => void }) {
  const e = ESPACO[r.espacoId]
  const ini = inicioDe(r)
  const lib = liberaEm(r, agora)
  const passos = [
    { feito: true, titulo: "Solicitação enviada", quando: diaHora(r.solicitadaEm) },
    { feito: r.status === "confirmada", titulo: "Aceite do hospital", quando: r.status === "confirmada" ? "Reserva confirmada" : "Aguardando resposta" },
    { feito: contatoLiberado(r, agora), titulo: "Seu contato vai para o hospital", quando: lib ? `${diaHora(lib)}, 48 h antes` : r.status === "confirmada" ? "Já compartilhado" : "Depois do aceite" },
    { feito: false, titulo: "Cirurgia", quando: diaHora(ini) },
  ]

  return (
    <section aria-label={`Reserva ${r.id}`} className="overflow-hidden rounded-2xl bg-white sombra-card">
      <div className="relative h-44">
        <FotoSala espaco={e} rotulo prioridade className="absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-jade-noite/85 via-jade-noite/20 to-transparent" aria-hidden />
        <div className="absolute inset-x-5 bottom-4 text-white">
          <Selo status={r.status} className="mb-2" />
          <h2 className="text-xl font-bold">{e.nome}</h2>
          <p className="flex items-center gap-1.5 text-sm text-white/85">
            <MapPin className="size-3.5" aria-hidden /> {e.endereco}, {e.cidade} - {e.uf}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-5 p-5 md:p-6">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div className="col-span-2">
            <Info rotulo="Data">
              <span className="inline-block first-letter:uppercase">{dataLonga(deChave(r.data))}</span>
            </Info>
          </div>
          <Info rotulo="Turno">{turnoPt(r)}</Info>
          <Info rotulo="Sala">{r.sala}</Info>
          <Info rotulo="Procedimento">{r.procedimento}</Info>
          <Info rotulo="Anestesia">{r.anestesia}</Info>
          <Info rotulo="Código">{r.id}</Info>
          <Info rotulo="Valor">{reais(r.valor)}</Info>
          <div className="col-span-2">
            <Info rotulo="Você pediu">{juntar(r.necessidades)}</Info>
          </div>
        </dl>

        <ol className="flex flex-col" aria-label="Andamento da reserva">
          {passos.map((p, i) => (
            <li key={p.titulo} className="flex gap-3">
              <span className="flex flex-col items-center">
                <span className={cn("grid size-6 shrink-0 place-items-center rounded-full", p.feito ? "bg-jade-escuro text-white" : "bg-white ring-2 ring-[#c9dad0]")}>
                  {p.feito && <Check className="size-3.5" aria-hidden />}
                </span>
                {i < passos.length - 1 && <span className={cn("w-0.5 flex-1", p.feito ? "bg-jade-escuro" : "bg-[#dbe7e0]")} aria-hidden />}
              </span>
              <span className="pb-4">
                <span className="block text-sm font-semibold">
                  {p.titulo}
                  <span className="sr-only">{p.feito ? ", concluído" : ", pendente"}</span>
                </span>
                <span className="block text-sm text-muted-foreground">{p.quando}</span>
              </span>
            </li>
          ))}
        </ol>

        <p className="rounded-xl bg-jade-gelo px-4 py-3 text-sm text-jade-escuro">Por privacidade, o hospital só recebe seu telefone e e-mail 48 horas antes da cirurgia.</p>

        <a href="#medico/contato" onClick={aoFalar} className={BOTAO_SECUNDARIO}>
          <MessageCircle aria-hidden /> Falar com a Gocloserr sobre esta reserva
        </a>
      </div>
    </section>
  )
}
