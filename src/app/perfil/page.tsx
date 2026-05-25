'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@/hooks/useUser'

interface PerfilData {
  id: string
  nome: string
  email: string
  papel: 'admin' | 'gremio' | 'aluno'
  curso?: string
  sala?: string
  turno?: 'manha' | 'tarde' | 'noite'
}

const PAPEL_LABEL: Record<string, string> = {
  admin: 'Administrador',
  gremio: 'Grêmio Estudantil',
  aluno: 'Aluno',
}

const TURNO_LABEL: Record<string, string> = {
  manha: 'Manhã',
  tarde: 'Tarde',
  noite: 'Noite',
}

function getInitials(nome: string): string {
  return nome
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase()
}

export default function PerfilPage() {
  const { user, loading: userLoading } = useUser()

  const [perfil, setPerfil] = useState<PerfilData | null>(null)
  const [loadingPerfil, setLoadingPerfil] = useState(true)

  const [senhaAtual, setSenhaAtual] = useState('')
  const [senhaNova, setSenhaNova] = useState('')
  const [senhaConfirm, setSenhaConfirm] = useState('')
  const [showSenhaAtual, setShowSenhaAtual] = useState(false)
  const [showSenhaNova, setShowSenhaNova] = useState(false)
  const [showSenhaConfirm, setShowSenhaConfirm] = useState(false)
  const [senhaErro, setSenhaErro] = useState('')
  const [senhaSucesso, setSenhaSucesso] = useState('')
  const [salvandoSenha, setSalvandoSenha] = useState(false)

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, { credentials: 'include' })
      .then(r => (r.ok ? r.json() : null))
      .then(setPerfil)
      .catch(() => setPerfil(null))
      .finally(() => setLoadingPerfil(false))
  }, [])

  async function handleAlterarSenha(e: React.FormEvent) {
    e.preventDefault()
    setSenhaErro('')
    setSenhaSucesso('')

    if (!senhaAtual) {
      setSenhaErro('Informe a senha atual.')
      return
    }
    if (senhaNova.length < 6) {
      setSenhaErro('A nova senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (senhaNova !== senhaConfirm) {
      setSenhaErro('As senhas não coincidem.')
      return
    }

    setSalvandoSenha(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/alterar-senha`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ senha_atual: senhaAtual, senha_nova: senhaNova }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSenhaErro(data.message ?? 'Erro ao alterar a senha. Tente novamente.')
        return
      }
      setSenhaSucesso('Senha alterada com sucesso!')
      setSenhaAtual('')
      setSenhaNova('')
      setSenhaConfirm('')
    } catch {
      setSenhaErro('Não foi possível conectar ao servidor.')
    } finally {
      setSalvandoSenha(false)
    }
  }

  async function handleLogout() {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      })
    } catch { /* segue para o login independente */ }
    window.location.href = '/login'
  }

  const dados: PerfilData | null = perfil ?? (user ? { ...user } : null)

  if (userLoading || loadingPerfil) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400 text-sm animate-pulse">Carregando...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-red-500 text-sm">Acesso não autorizado.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3 sticky top-0 z-20">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-all"
          aria-label="Voltar"
        >
          ←
        </button>
        <h1 className="flex-1 text-lg font-bold text-gray-900">Meu perfil</h1>
        <span className="shrink-0 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:block">
          {PAPEL_LABEL[user.papel] ?? user.papel}
        </span>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-5">

        {/* ── Dados pessoais ── */}
        <section className="bg-white rounded-xl border border-gray-200 p-6">

          <div className="flex items-center gap-5 mb-6 pb-6 border-b border-gray-100">
            <div
              className="w-16 h-16 rounded-2xl bg-[#E8620A] flex items-center justify-center text-white font-bold text-xl shrink-0 select-none"
              aria-hidden="true"
            >
              {dados ? getInitials(dados.nome) : '?'}
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 leading-tight">{dados?.nome}</p>
              <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full bg-[#E8620A]/10 text-[#c4510a] text-xs font-semibold">
                {PAPEL_LABEL[dados?.papel ?? ''] ?? dados?.papel}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Nome completo" value={dados?.nome} />
            <Field label="E-mail" value={dados?.email} />
            <Field label="Papel no sistema" value={PAPEL_LABEL[dados?.papel ?? ''] ?? dados?.papel} />

            {dados?.papel === 'aluno' && (
              <>
                {dados.curso && <Field label="Curso" value={dados.curso} />}
                {dados.sala  && <Field label="Sala"  value={dados.sala} />}
                {dados.turno && <Field label="Turno" value={TURNO_LABEL[dados.turno] ?? dados.turno} />}
              </>
            )}
          </div>
        </section>

        {/* ── Alterar senha ── */}
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-5">
            Alterar senha
          </h2>

          {senhaSucesso && (
            <div
              className="flex items-center gap-2.5 bg-green-50 border border-green-300 rounded-lg px-4 py-3 mb-4 text-sm text-green-700"
              role="status"
            >
              <span
                className="w-5 h-5 rounded-full bg-green-500 text-white text-[11px] font-bold shrink-0 flex items-center justify-center"
                aria-hidden="true"
              >✓</span>
              {senhaSucesso}
            </div>
          )}

          {senhaErro && (
            <div
              className="flex items-center gap-2.5 bg-[#fff0eb] border border-[#E8620A] rounded-lg px-4 py-3 mb-4 text-sm text-[#c4510a]"
              role="alert"
            >
              <span
                className="w-5 h-5 rounded-full bg-[#E8620A] text-white text-[11px] font-bold shrink-0 flex items-center justify-center"
                aria-hidden="true"
              >!</span>
              {senhaErro}
            </div>
          )}

          <form onSubmit={handleAlterarSenha} noValidate className="flex flex-col gap-4">
            <SenhaField
              id="senhaAtual"
              label="Senha atual"
              value={senhaAtual}
              onChange={setSenhaAtual}
              show={showSenhaAtual}
              onToggle={() => setShowSenhaAtual(v => !v)}
              placeholder="••••••••"
              autoComplete="current-password"
            />

            <SenhaField
              id="senhaNova"
              label="Nova senha"
              value={senhaNova}
              onChange={setSenhaNova}
              show={showSenhaNova}
              onToggle={() => setShowSenhaNova(v => !v)}
              placeholder="Mín. 6 caracteres"
              autoComplete="new-password"
            />

            <SenhaField
              id="senhaConfirm"
              label="Confirmar nova senha"
              value={senhaConfirm}
              onChange={setSenhaConfirm}
              show={showSenhaConfirm}
              onToggle={() => setShowSenhaConfirm(v => !v)}
              placeholder="Repita a nova senha"
              autoComplete="new-password"
            />

            <button
              type="submit"
              disabled={salvandoSenha}
              className="h-11 rounded-lg bg-[#E8620A] text-white text-sm font-bold hover:bg-[#c4510a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {salvandoSenha ? 'Salvando...' : 'Alterar senha →'}
            </button>
          </form>
        </section>

        {/* ── Sessão / Logout ── */}
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Sessão</h2>
          <p className="text-sm text-gray-500 mb-5 leading-relaxed">
            Encerre sua sessão neste dispositivo. Você precisará fazer login novamente para acessar a plataforma.
          </p>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full h-11 rounded-lg border-2 border-red-200 text-red-500 text-sm font-semibold hover:border-red-400 hover:bg-red-50 transition-all"
          >
            Sair da conta →
          </button>
        </section>

      </div>
    </div>
  )
}

/* ── Sub-components ── */

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</span>
      <span className="text-sm text-gray-800">{value ?? '—'}</span>
    </div>
  )
}

interface SenhaFieldProps {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  show: boolean
  onToggle: () => void
  placeholder: string
  autoComplete: string
}

function SenhaField({ id, label, value, onChange, show, onToggle, placeholder, autoComplete }: SenhaFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full h-11 px-3 pr-20 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-300 outline-none focus:border-[#E8620A] focus:bg-white transition-colors"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-wider text-gray-400 hover:text-[#E8620A] transition-colors"
        >
          {show ? 'Ocultar' : 'Mostrar'}
        </button>
      </div>
    </div>
  )
}
