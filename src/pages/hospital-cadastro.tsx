import { useState, type ChangeEvent, type DragEvent } from "react"
import { AnimatePresence, motion } from "motion/react"
import { ExternalLink, ImagePlus, Plus, Star, Trash2, X } from "lucide-react"
import { BOTAO_PRIMARIO, BOTAO_SECUNDARIO, CAMPO, Campo, Cartao, Topo } from "@/components/ui"
import { HOSPITAL_ID, SITE } from "@/data/crm"
import { ESPACO, reais } from "@/data/espacos"
import { futura } from "@/lib/crm"
import { useCrm, type Foto, type Sala } from "@/lib/crm-estado"
import { MOLA_RAPIDA } from "@/lib/motion"
import { cn } from "@/lib/utils"

const ESPECIALIDADES = ["Plástica", "Ortopedia", "Cirurgia geral", "Urologia", "Vascular", "Ginecologia", "Otorrino", "Oftalmologia", "Dermatológica", "Neurocirurgia", "Bariátrica", "Proctologia"]
const PORTES = ["Pequeno porte", "Pequeno e médio porte", "Médio e grande porte"]
const TIPOS_SALA = ["Sala cirúrgica geral", "Sala com fluxo laminar", "Sala de procedimentos", "Sala híbrida"]
const TIPOS_FOTO = ["image/jpeg", "image/png", "image/webp"]
const MAX_FOTO = 8 * 1024 * 1024
const MAX_FOTOS = 20
const novoId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

