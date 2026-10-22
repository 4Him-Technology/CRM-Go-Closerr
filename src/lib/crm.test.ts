import { describe, expect, it } from "vitest"
import type { Reserva } from "@/data/crm"
import {
  contatoLiberado,
  duracao,
  distribuir,
  estadoTurno,
  hora,
  horario,
  indiceReservas,
  inicioDe,
  juntar,
  liberaEm,
  minuscula,
  notificacoesHospital,
  ocupacao,
  resumoFinanceiro,
  serieMensal,
} from "./crm"

const res = (p: Partial<Reserva>): Reserva => ({
  id: "GC-1",
  espacoId: "vila-aurora",
  medicoId: "rafael-moura",
  data: "2026-10-23",
  turno: "manha",
  inicio: 7 * 60,
  fim: 9 * 60,
  sala: "Sala 1",
  procedimento: "Artroscopia de joelho",
  especialidade: "Ortopedia",
  porte: "Médio",
  anestesia: "Raquidiana",
  necessidades: [],
  observacoes: "",
  valor: 100000,
  status: "confirmada",
  solicitadaEm: new Date(2026, 9, 1, 9),
  ...p,
})

describe("início da reserva", () => {
  it("usa o horário marcado da cirurgia", () => {
    expect(inicioDe(res({ turno: "tarde", inicio: 14 * 60 + 30, fim: 17 * 60 }))).toEqual(new Date(2026, 9, 23, 14, 30))
  })
  it("sem horário (turno da agenda), usa a hora de início do turno", () => {
    expect(inicioDe({ data: "2026-10-23", turno: "manha" })).toEqual(new Date(2026, 9, 23, 7))
    expect(inicioDe({ data: "2026-10-23", turno: "tarde" })).toEqual(new Date(2026, 9, 23, 13))
    expect(inicioDe({ data: "2026-10-23", turno: "noite" })).toEqual(new Date(2026, 9, 23, 19))
  })
  it("escreve horas no padrão do painel", () => {
    expect(hora(7 * 60)).toBe("07h")
    expect(hora(14 * 60 + 30)).toBe("14h30")
    expect(horario(res({ inicio: 13 * 60 + 30, fim: 16 * 60 }))).toBe("13h30 às 16h")
  })
})

describe("contato do locatário (48 horas antes)", () => {
  const r = res({}) // 23/10 às 7h
  it("fica oculto antes das 48 horas e libera exatamente em 48 horas", () => {
    expect(contatoLiberado(r, new Date(2026, 9, 21, 6, 59))).toBe(false)
    expect(contatoLiberado(r, new Date(2026, 9, 21, 7, 0))).toBe(true)
    expect(contatoLiberado(r, new Date(2026, 9, 22, 20))).toBe(true)
  })
  it("nunca libera para solicitação pendente, recusada ou cancelada", () => {
    const agora = new Date(2026, 9, 22, 20)
    for (const status of ["pendente", "recusada", "cancelada"] as const) expect(contatoLiberado(res({ status }), agora)).toBe(false)
  })
  it("informa quando o contato libera, e nada se já liberou ou não se aplica", () => {
    expect(liberaEm(r, new Date(2026, 9, 20, 12))).toEqual(new Date(2026, 9, 21, 7))
    expect(liberaEm(r, new Date(2026, 9, 22, 12))).toBeNull()
    expect(liberaEm(res({ status: "pendente" }), new Date(2026, 9, 20, 12))).toBeNull()
  })
})

describe("duração por extenso", () => {
  it("mostra dias e horas, horas e minutos ou só minutos", () => {
    expect(duracao((2 * 24 + 5) * 36e5)).toBe("2 dias e 5 h")
    expect(duracao(24 * 36e5)).toBe("1 dia")
    expect(duracao(5 * 36e5 + 20 * 6e4)).toBe("5 h e 20 min")
    expect(duracao(20 * 6e4)).toBe("20 min")
    expect(duracao(10e3)).toBe("menos de 1 min")
  })
})

describe("faturamento", () => {
  const agora = new Date(2026, 9, 21, 10)
  const rs = [
    res({ id: "a", data: "2026-10-05", status: "concluida", valor: 300000 }),
    res({ id: "b", data: "2026-10-21", turno: "manha", status: "confirmada", valor: 200000 }), // já começou hoje: conta como faturado
    res({ id: "c", data: "2026-10-28", status: "confirmada", valor: 400000 }),
    res({ id: "d", data: "2026-11-10", status: "confirmada", valor: 500000 }),
    res({ id: "e", data: "2026-10-25", status: "pendente", valor: 700000 }),
    res({ id: "f", data: "2026-10-08", status: "cancelada", valor: 900000 }),
    res({ id: "g", data: "2026-09-30", status: "concluida", valor: 800000 }),
  ]
  it("separa faturado no mês, previsão até o fim do mês, próximos 30 dias e o que está em aprovação", () => {
    expect(resumoFinanceiro(rs, agora)).toEqual({
      faturado: 500000,
      aReceberMes: 400000,
      previsto: 900000,
      proximos30: 900000,
      n30: 2,
      emAprovacao: 700000,
      nPendentes: 1,
    })
  })
  it("monta a série mensal com meses passados e futuros", () => {
    const s = serieMensal(rs, agora, 1, 1)
    expect(s.map((m) => m.rotulo)).toEqual(["set", "out", "nov"])
    expect(s.map((m) => [m.faturado, m.previsto])).toEqual([
      [800000, 0],
      [500000, 400000],
      [0, 500000],
    ])
  })
})

