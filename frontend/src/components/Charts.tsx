import React from 'react';

interface ChartProps {
  data: Array<{
    label: string;
    value: number;
    color: string;
    percentage?: number;
  }>;
  title?: string;
  total?: number;
}

// Simple Donut Chart Component
export const DonutChart: React.FC<ChartProps> = ({ data, title, total = 100 }) => {
  const size = 120;
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  let accumulatedPercentage = 0;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '16px'
    }}>
      {title && (
        <h4 style={{
          color: 'var(--quankey-gray-light)',
          fontSize: '14px',
          margin: 0,
          textAlign: 'center'
        }}>
          {title}
        </h4>
      )}
      
      <div style={{ position: 'relative' }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(0, 166, 251, 0.1)"
            strokeWidth={strokeWidth}
          />
          
          {/* Data segments */}
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100;
            const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
            const strokeDashoffset = -((accumulatedPercentage / 100) * circumference);
            
            accumulatedPercentage += percentage;
            
            return (
              <circle
                key={index}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={item.color}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{
                  filter: `drop-shadow(0 0 6px ${item.color}40)`,
                  transition: 'all 0.5s ease'
                }}
              />
            );
          })}
        </svg>
        
        {/* Center text */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center'
        }}>
          <div style={{
            color: 'var(--quankey-gray-light)',
            fontSize: '24px',
            fontWeight: 'bold'
          }}>
            {total}
          </div>
          <div style={{
            color: 'var(--quankey-gray)',
            fontSize: '10px'
          }}>
            Total
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {data.map((item, index) => (
          <div key={index} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: item.color,
              boxShadow: `0 0 6px ${item.color}40`
            }} />
            <span style={{
              color: 'var(--quankey-gray)',
              fontSize: '12px'
            }}>
              {item.label}
            </span>
            <span style={{
              color: item.color,
              fontSize: '12px',
              fontWeight: 'bold',
              marginLeft: 'auto'
            }}>
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Horizontal Bar Chart Component
export const BarChart: React.FC<ChartProps> = ({ data, title }) => {
  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    }}>
      {title && (
        <h4 style={{
          color: 'var(--quankey-gray-light)',
          fontSize: '14px',
          margin: 0
        }}>
          {title}
        </h4>
      )}
      
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {data.map((item, index) => {
          const percentage = (item.value / maxValue) * 100;
          
          return (
            <div key={index}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '4px'
              }}>
                <span style={{
                  color: 'var(--quankey-gray-light)',
                  fontSize: '12px'
                }}>
                  {item.label}
                </span>
                <span style={{
                  color: item.color,
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  {item.value}
                </span>
              </div>
              
              <div style={{
                width: '100%',
                height: '8px',
                background: 'rgba(0, 166, 251, 0.1)',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${percentage}%`,
                  height: '100%',
                  background: `linear-gradient(90deg, ${item.color}, ${item.color}80)`,
                  borderRadius: '4px',
                  transition: 'width 1s ease',
                  boxShadow: `0 0 8px ${item.color}40`
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Progress Ring Component for Security Score
export const ProgressRing: React.FC<{
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
}> = ({ 
  progress, 
  size = 100, 
  strokeWidth = 8, 
  color = 'var(--quankey-primary)',
  label
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Determine color based on progress
  const getColor = () => {
    if (progress >= 80) return 'var(--quankey-success)';
    if (progress >= 60) return 'var(--quankey-warning)';
    return 'var(--quankey-error)';
  };

  const finalColor = color === 'var(--quankey-primary)' ? getColor() : color;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px'
    }}>
      <div style={{ position: 'relative' }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(0, 166, 251, 0.1)"
            strokeWidth={strokeWidth}
          />
          
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={finalColor}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 1s ease',
              filter: `drop-shadow(0 0 8px ${finalColor}50)`
            }}
          />
        </svg>
        
        {/* Center percentage */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center'
        }}>
          <div style={{
            color: finalColor,
            fontSize: `${size * 0.2}px`,
            fontWeight: 'bold'
          }}>
            {Math.round(progress)}%
          </div>
        </div>
      </div>
      
      {label && (
        <div style={{
          color: 'var(--quankey-gray)',
          fontSize: '12px',
          textAlign: 'center'
        }}>
          {label}
        </div>
      )}
    </div>
  );
};

// Mini Sparkline Chart
export const SparkLine: React.FC<{
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}> = ({ data, width = 60, height = 20, color = 'var(--quankey-primary)' }) => {
  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);
  const range = maxValue - minValue || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - minValue) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        points={points}
        style={{
          filter: `drop-shadow(0 0 4px ${color}40)`
        }}
      />
      {/* Dots for data points */}
      {data.map((value, index) => {
        const x = (index / (data.length - 1)) * width;
        const y = height - ((value - minValue) / range) * height;
        return (
          <circle
            key={index}
            cx={x}
            cy={y}
            r="1.5"
            fill={color}
            style={{
              filter: `drop-shadow(0 0 3px ${color}60)`
            }}
          />
        );
      })}
    </svg>
  );
};

// Timeline Chart Component
export const TimelineChart: React.FC<{
  data: Array<{
    date: Date;
    count: number;
    type: 'quantum' | 'traditional';
  }>;
  height?: number;
}> = ({ data, height = 100 }) => {
  if (data.length === 0) return null;

  const width = 300;
  const maxCount = Math.max(...data.map(d => d.count));
  const padding = 20;

  // Group data by month
  const groupedData = data.reduce((acc, item) => {
    const monthKey = `${item.date.getFullYear()}-${item.date.getMonth()}`;
    if (!acc[monthKey]) {
      acc[monthKey] = { quantum: 0, traditional: 0, date: item.date };
    }
    acc[monthKey][item.type] += item.count;
    return acc;
  }, {} as Record<string, { quantum: number; traditional: number; date: Date }>);

  const months = Object.values(groupedData);

  return (
    <div>
      <svg width={width} height={height + 40} style={{ overflow: 'visible' }}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
          <line
            key={ratio}
            x1={padding}
            y1={padding + (height - padding * 2) * ratio}
            x2={width - padding}
            y2={padding + (height - padding * 2) * ratio}
            stroke="rgba(0, 166, 251, 0.1)"
            strokeWidth="1"
          />
        ))}

        {/* Quantum line */}
        <polyline
          fill="none"
          stroke="var(--quankey-quantum)"
          strokeWidth="2"
          points={months.map((month, index) => {
            const x = padding + (index / (months.length - 1)) * (width - padding * 2);
            const y = height - padding - ((month.quantum / maxCount) * (height - padding * 2));
            return `${x},${y}`;
          }).join(' ')}
          style={{
            filter: 'drop-shadow(0 0 4px rgba(147, 51, 234, 0.5))'
          }}
        />

        {/* Traditional line */}
        <polyline
          fill="none"
          stroke="var(--quankey-warning)"
          strokeWidth="2"
          points={months.map((month, index) => {
            const x = padding + (index / (months.length - 1)) * (width - padding * 2);
            const y = height - padding - ((month.traditional / maxCount) * (height - padding * 2));
            return `${x},${y}`;
          }).join(' ')}
          style={{
            filter: 'drop-shadow(0 0 4px rgba(255, 159, 10, 0.5))'
          }}
        />

        {/* Data points */}
        {months.map((month, index) => {
          const x = padding + (index / (months.length - 1)) * (width - padding * 2);
          return (
            <g key={index}>
              <circle
                cx={x}
                cy={height - padding - ((month.quantum / maxCount) * (height - padding * 2))}
                r="3"
                fill="var(--quankey-quantum)"
              />
              <circle
                cx={x}
                cy={height - padding - ((month.traditional / maxCount) * (height - padding * 2))}
                r="3"
                fill="var(--quankey-warning)"
              />
            </g>
          );
        })}

        {/* X-axis labels */}
        {months.map((month, index) => {
          const x = padding + (index / (months.length - 1)) * (width - padding * 2);
          return (
            <text
              key={index}
              x={x}
              y={height + 15}
              textAnchor="middle"
              fill="var(--quankey-gray)"
              fontSize="10"
            >
              {month.date.toLocaleDateString('en', { month: 'short' })}
            </text>
          );
        })}
      </svg>

      {/* Legend */}
      <div style={{
        display: 'flex',
        gap: '16px',
        marginTop: '8px',
        fontSize: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{
            width: '12px',
            height: '2px',
            background: 'var(--quankey-quantum)'
          }} />
          <span style={{ color: 'var(--quankey-gray)' }}>Quantum</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{
            width: '12px',
            height: '2px',
            background: 'var(--quankey-warning)'
          }} />
          <span style={{ color: 'var(--quankey-gray)' }}>Traditional</span>
        </div>
      </div>
    </div>
  );
};