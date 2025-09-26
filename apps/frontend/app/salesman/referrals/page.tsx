"use client";

import React, { useEffect, useState } from 'react';

export default function SalesmanReferralsPage() {
  const [referralCode, setReferralCode] = useState<string>('');
  const [links, setLinks] = useState<{ label: string; url: string }[]>([]);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await fetch('/api/salesman/referral-links');
        if (!res.ok) throw new Error('Failed to load referral links');
        const json = await res.json();
        const data = json.data || json;
        const linksObj = data.links || {};
        const items: { label: string; url: string }[] = Object.entries(linksObj).map(([key, value]: [string, any]) => ({
          label: key,
          url: String(value)
        }));
        if (isMounted) {
          setReferralCode(data.referralCode || '');
          setLinks(items);
          setQrCode(data.qrCode || null);
        }
      } catch (e) {
        if (isMounted) setError('Failed to load referral links');
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  if (loading) return <div className="p-6">Loading referral links...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Referral Links</h1>
      <div className="flex items-center gap-3">
        <div className="text-sm text-gray-600">Your code:</div>
        <code className="px-2 py-1 bg-gray-100 rounded border font-mono">{referralCode || '—'}</code>
      </div>
      {qrCode && (
        <div className="flex items-center gap-4">
          <img src={qrCode} alt="Referral QR" className="w-24 h-24 border rounded" />
          <div className="text-sm text-gray-600">Scan to share your referral link.</div>
        </div>
      )}
      {links.length === 0 ? (
        <div className="text-gray-600">No links yet. Generate and share your referral link from the dashboard.</div>
      ) : (
        <div className="overflow-x-auto border rounded-md">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-left">URL</th>
              </tr>
            </thead>
            <tbody>
              {links.map((l, idx) => (
                <tr key={idx} className="border-t">
                  <td className="px-4 py-2 capitalize">{l.label}</td>
                  <td className="px-4 py-2 break-all">
                    <a className="text-blue-600 hover:underline" href={l.url} target="_blank" rel="noreferrer">{l.url}</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
