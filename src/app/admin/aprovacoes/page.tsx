'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useUser } from '@/hooks/useUser'

type Prioridade = 'baixa' | 'media' | 'alta' | 'urgente'

interface Revisao {
  id: string
  data: string
  acao: 'enviado' | 'rejeitado' | 'ajustes_solicitados' | 'reenviado'
  motivo?: string
  por: string
}

interface ComunicadoPendente {
  id: string
  titulo: string
  texto: string
  prioridade: Prioridade
  obrigatorio: boolean
  imagem_url?: string | null
  data_envio: string
  data_inicio: string
  data_fim: string
  publico_detalhado: string[]
  total_publico: number
  autor_nome: string
  revisoes: Revisao[]
}

const MOCK_FILA: ComunicadoPendente[] = [
  {
    id: 'apr-1',
    titulo: 'Semana da Tecnologia e Inovação',
    texto:
      '<p>Convidamos toda a comunidade do curso de <strong>Desenvolvimento de Sistemas</strong> para a Semana da Tecnologia e Inovação, que acontecerá entre <strong>01/06 e 05/06</strong>.</p><p>Teremos palestras com profissionais do mercado, oficinas práticas de IA generativa e um hackathon de encerramento com premiação.</p><ul><li>Inscrições gratuitas até 28/05</li><li>Vagas limitadas para o hackathon</li></ul>',
    prioridade: 'media',
    obrigatorio: false,
    imagem_url: null,
    data_envio: '2026-06-02T09:14',
    data_inicio: '2026-06-01T08:00',
    data_fim: '2026-06-05T18:00',
    publico_detalhado: [
      'Curso: Desenvolvimento de Sistemas',
      'Turmas: DS1, DS2, DS3',
      'Períodos: Manhã e tarde',
    ],
    total_publico: 132,
    autor_nome: 'Mariana Souza · Presidência do Grêmio',
    revisoes: [
      { id: 'r1', data: '2026-06-02T09:14', acao: 'enviado', por: 'Mariana Souza' },
    ],
  },
  {
    id: 'apr-2',
    titulo: 'Campanha de doação de alimentos não perecíveis',
    texto:
      '<p>O grêmio está organizando uma campanha de doação para instituições parceiras. Traga 1kg de alimento não perecível e ajude famílias da região.</p><p>Pontos de coleta na recepção e na cantina.</p>',
    prioridade: 'baixa',
    obrigatorio: false,
    imagem_url: null,
    data_envio: '2026-06-06T16:42',
    data_inicio: '2026-06-10T07:00',
    data_fim: '2026-06-20T22:00',
    publico_detalhado: ['Escola inteira', 'Todos os cursos e turnos'],
    total_publico: 1240,
    autor_nome: 'Rafael Lima · Secretaria do Grêmio',
    revisoes: [
      { id: 'r1', data: '2026-05-28T11:00', acao: 'enviado', por: 'Rafael Lima' },
      {
        id: 'r2',
        data: '2026-05-29T14:20',
        acao: 'ajustes_solicitados',
        motivo: 'Falta indicar os pontos de coleta e o período da campanha.',
        por: 'Coordenação Pedagógica',
      },
      { id: 'r3', data: '2026-06-06T16:42', acao: 'reenviado', por: 'Rafael Lima' },
    ],
  },
  {
    id: 'apr-3',
    titulo: 'Reunião do conselho do grêmio — pauta aberta',
    texto:
      '<p>Convocamos representantes de turma para a reunião do conselho, com pauta aberta para sugestões dos alunos.</p>',
    prioridade: 'alta',
    obrigatorio: true,
    imagem_url: null,
    data_envio: '2026-06-08T08:05',
    data_inicio: '2026-06-12T19:00',
    data_fim: '2026-06-12T21:00',
    publico_detalhado: ['Representantes de turma — todos os cursos'],
    total_publico: 48,
    autor_nome: 'Ana Carolina Reis · Vice-presidência do Grêmio',
    revisoes: [
      { id: 'r1', data: '2026-06-08T08:05', acao: 'enviado', por: 'Ana Carolina Reis' },
    ],
  },
]

const PRIO_LABEL: Record<Prioridade, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  urgente: 'Urgente',
}

const PRIO_CLS: Record<Prioridade, string> = {
  baixa: 'bg-gray-100 text-gray-600',
  media: 'bg-blue-100 text-blue-700',
  alta: 'bg-orange-100 text-[#c4510a]',
  urgente: 'bg-red-100 text-red-700',
}

const ACAO_LABEL: Record<Revisao['acao'], string> = {
  enviado: 'Enviado para aprovação',
  rejeitado: 'Rejeitado',
  ajustes_solicitados: 'Ajustes solicitados',
  reenviado: 'Reenviado após ajustes',
}

const ACAO_CLS: Record<Revisao['acao'], string> = {
  enviado: 'bg-blue-50 text-blue-700 border-blue-200',
  rejeitado: 'bg-red-50 text-red-700 border-red-200',
  ajustes_solicitados: 'bg-amber-50 text-amber-700 border-amber-200',
  reenviado: 'bg-purple-50 text-purple-700 border-purple-200',
}

