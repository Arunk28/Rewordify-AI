// Default settings
const DEFAULT_SETTINGS = {
  contentEditable: true,
  textarea: true,
  input: true
};

// Load settings when popup opens
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  setupEventListeners();
});

async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get(DEFAULT_SETTINGS);
    
    document.getElementById('contentEditable').checked = result.contentEditable;
    document.getElementById('textarea').checked = result.textarea;
    document.getElementById('input').checked = result.input;
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

async function saveSettings() {
  const settings = {
    contentEditable: document.getElementById('contentEditable').checked,
    textarea: document.getElementById('textarea').checked,
    input: document.getElementById('input').checked
  };
  
  try {
    await chrome.storage.sync.set(settings);
    
    // Notify all content scripts about settings change
    const tabs = await chrome.tabs.query({});
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, {
        action: 'updateSettings',
        settings: settings
      }).catch(() => {
        // Ignore errors for tabs that don't have content script
      });
    });
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

function setupEventListeners() {
  // Settings toggle listeners
  const toggles = ['contentEditable', 'textarea', 'input'];
  toggles.forEach(id => {
    document.getElementById(id).addEventListener('change', saveSettings);
  });
  
  // Quick convert functionality
  const convertBtn = document.getElementById('convertBtn');
  const quickText = document.getElementById('quickText');
  
  convertBtn.addEventListener('click', async () => {
    const text = quickText.value.trim();
    if (!text) {
      alert('Please enter some text to rewordify');
      return;
    }
    
    await handleQuickConvert(text);
  });
  
  // Enter key in textarea
  quickText.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      convertBtn.click();
    }
  });
}

async function handleQuickConvert(text) {
  const convertBtn = document.getElementById('convertBtn');
  const quickText = document.getElementById('quickText');
  const btnText = convertBtn.querySelector('.btn-text');
  const btnSpinner = convertBtn.querySelector('.btn-spinner');
  
  // Show loading state
  convertBtn.disabled = true;
  btnText.style.display = 'none';
  btnSpinner.style.display = 'inline';
  
  try {
    // Send message to background script
    const response = await chrome.runtime.sendMessage({
      action: 'polishText',
      text: text
    });
    
    if (response && response.polishedText) {
      quickText.value = response.polishedText;
      // Auto-select the result for easy copying
      quickText.select();
      quickText.setSelectionRange(0, 99999); // For mobile devices
    } else {
      alert('Failed to rewordify text. Please try again.');
    }
  } catch (error) {
    console.error('Error during quick convert:', error);
    alert('Error occurred while rewordifying. Please try again.');
  } finally {
    // Restore button state
    convertBtn.disabled = false;
    btnText.style.display = 'inline';
    btnSpinner.style.display = 'none';
  }
}