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

// Loads sessions and exposes CRUD mutators. Mutators re-fetch the list so the
// UI always reflects the server.
export default function useSessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await request('/api/sessions');
      setSessions(data);
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

  const createSession = useCallback(
    async (body) => {
      const { data } = await request('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      await refresh();
      return data;
    },
    [refresh],
  );

  const updateSession = useCallback(
    async (id, patch) => {
      const { data } = await request(`/api/sessions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      await refresh();
      return data;
    },
    [refresh],
  );

  const deleteSession = useCallback(
    async (id) => {
      await request(`/api/sessions/${id}`, { method: 'DELETE' });
      await refresh();
    },
    [refresh],
  );

  return {
    sessions,
    loading,
    error,
    refresh,
    createSession,
    updateSession,
    deleteSession,
  };
}
