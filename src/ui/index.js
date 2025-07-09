// src/ui/index.js
import addOnUISdk from "https://new.express.adobe.com/static/add-on-sdk/sdk.js";

addOnUISdk.ready.then(async () => {
    console.log("addOnUISdk is ready for use.");
    const { runtime } = addOnUISdk.instance;
    const sandboxProxy = await runtime.apiProxy("documentSandbox");

    const scanDesignButton = document.getElementById("scanDesign");
    const resultBox = document.getElementById("resultBox");
    const spinner = document.getElementById("spinner");
    const countrySelect = document.getElementById("countrySelect");
    const businessSelect = document.getElementById("businessType");

    const chatInput = document.getElementById("chatInput");
    const chatSend = document.getElementById("chatSend");
    const chatResponse = document.getElementById("chatResponse");
    const chatError = document.getElementById("chatError");

    let lastPromptContext = "";

    scanDesignButton.addEventListener("click", async event => {
        spinner.style.display = "block";
        resultBox.innerHTML = "";
        chatResponse.innerHTML = "";

        try {
            const description = await sandboxProxy.getDesignDescription();
            const country = countrySelect.value;
            const businessType = businessSelect.value;

            if (!country) {
                spinner.style.display = "none";
                resultBox.innerHTML = `<span style="color:orange;">Please select a country before scanning.</span>`;
                return;
            }

            if (!businessType) {
                spinner.style.display = "none";
                resultBox.innerHTML = `<span style="color:orange;">Please select a business type before scanning.</span>`;
                return;
            }

            const startPrompt = `Analyze the provided visual design. The design includes ${description} and is intended for ${country}.`;
            const businessContext = ` The business type is "${businessType}".`;
            const endPrompt = ` Identify any culturally insensitive or inappropriate elements and suggest changes to promote inclusive visual solutions that are suitable for a diverse international audience, with a focus on cultural appropriateness for ${country}. In the first sentence, give a short answer whether this element should be used in the selected country.`;

            const fullPrompt = startPrompt + businessContext + endPrompt;

            if (fullPrompt.includes("No elements selected")) {
                spinner.style.display = "none";
                resultBox.innerHTML = `<span style="color:orange;">Please select a design element on the canvas first.</span>`;
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
            spinner.style.display = "none";
            resultBox.innerHTML = `<b>AI Response</b><br>${marked.parse(data.result)}`;

            lastPromptContext = fullPrompt;
        } catch (error) {
            spinner.style.display = "none";
            resultBox.innerHTML = `<span style="color:red;">Error: ${error.message}</span>`;
        }
    });

    chatSend.addEventListener("click", async () => {
        const followUp = chatInput.value.trim();
        chatError.innerHTML = "";
        chatResponse.innerHTML = "";

        if (!followUp) {
            chatError.innerHTML = "Please enter a message before sending.";
            return;
        }

        if (!lastPromptContext) {
            chatError.innerHTML = "Please scan a design before asking follow-up questions.";
            return;
        }

        chatResponse.innerHTML = "Thinking...";
        spinner.style.display = "block";

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
            spinner.style.display = "none";
            chatResponse.innerHTML = `<b>AI:</b><br>${marked.parse(data.result)}`;
            chatInput.value = "";
        } catch (err) {
            spinner.style.display = "none";
            chatError.innerHTML = `Error: ${err.message}`;
        }
    });

    scanDesignButton.disabled = false;
});
