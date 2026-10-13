# 🌐 Catálogo Online & Vitrine Comercial

Este é o catálogo online web da loja física, pronto para hospedagem gratuita e ultrarrápida na **Vercel** ou qualquer CDN estático (Netlify, Cloudflare Pages, GitHub Pages).

---

## 🚀 Como Publicar na Vercel em 2 Minutos

### Opção 1: Via GitHub (Recomendado)
1. Crie um repositório no seu GitHub (ex: `meu-catalogo-loja`).
2. Suba o conteúdo desta pasta `catalogo-web/` para o repositório.
3. Acesse [vercel.com](https://vercel.com) com sua conta GitHub.
4. Clique em **"Add New..."** -> **"Project"** -> Selecione o repositório.
5. Clique em **"Deploy"** (não precisa alterar nenhuma configuração de build).
6. Pronto! Em 20 segundos seu catálogo estará no ar com link seguro `https://seu-catalogo.vercel.app`.

### Opção 2: Via Vercel CLI (Direto do Terminal)
1. No terminal, dentro desta pasta `catalogo-web`, execute:
   ```bash
   npx vercel
   ```
2. Siga os passos na tela e seu site estará no ar instantaneamente.

---

## ⚡ Como Atualizar os Produtos e Fotos

Você pode atualizar o catálogo de duas maneiras:

### 1. Sincronização em Tempo Real via Nuvem (Supabase - Gratuito)
- No sistema desktop, na aba **Catálogo Online**, clique em **"Nuvem / Supabase"**.
- Insira a URL e a Chave Anon do seu projeto Supabase gratuito.
- Insira as mesmas credenciais no arquivo `config.js` (`supabase.url` e `supabase.anonKey`).
- Ao clicar em **"Sincronizar com a Nuvem"** no sistema, todas as alterações, novos anúncios e fotos aparecem **instantaneamente** no site na Vercel sem precisar fazer novo deploy!

### 2. Exportação de Arquivo JSON (`catalogo.json`)
- No sistema desktop, clique em **"Exportar JSON"**.
- Substitua o arquivo `catalogo.json` desta pasta pelo novo arquivo gerado e envie para o GitHub.
- A Vercel atualiza o site automaticamente em segundos.

---

## 📱 Recursos Incluídos
- **Compressão Automática WebP:** Fotos de celular de 8MB-15MB são compactadas pelo sistema para ~100KB, carregando instantaneamente no celular do cliente.
- **Botão WhatsApp Dinâmico:** Ao clicar no anúncio, abre o WhatsApp com a mensagem pré-preenchida com o nome do produto e o preço.
- **Modal de Detalhes:** Especificações completas para anúncios de carros, imóveis, promoções da semana, etc.
- **Localização com Google Maps:** Seção no rodapé com endereço físico e mapa interativo.
