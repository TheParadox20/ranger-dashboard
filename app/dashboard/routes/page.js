'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Pencil, Trash2, Map as MapIcon, AlertTriangle, Check, X } from 'lucide-react';
import ManageNav from '@/components/ManageNav';
import useFences from '@/hooks/useFences';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const FenceDrawMap = dynamic(() => import('@/components/FenceDrawMap'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-base">
      <div className="w-8 h-8 border-2 border-accent/40 border-t-accent-bright rounded-full animate-spin" />
    </div>
  ),
});

export default function RoutesPage() {
  const { fences, loading, error, createFence, updateFence, deleteFence } =
    useFences();

  const [editingId, setEditingId] = useState(null); // null = creating new
  const [routeName, setRouteName] = useState('');
  const [feature, setFeature] = useState(null);
  const [busy, setBusy] = useState(false);
  const [formErr, setFormErr] = useState(null);

  const isEditing = editingId !== null;

  const reset = () => {
    setEditingId(null);
    setRouteName('');
    setFeature(null);
    setFormErr(null);
  };

  const startEdit = (fence) => {
    setEditingId(fence.id);
    setRouteName(fence.routeName);
    setFeature(fence.geojson);
    setFormErr(null);
  };

  const save = async () => {
    setBusy(true);
    setFormErr(null);
    try {
      const payload = { routeName: routeName.trim(), geojson: feature };
      if (isEditing) await updateFence(editingId, payload);
      else await createFence(payload);
      reset();
    } catch (e) {
      setFormErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = (fence) => {
    if (window.confirm(`Delete route "${fence.routeName}"?`)) {
      if (fence.id === editingId) reset();
      deleteFence(fence.id);
    }
  };

  const canSave = routeName.trim() && feature && !busy;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-base">
      <ManageNav />

      <div className="flex flex-1 overflow-hidden">
        {/* Map (direct flex child — mirrors the dashboard HikerMap layout) */}
        <FenceDrawMap
          fences={fences}
          editingFenceId={editingId}
          onChange={setFeature}
          hint={
            isEditing
              ? 'Editing route — adjust the polygon, then Save'
              : 'Use the polygon tool (top-left) to draw a route'
          }
        />

        {/* Side panel */}
        <aside className="w-80 shrink-0 flex flex-col bg-surface border-l border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="font-display font-bold text-sm uppercase tracking-widest text-primary">
              {isEditing ? 'Edit Route' : 'New Route'}
            </h2>
          </div>

          <div className="p-4 space-y-3 border-b border-border">
            <div className="space-y-1.5">
              <Label htmlFor="r-name">Route Name</Label>
              <Input
                id="r-name"
                placeholder="e.g. Aberdare Traverse"
                value={routeName}
                onChange={(e) => setRouteName(e.target.value)}
              />
            </div>

            <div
              className={cn(
                'text-xs rounded px-3 py-2 border',
                feature
                  ? 'text-active bg-active/10 border-active/30'
                  : 'text-muted bg-panel border-border',
              )}
            >
              {feature
                ? 'Polygon captured ✓'
                : 'No polygon yet — draw one on the map'}
            </div>

            {formErr && (
              <div className="flex items-center gap-2 text-xs text-danger bg-danger/10 border border-danger/30 rounded px-3 py-2">
                <AlertTriangle size={13} />
                {formErr}
              </div>
            )}

            <div className="flex gap-2">
              {isEditing && (
                <Button
                  variant="outline"
                  className="flex-1 gap-1.5"
                  onClick={reset}
                  disabled={busy}
                >
                  <X size={13} />
                  Cancel
                </Button>
              )}
              <Button
                className="flex-1 gap-1.5"
                onClick={save}
                disabled={!canSave}
              >
                <Check size={14} />
                {busy ? 'Saving…' : isEditing ? 'Update' : 'Save Route'}
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            <p className="text-[10px] font-mono text-muted uppercase tracking-widest px-1 mb-1">
              Saved routes ({fences.length})
            </p>

            {loading && (
              <p className="text-muted text-xs text-center py-6">Loading…</p>
            )}
            {error && (
              <div className="flex items-center gap-2 text-xs text-danger bg-danger/10 border border-danger/30 rounded px-3 py-2">
                <AlertTriangle size={13} />
                {error}
              </div>
            )}
            {!loading && !error && fences.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <MapIcon size={20} className="text-muted" />
                <p className="text-muted text-xs">No routes yet</p>
              </div>
            )}

            {fences.map((f) => (
              <div
                key={f.id}
                className={cn(
                  'rounded-lg border p-3 bg-panel flex items-center justify-between gap-2',
                  f.id === editingId ? 'border-accent/40' : 'border-border',
                )}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-primary truncate">
                    {f.routeName}
                  </p>
                  <p className="text-[10px] font-mono text-muted mt-0.5">
                    {new Date(f.createdAt).toLocaleDateString('en-KE')}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => startEdit(f)}
                  >
                    <Pencil size={12} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleDelete(f)}
                    className="text-muted hover:text-danger"
                  >
                    <Trash2 size={12} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
