// src/ui/tabs.js

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

export function initializeTabs() {
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