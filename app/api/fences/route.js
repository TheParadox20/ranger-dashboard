import { getDb } from '@/lib/mongodb';
import { jsonError, serializeDoc, readJsonBody } from '@/lib/api';
import { normalizeGeojson } from '@/lib/fences';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/fences — list routes/geofences, newest first.
export async function GET() {
  try {
    const db = await getDb();
    const docs = await db
      .collection('fences')
      .find({})
      .sort({ createdAt: -1, _id: -1 })
      .toArray();

    const data = docs.map(serializeDoc);
    return Response.json({ count: data.length, data });
  } catch (error) {
    console.error('GET /api/fences failed:', error);
    return jsonError('Failed to fetch fences', 500);
  }
}

// POST /api/fences — create a route. Body: { routeName, geojson }
export async function POST(request) {
  const { body, error } = await readJsonBody(request);
  if (error) return error;

  const routeName = typeof body.routeName === 'string' ? body.routeName.trim() : '';
  if (!routeName) return jsonError('routeName is required', 400);

  const { geojson, error: geoError } = normalizeGeojson(body.geojson);
  if (geoError) return jsonError(geoError, 400);

  const now = new Date();
  const doc = { routeName, geojson, createdAt: now, updatedAt: now };

  try {
    const db = await getDb();
    const result = await db.collection('fences').insertOne(doc);
    return Response.json(
      { data: serializeDoc({ ...doc, _id: result.insertedId }) },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/fences failed:', error);
    return jsonError('Failed to create fence', 500);
  }
}
