let currentSettings = {
  contentEditable: true,
  textarea: false,
  input: false
};

// Load settings on initialization
async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get(currentSettings);
    currentSettings = result;
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

// Listen for settings updates from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateSettings') {
    currentSettings = request.settings;
    // Remove all existing icons and re-add based on new settings
    removeAllAIIcons();
    addAIIcons();
    sendResponse({ success: true });
  }
});

function removeAllAIIcons() {
  // Remove all AI icons and unwrap elements
  document.querySelectorAll('[data-ai-icon-added]').forEach(element => {
    const wrapper = element.parentElement;
    if (wrapper && wrapper.querySelector('.ai-icon')) {
      const icon = wrapper.querySelector('.ai-icon');
      if (icon) icon.remove();
      
      // Unwrap the element
      wrapper.parentNode.insertBefore(element, wrapper);
      wrapper.remove();
    }
    delete element.dataset.aiIconAdded;
  });
}

function getTargetElements() {
  const elements = [];
  
  // Get contenteditable elements
  if (currentSettings.contentEditable) {
    const contentEditableElements = document.querySelectorAll('[contenteditable="true"]');
    elements.push(...Array.from(contentEditableElements));
  }
  
  // Get textarea elements
  if (currentSettings.textarea) {
    const textareaElements = document.querySelectorAll('textarea');
    elements.push(...Array.from(textareaElements));
  }
  
  // Get input elements (text-based only)
  if (currentSettings.input) {
    const inputElements = document.querySelectorAll('input[type="text"], input[type="email"], input[type="search"], input[type="url"], input[type="tel"], input[type="password"], input:not([type])');
    elements.push(...Array.from(inputElements));
  }
  
  // Remove duplicates and filter out elements that are not suitable
  const uniqueElements = [...new Set(elements)].filter(element => {
    // Skip hidden or disabled elements
    if (element.disabled || element.readOnly) return false;
    if (element.style.display === 'none' || element.style.visibility === 'hidden') return false;
    
    // Check computed styles for hidden elements
    const computedStyle = window.getComputedStyle(element);
    if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden') return false;
    
    // Skip elements that are too small (but allow 0 width/height as they might be dynamically sized)
    const rect = element.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0 && (rect.width < 30 || rect.height < 15)) return false;
    
    return true;
  });
  
  console.log(`🔍 Rewordify-AI found ${uniqueElements.length} target elements:`, uniqueElements);
  return uniqueElements;
}

function addAIIcons() {
  const targetElements = getTargetElements();
  
  targetElements.forEach(input => {
    if (input.dataset.aiIconAdded) return;
    input.dataset.aiIconAdded = "true";

    const tagName = input.tagName.toLowerCase();
    const isTextarea = tagName === 'textarea';
    const isInput = tagName === 'input';
    
    // Create wrapper for proper positioning
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      position: relative;
      display: inline-block;
      width: ${input.offsetWidth || input.clientWidth}px;
      ${isTextarea ? `height: ${input.offsetHeight || input.clientHeight}px;` : ''}
    `;

    // Replace input with wrapper + input
    input.parentNode.insertBefore(wrapper, input);
    wrapper.appendChild(input);
    
    // Reset input width to 100% so it fills the wrapper
    if (isInput || isTextarea) {
      input.style.width = '100%';
      input.style.boxSizing = 'border-box';
      if (isTextarea) {
        input.style.height = '100%';
      }
    }

    // Create AI icon
    const icon = document.createElement('img');
    icon.src = "data:image/png;base64,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";
    icon.className = 'ai-icon';

    // Position icon based on element type
    if (isTextarea) {
      icon.style.cssText = `
        width: 20px;
        height: 20px;
        position: absolute;
        top: 8px;
        right: 8px;
        cursor: pointer;
        z-index: 9999;
        background: white;
        border-radius: 50%;
        padding: 2px;
        box-shadow: 0 0 2px rgba(0,0,0,0.3);
      `;
    } else {
      icon.style.cssText = `
        width: 20px;
        height: 20px;
        position: absolute;
        top: 50%;
        right: 8px;
        transform: translateY(-50%);
        cursor: pointer;
        z-index: 9999;
        background: white;
        border-radius: 50%;
        padding: 2px;
        box-shadow: 0 0 2px rgba(0,0,0,0.3);
      `;
    }

    icon.onclick = () => handleClickAI(input);
    wrapper.appendChild(icon);
  });
}


// Handle AI Click Event
function handleClickAI(input) {
  const isContentEditable = input.getAttribute("contenteditable") === "true" || input.isContentEditable;
  const tagName = input.tagName.toLowerCase();
  
  let originalText;
  if (isContentEditable) {
    originalText = input.innerText || input.textContent;
  } else if (tagName === 'input' || tagName === 'textarea') {
    originalText = input.value;
  } else {
    originalText = input.textContent || input.innerText;
  }

  const icon = input.parentElement.querySelector(".ai-icon");
  const originalIconSrc = icon.src;
  const spinnerUrl = "https://upload.wikimedia.org/wikipedia/commons/c/c7/Loading_2.gif";

  // Swap icon to loading spinner
  icon.src = spinnerUrl;

  // Console log to verify input was picked
  console.log("📤 Sending to OpenRouter:", originalText);

  chrome.runtime.sendMessage({ action: 'polishText', text: originalText }, response => {
    if (response && response.polishedText) {
      console.log("📥 Polished Response:", response.polishedText);

      // Set the polished text based on element type
      if (isContentEditable) {
        input.innerText = response.polishedText;
      } else if (tagName === 'input' || tagName === 'textarea') {
        input.value = response.polishedText;
      } else {
        input.textContent = response.polishedText;
      }
      
      // Trigger input event to notify any listeners
      const event = new Event('input', { bubbles: true });
      input.dispatchEvent(event);
    } else {
      console.warn("❌ No response from OpenRouter or failed");
    }
    // Restore original icon
    icon.src = originalIconSrc;
  });
}

// Initialize the extension
async function initializeExtension() {
  try {
    // Load settings first
    await loadSettings();
    
    // Initial Load
    addAIIcons();

    // Monitor DOM changes dynamically
    const observer = new MutationObserver(addAIIcons);
    observer.observe(document.body, { childList: true, subtree: true });
    
    console.log('✅ Rewordify-AI extension initialized successfully');
  } catch (e) {
    console.error('❌ AI Extension failed to initialize:', e);
  }
}

// Start the extension
initializeExtension();