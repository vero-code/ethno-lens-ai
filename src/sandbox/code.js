// src/sandbox/code.js
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
        getDesignDescription: () => {
            if (!editor.context.hasSelection || editor.context.selection.length === 0) {
                return "No elements selected on the canvas.";
            }

            const selectedNode = editor.context.selection[0];
            const type = selectedNode?.type;
            const lowerCaseType = selectedNode?.type?.toLowerCase();
            let description = `${lowerCaseType}`;

            if(type === "Text") {
                const content = selectedNode.fullContent?.text || "(empty)";
                description += ` content: "${content}"`;
            } else if (type === "MediaContainer") {
                description += "It is an image or media element.";
            } else {
                // for shapes
                const fill = selectedNode.fill;
                if (fill && fill.color) {
                    const { red, green, blue } = fill.color;
                    const r = Math.round(red * 255);
                    const g = Math.round(green * 255);
                    const b = Math.round(blue * 255);
                    description += ` with color RGB(${r}, ${g}, ${b})`;
                } else {
                    description += " with no fill color";
                }
            }

            return description;
        },
    };

    runtime.exposeApi(sandboxApi);
}

start();
