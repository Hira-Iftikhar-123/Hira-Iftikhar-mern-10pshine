import { useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'

type Note = { id: string; title: string; content: string; created_at: string; updated_at: string }

export function Notes() {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isMobile, setIsMobile] = useState<boolean>(false)
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const { data } = await axios.get<Note[]>('/api/notes')
      setNotes(data)
      if (data.length && !activeId) {
        const first = data[0]
        setActiveId(first.id)
        setTitle(first.title)
        setContent(first.content)
      }
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to load notes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 900)
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  function openNote(n: Note) {
    setActiveId(n.id)
    setTitle(n.title)
    setContent(n.content)
  }

  async function createNew() {
    const { data } = await axios.post<Note>('/api/notes', { title: 'Untitled', content: '' })
    setNotes(prev => [data, ...prev])
    openNote(data)
  }

  async function saveActive() {
    if (!activeId) return
    try {
      const safeTitle = title && title.trim().length > 0 ? title.trim() : 'Untitled'
      const { data } = await axios.put<Note>(`/api/notes/${activeId}`, { title: safeTitle, content })
      setNotes(prev => {
        const updated = prev.map(n => n.id === data.id ? data : n)
        return [...updated].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      })
      setError(null)
      setSavedAt(Date.now())
      setTimeout(() => setSavedAt(null), 1500)
    } catch (e: any) {
      const msg = e?.response?.data?.error || 'Failed to save note'
      setError(msg)
    }
  }

  async function deleteActive() {
    if (!activeId) return
    await axios.delete(`/api/notes/${activeId}`)
    setNotes(prev => prev.filter(n => n.id !== activeId))
    const next = notes.find(n => n.id !== activeId)
    if (next) openNote(next)
    else {
      setActiveId(null); setTitle(''); setContent('')
    }
  }

  async function deleteById(id: string) {
    const proceed = window.confirm('Delete this note?')
    if (!proceed) return
    await axios.delete(`/api/notes/${id}`)
    setNotes(prev => prev.filter(n => n.id !== id))
    if (activeId === id) {
      const next = notes.find(n => n.id !== id)
      if (next) openNote(next)
      else {
        setActiveId(null); setTitle(''); setContent('')
      }
    }
  }

  const gridColumns = isMobile ? '1fr' : '320px 1fr'

  return (
    <div className="notes-shell" style={{ position: 'relative', display: 'grid', gridTemplateColumns: gridColumns, height: '100vh', background: '#ffffff', color: '#111827' }}>
      <aside style={{
        borderRight: isMobile ? 'none' : '1px solid #e5e7eb',
        padding: 16,
        overflow: 'auto',
        background: '#f7f7f7',
        position: isMobile ? 'fixed' : 'relative',
        inset: isMobile ? '0 auto 0 0' : undefined,
        height: isMobile ? '100%' : 'auto',
        width: isMobile ? '85%' : 'auto',
        boxShadow: isMobile && sidebarOpen ? '0 0 0 9999px rgba(0,0,0,0.4), 2px 0 12px rgba(0,0,0,0.12)' : 'none',
        transform: isMobile ? (sidebarOpen ? 'translateX(0%)' : 'translateX(-100%)') : 'none',
        transition: isMobile ? 'transform 160ms ease' : 'none',
        zIndex: 30
      }}>
        {isMobile && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <strong>My Notes</strong>
            <button aria-label="Close" style={button} onClick={() => setSidebarOpen(false)}>Close</button>
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
          <button style={buttonPrimary} onClick={createNew}>New</button>
          <button style={button} onClick={load}>Refresh</button>
        </div>
        {loading && <div>Loading…</div>}
        {error && <div style={{ color: '#b91c1c' }}>{error}</div>}
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {notes.map(n => (
            <li key={n.id} style={{ padding: '10px 8px', borderRadius: 8, background: activeId === n.id ? '#e5e7eb' : 'transparent' }}>
              <div onClick={() => openNote(n)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title || 'Untitled'}</div>
                  <div style={{ color: '#6b7280', fontSize: 12 }}>{new Date(n.updated_at).toLocaleString()}</div>
                </div>
                <button
                  title="Delete"
                  onClick={(e) => { e.stopPropagation(); deleteById(n.id) }}
                  style={{
                    height: 28,
                    padding: '0 10px',
                    borderRadius: 6,
                    border: '1px solid #ef4444',
                    background: '#fee2e2',
                    color: '#b91c1c',
                    cursor: 'pointer'
                  }}
                >Delete</button>
              </div>
            </li>
          ))}
        </ul>
      </aside>
      <main style={{ padding: 16, display: 'grid', gridTemplateRows: 'auto auto 1fr auto', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isMobile && (
              <button style={button} onClick={() => setSidebarOpen(true)}>Notes</button>
            )}
            <h2 style={{ margin: 0 }}>Title</h2>
          </div>
          <Link to="/" style={{ ...button, textDecoration: 'none' }}>Exit</Link>
        </div>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" style={{ ...input, fontSize: 20, fontWeight: 700 }} />
        <RichEditor value={content} onChange={setContent} isMobile={isMobile} />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            {savedAt && <span style={{ color: '#059669' }}>Saved</span>}
            {error && !savedAt && <span style={{ color: '#b91c1c' }}>{error}</span>}
          </div>
          <button style={button} onClick={deleteActive} disabled={!activeId}>Delete</button>
          <button style={buttonPrimary} onClick={saveActive} disabled={!activeId}>Save</button>
        </div>
      </main>
      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 20 }} />
      )}
    </div>
  )
}

function RichEditor({ value, onChange, isMobile }: { value: string; onChange: (v: string) => void; isMobile?: boolean }) {
  const ref = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) ref.current.innerHTML = value
  }, [value])
  function onInput(e: React.FormEvent<HTMLDivElement>) {
    onChange((e.target as HTMLDivElement).innerHTML)
  }
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <EditorButton cmd="bold" label="Bold" />
        <EditorButton cmd="italic" label="Italic" />
        <EditorButton cmd="underline" label="Underline" />
        <EditorButton cmd="insertUnorderedList" label="• List" />
        <EditorButton cmd="insertOrderedList" label="1. List" />
        <EditorButton cmd="formatBlock" arg="h2" label="H2" />
        <EditorButton cmd="formatBlock" arg="p" label="P" />
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={onInput}
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          padding: 12,
          minHeight: isMobile ? 320 : 480,
          outline: 'none',
          background: '#ffffff',
          color: '#111827',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          overflowWrap: 'anywhere'
        }}
      />
    </div>
  )
}

function EditorButton({ cmd, arg, label }: { cmd: string; arg?: string; label: string }) {
  return <button style={button} onClick={() => document.execCommand(cmd, false, arg)}>{label}</button>
}

const button: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: 36,
  padding: '0 12px',
  borderRadius: 8,
  border: '1px solid #e5e7eb',
  background: '#ffffff',
  color: '#111827',
  cursor: 'pointer'
}

const buttonPrimary: React.CSSProperties = {
  ...button,
  background: '#111827',
  color: '#ffffff',
  borderColor: '#111827'
}

const input: React.CSSProperties = {
  width: '100%',
  height: 44,
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  padding: '8px 12px',
  background: '#ffffff',
  color: '#111827'
}