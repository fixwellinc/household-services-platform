"use client";

import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/shared';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui/shared';

interface Diagnostics {
  success: boolean;
  mode: 'test' | 'live' | 'mock' | string;
  publishableConfigured: boolean;
  webhookConfigured: boolean;
  products: Array<{ id: string; name: string; active: boolean }>;
  prices: Array<{ id: string; product: string; unit_amount: number; currency: string; recurring?: { interval: string; interval_count: number } }>;
  notes?: string[];
}

export default function AdminStripePage() {
  const [data, setData] = useState<Diagnostics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/stripe/diagnostics');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load Stripe diagnostics');
      setData(json);
    } catch (e: any) {
      setError(e.message || 'Failed to load Stripe diagnostics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <div className="p-6">Loading Stripe diagnostics...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!data) return <div className="p-6">No data</div>;

  const modeColor = data.mode === 'live' ? 'bg-red-100 text-red-800' : data.mode === 'test' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Stripe Diagnostics</h1>
          <p className="text-gray-600 mt-1">Inspect Stripe configuration (non-sensitive) and test setup</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded text-xs ${modeColor}`}>Mode: {data.mode}</span>
          <Badge variant="outline" className={data.publishableConfigured ? 'text-green-700 border-green-300' : 'text-red-700 border-red-300'}>
            Publishable: {data.publishableConfigured ? 'configured' : 'missing'}
          </Badge>
          <Badge variant="outline" className={data.webhookConfigured ? 'text-green-700 border-green-300' : 'text-red-700 border-red-300'}>
            Webhook: {data.webhookConfigured ? 'configured' : 'missing'}
          </Badge>
          <Button variant="outline" onClick={load}>Refresh</Button>
        </div>
      </div>

      {data.notes && data.notes.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
          <CardContent>
            <ul className="list-disc pl-6 text-sm text-gray-700">
              {data.notes.map((n, i) => <li key={i}>{n}</li>)}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Products (sample)</CardTitle></CardHeader>
          <CardContent>
            {data.products.length === 0 ? (
              <div className="text-gray-600">No products found.</div>
            ) : (
              <div className="overflow-x-auto border rounded">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">ID</th>
                      <th className="px-4 py-2 text-left">Name</th>
                      <th className="px-4 py-2 text-left">Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.products.map((p) => (
                      <tr key={p.id} className="border-t">
                        <td className="px-4 py-2 font-mono text-xs">{p.id}</td>
                        <td className="px-4 py-2">{p.name}</td>
                        <td className="px-4 py-2">{p.active ? 'Yes' : 'No'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Prices (sample)</CardTitle></CardHeader>
          <CardContent>
            {data.prices.length === 0 ? (
              <div className="text-gray-600">No prices found.</div>
            ) : (
              <div className="overflow-x-auto border rounded">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">ID</th>
                      <th className="px-4 py-2 text-left">Product</th>
                      <th className="px-4 py-2 text-left">Amount</th>
                      <th className="px-4 py-2 text-left">Currency</th>
                      <th className="px-4 py-2 text-left">Recurring</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.prices.map((pr) => (
                      <tr key={pr.id} className="border-t">
                        <td className="px-4 py-2 font-mono text-xs">{pr.id}</td>
                        <td className="px-4 py-2 font-mono text-xs">{String(pr.product)}</td>
                        <td className="px-4 py-2">{(pr.unit_amount ?? 0) / 100}</td>
                        <td className="px-4 py-2">{pr.currency}</td>
                        <td className="px-4 py-2">{pr.recurring ? `${pr.recurring.interval_count}/${pr.recurring.interval}` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>How to test</CardTitle></CardHeader>
        <CardContent>
          <ol className="list-decimal pl-6 space-y-1 text-sm text-gray-700">
            <li>Ensure STRIPE_PUBLISHABLE_KEY, STRIPE_SECRET_KEY (test), and STRIPE_WEBHOOK_SECRET are configured in Railway.</li>
            <li>Visit /pricing/stripe-payment and start a test Checkout with plan price IDs configured in the backend plans.</li>
            <li>Use test card 4242 4242 4242 4242 with any future expiry, any CVC, any ZIP.</li>
            <li>Verify /api/subscriptions/current shows your subscription after completion.</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
