import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)) }
export function formatDate(value?: string | null) { return value ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '—' }
export function formatScore(value?: number | null) { return value == null ? '—' : `${Math.round(value * 100) / 100}%` }
