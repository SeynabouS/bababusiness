BABA BUSINESS — VERSION RENDER SANS BASE DE DONNÉES
====================================================

Cette version garde l'espace admin, mais elle n'utilise pas de base de données.
Les produits sont enregistrés dans un fichier JSON.
Les photos sont enregistrées dans un dossier uploads.

IMPORTANT POUR RENDER
---------------------
Sur Render, le système de fichiers est temporaire par défaut.
Donc, si vous ajoutez un produit sans disque persistant, il peut disparaître après un redémarrage ou un redéploiement.

Pour garder les produits et les photos :
1. Déployez le projet comme Web Service Node.js.
2. Ajoutez un disque persistant Render.
3. Mettez le chemin du disque sur : /var/data
4. Ajoutez les variables d'environnement :
   - ADMIN_PASSWORD = votre_mot_de_passe_admin
   - ADMIN_SECRET = une_phrase_longue_secrete
   - DATA_DIR = /var/data
   - UPLOAD_DIR = /var/data/uploads

LANCER EN LOCAL
---------------
Dans le dossier du site :

npm install
npm start

Puis ouvrir :
http://localhost:3000

Espace admin :
http://localhost:3000/admin.html

Mot de passe local par défaut :
baba2026

DÉPLOIEMENT SUR RENDER
----------------------
1. Envoyez ce dossier sur GitHub.
2. Sur Render : New + > Web Service.
3. Connectez le dépôt GitHub.
4. Runtime : Node.
5. Build Command : npm install
6. Start Command : npm start
7. Environment Variables :
   ADMIN_PASSWORD = votre_mot_de_passe_admin
   ADMIN_SECRET = une_phrase_longue_secrete
   DATA_DIR = /var/data
   UPLOAD_DIR = /var/data/uploads
8. Dans Advanced, ajoutez un Persistent Disk :
   Mount Path : /var/data
   Size : 1 GB ou plus selon les photos.

FICHIERS IMPORTANTS
-------------------
server.js              Serveur Node/Express
package.json           Dépendances Node
index.html             Boutique client
admin.html             Espace admin
script.js              Catalogue + panier côté client
admin.js               Gestion admin côté navigateur
data/products.json     Catalogue par défaut local
/uploads               Photos produits en production via /var/data/uploads

REMARQUE
--------
Sans base de données, cette solution est simple et suffisante pour une petite boutique.
Pour beaucoup de produits, plusieurs administrateurs, ou beaucoup de trafic, une base de données ou un stockage cloud sera plus robuste.


CATALOGUE PRODUITS DÉJÀ INTÉGRÉ
-------------------------------
Cette version contient déjà 39 produits avec leurs photos dans :
assets/products/

Les prix sont réglés sur 0 FCFA pour afficher « Prix sur demande ».
Vous pouvez modifier les prix, descriptions et photos depuis :
/admin.html

Sur Render, les photos déjà présentes dans assets/products restent dans le projet.
Les nouvelles photos ajoutées depuis l'admin seront enregistrées dans UPLOAD_DIR.
Pour les garder après redémarrage, gardez le disque persistant /var/data.
