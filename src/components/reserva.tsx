// Peças de reserva usadas em mais de uma tela do painel: solicitação para aceitar, item de notificação e rótulos de dia/turno.
import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Ban, Check, Hourglass, LockOpen, Wallet, X } from "lucide-react"
import { Avatar, BOTAO_PERIGO, BOTAO_PRIMARIO, BOTAO_SECUNDARIO } from "@/components/ui"
import { MEDICO, type Reserva } from "@/data/crm"
import { TURNO, dataCurta, deChave, hoje, reais } from "@/data/espacos"
import { horario, juntar, quandoPt, type Notificacao } from "@/lib/crm"
import { useCrm } from "@/lib/crm-estado"
import { MOLA_RAPIDA } from "@/lib/motion"
import { cn } from "@/lib/utils"

export function rotuloDia(k: string) {
  const dias = Math.round((+deChave(k) - +hoje) / 864e5)
  if (dias === 0) return "Hoje"
  if (dias === 1) return "Amanhã"
  const t = dataCurta(deChave(k))
  return t[0].toUpperCase() + t.slice(1)
}

export const turnoPt = (r: Pick<Reserva, "turno" | "inicio" | "fim">) => `${TURNO[r.turno].nome}, ${horario(r)}`

export function relativo(quando: Date, agora: Date) {
  const min = Math.floor((+agora - +quando) / 6e4)
  if (min < 1) return "agora"
  if (min < 60) return `há ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `há ${h} h`
  const d = Math.floor(h / 24)
  return `há ${d} ${d > 1 ? "dias" : "dia"}`
}

export function CartaoSolicitacao({ r, compacto }: { r: Reserva; compacto?: boolean }) {
  const { responder, setFoco } = useCrm()
  const [recusando, setRecusando] = useState(false)
  const m = MEDICO[r.medicoId]
  return (
    <motion.li layout exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.16 } }} transition={MOLA_RAPIDA} className="flex flex-col gap-3 rounded-2xl bg-white p-4 ring-1 ring-border">
      <div className="flex items-start gap-3">
        <Avatar nome={m.nome} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{m.nome}</p>
          <p className="text-sm text-muted-foreground">{m.crm}</p>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
        <div className="col-span-2">
          <dt className="sr-only">Procedimento</dt>
          <dd className="font-medium">
            {r.procedimento} <span className="text-muted-foreground">· porte {r.porte.toLowerCase()}</span>
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Quando</dt>
          <dd className="font-medium">{quandoPt(r)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Sala</dt>
          <dd className="font-medium">{r.sala}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Valor</dt>
          <dd className="font-medium tabular">{reais(r.valor)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Especialidade</dt>
          <dd className="font-medium">{r.especialidade}</dd>
        </div>
        {!compacto && (
          <div className="col-span-2">
            <dt className="text-xs text-muted-foreground">Vai precisar de</dt>
            <dd>{juntar(r.necessidades)}</dd>
          </div>
        )}
      </dl>
      <AnimatePresence mode="wait" initial={false}>
        {recusando ? (
          <motion.div key="conf" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={MOLA_RAPIDA} className="flex flex-wrap items-center gap-2 rounded-xl bg-red-50 p-2.5">
            <p className="flex-1 text-sm font-medium text-red-800">Recusar esta solicitação? O médico é avisado.</p>
            <button type="button" className={cn(BOTAO_PERIGO, "h-9")} onClick={() => responder(r.id, false)}>
              <Ban aria-hidden /> Recusar
            </button>
            <button type="button" className={cn(BOTAO_SECUNDARIO, "h-9")} onClick={() => setRecusando(false)}>
              Voltar
            </button>
          </motion.div>
        ) : (
          <motion.div key="acoes" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={MOLA_RAPIDA} className="flex flex-wrap items-center gap-2">
            <button type="button" className={cn(BOTAO_PRIMARIO, "h-9")} onClick={() => responder(r.id, true)}>
              <Check aria-hidden /> Aceitar
            </button>
            <button type="button" className={cn(BOTAO_SECUNDARIO, "h-9")} onClick={() => setRecusando(true)}>
              <X aria-hidden /> Recusar
            </button>
            <a href="#hospital/locatarios" onClick={() => setFoco(r.id)} className="ml-auto text-sm font-semibold text-jade-tinta hover:underline">
              Detalhes
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  )
}

const ICONE: Record<Notificacao["tipo"], { icone: typeof Hourglass; classe: string }> = {
  solicitacao: { icone: Hourglass, classe: "bg-amber-50 text-amber-700" },
  contato: { icone: LockOpen, classe: "bg-jade-gelo text-jade-tinta" },
  pagamento: { icone: Wallet, classe: "bg-jade-gelo text-jade-tinta" },
  cancelada: { icone: Ban, classe: "bg-red-50 text-red-700" },
}

export function ItemNotificacao({ n, lida, agora, aoAbrir }: { n: Notificacao; lida: boolean; agora: Date; aoAbrir: () => void }) {
  const I = ICONE[n.tipo]
  return (
    <a
      href={n.tipo === "solicitacao" ? "#hospital/notificacoes" : "#hospital/locatarios"}
      onClick={aoAbrir}
      className={cn("flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-jade-gelo", !lida && "bg-jade-gelo/60")}
    >
      <span className={cn("grid size-9 shrink-0 place-items-center rounded-full", I.classe)}>
        <I.icone className="size-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className={cn("text-sm", lida ? "font-medium" : "font-bold")}>{n.titulo}</span>
          <span className="shrink-0 text-xs text-muted-foreground">{relativo(n.quando, agora)}</span>
        </span>
        <span className="mt-0.5 block text-sm text-muted-foreground">{n.texto}</span>
      </span>
      {!lida && (
        <span className="mt-1.5 size-2 shrink-0 rounded-full bg-jade" aria-label="Não lida" role="img" />
      )}
    </a>
  )
}
