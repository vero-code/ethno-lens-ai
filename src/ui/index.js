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
            const response = await fetch("http://localhost:3000/analyze", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    prompt: "Watches in China" // TODO: add dynamically
                })
            });

            const data = await response.json();

            resultBox.innerHTML = `<b>Gemini says:</b><br>${data.result}`;
        } catch (error) {
            resultBox.innerHTML = `<span style="color:red;">Error: ${error.message}</span>`;
        }
    });

    createRectangleButton.disabled = false;
    addTextButton.disabled = false;
    scanDesignButton.disabled = false;
});
