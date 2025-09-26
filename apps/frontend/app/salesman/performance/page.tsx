"use client";

import React, { useEffect, useState } from 'react';

export default function SalesmanPerformancePage() {
  const [metrics, setMetrics] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await fetch('/api/salesman/performance');
        if (!res.ok) throw new Error('Failed to load performance');
        const json = await res.json();
        if (isMounted) setMetrics(json.data || json);
      } catch (e) {
        if (isMounted) setError('Failed to load performance');
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  if (loading) return <div className="p-6">Loading performance...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  const hasActivity = Boolean(metrics?.acquisitionMetrics?.totalReferrals) || Boolean(metrics?.revenueMetrics?.totalCommissionEarned);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Performance</h1>
      {!hasActivity ? (
        <div className="p-4 border rounded bg-gray-50 text-gray-700">
          <div className="font-medium mb-1">No performance data yet.</div>
          <div className="text-sm">Share your referral link and get your first customer to see metrics here.</div>
        </div>
      ) : (
        <pre className="bg-gray-50 p-4 rounded border overflow-auto text-xs">{JSON.stringify(metrics, null, 2)}</pre>
      )}
    </div>
  );
}
