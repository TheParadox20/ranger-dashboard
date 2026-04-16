'use client';

import { useState } from 'react';
import { Phone, Plus, Pencil, Trash2, Star, UserX } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog } from './ui/dialog';
import { cn } from '@/lib/utils';

function ContactForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial ?? { name: '', relation: '', phone: '', primary: false });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="c-name">Full Name</Label>
        <Input id="c-name" placeholder="e.g. Grace Kariuki" value={form.name} onChange={e => set('name', e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="c-relation">Relation</Label>
        <Input id="c-relation" placeholder="e.g. Spouse, Doctor" value={form.relation} onChange={e => set('relation', e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="c-phone">Phone Number</Label>
        <Input id="c-phone" placeholder="+254 7XX XXX XXX" value={form.phone} onChange={e => set('phone', e.target.value)} />
      </div>
      <label className="flex items-center gap-2.5 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={form.primary}
          onChange={e => set('primary', e.target.checked)}
          className="w-4 h-4 accent-green-500 rounded"
        />
        <span className="text-xs text-secondary">Primary contact (call first)</span>
      </label>
      <div className="flex gap-2 pt-2">
        <Button variant="outline" className="flex-1" onClick={onCancel}>Cancel</Button>
        <Button
          className="flex-1 bg-accent text-white hover:bg-accent-bright"
          onClick={() => onSave(form)}
          disabled={!form.name || !form.phone}
        >
          Save Contact
        </Button>
      </div>
    </div>
  );
}

export default function EmergencyContactsPanel({ hiker, onContactsChange }) {
  const [addOpen,  setAddOpen]  = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  if (!hiker) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted text-sm">Select a hiker to manage contacts</p>
      </div>
    );
  }

  const contacts = hiker.emergencyContacts;

  const handleAdd = (form) => {
    const newContacts = [...contacts, { ...form, id: Date.now() }];
    onContactsChange(hiker.id, newContacts);
    setAddOpen(false);
  };

  const handleEdit = (form) => {
    const newContacts = contacts.map(c => c.id === editTarget.id ? { ...c, ...form } : c);
    onContactsChange(hiker.id, newContacts);
    setEditOpen(false);
    setEditTarget(null);
  };

  const handleDelete = (id) => {
    onContactsChange(hiker.id, contacts.filter(c => c.id !== id));
  };

  const openEdit = (contact) => {
    setEditTarget(contact);
    setEditOpen(true);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-3 pt-3 pb-2 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted font-mono uppercase tracking-widest">Emergency Contacts</p>
          <p className="text-sm font-medium text-primary mt-0.5">{hiker.name}</p>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)} className="gap-1.5 bg-accent/20 text-accent-bright border border-accent/40 hover:bg-accent/30">
          <Plus size={13} />
          Add
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
        {contacts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <div className="w-12 h-12 rounded-full bg-panel border border-border flex items-center justify-center">
              <UserX size={20} className="text-muted" />
            </div>
            <p className="text-muted text-xs text-center">No emergency contacts.<br/>Add one to get started.</p>
          </div>
        )}

        {contacts.map((contact, i) => (
          <div
            key={contact.id}
            className={cn(
              'rounded-lg border p-3 bg-panel transition-colors',
              contact.primary ? 'border-accent/40' : 'border-border',
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2.5 min-w-0">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold font-display',
                  contact.primary ? 'bg-accent/20 text-accent-bright border border-accent/40' : 'bg-elevated text-secondary border border-border',
                )}>
                  {contact.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-primary truncate">{contact.name}</span>
                    {contact.primary && (
                      <Star size={11} className="text-accent-bright fill-current flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-muted mt-0.5">{contact.relation}</p>
                  <a
                    href={`tel:${contact.phone}`}
                    className="flex items-center gap-1 text-[11px] font-mono text-secondary hover:text-accent-bright transition-colors mt-1"
                  >
                    <Phone size={10} />
                    {contact.phone}
                  </a>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-1 flex-shrink-0">
                <Button variant="ghost" size="icon-sm" onClick={() => openEdit(contact)}>
                  <Pencil size={12} />
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(contact.id)}
                  className="text-muted hover:text-danger">
                  <Trash2 size={12} />
                </Button>
              </div>
            </div>

            {/* Call button */}
            <a
              href={`tel:${contact.phone}`}
              className={cn(
                'mt-2.5 flex items-center justify-center gap-2 w-full py-1.5 rounded text-xs font-semibold transition-colors',
                contact.primary
                  ? 'bg-active/15 text-active border border-active/30 hover:bg-active/25'
                  : 'bg-elevated text-secondary border border-border hover:bg-border-light',
              )}
            >
              <Phone size={11} />
              Call {contact.name.split(' ')[0]}
            </a>
          </div>
        ))}
      </div>

      {/* Add modal */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} title="Add Contact">
        <ContactForm onSave={handleAdd} onCancel={() => setAddOpen(false)} />
      </Dialog>

      {/* Edit modal */}
      <Dialog open={editOpen} onClose={() => { setEditOpen(false); setEditTarget(null); }} title="Edit Contact">
        {editTarget && (
          <ContactForm
            initial={editTarget}
            onSave={handleEdit}
            onCancel={() => { setEditOpen(false); setEditTarget(null); }}
          />
        )}
      </Dialog>
    </div>
  );
}
