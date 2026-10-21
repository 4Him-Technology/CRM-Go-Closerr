import { motion } from "motion/react"
import { ArrowLeft, ArrowRight, Building2, Stethoscope } from "lucide-react"
import { FUNDO_ESCURO, GRADE } from "@/components/moldura"
import { Marca } from "@/components/marca"
import { SITE } from "@/data/crm"
import { ENTRAR, atraso } from "@/lib/motion"
import { cn } from "@/lib/utils"

const PERFIS = [
  { rota: "hospital", icone: Building2, titulo: "Sou hospital ou clínica", texto: "Agenda do centro cirúrgico, solicitações para aceitar, locatários, faturamento e cadastro das salas." },
  { rota: "medico", icone: Stethoscope, titulo: "Sou médico", texto: "Próximas cirurgias, detalhes de cada reserva, relatório de locações com nota fiscal e atendimento." },
]

// Mesma divisão do painel: faixa verde-noite da barra lateral à esquerda e conteúdo claro com cartões brancos à direita
export function Entrar() {
  return (
    <main id="conteudo-crm" className="min-h-dvh bg-jade-gelo text-foreground lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <section className={cn("relative flex flex-col justify-between gap-10 overflow-hidden px-6 py-8 text-white [--ring:#b7e5ba] md:px-12 md:py-12 lg:sticky lg:top-0 lg:h-dvh", FUNDO_ESCURO)}>
        <div className={cn("pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_70%)]", GRADE)} aria-hidden />
        <motion.div {...ENTRAR} className="relative">
          <Marca className="text-[24px] text-white" tamanho={34} />
        </motion.div>
        <motion.div {...ENTRAR} transition={atraso(1)} className="relative flex max-w-md flex-col gap-4">
          <p className="text-[11px] font-semibold tracking-[0.18em] text-jade-claro/80 uppercase">Painel de gestão da operação</p>
          <h1 tabIndex={-1} data-foco-proprio className="text-3xl font-bold md:text-[40px] md:leading-[1.1]">
            Centro cirúrgico, reservas e faturamento em um só lugar
          </h1>
          <p className="text-white/70">Para hospitais e clínicas que alugam salas e para os médicos que reservam.</p>
        </motion.div>
        <a href={SITE} className="relative inline-flex items-center gap-2 self-start rounded-full text-sm font-semibold text-white/75 transition-colors hover:text-white">
          <ArrowLeft className="size-4" aria-hidden /> Ir para o site Gocloserr
        </a>
      </section>

      <section aria-labelledby="perfis" className="flex items-center px-4 py-10 md:px-12 md:py-16">
        <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
          <motion.div {...ENTRAR} transition={atraso(2)}>
            <h2 id="perfis" className="text-2xl font-bold">
              Como você quer entrar?
            </h2>
            <p className="mt-1 text-muted-foreground">Protótipo sem login: os dois perfis usam dados fictícios.</p>
          </motion.div>
          <ul className="flex flex-col gap-3">
            {PERFIS.map((p, i) => (
              <motion.li key={p.rota} {...ENTRAR} transition={atraso(i + 3)}>
                <a href={`#${p.rota}`} className="group flex items-start gap-4 rounded-2xl md:items-center bg-white p-5 sombra-card transition-shadow hover:sombra-card-forte md:p-6">
                  <span className="grid size-12 shrink-0 place-items-center rounded-full bg-jade-gelo text-jade-tinta">
                    <p.icone className="size-[22px]" aria-hidden />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="font-heading text-lg font-bold">{p.titulo}</span>
                    <span className="text-sm leading-relaxed text-muted-foreground">{p.texto}</span>
                  </span>
                  <ArrowRight className="size-5 shrink-0 text-jade-tinta transition-transform group-hover:translate-x-1" aria-hidden />
                </a>
              </motion.li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  )
}
