import { motion } from 'motion/react';

interface UkrainianPatternProps {
  opacity?: number;
  animated?: boolean;
}

export function UkrainianPattern({ opacity = 0.05, animated = true }: UkrainianPatternProps) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ opacity }}>
      <svg className="w-full h-full" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id="ukrainianPattern" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 30 10 L 20 20 L 10 10 Z M 60 0 L 70 10 L 60 20 L 50 10 Z" fill="#FFC72C" opacity="0.3" />
            <path d="M 40 20 L 50 30 L 40 40 L 30 30 Z" fill="#00E5FF" opacity="0.3" />
            <path d="M 0 40 L 10 50 L 0 60 L -10 50 Z M 80 40 L 90 50 L 80 60 L 70 50 Z" fill="#9747FF" opacity="0.3" />
            <path d="M 20 60 L 30 70 L 20 80 L 10 70 Z M 60 60 L 70 70 L 60 80 L 50 70 Z" fill="#FF2A5F" opacity="0.2" />
          </pattern>
          <linearGradient id="cyberpunkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFC72C" stopOpacity="0.1" />
            <stop offset="50%" stopColor="#00E5FF" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#9747FF" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        <rect width="390" height="844" fill="url(#ukrainianPattern)" />

        {Array.from({ length: 12 }).map((_, i) => (
          <motion.line
            key={`h-${i}`}
            x1="0"
            y1={i * 70}
            x2="390"
            y2={i * 70}
            stroke="#FFC72C"
            strokeWidth="0.5"
            opacity="0.1"
            initial={{ pathLength: 0 }}
            animate={animated ? { pathLength: [0, 1, 0], opacity: [0.1, 0.3, 0.1] } : {}}
            transition={{ duration: 8, repeat: Infinity, delay: i * 0.3 }}
          />
        ))}

        {Array.from({ length: 6 }).map((_, i) => (
          <motion.line
            key={`v-${i}`}
            x1={i * 65}
            y1="0"
            x2={i * 65}
            y2="844"
            stroke="#00E5FF"
            strokeWidth="0.5"
            opacity="0.1"
            initial={{ pathLength: 0 }}
            animate={animated ? { pathLength: [0, 1, 0], opacity: [0.1, 0.3, 0.1] } : {}}
            transition={{ duration: 10, repeat: Infinity, delay: i * 0.5 }}
          />
        ))}
      </svg>
    </div>
  );
}
