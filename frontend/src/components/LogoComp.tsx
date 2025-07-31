import React from 'react';

interface LogoProps {
  variant?: 'default' | 'horizontal' | 'icon';
  width?: number | string;
  height?: number | string;
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ 
  variant = 'default', 
  width = 120, 
  height = 120,
  className = ''
}) => {
  if (variant === 'horizontal') {
    return (
      <svg 
        width="300" 
        height="80" 
        viewBox="0 0 300 80" 
        className={className}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="horizGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#00A6FB' }} />
            <stop offset="100%" style={{ stopColor: '#00D4FF' }} />
          </linearGradient>
        </defs>
        <g transform="translate(40, 40)">
          <g transform="scale(0.8)">
            <path d="M 0,-18 A 18,18 0 0,1 18,0" stroke="url(#horizGradient)" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
            <path d="M 0,-26 A 26,26 0 0,1 26,0" stroke="url(#horizGradient)" strokeWidth="3" fill="none" opacity="0.75" strokeLinecap="round"/>
            <path d="M 0,-34 A 34,34 0 0,1 34,0" stroke="url(#horizGradient)" strokeWidth="2.5" fill="none" opacity="0.5" strokeLinecap="round"/>
            <path d="M 0,-18 A 18,18 0 0,0 -18,0" stroke="url(#horizGradient)" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
            <path d="M 0,-26 A 26,26 0 0,0 -26,0" stroke="url(#horizGradient)" strokeWidth="3" fill="none" opacity="0.75" strokeLinecap="round"/>
            <path d="M 0,-34 A 34,34 0 0,0 -34,0" stroke="url(#horizGradient)" strokeWidth="2.5" fill="none" opacity="0.5" strokeLinecap="round"/>
            <circle cx="0" cy="0" r="6" fill="url(#horizGradient)"/>
            <rect x="-3" y="6" width="6" height="18" fill="url(#horizGradient)"/>
            <rect x="-3" y="20" width="3" height="4" fill="url(#horizGradient)"/>
            <rect x="1.5" y="19" width="3" height="5" fill="url(#horizGradient)"/>
          </g>
        </g>
        <text x="90" y="48" fontFamily="Inter, sans-serif" fontSize="36" fontWeight="600" fill="url(#horizGradient)">Quankey</text>
      </svg>
    );
  }

  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 120 120" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="quankeyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#00A6FB' }} />
          <stop offset="100%" style={{ stopColor: '#00D4FF' }} />
        </linearGradient>
      </defs>
      
      <g transform="translate(60, 58)">
        <path d="M 0,-18 A 18,18 0 0,1 18,0" stroke="url(#quankeyGradient)" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
        <path d="M 0,-26 A 26,26 0 0,1 26,0" stroke="url(#quankeyGradient)" strokeWidth="3" fill="none" opacity="0.75" strokeLinecap="round"/>
        <path d="M 0,-34 A 34,34 0 0,1 34,0" stroke="url(#quankeyGradient)" strokeWidth="2.5" fill="none" opacity="0.5" strokeLinecap="round"/>
        
        <path d="M 0,-18 A 18,18 0 0,0 -18,0" stroke="url(#quankeyGradient)" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
        <path d="M 0,-26 A 26,26 0 0,0 -26,0" stroke="url(#quankeyGradient)" strokeWidth="3" fill="none" opacity="0.75" strokeLinecap="round"/>
        <path d="M 0,-34 A 34,34 0 0,0 -34,0" stroke="url(#quankeyGradient)" strokeWidth="2.5" fill="none" opacity="0.5" strokeLinecap="round"/>
        
        <circle cx="0" cy="0" r="6" fill="url(#quankeyGradient)"/>
        <rect x="-3" y="6" width="6" height="18" fill="url(#quankeyGradient)"/>
        <rect x="-3" y="20" width="3" height="4" fill="url(#quankeyGradient)"/>
        <rect x="1.5" y="19" width="3" height="5" fill="url(#quankeyGradient)"/>
      </g>
    </svg>
  );
};

export default Logo;