import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProfessionalLandingPage from './components/ProfessionalLandingPage';
import QuantumBiometricIdentity from './components/QuantumBiometricIdentity';
import SmartHybridQuantumCrypto from './services/SmartHybridQuantumCrypto';

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
  const [quantumReady, setQuantumReady] = useState(false);

  useEffect(() => {
    const initializeQuantumSystem = async () => {
      console.log('🔍 Initializing Smart Hybrid Quantum Crypto...');
      
      try {
        // Detectar capacidades quantum automaticamente
        await SmartHybridQuantumCrypto.detectCapabilities();
        
        // Obtener metricas para mostrar en consola
        const metrics = SmartHybridQuantumCrypto.getPerformanceMetrics();
        
        console.log('📊 Quantum System Status:', metrics);
        console.log('🔧 Diagnostic Info:', SmartHybridQuantumCrypto.getDiagnosticInfo());
        
        setQuantumReady(true);
      } catch (error) {
        console.error('❌ Failed to initialize quantum system:', error);
        // Sistema debe funcionar aun si la deteccion falla
        setQuantumReady(true);
      }
    };

    initializeQuantumSystem();
  }, []);

  // Mostrar loading mientras se inicializa el sistema quantum
  if (!quantumReady) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        fontFamily: 'system-ui'
      }}>
        <div style={{ marginBottom: '20px', fontSize: '24px' }}>🔍</div>
        <div>Initializing Quantum Crypto System...</div>
        <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
          Detecting optimal implementations
        </div>
      </div>
    );
  }

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