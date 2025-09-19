'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/shared';
import { BookOpen, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import QuoteRequestModal from '@/components/QuoteRequestModal';

export default function PlumbingRepairClient() {
  const router = useRouter();
  const [showQuoteModal, setShowQuoteModal] = useState(false);

  const handleBookNow = () => {
    // Navigate to book service page
    router.push('/service-request');
  };

  const handleRequestQuote = () => {
    setShowQuoteModal(true);
  };

  return (
    <>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            size="lg"
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 text-lg font-semibold"
            onClick={handleBookNow}
          >
            <BookOpen className="h-5 w-5 mr-2" />
            Book Now
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="w-full border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 text-gray-700 py-4 text-lg font-semibold"
            onClick={handleRequestQuote}
          >
            <MessageCircle className="h-5 w-5 mr-2" />
            Request Quote
          </Button>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Emergency? <Link href="/contact" className="text-red-600 hover:text-red-700 font-semibold">Call us immediately</Link>
          </p>
        </div>
      </div>

      {/* Quote Request Modal */}
      <QuoteRequestModal
        isOpen={showQuoteModal}
        onClose={() => setShowQuoteModal(false)}
        serviceName="Plumbing Repair"
        serviceId="plumbing-repair"
      />
    </>
  );
}