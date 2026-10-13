// Script do Catálogo Online Público
(function () {
  const config = window.CATALOGO_CONFIG || {};

  let allProducts = [];
  let currentCategory = 'todas';
  let searchTerm = '';

  // Elementos DOM
  const cardsGrid = document.getElementById('cards-grid');
  const categoryPills = document.getElementById('category-pills');
  const searchInput = document.getElementById('search-input');
  const totalCountEl = document.getElementById('total-count');

  // Modal elementos
  const modalBackdrop = document.getElementById('details-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalImg = document.getElementById('modal-img');
  const modalCategory = document.getElementById('modal-category');
  const modalTitle = document.getElementById('modal-title');
  const modalPrices = document.getElementById('modal-prices');
  const modalDesc = document.getElementById('modal-desc');
  const modalCtaBtn = document.getElementById('modal-cta-btn');

  // Formatar Moeda (BRL)
  function formatMoney(value) {
    if (value == null || isNaN(value)) return 'R$ 0,00';
    return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  // Troca de Abas (Catálogo vs Serviços Dev)
  window.trocarAba = function (aba) {
    const abaCatalogo = document.getElementById('aba-catalogo');
    const abaDev = document.getElementById('aba-servicos-dev');
    const btnCatalogo = document.getElementById('nav-btn-catalogo');
    const btnDev = document.getElementById('nav-btn-dev');

    if (aba === 'servicos-dev') {
      if (abaCatalogo) abaCatalogo.classList.remove('active');
      if (abaDev) abaDev.classList.add('active');
      if (btnCatalogo) btnCatalogo.classList.remove('active');
      if (btnDev) btnDev.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      if (abaDev) abaDev.classList.remove('active');
      if (abaCatalogo) abaCatalogo.classList.add('active');
      if (btnDev) btnDev.classList.remove('active');
      if (btnCatalogo) btnCatalogo.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Obter link do WhatsApp para o produto
  function getWhatsAppUrl(prod) {
    const rawPhone = (config.telefoneWhatsapp || '5542999522019').replace(/\D/g, '');
    const precoTxt = formatMoney(prod.preco_por);
    const msg = encodeURIComponent(
      `Olá! Vi o anúncio de "${prod.titulo}" no catálogo da Agropecuária Oliveira por ${precoTxt} e gostaria de mais informações!`
    );
    return `https://wa.me/${rawPhone}?text=${msg}`;
  }

  // Inicializar informações da loja
  function setupStoreInfo() {
    if (config.nomeLoja) {
      document.title = `${config.nomeLoja} - Catálogo & Ofertas`;
      const brandName = document.getElementById('store-name');
      if (brandName) brandName.textContent = config.nomeLoja;
      const footerStoreName = document.getElementById('footer-store-name');
      if (footerStoreName) footerStoreName.textContent = config.nomeLoja;
    }

    if (config.subtitulo) {
      const heroSub = document.getElementById('hero-subtitle');
      if (heroSub) heroSub.textContent = config.subtitulo;
    }

    if (config.endereco) {
      const addressEl = document.getElementById('footer-address');
      if (addressEl) addressEl.textContent = `${config.endereco}, CEP: ${config.cep || '84450-000'} - ${config.cidade || 'Ipiranga - PR'}`;
    }

    if (config.horarioFuncionamento) {
      const hoursEl = document.getElementById('footer-hours');
      if (hoursEl) hoursEl.textContent = config.horarioFuncionamento;
    }

    if (config.googleMapsEmbedUrl) {
      const mapsIframe = document.getElementById('maps-iframe');
      if (mapsIframe) mapsIframe.src = config.googleMapsEmbedUrl;
    }

    // Configurar botão flutuante e do header
    const rawPhone = (config.telefoneWhatsapp || '5542999522019').replace(/\D/g, '');
    const defaultMsg = encodeURIComponent(`Olá! Vim pelo catálogo da Agropecuária Oliveira e gostaria de falar com vocês.`);
    const mainWaLink = `https://wa.me/${rawPhone}?text=${defaultMsg}`;

    const floatWa = document.getElementById('floating-whatsapp');
    if (floatWa) floatWa.href = mainWaLink;

    const headerWa = document.getElementById('header-whatsapp-btn');
    if (headerWa) headerWa.href = mainWaLink;
  }

  // Carregar produtos (Supabase ou JSON local)
  async function loadProducts() {
    try {
      // 1. Tentar Supabase se configurado
      if (config.supabase && config.supabase.url && config.supabase.anonKey) {
        const endpoint = `${config.supabase.url.replace(/\/$/, '')}/rest/v1/catalogo_itens?ativo=eq.1&order=destaque.desc,id.desc`;
        const res = await fetch(endpoint, {
          headers: {
            'apikey': config.supabase.anonKey,
            'Authorization': `Bearer ${config.supabase.anonKey}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            allProducts = data;
            renderAll();
            return;
          }
        }
      }

      // 2. Fallback para catalogo.json
      const res = await fetch('./catalogo.json?t=' + Date.now());
      if (res.ok) {
        const data = await res.json();
        allProducts = data.itens || [];
      } else {
        console.warn('Arquivo catalogo.json não encontrado, usando lista vazia.');
      }
    } catch (err) {
      console.error('Erro ao carregar catálogo:', err);
    } finally {
      renderAll();
    }
  }

  // Renderizar pills de categorias
  function renderCategories() {
    const cats = ['todas'];
    allProducts.forEach(p => {
      const cat = p.categoria || 'Geral';
      if (!cats.includes(cat)) cats.push(cat);
    });

    categoryPills.innerHTML = '';
    cats.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = `cat-pill ${cat === currentCategory ? 'active' : ''}`;
      btn.textContent = cat === 'todas' ? 'Todas as Categorias' : cat;
      btn.onclick = () => {
        currentCategory = cat;
        renderCategories();
        renderCards();
      };
      categoryPills.appendChild(btn);
    });
  }

  // Renderizar cards de produtos
  function renderCards() {
    const filtered = allProducts.filter(p => {
      const matchCat = currentCategory === 'todas' || p.categoria === currentCategory;
      const matchSearch = !searchTerm ||
        p.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.descricao && p.descricao.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchCat && matchSearch;
    });

    if (totalCountEl) {
      totalCountEl.textContent = `${filtered.length} anúncio(s) encontrado(s)`;
    }

    if (filtered.length === 0) {
      cardsGrid.innerHTML = `
        <div class="no-results">
          <h3>Nenhum anúncio encontrado</h3>
          <p>Tente buscar por outro termo ou selecione outra categoria.</p>
        </div>
      `;
      return;
    }

    cardsGrid.innerHTML = filtered.map(prod => {
      const temDesconto = prod.preco_de && prod.preco_de > prod.preco_por;
      const percentual = temDesconto
        ? Math.round(((prod.preco_de - prod.preco_por) / prod.preco_de) * 100)
        : 0;

      const imgUrl = prod.imagem_url || 'https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=600&q=80';

      return `
        <article class="product-card">
          <div class="card-image-wrap" onclick="window.abrirDetalhes(${prod.id})">
            <img src="${imgUrl}" alt="${prod.titulo}" class="card-image" loading="lazy" />
            ${prod.destaque ? '<span class="badge-featured">⭐ Destaque</span>' : ''}
            ${temDesconto ? `<span class="badge-discount">-${percentual}% OFF</span>` : ''}
          </div>

          <div class="card-body">
            <span class="card-category">${prod.categoria || 'Geral'}</span>
            <h3 class="card-title">${prod.titulo}</h3>

            ${prod.estoque_qtd ? `
              <div class="card-stock">
                <span class="stock-indicator"></span>
                <span>${prod.estoque_qtd}</span>
              </div>
            ` : ''}

            <div class="card-prices">
              ${temDesconto ? `<span class="price-de">${formatMoney(prod.preco_de)}</span>` : ''}
              <strong class="price-por">${formatMoney(prod.preco_por)}</strong>
            </div>

            <div class="card-actions">
              <button class="btn-details" onclick="window.abrirDetalhes(${prod.id})">
                Ver Detalhes
              </button>
              <a href="${getWhatsAppUrl(prod)}" target="_blank" rel="noopener" class="btn-whatsapp">
                WhatsApp
              </a>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  // Abrir Modal de Detalhes
  window.abrirDetalhes = function (id) {
    const prod = allProducts.find(p => p.id === id);
    if (!prod) return;

    modalImg.src = prod.imagem_url || 'https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=800&q=80';
    modalCategory.textContent = prod.categoria || 'Geral';
    modalTitle.textContent = prod.titulo;

    const temDesconto = prod.preco_de && prod.preco_de > prod.preco_por;
    modalPrices.innerHTML = `
      ${temDesconto ? `<span class="modal-price-de">${formatMoney(prod.preco_de)}</span>` : ''}
      <strong class="modal-price-por">${formatMoney(prod.preco_por)}</strong>
    `;

    const descText = prod.descricao || 'Entre em contato com nossa equipe pelo WhatsApp para obter mais fotos, detalhes técnicos ou agendar uma visita física na nossa loja.';
    modalDesc.textContent = descText;

    modalCtaBtn.href = getWhatsAppUrl(prod);

    modalBackdrop.classList.add('open');
  };

  // Fechar Modal
  function fecharModal() {
    modalBackdrop.classList.remove('open');
  }

  modalCloseBtn.onclick = fecharModal;
  modalBackdrop.onclick = function (e) {
    if (e.target === modalBackdrop) fecharModal();
  };
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') fecharModal();
  });

  // Busca em tempo real
  searchInput.oninput = function (e) {
    searchTerm = e.target.value.trim();
    renderCards();
  };

  function renderAll() {
    renderCategories();
    renderCards();
  }

  // Iniciar
  setupStoreInfo();
  loadProducts();
})();
