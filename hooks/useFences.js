'use client';

import { useCallback, useEffect, useState } from 'react';

async function request(url, options) {
  const res = await fetch(url, options);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || `Request failed (${res.status})`);
  }
  return json;
}

// Loads fences (routes) and exposes CRUD mutators. Mutators re-fetch the list.
export default function useFences() {
  const [fences, setFences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await request('/api/fences');
      setFences(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createFence = useCallback(
    async (body) => {
      const { data } = await request('/api/fences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      await refresh();
      return data;
    },
    [refresh],
  );

  const updateFence = useCallback(
    async (id, patch) => {
      const { data } = await request(`/api/fences/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      await refresh();
      return data;
    },
    [refresh],
  );

  const deleteFence = useCallback(
    async (id) => {
      await request(`/api/fences/${id}`, { method: 'DELETE' });
      await refresh();
    },
    [refresh],
  );

  return { fences, loading, error, refresh, createFence, updateFence, deleteFence };
}
