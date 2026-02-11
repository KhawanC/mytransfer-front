# PWA - Progressive Web App Guide

Guia completo para desenvolvimento, teste e deploy do PWA do MePassa.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Configuração Implementada](#configuração-implementada)
- [Geração de Ícones](#geração-de-ícones)
- [Estratégias de Cache](#estratégias-de-cache)
- [Testes e Validação](#testes-e-validação)
- [Deploy em Produção](#deploy-em-produção)
- [Troubleshooting](#troubleshooting)
- [Checklist Final](#checklist-final)

---

## 🎯 Visão Geral

O MePassa foi transformado em um Progressive Web App (PWA) com as seguintes características:

✅ **Instalável** - Pode ser instalado em dispositivos móveis e desktop  
✅ **Cache Inteligente** - Assets estáticos cacheados para melhor performance  
✅ **Offline Aware** - Detecta perda de conexão e informa o usuário  
✅ **Network-First** - Prioriza dados frescos da rede quando online  
❌ **Não Totalmente Offline** - Funcionalidades requerem internet (WebSocket, API, uploads)

### Arquitetura PWA

```
next-pwa (@ducanh2912/next-pwa)
├── Service Worker (auto-gerado)
│   ├── Precache: App shell, static assets
│   ├── Runtime Cache: Fontes, imagens, JS/CSS
│   └── Fallback: /offline quando sem rede
├── Manifest.json
│   ├── Metadados do app (nome, cores, ícones)
│   ├── Display: standalone
│   └── Shortcuts: ações rápidas
└── Componentes UI
    ├── ConnectivityIndicator: Badge de status online/offline
    ├── InstallPrompt: Banner de instalação
    └── OfflinePage: Fallback quando offline
```

---

## ⚙️ Configuração Implementada

### 1. Abordagem: Service Worker Manual

**Por que não usamos next-pwa?**
- Next.js 16 usa Turbopack por padrão
- @ducanh2912/next-pwa não é compatível com Turbopack
- Implementação manual oferece controle total e funciona perfeitamente

### 2. Service Worker (Manual)

```json
{
  "dependencies": {
    "@ducanh2912/next-pwa": "^10.x"
  }
}
```

### 4. next.config.ts

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: process.env.NODE_ENV === 'development',
};

export default nextConfig;
```

**Configuração simples:**
- Sem plugins PWA (SW manual em `public/sw.js`)
- Output standalone para Docker
- Turbopack habilitado por padrão (Next.js 16)

### 5. Arquivos Criados

```
frontend/
├── public/
│   ├── manifest.json          # Manifesto PWA
│   ├── sw.js                  # Service Worker manual
│   └── icons/                 # Ícones PWA (a serem gerados)
│       ├── icon-192x192.png
│       ├── icon-512x512.png
│       ├── icon-maskable-*.png
│       └── apple-touch-icon.png
├── proxy.ts                   # Headers de segurança PWA
├── app/
│   ├── layout.tsx             # Atualizado com metadados PWA + SW register
│   ├── sw-register.tsx        # Componente para registrar SW
│   └── offline/
│       └── page.tsx           # Página de fallback offline
├── components/ui/
│   ├── connectivity-indicator.tsx  # Badge online/offline
│   └── install-prompt.tsx          # Prompt de instalação
└── hooks/
    └── use-online-status.ts       # Hook de conectividade
```

---

## 🎨 Geração de Ícones

### Ícones Necessários

Você precisa gerar os seguintes ícones na pasta `/public/icons/`:

| Arquivo | Tamanho | Propósito |
|---------|---------|-----------|
| `icon-192x192.png` | 192×192px | Mínimo requerido (Android) |
| `icon-512x512.png` | 512×512px | Splash screen, instalação |
| `icon-maskable-192x192.png` | 192×192px | Adaptive icon Android |
| `icon-maskable-512x512.png` | 512×512px | Adaptive icon Android |
| `apple-touch-icon.png` | 180×180px | iOS/Safari |
| `favicon.ico` | 16,32,48px | Ícone do site (multires) |

### Ferramentas Recomendadas

#### Opção 1: PWA Asset Generator (CLI - Automático)

```bash
# Instalar globalmente
npm install -g pwa-asset-generator

# Gerar todos os ícones
pwa-asset-generator seu-logo.svg public/icons \
  --type png \
  --quality 90 \
  --maskable \
  --icon-only \
  --splashscreen false
```

#### Opção 2: RealFaviconGenerator (Online)

1. Acesse: https://realfavicongenerator.net/
2. Upload do logo (mínimo 512×512px, PNG com transparência)
3. Configure:
   - Android Chrome: "Yes, enable"
   - iOS Safari: "Yes, enable"
   - Windows Metro: Opcional
4. Gere e baixe os ícones
5. Extraia para `/public/icons/`

#### Opção 3: Manual (Figma/Photoshop/GIMP)

**⚠️ Importante para Maskable Icons:**
- Adicione 20% de padding ao redor do logo
- Safe zone: logo deve ocupar apenas 80% central
- Evita cortes em diferentes formatos de ícone Android

**Exemplo de criação:**
```
Canvas 512×512px
├── Safe Zone: 410×410px centralizado (80%)
└── Logo: máximo 410×410px
```

Teste maskable icons em: https://maskable.app/editor

---

## 💾 Estratégias de Cache

### Cache Implementado

#### 1. **CacheFirst** - Conteúdo Imutável
```typescript
// Google Fonts, JS estático do Next.js
urlPattern: /^https:\/\/fonts\.(?:gstatic|googleapis)\.com\/.*/i
urlPattern: /\/_next\/static.+\.js$/i
```
- **Uso:** Assets que nunca mudam (hash no nome)
- **Benefício:** Máxima velocidade, sem requests desnecessários

#### 2. **StaleWhileRevalidate** - Assets Dinâmicos
```typescript
// Imagens, fontes locais, CSS, JS da app
urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i
urlPattern: /\.(?:eot|otf|ttc|ttf|woff|woff2)$/i
urlPattern: /\.(?:js|css|json)$/i
```
- **Uso:** Assets que podem ser atualizados
- **Benefício:** Resposta rápida + atualização em background

#### 3. **NetworkFirst** (Implícito) - HTML/Páginas
```typescript
// Todas as páginas/rotas do Next.js
// Não explicitamente cacheadas
```
- **Uso:** Conteúdo dinâmico, páginas SSR
- **Benefício:** Dados sempre frescos quando online

### O Que NÃO é Cacheado

❌ **Rotas de API** (`/api/*`)  
❌ **WebSocket** (`/ws`)  
❌ **Uploads de arquivos**  
❌ **Páginas dinâmicas SSR** (busca sempre da rede)  
❌ **Tokens JWT** (armazenados em localStorage/IndexedDB)

### Expiração de Cache

| Cache | TTL | Max Entries |
|-------|-----|-------------|
| google-fonts | 1 ano | 10 |
| static-font-assets | 7 dias | 10 |
| static-image-assets | 24 horas | 64 |
| next-static-js | 24 horas | 64 |
| static-js-css-assets | 24 horas | 64 |

---

## 🧪 Testes e Validação

### 1. Build e Execução Local

```bash
cd frontend

# Instalar dependências (se necessário)
npm install

# Build de produção
npm run build

# Verificar geração do Service Worker
ls -la public/sw.js public/workbox-*.js

# Iniciar servidor de produção
npm start
```

**Esperado:**
- Build sem erros
- Service Worker gerado em `public/sw.js`
- Workbox assets em `public/workbox-*.js`

### 2. Chrome DevTools - Application Tab

#### Manifest
```
1. Abrir DevTools → Application → Manifest
2. Verificar:
   ✅ Nome: "MePassa - Transferência de Arquivos"
   ✅ Short Name: "MePassa"
   ✅ Start URL: "/?source=pwa"
   ✅ Display: "standalone"
   ✅ Theme Color: "#7c3aed"
   ✅ Ícones: Todos carregando sem erro 404
   ✅ "Add to homescreen" disponível
```

#### Service Workers
```
1. Application → Service Workers
2. Verificar:
   ✅ Status: "activated and running"
   ✅ Source: "/sw.js"
   ✅ Scope: "/"
   ✅ Não deve ter erros no console
```

#### Cache Storage
```
1. Application → Cache Storage
2. Verificar caches criados:
   ✅ workbox-precache-v2-* (app shell)
   ✅ google-fonts (se usar Google Fonts)
   ✅ static-image-assets
   ✅ next-static-js
   ✅ static-js-css-assets
```

### 3. Teste de Instalação

#### Desktop (Chrome/Edge)
```
1. Navegar para http://localhost:3000
2. Aguardar 5 segundos
3. Verificar:
   - Ícone "+" na barra de URL
   - OU banner "Instalar MePassa" (componente InstallPrompt)
4. Clicar em "Instalar"
5. App abre em janela standalone (sem barra de URL)
```

#### Mobile (Android Chrome)
```
1. Abrir app em HTTPS (ngrok ou deploy staging)
2. Menu Chrome → "Adicionar à tela inicial"
3. Ícone aparece na home screen
4. Tocar no ícone → app abre em fullscreen
```

#### iOS Safari
```
1. Abrir app em Safari
2. Tap no botão "Compartilhar" (quadrado com seta)
3. "Adicionar à Tela de Início"
4. Ícone aparece na home screen

⚠️ Limitação iOS:
- Service Worker tem suporte limitado
- Cache pode ser mais agressivamente limpo
- Algumas features PWA podem não funcionar
```

### 4. Teste de Conectividade

#### Modo Offline
```
1. App aberto e funcionando
2. DevTools → Network → Throttling → "Offline"
3. Recarregar página (Ctrl+R)
4. Verificar:
   ✅ Página "/offline" carrega
   ✅ UI mostra "Você está offline"
   ✅ Badge inferior aparece "Você está offline"
   ✅ Assets estáticos (logo, CSS) ainda carregam do cache
```

#### Retorno Online
```
1. Network → Throttling → "Online"
2. Clicar em "Tentar novamente"
3. Verificar:
   ✅ App recarrega normalmente
   ✅ Badge muda para "Conectado novamente" (3 segundos)
   ✅ WebSocket reconecta automaticamente
```

### 5. Lighthouse PWA Audit

```bash
# Chrome DevTools → Lighthouse
1. Abrir Lighthouse tab
2. Selecionar apenas "Progressive Web App"
3. Clicar "Analyze page load"
```

**Critérios de Aprovação (Target: 90+):**

✅ **Installable (30 pontos)**
- [ ] Valid manifest.json
- [ ] Service worker registered
- [ ] HTTPS (obrigatório em produção)
- [ ] Ícones 192px e 512px presentes

✅ **PWA Optimized (15 pontos)**
- [ ] Service worker responde com 200 quando offline
- [ ] Page load fast on mobile (< 3s)
- [ ] Works cross-browser

✅ **Additional (mais pontos)**
- [ ] apple-touch-icon presente
- [ ] Maskable icon presente
- [ ] Theme color configurado
- [ ] Viewport meta adequado

**Erros Comuns:**
- ❌ "No matching service worker detected" → Build não gerou SW
- ❌ "Does not provide a valid apple-touch-icon" → Falta ícone iOS
- ❌ "Manifest doesn't have maskable icon" → Gerar maskable icons
- ❌ "Page load too slow" → Otimizar assets, usar CDN

### 6. Teste de Atualização (Cache Invalidation)

```bash
# Simular novo deploy
1. Fazer mudança no código (ex: mudar cor de um botão)
2. npm run build
3. npm start
4. Recarregar app instalado (Ctrl+Shift+R para hard refresh)
5. Verificar:
   ✅ SW anterior é substituído (skipWaiting: true)
   ✅ Mudança visual aparece imediatamente
   ✅ Cache antigo é limpo automaticamente
```

**Monitorar no Console:**
```javascript
// DevTools Console
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('Service Workers registrados:', regs.length)
  regs.forEach(reg => console.log('SW:', reg.active?.scriptURL))
})
```

---

## 🚀 Deploy em Produção

### Pré-requisitos Obrigatórios

#### 1. HTTPS Obrigatório
```
⚠️ Service Workers só funcionam em HTTPS (exceto localhost)

Opções:
- Vercel/Netlify: HTTPS automático
- Nginx: Configurar Let's Encrypt
- Cloudflare: SSL/TLS Full
- Load Balancer: Certificado SSL
```

#### 2. Headers de Segurança

O proxy.ts já configura headers essenciais. Para deploy em Nginx/Apache:

**Nginx:**
```nginx
# /etc/nginx/sites-available/mepassa

server {
    listen 443 ssl http2;
    server_name mepassa.com.br;

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/mepassa.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mepassa.com.br/privkey.pem;

    # Security headers
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

    # PWA caching headers
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /sw.js {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Apache (.htaccess):**
```apache
# Security Headers
Header always set X-Content-Type-Options "nosniff"
Header always set X-Frame-Options "SAMEORIGIN"
Header always set Referrer-Policy "strict-origin-when-cross-origin"

# Cache static assets
<FilesMatch "\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$">
    Header set Cache-Control "max-age=31536000, public, immutable"
</FilesMatch>

# No-cache for Service Worker
<Files "sw.js">
    Header set Cache-Control "no-cache, no-store, must-revalidate"
    Header set Pragma "no-cache"
    Header set Expires "0"
</Files>
```

### Deploy em Plataformas

#### Vercel (Recomendado para Next.js)

```bash
# Instalar CLI
npm i -g vercel

# Deploy
cd frontend
vercel --prod
```

**vercel.json** (opcional para headers customizados):
```json
{
  "headers": [
    {
      "source": "/sw.js",
      "headers": [
        { "key": "Cache-Control", "value": "no-cache, no-store, must-revalidate" }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

#### Docker (Standalone)

```bash
# Build
cd frontend
docker build -t mepassa-frontend:pwa .

# Run com HTTPS via Traefik/Caddy
docker run -d \
  -p 3000:3000 \
  -e NODE_ENV=production \
  --name mepassa-frontend \
  mepassa-frontend:pwa
```

**Dockerfile** já está configurado para standalone output.

#### Netlify

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = ".next"

[[headers]]
  for = "/sw.js"
  [headers.values]
    Cache-Control = "no-cache, no-store, must-revalidate"

[[headers]]
  for = "/*"
  [headers.values]
    X-Content-Type-Options = "nosniff"
    X-Frame-Options = "SAMEORIGIN"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

### Pós-Deploy - Validação

```bash
# 1. Verificar HTTPS
curl -I https://mepassa.com.br | grep "HTTP/2 200"

# 2. Verificar manifest acessível
curl https://mepassa.com.br/manifest.json

# 3. Verificar Service Worker
curl https://mepassa.com.br/sw.js | head -n 5

# 4. Verificar headers de segurança
curl -I https://mepassa.com.br | grep -E "X-Content-Type|X-Frame"

# 5. Lighthouse no deploy real
# DevTools → Lighthouse → URL: https://mepassa.com.br
```

---

## 🐛 Troubleshooting

### Problemas Comuns

#### 1. Service Worker Não Registra

**Sintoma:** Console mostra "Service Worker registration failed"

**Soluções:**
```javascript
// Verificar no console do navegador
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(reg => console.log('SW registrado:', reg))
    .catch(err => console.error('Erro SW:', err))
}
```

**Causas comuns:**
- ❌ Não está em HTTPS (exceto localhost)
- ❌ Build não gerou `/public/sw.js` (rodar `npm run build`)
- ❌ PWA desabilitado em dev (`disable: true` no next.config.ts)
- ❌ Escopo incorreto (SW deve estar na raiz)

**Fix:**
```bash
# Rebuild
npm run build

# Verificar geração
ls -la public/sw.js

# Iniciar em produção
npm start
```

#### 2. Ícones Não Aparecem

**Sintoma:** Manifest mostra erros 404 nos ícones

**Soluções:**
1. Verificar ícones existem em `/public/icons/`
2. Nomes exatos conforme `manifest.json`
3. Permissões de leitura corretas

```bash
# Verificar ícones
ls -la public/icons/

# Deve listar:
# icon-192x192.png
# icon-512x512.png
# icon-maskable-192x192.png
# icon-maskable-512x512.png
# apple-touch-icon.png
```

**Fix rápido (placeholders):**
```bash
# Gerar placeholders temporários (não usar em produção!)
cd public/icons
convert -size 192x192 xc:#7c3aed -gravity center \
  -pointsize 72 -fill white -annotate +0+0 "MP" \
  icon-192x192.png
```

#### 3. Cache Desatualizado (Stuck on Old Version)

**Sintoma:** Mudanças no código não aparecem após deploy

**Soluções:**
```javascript
// Forçar atualização do Service Worker
navigator.serviceWorker.getRegistrations().then(regs => {
  regs.forEach(reg => reg.unregister())
  window.location.reload(true)
})
```

**Hard Refresh:**
- Chrome: `Ctrl + Shift + R` (Windows/Linux) ou `Cmd + Shift + R` (Mac)
- Firefox: `Ctrl + Shift + Del` → Limpar cache
- Edge: `Ctrl + F5`

**Prevenir:**
- `skipWaiting: true` já está configurado (atualiza imediatamente)
- Verificar que build está gerando novo SW

#### 4. Instalação Não Oferecida

**Sintoma:** Banner "Instalar app" não aparece

**Causas:**
- ❌ Não está em HTTPS
- ❌ Manifest inválido (verificar DevTools → Application → Manifest)
- ❌ Ícones faltando (192px e 512px obrigatórios)
- ❌ Service Worker não registrado
- ❌ Já foi instalado anteriormente
- ❌ Usuário recusou 3+ vezes (lógica do `InstallPrompt`)

**Debugging:**
```javascript
// Console
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('beforeinstallprompt disparado!', e)
})

// Se não disparar, verificar:
// 1. Lighthouse PWA audit
// 2. Manifest errors no DevTools
// 3. HTTPS enabled
```

**Force Reset Prompt:**
```javascript
// Limpar localStorage
localStorage.removeItem('pwa-install-dismissed')
localStorage.removeItem('pwa-install-dismissed-count')
// Recarregar página
```

#### 5. Offline Page Não Aparece

**Sintoma:** Erro genérico em vez da página `/offline` customizada

**Soluções:**
1. Verificar rota `/offline` existe (`app/offline/page.tsx`)
2. Verificar `fallbacks.document: "/offline"` no `next.config.ts`
3. Rebuild para atualizar SW

```bash
npm run build
npm start

# Testar offline
# DevTools → Network → Offline → Reload
```

#### 6. WebSocket Não Reconecta Após Offline

**Sintoma:** Notificações param de funcionar após perda de conexão

**Solução:**
O WebSocket já deve reconectar via `use-websocket.ts`. Verificar:

```typescript
// hooks/use-websocket.ts já implementa reconnect
// Se problema persistir, adicionar log:

useEffect(() => {
  if (isOnline && !isConnected) {
    console.log('Reconectando WebSocket...')
    // Lógica de reconexão
  }
}, [isOnline, isConnected])
```

#### 7. IndexedDB Conflitos

**Sintoma:** Uploads não salvam estado após instalação

**Causa:** Service Worker e IndexedDB podem ter namespaces conflitantes

**Solução:**
```typescript
// lib/upload-storage.ts
// Usar namespace único
const DB_NAME = 'mepassa-uploads-v1'
const STORE_NAME = 'upload-sessions'

// Service Worker usa namespace diferente automaticamente
// (workbox-* caches)
```

### Logs e Monitoramento

#### Console Logs Úteis

```javascript
// Service Worker status
navigator.serviceWorker.ready.then(reg => {
  console.log('SW pronto:', reg.active?.state)
})

// Cache status
caches.keys().then(keys => {
  console.log('Caches ativos:', keys)
})

// Manifest
fetch('/manifest.json').then(r => r.json()).then(console.log)

// Online status
console.log('Navigator online:', navigator.onLine)
window.addEventListener('online', () => console.log('ONLINE'))
window.addEventListener('offline', () => console.log('OFFLINE'))
```

#### Unregister All (Clean Slate)

```javascript
// Limpar completamente (usar apenas em dev)
navigator.serviceWorker.getRegistrations().then(regs => {
  regs.forEach(reg => reg.unregister())
})

caches.keys().then(keys => {
  keys.forEach(key => caches.delete(key))
})

indexedDB.deleteDatabase('workbox-expiration')
localStorage.clear()
location.reload()
```

---

## ✅ Checklist Final

### Pré-Deploy

- [ ] **Ícones gerados** - Todos os tamanhos em `/public/icons/`
- [ ] **Build sem erros** - `npm run build` completa com sucesso
- [ ] **Service Worker gerado** - `/public/sw.js` existe após build
- [ ] **Manifest válido** - DevTools → Application → Manifest sem erros
- [ ] **Offline page** - `/offline` carrega corretamente
- [ ] **Lighthouse PWA** - Score 90+ em audit local
- [ ] **Testes offline** - Badge aparece, fallback funciona
- [ ] **Testes instalação** - Banner aparece, app instala corretamente

### Pós-Deploy Produção

- [ ] **HTTPS ativo** - Site acessível via `https://`
- [ ] **Manifest acessível** - `https://domain/manifest.json` retorna 200
- [ ] **SW acessível** - `https://domain/sw.js` retorna 200
- [ ] **Headers segurança** - `curl -I` mostra `X-Content-Type-Options`, etc
- [ ] **Ícones carregam** - Sem 404 em ícones no DevTools
- [ ] **Instalação real** - Testar em dispositivo Android/iOS
- [ ] **Lighthouse produção** - Score 90+ no domínio real
- [ ] **WebSocket funciona** - Notificações em tempo real ativas
- [ ] **Cache invalidation** - Novo deploy atualiza app instalado

### Monitoramento Contínuo

- [ ] **Analytics instalação** - Rastrear `?source=pwa` no start_url
- [ ] **Taxa de instalação** - Monitorar conversão de visitantes → instalados
- [ ] **Erros SW** - Logs de erros do Service Worker
- [ ] **Performance** - Web Vitals (LCP, FID, CLS)
- [ ] **Quota storage** - Monitorar uso de cache storage

---

## 📊 Impactos e Considerações

### SEO (Search Engine Optimization)

✅ **Impactos Positivos:**
- Lighthouse PWA score melhora SEO ranking (Google)
- Mobile-first indexing beneficiado
- Performance melhorada (cache) → melhor ranking
- Estrutura de dados (manifest) indexável

❌ **Sem Impactos Negativos:**
- Service Worker não interfere em crawlers
- Páginas servidas por SSR normalmente para bots
- Sitemap e robots.txt não afetados

### Performance

**Métricas Esperadas:**

| Métrica | Antes PWA | Após PWA |
|---------|-----------|----------|
| **LCP** (Largest Contentful Paint) | ~2.5s | ~1.2s |
| **FID** (First Input Delay) | ~100ms | ~50ms |
| **CLS** (Cumulative Layout Shift) | 0.1 | < 0.05 |
| **TTI** (Time to Interactive) | ~3.5s | ~1.8s |
| **Load Time** (repeat visit) | ~2s | ~500ms |

**Ganhos:**
- 🚀 **50-70% redução** em tempo de carregamento (repeat visits)
- 📦 **60% menos requests** (assets do cache)
- 📱 **Melhor UX mobile** (instalável, standalone)

**Trade-offs:**
- 💾 Storage usage: ~10-50MB dependendo de uso
- 🔄 First load mais pesado (precache do app shell)
- 🧠 Complexidade de debug aumentada

### Requisitos de HTTPS

**Obrigatório em Produção:**
```
⚠️ Service Workers NÃO funcionam em HTTP (exceto localhost)

Opções de certificado:
- Let's Encrypt: Grátis, automático
- Cloudflare: Grátis, proxy
- Comprado: Sectigo, DigiCert, etc
```

**Impacto WebSocket:**
```
Se WebSocket usa WSS (WebSocket Secure):
✅ Sem impacto, já está seguro

Se WebSocket usa WS (não-secure):
❌ Navegadores bloqueiam WSS → WS mixed content
Fix: Usar WSS no backend também
```

### Browser Support

| Navegador | Suporte PWA | Limitações |
|-----------|-------------|------------|
| **Chrome (Android)** | ✅ Completo | Melhor experiência, todos os features |
| **Chrome (Desktop)** | ✅ Completo | Instalável, todas as features |
| **Edge** | ✅ Completo | Idêntico ao Chrome (Chromium) |
| **Firefox** | ⚠️ Parcial | SW OK, instalação limitada |
| **Safari (iOS)** | ⚠️ Parcial | SW limitado, sem push notifications |
| **Safari (macOS)** | ⚠️ Parcial | Instalação desde macOS 11.3+ |
| **Samsung Internet** | ✅ Bom | Similar ao Chrome |

**Fallbacks Automáticos:**
- Navegadores sem suporte PWA → app funciona normalmente como SPA
- Service Worker não registra → fetch direto da rede
- InstallPrompt não aparece em browsers não-suportados

---

## 🔗 Recursos Adicionais

### Documentação Oficial

- **next-pwa**: https://github.com/DuCanhGH/next-pwa
- **Workbox**: https://developer.chrome.com/docs/workbox/
- **Web.dev PWA**: https://web.dev/progressive-web-apps/
- **MDN Service Workers**: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API

### Ferramentas

- **Lighthouse CI**: https://github.com/GoogleChrome/lighthouse-ci
- **PWA Builder**: https://www.pwabuilder.com/
- **Maskable.app**: https://maskable.app/editor
- **RealFaviconGenerator**: https://realfavicongenerator.net/

### Testing

- **Ngrok** (HTTPS local): https://ngrok.com/
- **LocalTunnel**: https://theboroer.github.io/localtunnel-www/
- **Chrome DevTools**: https://developer.chrome.com/docs/devtools/

---

## 📝 Notas Finais

### Limitações Conhecidas

1. **Não é App Nativo**: PWA é HTML/CSS/JS, não acessa APIs nativas diretamente
2. **iOS Safari**: Suporte limitado, features podem não funcionar 100%
3. **Storage Limits**: ~50-500MB dependendo do browser, pode ser limpo pelo OS
4. **Background Sync**: Não implementado (opcional para futuro)
5. **Push Notifications**: Não implementado (requer backend)

### Próximos Passos (Opcional)

- [ ] **Background Sync**: Queue de uploads falhos para retry automático
- [ ] **Push Notifications**: Notificar usuário de novos arquivos/convites
- [ ] **Share Target API**: Receber arquivos via "Compartilhar com..."
- [ ] **File Handler API**: Abrir tipos de arquivo específicos com o app
- [ ] **Badging API**: Mostrar contador de notificações no ícone
- [ ] **Shortcuts API**: Mais ações rápidas no contexto do ícone

### Suporte

Para problemas ou dúvidas sobre o PWA:
1. Verificar este guia (Troubleshooting)
2. Consultar logs do DevTools (Console + Application)
3. Testar em ambiente local primeiro
4. Documentar passos para reproduzir o problema

---

**Versão**: 1.0.0  
**Última Atualização**: 2026-02-11  
**Autor**: GitHub Copilot + MePassa Team
