// src/ui/tabs.js

const tabButtons = document.querySelectorAll('.tab-button');
const tabPanels = document.querySelectorAll('[role="tabpanel"]');
const selectionIndicator = document.getElementById('selectionIndicator');

function setSelectionIndicatorPosition(activeTab) {
    if (activeTab && selectionIndicator) {
        const tabRect = activeTab.getBoundingClientRect();
        const spanRect = activeTab.querySelector('span').getBoundingClientRect();

        const width = spanRect.width;
        const offset = spanRect.left - tabRect.left;

        selectionIndicator.style.width = `${width}px`;
        selectionIndicator.style.transform = `translateX(${offset}px)`;

        activeTab.appendChild(selectionIndicator);
    }
}

export function initializeTabs() {
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetPanelId = button.getAttribute('aria-controls');

            tabButtons.forEach(btn => {
                btn.classList.remove('active');
                btn.setAttribute('aria-selected', 'false');
            });
            tabPanels.forEach(panel => {
                panel.setAttribute('hidden', '');
            });

            button.classList.add('active');
            button.setAttribute('aria-selected', 'true');
            document.getElementById(targetPanelId).removeAttribute('hidden');

            setSelectionIndicatorPosition(button);
        });
    });

    const initialActiveTab = document.querySelector('.tab-button.active');
    if (initialActiveTab) {
        setSelectionIndicatorPosition(initialActiveTab);
    }
}