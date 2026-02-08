export interface User {
  id: string
  email: string
  name: string
  authProvider: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
  user: User
}

export type StatusSessao = "AGUARDANDO" | "AGUARDANDO_APROVACAO" | "ATIVA" | "EXPIRADA" | "ENCERRADA"

export type StatusArquivo = "PENDENTE" | "ENVIANDO" | "PROCESSANDO" | "COMPLETO" | "ERRO"

export interface Sessao {
  id: string
  hashConexao: string
  qrCodeBase64?: string
  status: StatusSessao
  usuarioCriadorId: string
  usuarioConvidadoId?: string
  usuarioConvidadoPendenteId?: string
  nomeUsuarioConvidadoPendente?: string
  totalArquivosTransferidos: number
  criadaEm: string
  expiraEm: string
}

export interface Arquivo {
  id: string
  sessaoId: string
  nomeOriginal: string
  tamanhoBytes: number
  tipoMime: string
  status: StatusArquivo
  remetenteId: string
  nomeRemetente?: string
  progressoUpload: number
  totalChunks: number
  chunksRecebidos: number
  criadoEm: string
  atualizadoEm: string
}

export interface IniciarUploadResponse {
  arquivoId: string
  sessaoId: string
  nomeArquivo: string
  tamanhoBytes: number
  totalChunks: number
  chunkSizeBytes: number
  status: StatusArquivo
  arquivoDuplicado: boolean
  arquivoExistenteId?: string
  criadoEm: string
}

export interface ProgressoUploadResponse {
  arquivoId: string
  sessaoId: string
  nomeArquivo: string
  chunkAtual: number
  totalChunks: number
  progressoPorcentagem: number
  completo: boolean
  urlDownload?: string
}

export interface NotificacaoResponse {
  tipo: TipoNotificacao
  sessaoId: string
  mensagem: string
  dados?: unknown
  timestamp: string
}

export type TipoNotificacao =
  | "USUARIO_ENTROU"
  | "USUARIO_SAIU"
  | "SESSAO_ENCERRADA"
  | "SESSAO_EXPIRADA"
  | "UPLOAD_INICIADO"
  | "UPLOAD_PROGRESSO"
  | "UPLOAD_COMPLETO"
  | "UPLOAD_ERRO"
  | "ARQUIVO_DISPONIVEL"
  | "SOLICITACAO_ENTRADA"
  | "ENTRADA_APROVADA"
  | "ENTRADA_REJEITADA"

export interface DownloadResponse {
  arquivoId: string
  urlDownload: string
}

// Tipos para upload resumable

export interface ProgressoDetalhadoResponse {
  arquivoId: string
  sessaoId: string
  nomeArquivo: string
  tamanhoBytes: number
  totalChunks: number
  chunkSizeBytes: number
  chunksRecebidos: number[]
  progressoPorcentagem: number
  status: StatusArquivo
  uploadValido: boolean
}

export interface UploadPendenteResponse {
  arquivoId: string
  sessaoId: string
  nomeOriginal: string
  tamanhoBytes: number
  tipoMime: string
  hashConteudo: string
  totalChunks: number
  chunkSizeBytes: number
  chunksRecebidos: number[]
  progressoPorcentagem: number
  status: StatusArquivo
  criadoEm: string
}

