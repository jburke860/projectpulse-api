import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react'
import { cn } from '../lib/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean
}

export function Card({ children, className, interactive, ...props }: CardProps) {
  return (
    <div className={cn('pp-card', interactive && 'pp-card-hover', className)} {...props}>
      {children}
    </div>
  )
}

interface PageHeaderProps {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
  className?: string
}

export function PageHeader({ eyebrow, title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('pp-page-header', className)}>
      <div>
        {eyebrow && <p className="pp-eyebrow">{eyebrow}</p>}
        <h1 className="pp-title">{title}</h1>
        {description && <p className="pp-subtitle mt-2 max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap justify-end gap-3">{actions}</div>}
    </div>
  )
}

const buttonVariants = {
  primary: 'pp-button-primary',
  secondary: 'pp-button-secondary',
  danger: 'pp-button-danger',
  ghost: 'pp-button-ghost',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof buttonVariants
}

export function Button({ children, className, variant = 'primary', ...props }: ButtonProps) {
  return (
    <button className={cn(buttonVariants[variant], className)} {...props}>
      {children}
    </button>
  )
}

const badgeTones = {
  neutral: 'pp-chip',
  orange: 'pp-chip pp-chip-orange',
  green: 'pp-chip pp-chip-green',
  yellow: 'pp-chip pp-chip-yellow',
  red: 'pp-chip pp-chip-red',
}

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: keyof typeof badgeTones
}

export function Badge({ children, className, tone = 'neutral', ...props }: BadgeProps) {
  return (
    <span className={cn(badgeTones[tone], className)} {...props}>
      {children}
    </span>
  )
}
