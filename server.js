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
    "category": "deodorants_femmes",
    "price": 2500,
    "emoji": "🧴",
    "desc": "Un duo de déodorants Ushuaïa aux notes grenade et vanille, idéal pour varier entre fraîcheur fruitée et douceur gourmande au quotidien.",
    "image": "/assets/products/01-ushuaia-deodorants-grenade-et-vanille.jpeg",
    "outOfStock": false
  },
  {
    "id": "p002",
    "name": "Brume In The Stars Diamond Shimmer Mist",
    "category": "brumes",
    "price": 2800,
    "emoji": "✨",
    "desc": "Une brume scintillante In The Stars qui parfume délicatement la peau et laisse un voile lumineux pour sublimer vos sorties comme vos journées.",
    "image": "/assets/products/02-brume-in-the-stars-diamond-shimmer-mist.jpeg",
    "outOfStock": false
  },
  {
    "id": "p003",
    "name": "Brume Twisted Fantasy",
    "category": "brumes",
    "price": 2400,
    "emoji": "🌸",
    "desc": "Twisted Fantasy apporte une touche parfumée douce, féminine et facile à porter, parfaite pour se sentir fraîche du matin au soir.",
    "image": "/assets/products/03-brume-twisted-fantasy.jpeg",
    "outOfStock": false
  },
  {
    "id": "p004",
    "name": "Brume If You Musk",
    "category": "brumes",
    "price": 2900,
    "emoji": "🌙",
    "desc": "If You Musk révèle une senteur musquée chic et discrète, pensée pour celles qui aiment les parfums propres, élégants et modernes.",
    "image": "/assets/products/04-brume-if-you-musk.jpeg",
    "outOfStock": false
  },
  {
    "id": "p005",
    "name": "Brume Twisted Peppermint Dazzled",
    "category": "brumes",
    "price": 2900,
    "emoji": "🍬",
    "desc": "Twisted Peppermint Dazzled mêle fraîcheur sucrée et fini scintillant pour une brume pétillante qui attire subtilement la lumière.",
    "image": "/assets/products/05-brume-twisted-peppermint-dazzled.jpeg",
    "outOfStock": false
  },
  {
    "id": "p006",
    "name": "Brume bleue Bath & Body Works",
    "category": "brumes",
    "price": 2500,
    "emoji": "💙",
    "desc": "Une brume Bath & Body Works au flacon bleu, fraîche et présente, parfaite pour donner du caractère à votre routine parfumée.",
    "image": "/assets/products/06-brume-bleue-bath-et-body-works.jpeg",
    "outOfStock": false
  },
  {
    "id": "p007",
    "name": "Brume Snowflakes & Cashmere",
    "category": "brumes",
    "price": 4400,
    "emoji": "❄️",
    "desc": "Snowflakes & Cashmere enveloppe la peau d'une senteur douce, chaleureuse et réconfortante, idéale pour un parfum cocooning très féminin.",
    "image": "/assets/products/07-brume-snowflakes-et-cashmere.jpeg",
    "outOfStock": false
  },
  {
    "id": "p008",
    "name": "Brume Coconut Lime Verbena",
    "category": "brumes",
    "price": 2400,
    "emoji": "🥥",
    "desc": "Coconut Lime Verbena associe la douceur de la noix de coco à l'énergie du citron vert pour une sensation fraîche, solaire et légère.",
    "image": "/assets/products/08-brume-coconut-lime-verbena.jpeg",
    "outOfStock": false
  },
  {
    "id": "p009",
    "name": "Brume Lost in Santal",
    "category": "brumes",
    "price": 2900,
    "emoji": "🌿",
    "desc": "Lost in Santal offre une signature boisée raffinée, parfaite pour celles qui veulent une brume élégante avec une vraie présence.",
    "image": "/assets/products/09-brume-lost-in-santal.jpeg",
    "outOfStock": false
  },
  {
    "id": "p010",
    "name": "Brume Pure Wonder",
    "category": "brumes",
    "price": 2300,
    "emoji": "🌷",
    "desc": "Pure Wonder dépose une fragrance délicate et lumineuse, facile à porter pour une touche féminine propre et soignée.",
    "image": "/assets/products/10-brume-pure-wonder.jpeg",
    "outOfStock": false
  },
  {
    "id": "p011",
    "name": "Brume Snowflakes & Cashmere verte",
    "category": "brumes",
    "price": 2800,
    "emoji": "❄️",
    "desc": "Cette version verte de Snowflakes & Cashmere propose une senteur douce et enveloppante, parfaite pour parfumer la peau avec finesse.",
    "image": "/assets/products/11-brume-snowflakes-et-cashmere-verte.jpeg",
    "outOfStock": false
  },
  {
    "id": "p012",
    "name": "Brume Warm Vanilla Sugar",
    "category": "brumes",
    "price": 2900,
    "emoji": "🍦",
    "desc": "Warm Vanilla Sugar séduit avec sa vanille douce et gourmande, une brume réconfortante qui donne une impression chaleureuse et sucrée.",
    "image": "/assets/products/12-brume-warm-vanilla-sugar.jpeg",
    "outOfStock": false
  },
  {
    "id": "p013",
    "name": "Brume Pink Obsessed",
    "category": "brumes",
    "price": 3300,
    "emoji": "💗",
    "desc": "Pink Obsessed est une brume féminine et lumineuse, parfaite pour celles qui aiment les parfums doux avec une touche glamour.",
    "image": "/assets/products/13-brume-pink-obsessed.jpeg",
    "outOfStock": false
  },
  {
    "id": "p014",
    "name": "Brume Japanese Cherry Blossom",
    "category": "brumes",
    "price": 0,
    "emoji": "🌸",
    "desc": "Japanese Cherry Blossom apporte une élégance florale intemporelle, idéale pour une routine parfumée raffinée et féminine.",
    "image": "/assets/products/14-brume-japanese-cherry-blossom.jpeg",
    "outOfStock": false
  },
  {
    "id": "p015",
    "name": "Déodorant Nivea Fresh Energy",
    "category": "deodorants_femmes",
    "price": 2000,
    "emoji": "🧴",
    "desc": "Nivea Fresh Energy aide à garder une sensation de fraîcheur nette et propre, avec une protection anti-transpirante pensée pour la journée.",
    "image": "/assets/products/15-deodorant-nivea-fresh-energy.jpeg",
    "outOfStock": false
  },
  {
    "id": "p016",
    "name": "Déodorant Nivea Men Fresh Power",
    "category": "deodorants_hommes",
    "price": 2500,
    "emoji": "🧴",
    "desc": "Nivea Men Fresh Power accompagne les journées actives avec une fraîcheur masculine efficace et une protection longue durée.",
    "image": "/assets/products/16-deodorant-nivea-men-fresh-power.jpeg",
    "outOfStock": false
  },
  {
    "id": "p017",
    "name": "Brume Into The Night Diamond Shimmer Mist",
    "category": "brumes",
    "price": 2400,
    "emoji": "✨",
    "desc": "Into The Night Diamond Shimmer Mist parfume la peau d'une senteur intense et laisse un fini scintillant idéal pour les occasions spéciales.",
    "image": "/assets/products/17-brume-into-the-night-diamond-shimmer-mist.jpeg",
    "outOfStock": false
  },
  {
    "id": "p018",
    "name": "Brume Floral Fantasy",
    "category": "brumes",
    "price": 2800,
    "emoji": "🌺",
    "desc": "Floral Fantasy offre un bouquet floral affirmé, parfait pour celles qui veulent une brume féminine, expressive et remarquée.",
    "image": "/assets/products/18-brume-floral-fantasy.jpeg",
    "outOfStock": false
  },
  {
    "id": "p019",
    "name": "Brume Brightest Bloom",
    "category": "brumes",
    "price": 2900,
    "emoji": "🌼",
    "desc": "Brightest Bloom illumine la routine avec une senteur florale fraîche et radieuse, idéale pour une impression douce et soignée.",
    "image": "/assets/products/19-brume-brightest-bloom.jpeg",
    "outOfStock": false
  },
  {
    "id": "p020",
    "name": "Brume Into The Night",
    "category": "brumes",
    "price": 0,
    "emoji": "🌙",
    "desc": "Into The Night révèle une fragrance élégante, profonde et sensuelle, parfaite pour le soir ou pour marquer votre présence avec style.",
    "image": "/assets/products/20-brume-into-the-night.jpeg",
    "outOfStock": false
  },
  {
    "id": "p021",
    "name": "Brume Gingham",
    "category": "brumes",
    "price": 0,
    "emoji": "💙",
    "desc": "Gingham est une brume fraîche, propre et légère, facile à porter tous les jours pour une sensation simple et élégante.",
    "image": "/assets/products/21-brume-gingham.jpeg",
    "outOfStock": false
  },
  {
    "id": "p022",
    "name": "Brume Twisted Peppermint",
    "category": "brumes",
    "price": 0,
    "emoji": "🍬",
    "desc": "Twisted Peppermint apporte une fraîcheur sucrée et pétillante, idéale pour une brume originale qui réveille les sens.",
    "image": "/assets/products/22-brume-twisted-peppermint.jpeg",
    "outOfStock": false
  },
  {
    "id": "p023",
    "name": "Brume Gingham Gorgeous",
    "category": "brumes",
    "price": 2800,
    "emoji": "💗",
    "desc": "Gingham Gorgeous dévoile une senteur féminine, fruitée-florale et lumineuse, parfaite pour une touche fraîche et glamour.",
    "image": "/assets/products/23-brume-gingham-gorgeous.jpeg",
    "outOfStock": false
  },
  {
    "id": "p024",
    "name": "Brume In The Stars",
    "category": "brumes",
    "price": 2800,
    "emoji": "⭐",
    "desc": "In The Stars signe une fragrance chic et lumineuse, idéale pour celles qui veulent une brume élégante avec une belle personnalité.",
    "image": "/assets/products/24-brume-in-the-stars.jpeg",
    "outOfStock": false
  },
  {
    "id": "p025",
    "name": "Brume Musk",
    "category": "brumes",
    "price": 3900,
    "emoji": "🌈",
    "desc": "Musk mise sur une senteur musquée douce et moderne, parfaite pour un parfum propre, discret et sophistiqué.",
    "image": "/assets/products/25-brume-musk.jpeg",
    "outOfStock": false
  },
  {
    "id": "p026",
    "name": "Déodorant Nivea Pure Invisible",
    "category": "deodorants_femmes",
    "price": 0,
    "emoji": "🧴",
    "desc": "Nivea Pure Invisible aide à rester fraîche tout en limitant les traces visibles, un essentiel pratique pour les tenues claires ou foncées.",
    "image": "/assets/products/26-deodorant-nivea-pure-invisible.jpeg",
    "outOfStock": false
  },
  {
    "id": "p027",
    "name": "Déodorant Vaseline Aloe Sensitive",
    "category": "deodorants_femmes",
    "price": 3000,
    "emoji": "🌿",
    "desc": "Vaseline Aloe Sensitive combine fraîcheur et douceur avec une formule pensée pour les peaux sensibles et les journées bien remplies.",
    "image": "/assets/products/27-deodorant-vaseline-aloe-sensitive.jpeg",
    "outOfStock": false
  },
  {
    "id": "p028",
    "name": "Déodorant Nivea Protect & Care",
    "category": "deodorants_femmes",
    "price": 0,
    "emoji": "🧴",
    "desc": "Nivea Protect & Care offre une sensation de soin et de fraîcheur, idéale pour une protection quotidienne simple et rassurante.",
    "image": "/assets/products/28-deodorant-nivea-protect-et-care.jpeg",
    "outOfStock": false
  },
  {
    "id": "p029",
    "name": "Dentifrice Colgate Kids Big Smiles 6-9 ans",
    "category": "soins_bucco_dentaire",
    "price": 0,
    "emoji": "🪥",
    "desc": "Colgate Kids Big Smiles accompagne les enfants de 6 à 9 ans avec un dentifrice adapté pour encourager une routine sourire facile.",
    "image": "/assets/products/29-dentifrice-colgate-kids-big-smiles-6-9-ans.jpeg",
    "outOfStock": false
  },
  {
    "id": "p030",
    "name": "Déodorant Adidas Victory League",
    "category": "deodorants_hommes",
    "price": 2400,
    "emoji": "⚫",
    "desc": "Adidas Victory League apporte une fraîcheur sportive et masculine, pratique après la douche, le sport ou avant une journée active.",
    "image": "/assets/products/30-deodorant-adidas-victory-league.jpeg",
    "outOfStock": false
  },
  {
    "id": "p031",
    "name": "Déodorant Monsavon Thé Vert & Fleur de Lotus",
    "category": "deodorants_femmes",
    "price": 0,
    "emoji": "🌸",
    "desc": "Monsavon Thé Vert & Fleur de Lotus associe une fraîcheur végétale à une note florale douce pour une sensation propre et délicate.",
    "image": "/assets/products/31-deodorant-monsavon-the-vert-et-fleur-de-lotus.jpeg",
    "outOfStock": false
  },
  {
    "id": "p032",
    "name": "Déodorant Vaseline Active Fresh",
    "category": "deodorants_femmes",
    "price": 0,
    "emoji": "💧",
    "desc": "Vaseline Active Fresh offre une fraîcheur dynamique et facile à porter, parfaite pour rester à l'aise pendant la journée.",
    "image": "/assets/products/32-deodorant-vaseline-active-fresh.jpeg",
    "outOfStock": false
  },
  {
    "id": "p033",
    "name": "Brume Gingham Glow",
    "category": "brumes",
    "price": 0,
    "emoji": "☀️",
    "desc": "Gingham Glow réchauffe la peau avec une senteur lumineuse et solaire, idéale pour ajouter une touche éclatante à votre routine.",
    "image": "/assets/products/33-brume-gingham-glow.jpeg",
    "outOfStock": false
  },
  {
    "id": "p034",
    "name": "Duo Nivea Men Protect & Care",
    "category": "lait_corps",
    "price": 0,
    "emoji": "🧴",
    "desc": "Un duo Nivea Men Protect & Care pratique pour garder une protection fraîche sous la main, à la maison, au travail ou en déplacement.",
    "image": "/assets/products/34-duo-nivea-men-protect-et-care.jpeg",
    "outOfStock": false
  },
  {
    "id": "p035",
    "name": "Déodorant Monsavon Grenade Energisant",
    "category": "deodorants_femmes",
    "price": 0,
    "emoji": "❤️",
    "desc": "Monsavon Grenade Energisant apporte une senteur fruitée et vivifiante, parfaite pour commencer la journée avec une impression de fraîcheur.",
    "image": "/assets/products/35-deodorant-monsavon-grenade-energisant.jpeg",
    "outOfStock": false
  },
  {
    "id": "p036",
    "name": "Déodorant Nivea Men Black & White Invisible",
    "category": "deodorants_hommes",
    "price": 0,
    "emoji": "⚫",
    "desc": "Nivea Men Black & White Invisible aide à protéger vos vêtements des traces visibles tout en offrant une fraîcheur masculine au quotidien.",
    "image": "/assets/products/36-deodorant-nivea-men-black-et-white-invisible.jpeg",
    "outOfStock": false
  },
  {
    "id": "p037",
    "name": "Dentifrice Colgate Natural",
    "category": "soins_bucco_dentaire",
    "price": 0,
    "emoji": "🪥",
    "desc": "Colgate Natural White est un dentifrice pratique au format 75 ml, idéal pour une routine bucco-dentaire propre et soignée.",
    "image": "/assets/products/37-dentifrice-colgate-natural.jpeg",
    "outOfStock": false
  },
  {
    "id": "p038",
    "name": "Déodorant Nivea Men Sensitive Protect",
    "category": "deodorants_hommes",
    "price": 0,
    "emoji": "🧴",
    "desc": "Nivea Men Sensitive Protect offre une protection fraîche pensée pour les peaux sensibles, avec un confort adapté à l'usage quotidien.",
    "image": "/assets/products/38-deodorant-nivea-men-sensitive-protect.jpeg",
    "outOfStock": false
  },
  {
    "id": "p039",
    "name": "Gel douche Ushuaïa Hammam Argan",
    "category": "lait_corps",
    "price": 3400,
    "emoji": "🚿",
    "desc": "Ushuaïa Hammam Argan transforme la douche en moment sensoriel avec savon noir et huile d'argan pour une peau douce et parfumée.",
    "image": "/assets/products/39-gel-douche-ushuaia-hammam-argan.jpeg",
    "outOfStock": false
  }
];

