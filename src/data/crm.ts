// Dados fictícios do painel (CRM). Médicos, telefones, e-mails e reservas são inventados.
// As reservas são geradas com semente a partir de hoje, então a demonstração sempre tem passado, futuro e pendências.

import { ESPACO, ESPACOS, TURNOS, chave, hoje, rng, type TurnoId } from "@/data/espacos"

// Site público da Gocloserr (outro repositório): o painel só aponta para ele, não importa nada de lá
export const SITE = "https://4him-technology.github.io/Go-Closerr/"

export type StatusReserva = "pendente" | "confirmada" | "concluida" | "recusada" | "cancelada"

export type Medico = { id: string; nome: string; crm: string; especialidade: string; tel: string; email: string }

export type Reserva = {
  id: string
  espacoId: string
  medicoId: string
  data: string // chave yyyy-mm-dd
  turno: TurnoId
  sala: string
  procedimento: string
  especialidade: string
  porte: "Pequeno" | "Médio" | "Grande"
  anestesia: string
  necessidades: string[]
  observacoes: string
  valor: number // centavos
  status: StatusReserva
  solicitadaEm: Date
}

// Perfis usados no protótipo (sem login nesta fase)
export const HOSPITAL_ID = "vila-aurora"
export const MEDICO_ID = "helena-prado"

export const MEDICOS: Medico[] = [
  { id: "helena-prado", nome: "Dra. Helena Prado", crm: "CRM-SP 184512", especialidade: "Plástica", tel: "(11) 95555-0101", email: "helena.prado@exemplo.com.br" },
  { id: "rafael-moura", nome: "Dr. Rafael Moura", crm: "CRM-SP 152230", especialidade: "Ortopedia", tel: "(11) 95555-0102", email: "rafael.moura@exemplo.com.br" },
  { id: "camila-ventura", nome: "Dra. Camila Ventura", crm: "CRM-SP 201877", especialidade: "Cirurgia geral", tel: "(11) 95555-0103", email: "camila.ventura@exemplo.com.br" },
  { id: "otavio-lins", nome: "Dr. Otávio Lins", crm: "CRM-SP 133904", especialidade: "Ortopedia", tel: "(11) 95555-0104", email: "otavio.lins@exemplo.com.br" },
  { id: "beatriz-sena", nome: "Dra. Beatriz Sena", crm: "CRM-SP 176341", especialidade: "Plástica", tel: "(11) 95555-0105", email: "beatriz.sena@exemplo.com.br" },
  { id: "marcos-aquino", nome: "Dr. Marcos Aquino", crm: "CRM-SP 145566", especialidade: "Cirurgia geral", tel: "(11) 95555-0106", email: "marcos.aquino@exemplo.com.br" },
]
export const MEDICO = Object.fromEntries(MEDICOS.map((m) => [m.id, m])) as Record<string, Medico>

type Proc = { nome: string; porte: Reserva["porte"]; anestesia: string; precisa: string[] }
const PROCS: Record<string, Proc[]> = {
  Plástica: [
    { nome: "Abdominoplastia", porte: "Grande", anestesia: "Geral", precisa: ["Pernoite na recuperação", "Cinta modeladora", "Bisturi bipolar"] },
    { nome: "Mamoplastia redutora", porte: "Médio", anestesia: "Geral", precisa: ["Pernoite na recuperação", "Bisturi bipolar"] },
    { nome: "Lipoaspiração", porte: "Médio", anestesia: "Raquidiana com sedação", precisa: ["Lipoaspirador com vibração", "Cinta modeladora"] },
    { nome: "Blefaroplastia", porte: "Pequeno", anestesia: "Local com sedação", precisa: ["Foco de LED com lupa"] },
  ],
  Ortopedia: [
    { nome: "Artroscopia de joelho", porte: "Médio", anestesia: "Raquidiana", precisa: ["Torre de artroscopia", "Arco em C"] },
    { nome: "Reconstrução de LCA", porte: "Grande", anestesia: "Raquidiana com bloqueio", precisa: ["Torre de artroscopia", "Arco em C", "Instrumentador próprio"] },
    { nome: "Correção de hálux valgo", porte: "Pequeno", anestesia: "Bloqueio periférico", precisa: ["Arco em C", "Serra oscilatória"] },
  ],
  "Cirurgia geral": [
    { nome: "Colecistectomia videolaparoscópica", porte: "Médio", anestesia: "Geral", precisa: ["Torre de videolaparoscopia 4K", "Bisturi harmônico"] },
    { nome: "Hernioplastia inguinal", porte: "Pequeno", anestesia: "Raquidiana", precisa: ["Tela de polipropileno"] },
  ],
}

// Itens que somam ao valor do turno (centavos)
const ADICIONAL: Record<string, number> = {
  "Pernoite na recuperação": 90000,
  "Arco em C": 60000,
  "Torre de videolaparoscopia 4K": 45000,
  "Torre de artroscopia": 45000,
}

const OBS = [
  "Paciente com alergia a látex: preparar sala sem látex.",
  "Equipe própria de anestesia.",
  "Vou levar o instrumental próprio, preciso só da esterilização.",
  "",
  "",
  "",
]

