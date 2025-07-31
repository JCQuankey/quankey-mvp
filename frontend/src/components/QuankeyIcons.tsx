// frontend/src/components/QuankeyIcons.tsx

import React from 'react';

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
}

// Icono de Seguridad/Shield para reemplazar 🔐
export const ShieldIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 4L8 12v8c0 8.84 6.78 17.12 16 18.96C33.22 37.12 40 28.84 40 20v-8L24 4z" stroke={color} strokeWidth="2" fill="none"/>
    <path d="M18 24l4 4 8-8" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Icono de Huella Digital para reemplazar 👆
export const FingerprintIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="24" r="4" stroke={color} strokeWidth="2" fill="none"/>
    <path d="M24 12a12 12 0 0 1 12 12" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round"/>
    <path d="M24 16a8 8 0 0 1 8 8" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round"/>
    <path d="M24 12a12 12 0 0 0-12 12" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round"/>
    <path d="M24 16a8 8 0 0 0-8 8" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round"/>
  </svg>
);

// Icono de Copiar para reemplazar 📋
export const CopyIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="12" y="12" width="24" height="32" rx="2" stroke={color} strokeWidth="2"/>
    <path d="M8 36V8a2 2 0 012-2h20" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// Icono de Carpeta para reemplazar 🗂️
export const FolderIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 14v24a4 4 0 004 4h32a4 4 0 004-4V18a4 4 0 00-4-4H24l-4-4H8a4 4 0 00-4 4z" stroke={color} strokeWidth="2"/>
  </svg>
);

// Icono Cuántico para reemplazar ⚛️
export const QuantumIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="24" r="4" fill={color}/>
    <circle cx="24" cy="24" r="12" stroke={color} strokeWidth="2" fill="none" strokeDasharray="4,4"/>
    <circle cx="24" cy="24" r="20" stroke={color} strokeWidth="2" fill="none" opacity="0.5"/>
    <circle cx="24" cy="4" r="3" fill={color} opacity="0.8"/>
    <circle cx="44" cy="24" r="3" fill={color} opacity="0.8"/>
    <circle cx="24" cy="44" r="3" fill={color} opacity="0.8"/>
    <circle cx="4" cy="24" r="3" fill={color} opacity="0.8"/>
  </svg>
);

// Icono de Guardar para reemplazar 💾
export const SaveIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 6h24l8 8v26a2 2 0 01-2 2H10a2 2 0 01-2-2V8a2 2 0 012-2z" stroke={color} strokeWidth="2"/>
    <rect x="14" y="26" width="20" height="16" fill={color} opacity="0.2"/>
    <rect x="14" y="6" width="14" height="10" stroke={color} strokeWidth="2"/>
  </svg>
);

// Icono de Añadir/Plus para reemplazar ➕
export const PlusIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="24" r="20" stroke={color} strokeWidth="2"/>
    <path d="M24 16v16m8-8H16" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// Icono de Eliminar para reemplazar 🗑️
export const DeleteIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 12h32M20 12V8a2 2 0 012-2h4a2 2 0 012 2v4" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 12v28a2 2 0 002 2h20a2 2 0 002-2V12" stroke={color} strokeWidth="2"/>
    <path d="M20 20v12m8-12v12" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// Icono de Usuario para reemplazar 👤
export const UserIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="16" r="8" stroke={color} strokeWidth="2"/>
    <path d="M8 40c0-8.84 7.16-16 16-16s16 7.16 16 16" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// Icono de Logout para reemplazar 🚪
export const LogoutIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 42H10a2 2 0 01-2-2V8a2 2 0 012-2h8" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M30 32l8-8-8-8m8 8H18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Icono de Reloj/Tiempo para reemplazar 🕐
export const ClockIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="24" r="20" stroke={color} strokeWidth="2"/>
    <path d="M24 12v12l8 8" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// Icono de Candado Abierto para reemplazar 🔓
export const UnlockIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="12" y="20" width="24" height="20" rx="2" stroke={color} strokeWidth="2"/>
    <path d="M18 20V14a6 6 0 0112 0" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <circle cx="24" cy="30" r="2" fill={color}/>
  </svg>
);

// Icono de Vista/Ojo para reemplazar 👁️
export const EyeIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 14c-8 0-14 10-14 10s6 10 14 10 14-10 14-10-6-10-14-10z" stroke={color} strokeWidth="2"/>
    <circle cx="24" cy="24" r="4" stroke={color} strokeWidth="2"/>
  </svg>
);

// Icono de Ocultar/Ojo cerrado para reemplazar 🙈
export const EyeOffIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 10l28 28M24 14c-8 0-14 10-14 10s3 5 7.5 7.5m6.5 2.5c8 0 14-10 14-10s-3-5-7.5-7.5" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M20.7 20.7a4 4 0 105.6 5.6" stroke={color} strokeWidth="2"/>
  </svg>
);

// Icono de Flecha/Target para reemplazar 🎯
export const TargetIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="24" r="20" stroke={color} strokeWidth="2"/>
    <circle cx="24" cy="24" r="12" stroke={color} strokeWidth="2"/>
    <circle cx="24" cy="24" r="4" fill={color}/>
  </svg>
);

// Icono de Check/Success para reemplazar ✅
export const CheckIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="24" r="20" stroke={color} strokeWidth="2"/>
    <path d="M16 24l6 6 12-12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Icono de Warning para reemplazar ⚠️
export const WarningIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 8L4 40h40L24 8z" stroke={color} strokeWidth="2" strokeLinejoin="round"/>
    <path d="M24 20v8m0 4v2" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// Icono de Web/Globe para reemplazar 🌐
export const GlobeIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="24" r="20" stroke={color} strokeWidth="2"/>
    <path d="M4 24h40M24 4a30 30 0 010 40 30 30 0 010-40" stroke={color} strokeWidth="2"/>
    <path d="M12 24a20 20 0 0124 0" stroke={color} strokeWidth="2"/>
  </svg>
);

// Icono de Search para reemplazar 🔍
export const SearchIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="16" stroke={color} strokeWidth="2"/>
    <path d="M32 32l12 12" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// Icono de X/Close para reemplazar ✕
export const CloseIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M36 12L12 36m24 0L12 12" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);