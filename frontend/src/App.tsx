import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProfessionalLandingPage from './components/ProfessionalLandingPage';
import PasswordManager from './components/PasswordManager';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ProfessionalLandingPage />} />
        <Route path="/app" element={<PasswordManager />} />
      </Routes>
    </Router>
  );
}

export default App;