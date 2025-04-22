document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll(".category li").forEach(item => {
        item.addEventListener("click", () => {
            // Extract text content without the icon
            const text = item.childNodes[2].textContent.trim(); // Skip <i> and whitespace
            if (text === 'Edit') {
                window.location.href = 'pdf-edit.html';
            } else {
                alert(`You clicked on "${text}"`);
            }
        });
    });
});