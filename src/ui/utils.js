// src/ui/utils.js

export const renderMarkdown = (targetElement, markdownText, prefix = "") => {
    targetElement.innerHTML = "";
    if (markdownText && typeof markdownText === 'string' && markdownText.trim() !== '') {
        targetElement.innerHTML = prefix + marked.parse(markdownText);
    } else {
        targetElement.innerHTML = prefix + `<span style="color:gray;">AI returned an empty or invalid response.</span>`;
        console.warn("Attempted to render empty or invalid Markdown:", markdownText);
    }
};

export const enableResetOnInput = (button) => {
    button.disabled = false;
};

export function handleBusinessTypeChange(selectElement, containerElement) {
  if (selectElement.value === "Other...") {
    containerElement.style.display = "block";
  } else {
    containerElement.style.display = "none";
  }
}

// --- "Premium" button ---
export async function handlePremiumClick(button, userId, logPremiumInterest, messages) {
    if (!userId) {
        console.error("Cannot log premium click: User ID is unknown.");
        return;
    }
    try {
        await logPremiumInterest(userId);
        button.disabled = true;
        button.textContent = messages.PREMIUM_BUTTON_THANKS;
    } catch (err) {
        console.error("Failed to log premium click:", err);
    }
}

export function showPremiumUpsell(panel, context, messages) {
    let upsellContainer, button;
    if (context === 'scan') {
        upsellContainer = panel.premiumUpsellScan;
        button = panel.notifyPremiumButtonScan;
    } else if (context === 'chat') {
        upsellContainer = panel.premiumUpsellChat;
        button = panel.notifyPremiumButtonChat;
    } else { // context === 'image'
        upsellContainer = panel.premiumUpsellImage;
        button = panel.notifyPremiumButtonImage;
    }

    upsellContainer.style.display = 'block';
    button.disabled = false;
    button.textContent = messages.PREMIUM_BUTTON_PROMPT;
}