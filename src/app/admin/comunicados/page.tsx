'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useUser } from '@/hooks/useUser'

type Prioridade = 'baixa' | 'media' | 'alta' | 'urgente'
type Status = 'rascunho' | 'aguardando_aprovacao' | 'publicado' | 'arquivado' | 'rejeitado'
type Papel = 'admin' | 'gremio'

interface Comunicado {
  id: string
  titulo: string
  autor_nome: string
  autor_papel: Papel
  prioridade: Prioridade
  publico_resumido: string
  data_inicio: string
  data_fim: string
  status: Status
  total_presencas: number
}

const PRIO_LABEL: Record<Prioridade, string> = {
  baixa: 'Baixa', media: 'Média', alta: 'Alta', urgente: 'Urgente',
}
const PRIO_CLS: Record<Prioridade, string> = {
  baixa: 'bg-gray-100 text-gray-600',
  media: 'bg-blue-100 text-blue-700',
  alta: 'bg-orange-100 text-[#c4510a]',
  urgente: 'bg-red-100 text-red-700',
}

const STATUS_LABEL: Record<Status, string> = {
  rascunho: 'Rascunho',
  aguardando_aprovacao: 'Aguardando',
  publicado: 'Publicado',
  arquivado: 'Arquivado',
  rejeitado: 'Rejeitado',
}
const STATUS_CLS: Record<Status, string> = {
  rascunho: 'bg-gray-100 text-gray-600',
  aguardando_aprovacao: 'bg-amber-100 text-amber-700',
  publicado: 'bg-green-100 text-green-700',
  arquivado: 'bg-gray-100 text-gray-400',
  rejeitado: 'bg-red-100 text-red-700',
}

const MOCK: Comunicado[] = [
  { id: 'c1', titulo: 'Reunião de pais e mestres — 2º bimestre', autor_nome: 'Carla Mendes', autor_papel: 'admin', prioridade: 'alta', publico_resumido: 'Escola inteira', data_inicio: '2026-06-20T19:00', data_fim: '2026-06-20T21:00', status: 'publicado', total_presencas: 84 },
  { id: 'c2', titulo: 'Semana da Tecnologia e Inovação', autor_nome: 'Mariana Souza', autor_papel: 'gremio', prioridade: 'media', publico_resumido: 'Curso: Desenv. de Sistemas', data_inicio: '2026-06-01T08:00', data_fim: '2026-06-05T18:00', status: 'aguardando_aprovacao', total_presencas: 0 },
  { id: 'c3', titulo: 'Vacinação contra a gripe — campanha anual', autor_nome: 'Eduardo Pereira', autor_papel: 'admin', prioridade: 'urgente', publico_resumido: 'Escola inteira', data_inicio: '2026-05-10T07:00', data_fim: '2026-05-12T17:00', status: 'arquivado', total_presencas: 612 },
  { id: 'c4', titulo: 'Campanha de doação de alimentos', autor_nome: 'Rafael Lima', autor_papel: 'gremio', prioridade: 'baixa', publico_resumido: 'Escola inteira', data_inicio: '2026-06-10T07:00', data_fim: '2026-06-20T22:00', status: 'rejeitado', total_presencas: 0 },
  { id: 'c5', titulo: 'Entrega de boletins do 1º semestre', autor_nome: 'Carla Mendes', autor_papel: 'admin', prioridade: 'alta', publico_resumido: 'Salas: DS1, DS2, ADM1', data_inicio: '2026-07-01T08:00', data_fim: '2026-07-03T18:00', status: 'rascunho', total_presencas: 0 },
  { id: 'c6', titulo: 'Festa junina da escola', autor_nome: 'Ana Carolina Reis', autor_papel: 'gremio', prioridade: 'media', publico_resumido: 'Escola inteira', data_inicio: '2026-06-28T18:00', data_fim: '2026-06-28T23:00', status: 'publicado', total_presencas: 327 },
  { id: 'c7', titulo: 'Simulado ENEM — 2ª aplicação', autor_nome: 'Eduardo Pereira', autor_papel: 'admin', prioridade: 'urgente', publico_resumido: 'Turno: Manhã', data_inicio: '2026-06-22T07:30', data_fim: '2026-06-22T12:30', status: 'publicado', total_presencas: 198 },
  { id: 'c8', titulo: 'Reunião do conselho do grêmio', autor_nome: 'Ana Carolina Reis', autor_papel: 'gremio', prioridade: 'alta', publico_resumido: 'Representantes de turma', data_inicio: '2026-06-12T19:00', data_fim: '2026-06-12T21:00', status: 'aguardando_aprovacao', total_presencas: 0 },
]

