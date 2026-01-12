/**
 * Search Service
 * 
 * Provides search functionality across files, content, and metadata.
 * Supports full-text search, regex, and advanced filtering.
 */

export interface SearchQuery {
  text: string;
  regex?: boolean;
  caseSensitive?: boolean;
  wholeWord?: boolean;
  scope?: 'current-file' | 'workspace' | 'all-files';
  fileTypes?: string[];
  excludePatterns?: string[];
}

export interface SearchResult {
  id: string;
  type: 'file' | 'directory' | 'content';
  name: string;
  path: string;
  file?: string;
  line?: number;
  column?: number;
  match?: string;
  context?: string;
  excerpt?: string;
  score: number;
  tags?: string[];
}

export interface SearchOptions {
  maxResults?: number;
  includeContext?: boolean;
  contextLines?: number;
}

export class SearchService {
  private searchHistory: SearchQuery[] = [];
  private maxHistorySize: number = 50;

  constructor() {
    // Initialize search service
  }

  /**
   * Search in text content
   */
  async searchInText(
    content: string,
    query: SearchQuery,
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    const lines = content.split('\n');
    const pattern = this.buildSearchPattern(query);

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      const matches = this.findMatches(line, pattern, query);

      for (const match of matches) {
        const context = this.getContext(lines, lineIndex, options.contextLines || 2);
        const resultId = `search-result-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        results.push({
          id: resultId,
          type: 'content',
          name: '', // Will be set by caller
          path: '', // Will be set by caller
          file: '', // Will be set by caller
          line: lineIndex + 1,
          column: match.index + 1,
          match: match.text,
          context,
          excerpt: context,
          score: this.calculateScore(match.text, query.text),
        });

        if (options.maxResults && results.length >= options.maxResults) {
          return results;
        }
      }
    }

    return results;
  }

  /**
   * Build search pattern
   */
  private buildSearchPattern(query: SearchQuery): RegExp {
    let pattern = query.text;

    if (query.wholeWord) {
      pattern = `\\b${pattern}\\b`;
    }

    if (!query.regex) {
      pattern = this.escapeRegex(pattern);
    }

    const flags = query.caseSensitive ? 'g' : 'gi';
    return new RegExp(pattern, flags);
  }

  /**
   * Escape regex special characters
   */
  private escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Find matches in line
   */
  private findMatches(
    line: string,
    pattern: RegExp,
    query: SearchQuery
  ): Array<{ index: number; text: string }> {
    const matches: Array<{ index: number; text: string }> = [];
    let match;

    // Reset regex lastIndex
    pattern.lastIndex = 0;

    while ((match = pattern.exec(line)) !== null) {
      matches.push({
        index: match.index,
        text: match[0],
      });
    }

    return matches;
  }

  /**
   * Get context around match
   */
  private getContext(lines: string[], lineIndex: number, contextLines: number): string {
    const start = Math.max(0, lineIndex - contextLines);
    const end = Math.min(lines.length - 1, lineIndex + contextLines);
    return lines.slice(start, end + 1).join('\n');
  }

  /**
   * Calculate match score
   */
  private calculateScore(match: string, query: string): number {
    // Simple scoring: exact match = 100, partial = 50
    if (match.toLowerCase() === query.toLowerCase()) {
      return 100;
    }
    return 50;
  }

  /**
   * Search in multiple files
   */
  async searchInFiles(
    files: Array<{ path: string; content: string }>,
    query: SearchQuery,
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    const allResults: SearchResult[] = [];

    for (const file of files) {
      // Check if file matches scope
      if (!this.matchesScope(file.path, query)) {
        continue;
      }

      const results = await this.searchInText(file.content, query, options);
      const fileName = file.path.split('/').pop() || file.path;
      results.forEach(result => {
        result.file = file.path;
        result.path = file.path;
        result.name = fileName;
        result.type = 'file';
      });

      allResults.push(...results);

      if (options.maxResults && allResults.length >= options.maxResults) {
        break;
      }
    }

    // Sort by score (highest first)
    allResults.sort((a, b) => b.score - a.score);

    return allResults;
  }

  /**
   * Check if file matches scope
   */
  private matchesScope(filePath: string, query: SearchQuery): boolean {
    // Check file types
    if (query.fileTypes && query.fileTypes.length > 0) {
      const ext = filePath.split('.').pop()?.toLowerCase();
      if (!ext || !query.fileTypes.includes(ext)) {
        return false;
      }
    }

    // Check exclude patterns
    if (query.excludePatterns && query.excludePatterns.length > 0) {
      for (const pattern of query.excludePatterns) {
        const regex = new RegExp(pattern);
        if (regex.test(filePath)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Replace in text
   */
  replaceInText(
    content: string,
    query: SearchQuery,
    replacement: string
  ): { newContent: string; replacements: number } {
    const pattern = this.buildSearchPattern(query);
    const newContent = content.replace(pattern, replacement);
    const matches = content.match(pattern);
    const replacements = matches ? matches.length : 0;

    return { newContent, replacements };
  }

  /**
   * Replace all in text
   */
  replaceAllInText(
    content: string,
    query: SearchQuery,
    replacement: string
  ): { newContent: string; replacements: number } {
    const pattern = this.buildSearchPattern(query);
    const newContent = content.replace(pattern, replacement);
    const matches = content.match(new RegExp(pattern.source, pattern.flags + 'g'));
    const replacements = matches ? matches.length : 0;

    return { newContent, replacements };
  }

  /**
   * Add to search history
   */
  addToHistory(query: SearchQuery): void {
    this.searchHistory.unshift(query);
    if (this.searchHistory.length > this.maxHistorySize) {
      this.searchHistory.pop();
    }
  }

  /**
   * Get search history
   */
  getHistory(limit?: number): SearchQuery[] {
    if (limit) {
      return this.searchHistory.slice(0, limit);
    }
    return [...this.searchHistory];
  }

  /**
   * Clear search history
   */
  clearHistory(): void {
    this.searchHistory = [];
  }
}

// Singleton instance
export const searchService = new SearchService();

