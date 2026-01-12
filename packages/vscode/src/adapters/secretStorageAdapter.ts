/**
 * VS Code Secret Storage Adapter
 * 
 * Adapts VS Code SecretStorage to core SDK SecretStorage interface.
 */

import * as vscode from 'vscode';
import { SecretStorage } from '@dev-forge/core';

export class VSCodeSecretStorageAdapter implements SecretStorage {
  private secretStorage: vscode.SecretStorage;

  constructor(secretStorage: vscode.SecretStorage) {
    this.secretStorage = secretStorage;
  }

  async store(key: string, value: string): Promise<void> {
    await this.secretStorage.store(key, value);
  }

  async get(key: string): Promise<string | undefined> {
    return await this.secretStorage.get(key);
  }

  async delete(key: string): Promise<void> {
    await this.secretStorage.delete(key);
  }
}

