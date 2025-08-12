let currentSettings = {
  contentEditable: true,
  textarea: false,
  input: false,
  dropdownPosition: 'smart', // 'smart', 'left', 'right', 'top', 'bottom'
  preferredSide: 'left' // 'left' or 'right' when using smart positioning
};

// AI Modes Configuration - Flattened for better UX
const AI_MODES = [
  { id: 'rewrite', name: '✨ Rewrite', desc: 'General improvement' },
  { id: 'grammar', name: '✅ Fix Grammar', desc: 'Correct errors' },
  { id: 'clarity', name: '💡 Improve Clarity', desc: 'Make clearer' },
  { id: 'tone', submode: 'professional', name: '🎭 Professional Tone', desc: 'Business style' },
  { id: 'tone', submode: 'casual', name: '🎭 Casual Tone', desc: 'Conversational' },
  { id: 'tone', submode: 'friendly', name: '🎭 Friendly Tone', desc: 'Warm & welcoming' },
  { id: 'tone', submode: 'formal', name: '🎭 Formal Tone', desc: 'Academic style' },
  { id: 'length', submode: 'condense', name: '📏 Make Shorter', desc: 'Condense text' },
  { id: 'length', submode: 'expand', name: '📏 Make Longer', desc: 'Add detail' },
  { id: 'length', submode: 'bullets', name: '📏 Bullet Points', desc: 'List format' },
  { id: 'style', submode: 'academic', name: '🎨 Academic Style', desc: 'Scholarly tone' },
  { id: 'style', submode: 'creative', name: '🎨 Creative Style', desc: 'Engaging & vivid' },
  { id: 'style', submode: 'technical', name: '🎨 Technical Style', desc: 'Precise & clear' },
  { id: 'style', submode: 'marketing', name: '🎨 Marketing Style', desc: 'Persuasive' },
  { id: 'summarize', name: '📝 Summarize', desc: 'Key points only' },
  { id: 'translate', submode: 'spanish', name: '🌐 → Spanish', desc: 'Translate' },
  { id: 'translate', submode: 'french', name: '🌐 → French', desc: 'Translate' },
  { id: 'translate', submode: 'german', name: '🌐 → German', desc: 'Translate' },
  { id: 'translate', submode: 'italian', name: '🌐 → Italian', desc: 'Translate' },
  { id: 'translate', submode: 'portuguese', name: '🌐 → Portuguese', desc: 'Translate' },
  { id: 'translate', submode: 'chinese', name: '🌐 → Chinese', desc: 'Translate' },
  { id: 'translate', submode: 'japanese', name: '🌐 → Japanese', desc: 'Translate' }
];

// Global variables for dropdown management
let activeDropdown = null;
let currentTargetElement = null;

