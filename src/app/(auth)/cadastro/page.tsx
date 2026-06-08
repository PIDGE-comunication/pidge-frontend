'use client'

import { useState } from 'react'
import Link from 'next/link'
import styles from './cadastro.module.css'

interface FormState {
  nome: string
  email: string
  senha: string
  curso: string
  turma: string
}

const CURSOS = ['Desenvolvimento de Sistemas', 'Administração', 'Mecânica', 'Logística', 'Eletrotécnica', 'Eletrônica']

export default function CadastroPage() {
  const [form, setForm] = useState<FormState>({
    nome: '',
    email: '',
    senha: '',
    curso: '',
    turma: '',
  })
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSenha, setShowSenha] = useState(false)

  function handle(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')

    if (!form.nome || !form.email || !form.senha || !form.curso) {
      setErro('Preencha todos os campos obrigatórios para continuar.')
      return
    }
    if (form.senha.length < 8) {
      setErro('A senha deve ter pelo menos 8 caracteres.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, papel: 'aluno' }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErro(data.message || 'Erro ao criar conta. Tente novamente.')
        return
      }
      window.location.href = '/login?cadastro=sucesso'
    } catch {
      setErro('Não foi possível conectar ao servidor. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.root}>

      {/* ── Painel esquerdo ── */}
      <aside className={styles.leftPanel}>
        <div className={styles.leftTop}>
          <span className={styles.logoName}>PIDGE</span>
          <p className={styles.logoSub}>
            Plataforma Integrada de Divulgação<br />e Gestão Escolar
          </p>
        </div>

        <blockquote className={styles.quote}>
          &quot;Elevando a gestão educacional através de uma curadoria acadêmica moderna.&quot;
        </blockquote>

        <div className={styles.leftBottom}>
          <span className={styles.leftFooterLogo}>PIDGE</span>
        </div>
      </aside>

      {/* ── Painel direito ── */}
      <main className={styles.rightPanel}>
        <div className={styles.formWrapper}>
        <div className={styles.formArea}>
          <header className={styles.formHeader}>
            <h1 className={styles.formTitle}>Comece sua jornada</h1>
            <p className={styles.formSubtitle}>
              Crie sua conta de estudante para acessar a curadoria acadêmica.
            </p>
          </header>

          {erro && (
            <div className={styles.formError} role="alert">
              <span className={styles.errorIcon} aria-hidden="true">!</span>
              {erro}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className={styles.fieldGroup}>
              <label htmlFor="nome" className={styles.fieldLabel}>Nome Completo</label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon} aria-hidden="true">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <input
                  id="nome"
                  name="nome"
                  type="text"
                  className={styles.fieldInput}
                  placeholder="Ex: Ana Silva"
                  value={form.nome}
                  onChange={handle}
                  autoComplete="name"
                  required
                />
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="email" className={styles.fieldLabel}>E-mail Institucional</label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon} aria-hidden="true">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className={styles.fieldInput}
                  placeholder="nome@escola.com.br"
                  value={form.email}
                  onChange={handle}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="senha" className={styles.fieldLabel}>Senha</label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon} aria-hidden="true">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  id="senha"
                  name="senha"
                  type={showSenha ? 'text' : 'password'}
                  className={`${styles.fieldInput} ${styles.fieldInputPw}`}
                  placeholder="••••••••"
                  value={form.senha}
                  onChange={handle}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className={styles.togglePw}
                  onClick={() => setShowSenha(v => !v)}
                  aria-label={showSenha ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showSenha ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.fieldGroup}>
                <label htmlFor="curso" className={styles.fieldLabel}>Curso</label>
                <div className={styles.inputWrapper}>
                  <span className={styles.inputIcon} aria-hidden="true">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                    </svg>
                  </span>
                  <select
                    id="curso"
                    name="curso"
                    className={styles.fieldSelect}
                    value={form.curso}
                    onChange={handle}
                    required
                  >
                    <option value="">Selecionar</option>
                    {CURSOS.map(c => <option key={c}>{c}</option>)}
                  </select>
                  <span className={styles.selectArrow} aria-hidden="true">▾</span>
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="turma" className={styles.fieldLabel}>Turma</label>
                <div className={styles.inputWrapper}>
                  <span className={styles.inputIcon} aria-hidden="true">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </span>
                  <input
                    id="turma"
                    name="turma"
                    type="text"
                    className={styles.fieldInput}
                    placeholder="Ex: DS1M"
                    value={form.turma}
                    onChange={handle}
                    autoComplete="off"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className={styles.btnSubmit}
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? 'Criando conta…' : 'Criar Conta'}
            </button>
          </form>

          <p className={styles.alreadyAccount}>
            Já possui uma conta?{' '}
            <Link href="/login" className={styles.linkLogin}>Acessar Login</Link>
          </p>
        </div>
        </div>

        <footer className={styles.rightFooter}>
          {/* <nav aria-label="Links do rodapé">
            <Link href="/termos">Termos de Uso</Link>
            <Link href="/privacidade">Privacidade</Link>
          </nav> */}
          <p>© 2026 PIDGE Sistema Educacional de Comunicação</p>
        </footer>
      </main>
    </div>
  )
}