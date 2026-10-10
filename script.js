// Manejo de Base de datos local (localStorage)
let BD_TICKETS = JSON.parse(localStorage.getItem('tickets_data')) || [];
let contadorProductos = 0;

// Elementos del DOM
const tabNuevo = document.getElementById('tab-nuevo');
const tabGuardados = document.getElementById('tab-guardados');
const secNuevo = document.getElementById('sec-nuevo');
const secGuardados = document.getElementById('sec-guardados');
const btnAddProd = document.getElementById('btn-add-prod');
const listaProductosInput = document.getElementById('lista-productos-input');
const btnGuardar = document.getElementById('btn-guardar');
const historialTickets = document.getElementById('historial-tickets');
const filtroFecha = document.getElementById('filtro-fecha');
const btnLimpiarFiltro = document.getElementById('btn-limpiar-filtro');
const ticketImpresion = document.getElementById('ticket-impresion');

// Establecer fecha de hoy por defecto en el formulario
document.getElementById('ped-fecha').value = new Date().toISOString().split('T')[0];

// Cambio de Pestañas
tabNuevo.addEventListener('click', () => switchTab(tabNuevo, secNuevo));
tabGuardados.addEventListener('click', () => {
    switchTab(tabGuardados, secGuardados);
    renderHistorial();
});

function switchTab(tabActiva, seccionActiva) {
    [tabNuevo, tabGuardados].forEach(t => t.classList.remove('active'));
    [secNuevo, secGuardados].forEach(s => s.classList.remove('active'));
    tabActiva.classList.add('active');
    seccionActiva.classList.add('active');
}

// Agregar bloque de producto en el formulario
function agregarCamposProducto(sku = '', desc = '', cant = 1) {
    contadorProductos++;
    const div = document.createElement('div');
    div.className = 'item-producto-form';
    div.id = `prod-form-${contadorProductos}`;
    div.innerHTML = `
        <button type="button" class="btn-remove" onclick="eliminarCamposProducto(${contadorProductos})">🗑️</button>
        <span style="font-size:12px; color:#888;">Producto</span>
        <div class="form-row" style="margin-top:5px;">
            <input type="text" class="prod-sku" placeholder="SKU" value="${sku}" required>
            <input type="text" class="prod-desc" placeholder="Descripción del producto" value="${desc}" required>
        </div>
        <div style="width: 30%;">
            <label style="font-size:12px; margin-bottom:4px;">Cantidad</label>
            <input type="number" class="prod-cant" value="${cant}" min="1" required>
        </div>
    `;
    listaProductosInput.appendChild(div);
}

function eliminarCamposProducto(id) {
    document.getElementById(`prod-form-${id}`).remove();
}

// Inicializar con un campo de producto vacío
btnAddProd.addEventListener('click', () => agregarCamposProducto());
agregarCamposProducto(); 

// Guardar Pedido en LocalStorage
btnGuardar.addEventListener('click', () => {
    const nombre = document.getElementById('cli-nombre').value.trim();
    if (!nombre) return alert("El nombre del cliente es obligatorio");

    const productosElements = document.querySelectorAll('.item-producto-form');
    if (productosElements.length === 0) return alert("Debes agregar al menos un producto");

    const productos = [];
    let totalPiezas = 0;

    productosElements.forEach(el => {
        const cant = parseInt(el.querySelector('.prod-cant').value) || 1;
        productos.push({
            sku: el.querySelector('.prod-sku').value.trim(),
            desc: el.querySelector('.prod-desc').value.trim(),
            cant: cant
        });
        totalPiezas += cant;
    });

    const nuevoPedido = {
        id: Date.now(),
        nombre: nombre,
        domicilio: document.getElementById('cli-domicilio').value.trim(),
        colonia: document.getElementById('cli-colonia').value.trim(),
        telefono: document.getElementById('cli-telefono').value.trim(),
        referencias: document.getElementById('cli-referencias').value.trim(),
        fecha: document.getElementById('ped-fecha').value,
        pago: document.getElementById('ped-pago').value,
        totalPiezas: totalPiezas,
        productos: productos
    };

    BD_TICKETS.unshift(nuevoPedido); // Agregar al inicio
    localStorage.setItem('tickets_data', JSON.stringify(BD_TICKETS));

    alert("Pedido guardado exitosamente");
    
    // Limpiar formulario e ir a la lista de guardados
    limpiarFormulario();
    tabGuardados.click();
});