const SALAS = (espacoId: string) => Array.from({ length: ESPACO[espacoId].salas }, (_, i) => `Sala ${i + 1}`)

const somaDias = (n: number) => {
  const d = new Date(hoje)
  d.setDate(d.getDate() + n)
  return d
}

function montar(r: () => number, base: { espacoId: string; medicoId: string; dia: number; turno: TurnoId; status: StatusReserva; proc?: string }): Reserva {
  const med = MEDICO[base.medicoId]
  const lista = PROCS[med.especialidade]
  const p = lista.find((x) => x.nome === base.proc) ?? lista[Math.floor(r() * lista.length)]
  const salas = SALAS(base.espacoId)
  const solicitada = somaDias(base.dia - 3 - Math.floor(r() * 12))
  solicitada.setHours(8 + Math.floor(r() * 11), Math.floor(r() * 60))
  return {
    id: `GC-${String(10000 + Math.floor(r() * 89999))}`,
    espacoId: base.espacoId,
    medicoId: base.medicoId,
    data: chave(somaDias(base.dia)),
    turno: base.turno,
    sala: salas[Math.floor(r() * salas.length)],
    procedimento: p.nome,
    especialidade: med.especialidade,
    porte: p.porte,
    anestesia: p.anestesia,
    necessidades: p.precisa,
    observacoes: OBS[Math.floor(r() * OBS.length)],
    valor: ESPACO[base.espacoId].preco + p.precisa.reduce((s, n) => s + (ADICIONAL[n] ?? 0), 0),
    status: base.status,
    solicitadaEm: solicitada,
  }
}

function gerar(): Reserva[] {
  const r = rng("painel-gocloserr")
  const out: Reserva[] = []
  const ocupado = new Set<string>()
  const add = (b: Parameters<typeof montar>[1]) => {
    const k = `${b.espacoId}|${chave(somaDias(b.dia))}|${b.turno}`
    if (ocupado.has(k)) return
    ocupado.add(k)
    const res = montar(r, b)
    while (out.some((x) => x.id === res.id)) res.id = `GC-${String(10000 + Math.floor(r() * 89999))}`
    out.push(res)
  }
  const outros = MEDICOS.filter((m) => m.id !== MEDICO_ID)
  const sorteia = <T,>(a: T[]) => a[Math.floor(r() * a.length)]
  const turnoSorteado = () => TURNOS[Math.floor(r() * 2)].id // manhã ou tarde, noite é rara

  // Demonstração garantida: uma cirurgia dentro das 48 horas (contato liberado), outra logo depois (contagem regressiva)
  add({ espacoId: HOSPITAL_ID, medicoId: "rafael-moura", dia: 1, turno: "manha", status: "confirmada", proc: "Reconstrução de LCA" })
  add({ espacoId: HOSPITAL_ID, medicoId: "beatriz-sena", dia: 2, turno: "tarde", status: "confirmada", proc: "Lipoaspiração" })
  add({ espacoId: HOSPITAL_ID, medicoId: MEDICO_ID, dia: 6, turno: "manha", status: "pendente", proc: "Abdominoplastia" })
  add({ espacoId: HOSPITAL_ID, medicoId: "camila-ventura", dia: 4, turno: "tarde", status: "pendente" })
  add({ espacoId: HOSPITAL_ID, medicoId: "otavio-lins", dia: 9, turno: "manha", status: "pendente" })
  add({ espacoId: HOSPITAL_ID, medicoId: "marcos-aquino", dia: 15, turno: "noite", status: "pendente" })

  // Hospital: histórico dos últimos 100 dias e agenda das próximas 5 semanas
  for (let dia = -100; dia <= 35; dia++) {
    if (somaDias(dia).getDay() === 0 || dia === 0) continue
    const chance = dia < 0 ? 0.42 : 0.3
    if (r() > chance) continue
    const status: StatusReserva = dia < 0 ? (r() < 0.08 ? "cancelada" : "concluida") : "confirmada"
    add({ espacoId: HOSPITAL_ID, medicoId: sorteia(outros).id, dia, turno: turnoSorteado(), status })
  }

  // Médica: locações em outros centros (histórico com nota fiscal e próximas cirurgias)
  const outrosCentros = ESPACOS.filter((e) => e.id !== HOSPITAL_ID && e.esp.includes("Plástica"))
  for (const dia of [-118, -97, -83, -64, -50, -36, -22, -12, -5]) {
    add({ espacoId: sorteia(outrosCentros).id, medicoId: MEDICO_ID, dia, turno: turnoSorteado(), status: dia === -50 ? "cancelada" : "concluida" })
  }
  add({ espacoId: HOSPITAL_ID, medicoId: MEDICO_ID, dia: -29, turno: "manha", status: "concluida" })
  for (const dia of [3, 11, 19]) add({ espacoId: sorteia(outrosCentros).id, medicoId: MEDICO_ID, dia, turno: turnoSorteado(), status: "confirmada" })

  return out.sort((a, b) => a.data.localeCompare(b.data) || TURNOS.findIndex((t) => t.id === a.turno) - TURNOS.findIndex((t) => t.id === b.turno))
}

export const RESERVAS_INICIAIS = gerar()
