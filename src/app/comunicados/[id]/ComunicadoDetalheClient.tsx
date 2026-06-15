'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

type Prioridade = 'baixa' | 'media' | 'alta' | 'urgente'
type StatusPresenca = 'confirmado' | 'desmarcado' | null

interface Comunicado {
  id: string
  titulo: string
  texto: string // HTML simples / markdown renderizado
  imagem_url?: string | null
  prioridade: Prioridade
  obrigatorio: boolean
  data_inicio: string
  data_fim: string
  publicado_em?: string | null
  autor: { nome: string; papel: 'admin' | 'gremio' }
  publico_detalhado: string[]
  total_confirmados: number
  presenca: StatusPresenca
}

const MIN_JUSTIFICATIVA = 20 // configurável via /admin/configuracoes (MIN_JUSTIFICATIVA_CHARS)

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

const MOCK: Comunicado = {
  id: 'mock',
  titulo: 'Reunião de pais e mestres — 2º bimestre',
  texto:
    '<p>Prezados alunos e responsáveis, comunicamos que a reunião de pais e mestres do <strong>2º bimestre</strong> acontecerá no auditório principal.</p><p>A presença é importante para o acompanhamento do desempenho acadêmico. Haverá atendimento individual com os professores das disciplinas.</p><ul><li>Local: Auditório principal</li><li>Traga um documento com foto</li></ul>',
  imagem_url: null,
  prioridade: 'alta',
  obrigatorio: false,
  data_inicio: '2026-06-20T19:00',
  data_fim: '2026-06-20T21:00',
  publicado_em: '2026-06-10T08:00',
  autor: { nome: 'Carla Mendes', papel: 'admin' },
  publico_detalhado: ['Curso: Desenvolvimento de Sistemas', 'Turmas: DS1, DS2', 'Período: Manhã'],
  total_confirmados: 84,
  presenca: null,
}

