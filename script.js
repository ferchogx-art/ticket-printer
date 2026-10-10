// BASE DE DATOS MODERNA Y SEGURA
let BD_TICKETS = [];
try {
    const datosLocales = localStorage.getItem('tickets_data');
    if (datosLocales) {
        BD_TICKETS = JSON.parse(datosLocales);
    }
} catch (e) {
    console.log('Almacenamiento local restringido. Usando memoria temporal.');
    BD_TICKETS = [];
}

let contadorProductos = 0;

// Referencias seguras a la pantalla
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

// Colocar fecha de hoy de manera segura
const inputFechaPedido = document.getElementById('ped-fecha');
if (inputFechaPedido) {
    inputFechaPedido.value = new Date().toISOString().split('T')[0];
}

// Navegación limpia de pestañas
function activarPestañaNuevo() {
    if (tabNuevo && tabGuardados && secNuevo && secGuardados) {
        tabNuevo.classList.add('active');
        tabGuardados.classList.remove('active');
        secNuevo.classList.add('active');
        secGuardados.classList.remove('active');
    }
}

function activarPestañaGuardados() {
    if (tabNuevo && tabGuardados && secNuevo && secGuardados) {
        tabNuevo.classList.remove('active');
        tabGuardados.classList.add('active');
        secNuevo.classList.remove('active');
        secGuardados.classList.add('active');
        renderHistorial();
    }
}

if (tabNuevo) tabNuevo.onclick = activarPestañaNuevo;
if (tabGuardados) tabGuardados.onclick = activarPestañaGuardados;

// Agregar productos dinámicos
window.agregarCamposProducto = function(sku = '', desc = '', cant = 1) {
    contadorProductos++;
    
    const div = document.createElement('div');
    div.className = 'item-producto-form';
    div.id = 'prod-form-' + contadorProductos;
    
    div.innerHTML = '<button type="button" class="btn-remove" onclick="const el=document.getElementById(\'prod-form-' + contadorProductos + '\'); if(el)el.remove();">🗑️</button>' +
        '<div class="form-row">' +
        '<input type="text" class="prod-sku" placeholder="SKU" value="' + sku + '">' +
        '<input type="text" class="prod-desc" placeholder="Producto" value="' + desc + '">' +
        '</div>' +
        '<div style="width:30%; margin-top:5px;"><input type="number" class="prod-cant" value="' + cant + '" min="1"></div>';
        
    if (listaProductosInput) {
        listaProductosInput.appendChild(div);
    }
};

if (btnAddProd) {
    btnAddProd.onclick = function() {
        window.agregarCamposProducto();
    };
}

// Cargar el primer producto en blanco de inmediato
window.agregarCamposProducto();

// Guardar pedidos de forma segura
if (btnGuardar) {
    btnGuardar.onclick = function() {
        const inputNombre = document.getElementById('cli-nombre');
        const nom = inputNombre ? inputNombre.value.trim() : '';
        if (!nom) return alert("El nombre del cliente es obligatorio.");
        
        const pElements = document.querySelectorAll('.item-producto-form');
        if (pElements.length === 0) return alert("Debes agregar al menos un producto.");

        const prods = [];
        pElements.forEach(function(el) {
            const skuVal = el.querySelector('.prod-sku').value.trim();
            const descVal = el.querySelector('.prod-desc').value.trim();
            const cantVal = parseInt(el.querySelector('.prod-cant').value) || 1;
            if (skuVal || descVal) {
                prods.push({ sku: skuVal, desc: descVal, cant: cantVal });
            }
        });

        const ahora = new Date();
        const timeStr = ahora.toLocaleDateString('es-MX') + ', ' + ahora.toLocaleTimeString('es-MX', {hour:'2-digit', minute:'2-digit'});

        const nuevoPedido = {
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
        } catch (e) {
            console.log('Error de almacenamiento.');
        }
        
        alert("¡Pedido guardado exitosamente!"); 
        limpiarFormulario(); 
        activarPestañaGuardados();
    };
}

