import { ESPACOS, type Espaco } from "@/data/espacos"
import { cn } from "@/lib/utils"

// Fotos reais de banco de imagens (Pexels e Unsplash, ver docs/creditos-fotos.md).
// shortcut: as mesmas 19 fotos se repetem entre os espaços fictícios; trocar pelas fotos de cada centro no credenciamento.
const PRINCIPAIS = ["sala-02", "sala-03", "sala-05", "sala-04", "sala-06", "sala-08", "sala-07", "sala-09", "sala-10", "sala-12"]
const SALAS = Array.from({ length: 13 }, (_, i) => `sala-${String(i + 1).padStart(2, "0")}`)
const DETALHES: [string, string][] = [
  ["foco-01", "Focos cirúrgicos de LED"],
  ["equip-01", "Torre de equipamentos"],
  ["foco-02", "Foco cirúrgico"],
  ["equip-02", "Equipamentos de vídeo"],
]

export const N_FOTOS = 5
export const urlFoto = (nome: string) => `./fotos/${nome}.webp`

export function fotosDe(e: Espaco) {
  const i = Math.max(0, ESPACOS.findIndex((x) => x.id === e.id))
  const principal = PRINCIPAIS[i % PRINCIPAIS.length]
  const outras = SALAS.filter((s) => s !== principal)
  return [
    { nome: principal, legenda: "Sala cirúrgica 1" },
    { nome: outras[(i * 3) % outras.length], legenda: "Sala cirúrgica 2" },
    { nome: DETALHES[i % 4][0], legenda: DETALHES[i % 4][1] },
    { nome: outras[(i * 3 + 5) % outras.length], legenda: "Sala cirúrgica 3" },
    { nome: i % 2 ? "equipe-02" : "equipe-01", legenda: "Sala em uso" },
  ]
}

export function FotoSala({ espaco, indice = 0, rotulo, prioridade, className }: { espaco: Espaco; indice?: number; rotulo?: boolean; prioridade?: boolean; className?: string }) {
  const f = fotosDe(espaco)[indice % N_FOTOS]
  return (
    <img
      src={urlFoto(f.nome)}
      alt={rotulo ? `${f.legenda} do ${espaco.nome}` : ""}
      loading={prioridade ? "eager" : "lazy"}
      decoding="async"
      draggable={false}
      className={cn("block size-full object-cover", className)}
    />
  )
}
