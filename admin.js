let products = [];
let currentImage = '';
let selectedImageFile = null;
let previewObjectUrl = null;

const loginScreen = document.getElementById('loginScreen');
const adminApp = document.getElementById('adminApp');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');

const productForm = document.getElementById('productForm');
const formTitle = document.getElementById('formTitle');
const productId = document.getElementById('productId');
const productName = document.getElementById('productName');
const productCategory = document.getElementById('productCategory');
const productPrice = document.getElementById('productPrice');
const productDesc = document.getElementById('productDesc');
const productImage = document.getElementById('productImage');
const productEmoji = document.getElementById('productEmoji');
const imagePreview = document.getElementById('imagePreview');
const removeImage = document.getElementById('removeImage');
const newProductBtn = document.getElementById('newProductBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const productCounter = document.getElementById('productCounter');
const adminProductList = document.getElementById('adminProductList');
const searchProduct = document.getElementById('searchProduct');
const exportBtn = document.getElementById('exportBtn');
const importFile = document.getElementById('importFile');
const resetBtn = document.getElementById('resetBtn');
const toast = document.getElementById('toast');

function escapeHTML(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatPrice(price) {
  const amount = Number(price) || 0;
  if (amount <= 0) return 'Prix sur demande';
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
}

function getCategoryLabel(category) {
  const labels = {
    deodorants_femmes: 'Déodorants Femmes',
    deodorants_hommes: 'Déodorants Hommes',
    brumes: 'Brumes',
    soins_bucco_dentaire: 'Soins bucco-dentaire',
    lait_corps: 'Lait de corps'
  };
  return labels[category] || 'Produit';
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);
}

async function apiFetch(url, options = {}) {
  const response = await fetch(url, {
    credentials: 'same-origin',
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options.headers || {})
    }
  });

  let data = null;
  try {
    data = await response.json();
  } catch (error) {
    data = null;
  }

  if (!response.ok) {
    if (response.status === 401) setConnected(false);
    throw new Error(data?.error || 'Une erreur est survenue.');
  }

  return data;
}

function setConnected(isConnected) {
  loginScreen.hidden = isConnected;
  adminApp.hidden = !isConnected;
  if (isConnected) {
    loadProducts();
  }
}

async function checkAdminSession() {
  try {
    const status = await apiFetch('/api/admin/status');
    setConnected(Boolean(status.authenticated));
  } catch (error) {
    setConnected(false);
  }
}

async function loadProducts() {
  try {
    products = await apiFetch('/api/products');
    renderProductList();
  } catch (error) {
    showToast(error.message || 'Impossible de charger les produits.');
  }
}

function renderPreview(image, emoji = '🛍️') {
  if (image) {
    imagePreview.innerHTML = `<img src="${escapeHTML(image)}" alt="Aperçu du produit" />`;
  } else {
    imagePreview.innerHTML = `<span>${escapeHTML(emoji || '🛍️')}</span>`;
  }
}

function productVisual(product) {
  if (product.image) {
    return `<img src="${escapeHTML(product.image)}" alt="${escapeHTML(product.name)}" />`;
  }
  return `<span>${escapeHTML(product.emoji || '🛍️')}</span>`;
}

function renderProductList() {
  const query = (searchProduct.value || '').trim().toLowerCase();
  const filtered = products.filter(product => {
    const text = `${product.name} ${product.desc} ${getCategoryLabel(product.category)} ${product.price}`.toLowerCase();
    return text.includes(query);
  });

  productCounter.textContent = `${products.length} produit${products.length > 1 ? 's' : ''}`;

  if (filtered.length === 0) {
    adminProductList.innerHTML = `
      <div class="empty-products admin-empty">
        <h3>Aucun produit trouvé</h3>
        <p>Ajoutez un nouveau produit ou modifiez votre recherche.</p>
      </div>
    `;
    return;
  }

  adminProductList.innerHTML = filtered.map(product => `
    <article class="admin-product-card">
      <div class="admin-product-thumb">
        ${productVisual(product)}
      </div>
      <div class="admin-product-info">
        <span class="admin-category">${getCategoryLabel(product.category)}</span>
        <h3>${escapeHTML(product.name)}</h3>
        <p>${escapeHTML(product.desc)}</p>
        <strong>${formatPrice(product.price)}</strong>
      </div>
      <div class="admin-product-actions">
        <button class="btn secondary small" type="button" data-action="edit" data-id="${escapeHTML(product.id)}">Modifier</button>
        <button class="btn danger small" type="button" data-action="delete" data-id="${escapeHTML(product.id)}">Supprimer</button>
      </div>
    </article>
  `).join('');

  adminProductList.querySelectorAll('button[data-action]').forEach(button => {
    button.addEventListener('click', () => {
      if (button.dataset.action === 'edit') editProduct(button.dataset.id);
      if (button.dataset.action === 'delete') deleteProduct(button.dataset.id);
    });
  });
}

function clearPreviewUrl() {
  if (previewObjectUrl) {
    URL.revokeObjectURL(previewObjectUrl);
    previewObjectUrl = null;
  }
}

function resetForm() {
  productForm.reset();
  productId.value = '';
  currentImage = '';
  selectedImageFile = null;
  clearPreviewUrl();
  formTitle.textContent = 'Ajouter un produit';
  renderPreview('', '🛍️');
}

