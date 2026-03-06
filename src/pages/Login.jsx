import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Login.css'

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    setLoading(true)

    const { data, error } = isSignUp
      ? await signUp(email, password)
      : await signIn(email, password)

    setLoading(false)
    if (error) {
      setMessage(error.message)
      return
    }
    if (data?.user) {
      navigate('/dashboard')
    }
    if (isSignUp && !error) {
      setMessage('Check your email to confirm your account, or sign in if already confirmed.')
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>{isSignUp ? 'Sign up' : 'Sign in'}</h1>
        <p className="subtitle">Study Tracker</p>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          {message && <p className="message">{message}</p>}
          <button type="submit" disabled={loading}>
            {loading ? 'Loading...' : isSignUp ? 'Sign up' : 'Sign in'}
          </button>
        </form>

        <p className="toggle">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button type="button" className="link-btn" onClick={() => setIsSignUp(!isSignUp)}>
            {isSignUp ? 'Sign in' : 'Sign up'}
          </button>
        </p>
      </div>
    </div>
  )
}
