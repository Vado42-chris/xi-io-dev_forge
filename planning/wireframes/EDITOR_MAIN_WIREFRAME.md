# 📐 Editor Main View - Wireframe

**Date:** January 12, 2025  
**Status:** 📋 **WIREFRAME**  
**Hashtag:** `#wireframes`, `#editor`, `#main-view`, `#dev-forge`

---

## 🎯 PAGE OVERVIEW

### **Purpose:**
Primary coding interface - VS Code editor with Dev Forge enhancements

### **User Goals:**
- Write and edit code
- Access AI assistance
- View agent status
- Manage models
- Navigate projects

### **Key Features:**
- Code editor (Monaco)
- Multiagent view panel
- Model selector
- Agent status indicators
- File explorer
- Terminal integration

---

## 📐 LAYOUT STRUCTURE

```
┌─────────────────────────────────────────────────────────────────────────┐
│ HEADER (48px) - Xibalba Framework Styling                              │
│ [Dev Forge Logo] [File Menu] [Edit Menu] [View Menu] [Run Menu]        │
│ [Help Menu] [Status: Connected] [User Menu]                            │
├──────────┬──────────────────────────────────────────────────────────────┤
│          │                                                              │
│ ACTIVITY │  EDITOR AREA (Primary - 60% width)                          │
│ BAR      │  ┌────────────────────────────────────────────────────────┐ │
│ (48px)   │  │ TABS: [file1.ts] [file2.ts] [file3.ts]                │ │
│          │  ├────────────────────────────────────────────────────────┤ │
│ [Explorer│  │                                                          │ │
│ [Search] │  │  CODE EDITOR (Monaco)                                   │ │
│ [Git]    │  │  - Syntax highlighting                                  │ │
│ [Debug]  │  │  - IntelliSense                                         │ │
│ [Ext]    │  │  - AI suggestions (inline)                             │ │
│ [Agents] │  │  - Multi-model consensus (tooltip)                     │ │
│          │  │                                                          │ │
│          │  │  function example() {                                   │ │
│          │  │    // AI suggestion here                                │ │
│          │  │  }                                                      │ │
│          │  │                                                          │ │
│          │  └────────────────────────────────────────────────────────┘ │
│          │  ┌────────────────────────────────────────────────────────┐ │
│          │  │ TERMINAL (Collapsible)                                  │ │
│          │  │ $ npm run build                                         │ │
│          │  └────────────────────────────────────────────────────────┘ │
│          │                                                              │
├──────────┼──────────────────────────────────────────────────────────────┤
│          │                                                              │
│ SIDEBAR  │  MULTIAGENT VIEW PANEL (Secondary - 40% width)              │
│ (256px)  │  ┌────────────────────────────────────────────────────────┐ │
│          │  │ AGENT STATUS DASHBOARD                                  │ │
│ File     │  │ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐                   │ │
│ Tree     │  │ │Code│ │Math│ │Test│ │Rev │ │Doc │                   │ │
│          │  │ │Gen │ │Solv│ │Writ│ │iew │ │Gen │                   │ │
│ - src/   │  │ │ ✅ │ │ ✅ │ │ ⚠️ │ │ ✅ │ │ ✅ │                   │ │
│   - api/ │  │ └────┘ └────┘ └────┘ └────┘ └────┘                   │ │
│   - ui/  │  │                                                          │ │
│ - tests/ │  │ [Fire Team: LoginComponent]                            │ │
│          │  │ Status: Working (3/5 agents complete)                   │ │
│          │  └────────────────────────────────────────────────────────┘ │
│          │  ┌────────────────────────────────────────────────────────┐ │
│          │  │ MODEL SELECTOR                                         │ │
│          │  │ [Ollama] [API] [GGUF] [Plugins]                        │ │
│          │  │                                                        │ │
│          │  │ ✓ llama3 (local)                                      │ │
│          │  │ ✓ codellama (local)                                   │ │
│          │  │ ○ mistral (local)                                     │ │
│          │  │ ...                                                    │ │
│          │  │                                                        │ │
│          │  │ [Use Selected Models]                                 │ │
│          │  └────────────────────────────────────────────────────────┘ │
│          │  ┌────────────────────────────────────────────────────────┐ │
│          │  │ RESULTS DISPLAY                                        │ │
│          │  │                                                        │ │
│          │  │ Consensus: [Best Response]                             │ │
│          │  │ Top 5: [Response 1] [Response 2] ...                  │ │
│          │  │                                                        │ │
│          │  │ [Show All Responses]                                   │ │
│          │  └────────────────────────────────────────────────────────┘ │
│          │                                                              │
└──────────┴──────────────────────────────────────────────────────────────┘
```

---

## 🧩 COMPONENT DETAILS

### **1. Header (48px)**

**Components:**
- Dev Forge logo (left)
- Menu bar (File, Edit, View, Run, Help)
- Status indicator (Connection status)
- User menu (right)

**Interactions:**
- Click logo → Home/About
- Menu items → Standard VS Code menus
- Status → Connection details tooltip
- User menu → Profile, Settings, Logout

