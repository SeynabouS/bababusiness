const express = require('express');
const multer = require('multer');
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(DATA_DIR, 'uploads');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const PUBLIC_DIR = __dirname;

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'baba2026';
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'change-this-secret-in-render';
const COOKIE_NAME = 'baba_admin_token';
const TOKEN_TTL_MS = 1000 * 60 * 60 * 8; // 8 heures

const DEFAULT_PRODUCTS = [
  { id: '1', name: 'Déodorant fraîcheur', category: 'beaute', price: 2500, emoji: '🧴', desc: 'Déodorant pratique pour une sensation de fraîcheur au quotidien.', image: '' },
  { id: '2', name: 'Parfum homme/femme', category: 'parfum', price: 6500, emoji: '🌸', desc: 'Parfum élégant pour offrir ou se faire plaisir.', image: '' },
  { id: '3', name: 'Montre classique', category: 'accessoire', price: 12000, emoji: '⌚', desc: 'Montre simple et chic pour compléter votre style.', image: '' },
  { id: '4', name: 'Complément alimentaire', category: 'bienetre', price: 8000, emoji: '💊', desc: 'Produit bien-être à commander selon disponibilité.', image: '' },
  { id: '5', name: 'Sac pratique', category: 'accessoire', price: 9500, emoji: '👜', desc: 'Sac utile pour le quotidien, disponible en plusieurs styles.', image: '' },
  { id: '6', name: 'Mini enceinte', category: 'maison', price: 11000, emoji: '🔊', desc: 'Petit accessoire audio pour la maison ou les sorties.', image: '' },
  { id: '7', name: 'Lunettes tendance', category: 'accessoire', price: 5000, emoji: '🕶️', desc: 'Lunettes stylées pour compléter votre look.', image: '' },
  { id: '8', name: 'Thermos / gourde', category: 'maison', price: 4500, emoji: '🥤', desc: 'Article pratique pour garder vos boissons avec vous.', image: '' },
  { id: '9', name: 'Crème hydratante', category: 'beaute', price: 3500, emoji: '🧼', desc: 'Soin doux pour hydrater et protéger la peau.', image: '' },
  { id: '10', name: 'Kit cadeau bazar', category: 'maison', price: 15000, emoji: '🎁', desc: 'Composition personnalisée selon votre budget.', image: '' },
  { id: '11', name: 'Accessoire téléphone', category: 'accessoire', price: 3000, emoji: '📱', desc: 'Chargeur, câble ou petit accessoire selon arrivage.', image: '' },
  { id: '12', name: 'Diffuseur de parfum', category: 'parfum', price: 7000, emoji: '🏠', desc: 'Pour parfumer agréablement votre intérieur.', image: '' }
];

function sign(value) {
  return crypto.createHmac('sha256', ADMIN_SECRET).update(value).digest('base64url');
}

function createToken() {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + TOKEN_TTL_MS })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

function verifyToken(token) {
  if (!token || !token.includes('.')) return false;
  const [payload, signature] = token.split('.');
  if (signature !== sign(payload)) return false;

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return Number(data.exp) > Date.now();
  } catch (error) {
    return false;
  }
}

function parseCookies(req) {
  const header = req.headers.cookie || '';
  return Object.fromEntries(header.split(';').filter(Boolean).map(cookie => {
    const [key, ...value] = cookie.trim().split('=');
    return [key, decodeURIComponent(value.join('='))];
  }));
}

function isAdmin(req) {
  const cookies = parseCookies(req);
  return verifyToken(cookies[COOKIE_NAME]);
}

function requireAdmin(req, res, next) {
  if (!isAdmin(req)) {
    return res.status(401).json({ error: 'Connexion admin requise.' });
  }
  next();
}

function normalizeProduct(product) {
  return {
    id: String(product.id || `p-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`),
    name: String(product.name || 'Produit sans nom').trim(),
    category: String(product.category || 'maison').trim(),
    price: Number(product.price) || 0,
    emoji: String(product.emoji || '🛍️').trim() || '🛍️',
    desc: String(product.desc || '').trim(),
    image: String(product.image || '').trim()
  };
}

async function ensureStorage() {
  await fsp.mkdir(DATA_DIR, { recursive: true });
  await fsp.mkdir(UPLOAD_DIR, { recursive: true });

  if (!fs.existsSync(PRODUCTS_FILE)) {
    await writeProducts(DEFAULT_PRODUCTS);
  }
}

async function readProducts() {
  await ensureStorage();
  try {
    const raw = await fsp.readFile(PRODUCTS_FILE, 'utf8');
    const products = JSON.parse(raw);
    if (!Array.isArray(products)) throw new Error('Catalogue invalide');
    return products.map(normalizeProduct);
  } catch (error) {
    await writeProducts(DEFAULT_PRODUCTS);
    return DEFAULT_PRODUCTS.map(normalizeProduct);
  }
}

