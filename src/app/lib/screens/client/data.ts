'use client';

import type { CollectionHandle, DocumentHandle, DocumentStatus, UseCollection, UseDocument } from '@handoff/screens/client-api';
import { DEFAULT_LIST_LIMIT, MAX_LIST_LIMIT } from '@handoff/screens/store';
import type { CollectionQuery, StoredDocument } from '@handoff/screens/types';
import * as React from 'react';
import { onScreenChanges, type ChangedDocument } from '../events';
import { createDocument, deleteDocument, listDocuments, readDocument, ScreenRequestError, writeDocument } from './api';
import { useScreenContext } from './context';

/**
 * Client caches for collection documents, shared by every component of a screen.
 *
 * A document change shows at once and is saved after {@link SAVE_DELAY_MS}. The save carries the
 * revision it builds on; a `409` puts the document in `conflict` with the other writer's version,
 * until the screen resolves it. Writes by the assistant arrive as change events and refresh the
 * caches that show those documents. Other writes, by MCP clients or other tabs, show when the reader
 * returns to the tab, which reads the shown documents and lists again.
 */

const SAVE_DELAY_MS = 600;
const REFRESH_DELAY_MS = 80;
/** Switching back to the tab fires both `focus` and `visibilitychange`; they count as one return. */
const FOCUS_THROTTLE_MS = 5000;

type Stored = StoredDocument<unknown>;
type Listener = () => void;

const messageOf = (error: unknown): string => (error instanceof Error ? error.message : String(error));

// ---------------------------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------------------------

interface DocumentSnapshot {
  data: unknown;
  revision: number;
  status: DocumentStatus;
  error: string | null;
}

interface DocumentEntry {
  screenId: string;
  collection: string;
  id: string;
  stored: Stored | null;
  /** Changes not saved yet. */
  local: unknown | undefined;
  conflict: Stored | null;
  status: DocumentStatus;
  error: string | null;
  loading: Promise<void> | null;
  saving: Promise<void> | null;
  timer: ReturnType<typeof setTimeout> | null;
  listeners: Set<Listener>;
  snapshot: DocumentSnapshot;
}

const documents = new Map<string, DocumentEntry>();

const documentKey = (screenId: string, collection: string, id: string): string => JSON.stringify([screenId, collection, id]);

const publish = (entry: DocumentEntry): void => {
  entry.snapshot = {
    data: entry.local !== undefined ? entry.local : entry.stored?.data,
    revision: entry.stored?.revision ?? 0,
    status: entry.status,
    error: entry.error,
  };
  entry.listeners.forEach((listener) => listener());
};

const documentEntry = (screenId: string, collection: string, id: string): DocumentEntry => {
  const key = documentKey(screenId, collection, id);
  let entry = documents.get(key);
  if (!entry) {
    entry = {
      screenId,
      collection,
      id,
      stored: null,
      local: undefined,
      conflict: null,
      status: 'loading',
      error: null,
      loading: null,
      saving: null,
      timer: null,
      listeners: new Set(),
      snapshot: { data: undefined, revision: 0, status: 'loading', error: null },
    };
    documents.set(key, entry);
  }
  return entry;
};

const settledStatus = (entry: DocumentEntry): DocumentStatus =>
  entry.conflict ? 'conflict' : entry.local !== undefined ? 'dirty' : entry.stored ? 'saved' : 'missing';

const loadDocument = (entry: DocumentEntry): Promise<void> => {
  entry.loading ??= readDocument(entry.screenId, entry.collection, entry.id)
    .then((stored) => {
      entry.stored = stored;
      entry.error = null;
      entry.status = settledStatus(entry);
    })
    .catch((error) => {
      entry.status = 'error';
      entry.error = messageOf(error);
    })
    .finally(() => {
      entry.loading = null;
      publish(entry);
    });
  return entry.loading;
};

const scheduleSave = (entry: DocumentEntry): void => {
  if (entry.timer) clearTimeout(entry.timer);
  entry.timer = setTimeout(() => void saveDocument(entry), SAVE_DELAY_MS);
};

