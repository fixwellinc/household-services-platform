"use client";

import React, { useEffect, useState } from 'react';

export default function SalesmanReferralsPage() {
  const [links, setLinks] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await fetch('/api/salesman/referral-links');
        if (!res.ok) throw new Error('Failed to load referral links');
        const json = await res.json();
        if (isMounted) setLinks(json.data || []);
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
      {!links || links.length === 0 ? (
        <div className="text-gray-600">No links yet. Generate and share your referral link from the dashboard.</div>
      ) : (
        <ul className="list-disc pl-6">
          {links.map((l: any, idx: number) => (
            <li key={idx} className="break-all"><a className="text-blue-600 hover:underline" href={l.url} target="_blank" rel="noreferrer">{l.url}</a></li>
          ))}
        </ul>
      )}
    </div>
  );
}