describe("notificações do hospital", () => {
  const rs = [res({ id: "p", status: "pendente", data: "2026-10-30" }), res({ id: "c", status: "confirmada", data: "2026-10-23" })]
  it("solicitação pendente vira notificação de aceite", () => {
    const n = notificacoesHospital(rs, new Date(2026, 9, 20, 12))
    expect(n.map((x) => x.id)).toEqual(["sol-p"])
  })
  it("ao entrar nas 48 horas, sobe a notificação de contato liberado", () => {
    const n = notificacoesHospital(rs, new Date(2026, 9, 21, 8))
    expect(n.map((x) => x.id)).toEqual(["ctt-c", "sol-p"])
    expect(n[0].tipo).toBe("contato")
  })
})

describe("agenda", () => {
  const agora = new Date(2026, 9, 21, 10)
  const rs = [
    res({ id: "c", data: "2026-10-23", turno: "manha" }),
    res({ id: "p", data: "2026-10-23", turno: "tarde", inicio: 14 * 60, fim: 16 * 60, status: "pendente" }),
    res({ id: "x", data: "2026-10-24", turno: "manha", status: "recusada" }),
  ]
  const idx = indiceReservas(rs)
  const disp = { "2026-10-23": ["noite" as const], "2026-10-24": ["manha" as const], "2026-10-20": ["manha" as const] }
  it("classifica cada turno: reservado, pendente, livre, fechado ou passado", () => {
    expect(estadoTurno("2026-10-23", "manha", disp, idx, agora)).toBe("reservado")
    expect(estadoTurno("2026-10-23", "tarde", disp, idx, agora)).toBe("pendente")
    expect(estadoTurno("2026-10-23", "noite", disp, idx, agora)).toBe("livre")
    expect(estadoTurno("2026-10-24", "manha", disp, idx, agora)).toBe("livre") // recusada libera o turno
    expect(estadoTurno("2026-10-24", "tarde", disp, idx, agora)).toBe("fechado")
    expect(estadoTurno("2026-10-20", "manha", disp, idx, agora)).toBe("passado")
  })
  it("um turno guarda várias cirurgias em ordem de horário, e uma confirmada basta para o turno contar como reservado", () => {
    const varias = [
      res({ id: "b", data: "2026-10-23", turno: "tarde", sala: "Sala 2", inicio: 16 * 60, fim: 18 * 60, status: "pendente" }),
      res({ id: "a", data: "2026-10-23", turno: "tarde", sala: "Sala 1", inicio: 13 * 60 + 30, fim: 15 * 60 }),
    ]
    const i = indiceReservas(varias)
    expect(i.get("2026-10-23|tarde")?.map((r) => r.id)).toEqual(["a", "b"])
    expect(estadoTurno("2026-10-23", "tarde", disp, i, agora)).toBe("reservado")
  })
  it("calcula a ocupação entre os turnos ofertados", () => {
    // ofertados nos próximos dias: 23 manhã (reservado), 23 tarde (pendente, não conta), 23 noite e 24 manhã livres
    expect(ocupacao(rs, disp, agora, 30)).toBeCloseTo(1 / 3)
  })
})

describe("semana da agenda", () => {
  it("põe lado a lado só as cirurgias que se sobrepõem", () => {
    const a = res({ id: "a", inicio: 7 * 60, fim: 9 * 60 })
    const b = res({ id: "b", inicio: 8 * 60, fim: 10 * 60, sala: "Sala 2" })
    const c = res({ id: "c", inicio: 10 * 60, fim: 12 * 60 })
    expect(distribuir([c, b, a]).map((x) => [x.r.id, x.coluna, x.colunas])).toEqual([
      ["a", 0, 2],
      ["b", 1, 2],
      ["c", 0, 1],
    ])
  })
})

describe("textos", () => {
  it("junta listas em minúscula no meio da frase, sem estragar siglas", () => {
    expect(juntar(["Torre de artroscopia", "Arco em C", "LCA"])).toBe("Torre de artroscopia, arco em C e LCA")
    expect(juntar(["Pernoite na recuperação", "Cinta modeladora", "Bisturi bipolar"])).toBe("Pernoite na recuperação, cinta modeladora e bisturi bipolar")
    expect(juntar(["Arco em C"])).toBe("Arco em C")
    expect(juntar([])).toBe("")
  })

  it("põe só a inicial em minúscula e mantém siglas", () => {
    expect(minuscula("Reconstrução de LCA")).toBe("reconstrução de LCA")
    expect(minuscula("LCA")).toBe("LCA")
    expect(minuscula("")).toBe("")
  })
})
