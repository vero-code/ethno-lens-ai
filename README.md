# EthnoLens AI
[![Adobe Express](https://img.shields.io/badge/platform-Adobe%20Express-purple.svg)](https://express.adobe.com/)
[![JavaScript](https://img.shields.io/badge/language-JavaScript-F7DF1E.svg?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Gemini](https://img.shields.io/badge/AI-Gemini-blueviolet.svg?logo=google)](https://deepmind.google/technologies/gemini/)

An AI-powered design add-on that scans your visuals and flags potential cultural, ethical, or symbolic pitfalls — before they become costly mistakes.

Built for global creators. Powered by Gemini. Designed for Adobe Express.

👉 This project was created for the ["Adobe Express Add-ons Hackathon"](https://devpost.com/software/ethnolens-ai).
 
## 🧠 Core AI Capabilities

- 🧠 **Cultural check with AI** — Get instant feedback on how design fits different cultures.

- 🌍 **Country-aware analysis** — Adjusts results based on your chosen region.

- 🏢 **Business type context** — Improves accuracy using industry-specific context.

- 💬 **Follow-up chat with AI** — Ask clarification questions right after the analysis.

- 🖼️ **Image analysis** — Upload images for cultural and ethical review.

### 🛠️ Design Analysis Tools

- 🔍 **Smart element scanning** — Detects text, colors, and shapes.

- 🔌 **Seamless Adobe Express integration** — Works right inside your design workflow.

- ⚙️ **Easy to extend** — Built for future element types and features.

### 📐 Output & UI Features

- 🧾 **Clean markdown output** — Neatly formatted AI replies.

- ⏳ **Built-in loading indicator** — Shows AI activity status.

- 🛡️ **Helpful error messages** — Alerts if something’s missing or wrong.

## Tools

This project has been created with _@adobe/create-ccweb-add-on_ and is designed to run inside **Adobe Express**.

- HTML, CSS
- JavaScript, Node.js
- Adobe Express Add-on API
- Gemini 2.5 Flash

## Setup

This project consists of two parts: a frontend add-on and a backend server. Both must be running simultaneously.

**Prerequisites**

- Node.js and npm installed.
- An Adobe Developer account.
- The Adobe Express Add-on Development Tool installed and configured. See the [official guide](https://developer.adobe.com/express/add-ons/docs/guides/getting_started/local_development/dev_tooling/).


### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/vero-code/ethno-lens-ai.git
    cd ethno-lens-ai
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Setup your API Key:**
  -  Create a `.env` file in the project root.
  -  Add your Gemini API key to it: `GEMINI_API_KEY=YOUR_API_KEY_HERE`

### Running Locally

You will need two separate terminals open.

**Terminal 1: Start the Backend Server**

  ```bash
  node server.js
  ```

_Your backend is now running at `http://localhost:3000`._

**Terminal 2: Start the Frontend Add-on Server**

  ```bash
  npm run start
  ```

_Your add-on is now hosted and can be sideloaded in Adobe Express._

## 📜 License

This project is open-source under the MIT License — meaning you’re free to use, change, and share it, even in commercial projects. Just keep the original [LICENSE](LICENSE) info.

Want to help out?
Feel free to report bugs, suggest features, or open a pull request!