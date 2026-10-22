// Dados fictícios do protótipo. Nenhum hospital aqui existe.

export type TurnoId = "manha" | "tarde" | "noite"
// de/ate: minutos desde 0h, para posicionar cirurgias e faixas na semana da agenda
export const TURNOS: { id: TurnoId; nome: string; horas: string; de: number; ate: number }[] = [
  { id: "manha", nome: "Manhã", horas: "07h às 13h", de: 7 * 60, ate: 13 * 60 },
  { id: "tarde", nome: "Tarde", horas: "13h às 19h", de: 13 * 60, ate: 19 * 60 },
  { id: "noite", nome: "Noite", horas: "19h às 23h", de: 19 * 60, ate: 23 * 60 },
]
export const TURNO = Object.fromEntries(TURNOS.map((t) => [t.id, t])) as Record<TurnoId, (typeof TURNOS)[number]>

export type Espaco = {
  id: string
  nome: string
  cidade: string
  uf: string
  endereco: string
  salas: number
  porte: string
  preco: number // centavos por turno
  tema: number
  inicio: number
  livre: number
  esp: string[]
  descricao: string
  equip: string[]
  agenda: Record<string, TurnoId[]>
  proxima: Date
}

/* ---------- datas e dinheiro ---------- */
const DIAS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"]
const DIAS_L = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"]
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]
export const MESES_L = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"]
export const dataCurta = (d: Date) => `${DIAS[d.getDay()]}, ${d.getDate()} ${MESES[d.getMonth()]}`
export const dataLonga = (d: Date) => `${DIAS_L[d.getDay()]}, ${d.getDate()} de ${MESES_L[d.getMonth()]}`
export const chave = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
export const deChave = (k: string) => {
  const [a, m, d] = k.split("-").map(Number)
  return new Date(a, m - 1, d)
}
export const hoje = (() => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
})()
const somaDias = (d: Date, n: number) => {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}
const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })
export const reais = (centavos: number) => BRL.format(centavos / 100)
export const listaPt = (a: string[]) => {
  const b = a.map((x, i) => (i ? x.toLowerCase() : x))
  return b.length < 2 ? (b[0] ?? "") : `${b.slice(0, -1).join(", ")} e ${b[b.length - 1]}`
}
export const cidadeDe = (e: Pick<Espaco, "cidade" | "uf">) => `${e.cidade}, ${e.uf}`

