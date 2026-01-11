# 📦 Reusable Components Inventory - Dev Forge

**Date:** January 10, 2025  
**Status:** 📋 **INVENTORY**  
**Hashtag:** `#dev-forge`, `#reusable-components`, `#inventory`

---

## 🎯 WHAT WE CAN REUSE

### **From xi-io_website:**

#### **1. Services**
- ✅ `geminiService.ts` - AI model integration
  - `chatWithPersona()` - Persona-based chat
  - `generateProImage()` - Image generation
  - `generateVeoVideo()` - Video generation
  - `startLiveSession()` - Live voice/audio
  - **Reuse:** Direct copy, extend for 11 models

#### **2. Hooks**
- ✅ `useChat.ts` - Chat state management
  - Chat log management
  - Processing states
  - Live voice integration
  - Error handling
  - **Reuse:** Perfect for multiagent chat

- ✅ `useBlogPosts.ts` - Data fetching with React Query
- ✅ `useCaseStudies.ts` - Case study data
- ✅ `useImagePreload.ts` - Image optimization
- ✅ `useKeyboardShortcut.ts` - Keyboard shortcuts
- ✅ `useLocalStorage.ts` - Local storage
- ✅ `useToast.ts` - Toast notifications
- ✅ `useSEO.ts` - SEO management

#### **3. Components**
- ✅ `ChatTemplate.tsx` - Chat interface
  - Message display
  - Input handling
  - Live voice toggle
  - **Reuse:** Base for agent chat interfaces

- ✅ `ConsoleTemplate.tsx` - AI generation console
  - Modality switching (TEXT/IMAGE/VIDEO)
  - Input/output handling
  - **Reuse:** For model selection UI

- ✅ `LoadingState.tsx` - Loading indicators
- ✅ `ErrorState.tsx` - Error displays
- ✅ `Toast.tsx` / `ToastContainer.tsx` - Notifications
- ✅ `LazyImage.tsx` - Image lazy loading
- ✅ `ProgressBar.tsx` - Progress indicators
- ✅ `KeyboardShortcutsHelp.tsx` - Help system

#### **4. Utilities**
- ✅ `accessibility.ts` - Screen reader support
- ✅ `keyboardShortcuts.ts` - Keyboard navigation
- ✅ `performance.ts` - Performance monitoring
- ✅ `analytics.ts` - Analytics tracking
- ✅ `storage.ts` - Local storage utilities
- ✅ `toastManager.ts` - Toast management
- ✅ `seo.ts` - SEO utilities
- ✅ `errorHandler.ts` - Error handling
- ✅ `dataTransformers.ts` - Data transformation

#### **5. API Client**
- ✅ `api/client.ts` - Axios-based API client
  - Request/response interceptors
  - Auth token handling
  - Error handling
  - **Reuse:** Connect to VectorForge backend

#### **6. React Query Setup**
- ✅ `queryClient.ts` - React Query configuration
  - Caching strategies
  - Stale time management
  - **Reuse:** For all data fetching

---

### **From VectorForge UI (xi-io-Vector-Forge-UI):**

#### **1. Backend Patterns**
- ✅ Express.js server structure
- ✅ API route patterns (`/api/*`)
- ✅ Service layer pattern
- ✅ JSON file storage
- ✅ FileSystemService pattern

#### **2. Frontend Patterns**
- ✅ React + TypeScript + Vite setup
- ✅ Component structure
- ✅ State management patterns

---

### **From 00_framework:**

#### **1. Wargaming System**
- ✅ `unified_math_wargaming_calculator.py`
- ✅ Wargame analysis patterns
- ✅ Priority matrices
- ✅ Yin/Yang analysis

#### **2. Organization Patterns**
- ✅ Worktree structure
- ✅ Project organization
- ✅ SSH integration

#### **3. Blockchain**
- ✅ File identity system
- ✅ Blockchain patterns

---

## 🎨 DESIGN SYSTEM (XIBALBA FRAMEWORK)

