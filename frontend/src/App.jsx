import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './ThemeContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Anomalies from './pages/Anomalies';
import RTIWorkspace from './pages/RTIWorkspace';
import About from './pages/About';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="app">
          <Navbar />
          <main className="app-main">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/anomalies" element={<Anomalies />} />
              <Route path="/rti-workspace" element={<RTIWorkspace />} />
              <Route path="/about" element={<About />} />
            </Routes>
          </main>
          <footer className="app-footer">
            <p>⚖️ JanAudit — AI-Powered RTI & Government Transparency System</p>
          </footer>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
