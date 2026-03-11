document.addEventListener('DOMContentLoaded', () => {
  const $ = (q, el=document) => el.querySelector(q);
  const $$ = (q, el=document) => Array.from(el.querySelectorAll(q));
  const LS = {
    get(k, fallback) { try { return JSON.parse(localStorage.getItem(k)) ?? fallback; } catch(e){ return fallback; } },
    set(k,v) { localStorage.setItem(k, JSON.stringify(v)); }
  };

  // default products
const defaultProducts = [
  { id: 'd-brownie', category:'dessert', title:'Brownies', price:25, image:'https://i.ibb.co/PsjKmKMK/2254f9b2-8b18-4342-981b-66eb2c8ad5a5.jpg', desc:'Chocolate brownie', available:true },
  { id: 'd-meringue', category:'dessert', title:'Meringue', price:70, image:'https://i.ibb.co/XkVpN1rK/4e5c0dfa-071c-4cc0-a61a-db481db583e9.jpg', desc:'Light meringue', available:true },
  { id: 'dr-frapp', category:'drinks', title:'Frappe', price:25, image:'https://i.ibb.co/zTbswVnJ/image-1-1768908799987.png', desc:'Iced frappe', available:false },
  { id: 'dr-capu', category:'drinks', title:'Cappuccino', price:135, image:'https://i.ibb.co/T3cV7zF/image-1-1768908848165.png', desc:'Steamed milk coffee', available:true }
];


  const KEY_PRODUCTS = 'ange_products_v1';
  const KEY_ORDERS = 'ange_orders_v1';
  const KEY_ADMIN = 'ange_admin_logged';

  let products = LS.get(KEY_PRODUCTS, null);
  if(!products){ products = defaultProducts; LS.set(KEY_PRODUCTS, products); }
  let orders = LS.get(KEY_ORDERS, []);
  let cart = [];

  // DOM refs
  const content = $('#content');
  const pageTitle = $('#page-title');
  const navBtns = $$('.nav-btn');
  const cartBtn = $('#cartBtn');
  const cartCount = $('#cartCount');
  const cartModal = $('#cartModal');
  const cartItemsEl = $('#cartItems');
  const cartTotalEl = $('#cartTotal');
  const checkoutBtn = $('#checkoutBtn');

  const confirmCompleteModal = $('#confirmCompleteModal');
const confirmCompleteBtn = $('#confirmCompleteBtn');
const cancelCompleteBtn = $('#cancelCompleteBtn');

let orderToComplete = null;

  const viewOrderModal = $('#viewOrderModal');
const viewOrderContent = $('#viewOrderContent');

  const checkoutModal = $('#checkoutModal');
  const checkoutForm = $('#checkoutForm');
  const proofUpload = $('#proofUpload');
  const proofPreview = $('#proofPreview');
  const paymentMethodSelect = document.getElementById('paymentMethod');
const gcashSection = document.getElementById('gcashSection');
if (paymentMethodSelect) {
  paymentMethodSelect.addEventListener('change', () => {
    if (paymentMethodSelect.value === 'gcash') {
      gcashSection.classList.remove('hidden');
      proofUpload.required = true;
    } else {
      gcashSection.classList.add('hidden');
      proofUpload.required = false;
      proofPreview.innerHTML = '';
      proofPreview.dataset.dataurl = '';
      proofUpload.value = '';
    }
  });
}

  const receiptBox = $('#receiptBox');
const successView = $('#successView');
const surveyView = $('#surveyView');
const openSurveyBtn = $('#openSurveyBtn');
const surveyForm = $('#surveyForm');

openSurveyBtn.addEventListener('click', () => {
  successView.classList.add('hidden');
  surveyView.classList.remove('hidden');
});


  const adminBtn = $('#adminBtn');
  const adminModal = $('#adminModal');
  const adminLoginForm = $('#adminLoginForm');
  const adminArea = $('#adminArea');
  const adminLoginBox = $('#adminLoginBox');
  const adminMsg = $('#adminMsg');
  const adminCancel = $('#adminCancel');
  const logoutAdmin = $('#logoutAdmin');
  const productForm = $('#productForm');
  const productList = $('#productList');
  const ordersList = $('#ordersList');

  const searchInput = $('#search');

  let currentTab = 'dessert';

  // render products
  function renderProducts(filter='') {
    content.innerHTML = '';
    const list = products.filter(p => p.category === currentTab && p.title.toLowerCase().includes(filter.toLowerCase()));
    if(list.length === 0) {
      content.innerHTML = '<p style="padding:18px;color:#666">No items found.</p>';
      return;
    }
    list.forEach(p => {
      const card = document.createElement('article');
      card.className = 'card';
      card.innerHTML = `
        <img src="${p.image}" onerror="this.src='https://i.ibb.co/2n8h1jB/no-image.png'">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <h4>${p.title}</h4><div class="price">₱${p.price}</div>
        </div>
        <p>${p.desc || ''}</p>
        <div class="actions">
          <div class="badge ${p.available ? 'available' : 'unavailable'}">${p.available ? 'AVAILABLE' : 'UNAVAILABLE'}</div>
          <div style="margin-left:auto">
            <button class="btn add-btn" data-id="${p.id}" ${!p.available ? 'disabled' : ''}>Add</button>
            <button class="btn ghost info-btn" data-info="${p.id}"><i class="fas fa-info-circle"></i></button>
          </div>
        </div>
      `;
      content.appendChild(card);
    });

    $$('.add-btn').forEach(b => b.addEventListener('click', () => addToCart(b.dataset.id)));
    $$('.info-btn').forEach(b => b.addEventListener('click', () => {
      const prod = products.find(pp=>pp.id===b.dataset.info);
      if(!prod) return alert('Product not found');
      alert(`${prod.title}\n\n${prod.desc || ''}\n\nPrice: ₱${prod.price}\nStatus: ${prod.available ? 'Available' : 'Unavailable'}`);
    }));
  }

  function updateCartUI(){
    cartCount.textContent = cart.reduce((s,i)=>s+i.qty,0);
    cartTotalEl.textContent = cart.reduce((s,i)=>s + (i.price*i.qty),0);
    if(cart.length===0) cartItemsEl.innerHTML = '<p>Your cart is empty.</p>';
    else {
      cartItemsEl.innerHTML = '';
      cart.forEach(item=>{
        const el = document.createElement('div');
        el.className = 'cart-item';
        el.innerHTML = `
          <img src="${item.image}">
          <div style="flex:1">
            <strong>${item.title}</strong>
            <div>₱${item.price} x <span class="qty">${item.qty}</span></div>
          </div>
          <div style="display:flex;flex-direction:column;gap:8px">
            <button class="btn mini inc" data-id="${item.id}">+</button>
            <button class="btn mini dec" data-id="${item.id}">-</button>
            <button class="btn" data-remove="${item.id}">Remove</button>
          </div>
        `;
        cartItemsEl.appendChild(el);
      });

      $$('.inc').forEach(b=>b.onclick=()=>{
        const id=b.dataset.id; cart = cart.map(c => c.id===id ? {...c, qty:c.qty+1} : c); updateCartUI();
      });
      $$('.dec').forEach(b=>b.onclick=()=>{
        const id=b.dataset.id; cart = cart.map(c => c.id===id ? {...c, qty: Math.max(1,c.qty-1)} : c); updateCartUI();
      });
      $$('[data-remove]').forEach(b=>b.onclick=()=>{
        const id=b.dataset.remove; cart = cart.filter(c=>c.id!==id); updateCartUI();
      });
    }
    checkoutBtn.disabled = cart.length === 0;
  }

  function addToCart(id){
    const prod = products.find(p=>p.id===id);
    if(!prod || !prod.available){ alert('Item not available'); return; }
    const existing = cart.find(c=>c.id===id);
    if(existing) existing.qty++;
    else cart.push({ id:prod.id, title:prod.title, price:prod.price, image:prod.image, qty:1 });
    updateCartUI();
    openModal(cartModal);
  }

  cartBtn.addEventListener('click', () => toggleModal(cartModal));

  // modal helpers
  function openModal(el){ el.setAttribute('aria-hidden','false'); }
  function closeModal(el){ el.setAttribute('aria-hidden','true'); }
  function toggleModal(el){ const hidden = el.getAttribute('aria-hidden') === 'true'; if(hidden) openModal(el); else closeModal(el); }

  document.addEventListener('click', (ev) => {
    const closeBtn = ev.target.closest('[data-close]');
    if(closeBtn){ const modal = closeBtn.closest('.modal'); if(modal) closeModal(modal); }
    // overlay close
    const modal = ev.target.closest('.modal');
    if(modal && ev.target === modal) closeModal(modal);
  });

  document.addEventListener('keydown', (ev) => { if(ev.key === 'Escape') $$(' .modal').forEach(m => closeModal(m)); });

  checkoutBtn.addEventListener('click', () => { closeModal(cartModal); openModal(checkoutModal); });

  proofUpload.addEventListener('change', (ev) => {
    const f = ev.target.files[0];
    if(!f) return;
    const reader = new FileReader();
    reader.onload = () => { proofPreview.innerHTML = `<img src="${reader.result}" alt="proof">`; proofPreview.dataset.dataurl = reader.result; };
    reader.readAsDataURL(f);
  });

  checkoutForm.addEventListener('submit', function(e){
  e.preventDefault();

  if(cart.length === 0){
    alert('Cart is empty');
    return;
  }

  const fd = new FormData(checkoutForm);

  const order = {
    id: 'ord-' + Date.now(),
    items: cart.map(i=>({id:i.id,title:i.title,price:i.price,qty:i.qty})),
    total: cart.reduce((s,i)=>s+i.price*i.qty,0),
    name: fd.get('name'),
    studentId: fd.get('studentId'),
    contact: fd.get('contact'),
    pickup: fd.get('pickup'),
    paymentMethod: fd.get('paymentMethod'),
    proof: proofPreview.dataset.dataurl || null,
    status: 'Pending',
    createdAt: new Date().toISOString()
  };

  orders.push(order);
  LS.set(KEY_ORDERS, orders);

  cart = [];
  updateCartUI();

  checkoutForm.reset();
  proofPreview.innerHTML = '';
  proofPreview.dataset.dataurl = '';

closeModal(checkoutModal);

/* receipt */
receiptBox.innerHTML = `
  <strong>Receipt #${order.id}</strong><br><br>
  Name: ${order.name}<br>
  Student ID: ${order.studentId}<br>
  Contact: ${order.contact}<br>
  Pickup Time: ${order.pickup}<br>
  Payment Method: ${order.paymentMethod}<br><br>
  <strong>Items:</strong><br>
  ${order.items.map(i => `• ${i.title} x${i.qty} — ₱${i.price * i.qty}`).join('<br>')}
  <br><br>
  <strong>Total: ₱${order.total}</strong>
`;

successView.classList.remove('hidden');
surveyView.classList.add('hidden');

openModal(successModal);


  renderAdminOrders();
});


  surveyForm.addEventListener('submit', function(e){
  e.preventDefault();

  const fd = new FormData(surveyForm);

  if(orders.length){
    const last = orders[orders.length-1];
    last.survey = {
      rating: fd.get('rating'),
      comment: fd.get('comment')
    };
    LS.set(KEY_ORDERS, orders);
  }

  surveyForm.reset();
  closeModal(successModal);
});



  navBtns.forEach(btn=>{
    btn.addEventListener('click', () => {
      navBtns.forEach(n=>n.classList.remove('active'));
      btn.classList.add('active');
      currentTab = btn.dataset.tab;
      pageTitle.textContent = btn.textContent.trim();
      if(currentTab==='about'){ content.classList.add('hidden'); $('#aboutSection').classList.remove('hidden'); }
      else { content.classList.remove('hidden'); $('#aboutSection').classList.add('hidden'); renderProducts(searchInput.value || ''); }
    });
  });

  searchInput.addEventListener('input', () => renderProducts(searchInput.value));
  renderProducts();

  // ADMIN
  function showAdminLogin(){ adminMsg.textContent=''; adminLoginBox.classList.remove('hidden'); adminArea.classList.add('hidden'); openModal(adminModal); }
  function showAdminArea(){ adminLoginBox.classList.add('hidden'); adminArea.classList.remove('hidden'); openModal(adminModal); renderAdminProducts(); renderAdminOrders(); }

  adminBtn.addEventListener('click', () => {
    const logged = LS.get(KEY_ADMIN, false);
    if(logged) showAdminArea(); else showAdminLogin();
  });

  adminCancel.addEventListener('click', () => closeModal(adminModal));

  adminLoginForm.addEventListener('submit', function(e){
    e.preventDefault();
    const pw = new FormData(adminLoginForm).get('password')?.trim() || '';
    const PASSWORD = 'admin123';
    if(pw === PASSWORD){
      LS.set(KEY_ADMIN, true);
      showAdminArea();
      adminLoginForm.reset();
    } else { adminMsg.textContent = 'Wrong password'; setTimeout(()=> adminMsg.textContent = '', 2500); }
  });

  if(logoutAdmin) logoutAdmin.addEventListener('click', () => { LS.set(KEY_ADMIN, false); showAdminLogin(); });

  // product form
  productForm.addEventListener('submit', function(e){
    e.preventDefault();
    const fd = new FormData(productForm);
    const id = fd.get('id') || ('p-' + Date.now());
    const item = {
      id,
      category: fd.get('category'),
      title: fd.get('title'),
      price: Number(fd.get('price')),
      image: fd.get('image') || 'https://i.ibb.co/2n8h1jB/no-image.png',
      desc: fd.get('desc'),
      available: fd.get('available') === 'on'
    };
    const idx = products.findIndex(p=>p.id===id);
    if(idx>=0) products[idx]=item; else products.push(item);
    LS.set(KEY_PRODUCTS, products);
productForm.reset();
renderAdminProducts();
if (currentTab !== 'about') renderProducts(searchInput.value || '');
alert('Product saved');
});

// clear product form
$('#clearProduct').addEventListener('click', () => productForm.reset());

// render admin products
function renderAdminProducts() {
  productList.innerHTML = '';
  products.forEach(p => {
    const row = document.createElement('div');
    row.className = 'product-row';
    // Use template literal with proper quoting
    row.innerHTML = `
      <div style="display:flex;gap:12px;align-items:center">
        <img src="${p.image}" style="width:56px;height:56px;object-fit:cover;border-radius:6px">
        <div>
          <div><strong>${p.title}</strong> <small style="color:#666">(${p.category})</small></div>
          <div>₱${p.price} - ${p.available ? 'Available' : 'Unavailable'}</div>
        </div>
      </div>
      <div>
        <button class="btn" data-edit="${p.id}">Edit</button>
        <button class="btn" data-del="${p.id}">Delete</button>
        <button class="btn" data-toggle="${p.id}">${p.available ? 'Set Unavailable' : 'Set Available'}</button>
      </div>
    `;
    productList.appendChild(row);
  });

  // bind edit buttons
  $$('[data-edit]', productList).forEach(b => b.onclick = () => {
    const id = b.dataset.edit;
    const prod = products.find(p => p.id === id);
    if (!prod) return;
    productForm.id.value = prod.id;
    productForm.category.value = prod.category;
    productForm.title.value = prod.title;
    productForm.price.value = prod.price;
    productForm.image.value = prod.image;
    productForm.desc.value = prod.desc;
    productForm.available.checked = prod.available;
    window.scrollTo({ top: productForm.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
  });

  // bind delete buttons
  $$('[data-del]', productList).forEach(b => b.onclick = () => {
    if (!confirm('Delete product?')) return;
    const id = b.dataset.del;
    products = products.filter(p => p.id !== id);
    LS.set(KEY_PRODUCTS, products);
    renderAdminProducts();
    renderProducts(searchInput.value || '');
  });

  // bind toggle availability buttons
  $$('[data-toggle]', productList).forEach(b => b.onclick = () => {
    const id = b.dataset.toggle;
    const p = products.find(x => x.id === id);
    if (!p) return;
    p.available = !p.available;
    LS.set(KEY_PRODUCTS, products);
    renderAdminProducts();
    renderProducts(searchInput.value || '');
  });
}

// render admin orders
function renderAdminOrders() {
  orders = LS.get(KEY_ORDERS, orders);

// Auto remove any completed orders(ADMIN)
orders = orders.filter(o => o.status !== 'Completed');
LS.set(KEY_ORDERS, orders);

  ordersList.innerHTML = '';
  if (!orders || orders.length === 0) {
    ordersList.innerHTML = '<p>No orders yet</p>';
    return;
  }

  orders.forEach(o => {
    const div = document.createElement('div');
    div.className = 'order-row';
    // Template literal with conditional Complete button
    div.innerHTML = `
      <div>
        <strong>${o.name}</strong> <small style="color:#666">(${o.studentId})</small><br>
        <small>${new Date(o.createdAt).toLocaleString()}</small><br>
        <small>Pickup: ${o.pickup} • Total ₱${o.total}</small>
        <div class="order-actions" style="margin-top:8px">
          <button class="btn" data-view="${o.id}">View</button>
          ${o.status === 'Pending' ? `<button class="btn primary" data-complete="${o.id}">Complete</button>` : `<span style="color:green;font-weight:700">Completed</span>`}
        </div>
      </div>
    `;
    ordersList.appendChild(div);
  });

  // view order details
$$('[data-view]', ordersList).forEach(b => b.onclick = () => {
  const id = b.dataset.view;
  const o = orders.find(x => x.id === id);
  if (!o) return;

  viewOrderContent.innerHTML = `
    <strong>Receipt #${o.id}</strong><br><br>

    <strong>Customer Info</strong><br>
    Name: ${o.name}<br>
    Student ID: ${o.studentId}<br>
    Contact: ${o.contact}<br>
    Pickup Time: ${o.pickup}<br>
    Payment Method: ${o.paymentMethod}<br><br>

    <strong>Items</strong><br>
    ${o.items.map(i => `• ${i.title} x${i.qty} — ₱${i.price * i.qty}`).join('<br>')}
    <br><br>

    <strong>Total: ₱${o.total}</strong><br><br>

    <strong>Status:</strong> ${o.status}<br><br>

    <strong>Survey Response</strong><br>
    Rating: ${o.survey?.rating || 'No rating submitted'}<br>
    Comment: ${o.survey?.comment || 'No comment provided'}
  `;

  openModal(viewOrderModal);
});

  // complete order
$$('[data-complete]', ordersList).forEach(b => b.onclick = () => {
  orderToComplete = b.dataset.complete;
  openModal(confirmCompleteModal);
});

  confirmCompleteBtn.addEventListener('click', () => {
  if (!orderToComplete) return;

  orders = orders.filter(o => o.id !== orderToComplete);
  LS.set(KEY_ORDERS, orders);

  orderToComplete = null;
  closeModal(confirmCompleteModal);
  renderAdminOrders();
});

cancelCompleteBtn.addEventListener('click', () => {
  orderToComplete = null;
  closeModal(confirmCompleteModal);
});



}

});