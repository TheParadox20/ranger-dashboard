'use client';

import { useState } from 'react';
import { Phone, Pencil, UserX, Plus, Droplet } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog } from './ui/dialog';

function ContactForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(
    initial ?? { name: '', relationship: '', phone: '' },
  );
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const save = async () => {
    setBusy(true);
    setErr(null);
    try {
      await onSave({
        name: form.name.trim(),
        relationship: form.relationship.trim(),
        phone: form.phone.trim(),
      });
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="c-name">Full Name</Label>
        <Input
          id="c-name"
          placeholder="e.g. Grace Kariuki"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="c-relationship">Relationship</Label>
        <Input
          id="c-relationship"
          placeholder="e.g. Spouse, Doctor"
          value={form.relationship}
          onChange={(e) => set('relationship', e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="c-phone">Phone Number</Label>
        <Input
          id="c-phone"
          placeholder="+254 7XX XXX XXX"
          value={form.phone}
          onChange={(e) => set('phone', e.target.value)}
        />
      </div>
      {err && (
        <p className="text-xs text-danger bg-danger/10 border border-danger/30 rounded px-3 py-2">
          {err}
        </p>
      )}
      <div className="flex gap-2 pt-2">
        <Button variant="outline" className="flex-1" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button
          className="flex-1"
          onClick={save}
          disabled={!form.name.trim() || !form.phone.trim() || busy}
        >
          {busy ? 'Saving…' : 'Save Contact'}
        </Button>
      </div>
    </div>
  );
}

// `onSave(contact)` persists the single emergency contact (handled by the
// dashboard via PATCH /api/sessions/[id]).
export default function EmergencyContactsPanel({ hiker, onSave }) {
  const [open, setOpen] = useState(false);

  if (!hiker) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted text-sm">Select a hiker to view contact</p>
      </div>
    );
  }

  const contact = hiker.emergencyContact || null;

  const handleSave = async (next) => {
    await onSave(next);
    setOpen(false);
  };

  const initials = (contact?.name || '?')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-3 pt-3 pb-2 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted font-mono uppercase tracking-widest">
            Emergency Contact
          </p>
          <p className="text-sm font-medium text-primary mt-0.5">{hiker.name}</p>
        </div>
        <Button
          size="sm"
          onClick={() => setOpen(true)}
          className="gap-1.5 bg-accent/20 text-accent-bright border border-accent/40 hover:bg-accent/30"
        >
          {contact ? <Pencil size={13} /> : <Plus size={13} />}
          {contact ? 'Edit' : 'Add'}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-panel border border-border text-xs">
          <Droplet size={12} className="text-danger" />
          <span className="text-muted font-mono uppercase tracking-widest text-[10px]">
            Blood group
          </span>
          <span className="text-primary font-semibold ml-auto">
            {hiker.bloodGroup || '—'}
          </span>
        </div>

        {!contact && (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <div className="w-12 h-12 rounded-full bg-panel border border-border flex items-center justify-center">
              <UserX size={20} className="text-muted" />
            </div>
            <p className="text-muted text-xs text-center">
              No emergency contact.
              <br />
              Add one to get started.
            </p>
          </div>
        )}

        {contact && (
          <div className="rounded-lg border border-accent/40 p-3 bg-panel">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold font-display bg-accent/20 text-accent-bright border border-accent/40">
                {initials}
              </div>
              <div className="min-w-0">
                <span className="text-sm font-medium text-primary truncate block">
                  {contact.name}
                </span>
                {contact.relationship && (
                  <p className="text-[11px] text-muted mt-0.5">
                    {contact.relationship}
                  </p>
                )}
                <a
                  href={`tel:${contact.phone}`}
                  className="flex items-center gap-1 text-[11px] font-mono text-secondary hover:text-accent-bright transition-colors mt-1"
                >
                  <Phone size={10} />
                  {contact.phone}
                </a>
              </div>
            </div>
            <a
              href={`tel:${contact.phone}`}
              className="mt-2.5 flex items-center justify-center gap-2 w-full py-1.5 rounded text-xs font-semibold bg-active/15 text-active border border-active/30 hover:bg-active/25 transition-colors"
            >
              <Phone size={11} />
              Call {contact.name.split(' ')[0]}
            </a>
          </div>
        )}
      </div>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={contact ? 'Edit Contact' : 'Add Contact'}
      >
        <ContactForm
          initial={contact ?? undefined}
          onSave={handleSave}
          onCancel={() => setOpen(false)}
        />
      </Dialog>
    </div>
  );
}
