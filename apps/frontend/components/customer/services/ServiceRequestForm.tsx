'use client';

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/shared';
import { Badge } from '@/components/ui/shared';
import { Button } from '@/components/ui/shared';
import { 
  Upload,
  X,
  Calendar,
  Clock,
  MapPin,
  AlertTriangle,
  FileImage,
  FileVideo,
  Loader2,
  CheckCircle,
  Info,
  Phone,
  Mail,
  User
} from 'lucide-react';

interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  basePrice: number;
}

interface ServiceRequestFormProps {
  service?: Service;
  onSubmit: (formData: ServiceRequestFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

interface ServiceRequestFormData {
  serviceId?: string;
  category: string;
  description: string;
  urgency: 'LOW' | 'NORMAL' | 'HIGH' | 'EMERGENCY';
  address: string;
  preferredDate?: string;
  preferredTime?: string;
  photos: File[];
  videos: File[];
  contactMethod: 'EMAIL' | 'PHONE' | 'BOTH';
  additionalNotes?: string;
}

const URGENCY_OPTIONS = [
  { value: 'LOW', label: 'Low Priority', description: 'Can wait a few days', color: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'NORMAL', label: 'Normal', description: 'Within 1-2 days', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'HIGH', label: 'High Priority', description: 'Within 24 hours', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { value: 'EMERGENCY', label: 'Emergency', description: 'Immediate attention needed', color: 'bg-red-100 text-red-800 border-red-200' }
];

const CATEGORY_OPTIONS = [
  'CLEANING',
  'MAINTENANCE', 
  'REPAIR',
  'ORGANIZATION',
  'OTHER'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 5;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

export default function ServiceRequestForm({ 
  service, 
  onSubmit, 
  onCancel, 
  isSubmitting = false 
}: ServiceRequestFormProps) {
  const [formData, setFormData] = useState<ServiceRequestFormData>({
    serviceId: service?.id,
    category: service?.category || 'OTHER',
    description: '',
    urgency: 'NORMAL',
    address: '',
    preferredDate: '',
    preferredTime: '',
    photos: [],
    videos: [],
    contactMethod: 'EMAIL',
    additionalNotes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dragActive, setDragActive] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (formData.preferredDate) {
      const selectedDate = new Date(formData.preferredDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.preferredDate = 'Preferred date cannot be in the past';
      }
    }

    if (formData.photos.length + formData.videos.length > MAX_FILES) {
      newErrors.files = `Maximum ${MAX_FILES} files allowed`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleFileUpload = (files: FileList | null, type: 'photos' | 'videos') => {
    if (!files) return;

    const newFiles: File[] = [];
    const acceptedTypes = type === 'photos' ? ACCEPTED_IMAGE_TYPES : ACCEPTED_VIDEO_TYPES;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (!acceptedTypes.includes(file.type)) {
        setErrors(prev => ({
          ...prev,
          files: `Invalid file type: ${file.name}`
        }));
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        setErrors(prev => ({
          ...prev,
          files: `File too large: ${file.name} (max 10MB)`
        }));
        continue;
      }

      newFiles.push(file);
    }

    if (newFiles.length > 0) {
      setFormData(prev => ({
        ...prev,
        [type]: [...prev[type], ...newFiles].slice(0, MAX_FILES)
      }));
      setErrors(prev => ({ ...prev, files: '' }));
    }
  };

  const removeFile = (index: number, type: 'photos' | 'videos') => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = e.dataTransfer.files;
      const imageFiles: File[] = [];
      const videoFiles: File[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (ACCEPTED_IMAGE_TYPES.includes(file.type)) {
          imageFiles.push(file);
        } else if (ACCEPTED_VIDEO_TYPES.includes(file.type)) {
          videoFiles.push(file);
        }
      }

      if (imageFiles.length > 0) {
        const fileList = new DataTransfer();
        imageFiles.forEach(file => fileList.items.add(file));
        handleFileUpload(fileList.files, 'photos');
      }

      if (videoFiles.length > 0) {
        const fileList = new DataTransfer();
        videoFiles.forEach(file => fileList.items.add(file));
        handleFileUpload(fileList.files, 'videos');
      }
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold">
              {service ? `Request ${service.name}` : 'Request Service'}
            </CardTitle>
            <CardDescription className="mt-2">
              {service 
                ? `Fill out the form below to request ${service.name} service`
                : 'Fill out the form below to request a service'
              }
            </CardDescription>
          </div>
          {service && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              {service.category}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Service Category */}
          {!service && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {CATEGORY_OPTIONS.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Please describe what you need help with in detail..."
              rows={4}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              }`}
              required
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {formData.description.length}/500 characters
            </p>
          </div>

          {/* Urgency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Urgency Level *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {URGENCY_OPTIONS.map(option => (
                <label
                  key={option.value}
                  className={`relative flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                    formData.urgency === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="urgency"
                    value={option.value}
                    checked={formData.urgency === option.value}
                    onChange={(e) => setFormData(prev => ({ ...prev, urgency: e.target.value as any }))}
                    className="sr-only"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={`text-xs px-2 py-1 ${option.color}`}>
                        {option.label}
                      </Badge>
                      {option.value === 'EMERGENCY' && (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{option.description}</p>
                  </div>
                  {formData.urgency === option.value && (
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service Address *
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Enter the address where service is needed"
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.address ? 'border-red-300' : 'border-gray-300'
                }`}
                required
              />
            </div>
            {errors.address && (
              <p className="mt-1 text-sm text-red-600">{errors.address}</p>
            )}
          </div>

          {/* Preferred Date & Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  value={formData.preferredDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, preferredDate: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.preferredDate ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.preferredDate && (
                <p className="mt-1 text-sm text-red-600">{errors.preferredDate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Time
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  value={formData.preferredTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, preferredTime: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Any time</option>
                  <option value="morning">Morning (8AM - 12PM)</option>
                  <option value="afternoon">Afternoon (12PM - 5PM)</option>
                  <option value="evening">Evening (5PM - 8PM)</option>
                </select>
              </div>
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photos & Videos
            </label>
            <p className="text-sm text-gray-600 mb-3">
              Upload photos or videos to help us understand your service needs better (optional)
            </p>

            {/* Drag & Drop Area */}
            <div
              className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragActive 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 mb-2">
                Drag and drop files here, or click to select
              </p>
              <div className="flex gap-2 justify-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => photoInputRef.current?.click()}
                >
                  <FileImage className="h-4 w-4 mr-2" />
                  Add Photos
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => videoInputRef.current?.click()}
                >
                  <FileVideo className="h-4 w-4 mr-2" />
                  Add Videos
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Max {MAX_FILES} files, 10MB each. JPG, PNG, WebP, MP4, WebM, MOV
              </p>
            </div>

            <input
              ref={photoInputRef}
              type="file"
              multiple
              accept={ACCEPTED_IMAGE_TYPES.join(',')}
              onChange={(e) => handleFileUpload(e.target.files, 'photos')}
              className="hidden"
            />
            <input
              ref={videoInputRef}
              type="file"
              multiple
              accept={ACCEPTED_VIDEO_TYPES.join(',')}
              onChange={(e) => handleFileUpload(e.target.files, 'videos')}
              className="hidden"
            />

            {errors.files && (
              <p className="mt-2 text-sm text-red-600">{errors.files}</p>
            )}

            {/* File Preview */}
            {(formData.photos.length > 0 || formData.videos.length > 0) && (
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Uploaded Files:</h4>
                <div className="space-y-2">
                  {formData.photos.map((file, index) => (
                    <div key={`photo-${index}`} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileImage className="h-4 w-4 text-blue-500" />
                        <span className="text-sm text-gray-700 truncate">{file.name}</span>
                        <span className="text-xs text-gray-500">({formatFileSize(file.size)})</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index, 'photos')}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {formData.videos.map((file, index) => (
                    <div key={`video-${index}`} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileVideo className="h-4 w-4 text-purple-500" />
                        <span className="text-sm text-gray-700 truncate">{file.name}</span>
                        <span className="text-xs text-gray-500">({formatFileSize(file.size)})</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index, 'videos')}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Contact Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Preferred Contact Method *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { value: 'EMAIL', label: 'Email', icon: Mail, description: 'Email updates' },
                { value: 'PHONE', label: 'Phone', icon: Phone, description: 'Phone calls' },
                { value: 'BOTH', label: 'Both', icon: User, description: 'Email & phone' }
              ].map(option => (
                <label
                  key={option.value}
                  className={`relative flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                    formData.contactMethod === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="contactMethod"
                    value={option.value}
                    checked={formData.contactMethod === option.value}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactMethod: e.target.value as any }))}
                    className="sr-only"
                  />
                  <div className="flex items-center gap-3">
                    <option.icon className="h-5 w-5 text-gray-600" />
                    <div>
                      <div className="font-medium text-sm">{option.label}</div>
                      <div className="text-xs text-gray-500">{option.description}</div>
                    </div>
                  </div>
                  {formData.contactMethod === option.value && (
                    <CheckCircle className="h-5 w-5 text-blue-600 ml-auto" />
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes
            </label>
            <textarea
              value={formData.additionalNotes}
              onChange={(e) => setFormData(prev => ({ ...prev, additionalNotes: e.target.value }))}
              placeholder="Any additional information or special requirements..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">What happens next?</p>
                <ul className="space-y-1 text-blue-700">
                  <li>• We'll review your request within 2-4 hours</li>
                  <li>• A qualified technician will be assigned to your case</li>
                  <li>• You'll receive a quote and scheduling options</li>
                  <li>• Service will be completed according to your preferences</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}