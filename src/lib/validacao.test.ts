import { describe, expect, it } from "vitest"
import {
  cnpjValido,
  cpfExemplo,
  cpfValido,
  luhn,
  mascara,
  MASCARAS,
  REGRAS,
  validadeOk,
} from "./validacao"

describe("cpf", () => {
  it("aceita CPF com dígitos corretos, com ou sem máscara", () => {
    expect(cpfValido("529.982.247-25")).toBe(true)
    expect(cpfValido("52998224725")).toBe(true)
  })
  it("recusa dígito errado, repetidos e tamanho errado", () => {
    expect(cpfValido("529.982.247-26")).toBe(false)
    expect(cpfValido("111.111.111-11")).toBe(false)
    expect(cpfValido("529.982.247")).toBe(false)
  })
  it("gera CPF de exemplo sempre válido", () => {
    for (let i = 0; i < 50; i++) expect(cpfValido(cpfExemplo())).toBe(true)
  })
})

describe("cnpj", () => {
  it("valida os dois dígitos verificadores", () => {
    expect(cnpjValido("11.222.333/0001-81")).toBe(true)
    expect(cnpjValido("11.222.333/0001-82")).toBe(false)
    expect(cnpjValido("00.000.000/0000-00")).toBe(false)
  })
})

describe("cartão", () => {
  it("usa o algoritmo de Luhn", () => {
    expect(luhn("4242 4242 4242 4242")).toBe(true)
    expect(luhn("4242 4242 4242 4241")).toBe(false)
    expect(luhn("")).toBe(false)
  })
  it("recusa validade vencida ou mês inválido", () => {
    const hoje = new Date(2026, 9, 13)
    expect(validadeOk("10/26", hoje)).toBe(true)
    expect(validadeOk("09/26", hoje)).toBe(false)
    expect(validadeOk("13/30", hoje)).toBe(false)
    expect(validadeOk("1/30", hoje)).toBe(false)
  })
})

describe("máscaras", () => {
  it("formata sem deixar separador sobrando no fim", () => {
    expect(mascara("11987654321", "(##) #####-####")).toBe("(11) 98765-4321")
    expect(mascara("119", "(##) #####-####")).toBe("(11) 9")
    expect(mascara("11", "(##) #####-####")).toBe("(11")
  })
  it("documento troca de CPF para CNPJ pelo tamanho", () => {
    expect(MASCARAS.doc("52998224725")).toBe("529.982.247-25")
    expect(MASCARAS.doc("11222333000181")).toBe("11.222.333/0001-81")
  })
  it("celular de 10 ou 11 dígitos", () => {
    expect(MASCARAS.tel("1134567890")).toBe("(11) 3456-7890")
    expect(MASCARAS.tel("11987654321")).toBe("(11) 98765-4321")
  })
})

describe("regras dos formulários", () => {
  it("devolve true ou a mensagem de erro", () => {
    expect(REGRAS.nome("Helena Ramos")).toBe(true)
    expect(REGRAS.nome("Helena")).toMatch(/nome completo/)
    expect(REGRAS.email("helena@clinica.com.br")).toBe(true)
    expect(REGRAS.email("helena@clinica")).toMatch(/e-mail/)
    expect(REGRAS.tel("(11) 98765-4321")).toBe(true)
    expect(REGRAS.doc("123")).toMatch(/CPF/)
    expect(REGRAS.crm("12")).toMatch(/CRM/)
    expect(REGRAS.salas("0")).toMatch(/1 a 40/)
  })
})

describe("cep", () => {
  it("formata e exige 8 dígitos", () => {
    expect(MASCARAS.cep("01310100")).toBe("01310-100")
    expect(REGRAS.cep("01310-100")).toBe(true)
    expect(REGRAS.cep("0131")).toMatch(/CEP/)
  })
})
