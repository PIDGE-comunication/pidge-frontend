'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import styles from './feed.module.css'

type Prioridade = 'urgente' | 'alta' | 'media' | 'baixa'
type Status = 'publicado'

interface Comunicado {
  id: string
  titulo: string
  texto: string
  prioridade: Prioridade
  obrigatorio: boolean
  data_inicio: string
  data_fim: string
  imagem_url?: string | null
  autor: { nome: string; papel: 'admin' | 'gremio' }
  publico_resumido: string
  lido: boolean,
  curso?: string
}

type FiltroPrioridade = 'todas' | Prioridade
type FiltroTipo = 'todos' | 'obrigatorio' | 'opcional'

const PRIORIDADE_LABEL: Record<Prioridade, string> = {
  urgente: 'Urgente',
  alta: 'Alta',
  media: 'Média',
  baixa: 'Baixa',
}

const PRIORIDADE_CLASS: Record<Prioridade, string> = {
  urgente: styles.badgeUrgente,
  alta: styles.badgeAlta,
  media: styles.badgeMedia,
  baixa: styles.badgeBaixa,
}

export default function FeedPage() {
  const [comunicados, setComunicados] = useState<Comunicado[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [filtroPrio, setFiltroPrio] = useState<FiltroPrioridade>('todas')
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>('todos')
  const [filtroCurso, setFiltroCurso] = useState<string>('todos')
  const [somenteNaoLidos, setSomenteNaoLidos] = useState(false)
  const [nomeAluno, setNomeAluno] = useState('Aluno')

  const hora = new Date().getHours()
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'
  // const CURSOS = ['Desenvolvimento de Sistemas', 'Administração', 'Mecânica', 'Logística', 'Eletrotécnica', 'Eletrônica']
  

  useEffect(() => {
    async function fetchComunicados() {
      try {
        const token = localStorage.getItem('token')
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/comunicados`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error('Erro ao buscar comunicados')
        const data = await res.json()
        setComunicados(data.comunicados ?? data)
        setNomeAluno(data.aluno?.nome ?? nomeAluno)
      } catch {
        setErro('Não foi possível carregar os comunicados.')
      } finally {
        setLoading(false)
      }
    }
    fetchComunicados()
  }, [])

  const lista = comunicados.filter(c => {
    if (filtroPrio !== 'todas' && c.prioridade !== filtroPrio) return false
    if (filtroTipo === 'obrigatorio' && !c.obrigatorio) return false
    if (filtroTipo === 'opcional' && c.obrigatorio) return false
    if (somenteNaoLidos && c.lido) return false
    if (filtroCurso !== 'todos' && c.curso !== filtroCurso) return false
    return true
  })

  const naoLidos = comunicados.filter(c => !c.lido).length

  return (
    <div className={styles.root}>

      {/* ── Header ── */}
      <header className={styles.header}>
        <div>
          <p className={styles.headerGreeting}>{saudacao}</p>
          <div className={styles.headerName}>
            {nomeAluno}
            {naoLidos > 0 && (
              <span className={styles.unreadBadge} aria-label={`${naoLidos} não lidos`}>
                {naoLidos} não {naoLidos === 1 ? 'lido' : 'lidos'}
              </span>
            )}
          </div>
        </div>
        <Link href="/agenda" className={styles.agendaBtn}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>
          </svg>
          Minha agenda
        </Link>
      </header>

      {/* ── Barra de filtros ── */}
      <div className={styles.filtersBar} role="search" aria-label="Filtros do feed">
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Prioridade</span>
          <div className={styles.chips}>
            {(['todas', 'urgente', 'alta', 'media', 'baixa'] as FiltroPrioridade[]).map(val => (
              <button
                key={val}
                className={`${styles.chip} ${filtroPrio === val ? styles.chipActive : ''} ${val !== 'todas' ? styles[`chip_${val}`] : ''}`}
                onClick={() => setFiltroPrio(val)}
                aria-pressed={filtroPrio === val}
              >
                {val === 'urgente' && (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>
                  </svg>
                )}
                {val === 'todas' ? 'Todas' : PRIORIDADE_LABEL[val as Prioridade]}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.filterSep} aria-hidden="true" />

        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Tipo</span>
          <div className={styles.chips}>
            {(['todos', 'obrigatorio', 'opcional'] as FiltroTipo[]).map(val => (
              <button
                key={val}
                className={`${styles.chip} ${filtroTipo === val ? styles.chipActive : ''}`}
                onClick={() => setFiltroTipo(val)}
                aria-pressed={filtroTipo === val}
              >
                {{ todos: 'Todos', obrigatorio: 'Obrigatório', opcional: 'Opcional' }[val]}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.filterSep} aria-hidden="true" />

        {/* <div className={styles.filterGroup}>
        <span className={styles.filterLabel}>Curso</span>
        <div className={styles.chips}>
            {['todos', ...CURSOS].map(val => (
            <button
                key={val}
                className={`${styles.chip} ${filtroCurso === val ? styles.chipActive : ''}`}
                onClick={() => setFiltroCurso(val)}
                aria-pressed={filtroCurso === val}>
                {val === 'todos' ? 'Todos' : val}
            </button>
            ))}
        </div>
        </div> */}

        <div className={styles.filterSep} aria-hidden="true" />

        <button
          className={styles.toggleUnread}
          onClick={() => setSomenteNaoLidos(v => !v)}
          aria-pressed={somenteNaoLidos}
        >
          <div className={`${styles.toggleTrack} ${somenteNaoLidos ? styles.toggleOn : ''}`}>
            <div className={styles.toggleThumb} />
          </div>
          Só não lidos
        </button>
      </div>

      {/* ── Corpo ── */}
      <main className={styles.body}>
        {loading && (
          <div className={styles.empty}>
            <p>Carregando comunicados…</p>
          </div>
        )}

        {erro && (
          <div className={styles.errorBox} role="alert">{erro}</div>
        )}

        {!loading && !erro && lista.length === 0 && (
          <div className={styles.empty}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ marginBottom: 12, opacity: 0.25 }}>
              <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
            </svg>
            <p>Nenhum comunicado encontrado com esses filtros.</p>
          </div>
        )}

        {!loading && lista.map(c => (
          <Link key={c.id} href={`/comunicados/${c.id}`} className={`${styles.card} ${!c.lido ? styles.cardUnread : ''}`}>
            {!c.lido && <span className={styles.unreadDot} aria-label="Não lido" />}

            {c.imagem_url && (
              <img
                src={c.imagem_url}
                alt=""
                className={styles.cardThumb}
                aria-hidden="true"
              />
            )}

            <div className={styles.cardBody}>
              <div className={styles.cardTop}>
                <span className={`${styles.badge} ${PRIORIDADE_CLASS[c.prioridade]}`}>
                  {c.prioridade === 'urgente' && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                    </svg>
                  )}
                  {PRIORIDADE_LABEL[c.prioridade]}
                </span>
                {c.obrigatorio && (
                  <span className={`${styles.badge} ${styles.badgeObrig}`}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Obrigatório
                  </span>
                )}
                <span className={styles.publicoPill}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  {c.publico_resumido}
                </span>
              </div>

              <h2 className={styles.cardTitle}>{c.titulo}</h2>
              <p className={styles.cardExcerpt}>{c.texto}</p>

              <div className={styles.cardDivider} />

              <div className={styles.cardFooter}>
                <div className={styles.cardAuthor}>
                  <div className={styles.authorAvatar} aria-hidden="true">
                    {c.autor.nome.slice(0, 2).toUpperCase()}
                  </div>
                  <span className={styles.authorName}>{c.autor.nome}</span>
                  <span className={styles.authorRole}>
                    · {c.autor.papel === 'admin' ? 'Administração' : 'Grêmio'}
                  </span>
                </div>
                <div className={styles.cardDates}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>
                  </svg>
                  {new Date(c.data_inicio).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                  {' – '}
                  {new Date(c.data_fim).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </main>
    </div>
  )
}