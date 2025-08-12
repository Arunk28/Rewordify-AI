// Default settings
const DEFAULT_SETTINGS = {
  contentEditable: true,
  textarea: true,
  input: true,
  dropdownPosition: 'smart',
  preferredSide: 'left'  // Changed default to left as requested
};

// Default analytics structure
const DEFAULT_ANALYTICS = {
  totalUsage: 0,
  modeUsage: {},
  dailyUsage: {},
  wordsImproved: 0,
  timeSaved: 0,
  lastUpdated: Date.now()
};

// Load settings when popup opens
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  await loadAnalytics();
  setupEventListeners();
});

async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get(DEFAULT_SETTINGS);
    
    document.getElementById('contentEditable').checked = result.contentEditable;
    document.getElementById('textarea').checked = result.textarea;
    document.getElementById('input').checked = result.input;
    document.getElementById('dropdownPosition').value = result.dropdownPosition;
    document.getElementById('preferredSide').value = result.preferredSide;
  } catch (error) {
  }
}

async function saveSettings() {
  const settings = {
    contentEditable: document.getElementById('contentEditable').checked,
    textarea: document.getElementById('textarea').checked,
    input: document.getElementById('input').checked,
    dropdownPosition: document.getElementById('dropdownPosition').value,
    preferredSide: document.getElementById('preferredSide').value
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
  }
}

function setupEventListeners() {
  // Settings toggle listeners
  const toggles = ['contentEditable', 'textarea', 'input'];
  toggles.forEach(id => {
    document.getElementById(id).addEventListener('change', saveSettings);
  });
  
  // Position settings listeners
  document.getElementById('dropdownPosition').addEventListener('change', saveSettings);
  document.getElementById('preferredSide').addEventListener('change', saveSettings);
  
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
  const modeSelector = document.getElementById('quickMode');
  
  // Parse selected mode
  const selectedMode = modeSelector.value;
  let mode, submode;
  
  if (selectedMode.includes('_')) {
    [mode, submode] = selectedMode.split('_');
  } else {
    mode = selectedMode;
    submode = null;
  }
  
  // Show loading state
  convertBtn.disabled = true;
  btnText.style.display = 'none';
  btnSpinner.style.display = 'inline';
  
  try {
    // Send message to background script with mode information
    const response = await chrome.runtime.sendMessage({
      action: 'polishText',
      text: text,
      mode: mode,
      submode: submode
    });
    
    
    if (response && response.polishedText) {
      quickText.value = response.polishedText;
      // Auto-select the result for easy copying
      quickText.select();
      quickText.setSelectionRange(0, 99999); // For mobile devices
      
      // Update analytics after successful conversion
      await updateAnalytics(mode, submode, text.length, response.polishedText.length);
      await loadAnalytics(); // Refresh display
    } else {
      if (response && response.error) {
        alert(`Error: ${response.error}`);
      } else {
        alert('Failed to rewordify text. Please try again.');
      }
    }
  } catch (error) {
    alert('Error occurred while rewordifying. Please try again.');
  } finally {
    // Restore button state
    convertBtn.disabled = false;
    btnText.style.display = 'inline';
    btnSpinner.style.display = 'none';
  }
}

// Load and display analytics data
async function loadAnalytics() {
  try {
    const result = await chrome.storage.local.get(['analytics']);
    const analytics = result.analytics || DEFAULT_ANALYTICS;
    
    // Update stat cards
    document.getElementById('totalUsage').textContent = analytics.totalUsage.toLocaleString();
    
    // Calculate today's usage
    const today = new Date().toISOString().split('T')[0];
    const todayUsage = analytics.dailyUsage[today] || 0;
    document.getElementById('todayUsage').textContent = todayUsage.toString();
    
    // Display words improved and time saved
    document.getElementById('wordsImproved').textContent = (analytics.wordsImproved || 0).toLocaleString();
    const timeSavedMinutes = Math.round((analytics.timeSaved || 0) / 60);
    document.getElementById('timeSaved').textContent = `${timeSavedMinutes}m`;
    
    // Update mode usage chart
    updateModeChart(analytics.modeUsage);
    
  } catch (error) {
  }
}

// Update analytics data
async function updateAnalytics(mode, submode, originalLength, processedLength) {
  try {
    const result = await chrome.storage.local.get(['analytics']);
    const analytics = result.analytics || DEFAULT_ANALYTICS;
    
    // Update counters
    analytics.totalUsage++;
    analytics.wordsImproved += Math.max(originalLength, processedLength);
    analytics.timeSaved += estimateTimeSaved(originalLength);
    
    // Update mode usage
    const modeKey = submode ? `${mode}_${submode}` : mode;
    analytics.modeUsage[modeKey] = (analytics.modeUsage[modeKey] || 0) + 1;
    
    // Update daily usage
    const today = new Date().toISOString().split('T')[0];
    analytics.dailyUsage[today] = (analytics.dailyUsage[today] || 0) + 1;
    
    analytics.lastUpdated = Date.now();
    
    await chrome.storage.local.set({ analytics });
  } catch (error) {
  }
}

// Estimate time saved based on text length (rough approximation)
function estimateTimeSaved(textLength) {
  // Assume 1 second saved per 10 characters of text
  return Math.max(textLength / 10, 5); // Minimum 5 seconds saved
}

// Update mode usage chart
function updateModeChart(modeUsage) {
  const chartContainer = document.getElementById('modeChart');
  
  if (!modeUsage || Object.keys(modeUsage).length === 0) {
    chartContainer.innerHTML = '<div class="no-data">Start using AI modes to see statistics</div>';
    return;
  }
  
  // Sort modes by usage count
  const sortedModes = Object.entries(modeUsage)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5); // Show top 5 modes
  
  const maxCount = sortedModes[0][1];
  
  const modeNames = {
    'rewrite': '✨ Rewrite',
    'tone_professional': '🎭 Professional',
    'tone_casual': '🎭 Casual',
    'tone_friendly': '🎭 Friendly',
    'tone_formal': '🎭 Formal',
    'length_expand': '📏 Expand',
    'length_condense': '📏 Condense',
    'length_bullets': '📏 Bullets',
    'style_academic': '🎨 Academic',
    'style_creative': '🎨 Creative',
    'style_technical': '🎨 Technical',
    'style_marketing': '🎨 Marketing',
    'translate_spanish': '🌐 Spanish',
    'translate_french': '🌐 French',
    'translate_german': '🌐 German',
    'translate_italian': '🌐 Italian',
    'translate_portuguese': '🌐 Portuguese',
    'translate_chinese': '🌐 Chinese',
    'translate_japanese': '🌐 Japanese',
    'grammar': '✅ Grammar',
    'clarity': '💡 Clarity',
    'summarize': '📝 Summarize'
  };
  
  chartContainer.innerHTML = sortedModes.map(([mode, count]) => {
    const percentage = (count / maxCount) * 100;
    const displayName = modeNames[mode] || mode;
    
    return `
      <div class="mode-item">
        <div>
          <div class="mode-name">${displayName}</div>
          <div class="mode-bar" style="width: ${percentage}%"></div>
        </div>
        <div class="mode-count">${count}</div>
      </div>
    `;
  }).join('');
}