// Load settings on initialization
async function loadSettings() {
  console.log('⚙️ Loading settings...');
  try {
    const result = await chrome.storage.sync.get(currentSettings);
    currentSettings = result;
    console.log('✅ Settings loaded:', currentSettings);
  } catch (error) {
    console.error('❌ Error loading settings:', error);
    console.log('🔄 Using default settings:', currentSettings);
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
  console.log('🔍 Getting target elements on:', window.location.hostname);
  console.log('📊 Current settings:', currentSettings);
  
  const elements = [];
  
  // Get contenteditable elements
  if (currentSettings.contentEditable) {
    const contentEditableElements = document.querySelectorAll('[contenteditable="true"]');
    console.log('📝 Found contenteditable elements:', contentEditableElements.length);
    elements.push(...Array.from(contentEditableElements));
  }
  
  // Get textarea elements
  if (currentSettings.textarea) {
    const textareaElements = document.querySelectorAll('textarea');
    console.log('📄 Found textarea elements:', textareaElements.length);
    elements.push(...Array.from(textareaElements));
  }
  
  // Get input elements (text-based only)
  if (currentSettings.input) {
    const inputElements = document.querySelectorAll('input[type="text"], input[type="email"], input[type="search"], input[type="url"], input[type="tel"], input[type="password"], input:not([type])');
    console.log('📝 Found input elements:', inputElements.length);
    elements.push(...Array.from(inputElements));
  }
  
  // Add platform-specific elements
  const platformElements = getPlatformSpecificElements();
  console.log('🌐 Found platform-specific elements:', platformElements.length);
  elements.push(...platformElements);
  
  console.log('🔄 Processing', elements.length, 'elements before filtering');
  
  // Remove duplicates and filter out elements that are not suitable
  const uniqueElements = [...new Set(elements)].filter((element, index) => {
    const elementInfo = {
      tag: element.tagName,
      type: element.type,
      id: element.id,
      class: element.className,
      disabled: element.disabled,
      readOnly: element.readOnly
    };
    
    // Skip hidden or disabled elements
    if (element.disabled || element.readOnly) {
      console.log(`❌ Skipping disabled/readonly element ${index}:`, elementInfo);
      return false;
    }
    
    if (element.style.display === 'none' || element.style.visibility === 'hidden') {
      console.log(`❌ Skipping hidden element ${index}:`, elementInfo);
      return false;
    }
    
    // Check computed styles for hidden elements
    const computedStyle = window.getComputedStyle(element);
    if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden') {
      console.log(`❌ Skipping computed-hidden element ${index}:`, elementInfo);
      return false;
    }
    
    // Skip elements that are too small (but allow 0 width/height as they might be dynamically sized)
    const rect = element.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0 && (rect.width < 30 || rect.height < 15)) {
      console.log(`❌ Skipping too-small element ${index}:`, { ...elementInfo, rect });
      return false;
    }
    
    console.log(`✅ Including element ${index}:`, { ...elementInfo, rect });
    return true;
  });
  
  console.log(`🎯 Final result: ${uniqueElements.length} target elements on ${window.location.hostname}`);
  
  // If no elements found, let's do a more aggressive search
  if (uniqueElements.length === 0) {
    console.log('🔍 No elements found, trying aggressive search...');
    const allInputs = document.querySelectorAll('input, textarea, [contenteditable]');
    console.log('🔍 All input-like elements found:', allInputs.length);
    allInputs.forEach((el, i) => {
      console.log(`Input ${i}:`, {
        tag: el.tagName,
        type: el.type,
        contenteditable: el.contentEditable,
        id: el.id,
        class: el.className,
        visible: el.offsetWidth > 0 && el.offsetHeight > 0,
        rect: el.getBoundingClientRect()
      });
    });
  }
  
  return uniqueElements;
}

