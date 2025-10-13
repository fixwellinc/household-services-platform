'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shared';
import { Button } from '@/components/ui/shared';
import { Badge } from '@/components/ui/shared';
import { 
  Wand2, 
  Download, 
  Trash2, 
  Upload, 
  Palette, 
  Building2, 
  Sparkles,
  Loader2,
  CheckCircle,
  AlertCircle,
  Image as ImageIcon,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

interface LogoGenerationRequest {
  companyName: string;
  description: string;
  style: 'modern' | 'classic' | 'minimalist' | 'playful' | 'professional';
  colors: string[];
  industry: string;
  format: 'png' | 'svg' | 'jpg';
  size: 'small' | 'medium' | 'large';
}

interface GeneratedLogo {
  logoUrl: string;
  metadata: {
    prompt: string;
    model: string;
    generationTime: number;
    timestamp: string;
  };
}

interface LogoFile {
  filename: string;
  url: string;
  createdAt: string;
}

export default function LogoGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [generatedLogo, setGeneratedLogo] = useState<GeneratedLogo | null>(null);
  const [logos, setLogos] = useState<LogoFile[]>([]);
  const [availableStyles, setAvailableStyles] = useState<string[]>([]);
  const [availableIndustries, setAvailableIndustries] = useState<string[]>([]);
  
  const [formData, setFormData] = useState<LogoGenerationRequest>({
    companyName: 'Fixwell Services',
    description: 'Professional home services company specializing in cleaning, maintenance, and repairs',
    style: 'modern',
    colors: ['#2563eb', '#1e40af'],
    industry: 'Technology',
    format: 'png',
    size: 'medium'
  });

  const [colorInput, setColorInput] = useState('#2563eb');

  useEffect(() => {
    fetchAvailableOptions();
    fetchExistingLogos();
  }, []);

  const fetchAvailableOptions = async () => {
    try {
      const [stylesData, industriesData] = await Promise.all([
        api.getLogoStyles(),
        api.getLogoIndustries()
      ]);

      if (stylesData.success) setAvailableStyles(stylesData.styles);
      if (industriesData.success) setAvailableIndustries(industriesData.industries);
    } catch (error) {
      console.error('Error fetching options:', error);
    }
  };

  const fetchExistingLogos = async () => {
    try {
      const data = await api.getLogos();
      
      if (data.success) {
        setLogos(data.logos);
      }
    } catch (error) {
      console.error('Error fetching logos:', error);
    }
  };

  const handleInputChange = (field: keyof LogoGenerationRequest, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addColor = () => {
    if (colorInput && !formData.colors.includes(colorInput)) {
      setFormData(prev => ({
        ...prev,
        colors: [...prev.colors, colorInput]
      }));
    }
  };

  const removeColor = (colorToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      colors: prev.colors.filter(color => color !== colorToRemove)
    }));
  };

  const generateLogo = async () => {
    if (!formData.companyName.trim()) {
      toast.error('Company name is required');
      return;
    }

    setIsGenerating(true);
    try {
      const data = await api.generateLogo(formData);

      if (data.success) {
        setGeneratedLogo({
          logoUrl: data.logoUrl!,
          metadata: data.metadata!
        });
        toast.success('Logo generated successfully!');
        fetchExistingLogos(); // Refresh the list
      } else {
        toast.error(data.error || 'Failed to generate logo');
      }
    } catch (error) {
      console.error('Error generating logo:', error);
      toast.error('Failed to generate logo');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const data = await api.uploadLogo(file);

      if (data.success) {
        toast.success('Logo uploaded successfully!');
        fetchExistingLogos(); // Refresh the list
      } else {
        toast.error(data.error || 'Failed to upload logo');
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo');
    } finally {
      setIsUploading(false);
    }
  };

  const deleteLogo = async (filename: string) => {
    try {
      const data = await api.deleteLogo(filename);

      if (data.success) {
        toast.success('Logo deleted successfully!');
        fetchExistingLogos(); // Refresh the list
        
        // Clear generated logo if it was the one deleted
        if (generatedLogo?.logoUrl.includes(filename)) {
          setGeneratedLogo(null);
        }
      } else {
        toast.error(data.error || 'Failed to delete logo');
      }
    } catch (error) {
      console.error('Error deleting logo:', error);
      toast.error('Failed to delete logo');
    }
  };

  const downloadLogo = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Logo Generator</h1>
          <p className="text-gray-600 mt-2">
            Create professional logos using AI-powered MCP technology
          </p>
        </div>
        <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
          <Sparkles className="h-3 w-3 mr-1" />
          AI Powered
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Logo Generation Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-purple-600" />
              Generate New Logo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Company Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name *
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter company name"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows={3}
                placeholder="Describe your business..."
              />
            </div>

            {/* Industry */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Industry
              </label>
              <select
                value={formData.industry}
                onChange={(e) => handleInputChange('industry', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {availableIndustries.map(industry => (
                  <option key={industry} value={industry}>{industry}</option>
                ))}
              </select>
            </div>

            {/* Style */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Style
              </label>
              <div className="grid grid-cols-2 gap-2">
                {availableStyles.map(style => (
                  <button
                    key={style}
                    onClick={() => handleInputChange('style', style)}
                    className={`p-2 text-sm rounded-md border transition-colors ${
                      formData.style === style
                        ? 'bg-purple-100 border-purple-500 text-purple-700'
                        : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {style.charAt(0).toUpperCase() + style.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Colors */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Colors
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="color"
                  value={colorInput}
                  onChange={(e) => setColorInput(e.target.value)}
                  className="w-10 h-10 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={colorInput}
                  onChange={(e) => setColorInput(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="#2563eb"
                />
                <Button onClick={addColor} size="sm">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.colors.map((color, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-1 bg-gray-100 rounded-md px-2 py-1"
                  >
                    <div
                      className="w-4 h-4 rounded border"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-sm text-gray-700">{color}</span>
                    <button
                      onClick={() => removeColor(color)}
                      className="text-gray-500 hover:text-red-500"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Format and Size */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Format
                </label>
                <select
                  value={formData.format}
                  onChange={(e) => handleInputChange('format', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="png">PNG</option>
                  <option value="svg">SVG</option>
                  <option value="jpg">JPG</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Size
                </label>
                <select
                  value={formData.size}
                  onChange={(e) => handleInputChange('size', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="small">Small (256x256)</option>
                  <option value="medium">Medium (512x512)</option>
                  <option value="large">Large (1024x1024)</option>
                </select>
              </div>
            </div>

            {/* Generate Button */}
            <Button
              onClick={generateLogo}
              disabled={isGenerating || !formData.companyName.trim()}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Generate Logo
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Generated Logo Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-blue-600" />
              Generated Logo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {generatedLogo ? (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <img
                    src={generatedLogo.logoUrl}
                    alt="Generated Logo"
                    className="max-w-full max-h-64 mx-auto"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={() => downloadLogo(generatedLogo.logoUrl, `${formData.companyName}-logo.${formData.format}`)}
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setGeneratedLogo(null)}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Generate New
                  </Button>
                </div>

                {/* Metadata */}
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Generation Time: {generatedLogo.metadata.generationTime}ms</div>
                  <div>Model: {generatedLogo.metadata.model}</div>
                  <div>Created: {new Date(generatedLogo.metadata.timestamp).toLocaleString()}</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <ImageIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No logo generated yet</p>
                <p className="text-sm">Fill out the form and click "Generate Logo"</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-green-600" />
            Upload Custom Logo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="hidden"
              id="logo-upload"
            />
            <label
              htmlFor="logo-upload"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
                  <p className="text-gray-600">Uploading...</p>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-gray-400" />
                  <p className="text-gray-600">Click to upload or drag and drop</p>
                  <p className="text-sm text-gray-500">PNG, JPG, SVG up to 10MB</p>
                </>
              )}
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Existing Logos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-indigo-600" />
            All Logos ({logos.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {logos.map((logo, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <img
                    src={logo.url}
                    alt={`Logo ${index + 1}`}
                    className="w-full h-24 object-contain mb-2"
                  />
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadLogo(logo.url, logo.filename)}
                      className="flex-1"
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteLogo(logo.filename)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No logos uploaded yet</p>
              <p className="text-sm">Generate or upload your first logo above</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
