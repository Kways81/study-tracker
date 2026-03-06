import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import './Subjects.css'

const PRESET_COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

export default function Subjects() {
  const { user } = useAuth()
  const [subjects, setSubjects] = useState([])
  const [name, setName] = useState('')
  const [color, setColor] = useState(PRESET_COLORS[0])
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')

  useEffect(() => {
    if (!user) return
    const load = async () => {
      const { data } = await supabase
        .from('subjects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      setSubjects(data || [])
    }
    load()
  }, [user])

  const addSubject = async (e) => {
    e.preventDefault()
    if (!name.trim() || !user) return
    const { data, error } = await supabase
      .from('subjects')
      .insert({ user_id: user.id, name: name.trim(), color })
      .select()
      .single()
    if (!error) {
      setSubjects((s) => [data, ...s])
      setName('')
      setColor(PRESET_COLORS[0])
    }
  }

  const updateSubject = async () => {
    if (!editingId || !editName.trim()) return
    const { data, error } = await supabase
      .from('subjects')
      .update({ name: editName.trim() })
      .eq('id', editingId)
      .select()
      .single()
    if (!error) {
      setSubjects((s) => s.map((x) => (x.id === editingId ? data : x)))
      setEditingId(null)
      setEditName('')
    }
  }

  const deleteSubject = async (id) => {
    if (!confirm('Delete this subject?')) return
    await supabase.from('subjects').delete().eq('id', id)
    setSubjects((s) => s.filter((x) => x.id !== id))
  }

  const startEdit = (sub) => {
    setEditingId(sub.id)
    setEditName(sub.name)
  }

  return (
    <Layout>
      <div className="subjects-page">
        <h1>Subjects</h1>
        <p className="subjects-desc">Create and manage your study subjects</p>

        <form className="subjects-form" onSubmit={addSubject}>
          <input
            type="text"
            placeholder="Subject name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="color-picker">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={`color-option ${color === c ? 'active' : ''}`}
                style={{ backgroundColor: c }}
                onClick={() => setColor(c)}
                title={c}
              />
            ))}
          </div>
          <button type="submit">Add</button>
        </form>

        <ul className="subjects-list">
          {subjects.map((sub) => (
            <li key={sub.id} className="subject-item">
              <span className="subject-color" style={{ backgroundColor: sub.color }} />
              {editingId === sub.id ? (
                <>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && updateSubject()}
                  />
                  <button onClick={updateSubject}>Save</button>
                  <button className="cancel" onClick={() => { setEditingId(null); setEditName('') }}>Cancel</button>
                </>
              ) : (
                <>
                  <span className="subject-name">{sub.name}</span>
                  <button className="edit" onClick={() => startEdit(sub)}>Edit</button>
                  <button className="delete" onClick={() => deleteSubject(sub.id)}>Delete</button>
                </>
              )}
            </li>
          ))}
        </ul>

        {subjects.length === 0 && (
          <p className="subjects-empty">No subjects yet. Add one above.</p>
        )}
      </div>
    </Layout>
  )
}
