// FILE LOCATION: /src/components/dashboard/NumexRELogo.tsx
// PURPOSE: Professional SVG logo for NumexRE dashboard with DETAILED CITY SKYLINE
// VERSION: Enhanced - More buildings, details, and architectural elements

'use client'

import { useId } from 'react'

interface NumexRELogoProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'full' | 'icon-only'
  className?: string
}

export function NumexRELogo({ 
  size = 'md', 
  variant = 'full',
  className = '' 
}: NumexRELogoProps) {
  const gradientId = useId()
  
  const sizeMap = {
    sm: { icon: 24, text: 'text-base' },
    md: { icon: 32, text: 'text-xl' },
    lg: { icon: 40, text: 'text-2xl' }
  }
  
  const iconSize = sizeMap[size].icon
  const textSize = sizeMap[size].text

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Icon: Modern "N" with detailed city skyline */}
      <svg 
        width={iconSize} 
        height={iconSize} 
        viewBox="0 0 48 48" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Gradient Definitions */}
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
          <linearGradient id={`${gradientId}-light`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#93c5fd" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
        
        {/* Background Circle */}
        <circle cx="24" cy="24" r="22" fill={`url(#${gradientId})`} />
        
        {/* DETAILED City Skyline - More buildings, more detail */}
        <g opacity="0.3">
          {/* Far left - Short building with antenna */}
          <g fill="white">
            <rect x="4" y="32" width="4" height="10" rx="0.4" />
            {/* Antenna */}
            <rect x="5.5" y="30" width="0.5" height="2" />
            <circle cx="5.75" cy="29.5" r="0.5" />
            {/* Windows */}
            <rect x="4.8" y="34" width="0.8" height="0.8" fill="#1d4ed8" opacity="0.5" />
            <rect x="4.8" y="36" width="0.8" height="0.8" fill="#1d4ed8" opacity="0.5" />
            <rect x="6.2" y="34" width="0.8" height="0.8" fill="#1d4ed8" opacity="0.5" />
            <rect x="6.2" y="36" width="0.8" height="0.8" fill="#1d4ed8" opacity="0.5" />
            <rect x="4.8" y="38" width="0.8" height="0.8" fill="#1d4ed8" opacity="0.5" />
            <rect x="6.2" y="38" width="0.8" height="0.8" fill="#1d4ed8" opacity="0.5" />
          </g>
          
          {/* Second building - Medium height */}
          <g fill="white">
            <rect x="9" y="29" width="5" height="13" rx="0.4" />
            {/* Rooftop detail */}
            <rect x="10" y="28" width="3" height="1" rx="0.3" />
            {/* Windows - 3 columns */}
            <rect x="9.6" y="30.5" width="0.7" height="0.7" fill="#1d4ed8" opacity="0.5" />
            <rect x="11" y="30.5" width="0.7" height="0.7" fill="#1d4ed8" opacity="0.5" />
            <rect x="12.4" y="30.5" width="0.7" height="0.7" fill="#1d4ed8" opacity="0.5" />
            
            <rect x="9.6" y="32.5" width="0.7" height="0.7" fill="#1d4ed8" opacity="0.5" />
            <rect x="11" y="32.5" width="0.7" height="0.7" fill="#1d4ed8" opacity="0.5" />
            <rect x="12.4" y="32.5" width="0.7" height="0.7" fill="#1d4ed8" opacity="0.5" />
            
            <rect x="9.6" y="34.5" width="0.7" height="0.7" fill="#1d4ed8" opacity="0.5" />
            <rect x="11" y="34.5" width="0.7" height="0.7" fill="#1d4ed8" opacity="0.5" />
            <rect x="12.4" y="34.5" width="0.7" height="0.7" fill="#1d4ed8" opacity="0.5" />
            
            <rect x="9.6" y="36.5" width="0.7" height="0.7" fill="#1d4ed8" opacity="0.5" />
            <rect x="11" y="36.5" width="0.7" height="0.7" fill="#1d4ed8" opacity="0.5" />
            <rect x="12.4" y="36.5" width="0.7" height="0.7" fill="#1d4ed8" opacity="0.5" />
            
            <rect x="9.6" y="38.5" width="0.7" height="0.7" fill="#1d4ed8" opacity="0.5" />
            <rect x="11" y="38.5" width="0.7" height="0.7" fill="#1d4ed8" opacity="0.5" />
            <rect x="12.4" y="38.5" width="0.7" height="0.7" fill="#1d4ed8" opacity="0.5" />
          </g>
          
          {/* Third building - Tall tower */}
          <g fill="white">
            <rect x="15" y="24" width="5" height="18" rx="0.4" />
            {/* Top antenna/spire */}
            <rect x="17" y="22" width="0.5" height="2" />
            <polygon points="17.25,21.5 17.25,22.5 16.75,22.5" fill="white" />
            {/* Windows - 2 columns, many rows */}
            <rect x="16" y="25.5" width="0.8" height="0.8" fill="#1d4ed8" opacity="0.5" />
            <rect x="17.8" y="25.5" width="0.8" height="0.8" fill="#1d4ed8" opacity="0.5" />
            
            <rect x="16" y="27.5" width="0.8" height="0.8" fill="#1d4ed8" opacity="0.5" />
            <rect x="17.8" y="27.5" width="0.8" height="0.8" fill="#1d4ed8" opacity="0.5" />
            
            <rect x="16" y="29.5" width="0.8" height="0.8" fill="#1d4ed8" opacity="0.5" />
            <rect x="17.8" y="29.5" width="0.8" height="0.8" fill="#1d4ed8" opacity="0.5" />
            
            <rect x="16" y="31.5" width="0.8" height="0.8" fill="#1d4ed8" opacity="0.5" />
            <rect x="17.8" y="31.5" width="0.8" height="0.8" fill="#1d4ed8" opacity="0.5" />
            
            <rect x="16" y="33.5" width="0.8" height="0.8" fill="#1d4ed8" opacity="0.5" />
            <rect x="17.8" y="33.5" width="0.8" height="0.8" fill="#1d4ed8" opacity="0.5" />
            
            <rect x="16" y="35.5" width="0.8" height="0.8" fill="#1d4ed8" opacity="0.5" />
            <rect x="17.8" y="35.5" width="0.8" height="0.8" fill="#1d4ed8" opacity="0.5" />
            
            <rect x="16" y="37.5" width="0.8" height="0.8" fill="#1d4ed8" opacity="0.5" />
            <rect x="17.8" y="37.5" width="0.8" height="0.8" fill="#1d4ed8" opacity="0.5" />
            
            <rect x="16" y="39.5" width="0.8" height="0.8" fill="#1d4ed8" opacity="0.5" />
            <rect x="17.8" y="39.5" width="0.8" height="0.8" fill="#1d4ed8" opacity="0.5" />
          </g>
          
          {/* Fourth building - Medium with terrace */}
          <g fill="white">
            <rect x="21" y="30" width="4" height="12" rx="0.4" />
            {/* Terrace/setback */}
            <rect x="21.5" y="28.5" width="3" height="1.5" rx="0.3" />
            {/* Windows */}
            <rect x="21.8" y="31" width="0.7" height="0.7" fill="#1d4ed8" opacity="0.5" />
            <rect x="23.3" y="31" width="0.7" height="0.7" fill="#1d4ed8" opacity="0.5" />
            
            <rect x="21.8" y="33" width="0.7" height="0.7" fill="#1d4ed8" opacity="0.5" />
            <rect x="23.3" y="33" width="0.7" height="0.7" fill="#1d4ed8" opacity="0.5" />
            
            <rect x="21.8" y="35" width="0.7" height="0.7" fill="#1d4ed8" opacity="0.5" />
            <rect x="23.3" y="35" width="0.7" height="0.7" fill="#1d4ed8" opacity="0.5" />
            
            <rect x="21.8" y="37" width="0.7" height="0.7" fill="#1d4ed8" opacity="0.5" />
            <rect x="23.3" y="37" width="0.7" height="0.7" fill="#1d4ed8" opacity="0.5" />
            
            <rect x="21.8" y="39" width="0.7" height="0.7" fill="#1d4ed8" opacity="0.5" />
            <rect x="23.3" y="39" width="0.7" height="0.7" fill="#1d4ed8" opacity="0.5" />
          </g>
          
          {/* Fifth building - Tallest skyscraper (right side) */}
          <g fill="white">
            <rect x="28" y="21" width="6" height="21" rx="0.4" />
            {/* Crown/top feature */}
            <rect x="29" y="19.5" width="4" height="1.5" rx="0.3" />
            <rect x="30" y="18.5" width="2" height="1" rx="0.3" />
            {/* Windows - 2 columns, many rows */}
            <rect x="29" y="22.5" width="0.9" height="0.9" fill="#1d4ed8" opacity="0.5" />
            <rect x="31.5" y="22.5" width="0.9" height="0.9" fill="#1d4ed8" opacity="0.5" />
            
            <rect x="29" y="24.5" width="0.9" height="0.9" fill="#1d4ed8" opacity="0.5" />
            <rect x="31.5" y="24.5" width="0.9" height="0.9" fill="#1d4ed8" opacity="0.5" />
            
            <rect x="29" y="26.5" width="0.9" height="0.9" fill="#1d4ed8" opacity="0.5" />
            <rect x="31.5" y="26.5" width="0.9" height="0.9" fill="#1d4ed8" opacity="0.5" />
            
            <rect x="29" y="28.5" width="0.9" height="0.9" fill="#1d4ed8" opacity="0.5" />
            <rect x="31.5" y="28.5" width="0.9" height="0.9" fill="#1d4ed8" opacity="0.5" />
            
            <rect x="29" y="30.5" width="0.9" height="0.9" fill="#1d4ed8" opacity="0.5" />
            <rect x="31.5" y="30.5" width="0.9" height="0.9" fill="#1d4ed8" opacity="0.5" />
            
            <rect x="29" y="32.5" width="0.9" height="0.9" fill="#1d4ed8" opacity="0.5" />
            <rect x="31.5" y="32.5" width="0.9" height="0.9" fill="#1d4ed8" opacity="0.5" />
            
            <rect x="29" y="34.5" width="0.9" height="0.9" fill="#1d4ed8" opacity="0.5" />
            <rect x="31.5" y="34.5" width="0.9" height="0.9" fill="#1d4ed8" opacity="0.5" />
            
            <rect x="29" y="36.5" width="0.9" height="0.9" fill="#1d4ed8" opacity="0.5" />
            <rect x="31.5" y="36.5" width="0.9" height="0.9" fill="#1d4ed8" opacity="0.5" />
            
            <rect x="29" y="38.5" width="0.9" height="0.9" fill="#1d4ed8" opacity="0.5" />
            <rect x="31.5" y="38.5" width="0.9" height="0.9" fill="#1d4ed8" opacity="0.5" />
            
            <rect x="29" y="40" width="0.9" height="0.9" fill="#1d4ed8" opacity="0.5" />
            <rect x="31.5" y="40" width="0.9" height="0.9" fill="#1d4ed8" opacity="0.5" />
          </g>
          
          {/* Sixth building - Medium width */}
          <g fill="white">
            <rect x="35" y="28" width="5" height="14" rx="0.4" />
            {/* Rooftop AC units */}
            <rect x="36" y="27" width="1" height="1" rx="0.2" />
            <rect x="38" y="27" width="1" height="1" rx="0.2" />
            {/* Windows */}
            <rect x="36" y="29.5" width="0.8" height="0.8" fill="#1d4ed8" opacity="0.5" />
            <rect x="37.5" y="29.5" width="0.8" height="0.8" fill="#1d4ed8" opacity="0.5" />
            
            <rect x="36" y="31.5" width="0.8" height="0.8" fill="#1d4ed8" opacity="0.5" />
            <rect x="37.5" y="31.5" width="0.8" height="0.8" fill="#1d4ed8" opacity="0.5" />
            
            <rect x="36" y="33.5" width="0.8" height="0.8" fill="#1d4ed8" opacity="0.5" />
            <rect x="37.5" y="33.5" width="0.8" height="0.8" fill="#1d4ed8" opacity="0.5" />
            
            <rect x="36" y="35.5" width="0.8" height="0.8" fill="#1d4ed8" opacity="0.5" />
            <rect x="37.5" y="35.5" width="0.8" height="0.8" fill="#1d4ed8" opacity="0.5" />
            
            <rect x="36" y="37.5" width="0.8" height="0.8" fill="#1d4ed8" opacity="0.5" />
            <rect x="37.5" y="37.5" width="0.8" height="0.8" fill="#1d4ed8" opacity="0.5" />
            
            <rect x="36" y="39.5" width="0.8" height="0.8" fill="#1d4ed8" opacity="0.5" />
            <rect x="37.5" y="39.5" width="0.8" height="0.8" fill="#1d4ed8" opacity="0.5" />
          </g>
          
          {/* Seventh building - Short on far right */}
          <g fill="white">
            <rect x="41" y="33" width="4" height="9" rx="0.4" />
            {/* Windows */}
            <rect x="42" y="34.5" width="0.7" height="0.7" fill="#1d4ed8" opacity="0.5" />
            <rect x="42" y="36.5" width="0.7" height="0.7" fill="#1d4ed8" opacity="0.5" />
            <rect x="42" y="38.5" width="0.7" height="0.7" fill="#1d4ed8" opacity="0.5" />
            <rect x="42" y="40" width="0.7" height="0.7" fill="#1d4ed8" opacity="0.5" />
          </g>
        </g>
        
        {/* "N" Letter - Bold and Modern (on top of skyline) */}
        <path 
          d="M 14 13 L 14 33 L 18 33 L 18 21 L 30 33 L 34 33 L 34 13 L 30 13 L 30 25 L 18 13 Z" 
          fill="white"
          strokeWidth="0"
        />
        
        {/* Subtle shadow/depth for N */}
        <path 
          d="M 14 13 L 14 33 L 18 33 L 18 21 L 30 33 L 34 33 L 34 13 L 30 13 L 30 25 L 18 13 Z" 
          fill="black"
          opacity="0.1"
          transform="translate(0.5, 0.5)"
        />
      </svg>
      
      {/* Text Logo */}
      {variant === 'full' && (
        <div className="flex flex-col leading-none">
          <span className={`font-display font-bold text-primary-600 ${textSize}`}>
            NumexRE
          </span>
          <span className="text-[10px] text-neutral-500 tracking-wider uppercase mt-0.5">
            Real Estate Analytics
          </span>
        </div>
      )}
    </div>
  )
}

