// BASE DE DATOS ULTRA COMPATIBLE
var BD_TICKETS = [];
try {
    BD_TICKETS = JSON.parse(localStorage.getItem('tickets_data')) || [];
} catch (e) {
    BD_TICKETS = [];
}

var contadorProductos = 0;

// Obtener elementos de la pantalla
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

// Control de pestañas unificado para PC y Celular
if (tabNuevo) {
    tabNuevo.onclick = function() {
        tabNuevo.className = 'tab-btn active';
        tabGuardados.className = 'tab-btn';
        secNuevo.className = 'tab-content active';
        secGuardados.className = 'tab-content';
    };
}

if (tabGuardados) {
    tabGuardados.onclick = function() {
        tabNuevo.className = 'tab-btn';
        tabGuardados.className = 'tab-btn active';
        secNuevo.className = 'tab-content';
        secGuardados.className = 'tab-content active';
        renderHistorial();
    };
}

// Agregar bloque de producto a la lista
window.agregarCamposProducto = function(sku, desc, cant) {
    contadorProductos++;
    var vSku = sku || '';
    var vDesc = desc || '';
    var vCant = cant || 1;
    
    var div = document.createElement('div');
    div.className = 'item-producto-form';
    div.id = 'prod-form-' + contadorProductos;
    
    div.innerHTML = '<button type="button" class="btn-remove" onclick="document.getElementById(\'prod-form-' + contadorProductos + '\').remove()">🗑️</button>' +
        '<div class="form-row">' +
        '<input type="text" class="prod-sku" placeholder="SKU" value="' + vSku + '">' +
        '<input type="text" class="prod-desc" placeholder="Producto" value="' + vDesc + '">' +
        '</div>' +
        '<div style="width:30%; margin-top:5px;"><input type="number" class="prod-cant" value="' + vCant + '" min="1"></div>';
        
    listaProductosInput.appendChild(div);
};

if (btnAddProd) {
    btnAddProd.onclick = function() {
        window.agregarCamposProducto();
    };
}

// Inicializar primer producto en blanco
window.agregarCamposProducto();

// Guardar pedidos de forma segura
if (btnGuardar) {
    btnGuardar.onclick = function() {
        var nom = document.getElementById('cli-nombre').value.trim();
        if (!nom) return alert("Nombre obligatorio");
        
        var pElements = document.querySelectorAll('.item-producto-form');
        if (pElements.length === 0) return alert("Agrega un producto");

        var prods = [];
        pElements.forEach(function(el) {
            var skuVal = el.querySelector('.prod-sku').value.trim();
            var descVal = el.querySelector('.prod-desc').value.trim();
            var cantVal = parseInt(el.querySelector('.prod-cant').value) || 1;
            if(skuVal || descVal) {
                prods.push({ sku: skuVal, desc: descVal, cant: cantVal });
            }
        });

        var ahora = new Date();
        var timeStr = ahora.toLocaleDateString('es-MX') + ', ' + ahora.toLocaleTimeString('es-MX', {hour:'2-digit', minute:'2-digit'});

        var nuevoPedido = {
            id: Date.now(), 
            nombre: nom,
            domicilio: document.getElementById('cli-domicilio').value.trim(),
            colonia: document.getElementById('cli-colonia').value.trim(),
            telefono: document.getElementById('cli-telefono').value.trim(),
            referencias: document.getElementById('cli-referencias').value.trim(),
            fecha: document.getElementById('ped-fecha').value,
            pago: document.getElementById('ped-pago').value,
            productos: prods, 
            registroTime: timeStr
        };

        BD_TICKETS.unshift(nuevoPedido);
        
        try {
            localStorage.setItem('tickets_data', JSON.stringify(BD_TICKETS));
        } catch (e) {}
        
        alert("Guardado correctamente"); 
        limpiarFormulario(); 
        if (tabGuardados) tabGuardados.click();
    };
}

function limpiarFormulario() {
    var campos = ['cli-nombre','cli-domicilio','cli-colonia','cli-telefono','cli-referencias'];
    campos.forEach(function(id) {
        var el = document.getElementById(id);
        if(el) el.value = '';
    });
    listaProductosInput.innerHTML = ''; 
    window.agregarCamposProducto();
}

window.cambiarEstatusPago = function(id, est) {
    var idx = BD_TICKETS.findIndex(function(x) { return x.id === id; });
    if (idx !== -1) { 
        BD_TICKETS[idx].pago = est; 
        try { localStorage.setItem('tickets_data', JSON.stringify(BD_TICKETS)); } catch(e){}
    }
};

