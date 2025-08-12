# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Rewordify-AI is a Chrome extension (Manifest V3) that enhances text input fields across the web with AI-powered text rewriting capabilities. The extension injects AI icons next to supported text fields and sends user text to an AWS Lambda backend that proxies requests to OpenRouter's API for text processing.

## Architecture

### Core Components

- **manifest.json**: Chrome extension configuration with Manifest V3 specifications
- **content.js**: Content script that runs on all web pages to inject AI icons and handle user interactions
- **background.js**: Service worker that handles API communication with the Lambda backend
- **icon.png**: Extension icon (128x128)

### Text Processing Flow

1. Content script identifies supported text fields (`contenteditable` elements with `aria-label`)
2. AI icons are dynamically injected next to these fields
3. User clicks AI icon → content script extracts text → sends message to background script
4. Background script sends POST request to AWS Lambda with pre-shared key authentication
5. Lambda proxies request to OpenRouter API and returns polished text
6. Background script receives response and sends back to content script
7. Content script replaces original text with polished version

### Backend Integration

The extension communicates with an AWS Lambda function at:
- URL: `https://dbnn5yow7n6hnckltm57ghtolu0jgcth.lambda-url.us-east-1.on.aws/`
- Authentication: Pre-shared key in header (`X-Pre-Shared-Key`)
- Request format: `{ "text": "user input" }`
- Response format: `{ "polishedText": "improved text" }`

## Development Commands

This is a simple Chrome extension without build tools or package.json. Development involves:

### Testing the Extension
1. Open `chrome://extensions/` in Chrome
2. Enable "Developer Mode"
3. Click "Load Unpacked" and select the project directory
4. Test on websites with text input fields

### Debugging
- Check browser console for content script logs
- Use Chrome DevTools > Extensions tab for background script debugging
- Look for console messages starting with "📤", "📥", or "❌"

## Key Implementation Details

### DOM Injection Strategy
- Only targets `[contenteditable="true"][aria-label]` elements
- Uses `dataset.aiIconAdded` to prevent duplicate icon injection
- Creates wrapper div for proper icon positioning
- Uses MutationObserver for dynamic content detection

### Error Handling
- Network failures fallback to returning original text
- Try-catch blocks prevent extension crashes
- Console logging for debugging API communication

### Icon Management
- Base64-encoded icon data embedded in content script
- Loading spinner swapped during API calls
- Consistent styling with absolute positioning and z-index management

## Security Considerations

- Pre-shared key authentication with Lambda backend
- No sensitive data stored locally
- API key hidden behind Lambda proxy
- Content Security Policy restrictions apply (Manifest V3)