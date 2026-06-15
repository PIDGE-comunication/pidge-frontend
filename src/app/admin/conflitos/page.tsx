'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useUser } from '@/hooks/useUser'

type Resolucao = 'descartado_a' | 'descartado_b' | 'data_alterada' | 'publico_alterado'

interface ComunicadoEmConflito {
  id: string
  titulo: string
  autor_id: string
  autor_nome: string
  data_inicio: string
  data_fim: string
  publico: string[]
}

interface Conflito {
  id: string
  comunicado_a: ComunicadoEmConflito
  comunicado_b: ComunicadoEmConflito
  periodo_sobreposto: string
  publico_sobreposto: string[]
  criado_em: string
  resolvido: boolean
  resolucao?: Resolucao
  resolvido_por?: string
  resolvido_em?: string
}

const RESOLUCAO_LABEL: Record<Resolucao, string> = {
  descartado_a: 'Comunicado A descartado',
  descartado_b: 'Comunicado B descartado',
  data_alterada: 'Data alterada',
  publico_alterado: 'Público alterado',
}

const MOCK: Conflito[] = [
  {
    id: 'cf1',
    comunicado_a: {
      id: 'c1', titulo: 'Reunião de pais e mestres — 2º bimestre', autor_id: 'u1', autor_nome: 'Carla Mendes',
      data_inicio: '2026-06-20T19:00', data_fim: '2026-06-20T21:00',
      publico: ['Curso: Desenvolvimento de Sistemas', 'Turno: Manhã'],
    },
    comunicado_b: {
      id: 'c8', titulo: 'Festival cultural de encerramento', autor_id: 'u9', autor_nome: 'Ana Carolina Reis',
      data_inicio: '2026-06-20T18:00', data_fim: '2026-06-20T22:00',
      publico: ['Escola inteira'],
    },
    periodo_sobreposto: '20/jun 19:00 – 21:00',
    publico_sobreposto: ['Curso: Desenvolvimento de Sistemas (Manhã)'],
    criado_em: '2026-06-09T10:00',
    resolvido: false,
  },
  {
    id: 'cf2',
    comunicado_a: {
      id: 'c7', titulo: 'Simulado ENEM — 2ª aplicação', autor_id: 'u8', autor_nome: 'Eduardo Pereira',
      data_inicio: '2026-06-22T07:30', data_fim: '2026-06-22T12:30',
      publico: ['Turno: Manhã'],
    },
    comunicado_b: {
      id: 'c9', titulo: 'Palestra sobre saúde mental', autor_id: 'u2', autor_nome: 'Mariana Souza',
      data_inicio: '2026-06-22T09:00', data_fim: '2026-06-22T11:00',
      publico: ['Turno: Manhã', 'Turno: Tarde'],
    },
    periodo_sobreposto: '22/jun 09:00 – 11:00',
    publico_sobreposto: ['Turno: Manhã'],
    criado_em: '2026-06-08T15:30',
    resolvido: false,
  },
]

const MOCK_RESOLVIDOS: Conflito[] = [
  {
    id: 'cf0',
    comunicado_a: {
      id: 'c3', titulo: 'Vacinação contra a gripe', autor_id: 'u8', autor_nome: 'Eduardo Pereira',
      data_inicio: '2026-05-10T07:00', data_fim: '2026-05-12T17:00', publico: ['Escola inteira'],
    },
    comunicado_b: {
      id: 'c4', titulo: 'Campanha de doação de alimentos', autor_id: 'u3', autor_nome: 'Rafael Lima',
      data_inicio: '2026-05-11T07:00', data_fim: '2026-05-11T22:00', publico: ['Escola inteira'],
    },
    periodo_sobreposto: '11/mai 07:00 – 17:00',
    publico_sobreposto: ['Escola inteira'],
    criado_em: '2026-05-05T09:00',
    resolvido: true,
    resolucao: 'data_alterada',
    resolvido_por: 'Carla Mendes',
    resolvido_em: '2026-05-06T11:20',
  },
]

