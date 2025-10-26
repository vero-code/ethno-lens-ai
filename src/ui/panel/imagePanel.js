// src/ui/panel/imagePanel.js
import { renderMarkdown, handleBusinessTypeChange, handlePremiumClick, showPremiumUpsell } from '../utils.js';
import { analyzeImage, logPremiumInterest } from "../api.js";
import { getUserId } from '../user.js';
import { updateUsageDisplay } from '../usageLimit.js';

// --- CONSTANTS ---
const MESSAGES = {
    NO_IMAGE_ANALYZED: "No image analyzed yet.",
    IMAGE_READY: "The image is ready for analysis.",
    INVALID_FILE: "Please select a valid image file.",
    SELECT_IMAGE: "Please select an image file to upload.",
    SELECT_COUNTRY: "Please select a country.",
    SELECT_BUSINESS_TYPE: "Please select a business type.",
    USER_ID_ERROR: "Could not identify user. Please try again.",

    PREMIUM_LIMIT_REACHED: "Free limit reached. Premium coming soon.",
    PREMIUM_BUTTON_PROMPT: "I'm interested in Premium",
    PREMIUM_BUTTON_THANKS: "Thanks! Your interest has been noted.",
};
const OTHER_OPTION_VALUE = "Other...";

// --- HELPER FUNCTIONS ---
const setButtonsState = (imagePanel, disabled) => {
  imagePanel.uploadInput.disabled = disabled;
  imagePanel.analyzeButton.disabled = disabled;
  imagePanel.countrySelect.disabled = disabled;
  imagePanel.businessTypeSelect.disabled = disabled;
};

const showImageError = (imagePanel, message) => {
  imagePanel.spinner.style.display = "none";
  imagePanel.error.innerHTML = `<span class="error">${message}</span>`;
  imagePanel.error.style.display = "block";
  setButtonsState(imagePanel, false);
  imagePanel.resetButton.disabled = false;
};

/**
 * Toggles visibility of sp-dropzone content.
 * @param {object} imagePanel - Panel elements.
 * @param {boolean} show - Whether to show or hide the content.
 */
const toggleDropzoneContent = (imagePanel, show) => {
    const displayValue = show ? "" : "none";
    const message = imagePanel.uploadInput.querySelector("sp-illustrated-message");
    if (message) {
        message.style.display = displayValue;
    }
    if (imagePanel.browseButton) {
        imagePanel.browseButton.style.display = displayValue;
    }
};

/**
 * Checks the state of all inputs and updates the accordion and buttons.
 * @param {object} imagePanel - The panel elements.
 * @param {File | null} selectedFile - The currently selected file, if any.
 */
const updatePanelState = (imagePanel, selectedFile) => {
  // 1. Check if Step 1 is completed
  const country = imagePanel.countrySelect.value;
  const countryIsValid = country && country !== '-- Select a country --';

  let businessType = imagePanel.businessTypeSelect.value;
  let businessIsValid = false;
  
  if (businessType === OTHER_OPTION_VALUE) {
      businessIsValid = !!imagePanel.otherBusinessInput.value.trim();
  } else {
    businessIsValid = businessType && businessType !== '-- Select a business type --';
  }
  const step1Complete = countryIsValid && businessIsValid;

  // 2. Check if Step 2 is completed
  const step2Complete = !!selectedFile;

  // 3. Step 2 becomes available once Step 1 is completed
  imagePanel.accordionStep2.disabled = !step1Complete;

  // 4. Update availability of Step 3
  const readyForAnalysis = step1Complete && step2Complete;
  imagePanel.accordionStep3.disabled = !readyForAnalysis;
  imagePanel.analyzeButton.disabled = !readyForAnalysis;

  // 5. Enable Reset if *at least something* is filled in
  const hasAnyInput = !!country || (businessType && businessType !== OTHER_OPTION_VALUE) || (businessType === OTHER_OPTION_VALUE && !!imagePanel.otherBusinessInput.value.trim()) || !!selectedFile;
  imagePanel.resetButton.disabled = !hasAnyInput;
};

