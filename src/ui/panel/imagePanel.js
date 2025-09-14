// src/ui/panel/imagePanel.js
import { renderMarkdown, enableResetOnInput, handleBusinessTypeChange } from '../utils.js';
import { analyzeImage } from "../api.js";

// --- CONSTANTS ---
const MESSAGES = {
    NO_IMAGE_ANALYZED: "No image analyzed yet.",
    IMAGE_READY: "The image is ready for analysis.",
    INVALID_FILE: "Please select a valid image file.",
    SELECT_IMAGE: "Please select an image file to upload.",
    SELECT_COUNTRY: "Please select a country.",
    SELECT_BUSINESS_TYPE: "Please select a business type."
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
export function initializeImagePanel() {
  const imagePanel = {
    uploadInput: document.getElementById("imageUpload"),
    analyzeButton: document.getElementById("analyzeImage"),
    preview: document.getElementById("imagePreview"),
    resultContent: document.getElementById("imageResultContent"),
    error: document.getElementById("imageError"),
    resetButton: document.getElementById("resetImage"),
    spinner: document.getElementById("imageSpinner"),
    countrySelect: document.getElementById("imageCountrySelect"),
    businessTypeSelect: document.getElementById("imageBusinessType"),
    otherBusinessInput: document.getElementById("imageOtherBusinessType")
  };

  const resetImagePanel = () => {
    imagePanel.uploadInput.value = "";
    imagePanel.preview.src = "";
    imagePanel.preview.style.display = "none";
    imagePanel.resultContent.innerHTML = `No image analyzed yet.`;
    imagePanel.spinner.style.display = "none";
    imagePanel.error.style.display = "none";
    imagePanel.otherBusinessInput.style.display = "none";
    imagePanel.otherBusinessInput.value = "";
    imagePanel.countrySelect.value = "";
    imagePanel.businessTypeSelect.value = "";
    imagePanel.resetButton.disabled = true;
    setButtonsState(imagePanel, false);
    imagePanel.analyzeButton.disabled = true;
    imagePanel.uploadInput.disabled = false;
  };

  // --- EVENT LISTENERS ---
    imagePanel.countrySelect.addEventListener("change", () => enableResetOnInput(imagePanel.resetButton));
    imagePanel.businessTypeSelect.addEventListener("change", () => {
      handleBusinessTypeChange(imagePanel.businessTypeSelect, imagePanel.otherBusinessInput);
      enableResetOnInput(imagePanel.resetButton);
    });
    imagePanel.resetButton.addEventListener("click", resetImagePanel);
    imagePanel.uploadInput.addEventListener("change", () => {
      const file = imagePanel.uploadInput.files[0];
      if (file && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = function (e) {
          imagePanel.preview.src = e.target.result;
          imagePanel.preview.style.display = "block";
          imagePanel.analyzeButton.disabled = false;
          imagePanel.resetButton.disabled = false;
          imagePanel.error.style.display = "none";
          imagePanel.resultContent.innerHTML = `The image is ready for analysis.`;
        };
        reader.readAsDataURL(file);
      } else {
        imagePanel.preview.src = "";
        imagePanel.preview.style.display = "none";
        imagePanel.analyzeButton.disabled = true;
        imagePanel.resetButton.disabled = true;
        showImageError(imagePanel, MESSAGES.INVALID_FILE);
      }
  });

  // --- ACTION BUTTON LISTENERS ---
  imagePanel.analyzeButton.addEventListener("click", async () => {
    setButtonsState(imagePanel, true);
    imagePanel.resetButton.disabled = true;
    imagePanel.spinner.style.display = "block";
    imagePanel.resultContent.innerHTML = "";
    imagePanel.error.style.display = "none";

    const file = imagePanel.uploadInput.files[0];
    const country = imagePanel.countrySelect.value;
    let businessType = imagePanel.businessTypeSelect.value;
    if (businessType === OTHER_OPTION_VALUE) {
      businessType = imagePanel.otherBusinessInput.value.trim();
    }

    if (!file) return showImageError(imagePanel, MESSAGES.SELECT_IMAGE);
    if (!country) return showImageError(imagePanel, MESSAGES.SELECT_COUNTRY);
    if (!businessType) return showImageError(imagePanel, MESSAGES.SELECT_BUSINESS_TYPE);

    const formData = new FormData();
    formData.append("image", file);
    formData.append("country", country);
    formData.append("businessType", businessType);

    try {
      const data = await analyzeImage(formData);
      renderMarkdown(imagePanel.resultContent, data.result, "<b>AI Image Analysis</b><br>");
    } catch (err) {
      showImageError(imagePanel, `Error analyzing image: ${err.message}`);
    } finally { 
      imagePanel.spinner.style.display = "none";
      setButtonsState(imagePanel, false);
      imagePanel.resetButton.disabled = false;
    }
  });

  // Initial state setup
  resetImagePanel();
}