const saveDocument = async (entry: DocumentEntry): Promise<void> => {
  if (entry.timer) {
    clearTimeout(entry.timer);
    entry.timer = null;
  }
  if (entry.saving) {
    await entry.saving;
    if (entry.local !== undefined && entry.status === 'dirty') return saveDocument(entry);
    return;
  }
  if (entry.local === undefined || entry.conflict) return;
  const sent = entry.local;
  entry.status = 'saving';
  entry.error = null;
  publish(entry);
  entry.saving = writeDocument(entry.screenId, entry.collection, entry.id, sent, entry.stored?.revision ?? 0)
    .then((stored) => {
      entry.stored = stored;
      if (entry.local === sent) entry.local = undefined;
      entry.status = settledStatus(entry);
      updateListedDocument(entry.screenId, entry.collection, stored);
      if (entry.local !== undefined) scheduleSave(entry);
    })
    .catch((error) => {
      if (error instanceof ScreenRequestError && error.status === 409) {
        entry.conflict = error.current ?? null;
        entry.status = 'conflict';
        entry.error = error.message;
        // A conflict without the other version reads it, so `resolveConflict` has a revision to build on.
        if (!entry.conflict)
          void readDocument(entry.screenId, entry.collection, entry.id).then((current) => ((entry.conflict = current), publish(entry)));
      } else {
        entry.status = 'error';
        entry.error = messageOf(error);
      }
    })
    .finally(() => {
      entry.saving = null;
      publish(entry);
    });
  return entry.saving;
};

const updateDocument = (entry: DocumentEntry, change: (document: unknown) => unknown): void => {
  const base = entry.local !== undefined ? entry.local : entry.stored?.data;
  if (base === undefined) return;
  entry.local = change(structuredClone(base));
  if (!entry.conflict && entry.status !== 'saving') entry.status = 'dirty';
  entry.error = entry.conflict ? entry.error : null;
  publish(entry);
  scheduleSave(entry);
};

const resolveConflict = (entry: DocumentEntry, keep: 'mine' | 'theirs'): void => {
  if (entry.status !== 'conflict') return;
  if (entry.conflict) entry.stored = entry.conflict;
  entry.conflict = null;
  entry.error = null;
  if (keep === 'theirs') entry.local = undefined;
  entry.status = settledStatus(entry);
  publish(entry);
  if (keep === 'mine') void saveDocument(entry);
};

/**
 * Shows a stored version read from the server. A newer version replaces the shown data when
 * nothing is unsaved, and becomes a conflict otherwise. `null` means the document is gone.
 */
const mergeStored = (entry: DocumentEntry, current: Stored | null): void => {
  if (!current) {
    if (!entry.stored || entry.local !== undefined) return;
    entry.stored = null;
    entry.status = 'missing';
    entry.error = null;
    publish(entry);
    return;
  }
  if (entry.stored && current.revision <= entry.stored.revision) return;
  if (entry.local === undefined && !entry.saving) {
    entry.stored = current;
    entry.status = 'saved';
    entry.error = null;
  } else {
    entry.conflict = current;
    entry.status = 'conflict';
    entry.error = 'The document changed while you were editing it.';
  }
  publish(entry);
};

/** Reads the document again and merges it. A failed read keeps what is shown. */
const revalidateDocument = async (entry: DocumentEntry): Promise<void> => {
  if (entry.loading) return entry.loading;
  if (entry.saving) return;
  const current = await readDocument(entry.screenId, entry.collection, entry.id).catch(() => undefined);
  // A save that started meanwhile may have written the version just read; its own result settles it.
  if (current === undefined || entry.saving) return;
  mergeStored(entry, current);
};

/** A tool or another tab wrote the document. */
const applyRemoteChange = async (entry: DocumentEntry, change: ChangedDocument): Promise<void> => {
  if (change.revision === 0) {
    entry.stored = null;
    entry.local = undefined;
    entry.status = 'missing';
    publish(entry);
    return;
  }
  if (entry.stored && change.revision <= entry.stored.revision) return;
  const current = await readDocument(entry.screenId, entry.collection, entry.id).catch(() => undefined);
  if (current !== undefined) mergeStored(entry, current);
};

const isLoaded = (entry: DocumentEntry): boolean => entry.stored !== null || entry.status === 'missing';

const IDLE_DOCUMENT: DocumentSnapshot = { data: undefined, revision: 0, status: 'idle', error: null };
const noop = () => () => undefined;

