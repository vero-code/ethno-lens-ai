// src/ui/designPanel.js
import { renderMarkdown, enableResetOnInput } from './utils.js';
import { analyzeDesign } from "./api.js";

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

function handleBusinessTypeChange(selectElement, inputElement) {
  if (selectElement.value === "Other...") {
    inputElement.style.display = "block";
  } else {
    inputElement.style.display = "none";
  }
}

// --- MAIN INITIALIZATION FUNCTION ---
export function initializeDesignPanel(sandboxProxy) {
  const designPanel = {
    scanButton: document.getElementById("scanDesign"),
    content: document.getElementById("scanDesignContent"),
    spinner: document.getElementById("scanDesignSpinner"),
    countrySelect: document.getElementById("countrySelect"),
    businessSelect: document.getElementById("businessType"),
    otherBusinessInput: document.getElementById("otherBusinessType"),
    resetButton: document.getElementById("resetDesign"),
    chat: {
      input: document.getElementById("chatInput"),
      sendButton: document.getElementById("chatSend"),
      responseContent: document.getElementById("chatResponseContent"),
      error: document.getElementById("chatError"),
      spinner: document.getElementById("chatSpinner")
    }
  };

  let lastPromptContext = "";

  const resetDesignPanel = () => {
    designPanel.countrySelect.value = "";
    designPanel.businessSelect.value = "";
    designPanel.content.innerHTML = "No issues detected yet.";
    designPanel.spinner.style.display = "none";
    designPanel.chat.input.value = "";
    designPanel.chat.responseContent.innerHTML = "AI conversation not started yet.";
    designPanel.chat.spinner.style.display = "none";
    designPanel.chat.error.style.display = "none";
    designPanel.otherBusinessInput.style.display = "none";
    designPanel.otherBusinessInput.value = "";
    lastPromptContext = "";
    designPanel.resetButton.disabled = true;
    setButtonsState(designPanel, false);
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

  // --- ACTION BUTTON LISTENERS ---
  designPanel.scanButton.addEventListener("click", async () => {
    setButtonsState(designPanel, true);
    designPanel.resetButton.disabled = true;
    designPanel.spinner.style.display = "block";
    designPanel.content.innerHTML = "";
    designPanel.chat.error.innerHTML = "";
    designPanel.chat.responseContent.innerHTML = "AI conversation not started yet.";

    try {
      const description = await sandboxProxy.getDesignDescription();
      const country = designPanel.countrySelect.value;
      let businessType = designPanel.businessSelect.value;
      if (businessType === "Other...") {
          businessType = designPanel.otherBusinessInput.value.trim();
      }

      if (!country) return showDesignError("Please select a country before scanning.");
      if (!businessType) return showDesignError("Please select a business type before scanning.");
      if (description.includes("No elements selected")) return showDesignError("Please select a design element on the canvas first.");

      const prompt = `Analyze the provided visual design. The design includes ${description} and is intended for ${country}. The business type is "${businessType}". Identify any culturally insensitive or inappropriate elements and suggest changes to promote inclusive visual solutions that are suitable for a diverse international audience, with a focus on cultural appropriateness for ${country}. In the first sentence, give a short answer whether this element should be used in the selected country.`;

      const data = await analyzeDesign(prompt);
      renderMarkdown(designPanel.content, data.result, "<b>AI Response</b><br>");
      lastPromptContext = prompt;
    } catch (error) {
      showDesignError(`Error: ${error.message}`);
    } finally {
      designPanel.spinner.style.display = "none";
      setButtonsState(designPanel, false);
      designPanel.resetButton.disabled = false;
    }
  });

  // Design - Chat
  designPanel.chat.sendButton.addEventListener("click", async () => {
    const followUp = designPanel.chat.input.value.trim();
    if (!followUp) {
      designPanel.chat.error.innerHTML = "Please enter a message before sending.";
      designPanel.chat.error.style.display = "block";
      return;
    }
    if (!lastPromptContext) {
      designPanel.chat.error.innerHTML = "Please scan a design before asking follow-up questions.";
      designPanel.chat.error.style.display = "block";
      return;
    }

    setButtonsState(designPanel, true);
    designPanel.resetButton.disabled = true;
    designPanel.chat.spinner.style.display = "block";
    designPanel.chat.responseContent.innerHTML = "";
    designPanel.chat.error.style.display = "none";

    const fullFollowUpPrompt = `${lastPromptContext}\n\nThe user now asks: "${followUp}"`;

    try {
      const data = await analyzeDesign(fullFollowUpPrompt);
      renderMarkdown(designPanel.chat.responseContent, data.result, `<b>AI responds:</b><br>`);
      designPanel.chat.input.value = "";
    } catch (err) {
      designPanel.chat.error.innerHTML = `Error: ${err.message}`;
      designPanel.chat.error.style.display = "block";
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