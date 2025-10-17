import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'

type Note = { id: string; title: string; content: string; created_at: string; updated_at: string }

export function NoteEditor() {
  const { id } = useParams()
  const nav = useNavigate()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const { data } = await axios.get<Note[]>('/api/notes')
        const found = data.find(n => n.id === id)
        if (found) {
          setTitle(found.title)
          setContent(found.content)
        }
      } catch (e: any) {
        setError(e?.response?.data?.error || 'Failed to load note')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  async function save() {
    try {
      if (!id) return
      const safeTitle = title && title.trim().length > 0 ? title.trim() : 'Untitled'
      await axios.put(`/api/notes/${id}`, { title: safeTitle, content })
      nav('/notes')
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to save note')
    }
  }

  async function deleteNote() {
    try {
      if (!id) return
      await axios.delete(`/api/notes/${id}`)
      nav('/notes')
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to delete note')
    }
  }

  return (
    <div style={{ background: '#f8fafc', minHeight: '90vh' }}>
      <div className="container-narrow">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16,}}>
  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
    <h1 style={{ margin: 0, fontSize: 20, color: '#0f172a' }}>Edit Note</h1>
    <Link to="/notes" className="btn btn-secondary" style={{color: '#aa3377', width: 'auto', padding: '10px 20px' }}>Back </Link>
    </div>

    <div style={{ display: 'flex', gap: 8 }}>
      <button
        onClick={deleteNote}
        className="btn btn-secondary"
        style={{ width: 'auto', padding: '10px 14px' , color: '#b91c1c' }}> Delete
      </button>
      <button
        onClick={save}
        className="btn btn-secondary" style={{ width: 'auto', padding: '10px 14px' , color: '#6366f1' }}> Save
      </button>
    </div>
  </div>

        <div className="surface" style={{ padding: 8 }}>
          {loading && <div>Loading…</div>}
          {error && <div style={{ color: '#b91c1c', marginBottom: 12 }}>{error}</div>}
          <div style={{ display: 'grid', gap: 12 }}>
            <input
              className="editor-input"
              placeholder="Title"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
            <RichEditor value={content} onChange={setContent} />
          </div>
        </div>
      </div>
    </div>
  )
}

function RichEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value
    }
  }, [value])

  function onInput(e: React.FormEvent<HTMLDivElement>) {
    onChange((e.target as HTMLDivElement).innerHTML)
  }

  function exec(cmd: string, arg?: string) {
    if (!ref.current) return
    // keep focus in the editor so toggles (lists, bold, etc.) work as expected
    ref.current.focus()
    document.execCommand(cmd, false, arg)
  }

  return (
      <div className="note-editor">
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <EditorButton onExec={exec} cmd="bold" label="Bold" />
          <EditorButton onExec={exec} cmd="italic" label="Italic" />
          <EditorButton onExec={exec} cmd="underline" label="Underline" />
          <EditorButton onExec={exec} cmd="insertUnorderedList" label="• List" />
          <EditorButton onExec={exec} cmd="insertOrderedList" label="1. List" />
          <EditorButton onExec={exec} cmd="formatBlock" arg="h2" label="H2" />
          <EditorButton onExec={exec} cmd="formatBlock" arg="p" label="P" />
        </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={onInput}
        className="editor-textarea"
        style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere' }}
      />
    </div>
  )
}

function EditorButton({ cmd, arg, label, onExec }: { cmd: string; arg?: string; label: string; onExec: (cmd: string, arg?: string) => void }) {
  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); onExec(cmd, arg); }}
      type="button"
      className="btn btn-secondary"
      style={{ width: 'auto', padding: '8px 12px', borderRadius: 8, fontSize: 14 , color: '#702963'}}
    >
      {label}
    </button>
  )
}