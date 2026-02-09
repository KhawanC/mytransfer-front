# MyTransfer - Frontend

## 📋 Sobre o Projeto

O **MyTransfer Frontend** é uma aplicação web moderna desenvolvida em Next.js para transferência de arquivos peer-to-peer (P2P) em tempo real. Interface intuitiva e responsiva que permite aos usuários compartilhar arquivos de forma segura através de sessões únicas com QR Code.

## 🎯 Propósito

Fornecer uma experiência de usuário fluida e moderna para:
- **Compartilhar arquivos** de forma rápida e segura
- **Criar sessões** de transferência com convite via QR Code
- **Acompanhar uploads/downloads** em tempo real
- **Gerenciar permissões** de acesso às sessões
- **Retomar uploads** interrompidos automaticamente

## ✨ Principais Funcionalidades

### 🔐 Autenticação
- **Login/Registro Local**: Autenticação com email e senha
- **Login Social**: Integração com Google OAuth2
- **Sessão Persistente**: Tokens JWT com refresh automático
- **Proteção de Rotas**: Redirecionamento automático para login
- **Fingerprint**: Validação de dispositivo para segurança adicional

### 📁 Gerenciamento de Sessões
- **Criar Sessão**: Geração instantânea de sessão de transferência
- **QR Code**: Compartilhamento via QR Code ou link direto
- **Entrar via QR**: Scanner de QR Code integrado para entrada rápida
- **Sistema de Aprovação**: Criador aprova/rejeita solicitações de entrada
- **Lista de Sessões**: Visualização de todas as sessões ativas do usuário
- **Status em Tempo Real**: Atualizações instantâneas de status da sessão

### 📤 Upload de Arquivos
- **Drag & Drop**: Interface intuitiva para upload de arquivos
- **Upload Múltiplo**: Seleção e upload de vários arquivos simultaneamente
- **Upload em Chunks**: Divisão automática de arquivos grandes
- **Upload Resumable**: Retomada automática de uploads interrompidos
- **Progresso em Tempo Real**: Barra de progresso com porcentagem e velocidade
- **Validação de Arquivo**: Verificação de tipo e tamanho antes do upload
- **Controle de Concorrência**: Limite de uploads simultâneos para performance

### 📥 Download de Arquivos
- **Lista de Arquivos**: Visualização de todos os arquivos da sessão
- **Download Direto**: Download com um clique
- **Informações Detalhadas**: Nome, tamanho, remetente e status
- **Filtros**: Organização de arquivos por status ou remetente

### 🔔 Notificações em Tempo Real
- **WebSocket/STOMP**: Conexão persistente para atualizações instantâneas
- **Toast Notifications**: Notificações elegantes no canto da tela
- **Eventos de Sessão**: Notificações de entrada, aprovação, rejeição
- **Progresso de Upload**: Atualizações de progresso de outros participantes
- **Reconexão Automática**: Reconexão ao WebSocket em caso de falha

### 💾 Recuperação de Uploads
- **Armazenamento Local**: Histórico de uploads salvos no navegador
- **Recuperação Automática**: Detecção de uploads pendentes ao entrar na sessão
- **Retomada com Um Clique**: Interface para retomar uploads interrompidos
- **Limpeza Automática**: Remoção de uploads concluídos ou expirados

## 🏗️ Arquitetura

### Tecnologias e Frameworks

#### Core
- **Next.js 16.1.6**: Framework React com SSR e App Router
- **React 19.2.3**: Biblioteca de UI
- **TypeScript 5**: Tipagem estática
- **Node.js 20+**: Runtime JavaScript

#### UI e Estilização
- **Tailwind CSS 4**: Framework CSS utility-first
- **shadcn/ui**: Componentes acessíveis e customizáveis
- **Radix UI**: Primitivos de UI headless
- **Lucide React**: Ícones modernos
- **next-themes**: Suporte a tema claro/escuro

#### Formulários e Validação
- **React Hook Form 7.71**: Gerenciamento de formulários
- **Zod 4.3**: Validação de schemas TypeScript-first
- **@hookform/resolvers**: Integração Zod + React Hook Form

#### Comunicação e Dados
- **@stomp/stompjs 7.3**: Cliente WebSocket/STOMP
- **Fetch API**: Requisições HTTP
- **JWT**: Autenticação baseada em tokens

#### Funcionalidades Especiais
- **QRCode.react 4.2**: Geração de QR Codes
- **html5-qrcode 2.3**: Scanner de QR Code via câmera
- **date-fns 4.1**: Manipulação de datas
- **p-limit 7.3**: Controle de concorrência de uploads
- **sonner 2.0**: Toast notifications elegantes

### Estrutura de Diretórios