### **CSS Themes:**
- ✅ `/THEMES/xibalba-framework-theme-exact.css`
  - Dark grey backgrounds (#1e1e1e, #252526, #2d2d2d)
  - Light grey text (#ffffff, #cccccc, #999999)
  - Blue accents (#007acc)
  - Cursor UI-inspired

### **Design Patterns:**
- ✅ Pattern #209: 5 Feet Back Test
- ✅ Pattern #210: Fewer Boxes
- ✅ Pattern #211: Proportional Weight Balance
- ✅ Pattern #156: Universal Access (Multiple Paths)

### **Typography:**
- ✅ 3-font system:
  - Antonio (headers) - `font-tall-thin`
  - Inter (body) - `font-meso`
  - JetBrains Mono (tech) - `font-tech`

### **Branding:**
- ✅ Logo components (`Logo.tsx`, `Logomark.tsx`)
- ✅ Xibalba branding patterns

---

## 🚀 COOL FEATURES TO INTEGRATE

### **1. Persona System**
- ✅ `chatWithPersona()` with XIBALBA_CORE persona
- ✅ Persona dotfile system (ghosting prevention)
- ✅ "Between the lines" schema filtering
- **Use in dev_forge:** Each agent has its own persona

### **2. Multi-Model Support**
- ✅ Model switching (Flash-Lite vs Pro)
- ✅ Thinking config for complex tasks
- ✅ Cost optimization
- **Use in dev_forge:** 11 models, model selection UI

### **3. Live Voice/Audio**
- ✅ `startLiveSession()` - Real-time audio
- ✅ Audio context management
- ✅ Stream processing
- **Use in dev_forge:** Voice commands for agents

### **4. Image Generation**
- ✅ `generateProImage()` - AI image generation
- ✅ Aspect ratio control
- ✅ Size options
- **Use in dev_forge:** Visual code generation, diagrams

### **5. Video Generation**
- ✅ `generateVeoVideo()` - AI video generation
- **Use in dev_forge:** Code walkthroughs, demos

### **6. Keyboard Shortcuts**
- ✅ Comprehensive shortcut system
- ✅ Help display
- ✅ Accessibility support
- **Use in dev_forge:** Quick agent commands

### **7. Toast Notifications**
- ✅ Toast system for feedback
- ✅ Multiple toast types
- ✅ Auto-dismiss
- **Use in dev_forge:** Agent status updates

### **8. Error Boundaries**
- ✅ React Error Boundaries
- ✅ Graceful error handling
- ✅ User-friendly error messages
- **Use in dev_forge:** Agent error handling

### **9. Loading States**
- ✅ Loading indicators
- ✅ Progress bars
- ✅ Status indicators
- **Use in dev_forge:** Agent processing states

### **10. Accessibility**
- ✅ Screen reader support
- ✅ Keyboard navigation
- ✅ Skip links
- ✅ ARIA labels
- **Use in dev_forge:** Universal access (Pattern #156)

---

## 📋 WHAT TO COPY/REFACTOR

### **Immediate Reuse (Copy & Adapt):**
1. ✅ `geminiService.ts` → Extend for 11 models
2. ✅ `useChat.ts` → Multiagent chat
3. ✅ `ChatTemplate.tsx` → Agent chat UI
4. ✅ `ConsoleTemplate.tsx` → Model selector
5. ✅ `api/client.ts` → Backend connection
6. ✅ `queryClient.ts` → Data fetching
7. ✅ Xibalba CSS theme → Styling
8. ✅ Toast system → Notifications
9. ✅ Error handling → Agent errors
10. ✅ Loading states → Agent status

### **Refactor for Multiagent:**
1. ✅ Chat system → Multi-agent chat
2. ✅ Model selection → 11 model selector
3. ✅ Persona system → Per-agent personas
4. ✅ Task system → Fire team tasks
5. ✅ Sprint system → Agent sprints

### **New for Dev Forge:**
1. 🔨 Fire Team coordination UI
2. 🔨 HR system interface
3. 🔨 Agent status dashboard
4. 🔨 Code generation interface
5. 🔨 File operation UI
6. 🔨 Project management
7. 🔨 Terminal integration
8. 🔨 Git operations UI

---

## 🎯 INTEGRATION PRIORITY

### **Phase 1: Foundation (Copy)**
- [x] Xibalba CSS theme
- [ ] Gemini service (extend for 11 models)
- [ ] Chat hooks and components
- [ ] API client
- [ ] React Query setup
- [ ] Toast system
- [ ] Error handling
- [ ] Loading states

### **Phase 2: Multiagent (Refactor)**
- [ ] Multi-agent chat
- [ ] Model selector (11 models)
- [ ] Agent personas
- [ ] Fire team UI
- [ ] HR system UI

### **Phase 3: Coding Engine (New)**
- [ ] Code generation
- [ ] File operations
- [ ] Project management
- [ ] Terminal integration
- [ ] Git operations

---

**Everything we need is already built - we just need to connect it!** 🎸

