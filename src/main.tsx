import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { SocketProvider } from './providers/SocketProvider.tsx'

const root = createRoot(document.getElementById('root')!)

root.render(
    <SocketProvider>
      <App />
    </SocketProvider>
)
