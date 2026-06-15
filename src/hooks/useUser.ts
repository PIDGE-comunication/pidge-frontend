'use client'
import { useState, useEffect } from 'react'

export interface User {
  id: string
  nome: string
  email: string
  papel: 'super_admin' | 'admin' | 'gremio' | 'aluno'
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const devPapel = process.env.NEXT_PUBLIC_DEV_PAPEL as User['papel'] | undefined
    if (devPapel) {
      setUser({ id: 'dev', nome: 'Dev User', email: 'dev@escola.edu.br', papel: devPapel })
      setLoading(false)
      return
    }
    const devFallback: User = { id: 'dev', nome: 'Dev User', email: 'dev@escola.edu.br', papel: 'admin' }
    const isDev = process.env.NODE_ENV === 'development'
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, { credentials: 'include' })
      .then(r => (r.ok ? r.json() : null))
      .then(data => setUser(data ?? (isDev ? devFallback : null)))
      .catch(() => setUser(isDev ? devFallback : null))
      .finally(() => setLoading(false))
  }, [])

  return { user, loading }
}
