import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Layout.css'

export default function Layout({ children }) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="layout">
      <nav className="nav">
        <Link to="/dashboard" className="nav-brand">Study Tracker</Link>
        <div className="nav-links">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/timer">Timer</Link>
          <Link to="/subjects">Subjects</Link>
          <button className="nav-signout" onClick={handleSignOut}>Sign out</button>
        </div>
      </nav>
      <main className="main">{children}</main>
    </div>
  )
}
