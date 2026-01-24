/* ===== ELEMENTOS DOM ===== */
const drawer        = document.getElementById("drawer");
const search        = document.getElementById("search");
const list          = document.getElementById("list");
const ticketList    = document.getElementById("ticketList");
const confirmModal  = document.getElementById("confirmModal");
const confirmText   = document.getElementById("confirmText");
const addItemBtn    = document.getElementById("addItemBtn");
const editBtn       = document.getElementById("editBtn");

/* ===== MODO EDICIÓN ===== */
let editMode = false;

function toggleEditMode(){
  editMode = !editMode;
  render();
}

/* ===== CATEGORÍAS ===== */
const categories = [
  "Aguas y refrescos",
  "Cerveza, vinos y licores",
  "Café y té",
  "Frutas y verduras",
  "Lácteos y huevos",
  "Carne",
  "Pescado",
  "Limpieza",
  "Congelados",
  "Asiático",
  "Otros"
];

let activeCat = categories[0];
let items = JSON.parse(localStorage.items || "[]");
let cart  = JSON.parse(localStorage.cart  || "[]");

let deleteIndex = null;
let deleteType  = null;

/* ===== ORDEN INTELIGENTE ===== */
function parseQty(name){
  const m = name.match(/([\d,.]+)/);
  return m ? parseFloat(m[1].replace(',', '.')) : null;
}

function baseName(name){
  return name.replace(/[\d.,]+\s*(cl|l|litros?|kg|g)?/i, '').trim();
}

function sortItems(){
  items.sort((a, b) => {

    if (a.cat !== b.cat) {
      return a.cat.localeCompare(b.cat, 'es', { sensitivity: 'base' });
    }

    const baseA = baseName(a.name);
    const baseB = baseName(b.name);

    if (baseA !== baseB) {
      return baseA.localeCompare(baseB, 'es', { sensitivity: 'base' });
    }

    const qA = parseQty(a.name);
    const qB = parseQty(b.name);

    if (qA !== null && qB !== null) return qA - qB;
    if (qA !== null) return -1;
    if (qB !== null) return 1;

    return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
  });
}

/* ===== DRAWER ===== */
function toggleDrawer(){
  drawer.classList.toggle("open");
}

function renderDrawer() {
  drawer.innerHTML = '';

  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.textContent = cat;
    if(cat === activeCat) btn.classList.add('active');

    btn.onclick = () => {
      activeCat = cat;
      toggleDrawer();
      render();
    };

    drawer.appendChild(btn);
  });
}

/* ===== RENDER PRINCIPAL ===== */
function render(){

  sortItems();

  addItemBtn.style.display = editMode ? "block" : "none";
  editBtn.textContent = editMode ? "↩️ Volver" : "✏️ Editar";

  renderDrawer();

  const q = search.value.toLowerCase();

  list.innerHTML = items
    .filter(i =>
      q
        ? i.name.toLowerCase().includes(q)
        : i.cat === activeCat
    )
    .map((i, idx) => `
      <div class="item">
        <span>
          ${i.name}
          ${q ? `<small style="color:#666">(${i.cat})</small>` : ""}
        </span>
        <div>
          ${
            editMode
              ? `<button class="del" onclick="askDeleteItem(${idx})">✕</button>`
              : `<button class="add" onclick="showQtyModal('${i.name}')">+</button>`
          }
        </div>
      </div>
    `).join("");

  renderTicket();

  localStorage.items = JSON.stringify(items);
  localStorage.cart  = JSON.stringify(cart);
}

/* ===== NUEVO ARTÍCULO ===== */
function showAddItem(){
  const m = document.createElement("div");
  m.className = "modal";
  m.style.display = "flex";
  m.innerHTML = `
    <div class="box">
      <h3>Nuevo artículo</h3>
      <input id="iname" placeholder="Nombre">
      <select id="icat">
        ${categories.map(c => `<option>${c}</option>`).join("")}
      </select>
      <div>
        <button id="save">Guardar</button>
        <button id="cancel">Cancelar</button>
      </div>
    </div>
  `;
  document.body.appendChild(m);

  m.querySelector("#cancel").onclick = () => m.remove();
  m.querySelector("#save").onclick = () => {
    const n = m.querySelector("#iname").value.trim();
    const c = m.querySelector("#icat").value;
    if(n){
      items.push({ name: n, cat: c });
      m.remove();
      render();
    }
  };
}

/* ===== MODAL CANTIDAD ===== */
function showQtyModal(name){
  let qty = 1;
  let unit = "UNIDAD";

  const m = document.createElement("div");
  m.className = "modal";
  m.style.display = "flex";
  m.innerHTML = `
    <div class="box">
      <h3>${name}</h3>

      <p>Cantidad</p>
      <div class="btns qty">
        ${[1,2,3,4,5,6,7,8,9,10].map(n => `<button>${n}</button>`).join("")}
      </div>

      <p>Unidad</p>
      <div class="btns unit">
        <button class="active">UNIDAD</button>
        <button>KG</button>
        <button>CAJA</button>
      </div>

      <div>
        <button id="add">Añadir</button>
        <button id="cancel">Cancelar</button>
      </div>
    </div>
  `;
  document.body.appendChild(m);

  m.querySelectorAll(".qty button").forEach(b => {
    b.onclick = () => {
      m.querySelectorAll(".qty button").forEach(x => x.classList.remove("active"));
      b.classList.add("active");
      qty = +b.textContent;
    };
  });

  m.querySelectorAll(".unit button").forEach(b => {
    b.onclick = () => {
      m.querySelectorAll(".unit button").forEach(x => x.classList.remove("active"));
      b.classList.add("active");
      unit = b.textContent;
    };
  });

  m.querySelector("#cancel").onclick = () => m.remove();
  m.querySelector("#add").onclick = () => {
    const found = cart.find(c => c.name === name && c.unit === unit);
    if(found) found.qty += qty;
    else cart.push({ name, qty, unit });
    m.remove();
    render();
  };
}

/* ===== TICKET ===== */
function renderTicket(){
  ticketList.innerHTML = cart.map((c, i) => `
    <li>
      ${c.name} - ${c.qty} ${c.unit}
      <button class="del" onclick="askDeleteTicket(${i})">✕</button>
    </li>
  `).join("");
}

/* ===== ELIMINAR ===== */
function askDeleteItem(i){
  deleteType = "item";
  deleteIndex = i;
  confirmText.textContent = `¿Eliminar ${items[i].name}?`;
  confirmModal.style.display = "flex";
}

function askDeleteTicket(i){
  deleteType = "ticket";
  deleteIndex = i;
  confirmText.textContent = `¿Eliminar ${cart[i].name}?`;
  confirmModal.style.display = "flex";
}

function askResetTicket(){
  deleteType = "reset";
  confirmText.textContent = "¿Eliminar ticket de pedido?";
  confirmModal.style.display = "flex";
}

function confirmDelete(){
  if(deleteType === "item") items.splice(deleteIndex, 1);
  if(deleteType === "ticket") cart.splice(deleteIndex, 1);
  if(deleteType === "reset") cart = [];
  confirmModal.style.display = "none";
  render();
}

/* ===== DATOS INICIALES ===== */
if(items.length === 0){
  items = [
    { name: "Agua 50cl", cat: "Aguas y refrescos" },
    { name: "Agua 1,25 litros", cat: "Aguas y refrescos" },
    { name: "Coca Cola", cat: "Aguas y refrescos" }
  ];
}

render();
