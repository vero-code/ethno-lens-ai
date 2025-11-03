# EthnoLens AI
[![Adobe Express](https://img.shields.io/badge/platform-Adobe%20Express-purple.svg)](https://express.adobe.com/)
[![JavaScript](https://img.shields.io/badge/language-JavaScript-F7DF1E.svg?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Gemini](https://img.shields.io/badge/AI-Gemini-blueviolet.svg?logo=google)](https://deepmind.google/technologies/gemini/)

An AI-powered design add-on that scans your visuals and flags potential cultural, ethical, or symbolic pitfalls — before they become costly mistakes.

Built for global creators. Powered by Gemini. Designed for Adobe Express.

👉 This project was created for the ["Adobe Express Add-ons Hackathon"](https://devpost.com/software/ethnolens-ai).
 
## 🤖 Core AI Capabilities

- 🧠 **Cultural check with AI** — Get instant feedback on how design fits different cultures.

- 🌍 **Country-aware analysis** — Adjusts results based on your chosen region.

- 🏢 **Business type context** — Improves accuracy using industry-specific context.

- 💬 **Follow-up chat with AI** — Ask clarification questions right after the analysis.

- 🖼️ **Image analysis** — Upload images for cultural and ethical review.

- 📊 **Usage Limits (Free Tier)** — Provides free analysis checks per month per user.

### 🛠️ Design Analysis Tools

- 🔍 **Smart element scanning** — Detects text, colors, and shapes.

- 🔌 **Seamless Adobe Express integration** — Works right inside your design workflow.

- ⚙️ **Easy to extend** — Built for future element types and features.

### 📐 UI & UX Features

- ✨ **Spectrum Design System** — Modern interface built with Adobe's Spectrum Web Components (Express system).
- 💯 **Cultural Sensitivity Score** — Get a clear 0-100 score (visualized with `sp-meter`) to quickly assess cultural fitness.
- 📄 **Clean Markdown Output** — Neatly formatted AI replies.
- 🚶 **Guided Steps** — Accordion layout guides users through analysis steps.
- 🖼️ **Image Preview** — See uploaded images directly in the dropzone.
- ⏳ **Loading Indicators** — Clear `sp-progress-circle` shows AI activity status.
- 💡 **Info Tooltips** — Helpful hints on buttons and key features.
- 📊 **Usage Limit Display** — Clearly shows remaining checks for the month.
- ⚠️ **Helpful Error Messages** — Alerts if something’s missing or wrong.
- 📢 **Premium Interest Tracking** — Button to gauge user interest in future premium features.

## Tools

* **Frontend:** HTML, CSS, JavaScript, Adobe Express Add-on API, Spectrum Web Components
* **Backend:** Node.js, Express.js
* **AI Model:** Google Gemini API (Flash model)
* **Database:** Supabase (for user limits)
* **Hosting:** Render (for backend server)
* **CI/CD:** GitHub Actions (manual deployment trigger)
* **Build Tool:** @adobe/create-ccweb-add-on

## ✅ Reliability & Quota Handling

- 🛑 Cancelable AI requests — no wasted quota on aborted runs
- ⚙️ Two-phase usage confirmation (pending → confirmed) to ensure accurate quota billing
- 🧾 Atomic usage tracking in Supabase (no double-charge edge cases)
- 🌐 Graceful handling of network interruptions

## Setup

This project consists of two parts: a frontend add-on and a backend server. Both must be running simultaneously for local development.

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

3.  **Setup environment variables:**
  -  Create a `.env` file in the project root.
  -  Add your API keys and credentials (see `.env.example` file).

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

## Deployment

The backend server is configured for deployment on Render.
* The `deploy-render.yml` workflow in `.github/workflows` allows for manual deployment triggering via GitHub Actions ("Actions" tab -> "Deploy to Render" -> "Run workflow").
* Ensure necessary environment variables are set in the Render service settings.

## Support & Help

If you encounter a bug or have a feature request, please [open an issue](https://github.com/vero-code/ethno-lens-ai/issues) on this GitHub repository.

## 📜 License

This project is open-source under the MIT License — meaning you’re free to use, change, and share it, even in commercial projects. Just keep the original [LICENSE](LICENSE) info.

Want to help out?
Feel free to report bugs, suggest features, or open a pull request!