function fmtData(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}
function tempoNaFila(iso: string): string {
  const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (dias < 1) return 'há menos de 1 dia'
  return `há ${dias} ${dias === 1 ? 'dia' : 'dias'}`
}

export default function ConflitosPage() {
  const { user, loading } = useUser()
  const [pendentes, setPendentes] = useState<Conflito[]>(MOCK)
  const [resolvidos, setResolvidos] = useState<Conflito[]>(MOCK_RESOLVIDOS)
  const [historicoAberto, setHistoricoAberto] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  function resolver(id: string, resolucao: Resolucao) {
    const c = pendentes.find(x => x.id === id)
    if (!c) return
    setPendentes(prev => prev.filter(x => x.id !== id))
    setResolvidos(prev => [
      { ...c, resolvido: true, resolucao, resolvido_por: user?.nome ?? 'Administração', resolvido_em: new Date().toISOString() },
      ...prev,
    ])
    setToast(`Conflito resolvido — ${RESOLUCAO_LABEL[resolucao]}.`)
    setTimeout(() => setToast(null), 4000)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400 text-sm animate-pulse">Carregando...</p>
      </div>
    )
  }

  // Acesso: super admin vê todos os conflitos; demais veem apenas os conflitos
  // em que são autores de um dos comunicados envolvidos. Quem não se encaixa é bloqueado.
  const ehSuperAdmin = !user || user.papel === 'super_admin'
  const ehAutor = (cf: Conflito) =>
    !!user?.id && (cf.comunicado_a.autor_id === user.id || cf.comunicado_b.autor_id === user.id)
  const pendentesVisiveis = ehSuperAdmin ? pendentes : pendentes.filter(ehAutor)
  const resolvidosVisiveis = ehSuperAdmin ? resolvidos : resolvidos.filter(ehAutor)
  const temAcesso = ehSuperAdmin || pendentesVisiveis.length > 0 || resolvidosVisiveis.length > 0
  const home = ehSuperAdmin || user?.papel === 'admin' ? '/admin/comunicados' : '/meus-comunicados'

  if (!temAcesso) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md text-center">
          <p className="text-3xl mb-3" aria-hidden="true">⊘</p>
          <h1 className="text-lg font-bold text-gray-900 mb-2">Acesso restrito</h1>
          <p className="text-sm text-gray-500 mb-5">
            Os conflitos são visíveis para o super administrador e para os autores dos comunicados envolvidos.
          </p>
          <Link href={home} className="inline-block h-10 px-5 rounded-lg bg-[#E8620A] text-white text-sm font-bold hover:bg-[#c4510a] transition-colors leading-10">
            Voltar
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4 sticky top-0 z-20">
        <Link href={home} className="text-gray-400 hover:text-gray-700 transition-colors text-sm font-medium">
          ← Voltar
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            Conflitos
            {pendentesVisiveis.length > 0 && (
              <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                {pendentesVisiveis.length}
              </span>
            )}
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {ehSuperAdmin
              ? 'Sobreposições de período e público detectadas automaticamente'
              : 'Conflitos que envolvem comunicados de sua autoria'}
          </p>
        </div>
        <span className="hidden sm:block shrink-0 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {ehSuperAdmin ? 'Super admin' : 'Autor'}
        </span>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-4">

        {pendentesVisiveis.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 py-20 flex flex-col items-center gap-3 text-gray-400">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <p className="text-sm font-medium">Nenhum conflito pendente.</p>
            <p className="text-xs">Conflitos aparecem aqui quando dois comunicados publicados se sobrepõem em período e público.</p>
          </div>
        ) : (
          pendentesVisiveis.map(cf => (
            <article key={cf.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              {/* Cabeçalho */}
              <div className="px-5 py-3 border-b border-gray-100 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" />
                  </svg>
                  Conflito detectado
                </span>
                <span className="text-xs text-gray-400">· {tempoNaFila(cf.criado_em)}</span>
              </div>

              {/* Os dois comunicados lado a lado */}
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                <ComunicadoCol rotulo="A" c={cf.comunicado_a} />
                <ComunicadoCol rotulo="B" c={cf.comunicado_b} />
              </div>

              {/* Sobreposição */}
              <div className="px-5 py-4 border-t border-gray-100 bg-red-50/40 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-red-400 mb-1">Período em conflito</p>
                  <p className="text-sm text-gray-700">{cf.periodo_sobreposto}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-red-400 mb-1">Público em conflito</p>
                  <div className="flex flex-wrap gap-1.5">
                    {cf.publico_sobreposto.map((p, i) => (
                      <span key={i} className="inline-flex items-center text-xs text-red-700 bg-red-100 px-2 py-0.5 rounded-full">{p}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Ações de resolução */}
              <div className="px-5 py-3.5 border-t border-gray-100 flex flex-wrap gap-2 justify-end">
                <Link href={`/comunicados/${cf.comunicado_a.id}/editar`} onClick={() => resolver(cf.id, 'data_alterada')}
                  className="h-9 px-3 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:border-[#E8620A] hover:text-[#E8620A] transition-colors leading-9">
                  Editar data/público
                </Link>
                <button onClick={() => resolver(cf.id, 'descartado_a')}
                  className="h-9 px-3 rounded-lg border border-red-300 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors">
                  Descartar A
                </button>
                <button onClick={() => resolver(cf.id, 'descartado_b')}
                  className="h-9 px-3 rounded-lg border border-red-300 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors">
                  Descartar B
                </button>
                <button onClick={() => resolver(cf.id, 'publico_alterado')}
                  className="h-9 px-4 rounded-lg bg-green-600 text-xs font-bold text-white hover:bg-green-700 transition-colors">
                  Marcar como resolvido
                </button>
              </div>
            </article>
          ))
        )}

        {/* Histórico */}
        {resolvidosVisiveis.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <button
              onClick={() => setHistoricoAberto(v => !v)}
              className="w-full px-5 py-3.5 flex items-center justify-between text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <span>Histórico de conflitos resolvidos <span className="text-gray-400">({resolvidosVisiveis.length})</span></span>
              <span className={`transition-transform ${historicoAberto ? 'rotate-180' : ''}`} aria-hidden="true">▾</span>
            </button>
            {historicoAberto && (
              <ul className="border-t border-gray-100 divide-y divide-gray-100">
                {resolvidosVisiveis.map(cf => (
                  <li key={cf.id} className="px-5 py-3.5">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                        {cf.resolucao ? RESOLUCAO_LABEL[cf.resolucao] : 'Resolvido'}
                      </span>
                      {cf.resolvido_em && <span className="text-xs text-gray-400">{fmtData(cf.resolvido_em)}</span>}
                      {cf.resolvido_por && <span className="text-xs text-gray-500">— {cf.resolvido_por}</span>}
                    </div>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">{cf.comunicado_a.titulo}</span>
                      <span className="text-gray-400"> × </span>
                      <span className="font-medium">{cf.comunicado_b.titulo}</span>
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div role="status" className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm font-medium px-4 py-2.5 rounded-full shadow-xl z-50 max-w-[90vw] text-center">
          {toast}
        </div>
      )}
    </div>
  )
}

function ComunicadoCol({ rotulo, c }: { rotulo: 'A' | 'B'; c: ComunicadoEmConflito }) {
  return (
    <div className="px-5 py-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-6 h-6 rounded-full bg-gray-900 text-white text-xs font-bold flex items-center justify-center">{rotulo}</span>
        <Link href={`/comunicados/${c.id}`} className="text-sm font-bold text-gray-900 hover:text-[#E8620A] transition-colors leading-tight">
          {c.titulo}
        </Link>
      </div>
      <p className="text-xs text-gray-400 mb-3">Criado por {c.autor_nome}</p>
      <dl className="flex flex-col gap-2 text-sm">
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Período</dt>
          <dd className="text-gray-700">{fmtData(c.data_inicio)} → {fmtData(c.data_fim)}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Público</dt>
          <dd className="flex flex-wrap gap-1.5">
            {c.publico.map((p, i) => (
              <span key={i} className="inline-flex items-center text-xs text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full">{p}</span>
            ))}
          </dd>
        </div>
      </dl>
    </div>
  )
}
