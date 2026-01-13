import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import DailyExecution from './pages/DailyExecution';
import Books from './pages/Books';
import Journal from './pages/Journal';

import Rules from './pages/Rules';
import Stats from './pages/Stats';
import SemExams from './pages/SemExams';
import Login from './pages/Login';

const Layout = ({ children }) => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main style={{ flex: 1, paddingBottom: '4rem' }}>{children}</main>
      <footer style={{
        textAlign: 'center',
        padding: '2rem',
        color: 'var(--text-tertiary)',
        fontSize: '0.7rem',
        letterSpacing: '0.2em',
        fontFamily: 'var(--font-mono)'
      }}>
        SYSTEM ARCHITECT: SAGAR
      </footer>
    </div>
  )
};

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  // if (!user) return <Navigate to="/login" />;
  return <Layout>{children}</Layout>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/rules" element={<ProtectedRoute><Rules /></ProtectedRoute>} />
          <Route path="/daily" element={<ProtectedRoute><DailyExecution /></ProtectedRoute>} />
          <Route path="/books" element={<ProtectedRoute><Books /></ProtectedRoute>} />
          <Route path="/journal" element={<ProtectedRoute><Journal /></ProtectedRoute>} />
          <Route path="/stats" element={<ProtectedRoute><Stats /></ProtectedRoute>} />
          <Route path="/exams" element={<ProtectedRoute><SemExams /></ProtectedRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
