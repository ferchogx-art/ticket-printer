// RED DE SEGURIDAD PARA CELULARES: Si localStorage está bloqueado (Modo incógnito), usamos memoria temporal
let BD_TICKETS = [];
try {
    BD_TICKETS = JSON.parse(localStorage.getItem('tickets_data')) || [];
} catch (e) {
    console.log('Navegación privada detectada. Usando memoria temporal.');
    BD_TICKETS = [];
}

let contadorProductos = 0;

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

document.getElementById('ped-fecha').value = new Date().toISOString().split('T')[0];

tabNuevo.addEventListener('click', function() { switchTab(tabNuevo, secNuevo); });
tabGuardados.addEventListener('click', function() { switchTab(tabGuardados, secGuardados); renderHistorial(); });

function switchTab(tA, sA) {
    [tabNuevo, tabGuardados].forEach(function(t) { t.classList.remove('active'); });
    [secNuevo, secGuardados].forEach(function(s) { s.classList.remove('active'); });
    tA.classList.add('active'); sA.classList.add('active');
}

window.agregarCamposProducto = function(sku, desc, cant) {
    contadorProductos++;
    const vSku = sku || '';
    const vDesc = desc || '';
    const vCant = cant || 1;
    
    const div = document.createElement('div');
    div.className = 'item-producto-form';
    div.id = 'prod-form-' + contadorProductos;
    div.innerHTML = '<button type="button" class="btn-remove" onclick="document.getElementById(\'prod-form-' + contadorProductos + '\').remove()">🗑️</button>' +
        '<div class="form-row">' +
        '<input type="text" class="prod-sku" placeholder="SKU" value="' + vSku + '">' +
        '<input type="text" class="prod-desc" placeholder="Producto" value="' + vDesc + '">' +
        '</div>' +
        '<div style="width:30%; margin-top:5px;"><input type="number" class="prod-cant" value="' + vCant + '" min="1"></div>';
    listaProductosInput.appendChild(div);
}

btnAddProd.addEventListener('click', function() { window.agregarCamposProducto(); });
window.agregarCamposProducto();

btnGuardar.addEventListener('click', function() {
    const nom = document.getElementById('cli-nombre').value.trim();
    if (!nom) return alert("Nombre obligatorio");
    const pElements = document.querySelectorAll('.item-producto-form');
    if (pElements.length === 0) return alert("Agrega un producto");

    const prods = [];
    pElements.forEach(function(el) {
        prods.push({
            sku: el.querySelector('.prod-sku').value.trim(),
            desc: el.querySelector('.prod-desc').value.trim(),
            cant: parseInt(el.querySelector('.prod-cant').value) || 1
        });
    });

    const ahora = new Date();
    const timeStr = ahora.toLocaleDateString('es-MX') + ', ' + ahora.toLocaleTimeString('es-MX', {hour:'2-digit', minute:'2-digit'});

    const nuevoPedido = {
        id: Date.now(), nombre: nom,
        domicilio: document.getElementById('cli-domicilio').value.trim(),
        colonia: document.getElementById('cli-colonia').value.trim(),
        telefono: document.getElementById('cli-telefono').value.trim(),
        referencias: document.getElementById('cli-referencias').value.trim(),
        fecha: document.getElementById('ped-fecha').value,
        pago: document.getElementById('ped-pago').value,
        productos: prods, registroTime: timeStr
    };

    BD_TICKETS.unshift(nuevoPedido);
    
    try {
        localStorage.setItem('tickets_data', JSON.stringify(BD_TICKETS));
    } catch (e) {
        console.log('No se pudo guardar permanentemente por modo incógnito.');
    }
    
    alert("Guardado"); 
    limpiarFormulario(); 
    tabGuardados.click();
});

function limpiarFormulario() {
    ['cli-nombre','cli-domicilio','colonia','cli-telefono','cli-referencias'].forEach(function(id) {
        const el = document.getElementById(id);
        if(el) el.value = '';
    });
    listaProductosInput.innerHTML = ''; 
    window.agregarCamposProducto();
}

window.cambiarEstatusPago = function(id, est) {
    const idx = BD_TICKETS.findIndex(function(x) { return x.id === id; });
    if (idx !== -1) { 
        BD_TICKETS[idx].pago = est; 
        try { localStorage.setItem('tickets_data', JSON.stringify(BD_TICKETS)); } catch(e){}
    }
}

function renderHistorial(f) {
    historialTickets.innerHTML = '';
    const filtro = f || '';
    let fil = filtro ? BD_TICKETS.filter(function(t) { return t.fecha === filtro; }) : BD_TICKETS;
    if (fil.length === 0) { historialTickets.innerHTML = '<p style="text-align:center;color:#999;padding-top:20px;">Vacío</p>'; return; }

    fil.forEach(function(t) {
        let rP = ''; 
        t.productos.forEach(function(p) { 
            rP += '<tr><td>' + p.sku + ' • ' + p.desc + '</td><td class="td-der">x' + p.cant + '</td></tr>'; 
        });
        
        const tarjeta = document.createElement('div');
        tarjeta.className = 'ticket-card';
        tarjeta.innerHTML = `
            <div class="ticket-header-info"><h4>${t.nombre}</h4></div>
            <div class="info-line">📅 Entrega: ${t.fecha}</div>
            <div class="info-line">💳 Pago: 
                <select onchange="cambiarEstatusPago(${t.id}, this.value)">
                    <option value="Pendiente" ${t.pago==='Pendiente'?'selected':''}>Pendiente</option>
                    <option value="PAGADO" ${t.pago==='PAGADO'?'selected':''}>PAGADO</option>
                    <option value="Contra Entrega" ${t.pago==='Contra Entrega'?'selected':''}>Contra Entrega</option>
                </select>
            </div>
            <table class="tabla-productos"><tbody>${rP}</tbody></table>
            <button class="btn-print-ticket" onclick="imprimirTicket(${t.id})">🖨️ Imprimir</button>
        `;
        historialTickets.appendChild(tarjeta);
    });
}

filtroFecha.addEventListener('change', function(e) { renderHistorial(e.target.value); });
btnLimpiarFiltro.addEventListener('click', function() { filtroFecha.value = ''; renderHistorial(); });

window.imprimirTicket = function(id) {
    const t = BD_TICKETS.find(function(x) { return x.id === id; });
    if (!t) return;

    let pHtml = '';
    t.productos.forEach(function(p) {
        pHtml += '<div style="margin-bottom:12px;"><div>' + p.sku + ' ' + p.desc + '</div><div>CANT: ' + p.cant + '</div></div>';
    });

    let fechaFmt = t.fecha;
    if (t.fecha && t.fecha.includes('-')) {
        const p = t.fecha.split('-');
        fechaFmt = p[2] + '/' + p[1] + '/' + p[0];
    }

    let htmlFinal = '<div style="font-family:\'Courier New\',Courier,monospace;font-size:13px;font-weight:bold;color:#000;line-height:1.3;text-transform:uppercase;">' +
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
        '<div style="text-align:center;margin-top:25px;margin-bottom:20px;">' +
            '<div>----------------------</div>' +
            '<div style="font-size:11px;margin-top:2px;">FIRMA DEL CLIENTE</div>' +
        '</div>' +
        '<div style="text-align:center;font-size:11px;text-transform:none;">' +
            'Pedido registrado el<br>' + (t.registroTime || fechaFmt) +
        '</div>' +
        '<br><br>' +
    '</div>';
    
    ticketImpresion.innerHTML = htmlFinal;
    
    setTimeout(function() {
        window.print();
    }, 300);
}