function tempoNaFila(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const minutos = Math.floor(ms / 60_000)
  if (minutos < 1) return 'agora mesmo'
  if (minutos < 60) return `há ${minutos} min`
  const horas = Math.floor(minutos / 60)
  if (horas < 24) return `há ${horas} ${horas === 1 ? 'hora' : 'horas'}`
  const dias = Math.floor(horas / 24)
  if (dias < 7) return `há ${dias} ${dias === 1 ? 'dia' : 'dias'}`
  const semanas = Math.floor(dias / 7)
  return `há ${semanas} ${semanas === 1 ? 'semana' : 'semanas'}`
}

function fmtData(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function fmtPeriodo(ini: string, fim: string) {
  const fmt = (d: string) =>
    new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  return `${fmt(ini)} – ${fmt(fim)}`
}

type ModalMode = 'rejeitar' | 'ajustes'

export default function AprovacoesPage() {
  const { user, loading } = useUser()
  const [fila, setFila] = useState<ComunicadoPendente[]>(MOCK_FILA)
  const [historicoAberto, setHistoricoAberto] = useState<string | null>(null)
  const [modalId, setModalId] = useState<string | null>(null)
  const [modalMode, setModalMode] = useState<ModalMode>('rejeitar')
  const [motivo, setMotivo] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  const filaOrdenada = useMemo(
    () => [...fila].sort((a, b) => new Date(a.data_envio).getTime() - new Date(b.data_envio).getTime()),
    [fila]
  )

  function aprovar(id: string) {
    const c = fila.find(x => x.id === id)
    setFila(prev => prev.filter(x => x.id !== id))
    setToast(`"${c?.titulo}" aprovado e publicado no feed.`)
    setTimeout(() => setToast(null), 4000)
  }

  function abrirModal(id: string, mode: ModalMode) {
    setModalId(id)
    setModalMode(mode)
    setMotivo('')
  }

  function confirmarRejeicao() {
    if (!modalId || !motivo.trim()) return
    const c = fila.find(x => x.id === modalId)
    setFila(prev => prev.filter(x => x.id !== modalId))
    const acaoLabel = modalMode === 'ajustes' ? 'Ajustes solicitados' : 'Rejeitado'
    setToast(`"${c?.titulo}" — ${acaoLabel}. O grêmio foi notificado.`)
    setTimeout(() => setToast(null), 4000)
    setModalId(null)
    setMotivo('')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400 text-sm animate-pulse">Carregando...</p>
      </div>
    )
  }

  const ehAdmin = !user || user.papel === 'super_admin'
  if (!ehAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md text-center">
          <p className="text-3xl mb-3" aria-hidden="true">⊘</p>
          <h1 className="text-lg font-bold text-gray-900 mb-2">Acesso restrito</h1>
          <p className="text-sm text-gray-500 mb-5">
            A fila de aprovações é exclusiva do super administrador.
          </p>
          <Link
            href="/meus-comunicados"
            className="inline-block h-10 px-5 rounded-lg bg-[#E8620A] text-white text-sm font-bold hover:bg-[#c4510a] transition-colors leading-10"
          >
            Voltar para meus comunicados
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4 sticky top-0 z-20">
        <Link
          href="/meus-comunicados"
          className="text-gray-400 hover:text-gray-700 transition-colors text-sm font-medium"
        >
          ← Meus comunicados
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            Painel de aprovação
            {filaOrdenada.length > 0 && (
              <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                {filaOrdenada.length}
              </span>
            )}
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Comunicados do grêmio aguardando revisão · ordenados do mais antigo para o mais recente
          </p>
        </div>
        <span className="hidden sm:block shrink-0 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Administração
        </span>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-4">

        {filaOrdenada.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 py-20 flex flex-col items-center gap-3 text-gray-400">
            <svg
              width="40" height="40" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <p className="text-sm font-medium">Nenhum comunicado aguardando aprovação.</p>
            <p className="text-xs">Quando o grêmio enviar um novo rascunho, ele aparecerá aqui.</p>
          </div>
        ) : (
          filaOrdenada.map(c => (
            <article
              key={c.id}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col"
            >
              {/* Cabeçalho do card */}
              <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${PRIO_CLS[c.prioridade]}`}>
                      {PRIO_LABEL[c.prioridade]}
                    </span>
                    {c.obrigatorio && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                        Obrigatório
                      </span>
                    )}
                    <span
                      className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full"
                      title={fmtData(c.data_envio)}
                    >
                      {tempoNaFila(c.data_envio)} na fila
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-gray-900 leading-tight">{c.titulo}</h2>
                  <p className="text-xs text-gray-400 mt-1">Enviado por {c.autor_nome}</p>
                </div>
              </div>

              {/* Preview do conteúdo */}
              {c.imagem_url && (
                <img
                  src={c.imagem_url}
                  alt=""
                  className="w-full max-h-64 object-cover"
                  aria-hidden="true"
                />
              )}
              <div className="px-5 py-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                  Pré-visualização
                </p>
                <div
                  className="text-sm text-gray-700 leading-relaxed prose-headings:font-bold prose-ul:list-disc prose-ul:pl-5 prose-ol:list-decimal prose-ol:pl-5 prose-a:text-[#E8620A] prose-a:underline"
                  dangerouslySetInnerHTML={{ __html: c.texto }}
                />
              </div>

              {/* Meta */}
              <dl className="px-5 py-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                    Período de exibição
                  </dt>
                  <dd className="text-gray-700">{fmtPeriodo(c.data_inicio, c.data_fim)}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                    Alcance estimado
                  </dt>
                  <dd className="text-gray-700">
                    <strong className="text-gray-900">{c.total_publico}</strong>{' '}
                    {c.total_publico === 1 ? 'aluno' : 'alunos'}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                    Público-alvo detalhado
                  </dt>
                  <dd className="flex flex-wrap gap-1.5">
                    {c.publico_detalhado.map((p, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center text-xs text-gray-700 bg-gray-100 px-2.5 py-1 rounded-full"
                      >
                        {p}
                      </span>
                    ))}
                  </dd>
                </div>
              </dl>

              {/* Histórico de revisões */}
              <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50">
                <button
                  onClick={() =>
                    setHistoricoAberto(historicoAberto === c.id ? null : c.id)
                  }
                  className="text-xs font-semibold text-gray-500 hover:text-gray-900 flex items-center gap-1.5 transition-colors"
                >
                  Histórico de revisões
                  <span className="text-gray-400">({c.revisoes.length})</span>
                  <span
                    className={`inline-block transition-transform duration-150 ${
                      historicoAberto === c.id ? 'rotate-180' : ''
                    }`}
                    aria-hidden="true"
                  >
                    ▾
                  </span>
                </button>

                {historicoAberto === c.id && (
                  <ol className="mt-3 flex flex-col gap-2.5 border-l-2 border-gray-200 pl-4">
                    {c.revisoes.map(r => (
                      <li key={r.id} className="text-sm">
                        <div className="flex flex-wrap items-center gap-2 mb-0.5">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${ACAO_CLS[r.acao]}`}
                          >
                            {ACAO_LABEL[r.acao]}
                          </span>
                          <span className="text-xs text-gray-400">{fmtData(r.data)}</span>
                          <span className="text-xs text-gray-500">— {r.por}</span>
                        </div>
                        {r.motivo && (
                          <p className="text-xs text-gray-600 leading-relaxed mt-1">
                            {r.motivo}
                          </p>
                        )}
                      </li>
                    ))}
                  </ol>
                )}
              </div>

              {/* Ações */}
              <div className="px-5 py-3.5 border-t border-gray-100 flex flex-wrap gap-2 justify-end">
                <button
                  onClick={() => abrirModal(c.id, 'ajustes')}
                  className="h-9 px-4 rounded-lg border border-amber-300 text-xs font-semibold text-amber-700 hover:bg-amber-50 transition-colors"
                >
                  Solicitar ajustes
                </button>
                <button
                  onClick={() => abrirModal(c.id, 'rejeitar')}
                  className="h-9 px-4 rounded-lg border border-red-300 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                >
                  Rejeitar
                </button>
                <button
                  onClick={() => aprovar(c.id)}
                  className="h-9 px-4 rounded-lg bg-green-600 text-xs font-bold text-white hover:bg-green-700 transition-colors"
                >
                  Aprovar e publicar
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      {/* Modal rejeitar / solicitar ajustes */}
      {modalId && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={e => e.target === e.currentTarget && setModalId(null)}
        >
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
            <h3 className="text-base font-bold text-gray-900 mb-1">
              {modalMode === 'ajustes' ? 'Solicitar ajustes' : 'Rejeitar comunicado'}
            </h3>
            <p className="text-sm text-gray-500 mb-4 leading-relaxed">
              {modalMode === 'ajustes'
                ? 'Descreva o que precisa ser ajustado. O grêmio receberá sua sugestão e poderá editar o rascunho.'
                : 'Informe o motivo da rejeição. O grêmio verá esta mensagem ao consultar o comunicado.'}
            </p>
            <textarea
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              placeholder={
                modalMode === 'ajustes'
                  ? 'Ex.: faltou indicar o local do evento e o nome dos palestrantes…'
                  : 'Ex.: o conteúdo não está alinhado com as diretrizes da instituição…'
              }
              rows={5}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-300 outline-none focus:border-[#E8620A] focus:bg-white transition-colors resize-none mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => setModalId(null)}
                className="flex-1 h-10 rounded-lg border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:border-gray-400 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarRejeicao}
                disabled={!motivo.trim()}
                className={`flex-1 h-10 rounded-lg text-sm font-bold text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  modalMode === 'ajustes'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                {modalMode === 'ajustes' ? 'Enviar pedido' : 'Rejeitar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm font-medium px-4 py-2.5 rounded-full shadow-xl z-50 max-w-[90vw] text-center"
        >
          {toast}
        </div>
      )}
    </div>
  )
}
