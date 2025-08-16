import React, { useState } from 'react';
import { Link } from 'react-router-dom';

// Quankey Logo Component - Official Brand Asset
const QuankeyLogo: React.FC<{ width?: number; height?: number; className?: string }> = ({ 
  width = 120, 
  height = 120, 
  className = "" 
}) => (
  <svg width={width} height={height} viewBox="0 0 120 120" className={className}>
    <defs>
      <linearGradient id="quankeyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{stopColor:"#00A6FB"}} />
        <stop offset="100%" style={{stopColor:"#00D4FF"}} />
      </linearGradient>
    </defs>
    
    <g transform="translate(60, 58)">
      {/* Fingerprint Arcs */}
      <path d="M 0,-18 A 18,18 0 0,1 18,0" stroke="url(#quankeyGradient)" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
      <path d="M 0,-26 A 26,26 0 0,1 26,0" stroke="url(#quankeyGradient)" strokeWidth="3" fill="none" opacity="0.75" strokeLinecap="round"/>
      <path d="M 0,-34 A 34,34 0 0,1 34,0" stroke="url(#quankeyGradient)" strokeWidth="2.5" fill="none" opacity="0.5" strokeLinecap="round"/>
      
      <path d="M 0,-18 A 18,18 0 0,0 -18,0" stroke="url(#quankeyGradient)" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
      <path d="M 0,-26 A 26,26 0 0,0 -26,0" stroke="url(#quankeyGradient)" strokeWidth="3" fill="none" opacity="0.75" strokeLinecap="round"/>
      <path d="M 0,-34 A 34,34 0 0,0 -34,0" stroke="url(#quankeyGradient)" strokeWidth="2.5" fill="none" opacity="0.5" strokeLinecap="round"/>
      
      {/* Key Element */}
      <circle cx="0" cy="0" r="6" fill="url(#quankeyGradient)"/>
      <rect x="-3" y="6" width="6" height="18" fill="url(#quankeyGradient)"/>
      <rect x="-3" y="20" width="3" height="4" fill="url(#quankeyGradient)"/>
      <rect x="1.5" y="19" width="3" height="5" fill="url(#quankeyGradient)"/>
    </g>
  </svg>
);

// Quankey Security Shield Icon
const SecurityIcon: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48">
    <path d="M24 4L8 12v8c0 8.84 6.78 17.12 16 18.96C33.22 37.12 40 28.84 40 20v-8L24 4z" stroke="#00A6FB" strokeWidth="2" fill="none"/>
    <path d="M18 24l4 4 8-8" stroke="#00A6FB" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Quankey Quantum Icon
const QuantumIcon: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48">
    <circle cx="24" cy="24" r="4" fill="#00A6FB"/>
    <circle cx="24" cy="24" r="12" stroke="#00A6FB" strokeWidth="2" fill="none" strokeDasharray="4,4"/>
    <circle cx="24" cy="24" r="20" stroke="#00A6FB" strokeWidth="2" fill="none" opacity="0.5"/>
    <circle cx="24" cy="4" r="3" fill="#00D4FF"/>
    <circle cx="44" cy="24" r="3" fill="#00D4FF"/>
    <circle cx="24" cy="44" r="3" fill="#00D4FF"/>
    <circle cx="4" cy="24" r="3" fill="#00D4FF"/>
  </svg>
);

// Quankey Fingerprint Icon  
const FingerprintIcon: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48">
    <circle cx="24" cy="24" r="4" stroke="#00A6FB" strokeWidth="2" fill="none"/>
    <path d="M24 12a12 12 0 0 1 12 12" stroke="#00A6FB" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <path d="M24 16a8 8 0 0 1 8 8" stroke="#00A6FB" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <path d="M24 12a12 12 0 0 0-12 12" stroke="#00A6FB" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <path d="M24 16a8 8 0 0 0-8 8" stroke="#00A6FB" strokeWidth="2" fill="none" strokeLinecap="round"/>
  </svg>
);

