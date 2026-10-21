import type { ReactNode } from "react"
import { AnimatePresence, motion } from "motion/react"
import { ArrowLeft, Bell, Building2, CalendarDays, House, LayoutDashboard, MessageCircle, Receipt, Repeat, UserRound, Users } from "lucide-react"
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

function Navegacao({ perfil, rota, layout, horizontal }: { perfil: Perfil; rota: string; layout: string; horizontal?: boolean }) {
  const { naoLidas } = useCrm()
  return (
    <nav aria-label="Painel" className={cn(horizontal ? "sem-barra -mx-1 flex gap-1 overflow-x-auto px-1" : "flex flex-col gap-1")}>
      {NAV[perfil].map((n) => {
        const ativo = rota === n.rota
        const contador = n.rota.endsWith("notificacoes") ? naoLidas : 0
        return (
          <a
            key={n.rota}
            href={`#${n.rota}`}
            aria-current={ativo ? "page" : undefined}
            className={cn(
              "relative flex shrink-0 items-center gap-3 rounded-xl font-semibold whitespace-nowrap text-white/70 transition-colors hover:text-white aria-[current=page]:text-white",
              horizontal ? "h-9 px-3 text-sm" : "h-11 px-3 text-[15px]"
            )}
          >
            {ativo && (
              <motion.span layoutId={layout} className="absolute inset-0 rounded-xl bg-white/10 ring-1 ring-white/15" transition={MOLA_RAPIDA}>
                {!horizontal && <span className="absolute top-2.5 bottom-2.5 left-0 w-[3px] rounded-full bg-marca" />}
              </motion.span>
            )}
            <n.icone className="relative size-[18px]" aria-hidden />
            <span className="relative">{n.rotulo}</span>
            {contador > 0 && (
              <span className="relative ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-marca px-1.5 text-xs font-bold text-jade-noite tabular">
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

export function MolduraCrm({ perfil, rota, children }: { perfil: Perfil; rota: string; children: ReactNode }) {
  const { centro, medico, naoLidas, agora, aviso } = useCrm()
  const conta = perfil === "hospital" ? { nome: centro.nome, sub: `${centro.cidade}, ${centro.uf}`, papel: "Painel do hospital" } : { nome: medico.nome, sub: `CRM-${medico.crmUf} ${medico.crm}`, papel: "Painel do médico" }

  return (
    <div className="min-h-dvh bg-jade-gelo text-foreground lg:grid lg:grid-cols-[272px_minmax(0,1fr)]">
      <a href="#conteudo-crm" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:font-semibold">
        Pular para o conteúdo
      </a>

      {/* menu lateral (computador) */}
      <aside className={cn("sticky top-0 hidden h-dvh flex-col overflow-hidden text-white [--ring:#b7e5ba] lg:flex", FUNDO_ESCURO)}>
        <div className={cn("pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_70%)]", GRADE)} aria-hidden />
        <div className="relative flex flex-1 flex-col gap-8 overflow-y-auto px-4 py-6">
          <a href="#" aria-label="Gocloserr, trocar de perfil" className="self-start rounded-lg px-2">
            <Marca className="text-white" tamanho={30} />
          </a>
          <div className="flex flex-col gap-3">
            <p className="px-3 text-[11px] font-semibold tracking-[0.18em] text-jade-claro/80 uppercase">{conta.papel}</p>
            <Navegacao perfil={perfil} rota={rota} layout="crm-nav" />
          </div>
          <div className="mt-auto flex flex-col gap-3 rounded-2xl bg-white/[0.06] p-3 ring-1 ring-white/10">
            <div className="flex items-center gap-3">
              <Avatar nome={conta.nome} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{conta.nome}</p>
                <p className="truncate text-xs text-white/65">{conta.sub}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              <a href="#" className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-white/10 transition-colors hover:bg-white/15">
                <Repeat className="size-3.5" aria-hidden /> Trocar perfil
              </a>
              <a href={SITE} className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-white/10 transition-colors hover:bg-white/15">
                <ArrowLeft className="size-3.5" aria-hidden /> Ver o site
              </a>
            </div>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        {/* topo do celular e tablet */}
        <header className={cn("sticky top-0 z-30 flex flex-col gap-3 px-4 pt-3 pb-2 text-white [--ring:#b7e5ba] lg:hidden", FUNDO_ESCURO)}>
          <div className="flex items-center justify-between gap-3">
            <a href="#" aria-label="Gocloserr, trocar de perfil" className="rounded-lg">
              <Marca className="text-[19px] text-white" tamanho={26} />
            </a>
            <span className="truncate text-xs font-semibold text-jade-claro">{conta.papel}</span>
          </div>
          <Navegacao perfil={perfil} rota={rota} layout="crm-nav-movel" horizontal />
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
            className="mx-auto max-w-[1240px] px-4 pt-6 pb-16 md:px-8"
          >
            {children}
          </motion.main>
        </AnimatePresence>
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
