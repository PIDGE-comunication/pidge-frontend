'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useUser } from '@/hooks/useUser'

type Papel = 'admin' | 'gremio' | 'aluno'
type Turno = 'manha' | 'tarde' | 'noite'

interface Usuario {
  id: string
  nome: string
  email: string
  papel: Papel
  curso?: string
  sala?: string
  turno?: Turno
  ativo: boolean
  data_criacao: string
}

const CURSOS = [
  'Desenvolvimento de Sistemas',
  'Administração',
  'Mecânica',
  'Logística',
  'Eletrotécnica',
  'Eletrônica',
]

const TURNO_LABEL: Record<Turno, string> = {
  manha: 'Manhã',
  tarde: 'Tarde',
  noite: 'Noite',
}

const PAPEL_LABEL: Record<Papel, string> = {
  admin: 'Administração',
  gremio: 'Grêmio',
  aluno: 'Aluno',
}

const PAPEL_CLS: Record<Papel, string> = {
  admin: 'bg-purple-100 text-purple-700',
  gremio: 'bg-blue-100 text-blue-700',
  aluno: 'bg-gray-100 text-gray-700',
}

const MOCK_USERS: Usuario[] = [
  {
    id: 'u1',
    nome: 'Carla Mendes',
    email: 'carla.mendes@escola.edu.br',
    papel: 'admin',
    ativo: true,
    data_criacao: '2025-02-14T09:30',
  },
  {
    id: 'u2',
    nome: 'Mariana Souza',
    email: 'mariana.souza@aluno.escola.edu.br',
    papel: 'gremio',
    curso: 'Desenvolvimento de Sistemas',
    sala: 'DS3',
    turno: 'manha',
    ativo: true,
    data_criacao: '2025-03-04T14:10',
  },
  {
    id: 'u3',
    nome: 'Rafael Lima',
    email: 'rafael.lima@aluno.escola.edu.br',
    papel: 'gremio',
    curso: 'Administração',
    sala: 'ADM2',
    turno: 'tarde',
    ativo: true,
    data_criacao: '2025-03-04T14:12',
  },
  {
    id: 'u4',
    nome: 'João Pedro Alves',
    email: 'joao.alves@aluno.escola.edu.br',
    papel: 'aluno',
    curso: 'Desenvolvimento de Sistemas',
    sala: 'DS1',
    turno: 'manha',
    ativo: true,
    data_criacao: '2026-02-01T08:00',
  },
  {
    id: 'u5',
    nome: 'Beatriz Carvalho',
    email: 'beatriz.carvalho@aluno.escola.edu.br',
    papel: 'aluno',
    curso: 'Eletrônica',
    sala: 'ELT2',
    turno: 'noite',
    ativo: true,
    data_criacao: '2026-02-01T08:00',
  },
  {
    id: 'u6',
    nome: 'Thiago Oliveira',
    email: 'thiago.oliveira@aluno.escola.edu.br',
    papel: 'aluno',
    curso: 'Mecânica',
    sala: 'MEC3',
    turno: 'tarde',
    ativo: false,
    data_criacao: '2024-08-12T10:45',
  },
  {
    id: 'u7',
    nome: 'Letícia Ramos',
    email: 'leticia.ramos@aluno.escola.edu.br',
    papel: 'aluno',
    curso: 'Logística',
    sala: 'LOG1',
    turno: 'manha',
    ativo: true,
    data_criacao: '2026-02-03T11:20',
  },
  {
    id: 'u8',
    nome: 'Eduardo Pereira',
    email: 'eduardo.pereira@escola.edu.br',
    papel: 'admin',
    ativo: true,
    data_criacao: '2024-11-22T16:00',
  },
]

function fmtData(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function emailValido(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim())
}

interface FormState {
  nome: string
  email: string
  papel: Papel
  curso: string
  sala: string
  turno: Turno | ''
  ativo: boolean
}

const FORM_VAZIO: FormState = {
  nome: '',
  email: '',
  papel: 'aluno',
  curso: '',
  sala: '',
  turno: '',
  ativo: true,
}

