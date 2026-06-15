import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { NhostProvider } from '@nhost/react'
import nhost from './nhostClient'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <NhostProvider nhost={nhost}>
      <App />
    </NhostProvider>
  </StrictMode>,
)
