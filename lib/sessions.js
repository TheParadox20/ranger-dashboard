import { ObjectId } from 'mongodb';
import { toObjectId } from '@/lib/api';

export const SESSION_STATUSES = ['active', 'ended'];

function str(value) {
  return typeof value === 'string' ? value.trim() : '';
}

// Validate + normalize an emergencyContact sub-document. Returns
// { contact } or { error } (a message string). A null/absent contact is OK.
function parseEmergencyContact(input) {
  if (input == null) return { contact: null };
  if (typeof input !== 'object' || Array.isArray(input)) {
    return { error: 'emergencyContact must be an object' };
  }
  const name = str(input.name);
  const phone = str(input.phone);
  if (!name || !phone) {
    return { error: 'emergencyContact requires name and phone' };
  }
  return {
    contact: { name, relationship: str(input.relationship), phone },
  };
}

// Validate + normalize the session `users` array. Each user gets a stable
// server-side `_id` (preserved from an incoming `id` when valid, else new).
// Returns { users } or { error }.
export function parseUsers(input) {
  if (input == null) return { users: [] };
  if (!Array.isArray(input)) return { error: 'users must be an array' };

  const users = [];
  for (let i = 0; i < input.length; i += 1) {
    const u = input[i];
    if (u == null || typeof u !== 'object' || Array.isArray(u)) {
      return { error: `users[${i}] must be an object` };
    }

    const name = str(u.name);
    if (!name) return { error: `users[${i}].name is required` };

    const deviceId = str(u.deviceId);
    if (!deviceId) return { error: `users[${i}].deviceId is required` };

    const { contact, error } = parseEmergencyContact(u.emergencyContact);
    if (error) return { error: `users[${i}].${error}` };

    users.push({
      _id: toObjectId(u.id) ?? new ObjectId(),
      name,
      bloodGroup: str(u.bloodGroup),
      deviceId,
      emergencyContact: contact,
    });
  }
  return { users };
}