// Professional Military Icons
const PentagonIcon: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M12 2L2 8v8l10 6 10-6V8L12 2z" stroke="#00A6FB" strokeWidth="1.5" fill="none"/>
    <path d="M12 2v20M2 8l10 6 10-6" stroke="#00A6FB" strokeWidth="1.5" fill="none"/>
  </svg>
);

const RotationIcon: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48">
    <path d="M24 8v8l4-4 4 4V8" stroke="#00A6FB" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M40 24h-8l4-4-4-4h8" stroke="#00A6FB" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M24 40V32l-4 4-4-4v8" stroke="#00A6FB" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 24h8l-4 4 4 4H8" stroke="#00A6FB" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="24" cy="24" r="12" stroke="#00A6FB" strokeWidth="2" fill="none" strokeDasharray="2,2"/>
  </svg>
);

const HSMIcon: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48">
    <rect x="8" y="12" width="32" height="24" rx="4" stroke="#00A6FB" strokeWidth="2" fill="none"/>
    <rect x="12" y="20" width="24" height="8" rx="2" fill="#00A6FB" opacity="0.3"/>
    <circle cx="18" cy="18" r="2" fill="#00A6FB"/>
    <circle cx="30" cy="18" r="2" fill="#00A6FB"/>
    <rect x="20" y="28" width="8" height="4" rx="1" stroke="#00A6FB" strokeWidth="1" fill="none"/>
  </svg>
);

const ComplianceIcon: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48">
    <rect x="6" y="8" width="36" height="32" rx="4" stroke="#00A6FB" strokeWidth="2" fill="none"/>
    <path d="M16 20l4 4 8-8" stroke="#00A6FB" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 28h20M14 32h16" stroke="#00A6FB" strokeWidth="1.5" strokeLinecap="round"/>
    <rect x="10" y="4" width="4" height="8" rx="1" fill="#00A6FB"/>
    <rect x="34" y="4" width="4" height="8" rx="1" fill="#00A6FB"/>
  </svg>
);

const InstantRevokeIcon: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48">
    <circle cx="24" cy="24" r="18" stroke="#00A6FB" strokeWidth="2" fill="none"/>
    <path d="M16 16l16 16M32 16L16 32" stroke="#FF3B30" strokeWidth="3" strokeLinecap="round"/>
    <path d="M12 24L8 20v8l4-4z" fill="#00A6FB"/>
  </svg>
);

