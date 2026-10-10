// SISTEMA AUTO-REPARABLE: Si el historial guardado está corrupto, lo limpia en lugar de congelar la pantalla
let BD_TICKETS = [];
try {
    var datosGuardados = localStorage.getItem('tickets_data');
    if (datosGuardados) {
        BD_TICKETS = JSON.parse(datosGuardados);
        if (!Array.isArray(BD_TICKETS)) {
            BD_TICKETS = [];
        }
    }
} catch(e) {
    console.log("Error al leer base de datos, iniciando limpia.");
    BD_TICKETS = [];
}

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

// Establecer fecha de hoy por defecto
if (document.getElementById('ped-fecha')) {
    document.getElementById('ped-fecha').value = new Date().toISOString().split('T')[0];
}

// Navegación de pestañas universal
window.irANuevo = function() {
    tabNuevo.className = 'tab-btn active';
    tabGuardados.className = 'tab-btn';
    secNuevo.className = 'tab-content active';
    secGuardados.className = 'tab-content';
};

window.irAGuardados = function() {
    tabNuevo.className = 'tab-btn';
    tabGuardados.className = 'tab-btn active';
    secNuevo.className = 'tab-content';
    secGuardados.className = 'tab-content active';
    renderHistorial();
};

tabNuevo.addEventListener('click', window.irANuevo);
tabGuardados.addEventListener('click', window.irAGuardados);

// Agregar productos dinámicamente
window.agregarCamposProducto = function(sku, desc, cant) {
    contadorProductos++;
    const vSku = sku || '';
    const vDesc = desc || '';
    const vCant = cant || 1;
    
    const div = document.createElement('div');
    div.className = 'item-producto-form';
    div.id = 'prod-form-' + contadorProductos;
    
    div.innerHTML = '<button type="button" class="btn-remove" onclick="window.eliminarCamposProducto(' + contadorProductos + ')">🗑️</button>' +
                    '<span style="font-size:12px; color:#888;">Producto</span>' +
                    '<div class="form-row" style="margin-top:5px;">' +
                        '<input type="text" class="prod-sku" placeholder="SKU" value="' + vSku + '" required>' +
                        '<input type="text" class="prod-desc" placeholder="Descripción del producto" value="' + vDesc + '" required>' +
                    '</div>' +
                    '<div style="width: 30%;">' +
                        '<label style="font-size:12px; margin-bottom:4px;">Cantidad</label>' +
                        '<input type="number" class="prod-cant" value="' + vCant + '" min="1" required>' +
                    '</div>';
    
    listaProductosInput.appendChild(div);
};

window.eliminarCamposProducto = function(id) {
    const el = document.getElementById('prod-form-' + id);
    if (el) el.remove();
};

btnAddProd.addEventListener('click', function() { window.agregarCamposProducto(); });
window.agregarCamposProducto(); 

// Guardar Pedidos de forma segura
btnGuardar.addEventListener('click', function() {
    const nombre = document.getElementById('cli-nombre').value.trim();
    if (!nombre) return alert('El nombre del cliente es obligatorio');

    const productosElements = document.querySelectorAll('.item-producto-form');
    if (productosElements.length === 0) return alert('Debes agregar al menos un producto');

    const productos = [];
    productosElements.forEach(function(el) {
        const skuInput = el.querySelector('.prod-sku');
        const descInput = el.querySelector('.prod-desc');
        const cantInput = el.querySelector('.prod-cant');
        
        if(skuInput && descInput) {
            productos.push({
                sku: skuInput.value.trim(),
                desc: descInput.value.trim(),
                cant: parseInt(cantInput.value) || 1
            });
        }
    });

    const ahora = new Date();
    const timestampStr = ahora.toLocaleDateString('es-MX') + ', ' + ahora.toLocaleTimeString('es-MX', {hour: '2-digit', minute:'2-digit'});

    BD_TICKETS.unshift({
        id: Date.now(),
        nombre: nombre,
        domicilio: document.getElementById('cli-domicilio').value.trim(),
        colonia: document.getElementById('cli-colonia').value.trim(),
        telefono: document.getElementById('cli-telefono').value.trim(),
        referencias: document.getElementById('cli-referencias').value.trim(),
        fecha: document.getElementById('ped-fecha').value,
        pago: document.getElementById('ped-pago').value,
        productos: productos,
        registroTime: timestampStr
    }); 
    
    try {
        localStorage.setItem('tickets_data', JSON.stringify(BD_TICKETS));
    } catch(e){}

    alert('Pedido guardado exitosamente');
    limpiarFormulario();
    window.irAGuardados();
});

function limpiarFormulario() {
    document.getElementById('cli-nombre').value = '';
    document.getElementById('cli-domicilio').value = '';
    document.getElementById('cli-colonia').value = '';
    document.getElementById('cli-telefono').value = '';
    document.getElementById('cli-referencias').value = '';
    document.getElementById('ped-pago').value = 'Pendiente';
    listaProductosInput.innerHTML = '';
    window.agregarCamposProducto();
}

window.cambiarEstatusPago = function(id, nuevoEstatus, selectEl) {
    const index = BD_TICKETS.findIndex(function(x) { return x.id === id; });
    if (index !== -1) {
        BD_TICKETS[index].pago = nuevoEstatus;
        try {
            localStorage.setItem('tickets_data', JSON.stringify(BD_TICKETS));
        } catch(e){}
        const nuevoColor = nuevoEstatus === 'PAGADO' ? '#2b8a3e' : (nuevoEstatus === 'Pendiente' ? '#e03131' : '#f59f00');
        if(selectEl) {
            selectEl.style.color = nuevoColor;
            selectEl.style.borderColor = nuevoColor;
        }
    }
};