// Renderizar historial sin errores cruzados
function renderHistorial(f) {
    historialTickets.innerHTML = '';
    var filtro = f || '';
    var fil = filtro ? BD_TICKETS.filter(function(t) { return t.fecha === filtro; }) : BD_TICKETS;
    
    if (fil.length === 0) { 
        historialTickets.innerHTML = '<p style="text-align:center;color:#999;padding-top:20px;">No hay registros</p>'; 
        return; 
    }

    fil.forEach(function(t) {
        var rP = ''; 
        t.productos.forEach(function(p) { 
            rP += '<tr><td>' + p.sku + ' • ' + p.desc + '</td><td class="td-der">x' + p.cant + '</td></tr>'; 
        });
        
        var tarjeta = document.createElement('div');
        tarjeta.className = 'ticket-card';
        
        var htmlTarjeta = '<div class="ticket-header-info"><h4>' + t.nombre + '</h4></div>' +
            '<div class="info-line">📅 Entrega: ' + t.fecha + '</div>' +
            '<div class="info-line">💳 Pago: ' +
                '<select onchange="cambiarEstatusPago(' + t.id + ', this.value)">' +
                    '<option value="Pendiente" ' + (t.pago === 'Pendiente' ? 'selected' : '') + '>Pendiente</option>' +
                    '<option value="PAGADO" ' + (t.pago === 'PAGADO' ? 'selected' : '') + '>PAGADO</option>' +
                    '<option value="Contra Entrega" ' + (t.pago === 'Contra Entrega' ? 'selected' : '') + '>Contra Entrega</option>' +
                '</select>' +
            '</div>' +
            '<table class="tabla-productos"><tbody>' + rP + '</tbody></table>' +
            '<button class="btn-print-ticket" onclick="imprimirTicket(' + t.id + ')">🖨️ Imprimir</button>';
            
        tarjeta.innerHTML = htmlTarjeta;
        historialTickets.appendChild(tarjeta);
    });
}

if (filtroFecha) {
    filtroFecha.onchange = function(e) { renderHistorial(e.target.value); };
}
if (btnLimpiarFiltro) {
    btnLimpiarFiltro.onclick = function() { filtroFecha.value = ''; renderHistorial(); };
}

// Acción de impresión física indestructible y universal
window.imprimirTicket = function(id) {
    var t = BD_TICKETS.find(function(x) { return x.id === id; });
    if (!t) return;

    var pHtml = '';
    t.productos.forEach(function(p) {
        pHtml += '<div style="margin-bottom:12px;"><div>' + p.sku + ' ' + p.desc + '</div><div>CANT: ' + p.cant + '</div></div>';
    });

    var fechaFmt = t.fecha;
    if (t.fecha && t.fecha.indexOf('-') !== -1) {
        var p = t.fecha.split('-');
        fechaFmt = p[2] + '/' + p[1] + '/' + p[0];
    }

    var htmlFinal = '<div style="font-family:\'Courier New\',Courier,monospace;font-size:13px;font-weight:bold;color:#000;line-height:1.3;text-transform:uppercase;">' +
        '<div style="text-align:center;font-size:14px;">FERNANDO MURILLO</div>' +
        '<div style="text-align:center;font-size:13px;margin-bottom:5px;">PAREDES</div>' +
        '<div style="text-align:center;letter-spacing:-1px;">======================</div>' +
        '<div style="text-align:center;">======</div>' +
        '<div style="margin:8px 0;">' +
            '<div style="font-size:11px;margin-top:5px;">CLIENTE</div><div style="margin-bottom:4px;">' + t.nombre + '</div>';
            
    if (t.domicilio) { htmlFinal += '<div style="font-size:11px;margin-top:5px;">DOMICILIO</div><div style="margin-bottom:4px;">' + t.domicilio + '</div>'; }
    if (t.colonia) { htmlFinal += '<div style="font-size:11px;margin-top:5px;">COL:</div><div style="margin-bottom:4px;">' + t.colonia + '</div>'; }
    if (t.telefono) { htmlFinal += '<div style="font-size:11px;margin-top:5px;">TEL:</div><div style="margin-bottom:4px;">' + t.telefono + '</div>'; }
    if (t.referencias) { htmlFinal += '<div style="font-size:11px;margin-top:5px;">REFERENCIAS</div><div style="margin-bottom:4px;">' + t.referencias + '</div>'; }
            
    htmlFinal += '<div style="font-size:11px;margin-top:5px;">ENTREGA:</div><div style="margin-bottom:4px;">' + fechaFmt + '</div>' +
            '<div style="font-size:11px;margin-top:5px;">PAGO:</div><div style="margin-bottom:4px;">' + t.pago + '</div>' +
        '</div>' +
        '<div style="text-align:center;letter-spacing:-1px;">----------------------</div>' +
        '<div style="text-align:center;">======</div>' +
        '<div style="text-align:center;font-size:14px;">PRODUCTOS</div>' +
        '<div style="text-align:center;letter-spacing:-1px;">----------------------</div>' +
        '<div style="text-align:center;">======</div>' +
        '<div style="margin:8px 0;">' + pHtml + '</div>' +
        '<div style="text-align:center;letter-spacing:-1px;">======================</div>' +
        '<div style="text-align:center;">======</div>' +
'' +
'----------------------' +
'FIRMA DEL CLIENTE' +
'' +
'' +
'Pedido registrado el
' + (t.registroTime || fechaFmt) +
'' +
'

' +
'';
ticketImpresion.innerHTML = htmlFinal;
setTimeout(function() {
window.print();
}, 300);
}
