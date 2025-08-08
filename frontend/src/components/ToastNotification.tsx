import React, { useEffect, useState } from 'react';
import { 
  ShieldIcon, 
  TargetIcon, 
  QuantumIcon,
  AlertIcon
} from './QuankeyIcons';

export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'quantum';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastNotificationProps {
  toast: Toast;
  onClose: (id: string) => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({ toast, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onClose(toast.id), 300);
    }, toast.duration || 3000);

    return () => clearTimeout(timer);
  }, [toast, onClose]);

  const getToastStyles = () => {
    const baseStyles = {
      position: 'fixed' as const,
      top: '20px',
      right: '20px',
      minWidth: '300px',
      maxWidth: '400px',
      padding: '16px 20px',
      borderRadius: '12px',
      fontSize: '14px',
      fontWeight: '600',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
      zIndex: 10000,
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      backdropFilter: 'blur(20px)',
      border: '1px solid',
      animation: isExiting 
        ? 'slideOut 0.3s ease-in forwards' 
        : 'slideIn 0.3s ease-out',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    };

    const typeStyles = {
      success: {
        background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.95), rgba(0, 200, 100, 0.95))',
        borderColor: 'rgba(0, 255, 136, 0.5)',
        color: 'white'
      },
      error: {
        background: 'linear-gradient(135deg, rgba(255, 59, 48, 0.95), rgba(200, 40, 30, 0.95))',
        borderColor: 'rgba(255, 59, 48, 0.5)',
        color: 'white'
      },
      warning: {
        background: 'linear-gradient(135deg, rgba(255, 159, 10, 0.95), rgba(200, 120, 0, 0.95))',
        borderColor: 'rgba(255, 159, 10, 0.5)',
        color: 'white'
      },
      info: {
        background: 'linear-gradient(135deg, rgba(0, 166, 251, 0.95), rgba(0, 120, 200, 0.95))',
        borderColor: 'rgba(0, 166, 251, 0.5)',
        color: 'white'
      },
      quantum: {
        background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.95), rgba(100, 30, 180, 0.95))',
        borderColor: 'rgba(147, 51, 234, 0.5)',
        color: 'white'
      }
    };

    return { ...baseStyles, ...typeStyles[toast.type] };
  };

  const getIcon = () => {
    const iconProps = { size: 20, color: 'currentColor' };
    switch (toast.type) {
      case 'success':
        return <ShieldIcon {...iconProps} />;
      case 'error':
        return <AlertIcon {...iconProps} />;
      case 'warning':
        return <TargetIcon {...iconProps} />;
      case 'quantum':
        return <QuantumIcon {...iconProps} />;
      default:
        return <TargetIcon {...iconProps} />;
    }
  };

  return (
    <>
      <style>
        {`
          @keyframes slideIn {
            from {
              transform: translateX(400px);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }

          @keyframes slideOut {
            from {
              transform: translateX(0);
              opacity: 1;
            }
            to {
              transform: translateX(400px);
              opacity: 0;
            }
          }

          @keyframes progress {
            from {
              width: 100%;
            }
            to {
              width: 0%;
            }
          }
        `}
      </style>
      <div 
        style={getToastStyles()}
        onClick={() => {
          setIsExiting(true);
          setTimeout(() => onClose(toast.id), 300);
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.02)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        <div style={{ flexShrink: 0 }}>
          {getIcon()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: toast.action ? '8px' : '0' }}>
            {toast.message}
          </div>
          {toast.action && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toast.action!.onClick();
                setIsExiting(true);
                setTimeout(() => onClose(toast.id), 300);
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '6px',
                padding: '4px 12px',
                fontSize: '12px',
                color: 'white',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              }}
            >
              {toast.action.label}
            </button>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExiting(true);
            setTimeout(() => onClose(toast.id), 300);
          }}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            padding: '0',
            fontSize: '18px',
            lineHeight: '1',
            opacity: 0.7,
            transition: 'opacity 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0.7';
          }}
        >
          ×
        </button>
        
        {/* Progress bar */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '0 0 12px 12px',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            background: 'rgba(255, 255, 255, 0.5)',
            animation: `progress ${toast.duration || 3000}ms linear`
          }} />
        </div>
      </div>
    </>
  );
};

// Toast Container Component
interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 10000,
      pointerEvents: 'none'
    }}>
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{
            transform: `translateY(${index * 80}px)`,
            pointerEvents: 'auto'
          }}
        >
          <ToastNotification toast={toast} onClose={onClose} />
        </div>
      ))}
    </div>
  );
};

// Toast Hook for easy usage
export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: ToastType = 'info', duration?: number, action?: Toast['action']) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: Toast = { id, message, type, duration, action };
    
    setToasts(prev => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return {
    toasts,
    showToast,
    removeToast,
    // Convenience methods
    success: (message: string, duration?: number) => showToast(message, 'success', duration),
    error: (message: string, duration?: number) => showToast(message, 'error', duration),
    info: (message: string, duration?: number) => showToast(message, 'info', duration),
    warning: (message: string, duration?: number) => showToast(message, 'warning', duration),
    quantum: (message: string, duration?: number) => showToast(message, 'quantum', duration),
  };
};