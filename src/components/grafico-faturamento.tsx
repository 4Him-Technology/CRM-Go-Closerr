import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { reais } from "@/data/espacos"
import type { serieMensal } from "@/lib/crm"
import { MOLA, MOLA_RAPIDA } from "@/lib/motion"
import { cn } from "@/lib/utils"

// Paleta conferida com o validador da skill dataviz (faturado #1f7a55, previsto #5cc395).
// O previsto tem contraste baixo com o branco, por isso há legenda, rótulo, tooltip e a tabela.
const COR = { faturado: "#1f7a55", previsto: "#5cc395" }
type Mes = ReturnType<typeof serieMensal>[number]

const compacto = (centavos: number) =>
  centavos === 0 ? "R$ 0" : `R$ ${(centavos / 100000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil`

// teto "redondo" do eixo com 4 divisões
function escala(max: number) {
  const bruto = max / 4
  const pot = 10 ** Math.floor(Math.log10(bruto || 1))
  const passo = [1, 2, 2.5, 5, 10].map((m) => m * pot).find((p) => p >= bruto) ?? bruto
  return [0, 1, 2, 3, 4].map((i) => i * passo)
}

export function GraficoFaturamento({ serie }: { serie: Mes[] }) {
  const [ativo, setAtivo] = useState<number | null>(null)
  const ticks = escala(Math.max(...serie.map((m) => m.faturado + m.previsto), 1))
  const teto = ticks[ticks.length - 1]
  const pct = (v: number) => `${(v / teto) * 100}%`

  return (
    <div>
      <ul className="mb-4 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground" aria-label="Legenda">
        <li className="flex items-center gap-2">
          <span className="size-3 rounded-[3px]" style={{ background: COR.faturado }} aria-hidden /> Faturado (locações realizadas)
        </li>
        <li className="flex items-center gap-2">
          <span className="size-3 rounded-[3px]" style={{ background: COR.previsto }} aria-hidden /> Previsto (reservas confirmadas)
        </li>
      </ul>

      <div className="relative flex h-[230px] pl-16">
        {/* eixo e grade: linhas finas e discretas */}
        {ticks.map((t) => (
          <div key={t} className="absolute right-0 left-16 border-t border-[#e5ede8]" style={{ bottom: pct(t) }} aria-hidden>
            <span className="absolute -top-2.5 -left-16 w-14 text-right text-[11px] text-muted-foreground tabular">{compacto(t)}</span>
          </div>
        ))}

        <div className="relative flex flex-1 justify-around">
          {serie.map((m, i) => {
            const total = m.faturado + m.previsto
            const borda = i === 0 ? "left-0" : i === serie.length - 1 ? "right-0" : "left-1/2 -translate-x-1/2"
            return (
              <button
                key={m.chave}
                type="button"
                onMouseEnter={() => setAtivo(i)}
                onMouseLeave={() => setAtivo(null)}
                onFocus={() => setAtivo(i)}
                onBlur={() => setAtivo(null)}
                aria-label={`${m.nome}: faturado ${reais(m.faturado)}, previsto ${reais(m.previsto)}`}
                className="group relative flex h-full flex-1 flex-col items-center justify-end rounded-lg outline-offset-0"
              >
                {/* área de toque maior que a barra */}
                <span className={cn("absolute inset-x-1 inset-y-0 rounded-lg transition-colors", ativo === i && "bg-jade-gelo/70")} aria-hidden />
                {m.atual && total > 0 && (
                  <span className="relative mb-1.5 text-xs font-semibold text-foreground tabular" aria-hidden>
                    {compacto(total)}
                  </span>
                )}
                <span className="relative flex w-6 flex-col justify-end gap-[2px]" style={{ height: pct(total) }} aria-hidden>
                  {m.previsto > 0 && (
                    <motion.span
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ ...MOLA, delay: 0.1 + i * 0.04 }}
                      className="block origin-bottom rounded-t-[4px]"
                      style={{ flexGrow: m.previsto, background: COR.previsto }}
                    />
                  )}
                  {m.faturado > 0 && (
                    <motion.span
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ ...MOLA, delay: i * 0.04 }}
                      className={cn("block origin-bottom", !m.previsto && "rounded-t-[4px]")}
                      style={{ flexGrow: m.faturado, background: COR.faturado }}
                    />
                  )}
                </span>
                <AnimatePresence>
                  {ativo === i && (
                    <motion.span
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, transition: { duration: 0.1 } }}
                      transition={MOLA_RAPIDA}
                      className={cn("pointer-events-none absolute top-0 z-10 w-max rounded-xl bg-jade-noite px-3 py-2 text-left text-xs text-white shadow-xl", borda)}
                      aria-hidden
                    >
                      <span className="mb-1 block font-semibold first-letter:uppercase">{m.nome}</span>
                      <span className="flex items-center gap-2 tabular">
                        <span className="size-2 rounded-full" style={{ background: COR.faturado }} /> Faturado {reais(m.faturado)}
                      </span>
                      <span className="flex items-center gap-2 tabular">
                        <span className="size-2 rounded-full" style={{ background: COR.previsto }} /> Previsto {reais(m.previsto)}
                      </span>
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            )
          })}
        </div>
      </div>
      <div className="flex pl-16" aria-hidden>
        {serie.map((m) => (
          <span key={m.chave} className={cn("flex-1 pt-2 text-center text-xs capitalize", m.atual ? "font-bold text-foreground" : "text-muted-foreground")}>
            {m.rotulo}
          </span>
        ))}
      </div>

      <details className="mt-4 text-sm">
        <summary className="cursor-pointer font-semibold text-jade-tinta">Ver em tabela</summary>
        <table className="mt-3 w-full text-left tabular">
          <thead className="text-xs text-muted-foreground">
            <tr>
              <th className="py-1.5 font-medium">Mês</th>
              <th className="py-1.5 text-right font-medium">Faturado</th>
              <th className="py-1.5 text-right font-medium">Previsto</th>
            </tr>
          </thead>
          <tbody>
            {serie.map((m) => (
              <tr key={m.chave} className="border-t border-border">
                <td className="py-1.5 first-letter:uppercase">{m.nome}</td>
                <td className="py-1.5 text-right">{reais(m.faturado)}</td>
                <td className="py-1.5 text-right">{reais(m.previsto)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  )
}
