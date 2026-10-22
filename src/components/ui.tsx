// Peças pequenas do painel (CRM), no padrão visual da paleta Jade.
import { useId, type ComponentType, type ReactNode } from "react"
import { motion } from "motion/react"
import { Ban, Check, CircleCheck, Hourglass, Lock, LockOpen, X } from "lucide-react"
import type { Reserva, StatusReserva } from "@/data/crm"
import { contatoLiberado, duracao, liberaEm } from "@/lib/crm"
import { ENTRAR, MOLA_RAPIDA, atraso } from "@/lib/motion"
import { cn } from "@/lib/utils"

type Icone = ComponentType<{ className?: string; "aria-hidden"?: boolean }>

const BOTAO =
  "inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold whitespace-nowrap transition-[background-color,box-shadow,transform] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4"
// Botão principal: verde-limão da logo com texto escuro (contraste), pulsando devagar para chamar atenção
export const BOTAO_PRIMARIO = cn(BOTAO, "pulsante bg-marca text-jade-noite hover:bg-marca-forte")
export const BOTAO_SECUNDARIO = cn(BOTAO, "bg-white text-foreground ring-1 ring-border hover:bg-jade-gelo")
export const BOTAO_PERIGO = cn(BOTAO, "bg-white text-destructive ring-1 ring-destructive/30 hover:bg-destructive/5")
export const CAMPO =
  "h-11 w-full rounded-xl border border-input bg-white px-3 text-base transition-[border-color,box-shadow] outline-none focus:border-ring focus:ring-2 focus:ring-ring/25 aria-invalid:border-destructive md:text-sm"

export function Topo({ titulo, subtitulo, acoes }: { titulo: string; subtitulo?: ReactNode; acoes?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 tabIndex={-1} data-foco-proprio className="text-2xl font-bold md:text-[28px]">
          {titulo}
        </h1>
        {subtitulo && <p className="mt-1 max-w-2xl text-muted-foreground">{subtitulo}</p>}
      </div>
      {acoes && <div className="flex flex-wrap gap-2">{acoes}</div>}
    </div>
  )
}

export function Cartao({ titulo, acao, children, className, i = 0 }: { titulo?: ReactNode; acao?: ReactNode; children: ReactNode; className?: string; i?: number }) {
  const id = useId()
  return (
    <motion.section {...ENTRAR} transition={atraso(i)} aria-labelledby={titulo ? id : undefined} className={cn("min-w-0 rounded-2xl bg-white p-5 sombra-card md:p-6", className)}>
      {titulo && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 id={id} className="text-base font-bold">
            {titulo}
          </h2>
          {acao}
        </div>
      )}
      {children}
    </motion.section>
  )
}

export function Kpi({ rotulo, valor, detalhe, icone: I, i = 0 }: { rotulo: string; valor: ReactNode; detalhe?: ReactNode; icone: Icone; i?: number }) {
  return (
    <motion.div {...ENTRAR} transition={atraso(i)} className="flex min-w-0 flex-col gap-3 rounded-2xl bg-white p-5 sombra-card">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{rotulo}</p>
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-jade-gelo text-jade-tinta">
          <I className="size-[18px]" aria-hidden />
        </span>
      </div>
      <p className="font-heading text-[28px] leading-none font-bold tabular">{valor}</p>
      {detalhe && <p className="mt-auto text-sm text-muted-foreground">{detalhe}</p>}
    </motion.div>
  )
}

const SELO: Record<StatusReserva, { rotulo: string; classe: string; icone: Icone }> = {
  pendente: { rotulo: "Aguardando aceite", classe: "bg-amber-50 text-amber-800 ring-amber-200", icone: Hourglass },
  confirmada: { rotulo: "Confirmada", classe: "bg-jade-gelo text-jade-tinta ring-jade-claro", icone: CircleCheck },
  concluida: { rotulo: "Realizada", classe: "bg-slate-100 text-slate-700 ring-slate-200", icone: Check },
  recusada: { rotulo: "Recusada", classe: "bg-red-50 text-red-700 ring-red-200", icone: Ban },
  cancelada: { rotulo: "Cancelada", classe: "bg-red-50 text-red-700 ring-red-200", icone: X },
}