// Get platform-specific elements
function getPlatformSpecificElements() {
  const elements = [];
  const hostname = window.location.hostname;
  
  // Gmail
  if (hostname.includes('mail.google.com')) {
    // Gmail compose window
    const gmailElements = document.querySelectorAll([
      '[role="textbox"]',                    // Main compose area
      '.Am.Al.editable',                      // Gmail editor
      '[contenteditable="true"][role="textbox"]', // Alternative compose
      '.ii.gt [contenteditable="true"]',     // Reply box
      '[data-message-id] [contenteditable="true"]' // Inline reply
    ].join(','));
    elements.push(...Array.from(gmailElements));
  }
  
  // LinkedIn
  else if (hostname.includes('linkedin.com')) {
    const linkedinElements = document.querySelectorAll([
      '.ql-editor',                           // Post composer
      '[data-testid="message-conversation-editor"] .ql-editor', // Messages
      '.msg-form__contenteditable',          // Message input
      '[role="textbox"]',                    // Various text inputs
      '.mentions-texteditor__content',       // Comment editor
      '[data-testid="feed-shared-update-v2__commentary"] .ql-editor' // Post updates
    ].join(','));
    elements.push(...Array.from(linkedinElements));
  }
  
  // Twitter/X
  else if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
    const twitterElements = document.querySelectorAll([
      '[data-testid="tweetTextarea_0"]',     // Main tweet compose
      '.DraftEditor-root .DraftEditor-editorContainer [contenteditable="true"]', // Tweet editor
      '[data-testid="dmComposerTextInput"]', // DM input
      '[role="textbox"][contenteditable="true"]', // Various text areas
      '.notranslate[contenteditable="true"]' // Tweet compose area
    ].join(','));
    elements.push(...Array.from(twitterElements));
  }
  
  // Slack
  else if (hostname.includes('slack.com')) {
    const slackElements = document.querySelectorAll([
      '.ql-editor[contenteditable="true"]',  // Message composer
      '[data-qa="message_input"] .ql-editor', // Channel message input
      '.p-message_input .ql-editor',         // Message input
      '[role="textbox"]',                    // Various inputs
      '.c-texty_input .ql-editor'            // Thread replies
    ].join(','));
    elements.push(...Array.from(slackElements));
  }
  
  // Discord
  else if (hostname.includes('discord.com') || hostname.includes('discordapp.com')) {
    const discordElements = document.querySelectorAll([
      '[role="textbox"][contenteditable="true"]', // Message input
      '.markup [contenteditable="true"]',    // Message composer
      '[data-slate-editor="true"]',          // Modern Discord editor
      '.textArea-12jD-V textarea'            // Legacy text areas
    ].join(','));
    elements.push(...Array.from(discordElements));
  }
  
  // Google Docs
  else if (hostname.includes('docs.google.com')) {
    const docsElements = document.querySelectorAll([
      '.kix-canvas-tile-content',            // Google Docs content
      '.docs-text [contenteditable="true"]', // Docs editor
      '[role="textbox"]'                     // Generic text inputs
    ].join(','));
    elements.push(...Array.from(docsElements));
  }
  
  // Notion
  else if (hostname.includes('notion.so') || hostname.includes('notion.com')) {
    const notionElements = document.querySelectorAll([
      '[contenteditable="true"][role="textbox"]', // Notion blocks
      '.notion-text-block [contenteditable="true"]', // Text blocks
      '.notranslate[contenteditable="true"]' // Content areas
    ].join(','));
    elements.push(...Array.from(notionElements));
  }
  
  // Reddit
  else if (hostname.includes('reddit.com')) {
    const redditElements = document.querySelectorAll([
      '.DraftEditor-editorContainer [contenteditable="true"]', // Comment editor
      '[data-testid="comment"] [contenteditable="true"]', // Comment input
      '.usertext-edit textarea',             // Legacy comment box
      '[role="textbox"]'                     // Various inputs
    ].join(','));
    elements.push(...Array.from(redditElements));
  }
  
  // Medium
  else if (hostname.includes('medium.com')) {
    const mediumElements = document.querySelectorAll([
      '[role="textbox"][contenteditable="true"]', // Article editor
      '.graf--p[contenteditable="true"]',    // Paragraph blocks
      '.postArticle [contenteditable="true"]' // Post content
    ].join(','));
    elements.push(...Array.from(mediumElements));
  }
  
  // WhatsApp Web
  else if (hostname.includes('web.whatsapp.com')) {
    const whatsappElements = document.querySelectorAll([
      '[contenteditable="true"][role="textbox"]', // Message input
      '.copyable-text [contenteditable="true"]' // Message composer
    ].join(','));
    elements.push(...Array.from(whatsappElements));
  }
  
  // Generic fallbacks for common editor frameworks
  const genericElements = document.querySelectorAll([
    '.ql-editor',                           // Quill editor
    '.DraftEditor-root [contenteditable="true"]', // Draft.js
    '.ProseMirror',                         // ProseMirror
    '.CodeMirror-code',                     // CodeMirror (for documentation)
    '[role="textbox"]',                    // ARIA textbox role
    '.text-editor [contenteditable="true"]', // Generic text editors
    '.rich-text-editor [contenteditable="true"]' // Rich text editors
  ].join(','));
  elements.push(...Array.from(genericElements));
  
  return elements;
}

function addAIIcons() {
  console.log('🚀 addAIIcons called on:', window.location.hostname);
  
  const targetElements = getTargetElements();
  console.log('📋 Target elements to process:', targetElements.length);
  
  if (targetElements.length === 0) {
    console.warn('⚠️ No target elements found - icons will not be added');
    return;
  }
  
  let iconsAdded = 0;
  let iconsSkipped = 0;
  
  targetElements.forEach((input, index) => {
    console.log(`🔄 Processing element ${index}:`, {
      tag: input.tagName,
      id: input.id,
      hasIcon: !!input.dataset.aiIconAdded
    });
    
    if (input.dataset.aiIconAdded) {
      console.log(`⏭️ Skipping element ${index} - already has icon`);
      iconsSkipped++;
      return;
    }
    
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

    icon.onclick = (e) => {
      console.log('🖱️ Icon onclick triggered', { 
        element: input.tagName, 
        website: window.location.hostname,
        event: e 
      });
      e.stopPropagation();
      e.preventDefault();
      handleClickAI(input, icon);
    };
    
    // Also add event listener as backup
    icon.addEventListener('click', (e) => {
      console.log('🖱️ Icon addEventListener triggered', { 
        element: input.tagName, 
        website: window.location.hostname 
      });
      e.stopPropagation();
      e.preventDefault();
      handleClickAI(input, icon);
    });
    
    wrapper.appendChild(icon);
    console.log(`✅ AI icon added successfully for element ${index}`, { 
      wrapper, 
      icon, 
      input: input.tagName,
      iconVisible: icon.offsetWidth > 0 && icon.offsetHeight > 0
    });
    iconsAdded++;
  });
  
  console.log(`📊 Summary: ${iconsAdded} icons added, ${iconsSkipped} skipped on ${window.location.hostname}`);
}


