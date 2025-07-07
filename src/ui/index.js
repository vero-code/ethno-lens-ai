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
        const resultHtml = await sandboxProxy.scanDesign();
        resultBox.innerHTML = resultHtml;
    });

    createRectangleButton.disabled = false;
    addTextButton.disabled = false;
    scanDesignButton.disabled = false;
});