const DEFAULT_PRODUCTS_BY_ID = new Map(DEFAULT_PRODUCTS.map(product => [String(product.id), product]));

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
    category: String(product.category || 'deodorants_femmes').trim(),
    price: Number(product.price) || 0,
    emoji: String(product.emoji || '🛍️').trim() || '🛍️',
    desc: String(product.desc || '').trim(),
    image: String(product.image || '').trim(),
    outOfStock: Boolean(product.outOfStock)
  };
}

async function ensureStorage() {
  await fsp.mkdir(DATA_DIR, { recursive: true });
  await fsp.mkdir(UPLOAD_DIR, { recursive: true });

  if (!fs.existsSync(PRODUCTS_FILE)) {
    await writeProducts(DEFAULT_PRODUCTS);
    return;
  }

  try {
    const raw = await fsp.readFile(PRODUCTS_FILE, 'utf8');
    const products = JSON.parse(raw);
    if (!Array.isArray(products)) return;

    let updated = false;
    const migratedProducts = products.map(product => {
      const defaultProduct = DEFAULT_PRODUCTS_BY_ID.get(String(product.id));
      if (!defaultProduct || product.desc === defaultProduct.desc) return product;
      updated = true;
      return { ...product, desc: defaultProduct.desc };
    });

    if (updated) {
      await writeProducts(migratedProducts);
    }
  } catch (error) {
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

app.patch('/api/products/:id/stock', requireAdmin, async (req, res, next) => {
  try {
    const products = await readProducts();
    const index = products.findIndex(product => String(product.id) === String(req.params.id));
    if (index === -1) {
      return res.status(404).json({ error: 'Produit introuvable.' });
    }

    products[index] = normalizeProduct({
      ...products[index],
      outOfStock: Boolean(req.body.outOfStock)
    });

    await writeProducts(products);
    res.json(products[index]);
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
