import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import './Dashboard.css'

export default function Dashboard() {
  const { user } = useAuth()
  const [totalHours, setTotalHours] = useState(0)
  const [sessionsCount, setSessionsCount] = useState(0)
  const [recentSessions, setRecentSessions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchStats = async () => {
      const startOfWeek = new Date()
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
      startOfWeek.setHours(0, 0, 0, 0)
      const isoStart = startOfWeek.toISOString()

      const [statsRes, sessionsRes] = await Promise.all([
        supabase
          .from('sessions')
          .select('duration_minutes')
          .eq('user_id', user.id)
          .gte('started_at', isoStart),
        supabase
          .from('sessions')
          .select(`
            id,
            duration_minutes,
            started_at,
            subjects (name)
          `)
          .eq('user_id', user.id)
          .order('started_at', { ascending: false })
          .limit(5),
      ])

      if (statsRes.error) {
        console.error(statsRes.error)
      } else {
        const total = (statsRes.data || []).reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
        setTotalHours((total / 60).toFixed(1))
        setSessionsCount(statsRes.data?.length || 0)
      }

      if (!sessionsRes.error) {
        setRecentSessions(sessionsRes.data || [])
      }

      setLoading(false)
    }

    fetchStats()
  }, [user])

  const formatDate = (iso) => {
    const d = new Date(iso)
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
  }

  return (
    <Layout>
      <div className="dashboard">
        <h1>Dashboard</h1>
        <p className="welcome">Your study progress this week</p>

        {loading ? (
          <p className="loading">Loading...</p>
        ) : (
          <div className="stats">
            <div className="stat-card">
              <span className="stat-value">{totalHours}</span>
              <span className="stat-label">Hours studied</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{sessionsCount}</span>
              <span className="stat-label">Sessions</span>
            </div>
          </div>
        )}

        {!loading && recentSessions.length > 0 && (
          <section className="recent-sessions">
            <h2>Recent sessions</h2>
            <ul className="sessions-list">
              {recentSessions.map((s) => (
                <li key={s.id} className="session-item">
                  <span className="session-subject">{s.subjects?.name ?? 'Unknown'}</span>
                  <span className="session-duration">{s.duration_minutes} min</span>
                  <span className="session-date">{formatDate(s.started_at)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="quick-links">
          <Link to="/timer" className="quick-link">Start Pomodoro</Link>
          <Link to="/subjects" className="quick-link">Manage subjects</Link>
        </div>
      </div>
    </Layout>
  )
}
