// Regras do painel (CRM), testadas em crm.test.ts.
import { MEDICO, type Reserva } from "@/data/crm"
import { MESES_L, TURNO, TURNOS, chave, dataCurta, deChave, type TurnoId } from "@/data/espacos"

const HORA = 36e5
const DIA = 24 * HORA
// O telefone e o e-mail do locatário só aparecem para o hospital nesta janela antes da cirurgia
export const JANELA_CONTATO = 48 * HORA

// Sem `inicio` (um turno da agenda, não uma cirurgia), vale a hora de início do turno
export function inicioDe(r: Pick<Reserva, "data" | "turno"> & { inicio?: number }) {
  const d = deChave(r.data)
  d.setHours(0, r.inicio ?? TURNO[r.turno].de)
  return d
}

export const hora = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}h${min % 60 ? String(min % 60).padStart(2, "0") : ""}`
export const horario = (r: Pick<Reserva, "inicio" | "fim">) => `${hora(r.inicio)} às ${hora(r.fim)}`

const comContato = (r: Reserva) => r.status === "confirmada" || r.status === "concluida"
export const contatoLiberado = (r: Reserva, agora: Date) => comContato(r) && +agora >= +inicioDe(r) - JANELA_CONTATO

export function liberaEm(r: Reserva, agora: Date) {
  if (!comContato(r)) return null
  const lib = new Date(+inicioDe(r) - JANELA_CONTATO)
  return agora < lib ? lib : null
}

export function duracao(ms: number) {
  const min = Math.floor(ms / 6e4)
  if (min < 1) return "menos de 1 min"
  const d = Math.floor(min / 1440)
  const h = Math.floor((min % 1440) / 60)
  const m = min % 60
  if (d) return `${d} ${d > 1 ? "dias" : "dia"}${h ? ` e ${h} h` : ""}`
  if (h) return `${h} h${m ? ` e ${m} min` : ""}`
  return `${m} min`
}

// Confirmada que já começou conta como realizada, para o painel não depender de alguém fechar a reserva
export const realizada = (r: Reserva, agora: Date) => r.status === "concluida" || (r.status === "confirmada" && inicioDe(r) <= agora)
export const futura = (r: Reserva, agora: Date) => inicioDe(r) > agora
const soma = (rs: Reserva[]) => rs.reduce((s, r) => s + r.valor, 0)
const mesmoMes = (d: Date, base: Date) => d.getMonth() === base.getMonth() && d.getFullYear() === base.getFullYear()

export function resumoFinanceiro(rs: Reserva[], agora: Date) {
  const noMes = (r: Reserva) => mesmoMes(inicioDe(r), agora)
  const futuras = rs.filter((r) => r.status === "confirmada" && futura(r, agora))
  const prox = futuras.filter((r) => +inicioDe(r) <= +agora + 30 * DIA)
  const pend = rs.filter((r) => r.status === "pendente" && futura(r, agora))
  const faturado = soma(rs.filter((r) => realizada(r, agora) && noMes(r)))
  const aReceberMes = soma(futuras.filter(noMes))
  return { faturado, aReceberMes, previsto: faturado + aReceberMes, proximos30: soma(prox), n30: prox.length, emAprovacao: soma(pend), nPendentes: pend.length }
}

export function serieMensal(rs: Reserva[], agora: Date, antes = 3, depois = 2) {
  return Array.from({ length: antes + depois + 1 }, (_, i) => {
    const base = new Date(agora.getFullYear(), agora.getMonth() - antes + i, 1)
    const doMes = rs.filter((r) => mesmoMes(inicioDe(r), base))
    return {
      chave: chave(base),
      rotulo: MESES_L[base.getMonth()].slice(0, 3),
      nome: `${MESES_L[base.getMonth()]} de ${base.getFullYear()}`,
      atual: i === antes,
      faturado: soma(doMes.filter((r) => realizada(r, agora))),
      previsto: soma(doMes.filter((r) => r.status === "confirmada" && futura(r, agora))),
    }
  })
}

export type Notificacao = {
  id: string
  tipo: "solicitacao" | "contato" | "pagamento" | "cancelada"
  titulo: string
  texto: string
  quando: Date
  reservaId: string
}

// junta uma lista em português sem mexer em maiúsculas (siglas como LCA e "arco em C")
// Inicial em minúscula para o meio da frase; sigla (segunda letra maiúscula, como "LCA") fica como está
export const minuscula = (t: string) => (/^\p{Lu}\p{Ll}/u.test(t) ? t[0].toLowerCase() + t.slice(1) : t)

export const juntar = (a: string[]) => {
  const [primeiro = "", ...resto] = a
  const itens = [primeiro, ...resto.map(minuscula)]
  return itens.length < 2 ? primeiro : `${itens.slice(0, -1).join(", ")} e ${itens[itens.length - 1]}`
}

export const quandoPt = (r: Pick<Reserva, "data" | "inicio" | "fim">) => `${dataCurta(deChave(r.data))}, ${horario(r)}`

export function notificacoesHospital(rs: Reserva[], agora: Date): Notificacao[] {
  const out: Notificacao[] = []
  for (const r of rs) {
    const m = MEDICO[r.medicoId]
    const ini = inicioDe(r)
    if (r.status === "pendente" && ini > agora)
      out.push({ id: `sol-${r.id}`, tipo: "solicitacao", titulo: "Solicitação aguardando aceite", texto: `${m.nome} quer reservar a ${r.sala} (${quandoPt(r)}) para ${minuscula(r.procedimento)}.`, quando: r.solicitadaEm, reservaId: r.id })
    if (r.status === "confirmada" && contatoLiberado(r, agora) && ini > agora)
      out.push({ id: `ctt-${r.id}`, tipo: "contato", titulo: "Contato do locatário liberado", texto: `Faltam ${duracao(+ini - +agora)} para a cirurgia de ${m.nome}. Telefone e e-mail já aparecem em Locatários.`, quando: new Date(+ini - JANELA_CONTATO), reservaId: r.id })
    const pago = new Date(+ini + 2 * DIA)
    if (realizada(r, agora) && pago <= agora && +agora - +pago < 20 * DIA)
      out.push({ id: `pag-${r.id}`, tipo: "pagamento", titulo: "Repasse recebido", texto: `A locação de ${m.nome} (${quandoPt(r)}) foi paga e entrou no seu faturamento.`, quando: pago, reservaId: r.id })
    if (r.status === "cancelada" && Math.abs(+ini - +agora) < 30 * DIA)
      out.push({ id: `can-${r.id}`, tipo: "cancelada", titulo: "Reserva cancelada pelo médico", texto: `${m.nome} cancelou a reserva de ${quandoPt(r)}. O turno voltou a ficar disponível.`, quando: new Date(+ini - 3 * DIA), reservaId: r.id })
  }
  return out.filter((n) => n.quando <= agora).sort((a, b) => +b.quando - +a.quando)
}

/* ---------- agenda ---------- */
export type EstadoTurno = "reservado" | "pendente" | "livre" | "fechado" | "passado"
export type Disponibilidade = Record<string, TurnoId[]>

// Cirurgias de cada turno ("yyyy-mm-dd|turno"), em ordem de horário. Recusada e cancelada liberam o horário.
export function indiceReservas(rs: Reserva[]) {
  const idx = new Map<string, Reserva[]>()
  for (const r of rs) {
    if (r.status === "recusada" || r.status === "cancelada") continue
    const k = `${r.data}|${r.turno}`
    idx.set(k, [...(idx.get(k) ?? []), r])
  }
  for (const l of idx.values()) l.sort((a, b) => a.inicio - b.inicio)
  return idx
}

export function estadoTurno(data: string, turno: TurnoId, disp: Disponibilidade, idx: Map<string, Reserva[]>, agora: Date): EstadoTurno {
  const rs = idx.get(`${data}|${turno}`)
  if (rs) return rs.some((r) => r.status !== "pendente") ? "reservado" : "pendente"
  if (inicioDe({ data, turno }) <= agora) return "passado"
  return disp[data]?.includes(turno) ? "livre" : "fechado"
}

// Turnos reservados sobre os ofertados (reservados + livres) nos próximos dias. Pendente ainda não conta.
export function ocupacao(rs: Reserva[], disp: Disponibilidade, agora: Date, dias = 30) {
  const idx = indiceReservas(rs)
  let reservados = 0
  let livres = 0
  for (let i = 0; i <= dias; i++) {
    const k = chave(new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + i))
    for (const t of TURNOS) {
      if (inicioDe({ data: k, turno: t.id }) <= agora) continue
      const e = estadoTurno(k, t.id, disp, idx, agora)
      if (e === "reservado") reservados++
      else if (e === "livre") livres++
    }
  }
  return reservados + livres ? reservados / (reservados + livres) : 0
}

// Semana da agenda: cirurgias que se sobrepõem no mesmo dia ficam lado a lado e dividem a largura do grupo
export function distribuir(rs: Reserva[]) {
  const out: { r: Reserva; coluna: number; colunas: number }[] = []
  let grupo: typeof out = []
  let fins: number[] = [] // fim da última cirurgia de cada coluna do grupo
  let fimGrupo = -1
  const fechar = () => out.push(...grupo.map((g) => ({ ...g, colunas: fins.length })))
  for (const r of [...rs].sort((a, b) => a.inicio - b.inicio || a.fim - b.fim)) {
    if (r.inicio >= fimGrupo) {
      fechar()
      grupo = []
      fins = []
    }
    const livre = fins.findIndex((f) => f <= r.inicio)
    const coluna = livre < 0 ? fins.length : livre
    fins[coluna] = r.fim
    grupo.push({ r, coluna, colunas: 0 })
    fimGrupo = Math.max(fimGrupo, r.fim)
  }
  fechar()
  return out
}
