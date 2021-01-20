import {
  Resolver,
  DIDDocument,
  inMemoryCache,
  DIDCache,
  ParsedDID,
  WrappedResolver,
} from 'did-resolver';
import { DID, DIDResolver } from '@/api/DID';
import { AgentStorage } from '@/service/storage/AgentStorage';
import { get, makeDummyDocument } from '@/service/did/resolver/StubCache';

const STORAGE_FOLDER = 'dids';

const registry = {
  dummy: async (did: string | DID) => makeDummyDocument(did as DID),
  civic: async (did: string | DID) => get(did as DID),
};

const wrapStorage = (storage: AgentStorage): DIDCache => async (
  parsed: ParsedDID,
  resolve: WrappedResolver
) => {
  if (parsed.params && parsed.params['no-cache'] === 'true') return resolve();

  const storageKey = [STORAGE_FOLDER, parsed.did];
  const cached = (await storage.get(storageKey)) as DIDDocument;
  if (cached) return cached;
  const doc = await resolve();
  if (doc) {
    await storage.put(storageKey, doc);
  }
  return doc;
};

export const defaultDIDResolver = (storage?: AgentStorage): DIDResolver => {
  const cache = storage ? wrapStorage(storage) : inMemoryCache();
  const resolver = new Resolver(registry, cache);
  return (did: DID) => resolver.resolve(did);
};
