'use client'

import Link from 'next/link'
import { useUser } from '@/hooks/useUser'

const HOME_POR_PAPEL: Record<string, string> = {
  aluno: '/feed',
  gremio: '/meus-comunicados',
  admin: '/admin/comunicados',
  super_admin: '/admin/comunicados',
}

export default function NotFound() {
  const { user } = useUser()
  const home = (user && HOME_POR_PAPEL[user.papel]) || '/feed'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="bg-white rounded-2xl border border-gray-200 p-10 max-w-md text-center">
        <p className="text-5xl font-bold text-[#E8620A] mb-2">404</p>
        <h1 className="text-lg font-bold text-gray-900 mb-2">Página não encontrada</h1>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          O endereço que você tentou acessar não existe ou foi movido.
        </p>
        <Link
          href={home}
          className="inline-block h-10 px-5 rounded-lg bg-[#E8620A] text-white text-sm font-bold hover:bg-[#c4510a] transition-colors leading-10"
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  )
}
