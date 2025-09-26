"use client";

import React, { useEffect, useState } from 'react';

export default function SalesmanCommissionPage() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await fetch('/api/salesman/commission');
        if (!res.ok) throw new Error('Failed to load commission');
        const json = await res.json();
        if (isMounted) setData(json.data || json);
      } catch (e) {
        if (isMounted) setError('Failed to load commission');
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  if (loading) return <div className="p-6">Loading commission...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Commission</h1>
      <pre className="bg-gray-50 p-4 rounded border overflow-auto text-xs">{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
