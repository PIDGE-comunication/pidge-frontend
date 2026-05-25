'use client'

import { useState, useMemo, Fragment } from 'react'
import Link from 'next/link'
import { useUser } from '@/hooks/useUser'

type Prioridade = 'baixa' | 'media' | 'alta' | 'urgente'
type Status = 'rascunho' | 'aguardando_aprovacao' | 'publicado' | 'rejeitado' | 'arquivado'

interface Comunicado {
  id: string
  titulo: string
  prioridade: Prioridade
  data_inicio: string
  data_fim: string
  status: Status
  confirmados: number
  desmarcados: number
  total_publico: number
  publico_resumido: string
  motivo_rejeicao?: string
  criado_por: 'admin' | 'gremio'
}

const MOCK_COMUNICADOS: Comunicado[] = [
  {
    id: '1',
    titulo: 'Reunião de pais e mestres — 2º bimestre',
    prioridade: 'alta',
    data_inicio: '2026-05-20T08:00',
    data_fim: '2026-05-20T18:00',
    status: 'publicado',
    confirmados: 45,
    desmarcados: 12,
    total_publico: 80,
    publico_resumido: 'Escola inteira',
    criado_por: 'admin',
  },
  {
    id: '2',
    titulo: 'Semana da Tecnologia e Inovação',
    prioridade: 'media',
    data_inicio: '2026-06-01T08:00',
    data_fim: '2026-06-05T18:00',
    status: 'aguardando_aprovacao',
    confirmados: 0,
    desmarcados: 0,
    total_publico: 0,
    publico_resumido: 'Desenvolvimento de Sistemas',
    criado_por: 'gremio',
  },
  {
    id: '3',
    titulo: 'Aviso sobre alteração no cardápio da merenda',
    prioridade: 'baixa',
    data_inicio: '2026-05-25T07:00',
    data_fim: '2026-05-26T19:00',
    status: 'rascunho',
    confirmados: 0,
    desmarcados: 0,
    total_publico: 0,
    publico_resumido: 'Escola inteira',
    criado_por: 'admin',
  },
  {
    id: '4',
    titulo: 'Apresentação final de TCC — turma DS3',
    prioridade: 'alta',
    data_inicio: '2026-05-15T13:00',
    data_fim: '2026-05-15T18:00',
    status: 'rejeitado',
    confirmados: 0,
    desmarcados: 0,
    total_publico: 0,
    publico_resumido: 'Desenvolvimento de Sistemas',
    motivo_rejeicao:
      'O comunicado não especifica o local do evento nem o nome dos apresentadores. Adicione essas informações e reenvie para aprovação.',
    criado_por: 'gremio',
  },
  {
    id: '5',
    titulo: 'Eleição para representante de turma',
    prioridade: 'media',
    data_inicio: '2026-04-10T08:00',
    data_fim: '2026-04-12T18:00',
    status: 'arquivado',
    confirmados: 30,
    desmarcados: 5,
    total_publico: 45,
    publico_resumido: 'Todos os cursos',
    criado_por: 'gremio',
  },
  {
    id: '6',
    titulo: 'Palestra sobre saúde mental e bem-estar',
    prioridade: 'urgente',
    data_inicio: '2026-05-28T10:00',
    data_fim: '2026-05-28T12:00',
    status: 'publicado',
    confirmados: 120,
    desmarcados: 8,
    total_publico: 150,
    publico_resumido: 'Escola inteira',
    criado_por: 'admin',
  },
]

const STATUS_LABEL: Record<Status, string> = {
  rascunho: 'Rascunho',
  aguardando_aprovacao: 'Aguardando',
  publicado: 'Publicado',
  rejeitado: 'Rejeitado',
  arquivado: 'Arquivado',
}

const STATUS_CLS: Record<Status, string> = {
  rascunho: 'bg-gray-100 text-gray-600',
  aguardando_aprovacao: 'bg-amber-100 text-amber-700',
  publicado: 'bg-green-100 text-green-700',
  rejeitado: 'bg-red-100 text-red-700',
  arquivado: 'bg-gray-100 text-gray-400',
}

const PRIO_LABEL: Record<Prioridade, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  urgente: 'Urgente',
}

const PRIO_CLS: Record<Prioridade, string> = {
  baixa: 'bg-gray-100 text-gray-500',
  media: 'bg-blue-100 text-blue-600',
  alta: 'bg-orange-100 text-[#E8620A]',
  urgente: 'bg-red-100 text-red-600',
}

function formatarPeriodo(ini: string, fim: string): string {
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  return `${fmt(ini)} – ${fmt(fim)}`
}

