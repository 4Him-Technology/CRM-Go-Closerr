import type { FormEvent } from "react"
import { ShieldCheck } from "lucide-react"
import { useFormulario } from "@/lib/formulario"
import { BOTAO_PRIMARIO, CAMPO, Campo, Cartao, Topo } from "@/components/ui"
import { useCrm, type CadastroMedico } from "@/lib/crm-estado"
import { UFS, type Mascara, type Regra } from "@/lib/validacao"
import { cn } from "@/lib/utils"

type Chave = keyof CadastroMedico
const REGRAS: Partial<Record<Chave, Regra>> = { nome: "nome", crm: "crm", crmUf: "uf", doc: "doc", email: "email", tel: "tel", cep: "cep", endereco: "texto", numero: "texto", cidade: "texto", uf: "uf" }
const MASCARAS: Partial<Record<Chave, Mascara>> = { crm: "crm", doc: "doc", tel: "tel", cep: "cep" }

export function MedicoCadastro() {
  const { medico, setMedico, avisar } = useCrm()
  const f = useFormulario<Chave>(medico, REGRAS, MASCARAS)

  function salvar(e: FormEvent) {
    e.preventDefault()
    if (!f.validar()) return
    setMedico(f.v)
    avisar("Cadastro atualizado.")
  }

  // campo de texto ligado ao formulário (máscara, validação ao sair e mensagem de erro)
  const entrada = (k: Chave, rotulo: string, extra: { className?: string; type?: string; inputMode?: "numeric" | "email" | "tel"; autoComplete?: string } = {}) => {
    const { erro, ...c } = f.campo(k)
    return (
      <Campo id={k} rotulo={rotulo} erro={erro} className={extra.className}>
        <input {...c} type={extra.type ?? "text"} inputMode={extra.inputMode} autoComplete={extra.autoComplete} className={CAMPO} aria-invalid={!!erro} aria-describedby={erro ? `erro-${k}` : undefined} />
      </Campo>
    )
  }
  const uf = (k: Chave, rotulo: string) => {
    const { erro, ...c } = f.campo(k)
    return (
      <Campo id={k} rotulo={rotulo} erro={erro}>
        <select {...c} className={CAMPO} aria-invalid={!!erro} aria-describedby={erro ? `erro-${k}` : undefined}>
          <option value="">UF</option>
          {UFS.map((u) => (
            <option key={u}>{u}</option>
          ))}
        </select>
      </Campo>
    )
  }

  return (
    <>
      <Topo titulo="Meu cadastro" subtitulo="Dados do médico responsável pelas reservas. Eles vão para a nota fiscal e para o hospital, 48 horas antes de cada cirurgia." />
      <form onSubmit={salvar} noValidate className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <Cartao titulo="Dados pessoais e profissionais">
            <div className="grid gap-4 sm:grid-cols-6">
              {entrada("nome", "Nome completo", { className: "sm:col-span-6", autoComplete: "name" })}
              {entrada("crm", "CRM do responsável", { className: "sm:col-span-3", inputMode: "numeric" })}
              <div className="sm:col-span-3">{uf("crmUf", "UF do CRM")}</div>
              {entrada("doc", "CPF ou CNPJ", { className: "sm:col-span-6", inputMode: "numeric" })}
            </div>
          </Cartao>
          <Cartao i={1} titulo="Contato">
            <div className="grid gap-4 sm:grid-cols-2">
              {entrada("tel", "Telefone celular", { type: "tel", inputMode: "tel", autoComplete: "tel" })}
              {entrada("email", "E-mail", { type: "email", inputMode: "email", autoComplete: "email" })}
            </div>
          </Cartao>
          <Cartao i={2} titulo="Endereço">
            <div className="grid gap-4 sm:grid-cols-6">
              {entrada("cep", "CEP", { className: "sm:col-span-2", inputMode: "numeric", autoComplete: "postal-code" })}
              {entrada("endereco", "Rua ou avenida", { className: "sm:col-span-4", autoComplete: "address-line1" })}
              {entrada("numero", "Número", { className: "sm:col-span-2" })}
              {entrada("complemento", "Complemento (opcional)", { className: "sm:col-span-4", autoComplete: "address-line2" })}
              {entrada("cidade", "Cidade", { className: "sm:col-span-4", autoComplete: "address-level2" })}
              <div className="sm:col-span-2">{uf("uf", "UF")}</div>
            </div>
          </Cartao>
          <button type="submit" className={cn(BOTAO_PRIMARIO, "h-11 self-start px-6")}>
            Salvar cadastro
          </button>
        </div>

        <Cartao i={3} className="lg:sticky lg:top-6">
          <div className="flex flex-col gap-3">
            <span className="grid size-11 place-items-center rounded-full bg-jade-gelo text-jade-tinta">
              <ShieldCheck className="size-5" aria-hidden />
            </span>
            <h2 className="text-base font-bold">Quem vê seus dados</h2>
            <ul className="flex list-disc flex-col gap-2 pl-5 text-sm text-muted-foreground">
              <li>O hospital vê seu nome, CRM e o que você pediu desde a solicitação.</li>
              <li>Telefone e e-mail só aparecem para o hospital 48 horas antes da cirurgia.</li>
              <li>CPF ou CNPJ e endereço servem para a nota fiscal e não aparecem no painel do hospital.</li>
            </ul>
            <p className="text-xs text-muted-foreground">Protótipo: os dados ficam só neste navegador e somem ao recarregar a página.</p>
          </div>
        </Cartao>
      </form>
    </>
  )
}
