import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Services | Fixwell Services',
  description: 'Explore our wide range of fixwell services delivered by trusted professionals. Book cleaning, repairs, and more.',
};

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 