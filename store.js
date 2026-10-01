// ============================================================
// store.js — Cart logic shared across all pages
// Uses localStorage to persist the cart between page navigations
// ============================================================

const CART_KEY = 'myRestaurantCart';
const SHIPPING_COST = 50;

function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// --- Change an item's quantity (removes it when it reaches 0) ---
function changeQuantity(index, delta) {
    const cart = getCart();
    if (!cart[index]) return;
    cart[index].quantity += delta;
    if (cart[index].quantity <= 0) cart.splice(index, 1);
    saveCart(cart);
    renderCart();
}

// --- Show a non-blocking toast notification ---
function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    // If container doesn't exist, create and append it to the body
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast-message';
    if (type === 'error') {
        toast.classList.add('error');
    }
    toast.innerText = message;

    container.appendChild(toast);

    // Animate in
    setTimeout(() => {
        toast.classList.add('show');
    }, 10); // Small delay to allow CSS transition

    // Animate out and remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        // Remove the element from DOM after transition ends
        toast.addEventListener('transitionend', () => toast.remove());
    }, 3000);
}

// --- Retrieve the cart array from localStorage (or empty array if nothing saved yet) ---
function getCart() {
    try {
        const cart = JSON.parse(localStorage.getItem(CART_KEY));
        return Array.isArray(cart) ? cart : [];
    } catch (e) {
        return [];   // corrupted or unavailable storage: start with an empty cart
    }
}

// --- Save the cart array back to localStorage ---
function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    if (typeof updateCartBadge === 'function') updateCartBadge();
}

// ---------------------------------------------------------------
// updatePriceDisplay
//   Called when the size dropdown changes.
//   Works in two modes:
//     1. Single-product pages  → called as updatePriceDisplay()
//        Falls back to getElementById('size-select') / getElementById('price-display')
//     2. Multi-product pages   → called as updatePriceDisplay(this, 'price-display-N')
//        Uses the passed select element and target display ID directly
// ---------------------------------------------------------------
function updatePriceDisplay(selectEl, priceDisplayId) {
    // If no element was passed, fall back to the single-product-page IDs
    const sel     = selectEl     || document.getElementById('size-select');
    const display = priceDisplayId
        ? document.getElementById(priceDisplayId)
        : document.getElementById('price-display');

    if (sel && display) {
        const selectedOption = sel.options[sel.selectedIndex];
        const newPrice = selectedOption.getAttribute('data-price');
        display.innerText = `₱${Number(newPrice).toLocaleString()}`;
    }
}

// ---------------------------------------------------------------
// addCurrentProductToCart
//   Reads size + price from the dropdown and pushes an item into
//   the cart (or increments quantity if it already exists).
//
//   Single-product pages  → addCurrentProductToCart('Name', 'img.jpg')
//   Multi-product pages   → addCurrentProductToCart('Name', 'img.jpg',
//                               document.getElementById('size-select-N'))
// ---------------------------------------------------------------
function addCurrentProductToCart(productName, imageSrc, selectEl) {
    // Fall back to single-product-page ID if no element passed
    const sizeSelect = selectEl || document.getElementById('size-select');

    if (!sizeSelect) {
        showToast('Error: Size selector not found.', 'error');
        return;
    }

    const selectedOption = sizeSelect.options[sizeSelect.selectedIndex];
    const selectedPrice  = parseFloat(selectedOption.getAttribute('data-price'));
    const sizeLabel      = selectedOption.text;

    let cart = getCart();

    // If the same product+size already exists, just bump the quantity
    let existingItem = cart.find(
        item => item.name === productName && item.size === sizeLabel
    );

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            name:     productName,
            price:    selectedPrice,
            image:    imageSrc,
            size:     sizeLabel,
            quantity: 1
        });
    }

    saveCart(cart);
    showToast(`${productName} (${sizeLabel}) added to cart!`);
}

// --- Remove a single item from the cart by its array index ---
function removeFromCart(index) {
    let cart = getCart();
    cart.splice(index, 1);
    saveCart(cart);
    renderCart(); // Re-render the checkout page after removal
}

