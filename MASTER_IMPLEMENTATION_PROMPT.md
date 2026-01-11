# 🎯 MASTER IMPLEMENTATION PROMPT - Dev Forge Extensibility

**Date:** January 10, 2025  
**Status:** 🔄 **ACTIVE IMPLEMENTATION**  
**Hashtag:** `#dev-forge`, `#master-prompt`, `#automode`, `#triple-validation`

---

## 🎯 MISSION STATEMENT

**Build a fully extensible VS Code-based editor with:**
1. ✅ Plugin system (users can create custom plugins)
2. ✅ Local GGUF model support (direct file loading via node-llama-cpp)
3. ✅ Custom API integration (Cursor, OpenAI, Anthropic, custom APIs)
4. ✅ Comprehensive VS Code settings (70+ configuration options)
5. ✅ Secure API key management (SecretStorage)
6. ✅ Model provider abstraction (Ollama, GGUF, APIs)
7. ✅ All VectorForge systems integration

**Validation Rule:** Every item must be validated 3 times from 3 different angles before moving on.

---

## 🔄 AUTOMODE WORKFLOW

### **Phase-Based Implementation:**
1. **Read** - Understand the requirement
2. **Plan** - Break down into tasks
3. **Implement** - Write the code
4. **Validate** - Triple validation (3 angles)
5. **Test** - Integration testing
6. **Document** - Update documentation
7. **Commit** - Git commit with clear message
8. **Move On** - Only after validation passes

### **Validation Angles:**
1. **Functional** - Does it work as intended?
2. **Integration** - Does it integrate with existing systems?
3. **Edge Cases** - Does it handle errors/edge cases?

---

## 📋 IMPLEMENTATION PHASES

### **PHASE 1: VS Code Extension Foundation** 🔴
**Goal:** Set up VS Code extension scaffold with settings schema

**Tasks:**
1. Create VS Code extension scaffold
2. Add settings schema (70+ settings)
3. Implement ConfigurationManager
4. Add settings validation
5. Test settings read/write

**Validation:**
- ✅ Functional: Settings can be read/written
- ✅ Integration: Settings integrate with existing services
- ✅ Edge Cases: Invalid settings handled gracefully

**Files to Create:**
- `extension/package.json` - Extension manifest
- `extension/src/extension.ts` - Entry point
- `extension/src/services/configurationManager.ts` - Settings manager
- `extension/tsconfig.json` - TypeScript config

---

### **PHASE 2: Model Provider Abstraction** 🔴
**Goal:** Refactor to support multiple model providers

**Tasks:**
1. Create ModelProvider interface
2. Refactor ollamaService → OllamaProvider
3. Create ModelProviderRegistry
4. Update modelManager to use providers
5. Test provider switching

**Validation:**
- ✅ Functional: Providers can be registered and used
- ✅ Integration: Works with parallelExecution and aggregationService
- ✅ Edge Cases: Provider failures handled, fallback works

**Files to Modify:**
- `src/services/modelManager.ts` - Add provider support
- `src/services/ollamaService.ts` - Refactor to OllamaProvider
- `src/services/types.ts` - Add provider interfaces

---

### **PHASE 3: GGUF Provider Implementation** 🔴
**Goal:** Direct GGUF file loading support

**Tasks:**
1. Install node-llama-cpp
2. Create GGUFProvider class
3. Implement model discovery
4. Implement model loading
5. Implement model execution
6. Add memory management
7. Add GGUF UI components

**Validation:**
- ✅ Functional: GGUF files can be loaded and executed
- ✅ Integration: Works with modelManager and parallelExecution
- ✅ Edge Cases: Memory limits, invalid files, loading failures

**Files to Create:**
- `src/services/ggufProvider.ts` - GGUF provider
- `src/services/ggufModelManager.ts` - GGUF model management
- `extension/src/ui/ggufBrowser.tsx` - GGUF browser UI

---

### **PHASE 4: API Provider System** 🔴
**Goal:** Custom API integration (Cursor, OpenAI, Anthropic, custom)

