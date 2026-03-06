import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import './Timer.css'

const WORK_MINUTES = 25
const BREAK_MINUTES = 5

export default function Timer() {
  const { user } = useAuth()
  const [subjects, setSubjects] = useState([])
  const [selectedSubject, setSelectedSubject] = useState('')
  const [mode, setMode] = useState('work') // 'work' | 'break'
  const [remaining, setRemaining] = useState(WORK_MINUTES * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [notes, setNotes] = useState('')
  const [subjectDropdownOpen, setSubjectDropdownOpen] = useState(false)
  const subjectDropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (subjectDropdownRef.current && !subjectDropdownRef.current.contains(e.target)) {
        setSubjectDropdownOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const loadSubjects = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('subjects')
      .select('id, name, color')
      .eq('user_id', user.id)
      .order('name')
    setSubjects(data || [])
    if (data?.length && !selectedSubject) setSelectedSubject(data[0].id)
  }, [user])

  useEffect(() => {
    loadSubjects()
  }, [loadSubjects])

  const handleComplete = useCallback(async () => {
    setIsRunning(false)
    if (mode === 'work' && user && selectedSubject) {
      await supabase.from('sessions').insert({
        user_id: user.id,
        subject_id: selectedSubject,
        duration_minutes: WORK_MINUTES,
        notes: notes || null,
        started_at: new Date(Date.now() - WORK_MINUTES * 60 * 1000).toISOString(),
      })
    }
    setMode((m) => (m === 'work' ? 'break' : 'work'))
    setRemaining((prev) => (mode === 'work' ? BREAK_MINUTES * 60 : WORK_MINUTES * 60))
  }, [mode, user, selectedSubject, notes])

  useEffect(() => {
    if (!isRunning) return
    const timer = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          handleComplete()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [isRunning, handleComplete])

  const start = () => setIsRunning(true)
  const pause = () => setIsRunning(false)
  const reset = () => {
    setIsRunning(false)
    setRemaining(mode === 'work' ? WORK_MINUTES * 60 : BREAK_MINUTES * 60)
  }

  const m = Math.floor(remaining / 60)
  const s = remaining % 60
  const totalSeconds = mode === 'work' ? WORK_MINUTES * 60 : BREAK_MINUTES * 60
  const progressPercent = ((totalSeconds - remaining) / totalSeconds) * 100

  return (
    <Layout>
      <div className="timer-page">
        <h1>Pomodoro Timer</h1>
        <p className="timer-mode">{mode === 'work' ? 'Work' : 'Break'} session</p>

        {mode === 'work' && subjects.length > 0 && (
          <div className="timer-subject">
            <label>Subject</label>
            <div className="subject-dropdown" ref={subjectDropdownRef}>
              <button
                type="button"
                className="subject-dropdown-trigger"
                onClick={() => !isRunning && setSubjectDropdownOpen((o) => !o)}
                disabled={isRunning}
              >
                {(() => {
                  const s = subjects.find((x) => x.id === selectedSubject)
                  return s ? (
                    <>
                      <span className="subject-dot" style={{ backgroundColor: s.color }} />
                      {s.name}
                    </>
                  ) : (
                    'Select subject'
                  )
                })()}
              </button>
              {subjectDropdownOpen && (
                <ul className="subject-dropdown-list">
                  {subjects.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        className={`subject-dropdown-option ${selectedSubject === s.id ? 'selected' : ''}`}
                        onClick={() => {
                          setSelectedSubject(s.id)
                          setSubjectDropdownOpen(false)
                        }}
                      >
                        <span className="subject-dot" style={{ backgroundColor: s.color }} />
                        {s.name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {mode === 'work' && (
          <div className="timer-notes">
            <label>Notes (optional)</label>
            <input
              type="text"
              placeholder="What are you studying?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isRunning}
            />
          </div>
        )}

        <div className={`timer-circle ${mode}`}>
          <span className="timer-display">{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}</span>
        </div>
        <div className={`timer-progress-bar ${mode}`}>
          <div
            className="timer-progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="timer-controls">
          {!isRunning ? (
            <button className="timer-btn start" onClick={start}>Start</button>
          ) : (
            <button className="timer-btn pause" onClick={pause}>Pause</button>
          )}
          <button className="timer-btn reset" onClick={reset}>Reset</button>
        </div>

        {mode === 'work' && subjects.length === 0 && (
          <p className="timer-hint">
            <Link to="/subjects">Add a subject</Link> to save sessions
          </p>
        )}
      </div>
    </Layout>
  )
}