// --- Handle the final checkout confirmation ---
function processCheckout() {
    showToast('Thank you! Your order has been placed.');
    localStorage.removeItem(CART_KEY); // Clear the cart
    if (typeof updateCartBadge === 'function') updateCartBadge();

    // Redirect after a short delay to allow the user to see the toast
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1500);
}

// ---------------------------------------------------------------
// renderCart — builds the cart UI on checkout.html
//   Reads from localStorage and injects HTML into #cart-items-container
//   Also updates #cart-subtotal, #cart-total, and the checkout button
// ---------------------------------------------------------------
function renderCart() {
    const cartContainer = document.getElementById('cart-items-container');
    const subtotalEl    = document.getElementById('cart-subtotal');
    const totalEl       = document.getElementById('cart-total');
    const checkoutBtn   = document.getElementById('checkout-btn');

    // Only runs on pages that have the cart container (i.e. checkout.html)
    if (!cartContainer) return;

    let cart = getCart();
    cartContainer.innerHTML = '';
    let subtotal = 0;
    const shippingCost = SHIPPING_COST;
    const shippingEl  = document.getElementById('cart-shipping');
    if (shippingEl) shippingEl.innerText = `₱${shippingCost.toFixed(2)}`;

    // Show empty state
    if (cart.length === 0) {
        cartContainer.innerHTML = '<div class="alert alert-warning">Your cart is empty.</div>';
        if (checkoutBtn) checkoutBtn.disabled = true;
        if (subtotalEl)  subtotalEl.innerText  = '₱0.00';
        if (totalEl)     totalEl.innerText      = '₱0.00';
        return;
    }

    if (checkoutBtn) checkoutBtn.disabled = false;

    // Build a card for each cart item (built once, then inserted)
    cartContainer.innerHTML = cart.map((item, index) => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        const name = escapeHtml(item.name);
        return `
        <div class="cart-item d-flex justify-content-between align-items-center mb-3 border-bottom pb-3">
            <div class="d-flex align-items-center">
                <img src="${escapeHtml(item.image)}" alt="${name}" class="product-img me-3"
                     style="width:60px; height:60px; object-fit:cover; border-radius:5px;">
                <div>
                    <h6 class="mb-0 fw-bold">${name}</h6>
                    <small class="badge bg-secondary">${escapeHtml(item.size)}</small><br>
                    <small class="text-muted">₱${item.price.toLocaleString()} each</small>
                </div>
            </div>
            <div class="text-end">
                <span class="d-block fw-bold">₱${itemTotal.toLocaleString()}</span>
                <div class="btn-group btn-group-sm mt-1" role="group" aria-label="Quantity for ${name}">
                    <button class="btn btn-outline-secondary" onclick="changeQuantity(${index}, -1)" aria-label="Decrease quantity">&minus;</button>
                    <span class="btn btn-outline-secondary disabled">${item.quantity}</span>
                    <button class="btn btn-outline-secondary" onclick="changeQuantity(${index}, 1)" aria-label="Increase quantity">+</button>
                </div>
                <button class="btn btn-sm btn-outline-danger mt-1 ms-1" onclick="removeFromCart(${index})" aria-label="Remove ${name}">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        </div>`;
    }).join('');

    if (subtotalEl) subtotalEl.innerText = `₱${subtotal.toLocaleString()}`;
    if (totalEl)    totalEl.innerText    = `₱${(subtotal + shippingCost).toLocaleString()}`;
}

// --- Auto-render the cart as soon as the page finishes loading ---
document.addEventListener('DOMContentLoaded', () => {
    renderCart();

    // --- Checkout Modal Logic (only on checkout.html) ---
    const confirmModalEl = document.getElementById('confirmCheckoutModal');
    if (confirmModalEl) {
        const confirmOrderBtn = document.getElementById('confirm-order-btn');
        const checkoutModal = new bootstrap.Modal(confirmModalEl);

        if (confirmOrderBtn) {
            confirmOrderBtn.addEventListener('click', () => {
                // The actual checkout logic is now just called from here
                processCheckout();
                // Manually hide the modal after confirming
                checkoutModal.hide();
            });
        }
    }
});
