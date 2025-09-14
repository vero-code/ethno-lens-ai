// src/ui/index.js
import addOnUISdk from "https://new.express.adobe.com/static/add-on-sdk/sdk.js";
import { initializeTabs } from './tabs.js';
import { renderMarkdown, enableResetOnInput } from './utils.js';
import { analyzeImage } from "./api.js";
import { initializeDesignPanel } from './designPanel.js';

addOnUISdk.ready.then(async () => {
    console.log("addOnUISdk is ready for use.");

    initializeTabs();
    const { runtime } = addOnUISdk.instance;
    const sandboxProxy = await runtime.apiProxy("documentSandbox");

    initializeDesignPanel(sandboxProxy);

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

    // --- HELPER FUNCTIONS ---
    const setButtonsState = (panel, disabled) => {
        if (panel === 'image') {
            imagePanel.uploadInput.disabled = disabled;
            imagePanel.analyzeButton.disabled = disabled;
            imagePanel.countrySelect.disabled = disabled;
            imagePanel.businessTypeSelect.disabled = disabled;
        }
    };

    const showImageError = (message) => {
        imagePanel.spinner.style.display = "none";
        imagePanel.error.innerHTML = `<span class="error">${message}</span>`;
        imagePanel.error.style.display = "block";
        setButtonsState('image', false);
        imagePanel.resetButton.disabled = false;
    };

    function handleBusinessTypeChange(selectElement, inputElement) {
        if (selectElement.value === "Other...") {
            inputElement.style.display = "block";
        } else {
            inputElement.style.display = "none";
        }
    }

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
        setButtonsState('image', false);
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
            showImageError("Please select a valid image file.");
        }
    });

    // --- ACTION BUTTON LISTENERS ---
    imagePanel.analyzeButton.addEventListener("click", async () => {
        setButtonsState('image', true);
        imagePanel.resetButton.disabled = true;
        imagePanel.spinner.style.display = "block";
        imagePanel.resultContent.innerHTML = "";
        imagePanel.error.style.display = "none";

        const file = imagePanel.uploadInput.files[0];
        const country = imagePanel.countrySelect.value;
        let businessType = imagePanel.businessTypeSelect.value;
        if (businessType === "Other...") {
            businessType = imagePanel.otherBusinessInput.value.trim();
        }

        if (!file) return showImageError("Please select an image file to upload.");
        if (!country) return showImageError("Please select a country.");
        if (!businessType) return showImageError("Please select a business type.");

        const formData = new FormData();
        formData.append("image", file);
        formData.append("country", country);
        formData.append("businessType", businessType);

        try {
            const data = await analyzeImage(formData);
            renderMarkdown(imagePanel.resultContent, data.result, "<b>AI Image Analysis</b><br>");
        } catch (err) {
            showImageError(`Error analyzing image: ${err.message}`);
        } finally { 
            imagePanel.spinner.style.display = "none";
            setButtonsState('image', false);
            imagePanel.resetButton.disabled = false;
        }
    });

    // Initial state setup
    resetImagePanel();
});
