// src/ui/index.js
import addOnUISdk from "https://new.express.adobe.com/static/add-on-sdk/sdk.js";

addOnUISdk.ready.then(async () => {
    console.log("addOnUISdk is ready for use.");

    const { runtime } = addOnUISdk.instance;

    const sandboxProxy = await runtime.apiProxy("documentSandbox");

    const scanDesignButton = document.getElementById("scanDesign");
    const resultBox = document.getElementById("resultBox");
    const spinner = document.getElementById("spinner");
    scanDesignButton.addEventListener("click", async event => {
        spinner.style.display = "block";
        resultBox.innerHTML = "";

        try {
            const description = await sandboxProxy.getDesignDescription();
            const country = document.getElementById("countrySelect").value;
            const businessType = document.getElementById("businessType").value;

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

            const fullPrompt = startPrompt + endPrompt + businessContext;

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
        } catch (error) {
            spinner.style.display = "none";
            resultBox.innerHTML = `<span style="color:red;">Error: ${error.message}</span>`;
        }
    });

    scanDesignButton.disabled = false;
});
