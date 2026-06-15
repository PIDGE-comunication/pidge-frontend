'use client'

import { useState } from 'react'
import styles from './login.module.css'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [showSenha, setShowSenha] = useState(false)
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')

    if (!email || !senha) {
      setErro('Preencha e-mail e senha para continuar.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErro(data.message || 'E-mail ou senha incorretos. Tente novamente.')
        return
      }

      const papel: string = data.papel ?? data.user?.papel ?? 'aluno'
      const destino: Record<string, string> = {
        aluno: '/feed',
        gremio: '/meus-comunicados',
        admin: '/admin/comunicados',
        super_admin: '/admin/comunicados',
      }
      window.location.href = destino[papel] ?? '/feed'
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
            <h1 className={styles.formTitle}>Bem-vindo de volta</h1>
            <p className={styles.formSubtitle}>
              Entre com suas credenciais para acessar a plataforma.
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
              <label htmlFor="email" className={styles.fieldLabel}>E-mail</label>
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
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <div className={styles.labelRow}>
                <label htmlFor="senha" className={styles.fieldLabel}>Senha</label>
              </div>
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
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  autoComplete="current-password"
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

            <button
              type="submit"
              className={styles.btnSubmit}
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
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

export default function LoginPage() {
  return <LoginForm />
}
