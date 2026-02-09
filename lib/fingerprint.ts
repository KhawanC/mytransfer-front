"use client"

const PARTIAL_HASH_SIZE = 5 * 1024 * 1024

async function computeSHA256(data: BufferSource): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", data)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

export async function calculateFileFingerprint(file: File): Promise<string> {
  const partialSize = Math.min(file.size, PARTIAL_HASH_SIZE)
  const partialBlob = file.slice(0, partialSize)
  const partialBuffer = await partialBlob.arrayBuffer()
  const partialHash = await computeSHA256(partialBuffer)

  const fingerprintData = `${file.name}|${file.size}|${file.lastModified}|${partialHash}`
  
  const encoder = new TextEncoder()
  const fingerprintBuffer = encoder.encode(fingerprintData)
  const fingerprintHash = await computeSHA256(fingerprintBuffer)

  return fingerprintHash
}

export async function calculateFullFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  return computeSHA256(buffer)
}

export async function calculateChunkHash(chunk: ArrayBuffer): Promise<string> {
  return computeSHA256(chunk)
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = ""
  const bytes = new Uint8Array(buffer)
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}
