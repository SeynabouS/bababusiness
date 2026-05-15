const CART_STORAGE_KEY = 'babaBusinessCart';

let products = [];
let cart = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]');

const productGrid = document.getElementById('productGrid');
const cartCount = document.getElementById('cartCount');
const cartPanel = document.getElementById('cartPanel');
const overlay = document.getElementById('overlay');
const cartItems = document.getElementById('cartItems');
const cartTotal = document.getElementById('cartTotal');
const whatsappOrder = document.getElementById('whatsappOrder');
const clearCart = document.getElementById('clearCart');
const openCart = document.getElementById('openCart');
const closeCart = document.getElementById('closeCart');
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');
const filters = document.querySelectorAll('.filter');
const contactForm = document.getElementById('contactForm');

function escapeHTML(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatPrice(price) {
  return new Intl.NumberFormat('fr-FR').format(Number(price) || 0) + ' FCFA';
}

function getCategoryLabel(category) {
  const labels = {
    beaute: 'Beauté',
    parfum: 'Parfum',
    accessoire: 'Accessoire',
    bienetre: 'Bien-être',
    maison: 'Maison'
  };
  return labels[category] || 'Produit';
}

function renderProductVisual(product) {
  if (product.image) {
    return `<img class="product-photo" src="${escapeHTML(product.image)}" alt="${escapeHTML(product.name)}" loading="lazy" />`;
  }
  return `<span class="product-emoji" aria-hidden="true">${escapeHTML(product.emoji || '🛍️')}</span>`;
}

function renderCartVisual(item) {
  if (item.image) {
    return `<img class="cart-thumb" src="${escapeHTML(item.image)}" alt="${escapeHTML(item.name)}" />`;
  }
  return `<div class="emoji">${escapeHTML(item.emoji || '🛍️')}</div>`;
}

function getActiveFilter() {
  const active = document.querySelector('.filter.active');
  return active ? active.dataset.filter : 'all';
}

async function loadProductsFromServer() {
  if (!productGrid) return;

  productGrid.innerHTML = `
    <div class="empty-products">
      <h3>Chargement du catalogue…</h3>
      <p>Veuillez patienter quelques secondes.</p>
    </div>
  `;

  try {
    const response = await fetch('/api/products', { cache: 'no-store' });
    if (!response.ok) throw new Error('Impossible de charger les produits.');
    products = await response.json();
    syncCartWithCatalog();
    renderProducts(getActiveFilter());
    renderCart();
  } catch (error) {
    productGrid.innerHTML = `
      <div class="empty-products">
        <h3>Catalogue indisponible</h3>
        <p>Vérifiez que le serveur est bien lancé avec <strong>npm start</strong>.</p>
      </div>
    `;
  }
}

function syncCartWithCatalog() {
  cart = cart
    .map(item => {
      const freshProduct = products.find(product => String(product.id) === String(item.id));
      if (!freshProduct) return null;
      return { ...freshProduct, qty: Number(item.qty) || 1 };
    })
    .filter(Boolean);
  saveCart();
}

function renderProducts(category = 'all') {
  if (!productGrid) return;

  const visibleProducts = category === 'all'
    ? products
    : products.filter(product => product.category === category);

  if (visibleProducts.length === 0) {
    productGrid.innerHTML = `
      <div class="empty-products">
        <h3>Aucun produit dans cette catégorie</h3>
        <p>Ajoutez des produits depuis l'espace admin ou choisissez une autre catégorie.</p>
      </div>
    `;
    return;
  }

  productGrid.innerHTML = visibleProducts.map(product => `
    <article class="product-card reveal visible" data-category="${escapeHTML(product.category)}">
      <div class="product-image">
        <span class="badge">${getCategoryLabel(product.category)}</span>
        ${renderProductVisual(product)}
      </div>
      <div class="product-body">
        <h3>${escapeHTML(product.name)}</h3>
        <p>${escapeHTML(product.desc)}</p>
        <div class="price-row">
          <span class="price">${formatPrice(product.price)}</span>
          <button class="add-to-cart" type="button" aria-label="Ajouter ${escapeHTML(product.name)} au panier" data-product-id="${escapeHTML(product.id)}">+</button>
        </div>
      </div>
    </article>
  `).join('');

  productGrid.querySelectorAll('.add-to-cart').forEach(button => {
    button.addEventListener('click', () => addToCart(button.dataset.productId));
  });
}

function saveCart() {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

function addToCart(id) {
  const product = products.find(item => String(item.id) === String(id));
  if (!product) return;

  const existing = cart.find(item => String(item.id) === String(id));
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...product, qty: 1 });
  }

  saveCart();
  renderCart();
  openCartPanel();
}