// Handle AI Click Event
function handleClickAI(input, icon) {
  console.log('🖱️ AI Icon clicked!', { 
    input, 
    icon, 
    website: window.location.hostname,
    inputType: input.tagName,
    isContentEditable: input.contentEditable,
    hasAriaLabel: !!input.getAttribute('aria-label')
  });
  
  // Close any existing dropdown
  closeActiveDropdown();
  
  // Store current target for later use
  currentTargetElement = input;
  
  // Create and show mode selector dropdown
  try {
    showModeSelector(input, icon);
    console.log('✅ Mode selector shown successfully');
  } catch (error) {
    console.error('❌ Error in showModeSelector:', error);
    // Fallback: show alert for now
    alert(`Error opening AI modes on ${window.location.hostname}: ${error.message}`);
  }
}

// Create and show the mode selector dropdown with smart positioning
function showModeSelector(input, icon) {
  console.log('🎯 Creating mode selector', { currentSettings });
  
  try {
    const dropdown = document.createElement('div');
    dropdown.className = 'ai-mode-dropdown';
  
  // Calculate optimal position based on user settings
  const iconRect = icon.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const dropdownWidth = 240;
  const dropdownHeight = 320;
  
  let positionStyles = '';
  
  if (currentSettings.dropdownPosition === 'left') {
    // Force left positioning
    positionStyles = `
      top: ${iconRect.bottom + 5}px;
      left: ${Math.max(5, iconRect.left - dropdownWidth + 20)}px;
    `;
  } else if (currentSettings.dropdownPosition === 'right') {
    // Force right positioning
    positionStyles = `
      top: ${iconRect.bottom + 5}px;
      left: ${iconRect.right - 20}px;
    `;
  } else if (currentSettings.dropdownPosition === 'top') {
    // Force top positioning
    const leftPos = currentSettings.preferredSide === 'left' 
      ? Math.max(5, iconRect.left - dropdownWidth + 20)
      : iconRect.left;
    positionStyles = `
      bottom: ${viewportHeight - iconRect.top + 5}px;
      left: ${leftPos}px;
    `;
  } else if (currentSettings.dropdownPosition === 'bottom') {
    // Force bottom positioning
    const leftPos = currentSettings.preferredSide === 'left' 
      ? Math.max(5, iconRect.left - dropdownWidth + 20)
      : iconRect.left;
    positionStyles = `
      top: ${iconRect.bottom + 5}px;
      left: ${leftPos}px;
    `;
  } else {
    // Smart positioning (default)
    const spaceBelow = viewportHeight - iconRect.bottom;
    const spaceAbove = iconRect.top;
    const showAbove = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;
    
    // Horizontal positioning based on preferred side and available space
    let leftPos;
    if (currentSettings.preferredSide === 'left') {
      const spaceLeft = iconRect.left;
      if (spaceLeft >= dropdownWidth - 20) {
        leftPos = Math.max(5, iconRect.left - dropdownWidth + 20);
      } else {
        leftPos = iconRect.left; // Fallback to right if not enough space
      }
    } else {
      const spaceRight = viewportWidth - iconRect.right;
      if (spaceRight >= dropdownWidth - 20) {
        leftPos = iconRect.left;
      } else {
        leftPos = Math.max(5, iconRect.left - dropdownWidth + 20); // Fallback to left
      }
    }
    
    positionStyles = `
      ${showAbove ? `bottom: ${viewportHeight - iconRect.top + 5}px;` : `top: ${iconRect.bottom + 5}px;`}
      left: ${leftPos}px;
    `;
  }
  
  dropdown.style.cssText = `
    position: fixed !important;
    ${positionStyles}
    background: white !important;
    border: 1px solid #e1e5e9 !important;
    border-radius: 12px !important;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15) !important;
    z-index: 2147483647 !important;
    width: 240px !important;
    max-height: 320px !important;
    overflow: hidden !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    animation: fadeInScale 0.2s ease-out !important;
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
    pointer-events: auto !important;
  `;

  // Add header
  const header = document.createElement('div');
  header.style.cssText = `
    padding: 14px 16px !important;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
    color: white !important;
    font-size: 14px !important;
    font-weight: 600 !important;
    text-align: center !important;
    border-radius: 12px 12px 0 0 !important;
    position: sticky !important;
    top: 0 !important;
    z-index: 1 !important;
    display: block !important;
    visibility: visible !important;
  `;
  header.textContent = 'AI Mode';
  dropdown.appendChild(header);
  
  // Create scrollable content area
  const scrollArea = document.createElement('div');
  scrollArea.style.cssText = `
    max-height: 260px !important;
    overflow-y: auto !important;
    padding: 8px 0 !important;
    display: block !important;
    visibility: visible !important;
  `;

  // Add mode options
  AI_MODES.forEach(mode => {
    const modeItem = createModeItem(mode, input);
    scrollArea.appendChild(modeItem);
  });
  
  dropdown.appendChild(scrollArea);

  // Add to body for proper positioning
  console.log('📍 Adding dropdown to body', { dropdown, position: positionStyles });
  document.body.appendChild(dropdown);
  
  // Verify it was added
  if (!document.body.contains(dropdown)) {
    throw new Error('Failed to add dropdown to document body');
  }
  
  // Store reference to active dropdown
  activeDropdown = dropdown;
  
  console.log('✅ Dropdown created and positioned', { activeDropdown: !!activeDropdown });
  
  // Close dropdown when clicking outside
  setTimeout(() => {
    document.addEventListener('click', closeActiveDropdown);
    console.log('👂 Click listener added for dropdown close');
  }, 0);
  
  // Verify dropdown is visible after a short delay
  setTimeout(() => {
    if (activeDropdown && document.body.contains(activeDropdown)) {
      const rect = activeDropdown.getBoundingClientRect();
      console.log('📏 Dropdown dimensions:', { 
        width: rect.width, 
        height: rect.height,
        top: rect.top,
        left: rect.left,
        visible: rect.width > 0 && rect.height > 0
      });
      
      if (rect.width === 0 || rect.height === 0) {
        console.warn('⚠️ Dropdown appears to be hidden, showing fallback');
        showFallbackModeSelector(input);
      }
    }
  }, 100);
  
  } catch (error) {
    console.error('❌ Error in showModeSelector:', error);
    console.log('🔄 Trying fallback mode selector');
    showFallbackModeSelector(input);
  }
}

