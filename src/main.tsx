import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { SocketProvider } from './providers/SocketProvider.tsx' // Import the provider

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SocketProvider> {/* Wrap App with SocketProvider */}
      <App />
    </SocketProvider>
  </StrictMode>,
)
