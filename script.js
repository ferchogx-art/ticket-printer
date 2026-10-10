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

// Establecer fecha de hoy por defecto
document.getElementById('ped-fecha').value = new Date().toISOString().split('T')[0];

// Funciones de navegación táctil seguras
function irANuevo() {
    tabNuevo.classList.add('active');
    tabGuardados.classList.remove('active');
    secNuevo.classList.add('active');
    secGuardados.classList.remove('active');
}

function irAGuardados() {
    tabNuevo.classList.remove('active');
    tabGuardados.classList.add('active');
    secNuevo.classList.remove('active');
    secGuardados.classList.add('active');
    renderHistorial();
}

// Asignación de clics compatibles con Computadora y Celular
tabNuevo.addEventListener('click', irANuevo);
tabGuardados.addEventListener('click', irAGuardados);

// Agregar bloque de producto dinámico
function agregarCamposProducto(sku = '', desc = '', cant = 1) {
    contadorProductos++;
    const div = document.createElement('div');
    div.className = 'item-producto-form';
    div.id = 'prod-form-' + contadorProductos;
    
    div.innerHTML = '<button type="button" class="btn-remove btn-eliminar-dinamico">🗑️</button>' +
                    '<span style="font-size:12px; color:#888;">Producto</span>' +
                    '<div class="form-row" style="margin-top:5px;">' +
                        '<input type="text" class="prod-sku" placeholder="SKU" value="' + sku + '" required>' +
                        '<input type="text" class="prod-desc" placeholder="Descripción del producto" value="' + desc + '" required>' +
                    '</div>' +
                    '<div style="width: 30%;">' +
                        '<label style="font-size:12px; margin-bottom:4px;">Cantidad</label>' +
                        '<input type="number" class="prod-cant" value="' + cant + '" min="1" required>' +
                    '</div>';
    
    listaProductosInput.appendChild(div);

    // Permitir eliminar el campo al dar clic
    div.querySelector('.btn-eliminar-dinamico').addEventListener('click', function() {
        div.remove();
    });
}

// Inicializar y vincular botón de agregar producto
btnAddProd.addEventListener('click', function() { agregarCamposProducto(); });
agregarCamposProducto(); 

// Guardar Pedido en LocalStorage
btnGuardar.addEventListener('click', function() {
    const nombre = document.getElementById('cli-nombre').value.trim();
    if (!nombre) return alert('El nombre del cliente es obligatorio');

    const productosElements = document.querySelectorAll('.item-producto-form');
    if (productosElements.length === 0) return alert('Debes agregar al menos un producto');

    const productos = [];

    productosElements.forEach(function(el) {
        productos.push({
            sku: el.querySelector('.prod-sku').value.trim(),
            desc: el.querySelector('.prod-desc').value.trim(),
            cant: parseInt(el.querySelector('.prod-cant').value) || 1
        });
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
    
    localStorage.setItem('tickets_data', JSON.stringify(BD_TICKETS));

    alert('Pedido guardado exitosamente');
    limpiarFormulario();
    irAGuardados();
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

// Renderizar el historial de tickets guardados en pantalla
function renderHistorial(filtro = '') {
    historialTickets.innerHTML = '';
    let filtrados = filtro ? BD_TICKETS.filter(function(t) { return t.fecha === filtro; }) : BD_TICKETS;

    if (filtrados.length === 0) {
        historialTickets.innerHTML = '<p style="text-align:center; color:#999; margin-top:20px;">No se encontraron pedidos.</p>';
        return;
    }

    filtrados.forEach(function(ticket) {
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
                           '<select class="status-select-inline select-cambiar-pago" style="color: ' + colorPago + '; border-color: ' + colorPago + ';">' +
                               '<option value="Pendiente" ' + (ticket.pago === 'Pendiente' ? 'selected' : '') + '>Pendiente</option>' +
                               '<option value="PAGADO" ' + (ticket.pago === 'PAGADO' ? 'selected' : '') + '>PAGADO</option>' +
                               '<option value="Pago contra entrega" ' + (ticket.pago === 'Pago contra entrega' ? 'selected' : '') + '>Pago contra entrega</option>' +
                           '</select>' +
                       '</div>' +
                       '<table class="tabla-productos"><tbody>' + filasProd + '</tbody></table>' +
                       '<button type="button" class="btn-print-ticket btn-imprimir-dinamico">🖨️ Imprimir Ticket</button>';
        
        tarjeta.innerHTML = htmlTarjeta;
        historialTickets.appendChild(tarjeta);

        // Controlar el cambio de pago en la lista
        tarjeta.querySelector('.select-cambiar-pago').addEventListener('change', function(e) {
            const nuevoEstatus = e.target.value;
            const index = BD_TICKETS.findIndex(function(x) { return x.id === ticket.id; });
            if (index !== -1) {
                BD_TICKETS[index].pago = nuevoEstatus;
                localStorage.setItem('tickets_data', JSON.stringify(BD_TICKETS));
                const nuevoColor = nuevoEstatus === 'PAGADO' ? '#2b8a3e' : (nuevoEstatus === 'Pendiente' ? '#e03131' : '#f59f00');
                e.target.style.color = nuevoColor;
                e.target.style.borderColor = nuevoColor;
            }
        });

        // Controlar el botón de impresión
        tarjeta.querySelector('.btn-imprimir-dinamico').addEventListener('click', function() {
            ejecutarImpresionFisica(ticket.id);
        });
    });
}

// Filtros de búsqueda
filtroFecha.addEventListener('change', function(e) { renderHistorial(e.target.value); });
btnLimpiarFiltro.addEventListener('click', function() { filtroFecha.value = ''; renderHistorial(); });

// Armado de formato de impresión
function ejecutarImpresionFisica(id) {
    const ticket = BD_TICKETS.find(function(x) { return x.id === id; });
    if (!ticket) return;

    let listaProductosEstructural = '';
    let totalPzs = 0;
    ticket.productos.forEach(function(p, index) {
        listaProductosEstructural += '<div style="margin-bottom: 8px;"><div>' + p.sku + ' ' + p.desc + '</div><div>CANT: ' + p.cant + '</div>' + (index < ticket.productos.length - 1 ? '<div style="border-top:1px dashed #000; margin: 4px 0; width:100%;"></div>' : '') + '</div>';
        totalPzs += p.cant;
    });

    let fechaFormateada = ticket.fecha;
    if (ticket.fecha && ticket.fecha.includes('-')) {
        const partes = ticket.fecha.split('-');
        fechaFormateada = partes[2] + '/' + partes[1] + '/' + partes[0];
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
'PAGO:' + ticket.pago + '' +
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