**Tasks:**
1. Create ApiProvider interface
2. Create ApiProviderRegistry
3. Implement CursorApiProvider
4. Implement OpenAIProvider
5. Implement AnthropicProvider
6. Implement CustomApiProvider
7. Implement rate limiting
8. Implement retry logic
9. Implement API key management (SecretStorage)
10. Add API provider UI

**Validation:**
- ✅ Functional: APIs can be called and responses received
- ✅ Integration: Works with modelManager and parallelExecution
- ✅ Edge Cases: Rate limits, network errors, invalid keys, timeouts

**Files to Create:**
- `src/services/apiProvider.ts` - Base API provider
- `src/services/cursorApiProvider.ts` - Cursor API
- `src/services/openAiProvider.ts` - OpenAI API
- `src/services/anthropicProvider.ts` - Anthropic API
- `src/services/customApiProvider.ts` - Custom API
- `src/services/apiKeyManager.ts` - API key management
- `src/services/rateLimiter.ts` - Rate limiting
- `src/services/retryHandler.ts` - Retry logic

---

### **PHASE 5: Plugin System** 🔴
**Goal:** Full plugin system with sandboxing

**Tasks:**
1. Create Plugin interface
2. Create PluginManager
3. Create PluginDiscovery
4. Implement plugin sandboxing (process isolation)
5. Implement permission system
6. Create plugin API
7. Create plugin template
8. Add plugin management UI

**Validation:**
- ✅ Functional: Plugins can be loaded and executed
- ✅ Integration: Plugins can register providers and commands
- ✅ Edge Cases: Malicious plugins blocked, permission violations caught, sandbox isolation works

**Files to Create:**
- `src/services/pluginManager.ts` - Plugin manager
- `src/services/pluginSandbox.ts` - Plugin sandboxing
- `src/services/permissionValidator.ts` - Permission system
- `src/services/pluginAPI.ts` - Plugin API
- `extension/src/ui/pluginManager.tsx` - Plugin management UI

---

### **PHASE 6: UI Integration** 🔴
**Goal:** All UI components for extensibility

**Tasks:**
1. Model selector webview
2. GGUF browser webview
3. API provider management webview
4. Plugin management webview
5. Settings webview
6. Tree views (models, agents, plugins)
7. Status bar items

**Validation:**
- ✅ Functional: UI components render and work
- ✅ Integration: UI connects to services correctly
- ✅ Edge Cases: Loading states, errors, empty states handled

**Files to Create:**
- `extension/src/ui/modelSelector.tsx`
- `extension/src/ui/ggufBrowser.tsx`
- `extension/src/ui/apiProviderManager.tsx`
- `extension/src/ui/pluginManager.tsx`
- `extension/src/ui/settings.tsx`

---

### **PHASE 7: Integration & Testing** 🔴
**Goal:** Full system integration and testing

**Tasks:**
1. Integrate all providers with modelManager
2. Integrate all providers with parallelExecution
3. Integrate all providers with aggregationService
4. End-to-end testing
5. Performance testing
6. Security testing

**Validation:**
- ✅ Functional: All systems work together
- ✅ Integration: No conflicts or issues
- ✅ Edge Cases: All error paths tested

---

## ✅ TRIPLE VALIDATION CHECKLIST

### **For Each Implementation Item:**

#### **Validation 1: Functional** ✅
- [ ] Does it work as specified?
- [ ] Does it meet the requirements?
- [ ] Are all features implemented?
- [ ] Are there any obvious bugs?

#### **Validation 2: Integration** ✅
- [ ] Does it integrate with existing services?
- [ ] Are there any conflicts?
- [ ] Are dependencies correct?
- [ ] Are interfaces compatible?

#### **Validation 3: Edge Cases** ✅
- [ ] Are errors handled gracefully?
- [ ] Are edge cases covered?
- [ ] Is input validation in place?
- [ ] Are security concerns addressed?

**Rule:** All 3 validations must pass before moving on.

---

## 🔍 VALIDATION METHODS

### **Functional Validation:**
1. **Unit Tests** - Test individual functions
2. **Manual Testing** - Test in Extension Development Host
3. **Code Review** - Review for correctness

### **Integration Validation:**
1. **Integration Tests** - Test with other services
2. **End-to-End Tests** - Test full workflows
3. **Dependency Check** - Verify dependencies

