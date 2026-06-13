// Store factory. Selects the Blob store when a Blob token is configured
// (production on Vercel), otherwise the filesystem store (local dev).
//
// Server actions import the named functions below, so the backend choice is
// invisible to callers.

import { LedgerStore } from "./types";
import { fsStore } from "./fs";
import { blobStore } from "./blob";

export * from "./types";

function pickStore(): LedgerStore {
  // Vercel injects BLOB_READ_WRITE_TOKEN when a Blob store is connected.
  return process.env.BLOB_READ_WRITE_TOKEN ? blobStore : fsStore;
}

const store = pickStore();

export const listEntities = () => store.listEntities();
export const loadEntity = (id: string) => store.loadEntity(id);
export const saveEntity = (id: string, beancount: string) =>
  store.saveEntity(id, beancount);
export const createEntity = (id: string, name: string) =>
  store.createEntity(id, name);
