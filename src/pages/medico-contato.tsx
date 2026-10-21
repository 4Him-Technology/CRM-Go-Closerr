import { useState, type FormEvent } from "react"
import { AnimatePresence, motion } from "motion/react"
import { CircleCheck, Clock, Mail, MessageCircle, Phone, Send } from "lucide-react"
import { BOTAO_PRIMARIO, BOTAO_SECUNDARIO, CAMPO, Campo, Cartao, Topo } from "@/components/ui"
import { ESPACO, dataCurta, deChave } from "@/data/espacos"
import { useCrm } from "@/lib/crm-estado"
import { MOLA } from "@/lib/motion"
import { cn } from "@/lib/utils"

const ASSUNTOS = ["Dúvida sobre uma reserva", "Pagamento e nota fiscal", "Cancelar ou remarcar", "Problema no centro cirúrgico", "Outro assunto"]
const CANAIS = [
  { icone: MessageCircle, titulo: "WhatsApp", valor: "(11) 95555-0000", href: "" },
  { icone: Mail, titulo: "E-mail", valor: "atendimento@gocloserr.com.br", href: "mailto:atendimento@gocloserr.com.br" },
  { icone: Phone, titulo: "Telefone", valor: "0800 000 0000", href: "tel:08000000000" },
]
const PERGUNTAS = [
  ["Até quando posso cancelar sem custo?", "Até 72 horas antes da cirurgia o valor volta inteiro. Depois disso, vale a política do centro cirúrgico, que aparece no anúncio. (Regra de exemplo, a validar.)"],
  ["Quando o hospital recebe meu contato?", "48 horas antes da cirurgia. Antes disso, o hospital vê seu nome, CRM e o que você pediu para a sala."],
  ["Quem emite a nota fiscal?", "O centro cirúrgico, um dia depois da cirurgia. Ela fica disponível em Financeiro."],
]

