# 💾 Model File Sizes - Storage Requirements

**Date:** January 10, 2025  
**Status:** ✅ **RESEARCH COMPLETE**  
**Hashtag:** `#dev-forge`, `#model-sizes`, `#storage`, `#requirements`

---

## 🎯 RESEARCH OBJECTIVE

**Determine file sizes for all recommended models:**
- ✅ LLM models (Ollama, Hugging Face)
- ✅ Embedding models (Sentence Transformers, CodeBERT)
- ✅ Vector databases (storage requirements)
- ✅ Total storage needed

---

## 📊 FILE SIZE FORMULA

**General Formula:**
- **FP16 (Half Precision):** Parameters × 2 bytes = Size in GB
- **INT4 (Quantized):** Parameters × 0.5 bytes ≈ Size in GB (1/4 of FP16)
- **INT8 (Quantized):** Parameters × 1 byte ≈ Size in GB (1/2 of FP16)

**Example:**
- 7B parameters in FP16 = 7 × 2 = 14 GB
- 7B parameters in INT4 = 7 × 0.5 = 3.5 GB

---

## 🤖 LLM MODELS - FILE SIZES

### **Recommended Models for Free Tier (11 models):**

#### **1. DeepSeek-R1:32b**
- **Parameters:** 32B
- **FP16 Size:** ~64 GB
- **INT4 Quantized:** ~16 GB
- **Ollama Size:** ~16-20 GB (quantized)
- **Status:** ⚠️ Large, but powerful

#### **2. Qwen2.5:7b**
- **Parameters:** 7B
- **FP16 Size:** ~14 GB
- **INT4 Quantized:** ~3.5 GB
- **Ollama Size:** ~4-5 GB (quantized)
- **Status:** ✅ Reasonable size

#### **3. Mistral:7b**
- **Parameters:** 7B
- **FP16 Size:** ~14 GB
- **INT4 Quantized:** ~4.1 GB
- **Ollama Size:** ~4-5 GB (quantized)
- **Status:** ✅ Reasonable size

#### **4. Llama3.2:3b**
- **Parameters:** 3B
- **FP16 Size:** ~6 GB
- **INT4 Quantized:** ~2.0 GB
- **Ollama Size:** ~2-3 GB (quantized)
- **Status:** ✅ Small, efficient

#### **5. Gemma2:7b**
- **Parameters:** 7B
- **FP16 Size:** ~14 GB
- **INT4 Quantized:** ~3.3 GB
- **Ollama Size:** ~4-5 GB (quantized)
- **Status:** ✅ Reasonable size

#### **6. CodeLlama:7b**
- **Parameters:** 7B
- **FP16 Size:** ~14 GB
- **INT4 Quantized:** ~4 GB
- **Ollama Size:** ~4-5 GB (quantized)
- **Status:** ✅ Reasonable size

#### **7. Phi3:3.8b**
- **Parameters:** 3.8B
- **FP16 Size:** ~7.6 GB
- **INT4 Quantized:** ~2.5 GB
- **Ollama Size:** ~2.5-3 GB (quantized)
- **Status:** ✅ Small, efficient

#### **8. TinyLlama:1.1b**
- **Parameters:** 1.1B
- **FP16 Size:** ~2.2 GB
- **INT4 Quantized:** ~0.6 GB
- **Ollama Size:** ~0.6-1 GB (quantized)
- **Status:** ✅ Very small

#### **9. StarCoder:7b**
- **Parameters:** 7B
- **FP16 Size:** ~14 GB
- **INT4 Quantized:** ~4 GB
- **Ollama Size:** ~4-5 GB (quantized)
- **Status:** ✅ Reasonable size

#### **10. Neural-Chat:7b**
- **Parameters:** 7B
- **FP16 Size:** ~14 GB
- **INT4 Quantized:** ~4 GB
- **Ollama Size:** ~4-5 GB (quantized)
- **Status:** ✅ Reasonable size

#### **11. Llava:7b** (Multimodal)
- **Parameters:** 7B
- **FP16 Size:** ~14 GB
- **INT4 Quantized:** ~4 GB
- **Ollama Size:** ~4-5 GB (quantized)
- **Status:** ✅ Reasonable size

---

### **Free Tier Total (11 models, quantized):**
- **DeepSeek-R1:32b:** ~16 GB
- **Qwen2.5:7b:** ~4 GB
- **Mistral:7b:** ~4 GB
- **Llama3.2:3b:** ~2 GB
- **Gemma2:7b:** ~4 GB
- **CodeLlama:7b:** ~4 GB
- **Phi3:3.8b:** ~2.5 GB
- **TinyLlama:1.1b:** ~0.6 GB
- **StarCoder:7b:** ~4 GB
- **Neural-Chat:7b:** ~4 GB
- **Llava:7b:** ~4 GB

**Total: ~49.1 GB** (quantized)

