#!/bin/bash
#
# Model Download Script with Progress Bars
# Downloads recommended models to /media/chrishallberg/Storage 11/AI_models
#
# Usage: ./download_models.sh [tier]
#   tier: free, pro, or all (default: free)

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
AI_MODELS_DIR="/media/chrishallberg/Storage 11/AI_models"
OLLAMA_MODELS_DIR="$HOME/.ollama/models"  # Default Ollama location
TIER=${1:-free}

# Progress bar function
show_progress() {
    local current=$1
    local total=$2
    local model=$3
    local percent=$((current * 100 / total))
    local filled=$((percent / 2))
    local empty=$((50 - filled))
    
    printf "\r${BLUE}[${NC}"
    printf "%${filled}s" | tr ' ' '='
    printf "%${empty}s" | tr ' ' ' '
    printf "${BLUE}]${NC} ${GREEN}%3d%%${NC} - ${YELLOW}%s${NC}" "$percent" "$model"
}

# Check if Ollama is installed
check_ollama() {
    echo -e "${BLUE}=== Checking Ollama Installation ===${NC}"
    if ! command -v ollama &> /dev/null; then
        echo -e "${RED}❌ Ollama is not installed${NC}"
        echo -e "${YELLOW}Installing Ollama...${NC}"
        curl -fsSL https://ollama.com/install.sh | sh
    else
        echo -e "${GREEN}✅ Ollama is installed${NC}"
        ollama --version
    fi
    echo ""
}

# Download model with progress
download_model() {
    local model=$1
    local model_name=$(echo $model | cut -d':' -f1)
    local model_size=$(echo $model | cut -d':' -f2)
    
    echo -e "${BLUE}📥 Downloading: ${YELLOW}$model${NC}"
    
    # Ollama pull with progress
    ollama pull "$model" 2>&1 | while IFS= read -r line; do
        if [[ $line == *"pulling"* ]]; then
            echo -e "${BLUE}   → $line${NC}"
        elif [[ $line == *"downloading"* ]]; then
            echo -e "${BLUE}   → $line${NC}"
        elif [[ $line == *"success"* ]] || [[ $line == *"complete"* ]]; then
            echo -e "${GREEN}   ✅ $line${NC}"
        else
            echo -e "   $line"
        fi
    done
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Successfully downloaded: $model${NC}"
        return 0
    else
        echo -e "${RED}❌ Failed to download: $model${NC}"
        return 1
    fi
}

# Free Tier Models
FREE_TIER_MODELS=(
    "deepseek-r1:7b"
    "qwen2.5:7b"
    "mistral:7b"
    "llama3.2:3b"
    "gemma2:7b"
    "codellama:7b"
    "phi3:3.8b"
    "tinyllama:1.1b"
    "starcoder:7b"
    "neural-chat:7b"
    "llava:7b"
)

# Pro Tier Additional Models
PRO_TIER_MODELS=(
    "qwen2.5:32b"
    "mistral-large"
    "llama3.2:70b"
    "gemma2:27b"
    "deepseek-r1:32b"
)

# Main download function
main() {
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║     Dev Forge Model Downloader with Progress Bars      ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    check_ollama
    
    # Determine which models to download
    if [ "$TIER" == "free" ]; then
        MODELS=("${FREE_TIER_MODELS[@]}")
        echo -e "${BLUE}📦 Downloading FREE TIER models (11 models, ~37 GB)${NC}"
    elif [ "$TIER" == "pro" ]; then
        MODELS=("${FREE_TIER_MODELS[@]}" "${PRO_TIER_MODELS[@]}")
        echo -e "${BLUE}📦 Downloading PRO TIER models (16 models, ~100 GB)${NC}"
    elif [ "$TIER" == "all" ]; then
        MODELS=("${FREE_TIER_MODELS[@]}" "${PRO_TIER_MODELS[@]}")
        echo -e "${BLUE}📦 Downloading ALL models (16 models, ~146 GB)${NC}"
    else
        echo -e "${RED}❌ Invalid tier: $TIER${NC}"
        echo -e "${YELLOW}Usage: $0 [free|pro|all]${NC}"
        exit 1
    fi
    
    echo ""
    echo -e "${YELLOW}Target Directory: ${NC}$AI_MODELS_DIR"
    echo -e "${YELLOW}Ollama Models: ${NC}$OLLAMA_MODELS_DIR"
    echo ""
    
    # Create AI_models directory if it doesn't exist
    mkdir -p "$AI_MODELS_DIR"
    
    # Download models
    total=${#MODELS[@]}
    current=0
    successful=0
    failed=0
    
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}Starting download of $total models...${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo ""
    
    for model in "${MODELS[@]}"; do
        current=$((current + 1))
        show_progress $current $total "$model"
        echo ""
        
        if download_model "$model"; then
            successful=$((successful + 1))
        else
            failed=$((failed + 1))
        fi
        
        echo ""
    done
    
    # Summary
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}✅ Download Complete!${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}Successful: $successful${NC}"
    if [ $failed -gt 0 ]; then
        echo -e "${RED}Failed: $failed${NC}"
    fi
    echo -e "${BLUE}Total: $total${NC}"
    echo ""
    
    # Show disk usage
    echo -e "${YELLOW}Disk Usage:${NC}"
    du -sh "$OLLAMA_MODELS_DIR" 2>/dev/null || echo "Ollama models directory not found"
    echo ""
    
    echo -e "${GREEN}✅ All models downloaded!${NC}"
}

# Run main function
main

