export const dig = (v: string) => String(v).replace(/\D/g, "")

export function cpfValido(v: string) {
  const c = dig(v)
  if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false
  for (const n of [9, 10]) {
    let s = 0
    for (let i = 0; i < n; i++) s += +c[i] * (n + 1 - i)
    if (((s * 10) % 11) % 10 !== +c[n]) return false
  }
  return true
}

export function cnpjValido(v: string) {
  const c = dig(v)
  if (c.length !== 14 || /^(\d)\1+$/.test(c)) return false
  const calc = (n: number) => {
    let s = 0
    let w = n - 7
    for (let i = 0; i < n; i++) {
      s += +c[i] * w--
      if (w < 2) w = 9
    }
    const r = s % 11
    return r < 2 ? 0 : 11 - r
  }
  return calc(12) === +c[12] && calc(13) === +c[13]
}

export function luhn(v: string) {
  const d = dig(v)
  let s = 0
  for (let i = 0; i < d.length; i++) {
    let n = +d[d.length - 1 - i]
    if (i % 2) {
      n *= 2
      if (n > 9) n -= 9
    }
    s += n
  }
  return d.length > 0 && s % 10 === 0
}

export function validadeOk(v: string, hoje = new Date()) {
  const m = v.match(/^(\d{2})\/(\d{2})$/)
  if (!m) return false
  const mes = +m[1]
  // válido até o último dia do mês impresso
  return mes >= 1 && mes <= 12 && new Date(2000 + +m[2], mes, 1) > hoje
}

export function mascara(v: string, padrao: string) {
  const d = dig(v)
  let o = ""
  let i = 0
  for (const ch of padrao) {
    if (i >= d.length) break
    o += ch === "#" ? d[i++] : ch
  }
  return o
}

export const MASCARAS = {
  doc: (v: string) => (dig(v).length <= 11 ? mascara(v, "###.###.###-##") : mascara(v, "##.###.###/####-##")),
  cnpj: (v: string) => mascara(v, "##.###.###/####-##"),
  tel: (v: string) => (dig(v).length <= 10 ? mascara(v, "(##) ####-####") : mascara(v, "(##) #####-####")),
  cartao: (v: string) => mascara(v, "#### #### #### ####"),
  validade: (v: string) => mascara(v, "##/##"),
  cvv: (v: string) => dig(v).slice(0, 4),
  crm: (v: string) => dig(v).slice(0, 7),
  num: (v: string) => dig(v).slice(0, 2),
  cep: (v: string) => mascara(v, "#####-###"),
} as const
export type Mascara = keyof typeof MASCARAS

export function cpfExemplo() {
  const b = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10))
  for (const n of [9, 10]) {
    let s = 0
    for (let i = 0; i < n; i++) s += b[i] * (n + 1 - i)
    b.push(((s * 10) % 11) % 10)
  }
  return MASCARAS.doc(b.join(""))
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export const REGRAS = {
  nome: (v: string) => v.trim().split(/\s+/).length >= 2 || "Informe o nome completo ou a razão social.",
  texto: (v: string) => v.trim().length >= 3 || "Preencha este campo.",
  doc: (v: string) => {
    const n = dig(v).length
    if (n === 11) return cpfValido(v) || "CPF inválido. Confira os números."
    if (n === 14) return cnpjValido(v) || "CNPJ inválido. Confira os números."
    return "Informe um CPF (11 dígitos) ou um CNPJ (14 dígitos)."
  },
  cnpj: (v: string) => cnpjValido(v) || "CNPJ inválido. Confira os 14 dígitos.",
  crm: (v: string) => /^\d{4,7}$/.test(dig(v)) || "Informe o número do CRM, só os dígitos.",
  uf: (v: string) => !!v || "Escolha a UF.",
  email: (v: string) => EMAIL.test(v.trim()) || "Informe um e-mail válido, como nome@clinica.com.br.",
  tel: (v: string) => dig(v).length === 11 || "Informe o celular com DDD (11 dígitos).",
  salas: (v: string) => (+v >= 1 && +v <= 40) || "Informe de 1 a 40 salas.",
  cep: (v: string) => dig(v).length === 8 || "Informe o CEP com 8 dígitos.",
  cartao: (v: string) => (dig(v).length >= 15 && luhn(v)) || "Número de cartão inválido. Confira os dígitos.",
  titular: (v: string) => v.trim().length >= 3 || "Informe o nome como está impresso no cartão.",
  validade: (v: string) => validadeOk(v) || "Validade inválida ou vencida. Use MM/AA.",
  cvv: (v: string) => /^\d{3,4}$/.test(v) || "Informe os 3 ou 4 dígitos do verso do cartão.",
} as const
export type Regra = keyof typeof REGRAS

export const UFS = "AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" ")
