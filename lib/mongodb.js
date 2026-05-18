import { MongoClient } from 'mongodb';

// Reuse a single MongoClient across requests. In development, the module is
// re-evaluated on every hot reload, so the promise is cached on globalThis to
// avoid exhausting connections.

let cachedPromise;

function getClientPromise() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set. Add it to .env');
  }

  if (process.env.NODE_ENV === 'development') {
    if (!globalThis._mongoClientPromise) {
      globalThis._mongoClientPromise = new MongoClient(uri).connect();
    }
    return globalThis._mongoClientPromise;
  }

  if (!cachedPromise) {
    cachedPromise = new MongoClient(uri).connect();
  }
  return cachedPromise;
}

// Returns the database named in the connection string (e.g. "ranger").
export async function getDb() {
  const client = await getClientPromise();
  return client.db();
}
