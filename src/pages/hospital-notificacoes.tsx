import { useState } from "react"
import { AnimatePresence } from "motion/react"
import { BellRing, CheckCheck, Inbox } from "lucide-react"
import { CartaoSolicitacao, ItemNotificacao } from "@/components/reserva"
import { BOTAO_SECUNDARIO, Cartao, Segmentos, Topo, Vazio } from "@/components/ui"
import { futura } from "@/lib/crm"
import { useCrm } from "@/lib/crm-estado"

export function HospitalNotificacoes() {
  const { agora, doHospital, notificacoes, lidas, marcarLidas, setFoco } = useCrm()
  const [filtro, setFiltro] = useState<"todas" | "nao-lidas">("todas")
  const pendentes = doHospital.filter((r) => r.status === "pendente" && futura(r, agora))
  const naoLidas = notificacoes.filter((n) => !lidas.includes(n.id))
  const lista = filtro === "todas" ? notificacoes : naoLidas

  return (
    <>
      <Topo
        titulo="Notificações"
        subtitulo="Solicitações para aceitar, contatos liberados 48 horas antes da cirurgia, repasses e cancelamentos."
        acoes={
          <button type="button" className={BOTAO_SECUNDARIO} disabled={!naoLidas.length} onClick={() => marcarLidas(naoLidas.map((n) => n.id))}>
            <CheckCheck aria-hidden /> Marcar todas como lidas
          </button>
        }
      />

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <Cartao titulo={`Solicitações aguardando aceite (${pendentes.length})`}>
          {pendentes.length === 0 ? (
            <Vazio icone={Inbox} titulo="Nenhuma solicitação esperando" texto="Quando um médico pedir uma sala, ela aparece aqui para você aceitar ou recusar." />
          ) : (
            <ul className="flex flex-col gap-3">
              <AnimatePresence initial={false}>
                {pendentes.map((r) => (
                  <CartaoSolicitacao key={r.id} r={r} />
                ))}
              </AnimatePresence>
            </ul>
          )}
        </Cartao>

        <Cartao
          i={1}
          titulo="Todas as notificações"
          acao={
            <Segmentos
              id="notificacoes"
              rotulo="Filtrar notificações"
              valor={filtro}
              mudar={setFiltro}
              itens={[
                { valor: "todas", rotulo: "Todas" },
                { valor: "nao-lidas", rotulo: "Não lidas", contador: naoLidas.length },
              ]}
            />
          }
        >
          {lista.length === 0 ? (
            <Vazio icone={BellRing} titulo="Você está em dia" texto="Nenhuma notificação não lida." />
          ) : (
            <ul className="-mx-3 flex flex-col gap-0.5">
              {lista.map((n) => (
                <li key={n.id}>
                  <ItemNotificacao
                    n={n}
                    lida={lidas.includes(n.id)}
                    agora={agora}
                    aoAbrir={() => {
                      marcarLidas([n.id])
                      setFoco(n.reservaId)
                    }}
                  />
                </li>
              ))}
            </ul>
          )}
        </Cartao>
      </div>
    </>
  )
}
