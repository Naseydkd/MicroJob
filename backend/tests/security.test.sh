#!/bin/bash

# Script de test de sécurité
# Usage: ./tests/security.test.sh

API_URL="http://localhost:4000"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔒 Tests de sécurité de l'API"
echo "=============================="
echo ""

# Test 1: Health check (public)
echo "Test 1: Health check (route publique)"
response=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health")
if [ "$response" -eq 200 ]; then
  echo -e "${GREEN}✓${NC} Health check accessible"
else
  echo -e "${RED}✗${NC} Health check échoué (code: $response)"
fi
echo ""

# Test 2: Accès sans token (devrait échouer)
echo "Test 2: Accès à une route protégée sans token"
response=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/users/test123")
if [ "$response" -eq 401 ]; then
  echo -e "${GREEN}✓${NC} Accès refusé sans token (401)"
else
  echo -e "${RED}✗${NC} Route non protégée! (code: $response)"
fi
echo ""

# Test 3: Token invalide
echo "Test 3: Accès avec token invalide"
response=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer invalid_token" "$API_URL/users/test123")
if [ "$response" -eq 403 ]; then
  echo -e "${GREEN}✓${NC} Token invalide rejeté (403)"
else
  echo -e "${RED}✗${NC} Token invalide accepté! (code: $response)"
fi
echo ""

# Test 4: Mot de passe faible
echo "Test 4: Inscription avec mot de passe faible"
response=$(curl -s -X POST "$API_URL/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@test.com",
    "password": "weak",
    "userType": "jeune",
    "nom": "Test",
    "prenom": "User",
    "telephone": "+33612345678",
    "ville": "Paris"
  }')

if echo "$response" | grep -q "mot de passe"; then
  echo -e "${GREEN}✓${NC} Mot de passe faible rejeté"
else
  echo -e "${RED}✗${NC} Mot de passe faible accepté!"
fi
echo ""

# Test 5: Email invalide
echo "Test 5: Inscription avec email invalide"
response=$(curl -s -X POST "$API_URL/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email",
    "password": "StrongPass123",
    "userType": "jeune",
    "nom": "Test",
    "prenom": "User",
    "telephone": "+33612345678",
    "ville": "Paris"
  }')

if echo "$response" | grep -q "invalide"; then
  echo -e "${GREEN}✓${NC} Email invalide rejeté"
else
  echo -e "${RED}✗${NC} Email invalide accepté!"
fi
echo ""

# Test 6: Rate limiting sur login
echo "Test 6: Rate limiting (10 tentatives de connexion)"
echo -e "${YELLOW}Note: Ce test peut prendre quelques secondes${NC}"
failed_count=0
for i in {1..10}; do
  response=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong","userType":"jeune"}')
  
  if [ "$response" -eq 429 ]; then
    failed_count=$((failed_count + 1))
  fi
done

if [ "$failed_count" -gt 0 ]; then
  echo -e "${GREEN}✓${NC} Rate limiting actif (bloqué après plusieurs tentatives)"
else
  echo -e "${YELLOW}⚠${NC} Rate limiting non détecté (peut nécessiter plus de tentatives)"
fi
echo ""

# Test 7: CORS headers
echo "Test 7: Headers de sécurité (CORS, Helmet)"
headers=$(curl -s -I "$API_URL/health")

if echo "$headers" | grep -q "Access-Control-Allow-Origin"; then
  echo -e "${GREEN}✓${NC} CORS configuré"
else
  echo -e "${YELLOW}⚠${NC} CORS non détecté"
fi

if echo "$headers" | grep -q "X-Content-Type-Options"; then
  echo -e "${GREEN}✓${NC} Helmet headers présents"
else
  echo -e "${YELLOW}⚠${NC} Helmet headers non détectés"
fi
echo ""

# Test 8: Missions publiques accessibles
echo "Test 8: Routes publiques accessibles"
response=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/missions")
if [ "$response" -eq 200 ]; then
  echo -e "${GREEN}✓${NC} Liste des missions accessible publiquement"
else
  echo -e "${RED}✗${NC} Liste des missions inaccessible (code: $response)"
fi
echo ""

echo "=============================="
echo "Tests terminés!"
echo ""
echo -e "${YELLOW}Note:${NC} Pour des tests complets, utilisez un outil comme:"
echo "  - OWASP ZAP"
echo "  - Burp Suite"
echo "  - npm audit"
