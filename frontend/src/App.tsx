import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProfessionalLandingPage from './components/ProfessionalLandingPage';
import QuantumBiometricIdentity from './components/QuantumBiometricIdentity';

/**
 * 🧬 QUANKEY v6.0 - TRUE PASSWORDLESS QUANTUM BIOMETRIC ARCHITECTURE
 * ⚠️ REVOLUTIONARY CHANGE: Eliminated ALL password infrastructure
 * 
 * YOUR BODY IS YOUR IDENTITY:
 * - NO passwords anywhere in the system
 * - NO recovery codes that can be lost or stolen
 * - Biometric signatures generate ML-KEM-768 quantum keys
 * - Multi-biometric 2-of-3 resilience for enterprise
 * - Zero-knowledge: server never sees biometric data
 */
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ProfessionalLandingPage />} />
        <Route path="/app" element={<QuantumBiometricIdentity />} />
      </Routes>
    </Router>
  );
}

export default App;