function editProduct(id) {
  const product = products.find(item => String(item.id) === String(id));
  if (!product) return;

  productId.value = product.id;
  productName.value = product.name;
  productCategory.value = product.category;
  productPrice.value = product.price;
  productDesc.value = product.desc;
  productEmoji.value = product.emoji || '🛍️';
  currentImage = product.image || '';
  selectedImageFile = null;
  clearPreviewUrl();
  removeImage.checked = false;
  productImage.value = '';
  formTitle.textContent = 'Modifier le produit';
  renderPreview(currentImage, product.emoji);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function deleteProduct(id) {
  const product = products.find(item => String(item.id) === String(id));
  if (!product) return;

  const confirmDelete = confirm(`Supprimer le produit : ${product.name} ?`);
  if (!confirmDelete) return;

  try {
    await apiFetch(`/api/products/${encodeURIComponent(id)}`, { method: 'DELETE' });
    await loadProducts();
    resetForm();
    showToast('Produit supprimé.');
  } catch (error) {
    showToast(error.message);
  }
}

productImage.addEventListener('change', () => {
  const file = productImage.files[0];
  selectedImageFile = file || null;
  clearPreviewUrl();

  if (!file) {
    renderPreview(currentImage, productEmoji.value || '🛍️');
    return;
  }

  if (!file.type.startsWith('image/')) {
    selectedImageFile = null;
    productImage.value = '';
    showToast('Veuillez choisir une image valide.');
    return;
  }

  previewObjectUrl = URL.createObjectURL(file);
  removeImage.checked = false;
  renderPreview(previewObjectUrl, productEmoji.value || '🛍️');
});

productEmoji.addEventListener('input', () => {
  if (!currentImage && !selectedImageFile) renderPreview('', productEmoji.value || '🛍️');
});

removeImage.addEventListener('change', () => {
  if (removeImage.checked) {
    selectedImageFile = null;
    productImage.value = '';
    clearPreviewUrl();
    renderPreview('', productEmoji.value || '🛍️');
  } else {
    renderPreview(previewObjectUrl || currentImage, productEmoji.value || '🛍️');
  }
});

productForm.addEventListener('submit', async event => {
  event.preventDefault();

  const formData = new FormData();
  formData.append('name', productName.value.trim());
  formData.append('category', productCategory.value);
  formData.append('price', productPrice.value);
  formData.append('desc', productDesc.value.trim());
  formData.append('emoji', productEmoji.value.trim() || '🛍️');
  formData.append('removeImage', removeImage.checked ? 'true' : 'false');

  if (selectedImageFile) {
    formData.append('imageFile', selectedImageFile);
  }

  if (!productName.value.trim() || !productDesc.value.trim()) {
    showToast('Veuillez remplir le nom et la description.');
    return;
  }

  try {
    const id = productId.value;
    if (id) {
      await apiFetch(`/api/products/${encodeURIComponent(id)}`, { method: 'PUT', body: formData });
      showToast('Produit modifié avec succès.');
    } else {
      await apiFetch('/api/products', { method: 'POST', body: formData });
      showToast('Produit ajouté avec succès.');
    }

    await loadProducts();
    resetForm();
  } catch (error) {
    showToast(error.message || 'Impossible d’enregistrer le produit.');
  }
});

newProductBtn.addEventListener('click', resetForm);
cancelEditBtn.addEventListener('click', resetForm);
searchProduct.addEventListener('input', renderProductList);

exportBtn?.addEventListener('click', async () => {
  try {
    const currentProducts = await apiFetch('/api/products');
    const blob = new Blob([JSON.stringify(currentProducts, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `catalogue-baba-business-${date}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Catalogue exporté.');
  } catch (error) {
    showToast(error.message);
  }
});

importFile?.addEventListener('change', () => {
  const file = importFile.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const imported = JSON.parse(reader.result);
      if (!Array.isArray(imported)) throw new Error('Format invalide');
      products = await apiFetch('/api/products/import', {
        method: 'POST',
        body: JSON.stringify(imported)
      });
      renderProductList();
      resetForm();
      showToast('Catalogue importé avec succès.');
    } catch (error) {
      showToast('Le fichier importé n’est pas valide.');
    }
  };
  reader.readAsText(file);
  importFile.value = '';
});

resetBtn?.addEventListener('click', async () => {
  const confirmReset = confirm('Réinitialiser le catalogue avec les produits par défaut ?');
  if (!confirmReset) return;

  try {
    products = await apiFetch('/api/products/reset', { method: 'POST', body: JSON.stringify({}) });
    renderProductList();
    resetForm();
    showToast('Catalogue réinitialisé.');
  } catch (error) {
    showToast(error.message);
  }
});

loginForm.addEventListener('submit', async event => {
  event.preventDefault();
  loginError.textContent = '';

  try {
    await apiFetch('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ password: document.getElementById('adminPassword').value })
    });
    setConnected(true);
    showToast('Connexion réussie.');
  } catch (error) {
    loginError.textContent = error.message || 'Mot de passe incorrect.';
  }
});

logoutBtn.addEventListener('click', async () => {
  try {
    await apiFetch('/api/admin/logout', { method: 'POST', body: JSON.stringify({}) });
  } finally {
    setConnected(false);
    showToast('Déconnecté.');
  }
});

renderPreview('', '🛍️');
checkAdminSession();