// Renderizar Historial a prueba de errores
function renderHistorial(filtro = '') {
    historialTickets.innerHTML = '';
    let filtrados = filtro ? BD_TICKETS.filter(function(t) { return t.fecha === filtro; }) : BD_TICKETS;

    if (filtrados.length === 0) {
        historialTickets.innerHTML = '<p style="text-align:center; color:#999; margin-top:20px;">No se encontraron pedidos.</p>';
        return;
    }

    filtrados.forEach(function(ticket) {
        // Validación de protección: Si el registro viene dañado de pruebas pasadas, se lo salta limpiamente
        if (!ticket || !ticket.nombre || !ticket.productos) return;

        const tarjeta = document.createElement('div');
        tarjeta.className = 'ticket-card';
        
        let filasProd = '';
        let totalPzs = 0;
        ticket.productos.forEach(function(p) {
            filasProd += '<tr><td>' + p.sku + ' • ' + p.desc + '</td><td class="td-der">x' + p.cant + '</td></tr>';
            totalPzs += p.cant;
        });

        const colorPago = ticket.pago === 'PAGADO' ? '#2b8a3e' : (ticket.pago === 'Pendiente' ? '#e03131' : '#f59f00');

        let htmlTarjeta = '<div class="ticket-header-info"><div><h4>' + ticket.nombre + '</h4><span style="font-size:12px; color:#777;">' + (ticket.colonia || 'Sin Colonia') + '</span></div><div class="tot-piezas">' + totalPzs + ' pzs</div></div>';
        
        if (ticket.domicilio) { htmlTarjeta += '<div class="info-line">📍 ' + ticket.domicilio + '</div>'; }
        if (ticket.telefono) { htmlTarjeta += '<div class="info-line">📞 ' + ticket.telefono + '</div>'; }
        if (ticket.referencias) { htmlTarjeta += '<div class="info-line" style="font-size:11px; color:#777;">📝 Ref: ' + ticket.referencias + '</div>'; }
        
        htmlTarjeta += '<div class="info-line">📅 Entrega: ' + ticket.fecha + '</div>' +
                       '<div class="info-line">CNTRL: ' +
                           '<select class="status-select-inline" style="color: ' + colorPago + '; border-color: ' + colorPago + ';" onchange="window.cambiarEstatusPago(' + ticket.id + ', this.value, this)">' +
                               '<option value="Pendiente" ' + (ticket.pago === 'Pendiente' ? 'selected' : '') + '>Pendiente</option>' +
                               '<option value="PAGADO" ' + (ticket.pago === 'PAGADO' ? 'selected' : '') + '>PAGADO</option>' +
                               '<option value="Pago contra entrega" ' + (ticket.pago === 'Pago contra entrega' ? 'selected' : '') + '>Pago contra entrega</option>' +
                           '</select>' +
                       '</div>' +
                       '<table class="tabla-productos"><tbody>' + filasProd + '</tbody></table>' +
                       '<button type="button" class="btn-print-ticket" onclick="window.imprimirTicket(' + ticket.id + ')">🖨️ Imprimir Ticket</button>';
        
        tarjeta.innerHTML = htmlTarjeta;
        historialTickets.appendChild(tarjeta);
    });
}

filtroFecha.addEventListener('change', function(e) { renderHistorial(e.target.value); });
btnLimpiarFiltro.addEventListener('click', function() { filtroFecha.value = ''; renderHistorial(); });

// Función de Impresión Física Universal e indestructible
window.imprimirTicket = function(id) {
    const ticket = BD_TICKETS.find(function(x) { return x.id === id; });
    if (!ticket || !ticket.nombre) return;

    let listaProductosEstructural = '';
    ticket.productos.forEach(function(p, index) {
listaProductosEstructural += '' + p.sku + ' ' + p.desc + 'CANT: ' + p.cant + '' + (index < ticket.productos.length - 1 ? '' : '') + '';
});
let fechaFormateada = ticket.fecha || '';
if (fechaFormateada.includes('-')) {
const partes = fechaFormateada.split('-');
fechaFormateada = partes + '/' + partes[1] + '/' + partes[0];
}
let htmlFinal = '' +
'FERNANDO MURILLO' +
'PAREDES' +
'PEDIDO' +
'======================' +
'======' +
'' +
'CLIENTE' +
'' + ticket.nombre + '';
if (ticket.domicilio) { htmlFinal += 'DOMICILIO' + ticket.domicilio + ''; }
if (ticket.colonia) { htmlFinal += 'COL:' + ticket.colonia + ''; }
if (ticket.telefono) { htmlFinal += 'TEL:' + ticket.telefono + ''; }
if (ticket.referencias) { htmlFinal += 'REFERENCIAS' + ticket.referencias + ''; }
htmlFinal += 'ENTREGA:' + fechaFormateada + '' +
'PAGO:' + (ticket.pago || '') + '' +
'' +
'----------------------' +
'======' +
'PRODUCTOS' +
'----------------------' +
'======' +
'' + listaProductosEstructural + '' +
'======================' +
'======' +
'
' +
'' +
'----------------------' +
'FIRMA DEL CLIENTE' +
'' +
'' +
'Pedido registrado el
' + (ticket.registroTime || fechaFormateada) +
'' +
'

' +
'';
ticketImpresion.innerHTML = htmlFinal;
setTimeout(function() {
window.print();
}, 250);
}
