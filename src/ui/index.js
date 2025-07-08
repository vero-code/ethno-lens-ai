// src/ui/index.js
import addOnUISdk from "https://new.express.adobe.com/static/add-on-sdk/sdk.js";

addOnUISdk.ready.then(async () => {
    console.log("addOnUISdk is ready for use.");

    const { runtime } = addOnUISdk.instance;

    const sandboxProxy = await runtime.apiProxy("documentSandbox");

    const createRectangleButton = document.getElementById("createRectangle");
    createRectangleButton.addEventListener("click", async event => {
        await sandboxProxy.createRectangle();
    });

    const addTextButton = document.getElementById("addText");
    addTextButton.addEventListener("click", async event => {
        await sandboxProxy.addText();
    });

    const scanDesignButton = document.getElementById("scanDesign");
    const resultBox = document.getElementById("resultBox");
    scanDesignButton.addEventListener("click", async event => {
        try {
            const description = await sandboxProxy.getDesignDescription();
            const country = document.getElementById("countrySelect").value;

            const startPrompt = `Analyze the provided visual design. The design includes ${description} and is intended for ${country}.`;
            const endPrompt = ` Identify any culturally insensitive or inappropriate elements and suggest changes to promote inclusive visual solutions that are suitable for a diverse international audience, with a focus on cultural appropriateness for ${country}. In the first sentence, give a short answer whether this element should be used in the selected country.`;

            const fullPrompt = startPrompt + endPrompt;

            if (fullPrompt.includes("No elements selected")) {
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

            resultBox.innerHTML = `<b>AI Response</b><br>${marked.parse(data.result)}`;
        } catch (error) {
            resultBox.innerHTML = `<span style="color:red;">Error: ${error.message}</span>`;
        }
    });

    createRectangleButton.disabled = false;
    addTextButton.disabled = false;
    scanDesignButton.disabled = false;
});