// --- MAIN INITIALIZATION FUNCTION ---
export function initializeImagePanel(isMockMode) {
  const imagePanel = {
    uploadInput: document.getElementById("imageUpload"),
    browseButton: document.getElementById("browseButton"),
    analyzeButton: document.getElementById("analyzeImage"),
    resultContent: document.getElementById("imageResultContent"),
    error: document.getElementById("imageError"),
    resetButton: document.getElementById("resetImage"),
    spinner: document.getElementById("imageSpinner"),
    countrySelect: document.getElementById("imageCountrySelect"),
    businessTypeSelect: document.getElementById("imageBusinessType"),
    otherBusinessInput: document.getElementById("imageOtherBusinessType"),
    imageOtherBusinessTypeContainer: document.getElementById("imageOtherBusinessTypeContainer"),
    premiumUpsellImage: document.getElementById("premiumUpsellImage"),
    notifyPremiumButtonImage: document.getElementById("notifyPremiumButtonImage"),
    accordionStep1: document.getElementById("step1"),
    accordionStep2: document.getElementById("step2"),
    accordionStep3: document.getElementById("step3"),
    confirmResetButton: document.getElementById("confirm-reset"),
    cancelResetButton: document.getElementById("cancel-reset"),
    clearImageButton: document.getElementById("clearImageButton")
  };

  let userId = null;
  let selectedFile = null;

  const resetImagePanel = () => {
    selectedFile = null;
    imagePanel.uploadInput.style.backgroundImage = "none";
    toggleDropzoneContent(imagePanel, true);
    if (imagePanel.clearImageButton) imagePanel.clearImageButton.style.display = 'none';
    imagePanel.resultContent.innerHTML = MESSAGES.NO_IMAGE_ANALYZED;
    imagePanel.spinner.style.display = "none";
    imagePanel.error.style.display = "none";
    imagePanel.imageOtherBusinessTypeContainer.style.display = "none";
    imagePanel.otherBusinessInput.value = "";
    imagePanel.countrySelect.value = "";
    imagePanel.businessTypeSelect.value = "";
    setButtonsState(imagePanel, false);
    imagePanel.uploadInput.disabled = false;
    imagePanel.premiumUpsellImage.style.display = 'none';

    imagePanel.accordionStep1.open = true;
    imagePanel.accordionStep2.open = false;
    imagePanel.accordionStep3.open = false;
    updatePanelState(imagePanel, selectedFile);
  };

  const handleFileSelect = (file) => {
    if (file && file.type.startsWith("image/")) {
      selectedFile = file;

      const reader = new FileReader();
      reader.onload = function (e) {
        const imageUrl = e.target.result;
        imagePanel.uploadInput.style.backgroundImage = `url(${imageUrl})`;
        imagePanel.uploadInput.style.backgroundSize = "contain";
        imagePanel.uploadInput.style.backgroundRepeat = "no-repeat";
        imagePanel.uploadInput.style.backgroundPosition = "center";
        toggleDropzoneContent(imagePanel, false);
        if (imagePanel.clearImageButton) imagePanel.clearImageButton.style.display = 'block';
        imagePanel.error.style.display = "none";
        imagePanel.resultContent.innerHTML = MESSAGES.IMAGE_READY;

        updatePanelState(imagePanel, selectedFile);

        if (!imagePanel.accordionStep3.disabled) {
          imagePanel.accordionStep2.open = false;
          imagePanel.accordionStep3.open = true;
        }
      };
      reader.readAsDataURL(file);
    } else {
      selectedFile = null;
      imagePanel.uploadInput.style.backgroundImage = "none";
      toggleDropzoneContent(imagePanel, true);
      if (imagePanel.clearImageButton) imagePanel.clearImageButton.style.display = 'none';
      showImageError(imagePanel, MESSAGES.INVALID_FILE);
      updatePanelState(imagePanel, selectedFile);
    }
  };

  // --- EVENT LISTENERS ---
  const handleStep1Change = () => {
    handleBusinessTypeChange(imagePanel.businessTypeSelect, imagePanel.imageOtherBusinessTypeContainer);
    updatePanelState(imagePanel, selectedFile);
    if (!imagePanel.accordionStep2.disabled) {
        imagePanel.accordionStep1.open = false;
        imagePanel.accordionStep2.open = true;
    } else {
        imagePanel.accordionStep1.open = true;
        imagePanel.accordionStep2.open = false;
        imagePanel.accordionStep3.open = false;
    }
  };
  
  imagePanel.countrySelect.addEventListener("change", handleStep1Change);
  imagePanel.businessTypeSelect.addEventListener("change", handleStep1Change);
  imagePanel.otherBusinessInput.addEventListener("input", handleStep1Change);

  // Reset: Confirmation dialog
  imagePanel.cancelResetButton.addEventListener("click", () => {
    imagePanel.resetButton.closest('overlay-trigger').open = false;
  });

  imagePanel.confirmResetButton.addEventListener("click", () => {
    resetImagePanel();
    imagePanel.resetButton.closest('overlay-trigger').open = false;
  });

  // --- Clear Image Button ---
  if (imagePanel.clearImageButton) {
    imagePanel.clearImageButton.addEventListener("click", (event) => {
      event.stopPropagation();
      selectedFile = null;
      imagePanel.uploadInput.style.backgroundImage = "none";
      toggleDropzoneContent(imagePanel, true);
      imagePanel.clearImageButton.style.display = "none";
      imagePanel.resultContent.innerHTML = MESSAGES.NO_IMAGE_ANALYZED;
      imagePanel.error.style.display = "none";
      updatePanelState(imagePanel, selectedFile);
      imagePanel.accordionStep2.open = true;
      imagePanel.accordionStep3.open = false;
    });
  }

  imagePanel.notifyPremiumButtonImage.addEventListener("click", async () => {
      if (!userId) userId = await getUserId();
      handlePremiumClick(imagePanel.notifyPremiumButtonImage, userId, logPremiumInterest, MESSAGES);
  });

  // --- "Browse files" btn ---
  imagePanel.browseButton.addEventListener("click", () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";

    fileInput.addEventListener("change", (event) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            handleFileSelect(files[0]);
        }
    });

    fileInput.click();
  });

  // --- Drag and Drop для sp-dropzone ---
  imagePanel.uploadInput.addEventListener("drop", (event) => {
    console.log("Drop event triggered");
    
    const files = event.dataTransfer?.files;
    
    if (files && files.length > 0) {
      console.log("File dropped:", files[0].name);
      handleFileSelect(files[0]);
    } else {
      console.log("No files found in drop event");
    }
  });

  // --- ACTION BUTTON LISTENERS ---
  imagePanel.analyzeButton.addEventListener("click", async () => {
    setButtonsState(imagePanel, true);
    imagePanel.resetButton.disabled = true;
    imagePanel.spinner.style.display = "block";
    imagePanel.resultContent.innerHTML = "";
    imagePanel.error.style.display = "none";

    try {
      if (!userId) userId = await getUserId();
      if (!userId) return showImageError(imagePanel, MESSAGES.USER_ID_ERROR);

      const file = selectedFile;
      const country = imagePanel.countrySelect.value;
      let businessType = imagePanel.businessTypeSelect.value;
      if (businessType === OTHER_OPTION_VALUE) {
        businessType = imagePanel.otherBusinessInput.value.trim();
      }

      if (!file) return showImageError(imagePanel, MESSAGES.SELECT_IMAGE);
      if (!country) return showImageError(imagePanel, MESSAGES.SELECT_COUNTRY);
      if (!businessType) return showImageError(imagePanel, MESSAGES.SELECT_BUSINESS_TYPE);

      let data;
      if (isMockMode()) {
        console.log("Image API call is OFF. Using mock data for Image Panel.");
        data = { result: "This is a **mock response** for the image panel. The real API call was not made." };
      } else {
        const formData = new FormData();
        formData.append("image", file);
        formData.append("country", country);
        formData.append("businessType", businessType);
        formData.append("userId", userId);
        data = await analyzeImage(formData);
      }

      renderMarkdown(imagePanel.resultContent, data.result, "<b>AI Image Analysis</b><br>");
      await updateUsageDisplay();
      imagePanel.premiumUpsellImage.style.display = 'none';
    } catch (err) {
      const isLimitError = err.status === 429;
      const errorMessage = isLimitError
        ? MESSAGES.PREMIUM_LIMIT_REACHED
        : `Error analyzing image: ${err.message}`;
      showImageError(imagePanel, errorMessage);
      if (isLimitError) {
        await updateUsageDisplay();
        showPremiumUpsell(imagePanel, 'image', MESSAGES);
      }
    } finally { 
      imagePanel.spinner.style.display = "none";
      setButtonsState(imagePanel, false);
      updatePanelState(imagePanel, selectedFile);
    }
  });

  // Initial state setup
  resetImagePanel();
}