**Note:** DeepSeek-R1:32b is very large. Consider replacing with smaller variant:
- **DeepSeek-R1:7b:** ~4 GB (quantized)
- **New Total: ~37.1 GB** (more reasonable)

---

### **Additional Models for Pro Tier:**

#### **12. OpenAI GPT-OSS-20b**
- **Parameters:** 20B
- **FP16 Size:** ~40 GB
- **INT4 Quantized:** ~10 GB
- **Ollama Size:** ~10-12 GB (if available)
- **Status:** ⚠️ Large

#### **13. Qwen2.5:32b**
- **Parameters:** 32B
- **FP16 Size:** ~64 GB
- **INT4 Quantized:** ~16 GB
- **Ollama Size:** ~16-20 GB (quantized)
- **Status:** ⚠️ Large

#### **14. Mistral-Large**
- **Parameters:** 24B
- **FP16 Size:** ~48 GB
- **INT4 Quantized:** ~13.6 GB
- **Ollama Size:** ~14-16 GB (quantized)
- **Status:** ⚠️ Large

#### **15. Llama3.2:70b**
- **Parameters:** 70B
- **FP16 Size:** ~140 GB
- **INT4 Quantized:** ~35 GB
- **Ollama Size:** ~35-40 GB (quantized)
- **Status:** ⚠️ Very large

#### **16. Gemma2:27b**
- **Parameters:** 27B
- **FP16 Size:** ~54 GB
- **INT4 Quantized:** ~13.5 GB
- **Ollama Size:** ~14-16 GB (quantized)
- **Status:** ⚠️ Large

---

### **Pro Tier Total (Free Tier + Additional):**
- **Free Tier:** ~37.1 GB (with DeepSeek-R1:7b)
- **GPT-OSS-20b:** ~10 GB
- **Qwen2.5:32b:** ~16 GB
- **Mistral-Large:** ~14 GB
- **Llama3.2:70b:** ~35 GB
- **Gemma2:27b:** ~14 GB

**Total: ~126.1 GB** (quantized, all models)

**Recommended Pro Tier (selective):**
- Free Tier models: ~37.1 GB
- Add 3-5 large models: ~50-60 GB
- **Total: ~87-97 GB** (more reasonable)

---

## 🧠 EMBEDDING MODELS - FILE SIZES

### **1. Sentence Transformers Models:**

#### **all-MiniLM-L6-v2**
- **Parameters:** 22.7M
- **Size:** ~90 MB
- **Status:** ✅ Very small

#### **all-mpnet-base-v2**
- **Parameters:** 110M
- **Size:** ~420 MB
- **Status:** ✅ Small

#### **multi-qa-MiniLM-L6-cos-v1**
- **Parameters:** 22.7M
- **Size:** ~90 MB
- **Status:** ✅ Very small

#### **paraphrase-MiniLM-L6-v2**
- **Parameters:** 22.7M
- **Size:** ~90 MB
- **Status:** ✅ Very small

---

### **2. CodeBERT Models:**

#### **codebert-base**
- **Parameters:** 125M
- **Size:** ~500 MB
- **Status:** ✅ Small

#### **graphcodebert-base**
- **Parameters:** 125M
- **Size:** ~500 MB
- **Status:** ✅ Small

---

### **3. Nomic Embed:**

#### **nomic-embed-text-v1.5**
- **Parameters:** 137M
- **Size:** ~550 MB
- **Status:** ✅ Small

---

### **4. BGE Models:**

#### **bge-base-en-v1.5**
- **Parameters:** 110M
- **Size:** ~420 MB
- **Status:** ✅ Small

#### **bge-large-en-v1.5**
- **Parameters:** 335M
- **Size:** ~1.3 GB
- **Status:** ✅ Reasonable

---

### **Embedding Models Total:**
- **Sentence Transformers (4 models):** ~690 MB
- **CodeBERT (2 models):** ~1 GB
- **Nomic Embed:** ~550 MB
- **BGE (2 models):** ~1.7 GB

**Total: ~3.9 GB** (all embedding models)

**Recommended Set:**
- CodeBERT: ~500 MB
- Nomic Embed: ~550 MB
- Sentence Transformers (2 best): ~180 MB
- **Total: ~1.2 GB** (essential embeddings)

---

## 🗄️ VECTOR DATABASES - STORAGE

### **1. ChromaDB:**
- **Base Installation:** ~50-100 MB
- **Per 1M Vectors:** ~100-200 MB (depends on dimensions)
- **Typical Usage:** 1-5 GB for moderate use
- **Status:** ✅ Lightweight

### **2. Milvus:**
- **Base Installation:** ~500 MB - 1 GB
- **Per 1M Vectors:** ~200-400 MB
- **Typical Usage:** 5-20 GB for moderate use
- **Status:** ⚠️ Larger, but scalable

### **3. FAISS:**
- **Base Installation:** ~100-200 MB
- **Per 1M Vectors:** ~100-300 MB
- **Typical Usage:** 1-10 GB for moderate use
- **Status:** ✅ Efficient