export default function MeusComunicadosPage() {
  const { user, loading } = useUser()

  const [devPapel, setDevPapel] = useState<'admin' | 'gremio'>('admin')
  const [devPermissaoGremio, setDevPermissaoGremio] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<Status | 'todos'>('todos')
  const [filtroDataInicio, setFiltroDataInicio] = useState('')
  const [filtroDataFim, setFiltroDataFim] = useState('')
  const [expandedRejeicao, setExpandedRejeicao] = useState<string | null>(null)
  const [showArquivarModal, setShowArquivarModal] = useState<string | null>(null)
  const [showRejeitarModal, setShowRejeitarModal] = useState<string | null>(null)
  const [motivoRejeicao, setMotivoRejeicao] = useState('')
  const [comunicados, setComunicados] = useState<Comunicado[]>(MOCK_COMUNICADOS)

  const papel: 'admin' | 'gremio' =
    user?.papel === 'admin' || user?.papel === 'gremio' ? user.papel : devPapel

  const permissaoGremioAtiva = devPermissaoGremio

  const lista = useMemo(() => {
    return comunicados.filter(c => {
      if (papel === 'gremio' && c.criado_por !== 'gremio') return false
      if (filtroStatus !== 'todos' && c.status !== filtroStatus) return false
      if (busca && !c.titulo.toLowerCase().includes(busca.toLowerCase())) return false
      if (filtroDataInicio && new Date(c.data_inicio) < new Date(filtroDataInicio)) return false
      if (filtroDataFim && new Date(c.data_fim) > new Date(filtroDataFim + 'T23:59')) return false
      return true
    })
  }, [comunicados, papel, filtroStatus, busca, filtroDataInicio, filtroDataFim])

  function arquivar(id: string) {
    setComunicados(prev =>
      prev.map(c => (c.id === id ? { ...c, status: 'arquivado' as const } : c))
    )
    setShowArquivarModal(null)
  }

  function aprovar(id: string) {
    setComunicados(prev =>
      prev.map(c => (c.id === id ? { ...c, status: 'publicado' as const } : c))
    )
  }

  function rejeitar(id: string) {
    if (!motivoRejeicao.trim()) return
    setComunicados(prev =>
      prev.map(c =>
        c.id === id
          ? { ...c, status: 'rejeitado' as const, motivo_rejeicao: motivoRejeicao.trim() }
          : c
      )
    )
    setShowRejeitarModal(null)
    setMotivoRejeicao('')
  }

  const podeCriar = papel === 'admin' || permissaoGremioAtiva

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400 text-sm animate-pulse">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Dev banner — visível apenas sem backend */}
      {!user && (
        <div className="bg-purple-950 text-white px-4 py-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span className="font-bold uppercase tracking-wider text-purple-300">Dev</span>
          <span className="text-purple-600" aria-hidden="true">|</span>
          <span className="text-purple-300">Papel:</span>
          {(['admin', 'gremio'] as const).map(p => (
            <button
              key={p}
              onClick={() => setDevPapel(p)}
              className={`px-2.5 py-0.5 rounded-full font-semibold transition-colors ${
                devPapel === p
                  ? 'bg-white text-purple-900'
                  : 'text-purple-400 hover:text-white'
              }`}
            >
              {p === 'admin' ? 'Admin' : 'Grêmio'}
            </button>
          ))}
          <span className="text-purple-600 ml-2" aria-hidden="true">|</span>
          <span className="text-purple-300">Permissão grêmio:</span>
          <button
            onClick={() => setDevPermissaoGremio(v => !v)}
            className={`px-2.5 py-0.5 rounded-full font-semibold transition-colors ${
              devPermissaoGremio
                ? 'bg-green-400 text-green-900'
                : 'bg-red-400 text-red-900'
            }`}
          >
            {devPermissaoGremio ? 'Ativa' : 'Desativada'}
          </button>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4 sticky top-0 z-20">
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-gray-900">Meus comunicados</h1>
        </div>
        <span className="hidden sm:block shrink-0 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {papel === 'admin' ? 'Administração' : 'Grêmio Estudantil'}
        </span>
        {podeCriar ? (
          <Link
            href="/comunicados/novo"
            className="shrink-0 h-9 px-4 rounded-lg bg-[#E8620A] text-white text-sm font-bold hover:bg-[#c4510a] transition-colors flex items-center gap-1.5"
          >
            <span aria-hidden="true">+</span> Novo comunicado
          </Link>
        ) : (
          <button
            disabled
            title="Permissão desativada pela administração"
            className="shrink-0 h-9 px-4 rounded-lg bg-gray-200 text-gray-400 text-sm font-bold cursor-not-allowed flex items-center gap-1.5"
          >
            <span aria-hidden="true">+</span> Novo comunicado
          </button>
        )}
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col gap-4">

        {/* Aviso permissão grêmio desativada */}
        {papel === 'gremio' && !permissaoGremioAtiva && (
          <div className="flex gap-3 items-start bg-red-50 border border-red-300 rounded-xl px-4 py-3">
            <span className="text-red-500 text-lg leading-none mt-0.5" aria-hidden="true">⊘</span>
            <div>
              <p className="text-sm font-bold text-red-700">Publicação desativada pela administração</p>
              <p className="text-xs text-red-600 mt-0.5">
                A administração desativou temporariamente a permissão do grêmio de publicar comunicados.
                Entre em contato com a administração para mais informações.
              </p>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-48">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
              Buscar
            </label>
            <input
              type="search"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar por título…"
              className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-300 outline-none focus:border-[#E8620A] focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
              Status
            </label>
            <select
              value={filtroStatus}
              onChange={e => setFiltroStatus(e.target.value as Status | 'todos')}
              className="h-9 px-3 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-700 outline-none focus:border-[#E8620A] transition-colors cursor-pointer"
            >
              <option value="todos">Todos</option>
              <option value="rascunho">Rascunho</option>
              <option value="aguardando_aprovacao">Aguardando</option>
              <option value="publicado">Publicado</option>
              <option value="rejeitado">Rejeitado</option>
              <option value="arquivado">Arquivado</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
              Período — de
            </label>
            <input
              type="date"
              value={filtroDataInicio}
              onChange={e => setFiltroDataInicio(e.target.value)}
              className="h-9 px-3 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-700 outline-none focus:border-[#E8620A] transition-colors"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
              até
            </label>
            <input
              type="date"
              value={filtroDataFim}
              onChange={e => setFiltroDataFim(e.target.value)}
              className="h-9 px-3 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-700 outline-none focus:border-[#E8620A] transition-colors"
            />
          </div>

          {(busca || filtroStatus !== 'todos' || filtroDataInicio || filtroDataFim) && (
            <button
              onClick={() => {
                setBusca('')
                setFiltroStatus('todos')
                setFiltroDataInicio('')
                setFiltroDataFim('')
              }}
              className="h-9 px-3 rounded-lg border border-gray-200 text-xs font-semibold text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
            >
              Limpar filtros
            </button>
          )}
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {lista.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-2 text-gray-400">
              <svg
                width="32" height="32" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
                <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
              </svg>
              <p className="text-sm">Nenhum comunicado encontrado.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      Título
                    </th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      Prioridade
                    </th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 hidden md:table-cell">
                      Período
                    </th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 hidden lg:table-cell">
                      Presenças
                    </th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 text-right">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lista.map(c => (
                    <Fragment key={c.id}>
                      <tr className="border-b border-gray-50 hover:bg-gray-50/70 transition-colors">
                        <td className="px-5 py-3.5">
                          <p className="font-medium text-gray-900 leading-tight line-clamp-2">
                            {c.titulo}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">{c.publico_resumido}</p>
                          {c.status === 'rejeitado' && (
                            <button
                              onClick={() =>
                                setExpandedRejeicao(expandedRejeicao === c.id ? null : c.id)
                              }
                              className="mt-1.5 text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1 transition-colors"
                            >
                              Ver motivo da rejeição
                              <span
                                className={`inline-block transition-transform duration-150 ${
                                  expandedRejeicao === c.id ? 'rotate-180' : ''
                                }`}
                                aria-hidden="true"
                              >
                                ▾
                              </span>
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${PRIO_CLS[c.prioridade]}`}
                          >
                            {PRIO_LABEL[c.prioridade]}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 hidden md:table-cell">
                          <span className="text-xs text-gray-600 tabular-nums whitespace-nowrap">
                            {formatarPeriodo(c.data_inicio, c.data_fim)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_CLS[c.status]}`}
                          >
                            {STATUS_LABEL[c.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 hidden lg:table-cell">
                          {c.status === 'publicado' || c.status === 'arquivado' ? (
                            <Link
                              href={`/comunicados/${c.id}/presencas`}
                              className="text-xs text-[#E8620A] hover:underline font-medium"
                            >
                              {c.confirmados} confirm. · {c.desmarcados} desmarc.
                            </Link>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5 justify-end">

                            {/* Admin: aprovar ou rejeitar comunicado pendente do grêmio */}
                            {papel === 'admin' && c.status === 'aguardando_aprovacao' && (
                              <>
                                <button
                                  onClick={() => aprovar(c.id)}
                                  className="h-8 px-3 rounded-lg border border-green-300 text-xs font-semibold text-green-700 hover:bg-green-50 transition-all whitespace-nowrap"
                                >
                                  Aprovar
                                </button>
                                <button
                                  onClick={() => { setShowRejeitarModal(c.id); setMotivoRejeicao('') }}
                                  className="h-8 px-3 rounded-lg border border-red-200 text-xs font-semibold text-red-500 hover:bg-red-50 transition-all whitespace-nowrap"
                                >
                                  Rejeitar
                                </button>
                              </>
                            )}

                            {/* Editar: grêmio em rascunho/rejeitado; admin em qualquer status exceto aguardando e arquivado */}
                            {(c.status === 'rascunho' ||
                              c.status === 'rejeitado' ||
                              (papel === 'admin' && c.status !== 'arquivado' && c.status !== 'aguardando_aprovacao')) && (
                              <Link
                                href={`/comunicados/${c.id}/editar`}
                                className="h-8 px-3 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:border-[#E8620A] hover:text-[#E8620A] transition-all whitespace-nowrap"
                              >
                                Editar
                              </Link>
                            )}

                            {/* Presenças (mobile) */}
                            {(c.status === 'publicado' || c.status === 'arquivado') && (
                              <Link
                                href={`/comunicados/${c.id}/presencas`}
                                className="h-8 px-3 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:border-[#E8620A] hover:text-[#E8620A] transition-all lg:hidden whitespace-nowrap"
                              >
                                Presenças
                              </Link>
                            )}

                            {/* Arquivar: admin em qualquer status; grêmio exceto aguardando */}
                            {c.status !== 'arquivado' &&
                              !(papel === 'gremio' && c.status === 'aguardando_aprovacao') && (
                              <button
                                onClick={() => setShowArquivarModal(c.id)}
                                className="h-8 px-3 rounded-lg border border-gray-200 text-xs font-semibold text-gray-400 hover:border-red-200 hover:text-red-500 transition-all whitespace-nowrap"
                              >
                                Arquivar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Motivo de rejeição expandido */}
                      {c.status === 'rejeitado' && expandedRejeicao === c.id && (
                        <tr className="border-b border-red-100 bg-red-50">
                          <td colSpan={6} className="px-5 py-3.5">
                            <div className="flex gap-2.5 items-start max-w-2xl">
                              <span
                                className="text-red-400 text-base mt-0.5 shrink-0"
                                aria-hidden="true"
                              >
                                ⊘
                              </span>
                              <div>
                                <p className="text-xs font-bold text-red-700 mb-1">
                                  Motivo da rejeição
                                </p>
                                <p className="text-sm text-red-700 leading-relaxed">
                                  {c.motivo_rejeicao}
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {lista.length > 0 && (
          <p className="text-xs text-gray-400 text-right pr-1">
            {lista.length} {lista.length === 1 ? 'comunicado' : 'comunicados'}
          </p>
        )}
      </div>

      {/* Modal rejeitar */}
      {showRejeitarModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="text-base font-bold text-gray-900 mb-1">Rejeitar comunicado</h3>
            <p className="text-sm text-gray-500 mb-4 leading-relaxed">
              Informe o motivo da rejeição. O grêmio verá esta mensagem ao consultar o comunicado.
            </p>
            <textarea
              value={motivoRejeicao}
              onChange={e => setMotivoRejeicao(e.target.value)}
              placeholder="Descreva o que precisa ser corrigido ou o motivo da recusa…"
              rows={4}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-300 outline-none focus:border-[#E8620A] focus:bg-white transition-colors resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowRejeitarModal(null); setMotivoRejeicao('') }}
                className="flex-1 h-10 rounded-lg border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:border-gray-400 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={() => rejeitar(showRejeitarModal)}
                disabled={!motivoRejeicao.trim()}
                className="flex-1 h-10 rounded-lg bg-red-500 text-sm font-bold text-white hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Rejeitar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal arquivar */}
      {showArquivarModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="text-base font-bold text-gray-900 mb-2">Arquivar comunicado?</h3>
            <p className="text-sm text-gray-500 mb-5 leading-relaxed">
              O comunicado será arquivado e não ficará mais visível para os alunos.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowArquivarModal(null)}
                className="flex-1 h-10 rounded-lg border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:border-gray-400 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={() => arquivar(showArquivarModal)}
                className="flex-1 h-10 rounded-lg bg-gray-700 text-sm font-bold text-white hover:bg-gray-900 transition-colors"
              >
                Arquivar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
