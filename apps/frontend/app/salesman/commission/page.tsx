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

  const total = data?.summary?.totalEarnings ?? 0;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Commission</h1>
      {total === 0 ? (
        <div className="p-4 border rounded bg-gray-50 text-gray-700">
          <div className="font-medium mb-1">No commission earned yet.</div>
          <div className="text-sm">When your referrals convert, paid commissions will appear here.</div>
        </div>
      ) : (
        <pre className="bg-gray-50 p-4 rounded border overflow-auto text-xs">{JSON.stringify(data, null, 2)}</pre>
      )}
    </div>
  );
}