const LandingPage: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    company: '',
    sector: '',
    users: '',
    source: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState('defense');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_URL}/demo-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsSubmitted(true);
        setFormData({ email: '', company: '', sector: '', users: '', source: '' });
      } else {
        alert('Error submitting demo request. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error submitting demo request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div style={{
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      margin: 0,
      padding: 0,
      background: 'linear-gradient(135deg, #0A1628 0%, #1E3A5F 50%, #16213e 100%)',
      minHeight: '100vh',
      color: '#ffffff'
    }}>
      {/* Header */}
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        background: 'rgba(10, 22, 40, 0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0, 166, 251, 0.2)',
        padding: '1rem 2rem',
        zIndex: 1000
      }}>
        <nav style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <QuankeyLogo width={40} height={40} />
            <span style={{
              fontSize: '24px',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #00A6FB, #00D4FF)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Quankey
            </span>
          </div>
          
          <div style={{
            display: 'flex',
            gap: '2rem'
          }}>
            <a href="#product" style={{ color: '#B0BEC5', textDecoration: 'none', transition: 'color 0.3s', fontWeight: '500' }}>Product</a>
            <a href="#security" style={{ color: '#B0BEC5', textDecoration: 'none', transition: 'color 0.3s', fontWeight: '500' }}>Security</a>
            <a href="#compliance" style={{ color: '#B0BEC5', textDecoration: 'none', transition: 'color 0.3s', fontWeight: '500' }}>Compliance</a>
            <a href="#company" style={{ color: '#B0BEC5', textDecoration: 'none', transition: 'color 0.3s', fontWeight: '500' }}>Company</a>
            <a href="#docs" style={{ color: '#B0BEC5', textDecoration: 'none', transition: 'color 0.3s', fontWeight: '500' }}>Documentation</a>
            <Link 
              to="/app" 
              style={{
                background: 'linear-gradient(135deg, #00A6FB, #00D4FF)',
                color: 'white',
                padding: '10px 24px',
                borderRadius: '6px',
                textDecoration: 'none',
                fontWeight: '600',
                transition: 'transform 0.2s',
                fontSize: '14px'
              }}
            >
              Access Portal
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section style={{
        padding: '120px 2rem 80px',
        textAlign: 'center',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <h1 style={{
          fontSize: 'clamp(2.5rem, 8vw, 4.5rem)',
          fontWeight: '800',
          lineHeight: 1.1,
          marginBottom: '2rem',
          textAlign: 'center'
        }}>
          Your Passwords Will Be <span style={{ color: '#FF6B6B' }}>Worthless</span><br />
          in <span style={{ color: '#4ECDC4' }}>5 Years</span>
        </h1>
        
        <p style={{
          fontSize: '1.4rem',
          lineHeight: 1.6,
          color: '#B0BEC5',
          maxWidth: '800px',
          margin: '0 auto 3rem',
          fontWeight: '400'
        }}>
          Quantum computers will crack current encryption in seconds. Don't wait for the quantum apocalypse. 
          Secure your digital life with the world's first quantum-proof password manager.
        </p>

        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '2rem',
          marginBottom: '4rem',
          flexWrap: 'wrap'
        }}>
          <div style={{
            background: 'rgba(0, 166, 251, 0.1)',
            border: '1px solid rgba(0, 166, 251, 0.3)',
            borderRadius: '12px',
            padding: '1.5rem',
            minWidth: '200px',
            textAlign: 'center'
          }}>
            <div style={{ marginBottom: '0.5rem' }}>
              <SecurityIcon size={32} />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#00A6FB' }}>2024</div>
            <div style={{ color: '#B0BEC5' }}>SECURE</div>
          </div>
          
          <div style={{
            background: 'rgba(255, 107, 107, 0.1)',
            border: '1px solid rgba(255, 107, 107, 0.3)',
            borderRadius: '12px',
            padding: '1.5rem',
            minWidth: '200px',
            textAlign: 'center'
          }}>
            <div style={{ marginBottom: '0.5rem' }}>
              <svg width="32" height="32" viewBox="0 0 32 32">
                <path d="M16 4L8 10l8 8 8-8-8-6z" fill="#FF6B6B"/>
                <path d="M16 12l-6 6 6 6 6-6-6-6z" fill="#FF6B6B" opacity="0.7"/>
                <circle cx="16" cy="16" r="3" fill="#FFB800"/>
              </svg>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#FF6B6B' }}>2030</div>
            <div style={{ color: '#B0BEC5' }}>HACKEABLE</div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section style={{
        padding: '80px 2rem',
        background: 'rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: '700',
            textAlign: 'center',
            marginBottom: '3rem',
            color: '#FF6B6B'
          }}>
            The Quantum Threat is Real
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem',
            marginBottom: '3rem'
          }}>
            <div style={{
              background: 'rgba(255, 107, 107, 0.1)',
              border: '1px solid rgba(255, 107, 107, 0.3)',
              borderRadius: '12px',
              padding: '2rem'
            }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '600', marginBottom: '1rem', color: '#FF6B6B', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="24" height="24" viewBox="0 0 24 24">
                  <rect x="2" y="8" width="20" height="12" rx="2" stroke="#FF6B6B" strokeWidth="2" fill="none"/>
                  <path d="M6 8V6a6 6 0 0 1 12 0v2" stroke="#FF6B6B" strokeWidth="2" fill="none"/>
                  <circle cx="12" cy="14" r="2" fill="#FF6B6B"/>
                </svg>
                Financial Sector at Risk
              </h3>
              <p style={{ color: '#B0BEC5', lineHeight: 1.6 }}>
                Banks spend billions on current encryption that quantum computers will break in minutes.
              </p>
            </div>
            
            <div style={{
              background: 'rgba(255, 107, 107, 0.1)',
              border: '1px solid rgba(255, 107, 107, 0.3)',
              borderRadius: '12px',
              padding: '2rem'
            }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '600', marginBottom: '1rem', color: '#FF6B6B', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <SecurityIcon size={24} />
                Government Data Vulnerable
              </h3>
              <p style={{ color: '#B0BEC5', lineHeight: 1.6 }}>
                National security depends on encryption that won't survive the quantum revolution.
              </p>
            </div>
            
            <div style={{
              background: 'rgba(255, 107, 107, 0.1)',
              border: '1px solid rgba(255, 107, 107, 0.3)',
              borderRadius: '12px',
              padding: '2rem'
            }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '600', marginBottom: '1rem', color: '#FF6B6B', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FingerprintIcon size={24} />
                Personal Privacy Dead
              </h3>
              <p style={{ color: '#B0BEC5', lineHeight: 1.6 }}>
                Every password, every message, every secret becomes public the moment quantum computers arrive.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section style={{
        padding: '80px 2rem',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <h2 style={{
          fontSize: '2.5rem',
          fontWeight: '700',
          textAlign: 'center',
          marginBottom: '3rem',
          color: '#4ECDC4'
        }}>
          The Quantum-Proof Solution
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem'
        }}>
          <div style={{
            background: 'rgba(0, 166, 251, 0.1)',
            border: '1px solid rgba(0, 166, 251, 0.3)',
            borderRadius: '12px',
            padding: '2rem',
            textAlign: 'center'
          }}>
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
              <QuantumIcon size={48} />
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '600', marginBottom: '1rem', color: '#00A6FB' }}>
              True Quantum Entropy
            </h3>
            <p style={{ color: '#B0BEC5', lineHeight: 1.6 }}>
              Passwords generated using real quantum random number generators, not mathematical algorithms.
            </p>
          </div>
          
          <div style={{
            background: 'rgba(0, 166, 251, 0.1)',
            border: '1px solid rgba(0, 166, 251, 0.3)',
            borderRadius: '12px',
            padding: '2rem',
            textAlign: 'center'
          }}>
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
              <svg width="48" height="48" viewBox="0 0 48 48">
                <rect x="6" y="12" width="36" height="28" rx="4" stroke="#00A6FB" strokeWidth="2" fill="none"/>
                <path d="M12 12V8a12 12 0 0 1 24 0v4" stroke="#00A6FB" strokeWidth="2" fill="none"/>
                <circle cx="24" cy="26" r="4" fill="#00A6FB"/>
                <rect x="22" y="26" width="4" height="8" fill="#00A6FB"/>
              </svg>
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '600', marginBottom: '1rem', color: '#00A6FB' }}>
              Post-Quantum Cryptography
            </h3>
            <p style={{ color: '#B0BEC5', lineHeight: 1.6 }}>
              Built with NIST-approved algorithms that will survive the quantum computer revolution.
            </p>
          </div>
          
          <div style={{
            background: 'rgba(0, 166, 251, 0.1)',
            border: '1px solid rgba(0, 166, 251, 0.3)',
            borderRadius: '12px',
            padding: '2rem',
            textAlign: 'center'
          }}>
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
              <SecurityIcon size={48} />
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '600', marginBottom: '1rem', color: '#00A6FB' }}>
              Zero-Knowledge Architecture
            </h3>
            <p style={{ color: '#B0BEC5', lineHeight: 1.6 }}>
              Even we can't see your passwords. Complete privacy through mathematical impossibility.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" style={{
        padding: '80px 2rem',
        background: 'rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: '700',
            textAlign: 'center',
            marginBottom: '3rem'
          }}>
            Why Choose Quankey?
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '2rem'
          }}>
            <div style={{
              background: 'rgba(0, 166, 251, 0.1)',
              border: '1px solid rgba(0, 166, 251, 0.3)',
              borderRadius: '12px',
              padding: '2rem'
            }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1rem', color: '#00A6FB', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="#00A6FB" strokeWidth="2" fill="none"/>
                </svg>
                Instant Recovery
              </h3>
              <p style={{ color: '#B0BEC5', lineHeight: 1.6 }}>
                Recover access in 87 seconds vs 24-48 hours with competitors
              </p>
            </div>
            
            <div style={{
              background: 'rgba(0, 166, 251, 0.1)',
              border: '1px solid rgba(0, 166, 251, 0.3)',
              borderRadius: '12px',
              padding: '2rem'
            }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1rem', color: '#00A6FB', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FingerprintIcon size={20} />
                No Master Password
              </h3>
              <p style={{ color: '#B0BEC5', lineHeight: 1.6 }}>
                Biometric authentication eliminates the weakest link in security
              </p>
            </div>
            
            <div style={{
              background: 'rgba(0, 166, 251, 0.1)',
              border: '1px solid rgba(0, 166, 251, 0.3)',
              borderRadius: '12px',
              padding: '2rem'
            }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1rem', color: '#00A6FB', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="#00A6FB" strokeWidth="2" fill="none"/>
                  <path d="M8 12h8M12 8v8" stroke="#00A6FB" strokeWidth="2"/>
                </svg>
                Browser Extension
              </h3>
              <p style={{ color: '#B0BEC5', lineHeight: 1.6 }}>
                Seamless auto-fill with quantum-secured password generation
              </p>
            </div>
            
            <div style={{
              background: 'rgba(0, 166, 251, 0.1)',
              border: '1px solid rgba(0, 166, 251, 0.3)',
              borderRadius: '12px',
              padding: '2rem'
            }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1rem', color: '#00A6FB', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <SecurityIcon size={20} />
                Zero Data Loss
              </h3>
              <p style={{ color: '#B0BEC5', lineHeight: 1.6 }}>
                Guaranteed password recovery with Shamir's Secret Sharing
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Waitlist Section */}
      <section style={{
        padding: '80px 2rem',
        textAlign: 'center',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        <h2 style={{
          fontSize: '2.5rem',
          fontWeight: '700',
          marginBottom: '1rem',
          background: 'linear-gradient(135deg, #00A6FB, #00D4FF)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Join the Quantum-Safe Future
        </h2>
        
        <p style={{
          fontSize: '1.2rem',
          color: '#B0BEC5',
          marginBottom: '2rem'
        }}>
          Be among the first 1,000 users to experience quantum-proof security
        </p>

        <div style={{
          background: 'rgba(0, 166, 251, 0.1)',
          border: '1px solid rgba(0, 166, 251, 0.3)',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span style={{ color: '#B0BEC5' }}>Early Access Progress:</span>
          <span style={{ color: '#00A6FB', fontWeight: '600' }}>387 / 1000 spots taken</span>
        </div>

        <div style={{
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '8px',
          height: '8px',
          marginBottom: '3rem',
          overflow: 'hidden'
        }}>
          <div style={{
            background: 'linear-gradient(90deg, #00A6FB, #667eea)',
            height: '100%',
            width: '38.7%',
            borderRadius: '8px'
          }}></div>
        </div>

        {!isSubmitted ? (
          <form onSubmit={handleSubmit} style={{
            display: 'flex',
            gap: '1rem',
            maxWidth: '500px',
            margin: '0 auto',
            flexWrap: 'wrap'
          }}>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              placeholder="Enter your email address"
              required
              style={{
                flex: 1,
                minWidth: '250px',
                padding: '1rem',
                border: '1px solid rgba(0, 166, 251, 0.3)',
                borderRadius: '8px',
                background: 'rgba(0, 0, 0, 0.3)',
                color: 'white',
                fontSize: '1rem'
              }}
            />
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '1rem 2rem',
                background: 'linear-gradient(135deg, #00A6FB, #00D4FF)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1
              }}
            >
              {isSubmitting ? 'Joining...' : 'Join Waitlist'}
            </button>
          </form>
        ) : (
          <div style={{
            background: 'rgba(0, 166, 251, 0.1)',
            border: '1px solid rgba(0, 166, 251, 0.3)',
            borderRadius: '12px',
            padding: '2rem'
          }}>
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
              <QuankeyLogo width={48} height={48} />
            </div>
            <h3 style={{ color: '#00A6FB', marginBottom: '1rem' }}>Welcome to the Future!</h3>
            <p style={{ color: '#B0BEC5' }}>
              You're now on the priority list for quantum-proof security. We'll notify you when access is available.
            </p>
          </div>
        )}
      </section>

      {/* FAQ Section */}
      <section id="faq" style={{
        padding: '80px 2rem',
        background: 'rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: '700',
            textAlign: 'center',
            marginBottom: '3rem'
          }}>
            Frequently Asked Questions
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <details style={{
              background: 'rgba(0, 166, 251, 0.1)',
              border: '1px solid rgba(0, 166, 251, 0.3)',
              borderRadius: '12px',
              padding: '1.5rem'
            }}>
              <summary style={{
                fontSize: '1.2rem',
                fontWeight: '600',
                color: '#00A6FB',
                cursor: 'pointer',
                marginBottom: '1rem'
              }}>
                When will quantum computers break current encryption?
              </summary>
              <p style={{ color: '#B0BEC5', lineHeight: 1.6 }}>
                Current estimates suggest that large-scale quantum computers capable of breaking RSA and AES encryption will be available within 10-15 years. However, the "quantum supremacy" moment could happen suddenly, leaving unprepared systems vulnerable overnight.
              </p>
            </details>
            
            <details style={{
              background: 'rgba(0, 166, 251, 0.1)',
              border: '1px solid rgba(0, 166, 251, 0.3)',
              borderRadius: '12px',
              padding: '1.5rem'
            }}>
              <summary style={{
                fontSize: '1.2rem',
                fontWeight: '600',
                color: '#00A6FB',
                cursor: 'pointer',
                marginBottom: '1rem'
              }}>
                How is Quankey different from other password managers?
              </summary>
              <p style={{ color: '#B0BEC5', lineHeight: 1.6 }}>
                Quankey is built from the ground up with post-quantum cryptography, true quantum entropy, and zero-knowledge architecture. While others will need complete rebuilds to survive quantum computers, Quankey is already quantum-proof.
              </p>
            </details>
            
            <details style={{
              background: 'rgba(0, 166, 251, 0.1)',
              border: '1px solid rgba(0, 166, 251, 0.3)',
              borderRadius: '12px',
              padding: '1.5rem'
            }}>
              <summary style={{
                fontSize: '1.2rem',
                fontWeight: '600',
                color: '#00A6FB',
                cursor: 'pointer',
                marginBottom: '1rem'
              }}>
                What is true quantum entropy?
              </summary>
              <p style={{ color: '#B0BEC5', lineHeight: 1.6 }}>
                Unlike traditional random number generators that use mathematical algorithms, quantum entropy comes from truly random quantum mechanical processes. This provides passwords that are mathematically impossible to predict or crack.
              </p>
            </details>
            
            <details style={{
              background: 'rgba(0, 166, 251, 0.1)',
              border: '1px solid rgba(0, 166, 251, 0.3)',
              borderRadius: '12px',
              padding: '1.5rem'
            }}>
              <summary style={{
                fontSize: '1.2rem',
                fontWeight: '600',
                color: '#00A6FB',
                cursor: 'pointer',
                marginBottom: '1rem'
              }}>
                Is my data safe if Quankey gets hacked?
              </summary>
              <p style={{ color: '#B0BEC5', lineHeight: 1.6 }}>
                Yes. Our zero-knowledge architecture means we never have access to your unencrypted passwords. Even if our servers were compromised, attackers would only find encrypted data that's impossible to decrypt without your biometric authentication.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '3rem 2rem 1rem',
        borderTop: '1px solid rgba(0, 166, 251, 0.2)',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            marginBottom: '2rem'
          }}>
            <QuankeyLogo width={40} height={40} />
            <span style={{
              fontSize: '24px',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #00A6FB, #00D4FF)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Quankey
            </span>
          </div>
          
          <p style={{ color: '#B0BEC5', marginBottom: '1rem' }}>
            The world's first quantum-proof password manager
          </p>
          
          <p style={{ color: '#666', fontSize: '0.9rem' }}>
            © 2024 Quankey. Securing the future, today.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;