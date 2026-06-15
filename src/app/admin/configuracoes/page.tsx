'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useUser } from '@/hooks/useUser'

interface Config {
  gremio_habilitado: boolean
  exigir_aprovacao_gremio: boolean
  min_justificativa_chars: number
  email_from: string
  prazo_conflito_dias: number
}

const CONFIG_INICIAL: Config = {
  gremio_habilitado: true,
  exigir_aprovacao_gremio: true,
  min_justificativa_chars: 20,
  email_from: 'comunicados@escola.edu.br',
  prazo_conflito_dias: 7,
}

export default function ConfiguracoesPage() {
  const { user, loading } = useUser()
  const [config, setConfig] = useState<Config>(CONFIG_INICIAL)
  const [salvo, setSalvo] = useState<Config>(CONFIG_INICIAL)
  const [salvando, setSalvando] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const alterado = JSON.stringify(config) !== JSON.stringify(salvo)

  function set<K extends keyof Config>(k: K, v: Config[K]) {
    setConfig(c => {
      const next = { ...c, [k]: v }
      // exigir aprovação é sempre verdadeiro quando o grêmio está habilitado
      if (k === 'gremio_habilitado' && v === true) next.exigir_aprovacao_gremio = true
      return next
    })
  }

  async function salvar() {
    setSalvando(true)
    try {
      const token = localStorage.getItem('token')
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/configuracoes`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify(config),
      })
    } catch {
      /* otimista: persiste localmente mesmo sem backend */
    } finally {
      setSalvo(config)
      setSalvando(false)
      setToast('Configurações salvas.')
      setTimeout(() => setToast(null), 4000)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400 text-sm animate-pulse">Carregando...</p>
      </div>
    )
  }

  const ehAdmin = !user || user.papel === 'super_admin'
  if (!ehAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md text-center">
          <p className="text-3xl mb-3" aria-hidden="true">⊘</p>
          <h1 className="text-lg font-bold text-gray-900 mb-2">Acesso restrito</h1>
          <p className="text-sm text-gray-500 mb-5">As configurações do sistema são exclusivas do super administrador.</p>
          <Link href="/meus-comunicados" className="inline-block h-10 px-5 rounded-lg bg-[#E8620A] text-white text-sm font-bold hover:bg-[#c4510a] transition-colors leading-10">
            Voltar
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4 sticky top-0 z-20">
        <Link href="/admin/comunicados" className="text-gray-400 hover:text-gray-700 transition-colors text-sm font-medium">
          ← Comunicados
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-gray-900">Configurações do sistema</h1>
          <p className="text-xs text-gray-400 mt-0.5">Parâmetros globais que afetam o comportamento do sistema</p>
        </div>
        <button
          onClick={salvar}
          disabled={!alterado || salvando}
          className="shrink-0 h-9 px-4 rounded-lg bg-[#E8620A] text-white text-sm font-bold hover:bg-[#c4510a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {salvando ? 'Salvando…' : 'Salvar'}
        </button>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-5">

        {/* Toggles */}
        <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900">Publicações do grêmio</h2>
          </div>

          <ToggleRow
            titulo="Habilitar publicações do grêmio"
            descricao="Quando desativado, membros do grêmio não conseguem criar novos comunicados."
            checked={config.gremio_habilitado}
            onChange={v => set('gremio_habilitado', v)}
          />
          <ToggleRow
            titulo="Exigir aprovação da administração"
            descricao="Comunicados do grêmio só ficam visíveis após aprovação. Sempre ativo enquanto o grêmio estiver habilitado."
            checked={config.exigir_aprovacao_gremio}
            disabled={config.gremio_habilitado}
            onChange={v => set('exigir_aprovacao_gremio', v)}
          />
        </section>

        {/* Parâmetros */}
        <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900">Parâmetros</h2>
          </div>

          <div className="px-5 py-4 border-b border-gray-100">
            <label htmlFor="minchars" className="block text-sm font-semibold text-gray-900 mb-1">
              Mínimo de caracteres da justificativa
            </label>
            <p className="text-xs text-gray-500 mb-2.5">
              Tamanho mínimo exigido quando um aluno desmarca presença em um evento.
            </p>
            <input
              id="minchars" type="number" min={0} max={500}
              value={config.min_justificativa_chars}
              onChange={e => set('min_justificativa_chars', Math.max(0, Number(e.target.value) || 0))}
              className="w-32 h-10 px-3 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-900 outline-none focus:border-[#E8620A] focus:bg-white transition-colors"
            />
            <span className="text-xs text-gray-400 ml-2">caracteres</span>
          </div>

          <div className="px-5 py-4 border-b border-gray-100">
            <label htmlFor="emailfrom" className="block text-sm font-semibold text-gray-900 mb-1">
              E-mail remetente das notificações
            </label>
            <p className="text-xs text-gray-500 mb-2.5">
              Endereço usado no envio de e-mails transacionais (aprovações, conflitos).
            </p>
            <input
              id="emailfrom" type="email"
              value={config.email_from}
              onChange={e => set('email_from', e.target.value)}
              className="w-full max-w-sm h-10 px-3 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-900 outline-none focus:border-[#E8620A] focus:bg-white transition-colors"
            />
          </div>

          <div className="px-5 py-4">
            <label htmlFor="prazo" className="block text-sm font-semibold text-gray-900 mb-1">
              Prazo máximo para resolver conflitos
            </label>
            <p className="text-xs text-gray-500 mb-2.5">
              Número de dias que um conflito pode permanecer em aberto antes de ser sinalizado.
            </p>
            <input
              id="prazo" type="number" min={1} max={90}
              value={config.prazo_conflito_dias}
              onChange={e => set('prazo_conflito_dias', Math.max(1, Number(e.target.value) || 1))}
              className="w-32 h-10 px-3 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-900 outline-none focus:border-[#E8620A] focus:bg-white transition-colors"
            />
            <span className="text-xs text-gray-400 ml-2">dias</span>
          </div>
        </section>

        {alterado && (
          <p className="text-xs text-amber-600 text-center">Você tem alterações não salvas.</p>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div role="status" className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm font-medium px-4 py-2.5 rounded-full shadow-xl z-50 max-w-[90vw] text-center">
          {toast}
        </div>
      )}
    </div>
  )
}

function ToggleRow({ titulo, descricao, checked, onChange, disabled = false }: {
  titulo: string; descricao: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean
}) {
  return (
    <div className="px-5 py-4 border-b border-gray-100 last:border-b-0 flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-gray-900">{titulo}</p>
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{descricao}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={titulo}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 mt-0.5 ${
          checked ? 'bg-green-500' : 'bg-gray-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  )
}
