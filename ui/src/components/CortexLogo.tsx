export function CortexLogo({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="cortex-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d4af37" />
          <stop offset="50%" stopColor="#cd7f32" />
          <stop offset="100%" stopColor="#c2b280" />
        </linearGradient>
      </defs>
      
      {/* Outer circle */}
      <circle cx="50" cy="50" r="48" stroke="url(#cortex-gradient)" strokeWidth="2" fill="#0a0a0a" />
      
      {/* Brain icon */}
      <path
        d="M50 25 C40 25, 35 30, 35 40 C35 45, 37 48, 40 50 C37 52, 35 55, 35 60 C35 70, 40 75, 50 75 C60 75, 65 70, 65 60 C65 55, 63 52, 60 50 C63 48, 65 45, 65 40 C65 30, 60 25, 50 25 Z"
        fill="url(#cortex-gradient)"
      />
      
      {/* Neural connections */}
      <circle cx="42" cy="40" r="3" fill="#0a0a0a" />
      <circle cx="58" cy="40" r="3" fill="#0a0a0a" />
      <circle cx="42" cy="60" r="3" fill="#0a0a0a" />
      <circle cx="58" cy="60" r="3" fill="#0a0a0a" />
      <circle cx="50" cy="50" r="3" fill="#0a0a0a" />
      
      {/* Connection lines */}
      <line x1="42" y1="40" x2="50" y2="50" stroke="#0a0a0a" strokeWidth="1.5" />
      <line x1="58" y1="40" x2="50" y2="50" stroke="#0a0a0a" strokeWidth="1.5" />
      <line x1="42" y1="60" x2="50" y2="50" stroke="#0a0a0a" strokeWidth="1.5" />
      <line x1="58" y1="60" x2="50" y2="50" stroke="#0a0a0a" strokeWidth="1.5" />
    </svg>
  );
}