```
frontend/
├── app/                          # App Router do Next.js
│   ├── dashboard/               # Dashboard de sessões
│   │   ├── page.tsx            # Página principal
│   │   ├── layout.tsx          # Layout do dashboard
│   │   └── loading.tsx         # Loading state
│   ├── login/                   # Página de login
│   ├── oauth/callback/          # Callback do OAuth2
│   ├── sessao/[id]/            # Página da sessão
│   │   ├── page.tsx            # Visualização da sessão
│   │   └── loading.tsx         # Loading state
│   ├── transfer/[hash]/         # Entrada via hash público
│   ├── layout.tsx              # Layout raiz
│   ├── page.tsx                # Página inicial (redirects)
│   ├── globals.css             # Estilos globais
│   ├── error.tsx               # Página de erro
│   └── not-found.tsx           # Página 404
├── components/                  # Componentes React
│   ├── auth/                   # Componentes de autenticação
│   │   ├── login-form.tsx     # Formulário de login
│   │   ├── register-form.tsx  # Formulário de registro
│   │   └── oauth-button.tsx   # Botão OAuth2
│   ├── dashboard/              # Componentes do dashboard
│   │   ├── create-session.tsx # Criar sessão
│   │   ├── join-session.tsx   # Entrar em sessão
│   │   ├── qr-scanner.tsx     # Scanner de QR
│   │   ├── session-card.tsx   # Card de sessão
│   │   └── session-list.tsx   # Lista de sessões
│   ├── session/                # Componentes da sessão
│   │   ├── file-card.tsx      # Card de arquivo
│   │   ├── file-list.tsx      # Lista de arquivos
│   │   ├── session-header.tsx # Cabeçalho da sessão
│   │   ├── upload-zone.tsx    # Zona de upload
│   │   ├── recoverable-uploads.tsx # Uploads recuperáveis
│   │   └── pending-approval-alert.tsx # Alerta de pendência
│   └── ui/                     # Componentes shadcn/ui
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── form.tsx
│       ├── input.tsx
│       ├── progress.tsx
│       └── ... (outros)
├── hooks/                       # Custom React Hooks
│   ├── use-websocket.ts        # Hook de WebSocket/STOMP
│   ├── use-upload.ts           # Hook de upload de arquivos
│   ├── use-upload-recovery.ts  # Hook de recuperação de uploads
│   └── use-countdown.ts        # Hook de countdown
├── lib/                         # Utilitários e helpers
│   ├── api.ts                  # Cliente API HTTP
│   ├── auth.ts                 # Helpers de autenticação
│   ├── constants.ts            # Constantes da aplicação
│   ├── fingerprint.ts          # Geração de fingerprint
│   ├── upload-storage.ts       # Storage de uploads
│   └── utils.ts                # Funções utilitárias
├── providers/                   # Context Providers
│   └── auth-provider.tsx       # Provider de autenticação
├── types/                       # Definições de tipos TypeScript
│   └── index.ts                # Tipos da aplicação
└── public/                      # Arquivos estáticos
```

### Padrões de Projeto

- **Component-Based Architecture**: Componentes reutilizáveis e isolados
- **Custom Hooks**: Lógica reutilizável encapsulada em hooks
- **Context API**: Gerenciamento de estado global (Auth)
- **Server/Client Components**: Otimização de renderização Next.js
- **Composition Pattern**: Composição de componentes para flexibilidade
- **Container/Presenter**: Separação de lógica e apresentação

### Fluxo de Dados

```
Usuário
    ↓
Componente React
    ↓
Custom Hook (use-websocket, use-upload)
    ↓
API Client (lib/api.ts)
    ↓
Backend REST/WebSocket
```

## 🚀 Configuração e Deploy

### Pré-requisitos
- Node.js 20+
- npm ou yarn
- Backend MyTransfer rodando

### Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# URL do backend
NEXT_PUBLIC_API_URL=http://localhost:8080

# URL do WebSocket
NEXT_PUBLIC_WS_URL=http://localhost:8080/ws
```

### Instalação e Execução

```bash
# Instalar dependências
npm install

# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Executar produção
npm start

# Lint
npm run lint
```

### Docker

```bash
# Build
docker build -t mytransfer-frontend .

# Run
docker run -p 3000:3000 mytransfer-frontend
```

## 🎨 Componentes Principais

### Dashboard
- **CreateSession**: Botão e modal para criar nova sessão
- **JoinSession**: Input e scanner QR para entrar em sessão
- **SessionList**: Lista todas as sessões do usuário
- **SessionCard**: Card individual de sessão com informações e ações

### Sessão
- **SessionHeader**: Cabeçalho com informações e QR Code da sessão
- **UploadZone**: Área de drag & drop para upload de arquivos
- **FileList**: Lista todos os arquivos da sessão
- **FileCard**: Card de arquivo com progresso e ações
- **RecoverableUploads**: Alert para retomar uploads interrompidos
- **PendingApprovalAlert**: Alert para usuário aguardando aprovação

### Auth
- **LoginForm**: Formulário de login com validação
- **RegisterForm**: Formulário de registro com validação
- **OAuthButton**: Botão de login com Google

## 🔌 Hooks Customizados

### `useWebSocket`
Gerencia conexão WebSocket/STOMP com o backend
```typescript
const { isConnected, subscribe, send } = useWebSocket()
```

### `useUpload`
Gerencia upload de arquivos em chunks
```typescript
const { upload, progress, cancel } = useUpload(sessaoId)
```

### `useUploadRecovery`
Gerencia recuperação de uploads interrompidos
```typescript
const { pendingUploads, recovery, clear } = useUploadRecovery()
```

### `useCountdown`
Countdown timer para expiração de sessão
```typescript
const timeRemaining = useCountdown(expirationDate)
```

## 🔒 Segurança

### Implementações
- ✅ Autenticação JWT com refresh token
- ✅ Proteção de rotas privadas
- ✅ Validação de formulários com Zod
- ✅ Sanitização de inputs
- ✅ CORS configurado
- ✅ HTTP-only cookies (backend)
- ✅ Validação de fingerprint
- ✅ Reconexão segura do WebSocket

## 📱 Responsividade

A aplicação é totalmente responsiva e funciona perfeitamente em:
- 📱 Smartphones (320px+)
- 📱 Tablets (768px+)
- 💻 Desktops (1024px+)
- 🖥️ Telas grandes (1920px+)

## 🎯 Performance

### Otimizações
- Server-side rendering (SSR) com Next.js
- Code splitting automático
- Lazy loading de componentes
- Image optimization com next/image
- CSS-in-JS com Tailwind
- WebSocket para comunicação eficiente
- Upload em chunks para arquivos grandes
- Debouncing e throttling em inputs

## 📝 Licença

Este projeto é privado e proprietário.

## 👥 Autores

Desenvolvido por KhawanTech
