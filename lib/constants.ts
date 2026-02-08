export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:8080/ws"

export const CHUNK_SIZE_MB = 5
export const CHUNK_SIZE_BYTES = CHUNK_SIZE_MB * 1024 * 1024
export const MAX_FILE_SIZE_MB = 1024
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
export const MAX_FILES_PER_SESSION = 50
export const SESSION_TTL_HOURS = 0.5
