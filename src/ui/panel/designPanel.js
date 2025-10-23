// src/ui/panel/designPanel.js
import { renderMarkdown, enableResetOnInput, handleBusinessTypeChange, showPremiumUpsell, handlePremiumClick } from '../utils.js';
import { analyzeDesign, logPremiumInterest } from "../api.js";
import { getUserId } from '../user.js';

// --- CONSTANTS ---
const MESSAGES = {
  NO_ISSUES: "No issues detected yet.",
  AI_CONVERSATION_START: "AI conversation not started yet.",
  SELECT_COUNTRY: "Please select a country before scanning.",
  SELECT_BUSINESS_TYPE: "Please select a business type before scanning.",
  SELECT_ELEMENT: "Please select a design element on the canvas first.",
  ENTER_MESSAGE: "Please enter a message before sending.",
  SCAN_FIRST: "Please scan a design before asking follow-up questions.",
  USER_ID_ERROR: "Could not identify user. Please try again.",

  PREMIUM_LIMIT_REACHED: "Free limit reached. Premium coming soon.", // same as db/limits.js
  PREMIUM_BUTTON_PROMPT: "I'm interested in Premium",
  PREMIUM_BUTTON_THANKS: "Thanks! Your interest has been noted.",
};
const OTHER_OPTION_VALUE = "Other...";

// --- HELPER FUNCTIONS ---
const setButtonsState = (designPanel, disabled) => {
  designPanel.scanButton.disabled = disabled;
  designPanel.countrySelect.disabled = disabled;
  designPanel.businessSelect.disabled = disabled;
  designPanel.chat.input.disabled = disabled;
  designPanel.chat.sendButton.disabled = disabled;
};

const showDesignError = (designPanel, message) => {
  designPanel.spinner.style.display = "none";
  designPanel.content.innerHTML = `<span class="error">${message}</span>`;
  setButtonsState(designPanel, false);
  designPanel.resetButton.disabled = false;
};