**Design Principles:**
- Pattern #209: Large, readable menu items
- Pattern #211: Logo substantial, menus compact

---

### **2. Activity Bar (48px, left)**

**Components:**
- Explorer icon
- Search icon
- Git icon
- Debug icon
- Extensions icon
- **Agents icon (NEW)**

**Interactions:**
- Click icon → Toggle sidebar panel
- Active icon → Highlighted
- Agents icon → Opens multiagent view

**Design Principles:**
- Pattern #209: Large icons (24px)
- Pattern #156: Keyboard shortcuts (Ctrl+B, Ctrl+Shift+F, etc.)

---

### **3. Sidebar (256px, left)**

**Components:**
- File explorer (default)
- Search panel
- Git panel
- Debug panel
- Extensions panel
- **Agents panel (NEW)**

**Interactions:**
- Click file → Open in editor
- Right-click → Context menu
- Drag & drop → Move files
- Search → Filter files

**Design Principles:**
- Pattern #211: Substantial width (256px) for primary nav
- Pattern #210: Grouped by type, minimal borders

---

### **4. Editor Area (Primary, 60% width)**

**Components:**
- Tab bar (open files)
- Monaco editor
- Terminal (collapsible)

**Interactions:**
- Type → Code editing
- Ctrl+Space → IntelliSense
- AI suggestions → Inline tooltips
- Multi-model consensus → Hover tooltip

**Design Principles:**
- Pattern #211: Primary feature = substantial width
- Pattern #209: Large, readable code (14px font minimum)

---

### **5. Multiagent View Panel (Secondary, 40% width)**

**Components:**
- Agent Status Dashboard
- Model Selector
- Results Display

**Interactions:**
- Click agent → View details
- Select models → Checkboxes
- View results → Expand/collapse
- Fire Team status → Progress indicator

**Design Principles:**
- Pattern #209: Large agent cards (120px min height)
- Pattern #210: Grouped by function, white space
- Pattern #156: Keyboard navigation (Tab, Enter)

---

## 🔄 USER FLOWS

### **Primary Flow: Generate Code with AI**

```
1. User types code in editor
   ↓
2. AI suggests completion (inline)
   ↓
3. User accepts suggestion
   ↓
4. Code inserted
   ↓
5. Agent status updates (CodeGen agent working)
   ↓
6. Results displayed in panel
```

### **Secondary Flow: Multi-Model Consensus**

```
1. User asks question in chat
   ↓
2. Select multiple models (checkbox)
   ↓
3. Click "Use Selected Models"
   ↓
4. All models execute in parallel
   ↓
5. Results aggregated (consensus shown first)
   ↓
6. User views top 5 or all responses
```

### **Error Flow: Agent Failure**

```
1. Agent fails (error status)
   ↓
2. HR System detects failure
   ↓
3. Error indicator shown (⚠️)
   ↓
4. User can retry or switch agent
   ↓
5. Error logged for debugging
```

---

## 🎨 DESIGN PRINCIPLES APPLIED

### **Pattern #209: 5 Feet Back Test**
- ✅ Large editor area (readable from distance)
- ✅ Large agent cards (120px min)
- ✅ Clear status indicators (24px)
- ✅ Proper contrast (4.5:1 minimum)

### **Pattern #210: Fewer Boxes**
- ✅ White space between panels (no borders)
- ✅ Grouped components (agents, models, results)
- ✅ Logical organization (related items together)

### **Pattern #211: Proportional Weight**
- ✅ Editor = 60% (primary feature)
- ✅ Multiagent panel = 40% (secondary)
- ✅ Sidebar = 256px (substantial navigation)
- ✅ Activity bar = 48px (compact utility)

### **Pattern #156: Universal Access**
- ✅ Keyboard shortcuts (Ctrl+B, Ctrl+Shift+F, etc.)
- ✅ ARIA labels on all interactive elements
- ✅ Screen reader support
- ✅ Focus indicators

---

## ✅ VALIDATION CHECKLIST

### **Functional Validation:**
- [ ] Editor loads and displays code
- [ ] AI suggestions appear inline
- [ ] Agent status updates correctly
- [ ] Model selector works
- [ ] Results display properly
- [ ] Terminal integrates correctly

### **Integration Validation:**
- [ ] VS Code extension system works
- [ ] Multiagent view integrates with editor
- [ ] Model selector connects to services
- [ ] Results panel receives data
- [ ] File explorer syncs with editor

### **Edge Case Validation:**
- [ ] Handles 100+ open files
- [ ] Handles 11+ agents simultaneously
- [ ] Handles 100+ models in selector
- [ ] Handles network failures gracefully
- [ ] Handles agent failures gracefully
- [ ] Handles large result sets

---

## 📊 NEXT STEPS

1. **Create Multiagent View Wireframe** - Detailed agent dashboard
2. **Create Model Selector Wireframe** - Detailed model selection UI
3. **Create Plugin Marketplace Wireframe** - Plugin browsing and installation
4. **Create Settings Wireframe** - Configuration interface
5. **Create Agent Dashboard Wireframe** - Detailed agent management

---

**Last Updated:** January 12, 2025