function limpiarFormulario() {
    const campos = ['cli-nombre','cli-domicilio','cli-colonia','cli-telefono','cli-referencias'];
    campos.forEach(function(id) {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    if (listaProductosInput) {
        listaProductosInput.innerHTML = ''; 
    }
    window.agregarCamposProducto();
}

window.cambiarEstatusPago = function(id, est) {
    const idx = BD_TICKETS.findIndex(function(x) { return x.id === id; });
    if (idx !== -1) { 
        BD_TICKETS[idx].pago = est; 
        try { localStorage.setItem('tickets_data', JSON.stringify(BD_TICKETS)); } catch(e){}
    }
};

// Mostrar el historial de tickets guardados
function renderHistorial(f = '') {
    if (!historialTickets) return;
    historialTickets.innerHTML = '';
    
    const filtrados = f ? BD_TICKETS.filter(function(t) { return t.fecha === f; }) : BD_TICKETS;
    
    if (filtrados.length === 0) { 
        historialTickets.innerHTML = '<p style="text-align:center;color:#999;padding-top:20px;">No se encontraron registros de pedidos.</p>'; 
        return; 
    }

    filtrados.forEach(function(t) {
        let rP = ''; 
        t.productos.forEach(function(p) {
            rP += '<tr><td>' + p.sku + ' • ' + p.desc + '</td><td class="td-der">x' + p.cant + '</td></tr>';
        });
        
        const tarjeta = document.createElement('div');
        tarjeta.className = 'ticket-card';
        
        tarjeta.innerHTML = '<div class="ticket-header-info"><h4>' + t.nombre + '</h4></div>' +
            '<div class="info-line">📅 Entrega: ' + t.fecha + '</div>' +
            '<div class="info-line">💳 Pago: ' +
                '<select onchange="window.cambiarEstatusPago(' + t.id + ', this.value)">' +
                    '<option value="Pendiente" ' + (t.pago === 'Pendiente' ? 'selected' : '') + '>Pendiente</option>' +
                    '<option value="PAGADO" ' + (t.pago === 'PAGADO' ? 'selected' : '') + '>PAGADO</option>' +
                    '<option value="Contra Entrega" ' + (t.pago === 'Contra Entrega' ? 'selected' : '') + '>Contra Entrega</option>' +
                '</select>' +
            '</div>' +
            '<table class="tabla-productos"><tbody>' + rP + '</tbody></table>' +
            '<button class="btn-print-ticket" onclick="window.imprimirTicket(' + t.id + ')">🖨️ Imprimir Ticket</button>';
            
        historialTickets.appendChild(tarjeta);
    });
}

if (filtroFecha) {
    filtroFecha.onchange = function(e) { renderHistorial(e.target.value); };
}
if (btnLimpiarFiltro) {
    btnLimpiarFiltro.onclick = function() { if(filtroFecha) filtroFecha.value = ''; renderHistorial(); };
}

// Acción de impresión limpia y universal
window.imprimirTicket = function(id) {
    const t = BD_TICKETS.find(function(x) { return x.id === id; });
    if (!t) return;

    let pHtml = '';
    t.productos.forEach(function(p) {
        pHtml += '<div style="margin-bottom:12px;"><div>' + p.sku + ' ' + p.desc + '</div><div>CANT: ' + p.cant + '</div></div>';
    });

    let fechaFmt = t.fecha;
    if (t.fecha && t.fecha.indexOf('-') !== -1) {
        const partes = t.fecha.split('-');
        fechaFmt = partes[2] + '/' + partes[1] + '/' + partes[0];
    }

    const htmlFinal = '<div style="font-family:\'Courier New\',Courier,monospace;font-size:13px;font-weight:bold;color:#000;line-height:1.3;text-transform:uppercase;">' +
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
'' +
'Pedido registrado el
' + (t.registroTime || fechaFmt) +
'' +
'

' +
'';
if (ticketImpresion) {
ticketImpresion.innerHTML = htmlFinal;
}
setTimeout(function() {
window.print();
}, 300);
};
