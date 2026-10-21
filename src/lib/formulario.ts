import { useState, type ChangeEvent } from "react"
import { MASCARAS, REGRAS, type Mascara, type Regra } from "@/lib/validacao"

// Estado de formulário com validação no envio e ao sair do campo. As regras vêm de lib/validacao (testadas).
export function useFormulario<K extends string>(inicial: Record<K, string>, regras: Partial<Record<K, Regra>>, mascaras: Partial<Record<K, Mascara>> = {}) {
  const [v, setV] = useState(inicial)
  const [erros, setErros] = useState<Partial<Record<K, string>>>({})

  const msg = (k: K, val: string) => {
    const r = regras[k]
    if (!r) return ""
    const res = REGRAS[r](val)
    return res === true ? "" : res
  }
  const checar = (k: K, val = v[k]) => {
    const m = msg(k, val)
    setErros((e) => ({ ...e, [k]: m }))
    return !m
  }
  const validar = () => {
    const novos: Partial<Record<K, string>> = {}
    let primeiro: K | null = null
    for (const k of Object.keys(regras) as K[]) {
      const m = msg(k, v[k])
      novos[k] = m
      if (m && !primeiro) primeiro = k
    }
    setErros(novos)
    if (primeiro) document.getElementById(primeiro)?.focus()
    return !primeiro
  }
  const preencher = (dados: Partial<Record<K, string>>) => {
    setV((a) => ({ ...a, ...dados }))
    setErros({})
  }
  const campo = (k: K) => ({
    id: k,
    value: v[k],
    erro: erros[k],
    onChange: (ev: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const m = mascaras[k]
      const val = m ? MASCARAS[m](ev.target.value) : ev.target.value
      setV((a) => ({ ...a, [k]: val }))
      if (erros[k]) checar(k, val)
    },
    onBlur: () => {
      if (v[k]) checar(k)
    },
  })
  return { v, validar, preencher, campo }
}
