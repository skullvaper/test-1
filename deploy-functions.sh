#!/bin/bash
# ============================================
# Jolt Time - Supabase Edge Functions Deploy
# ============================================
# Usage: ./deploy-functions.sh [project-ref]
# ============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================
# Configuration
# ============================================
PROJECT_REF="${1:-${SUPABASE_PROJECT_REF}}"

if [ -z "$PROJECT_REF" ]; then
    echo -e "${RED}Error: Project ref not provided${NC}"
    echo "Usage: ./deploy-functions.sh <project-ref>"
    echo "Or set SUPABASE_PROJECT_REF environment variable"
    exit 1
fi

# List of critical edge functions for production
EDGE_FUNCTIONS=(
    "validate-init-data"
    "telegram-payments"
    "adsgram-reward"
    "claim-ad-reward"
    "claim-offline-income"
    "daily-rewards"
    "expedition-sync"
    "expedition-rewards"
    "game-action"
    "open-chest"
    "perform-prestige"
    "story-quests"
    "track-session"
    "validate-purchase"
    "send-retention-reminders"
)

# ============================================
# Helper Functions
# ============================================
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ============================================
# Pre-deployment Checks
# ============================================
log_info "Starting deployment to project: $PROJECT_REF"

# Check Supabase CLI
if ! command -v supabase &> /dev/null; then
    log_warning "Supabase CLI not found. Installing..."
    npm install -g supabase
fi

# Check authentication
log_info "Checking Supabase authentication..."
if ! supabase projects list &> /dev/null; then
    log_error "Not authenticated with Supabase. Run 'supabase login' first."
    exit 1
fi

# Link to project
log_info "Linking to project..."
supabase link --project-ref "$PROJECT_REF" --password "${SUPABASE_DB_PASSWORD:-}"

# ============================================
# Deploy Edge Functions
# ============================================
echo ""
log_info "Deploying Edge Functions..."
echo ""

DEPLOYED=0
FAILED=0

for func in "${EDGE_FUNCTIONS[@]}"; do
    echo -n "  Deploying $func... "
    
    if supabase functions deploy "$func" --project-ref "$PROJECT_REF" 2>&1; then
        echo -e "${GREEN}✓${NC}"
        ((DEPLOYED++))
    else
        echo -e "${RED}✗${NC}"
        ((FAILED++))
        log_warning "Failed to deploy: $func"
    fi
done

echo ""

# ============================================
# Set Environment Secrets
# ============================================
echo ""
log_info "Setting environment secrets..."

# Telegram Bot Token
if [ -n "$TELEGRAM_BOT_TOKEN" ]; then
    supabase secrets set TELEGRAM_BOT_TOKEN="$TELEGRAM_BOT_TOKEN"
    log_success "Set TELEGRAM_BOT_TOKEN"
else
    log_warning "TELEGRAM_BOT_TOKEN not set - skipping"
fi

# Supabase Service Role Key
if [ -n "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    supabase secrets set SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY"
    log_success "Set SUPABASE_SERVICE_ROLE_KEY"
else
    log_warning "SUPABASE_SERVICE_ROLE_KEY not set - skipping"
fi

# AdsGram Secret
if [ -n "$ADSGRAM_SECRET" ]; then
    supabase secrets set ADSGRAM_SECRET="$ADSGRAM_SECRET"
    log_success "Set ADSGRAM_SECRET"
else
    log_warning "ADSGRAM_SECRET not set - skipping"
fi

# ============================================
# Summary
# ============================================
echo ""
echo "========================================"
echo "         Deployment Summary"
echo "========================================"
echo -e "Functions deployed: ${GREEN}$DEPLOYED${NC}"
echo -e "Functions failed:  ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    log_success "All functions deployed successfully!"
    exit 0
else
    log_error "Some functions failed to deploy. Check logs above."
    exit 1
fi
