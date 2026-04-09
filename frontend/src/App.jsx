import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './ThemeContext';
import { AuthProvider, useAuth } from './AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Expenditure from './pages/Expenditure';
import Upload from './pages/Upload';
import Anomalies from './pages/Anomalies';
import RTIWorkspace from './pages/RTIWorkspace';
import About from './pages/About';
import Login from './pages/Login';
import Documents from './pages/Documents';
import VoiceAssistant from './components/VoiceAssistant';
import AskTheAudit from './components/AskTheAudit';
import './App.css';


function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loading">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role))
    return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <div className="app">
      {user && <Navbar />}

      <main className="app-main">
        <Routes>
          {/* Public */}
          <Route path="/"      element={user ? <Navigate to="/dashboard" replace /> : <Home />} />
          <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
          <Route path="/about" element={<About />} />

          {/* Protected */}
          <Route path="/dashboard"   element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/expenditure" element={<ProtectedRoute><Expenditure /></ProtectedRoute>} />
          <Route path="/upload"      element={<ProtectedRoute><Upload /></ProtectedRoute>} />
          <Route path="/anomalies"   element={<ProtectedRoute><Anomalies /></ProtectedRoute>} />
          <Route path="/documents"   element={<ProtectedRoute><Documents /></ProtectedRoute>} />

          <Route
            path="/rti-workspace"
            element={
              <ProtectedRoute>
                <RTIWorkspace />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>

      {user && (
        <>
          <VoiceAssistant />
          <AskTheAudit />
          <footer className="app-footer">
            <p>⚖️ JanAudit — AI-Powered RTI & Government Transparency System</p>
          </footer>
        </>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}