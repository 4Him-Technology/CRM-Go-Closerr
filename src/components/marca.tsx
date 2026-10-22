import { cn } from "@/lib/utils"

// Marca conforme a logo enviada: símbolo 3D verde-limão (recortado do arquivo original, fundo transparente)
// e "Gocloserr" em cinza escuro. shortcut: o texto é composto na fonte; trocar pelo arquivo completo da logo quando ele estiver no projeto.
export function Marca({ className, tamanho = 34, soSimbolo }: { className?: string; tamanho?: number; soSimbolo?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 font-heading text-[22px] font-bold tracking-[-0.02em] text-[#3a3a3a]", className)}>
      <img src="./marca.png" alt={soSimbolo ? "Gocloserr" : ""} width={Math.round(tamanho * 1.24)} height={tamanho} decoding="async" className="shrink-0" />
      {!soSimbolo && "Gocloserr"}
    </span>
  )
}
