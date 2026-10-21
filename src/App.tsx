import { useEffect, useState, type ComponentType } from "react"
import { MotionConfig } from "motion/react"
import { MolduraCrm, type Perfil } from "@/components/moldura"
import { CrmProvider } from "@/lib/crm-estado"
import { Entrar } from "@/pages/entrar"
import { HospitalAgenda } from "@/pages/hospital-agenda"
import { HospitalCadastro } from "@/pages/hospital-cadastro"
import { HospitalInicio } from "@/pages/hospital-inicio"
import { HospitalLocatarios } from "@/pages/hospital-locatarios"
import { HospitalNotificacoes } from "@/pages/hospital-notificacoes"
import { MedicoCadastro } from "@/pages/medico-cadastro"
import { MedicoContato } from "@/pages/medico-contato"
import { MedicoFinanceiro } from "@/pages/medico-financeiro"
import { MedicoInicio } from "@/pages/medico-inicio"

const TELAS: Record<string, ComponentType> = {
  hospital: HospitalInicio,
  "hospital/cadastro": HospitalCadastro,
  "hospital/locatarios": HospitalLocatarios,
  "hospital/notificacoes": HospitalNotificacoes,
  "hospital/agenda": HospitalAgenda,
  medico: MedicoInicio,
  "medico/financeiro": MedicoFinanceiro,
  "medico/contato": MedicoContato,
  "medico/cadastro": MedicoCadastro,
}

// Rotas por hash (#hospital/agenda, #medico/financeiro): funcionam no GitHub Pages sem configurar servidor.
const lerRota = () => location.hash.slice(1)

function useRota() {
  const [rota, setRota] = useState(lerRota)
  useEffect(() => {
    const ao = () => setRota(lerRota())
    addEventListener("hashchange", ao)
    return () => removeEventListener("hashchange", ao)
  }, [])
  return rota
}

// Painel (CRM) do hospital/clínica e do médico. Sem login nesta fase: a entrada escolhe o perfil.
export default function App() {
  const rota = useRota()
  const perfil: Perfil | null = rota.startsWith("medico") ? "medico" : rota.startsWith("hospital") ? "hospital" : null
  const Tela = TELAS[rota] ?? (perfil === "medico" ? MedicoInicio : HospitalInicio)

  useEffect(() => {
    // leva o foco para o título da tela nova (leitor de tela e teclado)
    const t = setTimeout(() => document.querySelector<HTMLElement>("main h1")?.focus({ preventScroll: true }), 220)
    return () => clearTimeout(t)
  }, [rota])

  return (
    // reducedMotion="user": quem pede menos movimento recebe só as trocas de opacidade
    <MotionConfig reducedMotion="user">
      <CrmProvider>
        {perfil ? (
          <MolduraCrm perfil={perfil} rota={rota}>
            <Tela />
          </MolduraCrm>
        ) : (
          <Entrar />
        )}
      </CrmProvider>
    </MotionConfig>
  )
}
