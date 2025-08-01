'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRegister } from '@/hooks/use-api';
import { useLocation } from '@/contexts/LocationContext';
import { Button } from '@/components/ui/shared';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, MapPin, AlertCircle } from 'lucide-react';
import LocationPromptModal from '@/components/location/LocationPromptModal';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationVerified, setLocationVerified] = useState(false);
  const registerMutation = useRegister();
  const searchParams = useSearchParams();
  const { userLocation, isInBC, isLoading: locationLoading } = useLocation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  // Check location on component mount
  useEffect(() => {
    if (!locationLoading) {
      if (!userLocation || !isInBC) {
        setShowLocationModal(true);
      } else {
        setLocationVerified(true);
      }
    }
  }, [userLocation, isInBC, locationLoading]);

  const onSubmit = async (data: RegisterFormData) => {
    try {
      // Always register as CUSTOMER since we removed provider option
      const registrationData = { ...data, role: 'CUSTOMER' as const };
      await registerMutation.mutateAsync(registrationData);
      toast.success('Registration successful! Welcome to Fixwell Services!');
      
      // Handle redirect after successful registration
      const redirectUrl = searchParams.get('redirect');
      if (redirectUrl) {
        // Decode the URL and redirect
        const decodedUrl = decodeURIComponent(redirectUrl);
        console.log('Redirecting to:', decodedUrl);
        window.location.href = decodedUrl;
      } else {
        // Default redirect to dashboard
        window.location.href = '/dashboard';
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Registration failed');
    }
  };

  // Show location verification step if not verified
  if (!locationVerified) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
            <MapPin className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Verify Your Location
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            We need to confirm you're in our BC service area before creating your account.
          </p>
          
          {locationLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="animate-spin h-5 w-5 text-blue-600 mr-2" />
              <span className="text-sm text-gray-600">Checking your location...</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-yellow-800">
                      <strong>Service Area Required:</strong> We currently serve BC residents in the Lower Mainland area.
                    </p>
                  </div>
                </div>
              </div>
              
              <Button
                type="button"
                onClick={() => setShowLocationModal(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Verify My Location
              </Button>
            </div>
          )}
        </div>
        
        {/* Location Prompt Modal */}
        <LocationPromptModal
          isOpen={showLocationModal}
          onClose={() => setShowLocationModal(false)}
          onLocationSet={() => {
            setShowLocationModal(false);
            setLocationVerified(true);
          }}
          planName="account"
        />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Full Name
        </label>
        <input
          {...register('name')}
          type="text"
          id="name"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
          placeholder="Enter your full name"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email address
        </label>
        <input
          {...register('email')}
          type="email"
          id="email"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
          placeholder="Enter your email"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <div className="mt-1 relative">
          <input
            {...register('password')}
            type={showPassword ? 'text' : 'password'}
            id="password"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm pr-10"
            placeholder="Create a password"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            title={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5 text-gray-400" />
            ) : (
              <Eye className="h-5 w-5 text-gray-400" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
          Confirm Password
        </label>
        <div className="mt-1 relative">
          <input
            {...register('confirmPassword')}
            type={showConfirmPassword ? 'text' : 'password'}
            id="confirmPassword"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm pr-10"
            placeholder="Confirm your password"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
            title={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
          >
            {showConfirmPassword ? (
              <EyeOff className="h-5 w-5 text-gray-400" />
            ) : (
              <Eye className="h-5 w-5 text-gray-400" />
            )}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
        )}
      </div>

      <Button
        type="submit"
        disabled={registerMutation.isPending}
        className="w-full flex justify-center py-2 px-4"
      >
        {registerMutation.isPending ? (
          <>
            <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
            Creating account...
          </>
        ) : (
          'Create Account'
        )}
      </Button>

      <div className="text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <a href="/login" className="font-medium text-primary hover:text-primary/90">
            Sign in
          </a>
        </p>
      </div>
    </form>
  );
} 