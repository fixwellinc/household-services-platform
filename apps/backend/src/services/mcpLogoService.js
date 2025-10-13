/**
 * MCP Logo Generation Service
 * Integrates with Google Gemini via Banana for AI-powered logo creation
 */

import fs from 'fs/promises';
import path from 'path';
import fetch from 'node-fetch';

export interface LogoGenerationRequest {
  companyName: string;
  description: string;
  style: 'modern' | 'classic' | 'minimalist' | 'playful' | 'professional';
  colors: string[];
  industry: string;
  format: 'png' | 'svg' | 'jpg';
  size: 'small' | 'medium' | 'large';
}

export interface LogoGenerationResponse {
  success: boolean;
  logoUrl?: string;
  logoPath?: string;
  error?: string;
  metadata?: {
    prompt: string;
    model: string;
    generationTime: number;
    timestamp: string;
  };
}

export class MCPLogoService {
  private bananaApiKey: string;
  private bananaModelKey: string;
  private isConfigured = false;

  constructor() {
    this.bananaApiKey = process.env.BANANA_API_KEY || '';
    this.bananaModelKey = process.env.BANANA_MODEL_KEY || '';
    this.isConfigured = !!(this.bananaApiKey && this.bananaModelKey);
    
    if (this.isConfigured) {
      console.log('✅ Gemini via Banana Logo Service configured successfully');
    } else {
      console.warn('⚠️ Gemini via Banana not configured. Set BANANA_API_KEY and BANANA_MODEL_KEY environment variables.');
    }
  }

