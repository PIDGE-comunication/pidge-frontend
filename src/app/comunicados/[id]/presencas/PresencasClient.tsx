'use client'

import { useState, Fragment } from 'react'
import Link from 'next/link'

type StatusPresenca = 'confirmado' | 'desmarcado' | 'sem_resposta'

interface Aluno {
  id: string
  nome: string
  sala: string
  turno: 'Manhã' | 'Tarde' | 'Noite'
  status: StatusPresenca
  data_acao?: string
  justificativa?: string
}

const MOCK_TITULO = 'Reunião de pais e mestres — 2º bimestre'
const MOCK_TOTAL  = 150

const MOCK_ALUNOS: Aluno[] = [
  { id: '1',  nome: 'Ana Silva',       sala: 'DS-1A',  turno: 'Manhã', status: 'confirmado',  data_acao: '2026-05-18T10:30' },
  { id: '2',  nome: 'Bruno Costa',     sala: 'ADM-2B', turno: 'Tarde', status: 'desmarcado',  data_acao: '2026-05-19T14:00', justificativa: 'Tenho consulta médica no mesmo horário.' },
  { id: '3',  nome: 'Carla Mendes',    sala: 'MEC-3A', turno: 'Manhã', status: 'confirmado',  data_acao: '2026-05-17T09:15' },
  { id: '4',  nome: 'Daniel Pereira',  sala: 'LOG-1B', turno: 'Tarde', status: 'sem_resposta' },
  { id: '5',  nome: 'Eduarda Santos',  sala: 'ELT-2A', turno: 'Noite', status: 'confirmado',  data_acao: '2026-05-18T20:00' },
  { id: '6',  nome: 'Felipe Oliveira', sala: 'DS-1A',  turno: 'Manhã', status: 'desmarcado',  data_acao: '2026-05-19T11:00', justificativa: 'Viagem familiar previamente agendada, não posso cancelar.' },
  { id: '7',  nome: 'Gabriela Lima',   sala: 'ADM-1C', turno: 'Tarde', status: 'sem_resposta' },
  { id: '8',  nome: 'Henrique Alves',  sala: 'MEC-2B', turno: 'Manhã', status: 'confirmado',  data_acao: '2026-05-17T08:45' },
  { id: '9',  nome: 'Isabela Rocha',   sala: 'LOG-2A', turno: 'Tarde', status: 'desmarcado',  data_acao: '2026-05-20T07:30', justificativa: 'Trabalho no período da tarde e não consigo folga.' },
  { id: '10', nome: 'João Ferreira',   sala: 'ELT-1B', turno: 'Noite', status: 'confirmado',  data_acao: '2026-05-18T19:45' },
  { id: '11', nome: 'Karina Souza',    sala: 'DS-2A',  turno: 'Manhã', status: 'sem_resposta' },
  { id: '12', nome: 'Lucas Martins',   sala: 'ADM-3A', turno: 'Tarde', status: 'confirmado',  data_acao: '2026-05-19T13:20' },
  { id: '13', nome: 'Marina Barbosa',  sala: 'MEC-1A', turno: 'Manhã', status: 'sem_resposta' },
  { id: '14', nome: 'Nathan Costa',    sala: 'LOG-3B', turno: 'Tarde', status: 'desmarcado',  data_acao: '2026-05-18T15:00', justificativa: 'Meu responsável não poderá comparecer no horário indicado.' },
  { id: '15', nome: 'Olivia Dias',     sala: 'ELT-2B', turno: 'Noite', status: 'confirmado',  data_acao: '2026-05-17T21:00' },
]