export default function UsuariosPage() {
  const { user, loading } = useUser()

  const [usuarios, setUsuarios] = useState<Usuario[]>(MOCK_USERS)
  const [busca, setBusca] = useState('')
  const [filtroPapel, setFiltroPapel] = useState<Papel | 'todos'>('todos')
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'ativo' | 'inativo'>('todos')

  const [modalAberto, setModalAberto] = useState<'novo' | 'editar' | null>(null)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(FORM_VAZIO)
  const [erros, setErros] = useState<Partial<Record<keyof FormState, string>>>({})

  const [confirmDesativar, setConfirmDesativar] = useState<string | null>(null)
  const [confirmResetSenha, setConfirmResetSenha] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const lista = useMemo(() => {
    return usuarios
      .filter(u => {
        if (filtroPapel !== 'todos' && u.papel !== filtroPapel) return false
        if (filtroStatus === 'ativo' && !u.ativo) return false
        if (filtroStatus === 'inativo' && u.ativo) return false
        if (busca) {
          const q = busca.toLowerCase()
          if (
            !u.nome.toLowerCase().includes(q) &&
            !u.email.toLowerCase().includes(q) &&
            !(u.curso?.toLowerCase().includes(q)) &&
            !(u.sala?.toLowerCase().includes(q))
          ) {
            return false
          }
        }
        return true
      })
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  }, [usuarios, busca, filtroPapel, filtroStatus])

  function dispararToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 4000)
  }

  function abrirNovo() {
    setForm(FORM_VAZIO)
    setErros({})
    setEditandoId(null)
    setModalAberto('novo')
  }

  function abrirEditar(u: Usuario) {
    setForm({
      nome: u.nome,
      email: u.email,
      papel: u.papel,
      curso: u.curso ?? '',
      sala: u.sala ?? '',
      turno: u.turno ?? '',
      ativo: u.ativo,
    })
    setErros({})
    setEditandoId(u.id)
    setModalAberto('editar')
  }

  function fecharModal() {
    setModalAberto(null)
    setEditandoId(null)
    setErros({})
  }

  function validar(): boolean {
    const e: Partial<Record<keyof FormState, string>> = {}
    if (!form.nome.trim()) e.nome = 'Informe o nome.'
    if (!form.email.trim()) e.email = 'Informe o email.'
    else if (!emailValido(form.email)) e.email = 'Email inválido.'
    else {
      const duplicado = usuarios.some(
        u =>
          u.email.toLowerCase() === form.email.trim().toLowerCase() &&
          u.id !== editandoId
      )
      if (duplicado) e.email = 'Já existe um usuário com este email.'
    }
    if (form.papel === 'aluno') {
      if (!form.curso) e.curso = 'Selecione o curso.'
      if (!form.sala.trim()) e.sala = 'Informe a sala.'
      if (!form.turno) e.turno = 'Selecione o turno.'
    }
    setErros(e)
    return Object.keys(e).length === 0
  }

  function salvar() {
    if (!validar()) return

    const base = {
      nome: form.nome.trim(),
      email: form.email.trim().toLowerCase(),
      papel: form.papel,
      ativo: form.ativo,
      ...(form.papel === 'aluno'
        ? {
            curso: form.curso,
            sala: form.sala.trim().toUpperCase(),
            turno: form.turno as Turno,
          }
        : { curso: undefined, sala: undefined, turno: undefined }),
    }

    if (modalAberto === 'editar' && editandoId) {
      setUsuarios(prev =>
        prev.map(u => (u.id === editandoId ? { ...u, ...base } : u))
      )
      dispararToast(`Usuário "${base.nome}" atualizado.`)
    } else {
      const novo: Usuario = {
        id: `u-${Date.now()}`,
        data_criacao: new Date().toISOString(),
        ...base,
      }
      setUsuarios(prev => [novo, ...prev])
      dispararToast(`Usuário "${base.nome}" criado.`)
    }

    fecharModal()
  }

  function alternarAtivo(id: string) {
    const u = usuarios.find(x => x.id === id)
    setUsuarios(prev =>
      prev.map(x => (x.id === id ? { ...x, ativo: !x.ativo } : x))
    )
    dispararToast(
      u?.ativo ? `"${u.nome}" desativado.` : `"${u?.nome}" reativado.`
    )
    setConfirmDesativar(null)
  }

  function resetarSenha(id: string) {
    const u = usuarios.find(x => x.id === id)
    setConfirmResetSenha(null)
    dispararToast(`Email de redefinição enviado para ${u?.email}.`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400 text-sm animate-pulse">Carregando...</p>
      </div>
    )
  }

  const ehAdmin = !user || user.papel === 'admin'
  if (!ehAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md text-center">
          <p className="text-3xl mb-3" aria-hidden="true">⊘</p>
          <h1 className="text-lg font-bold text-gray-900 mb-2">Acesso restrito</h1>
          <p className="text-sm text-gray-500 mb-5">
            A gestão de usuários é exclusiva da administração.
          </p>
          <Link
            href="/meus-comunicados"
            className="inline-block h-10 px-5 rounded-lg bg-[#E8620A] text-white text-sm font-bold hover:bg-[#c4510a] transition-colors leading-10"
          >
            Voltar
          </Link>
        </div>
      </div>
    )
  }

  const usuarioEmEdicao = editandoId
    ? usuarios.find(u => u.id === editandoId)
    : null

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex flex-wrap items-center gap-4 sticky top-0 z-20">
        <Link
          href="/meus-comunicados"
          className="text-gray-400 hover:text-gray-700 transition-colors text-sm font-medium"
        >
          ← Meus comunicados
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-gray-900">Gestão de usuários</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {usuarios.length} {usuarios.length === 1 ? 'usuário' : 'usuários'} cadastrados ·{' '}
            {usuarios.filter(u => u.ativo).length} ativos
          </p>
        </div>
        <span className="hidden sm:block shrink-0 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Administração
        </span>
        <button
          onClick={abrirNovo}
          className="shrink-0 h-9 px-4 rounded-lg bg-[#E8620A] text-white text-sm font-bold hover:bg-[#c4510a] transition-colors flex items-center gap-1.5"
        >
          <span aria-hidden="true">+</span> Novo usuário
        </button>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col gap-4">

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
              placeholder="Nome, email, curso ou sala…"
              className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-300 outline-none focus:border-[#E8620A] focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
              Papel
            </label>
            <select
              value={filtroPapel}
              onChange={e => setFiltroPapel(e.target.value as Papel | 'todos')}
              className="h-9 px-3 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-700 outline-none focus:border-[#E8620A] transition-colors cursor-pointer"
            >
              <option value="todos">Todos</option>
              <option value="admin">Administração</option>
              <option value="gremio">Grêmio</option>
              <option value="aluno">Aluno</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
              Status
            </label>
            <select
              value={filtroStatus}
              onChange={e =>
                setFiltroStatus(e.target.value as 'todos' | 'ativo' | 'inativo')
              }
              className="h-9 px-3 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-700 outline-none focus:border-[#E8620A] transition-colors cursor-pointer"
            >
              <option value="todos">Todos</option>
              <option value="ativo">Ativos</option>
              <option value="inativo">Inativos</option>
            </select>
          </div>

          {(busca || filtroPapel !== 'todos' || filtroStatus !== 'todos') && (
            <button
              onClick={() => {
                setBusca('')
                setFiltroPapel('todos')
                setFiltroStatus('todos')
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
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2" />
              </svg>
              <p className="text-sm">Nenhum usuário encontrado.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[720px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      Nome
                    </th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      Papel
                    </th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 hidden md:table-cell">
                      Curso · sala · turno
                    </th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 hidden lg:table-cell">
                      Criado em
                    </th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 text-right">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lista.map(u => (
                    <tr
                      key={u.id}
                      className={`border-b border-gray-50 hover:bg-gray-50/70 transition-colors ${
                        !u.ativo ? 'opacity-60' : ''
                      }`}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
                            {u.nome
                              .split(' ')
                              .map(s => s[0])
                              .slice(0, 2)
                              .join('')
                              .toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 leading-tight truncate">
                              {u.nome}
                            </p>
                            <p className="text-xs text-gray-400 truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${PAPEL_CLS[u.papel]}`}
                        >
                          {PAPEL_LABEL[u.papel]}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        {u.papel === 'aluno' && u.curso ? (
                          <div className="text-xs text-gray-700 leading-snug">
                            <p className="font-medium">{u.curso}</p>
                            <p className="text-gray-400">
                              {u.sala} · {u.turno ? TURNO_LABEL[u.turno] : '—'}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            u.ativo
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.ativo ? 'bg-green-500' : 'bg-gray-400'
                            }`}
                            aria-hidden="true"
                          />
                          {u.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <span className="text-xs text-gray-600 tabular-nums whitespace-nowrap">
                          {fmtData(u.data_criacao)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 justify-end">
                          <button
                            onClick={() => abrirEditar(u)}
                            className="h-8 px-3 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:border-[#E8620A] hover:text-[#E8620A] transition-colors whitespace-nowrap"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => setConfirmResetSenha(u.id)}
                            className="h-8 px-3 rounded-lg border border-gray-200 text-xs font-semibold text-gray-500 hover:border-blue-300 hover:text-blue-600 transition-colors whitespace-nowrap"
                            title="Enviar email de redefinição de senha"
                          >
                            Resetar senha
                          </button>
                          <button
                            onClick={() => setConfirmDesativar(u.id)}
                            className={`h-8 px-3 rounded-lg border text-xs font-semibold transition-colors whitespace-nowrap ${
                              u.ativo
                                ? 'border-gray-200 text-gray-400 hover:border-red-200 hover:text-red-500'
                                : 'border-green-200 text-green-600 hover:bg-green-50'
                            }`}
                          >
                            {u.ativo ? 'Desativar' : 'Reativar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {lista.length > 0 && (
          <p className="text-xs text-gray-400 text-right pr-1">
            {lista.length} {lista.length === 1 ? 'usuário' : 'usuários'} exibidos
          </p>
        )}
      </div>

      {/* Modal formulário */}
      {modalAberto && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={e => e.target === e.currentTarget && fecharModal()}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
              <h3 className="text-base font-bold text-gray-900">
                {modalAberto === 'novo'
                  ? 'Novo usuário'
                  : `Editar — ${usuarioEmEdicao?.nome ?? ''}`}
              </h3>
              <button
                onClick={fecharModal}
                aria-label="Fechar"
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors text-sm"
              >
                ✕
              </button>
            </div>

            <div className="px-6 py-5 flex flex-col gap-4">
              {/* Nome */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                  Nome completo
                </label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                  className={`w-full h-10 px-3 rounded-lg border bg-gray-50 text-sm text-gray-900 outline-none focus:bg-white transition-colors ${
                    erros.nome
                      ? 'border-red-300 focus:border-red-500'
                      : 'border-gray-200 focus:border-[#E8620A]'
                  }`}
                  placeholder="Ex.: Maria da Silva"
                />
                {erros.nome && <p className="text-xs text-red-500 mt-1">{erros.nome}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                  Email institucional
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className={`w-full h-10 px-3 rounded-lg border bg-gray-50 text-sm text-gray-900 outline-none focus:bg-white transition-colors ${
                    erros.email
                      ? 'border-red-300 focus:border-red-500'
                      : 'border-gray-200 focus:border-[#E8620A]'
                  }`}
                  placeholder="usuario@escola.edu.br"
                  autoComplete="off"
                />
                {erros.email && <p className="text-xs text-red-500 mt-1">{erros.email}</p>}
              </div>

              {/* Papel */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                  Papel
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['admin', 'gremio', 'aluno'] as Papel[]).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, papel: p }))}
                      className={`h-10 rounded-lg border text-xs font-bold transition-colors ${
                        form.papel === p
                          ? 'border-[#E8620A] bg-orange-50 text-[#c4510a]'
                          : 'border-gray-200 text-gray-500 hover:border-gray-400'
                      }`}
                    >
                      {PAPEL_LABEL[p]}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                  {form.papel === 'admin' &&
                    'Acesso total: gestão de usuários, aprovação de comunicados e configurações.'}
                  {form.papel === 'gremio' &&
                    'Pode criar comunicados que serão revisados pela administração antes de publicar.'}
                  {form.papel === 'aluno' &&
                    'Recebe comunicados no feed conforme curso, sala e turno.'}
                </p>
              </div>

              {/* Campos de aluno */}
              {form.papel === 'aluno' && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col gap-3.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    Perfil escolar
                  </p>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      Curso
                    </label>
                    <select
                      value={form.curso}
                      onChange={e => setForm(f => ({ ...f, curso: e.target.value }))}
                      className={`w-full h-10 px-3 rounded-lg border bg-white text-sm text-gray-700 outline-none cursor-pointer transition-colors ${
                        erros.curso
                          ? 'border-red-300 focus:border-red-500'
                          : 'border-gray-200 focus:border-[#E8620A]'
                      }`}
                    >
                      <option value="">Selecione o curso…</option>
                      {CURSOS.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    {erros.curso && <p className="text-xs text-red-500 mt-1">{erros.curso}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                        Sala
                      </label>
                      <input
                        type="text"
                        value={form.sala}
                        onChange={e => setForm(f => ({ ...f, sala: e.target.value }))}
                        placeholder="Ex.: DS2"
                        className={`w-full h-10 px-3 rounded-lg border bg-white text-sm text-gray-900 outline-none transition-colors uppercase ${
                          erros.sala
                            ? 'border-red-300 focus:border-red-500'
                            : 'border-gray-200 focus:border-[#E8620A]'
                        }`}
                      />
                      {erros.sala && <p className="text-xs text-red-500 mt-1">{erros.sala}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                        Turno
                      </label>
                      <select
                        value={form.turno}
                        onChange={e =>
                          setForm(f => ({ ...f, turno: e.target.value as Turno | '' }))
                        }
                        className={`w-full h-10 px-3 rounded-lg border bg-white text-sm text-gray-700 outline-none cursor-pointer transition-colors ${
                          erros.turno
                            ? 'border-red-300 focus:border-red-500'
                            : 'border-gray-200 focus:border-[#E8620A]'
                        }`}
                      >
                        <option value="">Selecione…</option>
                        <option value="manha">Manhã</option>
                        <option value="tarde">Tarde</option>
                        <option value="noite">Noite</option>
                      </select>
                      {erros.turno && <p className="text-xs text-red-500 mt-1">{erros.turno}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* Ativar/desativar conta */}
              <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Conta ativa</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {form.ativo
                      ? 'O usuário pode entrar e usar o sistema normalmente.'
                      : 'O usuário não consegue entrar enquanto a conta estiver inativa.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, ativo: !f.ativo }))}
                  role="switch"
                  aria-checked={form.ativo}
                  className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
                    form.ativo ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      form.ativo ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 sticky bottom-0 bg-white rounded-b-2xl">
              <button
                onClick={fecharModal}
                className="flex-1 h-10 rounded-lg border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:border-gray-400 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={salvar}
                className="flex-1 h-10 rounded-lg bg-[#E8620A] text-sm font-bold text-white hover:bg-[#c4510a] transition-colors"
              >
                {modalAberto === 'novo' ? 'Criar usuário' : 'Salvar alterações'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm desativar/reativar */}
      {confirmDesativar && (() => {
        const u = usuarios.find(x => x.id === confirmDesativar)
        if (!u) return null
        return (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
              <h3 className="text-base font-bold text-gray-900 mb-2">
                {u.ativo ? 'Desativar usuário?' : 'Reativar usuário?'}
              </h3>
              <p className="text-sm text-gray-500 mb-5 leading-relaxed">
                {u.ativo
                  ? `${u.nome} não conseguirá entrar no sistema até ser reativado. Os comunicados antigos não são removidos.`
                  : `${u.nome} voltará a ter acesso ao sistema com o mesmo papel atribuído.`}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDesativar(null)}
                  className="flex-1 h-10 rounded-lg border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:border-gray-400 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => alternarAtivo(u.id)}
                  className={`flex-1 h-10 rounded-lg text-sm font-bold text-white transition-colors ${
                    u.ativo ? 'bg-red-500 hover:bg-red-600' : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {u.ativo ? 'Desativar' : 'Reativar'}
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Confirm reset senha */}
      {confirmResetSenha && (() => {
        const u = usuarios.find(x => x.id === confirmResetSenha)
        if (!u) return null
        return (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
              <h3 className="text-base font-bold text-gray-900 mb-2">Resetar senha?</h3>
              <p className="text-sm text-gray-500 mb-5 leading-relaxed">
                Será enviado um email de redefinição para <strong>{u.email}</strong>. O usuário
                precisa clicar no link em até 24h para definir uma nova senha.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmResetSenha(null)}
                  className="flex-1 h-10 rounded-lg border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:border-gray-400 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => resetarSenha(u.id)}
                  className="flex-1 h-10 rounded-lg bg-blue-600 text-sm font-bold text-white hover:bg-blue-700 transition-colors"
                >
                  Enviar email
                </button>
              </div>
            </div>
          </div>
        )
      })()}

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
