import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { fotosDe, urlFoto } from "@/components/foto-sala"
import { HOSPITAL_ID, MEDICO, MEDICO_ID, RESERVAS_INICIAIS, type Reserva } from "@/data/crm"
import { ESPACO, type TurnoId } from "@/data/espacos"
import { notificacoesHospital, type Disponibilidade, type Notificacao } from "@/lib/crm"

export type Sala = { id: string; nome: string; tipo: string; preco: number; ativa: boolean }
export type Foto = { id: string; url: string; legenda: string }
export type Centro = { nome: string; endereco: string; cidade: string; uf: string; porte: string; descricao: string; esp: string[]; equip: string[] }
export type CadastroMedico = Record<"nome" | "crm" | "crmUf" | "doc" | "email" | "tel" | "cep" | "endereco" | "numero" | "complemento" | "cidade" | "uf", string>

type Crm = {
  agora: Date
  reservas: Reserva[]
  doHospital: Reserva[]
  daMedica: Reserva[]
  responder: (id: string, aceitar: boolean) => void
  notificacoes: Notificacao[]
  lidas: string[]
  marcarLidas: (ids: string[]) => void
  naoLidas: number
  disp: Disponibilidade
  setTurnos: (dias: Record<string, TurnoId[]>) => void
  centro: Centro
  setCentro: (c: Centro) => void
  salas: Sala[]
  setSalas: (s: Sala[]) => void
  fotos: Foto[]
  setFotos: (f: Foto[]) => void
  medico: CadastroMedico
  setMedico: (m: CadastroMedico) => void
  foco: string | null
  setFoco: (id: string | null) => void
  aviso: { id: number; texto: string } | null
  avisar: (texto: string) => void
}

const Ctx = createContext<Crm | null>(null)
const espaco = ESPACO[HOSPITAL_ID]
const TIPOS_SALA = ["Sala cirúrgica geral", "Sala com fluxo laminar", "Sala de procedimentos"]

// shortcut: estado só em memória, volta ao inicial ao recarregar ou sair do painel; trocar por API quando houver backend.
export function CrmProvider({ children }: { children: ReactNode }) {
  const [agora, setAgora] = useState(() => new Date())
  const [reservas, setReservas] = useState(RESERVAS_INICIAIS)
  const [disp, setDisp] = useState<Disponibilidade>(() => structuredClone(espaco.agenda))
  const [centro, setCentro] = useState<Centro>({ nome: espaco.nome, endereco: espaco.endereco, cidade: espaco.cidade, uf: espaco.uf, porte: espaco.porte, descricao: espaco.descricao, esp: espaco.esp, equip: espaco.equip })
  const [salas, setSalas] = useState<Sala[]>(() =>
    Array.from({ length: espaco.salas }, (_, i) => ({ id: `sala-${i + 1}`, nome: `Sala ${i + 1}`, tipo: TIPOS_SALA[i % 3], preco: espaco.preco, ativa: true }))
  )
  const [fotos, setFotos] = useState<Foto[]>(() => fotosDe(espaco).map((f, i) => ({ id: `${f.nome}-${i}`, url: urlFoto(f.nome), legenda: f.legenda })))
  const [medico, setMedico] = useState<CadastroMedico>({
    nome: MEDICO[MEDICO_ID].nome, crm: "184512", crmUf: "SP", doc: "11.222.333/0001-81", email: MEDICO[MEDICO_ID].email, tel: MEDICO[MEDICO_ID].tel,
    cep: "01452-000", endereco: "Av. Brigadeiro Faria Lima", numero: "1200", complemento: "Conj. 81", cidade: "São Paulo", uf: "SP",
  })
  const [foco, setFoco] = useState<string | null>(null)
  const [aviso, setAviso] = useState<Crm["aviso"]>(null)

  // o relógio anda: a notificação de contato liberado aparece sozinha quando a cirurgia entra nas 48 horas
  useEffect(() => {
    const t = setInterval(() => setAgora(new Date()), 30_000)
    return () => clearInterval(t)
  }, [])

  const avisar = useCallback((texto: string) => setAviso({ id: Date.now(), texto }), [])
  useEffect(() => {
    if (!aviso) return
    const t = setTimeout(() => setAviso(null), 4200)
    return () => clearTimeout(t)
  }, [aviso])

  const doHospital = useMemo(() => reservas.filter((r) => r.espacoId === HOSPITAL_ID), [reservas])
  const daMedica = useMemo(() => reservas.filter((r) => r.medicoId === MEDICO_ID), [reservas])
  const notificacoes = useMemo(() => notificacoesHospital(doHospital, agora), [doHospital, agora])

  // o que tem mais de dois dias começa lido; solicitações ficam em aberto até a resposta
  const [lidas, setLidas] = useState<string[]>(() =>
    notificacoes.filter((n) => n.tipo !== "solicitacao" && +agora - +n.quando > 2 * 864e5).map((n) => n.id)
  )
  const marcarLidas = useCallback((ids: string[]) => setLidas((a) => [...new Set([...a, ...ids])]), [])
  const naoLidas = notificacoes.filter((n) => !lidas.includes(n.id)).length

  const vistas = useRef(new Set(notificacoes.map((n) => n.id)))
  useEffect(() => {
    const novas = notificacoes.filter((n) => n.tipo === "contato" && !vistas.current.has(n.id))
    notificacoes.forEach((n) => vistas.current.add(n.id))
    if (novas.length) avisar(`${novas[0].titulo}: ${novas[0].texto}`)
  }, [notificacoes, avisar])

  const responder = useCallback(
    (id: string, aceitar: boolean) => {
      const r = reservas.find((x) => x.id === id)
      if (!r) return
      setReservas((a) => a.map((x) => (x.id === id ? { ...x, status: aceitar ? "confirmada" : "recusada" } : x)))
      marcarLidas([`sol-${id}`])
      // recusou: o turno volta a ficar aberto para outros médicos
      if (!aceitar) setDisp((d) => ({ ...d, [r.data]: [...new Set([...(d[r.data] ?? []), r.turno])] }))
      avisar(aceitar ? `Reserva ${r.id} aceita. ${MEDICO[r.medicoId].nome} recebe a confirmação por e-mail.` : `Solicitação ${r.id} recusada. O turno voltou para a agenda.`)
    },
    [reservas, marcarLidas, avisar]
  )

  const setTurnos = useCallback((dias: Record<string, TurnoId[]>) => setDisp((d) => ({ ...d, ...dias })), [])

  return (
    <Ctx.Provider
      value={{ agora, reservas, doHospital, daMedica, responder, notificacoes, lidas, marcarLidas, naoLidas, disp, setTurnos, centro, setCentro, salas, setSalas, fotos, setFotos, medico, setMedico, foco, setFoco, aviso, avisar }}
    >
      {children}
    </Ctx.Provider>
  )
}

export function useCrm() {
  const c = useContext(Ctx)
  if (!c) throw new Error("useCrm fora do CrmProvider")
  return c
}
