import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import MessagingApp from './pages/MessagingApp';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/chat" element={<MessagingApp />} />
        <Route path="/" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;