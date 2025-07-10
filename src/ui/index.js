// src/ui/index.js
import addOnUISdk from "https://new.express.adobe.com/static/add-on-sdk/sdk.js";

const tabButtons = document.querySelectorAll('.spectrum-Tabs-item');
const tabPanels = document.querySelectorAll('.spectrum-Tabs-panel');
const selectionIndicator = document.getElementById('selectionIndicator');

function setSelectionIndicatorPosition(activeTab) {
    if (activeTab && selectionIndicator) {
        const tabRect = activeTab.getBoundingClientRect();
        const tabsContainer = activeTab.closest('.spectrum-Tabs');
        const containerRect = tabsContainer.getBoundingClientRect();

        selectionIndicator.style.width = `${tabRect.width}px`;
        selectionIndicator.style.transform = `translateX(${tabRect.left - containerRect.left}px)`;
    }
}

function initializeTabs() {
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetPanelId = button.getAttribute('aria-controls');

            tabButtons.forEach(btn => {
                btn.classList.remove('spectrum-Tabs-item--selected');
                btn.setAttribute('aria-selected', 'false');
            });
            tabPanels.forEach(panel => {
                panel.setAttribute('hidden', '');
            });

            button.classList.add('spectrum-Tabs-item--selected');
            button.setAttribute('aria-selected', 'true');
            document.getElementById(targetPanelId).removeAttribute('hidden');

            setSelectionIndicatorPosition(button);
        });
    });

    const initialActiveTab = document.querySelector('.spectrum-Tabs-item--selected');
    if (initialActiveTab) {
        setSelectionIndicatorPosition(initialActiveTab);
    }
}

