// Replace with your actual Lambda function URL
const LAMBDA_URL = process.ENV.LAMBDAURL;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "polishText") {
    fetch(LAMBDA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Pre-Shared-Key": "ff4a076d-2b8c-46f5-b806-3382876272b4"
      },
      body: JSON.stringify({ text: request.text })
    })
      .then(res => res.json())
      .then(data => {
        sendResponse({ polishedText: data.polishedText || request.text });
      })
      .catch(err => {
        console.error("❌ Error calling Lambda:", err);
        sendResponse({ polishedText: request.text });
      });

    return true; // Keep message channel open for async
  }
});
