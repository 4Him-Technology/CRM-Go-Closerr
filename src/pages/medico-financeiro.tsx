import { useRef, useState } from "react"
import { motion } from "motion/react"
import { CalendarClock, Download, FileText, Printer, Receipt, Wallet, X } from "lucide-react"
import { turnoPt } from "@/components/reserva"
import { BOTAO_PRIMARIO, BOTAO_SECUNDARIO, Kpi, Segmentos, Topo, Vazio } from "@/components/ui"
import type { Reserva } from "@/data/crm"
import { ESPACO, dataCurta, deChave, reais, rng } from "@/data/espacos"
import { dig } from "@/lib/validacao"
import { futura, inicioDe, juntar, minuscula, realizada } from "@/lib/crm"
import { useCrm, type CadastroMedico } from "@/lib/crm-estado"
import { ENTRAR } from "@/lib/motion"
import { cn } from "@/lib/utils"

type Periodo = "3" | "6" | "12"
const dataBr = (d: Date) => d.toLocaleDateString("pt-BR")

function pagamento(r: Reserva, agora: Date) {
  if (r.status === "cancelada" || r.status === "recusada") return { rotulo: "Estornado", classe: "text-red-700" }
  if (realizada(r, agora)) return { rotulo: "Pago", classe: "text-jade-tinta" }
  if (r.status === "pendente") return { rotulo: "Pré-autorizado", classe: "text-amber-800" }
  return { rotulo: "Cobrança no dia", classe: "text-muted-foreground" }
}

// Dados da nota fictícios e determinísticos a partir do código da reserva
function nota(r: Reserva) {
  const x = rng(r.id)
  const n = () => Math.floor(x() * 10)
  return {
    numero: `${deChave(r.data).getFullYear()}${String(Math.floor(x() * 1e6)).padStart(6, "0")}`,
    verificacao: Array.from({ length: 8 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(x() * 32)]).join(""),
    cnpj: `${n()}${n()}.${n()}${n()}${n()}.${n()}${n()}${n()}/0001-${n()}${n()}`,
    emissao: new Date(+inicioDe(r) + 864e5),
  }
}

// Mostra CNPJ inteiro (empresa); de CPF, só o miolo, como nas notas eletrônicas
const docNota = (doc: string) => {
  const d = dig(doc)
  return d.length === 11 ? `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**` : doc
}

