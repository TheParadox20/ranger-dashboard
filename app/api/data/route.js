import { getDb } from '@/lib/mongodb';
import { jsonError } from '@/lib/api';

// The mongodb driver needs the Node.js runtime, and sensor data must never be
// served stale, so this route is always rendered at request time.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_LIMIT = 250;
const MAX_LIMIT = 1000;

// GET /api/data — pull telemetry from the "data" collection.
//
// Query params (all optional):
//   limit      number  max docs to return (default 250, capped at 1000)
//   order      asc|desc sort by receivedAt (default desc — newest first)
//   since      ISO date only docs with receivedAt >= since
//   sinceSeq   number   only docs with seq > sinceSeq (incremental polling)
//   type       string   filter by payload type (e.g. "data")
//   device_id  string   filter by device. Repeat the param or pass a
//                        comma-separated list to match multiple devices,
//                        e.g. ?device_id=A&device_id=B or ?device_id=A,B
export async function GET(request) {
  const { searchParams } = new URL(request.url);

  let limit = DEFAULT_LIMIT;
  const limitParam = searchParams.get('limit');
  if (limitParam !== null) {
    limit = Number(limitParam);
    if (!Number.isFinite(limit) || limit < 1) {
      return jsonError('limit must be a positive number', 400);
    }
    limit = Math.min(Math.floor(limit), MAX_LIMIT);
  }

  const order = (searchParams.get('order') || 'desc').toLowerCase();
  if (order !== 'asc' && order !== 'desc') {
    return jsonError("order must be 'asc' or 'desc'", 400);
  }
  const sortDir = order === 'asc' ? 1 : -1;

  const query = {};

  const since = searchParams.get('since');
  if (since !== null) {
    const sinceDate = new Date(since);
    if (Number.isNaN(sinceDate.getTime())) {
      return jsonError('since must be a valid date', 400);
    }
    query.receivedAt = { $gte: sinceDate };
  }

  const sinceSeq = searchParams.get('sinceSeq');
  if (sinceSeq !== null) {
    const seq = Number(sinceSeq);
    if (!Number.isFinite(seq)) {
      return jsonError('sinceSeq must be a number', 400);
    }
    query.seq = { $gt: seq };
  }

  const type = searchParams.get('type');
  if (type !== null) {
    query.type = type;
  }

  // Accept repeated params (?device_id=A&device_id=B) and/or comma-separated
  // values (?device_id=A,B), so several devices can be queried at once.
  const deviceIds = searchParams
    .getAll('device_id')
    .flatMap((value) => value.split(','))
    .map((value) => value.trim())
    .filter(Boolean);
  if (deviceIds.length > 0) {
    query.device_id =
      deviceIds.length === 1 ? deviceIds[0] : { $in: deviceIds };
  }

  try {
    const db = await getDb();
    const docs = await db
      .collection('data')
      .find(query)
      .sort({ receivedAt: sortDir, _id: sortDir })
      .limit(limit)
      .toArray();

    // Normalize to the same camelCase shape the WebSocket hook emits, so the
    // dashboard can consume live and historical data interchangeably.
    const data = docs.map((d) => ({
      id: d._id?.toString(),
      deviceId: d.device_id,
      type: d.type,
      seq: d.seq,
      ts: d.ts,
      gsr: d.gsr,
      temp: d.temp,
      skin: d.skin,
      ir: d.ir,
      bpm: d.bpm,
      spo2: d.spo2,
      spo2Valid: d.spo2_valid === 1,
      noFinger: d.no_finger === 1,
      lat: d.lat,
      lon: d.lon,
      rssi: d.rssi,
      snr: d.snr,
      receivedAt:
        d.receivedAt instanceof Date ? d.receivedAt.toISOString() : d.receivedAt,
    }));

    return Response.json({ count: data.length, data });
  } catch (error) {
    console.error('GET /api/data failed:', error);
    return jsonError('Failed to fetch data', 500);
  }
}
