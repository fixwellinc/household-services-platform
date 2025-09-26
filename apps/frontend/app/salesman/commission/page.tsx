"use client";

import React, { useEffect, useMemo, useState } from 'react';

export default function SalesmanCommissionPage() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const query = useMemo(() => `?page=${page}&limit=${limit}`, [page, limit]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/salesman/commission${query}`);
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
  }, [query]);

  if (loading) return <div className="p-6">Loading commission...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  const total = data?.summary?.totalEarnings ?? 0;
  const items = data?.transactions || [];
  const pagination = data?.pagination || { page: 1, totalPages: 0 };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Commission</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded p-4 bg-white">
          <div className="text-xs text-gray-600">Total Earnings</div>
          <div className="text-2xl font-semibold">${(data?.summary?.totalEarnings ?? 0).toLocaleString('en-US')}</div>
        </div>
        <div className="border rounded p-4 bg-white">
          <div className="text-xs text-gray-600">Transactions</div>
          <div className="text-2xl font-semibold">{(data?.summary?.totalTransactions ?? 0).toLocaleString('en-US')}</div>
        </div>
        <div className="border rounded p-4 bg-white">
          <div className="text-xs text-gray-600">Average Transaction</div>
          <div className="text-2xl font-semibold">${(data?.summary?.averageTransaction ?? 0).toLocaleString('en-US')}</div>
        </div>
      </div>

      {total === 0 || items.length === 0 ? (
        <div className="p-4 border rounded bg-gray-50 text-gray-700">
          <div className="font-medium mb-1">No commission earned yet.</div>
          <div className="text-sm">When your referrals convert, paid commissions will appear here.</div>
        </div>
      ) : (
        <div className="border rounded bg-white overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Customer</th>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((t: any) => (
                <tr key={t.id} className="border-t">
                  <td className="px-4 py-2">{new Date(t.createdAt).toLocaleDateString('en-US', { timeZone: 'UTC' })}</td>
                  <td className="px-4 py-2">{t.customer?.name || '—'}<div className="text-xs text-gray-500">{t.customer?.email}</div></td>
                  <td className="px-4 py-2">{t.transactionType}</td>
                  <td className="px-4 py-2">{t.status}</td>
                  <td className="px-4 py-2">${(t.amount ?? 0).toLocaleString('en-US')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center gap-3">
        <button disabled={pagination.page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className={`px-3 py-1.5 border rounded ${pagination.page <= 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}>Prev</button>
        <div className="text-sm">Page {pagination.page} of {pagination.totalPages}</div>
        <button disabled={pagination.page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)} className={`px-3 py-1.5 border rounded ${pagination.page >= pagination.totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}>Next</button>
      </div>
    </div>
  );
}