export function MedicoContato() {
  const { agora, daMedica, foco, medico } = useCrm()
  const reservas = daMedica.filter((r) => r.status !== "recusada").slice(-8).reverse()
  const [assunto, setAssunto] = useState("")
  const [reserva, setReserva] = useState(() => (daMedica.some((r) => r.id === foco) ? (foco as string) : ""))
  const [mensagem, setMensagem] = useState("")
  const [canal, setCanal] = useState<"email" | "whatsapp">("email")
  const [erros, setErros] = useState<{ assunto?: string; mensagem?: string }>({})
  const [protocolo, setProtocolo] = useState<string | null>(null)

  function enviar(e: FormEvent) {
    e.preventDefault()
    const novos = { assunto: assunto ? undefined : "Escolha o assunto.", mensagem: mensagem.trim().length >= 10 ? undefined : "Escreva pelo menos 10 caracteres." }
    setErros(novos)
    if (novos.assunto || novos.mensagem) {
      document.getElementById(novos.assunto ? "assunto" : "mensagem")?.focus()
      return
    }
    setProtocolo(`AT-${String(agora.getTime()).slice(-6)}`)
  }
  function nova() {
    setAssunto("")
    setMensagem("")
    setProtocolo(null)
  }

  return (
    <>
      <Topo titulo="Fale conosco" subtitulo="Dúvidas sobre reservas, pagamentos ou o centro cirúrgico. A equipe da Gocloserr responde por aqui." />

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Cartao>
          <AnimatePresence mode="wait" initial={false}>
            {protocolo ? (
              <motion.div key="ok" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={MOLA} role="status" className="flex flex-col items-center gap-3 py-10 text-center">
                <span className="grid size-14 place-items-center rounded-full bg-jade-gelo text-jade-tinta">
                  <CircleCheck className="size-7" aria-hidden />
                </span>
                <h2 className="text-xl font-bold">Mensagem recebida</h2>
                <p className="max-w-sm text-muted-foreground">
                  Protocolo <strong className="text-foreground">{protocolo}</strong>. Respondemos por {canal === "email" ? `e-mail (${medico.email})` : `WhatsApp (${medico.tel})`} em até 1 dia útil. (Simulação: nada foi enviado.)
                </p>
                <button type="button" onClick={nova} className={cn(BOTAO_SECUNDARIO, "mt-2")}>
                  Enviar outra mensagem
                </button>
              </motion.div>
            ) : (
              <motion.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={enviar} noValidate className="flex flex-col gap-4">
                <h2 className="text-base font-bold">Envie uma mensagem</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Campo id="assunto" rotulo="Assunto" erro={erros.assunto}>
                    <select id="assunto" className={CAMPO} value={assunto} onChange={(e) => setAssunto(e.target.value)} aria-invalid={!!erros.assunto} aria-describedby={erros.assunto ? "erro-assunto" : undefined}>
                      <option value="">Escolha</option>
                      {ASSUNTOS.map((a) => (
                        <option key={a}>{a}</option>
                      ))}
                    </select>
                  </Campo>
                  <Campo id="reserva" rotulo="Reserva relacionada (opcional)">
                    <select id="reserva" className={CAMPO} value={reserva} onChange={(e) => setReserva(e.target.value)}>
                      <option value="">Nenhuma</option>
                      {reservas.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.id} · {dataCurta(deChave(r.data))} · {ESPACO[r.espacoId].nome}
                        </option>
                      ))}
                    </select>
                  </Campo>
                </div>
                <Campo id="mensagem" rotulo="Mensagem" erro={erros.mensagem}>
                  <textarea id="mensagem" rows={6} maxLength={2000} className={cn(CAMPO, "h-auto py-2.5 leading-relaxed")} value={mensagem} onChange={(e) => setMensagem(e.target.value)} aria-invalid={!!erros.mensagem} aria-describedby={erros.mensagem ? "erro-mensagem" : "mensagem-ajuda"} placeholder="Conte o que aconteceu ou o que você precisa." />
                  <span id="mensagem-ajuda" className="text-xs text-muted-foreground">
                    Não envie dados de pacientes por aqui.
                  </span>
                </Campo>
                <fieldset>
                  <legend className="mb-2 text-sm font-semibold">Prefere a resposta por</legend>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        ["email", "E-mail"],
                        ["whatsapp", "WhatsApp"],
                      ] as const
                    ).map(([v, r]) => (
                      <label key={v} className={cn("inline-flex h-10 cursor-pointer items-center gap-2 rounded-full px-4 text-sm font-semibold ring-1 transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-ring", canal === v ? "bg-jade-escuro text-white ring-jade-escuro" : "bg-white ring-border hover:bg-jade-gelo")}>
                        <input type="radio" name="canal" value={v} checked={canal === v} onChange={() => setCanal(v)} className="sr-only" />
                        {r}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <button type="submit" className={cn(BOTAO_PRIMARIO, "self-start")}>
                  <Send aria-hidden /> Enviar mensagem
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </Cartao>

        <div className="flex flex-col gap-4">
          <Cartao i={1} titulo="Outros canais">
            <ul className="flex flex-col gap-2">
              {CANAIS.map((c) => (
                <li key={c.titulo}>
                  {/* shortcut: WhatsApp sem link enquanto o número real não existe */}
                  <a href={c.href || undefined} className="flex items-center gap-3 rounded-xl p-3 ring-1 ring-border transition-colors [&[href]]:hover:bg-jade-gelo">
                    <span className="grid size-10 place-items-center rounded-full bg-jade-gelo text-jade-tinta">
                      <c.icone className="size-[18px]" aria-hidden />
                    </span>
                    <span>
                      <span className="block text-sm text-muted-foreground">{c.titulo}</span>
                      <span className="block font-semibold">{c.valor}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="size-4" aria-hidden /> Segunda a sábado, das 7h às 20h. Contatos de exemplo.
            </p>
          </Cartao>
          <Cartao i={2} titulo="Perguntas frequentes">
            <div className="flex flex-col divide-y divide-border">
              {PERGUNTAS.map(([p, r]) => (
                <details key={p} className="group py-3">
                  <summary className="cursor-pointer list-none font-semibold marker:hidden">
                    <span className="flex items-center justify-between gap-3">
                      {p}
                      <span className="text-jade-tinta transition-transform group-open:rotate-45" aria-hidden>
                        +
                      </span>
                    </span>
                  </summary>
                  <p className="mt-2 text-sm text-muted-foreground">{r}</p>
                </details>
              ))}
            </div>
          </Cartao>
        </div>
      </div>
    </>
  )
}
