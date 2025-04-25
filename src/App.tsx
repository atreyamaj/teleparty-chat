import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import ChatRoomPage from './pages/ChatRoomPage'
import { ThemeProvider } from './theme/ThemeProvider'
import { useSocket } from './providers/SocketProvider'
import './App.css'

function ConnectionStatusIndicator() {
  const { isConnected } = useSocket();
  const ready = isConnected;
  return (
    <div style={{
      position: 'fixed',
      top: 16,
      left: 24,
      display: 'flex',
      alignItems: 'center',
      zIndex: 1000,
      background: 'rgba(255,255,255,0.95)',
      borderRadius: 20,
      boxShadow: '0 1px 6px rgba(0,0,0,0.08)',
      padding: '4px 12px',
      fontSize: 14,
      fontWeight: 500,
      color: ready ? '#2e7d32' : '#c62828',
      gap: 8,
      border: `1px solid ${ready ? '#b2dfdb' : '#ffcdd2'}`,
      transition: 'color 0.2s, border 0.2s',
    }}>
      <span style={{
        display: 'inline-block',
        width: 10,
        height: 10,
        borderRadius: '50%',
        background: ready ? '#43d15c' : '#e53935',
        marginRight: 6,
        boxShadow: ready ? '0 0 4px #43d15c' : '0 0 4px #e53935',
        transition: 'background 0.2s, box-shadow 0.2s',
      }} />
      {ready ? 'Connection ready' : 'Connection not ready'}
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <ConnectionStatusIndicator />
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/room/:id" element={<ChatRoomPage />} />
          <Route path="*" element={<LandingPage />} />
        </Routes>
      </Router>
    </ThemeProvider>
  )
}

export default App
