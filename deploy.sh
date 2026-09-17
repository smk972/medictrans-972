#!/usr/bin/env bash
# ==============================================================================
# Script de Déploiement Clinigo / Médic'Trans
# Déploiement vers GitHub (Synchronisation directe avec VPS IONOS / Plesk)
# ==============================================================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}   Clinigo - Déploiement GitHub & Serveur IONOS       ${NC}"
echo -e "${BLUE}======================================================${NC}\n"

# Charger les variables locales si existantes
if [ -f .env.local ]; then
    set -a
    source .env.local
    set +a
fi

# 1. COMPILATION DE PRODUCTION
echo -e "${YELLOW}[1/2] Construction du bundle de production (Vite + TypeScript)...${NC}"
npm run build
echo -e "${GREEN}✓ Build réussi dans le dossier dist/${NC}\n"

# 2. PUSH GITHUB
echo -e "${YELLOW}[2/2] Synchronisation vers GitHub (origin main)...${NC}"
git add .
if git commit -m "deploy: mise a jour automatique pour serveur ionos"; then
    echo -e "${GREEN}✓ Commit créé.${NC}"
else
    echo -e "${BLUE}ℹ️ Aucun changement supplémentaire à commiter.${NC}"
fi

if git push origin main; then
    echo -e "${GREEN}✓ Code source poussé avec succès sur GitHub (origin main) !${NC}\n"
else
    echo -e "${RED}⚠️ La poussée Git automatique a échoué. Veuillez vérifier votre connexion.${NC}"
    exit 1
fi

echo -e "${BLUE}======================================================${NC}"
echo -e "${GREEN}✓ DÉPLOIEMENT GITHUB EFFECTUÉ AVEC SUCCÈS !${NC}"
echo -e "Votre serveur IONOS (Plesk Git) récupère automatiquement la branche main."
echo -e "Rappel : Pour redémarrer l'application Node.js sur Plesk si nécessaire :"
echo -e "  touch tmp/restart.txt"
echo -e "${BLUE}======================================================${NC}\n"
