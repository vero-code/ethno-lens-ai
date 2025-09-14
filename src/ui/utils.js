// src/ui/utils.js

export const renderMarkdown = (targetElement, markdownText, prefix = "") => {
    targetElement.innerHTML = "";
    if (markdownText && typeof markdownText === 'string' && markdownText.trim() !== '') {
        targetElement.innerHTML = prefix + marked.parse(markdownText);
    } else {
        targetElement.innerHTML = prefix + `<span style="color:gray;">AI returned an empty or invalid response.</span>`;
        console.warn("Attempted to render empty or invalid Markdown:", markdownText);
    }
};

export const enableResetOnInput = (button) => {
    button.disabled = false;
};

export function handleBusinessTypeChange(selectElement, inputElement) {
  if (selectElement.value === "Other...") {
    inputElement.style.display = "block";
  } else {
    inputElement.style.display = "none";
  }
}