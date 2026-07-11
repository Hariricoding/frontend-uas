const BASE_URL = 'http://localhost:5000/api'; // Change to Railway URL after deployment

let products = [];
let cart = [];

// DOM Elements
const productsGrid = document.getElementById('products-grid');
const cartBtn = document.getElementById('cart-btn');
const cartCount = document.getElementById('cart-count');
const cartModal = document.getElementById('cart-modal');
const closeModal = document.getElementById('close-modal');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotalPrice = document.getElementById('cart-total-price');
const checkoutBtn = document.getElementById('checkout-btn');

// Initialize
async function init() {
    await fetchProducts();
    renderProducts();
    loadCart();
}

async function fetchProducts() {
    try {
        const response = await fetch(`${BASE_URL}/products`);
        products = await response.json();
    } catch (error) {
        console.error('Error fetching products:', error);
        productsGrid.innerHTML = '<p style="color:red;">Failed to load products. Is the backend running?</p>';
    }
}

function renderProducts() {
    if (!products.length) {
        productsGrid.innerHTML = '<p>No products available.</p>';
        return;
    }

    productsGrid.innerHTML = products.map(product => `
        <div class="product-card">
            <img src="${product.image_url}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/150'">
            <h3>${product.name}</h3>
            <p>${product.description}</p>
            <p class="price">Rp ${Number(product.price).toLocaleString('id-ID')}</p>
            <p style="color: ${product.stock > 0 ? 'green' : 'red'}; font-size: 0.9rem; margin-bottom: 1rem;">
                ${product.stock > 0 ? `Stock: ${product.stock}` : 'Out of Stock'}
            </p>
            <button class="btn-primary add-to-cart" onclick="addToCart(${product.id})" ${product.stock === 0 ? 'disabled' : ''}>
                ${product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
        </div>
    `).join('');
}

// Cart Logic
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = cart.find(item => item.product_id === productId);
    if (existingItem) {
        if (existingItem.quantity < product.stock) {
            existingItem.quantity += 1;
        } else {
            alert('Cannot add more than available stock.');
            return;
        }
    } else {
        cart.push({
            product_id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1
        });
    }

    saveCart();
    renderCart();
    cartModal.classList.remove('hidden');
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.product_id !== productId);
    saveCart();
    renderCart();
}

function saveCart() {
    localStorage.setItem('uas_cart', JSON.stringify(cart));
    cartCount.innerText = cart.reduce((total, item) => total + item.quantity, 0);
}

function loadCart() {
    const saved = localStorage.getItem('uas_cart');
    if (saved) {
        cart = JSON.parse(saved);
        cartCount.innerText = cart.reduce((total, item) => total + item.quantity, 0);
    }
}

function renderCart() {
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p>Your cart is empty.</p>';
        cartTotalPrice.innerText = '0';
        return;
    }

    let total = 0;
    cartItemsContainer.innerHTML = cart.map(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        return `
            <div class="cart-item">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p>Rp ${Number(item.price).toLocaleString('id-ID')} x ${item.quantity}</p>
                </div>
                <div style="display:flex; align-items:center; gap: 1rem;">
                    <strong>Rp ${Number(itemTotal).toLocaleString('id-ID')}</strong>
                    <button class="btn-secondary" style="padding: 0.2rem 0.5rem;" onclick="removeFromCart(${item.product_id})">X</button>
                </div>
            </div>
        `;
    }).join('');

    cartTotalPrice.innerText = Number(total).toLocaleString('id-ID');
}

// Event Listeners
cartBtn.addEventListener('click', () => {
    renderCart();
    cartModal.classList.remove('hidden');
});

closeModal.addEventListener('click', () => {
    cartModal.classList.add('hidden');
});

checkoutBtn.addEventListener('click', async () => {
    if (cart.length === 0) return alert('Cart is empty!');
    
    const custName = document.getElementById('cust-name').value;
    const custPhone = document.getElementById('cust-phone').value;

    if (!custName || !custPhone) return alert('Please fill in checkout details.');

    try {
        const response = await fetch(`${BASE_URL}/checkout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customer_name: custName,
                customer_phone: custPhone,
                items: cart
            })
        });

        const result = await response.json();
        
        if (response.ok) {
            alert('Order placed successfully! Redirecting to WhatsApp...');
            localStorage.removeItem('uas_cart');
            cart = [];
            saveCart();
            cartModal.classList.add('hidden');
            window.location.href = result.waLink;
        } else {
            alert(result.error || 'Checkout failed');
        }
    } catch (error) {
        console.error('Checkout error:', error);
        alert('An error occurred during checkout.');
    }
});

// Run
init();
