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

// Professional Military Icons
const SecurityIcon: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48">
    <path d="M24 4L8 12v8c0 8.84 6.78 17.12 16 18.96C33.22 37.12 40 28.84 40 20v-8L24 4z" stroke="#00A6FB" strokeWidth="2" fill="none"/>
    <path d="M18 24l4 4 8-8" stroke="#00A6FB" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

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

const FingerprintIcon: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48">
    <circle cx="24" cy="24" r="4" stroke="#00A6FB" strokeWidth="2" fill="none"/>
    <path d="M24 12a12 12 0 0 1 12 12" stroke="#00A6FB" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <path d="M24 16a8 8 0 0 1 8 8" stroke="#00A6FB" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <path d="M24 12a12 12 0 0 0-12 12" stroke="#00A6FB" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <path d="M24 16a8 8 0 0 0-8 8" stroke="#00A6FB" strokeWidth="2" fill="none" strokeLinecap="round"/>
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

const PentagonIcon: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M12 2L2 8v8l10 6 10-6V8L12 2z" stroke="#00A6FB" strokeWidth="1.5" fill="none"/>
    <path d="M12 2v20M2 8l10 6 10-6" stroke="#00A6FB" strokeWidth="1.5" fill="none"/>
  </svg>
);

const ProfessionalLandingPage: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
      const response = await fetch(`${API_URL}/api/demo-request`, {
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
      background: 'linear-gradient(135deg, #0A1628 0%, #1E3A5F 50%, #0A1628 100%)',
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
          maxWidth: '1400px',
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
          
          {/* Desktop Menu */}
          <div style={{
            display: 'flex',
            gap: '2rem',
            alignItems: 'center'
          }} className="hidden md:flex">
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
                fontSize: '14px'
              }}
            >
              Access Portal
            </Link>
          </div>
          
          {/* 🔴 FIX: Mobile Hamburger Menu */}
          <div className="md:hidden">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                color: '#00A6FB',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '8px'
              }}
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
          
          {/* Mobile Menu Overlay */}
          {mobileMenuOpen && (
            <div 
              style={{
                position: 'fixed',
                top: '80px',
                left: 0,
                right: 0,
                background: 'rgba(10, 22, 40, 0.98)',
                backdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(0, 166, 251, 0.2)',
                zIndex: 999,
                padding: '2rem'
              }}
              className="md:hidden"
            >
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
                alignItems: 'center'
              }}>
                <a href="#product" style={{ color: '#B0BEC5', textDecoration: 'none', fontSize: '18px', fontWeight: '500' }}>Product</a>
                <a href="#security" style={{ color: '#B0BEC5', textDecoration: 'none', fontSize: '18px', fontWeight: '500' }}>Security</a>
                <a href="#compliance" style={{ color: '#B0BEC5', textDecoration: 'none', fontSize: '18px', fontWeight: '500' }}>Compliance</a>
                <a href="#company" style={{ color: '#B0BEC5', textDecoration: 'none', fontSize: '18px', fontWeight: '500' }}>Company</a>
                <a href="#docs" style={{ color: '#B0BEC5', textDecoration: 'none', fontSize: '18px', fontWeight: '500' }}>Documentation</a>
                <Link 
                  to="/app" 
                  style={{
                    background: 'linear-gradient(135deg, #00A6FB, #00D4FF)',
                    color: 'white',
                    padding: '12px 32px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontWeight: '600',
                    fontSize: '18px',
                    marginTop: '1rem'
                  }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Access Portal
                </Link>
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* Hero Section - PROFESSIONAL */}
      <section style={{
        padding: '140px 2rem 100px',
        textAlign: 'center',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {/* NIST Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          background: 'rgba(0, 255, 136, 0.1)',
          border: '1px solid rgba(0, 255, 136, 0.3)',
          borderRadius: '24px',
          padding: '8px 16px',
          marginBottom: '2rem',
          fontSize: '14px',
          fontWeight: '600',
          color: '#00FF88'
        }}>
          <SecurityIcon size={20} />
          <span style={{ marginLeft: '8px' }}>NIST Standards Aligned</span>
        </div>

        <h1 style={{
          fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
          fontWeight: '700',
          lineHeight: 1.2,
          marginBottom: '1.5rem',
          color: '#ffffff'
        }}>
          Quantum-Ready Password Security
        </h1>
        
        <p style={{
          fontSize: '1.25rem',
          lineHeight: 1.6,
          color: '#B0BEC5',
          maxWidth: '800px',
          margin: '0 auto 3rem',
          fontWeight: '400'
        }}>
          Military-grade quantum encryption that eliminates passwords forever.<br />
          Trusted by defense contractors and financial institutions.
        </p>

        {/* Trusted By Logos */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '3rem',
          marginBottom: '3rem',
          flexWrap: 'wrap'
        }}>
          <span style={{ color: '#8B8CA5', fontSize: '14px', fontWeight: '500' }}>Trusted by:</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#B0BEC5' }}>
            <PentagonIcon size={20} />
            <span style={{ fontSize: '14px', fontWeight: '500' }}>Defense</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#B0BEC5' }}>
            <SecurityIcon size={20} />
            <span style={{ fontSize: '14px', fontWeight: '500' }}>Healthcare</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#B0BEC5' }}>
            <ComplianceIcon size={20} />
            <span style={{ fontSize: '14px', fontWeight: '500' }}>Finance</span>
          </div>
        </div>

        {/* Video Demo Placeholder */}
        <div style={{
          maxWidth: '900px',
          margin: '0 auto',
          background: 'rgba(30, 58, 95, 0.3)',
          border: '1px solid rgba(0, 166, 251, 0.2)',
          borderRadius: '12px',
          padding: '3rem',
          textAlign: 'center'
        }}>
          <QuankeyLogo width={80} height={80} />
          <h3 style={{ color: '#00A6FB', marginTop: '1rem', marginBottom: '0.5rem' }}>Professional Demo Video</h3>
          <p style={{ color: '#8B8CA5', fontSize: '14px' }}>Watch how military-grade security works in practice</p>
        </div>
      </section>

      {/* How It Works Section - NEW */}
      <section id="product" style={{
        padding: '100px 2rem',
        background: 'rgba(0, 0, 0, 0.2)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: '3rem',
            fontWeight: '700',
            textAlign: 'center',
            marginBottom: '4rem',
            color: '#ffffff'
          }}>
            How It Works
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '3rem'
          }}>
            <div style={{
              background: 'rgba(30, 58, 95, 0.5)',
              border: '1px solid rgba(0, 166, 251, 0.2)',
              borderRadius: '16px',
              padding: '2.5rem',
              textAlign: 'center'
            }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <FingerprintIcon size={64} />
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: '#00A6FB' }}>
                1. Biometric Registration
              </h3>
              <p style={{ color: '#B0BEC5', lineHeight: 1.6, fontSize: '1.1rem' }}>
                Your fingerprint becomes your key - no passwords to remember or steal
              </p>
            </div>
            
            <div style={{
              background: 'rgba(30, 58, 95, 0.5)',
              border: '1px solid rgba(0, 166, 251, 0.2)',
              borderRadius: '16px',
              padding: '2.5rem',
              textAlign: 'center'
            }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <QuantumIcon size={64} />
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: '#00A6FB' }}>
                2. Quantum Generation
              </h3>
              <p style={{ color: '#B0BEC5', lineHeight: 1.6, fontSize: '1.1rem' }}>
                Every password is generated using true quantum randomness from verified sources
              </p>
            </div>
            
            <div style={{
              background: 'rgba(30, 58, 95, 0.5)',
              border: '1px solid rgba(0, 166, 251, 0.2)',
              borderRadius: '16px',
              padding: '2.5rem',
              textAlign: 'center'
            }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <RotationIcon size={64} />
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: '#00A6FB' }}>
                3. Automatic Rotation
              </h3>
              <p style={{ color: '#B0BEC5', lineHeight: 1.6, fontSize: '1.1rem' }}>
                Passwords change automatically every 30 days - hackers can't keep up
              </p>
            </div>
            
            <div style={{
              background: 'rgba(30, 58, 95, 0.5)',
              border: '1px solid rgba(0, 166, 251, 0.2)',
              borderRadius: '16px',
              padding: '2.5rem',
              textAlign: 'center'
            }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <SecurityIcon size={64} />
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: '#00A6FB' }}>
                4. Zero-Knowledge Recovery
              </h3>
              <p style={{ color: '#B0BEC5', lineHeight: 1.6, fontSize: '1.1rem' }}>
                Recover your account in under 2 minutes without any master password
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security Features Section - EXPANDED */}
      <section id="security" style={{
        padding: '100px 2rem',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        <h2 style={{
          fontSize: '3rem',
          fontWeight: '700',
          textAlign: 'center',
          marginBottom: '4rem',
          color: '#ffffff'
        }}>
          Security Features
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '2rem'
        }}>
          <div style={{
            background: 'rgba(30, 58, 95, 0.3)',
            border: '1px solid rgba(0, 166, 251, 0.2)',
            borderRadius: '12px',
            padding: '2rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <QuantumIcon size={32} />
              <h3 style={{ fontSize: '1.3rem', fontWeight: '600', color: '#00A6FB', margin: 0 }}>
                Post-Quantum Encryption
              </h3>
            </div>
            <p style={{ color: '#B0BEC5', lineHeight: 1.6, marginBottom: '0.5rem' }}>
              CRYSTALS-Kyber ready
            </p>
            <p style={{ color: '#8B8CA5', fontSize: '0.9rem' }}>
              Survives quantum computer attacks
            </p>
          </div>

          <div style={{
            background: 'rgba(30, 58, 95, 0.3)',
            border: '1px solid rgba(0, 166, 251, 0.2)',
            borderRadius: '12px',
            padding: '2rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <FingerprintIcon size={32} />
              <h3 style={{ fontSize: '1.3rem', fontWeight: '600', color: '#00A6FB', margin: 0 }}>
                Zero Master Password
              </h3>
            </div>
            <p style={{ color: '#B0BEC5', lineHeight: 1.6, marginBottom: '0.5rem' }}>
              Nothing to steal or forget
            </p>
            <p style={{ color: '#8B8CA5', fontSize: '0.9rem' }}>
              Biometric-only access
            </p>
          </div>

          <div style={{
            background: 'rgba(30, 58, 95, 0.3)',
            border: '1px solid rgba(0, 166, 251, 0.2)',
            borderRadius: '12px',
            padding: '2rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <RotationIcon size={32} />
              <h3 style={{ fontSize: '1.3rem', fontWeight: '600', color: '#00A6FB', margin: 0 }}>
                Automatic Password Rotation
              </h3>
            </div>
            <p style={{ color: '#B0BEC5', lineHeight: 1.6, marginBottom: '0.5rem' }}>
              Changes every 30 days
            </p>
            <p style={{ color: '#8B8CA5', fontSize: '0.9rem' }}>
              Old passwords auto-expire
            </p>
          </div>

          <div style={{
            background: 'rgba(30, 58, 95, 0.3)',
            border: '1px solid rgba(0, 166, 251, 0.2)',
            borderRadius: '12px',
            padding: '2rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <HSMIcon size={32} />
              <h3 style={{ fontSize: '1.3rem', fontWeight: '600', color: '#00A6FB', margin: 0 }}>
                Hardware Security Module
              </h3>
            </div>
            <p style={{ color: '#B0BEC5', lineHeight: 1.6, marginBottom: '0.5rem' }}>
              Keys stored in secure enclave
            </p>
            <p style={{ color: '#8B8CA5', fontSize: '0.9rem' }}>
              Tamper-proof protection
            </p>
          </div>

          <div style={{
            background: 'rgba(30, 58, 95, 0.3)',
            border: '1px solid rgba(0, 166, 251, 0.2)',
            borderRadius: '12px',
            padding: '2rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <ComplianceIcon size={32} />
              <h3 style={{ fontSize: '1.3rem', fontWeight: '600', color: '#00A6FB', margin: 0 }}>
                Compliance Ready
              </h3>
            </div>
            <p style={{ color: '#B0BEC5', lineHeight: 1.6, marginBottom: '0.5rem' }}>
              HIPAA, SOC2, GDPR
            </p>
            <p style={{ color: '#8B8CA5', fontSize: '0.9rem' }}>
              Audit logs included
            </p>
          </div>

          <div style={{
            background: 'rgba(30, 58, 95, 0.3)',
            border: '1px solid rgba(0, 166, 251, 0.2)',
            borderRadius: '12px',
            padding: '2rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <InstantRevokeIcon size={32} />
              <h3 style={{ fontSize: '1.3rem', fontWeight: '600', color: '#00A6FB', margin: 0 }}>
                Instant Revocation
              </h3>
            </div>
            <p style={{ color: '#B0BEC5', lineHeight: 1.6, marginBottom: '0.5rem' }}>
              Disable access in &lt;60 seconds
            </p>
            <p style={{ color: '#8B8CA5', fontSize: '0.9rem' }}>
              Remote wipe capability
            </p>
          </div>
        </div>
      </section>

      {/* Comparison Table - NEW */}
      <section style={{
        padding: '100px 2rem',
        background: 'rgba(0, 0, 0, 0.2)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: '3rem',
            fontWeight: '700',
            textAlign: 'center',
            marginBottom: '4rem',
            color: '#ffffff'
          }}>
            How We Compare
          </h2>
          
          <div style={{
            background: 'rgba(30, 58, 95, 0.3)',
            border: '1px solid rgba(0, 166, 251, 0.2)',
            borderRadius: '12px',
            overflow: 'hidden'
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '14px'
            }}>
              <thead>
                <tr style={{ background: 'rgba(0, 166, 251, 0.1)' }}>
                  <th style={{ padding: '1.5rem', textAlign: 'left', color: '#ffffff', fontWeight: '600' }}>Feature</th>
                  <th style={{ padding: '1.5rem', textAlign: 'center', color: '#8B8CA5', fontWeight: '600' }}>Traditional Managers</th>
                  <th style={{ padding: '1.5rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <QuankeyLogo width={32} height={32} />
                      <span style={{ color: '#00A6FB', fontWeight: '700', fontSize: '18px' }}>Quankey</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid rgba(0, 166, 251, 0.1)' }}>
                  <td style={{ padding: '1.5rem', color: '#B0BEC5', fontWeight: '500' }}>Quantum-Proof</td>
                  <td style={{ padding: '1.5rem', textAlign: 'center', color: '#FF3B30' }}>❌ Vulnerable by 2030</td>
                  <td style={{ padding: '1.5rem', textAlign: 'center', color: '#00FF88' }}>✅ Ready Today</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(0, 166, 251, 0.1)' }}>
                  <td style={{ padding: '1.5rem', color: '#B0BEC5', fontWeight: '500' }}>Master Password</td>
                  <td style={{ padding: '1.5rem', textAlign: 'center', color: '#FF3B30' }}>❌ Single point of failure</td>
                  <td style={{ padding: '1.5rem', textAlign: 'center', color: '#00FF88' }}>✅ None needed</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(0, 166, 251, 0.1)' }}>
                  <td style={{ padding: '1.5rem', color: '#B0BEC5', fontWeight: '500' }}>Password Generation</td>
                  <td style={{ padding: '1.5rem', textAlign: 'center', color: '#FF3B30' }}>❌ Pseudo-random</td>
                  <td style={{ padding: '1.5rem', textAlign: 'center', color: '#00FF88' }}>✅ True quantum entropy</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(0, 166, 251, 0.1)' }}>
                  <td style={{ padding: '1.5rem', color: '#B0BEC5', fontWeight: '500' }}>Biometric Revocation</td>
                  <td style={{ padding: '1.5rem', textAlign: 'center', color: '#FF3B30' }}>❌ Permanent vulnerability</td>
                  <td style={{ padding: '1.5rem', textAlign: 'center', color: '#00FF88' }}>✅ Instant revoke & replace</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(0, 166, 251, 0.1)' }}>
                  <td style={{ padding: '1.5rem', color: '#B0BEC5', fontWeight: '500' }}>Compliance</td>
                  <td style={{ padding: '1.5rem', textAlign: 'center', color: '#FF3B30' }}>❌ Basic</td>
                  <td style={{ padding: '1.5rem', textAlign: 'center', color: '#00FF88' }}>✅ Military-grade</td>
                </tr>
                <tr>
                  <td style={{ padding: '1.5rem', color: '#B0BEC5', fontWeight: '500' }}>Recovery Time</td>
                  <td style={{ padding: '1.5rem', textAlign: 'center', color: '#FF3B30' }}>❌ 24-48 hours</td>
                  <td style={{ padding: '1.5rem', textAlign: 'center', color: '#00FF88' }}>✅ &lt;2 minutes</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Sector-Specific Section - NEW */}
      <section id="compliance" style={{
        padding: '100px 2rem',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        <h2 style={{
          fontSize: '3rem',
          fontWeight: '700',
          textAlign: 'center',
          marginBottom: '2rem',
          color: '#ffffff'
        }}>
          Industry Solutions
        </h2>
        
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '1rem',
          marginBottom: '3rem',
          flexWrap: 'wrap'
        }}>
          {['defense', 'healthcare', 'financial', 'enterprise'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: activeTab === tab ? 'linear-gradient(135deg, #00A6FB, #00D4FF)' : 'transparent',
                border: '1px solid rgba(0, 166, 251, 0.3)',
                color: activeTab === tab ? 'white' : '#B0BEC5',
                padding: '12px 24px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {tab === 'defense' ? 'Defense & Government' : tab}
            </button>
          ))}
        </div>

        {activeTab === 'defense' && (
          <div style={{
            background: 'rgba(30, 58, 95, 0.3)',
            border: '1px solid rgba(0, 166, 251, 0.2)',
            borderRadius: '12px',
            padding: '3rem',
            textAlign: 'center'
          }}>
            <PentagonIcon size={48} />
            <h3 style={{ color: '#00A6FB', fontSize: '1.8rem', margin: '1rem 0' }}>Defense & Government Ready</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1.5rem',
              marginTop: '2rem'
            }}>
              <div>
                <h4 style={{ color: '#B0BEC5', fontSize: '1.1rem', marginBottom: '0.5rem' }}>NIST 800-171 Framework Ready</h4>
                <p style={{ color: '#8B8CA5', fontSize: '0.9rem' }}>Meets all CUI protection requirements</p>
              </div>
              <div>
                <h4 style={{ color: '#B0BEC5', fontSize: '1.1rem', marginBottom: '0.5rem' }}>CMMC 2.0 Ready</h4>
                <p style={{ color: '#8B8CA5', fontSize: '0.9rem' }}>Level 3 certification pathway</p>
              </div>
              <div>
                <h4 style={{ color: '#B0BEC5', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Air-gapped deployment available</h4>
                <p style={{ color: '#8B8CA5', fontSize: '0.9rem' }}>Complete network isolation</p>
              </div>
              <div>
                <h4 style={{ color: '#B0BEC5', fontSize: '1.1rem', marginBottom: '0.5rem' }}>CAC/PIV integration</h4>
                <p style={{ color: '#8B8CA5', fontSize: '0.9rem' }}>Smart card authentication support</p>
              </div>
            </div>
          </div>
        )}

        {/* Healthcare Tab */}
        {activeTab === 'healthcare' && (
          <div style={{
            background: 'rgba(30, 58, 95, 0.3)',
            border: '1px solid rgba(0, 166, 251, 0.2)',
            borderRadius: '12px',
            padding: '3rem',
            textAlign: 'center'
          }}>
            <SecurityIcon size={48} />
            <h3 style={{ color: '#00A6FB', fontSize: '1.8rem', margin: '1rem 0' }}>Healthcare Security Excellence</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1.5rem',
              marginTop: '2rem'
            }}>
              <div>
                <h4 style={{ color: '#B0BEC5', fontSize: '1.1rem', marginBottom: '0.5rem' }}>HIPAA Framework Ready</h4>
                <p style={{ color: '#8B8CA5', fontSize: '0.9rem' }}>Full ePHI protection with audit trails</p>
              </div>
              <div>
                <h4 style={{ color: '#B0BEC5', fontSize: '1.1rem', marginBottom: '0.5rem' }}>GDPR & PHIPA Ready</h4>
                <p style={{ color: '#8B8CA5', fontSize: '0.9rem' }}>Global privacy compliance built-in</p>
              </div>
              <div>
                <h4 style={{ color: '#B0BEC5', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Zero-Trust Architecture</h4>
                <p style={{ color: '#8B8CA5', fontSize: '0.9rem' }}>Patient data never exposed</p>
              </div>
            </div>
          </div>
        )}

        {/* Financial Tab */}
        {activeTab === 'financial' && (
          <div style={{
            background: 'rgba(30, 58, 95, 0.3)',
            border: '1px solid rgba(0, 166, 251, 0.2)',
            borderRadius: '12px',
            padding: '3rem',
            textAlign: 'center'
          }}>
            <ComplianceIcon size={48} />
            <h3 style={{ color: '#00A6FB', fontSize: '1.8rem', margin: '1rem 0' }}>Financial Grade Protection</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1.5rem',
              marginTop: '2rem'
            }}>
              <div>
                <h4 style={{ color: '#B0BEC5', fontSize: '1.1rem', marginBottom: '0.5rem' }}>SOX Framework Ready</h4>
                <p style={{ color: '#8B8CA5', fontSize: '0.9rem' }}>Full audit trail for financial systems</p>
              </div>
              <div>
                <h4 style={{ color: '#B0BEC5', fontSize: '1.1rem', marginBottom: '0.5rem' }}>PCI DSS Ready</h4>
                <p style={{ color: '#8B8CA5', fontSize: '0.9rem' }}>Secure payment system access</p>
              </div>
              <div>
                <h4 style={{ color: '#B0BEC5', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Basel III Aligned</h4>
                <p style={{ color: '#8B8CA5', fontSize: '0.9rem' }}>Risk management compliance</p>
              </div>
            </div>
          </div>
        )}

        {/* Enterprise Tab */}
        {activeTab === 'enterprise' && (
          <div style={{
            background: 'rgba(30, 58, 95, 0.3)',
            border: '1px solid rgba(0, 166, 251, 0.2)',
            borderRadius: '12px',
            padding: '3rem',
            textAlign: 'center'
          }}>
            <ComplianceIcon size={48} />
            <h3 style={{ color: '#00A6FB', fontSize: '1.8rem', margin: '1rem 0' }}>Enterprise Scale Security</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1.5rem',
              marginTop: '2rem'
            }}>
              <div>
                <h4 style={{ color: '#B0BEC5', fontSize: '1.1rem', marginBottom: '0.5rem' }}>SSO/SAML Integration</h4>
                <p style={{ color: '#8B8CA5', fontSize: '0.9rem' }}>Works with your identity provider</p>
              </div>
              <div>
                <h4 style={{ color: '#B0BEC5', fontSize: '1.1rem', marginBottom: '0.5rem' }}>ISO 27001 Framework Ready</h4>
                <p style={{ color: '#8B8CA5', fontSize: '0.9rem' }}>Information security management</p>
              </div>
              <div>
                <h4 style={{ color: '#B0BEC5', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Unlimited Users</h4>
                <p style={{ color: '#8B8CA5', fontSize: '0.9rem' }}>Scale without limits</p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Proof Points Section - NEW */}
      <section style={{
        padding: '100px 2rem',
        background: 'rgba(0, 0, 0, 0.2)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '3rem',
            textAlign: 'center'
          }}>
            <div>
              <div style={{ fontSize: '3rem', fontWeight: '700', color: '#00A6FB', marginBottom: '0.5rem' }}>
                256-bit
              </div>
              <p style={{ color: '#B0BEC5', fontSize: '1.1rem' }}>AES encryption</p>
            </div>
            <div>
              <div style={{ fontSize: '3rem', fontWeight: '700', color: '#00A6FB', marginBottom: '0.5rem' }}>
                99.99%
              </div>
              <p style={{ color: '#B0BEC5', fontSize: '1.1rem' }}>uptime SLA</p>
            </div>
            <div>
              <div style={{ fontSize: '3rem', fontWeight: '700', color: '#00A6FB', marginBottom: '0.5rem' }}>
                &lt;50ms
              </div>
              <p style={{ color: '#B0BEC5', fontSize: '1.1rem' }}>response time</p>
            </div>
            <div>
              <div style={{ fontSize: '3rem', fontWeight: '700', color: '#00FF88', marginBottom: '0.5rem' }}>
                Zero
              </div>
              <p style={{ color: '#B0BEC5', fontSize: '1.1rem' }}>breaches since inception</p>
            </div>
          </div>
        </div>
      </section>

      {/* Quantum vs Traditional Comparison */}
      <section style={{
        padding: '100px 2rem',
        background: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: '3rem',
            fontWeight: '700',
            textAlign: 'center',
            marginBottom: '3rem',
            color: '#ffffff'
          }}>
            Quantum Computer Cracking Time
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem',
            marginBottom: '3rem'
          }}>
            {/* Traditional Passwords */}
            <div style={{
              background: 'rgba(255, 59, 48, 0.1)',
              border: '2px solid rgba(255, 59, 48, 0.3)',
              borderRadius: '12px',
              padding: '2rem',
              textAlign: 'center'
            }}>
              <h3 style={{ color: '#FF3B30', fontSize: '1.5rem', marginBottom: '1rem' }}>Traditional Passwords</h3>
              <div style={{ fontSize: '3rem', fontWeight: '700', color: '#FF3B30', marginBottom: '1rem' }}>
                0.002s
              </div>
              <p style={{ color: '#B0BEC5', fontSize: '1rem', marginBottom: '1.5rem' }}>
                8-character password with special characters
              </p>
              <div style={{ fontSize: '0.9rem', color: '#8B8CA5' }}>
                ⚡ RSA-2048 encryption: <strong style={{ color: '#FF3B30' }}>8 hours</strong><br />
                ⚡ AES-256: <strong style={{ color: '#FF3B30' }}>2.61 billion years → 1 day</strong>
              </div>
            </div>

            {/* Quankey Protection */}
            <div style={{
              background: 'rgba(0, 255, 136, 0.1)',
              border: '2px solid rgba(0, 255, 136, 0.3)',
              borderRadius: '12px',
              padding: '2rem',
              textAlign: 'center'
            }}>
              <h3 style={{ color: '#00FF88', fontSize: '1.5rem', marginBottom: '1rem' }}>Quankey Protection</h3>
              <div style={{ fontSize: '3rem', fontWeight: '700', color: '#00FF88', marginBottom: '1rem' }}>
                ∞
              </div>
              <p style={{ color: '#B0BEC5', fontSize: '1rem', marginBottom: '1.5rem' }}>
                Post-quantum cryptography with quantum entropy
              </p>
              <div style={{ fontSize: '0.9rem', color: '#8B8CA5' }}>
                🛡️ CRYSTALS-Kyber: <strong style={{ color: '#00FF88' }}>Quantum-resistant</strong><br />
                🛡️ True quantum entropy: <strong style={{ color: '#00FF88' }}>Unbreakable</strong>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div style={{
            background: 'rgba(30, 58, 95, 0.3)',
            border: '1px solid rgba(0, 166, 251, 0.2)',
            borderRadius: '12px',
            padding: '2rem'
          }}>
            <h3 style={{ color: '#00A6FB', fontSize: '1.5rem', marginBottom: '2rem', textAlign: 'center' }}>
              Quantum Computer Timeline
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1.5rem',
              textAlign: 'center'
            }}>
              <div>
                <div style={{ color: '#FF3B30', fontSize: '1.2rem', fontWeight: '600' }}>2024</div>
                <p style={{ color: '#B0BEC5', fontSize: '0.9rem' }}>IBM 1,000+ qubit systems</p>
              </div>
              <div>
                <div style={{ color: '#FFB800', fontSize: '1.2rem', fontWeight: '600' }}>2029</div>
                <p style={{ color: '#B0BEC5', fontSize: '0.9rem' }}>RSA-2048 cracking capability</p>
              </div>
              <div>
                <div style={{ color: '#FF3B30', fontSize: '1.2rem', fontWeight: '600' }}>2033</div>
                <p style={{ color: '#B0BEC5', fontSize: '0.9rem' }}>All current encryption broken</p>
              </div>
              <div>
                <div style={{ color: '#00FF88', fontSize: '1.2rem', fontWeight: '600' }}>TODAY</div>
                <p style={{ color: '#B0BEC5', fontSize: '0.9rem' }}>Quankey protection ready</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Request Demo Section - PROFESSIONAL */}
      <section style={{
        padding: '100px 2rem',
        textAlign: 'center',
        maxWidth: '1000px',
        margin: '0 auto'
      }}>
        <h2 style={{
          fontSize: '3rem',
          fontWeight: '700',
          marginBottom: '1rem',
          color: '#ffffff'
        }}>
          Request Early Access
        </h2>
        
        <p style={{
          fontSize: '1.2rem',
          color: '#B0BEC5',
          marginBottom: '3rem'
        }}>
          Join defense contractors and financial institutions already securing their infrastructure
        </p>

        {!isSubmitted ? (
          <form onSubmit={handleSubmit} style={{
            background: 'rgba(30, 58, 95, 0.3)',
            border: '1px solid rgba(0, 166, 251, 0.2)',
            borderRadius: '12px',
            padding: '3rem',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Work Email *"
                required
                style={{
                  padding: '1rem',
                  border: '1px solid rgba(0, 166, 251, 0.3)',
                  borderRadius: '6px',
                  background: 'rgba(10, 22, 40, 0.5)',
                  color: 'white',
                  fontSize: '1rem'
                }}
              />
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleInputChange}
                placeholder="Company *"
                required
                style={{
                  padding: '1rem',
                  border: '1px solid rgba(0, 166, 251, 0.3)',
                  borderRadius: '6px',
                  background: 'rgba(10, 22, 40, 0.5)',
                  color: 'white',
                  fontSize: '1rem'
                }}
              />
              <select
                name="sector"
                value={formData.sector}
                onChange={handleInputChange}
                required
                style={{
                  padding: '1rem',
                  border: '1px solid rgba(0, 166, 251, 0.3)',
                  borderRadius: '6px',
                  background: 'rgba(10, 22, 40, 0.5)',
                  color: 'white',
                  fontSize: '1rem'
                }}
              >
                <option value="">Select Sector *</option>
                <option value="defense">Defense & Government</option>
                <option value="healthcare">Healthcare</option>
                <option value="financial">Financial Services</option>
                <option value="enterprise">Enterprise</option>
                <option value="other">Other</option>
              </select>
              <input
                type="text"
                name="users"
                value={formData.users}
                onChange={handleInputChange}
                placeholder="Number of Users"
                style={{
                  padding: '1rem',
                  border: '1px solid rgba(0, 166, 251, 0.3)',
                  borderRadius: '6px',
                  background: 'rgba(10, 22, 40, 0.5)',
                  color: 'white',
                  fontSize: '1rem'
                }}
              />
              <select
                name="source"
                value={formData.source}
                onChange={handleInputChange}
                style={{
                  padding: '1rem',
                  border: '1px solid rgba(0, 166, 251, 0.3)',
                  borderRadius: '6px',
                  background: 'rgba(10, 22, 40, 0.5)',
                  color: 'white',
                  fontSize: '1rem'
                }}
              >
                <option value="">How did you hear about us?</option>
                <option value="colleague">Colleague referral</option>
                <option value="conference">Industry conference</option>
                <option value="search">Web search</option>
                <option value="linkedin">LinkedIn</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                marginTop: '2rem',
                padding: '1rem 3rem',
                background: 'linear-gradient(135deg, #00A6FB, #00D4FF)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1
              }}
            >
              {isSubmitting ? 'Submitting...' : 'Request Demo'}
            </button>
          </form>
        ) : (
          <div style={{
            background: 'rgba(0, 255, 136, 0.1)',
            border: '1px solid rgba(0, 255, 136, 0.3)',
            borderRadius: '12px',
            padding: '3rem',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            <QuankeyLogo width={64} height={64} />
            <h3 style={{ color: '#00FF88', marginTop: '1rem', marginBottom: '1rem' }}>Demo Request Received</h3>
            <p style={{ color: '#B0BEC5' }}>
              Our security team will contact you within 24 hours to schedule a personalized demonstration.
            </p>
          </div>
        )}
      </section>

      {/* Professional FAQ Section */}
      <section id="faq" style={{
        padding: '100px 2rem',
        background: 'rgba(0, 0, 0, 0.2)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: '3rem',
            fontWeight: '700',
            textAlign: 'center',
            marginBottom: '4rem',
            color: '#ffffff'
          }}>
            Technical FAQ
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <details style={{
              background: 'rgba(30, 58, 95, 0.3)',
              border: '1px solid rgba(0, 166, 251, 0.2)',
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
                How does biometric revocation work?
              </summary>
              <p style={{ color: '#B0BEC5', lineHeight: 1.6 }}>
                When a biometric is compromised, our quantum key derivation system instantly generates new cryptographic keys from a fresh biometric enrollment. The old keys become mathematically invalid across all systems within 60 seconds, with zero downtime.
              </p>
            </details>
            
            <details style={{
              background: 'rgba(30, 58, 95, 0.3)',
              border: '1px solid rgba(0, 166, 251, 0.2)',
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
                What certifications do you have?
              </summary>
              <p style={{ color: '#B0BEC5', lineHeight: 1.6 }}>
                We have built compliance-ready architecture following SOC 2, NIST 800-171 frameworks, and are preparing for FIPS 140-2 Level 3 assessment. Our quantum cryptography implementations follow NIST post-quantum cryptography standards and we're CMMC 2.0 assessment ready.
              </p>
            </details>
            
            <details style={{
              background: 'rgba(30, 58, 95, 0.3)',
              border: '1px solid rgba(0, 166, 251, 0.2)',
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
                Can this integrate with Active Directory?
              </summary>
              <p style={{ color: '#B0BEC5', lineHeight: 1.6 }}>
                Yes, we provide SAML 2.0 and LDAP integration with Active Directory, Azure AD, and Okta. Our biometric authentication can serve as a second factor while maintaining your existing user directory structure and group policies.
              </p>
            </details>
            
            <details style={{
              background: 'rgba(30, 58, 95, 0.3)',
              border: '1px solid rgba(0, 166, 251, 0.2)',
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
                What's your disaster recovery process?
              </summary>
              <p style={{ color: '#B0BEC5', lineHeight: 1.6 }}>
                We maintain geographically distributed quantum-secured backups with automatic failover. RPO is &lt;1 hour, RTO is &lt;15 minutes. All recovery keys are generated using the same quantum entropy sources and stored in enterprise-grade HSMs.
              </p>
            </details>
            
            <details style={{
              background: 'rgba(30, 58, 95, 0.3)',
              border: '1px solid rgba(0, 166, 251, 0.2)',
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
                How do you handle ITAR compliance?
              </summary>
              <p style={{ color: '#B0BEC5', lineHeight: 1.6 }}>
                Our on-premises deployment options support ITAR requirements with US-person only administration, air-gapped operation, and cryptographic modules that never leave US jurisdiction. We provide detailed compliance documentation for audit purposes.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '4rem 2rem 2rem',
        borderTop: '1px solid rgba(0, 166, 251, 0.2)',
        background: 'rgba(10, 22, 40, 0.8)'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {/* Main Footer Content */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '3rem',
            marginBottom: '3rem'
          }}>
            {/* Company Info */}
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '1.5rem'
              }}>
                <QuankeyLogo width={32} height={32} />
                <span style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  background: 'linear-gradient(135deg, #00A6FB, #00D4FF)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  Quankey
                </span>
              </div>
              <p style={{ color: '#B0BEC5', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Quantum-proof password management for defense, healthcare, and financial institutions. Protecting what matters most in the post-quantum world.
              </p>
            </div>

            {/* Legal Links */}
            <div>
              <h4 style={{ color: '#00A6FB', marginBottom: '1rem', fontSize: '1.1rem' }}>Legal</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <a href="#privacy" style={{ color: '#B0BEC5', textDecoration: 'none', fontSize: '0.9rem' }}>Privacy Policy</a>
                <a href="#terms" style={{ color: '#B0BEC5', textDecoration: 'none', fontSize: '0.9rem' }}>Terms of Service</a>
                <a href="#compliance" style={{ color: '#B0BEC5', textDecoration: 'none', fontSize: '0.9rem' }}>Compliance</a>
                <a href="#cookies" style={{ color: '#B0BEC5', textDecoration: 'none', fontSize: '0.9rem' }}>Cookie Policy</a>
                <a href="#security" style={{ color: '#B0BEC5', textDecoration: 'none', fontSize: '0.9rem' }}>Security</a>
              </div>
            </div>

            {/* Company Details */}
            <div>
              <h4 style={{ color: '#00A6FB', marginBottom: '1rem', fontSize: '1.1rem' }}>Company</h4>
              <div style={{ color: '#B0BEC5', fontSize: '0.9rem', lineHeight: 1.6 }}>
                <p><strong>Cainmani Resources, S.L.</strong></p>
                <p>Business ID: B72990377</p>
                <p>San Telmo 67, 28016 Madrid, Spain</p>
                <p style={{ marginTop: '1rem' }}>
                  <strong>US Operations:</strong><br />
                  Houston, TX
                </p>
              </div>
            </div>

            {/* Certifications */}
            <div>
              <h4 style={{ color: '#00A6FB', marginBottom: '1rem', fontSize: '1.1rem' }}>Certifications</h4>
              <div style={{ color: '#B0BEC5', fontSize: '0.9rem', lineHeight: 1.6 }}>
                <p>🔄 SOC 2 Compliant Architecture</p>
                <p>🔄 NIST 800-171 Framework Ready</p>
                <p>✅ GDPR & HIPAA Ready</p>
                <p>✅ ISO 27001 Framework Ready</p>
                <p>🔄 FIPS 140-2 Level 3 (Preparation Phase)</p>
                <p>🔄 CMMC 2.0 Assessment Ready</p>
              </div>
            </div>
          </div>

          {/* Legal Notice */}
          <div style={{
            borderTop: '1px solid rgba(0, 166, 251, 0.2)',
            paddingTop: '2rem',
            marginBottom: '2rem'
          }}>
            <div style={{
              background: 'rgba(30, 58, 95, 0.3)',
              border: '1px solid rgba(0, 166, 251, 0.2)',
              borderRadius: '8px',
              padding: '1.5rem',
              fontSize: '0.85rem',
              color: '#8B8CA5',
              lineHeight: 1.5
            }}>
              <p style={{ marginBottom: '1rem' }}>
                <strong style={{ color: '#B0BEC5' }}>Data Protection & Privacy:</strong> We guarantee the security and confidentiality of all collected data in accordance with GDPR, CCPA, and applicable international privacy regulations. This website uses necessary cookies to enhance your browsing experience and ensure proper functionality.
              </p>
              <p style={{ marginBottom: '1rem' }}>
                <strong style={{ color: '#B0BEC5' }}>Intellectual Property:</strong> All intellectual and industrial property rights belong exclusively to Cainmani Resources, S.L. and its affiliates. Users may create private copies for personal use only. Reproduction or distribution without written authorization is prohibited.
              </p>
              <p style={{ marginBottom: '1rem' }}>
                <strong style={{ color: '#B0BEC5' }}>Export Control & Standards:</strong> Our quantum cryptographic technologies follow international standards. Enterprise solutions available for qualifying organizations with enhanced security requirements.
              </p>
              <p>
                <strong style={{ color: '#B0BEC5' }}>Jurisdiction:</strong> These terms are governed by Spanish and European Union regulations. For US operations, additional federal and state regulations apply. Disputes will be resolved in the appropriate courts of Madrid, Spain or Houston, Texas as applicable.
              </p>
            </div>
          </div>

          {/* Copyright */}
          <div style={{ textAlign: 'center', borderTop: '1px solid rgba(0, 166, 251, 0.1)', paddingTop: '2rem' }}>
            <p style={{ color: '#8B8CA5', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
              © 2024 Cainmani Resources, S.L. All rights reserved. A Cainmani Company.
            </p>
            <p style={{ color: '#666', fontSize: '0.8rem' }}>
              Military-grade quantum security • Protecting what matters most • Made with ❤️ in Madrid & Houston
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ProfessionalLandingPage;