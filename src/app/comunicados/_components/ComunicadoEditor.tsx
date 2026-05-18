'use client'

import { useState, useEffect, useRef } from 'react'
import { useUser } from '@/hooks/useUser'
import RichTextEditor from './RichTextEditor'
import PreviewModal from './PreviewModal'

// ─── Reference data (replace with API fetch as needed) ───────────────────────
const CURSOS = [
  { id: 'c1', nome: 'Desenvolvimento de Sistemas' },
  { id: 'c2', nome: 'Administração' },
  { id: 'c3', nome: 'Mecânica' },
  { id: 'c4', nome: 'Logística' },
  { id: 'c5', nome: 'Eletrotécnica' },
  { id: 'c6', nome: 'Eletrônica' },
]
const SALAS = [
  { id: 's1', nome: 'Sala 101' }, { id: 's2', nome: 'Sala 102' },
  { id: 's3', nome: 'Sala 201' }, { id: 's4', nome: 'Sala 202' },
  { id: 's5', nome: 'Lab. Informática' }, { id: 's6', nome: 'Auditório' },
]
const TURNOS = [
  { id: 'manha' as const, nome: 'Manhã' },
  { id: 'tarde' as const, nome: 'Tarde' },
  { id: 'noite' as const, nome: 'Noite' },
]

// ─── Types ───────────────────────────────────────────────────────────────────
type Turno = 'manha' | 'tarde' | 'noite'
type Abrangencia = 'escola_inteira' | 'curso' | 'sala' | 'turno'
type Prioridade = 'baixa' | 'media' | 'alta' | 'urgente'
type Status = 'rascunho' | 'aguardando_aprovacao' | 'publicado' | 'arquivado' | 'rejeitado'

interface ConflitoComunicado {
  id: string; titulo: string
  data_inicio: string; data_fim: string; publico_resumido: string
}
interface ConflitoDados { conflito: boolean; comunicados?: ConflitoComunicado[] }

