#!/usr/bin/env bash
# ==============================================================================
# Script de Déploiement / Mise à jour Automatique sur Plesk (VPS IONOS)
# Médic'Trans 972 / Clinigo
# ==============================================================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}   Médic'Trans 972 - Déploiement sur Plesk (VPS IONOS)${NC}"
echo -e "${BLUE}======================================================${NC}\n"

# 1. Charger les variables d'environnement si un fichier .env existe
if [ -f .env ]; then
    echo -e "${YELLOW}[1/4] Chargement des variables depuis .env...${NC}"
    export $(grep -v '^#' .env | xargs)
elif [ -f .env.local ]; then
    echo -e "${YELLOW}[1/4] Chargement des variables depuis .env.local...${NC}"
    export $(grep -v '^#' .env.local | xargs)
else
    echo -e "${YELLOW}[1/4] Aucun fichier .env trouvé. Utilisation des variables système Plesk.${NC}"
fi

# 2. Installer les dépendances
echo -e "${YELLOW}[2/4] Installation des dépendances npm...${NC}"
npm ci --prefer-offline || npm install

# 3. Compiler le frontend avec Vite & TypeScript
echo -e "${YELLOW}[3/4] Compilation du bundle de production (Vite + TS)...${NC}"
npm run build

# 4. Redémarrage de l'application Node.js si déployé avec Passenger / Plesk Node.js
echo -e "${YELLOW}[4/4] Redémarrage du serveur Node.js (Phusion Passenger)...${NC}"
mkdir -p tmp
touch tmp/restart.txt

echo -e "\n${GREEN}======================================================${NC}"
echo -e "${GREEN}✓ Déploiement terminé avec succès sur votre VPS Plesk !${NC}"
echo -e "${GREEN}======================================================${NC}\n"
