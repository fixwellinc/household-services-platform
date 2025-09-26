"use client";

import React, { useEffect, useState } from 'react';

export default function SalesmanProfilePage() {
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await fetch('/api/salesman/profile');
        if (!res.ok) throw new Error('Failed to load profile');
        const json = await res.json();
        if (isMounted) setProfile(json.data || json);
      } catch (e) {
        if (isMounted) setError('Failed to load profile');
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  if (loading) return <div className="p-6">Loading profile...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Profile</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded p-4">
          <div className="text-gray-600 text-sm">Display Name</div>
          <div className="font-medium">{profile?.displayName || '—'}</div>
        </div>
        <div className="border rounded p-4">
          <div className="text-gray-600 text-sm">Referral Code</div>
          <div className="font-medium">{profile?.referralCode || '—'}</div>
        </div>
        <div className="border rounded p-4">
          <div className="text-gray-600 text-sm">Commission Tier</div>
          <div className="font-medium">{profile?.commissionTier || '—'}</div>
        </div>
        <div className="border rounded p-4">
          <div className="text-gray-600 text-sm">Monthly Target</div>
          <div className="font-medium">{(profile?.monthlyTarget ?? 0).toLocaleString('en-US')}</div>
        </div>
      </div>
    </div>
  );
}