export function Selo({ status, className }: { status: StatusReserva; className?: string }) {
  const s = SELO[status]
  return (
    <span className={cn("inline-flex h-6 shrink-0 items-center gap-1 rounded-full px-2.5 text-xs font-semibold whitespace-nowrap ring-1", s.classe, className)}>
      <s.icone className="size-3.5" aria-hidden />
      {s.rotulo}
    </span>
  )
}

export function ChipContato({ r, agora }: { r: Reserva; agora: Date }) {
  if (contatoLiberado(r, agora))
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-jade-tinta">
        <LockOpen className="size-3.5" aria-hidden /> Contato liberado
      </span>
    )
  const lib = liberaEm(r, agora)
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap text-muted-foreground">
      <Lock className="size-3.5" aria-hidden />
      {lib ? `Libera em ${duracao(+lib - +agora)}` : r.status === "pendente" ? "Após o aceite" : "Indisponível"}
    </span>
  )
}

const iniciais = (nome: string) =>
  nome
    .replace(/^(Dra?\.|Hospital|Centro|Clínica)\s+/i, "")
    .split(/\s+/)
    .filter((p) => p.length > 2)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase()

export function Avatar({ nome, className }: { nome: string; className?: string }) {
  return (
    <span aria-hidden className={cn("grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-jade-claro to-jade-brilho font-heading text-sm font-bold text-jade-noite", className)}>
      {iniciais(nome)}
    </span>
  )
}

export function Segmentos<T extends string>({ id, rotulo, itens, valor, mudar }: { id: string; rotulo: string; itens: { valor: T; rotulo: string; contador?: number }[]; valor: T; mudar: (v: T) => void }) {
  return (
    <div role="group" aria-label={rotulo} className="sem-barra inline-flex max-w-full gap-1 overflow-x-auto rounded-full bg-white p-1 sombra-card">
      {itens.map((it) => (
        <button
          key={it.valor}
          type="button"
          aria-pressed={valor === it.valor}
          onClick={() => mudar(it.valor)}
          className="relative h-9 shrink-0 rounded-full px-4 text-sm font-semibold whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground aria-pressed:text-white"
        >
          {valor === it.valor && <motion.span layoutId={`seg-${id}`} className="absolute inset-0 rounded-full bg-jade-escuro" transition={MOLA_RAPIDA} />}
          <span className="relative inline-flex items-center gap-1.5">
            {it.rotulo}
            {it.contador ? <span className={cn("rounded-full px-1.5 text-xs tabular", valor === it.valor ? "bg-white/20" : "bg-jade-gelo text-jade-tinta")}>{it.contador}</span> : null}
          </span>
        </button>
      ))}
    </div>
  )
}

export function Vazio({ icone: I, titulo, texto }: { icone: Icone; titulo: string; texto?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-6 py-10 text-center">
      <I className="size-7 text-jade-medio" aria-hidden />
      <p className="font-semibold">{titulo}</p>
      {texto && <p className="max-w-sm text-sm text-muted-foreground">{texto}</p>}
    </div>
  )
}

export function Info({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-muted-foreground">{rotulo}</dt>
      <dd className="mt-0.5 font-medium">{children}</dd>
    </div>
  )
}

// Rótulo, campo e mensagem de erro ligada por aria-describedby (o campo usa id e `erro-${id}`)
export function Campo({ id, rotulo, erro, className, children }: { id: string; rotulo: string; erro?: string; className?: string; children: ReactNode }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-semibold">
        {rotulo}
      </label>
      {children}
      {erro && (
        <p id={`erro-${id}`} className="text-sm font-medium text-destructive">
          {erro}
        </p>
      )}
    </div>
  )
}
