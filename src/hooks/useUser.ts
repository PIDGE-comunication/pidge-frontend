'use client'
import { useState, useEffect } from 'react'

export interface User {
  id: string
  nome: string
  email: string
  papel: 'admin' | 'gremio' | 'aluno'
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
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, { credentials: 'include' })
      .then(r => (r.ok ? r.json() : null))
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  return { user, loading }
}
