## Development

### Project Structure

```
src/
├── api/
│   ├── dataGenerator.ts      # Legacy Gemini data generator
│   └── middleware.js          # Legacy middleware
├── services/
│   ├── geminiService.ts       # New Gemini API integration with caching
│   └── storageService.ts      # Storage management for custom/generated data
├── background.ts              # Background script for message handling
├── contents/
│   └── autofill.ts           # Content script for form detection and filling
├── features/
│   ├── custom-tab.tsx        # Custom credentials UI
│   └── fill-button.tsx       # AutoFill button component
├── popup.tsx                 # Main popup UI
└── options.tsx               # Options page
```

### Key Technologies

- **Framework**: Plasmo (Chrome Extension Framework)
- **UI**: React 19, Tailwind CSS
- **AI**: Google Gemini API (gemini-2.0-flash-exp)
- **Storage**: Chrome Storage API
- **Icons**: Lucide React

This is a [Plasmo extension](https://docs.plasmo.com/) project bootstrapped with [`plasmo init`](https://www.npmjs.com/package/plasmo).

## Getting Started

First, run the development server:

```bash
pnpm dev
# or
npm run dev
```

Open your browser and load the appropriate development build. For example, if you are developing for the chrome browser, using manifest v3, use: `build/chrome-mv3-dev`.

You can start editing the popup by modifying `popup.tsx`. It should auto-update as you make changes. To add an options page, simply add a `options.tsx` file to the root of the project, with a react component default exported. Likewise to add a content page, add a `content.ts` file to the root of the project, importing some module and do some logic, then reload the extension on your browser.

For further guidance, [visit our Documentation](https://docs.plasmo.com/)

## Making production build

Run the following:

```bash
pnpm build
# or
npm run build
```

This should create a production bundle for your extension, ready to be zipped and published to the stores.

## Submit to the webstores

The easiest way to deploy your Plasmo extension is to use the built-in [bpp](https://bpp.browser.market) GitHub action. Prior to using this action however, make sure to build your extension and upload the first version to the store to establish the basic credentials. Then, simply follow [this setup instruction](https://docs.plasmo.com/framework/workflows/submit) and you should be on your way for automated submission!

# AutoFill Extension

An intelligent browser extension that automatically fills web forms with either your custom data or AI-generated dummy data using Google's Gemini API.

## Features

- 🎯 **Smart Form Detection**: Automatically detects and fills username, email, password, name, DOB, and gender fields
- ✨ **AI-Powered Data Generation**: Uses Google Gemini API to generate realistic dummy data when no custom data is provided
- 🔒 **Custom Data Support**: Save your own credentials for quick form filling
- 🎨 **Modern UI**: Clean, intuitive interface built with React and Tailwind CSS
- 🔄 **Flexible Data Source**: Automatically switches between custom data and AI-generated data

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- pnpm (or npm)
- Google Gemini API Key ([Get one here](https://makersuite.google.com/app/apikey))

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd AutoFill
```

2. Install dependencies:

```bash
pnpm install
```

3. Set up your environment variables:

```bash
cp .env.example .env
```

4. Add your Gemini API key to the `.env` file:

```env
PLASMO_PUBLIC_GEMINI_API_KEY=your_actual_api_key_here
```

5. Start the development server:

```bash
pnpm dev
```

6. Load the extension in your browser:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `build/chrome-mv3-dev` directory

### Usage

#### With Custom Data

1. Click the extension icon
2. Click "Custom" to open the custom credentials tab
3. Fill in your preferred data
4. Click "Save"
5. Navigate to any form and click "AutoFill"

#### With AI-Generated Data

1. If no custom data is saved, the extension will automatically use Gemini AI to generate realistic dummy data
2. Simply click the "AutoFill" button on any form
3. The extension will show "(AI Generated)" when using AI-generated data

### How It Works

The extension uses a smart fallback system:

1. **First Priority**: Checks if you have saved custom data
2. **Fallback**: If no custom data exists, generates realistic dummy data using Gemini API
3. **Caching**: Generated data is cached for 5 minutes to reduce API calls

## Development