// PRNG com semente: a mesma agenda e as mesmas "fotos" a cada visita
export function rng(str: string) {
  let a = 0
  for (const ch of str) a = Math.imul(a ^ ch.charCodeAt(0), 2654435761) >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type Base = Omit<Espaco, "agenda" | "proxima">
const BASE: Base[] = [
  { id: "vila-aurora", nome: "Hospital Vila Aurora", cidade: "Guarulhos", uf: "SP", endereco: "Av. Emílio Ribas, 1480 - Vila Galvão", salas: 4, porte: "Médio e grande porte", preco: 320000, tema: 0, inicio: 1, livre: 0.5,
    esp: ["Plástica", "Ortopedia", "Cirurgia geral"],
    descricao: "Centro cirúrgico equipado com quatro salas integradas, focos de LED duplos e aparelhos de anestesia com ventilação microprocessada. Fica a 15 minutos do aeroporto e recebe bem cirurgias plásticas e ortopédicas de médio porte.",
    equip: ["Mesa cirúrgica elétrica com 5 articulações", "Foco cirúrgico de LED duplo", "Aparelho de anestesia com ventilador microprocessado", "Monitor multiparamétrico", "Arco cirúrgico (arco em C)", "Bisturi elétrico de alta frequência", "Recuperação pós-anestésica com 6 leitos", "UTI de retaguarda no mesmo prédio"] },
  { id: "ipe-dourado", nome: "Centro Cirúrgico Ipê Dourado", cidade: "São Paulo", uf: "SP", endereco: "Al. dos Anapurus, 702 - Moema", salas: 3, porte: "Pequeno e médio porte", preco: 380000, tema: 3, inicio: 2, livre: 0.42,
    esp: ["Plástica", "Dermatológica", "Oftalmologia"],
    descricao: "Centro cirúrgico equipado com fluxo laminar nas três salas, microscópio cirúrgico e sala de recuperação com acompanhante. Pensado para procedimentos estéticos e oftalmológicos com alta no mesmo dia.",
    equip: ["Fluxo laminar em todas as salas", "Microscópio cirúrgico", "Foco cirúrgico de LED com câmera", "Aparelho de anestesia com capnografia", "Monitor multiparamétrico", "Lipoaspirador com vibração", "Recuperação com 4 leitos e acompanhante", "Estacionamento com manobrista"] },
  { id: "jardim-acacias", nome: "Hospital Jardim das Acácias", cidade: "Campinas", uf: "SP", endereco: "R. Coronel Quirino, 1915 - Cambuí", salas: 6, porte: "Médio e grande porte", preco: 290000, tema: 1, inicio: 3, livre: 0.55,
    esp: ["Ortopedia", "Urologia", "Cirurgia geral"],
    descricao: "Centro cirúrgico equipado com seis salas, torre de videolaparoscopia 4K e intensificador de imagem. Tem CME própria e UTI adulto de retaguarda para cirurgias de maior porte.",
    equip: ["Torre de videolaparoscopia 4K", "Intensificador de imagem", "Mesa ortopédica com tração", "Aparelho de anestesia com ventilador microprocessado", "Bisturi elétrico e bipolar", "Central de material esterilizado própria", "UTI adulto de retaguarda", "Banco de sangue conveniado"] },
  { id: "alameda", nome: "Centro Médico Alameda", cidade: "Guarulhos", uf: "SP", endereco: "R. Sete de Setembro, 220 - Centro", salas: 2, porte: "Pequeno porte", preco: 180000, tema: 2, inicio: 2, livre: 0.6,
    esp: ["Cirurgia geral", "Vascular", "Proctologia"],
    descricao: "Centro cirúrgico equipado para procedimentos de pequeno porte com anestesia local ou sedação. Duas salas compactas, recuperação rápida e o menor valor por turno da região.",
    equip: ["Mesa cirúrgica hidráulica", "Foco cirúrgico de LED", "Monitor multiparamétrico", "Bisturi elétrico", "Aparelho de ultrassom para vascular", "Carro de emergência com desfibrilador", "Recuperação com 3 leitos"] },
  { id: "patio-norte", nome: "Day Hospital Pátio Norte", cidade: "Rio de Janeiro", uf: "RJ", endereco: "Av. das Américas, 3301 - Barra da Tijuca", salas: 3, porte: "Pequeno e médio porte", preco: 350000, tema: 0, inicio: 4, livre: 0.45,
    esp: ["Plástica", "Otorrino", "Ginecologia"],
    descricao: "Centro cirúrgico equipado com três salas de day hospital, videoendoscopia para otorrino e histeroscopia. A paciente chega, opera e vai para casa no mesmo dia.",
    equip: ["Torre de videoendoscopia", "Histeroscópio cirúrgico", "Foco cirúrgico de LED duplo", "Aparelho de anestesia com capnografia", "Monitor multiparamétrico", "Aspirador cirúrgico", "Recuperação com 5 leitos"] },
  { id: "ribeira-nova", nome: "Hospital Ribeira Nova", cidade: "Curitiba", uf: "PR", endereco: "Av. Batel, 1550 - Batel", salas: 5, porte: "Médio e grande porte", preco: 310000, tema: 1, inicio: 6, livre: 0.5,
    esp: ["Ortopedia", "Neurocirurgia", "Cirurgia geral"],
    descricao: "Centro cirúrgico equipado com navegação para coluna, microscópio de neurocirurgia e arco em C em todas as salas. Equipe de enfermagem dedicada ao centro cirúrgico em todos os turnos.",
    equip: ["Microscópio para neurocirurgia", "Arco em C em todas as salas", "Mesa cirúrgica radiotransparente", "Aparelho de anestesia com ventilador microprocessado", "Monitorização neurofisiológica", "Bisturi ultrassônico", "UTI de retaguarda", "Central de material esterilizado própria"] },
  { id: "bosque-real", nome: "Hospital Bosque Real", cidade: "Ribeirão Preto", uf: "SP", endereco: "Av. Pres. Vargas, 2121 - Jardim América", salas: 4, porte: "Médio e grande porte", preco: 300000, tema: 3, inicio: 8, livre: 0.4,
    esp: ["Bariátrica", "Ortopedia", "Plástica"],
    descricao: "Centro cirúrgico equipado com mesa bariátrica para até 450 kg, torre de laparoscopia 4K e grampeadores disponíveis no local. Referência regional em cirurgia bariátrica.",
    equip: ["Mesa cirúrgica bariátrica (até 450 kg)", "Torre de videolaparoscopia 4K", "Foco cirúrgico de LED duplo", "Aparelho de anestesia com ventilador microprocessado", "Monitor multiparamétrico", "Bisturi elétrico e selador de vasos", "UTI de retaguarda"] },
  { id: "lagoa-clara", nome: "Instituto Cirúrgico Lagoa Clara", cidade: "Florianópolis", uf: "SC", endereco: "Av. das Rendeiras, 410 - Lagoa da Conceição", salas: 3, porte: "Pequeno e médio porte", preco: 340000, tema: 2, inicio: 5, livre: 0.45,
    esp: ["Plástica", "Oftalmologia"],
    descricao: "Centro cirúrgico equipado com fluxo laminar, microscópio oftalmológico e facoemulsificador. Recuperação com vista para a lagoa e apartamentos para pernoite quando preciso.",
    equip: ["Fluxo laminar", "Microscópio oftalmológico", "Facoemulsificador", "Foco cirúrgico de LED", "Aparelho de anestesia com capnografia", "Monitor multiparamétrico", "Apartamentos para pernoite"] },
  { id: "serra-mirante", nome: "Hospital Serra do Mirante", cidade: "Belo Horizonte", uf: "MG", endereco: "R. Pernambuco, 1077 - Savassi", salas: 5, porte: "Médio e grande porte", preco: 330000, tema: 0, inicio: 3, livre: 0.5,
    esp: ["Urologia", "Ortopedia", "Cirurgia geral"],
    descricao: "Centro cirúrgico equipado com laser urológico, torre de videocirurgia e arco em C. Cinco salas com sala de indução anestésica separada, o que agiliza a troca entre cirurgias.",
    equip: ["Laser de holmium para urologia", "Torre de videocirurgia", "Arco cirúrgico (arco em C)", "Sala de indução anestésica", "Aparelho de anestesia com ventilador microprocessado", "Monitor multiparamétrico", "UTI de retaguarda"] },
  { id: "horizonte", nome: "Clínica Cirúrgica Horizonte", cidade: "São Paulo", uf: "SP", endereco: "R. Tuiuti, 2310 - Tatuapé", salas: 2, porte: "Pequeno e médio porte", preco: 240000, tema: 1, inicio: 1, livre: 0.55,
    esp: ["Plástica", "Vascular", "Dermatológica"],
    descricao: "Centro cirúrgico equipado com duas salas recém-reformadas, foco de LED e laser vascular. Fica a 5 minutos do metrô Tatuapé.",
    equip: ["Foco cirúrgico de LED", "Laser vascular endovenoso", "Aparelho de anestesia com capnografia", "Monitor multiparamétrico", "Bisturi elétrico", "Recuperação com 3 leitos", "Carro de emergência com desfibrilador"] },
]

function gerarAgenda(e: Base) {
  const r = rng(e.id)
  const ag: Record<string, TurnoId[]> = {}
  for (let i = e.inicio; i < 92; i++) {
    const d = somaDias(hoje, i)
    const domingo = d.getDay() === 0
    if (i !== e.inicio && r() > (domingo ? 0.12 : e.livre)) continue
    let t = TURNOS.filter(() => r() < 0.55).map((x) => x.id)
    if (!t.length && i === e.inicio) t = ["tarde"]
    if (t.length) ag[chave(d)] = t
  }
  return ag
}

export const ESPACOS: Espaco[] = BASE.map((b) => {
  const agenda = gerarAgenda(b)
  return { ...b, agenda, proxima: deChave(Object.keys(agenda)[0]) }
})
export const ESPACO = Object.fromEntries(ESPACOS.map((e) => [e.id, e]))
export const CIDADES = [...new Set(ESPACOS.map(cidadeDe))].sort((a, b) => a.localeCompare(b, "pt-BR"))
