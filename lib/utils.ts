import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`
}

export function formatHash(hash: string): string {
  return hash.match(/.{1,4}/g)?.join("-") ?? hash
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (seconds < 60) return "agora mesmo"
  if (minutes < 60) return `há ${minutes} ${minutes === 1 ? "minuto" : "minutos"}`
  if (hours < 24) return `há ${hours} ${hours === 1 ? "hora" : "horas"}`
  if (days < 7) return `há ${days} ${days === 1 ? "dia" : "dias"}`
  
  return date.toLocaleDateString("pt-BR", { 
    day: "2-digit", 
    month: "2-digit", 
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  })
}

function normalizeMimeToExtensionLabel(mime?: string): string | null {
  if (!mime) return null

  const lower = mime.toLowerCase()

  if (lower.includes("wordprocessingml.document")) return "DOCX"
  if (lower.includes("spreadsheetml.sheet")) return "XLSX"
  if (lower.includes("presentationml.presentation")) return "PPTX"

  if (lower.includes("x-7z-compressed")) return "7Z"
  if (lower.includes("x-rar-compressed")) return "RAR"
  if (lower.endsWith("/zip") || lower.includes("+zip")) return "ZIP"

  if (lower.endsWith("/plain")) return "TXT"
  if (lower.endsWith("/jpeg")) return "JPG"

  const slashIndex = lower.indexOf("/")
  const subtype = slashIndex >= 0 ? lower.slice(slashIndex + 1) : lower
  const lastDot = subtype.lastIndexOf(".")
  const raw = (lastDot >= 0 ? subtype.slice(lastDot + 1) : subtype).trim()

  if (!raw) return null
  return raw.toUpperCase()
}

function normalizeFilenameToExtensionLabel(filename: string): string | null {
  const trimmed = (filename ?? "").trim()
  if (!trimmed) return null

  const lastDot = trimmed.lastIndexOf(".")
  if (lastDot <= 0 || lastDot === trimmed.length - 1) return null

  const ext = trimmed.slice(lastDot + 1).trim()
  if (!ext) return null

  return ext.toUpperCase()
}

export function getFileExtensionLabel(params: {
  nomeOriginal: string
  tipoMime?: string
  formatoConvertido?: string
  isConverted?: boolean
}): string {
  if (params.isConverted && params.formatoConvertido) {
    return String(params.formatoConvertido).trim().toUpperCase()
  }

  return (
    normalizeFilenameToExtensionLabel(params.nomeOriginal) ||
    normalizeMimeToExtensionLabel(params.tipoMime) ||
    "ARQUIVO"
  )
}
