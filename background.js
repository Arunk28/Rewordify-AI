// Replace with your actual Lambda function URL
const LAMBDA_URL = "https://hc22vsvqqkr6hx24ik444ahfr40dtixf.lambda-url.us-east-1.on.aws/";

// Rate limiting configuration
const RATE_LIMIT = {
  maxRequests: 60, // requests per minute
  windowMs: 60000, // 1 minute
  requests: [],
  lastCleanup: Date.now()
};

// Request timeout configuration
const REQUEST_TIMEOUT = 30000; // 30 seconds


// Enhanced message listener with error handling and rate limiting
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "polishText") {
    handlePolishTextRequest(request, sender, sendResponse);
    return true; // Keep message channel open for async
  }
});

// Handle polish text request with comprehensive error handling
async function handlePolishTextRequest(request, sender, sendResponse) {
  try {
    // Validate request
    const validation = validateRequest(request);
    if (!validation.valid) {
      sendResponse({ 
        polishedText: request.text,
        error: validation.error 
      });
      return;
    }
    
    // Check rate limiting
    if (!checkRateLimit()) {
      sendResponse({ 
        polishedText: request.text,
        error: 'Rate limit exceeded. Please wait a moment and try again.' 
      });
      return;
    }
    
    // Prepare payload with mode information
    const payload = {
      text: request.text,
      mode: request.mode || 'rewrite',
      submode: request.submode || null,
      timestamp: request.timestamp || Date.now()
    };
    
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    
    try {
      const response = await fetch(LAMBDA_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Pre-Shared-Key": "ff4a076d-2b8c-46f5-b806-3382876272b4"
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        // Try to get more detailed error from response
        try {
          const errorData = await response.text();
          if (errorData) {
            const parsed = JSON.parse(errorData);
            errorMessage = parsed.error || errorMessage;
          }
        } catch (e) {
          // Ignore parsing errors, use default message
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      
      // Validate response
      if (!data || !data.polishedText || typeof data.polishedText !== 'string') {
        throw new Error('Invalid response format from AI service');
      }
      
      
      sendResponse({ 
        polishedText: data.polishedText,
        mode: data.mode || payload.mode,
        submode: data.submode || payload.submode,
        originalLength: data.originalLength,
        processedLength: data.processedLength
      });
      
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      let errorMessage = 'Failed to process text';
      
      if (fetchError.name === 'AbortError') {
        errorMessage = 'Request timed out. Please try again.';
      } else if (fetchError.message.includes('Failed to fetch')) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else {
        errorMessage = fetchError.message;
      }
      
      
      sendResponse({ 
        polishedText: request.text,
        error: errorMessage
      });
    }
    
  } catch (error) {
    sendResponse({ 
      polishedText: request.text,
      error: 'An unexpected error occurred. Please try again.'
    });
  }
}

// Validate incoming request
function validateRequest(request) {
  if (!request.text || typeof request.text !== 'string') {
    return { valid: false, error: 'Invalid text provided' };
  }
  
  if (request.text.length === 0) {
    return { valid: false, error: 'Text cannot be empty' };
  }
  
  if (request.text.length > 10000) {
    return { valid: false, error: 'Text is too long (max 10,000 characters)' };
  }
  
  // Check for valid modes
  const validModes = ['rewrite', 'tone', 'length', 'style', 'translate', 'summarize', 'grammar', 'clarity'];
  if (request.mode && !validModes.includes(request.mode)) {
    return { valid: false, error: 'Invalid AI mode specified' };
  }
  
  return { valid: true };
}

// Check rate limiting
function checkRateLimit() {
  const now = Date.now();
  
  // Clean up old requests periodically
  if (now - RATE_LIMIT.lastCleanup > RATE_LIMIT.windowMs) {
    RATE_LIMIT.requests = RATE_LIMIT.requests.filter(
      timestamp => now - timestamp < RATE_LIMIT.windowMs
    );
    RATE_LIMIT.lastCleanup = now;
  }
  
  // Check if we're under the rate limit
  if (RATE_LIMIT.requests.length >= RATE_LIMIT.maxRequests) {
    return false;
  }
  
  // Add current request
  RATE_LIMIT.requests.push(now);
  return true;
}

chrome.runtime.onInstalled.addListener((details) => {
  
  if (details.reason === 'install') {
    // Set default settings on install
    chrome.storage.sync.set({
      contentEditable: true,
      textarea: true,
      input: true,
      dropdownPosition: 'smart',
      preferredSide: 'left'
    });
  }
});