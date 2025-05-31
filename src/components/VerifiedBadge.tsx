interface VerifiedBadgeProps {
  verified: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function VerifiedBadge({ verified, size = 'md', className = '' }: VerifiedBadgeProps) {
  if (!verified) return null;

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5', 
    lg: 'w-6 h-6'
  };

  return (
    <div 
      className={`inline-flex items-center justify-center ${sizeClasses[size]} ${className}`}
      title="Verified"
    >
      <svg 
        className="w-full h-full text-blue-600" 
        fill="currentColor" 
        viewBox="0 0 24 24"
      >
        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
  );
} 