export const useDocument: UseDocument = (collection, id) => {
  const { screen } = useScreenContext();
  const entry = id ? documentEntry(screen.id, collection.name, id) : null;
  const subscribe = React.useCallback(
    (listener: Listener) => {
      if (!entry) return () => undefined;
      entry.listeners.add(listener);
      return () => entry.listeners.delete(listener);
    },
    [entry]
  );
  const snapshot = React.useSyncExternalStore(
    entry ? subscribe : noop,
    () => entry?.snapshot ?? IDLE_DOCUMENT,
    () => entry?.snapshot ?? IDLE_DOCUMENT
  );

  React.useEffect(() => {
    if (!entry) return;
    if (!entry.stored && entry.status !== 'missing') void loadDocument(entry);
    // Leaving a document saves what is pending instead of dropping it.
    return () => {
      if (entry.local !== undefined) void saveDocument(entry);
    };
  }, [entry]);

  return React.useMemo<DocumentHandle<any>>(
    () => ({
      id: id ?? undefined,
      data: snapshot.data,
      revision: snapshot.revision,
      status: snapshot.status,
      error: snapshot.error,
      update: (change) => entry && updateDocument(entry, change),
      save: () => (entry ? saveDocument(entry) : Promise.resolve()),
      refresh: () => (!entry ? Promise.resolve() : isLoaded(entry) ? revalidateDocument(entry) : loadDocument(entry)),
      resolveConflict: (keep) => entry && resolveConflict(entry, keep),
    }),
    [entry, id, snapshot]
  );
};

// ---------------------------------------------------------------------------------------------
// Collections
// ---------------------------------------------------------------------------------------------

interface CollectionSnapshot {
  documents: Stored[];
  status: 'loading' | 'ready' | 'error';
  error: string | null;
  hasMore: boolean;
}

interface CollectionEntry {
  screenId: string;
  collection: string;
  query: CollectionQuery<unknown>;
  documents: Stored[];
  nextCursor: string | null;
  status: CollectionSnapshot['status'];
  error: string | null;
  loading: Promise<void> | null;
  listeners: Set<Listener>;
  snapshot: CollectionSnapshot;
  refreshTimer: ReturnType<typeof setTimeout> | null;
}

const collections = new Map<string, CollectionEntry>();

const publishCollection = (entry: CollectionEntry): void => {
  entry.snapshot = { documents: entry.documents, status: entry.status, error: entry.error, hasMore: entry.nextCursor !== null };
  entry.listeners.forEach((listener) => listener());
};

const collectionEntry = (screenId: string, collection: string, query: CollectionQuery<unknown>): CollectionEntry => {
  const key = JSON.stringify([screenId, collection, query]);
  let entry = collections.get(key);
  if (!entry) {
    entry = {
      screenId,
      collection,
      query,
      documents: [],
      nextCursor: null,
      status: 'loading',
      error: null,
      loading: null,
      listeners: new Set(),
      snapshot: { documents: [], status: 'loading', error: null, hasMore: false },
      refreshTimer: null,
    };
    collections.set(key, entry);
  }
  return entry;
};

/** Writes finished per collection, so a list read that overlaps a write is read again. */
const collectionWrites = new Map<string, number>();
const writesKey = (screenId: string, collection: string): string => JSON.stringify([screenId, collection]);
const writesOf = (screenId: string, collection: string): number => collectionWrites.get(writesKey(screenId, collection)) ?? 0;
const countWrite = (screenId: string, collection: string): void => {
  collectionWrites.set(writesKey(screenId, collection), writesOf(screenId, collection) + 1);
};

/**
 * Reads the first page again, or the next one with `more`. A reload reads as many documents as
 * are shown, so pages loaded with `loadMore` stay. With `quiet`, a failed reload keeps the list.
 */
const loadCollection = (entry: CollectionEntry, more = false, quiet = false): Promise<void> => {
  if (entry.loading) return entry.loading;
  const cursor = more ? (entry.nextCursor ?? undefined) : undefined;
  if (more && !cursor) return Promise.resolve();
  const limit = more
    ? entry.query.limit
    : Math.min(Math.max(entry.documents.length, entry.query.limit ?? DEFAULT_LIST_LIMIT), MAX_LIST_LIMIT);
  const writes = writesOf(entry.screenId, entry.collection);
  let isStale = false;
  entry.loading = listDocuments(entry.screenId, entry.collection, { ...entry.query, limit, cursor })
    .then((page) => {
      // A write finished while the read ran, so the page may predate it.
      if (writesOf(entry.screenId, entry.collection) !== writes) {
        isStale = true;
        return;
      }
      entry.documents = more ? [...entry.documents, ...page.documents] : page.documents;
      entry.nextCursor = page.nextCursor;
      entry.status = 'ready';
      entry.error = null;
    })
    .catch((error) => {
      if (quiet && entry.status === 'ready') return;
      entry.status = 'error';
      entry.error = messageOf(error);
    })
    .finally(() => {
      entry.loading = null;
      if (!isStale) publishCollection(entry);
    })
    .then(() => (isStale ? loadCollection(entry, more, quiet) : undefined));
  return entry.loading;
};

