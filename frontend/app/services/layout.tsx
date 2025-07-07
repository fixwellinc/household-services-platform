import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Services | Household Services',
  description: 'Explore our wide range of household services delivered by trusted professionals. Book cleaning, repairs, and more.',
};

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 