async function writeProducts(products) {
  await fsp.mkdir(DATA_DIR, { recursive: true });
  const cleanProducts = products.map(normalizeProduct);
  await fsp.writeFile(PRODUCTS_FILE, JSON.stringify(cleanProducts, null, 2), 'utf8');
  return cleanProducts;
}

async function deleteUploadedImage(imagePath) {
  if (!imagePath || !imagePath.startsWith('/uploads/')) return;
  const filePath = path.join(UPLOAD_DIR, path.basename(imagePath));
  try {
    await fsp.unlink(filePath);
  } catch (error) {
    // Image déjà supprimée ou absente : on ignore.
  }
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
    cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Seules les images sont acceptées.'));
    }
    cb(null, true);
  }
});

app.use(express.json({ limit: '1mb' }));
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '1d' }));
app.use(express.static(PUBLIC_DIR, {
  extensions: ['html'],
  index: 'index.html'
}));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, storage: DATA_DIR });
});

app.get('/api/products', async (_req, res, next) => {
  try {
    const products = await readProducts();
    res.json(products);
  } catch (error) {
    next(error);
  }
});

app.post('/api/admin/login', async (req, res) => {
  const password = String(req.body.password || '');
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Mot de passe incorrect.' });
  }

  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=${encodeURIComponent(createToken())}; HttpOnly; Path=/; Max-Age=${TOKEN_TTL_MS / 1000}; SameSite=Lax${secure}`);
  res.json({ authenticated: true });
});

app.post('/api/admin/logout', (_req, res) => {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`);
  res.json({ authenticated: false });
});

app.get('/api/admin/status', (req, res) => {
  res.json({ authenticated: isAdmin(req) });
});

app.post('/api/products', requireAdmin, upload.single('imageFile'), async (req, res, next) => {
  try {
    const products = await readProducts();
    const image = req.file ? `/uploads/${req.file.filename}` : '';
    const product = normalizeProduct({
      id: `p-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      name: req.body.name,
      category: req.body.category,
      price: req.body.price,
      desc: req.body.desc,
      emoji: req.body.emoji,
      image
    });

    if (!product.name || !product.desc) {
      if (image) await deleteUploadedImage(image);
      return res.status(400).json({ error: 'Le nom et la description sont obligatoires.' });
    }

    products.unshift(product);
    await writeProducts(products);
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
});

app.put('/api/products/:id', requireAdmin, upload.single('imageFile'), async (req, res, next) => {
  try {
    const products = await readProducts();
    const index = products.findIndex(product => String(product.id) === String(req.params.id));
    if (index === -1) {
      if (req.file) await deleteUploadedImage(`/uploads/${req.file.filename}`);
      return res.status(404).json({ error: 'Produit introuvable.' });
    }

    const existing = products[index];
    const removeImage = String(req.body.removeImage || '') === 'true';
    let image = existing.image || '';

    if (req.file) {
      await deleteUploadedImage(existing.image);
      image = `/uploads/${req.file.filename}`;
    } else if (removeImage) {
      await deleteUploadedImage(existing.image);
      image = '';
    }

    const updated = normalizeProduct({
      ...existing,
      name: req.body.name,
      category: req.body.category,
      price: req.body.price,
      desc: req.body.desc,
      emoji: req.body.emoji,
      image
    });

    if (!updated.name || !updated.desc) {
      return res.status(400).json({ error: 'Le nom et la description sont obligatoires.' });
    }

    products[index] = updated;
    await writeProducts(products);
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/products/:id', requireAdmin, async (req, res, next) => {
  try {
    const products = await readProducts();
    const product = products.find(item => String(item.id) === String(req.params.id));
    if (!product) return res.status(404).json({ error: 'Produit introuvable.' });

    await deleteUploadedImage(product.image);
    await writeProducts(products.filter(item => String(item.id) !== String(req.params.id)));
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.post('/api/products/reset', requireAdmin, async (_req, res, next) => {
  try {
    const products = await writeProducts(DEFAULT_PRODUCTS);
    res.json(products);
  } catch (error) {
    next(error);
  }
});

app.post('/api/products/import', requireAdmin, async (req, res, next) => {
  try {
    if (!Array.isArray(req.body)) {
      return res.status(400).json({ error: 'Le fichier importé doit contenir une liste de produits.' });
    }
    const products = await writeProducts(req.body.map(normalizeProduct));
    res.json(products);
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  const message = error.message || 'Erreur serveur.';
  res.status(500).json({ error: message });
});

ensureStorage().then(() => {
  app.listen(PORT, () => {
    console.log(`Baba Business lancé sur le port ${PORT}`);
    console.log(`Données produits : ${PRODUCTS_FILE}`);
    console.log(`Photos produits : ${UPLOAD_DIR}`);
  });
});