addOnUISdk.ready.then(async () => {
    console.log("addOnUISdk is ready for use.");

    initializeTabs();
    const { runtime } = addOnUISdk.instance;
    const sandboxProxy = await runtime.apiProxy("documentSandbox");

    const scanDesignButton = document.getElementById("scanDesign");
    const resultBox = document.getElementById("resultBox");
    const scanDesignContent = document.getElementById("scanDesignContent");
    const scanDesignSpinner = document.getElementById("scanDesignSpinner");
    const countrySelect = document.getElementById("countrySelect");
    const businessSelect = document.getElementById("businessType");
    const resetDesignButton = document.getElementById("resetDesign");

    const chatInput = document.getElementById("chatInput");
    const chatSend = document.getElementById("chatSend");
    const chatResponse = document.getElementById("chatResponse");
    const chatResponseContent = document.getElementById("chatResponseContent");
    const chatError = document.getElementById("chatError");
    const chatSpinner = document.getElementById("chatSpinner");

    const imageUploadInput = document.getElementById("imageUpload");
    const analyzeImageButton = document.getElementById("analyzeImage");
    const imagePreview = document.getElementById("imagePreview");
    const imageResultBox = document.getElementById("imageResultBox");
    const imageResultContent = document.getElementById("imageResultContent");
    const imageError = document.getElementById("imageError");
    const resetImageButton = document.getElementById("resetImage");
    const imageSpinner = document.getElementById("imageSpinner");

    let lastPromptContext = "";

    const renderMarkdown = (targetElement, markdownText, prefix = "") => {
        targetElement.innerHTML = "";
        if (markdownText && typeof markdownText === 'string' && markdownText.trim() !== '') {
            targetElement.innerHTML = prefix + marked.parse(markdownText);
        } else {
            targetElement.innerHTML = prefix + `<span style="color:gray;">AI returned an empty or invalid response.</span>`;
            console.warn("Attempted to render empty or invalid Markdown:", markdownText);
        }
    };

    const resetDesignPanel = () => {
        countrySelect.value = "";
        businessSelect.value = "";
        scanDesignContent.innerHTML = "No issues detected yet.";
        scanDesignSpinner.style.display = "none";
        chatInput.value = "";
        chatResponseContent.innerHTML = "";
        chatSpinner.style.display = "none";
        chatError.style.display = "none";
        lastPromptContext = "";
        scanDesignButton.disabled = false;
        resetDesignButton.disabled = true;
    };

    const resetImagePanel = () => {
        imageUploadInput.value = "";
        imagePreview.src = "";
        imagePreview.style.display = "none";
        imageResultContent.innerHTML = `No image analyzed yet.`;
        imageSpinner.style.display = "none";
        imageError.style.display = "none";
        analyzeImageButton.disabled = true;
        resetImageButton.disabled = true;
    };

    scanDesignButton.addEventListener("click", async event => {
        scanDesignSpinner.style.display = "block";
        scanDesignContent.innerHTML = "";
        chatResponseContent.innerHTML = "";
        resetDesignButton.disabled = false;

        try {
            const description = await sandboxProxy.getDesignDescription();
            const country = countrySelect.value;
            const businessType = businessSelect.value;

            if (!country) {
                scanDesignSpinner.style.display = "none";
                scanDesignContent.innerHTML = `<span style="color:orange;">Please select a country before scanning.</span>`;
                return;
            }

            if (!businessType) {
                scanDesignSpinner.style.display = "none";
                scanDesignContent.innerHTML = `<span style="color:orange;">Please select a business type before scanning.</span>`;
                return;
            }

            const startPrompt = `Analyze the provided visual design. The design includes ${description} and is intended for ${country}.`;
            const businessContext = ` The business type is "${businessType}".`;
            const endPrompt = ` Identify any culturally insensitive or inappropriate elements and suggest changes to promote inclusive visual solutions that are suitable for a diverse international audience, with a focus on cultural appropriateness for ${country}. In the first sentence, give a short answer whether this element should be used in the selected country.`;

            const fullPrompt = startPrompt + businessContext + endPrompt;

            if (fullPrompt.includes("No elements selected")) {
                scanDesignSpinner.style.display = "none";
                scanDesignContent.innerHTML = `<span style="color:orange;">Please select a design element on the canvas first.</span>`;
                return;
            }

            const response = await fetch("http://localhost:3000/analyze", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ prompt: fullPrompt })
            });

            const data = await response.json();
            scanDesignSpinner.style.display = "none";

            renderMarkdown(scanDesignContent, data.result, "<b>AI Response</b><br>");

            lastPromptContext = fullPrompt;
        } catch (error) {
            scanDesignSpinner.style.display = "none";
            scanDesignContent.innerHTML = `<span style="color:red;">Error: ${error.message}</span>`;
        }
    });

    resetDesignButton.addEventListener("click", () => {
        resetDesignPanel();
    });

    scanDesignButton.disabled = false;
    resetDesignButton.disabled = true;

    chatSend.addEventListener("click", async () => {
        const followUp = chatInput.value.trim();
        chatError.innerHTML = "";
        chatResponseContent.innerHTML = "";

        if (!followUp) {
            chatError.innerHTML = "Please enter a message before sending.";
            return;
        }

        if (!lastPromptContext) {
            chatError.innerHTML = "Please scan a design before asking follow-up questions.";
            return;
        }

        chatSpinner.style.display = "block";

        const fullFollowUpPrompt = `${lastPromptContext}\n\nThe user now asks: "${followUp}"`;
        console.log("fullFollowUpPrompt -> ", fullFollowUpPrompt);

        try {
            const response = await fetch("http://localhost:3000/analyze", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ prompt: fullFollowUpPrompt })
            });

            const data = await response.json();
            chatSpinner.style.display = "none";
            renderMarkdown(chatResponseContent, data.result, `<b>AI:</b><br>`);
            chatInput.value = "";
        } catch (err) {
            chatSpinner.style.display = "none";
            chatError.innerHTML = `Error: ${err.message}`;
        }
    });

    chatInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") chatSend.click();
    });

    analyzeImageButton.addEventListener("click", async () => {
        imageSpinner.style.display = "block";
        imageResultContent.innerHTML = "";
        imageError.style.display = "none";
        chatResponseContent.innerHTML = "";
        scanDesignContent.innerHTML = "No issues detected yet.";;
        resetImageButton.disabled = false;

        const file = imageUploadInput.files[0];

        if (!file) {
            imageSpinner.style.display = "none";
            imageError.innerHTML = `<span style="color:orange;">Please select an image file to upload.</span>`;
            imageError.style.display = "block";
            return;
        }

        const formData = new FormData();
        formData.append("image", file);

        try {
            const response = await fetch("http://localhost:3000/analyze-image", {
                method: "POST",
                body: formData
            });

            const data = await response.json();
            imageSpinner.style.display = "none";

            renderMarkdown(imageResultContent, data.result, "<b>AI Image Analysis</b><br>");

        } catch (err) {
            imageSpinner.style.display = "none";
            imageError.innerHTML = `<span style="color:red;">Error analyzing image: ${err.message}</span>`;
            imageError.style.display = "block";
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
});
