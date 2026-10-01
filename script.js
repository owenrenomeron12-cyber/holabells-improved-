

const body       = document.querySelector('body');
const sidebar    = body.querySelector('nav');
const toggle     = body.querySelector('.toggle');
const modeSwitch = body.querySelector('.toggle-switch');
const modeText   = body.querySelector('.mode-text');

// --- Sidebar: toggle open / collapsed state on arrow click ---
if (toggle) {
    toggle.addEventListener('click', () => {
        sidebar.classList.toggle('close');
    });
}

// ---------------------------------------------------------------
// Dark Mode — persisted via localStorage so it survives page navigation
//
// On every page load:
//   1. Check localStorage for a saved preference
//   2. If 'dark' was saved, apply the dark class immediately
//   3. Update the toggle label to match
//
// When the user clicks the toggle:
//   1. Flip the dark class on <body>
//   2. Save the new preference to localStorage
//   3. Update the label text
// ---------------------------------------------------------------

if (localStorage.getItem('darkMode') === 'enabled') {
    body.classList.add('dark');
}

if (modeText) {
    modeText.innerText = body.classList.contains('dark') ? 'Light Mode' : 'Dark Mode';
}


if (modeSwitch) {
    modeSwitch.addEventListener('click', () => {
        body.classList.toggle('dark');

        if (body.classList.contains('dark')) {
            localStorage.setItem('darkMode', 'enabled');  
            modeText.innerText = 'Light Mode';
        } else {
            localStorage.setItem('darkMode', 'disabled'); 
            modeText.innerText = 'Dark Mode';
        }
    });
}


function changeImage(event, src) {
    const mainImage = document.getElementById('mainImage');
    if (mainImage) {
        mainImage.src = src;
        document.querySelectorAll('.thumbnail').forEach(thumb => {
            thumb.classList.remove('active');
        });
        event.target.classList.add('active');
    }
}

// --- Homepage Carousels with Hover-to-Slide ---
document.addEventListener('DOMContentLoaded', () => {
    // Find all carousels with the .meal-carousel class
    const mealCarouselElements = document.querySelectorAll('.meal-carousel');

    // Initialize each one
    mealCarouselElements.forEach(carouselElement => {
        const mealCarousel = bootstrap.Carousel.getOrCreateInstance(carouselElement);

        const indicators = carouselElement.querySelectorAll('.carousel-indicators button');

        // When the mouse enters an indicator, go to that slide
        indicators.forEach((indicator, index) => {
            indicator.addEventListener('mouseenter', () => {
                mealCarousel.to(index); // Go to the slide on hover
            });
        });
    });
});

// --- Keyboard access for the sidebar arrow and dark-mode switch ---
[[toggle, 'Toggle sidebar'], [modeSwitch, 'Toggle dark mode']].forEach(([el, label]) => {
    if (!el) return;
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.setAttribute('aria-label', label);
    el.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); }
    });
});

// --- Footer year ---
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();


// --- Top bar: highlight current page + live cart count ---
function updateCartBadge() {
    const el = document.getElementById('cart-count');
    if (!el) return;
    let n = 0;
    try { n = (JSON.parse(localStorage.getItem('myRestaurantCart')) || []).reduce((t, i) => t + i.quantity, 0); } catch (e) {}
    el.textContent = n;
}
updateCartBadge();
(function () {
    const page = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.topbar .nav-link').forEach(a => {
        if (a.getAttribute('href') === page) a.classList.add('active');
    });
})();