### **4. Qdrant:**
- **Base Installation:** ~200-500 MB
- **Per 1M Vectors:** ~150-300 MB
- **Typical Usage:** 2-10 GB for moderate use
- **Status:** ✅ Reasonable

---

### **Vector Database Total:**
- **ChromaDB (recommended):** ~1-5 GB (typical usage)
- **FAISS (optional):** ~1-10 GB (if used)
- **Total: ~2-15 GB** (depending on usage)

**Recommended:** ChromaDB only = ~1-5 GB

---

## 📊 TOTAL STORAGE REQUIREMENTS

### **Free Tier:**
- **LLM Models (11, quantized):** ~37.1 GB
- **Embedding Models (essential):** ~1.2 GB
- **Vector Database (ChromaDB):** ~1-5 GB
- **Ollama Base:** ~100-200 MB
- **Other Dependencies:** ~500 MB

**Total: ~40-44 GB**

---

### **Pro Tier (Selective):**
- **Free Tier:** ~40-44 GB
- **Additional LLM Models (3-5):** ~50-60 GB
- **Additional Embedding Models:** ~2.7 GB
- **Additional Vector DBs (optional):** ~5-10 GB

**Total: ~98-116 GB**

---

### **Pro Tier (All Models):**
- **All LLM Models:** ~126.1 GB
- **All Embedding Models:** ~3.9 GB
- **All Vector DBs:** ~15 GB
- **Dependencies:** ~1 GB

**Total: ~146 GB**

---

## 💡 STORAGE OPTIMIZATION STRATEGIES

### **1. Use Quantized Models:**
- **INT4 quantization:** Reduces size by 75%
- **Example:** 14 GB → 3.5 GB
- **Trade-off:** Slight accuracy loss (usually <5%)

### **2. Selective Model Download:**
- **Free Tier:** Only essential models (~40 GB)
- **Pro Tier:** Download on-demand
- **Enterprise:** All models available

### **3. Model Caching:**
- **Download once, use many times**
- **Share models across users (if applicable)**
- **Cache frequently used models**

### **4. Compression:**
- **Ollama uses compression**
- **Models are compressed during download**
- **Decompressed at runtime**

### **5. External Storage:**
- **Store models on external drive**
- **Symlink to Ollama directory**
- **Network storage for teams**

---

## 🎯 RECOMMENDED STORAGE PLAN

### **Minimum (Free Tier):**
- **Storage Required:** ~50 GB
- **Models:** 11 essential models
- **Embeddings:** CodeBERT + Nomic Embed
- **Vector DB:** ChromaDB

### **Recommended (Pro Tier):**
- **Storage Required:** ~100-150 GB
- **Models:** 15-20 models (selective)
- **Embeddings:** Full set
- **Vector DBs:** ChromaDB + FAISS (optional)

### **Maximum (Enterprise Tier):**
- **Storage Required:** ~200-500 GB
- **Models:** All available models
- **Embeddings:** All models
- **Vector DBs:** All databases
- **Custom Models:** Additional space

---

## 📋 STORAGE BREAKDOWN BY COMPONENT

### **LLM Models:**
- **Free Tier (11 models):** ~37.1 GB
- **Pro Tier (+5 models):** ~50-60 GB
- **Total (all models):** ~126.1 GB

### **Embedding Models:**
- **Essential (3 models):** ~1.2 GB
- **Full Set (9 models):** ~3.9 GB

### **Vector Databases:**
- **ChromaDB:** ~1-5 GB
- **FAISS (optional):** ~1-10 GB
- **Total:** ~2-15 GB

### **Software & Dependencies:**
- **Ollama:** ~100-200 MB
- **Python packages:** ~500 MB - 1 GB
- **Node.js packages:** ~200-500 MB
- **Total:** ~1-2 GB

---

## ✅ SUMMARY

### **Free Tier Storage:**
- **Minimum:** ~40 GB
- **Recommended:** ~50 GB
- **With buffer:** ~60 GB

### **Pro Tier Storage:**
- **Minimum:** ~100 GB
- **Recommended:** ~150 GB
- **With buffer:** ~200 GB

### **Enterprise Tier Storage:**
- **Minimum:** ~200 GB
- **Recommended:** ~500 GB
- **With buffer:** ~1 TB

---

## 🚀 STORAGE RECOMMENDATIONS

### **For Development:**
- **Start with Free Tier:** ~50 GB
- **Add models as needed**
- **Use external storage if needed**

### **For Production:**
- **Pro Tier:** ~150 GB
- **SSD recommended** (faster model loading)
- **Network storage for teams**

### **For Enterprise:**
- **Enterprise Tier:** ~500 GB - 1 TB
- **Dedicated storage server**
- **Backup strategy required**

---

**Storage is manageable! Free tier fits on most modern systems, Pro tier requires planning.** 💾🎸
