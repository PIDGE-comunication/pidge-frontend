'use client'

const PRIORIDADE: Record<string, { label: string; cls: string }> = {
  baixa:   { label: 'Baixa',   cls: 'bg-gray-100 text-gray-700' },
  media:   { label: 'Média',   cls: 'bg-blue-100 text-blue-700' },
  alta:    { label: 'Alta',    cls: 'bg-orange-100 text-[#c4510a]' },
  urgente: { label: 'Urgente', cls: 'bg-red-100 text-red-700' },
}

function fmtDate(iso: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

interface Props {
  titulo: string
  texto: string
  imagemPreview: string | null
  prioridade: string
  obrigatorio: boolean
  dataInicio: string
  dataFim: string
  publicoResumo: string
  autorNome: string
  autorPapel: 'admin' | 'gremio'
  onClose: () => void
}

export default function PreviewModal(p: Props) {
  const pri = PRIORIDADE[p.prioridade] ?? { label: p.prioridade, cls: 'bg-gray-100 text-gray-700' }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && p.onClose()}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal={true}
        aria-label="Pré-visualização do comunicado"
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Pré-visualização</span>
          <button
            onClick={p.onClose}
            aria-label="Fechar"
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors text-sm"
          >
            ✕
          </button>
        </div>

        {/* Modal body */}
        <div className="px-6 py-5 flex flex-col gap-4">
          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${pri.cls}`}>
              {pri.label}
            </span>
            {p.obrigatorio && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700">
                Obrigatório
              </span>
            )}
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 leading-tight">
            {p.titulo || <span className="text-gray-300 italic">Sem título</span>}
          </h2>

          {/* Image */}
          {p.imagemPreview && (
            <img
              src={p.imagemPreview}
              alt="Capa do comunicado"
              className="w-full rounded-xl object-cover max-h-72"
            />
          )}

          {/* Rich text content */}
          <div
            className="text-sm text-gray-700 leading-relaxed prose-headings:font-bold prose-h1:text-lg prose-h2:text-base prose-ul:list-disc prose-ul:pl-5 prose-ol:list-decimal prose-ol:pl-5 prose-a:text-[#E8620A] prose-a:underline"
            dangerouslySetInnerHTML={{ __html: p.texto || '<em>Sem conteúdo.</em>' }}
          />

          {/* Meta */}
          <dl className="mt-2 flex flex-col gap-2.5 border-t border-gray-100 pt-4">
            <div className="flex gap-2 text-sm">
              <dt className="font-semibold text-gray-500 w-28 flex-shrink-0">Período</dt>
              <dd className="text-gray-700">{fmtDate(p.dataInicio)} — {fmtDate(p.dataFim)}</dd>
            </div>
            {p.publicoResumo && (
              <div className="flex gap-2 text-sm">
                <dt className="font-semibold text-gray-500 w-28 flex-shrink-0">Público-alvo</dt>
                <dd className="text-gray-700">{p.publicoResumo}</dd>
              </div>
            )}
            <div className="flex gap-2 text-sm">
              <dt className="font-semibold text-gray-500 w-28 flex-shrink-0">Autor</dt>
              <dd className="text-gray-700">
                {p.autorNome}{' '}
                <span className="text-gray-400">
                  ({p.autorPapel === 'admin' ? 'Administração' : 'Grêmio Estudantil'})
                </span>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}
