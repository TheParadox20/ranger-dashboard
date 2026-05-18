import { getDb } from '@/lib/mongodb';
import { jsonError, serializeDoc, toObjectId, readJsonBody } from '@/lib/api';
import { normalizeGeojson } from '@/lib/fences';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// `context.params` is a Promise in this Next.js version — always await it.

// GET /api/fences/[id]
export async function GET(request, { params }) {
  const { id } = await params;
  const _id = toObjectId(id);
  if (!_id) return jsonError('invalid id', 400);

  try {
    const db = await getDb();
    const doc = await db.collection('fences').findOne({ _id });
    if (!doc) return jsonError('not found', 404);
    return Response.json({ data: serializeDoc(doc) });
  } catch (error) {
    console.error('GET /api/fences/[id] failed:', error);
    return jsonError('Failed to fetch fence', 500);
  }
}

// PATCH /api/fences/[id] — update routeName and/or geojson.
export async function PATCH(request, { params }) {
  const { id } = await params;
  const _id = toObjectId(id);
  if (!_id) return jsonError('invalid id', 400);

  const { body, error } = await readJsonBody(request);
  if (error) return error;

  const set = { updatedAt: new Date() };

  if (body.routeName !== undefined) {
    const routeName =
      typeof body.routeName === 'string' ? body.routeName.trim() : '';
    if (!routeName) return jsonError('routeName cannot be empty', 400);
    set.routeName = routeName;
  }

  if (body.geojson !== undefined) {
    const { geojson, error: geoError } = normalizeGeojson(body.geojson);
    if (geoError) return jsonError(geoError, 400);
    set.geojson = geojson;
  }

  if (Object.keys(set).length === 1) {
    return jsonError('no updatable fields provided', 400);
  }

  try {
    const db = await getDb();
    const doc = await db
      .collection('fences')
      .findOneAndUpdate({ _id }, { $set: set }, { returnDocument: 'after' });
    if (!doc) return jsonError('not found', 404);
    return Response.json({ data: serializeDoc(doc) });
  } catch (error) {
    console.error('PATCH /api/fences/[id] failed:', error);
    return jsonError('Failed to update fence', 500);
  }
}

// DELETE /api/fences/[id]
export async function DELETE(request, { params }) {
  const { id } = await params;
  const _id = toObjectId(id);
  if (!_id) return jsonError('invalid id', 400);

  try {
    const db = await getDb();
    const result = await db.collection('fences').deleteOne({ _id });
    if (result.deletedCount === 0) return jsonError('not found', 404);
    return Response.json({ data: { id } });
  } catch (error) {
    console.error('DELETE /api/fences/[id] failed:', error);
    return jsonError('Failed to delete fence', 500);
  }
}
