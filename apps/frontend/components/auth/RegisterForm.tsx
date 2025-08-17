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
import { Eye, EyeOff, Loader2, MapPin, AlertCircle, Phone, Home } from 'lucide-react';
import LocationPromptModal from '@/components/location/LocationPromptModal';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
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
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  // Watch postal code to display it
  const postalCode = watch('postalCode');

  // Check location on component mount and set postal code
  useEffect(() => {
    if (!locationLoading) {
      if (!userLocation || !isInBC) {
        setShowLocationModal(true);
      } else {
        setLocationVerified(true);
        // Automatically set postal code from location context
        if (userLocation?.postalCode) {
          setValue('postalCode', userLocation.postalCode);
        }
      }
    }
  }, [userLocation, isInBC, locationLoading, setValue]);

  const onSubmit = async (data: RegisterFormData) => {
    try {
      // Always register as CUSTOMER since we removed provider option
      const registrationData = { 
        ...data, 
        role: 'CUSTOMER' as const,
        postalCode: userLocation?.postalCode || data.postalCode
      };
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
            // Set postal code when location is set
            if (userLocation?.postalCode) {
              setValue('postalCode', userLocation.postalCode);
            }
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
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
          Phone Number
        </label>
        <div className="mt-1 relative">
          <input
            {...register('phone')}
            type="tel"
            id="phone"
            className="block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            placeholder="Enter your phone number"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Phone className="h-5 w-5 text-gray-400" />
          </div>
        </div>
        {errors.phone && (
          <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700">
          Address
        </label>
        <div className="mt-1 relative">
          <input
            {...register('address')}
            type="text"
            id="address"
            className="block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            placeholder="Enter your full address"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Home className="h-5 w-5 text-gray-400" />
          </div>
        </div>
        {errors.address && (
          <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">
          Postal Code
        </label>
        <div className="mt-1 relative">
          <input
            {...register('postalCode')}
            type="text"
            id="postalCode"
            className="block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-gray-50"
            placeholder="Postal code will be set automatically"
            readOnly
            value={userLocation?.postalCode || ''}
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MapPin className="h-5 w-5 text-gray-400" />
          </div>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Postal code is automatically set based on your verified location
        </p>
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
            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            title={showConfirmPassword ? "Hide password" : "Show password"}
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
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-4 rounded-md font-medium transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
      >
        {registerMutation.isPending ? (
          <div className="flex items-center justify-center">
            <Loader2 className="animate-spin h-5 w-5 mr-2" />
            Creating Account...
          </div>
        ) : (
          'Create Account'
        )}
      </Button>
    </form>
  );
} 