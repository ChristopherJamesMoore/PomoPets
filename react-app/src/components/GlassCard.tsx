import { type ReactNode } from 'react';
import './GlassCard.css';

interface Props {
  children: ReactNode;
  className?: string;
}

export default function GlassCard({ children, className = '' }: Props) {
  return <div className={`glass-card ${className}`}>{children}</div>;
}
