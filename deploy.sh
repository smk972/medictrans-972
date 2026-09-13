#!/usr/bin/env bash
# ==============================================================================
# Script de Déploiement Médic'Trans Martinique 972
# Déploie sur : GitHub, Supabase & Cloudflare Pages
# ==============================================================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}   Médic'Trans 972 - Déploiement Multi-Plateforme     ${NC}"
echo -e "${BLUE}======================================================${NC}\n"

# Charger les variables locales si existantes
if [ -f .env.local ]; then
    export $(grep -v '^#' .env.local | xargs)
fi

# 1. BUILD DU SITE
echo -e "${YELLOW}[1/3] Construction du bundle de production (Vite + TypeScript)...${NC}"
npm run build
echo -e "${GREEN}✓ Build réussi dans le dossier dist/${NC}\n"

# 2. PUSH GITHUB
echo -e "${YELLOW}[2/3] Déploiement sur GitHub (smk972/medictrans-972)...${NC}"
if git push origin main; then
    echo -e "${GREEN}✓ Code source et historique poussés avec succès sur GitHub !${NC}\n"
else
    echo -e "${RED}⚠️ La poussée Git automatique a échoué en raison des identifiants non saisis.${NC}"
    echo -e "${YELLOW}Veuillez exécuter : git push -u origin main${NC}\n"
fi

# 3. DEPLOIEMENT CLOUDFLARE PAGES
echo -e "${YELLOW}[3/3] Déploiement sur Cloudflare Pages...${NC}"
echo -e "Déploiement du projet 'medictrans-972'..."
if npx wrangler pages deploy dist --project-name=medictrans-972 --commit-dirty=true; then
    echo -e "${GREEN}✓ Site déployé avec succès sur Cloudflare Pages !${NC}\n"
else
    echo -e "${YELLOW}Si vous n'êtes pas encore connecté à Cloudflare dans votre terminal :${NC}"
    echo -e "1. Exécutez : ${GREEN}npx wrangler login${NC}"
    echo -e "2. Puis relancez : ${GREEN}./deploy.sh${NC}\n"
fi

echo -e "${BLUE}======================================================${NC}"
echo -e "${GREEN}   RAPPEL SUPABASE :${NC}"
echo -e "Pour initialiser votre base de données Supabase :"
echo -e "1. Rendez-vous sur https://supabase.com"
echo -e "2. Ouvrez le 'SQL Editor' de votre projet"
echo -e "3. Copiez-collez et exécutez le fichier : supabase/schema.sql"
echo -e "4. Renseignez vos clés dans .env.local"
echo -e "${BLUE}======================================================${NC}\n"
