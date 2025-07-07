import BookServiceForm from '@/components/customer/BookServiceForm';

export default function BookServicePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Book a Service</h1>
          <p className="mt-2 text-gray-600">
            Schedule a professional service for your home.
          </p>
        </div>
        <BookServiceForm />
      </div>
    </div>
  );
} 