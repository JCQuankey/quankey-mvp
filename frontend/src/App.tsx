import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProfessionalLandingPage from './components/ProfessionalLandingPage';
import QuantumIdentityManager from './components/QuantumIdentityManager';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ProfessionalLandingPage />} />
        <Route path="/app" element={<QuantumIdentityManager />} />
      </Routes>
    </Router>
  );
}

export default App;