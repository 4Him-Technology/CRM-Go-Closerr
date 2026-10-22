import { useState, type CSSProperties, type ReactNode } from "react"
import { AnimatePresence, motion } from "motion/react"
import { ArrowLeft, Bell, Building2, CalendarDays, ExternalLink, House, LayoutDashboard, MessageCircle, Receipt, Repeat, UserRound, Users } from "lucide-react"
import { Avatar } from "@/components/ui"
import { Marca } from "@/components/marca"
import { SITE } from "@/data/crm"
import { dataLonga } from "@/data/espacos"
import { useCrm } from "@/lib/crm-estado"
import { MOLA_RAPIDA } from "@/lib/motion"
import { cn } from "@/lib/utils"

export type Perfil = "hospital" | "medico"

const NAV = {
  hospital: [
    { rota: "hospital", rotulo: "Início", icone: LayoutDashboard },
    { rota: "hospital/cadastro", rotulo: "Cadastro", icone: Building2 },
    { rota: "hospital/locatarios", rotulo: "Locatários", icone: Users },
    { rota: "hospital/notificacoes", rotulo: "Notificações", icone: Bell },
    { rota: "hospital/agenda", rotulo: "Agenda", icone: CalendarDays },
  ],
  medico: [
    { rota: "medico", rotulo: "Início", icone: House },
    { rota: "medico/financeiro", rotulo: "Financeiro", icone: Receipt },
    { rota: "medico/contato", rotulo: "Fale conosco", icone: MessageCircle },
    { rota: "medico/cadastro", rotulo: "Cadastro", icone: UserRound },
  ],
}

// Fundo escuro da identidade: verde-noite com brilhos jade e a grade fina das peças de referência
export const FUNDO_ESCURO =
  "bg-jade-noite bg-[radial-gradient(110%_55%_at_0%_0%,rgb(92_195_149/0.30),transparent_60%),radial-gradient(90%_50%_at_100%_100%,rgb(40_135_96/0.40),transparent_65%)]"
export const GRADE = "bg-[linear-gradient(rgb(255_255_255/0.045)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.045)_1px,transparent_1px)] bg-[size:36px_36px]"

/* ---------- variações do menu lateral (protótipo: o cliente escolhe uma e as outras saem) ---------- */
const VARIACOES = [
  { id: "atual", nome: "Atual", largura: "272px" },
  { id: "solido", nome: "Verde sólido", largura: "280px" },
  { id: "claro", nome: "Claro", largura: "280px" },
  { id: "flutuante", nome: "Flutuante", largura: "284px" },
  { id: "trilho", nome: "Trilho de ícones", largura: "92px" },
  { id: "suave", nome: "Degradê suave", largura: "272px" },
] as const
type Variacao = (typeof VARIACOES)[number]["id"]

const CHAVE = "gocloserr-menu"
function useVariacao() {
  const [v, setV] = useState<Variacao>(() => {
    try {
      // ?menu=claro no endereço abre direto numa variação (útil para mandar o link)
      const salvo = new URLSearchParams(location.search).get("menu") ?? localStorage.getItem(CHAVE)
      return VARIACOES.find((x) => x.id === salvo)?.id ?? "atual"
    } catch {
      return "atual"
    }
  })
  const mudar = (n: Variacao) => {
    setV(n)
    try {
      localStorage.setItem(CHAVE, n)
    } catch {
      // sem armazenamento (aba privada): a escolha vale só até recarregar
    }
  }
  return [v, mudar] as const
}

// Faixa de luz que passa pelo menu e volta (animate-lanterna em index.css). -z-10: fica atrás do texto, dentro do menu
const LANTERNA = (
  <span aria-hidden className="pointer-events-none absolute inset-y-[-25%] left-0 -z-10 w-1/2 animate-lanterna bg-[linear-gradient(90deg,transparent,rgb(183_229_186/0.09)_30%,rgb(220_255_226/0.24)_50%,rgb(183_229_186/0.09)_70%,transparent)] blur-lg" />
)

