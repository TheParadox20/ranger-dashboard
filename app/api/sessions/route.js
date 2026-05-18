import { getDb } from '@/lib/mongodb';
import { jsonError, serializeDoc, toObjectId, readJsonBody } from '@/lib/api';
import { SESSION_STATUSES, parseUsers } from '@/lib/sessions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/sessions — list hiking sessions, newest first.
// Query params (optional): status=active|ended
export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const query = {};
  const status = searchParams.get('status');
  if (status !== null) {
    if (!SESSION_STATUSES.includes(status)) {
      return jsonError(`status must be one of ${SESSION_STATUSES.join(', ')}`, 400);
    }
    query.status = status;
  }

  try {
    const db = await getDb();
    const docs = await db
      .collection('sessions')
      .find(query)
      .sort({ createdAt: -1, _id: -1 })
      .toArray();

    const data = docs.map(serializeDoc);
    return Response.json({ count: data.length, data });
  } catch (error) {
    console.error('GET /api/sessions failed:', error);
    return jsonError('Failed to fetch sessions', 500);
  }
}

// POST /api/sessions — create a session.
// Body: { name, status?, fenceId?, users? }
export async function POST(request) {
  const { body, error } = await readJsonBody(request);
  if (error) return error;

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name) return jsonError('name is required', 400);

  const status = body.status ?? 'active';
  if (!SESSION_STATUSES.includes(status)) {
    return jsonError(`status must be one of ${SESSION_STATUSES.join(', ')}`, 400);
  }

  let fenceId = null;
  if (body.fenceId != null && body.fenceId !== '') {
    fenceId = toObjectId(body.fenceId);
    if (!fenceId) return jsonError('fenceId is not a valid id', 400);
  }

  const parsed = parseUsers(body.users);
  if (parsed.error) return jsonError(parsed.error, 400);

  const now = new Date();
  const doc = {
    name,
    status,
    fenceId,
    startedAt: status === 'active' ? now : null,
    endedAt: status === 'ended' ? now : null,
    users: parsed.users,
    createdAt: now,
    updatedAt: now,
  };

  try {
    const db = await getDb();
    const result = await db.collection('sessions').insertOne(doc);
    return Response.json(
      { data: serializeDoc({ ...doc, _id: result.insertedId }) },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/sessions failed:', error);
    return jsonError('Failed to create session', 500);
  }
}
