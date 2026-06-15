import { useState, useRef, useEffect, useMemo } from 'react'
import { useUserData, useSignOut } from '@nhost/react'

export default function Dashboard() {
  const user = useUserData()
  const { signOut } = useSignOut()
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimText, setInterimText] = useState('')
  const [status, setStatus] = useState('idle') // idle | connecting | live | error
  const [copySuccess, setCopySuccess] = useState(false)
  const wsRef = useRef(null)
  const mediaStreamRef = useRef(null)
  const processorRef = useRef(null)
  const audioCtxRef = useRef(null)

  const transcriptStats = useMemo(() => {
    const trimmed = transcript.trim()
    return {
      words: trimmed ? trimmed.split(/\s+/).length : 0,
      characters: transcript.length
    }
  }, [transcript])

  const DEEPGRAM_KEY = import.meta.env.VITE_DEEPGRAM_API_KEY

  const startListening = async () => {
    try {
      setStatus('connecting')
      setTranscript('')
      setInterimText('')

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream

      const ws = new WebSocket(
        `wss://api.deepgram.com/v1/listen?encoding=linear16&sample_rate=16000&channels=1&interim_results=true&punctuate=true&model=nova-2`,
        ['token', DEEPGRAM_KEY]
      )
      wsRef.current = ws

      ws.onopen = () => {
        setStatus('live')
        setIsListening(true)

        const audioCtx = new AudioContext({ sampleRate: 16000 })
        audioCtxRef.current = audioCtx
        const source = audioCtx.createMediaStreamSource(stream)
        const processor = audioCtx.createScriptProcessor(4096, 1, 1)
        processorRef.current = processor

        processor.onaudioprocess = (e) => {
          if (ws.readyState !== WebSocket.OPEN) return
          const float32 = e.inputBuffer.getChannelData(0)
          const int16 = new Int16Array(float32.length)
          for (let i = 0; i < float32.length; i++) {
            int16[i] = Math.max(-32768, Math.min(32767, float32[i] * 32768))
          }
          ws.send(int16.buffer)
        }

        source.connect(processor)
        processor.connect(audioCtx.destination)
      }

      ws.onmessage = (msg) => {
        const data = JSON.parse(msg.data)
        const alt = data?.channel?.alternatives?.[0]
        if (!alt) return
        if (data.is_final) {
          if (alt.transcript) setTranscript(prev => prev + alt.transcript + ' ')
          setInterimText('')
        } else {
          setInterimText(alt.transcript)
        }
      }

      ws.onerror = () => setStatus('error')
      ws.onclose = () => { if (status !== 'idle') setStatus('idle') }

    } catch (err) {
      console.error(err)
      setStatus('error')
    }
  }

  const stopListening = () => {
    processorRef.current?.disconnect()
    audioCtxRef.current?.close()
    mediaStreamRef.current?.getTracks().forEach(t => t.stop())
    wsRef.current?.close()
    setIsListening(false)
    setInterimText('')
    setStatus('idle')
  }

  const handleCopyTranscript = async () => {
    if (!transcript) return

    try {
      await navigator.clipboard.writeText(transcript.trim())
      setCopySuccess(true)
      window.setTimeout(() => setCopySuccess(false), 2000)
    } catch (error) {
      console.error('Copy failed', error)
    }
  }

  useEffect(() => () => stopListening(), [])

  const statusColor = { idle: '#666', connecting: '#f5a623', live: '#00d084', error: '#ff4d4d' }
  const statusLabel = { idle: 'Ready', connecting: 'Connecting...', live: '● LIVE', error: 'Error — try again' }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.headerLogo}>🎙️</span>
          <span style={styles.headerTitle}>VoiceSpace</span>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.userEmail}>{user?.email}</span>
          <button style={styles.signOut} onClick={signOut}>Sign out</button>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.statusBar}>
          <span style={{ ...styles.statusDot, background: statusColor[status] }} />
          <span style={{ color: statusColor[status], fontSize: '13px', fontWeight: 600 }}>
            {statusLabel[status]}
          </span>
        </div>

        <div style={styles.statsCard}>
          <div style={styles.statsLabel}>Transcript Statistics</div>
          <div style={styles.statsRow}>
            <div style={styles.statsItem}>
              <div style={styles.statsValue}>{transcriptStats.words}</div>
              <div style={styles.statsText}>Words</div>
            </div>
            <div style={styles.statsItem}>
              <div style={styles.statsValue}>{transcriptStats.characters}</div>
              <div style={styles.statsText}>Characters</div>
            </div>
          </div>
        </div>

        <div style={styles.actionRow}>
          <button
            style={styles.copyBtn}
            onClick={handleCopyTranscript}
            disabled={!transcript}
          >
            Copy Transcript
          </button>
          {copySuccess && <span style={styles.toast}>Transcript copied successfully</span>}
        </div>

        <div style={styles.transcriptBox}>
          {!transcript && !interimText && (
            <p style={styles.placeholder}>
              {isListening ? 'Listening... start speaking' : 'Hit the button below and start talking.'}
            </p>
          )}
          <span style={styles.finalText}>{transcript}</span>
          <span style={styles.interimText}>{interimText}</span>
        </div>

        <div style={styles.controls}>
          {!isListening ? (
            <button style={styles.micBtn} onClick={startListening}>
              🎙️ Start Listening
            </button>
          ) : (
            <button style={{ ...styles.micBtn, background: '#ff4d4d' }} onClick={stopListening}>
              ⏹ Stop
            </button>
          )}
          {transcript && (
            <button style={styles.clearBtn} onClick={() => setTranscript('')}>
              Clear
            </button>
          )}
        </div>
      </main>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', background: '#0f0f0f', fontFamily: "'Inter', sans-serif" },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 32px', borderBottom: '1px solid #1e1e1e', background: '#111'
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '10px' },
  headerLogo: { fontSize: '22px' },
  headerTitle: { color: '#fff', fontWeight: 700, fontSize: '18px' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '16px' },
  userEmail: { color: '#666', fontSize: '13px' },
  signOut: {
    padding: '7px 14px', background: 'transparent', border: '1px solid #2a2a2a',
    borderRadius: '6px', color: '#aaa', cursor: 'pointer', fontSize: '13px'
  },
  main: {
    maxWidth: '800px', margin: '60px auto', padding: '0 24px',
    display: 'flex', flexDirection: 'column', gap: '24px'
  },
  statusBar: { display: 'flex', alignItems: 'center', gap: '8px' },
  statusDot: { width: '8px', height: '8px', borderRadius: '50%', display: 'inline-block' },
  statsCard: {
    background: '#121212', border: '1px solid #2a2a2a', borderRadius: '16px',
    padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px'
  },
  statsLabel: { color: '#aaa', fontSize: '14px', fontWeight: 700, textTransform: 'uppercase' },
  statsRow: { display: 'flex', gap: '16px', flexWrap: 'wrap' },
  statsItem: {
    flex: '1 1 120px', background: '#1b1b1b', borderRadius: '14px',
    padding: '18px', minWidth: '120px'
  },
  statsValue: { color: '#fff', fontSize: '24px', fontWeight: 700 },
  statsText: { color: '#777', fontSize: '13px', marginTop: '8px' },
  actionRow: { display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' },
  copyBtn: {
    padding: '14px 22px', background: '#202020', border: '1px solid #2a2a2a',
    borderRadius: '12px', color: '#fff', cursor: 'pointer', fontSize: '14px',
    transition: 'background 0.2s'
  },
  toast: { color: '#00d084', fontSize: '14px' },
  transcriptBox: {
    minHeight: '300px', background: '#1a1a1a', border: '1px solid #2a2a2a',
    borderRadius: '16px', padding: '28px', lineHeight: '1.8', fontSize: '18px'
  },
  placeholder: { color: '#444', margin: 0, fontStyle: 'italic' },
  finalText: { color: '#fff' },
  interimText: { color: '#6c47ff' },
  controls: { display: 'flex', gap: '12px', alignItems: 'center' },
  micBtn: {
    padding: '14px 32px', background: '#6c47ff', border: 'none', borderRadius: '10px',
    color: '#fff', fontWeight: 700, fontSize: '16px', cursor: 'pointer'
  },
  clearBtn: {
    padding: '14px 20px', background: 'transparent', border: '1px solid #2a2a2a',
    borderRadius: '10px', color: '#666', cursor: 'pointer', fontSize: '14px'
  }
}