// Alternative Logo Variant: Square "NR" Monogram
export function NumexRELogoSquare({ 
  size = 32,
  className = '' 
}: { size?: number, className?: string }) {
  const gradientId = useId()
  
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 48 48" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>
      
      <rect x="2" y="2" width="44" height="44" rx="8" fill={`url(#${gradientId})`} />
      
      <g fill="white">
        <path d="M 10 12 L 10 36 L 13 36 L 13 20 L 22 36 L 25 36 L 25 12 L 22 12 L 22 28 L 13 12 Z" />
        <path d="M 28 12 L 28 36 L 31 36 L 31 26 L 35 26 L 38 36 L 42 36 L 38.5 25 C 40 24 41 22.5 41 20 C 41 16.5 38.5 12 34 12 Z M 31 15 L 34 15 C 36 15 38 16 38 20 C 38 22 37 23 34 23 L 31 23 Z" />
      </g>
    </svg>
  )
}

// Alternative Logo Variant: Minimal Building Icon
export function NumexRELogoMinimal({ 
  size = 32,
  className = '' 
}: { size?: number, className?: string }) {
  const gradientId = useId()
  
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 48 48" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>
      
      <rect x="8" y="20" width="8" height="22" fill={`url(#${gradientId})`} rx="1" />
      <rect x="20" y="12" width="8" height="30" fill={`url(#${gradientId})`} rx="1" />
      <rect x="32" y="18" width="8" height="24" fill={`url(#${gradientId})`} rx="1" />
      
      <rect x="10" y="24" width="2" height="2" fill="white" opacity="0.6" rx="0.5" />
      <rect x="14" y="24" width="2" height="2" fill="white" opacity="0.6" rx="0.5" />
      <rect x="10" y="28" width="2" height="2" fill="white" opacity="0.6" rx="0.5" />
      <rect x="14" y="28" width="2" height="2" fill="white" opacity="0.6" rx="0.5" />
      
      <rect x="22" y="16" width="2" height="2" fill="white" opacity="0.6" rx="0.5" />
      <rect x="26" y="16" width="2" height="2" fill="white" opacity="0.6" rx="0.5" />
      <rect x="22" y="20" width="2" height="2" fill="white" opacity="0.6" rx="0.5" />
      <rect x="26" y="20" width="2" height="2" fill="white" opacity="0.6" rx="0.5" />
      
      <rect x="34" y="22" width="2" height="2" fill="white" opacity="0.6" rx="0.5" />
      <rect x="38" y="22" width="2" height="2" fill="white" opacity="0.6" rx="0.5" />
      <rect x="34" y="26" width="2" height="2" fill="white" opacity="0.6" rx="0.5" />
      <rect x="38" y="26" width="2" height="2" fill="white" opacity="0.6" rx="0.5" />
    </svg>
  )
}