import {
  File,
  FileArchive,
  FileImage,
  FileJson,
  FileSpreadsheet,
  FileText,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '../lib/cn'

interface FileType {
  icon: LucideIcon
  color: string
}

const fileTypes: Record<string, FileType> = {
  pdf: { icon: FileText, color: '#ef4444' },
  doc: { icon: FileText, color: '#3b82f6' },
  docx: { icon: FileText, color: '#3b82f6' },
  xls: { icon: FileSpreadsheet, color: '#10b981' },
  xlsx: { icon: FileSpreadsheet, color: '#10b981' },
  csv: { icon: FileSpreadsheet, color: '#10b981' },
  md: { icon: FileText, color: '#22c55e' },
  txt: { icon: FileText, color: '#94a3b8' },
  json: { icon: FileJson, color: '#eab308' },
  png: { icon: FileImage, color: '#a78bfa' },
  jpg: { icon: FileImage, color: '#a78bfa' },
  jpeg: { icon: FileImage, color: '#a78bfa' },
  gif: { icon: FileImage, color: '#a78bfa' },
  zip: { icon: FileArchive, color: '#f59e0b' },
}

function typeFor(fileName: string): FileType {
  const extension = fileName.split('.').pop()?.toLowerCase() ?? ''
  return fileTypes[extension] ?? { icon: File, color: '#94a3b8' }
}

interface FileTypeIconProps {
  fileName: string
  className?: string
}

export function FileTypeIcon({ fileName, className }: FileTypeIconProps) {
  const { icon: Icon, color } = typeFor(fileName)

  return (
    <span
      className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', className)}
      style={{ backgroundColor: `${color}1f`, color }}
      aria-hidden
    >
      <Icon className="h-[18px] w-[18px]" />
    </span>
  )
}