// --- MAIN INITIALIZATION FUNCTION ---
export function initializeDesignPanel(sandboxProxy, isMockMode) {
  const designPanel = {
    scanButton: document.getElementById("scanDesign"),
    content: document.getElementById("scanDesignContent"),
    spinner: document.getElementById("scanDesignSpinner"),
    countrySelect: document.getElementById("countrySelect"),
    businessSelect: document.getElementById("businessType"),
    otherBusinessInput: document.getElementById("otherBusinessType"),
    resetButton: document.getElementById("resetDesign"),
    scoreBox: document.getElementById("scoreBox"),
    scoreValue: document.getElementById("scoreValue"),
    followUpChat: document.getElementById("followUpChat"),
    chat: {
      input: document.getElementById("chatInput"),
      sendButton: document.getElementById("chatSend"),
      responseContent: document.getElementById("chatResponseContent"),
      error: document.getElementById("chatError"),
      spinner: document.getElementById("chatSpinner")
    },
    premiumUpsellScan: document.getElementById("premiumUpsellScan"),
    notifyPremiumButtonScan: document.getElementById("notifyPremiumButtonScan"),
    premiumUpsellChat: document.getElementById("premiumUpsellChat"),
    notifyPremiumButtonChat: document.getElementById("notifyPremiumButtonChat")
  };

  let lastPromptContext = "";
  let userId = null;

  const resetDesignPanel = () => {
    designPanel.countrySelect.value = "";
    designPanel.businessSelect.value = "";
    designPanel.content.innerHTML = MESSAGES.NO_ISSUES;
    designPanel.scoreBox.style.display = 'none';
    designPanel.scoreValue.textContent = '--';
    designPanel.spinner.style.display = "none";
    designPanel.followUpChat.classList.remove('visible');
    designPanel.chat.input.value = "";
    designPanel.chat.responseContent.innerHTML = MESSAGES.AI_CONVERSATION_START;
    designPanel.chat.spinner.style.display = "none";
    designPanel.chat.error.style.display = "none";
    designPanel.otherBusinessInput.style.display = "none";
    designPanel.otherBusinessInput.value = "";
    lastPromptContext = "";
    designPanel.resetButton.disabled = true;
    setButtonsState(designPanel, false);
    designPanel.premiumUpsellScan.style.display = 'none';
    designPanel.premiumUpsellChat.style.display = 'none';
  };

  // --- EVENT LISTENERS ---
  designPanel.countrySelect.addEventListener("change", () => enableResetOnInput(designPanel.resetButton));
  designPanel.businessSelect.addEventListener("change", () => {
    handleBusinessTypeChange(designPanel.businessSelect, designPanel.otherBusinessInput);
    enableResetOnInput(designPanel.resetButton);
  });
  designPanel.chat.input.addEventListener("input", () => {
    if (designPanel.chat.input.value.trim() !== "") {
      enableResetOnInput(designPanel.resetButton);
    }
  });
  designPanel.resetButton.addEventListener("click", resetDesignPanel);

  designPanel.notifyPremiumButtonScan.addEventListener("click", async () => {
    if (!userId) userId = await getUserId();
    handlePremiumClick(designPanel.notifyPremiumButtonScan, userId, logPremiumInterest, MESSAGES);
  });

  designPanel.notifyPremiumButtonChat.addEventListener("click", async () => {
    if (!userId) userId = await getUserId();
    handlePremiumClick(designPanel.notifyPremiumButtonChat, userId, logPremiumInterest, MESSAGES);
  });

  // --- ACTION BUTTON LISTENERS ---
  
  // Design - Scan
  designPanel.scanButton.addEventListener("click", async () => {
    setButtonsState(designPanel, true);
    designPanel.resetButton.disabled = true;
    designPanel.spinner.style.display = "block";
    designPanel.content.innerHTML = "";
    designPanel.chat.error.innerHTML = "";
    designPanel.chat.responseContent.innerHTML = MESSAGES.AI_CONVERSATION_START;

    try {
      if (!userId) userId = await getUserId();
      if (!userId) return showDesignError(designPanel, MESSAGES.USER_ID_ERROR);

      const description = await sandboxProxy.getDesignDescription();
      const country = designPanel.countrySelect.value;
      let businessType = designPanel.businessSelect.value;
      if (businessType === OTHER_OPTION_VALUE) {
          businessType = designPanel.otherBusinessInput.value.trim();
      }

      if (!country) return showDesignError(designPanel, MESSAGES.SELECT_COUNTRY);
      if (!businessType) return showDesignError(designPanel, MESSAGES.SELECT_BUSINESS_TYPE);
      if (description.includes("No elements selected")) return showDesignError(designPanel, MESSAGES.SELECT_ELEMENT);

      const prompt = `Analyze the provided visual design. The design includes ${description} and is intended for ${country}. The business type is "${businessType}". Identify any culturally insensitive or inappropriate elements and suggest changes to promote inclusive visual solutions that are suitable for a diverse international audience, with a focus on cultural appropriateness for ${country}. In the first sentence, give a short answer whether this element should be used in the selected country.`;

      let data;
      if (isMockMode()) {
        console.log("API call is OFF. Using mock data for Design Panel.");
        data = {
            result: "This is a **mock response** for testing the UI. The real API call was not made.",
            score: 75
        };
      } else {
        data = await analyzeDesign(prompt, userId);
      }

      // Display both text and rating
      renderMarkdown(designPanel.content, data.result, "<b>AI Response</b><br>");
      if (data.score !== null) {
          designPanel.scoreValue.textContent = data.score;
          designPanel.scoreBox.style.display = 'block';
      }
      lastPromptContext = prompt;

      designPanel.followUpChat.classList.add('visible');
      designPanel.premiumUpsellScan.style.display = 'none';
    } catch (error) {
      const isLimitError = error.status === 429;
      const errorMessage = isLimitError
        ? MESSAGES.PREMIUM_LIMIT_REACHED
        : `Error: ${error.message}`;
      showDesignError(designPanel, errorMessage);
      if (error.status === 429) { showPremiumUpsell(designPanel, 'scan', MESSAGES); }
    } finally {
      designPanel.spinner.style.display = "none";
      setButtonsState(designPanel, false);
      designPanel.resetButton.disabled = false;
    }
  });

  // Design - Ask the AI - Send
  designPanel.chat.sendButton.addEventListener("click", async () => {
    const followUp = designPanel.chat.input.value.trim();
    if (!followUp) {
      designPanel.chat.error.innerHTML = MESSAGES.ENTER_MESSAGE;
      designPanel.chat.error.style.display = "block";
      return;
    }
    if (!lastPromptContext) {
      designPanel.chat.error.innerHTML = MESSAGES.SCAN_FIRST;
      designPanel.chat.error.style.display = "block";
      return;
    }

    setButtonsState(designPanel, true);
    designPanel.resetButton.disabled = true;
    designPanel.chat.spinner.style.display = "block";
    designPanel.chat.responseContent.innerHTML = "";
    designPanel.chat.error.style.display = "none";

    try {
      let data;
      if (isMockMode()) {
        console.log("Chat API call is OFF. Using mock data for Design Panel (Ask the AI).");
        data = {
          result: "This is a **mock chat response**. The real API call was not made."
        };
      } else {
        const fullFollowUpPrompt = `${lastPromptContext}\n\nThe user now asks: "${followUp}"`;
        data = await analyzeDesign(fullFollowUpPrompt, userId);
      }

      renderMarkdown(designPanel.chat.responseContent, data.result, `<b>AI responds:</b><br>`);
      designPanel.chat.input.value = "";

      designPanel.premiumUpsellChat.style.display = 'none';
    } catch (err) {
      const isLimitError = err.status === 429;
      const errorMessage = isLimitError
        ? MESSAGES.PREMIUM_LIMIT_REACHED
        : `Error: ${err.message}`;
      designPanel.chat.error.innerHTML = `<span class="error">${errorMessage}</span>`;
      designPanel.chat.error.style.display = "block";
      if (err.status === 429) { showPremiumUpsell(designPanel, 'chat', MESSAGES); }
    } finally {
      designPanel.chat.spinner.style.display = "none";
      setButtonsState(designPanel, false);
      designPanel.resetButton.disabled = false;
    }
  });

  designPanel.chat.input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") designPanel.chat.sendButton.click();
  });

  // Initial state setup
  resetDesignPanel();
}