"use client";

import React from 'react';

export default function SalesmanHelpPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Help & FAQs</h1>
      <div className="prose max-w-none">
        <p>If you need assistance with your salesman dashboard, referral links, or commissions, contact support at <a className="text-blue-600" href="mailto:support@fixwell.com">support@fixwell.com</a>.</p>
        <ul className="list-disc pl-6">
          <li>Make sure you are logged in and have SALESMAN role.</li>
          <li>Share your referral link to start earning commissions.</li>
          <li>Check Performance to track progress toward targets.</li>
        </ul>
      </div>
    </div>
  );
}
