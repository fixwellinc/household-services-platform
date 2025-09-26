"use client";

import React, { useEffect, useMemo, useState } from 'react';

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

  const acquisition = metrics?.acquisitionMetrics || {};
  const revenue = metrics?.revenueMetrics || {};
  const progress = metrics?.targetProgress?.monthly || {};
  const bySource = metrics?.referralStats?.bySource || [];
  const monthly = metrics?.referralStats?.monthlyTrends || [];

  const hasActivity = Boolean(acquisition.totalReferrals) || Boolean(revenue.totalCommissionEarned);

  const percentage = typeof progress.percentage === 'number' ? progress.percentage : (
    progress.target > 0 ? Math.min(100, (progress.achieved / progress.target) * 100) : 0
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Performance</h1>

      {!hasActivity ? (
        <div className="p-4 border rounded bg-gray-50 text-gray-700">
          <div className="font-medium mb-1">No performance data yet.</div>
          <div className="text-sm">Share your referral link and get your first customer to see metrics here.</div>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded p-4 bg-white">
              <div className="text-xs text-gray-600">Total Referrals</div>
              <div className="text-2xl font-semibold">{acquisition.totalReferrals?.toLocaleString('en-US') || 0}</div>
            </div>
            <div className="border rounded p-4 bg-white">
              <div className="text-xs text-gray-600">Conversion Rate</div>
              <div className="text-2xl font-semibold">{(acquisition.conversionRate ?? 0).toFixed(1)}%</div>
            </div>
            <div className="border rounded p-4 bg-white">
              <div className="text-xs text-gray-600">Total Commission Earned</div>
              <div className="text-2xl font-semibold">${(revenue.totalCommissionEarned ?? 0).toLocaleString('en-US')}</div>
            </div>
          </div>

          {/* Target progress */}
          <div className="border rounded p-4 bg-white">
            <div className="flex justify-between text-sm mb-2">
              <div className="text-gray-600">Monthly Target</div>
              <div className="font-medium">{(progress.achieved ?? 0).toLocaleString('en-US')} / {(progress.target ?? 0).toLocaleString('en-US')}</div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div className="bg-blue-600 h-3 rounded-full" style={{ width: `${Math.min(100, percentage || 0)}%` }} />
            </div>
            <div className="text-xs text-gray-600 mt-1">{(percentage || 0).toFixed(1)}% complete</div>
          </div>

          {/* By source table */}
          <div className="border rounded bg-white overflow-x-auto">
            <div className="p-3 text-sm font-medium">Referrals by Source</div>
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Source</th>
                  <th className="px-4 py-2 text-left">Count</th>
                  <th className="px-4 py-2 text-left">% of Total</th>
                </tr>
              </thead>
              <tbody>
                {bySource.length === 0 ? (
                  <tr><td className="px-4 py-3 text-gray-600" colSpan={3}>No data yet.</td></tr>
                ) : (
                  bySource.map((r: any, idx: number) => (
                    <tr key={idx} className="border-t">
                      <td className="px-4 py-2">{r.source || 'unknown'}</td>
                      <td className="px-4 py-2">{r.count?.toLocaleString('en-US') || 0}</td>
                      <td className="px-4 py-2">{(r.percentage ?? 0).toFixed(1)}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Monthly trends table */}
          <div className="border rounded bg-white overflow-x-auto">
            <div className="p-3 text-sm font-medium">Monthly Trends (last 12 months)</div>
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Month</th>
                  <th className="px-4 py-2 text-left">Referrals</th>
                  <th className="px-4 py-2 text-left">Conversions</th>
                </tr>
              </thead>
              <tbody>
                {monthly.length === 0 ? (
                  <tr><td className="px-4 py-3 text-gray-600" colSpan={3}>No data yet.</td></tr>
                ) : (
                  monthly.map((m: any, idx: number) => (
                    <tr key={idx} className="border-t">
                      <td className="px-4 py-2">{m.month}</td>
                      <td className="px-4 py-2">{m.referrals}</td>
                      <td className="px-4 py-2">{m.conversions}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