type SortKey = 'titulo' | 'autor_nome' | 'prioridade' | 'data_inicio' | 'status' | 'total_presencas'
const PRIO_ORDER: Record<Prioridade, number> = { urgente: 0, alta: 1, media: 2, baixa: 3 }
const PAGE_SIZE = 6

function fmtPeriodo(ini: string, fim: string) {
  const f = (d: string) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  return `${f(ini)} – ${f(fim)}`
}

export default function AdminComunicadosPage() {
  const { user, loading } = useUser()
  const [comunicados, setComunicados] = useState<Comunicado[]>(MOCK)
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<Set<Status>>(new Set())
  const [filtroPapel, setFiltroPapel] = useState<Papel | 'todos'>('todos')
  const [filtroPrio, setFiltroPrio] = useState<Prioridade | 'todas'>('todas')
  const [sortKey, setSortKey] = useState<SortKey>('data_inicio')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [pagina, setPagina] = useState(1)
  const [confirmArquivar, setConfirmArquivar] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  function toggleStatus(s: Status) {
    setFiltroStatus(prev => {
      const next = new Set(prev)
      if (next.has(s)) next.delete(s); else next.add(s)
      return next
    })
    setPagina(1)
  }

  function ordenarPor(k: SortKey) {
    if (k === sortKey) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(k); setSortDir('asc') }
  }

  const filtrada = useMemo(() => {
    const arr = comunicados.filter(c => {
      if (filtroStatus.size > 0 && !filtroStatus.has(c.status)) return false
      if (filtroPapel !== 'todos' && c.autor_papel !== filtroPapel) return false
      if (filtroPrio !== 'todas' && c.prioridade !== filtroPrio) return false
      if (busca) {
        const q = busca.toLowerCase()
        if (!c.titulo.toLowerCase().includes(q) && !c.autor_nome.toLowerCase().includes(q)) return false
      }
      return true
    })
    arr.sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'titulo': cmp = a.titulo.localeCompare(b.titulo, 'pt-BR'); break
        case 'autor_nome': cmp = a.autor_nome.localeCompare(b.autor_nome, 'pt-BR'); break
        case 'prioridade': cmp = PRIO_ORDER[a.prioridade] - PRIO_ORDER[b.prioridade]; break
        case 'data_inicio': cmp = new Date(a.data_inicio).getTime() - new Date(b.data_inicio).getTime(); break
        case 'status': cmp = a.status.localeCompare(b.status); break
        case 'total_presencas': cmp = a.total_presencas - b.total_presencas; break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return arr
  }, [comunicados, filtroStatus, filtroPapel, filtroPrio, busca, sortKey, sortDir])

  const totalPaginas = Math.max(1, Math.ceil(filtrada.length / PAGE_SIZE))
  const paginaAtual = Math.min(pagina, totalPaginas)
  const visiveis = filtrada.slice((paginaAtual - 1) * PAGE_SIZE, paginaAtual * PAGE_SIZE)

  function arquivar(id: string) {
    const c = comunicados.find(x => x.id === id)
    setComunicados(prev => prev.map(x => (x.id === id ? { ...x, status: 'arquivado' } : x)))
    setConfirmArquivar(null)
    setToast(`"${c?.titulo}" arquivado.`)
    setTimeout(() => setToast(null), 4000)
  }

  function limpar() {
    setBusca(''); setFiltroStatus(new Set()); setFiltroPapel('todos'); setFiltroPrio('todas'); setPagina(1)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400 text-sm animate-pulse">Carregando...</p>
      </div>
    )
  }

  const ehAdmin = !user || user.papel === 'admin' || user.papel === 'super_admin'
  if (!ehAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md text-center">
          <p className="text-3xl mb-3" aria-hidden="true">⊘</p>
          <h1 className="text-lg font-bold text-gray-900 mb-2">Acesso restrito</h1>
          <p className="text-sm text-gray-500 mb-5">Esta visão é exclusiva da administração.</p>
          <Link href="/meus-comunicados" className="inline-block h-10 px-5 rounded-lg bg-[#E8620A] text-white text-sm font-bold hover:bg-[#c4510a] transition-colors leading-10">
            Voltar
          </Link>
        </div>
      </div>
    )
  }

  const filtrosAtivos = !!busca || filtroStatus.size > 0 || filtroPapel !== 'todos' || filtroPrio !== 'todas'

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex flex-wrap items-center gap-4 sticky top-0 z-20">
        {user?.papel === 'super_admin' && (
          <Link href="/admin/aprovacoes" className="text-gray-400 hover:text-gray-700 transition-colors text-sm font-medium">
            ← Aprovações
          </Link>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-gray-900">Todos os comunicados</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {comunicados.length} no total · {comunicados.filter(c => c.status === 'publicado').length} publicados
          </p>
        </div>
        <span className="hidden sm:block shrink-0 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Administração
        </span>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col gap-4">

        {/* Filtros */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-3">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-48">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Buscar</label>
              <input
                type="search" value={busca}
                onChange={e => { setBusca(e.target.value); setPagina(1) }}
                placeholder="Título ou autor…"
                className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-300 outline-none focus:border-[#E8620A] focus:bg-white transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Autor</label>
              <select value={filtroPapel} onChange={e => { setFiltroPapel(e.target.value as Papel | 'todos'); setPagina(1) }}
                className="h-9 px-3 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-700 outline-none focus:border-[#E8620A] transition-colors cursor-pointer">
                <option value="todos">Todos</option>
                <option value="admin">Administração</option>
                <option value="gremio">Grêmio</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Prioridade</label>
              <select value={filtroPrio} onChange={e => { setFiltroPrio(e.target.value as Prioridade | 'todas'); setPagina(1) }}
                className="h-9 px-3 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-700 outline-none focus:border-[#E8620A] transition-colors cursor-pointer">
                <option value="todas">Todas</option>
                <option value="urgente">Urgente</option>
                <option value="alta">Alta</option>
                <option value="media">Média</option>
                <option value="baixa">Baixa</option>
              </select>
            </div>
            {filtrosAtivos && (
              <button onClick={limpar} className="h-9 px-3 rounded-lg border border-gray-200 text-xs font-semibold text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors">
                Limpar filtros
              </button>
            )}
          </div>
          {/* Status (multi-seleção) */}
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mr-1">Status</span>
            {(Object.keys(STATUS_LABEL) as Status[]).map(s => (
              <button key={s} onClick={() => toggleStatus(s)}
                className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                  filtroStatus.has(s) ? 'border-[#E8620A] bg-orange-50 text-[#c4510a]' : 'border-gray-200 text-gray-500 hover:border-gray-400'
                }`}>
                {STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {visiveis.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-2 text-gray-400">
              <p className="text-sm">Nenhum comunicado encontrado.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[860px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <Th label="Título" k="titulo" sortKey={sortKey} sortDir={sortDir} onSort={ordenarPor} />
                    <Th label="Autor" k="autor_nome" sortKey={sortKey} sortDir={sortDir} onSort={ordenarPor} />
                    <Th label="Prioridade" k="prioridade" sortKey={sortKey} sortDir={sortDir} onSort={ordenarPor} />
                    <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 hidden lg:table-cell">Público</th>
                    <Th label="Período" k="data_inicio" sortKey={sortKey} sortDir={sortDir} onSort={ordenarPor} className="hidden md:table-cell" />
                    <Th label="Status" k="status" sortKey={sortKey} sortDir={sortDir} onSort={ordenarPor} />
                    <Th label="Presenças" k="total_presencas" sortKey={sortKey} sortDir={sortDir} onSort={ordenarPor} className="hidden sm:table-cell" />
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {visiveis.map(c => (
                    <tr key={c.id} className={`border-b border-gray-50 hover:bg-gray-50/70 transition-colors ${c.status === 'arquivado' ? 'opacity-60' : ''}`}>
                      <td className="px-5 py-3.5 font-medium text-gray-900 max-w-[260px]">
                        <span className="line-clamp-2">{c.titulo}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-gray-700 leading-tight">{c.autor_nome}</p>
                        <p className="text-xs text-gray-400">{c.autor_papel === 'admin' ? 'Administração' : 'Grêmio'}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex text-xs font-semibold px-2 py-0.5 rounded-full ${PRIO_CLS[c.prioridade]}`}>{PRIO_LABEL[c.prioridade]}</span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-600 hidden lg:table-cell">{c.publico_resumido}</td>
                      <td className="px-4 py-3.5 text-xs text-gray-600 whitespace-nowrap hidden md:table-cell">{fmtPeriodo(c.data_inicio, c.data_fim)}</td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_CLS[c.status]}`}>{STATUS_LABEL[c.status]}</span>
                      </td>
                      <td className="px-4 py-3.5 text-gray-700 tabular-nums hidden sm:table-cell">{c.total_presencas || '—'}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 justify-end">
                          <Link href={`/comunicados/${c.id}`} className="h-8 px-3 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:border-[#E8620A] hover:text-[#E8620A] transition-colors leading-8">Ver</Link>
                          <Link href={`/comunicados/${c.id}/editar`} className="h-8 px-3 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:border-[#E8620A] hover:text-[#E8620A] transition-colors leading-8">Editar</Link>
                          <Link href={`/comunicados/${c.id}/presencas`} className="h-8 px-3 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-colors leading-8 hidden xl:inline-block">Presenças</Link>
                          {c.status !== 'arquivado' && (
                            <button onClick={() => setConfirmArquivar(c.id)} className="h-8 px-3 rounded-lg border border-gray-200 text-xs font-semibold text-gray-400 hover:border-red-200 hover:text-red-500 transition-colors">Arquivar</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Paginação */}
        {filtrada.length > PAGE_SIZE && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">
              {filtrada.length} comunicados · página {paginaAtual} de {totalPaginas}
            </p>
            <div className="flex gap-2">
              <button disabled={paginaAtual <= 1} onClick={() => setPagina(p => Math.max(1, p - 1))}
                className="h-9 px-3 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:border-gray-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                Anterior
              </button>
              <button disabled={paginaAtual >= totalPaginas} onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                className="h-9 px-3 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:border-gray-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirm arquivar */}
      {confirmArquivar && (() => {
        const c = comunicados.find(x => x.id === confirmArquivar)
        if (!c) return null
        return (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
              <h3 className="text-base font-bold text-gray-900 mb-2">Arquivar comunicado?</h3>
              <p className="text-sm text-gray-500 mb-5 leading-relaxed">
                &quot;{c.titulo}&quot; deixará de ser exibido no feed dos alunos. Os registros de presença são preservados.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmArquivar(null)} className="flex-1 h-10 rounded-lg border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:border-gray-400 transition-colors">Cancelar</button>
                <button onClick={() => arquivar(c.id)} className="flex-1 h-10 rounded-lg bg-red-500 text-sm font-bold text-white hover:bg-red-600 transition-colors">Arquivar</button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Toast */}
      {toast && (
        <div role="status" className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm font-medium px-4 py-2.5 rounded-full shadow-xl z-50 max-w-[90vw] text-center">
          {toast}
        </div>
      )}
    </div>
  )
}

function Th({ label, k, sortKey, sortDir, onSort, className = '' }: {
  label: string; k: SortKey; sortKey: SortKey; sortDir: 'asc' | 'desc'; onSort: (k: SortKey) => void; className?: string
}) {
  const ativo = sortKey === k
  return (
    <th className={`text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 ${className}`}>
      <button onClick={() => onSort(k)} className={`inline-flex items-center gap-1 hover:text-gray-700 transition-colors ${ativo ? 'text-gray-700' : ''}`}>
        {label}
        <span aria-hidden="true" className="text-[8px]">{ativo ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}</span>
      </button>
    </th>
  )
}