function baixarCsv(linhas: Reserva[], agora: Date) {
  const cab = ["Código", "Data", "Turno", "Centro cirúrgico", "Procedimento", "Valor (R$)", "Pagamento"]
  const csv = [cab, ...linhas.map((r) => [r.id, dataBr(deChave(r.data)), turnoPt(r), ESPACO[r.espacoId].nome, r.procedimento, (r.valor / 100).toFixed(2).replace(".", ","), pagamento(r, agora).rotulo])]
    .map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"))
    .join("\r\n")
  // BOM para o Excel abrir com acentos
  const url = URL.createObjectURL(new Blob([String.fromCharCode(0xfeff) + csv], { type: "text/csv;charset=utf-8" }))
  const a = Object.assign(document.createElement("a"), { href: url, download: "locacoes-gocloserr.csv" })
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function MedicoFinanceiro() {
  const { agora, daMedica, medico } = useCrm()
  const [periodo, setPeriodo] = useState<Periodo>("6")
  const [aberta, setAberta] = useState<Reserva | null>(null)
  const dialogo = useRef<HTMLDialogElement>(null)

  const desde = new Date(agora.getFullYear(), agora.getMonth() - Number(periodo), agora.getDate())
  const linhas = daMedica.filter((r) => inicioDe(r) >= desde).sort((a, b) => +inicioDe(b) - +inicioDe(a))
  const pagas = linhas.filter((r) => realizada(r, agora))
  const aPagar = linhas.filter((r) => r.status === "confirmada" && futura(r, agora))
  const soma = (rs: Reserva[]) => rs.reduce((s, r) => s + r.valor, 0)

  const abrir = (r: Reserva) => {
    setAberta(r)
    dialogo.current?.showModal()
  }

  return (
    <>
      <Topo
        titulo="Financeiro"
        subtitulo="Relatório das suas locações, pagamentos e notas fiscais."
        acoes={
          <button type="button" className={BOTAO_SECUNDARIO} onClick={() => baixarCsv(linhas, agora)} disabled={!linhas.length}>
            <Download aria-hidden /> Exportar planilha
          </button>
        }
      />

      <div className="mb-4">
        <Segmentos
          id="periodo"
          rotulo="Período do relatório"
          valor={periodo}
          mudar={setPeriodo}
          itens={[
            { valor: "3", rotulo: "Últimos 3 meses" },
            { valor: "6", rotulo: "6 meses" },
            { valor: "12", rotulo: "12 meses" },
          ]}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi icone={Wallet} rotulo="Total pago no período" valor={reais(soma(pagas))} detalhe={`${pagas.length} ${pagas.length === 1 ? "locação realizada" : "locações realizadas"}`} />
        <Kpi i={1} icone={CalendarClock} rotulo="A pagar" valor={reais(soma(aPagar))} detalhe={`${aPagar.length} ${aPagar.length === 1 ? "reserva confirmada" : "reservas confirmadas"}, cobradas no dia`} />
        <Kpi i={2} icone={Receipt} rotulo="Notas fiscais emitidas" valor={pagas.length} detalhe="Emitidas pelo hospital um dia após a cirurgia" />
      </div>

      <motion.section {...ENTRAR} aria-labelledby="relatorio" className="mt-4 rounded-2xl bg-white p-2 sombra-card md:p-3">
        <h2 id="relatorio" className="px-3 pt-3 pb-2 text-base font-bold">
          Relatório de locações
        </h2>
        {linhas.length === 0 ? (
          <div className="p-3">
            <Vazio icone={Receipt} titulo="Nenhuma locação neste período" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="px-3 py-2 font-medium">Data</th>
                  <th scope="col" className="px-3 py-2 font-medium">Centro cirúrgico</th>
                  <th scope="col" className="px-3 py-2 font-medium">Procedimento</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">Valor</th>
                  <th scope="col" className="px-3 py-2 font-medium">Pagamento</th>
                  <th scope="col" className="px-3 py-2 font-medium">Nota fiscal</th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((r) => {
                  const p = pagamento(r, agora)
                  const temNota = realizada(r, agora)
                  return (
                    <tr key={r.id} className="border-t border-border transition-colors hover:bg-jade-gelo/60">
                      <td className="px-3 py-3">
                        <span className="block font-semibold first-letter:uppercase">{dataCurta(deChave(r.data))}</span>
                        <span className="block text-xs text-muted-foreground">{turnoPt(r)}</span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="block font-medium">{ESPACO[r.espacoId].nome}</span>
                        <span className="block text-xs text-muted-foreground">
                          {r.sala} · {r.id}
                        </span>
                      </td>
                      <td className="px-3 py-3">{r.procedimento}</td>
                      <td className={cn("px-3 py-3 text-right font-semibold tabular", (r.status === "cancelada" || r.status === "recusada") && "text-muted-foreground line-through")}>{reais(r.valor)}</td>
                      <td className={cn("px-3 py-3 font-semibold", p.classe)}>{p.rotulo}</td>
                      <td className="px-3 py-3">
                        {temNota ? (
                          <button type="button" onClick={() => abrir(r)} className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 font-semibold text-jade-tinta hover:bg-jade-gelo">
                            <FileText className="size-4" aria-hidden /> Ver nota
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground">{r.status === "cancelada" || r.status === "recusada" ? "Sem nota" : "Após a cirurgia"}</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.section>

      <dialog ref={dialogo} onClose={() => setAberta(null)} aria-labelledby="nf-titulo" className="nota-fiscal m-auto w-[min(640px,calc(100vw-2rem))] rounded-2xl bg-white p-0 text-foreground shadow-2xl backdrop:bg-jade-noite/60 backdrop:backdrop-blur-sm">
        {aberta && <Nota r={aberta} medico={medico} fechar={() => dialogo.current?.close()} />}
      </dialog>
    </>
  )
}

function Nota({ r, medico, fechar }: { r: Reserva; medico: CadastroMedico; fechar: () => void }) {
  const nf = nota(r)
  const e = ESPACO[r.espacoId]
  const iss = Math.round(r.valor * 0.05)
  return (
    <div className="flex flex-col gap-5 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-jade-tinta uppercase">Nota fiscal de serviço eletrônica (exemplo)</p>
          <h2 id="nf-titulo" className="mt-1 text-xl font-bold">
            NFS-e nº {nf.numero}
          </h2>
          <p className="text-sm text-muted-foreground">
            Emitida em {dataBr(nf.emissao)} · código de verificação {nf.verificacao}
          </p>
        </div>
        <button type="button" onClick={fechar} aria-label="Fechar nota" className="grid size-9 shrink-0 place-items-center rounded-full hover:bg-jade-gelo print:hidden">
          <X className="size-4" aria-hidden />
        </button>
      </div>
      <div className="grid gap-4 text-sm sm:grid-cols-2">
        <div className="rounded-xl bg-jade-gelo p-3">
          <p className="text-xs font-semibold text-muted-foreground">Prestador</p>
          <p className="font-semibold">{e.nome}</p>
          <p>CNPJ {nf.cnpj} (fictício)</p>
          <p className="text-muted-foreground">
            {e.endereco}, {e.cidade} - {e.uf}
          </p>
        </div>
        <div className="rounded-xl bg-jade-gelo p-3">
          <p className="text-xs font-semibold text-muted-foreground">Tomador</p>
          <p className="font-semibold">{medico.nome}</p>
          <p>
            {dig(medico.doc).length === 11 ? "CPF" : "CNPJ"} {docNota(medico.doc)}
          </p>
          <p className="text-muted-foreground">
            CRM-{medico.crmUf} {medico.crm}
          </p>
        </div>
      </div>
      <div className="text-sm">
        <p className="text-xs font-semibold text-muted-foreground">Discriminação do serviço</p>
        <p className="mt-1">
          Locação de {r.sala.toLowerCase()} do centro cirúrgico, turno {turnoPt(r).toLowerCase()}, em {dataBr(deChave(r.data))}, para {minuscula(r.procedimento)}. Inclui: {juntar(r.necessidades)}. Reserva {r.id} pela Gocloserr.
        </p>
      </div>
      <dl className="grid grid-cols-2 gap-y-1.5 border-t border-border pt-4 text-sm tabular">
        <dt className="text-muted-foreground">Valor dos serviços</dt>
        <dd className="text-right font-semibold">{reais(r.valor)}</dd>
        <dt className="text-muted-foreground">ISS incluso (5%, exemplo)</dt>
        <dd className="text-right">{reais(iss)}</dd>
        <dt className="font-semibold">Valor líquido</dt>
        <dd className="text-right font-heading text-lg font-bold">{reais(r.valor)}</dd>
      </dl>
      <div className="flex flex-wrap justify-end gap-2 print:hidden">
        <button type="button" onClick={fechar} className={BOTAO_SECUNDARIO}>
          Fechar
        </button>
        <button type="button" onClick={() => print()} className={BOTAO_PRIMARIO}>
          <Printer aria-hidden /> Imprimir ou salvar PDF
        </button>
      </div>
    </div>
  )
}
