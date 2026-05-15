BABA BUSINESS — SITE AVEC ESPACE ADMIN SANS BDD
===============================================

Le site contient maintenant :
- une boutique client ;
- un panier WhatsApp ;
- un espace admin ;
- ajout, modification et suppression de produits ;
- upload de photos produits ;
- sauvegarde dans un fichier JSON, sans base de données.

LANCER EN LOCAL
---------------
Ouvrir un terminal dans le dossier du projet, puis exécuter :

npm install
npm start

Ensuite ouvrir :
http://localhost:3000

Espace admin :
http://localhost:3000/admin.html

Mot de passe par défaut :
baba2026

CHANGER LE MOT DE PASSE
-----------------------
En local, vous pouvez créer un fichier .env ou modifier directement la variable d'environnement.
Sur Render, ajoutez :
ADMIN_PASSWORD = votre_mot_de_passe
ADMIN_SECRET = une_phrase_longue_secrete

DÉPLOYER SUR RENDER
-------------------
Cette version doit être déployée comme Web Service Node.js, pas comme Static Site.

Paramètres Render :
Build Command : npm install
Start Command : npm start

Variables d'environnement conseillées :
ADMIN_PASSWORD = votre_mot_de_passe_admin
ADMIN_SECRET = une_phrase_longue_secrete
DATA_DIR = /var/data
UPLOAD_DIR = /var/data/uploads

Pour conserver les produits et les photos après redémarrage ou redéploiement, ajoutez un disque persistant Render :
Mount Path : /var/data
Taille : 1 GB minimum recommandé

Si vous ne mettez pas de disque persistant, Render peut supprimer les fichiers ajoutés lors d'un redémarrage ou d'un nouveau déploiement.
