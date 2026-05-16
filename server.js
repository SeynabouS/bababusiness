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
  {
    "id": "p001",
    "name": "Ushuaïa Déodorants Grenade & Vanille",
    "category": "hygiene",
    "price": 0,
    "emoji": "🧴",
    "desc": "Lot de déodorants Ushuaïa aux senteurs grenade et vanille. Disponible selon arrivage.",
    "image": "/assets/products/01-ushuaia-deodorants-grenade-et-vanille.jpeg"
  },
  {
    "id": "p002",
    "name": "Brume In The Stars Diamond Shimmer Mist",
    "category": "parfum",
    "price": 0,
    "emoji": "✨",
    "desc": "Brume parfumée scintillante In The Stars, format 236 ml.",
    "image": "/assets/products/02-brume-in-the-stars-diamond-shimmer-mist.jpeg"
  },
  {
    "id": "p003",
    "name": "Brume Twisted Fantasy",
    "category": "parfum",
    "price": 0,
    "emoji": "🌸",
    "desc": "Brume parfumée Twisted Fantasy, parfum doux et élégant pour le quotidien.",
    "image": "/assets/products/03-brume-twisted-fantasy.jpeg"
  },
  {
    "id": "p004",
    "name": "Brume If You Musk",
    "category": "parfum",
    "price": 0,
    "emoji": "🌙",
    "desc": "Brume parfumée If You Musk, senteur musquée chic et légère.",
    "image": "/assets/products/04-brume-if-you-musk.jpeg"
  },
  {
    "id": "p005",
    "name": "Brume Twisted Peppermint Dazzled",
    "category": "parfum",
    "price": 0,
    "emoji": "🍬",
    "desc": "Brume parfumée rose Twisted Peppermint Dazzled, format 236 ml.",
    "image": "/assets/products/05-brume-twisted-peppermint-dazzled.jpeg"
  },
  {
    "id": "p006",
    "name": "Brume bleue Bath & Body Works",
    "category": "parfum",
    "price": 0,
    "emoji": "💙",
    "desc": "Brume parfumée bleue Bath & Body Works, senteur fraîche et intense.",
    "image": "/assets/products/06-brume-bleue-bath-et-body-works.jpeg"
  },
  {
    "id": "p007",
    "name": "Brume Snowflakes & Cashmere",
    "category": "parfum",
    "price": 0,
    "emoji": "❄️",
    "desc": "Brume parfumée Snowflakes & Cashmere, senteur douce et réconfortante.",
    "image": "/assets/products/07-brume-snowflakes-et-cashmere.jpeg"
  },
  {
    "id": "p008",
    "name": "Brume Coconut Lime Verbena",
    "category": "parfum",
    "price": 0,
    "emoji": "🥥",
    "desc": "Brume parfumée Coconut Lime Verbena, senteur fraîche noix de coco et citron vert.",
    "image": "/assets/products/08-brume-coconut-lime-verbena.jpeg"
  },
  {
    "id": "p009",
    "name": "Brume Lost in Santal",
    "category": "parfum",
    "price": 0,
    "emoji": "🌿",
    "desc": "Brume parfumée Lost in Santal, senteur boisée et raffinée.",
    "image": "/assets/products/09-brume-lost-in-santal.jpeg"
  },
  {
    "id": "p010",
    "name": "Brume Pure Wonder",
    "category": "parfum",
    "price": 0,
    "emoji": "🌷",
    "desc": "Brume parfumée Pure Wonder, senteur féminine délicate.",
    "image": "/assets/products/10-brume-pure-wonder.jpeg"
  },
  {
    "id": "p011",
    "name": "Brume Snowflakes & Cashmere verte",
    "category": "parfum",
    "price": 0,
    "emoji": "❄️",
    "desc": "Brume parfumée Snowflakes & Cashmere, flacon vert, format 236 ml.",
    "image": "/assets/products/11-brume-snowflakes-et-cashmere-verte.jpeg"
  },
  {
    "id": "p012",
    "name": "Brume Warm Vanilla Sugar",
    "category": "parfum",
    "price": 0,
    "emoji": "🍦",
    "desc": "Brume parfumée Warm Vanilla Sugar, senteur vanille gourmande.",
    "image": "/assets/products/12-brume-warm-vanilla-sugar.jpeg"
  },
  {
    "id": "p013",
    "name": "Brume Pink Obsessed",
    "category": "parfum",
    "price": 0,
    "emoji": "💗",
    "desc": "Brume parfumée Pink Obsessed, flacon rose, format 236 ml.",
    "image": "/assets/products/13-brume-pink-obsessed.jpeg"
  },
  {
    "id": "p014",
    "name": "Brume Japanese Cherry Blossom",
    "category": "parfum",
    "price": 0,
    "emoji": "🌸",
    "desc": "Brume parfumée Japanese Cherry Blossom, senteur florale élégante.",
    "image": "/assets/products/14-brume-japanese-cherry-blossom.jpeg"
  },
  {
    "id": "p015",
    "name": "Déodorant Nivea Fresh Energy",
    "category": "hygiene",
    "price": 0,
    "emoji": "🧴",
    "desc": "Déodorant Nivea Fresh Energy anti-transpirant, protection 48h.",
    "image": "/assets/products/15-deodorant-nivea-fresh-energy.jpeg"
  },
  {
    "id": "p016",
    "name": "Déodorant Nivea Men Fresh Power",
    "category": "hygiene",
    "price": 0,
    "emoji": "🧴",
    "desc": "Déodorant Nivea Men Fresh Power, protection longue durée.",
    "image": "/assets/products/16-deodorant-nivea-men-fresh-power.jpeg"
  },
  {
    "id": "p017",
    "name": "Brume Into The Night Diamond Shimmer Mist",
    "category": "parfum",
    "price": 0,
    "emoji": "✨",
    "desc": "Brume parfumée scintillante Into The Night, format 236 ml.",
    "image": "/assets/products/17-brume-into-the-night-diamond-shimmer-mist.jpeg"
  },
  {
    "id": "p018",
    "name": "Brume Floral Fantasy",
    "category": "parfum",
    "price": 0,
    "emoji": "🌺",
    "desc": "Brume parfumée Floral Fantasy, senteur florale intense.",
    "image": "/assets/products/18-brume-floral-fantasy.jpeg"
  },
  {
    "id": "p019",
    "name": "Brume Brightest Bloom",
    "category": "parfum",
    "price": 0,
    "emoji": "🌼",
    "desc": "Brume parfumée Brightest Bloom, senteur florale et lumineuse.",
    "image": "/assets/products/19-brume-brightest-bloom.jpeg"
  },
  {
    "id": "p020",
    "name": "Brume Into The Night",
    "category": "parfum",
    "price": 0,
    "emoji": "🌙",
    "desc": "Brume parfumée Into The Night, senteur élégante et intense.",
    "image": "/assets/products/20-brume-into-the-night.jpeg"
  },
  {
    "id": "p021",
    "name": "Brume Gingham",
    "category": "parfum",
    "price": 0,
    "emoji": "💙",
    "desc": "Brume parfumée Gingham, senteur fraîche et légère.",
    "image": "/assets/products/21-brume-gingham.jpeg"
  },
  {
    "id": "p022",
    "name": "Brume Twisted Peppermint",
    "category": "parfum",
    "price": 0,
    "emoji": "🍬",
    "desc": "Brume parfumée Twisted Peppermint, senteur fraîche et sucrée.",
    "image": "/assets/products/22-brume-twisted-peppermint.jpeg"
  },
  {
    "id": "p023",
    "name": "Brume Gingham Gorgeous",
    "category": "parfum",
    "price": 0,
    "emoji": "💗",
    "desc": "Brume parfumée Gingham Gorgeous, flacon rose, format 236 ml.",
    "image": "/assets/products/23-brume-gingham-gorgeous.jpeg"
  },
  {
    "id": "p024",
    "name": "Brume In The Stars",
    "category": "parfum",
    "price": 0,
    "emoji": "⭐",
    "desc": "Brume parfumée In The Stars, senteur chic et lumineuse.",
    "image": "/assets/products/24-brume-in-the-stars.jpeg"
  },
  {
    "id": "p025",
    "name": "Brume Musk",
    "category": "parfum",
    "price": 0,
    "emoji": "🌈",
    "desc": "Brume parfumée Musk, senteur musquée multicolore.",
    "image": "/assets/products/25-brume-musk.jpeg"
  },
  {
    "id": "p026",
    "name": "Déodorant Nivea Pure Invisible",
    "category": "hygiene",
    "price": 0,
    "emoji": "🧴",
    "desc": "Déodorant Nivea Pure Invisible anti-transpirant, protection 48h.",
    "image": "/assets/products/26-deodorant-nivea-pure-invisible.jpeg"
  },
  {
    "id": "p027",
    "name": "Déodorant Vaseline Aloe Sensitive",
    "category": "hygiene",
    "price": 0,
    "emoji": "🌿",
    "desc": "Déodorant Vaseline Aloe Sensitive, protection 48h.",
    "image": "/assets/products/27-deodorant-vaseline-aloe-sensitive.jpeg"
  },
  {
    "id": "p028",
    "name": "Déodorant Nivea Protect & Care",
    "category": "hygiene",
    "price": 0,
    "emoji": "🧴",
    "desc": "Déodorant Nivea Protect & Care, protection 48h.",
    "image": "/assets/products/28-deodorant-nivea-protect-et-care.jpeg"
  },
  {
    "id": "p029",
    "name": "Dentifrice Colgate Kids Big Smiles 6-9 ans",
    "category": "hygiene",
    "price": 0,
    "emoji": "🪥",
    "desc": "Dentifrice Colgate Kids Big Smiles pour enfants de 6 à 9 ans.",
    "image": "/assets/products/29-dentifrice-colgate-kids-big-smiles-6-9-ans.jpeg"
  },
  {
    "id": "p030",
    "name": "Déodorant Adidas Victory League",
    "category": "hygiene",
    "price": 0,
    "emoji": "⚫",
    "desc": "Déodorant Adidas Victory League Deo Body Spray, format 150 ml.",
    "image": "/assets/products/30-deodorant-adidas-victory-league.jpeg"
  },
  {
    "id": "p031",
    "name": "Déodorant Monsavon Thé Vert & Fleur de Lotus",
    "category": "hygiene",
    "price": 0,
    "emoji": "🌸",
    "desc": "Déodorant Monsavon Mon Déo, senteur thé vert et fleur de lotus.",
    "image": "/assets/products/31-deodorant-monsavon-the-vert-et-fleur-de-lotus.jpeg"
  },
  {
    "id": "p032",
    "name": "Déodorant Vaseline Active Fresh",
    "category": "hygiene",
    "price": 0,
    "emoji": "💧",
    "desc": "Déodorant Vaseline Active Fresh, protection 48h.",
    "image": "/assets/products/32-deodorant-vaseline-active-fresh.jpeg"
  },
  {
    "id": "p033",
    "name": "Brume Gingham Glow",
    "category": "parfum",
    "price": 0,
    "emoji": "☀️",
    "desc": "Brume parfumée Gingham Glow, senteur chaude et lumineuse.",
    "image": "/assets/products/33-brume-gingham-glow.jpeg"
  },
  {
    "id": "p034",
    "name": "Duo Nivea Men Protect & Care",
    "category": "hygiene",
    "price": 0,
    "emoji": "🧴",
    "desc": "Pack de deux déodorants Nivea Men Protect & Care, protection 48h.",
    "image": "/assets/products/34-duo-nivea-men-protect-et-care.jpeg"
  },
  {
    "id": "p035",
    "name": "Déodorant Monsavon Grenade Energisant",
    "category": "hygiene",
    "price": 0,
    "emoji": "❤️",
    "desc": "Déodorant Monsavon au lait, senteur grenade énergisante.",
    "image": "/assets/products/35-deodorant-monsavon-grenade-energisant.jpeg"
  },
  {
    "id": "p036",
    "name": "Déodorant Nivea Men Black & White Invisible",
    "category": "hygiene",
    "price": 0,
    "emoji": "⚫",
    "desc": "Déodorant Nivea Men Black & White Invisible Original, protection 48h.",
    "image": "/assets/products/36-deodorant-nivea-men-black-et-white-invisible.jpeg"
  },
  {
    "id": "p037",
    "name": "Dentifrice Colgate Natural",
    "category": "hygiene",
    "price": 0,
    "emoji": "🪥",
    "desc": "Dentifrice Colgate Natural White, format 75 ml.",
    "image": "/assets/products/37-dentifrice-colgate-natural.jpeg"
  },
  {
    "id": "p038",
    "name": "Déodorant Nivea Men Sensitive Protect",
    "category": "hygiene",
    "price": 0,
    "emoji": "🧴",
    "desc": "Déodorant Nivea Men Sensitive Protect, protection 48h.",
    "image": "/assets/products/38-deodorant-nivea-men-sensitive-protect.jpeg"
  },
  {
    "id": "p039",
    "name": "Gel douche Ushuaïa Hammam Argan",
    "category": "hygiene",
    "price": 0,
    "emoji": "🚿",
    "desc": "Douche soin gommante Ushuaïa Hammam au savon noir et huile d’argan.",
    "image": "/assets/products/39-gel-douche-ushuaia-hammam-argan.jpeg"
  }
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
