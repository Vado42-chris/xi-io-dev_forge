"use strict";
/**
 * Permission Validator
 *
 * Validates plugin permissions before allowing actions.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionValidator = void 0;
const minimatch = __importStar(require("minimatch"));
class PermissionValidator {
    /**
     * Validate permission for an action
     */
    validate(permissions, action, resource) {
        switch (action) {
            case 'readFile':
                return this.validateFileAccess(permissions.readFiles, resource);
            case 'writeFile':
                return this.validateFileAccess(permissions.writeFiles, resource);
            case 'executeFile':
                return this.validateFileAccess(permissions.executeFiles, resource);
            case 'network':
                return permissions.networkAccess === true;
            case 'model':
                return permissions.modelAccess?.includes(resource) || false;
            case 'api':
                return permissions.apiAccess?.includes(resource) || false;
            case 'command':
                return permissions.commandExecution === true;
            case 'systemCommand':
                return permissions.systemCommands === true;
            default:
                return false;
        }
    }
    /**
     * Validate file access
     */
    validateFileAccess(allowed, path) {
        if (!allowed)
            return false;
        return allowed.some(pattern => this.matchPattern(pattern, path));
    }
    /**
     * Match glob pattern
     */
    matchPattern(pattern, path) {
        try {
            return minimatch(path, pattern);
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Validate domain access
     */
    validateDomain(permissions, domain) {
        if (!permissions.networkAccess) {
            return false;
        }
        if (!permissions.allowedDomains || permissions.allowedDomains.length === 0) {
            return true; // All domains allowed if networkAccess is true
        }
        return permissions.allowedDomains.some(allowed => {
            // Exact match
            if (allowed === domain)
                return true;
            // Wildcard match
            if (allowed.startsWith('*.')) {
                const baseDomain = allowed.slice(2);
                return domain.endsWith('.' + baseDomain) || domain === baseDomain;
            }
            return false;
        });
    }
    /**
     * Validate environment variable access
     */
    validateEnvVar(permissions, envVar) {
        if (!permissions.environmentVariables) {
            return false;
        }
        return permissions.environmentVariables.includes(envVar);
    }
}
exports.PermissionValidator = PermissionValidator;
//# sourceMappingURL=permissionValidator.js.map