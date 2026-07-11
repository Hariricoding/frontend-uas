const BASE_URL = 'https://uas-backend-production-7efa.up.railway.app/api';

// DOM Elements
const loginOverlay = document.getElementById('login-overlay');
const loginBtn = document.getElementById('login-btn');
const adminMain = document.getElementById('admin-main');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const adminProductsList = document.getElementById('admin-products-list');
const adminOrdersList = document.getElementById('admin-orders-list');
const productForm = document.getElementById('product-form');

// ─── Admin Auth ───────────────────────────────────────────────
loginBtn.addEventListener('click', () => {
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-pass').value.trim();
    if (email === 'admin@admin.com' && pass === 'password123') {
        loginOverlay.classList.add('hidden');
        adminMain.classList.remove('hidden');
        initAdmin();
    } else {
        document.getElementById('login-error').style.display = 'block';
    }
});

// ─── Tabs ─────────────────────────────────────────────────────
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.add('hidden'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.target).classList.remove('hidden');
    });
});

// ─── Init ─────────────────────────────────────────────────────
function initAdmin() {
    fetchAdminProducts();
    fetchOrders();
}

// ─── Products CRUD ────────────────────────────────────────────
async function fetchAdminProducts() {
    adminProductsList.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:1rem;">Memuat produk...</td></tr>';
    try {
        const res = await fetch(`${BASE_URL}/products`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const products = await res.json();
        renderAdminProducts(products);
    } catch (e) {
        console.error('fetchAdminProducts error:', e);
        adminProductsList.innerHTML = `<tr><td colspan="6" style="color:red; text-align:center; padding:1rem;">Gagal memuat produk: ${e.message}</td></tr>`;
    }
}

function renderAdminProducts(products) {
    if (!Array.isArray(products) || products.length === 0) {
        adminProductsList.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:1rem;">Belum ada produk.</td></tr>';
        return;
    }
    adminProductsList.innerHTML = products.map(p => `
        <tr>
            <td>${p.id}</td>
            <td>
                ${p.image_url ? `<img src="${p.image_url}" alt="${p.name}" style="width:50px;height:50px;object-fit:cover;border-radius:6px;" onerror="this.src='https://via.placeholder.com/50'">` : '—'}
            </td>
            <td>${p.name}</td>
            <td>Rp ${Number(p.price).toLocaleString('id-ID')}</td>
            <td>${p.stock}</td>
            <td>
                <button class="action-btn edit-btn" onclick="editProduct(${p.id}, \`${escapeStr(p.name)}\`, \`${escapeStr(p.description)}\`, ${p.price}, ${p.stock}, \`${p.image_url || ''}\`)">Edit</button>
                <button class="action-btn delete-btn" onclick="deleteProduct(${p.id})">Delete</button>
            </td>
        </tr>
    `).join('');
}

function escapeStr(str) {
    if (!str) return '';
    return String(str).replace(/`/g, "'").replace(/\\/g, '\\\\');
}

// ─── Form Submit (Create / Update) ───────────────────────────
productForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const saveBtn = document.getElementById('save-prod-btn');
    const id = document.getElementById('prod-id').value;
    const name = document.getElementById('prod-name').value.trim();
    const desc = document.getElementById('prod-desc').value.trim();
    const price = document.getElementById('prod-price').value;
    const stock = document.getElementById('prod-stock').value;
    const fileInput = document.getElementById('prod-img');
    const oldImg = document.getElementById('prod-old-img').value;

    if (!name || !price || !stock) {
        showMsg('Nama, Harga, dan Stok wajib diisi!', 'error');
        return;
    }

    saveBtn.disabled = true;
    saveBtn.innerText = 'Menyimpan...';

    const doSave = async (image_url) => {
        const payload = { name, description: desc, price: Number(price), stock: Number(stock), image_url };
        const method = id ? 'PUT' : 'POST';
        const url = id ? `${BASE_URL}/products/${id}` : `${BASE_URL}/products`;

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || data.message || `HTTP ${res.status}`);
            }

            resetForm();
            await fetchAdminProducts();
            showMsg(id ? '✅ Produk berhasil diupdate!' : '✅ Produk berhasil ditambahkan!', 'success');
        } catch (err) {
            console.error('Save product error:', err);
            showMsg(`❌ Gagal menyimpan: ${err.message}`, 'error');
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerText = id ? 'Update Produk' : 'Tambah Produk';
        }
    };

    if (fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = (ev) => doSave(ev.target.result);
        reader.onerror = () => {
            showMsg('❌ Gagal membaca file gambar.', 'error');
            saveBtn.disabled = false;
            saveBtn.innerText = id ? 'Update Produk' : 'Tambah Produk';
        };
        reader.readAsDataURL(fileInput.files[0]);
    } else {
        doSave(oldImg || 'https://via.placeholder.com/300x300?text=No+Image');
    }
});

// ─── Edit ─────────────────────────────────────────────────────
window.editProduct = (id, name, desc, price, stock, img) => {
    document.getElementById('prod-id').value = id;
    document.getElementById('prod-name').value = name;
    document.getElementById('prod-desc').value = desc;
    document.getElementById('prod-price').value = price;
    document.getElementById('prod-stock').value = stock;
    document.getElementById('prod-old-img').value = img;
    document.getElementById('prod-img').value = '';

    document.getElementById('save-prod-btn').innerText = 'Update Produk';
    document.getElementById('cancel-edit-btn').classList.remove('hidden');

    // Show image preview
    const preview = document.getElementById('img-preview');
    if (preview && img) {
        preview.src = img;
        preview.style.display = 'block';
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ─── Cancel Edit ──────────────────────────────────────────────
document.getElementById('cancel-edit-btn').addEventListener('click', resetForm);

function resetForm() {
    productForm.reset();
    document.getElementById('prod-id').value = '';
    document.getElementById('prod-old-img').value = '';
    document.getElementById('save-prod-btn').innerText = 'Tambah Produk';
    document.getElementById('cancel-edit-btn').classList.add('hidden');

    const preview = document.getElementById('img-preview');
    if (preview) preview.style.display = 'none';
}

// ─── Delete ───────────────────────────────────────────────────
window.deleteProduct = async (id) => {
    if (!confirm('Yakin mau hapus produk ini?')) return;
    try {
        const res = await fetch(`${BASE_URL}/products/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        await fetchAdminProducts();
        showMsg('✅ Produk berhasil dihapus!', 'success');
    } catch (err) {
        showMsg(`❌ Gagal menghapus: ${err.message}`, 'error');
    }
};

// ─── Image Preview ────────────────────────────────────────────
document.getElementById('prod-img').addEventListener('change', (e) => {
    const file = e.target.files[0];
    const preview = document.getElementById('img-preview');
    if (file && preview) {
        const reader = new FileReader();
        reader.onload = (ev) => {
            preview.src = ev.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
});

// ─── Orders ───────────────────────────────────────────────────
async function fetchOrders() {
    adminOrdersList.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:1rem;">Memuat pesanan...</td></tr>';
    try {
        const res = await fetch(`${BASE_URL}/orders`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const orders = await res.json();
        renderOrders(orders);
    } catch (e) {
        console.error('fetchOrders error:', e);
        adminOrdersList.innerHTML = `<tr><td colspan="6" style="color:red; text-align:center;">Gagal memuat pesanan: ${e.message}</td></tr>`;
    }
}

function renderOrders(orders) {
    if (!Array.isArray(orders) || orders.length === 0) {
        adminOrdersList.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:1rem;">Belum ada pesanan.</td></tr>';
        return;
    }
    adminOrdersList.innerHTML = orders.map(o => `
        <tr>
            <td>#${o.id}</td>
            <td>${o.customer_name}</td>
            <td>${o.customer_phone}</td>
            <td>Rp ${Number(o.total_amount).toLocaleString('id-ID')}</td>
            <td>${new Date(o.created_at).toLocaleString('id-ID')}</td>
            <td><ul style="margin:0; padding-left:1rem;">${(o.items || []).map(i => `<li>${i.name} (x${i.quantity})</li>`).join('')}</ul></td>
        </tr>
    `).join('');
}

// ─── Toast Notification ───────────────────────────────────────
function showMsg(msg, type = 'success') {
    let toast = document.getElementById('toast-msg');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-msg';
        toast.style.cssText = `
            position: fixed; bottom: 2rem; right: 2rem; z-index: 9999;
            padding: 1rem 1.5rem; border-radius: 10px; font-weight: 600;
            font-size: 0.95rem; box-shadow: 0 4px 20px rgba(0,0,0,0.25);
            transition: opacity 0.3s;
        `;
        document.body.appendChild(toast);
    }
    toast.style.background = type === 'success' ? '#22c55e' : '#ef4444';
    toast.style.color = '#fff';
    toast.style.opacity = '1';
    toast.innerText = msg;
    setTimeout(() => { toast.style.opacity = '0'; }, 3500);
}
