# Privacy Policy

_Last updated: July 11, 2025_

We take your privacy seriously. **Rewordify-AI Chrome Extension** is designed to operate with the minimum necessary permissions, with **no tracking, logging, or analytics**.

---

## 🔍 What This Extension Does

- Adds an AI icon next to text `[aria-label]` and  `contenteditable=true` fields.
- When you click the icon, it captures the text you entered.
- The text is sent to a secure proxy backend (AWS Lambda), which forwards it to OpenRouter for rewriting.
- The polished text is inserted back into the original field.

---

## 🚫 What We Do **NOT** Do

- ❌ We do **not** store your input text.
- ❌ We do **not** track your activity or behavior.
- ❌ We do **not** use analytics, cookies, or fingerprinting.
- ❌ We do **not** collect personally identifiable information.
- ❌ We do **not** share your data with third parties (except routing the request to OpenRouter via backend).

---

## 🔐 Data Handling Details

- Your text is processed **only** when you click the icon, and **only** the selected input content is sent.
- The request is routed through a secure AWS Lambda function to prevent exposing the OpenRouter API key on the client side.
- The Lambda does **not** store, log, or persist any data.
- The final rewritten text is returned and automatically filled into the same field.
- **Note:** OpenRouter may apply its own terms of use and privacy policies regarding how it handles requests internally.

---

## 💻 Open Source & Licensing

This extension is **fully open source** and licensed under the **MIT License**.  
You are free to inspect, modify, distribute, or host your own version.

**GitHub Repository:** [https://github.com/Arunk28/Rewordify-AI](https://github.com/Arunk28/Rewordify-AI)

---

## 📫 Contact

If you have any questions, issues, or suggestions, please contact:  
**arunkumar280491@gmail.com** 
