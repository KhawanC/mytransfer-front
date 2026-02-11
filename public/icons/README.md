# Ícones PWA

Esta pasta contém os ícones necessários para o Progressive Web App (PWA).

## Ícones Necessários

Você precisa gerar os seguintes ícones a partir do seu logo em alta resolução (mínimo 512x512px):

### Ícones Principais
- **icon-192x192.png** - Mínimo requerido pelo Android
- **icon-512x512.png** - Splash screen Android e instalação
- **favicon.ico** - Ícone do site (multires: 16x16, 32x32, 48x48)

### Ícones Maskable (Android Adaptive Icons)
- **icon-maskable-192x192.png** - Ícone adaptativo pequeno
- **icon-maskable-512x512.png** - Ícone adaptativo grande

> ⚠️ **Importante**: Ícones maskable precisam ter 20% de padding (safe zone) ao redor do logo para evitar cortes em diferentes formatos de ícone do Android.

### Ícones Apple/iOS
- **apple-touch-icon.png** (180x180px) - Ícone para iOS/Safari

## Ferramentas Recomendadas

### Opção 1: PWA Asset Generator (Automática)
```bash
npx pwa-asset-generator seu-logo.svg public/icons --type png --quality 90 --maskable --icon-only
```

### Opção 2: RealFaviconGenerator (Online)
1. Acesse: https://realfavicongenerator.net/
2. Faça upload do seu logo em alta resolução
3. Configure as opções para PWA
4. Baixe e extraia os ícones nesta pasta

### Opção 3: Manual (Photoshop/GIMP/Figma)
Crie cada tamanho manualmente garantindo:
- Formato PNG com transparência (exceto favicon.ico)
- Bordas suaves (antialiasing)
- Logo centralizado
- Padding de 20% nos maskable icons

## Validação

Após gerar os ícones, verifique:
- [ ] Todos os arquivos estão na pasta `/public/icons/`
- [ ] Ícones têm os nomes exatos listados acima
- [ ] Maskable icons têm padding adequado
- [ ] favicon.ico é multires (16, 32, 48px)
- [ ] Ícones têm boa qualidade visual mesmo em tamanhos pequenos

## Testes

1. **Chrome DevTools**: Application tab → Manifest → Ícones devem aparecer sem erros
2. **Lighthouse**: Audit PWA deve marcar "provides a valid apple-touch-icon"
3. **Maskable.app**: Teste maskable icons em https://maskable.app/editor
