// BASE DE DATOS E HISTORIAL SEGURO
var BD_TICKETS = [];
try {
    var memoria = localStorage.getItem('tickets_data');
    if (memoria) {
        BD_TICKETS = JSON.parse(memoria);
    }
} catch(e) {
    BD_TICKETS = [];
}
if (!Array.isArray(BD_TICKETS)) {
    BD_TICKETS = [];
}

var contadorProductos = 0;

// Obtener los elementos de la pantalla
var tabNuevo = document.getElementById('tab-nuevo');
var tabGuardados = document.getElementById('tab-guardados');
var secNuevo = document.getElementById('sec-nuevo');
var secGuardados = document.getElementById('sec-guardados');
var btnAddProd = document.getElementById('btn-add-prod');
var listaProductosInput = document.getElementById('lista-productos-input');
var btnGuardar = document.getElementById('btn-guardar');
var historialTickets = document.getElementById('historial-tickets');
var filtroFecha = document.getElementById('filtro-fecha');
var btnLimpiarFiltro = document.getElementById('btn-limpiar-filtro');
var ticketImpresion = document.getElementById('ticket-impresion');

// Colocar fecha de hoy por defecto en el formulario
if (document.getElementById('ped-fecha')) {
    document.getElementById('ped-fecha').value = new Date().toISOString().split('T')[0];
}

// Navegación de pestañas segura
if (tabNuevo && tabGuardados && secNuevo && secGuardados) {
    tabNuevo.onclick = function() {
        tabNuevo.className = 'tab-btn active';
        tabGuardados.className = 'tab-btn';
        secNuevo.className = 'tab-content active';
        secGuardados.className = 'tab-content';
    };

    tabGuardados.onclick = function() {
        tabNuevo.className = 'tab-btn';
        tabGuardados.className = 'tab-btn active';
        secNuevo.className = 'tab-content';
        secGuardados.className = 'tab-content active';
        renderHistorial();
    };
}

// Agregar renglón de producto dinámico
window.agregarCamposProducto = function() {
    contadorProductos++;
    
    var div = document.createElement('div');
    div.className = 'item-producto-form';
    div.id = 'prod-form-' + contadorProductos;
    
    div.innerHTML = '<button type="button" class="btn-remove" onclick="document.getElementById(\'prod-form-' + contadorProductos + '\').remove()">🗑️</button>' +
                    '<span style="font-size:12px; color:#888;">Producto</span>' +
                    '<div class="form-row" style="margin-top:5px;">' +
                        '<input type="text" class="prod-sku" placeholder="SKU" required>' +
                        '<input type="text" class="prod-desc" placeholder="Descripción del producto" required>' +
                    '</div>' +
                    '<div style="width: 30%;">' +
                        '<label style="font-size:12px; margin-bottom:4px;">Cantidad</label>' +
                        '<input type="number" class="prod-cant" value="1" min="1" required>' +
                    '</div>';
    
    if (listaProductosInput) {
        listaProductosInput.appendChild(div);
    }
};

if (btnAddProd) {
    btnAddProd.onclick = function() { 
        window.agregarCamposProducto(); 
    };
}

// Inicializar el primer producto obligatorio
window.agregarCamposProducto(); 

// Guardar pedidos de forma segura sin congelamientos
if (btnGuardar) {
    btnGuardar.onclick = function() {
        var nombre = document.getElementById('cli-nombre').value.trim();
        if (!nombre) return alert('El nombre del cliente es obligatorio');

        var elementos = document.querySelectorAll('.item-producto-form');
        if (elementos.length === 0) return alert('Debes agregar al menos un producto');

        var productos = [];
        elementos.forEach(function(el) {
            var s = el.querySelector('.prod-sku');
            var d = el.querySelector('.prod-desc');
            var c = el.querySelector('.prod-cant');
            if (s && d && c) {
                productos.push({
                    sku: s.value.trim(),
                    desc: d.value.trim(),
                    cant: parseInt(c.value) || 1
                });
            }
        });

        var ahora = new Date();
        var horaStr = ahora.toLocaleDateString('es-MX') + ', ' + ahora.toLocaleTimeString('es-MX', {hour: '2-digit', minute:'2-digit'});

        var nuevoTicket = {
            id: Date.now(),
            nombre: nombre,
            domicilio: document.getElementById('cli-domicilio').value.trim(),
            colonia: document.getElementById('cli-colonia').value.trim(),
            telefono: document.getElementById('cli-telefono').value.trim(),
            referencias: document.getElementById('cli-referencias').value.trim(),
            fecha: document.getElementById('ped-fecha').value,
            pago: document.getElementById('ped-pago').value,
            productos: productos,
            registroTime: horaStr
        };

        BD_TICKETS.unshift(nuevoTicket); 
        
        try {
            localStorage.setItem('tickets_data', JSON.stringify(BD_TICKETS));
        } catch(e){}

        alert('Pedido guardado exitosamente');
        limpiarFormulario();
        
        if (tabGuardados) {
            tabGuardados.click();
        }
    };
}

function limpiarFormulario() {
    var ids = ['cli-nombre','cli-domicilio','cli-colonia','cli-telefono','cli-referencias'];
    ids.forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.value = '';
    });
    if (listaProductosInput) {
        listaProductosInput.innerHTML = '';
    }
    window.agregarCamposProducto();
}

