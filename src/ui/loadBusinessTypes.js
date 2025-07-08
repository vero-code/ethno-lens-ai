const businessSelect = document.getElementById("businessType");

const businessTypes = [
    "Cosmetics",
    "Funeral",
    "Fashion",
    "Technology",
    "Food & Beverage",
    "Finance & Banking",
    "Healthcare",
    "Education",
    "Travel & Tourism",
    "Automotive",
    "Real Estate",
    "Entertainment",
    "Sports & Fitness",
    "Home & Interior",
    "Childcare & Parenting",
    "Non-profit / Charity",
    "Military & Defense",
    "Construction",
    "Agriculture",
    "Legal / Law",
    "Energy / Utilities",
    "Logistics / Delivery",
    "Religious / Spiritual",
    "Luxury / Premium Goods",
    "Environmental / Sustainability"
];

businessSelect.innerHTML = `<option value="">-- Select business type --</option>`;

businessTypes.forEach(type => {
    const option = document.createElement("option");
    option.value = type.toLowerCase().replace(/[^a-z0-9]/g, "-");
    option.textContent = type;
    businessSelect.appendChild(option);
});
