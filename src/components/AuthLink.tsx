'use client';

import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';

interface AuthLinkProps {
  href: string;
  signupRedirect?: string;
  children: React.ReactNode;
  className?: string;
}

export default function AuthLink({ 
  href, 
  signupRedirect = '/auth/login', 
  children, 
  className = '' 
}: AuthLinkProps) {
  const { user } = useAuth();
  
  // If user is logged in, go to the intended destination
  // If not logged in, redirect to login
  const destination = user ? href : signupRedirect;
  
  return (
    <Link href={destination} className={className}>
      {children}
    </Link>
  );
} 