function changeQty(id, delta) {
  const item = cart.find(product => String(product.id) === String(id));
  if (!item) return;

  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter(product => String(product.id) !== String(id));
  }

  saveCart();
  renderCart();
}

function renderCart() {
  if (!cartCount || !cartTotal || !cartItems || !whatsappOrder) return;

  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  cartCount.textContent = totalItems;
  cartTotal.textContent = formatPrice(total);

  if (cart.length === 0) {
    cartItems.innerHTML = '<p>Votre panier est vide. Ajoutez un produit pour préparer votre commande.</p>';
    whatsappOrder.href = 'https://wa.me/221773831231?text=Bonjour%20Baba%20Business%2C%20je%20souhaite%20avoir%20des%20informations%20sur%20vos%20produits.';
    return;
  }

  cartItems.innerHTML = cart.map(item => `
    <div class="cart-item">
      ${renderCartVisual(item)}
      <div>
        <h4>${escapeHTML(item.name)}</h4>
        <p>${formatPrice(item.price)} × ${item.qty}</p>
      </div>
      <div class="qty">
        <button type="button" data-cart-id="${escapeHTML(item.id)}" data-delta="-1">−</button>
        <strong>${item.qty}</strong>
        <button type="button" data-cart-id="${escapeHTML(item.id)}" data-delta="1">+</button>
      </div>
    </div>
  `).join('');

  cartItems.querySelectorAll('.qty button').forEach(button => {
    button.addEventListener('click', () => changeQty(button.dataset.cartId, Number(button.dataset.delta)));
  });

  const orderText = cart
    .map(item => `- ${item.name} x${item.qty} = ${formatPrice(item.price * item.qty)}`)
    .join('\n');
  whatsappOrder.href = `https://wa.me/221773831231?text=${encodeURIComponent(`Bonjour Baba Business, je souhaite commander :\n${orderText}\n\nTotal estimé : ${formatPrice(total)}`)}`;
}

function openCartPanel() {
  cartPanel.classList.add('open');
  overlay.classList.add('show');
  cartPanel.setAttribute('aria-hidden', 'false');
}

function closeCartPanel() {
  cartPanel.classList.remove('open');
  overlay.classList.remove('show');
  cartPanel.setAttribute('aria-hidden', 'true');
}

filters.forEach(button => {
  button.addEventListener('click', () => {
    filters.forEach(item => item.classList.remove('active'));
    button.classList.add('active');
    renderProducts(button.dataset.filter);
  });
});

if (openCart) openCart.addEventListener('click', openCartPanel);
if (closeCart) closeCart.addEventListener('click', closeCartPanel);
if (overlay) overlay.addEventListener('click', closeCartPanel);
if (clearCart) clearCart.addEventListener('click', () => {
  cart = [];
  saveCart();
  renderCart();
});

if (menuToggle && navLinks) {
  menuToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => navLinks.classList.remove('open'));
  });
}

if (contactForm) {
  contactForm.addEventListener('submit', event => {
    event.preventDefault();
    const name = document.getElementById('clientName').value.trim();
    const product = document.getElementById('clientProduct').value.trim();
    const message = document.getElementById('clientMessage').value.trim();
    const text = `Bonjour Baba Business, je m'appelle ${name}. Je suis intéressé(e) par : ${product}. ${message}`;
    window.open(`https://wa.me/221773831231?text=${encodeURIComponent(text)}`, '_blank');
  });
}

const revealObserver = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 }) : null;

if (revealObserver) {
  document.querySelectorAll('.reveal').forEach(element => revealObserver.observe(element));
} else {
  document.querySelectorAll('.reveal').forEach(element => element.classList.add('visible'));
}

const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

loadProductsFromServer();
renderCart();