// Fallback mode selector using native browser prompt
function showFallbackModeSelector(input) {
  console.log('🔄 Using fallback mode selector');
  
  const modes = [
    'Rewrite (General improvement)',
    'Fix Grammar (Correct errors)', 
    'Improve Clarity (Make clearer)',
    'Professional Tone',
    'Casual Tone',
    'Make Shorter',
    'Make Longer',
    'Translate to Spanish',
    'Translate to French',
    'Summarize'
  ];
  
  let selection = prompt(`Choose AI mode:\n\n${modes.map((mode, i) => `${i + 1}. ${mode}`).join('\n')}\n\nEnter number (1-${modes.length}):`);
  
  if (selection) {
    const index = parseInt(selection) - 1;
    if (index >= 0 && index < modes.length) {
      // Map selection to our mode system
      const modeMap = [
        { id: 'rewrite' },
        { id: 'grammar' },
        { id: 'clarity' },
        { id: 'tone', submode: 'professional' },
        { id: 'tone', submode: 'casual' },
        { id: 'length', submode: 'condense' },
        { id: 'length', submode: 'expand' },
        { id: 'translate', submode: 'spanish' },
        { id: 'translate', submode: 'french' },
        { id: 'summarize' }
      ];
      
      const selectedMode = modeMap[index];
      console.log('✅ Fallback mode selected:', selectedMode);
      processTextWithMode(input, selectedMode.id, selectedMode.submode);
    } else {
      alert('Invalid selection. Please try again.');
    }
  }
}

