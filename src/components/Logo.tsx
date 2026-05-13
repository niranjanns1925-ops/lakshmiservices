import React from 'react';

interface LogoProps {
  className?: string;
}

export function Logo({ className = "w-full h-full p-1" }: LogoProps) {
  return (
    <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Background green canopy */}
      <path d="M20,50 C20,30 40,20 50,20 C60,20 80,30 80,50 C90,50 95,65 85,75 C70,75 30,75 15,75 C5,65 10,50 20,50 Z" fill="#22c55e" />
      
      {/* Foreground lighter green canopy */}
      <path d="M30,55 C30,35 45,30 50,30 C55,30 70,35 70,55 C80,55 85,65 75,70 C60,70 40,70 25,70 C15,65 20,55 30,55 Z" fill="#84cc16" />
      
      {/* Central yellow sun/burst */}
      <path d="M47,38 L50,30 L53,38 L62,40 L55,46 L58,55 L50,51 L42,55 L45,46 L38,40 Z" fill="#facc15" />
      
      {/* Brown Tree Trunk (Y Shape) */}
      <path d="M45,95 C45,80 47,70 47,65 C43,60 35,55 33,52 L35,48 C42,55 49,60 50,65 C51,60 58,55 65,48 L67,52 C65,55 57,60 53,65 C53,70 55,80 55,95 Z" fill="#78350f" />
      
      {/* Hanging roots */}
      <path d="M25,72 Q23,85 24,90 M32,70 Q30,80 30,85 M75,72 Q77,85 76,90 M68,70 Q70,80 70,85" stroke="#22c55e" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}
