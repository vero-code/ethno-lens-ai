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

    let lastPromptContext = "";

    const setDesignPanelButtonsExceptResetState = (disabled) => {
        designPanel.scanButton.disabled = disabled;
        designPanel.countrySelect.disabled = disabled;
        designPanel.businessSelect.disabled = disabled;
        designPanel.chat.input.disabled = disabled;
        designPanel.chat.sendButton.disabled = disabled;
    };

    const setImagePanelButtonsExceptResetState = (disabled) => {
        imagePanel.uploadInput.disabled = disabled;
        imagePanel.analyzeButton.disabled = disabled;
        imagePanel.countrySelect.disabled = disabled;
        imagePanel.businessTypeSelect.disabled = disabled;
    };

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
        setDesignPanelButtonsExceptResetState(false);
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
        setImagePanelButtonsExceptResetState(false);
        imagePanel.analyzeButton.disabled = true;
        imagePanel.uploadInput.disabled = false;
    };

    // For other business type
    function handleBusinessTypeChange(selectElement, inputElement) {
        if (selectElement.value === "Other...") {
            inputElement.style.display = "block";
        } else {
            inputElement.style.display = "none";
        }
    }

    designPanel.businessSelect.addEventListener("change", () => {
        handleBusinessTypeChange(designPanel.businessSelect, designPanel.otherBusinessInput);
        enableResetOnInput(designPanel.resetButton);
    });

    imagePanel.businessTypeSelect.addEventListener("change", () => {
        handleBusinessTypeChange(imagePanel.businessTypeSelect, imagePanel.otherBusinessInput);
        enableResetOnInput(imagePanel.resetButton);
    });

    designPanel.countrySelect.addEventListener("change", () => enableResetOnInput(designPanel.resetButton));
    designPanel.businessSelect.addEventListener("change", () => enableResetOnInput(designPanel.resetButton));
    designPanel.chat.input.addEventListener("input", () => {
        if (designPanel.chat.input.value.trim() !== "") {
            enableResetOnInput(designPanel.resetButton);
        } else if (lastPromptContext === "" && designPanel.content.innerHTML === "No issues detected yet.") {
            designPanel.resetButton.disabled = true;
        }
    });

    imagePanel.countrySelect.addEventListener("change", () => enableResetOnInput(imagePanel.resetButton));
    imagePanel.businessTypeSelect.addEventListener("change", () => enableResetOnInput(imagePanel.resetButton));

    // Design - Scan
    designPanel.scanButton.addEventListener("click", async event => {
        setDesignPanelButtonsExceptResetState(true);
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

            if (!country) {
                designPanel.spinner.style.display = "none";
                designPanel.content.innerHTML = `<span class="error">Please select a country before scanning.</span>`;
                setDesignPanelButtonsExceptResetState(false);
                if (designPanel.countrySelect.value === "" && designPanel.businessSelect.value === "" && designPanel.chat.input.value.trim() === "") {
                    designPanel.resetButton.disabled = true;
                } else {
                    designPanel.resetButton.disabled = false;
                }
                return;
            }

            if (!businessType) {
                designPanel.spinner.style.display = "none";
                designPanel.content.innerHTML = `<span class="error">Please select a business type before scanning.</span>`;
                setDesignPanelButtonsExceptResetState(false);
                if (designPanel.countrySelect.value === "" && designPanel.businessSelect.value === "" && designPanel.chat.input.value.trim() === "") {
                    designPanel.resetButton.disabled = true;
                } else {
                    designPanel.resetButton.disabled = false;
                }
                return;
            }

            const startPrompt = `Analyze the provided visual design. The design includes ${description} and is intended for ${country}.`;
            const businessContext = ` The business type is "${businessType}".`;
            const endPrompt = ` Identify any culturally insensitive or inappropriate elements and suggest changes to promote inclusive visual solutions that are suitable for a diverse international audience, with a focus on cultural appropriateness for ${country}. In the first sentence, give a short answer whether this element should be used in the selected country.`;

            const fullPrompt = startPrompt + businessContext + endPrompt;

            if (fullPrompt.includes("No elements selected")) {
                designPanel.spinner.style.display = "none";
                designPanel.content.innerHTML = `<span class="error">Please select a design element on the canvas first.</span>`;
                setDesignPanelButtonsExceptResetState(false);
                if (designPanel.countrySelect.value === "" && designPanel.businessSelect.value === "" && designPanel.chat.input.value.trim() === "") {
                    designPanel.resetButton.disabled = true;
                } else {
                    designPanel.resetButton.disabled = false;
                }
                return;
            }

            const data = await analyzeDesign(fullPrompt);
            designPanel.spinner.style.display = "none";
            setDesignPanelButtonsExceptResetState(false);
            designPanel.resetButton.disabled = false;

            renderMarkdown(designPanel.content, data.result, "<b>AI Response</b><br>");

            lastPromptContext = fullPrompt;
        } catch (error) {
            designPanel.spinner.style.display = "none";
            designPanel.content.innerHTML = `<span class="error">Error: ${error.message}</span>`;
            setDesignPanelButtonsExceptResetState(false);
            designPanel.resetButton.disabled = false;
        }
    });

    designPanel.resetButton.addEventListener("click", () => {
        resetDesignPanel();
    });

    resetDesignPanel();

    // Design - Chat
    designPanel.chat.sendButton.addEventListener("click", async () => {
        designPanel.chat.error.innerHTML = "";
        designPanel.chat.error.style.display = "none";
        designPanel.chat.responseContent.innerHTML = "";

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

        setDesignPanelButtonsExceptResetState(true);
        designPanel.resetButton.disabled = true;
        designPanel.chat.spinner.style.display = "block";

        const fullFollowUpPrompt = `${lastPromptContext}\n\nThe user now asks: "${followUp}"`;
        console.log("fullFollowUpPrompt -> ", fullFollowUpPrompt);

        try {
            const data = await analyzeDesign(fullFollowUpPrompt);
            designPanel.chat.spinner.style.display = "none";

            setDesignPanelButtonsExceptResetState(false);
            designPanel.resetButton.disabled = false;

            renderMarkdown(designPanel.chat.responseContent, data.result, `<b>AI responds:</b><br>`);
            designPanel.chat.input.value = "";
            designPanel.chat.error.style.display = "none";
        } catch (err) {
            designPanel.chat.spinner.style.display = "none";
            designPanel.chat.error.innerHTML = `Error: ${err.message}`;
            designPanel.chat.error.style.display = "block";

            setDesignPanelButtonsExceptResetState(false);
            designPanel.resetButton.disabled = false;
        }
    });

    designPanel.chat.input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") designPanel.chat.sendButton.click();
    });

    // Image
    imagePanel.analyzeButton.addEventListener("click", async () => {
        setImagePanelButtonsExceptResetState(true);
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

        if (!file) {
            imagePanel.spinner.style.display = "none";
            imagePanel.error.innerHTML = `<span class="error">Please select an image file to upload.</span>`;
            imagePanel.error.style.display = "block";
            setImagePanelButtonsExceptResetState(false);
            imagePanel.analyzeButton.disabled = true;
            imagePanel.resetButton.disabled = true;
            return;
        }

        if (!country) {
            imagePanel.spinner.style.display = "none";
            imagePanel.error.innerHTML = `<span class="error">Please select a country.</span>`;
            imagePanel.error.style.display = "block";
            setImagePanelButtonsExceptResetState(false);
            imagePanel.resetButton.disabled = false;
            return;
        }

        if (!businessType) {
            imagePanel.spinner.style.display = "none";
            imagePanel.error.innerHTML = `<span class="error">Please select a business type.</span>`;
            imagePanel.error.style.display = "block";
            setImagePanelButtonsExceptResetState(false);
            imagePanel.resetButton.disabled = false;
            return;
        }

        const formData = new FormData();
        formData.append("image", file);
        formData.append("country", country);
        formData.append("businessType", businessType);

        try {
            const data = await analyzeImage(formData);
            imagePanel.spinner.style.display = "none";
            setImagePanelButtonsExceptResetState(false);
            imagePanel.resetButton.disabled = false;

            renderMarkdown(imagePanel.resultContent, data.result, "<b>AI Image Analysis</b><br>");

        } catch (err) {
            imagePanel.spinner.style.display = "none";
            imagePanel.error.innerHTML = `<span class="error">Error analyzing image: ${err.message}</span>`;
            imagePanel.error.style.display = "block";
            setImagePanelButtonsExceptResetState(false);
            imagePanel.resetButton.disabled = false;
        }
    });

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
            imagePanel.error.innerHTML = "Please select a valid image file.";
            imagePanel.error.style.display = "block";
            imagePanel.resultContent.innerHTML = `No image analyzed yet.`;
        }
    });

    imagePanel.resetButton.addEventListener("click", () => {
        resetImagePanel();
    });

    resetImagePanel();
});