type Estilo = { item: string; ativo: string; marcador?: string; contador: string }
const ESTILO: Record<Variacao | "movel", Estilo> = {
  atual: { item: "h-11 gap-3 rounded-xl px-3 text-[15px] text-white/70 hover:text-white aria-[current=page]:text-white", ativo: "rounded-xl bg-white/10 ring-1 ring-white/15", marcador: "absolute top-2.5 bottom-2.5 left-0 w-[3px] rounded-full bg-marca", contador: "relative ml-auto bg-marca text-jade-noite" },
  solido: { item: "h-10 gap-3 rounded-lg px-3 text-[15px] text-white/65 hover:bg-white/[0.04] hover:text-white aria-[current=page]:text-white [&[aria-current=page]_svg]:text-marca", ativo: "rounded-lg bg-white/[0.08]", contador: "relative ml-auto bg-white/15 text-white" },
  claro: { item: "h-10 gap-3 rounded-lg px-3 text-[15px] text-muted-foreground hover:bg-jade-gelo/60 hover:text-foreground aria-[current=page]:text-jade-escuro [&[aria-current=page]_svg]:text-jade-tinta", ativo: "rounded-lg bg-jade-gelo", contador: "relative ml-auto bg-jade-escuro text-white" },
  flutuante: { item: "h-11 gap-3 rounded-full px-4 text-[15px] text-white/75 hover:text-white aria-[current=page]:text-jade-escuro", ativo: "rounded-full bg-white", contador: "relative ml-auto bg-marca text-jade-noite" },
  trilho: { item: "w-full flex-col justify-center gap-1 rounded-xl py-2.5 text-[11px] text-white/65 hover:text-white aria-[current=page]:text-white [&[aria-current=page]_svg]:text-marca", ativo: "rounded-xl bg-white/10", contador: "absolute top-1 right-2.5 bg-marca text-jade-noite" },
  suave: { item: "h-11 gap-3 rounded-xl px-3 text-[15px] text-white/70 hover:text-white aria-[current=page]:text-white", ativo: "rounded-xl bg-white/[0.08]", marcador: "absolute top-3 bottom-3 left-0 w-[3px] rounded-full bg-marca", contador: "relative ml-auto bg-marca text-jade-noite" },
  movel: { item: "h-9 gap-3 rounded-xl px-3 text-sm text-white/70 hover:text-white aria-[current=page]:text-white", ativo: "rounded-xl bg-white/10 ring-1 ring-white/15", contador: "relative ml-auto bg-marca text-jade-noite" },
}

function Navegacao({ perfil, rota, layout, estilo, horizontal }: { perfil: Perfil; rota: string; layout: string; estilo: Estilo; horizontal?: boolean }) {
  const { naoLidas } = useCrm()
  return (
    <nav aria-label="Painel" className={cn(horizontal ? "sem-barra -mx-1 flex gap-1 overflow-x-auto px-1" : "flex flex-col gap-1")}>
      {NAV[perfil].map((n) => {
        const ativo = rota === n.rota
        const contador = n.rota.endsWith("notificacoes") ? naoLidas : 0
        return (
          <a key={n.rota} href={`#${n.rota}`} aria-current={ativo ? "page" : undefined} className={cn("relative flex shrink-0 items-center font-semibold whitespace-nowrap transition-colors", estilo.item)}>
            {ativo && (
              <motion.span layoutId={layout} className={cn("absolute inset-0", estilo.ativo)} transition={MOLA_RAPIDA}>
                {estilo.marcador && <span className={estilo.marcador} />}
              </motion.span>
            )}
            <n.icone className="relative size-[18px] transition-colors" aria-hidden />
            <span className="relative">{n.rotulo}</span>
            {contador > 0 && (
              <span className={cn("grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-xs font-bold tabular", estilo.contador)}>
                {contador}
                <span className="sr-only"> não lidas</span>
              </span>
            )}
          </a>
        )
      })}
    </nav>
  )
}

type Conta = { nome: string; sub: string; papel: string }

// Links da conta: trocar de perfil (volta à entrada) e ir ao site público
function Saidas({ classe, soIcone }: { classe: string; soIcone?: boolean }) {
  return (
    <>
      <a href="#" className={classe} title="Trocar perfil" aria-label={soIcone ? "Trocar perfil" : undefined}>
        <Repeat className="size-3.5 shrink-0" aria-hidden />
        {!soIcone && "Trocar perfil"}
      </a>
      <a href={SITE} className={classe} title="Ver o site" aria-label={soIcone ? "Ver o site" : undefined}>
        {soIcone ? <ExternalLink className="size-3.5 shrink-0" aria-hidden /> : <ArrowLeft className="size-3.5 shrink-0" aria-hidden />}
        {!soIcone && "Ver o site"}
      </a>
    </>
  )
}