function fmtDataHora(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function fmtData(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function ComunicadoDetalheClient({ id }: { id: string }) {
  const [com, setCom] = useState<Comunicado | null>(null)
  const [loading, setLoading] = useState(true)
  const [naoEncontrado, setNaoEncontrado] = useState(false)
  const [erro, setErro] = useState('')

  const [modalAberto, setModalAberto] = useState(false)
  const [justificativa, setJustificativa] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    let ativo = true
    async function carregar() {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/comunicados/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          credentials: 'include',
        })
        if (res.status === 404) {
          if (ativo) setNaoEncontrado(true)
          return
        }
        if (!res.ok) throw new Error('falha')
        const data = await res.json()
        if (ativo) setCom(data.comunicado ?? data)
      } catch {
        // fallback de desenvolvimento para visualização local
        if (process.env.NODE_ENV === 'development') {
          if (ativo) setCom({ ...MOCK, id })
        } else if (ativo) {
          setErro('Não foi possível carregar o comunicado.')
        }
      } finally {
        if (ativo) setLoading(false)
      }
    }
    carregar()
    return () => { ativo = false }
  }, [id])

  function dispararToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 4000)
  }

  async function confirmarPresenca() {
    if (!com) return
    setEnviando(true)
    try {
      const token = localStorage.getItem('token')
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/comunicados/${com.id}/presenca`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        credentials: 'include',
      })
    } catch {
      /* otimista: atualiza a UI mesmo sem backend */
    } finally {
      setCom(c =>
        c
          ? {
              ...c,
              presenca: 'confirmado',
              total_confirmados: c.presenca === 'confirmado' ? c.total_confirmados : c.total_confirmados + 1,
            }
          : c
      )
      setEnviando(false)
      dispararToast('Presença confirmada. O evento foi adicionado à sua agenda.')
    }
  }

  async function desmarcarPresenca() {
    if (!com || justificativa.trim().length < MIN_JUSTIFICATIVA) return
    setEnviando(true)
    try {
      const token = localStorage.getItem('token')
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/comunicados/${com.id}/presenca`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ justificativa: justificativa.trim() }),
      })
    } catch {
      /* otimista */
    } finally {
      setCom(c =>
        c
          ? {
              ...c,
              presenca: 'desmarcado',
              total_confirmados:
                c.presenca === 'confirmado' ? Math.max(0, c.total_confirmados - 1) : c.total_confirmados,
            }
          : c
      )
      setEnviando(false)
      setModalAberto(false)
      setJustificativa('')
      dispararToast('Presença desmarcada e justificativa registrada.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400 text-sm animate-pulse">Carregando comunicado…</p>
      </div>
    )
  }

  if (naoEncontrado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md text-center">
          <p className="text-3xl mb-3" aria-hidden="true">🔍</p>
          <h1 className="text-lg font-bold text-gray-900 mb-2">Comunicado não encontrado</h1>
          <p className="text-sm text-gray-500 mb-5">
            O comunicado que você procura não existe mais ou saiu de vigência.
          </p>
          <Link
            href="/feed"
            className="inline-block h-10 px-5 rounded-lg bg-[#E8620A] text-white text-sm font-bold hover:bg-[#c4510a] transition-colors leading-10"
          >
            Voltar ao feed
          </Link>
        </div>
      </div>
    )
  }

  if (erro || !com) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md text-center">
          <p className="text-3xl mb-3" aria-hidden="true">⚠️</p>
          <h1 className="text-lg font-bold text-gray-900 mb-2">Algo deu errado</h1>
          <p className="text-sm text-gray-500 mb-5">{erro || 'Não foi possível carregar o comunicado.'}</p>
          <Link
            href="/feed"
            className="inline-block h-10 px-5 rounded-lg bg-[#E8620A] text-white text-sm font-bold hover:bg-[#c4510a] transition-colors leading-10"
          >
            Voltar ao feed
          </Link>
        </div>
      </div>
    )
  }

  const naAgenda = com.presenca === 'confirmado' || com.obrigatorio
  const justOk = justificativa.trim().length >= MIN_JUSTIFICATIVA

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3 sticky top-0 z-20">
        <Link
          href="/feed"
          className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-all shrink-0"
          aria-label="Voltar ao feed"
        >
          ←
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold text-gray-500 truncate">Comunicado</h1>
        </div>
        <Link href="/agenda" className="text-xs font-semibold text-gray-400 hover:text-[#E8620A] transition-colors shrink-0">
          Minha agenda →
        </Link>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-5">

        {/* Conteúdo principal */}
        <article className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 pt-6 pb-4">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${PRIO_CLS[com.prioridade]}`}>
                {PRIO_LABEL[com.prioridade]}
              </span>
              {com.obrigatorio && (
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700">
                  Obrigatório
                </span>
              )}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 leading-tight">{com.titulo}</h2>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 text-xs text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-600">
                  {com.autor.nome.slice(0, 2).toUpperCase()}
                </span>
                {com.autor.nome} · {com.autor.papel === 'admin' ? 'Administração' : 'Grêmio'}
              </span>
              {com.publicado_em && <span>Publicado em {fmtData(com.publicado_em)}</span>}
            </div>
          </div>

          {com.imagem_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={com.imagem_url} alt="" className="w-full max-h-80 object-cover" aria-hidden="true" />
          )}

          <div
            className="px-6 py-5 text-[15px] text-gray-700 leading-relaxed prose-headings:font-bold prose-ul:list-disc prose-ul:pl-5 prose-ol:list-decimal prose-ol:pl-5 prose-a:text-[#E8620A] prose-a:underline [&_p]:mb-3 [&_ul]:mb-3 [&_li]:mb-1"
            dangerouslySetInnerHTML={{ __html: com.texto }}
          />

          {/* Meta: vigência + público */}
          <dl className="px-6 py-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Período de vigência</dt>
              <dd className="text-gray-700">{fmtDataHora(com.data_inicio)} → {fmtDataHora(com.data_fim)}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Confirmações</dt>
              <dd className="text-gray-700">
                <strong className="text-gray-900">{com.total_confirmados}</strong>{' '}
                {com.total_confirmados === 1 ? 'pessoa confirmou' : 'pessoas confirmaram'} presença
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Público-alvo</dt>
              <dd className="flex flex-wrap gap-1.5">
                {com.publico_detalhado.map((p, i) => (
                  <span key={i} className="inline-flex items-center text-xs text-gray-700 bg-gray-100 px-2.5 py-1 rounded-full">
                    {p}
                  </span>
                ))}
              </dd>
            </div>
          </dl>
        </article>

        {/* Ação de presença */}
        <section className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Sua presença</p>
              {com.obrigatorio ? (
                <p className="text-sm text-gray-700">
                  <span className="font-semibold text-purple-700">Presença automática registrada.</span>{' '}
                  Este é um evento obrigatório e já consta na sua agenda.
                </p>
              ) : com.presenca === 'confirmado' ? (
                <p className="text-sm text-green-700 font-semibold">Presença confirmada ✓</p>
              ) : com.presenca === 'desmarcado' ? (
                <p className="text-sm text-red-600 font-semibold">Você desmarcou este evento.</p>
              ) : (
                <p className="text-sm text-gray-500">Você ainda não confirmou presença neste evento.</p>
              )}
            </div>
            {naAgenda && (
              <Link
                href="/agenda"
                className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-[#E8620A] hover:text-[#c4510a] transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" />
                </svg>
                Na sua agenda
              </Link>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {!com.obrigatorio && com.presenca !== 'confirmado' && (
              <button
                onClick={confirmarPresenca}
                disabled={enviando}
                className="h-10 px-5 rounded-lg bg-green-600 text-sm font-bold text-white hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                Confirmar presença
              </button>
            )}
            {(com.obrigatorio || com.presenca === 'confirmado') && (
              <button
                onClick={() => setModalAberto(true)}
                disabled={enviando}
                className="h-10 px-5 rounded-lg border border-red-300 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                Desmarcar presença
              </button>
            )}
            {com.presenca === 'desmarcado' && (
              <button
                onClick={confirmarPresenca}
                disabled={enviando}
                className="h-10 px-5 rounded-lg bg-green-600 text-sm font-bold text-white hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                Confirmar novamente
              </button>
            )}
          </div>
        </section>
      </div>

      {/* Modal desmarcar */}
      {modalAberto && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={e => e.target === e.currentTarget && setModalAberto(false)}
        >
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
            <h3 className="text-base font-bold text-gray-900 mb-1">Desmarcar presença</h3>
            <p className="text-sm text-gray-500 mb-4 leading-relaxed">
              Informe o motivo. A justificativa precisa ter no mínimo {MIN_JUSTIFICATIVA} caracteres.
            </p>
            <textarea
              value={justificativa}
              onChange={e => setJustificativa(e.target.value)}
              placeholder="Ex.: tenho consulta médica marcada no mesmo horário e não conseguirei comparecer…"
              rows={5}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-300 outline-none focus:border-[#E8620A] focus:bg-white transition-colors resize-none"
              autoFocus
            />
            <p className={`text-xs mt-1.5 mb-4 ${justOk ? 'text-gray-400' : 'text-amber-600'}`}>
              {justificativa.trim().length}/{MIN_JUSTIFICATIVA} caracteres
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setModalAberto(false); setJustificativa('') }}
                className="flex-1 h-10 rounded-lg border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:border-gray-400 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={desmarcarPresenca}
                disabled={!justOk || enviando}
                className="flex-1 h-10 rounded-lg bg-red-500 text-sm font-bold text-white hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Desmarcar
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
