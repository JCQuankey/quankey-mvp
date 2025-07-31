import React, { useState } from 'react';
import RecoveryProcess from './RecoveryProcess';
import Logo from './LogoComp';
import '../styles/RecoveryProcess.css';

const RecoveryPage: React.FC = () => {
  const [recoveryComplete, setRecoveryComplete] = useState(false);
  const [recoveryMessage, setRecoveryMessage] = useState('');

  const handleRecoveryComplete = (success: boolean, message: string) => {
    setRecoveryComplete(success);
    setRecoveryMessage(message);

    if (success) {
      // Redirect to main app after successful recovery
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
    }
  };

  if (recoveryComplete) {
    return (
      <div className="quantum-bg">
        <div className="card-quantum">
          <div className="header">
            <div className="logo-container">
              <Logo width={64} height={64} />
              <h1 className="main-title">Quankey</h1>
            </div>
            <div className="recovery-success">
              <div className="success-icon">✓</div>
              <h2>Recovery Successful!</h2>
              <p>{recoveryMessage}</p>
              <p className="redirect-message">
                Redirecting you to your vault in 3 seconds...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="quantum-bg">
      <div className="card-quantum">
        <div className="header">
          <div className="logo-container">
            <Logo width={64} height={64} />
            <h1 className="main-title">Quankey Recovery</h1>
          </div>
          <p className="subtitle">
            Recover your account using quantum recovery shares
          </p>
        </div>

        <RecoveryProcess onRecoveryComplete={handleRecoveryComplete} />

        <div className="footer">
          <p>World's first quantum-proof password recovery</p>
          <p style={{marginTop: '8px'}}>
            <a href="/" style={{color: '#667eea', textDecoration: 'none'}}>
              Back to Login
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RecoveryPage;