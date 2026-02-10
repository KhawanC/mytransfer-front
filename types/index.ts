export type UserType = 'GUEST' | 'FREE' | 'PREMIUM'

export type FormatoImagem = 'JPEG' | 'JPG' | 'PNG' | 'BMP' | 'WEBP' | 'SVG' | 'TIFF' | 'ICO'

export interface User {
  id: string
  email: string
  name: string
  authProvider: string
  userType: UserType
  guestCreatedAt?: string
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

export interface SessaoLimites {
  maxArquivos: number | null
  maxTamanhoMb: number
  duracaoMinutos: number
  userType: UserType
  arquivosIlimitados: boolean
}

export interface SessaoEstatisticas {
  quantidadeArquivos: number
  limiteArquivos: number | null
  tamanhoTotalBytes: number
  limiteTamanhoBytes: number
  espacoDisponivel: number
}

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
  hashExpiraEm?: string
  podeUpload?: boolean
  podeEncerrar?: boolean
  estaAtiva?: boolean
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
  mensagemErro?: string
  criadoEm: string
  atualizadoEm: string
  conversivel?: boolean
  arquivoOriginalId?: string
  formatoConvertido?: string
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
  | "HASH_ATUALIZADO"
  | "UPLOAD_INICIADO"
  | "UPLOAD_PROGRESSO"
  | "UPLOAD_COMPLETO"
  | "UPLOAD_ERRO"
  | "ARQUIVO_DISPONIVEL"
  | "ARQUIVO_CONVERTIDO"
  | "SOLICITACAO_ENTRADA"
  | "SOLICITACAO_ENTRADA_CRIADOR"
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

