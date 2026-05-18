'use client';

import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Play, Square, Users, MapPin, AlertTriangle } from 'lucide-react';
import ManageNav from '@/components/ManageNav';
import useSessions from '@/hooks/useSessions';
import useFences from '@/hooks/useFences';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const BLOOD_GROUPS = ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const selectCls =
  'w-full h-10 px-3 rounded bg-elevated border border-border text-primary text-sm outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/20 transition-colors';

function emptyUser() {
  return {
    name: '',
    deviceId: '',
    bloodGroup: '',
    ec_name: '',
    ec_relationship: '',
    ec_phone: '',
  };
}

// Flatten a session user (with nested emergencyContact) into flat form fields.
function toFormUser(u) {
  return {
    id: u.id,
    name: u.name ?? '',
    deviceId: u.deviceId ?? '',
    bloodGroup: u.bloodGroup ?? '',
    ec_name: u.emergencyContact?.name ?? '',
    ec_relationship: u.emergencyContact?.relationship ?? '',
    ec_phone: u.emergencyContact?.phone ?? '',
  };
}

// Build the API payload from form state.
function toPayload(form) {
  return {
    name: form.name.trim(),
    status: form.status,
    fenceId: form.fenceId || null,
    users: form.users.map((u) => {
      const hasContact = u.ec_name.trim() && u.ec_phone.trim();
      return {
        ...(u.id ? { id: u.id } : {}),
        name: u.name.trim(),
        deviceId: u.deviceId.trim(),
        bloodGroup: u.bloodGroup,
        emergencyContact: hasContact
          ? {
              name: u.ec_name.trim(),
              relationship: u.ec_relationship.trim(),
              phone: u.ec_phone.trim(),
            }
          : null,
      };
    }),
  };
}

