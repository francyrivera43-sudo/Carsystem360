document.addEventListener('DOMContentLoaded', () => {
    // --- BASE DE DATOS DEL INVENTARIO EN BODEGA ---
    const BASE_DATOS_INVENTARIO = [
        { id: "FA-101", nombre: "Filtro de Aceite sintético (Ref. FA-101)", categoria: "Filtros", precio: 18500, stock: 42 },
        { id: "FA-205", nombre: "Filtro de Aire Motor (Ref. FA-205)", categoria: "Filtros", precio: 32000, stock: 25 },
        { id: "FC-310", nombre: "Filtro de Combustible Inyección (Ref. FC-310)", categoria: "Filtros", precio: 45000, stock: 9 },
        { id: "FH-402", nombre: "Filtro de Habitáculo Cabina (Ref. FH-402)", categoria: "Filtros", precio: 29000, stock: 0 },
        { id: "PF-120", nombre: "Pastillas de Freno Delanteras Ceramic (Ref. PF-120)", categoria: "Frenos", precio: 98000, stock: 18 },
        { id: "PF-125", nombre: "Pastillas de Freno Traseras (Ref. PF-125)", categoria: "Frenos", precio: 85000, stock: 6 }
    ];

    const form = document.getElementById('cotizacionForm');
    const tablaCotizaciones = document.getElementById('tablaCotizaciones').querySelector('tbody');
    const tablaInventario = document.getElementById('tablaInventario').querySelector('tbody');
    const filtroInput = document.getElementById('filtroTabla');
    const selectRepuesto = document.getElementById('repuesto');
    const cantidadInput = document.getElementById('cantidad');
    const stockBadge = document.getElementById('stockBadge');
    let contadorId = 107;

    let listaCotizaciones = [
        { id: 101, cliente: "Taller Mecánico El Chispas", repuesto: "Pastillas de Freno Delanteras Ceramic (Ref. PF-120)", cantidad: 2, precioUnitario: 98000, estado: "En Proceso" },
        { id: 102, cliente: "Autoservicios del Valle", repuesto: "Filtro de Aire Motor (Ref. FA-205)", cantidad: 4, precioUnitario: 32000, estado: "Completado" },
        { id: 103, cliente: "Lubricantes y Frenos Medellín", repuesto: "Filtro de Aceite sintético (Ref. FA-101)", cantidad: 5, precioUnitario: 18500, estado: "Registrado" }
    ];

    function formatearMoneda(monto) {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(monto);
    }

    // 1. RENDERIZAR TABLA DE BASE DE DATOS DE INVENTARIO
    function renderTablaInventario() {
        tablaInventario.innerHTML = '';
        BASE_DATOS_INVENTARIO.forEach(item => {
            const tr = document.createElement('tr');
            const enStock = item.stock > 0;
            const badgeClase = enStock ? 'badge-completado' : 'badge-agotado';
            const estadoTexto = enStock ? 'Disponible' : 'AGOTADO';

            tr.innerHTML = `
                <td><strong>${item.id}</strong></td>
                <td>${item.nombre}</td>
                <td>${item.categoria}</td>
                <td>${formatearMoneda(item.precio)}</td>
                <td><strong>${item.stock} un.</strong></td>
                <td><span class="badge ${badgeClase}">${estadoTexto}</span></td>
            `;
            tablaInventario.appendChild(tr);
        });
    }

    // 2. POBLAR SELECT DE FORMULARIO DESDE LA BASE DE DATOS
    function cargarOpcionesSelect() {
        selectRepuesto.innerHTML = '<option value="">-- Seleccionar Repuesto del Inventario --</option>';
        BASE_DATOS_INVENTARIO.forEach(item => {
            const option = document.createElement('option');
            option.value = item.nombre;
            option.setAttribute('data-precio', item.precio);
            option.setAttribute('data-stock', item.stock);
            option.textContent = `${item.nombre} - ${formatearMoneda(item.precio)} [${item.stock > 0 ? 'Stock: ' + item.stock : 'AGOTADO'}]`;
            selectRepuesto.appendChild(option);
        });
    }

    // 3. CONSULTAR STOCK EN TIEMPO REAL
    function verificarStock() {
        const selectedOption = selectRepuesto.options[selectRepuesto.selectedIndex];
        if (!selectedOption || !selectedOption.value) {
            stockBadge.className = 'stock-info neutral';
            stockBadge.textContent = 'Selecciona un repuesto para verificar stock';
            return;
        }

        const stock = parseInt(selectedOption.getAttribute('data-stock') || 0);
        const cantidadSolicitada = parseInt(cantidadInput.value || 1);

        if (stock === 0) {
            stockBadge.className = 'stock-info agotado';
            stockBadge.textContent = '❌ PRODUCTO AGOTADO EN BODEGA - No se puede cotizar';
        } else if (cantidadSolicitada > stock) {
            stockBadge.className = 'stock-info agotado';
            stockBadge.textContent = `⚠️ Stock insuficiente. Solo quedan ${stock} unidades en inventario`;
        } else {
            stockBadge.className = 'stock-info disponible';
            stockBadge.textContent = `✅ INVENTARIO DISPONIBLE: Quedan ${stock} unidades en bodega`;
        }
    }

    selectRepuesto.addEventListener('change', verificarStock);
    cantidadInput.addEventListener('input', verificarStock);

    function actualizarKPIs(lista) {
        document.getElementById('kpiTotal').textContent = lista.length;
        document.getElementById('kpiProceso').textContent = lista.filter(i => i.estado === "En Proceso").length;
        const totalMonto = lista.reduce((sum, item) => sum + (item.cantidad * item.precioUnitario), 0);
        document.getElementById('kpiMonto').textContent = formatearMoneda(totalMonto);
    }

    function renderTablaCotizaciones(lista) {
        tablaCotizaciones.innerHTML = '';
        if (lista.length === 0) {
            tablaCotizaciones.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #6c757d; padding: 20px;">No se encontraron registros</td></tr>`;
            actualizarKPIs(lista);
            return;
        }

        lista.forEach(item => {
            const tr = document.createElement('tr');
            let claseBadge = item.estado === 'En Proceso' ? 'badge-proceso' : (item.estado === 'Completado' ? 'badge-completado' : 'badge-registrado');
            tr.innerHTML = `
                <td>#${item.id}</td>
                <td><strong>${item.cliente}</strong></td>
                <td>${item.repuesto}</td>
                <td>${item.cantidad}</td>
                <td><strong>${formatearMoneda(item.cantidad * item.precioUnitario)}</strong></td>
                <td><span class="badge ${claseBadge}">${item.estado}</span></td>
                <td><button class="btn-action" onclick="avanzarEstado(${item.id})">Avanzar</button></td>
            `;
            tablaCotizaciones.appendChild(tr);
        });
        actualizarKPIs(listaCotizaciones);
    }

    window.avanzarEstado = function(id) {
        const item = listaCotizaciones.find(c => c.id === id);
        if (item) {
            if (item.estado === 'Registrado') item.estado = 'En Proceso';
            else if (item.estado === 'En Proceso') item.estado = 'Completado';
            else if (item.estado === 'Completado') item.estado = 'Registrado';
            renderTablaCotizaciones(listaCotizaciones);
        }
    };

    if (filtroInput) {
        filtroInput.addEventListener('input', (e) => {
            const busqueda = e.target.value.toLowerCase();
            renderTablaCotizaciones(listaCotizaciones.filter(i => i.cliente.toLowerCase().includes(busqueda) || i.repuesto.toLowerCase().includes(busqueda)));
        });
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const cliente = document.getElementById('cliente').value;
        const selectedOption = selectRepuesto.options[selectRepuesto.selectedIndex];
        const stock = parseInt(selectedOption.getAttribute('data-stock') || 0);
        const cantidad = parseInt(cantidadInput.value);

        if (stock === 0 || cantidad > stock) {
            alert('⛔ Operación denegada: El repuesto seleccionado está AGOTADO o supera el stock disponible en la base de datos.');
            return;
        }

        listaCotizaciones.unshift({
            id: contadorId++,
            cliente,
            repuesto: selectedOption.value,
            cantidad,
            precioUnitario: parseInt(selectedOption.getAttribute('data-precio') || 0),
            estado: "Registrado"
        });

        renderTablaCotizaciones(listaCotizaciones);
        form.reset();
        verificarStock();
        alert('¡Cotización registrada con éxito y validada contra la Base de Datos!');
    });

    // Inicializar todo
    renderTablaInventario();
    cargarOpcionesSelect();
    renderTablaCotizaciones(listaCotizaciones);
});