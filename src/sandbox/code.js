import addOnSandboxSdk from "add-on-sdk-document-sandbox";
import { editor } from "express-document-sdk";

const { runtime } = addOnSandboxSdk.instance;

function start() {
    const sandboxApi = {
        createRectangle: () => {
            const rectangle = editor.createRectangle();
            rectangle.width = 240;
            rectangle.height = 180;
            rectangle.translation = { x: 10, y: 10 };
            const color = { red: 0.32, green: 0.34, blue: 0.89, alpha: 1 };
            const rectangleFill = editor.makeColorFill(color);
            rectangle.fill = rectangleFill;
            const insertionParent = editor.context.insertionParent;
            insertionParent.children.append(rectangle);
        },
        addText: () => {
            const textNode = editor.createText("Hello,\nWorld!");
            const insertionParent = editor.context.insertionParent;
            textNode.setPositionInParent(
                { x: insertionParent.width / 2, y: insertionParent.height / 2 },
                { x: 0, y: 0 }
            );
            insertionParent.children.append(textNode);
            console.log("Text: ", textNode.fullContent.text);
        },
        scanDesign: () => {
            return `
                <div style="font-family: sans-serif;">
                    <b>1 potential issue found:</b><br/>
                    ⚠️ Use of yellow background may be interpreted as a mourning color in Vietnam.<br/>
                    <i>Suggestion:</i> Replace with warm beige or soft green.
                </div>
            `;
        }
    };

    runtime.exposeApi(sandboxApi);
}

start();
