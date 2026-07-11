const BASE_URL = 'https://damayanistore22-production.up.railway.app/api';

// DOM Elements
const loginOverlay = document.getElementById('login-overlay');
const loginBtn = document.getElementById('login-btn');
const adminMain = document.getElementById('admin-main');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const adminProductsList = document.getElementById('admin-products-list');
const adminOrdersList = document.getElementById('admin-orders-list');
const productForm = document.getElementById('product-form');

// Admin Auth
loginBtn.addEventListener('click', () => {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;
    if (email === 'admin@admin.com' && pass === 'password123') {
        loginOverlay.classList.add('hidden');
        adminMain.classList.remove('hidden');
        initAdmin();
    } else {
        document.getElementById('login-error').style.display = 'block';
    }
});

// Tabs
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.add('hidden'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.target).classList.remove('hidden');
    });
});

// Initialize Admin
function initAdmin() {
    fetchAdminProducts();
    fetchOrders();
}

// Products CRUD
async function fetchAdminProducts() {
    try {
        const res = await fetch(`${BASE_URL}/products`);
        const products = await res.json();
        renderAdminProducts(products);
    } catch (e) {
        console.error(e);
        adminProductsList.innerHTML = '<tr><td colspan="5" style="color:red">Failed to load</td></tr>';
    }
}

function renderAdminProducts(products) {
    if (!products.length) {
        adminProductsList.innerHTML = '<tr><td colspan="5">No products found.</td></tr>';
        return;
    }
    adminProductsList.innerHTML = products.map(p => `
        <tr>
            <td>${p.id}</td>
            <td>${p.name}</td>
            <td>Rp ${Number(p.price).toLocaleString('id-ID')}</td>
            <td>${p.stock}</td>
            <td>
                <button class="action-btn edit-btn" onclick="editProduct(${p.id}, '${p.name}', '${p.description}', ${p.price}, ${p.stock}, '${p.image_url}')">Edit</button>
                <button class="action-btn delete-btn" onclick="deleteProduct(${p.id})">Delete</button>
            </td>
        </tr>
    `).join('');
}

// Handle Form Submit (Create/Update)
productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('prod-id').value;
    const name = document.getElementById('prod-name').value;
    const desc = document.getElementById('prod-desc').value;
    const price = document.getElementById('prod-price').value;
    const stock = document.getElementById('prod-stock').value;
    const img = document.getElementById('prod-img').value || 'https://via.placeholder.com/150';

    const payload = { name, description: desc, price, stock, image_url: img };
    const method = id ? 'PUT' : 'POST';
    const url = id ? `${BASE_URL}/products/${id}` : `${BASE_URL}/products`;

    try {
        await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        resetForm();
        fetchAdminProducts();
        alert(id ? 'Product updated' : 'Product added');
    } catch (err) {
        alert('Failed to save product');
        console.error(err);
    }
});

// Edit Product
window.editProduct = (id, name, desc, price, stock, img) => {
    document.getElementById('prod-id').value = id;
    document.getElementById('prod-name').value = name;
    document.getElementById('prod-desc').value = desc;
    document.getElementById('prod-price').value = price;
    document.getElementById('prod-stock').value = stock;
    document.getElementById('prod-img').value = img;
    
    document.getElementById('save-prod-btn').innerText = 'Update Product';
    document.getElementById('cancel-edit-btn').classList.remove('hidden');
    window.scrollTo(0, 0);
};

// Cancel Edit
document.getElementById('cancel-edit-btn').addEventListener('click', resetForm);

function resetForm() {
    productForm.reset();
    document.getElementById('prod-id').value = '';
    document.getElementById('save-prod-btn').innerText = 'Add Product';
    document.getElementById('cancel-edit-btn').classList.add('hidden');
}

// Delete Product
window.deleteProduct = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
        await fetch(`${BASE_URL}/products/${id}`, { method: 'DELETE' });
        fetchAdminProducts();
    } catch (err) {
        alert('Failed to delete product');
        console.error(err);
    }
};

// Fetch Orders
async function fetchOrders() {
    try {
        const res = await fetch(`${BASE_URL}/orders`);
        const orders = await res.json();
        renderOrders(orders);
    } catch (e) {
        console.error(e);
        adminOrdersList.innerHTML = '<tr><td colspan="6" style="color:red">Failed to load</td></tr>';
    }
}

function renderOrders(orders) {
    if (!orders.length) {
        adminOrdersList.innerHTML = '<tr><td colspan="6">No orders found.</td></tr>';
        return;
    }
    adminOrdersList.innerHTML = orders.map(o => `
        <tr>
            <td>#${o.id}</td>
            <td>${o.customer_name}</td>
            <td>${o.customer_phone}</td>
            <td>Rp ${Number(o.total_amount).toLocaleString('id-ID')}</td>
            <td>${new Date(o.created_at).toLocaleString()}</td>
            <td>
                <ul>
                    ${(o.items || []).map(i => `<li>${i.name} (x${i.quantity})</li>`).join('')}
                </ul>
            </td>
        </tr>
    `).join('');
}