// Create individual mode item with compact design
function createModeItem(mode, input) {
  const item = document.createElement('div');
  item.style.cssText = `
    padding: 10px 16px;
    cursor: pointer;
    transition: all 0.2s ease;
    border-bottom: 1px solid #f5f5f5;
    font-size: 13px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  `;
  
  item.innerHTML = `
    <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
      <div>
        <div style="font-weight: 500; color: #333; line-height: 1.2;">${mode.name}</div>
        <div style="color: #666; font-size: 11px; margin-top: 2px;">${mode.desc}</div>
      </div>
    </div>
  `;
  
  // Add hover effect
  item.addEventListener('mouseenter', () => {
    item.style.backgroundColor = '#f8f9fa';
    item.style.transform = 'translateX(2px)';
  });
  
  item.addEventListener('mouseleave', () => {
    item.style.backgroundColor = 'transparent';
    item.style.transform = 'translateX(0)';
  });
  
  // Handle mode selection - direct click
  item.addEventListener('click', (e) => {
    e.stopPropagation();
    processTextWithMode(input, mode.id, mode.submode);
    closeActiveDropdown();
  });
  
  return item;
}

// Removed showSubmodeSelector - no longer needed with flattened structure

// Close active dropdown
function closeActiveDropdown() {
  if (activeDropdown) {
    activeDropdown.remove();
    activeDropdown = null;
  }
  document.removeEventListener('click', closeActiveDropdown);
}

// Process text with selected mode
function processTextWithMode(input, mode, submode = null) {
  const isContentEditable = input.getAttribute("contenteditable") === "true" || input.isContentEditable;
  const tagName = input.tagName.toLowerCase();
  
  let originalText;
  try {
    if (isContentEditable) {
      originalText = input.innerText || input.textContent;
    } else if (tagName === 'input' || tagName === 'textarea') {
      originalText = input.value;
    } else {
      originalText = input.textContent || input.innerText;
    }
  } catch (error) {
    console.error('Error extracting text:', error);
    showErrorNotification('Failed to extract text from element');
    return;
  }

  if (!originalText || !originalText.trim()) {
    showErrorNotification('Please enter some text to process.');
    return;
  }

  if (originalText.length > 5000) {
    showErrorNotification('Text is too long. Please limit to 5000 characters.');
    return;
  }

  const icon = input.parentElement.querySelector(".ai-icon");
  if (!icon) {
    console.error('AI icon not found');
    return;
  }
  
  const originalIconSrc = icon.src;
  const spinnerUrl = "https://upload.wikimedia.org/wikipedia/commons/c/c7/Loading_2.gif";

  // Swap icon to loading spinner
  icon.src = spinnerUrl;
  icon.style.animation = 'spin 1s linear infinite';

  // Console log to verify input was picked
  console.log("📤 Sending to OpenRouter:", { 
    textLength: originalText.length, 
    mode, 
    submode, 
    timestamp: new Date().toISOString() 
  });

  // Implement retry logic with exponential backoff
  let retryCount = 0;
  const maxRetries = 3;
  
  function attemptProcessing() {
    chrome.runtime.sendMessage({ 
      action: 'polishText', 
      text: originalText,
      mode: mode,
      submode: submode,
      timestamp: Date.now()
    }, response => {
      if (chrome.runtime.lastError) {
        console.error('Runtime error:', chrome.runtime.lastError);
        handleProcessingError('Extension communication error');
        return;
      }
      
      console.log("📥 Full Response received:", response);
      
      if (response && response.polishedText && response.polishedText.trim()) {
        console.log("✅ Processing polished text:", {
          originalLength: originalText.length,
          processedLength: response.polishedText.length,
          polishedText: response.polishedText,
          mode,
          submode
        });

        try {
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
          
          // Track usage analytics
          trackUsage(mode, submode, originalText.length, response.polishedText.length);
          
          // Show success notification
          showSuccessNotification('Text processed successfully!');
          
        } catch (error) {
          console.error('Error setting processed text:', error);
          handleProcessingError('Failed to update text in element');
        }
      } else if (response && response.error) {
        console.warn("❌ Error from backend:", response.error);
        handleProcessingError(response.error);
      } else {
        console.warn("❌ No valid response from OpenRouter");
        handleProcessingError('No response received from AI service');
      }
      
      // Restore original icon
      restoreIcon();
    });
  }
  
  function handleProcessingError(errorMessage) {
    retryCount++;
    if (retryCount <= maxRetries) {
      console.log(`Retrying... Attempt ${retryCount}/${maxRetries}`);
      setTimeout(() => {
        attemptProcessing();
      }, Math.pow(2, retryCount) * 1000); // Exponential backoff
    } else {
      showErrorNotification(`Failed after ${maxRetries} attempts: ${errorMessage}`);
      restoreIcon();
    }
  }
  
  function restoreIcon() {
    try {
      icon.src = originalIconSrc;
      icon.style.animation = '';
    } catch (error) {
      console.error('Error restoring icon:', error);
    }
  }
  
  // Start processing
  attemptProcessing();
}

