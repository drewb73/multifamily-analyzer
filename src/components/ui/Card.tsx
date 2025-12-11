import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  hoverable?: boolean
}

export function Card({ 
  children, 
  className = '',
  hoverable = true 
}: CardProps) {
  return (
    <div className={`elevated-card ${hoverable ? 'hover:shadow-medium' : ''} ${className}`}>
      {children}
    </div>
  )
}