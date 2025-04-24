import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import ChatRoomPage from './pages/ChatRoomPage'
import { SocketProvider } from './providers/SocketProvider'
import { ThemeProvider } from './theme/ThemeProvider'
import './App.css'

function App() {
  return (
    <ThemeProvider>
      <SocketProvider>
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/room/:id" element={<ChatRoomPage />} />
            <Route path="*" element={<LandingPage />} />
          </Routes>
        </Router>
      </SocketProvider>
    </ThemeProvider>
  )
}

export default App