function limpiarFormulario() {
    document.getElementById('cli-nombre').value = '';
    document.getElementById('cli-domicilio').value = '';
    document.getElementById('cli-colonia').value = '';
    document.getElementById('cli-telefono').value = '';
    document.getElementById('cli-referencias').value = '';
    document.getElementById('ped-pago').value = 'Pendiente';
    listaProductosInput.innerHTML = '';
    agregarCamposProducto();
}

// Renderizar Historial en Pantalla
function renderHistorial(filtro = '') {
    historialTickets.innerHTML = '';
    let filtrados = BD_TICKETS;

    if (filtro) {
        filtrados = BD_TICKETS.filter(t => t.fecha === filtro);
    }

    if (filtrados.length === 0) {
        historialTickets.innerHTML = `<p style="text-align:center; color:#999; margin-top:20px;">No se encontraron pedidos.</p>`;
        return;
    }

    filtrados.forEach(ticket => {
        const tarjeta = document.createElement('div');
        tarjeta.className = 'ticket-card';
        
        let filasProd = '';
        ticket.productos.forEach(p => {
            filasProd += `
                <tr>
                    <td>${p.sku} • ${p.desc}</td>
                    <td class="td-der">x${p.cant}</td>
                </tr>
            `;
        });

        // Formatear Fecha visual corta (ej: 10-oct)
        const opciones = { day: 'numeric', month: 'short' };
        const fechaVisual = new Date(ticket.fecha + 'T00:00:00').toLocaleDateString('es-MX', opciones);

        tarjeta.innerHTML = `
            <div class="ticket-header-info">
                <div>
                    <h4>${ticket.nombre}</h4>
                    <span style="font-size:12px; color:#777;">${ticket.colonia || 'Sin Colonia'}</span>
                </div>
                <div class="tot-piezas">${ticket.totalPiezas} pzs</div>
            </div>
            ${ticket.domicilio ? `<div class="info-line">📍 \${ticket.domicilio}</div>` : ''}
            ${ticket.telefono ? `<div class="info-line">📞 \${ticket.telefono}</div>` : ''}
            <div class="info-line">📅 Entrega: ${fechaVisual}</div>
            <div class="info-line">💳 Pago: <strong style="color:${ticket.pago === 'PAGADO' ? '#2b8a3e' : '#e03131'}">${ticket.pago}</strong></div>
            
            <table class="tabla-productos">
                <tbody>${filasProd}</tbody>
            </table>
            
            <button class="btn-print-ticket" onclick="imprimirTicket(${ticket.id})">🖨️ Imprimir Ticket</button>
        `;
        historialTickets.appendChild(tarjeta);
    });
}

// Filtros de fecha
filtroFecha.addEventListener('change', (e) => renderHistorial(e.target.value));
btnLimpiarFiltro.addEventListener('click', () => {
    filtroFecha.value = '';
    renderHistorial();
});

// Acción de Impresión Física
function imprimirTicket(id) {
    const ticket = BD_TICKETS.find(t => t.id === id);
    if (!ticket) return;

    let filasProductos = '';
    ticket.productos.forEach(p => {
        filasProductos += `
            <tr>
                <td>${p.sku}<br>${p.desc}</td>
                <td style="text-align: right; width: 40px;">x${p.cant}</td>
            </tr>
        `;
    });

    // Formato exacto limpio y minimalista para el papel térmico
    ticketImpresion.innerHTML = `
        <div class="ticket-print-layout">
            <h2>${ticket.nombre}</h2>
            <p style="text-align: center;">${ticket.colonia ? ticket.colonia.toUpperCase() : ''}</p>
            <div class="divider"></div>
            ${ticket.domicilio ? `<p>DOM: \${ticket.domicilio}</p>` : ''}
            ${ticket.telefono ? `<p>TEL: \${ticket.telefono}</p>` : ''}
            <p>ENTREGA: ${ticket.fecha}</p>
            <p>PAGO: ${ticket.pago}</p>
            <div class="divider"></div>
            <table class="table-print">
                <tbody>${filasProductos}</tbody>
            </table>
            <div class="divider"></div>
            <p style="text-align: right; font-weight: bold;">TOTAL ARTÍCULOS: ${ticket.totalPiezas}</p>
            <br>
            <p style="text-align: center; font-size: 9px;">Gracias por su preferencia</p>
            <br><br>
        </div>
    `;

    // Ejecuta el driver de impresión nativo del dispositivo
    window.print();
}
