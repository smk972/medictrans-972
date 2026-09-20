# Médic'Trans Martinique (Transport Médical 972)

Plateforme de régulation et réservation de transport sanitaire (Ambulances, VSL et Taxis Conventionnés) couvrant l'intégralité des **34 communes de la Martinique**.

Conçue pour les **patients**, les **établissements de soins** (CHU Pierre Zobda-Quitman, Clinique Sainte-Marie, Hôpital de Trinité, centres de dialyse...) et les **entreprises de transport sanitaire agréées ARS / conventionnées CPAM**.

---

## 🚀 Architecture & Stack Technique

- **Frontend** : [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vite.dev/)
- **Design System** : [Tailwind CSS v4](https://tailwindcss.com/) avec tokens fidèles au design system Stitch *TransMed 972* (Bleu Médical `#004479` / `#0b5c9e`, Sarcelle Caraïbe `#006a61` / `#86f2e4`, typographie *Plus Jakarta Sans*, icônes *Material Symbols Outlined* et *Lucide Icons*)
- **Routing** : React Router v6
- **Base de données & Auth** : [Supabase](https://supabase.com/) (`@supabase/supabase-js`) + Moteur de repli automatique en LocalStorage pour un fonctionnement autonome immédiat
- **Hébergement & Edge** : [Cloudflare Pages](https://pages.cloudflare.com/) (`wrangler.toml`, `public/_redirects`)
- **CI/CD** : GitHub Actions (`.github/workflows/deploy.yml`)

---

## 📱 Écrans & Parcours Implémentés

| Route | Page | Description |
| :--- | :--- | :--- |
| `/` | **Accueil & Réservation Express** | Présentation du réseau 972, simulateur de réservation rapide, sélection des 3 modes, réassurance tiers-payant CPAM 100%, maillage des 34 communes. |
| `/reserver` | **Réservation - Détails Médicaux** | Formulaire étape 2 complet : NIR (Sécu), ordonnance PMT (volet Cerfa S3138), mobilité (fauteuil, brancard, oxygène, portage escaliers). |
| `/confirmation/:ref` | **Confirmation de Réservation** | Bon d'admission avec QR Code, référence unique (ex: `MT-972-8821`), véhicule et chauffeur assignés, impression du récapitulatif. |
| `/suivi` | **Mes Demandes & Suivi Direct** | Carte interactive de la Martinique avec localisation GPS simulée en direct, ETA du chauffeur, chronologie des étapes et historique des courses. |
| `/droits-cpam` | **Guide & Droits CPAM France** | Guide officiel Sécurité Sociale / Assurance Maladie, simulateur de remboursement interactif, ALD 30, accords préalables (> 150 km, dialyses, séries). |
| `/etablissements` | **Portail Établissements & Sorties** | Console soignants (CHU Zobda-Quitman...) : demande de sortie de lit express, départs par service (Néphrologie, Oncologie...), suivi des flottes. |
| `/transporteurs` | **Espace Transporteurs (Dispatch)** | Console ambulanciers & taxis : opportunités de courses en attente, acceptation en 1 clic, suivi des missions actives et mise à jour de statut. |
| `/inscription/transporteur` | **Onboarding Transporteurs** | Formulaire d'adhésion pour sociétés de transport avec agrément ARS 972 et convention CPAM. |
| `/inscription/etablissement` | **Onboarding Établissements** | Inscription pour structures de soins (hôpitaux, cliniques, dialyses, EHPAD) avec numéro FINESS. |

---

## 🛠️ Démarrage Local

1. **Installer les dépendances** :
   ```bash
   npm install
   ```

2. **Lancer le serveur de développement** :
   ```bash
   npm run dev
   ```
   L'application sera accessible sur `http://localhost:3000`.

3. **Vérification TypeScript & Build de production** :
   ```bash
   npx tsc --noEmit
   npm run build
   ```

---

## 🗄️ Configuration Supabase

L'application fonctionne immédiatement en mode démo grâce à son stockage local interactif.

Pour brancher votre propre projet Supabase :
1. Créez un projet sur [supabase.com](https://supabase.com).
2. Ouvrez le **SQL Editor** de Supabase et exécutez le script [supabase/schema.sql](file:///Users/dimitrikanor/Documents/TEST%20SITE/supabase/schema.sql).
3. Créez un fichier `.env.local` à la racine :
   ```env
   VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```
4. Redémarrez l'application. Les données se synchroniseront automatiquement avec PostgreSQL.

---

## ☁️ Déploiement sur Cloudflare Pages

### Option 1 : Déploiement Direct via Wrangler
```bash
npx wrangler pages deploy dist --project-name=medictrans-972
```

### Option 2 : Déploiement Continu via GitHub
1. Poussez le projet sur votre dépôt GitHub.
2. Liez le dépôt sur le tableau de bord Cloudflare Pages :
   - **Framework preset** : `Vite`
   - **Build command** : `npm run build`
   - **Build output directory** : `dist`
3. Ajoutez les variables d'environnement `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` dans les paramètres Cloudflare Pages si vous utilisez Supabase.
