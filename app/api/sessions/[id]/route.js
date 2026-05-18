import { getDb } from '@/lib/mongodb';
import { jsonError, serializeDoc, toObjectId, readJsonBody } from '@/lib/api';
import { SESSION_STATUSES, parseUsers } from '@/lib/sessions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// In this Next.js version, `context.params` is a Promise (see
// node_modules/next/dist/docs/.../route.md). Always await it.

// GET /api/sessions/[id]
export async function GET(request, { params }) {
  const { id } = await params;
  const _id = toObjectId(id);
  if (!_id) return jsonError('invalid id', 400);

  try {
    const db = await getDb();
    const doc = await db.collection('sessions').findOne({ _id });
    if (!doc) return jsonError('not found', 404);
    return Response.json({ data: serializeDoc(doc) });
  } catch (error) {
    console.error('GET /api/sessions/[id] failed:', error);
    return jsonError('Failed to fetch session', 500);
  }
}

// PATCH /api/sessions/[id] — partial update of name/status/fenceId/users.
export async function PATCH(request, { params }) {
  const { id } = await params;
  const _id = toObjectId(id);
  if (!_id) return jsonError('invalid id', 400);

  const { body, error } = await readJsonBody(request);
  if (error) return error;

  const set = { updatedAt: new Date() };

  if (body.name !== undefined) {
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name) return jsonError('name cannot be empty', 400);
    set.name = name;
  }

  if (body.status !== undefined) {
    if (!SESSION_STATUSES.includes(body.status)) {
      return jsonError(`status must be one of ${SESSION_STATUSES.join(', ')}`, 400);
    }
    set.status = body.status;
    if (body.status === 'ended') {
      set.endedAt = new Date();
    } else {
      set.startedAt = new Date();
      set.endedAt = null;
    }
  }

  if (body.fenceId !== undefined) {
    if (body.fenceId == null || body.fenceId === '') {
      set.fenceId = null;
    } else {
      const fenceId = toObjectId(body.fenceId);
      if (!fenceId) return jsonError('fenceId is not a valid id', 400);
      set.fenceId = fenceId;
    }
  }

  if (body.users !== undefined) {
    const parsed = parseUsers(body.users);
    if (parsed.error) return jsonError(parsed.error, 400);
    set.users = parsed.users;
  }

  if (Object.keys(set).length === 1) {
    return jsonError('no updatable fields provided', 400);
  }

  try {
    const db = await getDb();
    const doc = await db
      .collection('sessions')
      .findOneAndUpdate({ _id }, { $set: set }, { returnDocument: 'after' });
    if (!doc) return jsonError('not found', 404);
    return Response.json({ data: serializeDoc(doc) });
  } catch (error) {
    console.error('PATCH /api/sessions/[id] failed:', error);
    return jsonError('Failed to update session', 500);
  }
}

// DELETE /api/sessions/[id]
export async function DELETE(request, { params }) {
  const { id } = await params;
  const _id = toObjectId(id);
  if (!_id) return jsonError('invalid id', 400);

  try {
    const db = await getDb();
    const result = await db.collection('sessions').deleteOne({ _id });
    if (result.deletedCount === 0) return jsonError('not found', 404);
    return Response.json({ data: { id } });
  } catch (error) {
    console.error('DELETE /api/sessions/[id] failed:', error);
    return jsonError('Failed to delete session', 500);
  }
}
