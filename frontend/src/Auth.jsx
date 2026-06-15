import { useState } from 'react'
import { useSignInEmailPassword, useSignUpEmailPassword } from '@nhost/react'

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const { signInEmailPassword, isLoading: signingIn } = useSignInEmailPassword()
  const { signUpEmailPassword, isLoading: signingUp } = useSignUpEmailPassword()

  const handleSubmit = async () => {
    setError('')
    if (!email || !password) { setError('Fill in both fields.'); return }

    if (isLogin) {
      const { isError, error } = await signInEmailPassword(email, password)
      if (isError) setError(error?.message || 'Login failed.')
    } else {
      const { isError, error } = await signUpEmailPassword(email, password)
      if (isError) setError(error?.message || 'Signup failed.')
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>🎙️</div>
        <h1 style={styles.title}>VoiceSpace</h1>
        <p style={styles.sub}>Live speech-to-text, powered by Deepgram</p>

        <div style={styles.toggle}>
          <button style={isLogin ? styles.activeTab : styles.tab} onClick={() => setIsLogin(true)}>Login</button>
          <button style={!isLogin ? styles.activeTab : styles.tab} onClick={() => setIsLogin(false)}>Sign Up</button>
        </div>

        <input
          style={styles.input}
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <input
          style={styles.input}
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        />

        {error && <p style={styles.error}>{error}</p>}

        <button
          style={styles.btn}
          onClick={handleSubmit}
          disabled={signingIn || signingUp}
        >
          {signingIn || signingUp ? 'Please wait...' : isLogin ? 'Login' : 'Create Account'}
        </button>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#0f0f0f',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Inter', sans-serif",
  },
  card: {
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '16px',
    padding: '40px',
    width: '100%',
    maxWidth: '400px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  logo: { fontSize: '40px', textAlign: 'center' },
  title: { color: '#fff', margin: 0, fontSize: '24px', textAlign: 'center', fontWeight: 700 },
  sub: { color: '#666', margin: 0, fontSize: '13px', textAlign: 'center' },
  toggle: { display: 'flex', background: '#111', borderRadius: '8px', padding: '4px', gap: '4px' },
  tab: {
    flex: 1, padding: '8px', background: 'transparent', border: 'none',
    color: '#666', borderRadius: '6px', cursor: 'pointer', fontSize: '14px'
  },
  activeTab: {
    flex: 1, padding: '8px', background: '#6c47ff', border: 'none',
    color: '#fff', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 600
  },
  input: {
    padding: '12px 14px', background: '#111', border: '1px solid #2a2a2a',
    borderRadius: '8px', color: '#fff', fontSize: '14px', outline: 'none'
  },
  btn: {
    padding: '13px', background: '#6c47ff', border: 'none', borderRadius: '8px',
    color: '#fff', fontWeight: 700, fontSize: '15px', cursor: 'pointer', marginTop: '4px'
  },
  error: { color: '#ff4d4d', fontSize: '13px', margin: 0 }
}