window.cambiarEstatusPago = function(id, nuevoEstatus, selectEl) {
    var idx = BD_TICKETS.findIndex(function(x) { return x.id === id; });
    if (idx !== -1) {
        BD_TICKETS[idx].pago = nuevoEstatus;
        try {
            localStorage.setItem('tickets_data', JSON.stringify(BD_TICKETS));
        } catch(e){}
        var color = nuevoEstatus === 'PAGADO' ? '#2b8a3e' : (nuevoEstatus === 'Pendiente' ? '#e03131' : '#f59f00');
        if (selectEl) {
            selectEl.style.color = color;
            selectEl.style.borderColor = color;
        }
    }
};

// Dibujar la pestaña de historial
function renderHistorial() {
    if (!historialTickets) return;
    historialTickets.innerHTML = '';
    
    var filtro = filtroFecha ? filtroFecha.value : '';
    var filtrados = BD_TICKETS;
    
    if (filtro) {
        filtrados = BD_TICKETS.filter(function(t) { return t.fecha === filtro; });
    }

    if (filtrados.length === 0) {
        historialTickets.innerHTML = '<p style="text-align:center; color:#999; margin-top:20px;">No se encontraron pedidos.</p>';
        return;
    }

    filtrados.forEach(function(ticket) {
        if (!ticket || !ticket.nombre || !ticket.productos) return;

        var tarjeta = document.createElement('div');
        tarjeta.className = 'ticket-card';
        
        var filasProd = '';
        var totalPzs = 0;
        ticket.productos.forEach(function(p) {
            filasProd += '<tr><td>' + p.sku + ' • ' + p.desc + '</td><td class="td-der">x' + p.cant + '</td></tr>';
            totalPzs += p.cant;
        });

        var colorPago = ticket.pago === 'PAGADO' ? '#2b8a3e' : (ticket.pago === 'Pendiente' ? '#e03131' : '#f59f00');

        var html = '<div class="ticket-header-info"><div><h4>' + ticket.nombre + '</h4><span style="font-size:12px; color:#777;">' + (ticket.colonia || 'Sin Colonia') + '</span></div><div class="tot-piezas">' + totalPzs + ' pzs</div></div>';
        
        if (ticket.domicilio) { html += '<div class="info-line">📍 ' + ticket.domicilio + '</div>'; }
        if (ticket.telefono) { html += '<div class="info-line">📞 ' + ticket.telefono + '</div>'; }
        if (ticket.referencias) { html += '<div class="info-line" style="font-size:11px; color:#777;">📝 Ref: ' + ticket.referencias + '</div>'; }
        
        html += '<div class="info-line">📅 Entrega: ' + ticket.fecha + '</div>' +
                '<div class="info-line">CNTRL: ' +
                    '<select class="status-select-inline" style="color: ' + colorPago + '; border-color: ' + colorPago + ';" onchange="window.cambiarEstatusPago(' + ticket.id + ', this.value, this)">' +
                        '<option value="Pendiente" ' + (ticket.pago === 'Pendiente' ? 'selected' : '') + '>Pendiente</option>' +
                        '<option value="PAGADO" ' + (ticket.pago === 'PAGADO' ? 'selected' : '') + '>PAGADO</option>' +
                        '<option value="Pago contra entrega" ' + (ticket.pago === 'Pago contra entrega' ? 'selected' : '') + '>Pago contra entrega</option>' +
                    '</select>' +
                '</div>' +
                '<table class="tabla-productos"><tbody>' + filasProd + '</tbody></table>' +
                '<button type="button" class="btn-print-ticket" onclick="window.imprimirTicket(' + ticket.id + ')">🖨️ Imprimir Ticket</button>';
        
        tarjeta.innerHTML = html;
        historialTickets.appendChild(tarjeta);
    });
}

if (filtroFecha) {
    filtroFecha.onchange = function(e) { renderHistorial(e.target.value); };
}
if (btnLimpiarFiltro) {
    btnLimpiarFiltro.onclick = function() { filtroFecha.value = ''; renderHistorial(); };
}

// Lanzar impresión física del ticket
window.imprimirTicket = function(id) {
    var ticket = BD_TICKETS.find(function(x) { return x.id === id; });
    if (!ticket || !ticket.nombre) return;

    var listaProductosEstructural = '';
    ticket.productos.forEach(function(p, index) {
        listaProductosEstructural += '<div style="margin-bottom: 8px;"><div>' + p.sku + ' ' + p.desc + '</div><div>CANT: ' + p.cant + '</div>' + (index < ticket.productos.length - 1 ? '<div style="border-top:1px dashed #000; margin: 4px 0; width:100%;"></div>' : '') + '</div>';
    });

    var htmlFinal = '<div style="font-family: \'Courier New\', Courier, monospace; font-size: 13px; font-weight: bold; color: #000; line-height: 1.3; text-transform: uppercase;">' +
'FERNANDO MURILLO' +
'PAREDES' +
'======================' +
'======' +
'' +
'CLIENTE' + t.nombre + '' +
(t.domicilio ? 'DOMICILIO' + t.domicilio + '' : '') +
(t.colonia ? 'COL:' + t.colonia + '' : '') +
(t.telefono ? 'TEL:' + t.telefono + '' : '') +
(t.referencias ? 'REFERENCIAS' + t.referencias + '' : '') +
'ENTREGA:' + fechaFmt + '' +
'PAGO:' + t.pago + '' +
'' +
'----------------------' +
'======' +
'PRODUCTOS' +
'----------------------' +
'======' +
'' + pHtml + '' +
'======================' +
'======' +
'' +
'----------------------' +
'FIRMA DEL CLIENTE' +
'' +
'Pedido registrado el
' + t.registroTime + '' +
'

' +
'';
}
setTimeout(function() {
window.print();
}, 250);
};