const collectionEntriesOf = (screenId: string, collection: string): CollectionEntry[] =>
  [...collections.values()].filter((entry) => entry.screenId === screenId && entry.collection === collection);

/** Reload every list of a collection, coalesced so a burst of writes costs one request per list. */
const refreshCollection = (screenId: string, collection: string): void => {
  for (const entry of collectionEntriesOf(screenId, collection)) {
    if (entry.refreshTimer) clearTimeout(entry.refreshTimer);
    entry.refreshTimer = setTimeout(() => {
      entry.refreshTimer = null;
      if (entry.listeners.size > 0) void loadCollection(entry);
      else collections.delete(JSON.stringify([entry.screenId, entry.collection, entry.query]));
    }, REFRESH_DELAY_MS);
  }
};

/** A saved document shows its new data in the lists that hold it, without a reload. */
const updateListedDocument = (screenId: string, collection: string, stored: Stored): void => {
  countWrite(screenId, collection);
  for (const entry of collectionEntriesOf(screenId, collection)) {
    if (!entry.documents.some((document) => document.id === stored.id)) continue;
    entry.documents = entry.documents.map((document) => (document.id === stored.id ? stored : document));
    publishCollection(entry);
  }
};

const IDLE_COLLECTION: CollectionSnapshot = { documents: [], status: 'loading', error: null, hasMore: false };

export const useCollection: UseCollection = (collection, query) => {
  const { screen } = useScreenContext();
  const queryKey = JSON.stringify(query ?? {});
  const entry = React.useMemo(
    () => collectionEntry(screen.id, collection.name, JSON.parse(queryKey)),
    [screen.id, collection.name, queryKey]
  );
  const subscribe = React.useCallback(
    (listener: Listener) => {
      entry.listeners.add(listener);
      return () => entry.listeners.delete(listener);
    },
    [entry]
  );
  const snapshot = React.useSyncExternalStore(
    subscribe,
    () => entry.snapshot ?? IDLE_COLLECTION,
    () => IDLE_COLLECTION
  );

  // Shown from the cache at once and read again on mount, so a list never stays stale across visits.
  React.useEffect(() => {
    void loadCollection(entry);
  }, [entry]);

  return React.useMemo<CollectionHandle<any>>(
    () => ({
      documents: snapshot.documents,
      status: snapshot.status,
      error: snapshot.error,
      hasMore: snapshot.hasMore,
      loadMore: () => loadCollection(entry, true),
      refresh: () => loadCollection(entry),
      create: async (data, options) => {
        const stored = await createDocument(screen.id, collection.name, data, options?.id);
        countWrite(screen.id, collection.name);
        const cached = documentEntry(screen.id, collection.name, stored.id);
        cached.stored = stored;
        cached.status = settledStatus(cached);
        publish(cached);
        refreshCollection(screen.id, collection.name);
        return stored;
      },
      remove: async (id) => {
        await deleteDocument(screen.id, collection.name, id);
        countWrite(screen.id, collection.name);
        const cached = documents.get(documentKey(screen.id, collection.name, id));
        if (cached) void applyRemoteChange(cached, { screen: screen.id, collection: collection.name, id, revision: 0 });
        refreshCollection(screen.id, collection.name);
      },
    }),
    [entry, snapshot, screen.id, collection.name]
  );
};

let revalidatedAt = 0;

/** Reads the shown documents and lists again, at most once per {@link FOCUS_THROTTLE_MS}. */
const revalidateShown = (): void => {
  if (document.visibilityState !== 'visible' || Date.now() - revalidatedAt < FOCUS_THROTTLE_MS) return;
  revalidatedAt = Date.now();
  documents.forEach((entry) => {
    if (entry.listeners.size > 0 && isLoaded(entry)) void revalidateDocument(entry);
  });
  collections.forEach((entry) => {
    if (entry.listeners.size > 0) void loadCollection(entry, false, true);
  });
};

if (typeof window !== 'undefined') {
  // Changes from the assistant's tools: refresh the lists and documents they touched.
  onScreenChanges((changed) => {
    for (const change of changed) {
      refreshCollection(change.screen, change.collection);
      const entry = documents.get(documentKey(change.screen, change.collection, change.id));
      if (entry) void applyRemoteChange(entry, change);
    }
  });
  // Changes from MCP clients or other tabs show when the reader returns.
  window.addEventListener('focus', revalidateShown);
  document.addEventListener('visibilitychange', revalidateShown);
}
