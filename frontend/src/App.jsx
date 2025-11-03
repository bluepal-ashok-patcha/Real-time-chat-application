import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MessagingApp from './pages/MessagingApp';
import './index.css';

function App() {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/chat"
          element={isAuthenticated ? <MessagingApp /> : <Navigate to="/login" />}
        />
        <Route
          path="/"
          element={isAuthenticated ? <Navigate to="/chat" /> : <Navigate to="/login" />}
        />
      </Routes>
    </Router>
  );
}

export default App;
