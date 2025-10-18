'use client';

interface HeroSectionProps {
  className?: string;
}

export default function HeroSection({ className }: HeroSectionProps) {
  return (
    <section className={`bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20 ${className || ''}`}>
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          Professional Home Services
        </h1>
        <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto">
          Get reliable, professional services for your home with just a few clicks.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
            Book a Service
          </button>
          <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
            Learn More
          </button>
        </div>
      </div>
    </section>
  );
}