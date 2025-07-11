// // Add AI icons to textareas and inputs
//  const icon = document.createElement('img');
// icon.src = chrome.runtime.getURL("icon.png");
// console.log(icon);
//  console.log("AI Polisher extension content script loaded");

function addAIIcons() {
  document.querySelectorAll('[contenteditable="true"][aria-label]').forEach(input => {
    if (input.dataset.aiIconAdded) return;
    input.dataset.aiIconAdded = "true";

    // Create wrapper for proper positioning
    const wrapper = document.createElement('div');
    wrapper.style.position = 'relative';
    wrapper.style.display = 'inline-block';
    wrapper.style.width = input.offsetWidth + 'px';

    // Replace input with wrapper + input
    input.parentNode.insertBefore(wrapper, input);
    wrapper.appendChild(input);

    // Create AI icon
    const icon = document.createElement('img');
    icon.src = "data:image/png;base64,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"
    icon.className = 'ai-icon';

    icon.style = `
      width: 24px;
      height: 24px;
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

    icon.onclick = () => handleClickAI(input);
    wrapper.appendChild(icon);
  });
}


// Handle AI Click Event
function handleClickAI(input) {
  const isContentEditable = input.getAttribute("contenteditable") === "true";
  const originalText = isContentEditable ? input.innerText : input.value;

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

      if (isContentEditable) {
        input.innerText = response.polishedText;
      } else {
        input.value = response.polishedText;
      }
    } else {
      console.warn("❌ No response from OpenRouter or failed");
    }
    // Restore original icon
    icon.src = originalIconSrc;
  });
}
try {
// Initial Load
addAIIcons();

// Monitor DOM changes dynamically
const observer = new MutationObserver(addAIIcons);
observer.observe(document.body, { childList: true, subtree: true });
} catch (e) {
  console.error('AI Extension failed to initialize:', e);
}