  /**
   * Generate a logo using Google Gemini via Banana
   */
  async generateLogo(request: LogoGenerationRequest): Promise<LogoGenerationResponse> {
    if (!this.isConfigured) {
      return {
        success: false,
        error: 'Gemini via Banana service not configured. Please set BANANA_API_KEY and BANANA_MODEL_KEY environment variables.'
      };
    }

    try {
      const startTime = Date.now();
      
      // Create a detailed prompt for logo generation
      const prompt = this.createLogoPrompt(request);
      
      // Call Gemini via Banana for image generation
      const result = await this.callGeminiViaBanana(prompt, request);
      
      if (result.success && result.imageData) {
        // Save the generated logo
        const logoPath = await this.saveLogo(result.imageData, request);
        
        const generationTime = Date.now() - startTime;
        
        return {
          success: true,
          logoPath,
          logoUrl: `/api/logos/${path.basename(logoPath)}`,
          metadata: {
            prompt,
            model: 'gemini-via-banana',
            generationTime,
            timestamp: new Date().toISOString()
          }
        };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to generate logo with Gemini'
        };
      }
    } catch (error) {
      console.error('Error generating logo:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Call Gemini via Banana API for image generation
   */
  async callGeminiViaBanana(prompt: string, request: LogoGenerationRequest) {
    try {
      const bananaPayload = {
        modelKey: this.bananaModelKey,
        inputs: {
          prompt: prompt,
          width: this.getImageWidth(request.size),
          height: this.getImageHeight(request.size),
          num_inference_steps: 20,
          guidance_scale: 7.5,
          negative_prompt: "blurry, low quality, distorted, watermark, text overlay",
          num_images: 1
        }
      };

      const response = await fetch('https://api.banana.dev/start/v4/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.bananaApiKey}`
        },
        body: JSON.stringify(bananaPayload)
      });

      if (!response.ok) {
        throw new Error(`Banana API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.id) {
        // Poll for completion
        return await this.pollBananaResult(result.id);
      } else {
        return {
          success: false,
          error: 'No job ID returned from Banana API'
        };
      }
    } catch (error) {
      console.error('Error calling Gemini via Banana:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Poll Banana API for job completion
   */
  async pollBananaResult(jobId: string, maxAttempts = 30) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await fetch(`https://api.banana.dev/check/v4/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.bananaApiKey}`
          },
          body: JSON.stringify({
            id: jobId
          })
        });

        if (!response.ok) {
          throw new Error(`Banana check API error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        
        if (result.finished) {
          if (result.outputs && result.outputs.length > 0) {
            return {
              success: true,
              imageData: result.outputs[0]
            };
          } else {
            return {
              success: false,
              error: 'No image data in completed job'
            };
          }
        }

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error('Error polling Banana result:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
      }
    }

    return {
      success: false,
      error: 'Job timed out after maximum attempts'
    };
  }

  /**
   * Create a detailed prompt for logo generation
   */
  private createLogoPrompt(request: LogoGenerationRequest): string {
    const { companyName, description, style, colors, industry } = request;
    
    const styleDescriptions = {
      modern: 'clean, contemporary design with geometric shapes and modern typography',
      classic: 'traditional, timeless design with elegant serif fonts and classic elements',
      minimalist: 'simple, clean design with minimal elements and lots of white space',
      playful: 'fun, colorful design with rounded shapes and friendly typography',
      professional: 'corporate, trustworthy design with clean lines and professional typography'
    };

    const colorString = colors.length > 0 ? `using colors: ${colors.join(', ')}` : 'using a professional color palette';
    
    return `Create a ${style} logo for "${companyName}", a ${industry} company. 
    Description: ${description}
    Style: ${styleDescriptions[style]}
    ${colorString}
    
    The logo should be:
    - Scalable and work well at different sizes
    - Professional and memorable
    - Suitable for both digital and print use
    - Include the company name "${companyName}"
    - Have a clean background (transparent or white)
    
    Make it unique and distinctive for the ${industry} industry.`;
  }

  /**
   * Get image width based on size preference
   */
  private getImageWidth(size: string): number {
    const sizes = {
      small: 256,
      medium: 512,
      large: 1024
    };
    return sizes[size as keyof typeof sizes] || 512;
  }

  /**
   * Get image height based on size preference
   */
  private getImageHeight(size: string): number {
    const sizes = {
      small: 256,
      medium: 512,
      large: 1024
    };
    return sizes[size as keyof typeof sizes] || 512;
  }

  /**
   * Save the generated logo to the file system
   */
  private async saveLogo(imageData: any, request: LogoGenerationRequest): Promise<string> {
    const uploadsDir = path.join(process.cwd(), 'uploads', 'logos');
    
    // Ensure uploads directory exists
    await fs.mkdir(uploadsDir, { recursive: true });
    
    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${request.companyName.toLowerCase().replace(/\s+/g, '-')}-${timestamp}.${request.format}`;
    const filePath = path.join(uploadsDir, filename);
    
    // Save the image data from Banana API
    if (typeof imageData === 'string') {
      // Handle base64 encoded image from Banana
      const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
      await fs.writeFile(filePath, base64Data, 'base64');
    } else if (imageData.url) {
      // Handle image URL from Banana
      const response = await fetch(imageData.url);
      const buffer = await response.arrayBuffer();
      await fs.writeFile(filePath, Buffer.from(buffer));
    } else if (imageData.base64) {
      // Handle base64 field from Banana
      const base64Data = imageData.base64.replace(/^data:image\/[a-z]+;base64,/, '');
      await fs.writeFile(filePath, base64Data, 'base64');
    } else {
      throw new Error('Unsupported image data format from Banana API');
    }
    
    return filePath;
  }

  /**
   * Get available logo styles
   */
  getAvailableStyles(): string[] {
    return ['modern', 'classic', 'minimalist', 'playful', 'professional'];
  }

  /**
   * Get available industries
   */
  getAvailableIndustries(): string[] {
    return [
      'Technology',
      'Healthcare',
      'Finance',
      'Education',
      'Retail',
      'Food & Beverage',
      'Real Estate',
      'Consulting',
      'Manufacturing',
      'Entertainment',
      'Sports & Fitness',
      'Travel & Tourism',
      'Automotive',
      'Beauty & Wellness',
      'Legal Services',
      'Other'
    ];
  }

  /**
   * Check if the service is properly configured
   */
  isServiceConfigured(): boolean {
    return this.isConfigured;
  }
}

// Export singleton instance
export const mcpLogoService = new MCPLogoService();
