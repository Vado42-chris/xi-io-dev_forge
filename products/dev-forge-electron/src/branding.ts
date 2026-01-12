/**
 * Dev Forge Branding
 * 
 * Custom branding and theming for Dev Forge.
 * Removes Microsoft/VS Code branding, applies Dev Forge branding.
 */

/**
 * Apply Dev Forge branding
 */
export function applyBranding(): void {
  // Update document title
  document.title = 'Dev Forge';

  // Update meta tags if needed
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.setAttribute('content', 'Dev Forge - Multiagent Coding Engine');
  }

  // Add Dev Forge branding to header
  const header = document.querySelector('.header-title');
  if (header) {
    header.textContent = 'DEV FORGE';
  }

  // Apply Xibalba Framework branding colors
  document.documentElement.style.setProperty('--brand-color-primary', '#007acc');
  document.documentElement.style.setProperty('--brand-color-secondary', '#050505');
  document.documentElement.style.setProperty('--brand-color-accent', '#FFFFFF');

  console.log('[Branding] Dev Forge branding applied');
}

/**
 * Remove Microsoft/VS Code branding
 */
export function removeMicrosoftBranding(): void {
  // Remove any Microsoft/VS Code references
  // This is handled in the HTML/CSS already
  console.log('[Branding] Microsoft branding removed');
}

