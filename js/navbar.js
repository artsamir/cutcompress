function toggleMenu() {
    const navLinks = document.getElementById('nav-links');
    const overlay = document.getElementById('overlay');
    navLinks.classList.toggle('active');
    overlay.style.display = navLinks.classList.contains('active') ? 'block' : 'none';
}

document.addEventListener('DOMContentLoaded', () => {
    const hasSubmenuItems = document.querySelectorAll('.has-submenu');
    hasSubmenuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                item.classList.toggle('active');
            }
        });
    });

    const searchIcon = document.getElementById('search-icon');
    const searchBox = document.getElementById('search-box');
    searchIcon.addEventListener('click', () => {
        if (searchBox.value.trim()) {
            alert(`Searching for: ${searchBox.value}`);
        }
    });
});