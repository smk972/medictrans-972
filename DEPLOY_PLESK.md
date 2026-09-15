# Guide de Déploiement Médic'Trans 972 sur VPS IONOS (Plesk)

Ce guide détaille la procédure complète pour migrer l'hébergement web de **Cloudflare Pages** vers votre **VPS IONOS sous Plesk**, tout en **conservant Supabase** à l'identique comme backend et base de données.

---

## 1. Vue d'Ensemble de l'Architecture

| Composant | Avant (Cloudflare Pages) | Après (VPS IONOS avec Plesk) | Impact sur vos Données |
| :--- | :--- | :--- | :--- |
| **Hébergement Frontend** | Cloudflare Pages CDN | VPS IONOS (Nginx + Apache ou Node.js) | Aucun (fichiers statiques `dist/`) |
| **Base de Données & Auth** | Supabase Cloud | **Supabase Cloud (Inchangé)** | **0 modification**, 100% persistant |
| **API Assistant IA Eva** | Cloudflare Pages Function | `server.js` Node.js sur Plesk | Même logique, autonome & Gemini |
| **Certificat SSL / HTTPS** | Cloudflare Universal SSL | Let's Encrypt gratuit via Plesk | Certificat officiel TLS 1.3 |
| **Déploiement Git** | Cloudflare Wrangler / GitHub Action | Extension Git native de Plesk | Déploiement automatique au `push` |

> [!IMPORTANT]
> **Vos données Supabase ne sont ni déplacées ni modifiées.** Le frontend sur Plesk se connecte directement à votre projet Supabase via l'URL et la clé anonyme de production (`@supabase/supabase-js`).

---

## 2. Les Deux Modes de Déploiement sur Plesk

Vous avez le choix entre deux modes selon vos préférences :

### Option A — Déploiement Node.js complet (Recommandé ⭐)
- **Avantages** : L'assistant IA Eva (`/api/ai/chat`) fonctionne sur votre serveur, le routage SPA est géré automatiquement, et un endpoint `/health` est disponible.
- **Fonctionnement** : Plesk utilise son extension Node.js (Phusion Passenger) pour exécuter `server.js` qui sert `dist/` et l'API IA.

### Option B — Déploiement Statique Pur (Nginx / Apache)
- **Avantages** : Ultra-léger, aucune ressource Node.js résidente en mémoire.
- **Fonctionnement** : Plesk sert directement le dossier `dist/`. Le fichier `.htaccess` (automatiquement copié dans `dist/`) gère le routage React Router pour éviter les erreurs 404.

---

## 3. Procédure de Déploiement Pas-à-Pas

### Étape 1 : Créer le Domaine ou Sous-Domaine dans Plesk
1. Connectez-vous à votre panneau **Plesk IONOS** (`https://votre-ip-vps:8443`).
2. Allez dans **Sites Web & Domaines** > **Ajouter un domaine** (ou **Ajouter un sous-domaine**, ex: `app.medictrans972.com` ou votre nom de domaine principal).
3. Type d'hébergement : **Hébergement de sites web**.
4. Racine du document (*Document Root*) :
   - Pour **Option A (Node.js)** : `/httpdocs` (ou `/votre-domaine`)
   - Pour **Option B (Statique)** : `/httpdocs/dist`

---

### Étape 2 : Configurer le Déploiement Git dans Plesk
1. Sur la fiche de votre domaine dans Plesk, cliquez sur **Git**.
2. Cliquez sur **Ajouter un dépôt Git**.
3. Sélectionnez **Dépôt distant (GitHub)** :
   - URL du dépôt : `https://github.com/smk972/medictrans-972.git`
   - Branche : `main`
4. Mode de déploiement : **Déploiement automatique** (ou manuel si vous préférez contrôler chaque mise à jour).
5. Dans **Actions de déploiement supplémentaires** (commandes shell post-déploiement), ajoutez :
   ```bash
   npm ci
   npm run build
   ```
