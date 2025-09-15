'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the modal with no SSR
const LocationPromptModal = dynamic(
  () => import('./LocationPromptModal'),
  {
    ssr: false,
    loading: () => null
  }
);

interface DynamicLocationPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSet: () => void;
  planName?: string;
}

export default function DynamicLocationPromptModal(props: DynamicLocationPromptModalProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Don't render anything on the server or during hydration
  if (!isMounted) {
    return null;
  }

  return <LocationPromptModal {...props} />;
}