const STATUS_LABEL: Record<Status, string> = {
  rascunho: 'Rascunho',
  aguardando_aprovacao: 'Aguardando aprovação',
  publicado: 'Publicado',
  arquivado: 'Arquivado',
  rejeitado: 'Rejeitado',
}
const STATUS_CLS: Record<Status, string> = {
  rascunho: 'bg-gray-100 text-gray-700',
  aguardando_aprovacao: 'bg-amber-100 text-amber-800',
  publicado: 'bg-green-100 text-green-800',
  arquivado: 'bg-gray-100 text-gray-500',
  rejeitado: 'bg-red-100 text-red-700',
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function ComunicadoEditor({ comunicadoId }: { comunicadoId?: string }) {
  const { user, loading: userLoading } = useUser()
  const papel = user?.papel as 'admin' | 'gremio' | undefined

  // Form fields
  const [titulo, setTitulo] = useState('')
  const [texto, setTexto] = useState('')
  const [imagemPreview, setImagemPreview] = useState<string | null>(null)
  const [imagemUrl, setImagemUrl] = useState<string | null>(null)
  const [prioridade, setPrioridade] = useState<Prioridade>('media')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [abrangencia, setAbrangencia] = useState<Abrangencia[]>([])
  const [cursosSel, setCursosSel] = useState<string[]>([])
  const [salasSel, setSalasSel] = useState<string[]>([])
  const [turnosSel, setTurnosSel] = useState<Turno[]>([])
  const [obrigatorio, setObrigatorio] = useState(false)

  // UI state
  const [statusComunicado, setStatusComunicado] = useState<Status | null>(null)
  const [loadingData, setLoadingData] = useState(!!comunicadoId)
  const [salvando, setSalvando] = useState(false)
  const [uploadingImg, setUploadingImg] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [erros, setErros] = useState<Record<string, string>>({})
  const [erroGlobal, setErroGlobal] = useState('')
  const [conflito, setConflito] = useState<ConflitoDados | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [showDiscard, setShowDiscard] = useState(false)
  const [showPublishConflict, setShowPublishConflict] = useState(false)
  const [richInitKey, setRichInitKey] = useState<string | undefined>(undefined)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const dateInicioRef = useRef<HTMLInputElement>(null)

  const isEditing = !!comunicadoId
  const readOnly = papel === 'gremio' && statusComunicado === 'aguardando_aprovacao'

  // ── Load existing comunicado ──────────────────────────────────────────────
  useEffect(() => {
    if (!comunicadoId) return
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/comunicados/${comunicadoId}`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : Promise.reject(new Error('not_found')))
      .then(d => {
        setTitulo(d.titulo ?? '')
        setTexto(d.texto ?? '')
        setImagemPreview(d.imagem_url ?? null)
        setImagemUrl(d.imagem_url ?? null)
        setPrioridade(d.prioridade ?? 'media')
        setDataInicio(d.data_inicio ? d.data_inicio.slice(0, 16) : '')
        setDataFim(d.data_fim ? d.data_fim.slice(0, 16) : '')
        setObrigatorio(d.obrigatorio ?? false)
        setStatusComunicado(d.status ?? null)
        const pub: { tipo: Abrangencia; referencia_id?: string; turno?: Turno }[] = d.publico ?? []
        setAbrangencia([...new Set(pub.map(p => p.tipo))])
        setCursosSel(pub.filter(p => p.tipo === 'curso').map(p => p.referencia_id!).filter(Boolean))
        setSalasSel(pub.filter(p => p.tipo === 'sala').map(p => p.referencia_id!).filter(Boolean))
        setTurnosSel(pub.filter(p => p.tipo === 'turno').map(p => p.turno!).filter(Boolean))
        setRichInitKey(comunicadoId)
      })
      .catch(() => setErroGlobal('Não foi possível carregar o comunicado.'))
      .finally(() => setLoadingData(false))
  }, [comunicadoId])

  // ── Conflict check — admin only, debounced 600ms ──────────────────────────
  useEffect(() => {
    if (papel !== 'admin' || !dataInicio || !dataFim || abrangencia.length === 0) return
    const t = setTimeout(async () => {
      try {
        const qs = new URLSearchParams({ data_inicio: dataInicio, data_fim: dataFim })
        abrangencia.forEach(a => qs.append('publico[]', a))
        if (comunicadoId) qs.set('excluir_id', comunicadoId)
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/comunicados/verificar-conflito?${qs}`,
          { credentials: 'include' }
        )
        if (res.ok) setConflito(await res.json())
      } catch { /* ignore — non-critical */ }
    }, 600)
    return () => clearTimeout(t)
  }, [dataInicio, dataFim, abrangencia, cursosSel, salasSel, turnosSel, papel, comunicadoId])

  // ── Derivations ───────────────────────────────────────────────────────────
  function getPublicoResumo(): string {
    if (abrangencia.includes('escola_inteira')) return 'Escola inteira'
    const parts: string[] = []
    if (abrangencia.includes('curso') && cursosSel.length)
      parts.push(`Cursos: ${cursosSel.map(id => CURSOS.find(c => c.id === id)?.nome ?? id).join(', ')}`)
    if (abrangencia.includes('sala') && salasSel.length)
      parts.push(`Salas: ${salasSel.map(id => SALAS.find(s => s.id === id)?.nome ?? id).join(', ')}`)
    if (abrangencia.includes('turno') && turnosSel.length)
      parts.push(`Turnos: ${turnosSel.map(t => TURNOS.find(x => x.id === t)?.nome ?? t).join(', ')}`)
    return parts.join(' · ')
  }

  function validate(): Record<string, string> {
    const e: Record<string, string> = {}
    if (!titulo) e.titulo = 'O título é obrigatório'
    else if (titulo.length < 5) e.titulo = 'O título deve ter pelo menos 5 caracteres'
    const plain = texto.replace(/<[^>]+>/g, '').trim()
    if (!plain) e.texto = 'O conteúdo do comunicado não pode estar vazio'
    else if (plain.length < 20) e.texto = 'O conteúdo deve ter pelo menos 20 caracteres'
    if (!dataInicio) e.dataInicio = 'Informe a data de início'
    else if (!isEditing && new Date(dataInicio) < new Date()) e.dataInicio = 'A data de início não pode ser anterior a hoje'
    if (!dataFim) e.dataFim = 'Informe a data de encerramento'
    else if (dataInicio && new Date(dataFim) <= new Date(dataInicio)) e.dataFim = 'A data de encerramento deve ser posterior ao início'
    if (abrangencia.length === 0) e.publico = 'Selecione ao menos um público-alvo'
    else if (!abrangencia.includes('escola_inteira')) {
      if (abrangencia.includes('curso') && cursosSel.length === 0) e.cursos = 'Selecione ao menos um curso'
      if (abrangencia.includes('sala') && salasSel.length === 0) e.salas = 'Selecione ao menos uma sala'
      if (abrangencia.includes('turno') && turnosSel.length === 0) e.turnos = 'Selecione ao menos um turno'
    }
    return e
  }

  function buildPublico() {
    if (abrangencia.includes('escola_inteira')) return [{ tipo: 'escola_inteira' }]
    const r: object[] = []
    cursosSel.forEach(id => r.push({ tipo: 'curso', referencia_id: id }))
    salasSel.forEach(id => r.push({ tipo: 'sala', referencia_id: id }))
    turnosSel.forEach(t => r.push({ tipo: 'turno', turno: t }))
    return r
  }

  async function salvar(status: 'rascunho' | 'publicado' | 'aguardando_aprovacao') {
    if (status !== 'rascunho') {
      const e = validate()
      if (Object.keys(e).length) {
        setErros(e)
        const key = Object.keys(e)[0]
        document.getElementById(`field-${key}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        return
      }
    }
    setErros({})
    setErroGlobal('')
    setSalvando(true)
    try {
      const body: Record<string, unknown> = {
        titulo, texto, imagem_url: imagemUrl,
        prioridade, data_inicio: dataInicio, data_fim: dataFim,
        publico: buildPublico(), status,
      }
      if (papel === 'admin') body.obrigatorio = obrigatorio
      const url = isEditing
        ? `${process.env.NEXT_PUBLIC_API_URL}/comunicados/${comunicadoId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/comunicados`
      const res = await fetch(url, {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? 'Erro ao salvar')
      window.location.href = '/comunicados'
    } catch (err) {
      setErroGlobal(err instanceof Error ? err.message : 'Erro ao salvar. Tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  async function handleImageFile(file: File) {
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setErros(e => ({ ...e, imagem: 'Formato inválido. Use PNG, JPG ou WEBP.' }))
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setErros(e => ({ ...e, imagem: 'A imagem deve ter no máximo 5 MB.' }))
      return
    }
    setErros(e => { const n = { ...e }; delete n.imagem; return n })
    setImagemPreview(URL.createObjectURL(file))
    setUploadingImg(true)
    try {
      const form = new FormData()
      form.append('imagem', file)
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload/imagem`, {
        method: 'POST', credentials: 'include', body: form,
      })
      if (res.ok) { const d = await res.json(); setImagemUrl(d.url) }
    } catch { /* keep preview, url stays null */ }
    finally { setUploadingImg(false) }
  }

  function toggleAbrangencia(tipo: Abrangencia) {
    if (tipo === 'escola_inteira') {
      setAbrangencia(prev => prev.includes('escola_inteira') ? [] : ['escola_inteira'])
      setCursosSel([]); setSalasSel([]); setTurnosSel([])
    } else {
      setAbrangencia(prev => {
        const base = prev.filter(a => a !== 'escola_inteira')
        return base.includes(tipo) ? base.filter(a => a !== tipo) : [...base, tipo]
      })
    }
  }

  function toggleItem<T>(item: T, list: T[], set: (v: T[]) => void) {
    set(list.includes(item) ? list.filter(x => x !== item) : [...list, item])
  }

  // ── Guards ────────────────────────────────────────────────────────────────
  if (userLoading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400 text-sm animate-pulse">Carregando...</p>
      </div>
    )
  }
  if (!user || (papel !== 'admin' && papel !== 'gremio')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-red-500 text-sm">Acesso não autorizado.</p>
      </div>
    )
  }

  const publicoResumo = getPublicoResumo()
  const btnPrimaryLabel =
    isEditing && statusComunicado === 'publicado' ? 'Salvar alterações'
    : papel === 'admin' ? 'Publicar agora'
    : 'Enviar para aprovação'

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">

      {/* Page header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3 sticky top-0 z-20">
        <div className="flex-1 flex items-center gap-3 min-w-0">
          <h1 className="text-lg font-bold text-gray-900 truncate">
            {isEditing ? 'Editar comunicado' : 'Novo comunicado'}
          </h1>
          {statusComunicado && (
            <span className={`shrink-0 text-xs font-semibold px-2.5 py-0.5 rounded-full ${STATUS_CLS[statusComunicado]}`}>
              {STATUS_LABEL[statusComunicado]}
            </span>
          )}
        </div>
        <span className="shrink-0 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:block">
          {papel === 'admin' ? 'Administração' : 'Grêmio Estudantil'}
        </span>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col gap-4">

        {/* Global alerts */}
        {readOnly && (
          <div className="px-4 py-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-800 text-sm">
            Este comunicado está em análise e não pode ser editado no momento.
          </div>
        )}
        {erroGlobal && (
          <div className="px-4 py-3 bg-red-50 border border-red-300 rounded-xl text-red-700 text-sm flex gap-2">
            <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[11px] font-bold shrink-0 flex items-center justify-center mt-0.5">!</span>
            {erroGlobal}
          </div>
        )}

        {/* Two-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-5 items-start">

          {/* ══ LEFT — content fields ══ */}
          <div className="flex flex-col gap-5">

            {/* Título */}
            <div id="field-titulo" className="bg-white rounded-xl border border-gray-200 p-5">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                Título <span className="text-[#E8620A]">*</span>
              </label>
              <input
                type="text"
                value={titulo}
                onChange={e => setTitulo(e.target.value)}
                disabled={readOnly}
                maxLength={120}
                placeholder="Ex: Reunião de pais e mestres — 2º bimestre"
                className={[
                  'w-full h-11 px-3 rounded-lg border text-sm text-gray-900 placeholder-gray-300 outline-none transition-colors',
                  erros.titulo
                    ? 'border-[#E8620A] bg-orange-50'
                    : 'border-gray-200 bg-gray-50 focus:border-[#E8620A] focus:bg-white',
                  'disabled:opacity-60 disabled:cursor-not-allowed',
                ].join(' ')}
              />
              <div className="flex justify-between mt-1.5">
                {erros.titulo
                  ? <p className="text-xs text-[#c4510a]">{erros.titulo}</p>
                  : <span />}
                <span className={`text-xs tabular-nums ${titulo.length > 100 ? 'text-[#E8620A]' : 'text-gray-300'}`}>
                  {titulo.length}/120
                </span>
              </div>
            </div>

            {/* Texto — Rich Text */}
            <div id="field-texto" className="bg-white rounded-xl border border-gray-200 p-5">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                Conteúdo <span className="text-[#E8620A]">*</span>
              </label>
              <RichTextEditor
                value={texto}
                onChange={setTexto}
                error={erros.texto}
                initKey={richInitKey}
              />
            </div>

            {/* Imagem */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                Imagem{' '}
                <span className="text-gray-300 font-normal normal-case">— opcional</span>
              </label>
              {imagemPreview ? (
                <div className="relative">
                  <img src={imagemPreview} alt="Preview" className="w-full max-h-64 object-cover rounded-lg" />
                  {uploadingImg && (
                    <div className="absolute inset-0 bg-white/75 rounded-lg flex items-center justify-center">
                      <span className="text-sm text-gray-500 animate-pulse">Enviando...</span>
                    </div>
                  )}
                  {!readOnly && (
                    <button type="button"
                      onClick={() => { setImagemPreview(null); setImagemUrl(null) }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-600 text-white text-xs flex items-center justify-center hover:bg-red-700 transition-colors"
                      aria-label="Remover imagem"
                    >✕</button>
                  )}
                </div>
              ) : (
                <div
                  onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={e => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleImageFile(f) }}
                  onClick={() => !readOnly && fileInputRef.current?.click()}
                  className={[
                    'border-2 border-dashed rounded-xl p-8 text-center transition-colors',
                    isDragging ? 'border-[#E8620A] bg-orange-50' : 'border-gray-200 bg-gray-50',
                    readOnly ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:border-[#E8620A] hover:bg-orange-50',
                  ].join(' ')}
                >
                  <div className="text-3xl mb-2 select-none">🖼️</div>
                  <p className="text-sm text-gray-600 font-medium">Arraste ou clique para selecionar</p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG ou WEBP · máx. 5 MB</p>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleImageFile(f) }} />
              {erros.imagem && <p className="text-xs text-[#c4510a] mt-1.5">{erros.imagem}</p>}
            </div>
          </div>

          {/* ══ RIGHT — settings + actions ══ */}
          <div className="flex flex-col gap-5">

            {/* Prioridade */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
                Prioridade <span className="text-[#E8620A]">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { id: 'baixa',   label: 'Baixa',   base: 'border-gray-300 text-gray-600',    active: 'bg-gray-100 border-gray-500 text-gray-800' },
                  { id: 'media',   label: 'Média',   base: 'border-blue-200 text-blue-600',    active: 'bg-blue-50 border-blue-500 text-blue-700' },
                  { id: 'alta',    label: 'Alta',    base: 'border-orange-200 text-[#E8620A]', active: 'bg-orange-50 border-[#E8620A] text-[#c4510a]' },
                  { id: 'urgente', label: 'Urgente', base: 'border-red-200 text-red-500',      active: 'bg-red-50 border-red-500 text-red-700' },
                ] as const).map(opt => {
                  const disabled = readOnly || (opt.id === 'urgente' && papel === 'gremio')
                  const isActive = prioridade === opt.id
                  return (
                    <button key={opt.id} type="button" disabled={disabled}
                      onClick={() => !disabled && setPrioridade(opt.id)}
                      title={opt.id === 'urgente' && papel === 'gremio' ? 'Exclusivo da administração' : undefined}
                      className={[
                        'h-9 rounded-lg border-2 text-sm font-semibold transition-all',
                        isActive ? opt.active : `${opt.base} bg-white`,
                        disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:opacity-80',
                      ].join(' ')}
                    >{opt.label}</button>
                  )
                })}
              </div>
            </div>

            {/* Período */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
                Período de exibição <span className="text-[#E8620A]">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div id="field-dataInicio">
                  <p className="text-xs text-gray-500 mb-1">Início</p>
                  <input ref={dateInicioRef} type="datetime-local" value={dataInicio}
                    onChange={e => setDataInicio(e.target.value)} disabled={readOnly}
                    className={['w-full h-10 px-2 rounded-lg border text-xs text-gray-900 outline-none transition-colors',
                      erros.dataInicio ? 'border-[#E8620A] bg-orange-50' : 'border-gray-200 bg-gray-50 focus:border-[#E8620A] focus:bg-white',
                      'disabled:opacity-60 disabled:cursor-not-allowed'].join(' ')}
                  />
                  {erros.dataInicio && <p className="text-xs text-[#c4510a] mt-1">{erros.dataInicio}</p>}
                </div>
                <div id="field-dataFim">
                  <p className="text-xs text-gray-500 mb-1">Fim</p>
                  <input type="datetime-local" value={dataFim}
                    onChange={e => setDataFim(e.target.value)} disabled={readOnly}
                    className={['w-full h-10 px-2 rounded-lg border text-xs text-gray-900 outline-none transition-colors',
                      erros.dataFim ? 'border-[#E8620A] bg-orange-50' : 'border-gray-200 bg-gray-50 focus:border-[#E8620A] focus:bg-white',
                      'disabled:opacity-60 disabled:cursor-not-allowed'].join(' ')}
                  />
                  {erros.dataFim && <p className="text-xs text-[#c4510a] mt-1">{erros.dataFim}</p>}
                </div>
              </div>
            </div>

            {/* Público-alvo */}
            <div id="field-publico" className="bg-white rounded-xl border border-gray-200 p-5">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
                Público-alvo <span className="text-[#E8620A]">*</span>
              </label>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Abrangência</p>
              <div className="flex flex-wrap gap-2">
                {([
                  { id: 'escola_inteira', label: 'Escola inteira' },
                  { id: 'curso',         label: 'Por curso' },
                  { id: 'sala',          label: 'Por sala' },
                  { id: 'turno',         label: 'Por turno' },
                ] as const).map(opt => {
                  const isActive = abrangencia.includes(opt.id)
                  const disabled = readOnly || (abrangencia.includes('escola_inteira') && opt.id !== 'escola_inteira')
                  return (
                    <button key={opt.id} type="button" disabled={disabled}
                      onClick={() => toggleAbrangencia(opt.id)}
                      className={['px-3 h-8 rounded-full border text-xs font-semibold transition-all',
                        isActive ? 'bg-[#E8620A] border-[#E8620A] text-white' : 'border-gray-200 text-gray-600 bg-white hover:border-[#E8620A] hover:text-[#E8620A]',
                        disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'].join(' ')}
                    >{opt.label}</button>
                  )
                })}
              </div>
              {erros.publico && <p className="text-xs text-[#c4510a] mt-2">{erros.publico}</p>}

              {!abrangencia.includes('escola_inteira') && abrangencia.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Detalhamento</p>

                  {abrangencia.includes('curso') && (
                    <div id="field-cursos">
                      <p className="text-xs font-semibold text-gray-600 mb-1.5">Cursos</p>
                      <div className="flex flex-wrap gap-1.5">
                        {CURSOS.map(c => (
                          <button key={c.id} type="button" disabled={readOnly}
                            onClick={() => toggleItem(c.id, cursosSel, setCursosSel)}
                            className={['px-2.5 h-7 rounded-md border text-xs font-medium transition-all',
                              cursosSel.includes(c.id) ? 'bg-[#E8620A]/10 border-[#E8620A] text-[#c4510a]' : 'border-gray-200 text-gray-600 bg-white hover:border-gray-400',
                              'disabled:opacity-60 disabled:cursor-not-allowed'].join(' ')}
                          >{c.nome}</button>
                        ))}
                      </div>
                      {erros.cursos && <p className="text-xs text-[#c4510a] mt-1">{erros.cursos}</p>}
                    </div>
                  )}

                  {abrangencia.includes('sala') && (
                    <div id="field-salas">
                      <p className="text-xs font-semibold text-gray-600 mb-1.5">Salas</p>
                      <div className="flex flex-wrap gap-1.5">
                        {SALAS.map(s => (
                          <button key={s.id} type="button" disabled={readOnly}
                            onClick={() => toggleItem(s.id, salasSel, setSalasSel)}
                            className={['px-2.5 h-7 rounded-md border text-xs font-medium transition-all',
                              salasSel.includes(s.id) ? 'bg-[#E8620A]/10 border-[#E8620A] text-[#c4510a]' : 'border-gray-200 text-gray-600 bg-white hover:border-gray-400',
                              'disabled:opacity-60 disabled:cursor-not-allowed'].join(' ')}
                          >{s.nome}</button>
                        ))}
                      </div>
                      {erros.salas && <p className="text-xs text-[#c4510a] mt-1">{erros.salas}</p>}
                    </div>
                  )}

                  {abrangencia.includes('turno') && (
                    <div id="field-turnos">
                      <p className="text-xs font-semibold text-gray-600 mb-1.5">Turnos</p>
                      <div className="flex gap-1.5">
                        {TURNOS.map(t => (
                          <button key={t.id} type="button" disabled={readOnly}
                            onClick={() => toggleItem(t.id, turnosSel, setTurnosSel)}
                            className={['flex-1 h-7 rounded-md border text-xs font-medium transition-all',
                              turnosSel.includes(t.id) ? 'bg-[#E8620A]/10 border-[#E8620A] text-[#c4510a]' : 'border-gray-200 text-gray-600 bg-white hover:border-gray-400',
                              'disabled:opacity-60 disabled:cursor-not-allowed'].join(' ')}
                          >{t.nome}</button>
                        ))}
                      </div>
                      {erros.turnos && <p className="text-xs text-[#c4510a] mt-1">{erros.turnos}</p>}
                    </div>
                  )}
                </div>
              )}

              {publicoResumo && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Resumo</p>
                  <p className="text-xs text-gray-700 bg-gray-50 rounded-lg px-3 py-2 leading-relaxed">{publicoResumo}</p>
                </div>
              )}
            </div>

            {/* Obrigatório — admin only */}
            {papel === 'admin' && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
                  Obrigatório
                </label>
                <div className="flex items-start gap-3">
                  <button type="button" role="switch" aria-checked={obrigatorio}
                    onClick={() => !readOnly && setObrigatorio(v => !v)}
                    className={['relative mt-0.5 w-11 h-6 rounded-full shrink-0 transition-colors',
                      obrigatorio ? 'bg-[#E8620A]' : 'bg-gray-200',
                      readOnly ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'].join(' ')}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${obrigatorio ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                  <span className="text-sm text-gray-700 leading-snug">
                    {obrigatorio
                      ? 'Sim — presença automática registrada em todas as agendas'
                      : 'Não — aluno confirma presença voluntariamente'}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-2.5 leading-relaxed">
                  Comunicados obrigatórios são inseridos automaticamente na agenda de todos os alunos do público-alvo. O aluno pode desmarcar, mas precisa justificar.
                </p>
              </div>
            )}

            {/* Conflict alert — admin only */}
            {papel === 'admin' && conflito?.conflito && (
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-4">
                <div className="flex gap-2.5 items-start mb-3">
                  <span className="text-amber-500 text-xl leading-none mt-0.5">⚠</span>
                  <div>
                    <p className="text-sm font-bold text-amber-800">Conflito detectado</p>
                    {conflito.comunicados?.map(c => (
                      <div key={c.id} className="mt-1.5">
                        <p className="text-xs font-semibold text-amber-700">{c.titulo}</p>
                        <p className="text-xs text-amber-600">{c.publico_resumido}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => dateInicioRef.current?.focus()}
                    className="flex-1 h-8 rounded-lg border border-amber-400 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors"
                  >Ajustar período</button>
                  <button type="button" onClick={() => setShowPublishConflict(true)}
                    className="flex-1 h-8 rounded-lg bg-amber-500 text-xs font-bold text-white hover:bg-amber-600 transition-colors"
                  >Publicar mesmo assim</button>
                </div>
              </div>
            )}

            {/* Grêmio warning */}
            {papel === 'gremio' && !readOnly && (
              <div className="bg-amber-50 border border-amber-300 rounded-xl px-4 py-3 text-sm text-amber-800 leading-relaxed">
                Este comunicado será publicado somente após aprovação da administração. Você receberá um e-mail com o resultado da revisão.
              </div>
            )}

            {/* Action bar — sticky */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 sticky bottom-4 shadow-lg">
              {readOnly ? (
                <button type="button" onClick={() => window.history.back()}
                  className="w-full h-10 rounded-lg border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:border-gray-400 transition-all"
                >← Voltar</button>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <button type="button" onClick={() => salvar('rascunho')} disabled={salvando}
                      className="flex-1 h-10 rounded-lg border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:border-gray-400 hover:text-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >Salvar rascunho</button>
                    <button type="button" onClick={() => setShowPreview(true)}
                      className="flex-1 h-10 rounded-lg border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:border-gray-400 hover:text-gray-800 transition-all"
                    >Pré-visualizar</button>
                  </div>
                  <button type="button" disabled={salvando}
                    onClick={() => papel === 'admin'
                      ? (conflito?.conflito ? setShowPublishConflict(true) : salvar('publicado'))
                      : salvar('aguardando_aprovacao')}
                    className="w-full h-10 rounded-lg bg-[#E8620A] text-sm font-bold text-white hover:bg-[#c4510a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >{salvando ? 'Salvando...' : btnPrimaryLabel}</button>
                  <button type="button" onClick={() => setShowDiscard(true)}
                    className="w-full h-9 text-sm text-gray-400 hover:text-red-500 transition-colors"
                  >Descartar</button>
                </div>
              )}
            </div>

          </div>{/* end right column */}
        </div>{/* end grid */}
      </div>{/* end container */}

      {/* ══ Modals ══ */}

      {showPreview && (
        <PreviewModal
          titulo={titulo} texto={texto} imagemPreview={imagemPreview}
          prioridade={prioridade} obrigatorio={obrigatorio}
          dataInicio={dataInicio} dataFim={dataFim}
          publicoResumo={publicoResumo}
          autorNome={user.nome} autorPapel={papel}
          onClose={() => setShowPreview(false)}
        />
      )}

      {showDiscard && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="text-base font-bold text-gray-900 mb-2">Descartar alterações?</h3>
            <p className="text-sm text-gray-500 mb-5">As alterações não salvas serão perdidas permanentemente.</p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowDiscard(false)}
                className="flex-1 h-10 rounded-lg border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:border-gray-400 transition-all"
              >Cancelar</button>
              <button type="button" onClick={() => window.history.back()}
                className="flex-1 h-10 rounded-lg bg-red-500 text-sm font-bold text-white hover:bg-red-600 transition-colors"
              >Descartar</button>
            </div>
          </div>
        </div>
      )}

      {showPublishConflict && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="text-base font-bold text-gray-900 mb-2">Publicar com conflito?</h3>
            <p className="text-sm text-gray-500 mb-5">
              Existe um conflito de comunicados detectado. Deseja publicar mesmo assim? O conflito ficará registrado na página de conflitos para resolução posterior.
            </p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowPublishConflict(false)}
                className="flex-1 h-10 rounded-lg border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:border-gray-400 transition-all"
              >Cancelar</button>
              <button type="button" onClick={() => { setShowPublishConflict(false); salvar('publicado') }}
                className="flex-1 h-10 rounded-lg bg-[#E8620A] text-sm font-bold text-white hover:bg-[#c4510a] transition-colors"
              >Publicar mesmo assim</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
