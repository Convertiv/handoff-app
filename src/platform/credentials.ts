import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { Logger } from '../utils/logger';

// ── Types ───────────────────────────────────────────────────────────────

export interface CredentialEntry {
  token: string;
  user: {
    name: string | null;
    email: string;
  };
  createdAt: string;
}

/** Keyed by platform base URL */
export type CredentialsStore = Record<string, CredentialEntry>;

// ── Paths ───────────────────────────────────────────────────────────────

const HANDOFF_DIR = path.join(os.homedir(), '.handoff');
const CREDENTIALS_FILE = path.join(HANDOFF_DIR, 'credentials.json');

// ── Core Functions ──────────────────────────────────────────────────────

/**
 * Load the full credentials store from disk.
 * Returns an empty object if the file doesn't exist yet.
 */
export function loadCredentials(): CredentialsStore {
  try {
    if (fs.existsSync(CREDENTIALS_FILE)) {
      return fs.readJsonSync(CREDENTIALS_FILE) as CredentialsStore;
    }
  } catch (err) {
    Logger.warn('Could not read credentials file, starting fresh.');
    Logger.debug('Credentials read error', err);
  }
  return {};
}

/**
 * Save the full credentials store to disk.
 * Creates the ~/.handoff directory if it doesn't exist.
 */
export function saveCredentials(creds: CredentialsStore): void {
  fs.ensureDirSync(HANDOFF_DIR);
  fs.writeJsonSync(CREDENTIALS_FILE, creds, { spaces: 2, mode: 0o600 });
}

/**
 * Retrieve the token for a specific platform URL.
 * Returns null if not logged in to that URL.
 */
export function getToken(baseUrl: string): string | null {
  const creds = loadCredentials();
  const normalized = normalizeUrl(baseUrl);
  return creds[normalized]?.token ?? null;
}

/**
 * Retrieve the full credential entry for a specific platform URL.
 */
export function getCredential(baseUrl: string): CredentialEntry | null {
  const creds = loadCredentials();
  const normalized = normalizeUrl(baseUrl);
  return creds[normalized] ?? null;
}

/**
 * Store a token and user info for a platform URL.
 */
export function setToken(
  baseUrl: string,
  token: string,
  user: { name: string | null; email: string }
): void {
  const creds = loadCredentials();
  const normalized = normalizeUrl(baseUrl);
  creds[normalized] = {
    token,
    user,
    createdAt: new Date().toISOString(),
  };
  saveCredentials(creds);
}

/**
 * Remove the credential for a platform URL.
 */
export function removeToken(baseUrl: string): void {
  const creds = loadCredentials();
  const normalized = normalizeUrl(baseUrl);
  delete creds[normalized];
  saveCredentials(creds);
}

// ── Helpers ─────────────────────────────────────────────────────────────

/**
 * Normalize a URL by removing trailing slashes for consistent key lookup.
 */
function normalizeUrl(url: string): string {
  return url.replace(/\/+$/, '');
}