function Lateral({ v, perfil, rota, conta }: { v: Variacao; perfil: Perfil; rota: string; conta: Conta }) {
  const nav = <Navegacao perfil={perfil} rota={rota} layout={`crm-nav-${v}`} estilo={ESTILO[v]} />
  const logo = (classe = "text-white", tamanho = 30) => (
    <a href="#" aria-label="Gocloserr, trocar de perfil" className="self-start rounded-lg px-2">
      <Marca className={classe} tamanho={tamanho} />
    </a>
  )
  const pessoa = (sub: string) => (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar nome={conta.nome} />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{conta.nome}</p>
        <p className={cn("truncate text-xs", sub)}>{conta.sub}</p>
      </div>
    </div>
  )
  const base = "sticky top-0 hidden h-dvh lg:flex"

  if (v === "solido")
    return (
      <aside className={cn(base, "flex-col overflow-hidden bg-jade-noite text-white [--ring:#b7e5ba]")}>
        {LANTERNA}
        <div className="flex flex-1 flex-col gap-10 overflow-y-auto px-3 py-6">
          {logo()}
          {nav}
          <div className="mt-auto flex items-center justify-between gap-2 border-t border-white/10 pt-4">
            {pessoa("text-white/55")}
            <div className="flex shrink-0">
              <Saidas soIcone classe="grid size-7 place-items-center rounded-lg text-white/60 transition-colors hover:bg-white/10 hover:text-white" />
            </div>
          </div>
        </div>
      </aside>
    )

  if (v === "claro")
    return (
      <aside className={cn(base, "flex-col border-r border-border bg-white")}>
        <div className="flex flex-1 flex-col gap-8 overflow-y-auto px-3 py-6">
          {logo("", 30)}
          <div className="flex flex-col gap-2">
            <p className="px-3 text-xs font-semibold text-muted-foreground">{conta.papel}</p>
            {nav}
          </div>
          <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-4">
            {pessoa("text-muted-foreground")}
            <div className="flex shrink-0">
              <Saidas soIcone classe="grid size-7 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-jade-gelo hover:text-foreground" />
            </div>
          </div>
        </div>
      </aside>
    )

  if (v === "flutuante")
    return (
      <aside className={cn(base, "p-3")}>
        <div className="relative isolate flex flex-1 flex-col gap-8 overflow-hidden rounded-[28px] bg-jade-escuro px-3 py-6 text-white [--ring:#b7e5ba]">
          {LANTERNA}
          {logo()}
          <div className="flex flex-col gap-3">
            <p className="px-4 text-xs font-medium text-white/55">{conta.papel}</p>
            {nav}
          </div>
          <div className="mt-auto flex flex-col gap-3 rounded-2xl bg-black/15 p-3">
            {pessoa("text-white/60")}
            <div className="flex gap-4 px-1 text-xs font-semibold text-white/70">
              <Saidas classe="inline-flex items-center gap-1.5 transition-colors hover:text-white" />
            </div>
          </div>
        </div>
      </aside>
    )

  if (v === "trilho")
    return (
      <aside className={cn(base, "flex-col items-center gap-8 overflow-hidden bg-jade-noite px-2 py-6 text-white [--ring:#b7e5ba]")}>
        {LANTERNA}
        <a href="#" aria-label="Gocloserr, trocar de perfil" className="rounded-lg">
          <Marca soSimbolo tamanho={28} />
        </a>
        <div className="w-full">{nav}</div>
        <div className="mt-auto flex flex-col items-center gap-2">
          <span title={`${conta.nome}, ${conta.sub}`}>
            <Avatar nome={conta.nome} />
          </span>
          <Saidas soIcone classe="grid size-8 place-items-center rounded-lg text-white/60 transition-colors hover:bg-white/10 hover:text-white" />
        </div>
      </aside>
    )

  // atual e degradê suave: o mesmo fundo; o suave tira a grade e a caixa da conta
  const suave = v === "suave"
  return (
    <aside className={cn(base, "flex-col overflow-hidden text-white [--ring:#b7e5ba]", FUNDO_ESCURO)}>
      {LANTERNA}
      {!suave && <div className={cn("pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_70%)]", GRADE)} aria-hidden />}
      <div className="relative flex flex-1 flex-col gap-8 overflow-y-auto px-4 py-6">
        {logo()}
        <div className="flex flex-col gap-3">
          <p className={cn("px-3", suave ? "text-xs font-medium text-white/50" : "text-[11px] font-semibold tracking-[0.18em] text-jade-claro/80 uppercase")}>{conta.papel}</p>
          {nav}
        </div>
        {suave ? (
          <div className="mt-auto flex flex-col gap-3 border-t border-white/10 px-2 pt-4">
            {pessoa("text-white/60")}
            <div className="flex gap-4 text-xs font-semibold text-white/65">
              <Saidas classe="inline-flex items-center gap-1.5 transition-colors hover:text-white" />
            </div>
          </div>
        ) : (
          <div className="mt-auto flex flex-col gap-3 rounded-2xl bg-white/[0.06] p-3 ring-1 ring-white/10">
            {pessoa("text-white/65")}
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              <Saidas classe="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-white/10 transition-colors hover:bg-white/15" />
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}

export function MolduraCrm({ perfil, rota, children }: { perfil: Perfil; rota: string; children: ReactNode }) {
  const { centro, medico, naoLidas, agora, aviso } = useCrm()
  const [v, setV] = useVariacao()
  const conta = perfil === "hospital" ? { nome: centro.nome, sub: `${centro.cidade}, ${centro.uf}`, papel: "Painel do hospital" } : { nome: medico.nome, sub: `CRM-${medico.crmUf} ${medico.crm}`, papel: "Painel do médico" }
  const largura = VARIACOES.find((x) => x.id === v)!.largura

  return (
    <div className="min-h-dvh bg-jade-gelo text-foreground lg:grid lg:grid-cols-[var(--lateral)_minmax(0,1fr)]" style={{ "--lateral": largura } as CSSProperties}>
      <a href="#conteudo-crm" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:font-semibold">
        Pular para o conteúdo
      </a>

      {/* menu lateral (computador) */}
      <Lateral v={v} perfil={perfil} rota={rota} conta={conta} />

      <div className="min-w-0">
        {/* topo do celular e tablet */}
        <header className={cn("sticky top-0 z-30 flex flex-col gap-3 px-4 pt-3 pb-2 text-white [--ring:#b7e5ba] lg:hidden", FUNDO_ESCURO)}>
          <div className="flex items-center justify-between gap-3">
            <a href="#" aria-label="Gocloserr, trocar de perfil" className="rounded-lg">
              <Marca className="text-[19px] text-white" tamanho={26} />
            </a>
            <span className="truncate text-xs font-semibold text-jade-claro">{conta.papel}</span>
          </div>
          <Navegacao perfil={perfil} rota={rota} layout="crm-nav-movel" estilo={ESTILO.movel} horizontal />
        </header>

        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-3 px-4 pt-4 text-sm text-muted-foreground md:px-8 md:pt-6">
          <p className="inline-flex items-center gap-2">
            <span className="size-2 rounded-full bg-amber-500" aria-hidden />
            Protótipo com dados fictícios. Nenhuma mensagem é enviada.
          </p>
          <div className="flex items-center gap-3">
            <span className="hidden first-letter:uppercase md:inline-block">{dataLonga(agora)}</span>
            {perfil === "hospital" && (
              <a
                href="#hospital/notificacoes"
                aria-label={`Notificações, ${naoLidas} não lidas`}
                className="relative grid size-10 place-items-center rounded-full bg-white text-foreground sombra-card transition-shadow hover:sombra-card-forte"
              >
                <Bell className="size-[18px]" aria-hidden />
                {naoLidas > 0 && <span className="absolute -top-0.5 -right-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-jade-escuro px-1 text-[11px] font-bold text-white tabular">{naoLidas}</span>}
              </a>
            )}
          </div>
        </div>

        <AnimatePresence mode="wait" initial={false} onExitComplete={() => window.scrollTo({ top: 0, behavior: "instant" })}>
          <motion.main
            key={rota}
            id="conteudo-crm"
            initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -4, filter: "blur(4px)", transition: { duration: 0.16, ease: [0.4, 0, 1, 1] } }}
            transition={{ type: "spring", duration: 0.45, bounce: 0 }}
            className="mx-auto max-w-[1240px] px-4 pt-6 pb-24 md:px-8"
          >
            {children}
          </motion.main>
        </AnimatePresence>
      </div>

      {/* seletor das variações do menu: só no protótipo e só onde o menu lateral aparece */}
      <div role="group" aria-label="Variação do menu lateral" className="fixed bottom-5 z-40 hidden items-center gap-1 rounded-full bg-white p-1.5 sombra-card-forte lg:flex" style={{ left: "calc(var(--lateral) + 24px)" }}>
        <span className="px-2 text-xs font-semibold text-muted-foreground">Menu lateral</span>
        {VARIACOES.map((x, i) => (
          <button
            key={x.id}
            type="button"
            aria-pressed={v === x.id}
            onClick={() => setV(x.id)}
            className="h-8 rounded-full px-3 text-xs font-semibold whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground aria-pressed:bg-jade-escuro aria-pressed:text-white"
          >
            {i === 0 ? x.nome : `${i}. ${x.nome}`}
          </button>
        ))}
      </div>

      {/* avisos curtos (aceite, cadastro salvo, contato liberado) */}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex justify-center md:inset-x-auto md:right-6 md:bottom-6">
        <AnimatePresence>
          {aviso && (
            <motion.p
              key={aviso.id}
              initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: 6, transition: { duration: 0.15 } }}
              transition={MOLA_RAPIDA}
              className="pointer-events-auto max-w-md rounded-2xl bg-jade-noite px-5 py-3.5 text-sm font-medium text-white shadow-2xl ring-1 ring-white/10"
            >
              {aviso.texto}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
