import { ObjectId } from 'mongodb';

// Shared helpers for the MongoDB-backed Route Handlers (data, sessions, fences).

// Standard error response. Mirrors the shape used across all API routes.
export function jsonError(message, status) {
  return Response.json({ error: message }, { status });
}

// Validate a path/query id and return an ObjectId, or null if malformed.
export function toObjectId(id) {
  if (typeof id !== 'string' || !ObjectId.isValid(id)) return null;
  return new ObjectId(id);
}

// Recursively convert a Mongo document to a JSON-friendly client shape:
//  - ObjectId  -> string
//  - Date      -> ISO string
//  - the `_id` key is renamed to `id`
// Plain data (e.g. GeoJSON) passes through untouched since it carries no
// ObjectId/Date/`_id`.
export function serializeDoc(value) {
  if (value == null) return value;

  if (value instanceof ObjectId) return value.toString();
  if (value instanceof Date) return value.toISOString();

  if (Array.isArray(value)) return value.map(serializeDoc);

  if (typeof value === 'object') {
    const out = {};
    for (const [key, val] of Object.entries(value)) {
      out[key === '_id' ? 'id' : key] = serializeDoc(val);
    }
    return out;
  }

  return value;
}

// Safely parse a JSON request body. Returns { body } on success or
// { error: Response } when the body is missing/invalid so callers can
// `if (error) return error;`.
export async function readJsonBody(request) {
  try {
    const body = await request.json();
    if (body == null || typeof body !== 'object' || Array.isArray(body)) {
      return { error: jsonError('Request body must be a JSON object', 400) };
    }
    return { body };
  } catch {
    return { error: jsonError('Invalid JSON in request body', 400) };
  }
}
