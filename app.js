// ===================== STATE =====================
const state = {
  doblefaz: false,
  color: false,
  foto: false,
  anillado: false,
};

// ===================== TABS =====================
const TABS = ['calc', 'pedidos', 'combos', 'historial', 'config', 'gastos', 'ganancias'];
let currentTabIndex = 0;

function activateTab(index) {
  if (index < 0 || index >= TABS.length) return;
  currentTabIndex = index;
  const tab = TABS[index];
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.drawer-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  const btn = document.getElementById('dnav-' + tab);
  if (btn) btn.classList.add('active');
  if (tab === 'calc') calcularPrecio();
  if (tab === 'combos') { updateComboPreview(); renderCombos(); }
  if (tab === 'historial') { renderHistFilterInputs(); renderHistorial(); }
}

function showTab(tab) {
  const index = TABS.indexOf(tab);
  if (index !== -1) activateTab(index);
}

function navTo(tab) {
  showTab(tab);
  closeDrawer();
}

function openDrawer() {
  document.getElementById('drawer').classList.add('open');
  document.getElementById('drawer-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeDrawer() {
  document.getElementById('drawer').classList.remove('open');
  document.getElementById('drawer-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

// ===================== TOGGLES =====================
function toggleOpt(key) {
  state[key] = !state[key];
  const tog = document.getElementById('tog-' + key);
  const wrap = document.getElementById('toggle-' + key);
  tog.classList.toggle('on', state[key]);
  wrap.classList.toggle('active-toggle', state[key]);
  calcularPrecio();
}

// ===================== AUTO CALCS =====================
function calcCostoHoja() {
  const precio = parseFloat(document.getElementById('cfg-resma-precio').value) || 0;
  const hojas = parseFloat(document.getElementById('cfg-resma-hojas').value) || 0;
  const costo = hojas > 0 ? precio / hojas : 0;
  document.getElementById('cfg-costo-hoja').value = costo.toFixed(4);
  refreshCombosIfPresent();
}

function calcCostoHojaFoto() {
  const precio = parseFloat(document.getElementById('cfg-resma-foto-precio').value) || 0;
  const hojas = parseFloat(document.getElementById('cfg-resma-foto-hojas').value) || 0;
  const costo = hojas > 0 ? precio / hojas : 0;
  document.getElementById('cfg-costo-hoja-foto').value = costo.toFixed(4);
  refreshCombosIfPresent();
}

function calcCostoMl() {
  const litro = parseFloat(document.getElementById('cfg-tinta-litro').value) || 0;
  const ml = litro / 1000;
  document.getElementById('cfg-tinta-ml').value = ml.toFixed(6);
  refreshCombosIfPresent();
}

// ===================== SAVE / LOAD =====================
function saveConfig() {
  const data = {
    resma_precio: document.getElementById('cfg-resma-precio').value,
    resma_hojas: document.getElementById('cfg-resma-hojas').value,
    costo_hoja: document.getElementById('cfg-costo-hoja').value,
    resma_foto_precio: document.getElementById('cfg-resma-foto-precio').value,
    resma_foto_hojas: document.getElementById('cfg-resma-foto-hojas').value,
    costo_hoja_foto: document.getElementById('cfg-costo-hoja-foto').value,
    tinta_litro: document.getElementById('cfg-tinta-litro').value,
    tinta_ml: document.getElementById('cfg-tinta-ml').value,
    anillado: document.getElementById('cfg-anillado').value,
    doblefaz_min: document.getElementById('cfg-doblefaz-min').value || '15',
  };
  localStorage.setItem('ccc_config', JSON.stringify(data));
  localStorage.setItem('ccc_last_config_save', Date.now().toString());
  refreshCombosIfPresent();
  showToast('✅ Configuración guardada');
}

function loadConfig() {
  const raw = localStorage.getItem('ccc_config');
  if (!raw) return;
  const d = JSON.parse(raw);
  setVal('cfg-resma-precio', d.resma_precio);
  setVal('cfg-resma-hojas', d.resma_hojas);
  setVal('cfg-costo-hoja', d.costo_hoja);
  setVal('cfg-resma-foto-precio', d.resma_foto_precio);
  setVal('cfg-resma-foto-hojas', d.resma_foto_hojas);
  setVal('cfg-costo-hoja-foto', d.costo_hoja_foto);
  setVal('cfg-tinta-litro', d.tinta_litro);
  setVal('cfg-tinta-ml', d.tinta_ml);
  setVal('cfg-anillado', d.anillado);
  setVal('cfg-doblefaz-min', d.doblefaz_min || '15');
}

function getDoblefazMin() {
  const cfg = JSON.parse(localStorage.getItem('ccc_config') || '{}');
  return parseInt(cfg.doblefaz_min) || 15;
}

function saveGastos() {
  const data = {
    bn: document.getElementById('gasto-bn').value || '0.5',
    color: document.getElementById('gasto-color').value || '2',
    foto: document.getElementById('gasto-foto').value || '5',
  };
  localStorage.setItem('ccc_gastos', JSON.stringify(data));
  refreshCombosIfPresent();
  showToast('✅ Gastos guardados');
}

function loadGastos() {
  const raw = localStorage.getItem('ccc_gastos');
  const d = raw ? JSON.parse(raw) : { bn: '0.5', color: '2', foto: '5' };
  setVal('gasto-bn', d.bn || '0.5');
  setVal('gasto-color', d.color || '2');
  setVal('gasto-foto', d.foto || '5');
}

function saveGanancias() {
  const data = {
    impresiones: getGananciaInputs('impresiones'),
    folletos: getGananciaInputs('folletos'),
    tarjetas: getGananciaInputs('tarjetas'),
  };
  localStorage.setItem('ccc_ganancias', JSON.stringify(data));
  refreshCombosIfPresent();
  showToast('✅ Ganancias guardadas');
}

function loadGanancias() {
  const raw = localStorage.getItem('ccc_ganancias');
  if (!raw) return;
  const d = JSON.parse(raw);
  const impresiones = d.impresiones || d;
  setGananciaInputs('impresiones', impresiones);
  setGananciaInputs('folletos', d.folletos || {});
  setGananciaInputs('tarjetas', d.tarjetas || {});
}

function getGananciaInputs(tipo) {
  return {
    bajo: document.getElementById(`gan-${tipo}-bajo`).value,
    medio: document.getElementById(`gan-${tipo}-medio`).value,
    alto: document.getElementById(`gan-${tipo}-alto`).value,
    masalto: document.getElementById(`gan-${tipo}-masalto`).value,
  };
}

function setGananciaInputs(tipo, data) {
  setVal(`gan-${tipo}-bajo`, data.bajo);
  setVal(`gan-${tipo}-medio`, data.medio);
  setVal(`gan-${tipo}-alto`, data.alto);
  setVal(`gan-${tipo}-masalto`, data.masalto);
}

function getGananciasImpresiones() {
  const gan = JSON.parse(localStorage.getItem('ccc_ganancias') || '{}');
  return gan.impresiones || gan;
}

function getGananciasTipo(tipo) {
  const fromInputs = {
    bajo: document.getElementById(`gan-${tipo}-bajo`)?.value,
    medio: document.getElementById(`gan-${tipo}-medio`)?.value,
    alto: document.getElementById(`gan-${tipo}-alto`)?.value,
    masalto: document.getElementById(`gan-${tipo}-masalto`)?.value,
  };
  if (Object.values(fromInputs).some(v => v !== undefined && v !== '')) return fromInputs;
  const gan = JSON.parse(localStorage.getItem('ccc_ganancias') || '{}');
  return gan[tipo] || {};
}

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el && val !== undefined && val !== null && val !== '') el.value = val;
}

// ===================== CALCULADORA =====================
function calcularPrecio() {
  const copias = parseInt(document.getElementById('calc-copias').value) || 0;
  if (copias <= 0) {
    document.getElementById('result-value').textContent = '$ 0,00';
    document.getElementById('result-breakdown').innerHTML = '';
    return;
  }

  // Config
  const cfg = JSON.parse(localStorage.getItem('ccc_config') || '{}');
  const gastos = JSON.parse(localStorage.getItem('ccc_gastos') || '{"bn":"0.5","color":"2","foto":"5"}');
  const gan = getGananciasImpresiones();

  const costoHoja = parseFloat(cfg.costo_hoja) || 0;
  const costoPorMl = parseFloat(cfg.tinta_ml) || 0;
  const precioAnillado = parseFloat(cfg.anillado) || 0;

  // Hojas — doble faz solo aplica si copias >= mínimo configurado
  const doblefazMin = getDoblefazMin();
  const doblefazActivo = state.doblefaz && copias >= doblefazMin;
  let hojas;
  if (doblefazActivo) {
    hojas = copias % 2 === 0 ? copias / 2 : Math.floor(copias / 2) + 1;
  } else {
    hojas = copias;
  }

  // Tinta ml — se usa solo el valor del modo seleccionado
  let mlPorHoja, tipoColor;
  if (state.foto) {
    mlPorHoja = parseFloat(gastos.foto) || 5;
    tipoColor = 'Foto / Full Color';
  } else if (state.color) {
    mlPorHoja = parseFloat(gastos.color) || 2;
    tipoColor = 'Color';
  } else {
    mlPorHoja = parseFloat(gastos.bn) || 0.5;
    tipoColor = 'Blanco y Negro';
  }

  const mlTotal = copias * mlPorHoja;
  const costoTintaTotal = mlTotal * costoPorMl;
  const costoHojasTotal = hojas * costoHoja;

  // La ganancia se aplica solo sobre impresión (papel + tinta), NO sobre anillado
  const costoImpresion = costoTintaTotal + costoHojasTotal;

  // Ganancia
  let pctGan = 0;
  if (copias < 20) pctGan = parseFloat(gan.bajo) || 0;
  else if (copias < 100) pctGan = parseFloat(gan.medio) || 0;
  else if (copias < 500) pctGan = parseFloat(gan.alto) || 0;
  else pctGan = parseFloat(gan.masalto) || 0;

  const gananciaAmt = costoImpresion * (pctGan / 100);

  // Anillado se suma al final, sin margen
  const costoAnillado = state.anillado ? precioAnillado : 0;

  const total = costoImpresion + gananciaAmt + costoAnillado;

  // Render
  document.getElementById('result-value').textContent = formatARS(total);

  document.getElementById('result-breakdown').innerHTML = `
    <div class="breakdown-row"><span>Copias</span><span>${copias} (${hojas} hojas)</span></div>
    <div class="breakdown-row"><span>Tipo de impresión</span><span>${tipoColor}</span></div>
    <div class="breakdown-row"><span>Costo papel</span><span>${formatARS(costoHojasTotal)}</span></div>
    <div class="breakdown-row"><span>Costo tinta (${mlTotal.toFixed(2)} ml)</span><span>${formatARS(costoTintaTotal)}</span></div>
    <div class="breakdown-row"><span>Costo impresión</span><span>${formatARS(costoImpresion)}</span></div>
    <div class="breakdown-row"><span>Ganancia (${pctGan}%)</span><span>${formatARS(gananciaAmt)}</span></div>
    ${costoAnillado > 0 ? `<div class="breakdown-row"><span>Anillado</span><span>${formatARS(costoAnillado)}</span></div>` : ''}
  `;
}

function formatARS(n) {
  return '$ ' + n.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
}

// ===================== COMBOS =====================
const COMBOS_KEY = 'ccc_combos';

function refreshCombosIfPresent() {
  if (document.getElementById('combo-precio')) updateComboPreview();
  if (document.getElementById('combos-list')) renderCombos();
}

function getComboConfig() {
  const cfg = JSON.parse(localStorage.getItem('ccc_config') || '{}');
  const gastos = JSON.parse(localStorage.getItem('ccc_gastos') || '{"bn":"0.5","color":"2","foto":"5"}');
  return {
    costo_hoja: document.getElementById('cfg-costo-hoja')?.value || cfg.costo_hoja || '0',
    costo_hoja_foto: document.getElementById('cfg-costo-hoja-foto')?.value || cfg.costo_hoja_foto || '0',
    tinta_ml: document.getElementById('cfg-tinta-ml')?.value || cfg.tinta_ml || '0',
    gasto_color: document.getElementById('gasto-color')?.value || gastos.color || '2',
    gasto_foto: document.getElementById('gasto-foto')?.value || gastos.foto || '5',
  };
}

function getPctGanancia(cantidad, tipo) {
  const gan = getGananciasTipo(tipo);
  if (cantidad < 20) return parseFloat(gan.bajo) || 0;
  if (cantidad < 100) return parseFloat(gan.medio) || 0;
  if (cantidad < 500) return parseFloat(gan.alto) || 0;
  return parseFloat(gan.masalto) || 0;
}

function calcComboPrice(cantidad, tipo, papel) {
  const cfg = getComboConfig();
  const unidadesPorHoja = tipo === 'tarjetas' ? 12 : 4;
  const hojas = Math.ceil(cantidad / unidadesPorHoja);
  const costoHoja = papel === 'fotografico'
    ? (parseFloat(cfg.costo_hoja_foto) || 0)
    : (parseFloat(cfg.costo_hoja) || 0);
  const mlPorUnidad = papel === 'fotografico'
    ? (parseFloat(cfg.gasto_foto) || 5)
    : (parseFloat(cfg.gasto_color) || 2);
  const costoPorMl = parseFloat(cfg.tinta_ml) || 0;
  const costoPapel = hojas * costoHoja;
  const mlTotal = cantidad * mlPorUnidad;
  const costoTinta = mlTotal * costoPorMl;
  const costo = costoPapel + costoTinta;
  const porcentaje = getPctGanancia(cantidad, tipo);
  const ganancia = costo * (porcentaje / 100);
  return { total: costo + ganancia, costo, ganancia, porcentaje, costoPapel, costoTinta, mlTotal, hojas, unidadesPorHoja };
}

function updateComboPreview() {
  const tipo = document.getElementById('combo-tipo')?.value || 'folletos';
  const papel = document.getElementById('combo-papel')?.value || 'normal';
  const rawCantidad = document.getElementById('combo-cantidad')?.value.trim() || '';
  const cantidad = /^[1-9]\d*$/.test(rawCantidad) ? parseInt(rawCantidad) : 0;
  const pctEl = document.getElementById('combo-porcentaje');
  const precioEl = document.getElementById('combo-precio');
  if (!pctEl || !precioEl) return;
  if (cantidad <= 0) {
    pctEl.value = '0%';
    precioEl.value = '$ 0,00';
    return;
  }
  const r = calcComboPrice(cantidad, tipo, papel);
  pctEl.value = r.porcentaje + '%';
  precioEl.value = formatARS(r.total);
}

function getCombos() {
  return JSON.parse(localStorage.getItem(COMBOS_KEY) || '[]');
}

function saveCombos(combos) {
  localStorage.setItem(COMBOS_KEY, JSON.stringify(combos));
}

function saveCombo() {
  const nombre = document.getElementById('combo-nombre').value.trim();
  const rawCantidad = document.getElementById('combo-cantidad').value.trim();
  if (!nombre) {
    showToast('⚠️ Ingresá un nombre para el combo');
    return;
  }
  if (!/^[1-9]\d*$/.test(rawCantidad)) {
    showToast('⚠️ Ingresá una cantidad entera positiva');
    return;
  }
  const combo = {
    id: Date.now(),
    nombre,
    tipo: document.getElementById('combo-tipo').value,
    papel: document.getElementById('combo-papel').value,
    cantidad: parseInt(rawCantidad),
  };
  const combos = getCombos();
  combos.push(combo);
  saveCombos(combos);
  document.getElementById('combo-nombre').value = '';
  document.getElementById('combo-cantidad').value = '';
  updateComboPreview();
  renderCombos();
  showToast('✅ Combo creado');
}

function deleteCombo(id) {
  saveCombos(getCombos().filter(c => c.id !== id));
  renderCombos();
  showToast('🗑 Combo eliminado');
}

function renderCombos() {
  const cont = document.getElementById('combos-list');
  if (!cont) return;
  const combos = getCombos();
  if (!combos.length) {
    cont.innerHTML = `<div class="hist-empty"><div class="empty-icon">🏷️</div>No hay combos creados</div>`;
    return;
  }
  cont.innerHTML = combos.map(c => {
    const r = calcComboPrice(c.cantidad, c.tipo, c.papel);
    const tipoLabel = c.tipo === 'tarjetas' ? 'Tarjetas' : 'Folletos';
    const papelLabel = c.papel === 'fotografico' ? 'Fotográfico' : 'Normal';
    const nombre = escapeHtml(c.nombre || tipoLabel + ' x ' + c.cantidad);
    return '<div class="combo-card">'
      + '<div class="combo-card-top">'
        + '<div>'
          + '<div class="combo-title">' + nombre + '</div>'
          + '<div class="combo-subtitle">'
            + '<span class="combo-chip">' + tipoLabel + '</span>'
            + '<span class="combo-chip">Papel ' + papelLabel + '</span>'
          + '</div>'
        + '</div>'
        + '<div class="combo-price">' + formatARS(r.total) + '</div>'
      + '</div>'
      + '<div class="combo-meta">'
        + '<div class="combo-stat"><span class="combo-stat-label">Cantidad</span><span class="combo-stat-value">' + c.cantidad + '</span></div>'
        + '<div class="combo-stat"><span class="combo-stat-label">Hojas</span><span class="combo-stat-value">' + r.hojas + '</span></div>'
        + '<div class="combo-stat"><span class="combo-stat-label">Ganancia</span><span class="combo-stat-value">' + r.porcentaje + '%</span></div>'
      + '</div>'
      + '<div class="combo-detail">'
        + '<span>' + r.unidadesPorHoja + ' unidades por hoja</span>'
        + '<span>Papel: ' + formatARS(r.costoPapel) + '</span>'
        + '<span>Tinta: ' + formatARS(r.costoTinta) + '</span>'
      + '</div>'
      + '<button class="btn-remove-combo" onclick="deleteCombo(' + c.id + ')">Eliminar combo</button>'
    + '</div>';
  }).join('');
}


// ===================== PEDIDOS =====================
let editandoId = null;
let docCounter = 0;

function addDoc() {
  docCounter++;
  const id = 'doc-' + docCounter;
  const div = document.createElement('div');
  div.className = 'doc-item';
  div.id = id;
  div.innerHTML = `
    <div class="doc-item-header">
      <span class="doc-item-title">Documento #${docCounter}</span>
      <div style="display:flex;align-items:center;gap:8px">
        <span class="doc-item-price" id="${id}-precio">$ 0,00</span>
        <button class="btn-remove-doc" onclick="removeDoc('${id}')">✕</button>
      </div>
    </div>
    <div class="field">
      <label>Nombre del documento</label>
      <input type="text" placeholder="Ej: Tesis, Formulario..." oninput="calcDoc('${id}')">
    </div>
    <div class="field-row">
      <div class="field">
        <label>Cantidad de copias</label>
        <input type="number" min="1" placeholder="1" oninput="calcDoc('${id}')">
      </div>
    </div>
    <div class="doc-toggles">
      <div class="doc-toggle-pill" id="${id}-faz" onclick="toggleDoc('${id}','faz')">⬛ Doble faz</div>
      <div class="doc-toggle-pill" id="${id}-color" onclick="toggleDoc('${id}','color')">🎨 Color</div>
      <div class="doc-toggle-pill" id="${id}-foto" onclick="toggleDoc('${id}','foto')">📸 Foto</div>
      <div class="doc-toggle-pill" id="${id}-anillado" onclick="toggleDoc('${id}','anillado')">🔗 Anillado</div>
    </div>
  `;
  document.getElementById('docs-list').appendChild(div);
  calcPedidoTotal();
}

function removeDoc(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
  delete docPrices[id];
  calcPedidoTotal();
}

function toggleDoc(docId, key) {
  const pill = document.getElementById(docId + '-' + key);
  pill.classList.toggle('on');
  calcDoc(docId);
}

function getDocState(docId) {
  return {
    faz:     document.getElementById(docId+'-faz')?.classList.contains('on') || false,
    color:   document.getElementById(docId+'-color')?.classList.contains('on') || false,
    foto:    document.getElementById(docId+'-foto')?.classList.contains('on') || false,
    anillado:document.getElementById(docId+'-anillado')?.classList.contains('on') || false,
  };
}

function calcDocPrice(copias, st) {
  const cfg    = JSON.parse(localStorage.getItem('ccc_config') || '{}');
  const gastos = JSON.parse(localStorage.getItem('ccc_gastos') || '{"bn":"0.5","color":"2","foto":"5"}');
  const gan    = getGananciasImpresiones();

  const costoHoja   = parseFloat(cfg.costo_hoja) || 0;
  const costoPorMl  = parseFloat(cfg.tinta_ml)   || 0;
  const precioAni   = parseFloat(cfg.anillado)    || 0;

  const _dfMin = getDoblefazMin();
  const _dfActivo = st.faz && copias >= _dfMin;
  let hojas = _dfActivo
    ? (copias % 2 === 0 ? copias / 2 : Math.floor(copias / 2) + 1)
    : copias;

  let ml;
  if (st.foto)       ml = parseFloat(gastos.foto)  || 5;
  else if (st.color) ml = parseFloat(gastos.color) || 2;
  else               ml = parseFloat(gastos.bn)    || 0.5;

  const costoImpresion = (hojas * costoHoja) + (copias * ml * costoPorMl);

  let pctGan = 0;
  if      (copias < 20)  pctGan = parseFloat(gan.bajo)    || 0;
  else if (copias < 100) pctGan = parseFloat(gan.medio)   || 0;
  else if (copias < 500) pctGan = parseFloat(gan.alto)    || 0;
  else                   pctGan = parseFloat(gan.masalto)  || 0;

  const ganancia  = costoImpresion * (pctGan / 100);
  const anillado  = st.anillado ? precioAni : 0;
  return { total: costoImpresion + ganancia + anillado, costo: costoImpresion, ganancia, anillado };
}

// Guarda el precio calculado de cada doc en un mapa para sumar sin parsear texto
const docPrices = {};

function calcDoc(docId) {
  const el     = document.getElementById(docId);
  if (!el) return;
  const inputs = el.querySelectorAll('input');
  const copias = parseInt(inputs[1]?.value) || 0;
  const st     = getDocState(docId);
  const r      = calcDocPrice(copias, st);
  docPrices[docId] = r.total;
  document.getElementById(docId + '-precio').textContent = formatARS(r.total);
  calcPedidoTotal();
}

function calcPedidoTotal() {
  let total = 0;
  document.querySelectorAll('.doc-item').forEach(el => {
    total += docPrices[el.id] || 0;
  });
  document.getElementById('ped-total-value').textContent = formatARS(total);
}

function buildDocsSummary() {
  const docs = [];
  document.querySelectorAll('.doc-item').forEach(el => {
    const inputs  = el.querySelectorAll('input');
    const nombre  = inputs[0]?.value || 'Documento';
    const copias  = parseInt(inputs[1]?.value) || 0;
    const st      = getDocState(el.id);
    const r       = calcDocPrice(copias, st);
    docs.push({ nombre, copias, st, precio: r.total, costo: r.costo, ganancia: r.ganancia });
  });
  return docs;
}

function enviarWhatsapp() {
  const tel  = document.getElementById('ped-tel').value.trim().replace(/\D/g,'');
  if (!tel)  { showToast('⚠️ Ingresá el número de WhatsApp'); return; }
  const docs = buildDocsSummary();
  if (!docs.length) { showToast('⚠️ Agregá al menos un documento'); return; }

  const NL = '\n';
  let msg = '🖨 *Presupuesto CopyChapa*' + NL + NL;
  let total = 0;
  docs.forEach(function(d) {
    const opts = [];
    if (d.st.faz)      opts.push('Doble faz');
    if (d.st.color)    opts.push('Color');
    if (d.st.foto)     opts.push('Foto');
    if (d.st.anillado) opts.push('Anillado');
    msg += '📄 *' + d.nombre + '*' + NL;
    msg += '   • Copias: ' + d.copias + NL;
    if (opts.length) msg += '   • ' + opts.join(' | ') + NL;
    msg += '   • Precio: ' + formatARS(d.precio) + NL + NL;
    total += d.precio;
  });
  msg += '💰 *Total: ' + formatARS(total) + '*';

  window.open('https://wa.me/' + tel + '?text=' + encodeURIComponent(msg), '_blank');
}

function guardarPedido() {
  const nombre = document.getElementById('ped-nombre').value.trim();
  const tel    = document.getElementById('ped-tel').value.trim();
  if (!nombre) { showToast('⚠️ Ingresá el nombre del cliente'); return; }
  const docs   = buildDocsSummary();
  if (!docs.length) { showToast('⚠️ Agregá al menos un documento'); return; }

  const total   = docs.reduce((s, d) => s + d.precio, 0);
  const costo   = docs.reduce((s, d) => s + d.costo, 0);
  const ganancia= docs.reduce((s, d) => s + d.ganancia, 0);

  const pedido = {
    id:        Date.now(),
    fecha:     new Date().toISOString(),
    nombre, tel, docs, total, costo, ganancia
  };

  const lista = JSON.parse(localStorage.getItem('ccc_pedidos') || '[]');
  lista.push(pedido);
  localStorage.setItem('ccc_pedidos', JSON.stringify(lista));

  // Limpiar formulario
  document.getElementById('ped-nombre').value = '';
  document.getElementById('ped-tel').value    = '';
  document.getElementById('docs-list').innerHTML = '';
  docCounter = 0;
  calcPedidoTotal();

  showToast('✅ Pedido guardado');
}

// ===================== HISTORIAL =====================
let histFiltro = 'diario';

function setHistFiltro(f) {
  histFiltro = f;
  ['diario','semanal','mensual'].forEach(k => {
    document.getElementById('hf-' + k).classList.toggle('active', k === f);
  });
  renderHistFilterInputs();
  renderHistorial();
}

function renderHistFilterInputs() {
  const cont = document.getElementById('hist-filter-inputs');
  const hoy  = new Date();

  if (histFiltro === 'diario') {
    const iso = hoy.toISOString().slice(0,10);
    cont.innerHTML = `<input type="date" class="hist-select" id="hist-fecha" value="${iso}" onchange="renderHistorial()">`;

  } else if (histFiltro === 'semanal') {
    // Generar últimas 12 semanas (lun-sab)
    const opciones = [];
    let d = new Date(hoy);
    // ir al lunes de la semana actual
    const dow = d.getDay(); // 0=dom
    const diffToLun = dow === 0 ? -6 : 1 - dow;
    d.setDate(d.getDate() + diffToLun);
    for (let i = 0; i < 12; i++) {
      const lun = new Date(d);
      const sab = new Date(d); sab.setDate(sab.getDate() + 5);
      const fmt = dd => dd.toLocaleDateString('es-AR',{day:'2-digit',month:'2-digit'});
      opciones.push({ value: lun.toISOString().slice(0,10), label: `Semana del ${fmt(lun)} al ${fmt(sab)}` });
      d.setDate(d.getDate() - 7);
    }
    const opts = opciones.map((o,i) => `<option value="${o.value}"${i===0?' selected':''}>${o.label}</option>`).join('');
    cont.innerHTML = `<select class="hist-select" id="hist-semana" onchange="renderHistorial()">${opts}</select>`;

  } else {
    const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const mesOpts = meses.map((m,i) => `<option value="${i}"${i===hoy.getMonth()?' selected':''}>${m}</option>`).join('');
    const anioActual = hoy.getFullYear();
    const anioOpts = [2024,2025,2026,2027].map(a => `<option value="${a}"${a===anioActual?' selected':''}>${a}</option>`).join('');
    cont.innerHTML = `
      <select class="hist-select" id="hist-mes" onchange="renderHistorial()">${mesOpts}</select>
      <select class="hist-select" id="hist-anio" onchange="renderHistorial()">${anioOpts}</select>
    `;
  }
}

function getPedidosFiltrados() {
  const lista = JSON.parse(localStorage.getItem('ccc_pedidos') || '[]');

  if (histFiltro === 'diario') {
    const fecha = document.getElementById('hist-fecha')?.value;
    if (!fecha) return [];
    return lista.filter(p => p.fecha.slice(0,10) === fecha);

  } else if (histFiltro === 'semanal') {
    const lunStr = document.getElementById('hist-semana')?.value;
    if (!lunStr) return [];
    const lun = new Date(lunStr + 'T00:00:00');
    const sab = new Date(lun); sab.setDate(sab.getDate() + 5); sab.setHours(23,59,59);
    return lista.filter(p => {
      const f = new Date(p.fecha);
      return f >= lun && f <= sab;
    });

  } else {
    const mes  = parseInt(document.getElementById('hist-mes')?.value ?? new Date().getMonth());
    const anio = parseInt(document.getElementById('hist-anio')?.value ?? new Date().getFullYear());
    return lista.filter(p => {
      const f = new Date(p.fecha);
      return f.getMonth() === mes && f.getFullYear() === anio;
    });
  }
}

function renderHistorial() {
  const pedidos = getPedidosFiltrados();
  const listEl  = document.getElementById('hist-list');
  const resEl   = document.getElementById('hist-resumen');

  if (!pedidos.length) {
    listEl.innerHTML = `<div class="hist-empty"><div class="empty-icon">📭</div>No hay pedidos en este período</div>`;
    resEl.style.display = 'none';
    return;
  }

  listEl.innerHTML = pedidos.map(p => {
    const fecha = new Date(p.fecha).toLocaleDateString('es-AR', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' });
    const docsRows = (p.docs || []).map(d => {
      const tags = [];
      if (d.st?.faz)      tags.push('2F');
      if (d.st?.color)    tags.push('Color');
      if (d.st?.foto)     tags.push('Foto');
      if (d.st?.anillado) tags.push('Ani');
      const tagsHtml = tags.map(t => '<span class="doc-tag">'+t+'</span>').join('');
      const precio = formatARS(d.precio || 0);
      return '<div class="pedido-card-doc-row">'
        + '<span class="pedido-card-doc-name">' + (d.nombre||'Doc') + ' ×' + d.copias + '</span>'
        + (tagsHtml ? '<span class="pedido-card-doc-tags">'+tagsHtml+'</span>' : '')
        + '<span class="pedido-card-doc-price">'+precio+'</span>'
        + '</div>';
    }).join('');

    return '<div class="pedido-card">'
      + '<div class="pedido-card-header">'
        + '<div class="pedido-card-top">'
          + '<div class="pedido-card-name">' + p.nombre + '</div>'
          + '<div class="pedido-card-total">' + formatARS(p.total) + '</div>'
        + '</div>'
        + '<div class="pedido-card-date">' + fecha + (p.tel ? ' · +'+p.tel : '') + '</div>'
      + '</div>'
      + '<div class="pedido-card-docs">' + docsRows + '</div>'
      + '<div class="pedido-card-actions">'
        + '<button class="btn-edit-ped" onclick="abrirEditar('+p.id+')">✏️ Editar</button>'
        + '<button class="btn-del-ped" onclick="eliminarPedido('+p.id+')">🗑 Eliminar</button>'
      + '</div>'
    + '</div>';
  }).join('');

  // Resumen
  const totalGastos   = pedidos.reduce((s,p) => s + (p.costo    || 0), 0);
  const totalGanancias= pedidos.reduce((s,p) => s + (p.ganancia || 0), 0);
  const totalGeneral  = pedidos.reduce((s,p) => s + (p.total    || 0), 0);
  document.getElementById('hist-gastos').textContent    = formatARS(totalGastos);
  document.getElementById('hist-ganancias').textContent = formatARS(totalGanancias);
  document.getElementById('hist-total').textContent     = formatARS(totalGeneral);
  resEl.style.display = 'block';
}

function eliminarPedido(id) {
  let lista = JSON.parse(localStorage.getItem('ccc_pedidos') || '[]');
  lista = lista.filter(p => p.id !== id);
  localStorage.setItem('ccc_pedidos', JSON.stringify(lista));
  renderHistorial();
  showToast('🗑 Pedido eliminado');
}

function abrirEditar(id) {
  const lista  = JSON.parse(localStorage.getItem('ccc_pedidos') || '[]');
  const pedido = lista.find(p => p.id === id);
  if (!pedido) return;
  editandoId = id;
  document.getElementById('edit-nombre').value = pedido.nombre;
  document.getElementById('edit-tel').value    = pedido.tel || '';

  // Build dynamic doc fields
  const cont = document.getElementById('edit-docs-cont');
  cont.innerHTML = '';
  (pedido.docs || []).forEach((d, i) => {
    const div = document.createElement('div');
    div.className = 'edit-doc-item';
    div.innerHTML =
      '<div class="edit-doc-title">📄 ' + (d.nombre || 'Documento ' + (i+1)) + '</div>'
      + '<div class="field-row">'
        + '<div class="field"><label>Copias</label>'
          + '<input type="number" class="edit-doc-copias" data-idx="'+i+'" min="1" value="'+(d.copias||1)+'">'
        + '</div>'
      + '</div>'
      + '<div class="doc-toggles" style="margin-top:8px">'
        + '<div class="doc-toggle-pill edit-pill'+(d.st?.faz?' on':'')+'" data-idx="'+i+'" data-key="faz">⬛ Doble faz</div>'
        + '<div class="doc-toggle-pill edit-pill'+(d.st?.color?' on':'')+'" data-idx="'+i+'" data-key="color">🎨 Color</div>'
        + '<div class="doc-toggle-pill edit-pill'+(d.st?.foto?' on':'')+'" data-idx="'+i+'" data-key="foto">📸 Foto</div>'
        + '<div class="doc-toggle-pill edit-pill'+(d.st?.anillado?' on':'')+'" data-idx="'+i+'" data-key="anillado">🔗 Anillado</div>'
      + '</div>';
    cont.appendChild(div);
  });

  // Toggle handler for edit pills
  cont.querySelectorAll('.edit-pill').forEach(pill => {
    pill.addEventListener('click', function() {
      this.classList.toggle('on');
    });
  });

  document.getElementById('modal-editar').classList.add('open');
}

function cerrarModal() {
  document.getElementById('modal-editar').classList.remove('open');
  editandoId = null;
}

function guardarEdicion() {
  if (!editandoId) return;
  let lista  = JSON.parse(localStorage.getItem('ccc_pedidos') || '[]');
  const idx  = lista.findIndex(p => p.id === editandoId);
  if (idx === -1) return;

  lista[idx].nombre = document.getElementById('edit-nombre').value.trim();
  lista[idx].tel    = document.getElementById('edit-tel').value.trim();

  // Update docs
  const cont = document.getElementById('edit-docs-cont');
  const copiaInputs = cont.querySelectorAll('.edit-doc-copias');
  copiaInputs.forEach(input => {
    const i = parseInt(input.dataset.idx);
    if (!lista[idx].docs[i]) return;
    const newCopias = parseInt(input.value) || 1;
    const pills = cont.querySelectorAll('.edit-pill[data-idx="'+i+'"]');
    const newSt = { faz: false, color: false, foto: false, anillado: false };
    pills.forEach(p => { newSt[p.dataset.key] = p.classList.contains('on'); });

    lista[idx].docs[i].copias = newCopias;
    lista[idx].docs[i].st     = newSt;

    // Recalc doc price
    const r = calcDocPrice(newCopias, newSt);
    lista[idx].docs[i].precio   = r.total;
    lista[idx].docs[i].costo    = r.costo;
    lista[idx].docs[i].ganancia = r.ganancia;
  });

  // Recalc pedido totals
  lista[idx].total    = lista[idx].docs.reduce((s,d) => s + (d.precio    || 0), 0);
  lista[idx].costo    = lista[idx].docs.reduce((s,d) => s + (d.costo     || 0), 0);
  lista[idx].ganancia = lista[idx].docs.reduce((s,d) => s + (d.ganancia  || 0), 0);

  localStorage.setItem('ccc_pedidos', JSON.stringify(lista));
  cerrarModal();
  renderHistorial();
  showToast('✅ Pedido actualizado');
}

// Cerrar modal al tocar fuera — se registra en load para garantizar que el DOM existe

// ===================== TOAST =====================
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}


// ===================== DARK MODE =====================
function toggleDark() {
  const isDark = document.body.classList.toggle('dark');
  localStorage.setItem('ccc_dark', isDark ? '1' : '0');
  updateDarkBtn(isDark);
}

function updateDarkBtn(isDark) {
  const icon  = document.getElementById('dark-icon');
  const label = document.getElementById('dark-label');
  if (icon)  icon.textContent  = isDark ? '☀️' : '🌙';
  if (label) label.textContent = isDark ? 'Modo claro' : 'Modo oscuro';
}

// ===================== INIT =====================
window.addEventListener('load', () => {
  loadConfig();
  loadGastos();
  loadGanancias();
  document.getElementById('modal-editar').addEventListener('click', function(e) {
    if (e.target === this) cerrarModal();
  });
  const isDark = localStorage.getItem('ccc_dark') === '1';
  if (isDark) document.body.classList.add('dark');
  updateDarkBtn(isDark);
  initSW();
  checkPriceReminder();
  renderHistFilterInputs();
  // Arrange dark mode in header — remove old btn if still present
  const oldBtn = document.getElementById('btn-dark');
  if (oldBtn) oldBtn.remove();
  // Start on calculator
  activateTab(0);
});

// Prevent pinch zoom
document.addEventListener('touchmove', e => {
  if (e.touches.length > 1) e.preventDefault();
}, { passive: false });




// ===================== SERVICE WORKER =====================
function initSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
}

