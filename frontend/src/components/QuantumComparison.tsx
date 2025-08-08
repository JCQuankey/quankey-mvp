import React, { useState, useEffect } from 'react';
import { SECURITY_COMPARISON } from '../services/demoDataService';
import {
  QuantumIcon,
  ShieldIcon,
  WarningIcon,
  ClockIcon,
  TargetIcon,
  CheckIcon
} from './QuankeyIcons';

interface QuantumComparisonProps {
  quantumCount: number;
  traditionalCount: number;
  totalCount: number;
}

export const QuantumComparison: React.FC<QuantumComparisonProps> = ({
  quantumCount,
  traditionalCount,
  totalCount
}) => {
  const [animatedQuantum, setAnimatedQuantum] = useState(0);
  const [animatedTraditional, setAnimatedTraditional] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Animate numbers on mount
    const duration = 1500;
    const steps = 30;
    const quantumStep = quantumCount / steps;
    const traditionalStep = traditionalCount / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      setAnimatedQuantum(Math.min(Math.round(quantumStep * currentStep), quantumCount));
      setAnimatedTraditional(Math.min(Math.round(traditionalStep * currentStep), traditionalCount));
      
      if (currentStep >= steps) {
        clearInterval(interval);
      }
    }, duration / steps);

    return () => clearInterval(interval);
  }, [quantumCount, traditionalCount]);

  const quantumPercentage = totalCount > 0 ? (quantumCount / totalCount) * 100 : 0;
  const traditionalPercentage = totalCount > 0 ? (traditionalCount / totalCount) * 100 : 0;

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(10, 22, 40, 0.95), rgba(30, 58, 95, 0.95))',
      borderRadius: '16px',
      padding: '32px',
      border: '1px solid rgba(0, 166, 251, 0.3)',
      backdropFilter: 'blur(20px)'
    }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '32px'
      }}>
        <h2 style={{
          color: 'var(--quankey-gray-light)',
          fontSize: '24px',
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px'
        }}>
          <QuantumIcon size={28} color="var(--quankey-quantum)" />
          Quantum vs Traditional Security
        </h2>
        <p style={{
          color: 'var(--quankey-gray)',
          fontSize: '14px'
        }}>
          Real-time comparison of your password security
        </p>
      </div>

      {/* Visual Comparison */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px',
        marginBottom: '32px'
      }}>
        {/* Quantum Side */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.15), rgba(147, 51, 234, 0.05))',
          borderRadius: '12px',
          padding: '24px',
          border: '2px solid rgba(147, 51, 234, 0.4)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Glow effect */}
          <div style={{
            position: 'absolute',
            top: '-50%',
            left: '-50%',
            width: '200%',
            height: '200%',
            background: 'radial-gradient(circle, rgba(147, 51, 234, 0.2) 0%, transparent 70%)',
            animation: 'pulse 3s infinite'
          }} />
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px'
            }}>
              <ShieldIcon size={24} color="var(--quankey-quantum)" />
              <h3 style={{
                color: 'var(--quankey-quantum)',
                fontSize: '18px',
                margin: 0
              }}>
                Quantum-Protected
              </h3>
            </div>

            <div style={{
              fontSize: '48px',
              fontWeight: 'bold',
              color: 'var(--quankey-quantum)',
              marginBottom: '8px'
            }}>
              {animatedQuantum}
            </div>

            <div style={{
              color: 'var(--quankey-gray-light)',
              fontSize: '14px',
              marginBottom: '16px'
            }}>
              {quantumPercentage.toFixed(1)}% of vault
            </div>

            {/* Progress Bar */}
            <div style={{
              height: '8px',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '4px',
              overflow: 'hidden',
              marginBottom: '20px'
            }}>
              <div style={{
                height: '100%',
                width: `${quantumPercentage}%`,
                background: 'linear-gradient(90deg, var(--quankey-quantum), rgba(147, 51, 234, 0.8))',
                borderRadius: '4px',
                transition: 'width 1.5s ease',
                boxShadow: '0 0 10px rgba(147, 51, 234, 0.5)'
              }} />
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <ClockIcon size={16} color="var(--quankey-success)" />
                <div>
                  <div style={{ color: 'var(--quankey-gray)', fontSize: '12px' }}>
                    Crack Time
                  </div>
                  <div style={{ color: 'var(--quankey-success)', fontSize: '14px', fontWeight: 'bold' }}>
                    {SECURITY_COMPARISON.quantum.averageCrackTime}
                  </div>
                </div>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <QuantumIcon size={16} color="var(--quankey-quantum)" />
                <div>
                  <div style={{ color: 'var(--quankey-gray)', fontSize: '12px' }}>
                    Quantum Computer
                  </div>
                  <div style={{ color: 'var(--quankey-quantum)', fontSize: '14px', fontWeight: 'bold' }}>
                    {SECURITY_COMPARISON.quantum.quantumComputerTime}
                  </div>
                </div>
              </div>

              <div style={{
                padding: '8px',
                background: 'rgba(0, 255, 136, 0.1)',
                borderRadius: '6px',
                border: '1px solid rgba(0, 255, 136, 0.3)'
              }}>
                <div style={{
                  color: 'var(--quankey-success)',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <CheckIcon size={14} color="currentColor" />
                  {SECURITY_COMPARISON.quantum.riskLevel}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Traditional Side */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(255, 59, 48, 0.15), rgba(255, 59, 48, 0.05))',
          borderRadius: '12px',
          padding: '24px',
          border: '2px solid rgba(255, 59, 48, 0.4)',
          position: 'relative'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px'
          }}>
            <WarningIcon size={24} color="var(--quankey-error)" />
            <h3 style={{
              color: 'var(--quankey-error)',
              fontSize: '18px',
              margin: 0
            }}>
              Traditional
            </h3>
          </div>

          <div style={{
            fontSize: '48px',
            fontWeight: 'bold',
            color: 'var(--quankey-error)',
            marginBottom: '8px'
          }}>
            {animatedTraditional}
          </div>

          <div style={{
            color: 'var(--quankey-gray-light)',
            fontSize: '14px',
            marginBottom: '16px'
          }}>
            {traditionalPercentage.toFixed(1)}% of vault
          </div>

          {/* Progress Bar */}
          <div style={{
            height: '8px',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '4px',
            overflow: 'hidden',
            marginBottom: '20px'
          }}>
            <div style={{
              height: '100%',
              width: `${traditionalPercentage}%`,
              background: 'linear-gradient(90deg, var(--quankey-error), rgba(255, 59, 48, 0.8))',
              borderRadius: '4px',
              transition: 'width 1.5s ease'
            }} />
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <ClockIcon size={16} color="var(--quankey-warning)" />
              <div>
                <div style={{ color: 'var(--quankey-gray)', fontSize: '12px' }}>
                  Crack Time
                </div>
                <div style={{ color: 'var(--quankey-warning)', fontSize: '14px', fontWeight: 'bold' }}>
                  {SECURITY_COMPARISON.traditional.averageCrackTime}
                </div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <QuantumIcon size={16} color="var(--quankey-error)" />
              <div>
                <div style={{ color: 'var(--quankey-gray)', fontSize: '12px' }}>
                  Quantum Computer
                </div>
                <div style={{ color: 'var(--quankey-error)', fontSize: '14px', fontWeight: 'bold' }}>
                  {SECURITY_COMPARISON.traditional.quantumComputerTime}
                </div>
              </div>
            </div>

            <div style={{
              padding: '8px',
              background: 'rgba(255, 59, 48, 0.1)',
              borderRadius: '6px',
              border: '1px solid rgba(255, 59, 48, 0.3)'
            }}>
              <div style={{
                color: 'var(--quankey-error)',
                fontSize: '12px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <WarningIcon size={14} color="currentColor" />
                {SECURITY_COMPARISON.traditional.riskLevel}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Comparison */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        style={{
          width: '100%',
          padding: '12px',
          background: 'rgba(0, 166, 251, 0.1)',
          border: '1px solid rgba(0, 166, 251, 0.3)',
          borderRadius: '8px',
          color: 'var(--quankey-primary)',
          fontSize: '14px',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          marginBottom: showDetails ? '20px' : '0'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(0, 166, 251, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(0, 166, 251, 0.1)';
        }}
      >
        {showDetails ? 'Hide' : 'Show'} Technical Details
      </button>

      {showDetails && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
          animation: 'fadeIn 0.3s ease'
        }}>
          {/* Quantum Advantages */}
          <div style={{
            background: 'rgba(147, 51, 234, 0.05)',
            borderRadius: '8px',
            padding: '16px',
            border: '1px solid rgba(147, 51, 234, 0.2)'
          }}>
            <h4 style={{
              color: 'var(--quankey-quantum)',
              fontSize: '14px',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <CheckIcon size={16} color="currentColor" />
              Quantum Advantages
            </h4>
            <ul style={{
              margin: 0,
              paddingLeft: '20px',
              color: 'var(--quankey-gray-light)',
              fontSize: '12px',
              lineHeight: '1.8'
            }}>
              {SECURITY_COMPARISON.quantum.advantages.map((advantage, index) => (
                <li key={index}>{advantage}</li>
              ))}
            </ul>
          </div>

          {/* Traditional Vulnerabilities */}
          <div style={{
            background: 'rgba(255, 59, 48, 0.05)',
            borderRadius: '8px',
            padding: '16px',
            border: '1px solid rgba(255, 59, 48, 0.2)'
          }}>
            <h4 style={{
              color: 'var(--quankey-error)',
              fontSize: '14px',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <WarningIcon size={16} color="currentColor" />
              Known Vulnerabilities
            </h4>
            <ul style={{
              margin: 0,
              paddingLeft: '20px',
              color: 'var(--quankey-gray-light)',
              fontSize: '12px',
              lineHeight: '1.8'
            }}>
              {SECURITY_COMPARISON.traditional.vulnerabilities.map((vulnerability, index) => (
                <li key={index}>{vulnerability}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Call to Action */}
      {traditionalCount > 0 && (
        <div style={{
          marginTop: '24px',
          padding: '16px',
          background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.2), rgba(0, 166, 251, 0.2))',
          borderRadius: '8px',
          border: '1px solid rgba(147, 51, 234, 0.3)',
          textAlign: 'center'
        }}>
          <p style={{
            color: 'var(--quankey-gray-light)',
            fontSize: '14px',
            marginBottom: '12px'
          }}>
            Upgrade {traditionalCount} traditional password{traditionalCount > 1 ? 's' : ''} to quantum protection
          </p>
          <button
            className="btn-quantum"
            style={{
              padding: '10px 24px',
              fontSize: '14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <QuantumIcon size={16} color="currentColor" />
            Upgrade All to Quantum
          </button>
        </div>
      )}

      <style>
        {`
          @keyframes pulse {
            0%, 100% {
              opacity: 0.5;
            }
            50% {
              opacity: 0.8;
            }
          }
          
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </div>
  );
};