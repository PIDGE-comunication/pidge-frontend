'use client'
import { useRef, useEffect } from 'react'
import styles from './rich-text.module.css'

interface Props {
  value: string
  onChange: (html: string) => void
  error?: string
  initKey?: string
}

type Fmt = { cmd: string; arg?: string; label: string; title: string }

const TOOLBAR: (Fmt | 'sep')[] = [
  { cmd: 'bold', label: 'N', title: 'Negrito' },
  { cmd: 'italic', label: 'I', title: 'Itálico' },
  { cmd: 'underline', label: 'S', title: 'Sublinhado' },
  'sep',
  { cmd: 'formatBlock', arg: 'h1', label: 'H1', title: 'Título H1' },
  { cmd: 'formatBlock', arg: 'h2', label: 'H2', title: 'Título H2' },
  'sep',
  { cmd: 'insertUnorderedList', label: '• —', title: 'Lista não ordenada' },
  { cmd: 'insertOrderedList', label: '1.', title: 'Lista ordenada' },
  'sep',
  { cmd: '__link', label: '🔗', title: 'Inserir link' },
]

export default function RichTextEditor({ value, onChange, error, initKey }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const initRef = useRef(false)

  useEffect(() => {
    if (ref.current && (!initRef.current || initKey)) {
      ref.current.innerHTML = value
      initRef.current = true
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initKey])

  function exec(fmt: Fmt) {
    ref.current?.focus()
    if (fmt.cmd === '__link') {
      const url = window.prompt('URL do link:', 'https://')
      if (url) document.execCommand('createLink', false, url)
    } else {
      document.execCommand(fmt.cmd, false, fmt.arg)
    }
    if (ref.current) onChange(ref.current.innerHTML)
  }

  return (
    <div className={`${styles.wrap} ${error ? styles.wrapError : ''}`}>
      <div className={styles.toolbar} onMouseDown={e => e.preventDefault()}>
        {TOOLBAR.map((item, i) =>
          item === 'sep'
            ? <span key={i} className={styles.sep} />
            : (
              <button
                key={item.cmd + (item.arg ?? '')}
                type="button"
                title={item.title}
                className={`${styles.toolBtn} ${styles[item.cmd] ?? ''}`}
                onClick={() => exec(item)}
              >
                {item.label}
              </button>
            )
        )}
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        className={styles.editor}
        onInput={() => ref.current && onChange(ref.current.innerHTML)}
        data-placeholder="Escreva o conteúdo do comunicado..."
      />
      {error && <p className={styles.err}>{error}</p>}
    </div>
  )
}