export function HospitalCadastro() {
  const { centro, setCentro, salas, setSalas, fotos, setFotos, doHospital, agora, avisar } = useCrm()
  const [c, setC] = useState(centro)
  const [ss, setSs] = useState(salas)
  const [fs, setFs] = useState(fotos)
  const [novoEquip, setNovoEquip] = useState("")
  const [erroFoto, setErroFoto] = useState("")
  const [erros, setErros] = useState<Record<string, string>>({})
  const [arrastando, setArrastando] = useState(false)
  const alterado = JSON.stringify([c, ss, fs]) !== JSON.stringify([centro, salas, fotos])

  const reservasFuturas = (s: Sala) => doHospital.filter((r) => r.sala === s.nome && futura(r, agora) && (r.status === "confirmada" || r.status === "pendente")).length
  const mudarSala = (id: string, p: Partial<Sala>) => setSs((a) => a.map((s) => (s.id === id ? { ...s, ...p } : s)))

  // Validação de tipo, tamanho e conteúdo (a imagem precisa abrir). No sistema real o servidor repete essas checagens.
  async function enviar(arquivos: FileList | null) {
    if (!arquivos?.length) return
    const novas: Foto[] = []
    const problemas: string[] = []
    for (const f of Array.from(arquivos)) {
      if (fs.length + novas.length >= MAX_FOTOS) {
        problemas.push(`Limite de ${MAX_FOTOS} fotos por centro cirúrgico.`)
        break
      }
      if (!TIPOS_FOTO.includes(f.type)) problemas.push(`${f.name}: envie JPG, PNG ou WEBP.`)
      else if (f.size > MAX_FOTO) problemas.push(`${f.name}: cada foto pode ter até 8 MB.`)
      else {
        try {
          ;(await createImageBitmap(f)).close()
          novas.push({ id: novoId(), url: URL.createObjectURL(f), legenda: f.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ") })
        } catch {
          problemas.push(`${f.name}: o arquivo não abriu como imagem.`)
        }
      }
    }
    setErroFoto(problemas.join(" "))
    if (novas.length) setFs((a) => [...a, ...novas])
  }
  const remover = (f: Foto) => {
    if (f.url.startsWith("blob:")) URL.revokeObjectURL(f.url)
    setFs((a) => a.filter((x) => x.id !== f.id))
  }
  const soltar = (e: DragEvent) => {
    e.preventDefault()
    setArrastando(false)
    enviar(e.dataTransfer.files)
  }

  function salvar() {
    const novos: Record<string, string> = {}
    if (c.nome.trim().length < 3) novos.nome = "Informe o nome do centro cirúrgico."
    if (c.endereco.trim().length < 5) novos.endereco = "Informe o endereço completo."
    if (c.descricao.trim().length < 30) novos.descricao = "Descreva o centro com pelo menos 30 caracteres."
    if (!ss.length) novos.salas = "Cadastre pelo menos uma sala."
    ss.forEach((s) => {
      if (!s.nome.trim()) novos[`sala-${s.id}`] = "Dê um nome para a sala."
      else if (s.preco < 10000) novos[`sala-${s.id}`] = "O valor por turno precisa ser de pelo menos R$ 100,00."
    })
    if (!fs.length) novos.fotos = "Envie pelo menos uma foto."
    setErros(novos)
    const primeiro = Object.keys(novos)[0]
    if (primeiro) {
      document.getElementById(primeiro)?.focus()
      return
    }
    setCentro(c)
    setSalas(ss)
    setFotos(fs)
    avisar("Cadastro salvo. As mudanças aparecem no anúncio do site.")
  }
  const descartar = () => {
    setC(centro)
    setSs(salas)
    setFs(fotos)
    setErros({})
    setErroFoto("")
  }

  return (
    <>
      <Topo
        titulo="Cadastro do centro cirúrgico"
        subtitulo="Fotos, informações e salas que os médicos veem no anúncio."
        acoes={
          <a href={`${SITE}#espaco-${HOSPITAL_ID}`} className={BOTAO_SECUNDARIO}>
            <ExternalLink aria-hidden /> Ver anúncio no site
          </a>
        }
      />

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <Cartao titulo="Informações">
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo id="nome" rotulo="Nome do centro cirúrgico" erro={erros.nome} className="sm:col-span-2">
              <input id="nome" className={CAMPO} value={c.nome} onChange={(e) => setC({ ...c, nome: e.target.value })} aria-invalid={!!erros.nome} aria-describedby={erros.nome ? "erro-nome" : undefined} />
            </Campo>
            <Campo id="endereco" rotulo="Endereço" erro={erros.endereco} className="sm:col-span-2">
              <input id="endereco" className={CAMPO} value={c.endereco} onChange={(e) => setC({ ...c, endereco: e.target.value })} aria-invalid={!!erros.endereco} aria-describedby={erros.endereco ? "erro-endereco" : undefined} />
            </Campo>
            <Campo id="cidade" rotulo="Cidade">
              <input id="cidade" className={CAMPO} value={`${c.cidade}, ${c.uf}`} readOnly aria-describedby="cidade-ajuda" />
              <span id="cidade-ajuda" className="text-xs text-muted-foreground">Para mudar a cidade, fale com a Gocloserr.</span>
            </Campo>
            <Campo id="porte" rotulo="Porte das cirurgias">
              <select id="porte" className={CAMPO} value={c.porte} onChange={(e) => setC({ ...c, porte: e.target.value })}>
                {PORTES.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </Campo>
            <Campo id="descricao" rotulo="Descrição" erro={erros.descricao} className="sm:col-span-2">
              <textarea id="descricao" rows={4} className={cn(CAMPO, "h-auto py-2.5 leading-relaxed")} value={c.descricao} onChange={(e) => setC({ ...c, descricao: e.target.value })} aria-invalid={!!erros.descricao} aria-describedby={erros.descricao ? "erro-descricao" : undefined} />
            </Campo>
          </div>

          <fieldset className="mt-5">
            <legend className="mb-2 text-sm font-semibold">Especialidades atendidas</legend>
            <div className="flex flex-wrap gap-2">
              {ESPECIALIDADES.map((e) => {
                const on = c.esp.includes(e)
                return (
                  <button key={e} type="button" aria-pressed={on} onClick={() => setC({ ...c, esp: on ? c.esp.filter((x) => x !== e) : [...c.esp, e] })} className={cn("h-9 rounded-full px-3.5 text-sm font-semibold ring-1 transition-colors", on ? "bg-jade-escuro text-white ring-jade-escuro" : "bg-white text-muted-foreground ring-border hover:text-foreground")}>
                    {e}
                  </button>
                )
              })}
            </div>
          </fieldset>

          <div className="mt-5">
            <p className="mb-2 text-sm font-semibold" id="equip-titulo">
              Equipamentos e estrutura
            </p>
            <ul className="flex flex-wrap gap-2" aria-labelledby="equip-titulo">
              <AnimatePresence initial={false}>
                {c.equip.map((eq) => (
                  <motion.li key={eq} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.12 } }} transition={MOLA_RAPIDA} className="inline-flex items-center gap-1 rounded-full bg-jade-gelo py-1 pr-1 pl-3 text-sm font-medium text-jade-escuro">
                    {eq}
                    <button type="button" aria-label={`Remover ${eq}`} onClick={() => setC({ ...c, equip: c.equip.filter((x) => x !== eq) })} className="grid size-6 place-items-center rounded-full hover:bg-white">
                      <X className="size-3.5" aria-hidden />
                    </button>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
            <form
              className="mt-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                const v = novoEquip.trim()
                if (v && !c.equip.includes(v)) setC({ ...c, equip: [...c.equip, v] })
                setNovoEquip("")
              }}
            >
              <label htmlFor="novo-equip" className="sr-only">
                Novo equipamento
              </label>
              <input id="novo-equip" className={CAMPO} placeholder="Ex.: Torre de videolaparoscopia 4K" value={novoEquip} onChange={(e) => setNovoEquip(e.target.value)} maxLength={80} />
              <button type="submit" className={cn(BOTAO_SECUNDARIO, "h-11")}>
                <Plus aria-hidden /> Adicionar
              </button>
            </form>
          </div>
        </Cartao>

        <Cartao i={1} titulo={`Fotos (${fs.length})`}>
          <label
            htmlFor="fotos"
            onDragOver={(e) => {
              e.preventDefault()
              setArrastando(true)
            }}
            onDragLeave={() => setArrastando(false)}
            onDrop={soltar}
            className={cn("flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-4 py-7 text-center transition-colors focus-within:border-ring", arrastando ? "border-jade bg-jade-gelo" : "border-[#c9dad0] hover:bg-jade-gelo/60")}
          >
            <span className="grid size-11 place-items-center rounded-full bg-jade-gelo text-jade-tinta">
              <ImagePlus className="size-5" aria-hidden />
            </span>
            <span className="font-semibold">Arraste as fotos ou clique para escolher</span>
            <span className="text-sm text-muted-foreground">JPG, PNG ou WEBP, até 8 MB cada, no máximo {MAX_FOTOS} fotos. A primeira é a capa do anúncio.</span>
            <input
              id="fotos"
              type="file"
              accept={TIPOS_FOTO.join(",")}
              multiple
              className="sr-only"
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                enviar(e.target.files)
                e.target.value = ""
              }}
              aria-describedby={erroFoto || erros.fotos ? "erro-fotos" : undefined}
            />
          </label>
          {(erroFoto || erros.fotos) && (
            <p id="erro-fotos" role="alert" className="mt-2 text-sm font-medium text-destructive">
              {erroFoto || erros.fotos}
            </p>
          )}

          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3">
            <AnimatePresence initial={false}>
              {fs.map((f, i) => (
                <motion.li key={f.id} layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.14 } }} transition={MOLA_RAPIDA} className="flex flex-col gap-1.5">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-jade-gelo">
                    <img src={f.url} alt={f.legenda} loading="lazy" decoding="async" className="size-full object-cover" />
                    {i === 0 && (
                      <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-jade-noite/85 px-2 py-0.5 text-xs font-semibold text-white">
                        <Star className="size-3" aria-hidden /> Capa
                      </span>
                    )}
                    <div className="absolute right-2 bottom-2 flex gap-1">
                      {i > 0 && (
                        <button type="button" onClick={() => setFs((a) => [f, ...a.filter((x) => x.id !== f.id)])} aria-label={`Usar ${f.legenda} como capa`} className="grid size-8 place-items-center rounded-full bg-white/90 text-foreground shadow transition-colors hover:bg-white">
                          <Star className="size-4" aria-hidden />
                        </button>
                      )}
                      <button type="button" onClick={() => remover(f)} aria-label={`Remover ${f.legenda}`} className="grid size-8 place-items-center rounded-full bg-white/90 text-destructive shadow transition-colors hover:bg-white">
                        <Trash2 className="size-4" aria-hidden />
                      </button>
                    </div>
                  </div>
                  <label className="sr-only" htmlFor={`leg-${f.id}`}>
                    Legenda da foto {i + 1}
                  </label>
                  <input id={`leg-${f.id}`} value={f.legenda} maxLength={60} onChange={(e) => setFs((a) => a.map((x) => (x.id === f.id ? { ...x, legenda: e.target.value } : x)))} className="h-8 rounded-lg px-2 text-sm outline-none hover:bg-jade-gelo focus:bg-white focus:ring-2 focus:ring-ring/25" />
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </Cartao>
      </div>

      <Cartao
        i={2}
        className="mt-4"
        titulo={`Salas para locação (${ss.length})`}
        acao={
          <button type="button" className={BOTAO_SECUNDARIO} onClick={() => setSs((a) => [...a, { id: novoId(), nome: `Sala ${a.length + 1}`, tipo: TIPOS_SALA[0], preco: ESPACO[HOSPITAL_ID].preco, ativa: true }])}>
            <Plus aria-hidden /> Adicionar sala
          </button>
        }
      >
        {erros.salas && (
          <p id="salas" tabIndex={-1} role="alert" className="mb-3 text-sm font-medium text-destructive">
            {erros.salas}
          </p>
        )}
        <ul className="flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {ss.map((s) => {
              const futuras = reservasFuturas(s)
              const erro = erros[`sala-${s.id}`]
              return (
                <motion.li key={s.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.14 } }} transition={MOLA_RAPIDA} className="grid items-end gap-3 rounded-xl p-3 ring-1 ring-border md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_160px_auto_auto]">
                  <Campo id={`sala-${s.id}`} rotulo="Nome" erro={erro}>
                    <input id={`sala-${s.id}`} className={CAMPO} value={s.nome} onChange={(e) => mudarSala(s.id, { nome: e.target.value })} aria-invalid={!!erro} aria-describedby={erro ? `erro-sala-${s.id}` : undefined} />
                  </Campo>
                  <Campo id={`tipo-${s.id}`} rotulo="Tipo">
                    <select id={`tipo-${s.id}`} className={CAMPO} value={s.tipo} onChange={(e) => mudarSala(s.id, { tipo: e.target.value })}>
                      {TIPOS_SALA.map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </Campo>
                  <Campo id={`preco-${s.id}`} rotulo="Valor por turno (R$)">
                    <input id={`preco-${s.id}`} type="number" min={100} step={50} inputMode="decimal" className={cn(CAMPO, "tabular")} value={s.preco / 100} onChange={(e) => mudarSala(s.id, { preco: Math.round(Number(e.target.value) * 100) })} aria-describedby={`preco-ajuda-${s.id}`} />
                    <span id={`preco-ajuda-${s.id}`} className="sr-only">
                      Atual: {reais(s.preco)}
                    </span>
                  </Campo>
                  <div className="flex h-11 items-center gap-2 text-sm font-semibold">
                    <button type="button" role="switch" aria-checked={s.ativa} aria-label={`${s.nome || "Sala"} disponível para locação`} onClick={() => mudarSala(s.id, { ativa: !s.ativa })} className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors", s.ativa ? "bg-jade-escuro" : "bg-[#c9dad0]")}>
                      <motion.span layout transition={MOLA_RAPIDA} className={cn("absolute top-1 size-5 rounded-full bg-white shadow", s.ativa ? "right-1" : "left-1")} />
                    </button>
                    <span aria-hidden>{s.ativa ? "Disponível" : "Pausada"}</span>
                  </div>
                  <div className="flex flex-col items-start gap-1">
                    <button type="button" disabled={futuras > 0} onClick={() => setSs((a) => a.filter((x) => x.id !== s.id))} aria-describedby={futuras ? `retirar-${s.id}` : undefined} className="inline-flex h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/5 disabled:text-muted-foreground disabled:hover:bg-transparent">
                      <Trash2 className="size-4" aria-hidden /> Retirar
                    </button>
                    {futuras > 0 && (
                      <span id={`retirar-${s.id}`} className="text-xs text-muted-foreground">
                        {futuras} {futuras > 1 ? "reservas futuras" : "reserva futura"}
                      </span>
                    )}
                  </div>
                </motion.li>
              )
            })}
          </AnimatePresence>
        </ul>
      </Cartao>

      {/* barra de salvar aparece só quando há mudança */}
      <AnimatePresence>
        {alterado && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8, transition: { duration: 0.15 } }} transition={MOLA_RAPIDA} className="sticky bottom-4 z-20 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-jade-noite px-5 py-3 text-white shadow-2xl">
            <p className="text-sm font-medium">Você tem alterações que ainda não foram salvas.</p>
            <div className="flex gap-2">
              <button type="button" onClick={descartar} className="h-10 rounded-full px-4 text-sm font-semibold text-white/80 hover:text-white">
                Descartar
              </button>
              <button type="button" onClick={salvar} className={cn(BOTAO_PRIMARIO, "bg-marca text-jade-noite hover:bg-marca-forte")}>
                Salvar alterações
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