function formatarData(d?: string) {
  if (!d) return '—'
  return new Date(d).toLocaleString('pt-BR', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

function baixarCSV(dados: Record<string, string>[], nomeArquivo: string) {
  if (!dados.length) return
  const chaves = Object.keys(dados[0])
  const cabecalho = chaves.join(';')
  const linhas = dados.map(row =>
    chaves.map(k => {
      const v = row[k] ?? ''
      return v.includes(';') || v.includes('\n') ? `"${v.replace(/"/g, '""')}"` : v
    }).join(';')
  )
  const csv = [cabecalho, ...linhas].join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url
  a.download = nomeArquivo
  a.click()
  URL.revokeObjectURL(url)
}

export default function PresencasClient({ id }: { id: string }) {
  const [abaAtiva,    setAbaAtiva]    = useState<StatusPresenca>('confirmado')
  const [expandedJust, setExpandedJust] = useState<string | null>(null)

  const confirmados = MOCK_ALUNOS.filter(a => a.status === 'confirmado')
  const desmarcados = MOCK_ALUNOS.filter(a => a.status === 'desmarcado')
  const semResposta = MOCK_ALUNOS.filter(a => a.status === 'sem_resposta')
  const total       = MOCK_TOTAL

  const listaAtiva =
    abaAtiva === 'confirmado'   ? confirmados  :
    abaAtiva === 'desmarcado'   ? desmarcados  :
    semResposta

  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0)

  function exportarCompleto() {
    baixarCSV(
      MOCK_ALUNOS.map(a => ({
        Nome: a.nome, Sala: a.sala, Turno: a.turno,
        Status:
          a.status === 'confirmado' ? 'Confirmado' :
          a.status === 'desmarcado' ? 'Desmarcado' : 'Sem resposta',
        'Data da ação': formatarData(a.data_acao),
        Justificativa: a.justificativa ?? '',
      })),
      `presencas-${id}-completo.csv`
    )
  }

  function exportarConfirmados() {
    baixarCSV(
      confirmados.map(a => ({
        Nome: a.nome, Sala: a.sala, Turno: a.turno,
        'Data de confirmação': formatarData(a.data_acao),
      })),
      `presencas-${id}-confirmados.csv`
    )
  }

  function exportarDesmarcados() {
    baixarCSV(
      desmarcados.map(a => ({
        Nome: a.nome, Sala: a.sala, Turno: a.turno,
        'Data de desmarcação': formatarData(a.data_acao),
        Justificativa: a.justificativa ?? '',
      })),
      `presencas-${id}-desmarcados.csv`
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3 sticky top-0 z-20">
        <Link
          href="/meus-comunicados"
          className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-all shrink-0"
          aria-label="Voltar para meus comunicados"
        >
          ←
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-gray-900 truncate">{MOCK_TITULO}</h1>
          <p className="text-xs text-gray-400 mt-0.5">Painel de presenças</p>
        </div>
        <div className="shrink-0 hidden sm:flex gap-2">
          <ExportBtn onClick={exportarCompleto}    label="Completo"    />
          <ExportBtn onClick={exportarConfirmados} label="Confirmados" color="green" />
          <ExportBtn onClick={exportarDesmarcados} label="Desmarcados" color="red" />
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 flex flex-col gap-5">

        {/* Resumo numérico */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SummaryCard label="Público-alvo" value={total}              subtitle="100%"                         color="gray"  />
          <SummaryCard label="Confirmados"  value={confirmados.length} subtitle={`${pct(confirmados.length)}%`} color="green" />
          <SummaryCard label="Desmarcados"  value={desmarcados.length} subtitle={`${pct(desmarcados.length)}%`} color="red"   />
          <SummaryCard label="Sem ação"     value={semResposta.length} subtitle={`${pct(semResposta.length)}%`} color="amber" />
        </div>

        {/* Barra de progresso */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>Participação</span>
            <span>{confirmados.length + desmarcados.length} de {total} responderam</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex">
            <div className="bg-green-400 h-full transition-all" style={{ width: `${pct(confirmados.length)}%` }} />
            <div className="bg-red-400 h-full transition-all"   style={{ width: `${pct(desmarcados.length)}%` }} />
          </div>
          <div className="flex gap-4 mt-2 text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block" aria-hidden="true" /> Confirmados
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" aria-hidden="true" /> Desmarcados
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-gray-200 inline-block" aria-hidden="true" /> Sem resposta
            </span>
          </div>
        </div>

        {/* Lista de alunos */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">

          {/* Abas */}
          <div className="flex border-b border-gray-100" role="tablist">
            {([
              { key: 'confirmado'   as const, label: 'Confirmados',  count: confirmados.length, activeCls: 'text-green-600' },
              { key: 'desmarcado'   as const, label: 'Desmarcados',  count: desmarcados.length, activeCls: 'text-red-500'   },
              { key: 'sem_resposta' as const, label: 'Sem resposta', count: semResposta.length, activeCls: 'text-amber-600' },
            ]).map(aba => (
              <button
                key={aba.key}
                role="tab"
                aria-selected={abaAtiva === aba.key}
                onClick={() => { setAbaAtiva(aba.key); setExpandedJust(null) }}
                className={[
                  'flex-1 flex items-center justify-center gap-1.5 py-3 px-2 text-sm font-semibold border-b-2 transition-all',
                  abaAtiva === aba.key
                    ? `border-[#E8620A] ${aba.activeCls}`
                    : 'border-transparent text-gray-400 hover:text-gray-600',
                ].join(' ')}
              >
                {aba.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  abaAtiva === aba.key ? 'bg-[#E8620A]/10 text-[#E8620A]' : 'bg-gray-100 text-gray-500'
                }`}>
                  {aba.count}
                </span>
              </button>
            ))}
          </div>

          {/* Tabela */}
          {listaAtiva.length === 0 ? (
            <div className="py-12 flex flex-col items-center gap-1.5 text-gray-400">
              <p className="text-sm">Nenhum aluno nesta categoria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[520px]" role="tabpanel">
                <thead>
                  <tr className="border-b border-gray-50 bg-gray-50/40">
                    <th className="text-left px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Nome</th>
                    <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 hidden sm:table-cell">Sala</th>
                    <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 hidden md:table-cell">Turno</th>
                    <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      {abaAtiva === 'confirmado' ? 'Confirmado em' : abaAtiva === 'desmarcado' ? 'Desmarcado em' : 'Última ação'}
                    </th>
                    {abaAtiva === 'desmarcado' && (
                      <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 hidden lg:table-cell">
                        Justificativa
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {listaAtiva.map(a => (
                    <Fragment key={a.id}>
                      <tr className="border-b border-gray-50 hover:bg-gray-50/70 transition-colors">
                        <td className="px-5 py-3 font-medium text-gray-900">
                          {a.nome}
                          {abaAtiva === 'desmarcado' && a.justificativa && (
                            <button
                              onClick={() => setExpandedJust(expandedJust === a.id ? null : a.id)}
                              className="ml-2 text-xs text-red-400 hover:text-red-600 font-normal lg:hidden"
                            >
                              {expandedJust === a.id ? 'Ocultar' : 'Ver justificativa'}
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{a.sala}</td>
                        <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{a.turno}</td>
                        <td className="px-4 py-3 text-xs text-gray-500 tabular-nums whitespace-nowrap">
                          {formatarData(a.data_acao)}
                        </td>
                        {abaAtiva === 'desmarcado' && (
                          <td className="px-4 py-3 hidden lg:table-cell">
                            {a.justificativa
                              ? <span className="text-xs text-gray-600 italic line-clamp-2">{a.justificativa}</span>
                              : <span className="text-xs text-gray-300">Sem justificativa</span>
                            }
                          </td>
                        )}
                      </tr>

                      {/* Justificativa expandida (mobile) */}
                      {abaAtiva === 'desmarcado' && expandedJust === a.id && a.justificativa && (
                        <tr className="border-b border-red-100 bg-red-50 lg:hidden">
                          <td colSpan={4} className="px-5 py-3">
                            <p className="text-xs font-bold text-red-600 mb-0.5">Justificativa</p>
                            <p className="text-sm text-red-700 italic">{a.justificativa}</p>
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

        {/* Exportação — mobile */}
        <div className="sm:hidden flex flex-col gap-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-1">Exportar</p>
          <ExportBtn onClick={exportarCompleto}    label="Lista completa (CSV)"                       fullWidth />
          <ExportBtn onClick={exportarConfirmados} label="Confirmados (CSV)"              color="green" fullWidth />
          <ExportBtn onClick={exportarDesmarcados} label="Desmarcados com justificativas (CSV)" color="red" fullWidth />
        </div>

      </div>
    </div>
  )
}

/* ── Sub-components ── */

function SummaryCard({ label, value, subtitle, color }: {
  label: string; value: number; subtitle: string
  color: 'gray' | 'green' | 'red' | 'amber'
}) {
  const cls = {
    gray:  { border: 'border-gray-200',  num: 'text-gray-800',  pct: 'text-gray-400',  bg: 'bg-white'    },
    green: { border: 'border-green-200', num: 'text-green-700', pct: 'text-green-500', bg: 'bg-green-50' },
    red:   { border: 'border-red-200',   num: 'text-red-600',   pct: 'text-red-400',   bg: 'bg-red-50'   },
    amber: { border: 'border-amber-200', num: 'text-amber-700', pct: 'text-amber-500', bg: 'bg-amber-50' },
  }[color]

  return (
    <div className={`rounded-xl border ${cls.border} ${cls.bg} p-4`}>
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">{label}</p>
      <p className={`text-3xl font-bold tabular-nums ${cls.num}`}>{value}</p>
      <p className={`text-sm font-semibold mt-0.5 ${cls.pct}`}>{subtitle}</p>
    </div>
  )
}

function ExportBtn({ onClick, label, color = 'default', fullWidth = false }: {
  onClick: () => void; label: string
  color?: 'default' | 'green' | 'red'; fullWidth?: boolean
}) {
  const hoverCls =
    color === 'green' ? 'hover:border-green-400 hover:text-green-600' :
    color === 'red'   ? 'hover:border-red-300 hover:text-red-500'     :
    'hover:border-[#E8620A] hover:text-[#E8620A]'

  return (
    <button
      onClick={onClick}
      className={[
        'flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 font-semibold text-gray-600 transition-all',
        fullWidth ? 'w-full h-10 text-sm px-4' : 'h-9 px-3 text-xs',
        hoverCls,
      ].join(' ')}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" x2="12" y1="15" y2="3" />
      </svg>
      {label}
    </button>
  )
}