function SessionForm({ initial, fences, onSave, onCancel }) {
  const [form, setForm] = useState(
    initial ?? { name: '', status: 'active', fenceId: '', users: [emptyUser()] },
  );
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const setUser = (i, k, v) =>
    setForm((p) => ({
      ...p,
      users: p.users.map((u, idx) => (idx === i ? { ...u, [k]: v } : u)),
    }));
  const addUser = () => setForm((p) => ({ ...p, users: [...p.users, emptyUser()] }));
  const removeUser = (i) =>
    setForm((p) => ({ ...p, users: p.users.filter((_, idx) => idx !== i) }));

  const valid =
    form.name.trim() &&
    form.users.length > 0 &&
    form.users.every((u) => u.name.trim() && u.deviceId.trim());

  const save = async () => {
    setBusy(true);
    setErr(null);
    try {
      await onSave(toPayload(form));
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <div className="space-y-1.5">
        <Label htmlFor="s-name">Session Name</Label>
        <Input
          id="s-name"
          placeholder="e.g. Aberdare Traverse"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="s-status">Status</Label>
          <select
            id="s-status"
            className={selectCls}
            value={form.status}
            onChange={(e) => set('status', e.target.value)}
          >
            <option value="active">Active</option>
            <option value="ended">Ended</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="s-fence">Assigned Route</Label>
          <select
            id="s-fence"
            className={selectCls}
            value={form.fenceId}
            onChange={(e) => set('fenceId', e.target.value)}
          >
            <option value="">— None —</option>
            {fences.map((f) => (
              <option key={f.id} value={f.id}>
                {f.routeName}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Users ({form.users.length})</Label>
          <Button size="sm" variant="dim" onClick={addUser} className="gap-1.5">
            <Plus size={12} />
            Add User
          </Button>
        </div>

        {form.users.map((u, i) => (
          <div key={i} className="rounded-lg border border-border bg-panel p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-muted uppercase tracking-widest">
                User {i + 1}
              </span>
              {form.users.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeUser(i)}
                  className="text-muted hover:text-danger"
                >
                  <Trash2 size={12} />
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Full name *"
                value={u.name}
                onChange={(e) => setUser(i, 'name', e.target.value)}
              />
              <Input
                placeholder="Device ID *"
                value={u.deviceId}
                onChange={(e) => setUser(i, 'deviceId', e.target.value)}
              />
            </div>
            <select
              className={selectCls}
              value={u.bloodGroup}
              onChange={(e) => setUser(i, 'bloodGroup', e.target.value)}
            >
              {BLOOD_GROUPS.map((g) => (
                <option key={g || 'none'} value={g}>
                  {g ? `Blood group ${g}` : 'Blood group —'}
                </option>
              ))}
            </select>
            <div className="pt-1 border-t border-border/60">
              <p className="text-[10px] font-mono text-muted uppercase tracking-widest mt-2 mb-1.5">
                Emergency contact
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Contact name"
                  value={u.ec_name}
                  onChange={(e) => setUser(i, 'ec_name', e.target.value)}
                />
                <Input
                  placeholder="Relationship"
                  value={u.ec_relationship}
                  onChange={(e) => setUser(i, 'ec_relationship', e.target.value)}
                />
              </div>
              <Input
                className="mt-2"
                placeholder="Phone"
                value={u.ec_phone}
                onChange={(e) => setUser(i, 'ec_phone', e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>

      {err && (
        <div className="flex items-center gap-2 text-xs text-danger bg-danger/10 border border-danger/30 rounded px-3 py-2">
          <AlertTriangle size={13} />
          {err}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <Button variant="outline" className="flex-1" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button className="flex-1" onClick={save} disabled={!valid || busy}>
          {busy ? 'Saving…' : 'Save Session'}
        </Button>
      </div>
    </div>
  );
}

export default function SessionsPage() {
  const { sessions, loading, error, createSession, updateSession, deleteSession } =
    useSessions();
  const { fences } = useFences();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  const fenceName = useMemo(() => {
    const map = {};
    fences.forEach((f) => {
      map[f.id] = f.routeName;
    });
    return map;
  }, [fences]);

  const handleCreate = async (payload) => {
    await createSession(payload);
    setCreateOpen(false);
  };

  const handleEdit = async (payload) => {
    await updateSession(editTarget.id, payload);
    setEditTarget(null);
  };

  const toggleStatus = (s) =>
    updateSession(s.id, { status: s.status === 'active' ? 'ended' : 'active' });

  const handleDelete = (s) => {
    if (window.confirm(`Delete session "${s.name}"? This cannot be undone.`)) {
      deleteSession(s.id);
    }
  };

  const editInitial = editTarget && {
    name: editTarget.name,
    status: editTarget.status,
    fenceId: editTarget.fenceId ?? '',
    users:
      editTarget.users.length > 0
        ? editTarget.users.map(toFormUser)
        : [emptyUser()],
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-base">
      <ManageNav />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-display font-bold text-xl uppercase tracking-widest text-primary">
                Hiking Sessions
              </h1>
              <p className="text-sm text-muted mt-1">
                Manage sessions, their users, and the assigned route.
              </p>
            </div>
            <Button onClick={() => setCreateOpen(true)} className="gap-2">
              <Plus size={15} />
              New Session
            </Button>
          </div>

          {loading && (
            <p className="text-muted text-sm py-12 text-center">Loading sessions…</p>
          )}

          {error && (
            <div className="flex items-center gap-2 text-sm text-danger bg-danger/10 border border-danger/30 rounded-lg px-4 py-3">
              <AlertTriangle size={15} />
              {error}
            </div>
          )}

          {!loading && !error && sessions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <div className="w-14 h-14 rounded-full bg-panel border border-border flex items-center justify-center">
                <Users size={24} className="text-muted" />
              </div>
              <div>
                <p className="text-primary font-medium">No sessions yet</p>
                <p className="text-muted text-sm mt-1">
                  Create a session to start tracking hikers.
                </p>
              </div>
              <Button onClick={() => setCreateOpen(true)} className="gap-2">
                <Plus size={15} />
                New Session
              </Button>
            </div>
          )}

          <div className="space-y-3">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="rounded-lg border border-border bg-surface p-4 flex items-start justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5">
                    <span className="text-base font-semibold text-primary truncate">
                      {s.name}
                    </span>
                    <Badge variant={s.status === 'active' ? 'active' : 'offline'}>
                      {s.status}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-muted font-mono">
                    <span className="flex items-center gap-1.5">
                      <Users size={12} />
                      {s.users.length} user{s.users.length === 1 ? '' : 's'}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin size={12} />
                      {s.fenceId ? fenceName[s.fenceId] ?? 'Unknown route' : 'No route'}
                    </span>
                    {s.startedAt && (
                      <span>
                        Started {new Date(s.startedAt).toLocaleString('en-KE')}
                      </span>
                    )}
                    {s.endedAt && (
                      <span>Ended {new Date(s.endedAt).toLocaleString('en-KE')}</span>
                    )}
                  </div>
                  {s.users.length > 0 && (
                    <p className="text-[11px] text-secondary mt-2 truncate">
                      {s.users.map((u) => `${u.name} (${u.deviceId})`).join(' · ')}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Button
                    variant="dim"
                    size="sm"
                    onClick={() => toggleStatus(s)}
                    className="gap-1.5"
                  >
                    {s.status === 'active' ? (
                      <>
                        <Square size={12} /> End
                      </>
                    ) : (
                      <>
                        <Play size={12} /> Reopen
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setEditTarget(s)}
                  >
                    <Pencil size={13} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleDelete(s)}
                    className="text-muted hover:text-danger"
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New Session"
        className="max-w-2xl"
      >
        <SessionForm
          fences={fences}
          onSave={handleCreate}
          onCancel={() => setCreateOpen(false)}
        />
      </Dialog>

      <Dialog
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Edit Session"
        className="max-w-2xl"
      >
        {editTarget && (
          <SessionForm
            initial={editInitial}
            fences={fences}
            onSave={handleEdit}
            onCancel={() => setEditTarget(null)}
          />
        )}
      </Dialog>
    </div>
  );
}
