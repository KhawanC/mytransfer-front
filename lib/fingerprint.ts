/**
 * Utilitário para calcular fingerprint único de arquivos.
 * O fingerprint é usado para identificar o mesmo arquivo após refresh da página,
 * permitindo retomar uploads interrompidos.
 * 
 * Composto por: nome + tamanho + lastModified + hash parcial dos primeiros 5MB
 */

const PARTIAL_HASH_SIZE = 5 * 1024 * 1024 // 5MB

/**
 * Calcula o SHA-256 de um BufferSource (ArrayBuffer ou ArrayBufferView).
 */
async function computeSHA256(data: BufferSource): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", data)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

/**
 * Calcula um fingerprint único para o arquivo baseado em:
 * - Nome do arquivo
 * - Tamanho em bytes
 * - Data de última modificação
 * - Hash SHA-256 dos primeiros 5MB do conteúdo
 * 
 * Este fingerprint permite identificar o mesmo arquivo após refresh,
 * possibilitando a retomada de uploads interrompidos.
 */
export async function calculateFileFingerprint(file: File): Promise<string> {
  // Lê apenas os primeiros 5MB para o hash parcial
  const partialSize = Math.min(file.size, PARTIAL_HASH_SIZE)
  const partialBlob = file.slice(0, partialSize)
  const partialBuffer = await partialBlob.arrayBuffer()
  const partialHash = await computeSHA256(partialBuffer)

  // Combina os metadados + hash parcial
  const fingerprintData = `${file.name}|${file.size}|${file.lastModified}|${partialHash}`
  
  // Gera um hash final do fingerprint para ter um ID consistente
  const encoder = new TextEncoder()
  const fingerprintBuffer = encoder.encode(fingerprintData)
  const fingerprintHash = await computeSHA256(fingerprintBuffer)

  return fingerprintHash
}

/**
 * Calcula o hash SHA-256 completo do arquivo.
 * Usado para deduplicação e verificação de integridade.
 */
export async function calculateFullFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  return computeSHA256(buffer)
}

/**
 * Calcula o hash SHA-256 de um chunk específico.
 */
export async function calculateChunkHash(chunk: ArrayBuffer): Promise<string> {
  return computeSHA256(chunk)
}

/**
 * Converte ArrayBuffer para Base64.
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = ""
  const bytes = new Uint8Array(buffer)
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}
