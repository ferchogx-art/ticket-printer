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

    BD_TICKETS.unshift(nuevoPedido);
    localStorage.setItem('tickets_data', JSON.stringify(BD_TICKETS));

    alert("Pedido guardado exitosamente");
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

// Cambiar estatus de pago desde la tarjeta guardada
window.cambiarEstatusPago = function(id, nuevoEstatus) {
    const index = BD_TICKETS.findIndex(t => t.id === id);
    if (index !== -1) {
        BD_TICKETS[index].pago = nuevoEstatus;
        localStorage.setItem('tickets_data', JSON.stringify(BD_TICKETS));
        renderHistorial(filtroFecha.value);
    }
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
                    <td><strong>${p.sku}</strong> • ${p.desc}</td>
                    <td class="td-der">x${p.cant}</td>
                </tr>
            `;
        });

        const opciones = { day: 'numeric', month: 'short' };
        const fechaVisual = new Date(ticket.fecha + 'T00:00:00').toLocaleDateString('es-MX', opciones);

        // Estilos de colores dinámicos para la pantalla
        let colorPago = '#e03131'; 
        if(ticket.pago === 'PAGADO') colorPago = '#2b8a3e';
        if(ticket.pago === 'Contra Entrega') colorPago = '#f59f00';

        tarjeta.innerHTML = `
            <div class="ticket-header-info">
                <div>
                    <h4>${ticket.nombre}</h4>
                    <span style="font-size:12px; color:#777;">${ticket.colonia || 'Sin Colonia'}</span>
                </div>
                <div class="tot-piezas"><strong>${ticket.totalPiezas} pzs</strong></div>
            </div>
            ${ticket.domicilio ? `<div class="info-line">📍 ${ticket.domicilio}</div>` : ''}
            ${ticket.telefono ? `<div class="info-line">📞 ${ticket.telefono}</div>` : ''}
            <div class="info-line">📅 Entrega: ${fechaVisual}</div>
            
            <div class="info-line" style="margin-top: 8px;">
                <span>💳 Pago:</span>
                <select class="select-pago-historial" onchange="cambiarEstatusPago(${ticket.id}, this.value)" style="color:${colorPago}; font-weight:bold; margin:0; padding:4px 8px; width:auto; display:inline-block; height:auto;">
                    <option value="Pendiente" ${ticket.pago === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                    <option value="PAGADO" ${ticket.pago === 'PAGADO' ? 'selected' : ''}>PAGADO</option>
                    <option value="Contra Entrega" ${ticket.pago === 'Contra Entrega' ? 'selected' : ''}>Contra Entrega</option>
                </select>
            </div>
            
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

// Acción de Impresión Física (Corregido y con fuentes negritas/grandes para 58mm)
window.imprimirTicket = function(id) {
    const ticket = BD_TICKETS.find(t => t.id === id);
    if (!ticket) return;

    let filasProductos = '';
    ticket.productos.forEach(p => {
        filasProductos += `
            <tr>
                <td style="padding: 3px 0;"><strong>${p.sku}</strong><br>${p.desc}</td>
                <td style="text-align: right; width: 45px; padding: 3px 0; font-size: 13px;"><strong>x${p.cant}</strong></td>
            </tr>
        `;
    });

    ticketImpresion.innerHTML = `
        <div class="ticket-print-layout">
            <h2 style="font-size: 14px; font-weight: 900; margin-bottom: 2px;">${ticket.nombre}</h2>
            <p style="text-align: center; font-size: 11px; font-weight: 700;">${ticket.colonia ? ticket.colonia.toUpperCase() : ''}</p>
            <div class="divider"></div>
            ${ticket.domicilio ? `<p style="font-size: 11px;"><strong>DOM:</strong> ${ticket.domicilio}</p>` : ''}
            ${ticket.telefono ? `<p style="font-size: 11px;"><strong>TEL:</strong> ${ticket.telefono}</p>` : ''}
            <p style="font-size: 11px;"><strong>ENTREGA:</strong> ${ticket.fecha}</p>
            <p style="font-size: 11px;"><strong>PAGO:</strong> ${ticket.pago.toUpperCase()}</p>
            <div class="divider"></div>
            <table class="table-print">
                <tbody>${filasProductos}</tbody>
            </table>
            <div class="divider"></div>
            <p style="text-align: right; font-size: 12px; font-weight: 900; margin-top: 5px;">TOTAL ARTÍCULOS: ${ticket.totalPiezas}</p>
            <br>
`;
    window.print();
}
