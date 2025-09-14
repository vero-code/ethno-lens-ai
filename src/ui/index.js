// src/ui/index.js
import addOnUISdk from "https://new.express.adobe.com/static/add-on-sdk/sdk.js";
import { initializeTabs } from './tabs.js';
import { renderMarkdown, enableResetOnInput } from './utils.js';
import { analyzeDesign, analyzeImage } from "./api.js";

addOnUISdk.ready.then(async () => {
    console.log("addOnUISdk is ready for use.");

    initializeTabs();
    const { runtime } = addOnUISdk.instance;
    const sandboxProxy = await runtime.apiProxy("documentSandbox");

    // Design - Scan
    const scanDesignButton = document.getElementById("scanDesign");
    const scanDesignContent = document.getElementById("scanDesignContent");
    const scanDesignSpinner = document.getElementById("scanDesignSpinner");
    const countrySelect = document.getElementById("countrySelect");
    const businessSelect = document.getElementById("businessType");
    const otherBusinessInput = document.getElementById("otherBusinessType");
    const resetDesignButton = document.getElementById("resetDesign");

    // Design - Chat
    const chatInput = document.getElementById("chatInput");
    const chatSend = document.getElementById("chatSend");
    const chatResponseContent = document.getElementById("chatResponseContent");
    const chatError = document.getElementById("chatError");
    const chatSpinner = document.getElementById("chatSpinner");

    // Image
    const imageUploadInput = document.getElementById("imageUpload");
    const analyzeImageButton = document.getElementById("analyzeImage");
    const imagePreview = document.getElementById("imagePreview");
    const imageResultContent = document.getElementById("imageResultContent");
    const imageError = document.getElementById("imageError");
    const resetImageButton = document.getElementById("resetImage");
    const imageSpinner = document.getElementById("imageSpinner");

    const imageCountrySelect = document.getElementById("imageCountrySelect");
    const imageBusinessType = document.getElementById("imageBusinessType");
    const imageOtherBusinessInput = document.getElementById("imageOtherBusinessType");

    let lastPromptContext = "";

    const setDesignPanelButtonsExceptResetState = (disabled) => {
        scanDesignButton.disabled = disabled;
        countrySelect.disabled = disabled;
        businessSelect.disabled = disabled;
        chatInput.disabled = disabled;
        chatSend.disabled = disabled;
    };

    const setImagePanelButtonsExceptResetState = (disabled) => {
        imageUploadInput.disabled = disabled;
        analyzeImageButton.disabled = disabled;
        imageCountrySelect.disabled = disabled;
        imageBusinessType.disabled = disabled;
    };

    const resetDesignPanel = () => {
        countrySelect.value = "";
        businessSelect.value = "";
        scanDesignContent.innerHTML = "No issues detected yet.";
        scanDesignSpinner.style.display = "none";
        chatInput.value = "";
        chatResponseContent.innerHTML = "AI conversation not started yet.";
        chatSpinner.style.display = "none";
        chatError.style.display = "none";
        otherBusinessInput.style.display = "none";
        otherBusinessInput.value = "";
        lastPromptContext = "";
        resetDesignButton.disabled = true;
        setDesignPanelButtonsExceptResetState(false);
    };

    const resetImagePanel = () => {
        imageUploadInput.value = "";
        imagePreview.src = "";
        imagePreview.style.display = "none";
        imageResultContent.innerHTML = `No image analyzed yet.`;
        imageSpinner.style.display = "none";
        imageError.style.display = "none";
        imageOtherBusinessInput.style.display = "none";
        imageOtherBusinessInput.value = "";
        imageCountrySelect.value = "";
        imageBusinessType.value = "";
        resetImageButton.disabled = true;
        setImagePanelButtonsExceptResetState(false);
        analyzeImageButton.disabled = true;
        imageUploadInput.disabled = false;
    };

    // For other business type
    function handleBusinessTypeChange(selectElement, inputElement) {
        if (selectElement.value === "Other...") {
            inputElement.style.display = "block";
        } else {
            inputElement.style.display = "none";
        }
    }

    businessSelect.addEventListener("change", () => {
        handleBusinessTypeChange(businessSelect, otherBusinessInput);
        enableResetOnInput(resetDesignButton);
    });

    imageBusinessType.addEventListener("change", () => {
        handleBusinessTypeChange(imageBusinessType, imageOtherBusinessInput);
        enableResetOnInput(resetImageButton);
    });

    countrySelect.addEventListener("change", () => enableResetOnInput(resetDesignButton));
    businessSelect.addEventListener("change", () => enableResetOnInput(resetDesignButton));
    chatInput.addEventListener("input", () => {
        if (chatInput.value.trim() !== "") {
            enableResetOnInput(resetDesignButton);
        } else if (lastPromptContext === "" && scanDesignContent.innerHTML === "No issues detected yet.") {
            resetDesignButton.disabled = true;
        }
    });

    imageCountrySelect.addEventListener("change", () => enableResetOnInput(resetImageButton));
    imageBusinessType.addEventListener("change", () => enableResetOnInput(resetImageButton));

    // Design - Scan
    scanDesignButton.addEventListener("click", async event => {
        setDesignPanelButtonsExceptResetState(true);
        resetDesignButton.disabled = true;
        scanDesignSpinner.style.display = "block";
        scanDesignContent.innerHTML = "";
        chatError.innerHTML = "";
        chatResponseContent.innerHTML = "AI conversation not started yet.";

        try {
            const description = await sandboxProxy.getDesignDescription();
            const country = countrySelect.value;

            let businessType = businessSelect.value;
            if (businessType === "Other...") {
                businessType = otherBusinessInput.value.trim();
            }

            if (!country) {
                scanDesignSpinner.style.display = "none";
                scanDesignContent.innerHTML = `<span class="error">Please select a country before scanning.</span>`;
                setDesignPanelButtonsExceptResetState(false);
                if (countrySelect.value === "" && businessSelect.value === "" && chatInput.value.trim() === "") {
                    resetDesignButton.disabled = true;
                } else {
                    resetDesignButton.disabled = false;
                }
                return;
            }

            if (!businessType) {
                scanDesignSpinner.style.display = "none";
                scanDesignContent.innerHTML = `<span class="error">Please select a business type before scanning.</span>`;
                setDesignPanelButtonsExceptResetState(false);
                if (countrySelect.value === "" && businessSelect.value === "" && chatInput.value.trim() === "") {
                    resetDesignButton.disabled = true;
                } else {
                    resetDesignButton.disabled = false;
                }
                return;
            }

            const startPrompt = `Analyze the provided visual design. The design includes ${description} and is intended for ${country}.`;
            const businessContext = ` The business type is "${businessType}".`;
            const endPrompt = ` Identify any culturally insensitive or inappropriate elements and suggest changes to promote inclusive visual solutions that are suitable for a diverse international audience, with a focus on cultural appropriateness for ${country}. In the first sentence, give a short answer whether this element should be used in the selected country.`;

            const fullPrompt = startPrompt + businessContext + endPrompt;

            if (fullPrompt.includes("No elements selected")) {
                scanDesignSpinner.style.display = "none";
                scanDesignContent.innerHTML = `<span class="error">Please select a design element on the canvas first.</span>`;
                setDesignPanelButtonsExceptResetState(false);
                if (countrySelect.value === "" && businessSelect.value === "" && chatInput.value.trim() === "") {
                    resetDesignButton.disabled = true;
                } else {
                    resetDesignButton.disabled = false;
                }
                return;
            }

            const data = await analyzeDesign(fullPrompt);
            scanDesignSpinner.style.display = "none";
            setDesignPanelButtonsExceptResetState(false);
            resetDesignButton.disabled = false;

            renderMarkdown(scanDesignContent, data.result, "<b>AI Response</b><br>");

            lastPromptContext = fullPrompt;
        } catch (error) {
            scanDesignSpinner.style.display = "none";
            scanDesignContent.innerHTML = `<span class="error">Error: ${error.message}</span>`;
            setDesignPanelButtonsExceptResetState(false);
            resetDesignButton.disabled = false;
        }
    });

    resetDesignButton.addEventListener("click", () => {
        resetDesignPanel();
    });

    resetDesignPanel();

    // Design - Chat
    chatSend.addEventListener("click", async () => {
        chatError.innerHTML = "";
        chatError.style.display = "none";
        chatResponseContent.innerHTML = "";

        const followUp = chatInput.value.trim();

        if (!followUp) {
            chatError.innerHTML = "Please enter a message before sending.";
            chatError.style.display = "block";
            return;
        }

        if (!lastPromptContext) {
            chatError.innerHTML = "Please scan a design before asking follow-up questions.";
            chatError.style.display = "block";
            return;
        }

        setDesignPanelButtonsExceptResetState(true);
        resetDesignButton.disabled = true;
        chatSpinner.style.display = "block";

        const fullFollowUpPrompt = `${lastPromptContext}\n\nThe user now asks: "${followUp}"`;
        console.log("fullFollowUpPrompt -> ", fullFollowUpPrompt);

        try {
            const data = await analyzeDesign(fullFollowUpPrompt);
            chatSpinner.style.display = "none";

            setDesignPanelButtonsExceptResetState(false);
            resetDesignButton.disabled = false;

            renderMarkdown(chatResponseContent, data.result, `<b>AI responds:</b><br>`);
            chatInput.value = "";
            chatError.style.display = "none";
        } catch (err) {
            chatSpinner.style.display = "none";
            chatError.innerHTML = `Error: ${err.message}`;
            chatError.style.display = "block";

            setDesignPanelButtonsExceptResetState(false);
            resetDesignButton.disabled = false;
        }
    });

    chatInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") chatSend.click();
    });

    // Image
    analyzeImageButton.addEventListener("click", async () => {
        setImagePanelButtonsExceptResetState(true);
        resetImageButton.disabled = true;
        imageSpinner.style.display = "block";
        imageResultContent.innerHTML = "";
        imageError.style.display = "none";

        const file = imageUploadInput.files[0];
        const country = imageCountrySelect.value;

        let businessType = imageBusinessType.value;
        if (businessType === "Other...") {
            businessType = imageOtherBusinessInput.value.trim();
        }

        if (!file) {
            imageSpinner.style.display = "none";
            imageError.innerHTML = `<span class="error">Please select an image file to upload.</span>`;
            imageError.style.display = "block";
            setImagePanelButtonsExceptResetState(false);
            analyzeImageButton.disabled = true;
            resetImageButton.disabled = true;
            return;
        }

        if (!country) {
            imageSpinner.style.display = "none";
            imageError.innerHTML = `<span class="error">Please select a country.</span>`;
            imageError.style.display = "block";
            setImagePanelButtonsExceptResetState(false);
            resetImageButton.disabled = false;
            return;
        }

        if (!businessType) {
            imageSpinner.style.display = "none";
            imageError.innerHTML = `<span class="error">Please select a business type.</span>`;
            imageError.style.display = "block";
            setImagePanelButtonsExceptResetState(false);
            resetImageButton.disabled = false;
            return;
        }

        const formData = new FormData();
        formData.append("image", file);
        formData.append("country", country);
        formData.append("businessType", businessType);

        try {
            const data = await analyzeImage(formData);
            imageSpinner.style.display = "none";
            setImagePanelButtonsExceptResetState(false);
            resetImageButton.disabled = false;

            renderMarkdown(imageResultContent, data.result, "<b>AI Image Analysis</b><br>");

        } catch (err) {
            imageSpinner.style.display = "none";
            imageError.innerHTML = `<span class="error">Error analyzing image: ${err.message}</span>`;
            imageError.style.display = "block";
            setImagePanelButtonsExceptResetState(false);
            resetImageButton.disabled = false;
        }
    });

    imageUploadInput.addEventListener("change", () => {
        const file = imageUploadInput.files[0];
        if (file && file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onload = function (e) {
                imagePreview.src = e.target.result;
                imagePreview.style.display = "block";
                analyzeImageButton.disabled = false;
                resetImageButton.disabled = false;
                imageError.style.display = "none";
                imageResultContent.innerHTML = `The image is ready for analysis.`;
            };
            reader.readAsDataURL(file);
        } else {
            imagePreview.src = "";
            imagePreview.style.display = "none";
            analyzeImageButton.disabled = true;
            resetImageButton.disabled = true;
            imageError.innerHTML = "Please select a valid image file.";
            imageError.style.display = "block";
            imageResultContent.innerHTML = `No image analyzed yet.`;
        }
    });

    resetImageButton.addEventListener("click", () => {
        resetImagePanel();
    });

    resetImagePanel();
});