// ===================== RECORDATORIO DE PRECIOS =====================
const REMINDER_KEY = 'ccc_last_config_save';
const REMINDER_DAYS = 15;

function checkPriceReminder() {
  const last = parseInt(localStorage.getItem(REMINDER_KEY) || '0');
  if (!last) return; // nunca guardó config, no recordar aún
  const daysSince = (Date.now() - last) / (1000 * 60 * 60 * 24);
  if (daysSince >= REMINDER_DAYS) {
    scheduleReminderNotification(daysSince);
  }
}

function scheduleReminderNotification(daysSince) {
  const days = Math.floor(daysSince);
  if ('Notification' in window) {
    if (Notification.permission === 'granted') {
      fireReminderNotification(days);
    } else if (Notification.permission !== 'denied') {
      // Mostrar banner in-app primero, pedir permiso al hacer tap
      showReminderBanner(days);
    } else {
      // Permiso denegado, mostrar solo banner in-app
      showReminderBanner(days);
    }
  } else {
    showReminderBanner(days);
  }
}

function fireReminderNotification(days) {
  navigator.serviceWorker.ready.then(reg => {
    reg.showNotification('💰 CopyChapa — Actualizá tus precios', {
      body: `Hace ${days} días que no actualizás la configuración de precios.`,
      icon: './icon-192.png',
      badge: './icon-192.png',
      tag: 'price-reminder',
      renotify: true,
    });
  }).catch(() => {
    // Fallback sin SW
    new Notification('💰 CopyChapa — Actualizá tus precios', {
      body: `Hace ${days} días que no actualizás la configuración de precios.`,
    });
  });
}

function showReminderBanner(days) {
  // Evitar duplicados
  if (document.getElementById('reminder-banner')) return;
  const banner = document.createElement('div');
  banner.id = 'reminder-banner';
  banner.innerHTML = `
    <div class="reminder-icon">🔔</div>
    <div class="reminder-text">
      <strong>¡Actualizá tus precios!</strong>
      <span>Hace ${days} días que no revisás la configuración.</span>
    </div>
    <div class="reminder-actions">
      <button class="reminder-btn-ok" onclick="goToConfig()">Ver</button>
      <button class="reminder-btn-dismiss" onclick="dismissReminder()">✕</button>
    </div>
  `;
  document.body.appendChild(banner);
  // Solicitar permiso de notificaciones al tocar "Ver"
  banner.querySelector('.reminder-btn-ok').addEventListener('click', () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  });
  // Animate in
  requestAnimationFrame(() => banner.classList.add('show'));
}

function dismissReminder() {
  const banner = document.getElementById('reminder-banner');
  if (banner) {
    banner.classList.remove('show');
    setTimeout(() => banner.remove(), 300);
  }
}

function goToConfig() {
  dismissReminder();
  activateTab(0);
}
