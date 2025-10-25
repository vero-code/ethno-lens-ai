// src/ui/panel/imagePanel.js
import { renderMarkdown, enableResetOnInput, handleBusinessTypeChange, handlePremiumClick, showPremiumUpsell } from '../utils.js';
import { analyzeImage, logPremiumInterest } from "../api.js";
import { getUserId } from '../user.js';

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

// --- MAIN INITIALIZATION FUNCTION ---
export function initializeImagePanel(isMockMode) {
  const imagePanel = {
    uploadInput: document.getElementById("imageUpload"),
    browseButton: document.getElementById("browseButton"),
    analyzeButton: document.getElementById("analyzeImage"),
    preview: document.getElementById("imagePreview"),
    resultContent: document.getElementById("imageResultContent"),
    error: document.getElementById("imageError"),
    resetButton: document.getElementById("resetImage"),
    spinner: document.getElementById("imageSpinner"),
    countrySelect: document.getElementById("imageCountrySelect"),
    businessTypeSelect: document.getElementById("imageBusinessType"),
    otherBusinessInput: document.getElementById("imageOtherBusinessType"),
    imageOtherBusinessTypeContainer: document.getElementById("imageOtherBusinessTypeContainer"),
    premiumUpsellImage: document.getElementById("premiumUpsellImage"),
    notifyPremiumButtonImage: document.getElementById("notifyPremiumButtonImage")
  };

  let userId = null;
  let selectedFile = null;

  const resetImagePanel = () => {
    selectedFile = null;
    imagePanel.preview.src = "";
    imagePanel.preview.style.display = "none";
    imagePanel.resultContent.innerHTML = MESSAGES.NO_IMAGE_ANALYZED;
    imagePanel.spinner.style.display = "none";
    imagePanel.error.style.display = "none";
    imagePanel.imageOtherBusinessTypeContainer.style.display = "none";
    imagePanel.otherBusinessInput.value = "";
    imagePanel.countrySelect.value = "";
    imagePanel.businessTypeSelect.value = "";
    imagePanel.resetButton.disabled = true;
    setButtonsState(imagePanel, false);
    imagePanel.analyzeButton.disabled = true;
    imagePanel.uploadInput.disabled = false;
    imagePanel.premiumUpsellImage.style.display = 'none';
  };

  const handleFileSelect = (file) => {
    if (file && file.type.startsWith("image/")) {
      selectedFile = file;

      const reader = new FileReader();
      reader.onload = function (e) {
        imagePanel.preview.src = e.target.result;
        imagePanel.preview.style.display = "block";
        imagePanel.analyzeButton.disabled = false;
        imagePanel.resetButton.disabled = false;
        imagePanel.error.style.display = "none";
        imagePanel.resultContent.innerHTML = MESSAGES.IMAGE_READY;
      };
      reader.readAsDataURL(file);
    } else {
      selectedFile = null;
      imagePanel.preview.src = "";
      imagePanel.preview.style.display = "none";
      imagePanel.analyzeButton.disabled = true;
      imagePanel.resetButton.disabled = true;
      showImageError(imagePanel, MESSAGES.INVALID_FILE);
    }
  };

  // --- EVENT LISTENERS ---
  imagePanel.countrySelect.addEventListener("change", () => enableResetOnInput(imagePanel.resetButton));
  imagePanel.businessTypeSelect.addEventListener("change", () => {
    handleBusinessTypeChange(imagePanel.businessTypeSelect, imagePanel.imageOtherBusinessTypeContainer);
    enableResetOnInput(imagePanel.resetButton);
  });
  imagePanel.resetButton.addEventListener("click", resetImagePanel);

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
      imagePanel.premiumUpsellImage.style.display = 'none';
    } catch (err) {
      const isLimitError = err.status === 429;
      const errorMessage = isLimitError
        ? MESSAGES.PREMIUM_LIMIT_REACHED
        : `Error analyzing image: ${err.message}`;
      showImageError(imagePanel, errorMessage);
      if (isLimitError) { showPremiumUpsell(imagePanel, 'image', MESSAGES); }
    } finally { 
      imagePanel.spinner.style.display = "none";
      setButtonsState(imagePanel, false);
      imagePanel.resetButton.disabled = false;
    }
  });

  // Initial state setup
  resetImagePanel();
}