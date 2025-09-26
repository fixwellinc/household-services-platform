"use client";

import React, { useEffect, useMemo, useState } from 'react';

export default function SalesmanReferralsPage() {
  const [referralCode, setReferralCode] = useState<string>('');
  const [links, setLinks] = useState<{ label: string; url: string }[]>([]);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UTM fields
  const [campaign, setCampaign] = useState('');
  const [source, setSource] = useState('');
  const [medium, setMedium] = useState('referral');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const buildQuery = useMemo(() => {
    const params = new URLSearchParams();
    if (campaign) params.set('campaign', campaign);
    if (source) params.set('source', source);
    if (medium) params.set('medium', medium);
    const qs = params.toString();
    return qs ? `/api/salesman/referral-links?${qs}` : '/api/salesman/referral-links';
  }, [campaign, source, medium]);

  const fetchLinks = async (signal?: AbortSignal) => {
    const res = await fetch(buildQuery, { signal });
    if (!res.ok) throw new Error('Failed to load referral links');
    const json = await res.json();
    const data = json.data || json;
    const linksObj = data.links || {};
    const items: { label: string; url: string }[] = Object.entries(linksObj).map(([key, value]: [string, any]) => ({
      label: key,
      url: String(value)
    }));
    setReferralCode(data.referralCode || '');
    setLinks(items);
    setQrCode(data.qrCode || null);
  };

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        setLoading(true);
        await fetchLinks(controller.signal);
      } catch (e) {
        setError('Failed to load referral links');
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [buildQuery]);

  const copy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 1500);
    } catch (e) {
      console.warn('Copy failed', e);
    }
  };

  if (loading) return <div className="p-6">Loading referral links...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Referral Links</h1>

      {/* UTM generator */}
      <div className="border rounded-md p-4 bg-gray-50">
        <div className="text-sm font-medium mb-3">Generate custom UTM links</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Campaign</label>
            <input value={campaign} onChange={(e) => setCampaign(e.target.value)} className="w-full px-2 py-1 border rounded" placeholder="spring_promo" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Source</label>
            <input value={source} onChange={(e) => setSource(e.target.value)} className="w-full px-2 py-1 border rounded" placeholder="facebook" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Medium</label>
            <input value={medium} onChange={(e) => setMedium(e.target.value)} className="w-full px-2 py-1 border rounded" placeholder="referral" />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <button onClick={() => fetchLinks()} className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700">Generate Links</button>
          <div className="text-sm text-gray-600">Your code: <code className="px-1 py-0.5 bg-white border rounded font-mono">{referralCode || '—'}</code></div>
        </div>
      </div>

      {qrCode && (
        <div className="flex items-center gap-4">
          <img src={qrCode} alt="Referral QR" className="w-24 h-24 border rounded" />
          <div className="text-sm text-gray-600">Scan to share your referral link.</div>
        </div>
      )}

      {links.length === 0 ? (
        <div className="text-gray-600">No links yet. Adjust UTM values and click Generate Links.</div>
      ) : (
        <div className="overflow-x-auto border rounded-md">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-left">URL</th>
                <th className="px-4 py-2 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {links.map((l, idx) => (
                <tr key={idx} className="border-t">
                  <td className="px-4 py-2 capitalize">{l.label}</td>
                  <td className="px-4 py-2 break-all">
                    <a className="text-blue-600 hover:underline" href={l.url} target="_blank" rel="noreferrer">{l.url}</a>
                  </td>
                  <td className="px-4 py-2">
                    <button onClick={() => copy(l.url, idx)} className={`px-2 py-1 border rounded ${copiedIndex === idx ? 'border-green-300 text-green-700' : 'hover:bg-gray-50'}`}>
                      {copiedIndex === idx ? 'Copied!' : 'Copy'}
                    </button>
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
