# Gemini via Banana Logo Generator Integration

This project now includes a complete Google Gemini via Banana integration for AI-powered logo generation.

## 🎨 Features

- **AI-Powered Logo Generation**: Create professional logos using Google Gemini via Banana
- **Customizable Styles**: Choose from modern, classic, minimalist, playful, or professional styles
- **Industry-Specific**: Tailored logos for different industries
- **Color Customization**: Specify custom color palettes
- **Multiple Formats**: Generate logos in PNG, SVG, or JPG formats
- **Multiple Sizes**: Small (256x256), Medium (512x512), or Large (1024x1024)
- **Logo Management**: Upload, download, and delete logos
- **Admin Interface**: Full admin panel integration

## 🚀 How to Use

### 1. Access the Logo Generator
- Navigate to `/admin/logo-generator` in your admin panel
- The Logo Generator will appear in the admin navigation menu

### 2. Generate a Logo
1. **Company Name**: Enter your company name (required)
2. **Description**: Describe your business
3. **Industry**: Select from available industries
4. **Style**: Choose from available styles
5. **Colors**: Add custom colors to your palette
6. **Format**: Select PNG, SVG, or JPG
7. **Size**: Choose small, medium, or large
8. **Generate**: Click "Generate Logo" to create your logo

### 3. Manage Logos
- **Download**: Download generated logos
- **Upload**: Upload custom logo files
- **Delete**: Remove unwanted logos
- **View All**: Browse all generated and uploaded logos

## 🔧 Technical Implementation

### Backend Components

#### Gemini via Banana Logo Service (`apps/backend/src/services/mcpLogoService.js`)
- Connects to Google Gemini via Banana API
- Handles logo generation requests with AI
- Manages file storage and retrieval
- Provides style and industry options

#### Logo API Routes (`apps/backend/src/routes/logos.js`)
- `POST /api/logos/generate` - Generate new logo
- `GET /api/logos/styles` - Get available styles
- `GET /api/logos/industries` - Get available industries
- `GET /api/logos/list` - List all logos
- `GET /api/logos/:filename` - Serve logo files
- `POST /api/logos/upload` - Upload custom logo
- `DELETE /api/logos/:filename` - Delete logo

### Frontend Components

#### Logo Generator Component (`apps/frontend/components/admin/LogoGenerator.tsx`)
- Complete UI for logo generation
- Form validation and error handling
- Real-time preview of generated logos
- Logo management interface

#### Admin Integration
- Added to admin navigation menu
- Accessible at `/admin/logo-generator`
- Integrated with existing admin authentication

#### API Client (`apps/frontend/lib/api.ts`)
- Logo generation methods
- File upload/download handling
- Error handling and type safety

## 🛠️ Setup Requirements

### Gemini via Banana Dependencies
The system uses Google Gemini via Banana for image generation. You'll need to:

1. **Get Banana API Key**: Sign up at [banana.dev](https://banana.dev) and get your API key

2. **Get Model Key**: Deploy a Gemini image generation model on Banana and get the model key

3. **Environment Variables**: Set the following environment variables:
   ```bash
   BANANA_API_KEY=your_banana_api_key_here
   BANANA_MODEL_KEY=your_banana_model_key_here
   ```

### File Storage
- Logos are stored in `uploads/logos/` directory
- Ensure the directory has proper write permissions
- Files are served via `/api/logos/:filename` endpoint

## 🎯 Usage Examples

### Generate a Modern Tech Logo
```javascript
const logoRequest = {
  companyName: "TechCorp",
  description: "Innovative software solutions",
  style: "modern",
  colors: ["#2563eb", "#1e40af"],
  industry: "Technology",
  format: "png",
  size: "medium"
};

const result = await api.generateLogo(logoRequest);
// Uses Google Gemini via Banana for AI-powered generation
```

### Upload Custom Logo
```javascript
const file = document.getElementById('logo-file').files[0];
const result = await api.uploadLogo(file);
```

## 🔒 Security & Permissions

- **Admin Only**: Logo generation is restricted to admin users
- **File Validation**: Uploaded files are validated for type and size
- **Authentication**: All endpoints require proper authentication
- **Rate Limiting**: API endpoints are protected with rate limiting

## 📁 File Structure

```
apps/
├── backend/
│   ├── src/
│   │   ├── services/
│   │   │   └── mcpLogoService.js      # MCP integration service
│   │   └── routes/
│   │       └── logos.js               # Logo API endpoints
│   └── uploads/
│       └── logos/                     # Generated logo storage
└── frontend/
    ├── components/admin/
    │   └── LogoGenerator.tsx          # Main logo generator UI
    ├── app/admin/logo-generator/
    │   └── page.tsx                   # Admin page
    └── lib/
        └── api.ts                     # API client methods
```

## 🚀 Future Enhancements

- **Batch Generation**: Generate multiple logo variations
- **Logo Templates**: Pre-designed logo templates
- **Brand Guidelines**: Generate brand style guides
- **Logo History**: Track logo generation history
- **Collaboration**: Team logo creation workflows
- **Export Options**: Additional export formats and sizes

## 🐛 Troubleshooting

### Common Issues

1. **Banana API Connection Failed**
   - Ensure BANANA_API_KEY and BANANA_MODEL_KEY are set
   - Check Banana API status and quotas
   - Verify network connectivity

2. **Logo Generation Failed**
   - Check company name is provided
   - Verify style and format selections
   - Ensure sufficient disk space
   - Check Banana API response for errors

3. **Upload Issues**
   - Check file size (max 10MB)
   - Verify file format (PNG, JPG, SVG)
   - Ensure proper permissions

### Debug Mode
Enable debug logging by setting `NODE_ENV=development` to see detailed Banana API communication logs.

## 📞 Support

For issues with the Gemini via Banana Logo Generator:
1. Check the browser console for errors
2. Review server logs for Banana API connection issues
3. Verify file permissions and storage space
4. Ensure environment variables are properly set
5. Check Banana API quotas and billing

---

**Note**: This integration uses Google Gemini via Banana for AI-powered logo generation. You'll need a Banana account and API keys to use the logo generation features.
