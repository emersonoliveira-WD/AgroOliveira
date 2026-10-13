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
  const modalPrevBtn = document.getElementById('modal-prev-btn');
  const modalNextBtn = document.getElementById('modal-next-btn');
  const modalImgCounter = document.getElementById('modal-img-counter');
  const modalThumbnails = document.getElementById('modal-thumbnails');
  const modalCategory = document.getElementById('modal-category');
  const modalTitle = document.getElementById('modal-title');
  const modalPrices = document.getElementById('modal-prices');
  const modalDesc = document.getElementById('modal-desc');
  const modalCtaBtn = document.getElementById('modal-cta-btn');

  // Estado do carrossel na modal e nos cards
  let currentModalProduct = null;
  let currentModalPhotoIdx = 0;
  const cardPhotoIndexes = {};

  // Extrair array de imagens (suporta JSON string, array ou string única)
  function parseProductImages(imagemUrl) {
    if (!imagemUrl) {
      return ['https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=600&q=80'];
    }
    if (Array.isArray(imagemUrl)) {
      return imagemUrl.filter(Boolean);
    }
    const trimmed = String(imagemUrl).trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter(Boolean);
        }
      } catch {
        // fallback
      }
    }
    return [trimmed];
  }

  // Formatar Moeda (BRL)
  function formatMoney(value) {
    if (value == null || isNaN(value)) return 'R$ 0,00';
    return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  // Troca de Abas (Catálogo vs Serviços Dev vs Dedetização)
  window.trocarAba = function (aba) {
    const abaCatalogo = document.getElementById('aba-catalogo');
    const abaDev = document.getElementById('aba-servicos-dev');
    const abaDedetizacao = document.getElementById('aba-dedetizacao');

    const btnCatalogo = document.getElementById('nav-btn-catalogo');
    const btnDev = document.getElementById('nav-btn-dev');
    const btnDedetizacao = document.getElementById('nav-btn-dedetizacao');

    // Desativar tudo
    if (abaCatalogo) abaCatalogo.classList.remove('active');
    if (abaDev) abaDev.classList.remove('active');
    if (abaDedetizacao) abaDedetizacao.classList.remove('active');

    if (btnCatalogo) btnCatalogo.classList.remove('active');
    if (btnDev) btnDev.classList.remove('active');
    if (btnDedetizacao) btnDedetizacao.classList.remove('active');

    if (aba === 'servicos-dev') {
      if (abaDev) abaDev.classList.add('active');
      if (btnDev) btnDev.classList.add('active');
    } else if (aba === 'dedetizacao') {
      if (abaDedetizacao) abaDedetizacao.classList.add('active');
      if (btnDedetizacao) btnDedetizacao.classList.add('active');
    } else {
      if (abaCatalogo) abaCatalogo.classList.add('active');
      if (btnCatalogo) btnCatalogo.classList.add('active');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
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
          if (Array.isArray(data)) {
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

  // Resolver URL da imagem para suportar Base64, URLs externas e uploads locais
  function resolveImageUrl(url) {
    if (!url) {
      return 'https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=600&q=80';
    }
    if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    if (url.startsWith('/') && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      return `http://localhost:8000${url}`;
    }
    return url;
  }

  // Passar foto no card
  window.navegarFotoCard = function (e, prodId, delta) {
    e.stopPropagation();
    const prod = allProducts.find(p => p.id === prodId);
    if (!prod) return;

    const imgs = parseProductImages(prod.imagem_url);
    if (imgs.length <= 1) return;

    const currentIdx = cardPhotoIndexes[prodId] || 0;
    let nextIdx = currentIdx + delta;
    if (nextIdx < 0) nextIdx = imgs.length - 1;
    if (nextIdx >= imgs.length) nextIdx = 0;

    cardPhotoIndexes[prodId] = nextIdx;

    const imgEl = document.getElementById(`card-img-${prodId}`);
    if (imgEl) {
      imgEl.src = resolveImageUrl(imgs[nextIdx]);
    }

    const counterEl = document.getElementById(`card-counter-${prodId}`);
    if (counterEl) {
      counterEl.textContent = `${nextIdx + 1}/${imgs.length}`;
    }

    const dotsWrap = document.getElementById(`card-dots-${prodId}`);
    if (dotsWrap) {
      const dots = dotsWrap.querySelectorAll('.web-carousel-dot');
      dots.forEach((d, idx) => {
        if (idx === nextIdx) d.classList.add('active');
        else d.classList.remove('active');
      });
    }
  };

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

      const imgs = parseProductImages(prod.imagem_url);
      const currentIdx = cardPhotoIndexes[prod.id] || 0;
      const activeIdx = currentIdx < imgs.length ? currentIdx : 0;
      const imgUrl = resolveImageUrl(imgs[activeIdx]);
      const temVariasFotos = imgs.length > 1;

      return `
        <article class="product-card">
          <div class="card-image-wrap" onclick="window.abrirDetalhes(${prod.id})">
            <img id="card-img-${prod.id}" src="${imgUrl}" alt="${prod.titulo}" class="card-image" loading="lazy" />
            ${prod.destaque ? '<span class="badge-featured">⭐ Destaque</span>' : ''}
            ${temDesconto ? `<span class="badge-discount">-${percentual}% OFF</span>` : ''}

            ${temVariasFotos ? `
              <button
                type="button"
                class="web-carousel-btn web-carousel-btn--prev"
                onclick="window.navegarFotoCard(event, ${prod.id}, -1)"
                title="Foto anterior"
              >‹</button>
              <button
                type="button"
                class="web-carousel-btn web-carousel-btn--next"
                onclick="window.navegarFotoCard(event, ${prod.id}, 1)"
                title="Próxima foto"
              >›</button>
              <span id="card-counter-${prod.id}" class="web-carousel-counter">${activeIdx + 1}/${imgs.length}</span>
              <div id="card-dots-${prod.id}" class="web-carousel-dots">
                ${imgs.map((_, i) => `<span class="web-carousel-dot ${i === activeIdx ? 'active' : ''}"></span>`).join('')}
              </div>
            ` : ''}
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

  // Atualizar exibição de foto da modal
  function updateModalPhoto() {
    if (!currentModalProduct) return;
    const imgs = parseProductImages(currentModalProduct.imagem_url);
    if (imgs.length === 0) return;

    if (currentModalPhotoIdx < 0) currentModalPhotoIdx = imgs.length - 1;
    if (currentModalPhotoIdx >= imgs.length) currentModalPhotoIdx = 0;

    modalImg.src = resolveImageUrl(imgs[currentModalPhotoIdx]);

    if (imgs.length > 1) {
      if (modalPrevBtn) modalPrevBtn.style.display = 'flex';
      if (modalNextBtn) modalNextBtn.style.display = 'flex';
      if (modalImgCounter) {
        modalImgCounter.style.display = 'block';
        modalImgCounter.textContent = `${currentModalPhotoIdx + 1} / ${imgs.length}`;
      }
      if (modalThumbnails) {
        modalThumbnails.style.display = 'flex';
        modalThumbnails.querySelectorAll('.modal-thumb-btn').forEach((btn, idx) => {
          if (idx === currentModalPhotoIdx) btn.classList.add('active');
          else btn.classList.remove('active');
        });
      }
    } else {
      if (modalPrevBtn) modalPrevBtn.style.display = 'none';
      if (modalNextBtn) modalNextBtn.style.display = 'none';
      if (modalImgCounter) modalImgCounter.style.display = 'none';
      if (modalThumbnails) modalThumbnails.style.display = 'none';
    }
  }

  // Abrir Modal de Detalhes
  window.abrirDetalhes = function (id) {
    const prod = allProducts.find(p => p.id === id);
    if (!prod) return;

    currentModalProduct = prod;
    currentModalPhotoIdx = cardPhotoIndexes[prod.id] || 0;

    const imgs = parseProductImages(prod.imagem_url);

    // Montar miniaturas se houver mais de uma
    if (modalThumbnails) {
      if (imgs.length > 1) {
        modalThumbnails.innerHTML = imgs.map((img, idx) => `
          <button
            type="button"
            class="modal-thumb-btn ${idx === currentModalPhotoIdx ? 'active' : ''}"
            onclick="window.selecionarFotoModal(${idx})"
          >
            <img src="${resolveImageUrl(img)}" alt="Foto ${idx + 1}" />
          </button>
        `).join('');
      } else {
        modalThumbnails.innerHTML = '';
      }
    }

    updateModalPhoto();

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

  // Navegar fotos na modal
  window.selecionarFotoModal = function (idx) {
    currentModalPhotoIdx = idx;
    updateModalPhoto();
  };

  if (modalPrevBtn) {
    modalPrevBtn.onclick = function (e) {
      e.stopPropagation();
      currentModalPhotoIdx--;
      updateModalPhoto();
    };
  }

  if (modalNextBtn) {
    modalNextBtn.onclick = function (e) {
      e.stopPropagation();
      currentModalPhotoIdx++;
      updateModalPhoto();
    };
  }

  // Fechar Modal
  function fecharModal() {
    modalBackdrop.classList.remove('open');
    currentModalProduct = null;
  }

  modalCloseBtn.onclick = fecharModal;
  modalBackdrop.onclick = function (e) {
    if (e.target === modalBackdrop) fecharModal();
  };
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') fecharModal();
    if (modalBackdrop.classList.contains('open') && currentModalProduct) {
      if (e.key === 'ArrowLeft') {
        currentModalPhotoIdx--;
        updateModalPhoto();
      } else if (e.key === 'ArrowRight') {
        currentModalPhotoIdx++;
        updateModalPhoto();
      }
    }
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
