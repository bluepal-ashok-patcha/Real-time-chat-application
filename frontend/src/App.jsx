import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MessagingApp from './pages/MessagingApp';
import './index.css';

function App() {
  const { user } = useSelector((state) => state.auth);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/chat"
          element={user && user.id ? <MessagingApp /> : <Navigate to="/login" />}
        />
        <Route
          path="/"
          element={user && user.id ? <Navigate to="/chat" /> : <Navigate to="/login" />}
        />
      </Routes>
    </Router>
  );
}

export default App;
