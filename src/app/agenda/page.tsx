'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useUser } from '@/hooks/useUser'
import styles from './agenda.module.css'
type PresencaStatus = 'confirmado' | 'desmarcado' | 'automatico'

interface AgendaEvent {
  id: string
  comunicadoId: string
  titulo: string
  descricao: string
  dataInicio: string
  dataFim: string
  obrigatorio: boolean
  status: PresencaStatus
  justificativa?: string
  publicoResumo: string
}

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const STATUS_LABEL: Record<PresencaStatus, { label: string; accent: string }> = {
  confirmado: { label: 'Confirmado', accent: 'bg-emerald-50 text-emerald-700' },
  automatico: { label: 'Automático', accent: 'bg-sky-50 text-sky-700' },
  desmarcado: { label: 'Desmarcado', accent: 'bg-rose-50 text-rose-700' },
}

function pad(value: number) {
  return String(value).padStart(2, '0')
}

function formatLocalDate(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function formatLocalDateTime(date: Date) {
  return `${formatLocalDate(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function addDays(date: Date, amount: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

function buildSampleEvents(reference: Date): AgendaEvent[] {
  return [
    {
      id: 'evt-1',
      comunicadoId: 'c1',
      titulo: 'Reunião de pais e mestres',
      descricao: 'Reunião no auditório com todos os responsáveis. Comparecer com uniforme completo.',
      dataInicio: formatLocalDateTime(new Date(reference.getFullYear(), reference.getMonth(), reference.getDate() + 1, 9, 0)),
      dataFim: formatLocalDateTime(new Date(reference.getFullYear(), reference.getMonth(), reference.getDate() + 1, 10, 30)),
      obrigatorio: true,
      status: 'automatico',
      publicoResumo: 'Todos os cursos',
    },
    {
      id: 'evt-2',
      comunicadoId: 'c2',
      titulo: 'Oficina de redação',
      descricao: 'Atividade opcional de preparação para o simulado.',
      dataInicio: formatLocalDateTime(new Date(reference.getFullYear(), reference.getMonth(), reference.getDate() + 2, 14, 0)),
      dataFim: formatLocalDateTime(new Date(reference.getFullYear(), reference.getMonth(), reference.getDate() + 2, 15, 30)),
      obrigatorio: false,
      status: 'confirmado',
      publicoResumo: 'Curso de Desenvolvimento de Sistemas',
    },
    {
      id: 'evt-3',
      comunicadoId: 'c3',
      titulo: 'Aula extra de matemática',
      descricao: 'Aula complementar para revisão de prova.',
      dataInicio: formatLocalDateTime(addDays(reference, -3)).replace('00:00', '08:30'),
      dataFim: formatLocalDateTime(addDays(reference, -3)).replace('00:00', '10:00'),
      obrigatorio: false,
      status: 'desmarcado',
      justificativa: 'Precisei acompanhar meu irmão em consulta médica.',
      publicoResumo: 'Curso de Administração',
    },
    {
      id: 'evt-4',
      comunicadoId: 'c4',
      titulo: 'Simulado de inglês',
      descricao: 'Avaliação obrigatória para todos os alunos do turno da tarde.',
      dataInicio: formatLocalDateTime(new Date(reference.getFullYear(), reference.getMonth(), reference.getDate() + 5, 11, 0)),
      dataFim: formatLocalDateTime(new Date(reference.getFullYear(), reference.getMonth(), reference.getDate() + 5, 12, 30)),
      obrigatorio: true,
      status: 'confirmado',
      publicoResumo: 'Turno Tarde',
    },
    {
      id: 'evt-5',
      comunicadoId: 'c5',
      titulo: 'Plantão de dúvidas - física',
      descricao: 'Espaço opcional para revisão antes da prova.',
      dataInicio: formatLocalDateTime(new Date(reference.getFullYear(), reference.getMonth(), reference.getDate() + 9, 16, 0)),
      dataFim: formatLocalDateTime(new Date(reference.getFullYear(), reference.getMonth(), reference.getDate() + 9, 17, 0)),
      obrigatorio: false,
      status: 'confirmado',
      publicoResumo: 'Todos os cursos',
    },
  ]
}

function getMonthLabel(date: Date) {
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

function getDayLabel(date: Date) {
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`
}

function getHourRange(start: string, end: string) {
  return `${start.slice(11, 16)} - ${end.slice(11, 16)}`
}

function isSameDate(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export default function AgendaPage() {
  const { user, loading } = useUser()
  const [currentMonth, setCurrentMonth] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const [onlyObrigatorio, setOnlyObrigatorio] = useState(false)
  const [onlyConfirmados, setOnlyConfirmados] = useState(false)
  const [showPastEvents, setShowPastEvents] = useState(false)
  const [justificativa, setJustificativa] = useState('')
  const [justificativaError, setJustificativaError] = useState('')
  const [modalEvent, setModalEvent] = useState<AgendaEvent | null>(null)
  const [events, setEvents] = useState<AgendaEvent[]>(() => buildSampleEvents(new Date()))

  const today = useMemo(() => new Date(), [])

  const visibleEvents = useMemo(() => {
    const nowKey = formatLocalDate(today)
    return events.filter(event => {
      const eventDate = event.dataInicio.slice(0, 10)
      if (onlyObrigatorio && !event.obrigatorio) return false
      if (onlyConfirmados && event.status !== 'confirmado') return false
      if (!showPastEvents && eventDate < nowKey) return false
      return true
    })
  }, [events, onlyObrigatorio, onlyConfirmados, showPastEvents, today])

  const eventsByDay = useMemo(() => {
    const map = new Map<string, AgendaEvent[]>()
    visibleEvents.forEach(event => {
      const key = event.dataInicio.slice(0, 10)
      const list = map.get(key) ?? []
      list.push(event)
      map.set(key, list)
    })
    return map
  }, [visibleEvents])

  const selectedDayKey = formatLocalDate(selectedDate)
  const selectedDayEvents = eventsByDay.get(selectedDayKey) ?? []

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const startWeekday = firstDay.getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const totalCells = 42
    return Array.from({ length: totalCells }, (_, index) => {
      const dayOffset = index - startWeekday
      return new Date(year, month, dayOffset + 1)
    })
  }, [currentMonth])

  const monthHasEvents = calendarDays.some(day => eventsByDay.has(formatLocalDate(day)))

  function changeMonth(amount: number) {
    const next = new Date(currentMonth)
    next.setMonth(next.getMonth() + amount)
    setCurrentMonth(next)
    if (!isSameDate(next, selectedDate) && next.getMonth() !== selectedDate.getMonth()) {
      setSelectedDate(new Date(next.getFullYear(), next.getMonth(), 1))
    }
  }

  function handleOpenDesmarcar(event: AgendaEvent) {
    setModalEvent(event)
    setJustificativa(event.justificativa ?? '')
    setJustificativaError('')
  }

  function handleConfirmDesmarcar() {
    if (justificativa.trim().length < 10) {
      setJustificativaError('A justificativa deve ter ao menos 10 caracteres.')
      return
    }
    if (!modalEvent) return
    setEvents(prev => prev.map(item => item.id === modalEvent.id ? { ...item, status: 'desmarcado', justificativa: justificativa.trim() } : item))
    setModalEvent(null)
    setJustificativa('')
    setJustificativaError('')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-sm animate-pulse">Carregando agenda...</p>
      </div>
    )
  }

  return (
    <div className={styles.root}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-600">Agenda pessoal</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">Calendário de atividades</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">Veja seus eventos confirmados e obrigatórios, controle presença e acesse detalhes rapidamente.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/feed" className="inline-flex h-11 items-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-300">
              Voltar ao feed
            </Link>
            <span className="inline-flex h-11 items-center rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white">{user?.nome ?? 'Usuário'}</span>
          </div>
        </div>

        <div className={`${styles.gridMain} grid gap-6 xl:grid-cols-[1.35fr_1fr]`}>
          <section className={styles.panel}>
            <div className="flex items-center justify-between gap-3 mb-5">
              <div>
                <p className="text-sm font-semibold text-slate-900">{getMonthLabel(currentMonth)}</p>
                <p className="text-xs text-slate-500">Clique em um dia para ver os eventos programados.</p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => changeMonth(-1)} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100">
                  ‹
                </button>
                <button type="button" onClick={() => changeMonth(1)} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100">
                  ›
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 mb-3">
              {WEEKDAY_LABELS.map(day => (
                <div key={day}>{day}</div>
              ))}
            </div>

            <div className={styles.calendarGrid}>
              {calendarDays.map((day, index) => {
                const key = formatLocalDate(day)
                const dayEvents = eventsByDay.get(key) ?? []
                const isCurrentMonth = day.getMonth() === currentMonth.getMonth()
                const isSelected = isSameDate(day, selectedDate)
                const isToday = isSameDate(day, today)
                const eventHighlight = dayEvents.some(ev => ev.obrigatorio)
                  ? 'bg-amber-100 border-amber-300'
                  : dayEvents.length > 0
                    ? 'bg-emerald-100 border-emerald-300'
                    : 'border-transparent'

                return (
                  <button
                    key={`${key}-${index}`}
                    type="button"
                    onClick={() => setSelectedDate(day)}
                    className={`group flex h-16 flex-col items-center justify-between rounded-2xl border p-2 text-xs font-semibold transition ${isCurrentMonth ? 'bg-white' : 'bg-slate-50 text-slate-400'} ${isSelected ? 'border-slate-900 bg-slate-900 text-white shadow-sm' : 'border-slate-200'} ${isToday ? 'ring-2 ring-amber-400' : ''}`}
                  >
                    <span>{day.getDate()}</span>
                    <span className={`h-2.5 w-2.5 rounded-full ${dayEvents.length === 0 ? 'bg-transparent' : eventHighlight}`} />
                  </button>
                )
              })}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Obrigatórios</p>
                <p className="mt-2 text-sm text-slate-700">Dias marcados em amarelo</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Confirmados</p>
                <p className="mt-2 text-sm text-slate-700">Dias marcados em verde</p>
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Filtros</p>
              <div className="mt-4 space-y-3">
                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <input type="checkbox" checked={onlyObrigatorio} onChange={() => setOnlyObrigatorio(v => !v)} className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500" />
                  <span className="text-sm text-slate-700">Somente obrigatórios</span>
                </label>
                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <input type="checkbox" checked={onlyConfirmados} onChange={() => setOnlyConfirmados(v => !v)} className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                  <span className="text-sm text-slate-700">Somente confirmados pelo aluno</span>
                </label>
                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <input type="checkbox" checked={showPastEvents} onChange={() => setShowPastEvents(v => !v)} className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-700" />
                  <span className="text-sm text-slate-700">Exibir eventos passados</span>
                </label>
              </div>
            </section>

            <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Resumo</p>
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Total de eventos</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{visibleEvents.length}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Eventos no dia</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{selectedDayEvents.length}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Data selecionada</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{getDayLabel(selectedDate)}</p>
                </div>
              </div>
            </section>
          </aside>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Eventos de {selectedDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}</p>
                <p className="text-xs text-slate-500">Lista de compromissos e status de presença.</p>
              </div>
              <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                {monthHasEvents ? 'Eventos no mês' : 'Nenhum evento no mês' }
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {selectedDayEvents.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                  Nenhum evento para esta data. Selecione outro dia no calendário.
                </div>
              ) : selectedDayEvents.map(event => {
                const status = STATUS_LABEL[event.status]
                return (
                  <article key={event.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${event.obrigatorio ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-700'}`}>
                            {event.obrigatorio ? 'Obrigatório' : 'Opcional'}
                          </span>
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${status.accent}`}>
                            {status.label}
                          </span>
                          {event.status !== 'desmarcado' && (
                            <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white">Na sua agenda</span>
                          )}
                        </div>
                        <h2 className="mt-3 text-lg font-semibold text-slate-900">{event.titulo}</h2>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{event.descricao}</p>
                      </div>
                      <div className="flex flex-col items-start gap-2 sm:items-end">
                        <p className="text-sm font-semibold text-slate-900">{getHourRange(event.dataInicio, event.dataFim)}</p>
                        <p className="text-xs text-slate-500">{event.publicoResumo}</p>
                        <Link href={`/comunicados/${event.comunicadoId}`} className="text-xs font-semibold text-slate-800 hover:text-slate-900">
                          Ver no comunicado →
                        </Link>
                      </div>
                    </div>

                    {event.status === 'desmarcado' && event.justificativa && (
                      <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                        <p className="font-semibold">Justificativa registrada</p>
                        <p className="mt-1">{event.justificativa}</p>
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      {(event.status === 'confirmado' || event.status === 'automatico') && (
                        <button type="button" onClick={() => handleOpenDesmarcar(event)} className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-rose-700 ring-1 ring-rose-200 transition hover:bg-rose-50">
                          Desmarcar presença
                        </button>
                      )}
                      <span className="text-xs text-slate-500">ID do evento: {event.id}</span>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>

          <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Painel rápido</p>
            <div className="mt-4 space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Próximo compromisso</p>
                <p className="mt-2 text-sm text-slate-600">{selectedDayEvents[0]?.titulo ?? 'Selecione um dia com evento no calendário.'}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Status de presença</p>
                <p className="mt-2 text-sm text-slate-600">{selectedDayEvents.length ? STATUS_LABEL[selectedDayEvents[0].status].label : 'Nenhum evento selecionado'}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Atalho</p>
                <p className="mt-2 text-sm text-slate-600">Use o botão “Ver no comunicado” para abrir o detalhe do comunicado.</p>
              </div>
            </div>
          </section>
        </div>
      </div>

      {modalEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-semibold text-slate-900">Desmarcar presença</h2>
            <p className="mt-2 text-sm text-slate-600">Para cancelar sua presença, informe uma justificativa com pelo menos 10 caracteres.</p>
            <label className="mt-5 block text-sm font-semibold text-slate-700">Justificativa</label>
            <textarea
              value={justificativa}
              onChange={e => { setJustificativa(e.target.value); if (justificativaError) setJustificativaError('') }}
              className="mt-2 h-32 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-900 outline-none focus:border-amber-500 focus:bg-white"
              placeholder="Digite sua justificativa..."
            />
            {justificativaError && <p className="mt-2 text-sm text-rose-600">{justificativaError}</p>}
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" onClick={() => setModalEvent(null)} className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                Cancelar
              </button>
              <button type="button" onClick={handleConfirmDesmarcar} className="inline-flex h-11 items-center justify-center rounded-2xl bg-rose-600 px-5 text-sm font-semibold text-white hover:bg-rose-700">
                Confirmar desmarcação
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
