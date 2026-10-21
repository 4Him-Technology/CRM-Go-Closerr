// Movimento segue a skill design-motion-principles.
// Marketplace: Jakub (acabamento sutil) é a lente principal, Jhey só nos heros, Emil no checkout e nos formulários.

// Entrada padrão (Jakub): opacidade + translateY curto + blur, mola sem quique.
export const MOLA = { type: "spring", duration: 0.45, bounce: 0 } as const
export const MOLA_RAPIDA = { type: "spring", duration: 0.3, bounce: 0 } as const

export const ENTRAR = {
  initial: { opacity: 0, y: 8, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: MOLA,
} as const

// Saída mais discreta que a entrada.
export const SAIR = { opacity: 0, y: -4, filter: "blur(4px)", transition: { duration: 0.16, ease: [0.4, 0, 1, 1] } } as const

// Revelação ao rolar: dispara uma vez, por posição, não pela velocidade da rolagem.
export const AO_ROLAR = {
  initial: { opacity: 0, y: 12, filter: "blur(4px)" },
  whileInView: { opacity: 1, y: 0, filter: "blur(0px)" },
  viewport: { once: true, margin: "0px 0px -10% 0px" },
  transition: MOLA,
} as const

export const atraso = (i: number, passo = 0.05) => ({ ...MOLA, delay: i * passo })