### **Edge Case Validation:**
1. **Error Injection** - Test error handling
2. **Boundary Testing** - Test limits
3. **Security Audit** - Check for vulnerabilities

---

## 📝 IMPLEMENTATION TEMPLATE

### **For Each Task:**

```markdown
## Task: [Task Name]

### Implementation:
- [ ] Code written
- [ ] Tests written
- [ ] Documentation updated

### Validation 1: Functional
- [ ] Works as specified
- [ ] Meets requirements
- [ ] No obvious bugs

### Validation 2: Integration
- [ ] Integrates with existing code
- [ ] No conflicts
- [ ] Dependencies correct

### Validation 3: Edge Cases
- [ ] Errors handled
- [ ] Edge cases covered
- [ ] Security addressed

### Status: ✅ PASS / 🔴 FAIL

### Notes:
[Any notes or issues]
```

---

## 🚨 QUALITY GATES

### **Before Moving to Next Phase:**
1. ✅ All tasks in current phase complete
2. ✅ All validations pass (3 angles)
3. ✅ Tests written and passing
4. ✅ Documentation updated
5. ✅ Code committed to git
6. ✅ No linting errors
7. ✅ No TypeScript errors

### **Before Moving to Next Task:**
1. ✅ Current task complete
2. ✅ Validations pass
3. ✅ Tests pass
4. ✅ Code reviewed

---

## 📊 PROGRESS TRACKING

### **Current Phase:** [Phase Name]
### **Current Task:** [Task Name]
### **Validation Status:** [PASS/FAIL]
### **Blockers:** [Any blockers]

### **Completed:**
- [ ] Phase 1: VS Code Extension Foundation
- [ ] Phase 2: Model Provider Abstraction
- [ ] Phase 3: GGUF Provider Implementation
- [ ] Phase 4: API Provider System
- [ ] Phase 5: Plugin System
- [ ] Phase 6: UI Integration
- [ ] Phase 7: Integration & Testing

---

## 🎯 SUCCESS CRITERIA

### **Phase 1 Complete When:**
- Extension can be loaded in VS Code
- Settings schema defined and working
- ConfigurationManager can read/write settings

### **Phase 2 Complete When:**
- Multiple model providers can be registered
- Provider switching works
- Existing services work with providers

### **Phase 3 Complete When:**
- GGUF files can be discovered
- GGUF files can be loaded
- GGUF models can execute prompts
- Memory management works

### **Phase 4 Complete When:**
- Cursor API works
- OpenAI API works
- Anthropic API works
- Custom APIs work
- API keys stored securely
- Rate limiting works
- Retry logic works

### **Phase 5 Complete When:**
- Plugins can be discovered
- Plugins can be loaded
- Plugins can register providers
- Sandboxing works
- Permissions enforced

### **Phase 6 Complete When:**
- All UI components render
- All UI components functional
- UI connects to services

### **Phase 7 Complete When:**
- All systems integrated
- All tests passing
- Performance acceptable
- Security validated

---

## 🔄 AUTOMODE COMMANDS

### **When Starting:**
```
"Starting [Phase Name] - [Task Name]"
```

### **During Implementation:**
```
"Implementing [Feature]..."
"Validating [Feature] from [Angle]..."
```

### **After Validation:**
```
"✅ Validation 1 (Functional): PASS"
"✅ Validation 2 (Integration): PASS"
"✅ Validation 3 (Edge Cases): PASS"
"✅ [Task Name] COMPLETE - Moving to next task"
```

### **On Error:**
```
"🔴 Validation [N] FAILED: [Reason]"
"Fixing [Issue]..."
"Re-validating..."
```

---

## 📋 CURRENT STATE

**Last Updated:** [Date/Time]
**Current Phase:** [Phase Name]
**Current Task:** [Task Name]
**Validation Status:** [Status]
**Next Action:** [Action]

---

## 🎸 READY TO BEGIN

**Copy this prompt and paste it at the start of each session.**
**Work through phases systematically.**
**Validate each item 3 times before moving on.**
**Commit progress regularly.**
**Document everything.**

**LET'S BUILD THIS! 🚀**