// Show error notification
function showErrorNotification(message) {
  const notification = createNotification(message, 'error');
  document.body.appendChild(notification);
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 4000);
}

// Show success notification
function showSuccessNotification(message) {
  const notification = createNotification(message, 'success');
  document.body.appendChild(notification);
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 2000);
}

// Create notification element
function createNotification(message, type) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'error' ? '#dc3545' : '#28a745'};
    color: white;
    padding: 12px 16px;
    border-radius: 6px;
    z-index: 10001;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    max-width: 300px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    animation: slideInRight 0.3s ease-out;
  `;
  
  notification.textContent = message;
  
  // Add animation keyframes if not already added
  if (!document.querySelector('#rewordify-animations')) {
    const style = document.createElement('style');
    style.id = 'rewordify-animations';
    style.textContent = `
      @keyframes slideInRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @keyframes fadeInScale {
        from {
          opacity: 0;
          transform: scale(0.95);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  return notification;
}

// Track usage analytics with enhanced error handling
function trackUsage(mode, submode, originalLength = 0, processedLength = 0) {
  try {
    chrome.storage.local.get(['analytics'], (result) => {
      if (chrome.runtime.lastError) {
        console.error('Error loading analytics:', chrome.runtime.lastError);
        return;
      }
      
      const analytics = result.analytics || {
        totalUsage: 0,
        modeUsage: {},
        dailyUsage: {},
        wordsImproved: 0,
        timeSaved: 0,
        lastUpdated: Date.now()
      };
      
      analytics.totalUsage++;
      const modeKey = submode ? `${mode}_${submode}` : mode;
      analytics.modeUsage[modeKey] = (analytics.modeUsage[modeKey] || 0) + 1;
      
      const today = new Date().toISOString().split('T')[0];
      analytics.dailyUsage[today] = (analytics.dailyUsage[today] || 0) + 1;
      
      // Track words improved and estimated time saved
      analytics.wordsImproved += Math.max(originalLength, processedLength);
      analytics.timeSaved += estimateTimeSaved(originalLength);
      analytics.lastUpdated = Date.now();
      
      chrome.storage.local.set({ analytics }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error saving analytics:', chrome.runtime.lastError);
        }
      });
    });
  } catch (error) {
    console.error('Error tracking usage:', error);
  }
}

// Estimate time saved (simple heuristic)
function estimateTimeSaved(textLength) {
  // Assume 1 second saved per 10 characters, minimum 5 seconds
  return Math.max(Math.floor(textLength / 10), 5);
}

// Initialize the extension
async function initializeExtension() {
  try {
    // Load settings first
    await loadSettings();
    
    // Initial Load
    addAIIcons();

    // Monitor DOM changes dynamically with throttling
    let observerTimeout;
    const throttledAddIcons = () => {
      clearTimeout(observerTimeout);
      observerTimeout = setTimeout(addAIIcons, 500); // Throttle to improve performance
    };
    
    const observer = new MutationObserver(throttledAddIcons);
    observer.observe(document.body, { 
      childList: true, 
      subtree: true,
      attributes: false, // Don't watch attribute changes for performance
      characterData: false // Don't watch text changes
    });
    
    // Close dropdown when pressing Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeActiveDropdown();
      }
    });
    
    console.log('✅ Rewordify-AI extension initialized successfully');
  } catch (e) {
    console.error('❌ AI Extension failed to initialize:', e);
  }
}

// Start the extension
initializeExtension();