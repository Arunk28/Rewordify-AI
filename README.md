# Rewordify-AI
✨ Rewordify-AI – Instantly Improve Your Writing Anywhere 
 

Polish your writing with one click — anywhere on the web. This Chrome extension places an AI icon next to any text field. When clicked, it sends your input securely to [OpenRouter](https://openrouter.ai) via a Lambda backend and replaces it with a more polished, professional version.

---

## 🚀 Features

- 🧠 Rewrite and improve your writing using AI
- ⚡ Works on all websites with  `aria-label` amd `contenteditable=true` fields
- 🔐 Secure: Sends text via a proxy backend to hide the API key
- 🛡️ No tracking, no analytics, no data stored
- 💯 Open source under the [MIT License](LICENSE)

---

## 📦 How It Works

1. Injects an AI icon next to every supported text field
2. On click, extracts the user’s input text
3. Sends the text to an **AWS Lambda backend**, which proxies the request to OpenRouter's Chat API
4. Receives the rewritten message and pastes it back into the input

---

## 🧰 Technologies Used

- JavaScript
- Chrome Extensions API (Manifest V3)
- OpenRouter API (via Lambda)
- AWS Lambda (Node.js)

---

## 🔐 Privacy

We do **not** store, track, or log any data. Your input text is:
- Only sent when you click the AI icon
- Routed through a proxy backend (Lambda) for security
- Never saved or shared beyond what’s required for generating a rewritten version

Read the full [Privacy Policy](PRIVACY.md)

---

## 📄 Installation (Manual)

1. Clone or download this repo
2. Open `chrome://extensions/` in Chrome
3. Enable **Developer Mode**
4. Click **Load Unpacked**
5. Select the folder containing the extension

---

## 🔑 Backend Setup (Optional but Recommended)

To hide your OpenRouter API key:

1. Deploy a Node.js function to AWS Lambda
2. In your Lambda, send requests to:
