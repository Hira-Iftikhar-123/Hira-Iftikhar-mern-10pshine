import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'

type Note = { id: string; title: string; content: string; tags?: string; created_at: string; updated_at: string }

export function NoteEditor() 
{
  const { id } = useParams()
  const nav = useNavigate()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')
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
          setTags(found.tags || '')
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
      const tagsString = tags.trim() || null
      await axios.put(`/api/notes/${id}`, { title: safeTitle, content, tags: tagsString })
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
    <div className="page-bg">
      <div className="container-narrow">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16,}}>
  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
    <h1 style={{ margin: 0, fontSize: 20, color: 'var(--text-primary)' }}>Edit Note</h1>
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
            <input
              className="editor-input"
              placeholder="Tags (comma-separated, e.g., work, important, meeting)"
              value={tags}
              onChange={e => setTags(e.target.value)}
              style={{ fontSize: '14px' }}
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
    ref.current.focus()
    document.execCommand(cmd, false, arg)
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !ref.current) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file')
      return
    }

    // Validate file size
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string
      if (imageUrl && ref.current) {
        // Insert image at cursor position
        const img = document.createElement('img')
        img.src = imageUrl
        img.style.maxWidth = '100%'
        img.style.height = 'auto'
        img.style.borderRadius = '8px'
        img.style.margin = '8px 0'
        
        // Insert image at current cursor position
        const selection = window.getSelection()
        if (selection && selection.rangeCount > 0) 
        {
          const range = selection.getRangeAt(0)
          range.insertNode(img)
          range.setStartAfter(img)
          range.setEndAfter(img)
          selection.removeAllRanges()
          selection.addRange(range)
        } 
        else 
        {
          ref.current.appendChild(img)
        }
        onChange(ref.current.innerHTML)
      }
    }
    reader.readAsDataURL(file)
    
    // Reset file input
    e.target.value = ''
  }

  return (
      <div className="note-editor">
        <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
          <EditorButton onExec={exec} cmd="bold" label="Bold" />
          <EditorButton onExec={exec} cmd="italic" label="Italic" />
          <EditorButton onExec={exec} cmd="underline" label="Underline" />
          <EditorButton onExec={exec} cmd="insertUnorderedList" label="• List" />
          <EditorButton onExec={exec} cmd="insertOrderedList" label="1. List" />
          <EditorButton onExec={exec} cmd="formatBlock" arg="h2" label="H2" />
          <EditorButton onExec={exec} cmd="formatBlock" arg="p" label="P" />
          
          {/* Font Size Options */}
          <select 
            onChange={(e) => {
              const size = e.target.value
              if (!ref.current) return
              
              // Ensure editor has focus
              ref.current.focus()
              
              if (size === 'default') {
                document.execCommand('removeFormat', false)
              } else {
                // Check if text is selected
                const selection = window.getSelection()
                const hasSelection = selection && selection.toString().trim().length > 0
                
                if (hasSelection) {
                  // Apply to selected text
                  document.execCommand('fontSize', false, '7')
                  
                  // Immediately fix the font elements
                  const fontElements = document.querySelectorAll('font[size="7"]')
                  fontElements.forEach(el => {
                    if (el instanceof HTMLElement) {
                      el.removeAttribute('size')
                      el.style.fontSize = size
                      el.style.lineHeight = '1.4'
                    }
                  })
                } else {
                  // Apply to current paragraph or entire content
                  const range = document.createRange()
                  const sel = window.getSelection()
                  
                  if (ref.current.contains(document.activeElement)) {
                    // Apply to current paragraph
                    const p = document.activeElement?.closest('p') || ref.current
                    range.selectNodeContents(p)
                    sel?.removeAllRanges()
                    sel?.addRange(range)
                    
                    document.execCommand('fontSize', false, '7')
                    
                    // Fix font elements
                    const fontElements = document.querySelectorAll('font[size="7"]')
                    fontElements.forEach(el => {
                      if (el instanceof HTMLElement) {
                        el.removeAttribute('size')
                        el.style.fontSize = size
                        el.style.lineHeight = '1.4'
                      }
                    })
                  }
                }
              }
            }}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            <option value="default">Font Size</option>
            <option value="12px">Small (12px)</option>
            <option value="14px">Normal (14px)</option>
            <option value="16px">Medium (16px)</option>
            <option value="18px">Large (18px)</option>
            <option value="20px">XL (20px)</option>
            <option value="24px">XXL (24px)</option>
          </select>

          {/* Font Family Options */}
          <select 
            onChange={(e) => {
              const fontFamily = e.target.value
              if (fontFamily === 'default') {
                document.execCommand('removeFormat', false)
              } else {
                document.execCommand('fontName', false, fontFamily)
              }
            }}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            <option value="default">Font Family</option>
            <option value="Arial, sans-serif">Arial</option>
            <option value="Georgia, serif">Georgia</option>
            <option value="Times New Roman, serif">Times New Roman</option>
            <option value="Helvetica, sans-serif">Helvetica</option>
            <option value="Verdana, sans-serif">Verdana</option>
            <option value="Courier New, monospace">Courier New</option>
            <option value="Comic Sans MS, cursive">Comic Sans</option>
            <option value="Impact, sans-serif">Impact</option>
          </select>

          {/* Image Upload Button */}
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
              id="image-upload"
            />
            <button
              onClick={() => document.getElementById('image-upload')?.click()}
              className="btn btn-secondary"
              style={{ width: 'auto', padding: '8px 12px', borderRadius: 8, fontSize: 14, color: '#702963' }}
            >
              📷 Image
            </button>
          </div>
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