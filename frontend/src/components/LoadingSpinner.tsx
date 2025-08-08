import React from 'react';
import { QuantumIcon } from './QuankeyIcons';

export type SpinnerSize = 'small' | 'medium' | 'large';
export type SpinnerType = 'quantum' | 'primary' | 'success' | 'warning' | 'error';

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  type?: SpinnerType;
  message?: string;
  overlay?: boolean;
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  type = 'primary',
  message,
  overlay = false,
  fullScreen = false
}) => {
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { width: '20px', height: '20px', fontSize: '12px' };
      case 'large':
        return { width: '60px', height: '60px', fontSize: '16px' };
      default: // medium
        return { width: '40px', height: '40px', fontSize: '14px' };
    }
  };

  const getColorStyles = () => {
    switch (type) {
      case 'quantum':
        return { 
          primary: 'var(--quankey-quantum)',
          secondary: 'rgba(147, 51, 234, 0.3)',
          glow: 'rgba(147, 51, 234, 0.6)'
        };
      case 'success':
        return { 
          primary: 'var(--quankey-success)',
          secondary: 'rgba(0, 255, 136, 0.3)',
          glow: 'rgba(0, 255, 136, 0.6)'
        };
      case 'warning':
        return { 
          primary: 'var(--quankey-warning)',
          secondary: 'rgba(255, 159, 10, 0.3)',
          glow: 'rgba(255, 159, 10, 0.6)'
        };
      case 'error':
        return { 
          primary: 'var(--quankey-error)',
          secondary: 'rgba(255, 59, 48, 0.3)',
          glow: 'rgba(255, 59, 48, 0.6)'
        };
      default: // primary
        return { 
          primary: 'var(--quankey-primary)',
          secondary: 'rgba(0, 166, 251, 0.3)',
          glow: 'rgba(0, 166, 251, 0.6)'
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const colors = getColorStyles();

  const spinnerContent = (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '12px'
    }}>
      {/* Quantum Spinner */}
      <div style={{
        position: 'relative',
        width: sizeStyles.width,
        height: sizeStyles.height
      }}>
        {/* Outer ring */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          border: `3px solid ${colors.secondary}`,
          borderTop: `3px solid ${colors.primary}`,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        
        {/* Middle ring */}
        <div style={{
          position: 'absolute',
          top: '15%',
          left: '15%',
          width: '70%',
          height: '70%',
          border: `2px solid ${colors.secondary}`,
          borderRight: `2px solid ${colors.primary}`,
          borderRadius: '50%',
          animation: 'spin 1.5s linear infinite reverse'
        }} />
        
        {/* Inner core */}
        <div style={{
          position: 'absolute',
          top: '35%',
          left: '35%',
          width: '30%',
          height: '30%',
          background: `radial-gradient(circle, ${colors.primary}, ${colors.glow})`,
          borderRadius: '50%',
          animation: 'pulse 2s ease-in-out infinite',
          boxShadow: `0 0 15px ${colors.glow}`
        }} />
        
        {/* Quantum particles */}
        {type === 'quantum' && (
          <>
            <div style={{
              position: 'absolute',
              top: '-5px',
              right: '20%',
              width: '4px',
              height: '4px',
              background: colors.primary,
              borderRadius: '50%',
              animation: 'orbit 3s linear infinite',
              boxShadow: `0 0 8px ${colors.glow}`
            }} />
            <div style={{
              position: 'absolute',
              bottom: '-5px',
              left: '30%',
              width: '3px',
              height: '3px',
              background: colors.primary,
              borderRadius: '50%',
              animation: 'orbit 2.5s linear infinite reverse',
              boxShadow: `0 0 6px ${colors.glow}`
            }} />
          </>
        )}
      </div>
      
      {/* Message */}
      {message && (
        <div style={{
          color: 'var(--quankey-gray-light)',
          fontSize: sizeStyles.fontSize,
          textAlign: 'center',
          fontWeight: '500',
          opacity: 0.9,
          animation: 'fade 2s ease-in-out infinite alternate'
        }}>
          {message}
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(10, 22, 40, 0.95)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        flexDirection: 'column',
        gap: '24px'
      }}>
        {spinnerContent}
        <style>
          {spinnerStyles}
        </style>
      </div>
    );
  }

  if (overlay) {
    return (
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 'inherit',
        zIndex: 1000
      }}>
        {spinnerContent}
        <style>
          {spinnerStyles}
        </style>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      {spinnerContent}
      <style>
        {spinnerStyles}
      </style>
    </div>
  );
};

const spinnerStyles = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes pulse {
    0%, 100% { 
      opacity: 0.7;
      transform: scale(0.9);
    }
    50% { 
      opacity: 1;
      transform: scale(1.1);
    }
  }
  
  @keyframes fade {
    0% { opacity: 0.6; }
    100% { opacity: 1; }
  }
  
  @keyframes orbit {
    0% {
      transform: rotate(0deg) translateX(25px) rotate(0deg);
    }
    100% {
      transform: rotate(360deg) translateX(25px) rotate(-360deg);
    }
  }
`;

// Inline Loading Component for buttons
export const InlineSpinner: React.FC<{ 
  size?: number; 
  color?: string;
}> = ({ size = 16, color = 'currentColor' }) => (
  <>
    <div style={{
      width: size,
      height: size,
      border: `2px solid transparent`,
      borderTop: `2px solid ${color}`,
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      display: 'inline-block'
    }} />
    <style>
      {`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}
    </style>
  </>
);

// Quantum Loading Bar
export const QuantumLoadingBar: React.FC<{
  progress?: number;
  animated?: boolean;
  height?: number;
}> = ({ progress = 0, animated = true, height = 4 }) => (
  <>
    <div style={{
      width: '100%',
      height: `${height}px`,
      background: 'rgba(0, 166, 251, 0.1)',
      borderRadius: `${height / 2}px`,
      overflow: 'hidden',
      position: 'relative'
    }}>
      <div style={{
        width: animated ? '100%' : `${progress}%`,
        height: '100%',
        background: animated 
          ? 'linear-gradient(90deg, transparent, var(--quankey-quantum), transparent)'
          : 'linear-gradient(90deg, var(--quankey-primary), var(--quankey-quantum))',
        borderRadius: `${height / 2}px`,
        animation: animated ? 'shimmer 2s ease-in-out infinite' : 'none',
        transition: animated ? 'none' : 'width 0.3s ease',
        boxShadow: `0 0 ${height * 2}px rgba(147, 51, 234, 0.5)`
      }} />
    </div>
    <style>
      {`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}
    </style>
  </>
);