6. Plesk clone le dépôt et exécute automatiquement la compilation Vite.

---

### Étape 3 : Configurer les Variables d'Environnement
Dans la racine de votre site sur le serveur (`/var/www/vhosts/votre-domaine/httpdocs`), créez ou configurez le fichier `.env` :

```env
# Configuration Supabase (identique à celle de Cloudflare)
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsIn...

# Configuration Google Maps (si utilisée)
VITE_GOOGLE_MAPS_API_KEY=AIzaSy...

# Clé API Google Gemini (pour l'assistant virtuel Eva)
GEMINI_API_KEY=AIzaSy...

# Configuration du serveur
NODE_ENV=production
PORT=3000
```

> [!TIP]
> Dans Plesk, si vous utilisez l'**Option A (Node.js)**, vous pouvez aussi renseigner ces variables directement dans l'interface graphique : **Node.js** > **Variables d'environnement**.

---

### Étape 4 : Activer Node.js (Si Option A choisie)
1. Cliquez sur l'icône **Node.js** dans la page de votre domaine.
2. Activez Node.js :
   - **Version de Node.js** : Sélectionnez **20.x** ou **22.x**.
   - **Mode d'application** : `production`.
   - **Fichier de démarrage de l'application** : `server.js`.
   - **Racine du document** : `dist`.
   - **Racine de l'application** : `/` (la racine où se trouve `package.json`).
3. Cliquez sur **Installer npm** ou **Exécuter le script build** si nécessaire.
4. Cliquez sur **Redémarrer l'application**.

---

### Étape 5 : Routage SPA Nginx (Si Option B choisie)
Si vous optez pour le mode statique pur sans Node.js et que Nginx traite les fichiers statiques :
1. Allez dans **Paramètres d'Apache et Nginx**.
2. Décochez *Mode proxy* ou descendez à la section **Directives Nginx supplémentaires**.
3. Ajoutez cette directive pour que toutes les pages React (`/suivi`, `/transporteurs`, `/connexion`, etc.) fonctionnent au rechargement :
   ```nginx
   location / {
       try_files $uri $uri/ /index.html;
   }
   ```
*(Note : Si Apache est actif avec le proxy standard de Plesk, le fichier `public/.htaccess` inclus dans ce projet gère déjà cette redirection automatiquement sans configuration Nginx).*

---

### Étape 6 : Sécuriser avec SSL Let's Encrypt
1. Dans Plesk, cliquez sur **Certificats SSL/TLS**.
2. Cliquez sur **Installer un certificat Let's Encrypt gratuit**.
3. Cochez :
   - *Protéger le nom de domaine*
   - *Protéger "www" et les alias*
   - *Rediriger automatiquement tout le trafic HTTP vers HTTPS*
4. Cliquez sur **Obtenir gratuitement**. Le cadenas vert est immédiatement activé.

---

### Étape 7 : Pointer votre Domaine IONOS vers le VPS
Quand vous êtes prêt à basculer le trafic :
1. Rendez-vous dans votre espace client **IONOS** > **Domaines & SSL** > **DNS**.
2. Modifiez l'enregistrement **A** de votre domaine pour qu'il pointe vers l'**adresse IP publique de votre VPS**.
3. (Facultatif) Si vous avez une adresse IPv6, mettez à jour l'enregistrement **AAAA**.
4. La propagation DNS chez IONOS prend généralement entre 5 et 15 minutes.

---

## 4. Rollback & Sécurité Cloudflare

- **Votre projet Cloudflare Pages reste 100% intact**. Tant que vous ne supprimez pas le projet sur Cloudflare, il reste accessible sur son URL `*.pages.dev`.
- Si vous souhaitez revenir en arrière à tout moment, il vous suffit de repasser les enregistrements DNS vers Cloudflare.
- Vos données Supabase restent partagées et valides quel que soit l'hébergeur.
