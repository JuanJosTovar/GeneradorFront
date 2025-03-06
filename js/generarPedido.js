let juguetesData = [];
let selectedCells = new Set();
let referenceDetails = new Map(); // Mapa para almacenar detalles agrupados por referencia y color

// Alternar tema (modo oscuro/claro)
document.getElementById('toggleTheme').onclick = function () {
    const body = document.body;
    body.classList.toggle('dark-mode'); // Alterna el modo oscuro

    // Cambiar el texto del botón según el modo actual
    this.textContent = body.classList.contains('dark-mode') ? '𖤓' : '⏾';
};

// Función para buscar coincidencias y resaltar celdas basadas en la referencia ingresada
function highlightAndFindReference() {
    const searchValue = document.getElementById('search').value.trim().toLowerCase();
    
    const allCells = document.querySelectorAll('.cell, .cell2, .cell3, .cell4');
    allCells.forEach(cell => {
        cell.classList.remove('selected', 'deselected', 'highlight');
        cell.onmouseover = null;
        cell.onmouseout = null;
    });
    selectedCells.clear();
    
    // Verificar que juguetesData es un arreglo y tiene elementos
    if (!juguetesData || !Array.isArray(juguetesData) || juguetesData.length === 0) return;
    
    // Separa las referencias (por salto de línea) y elimina entradas vacías
    const references = searchValue.split('\n').map(ref => ref.trim()).filter(ref => ref.length > 0);
    
    // Procesa cada referencia por separado
    references.forEach(ref => {
        // Filtrar todas las canastas cuya referencia coincide (en minúsculas)
        const matches = juguetesData.filter(c => c.referencia.toLowerCase() === ref);
        console.log(matches,122121);
        
        // Por cada canasta encontrada, resalta su celda
        matches.forEach(canasta => {
            const cell = document.getElementById(canasta.ubicacion_consolidada);
            if (cell) {
                cell.classList.add('selected');
                selectedCells.add(canasta.ubicacion_consolidada);
                cell.onmouseover = function(event) {
                    const detalles = getDetalles(canasta);
                    showInfoBox(event, detalles);
                };
                cell.onmouseout = function() {
                    hideInfoBox();
                };
                cell.onclick = function() {
                    toggleSelection(cell);
                };
            }
        });
        
        // Obtener las ubicaciones únicas para la referencia actual
        const ubicaciones = [...new Set(matches.map(c => c.ubicacion_consolidada))];
        console.log(`Para referencia: ${ref}, ubicaciones consolidadas encontradas: ${ubicaciones.join(", ")}`);
    });
    
    updateSelectedBasketList();
}

// Alternar selección manual de una celda
function toggleSelection(cell) {
    const cellId = cell.id;
    if (selectedCells.has(cellId)) {
        selectedCells.delete(cellId);
        cell.classList.remove('selected');
        cell.classList.add('deselected');
    } else {
        selectedCells.add(cellId);
        cell.classList.add('selected');
        cell.classList.remove('deselected');
    }
    updateSelectedBasketList();
}

// Función para obtener detalles de la canasta en forma de cadena (se muestran todos los campos relevantes)
function getDetalles(canasta) {
    return `Ubicación: ${canasta.ubicacion}
Descripción: ${canasta.descripcion_ubicacion}
Referencia: ${canasta.referencia}
Descripción Referencia: ${canasta.descripcion_referencia}
Color: ${canasta.color || 'N/A'}
Cantidad: ${canasta.cantidad}
Ubicación Consolidada: ${canasta.ubicacion_consolidada}`;
}

// Mostrar caja de información en posición de mouse
function showInfoBox(event, detalles) {
    const infoBox = document.getElementById('infoBox');
    infoBox.textContent = detalles;
    infoBox.style.display = 'block';
    infoBox.style.left = event.pageX + 'px';
    infoBox.style.top = event.pageY + 'px';
}

// Ocultar la caja de información
function hideInfoBox() {
    document.getElementById('infoBox').style.display = 'none';
}

// Actualiza el div flotante con detalles agrupados por referencia y color
function updateFloatingDiv() {
    const floatingDiv = document.getElementById('floatingDiv');
    floatingDiv.innerHTML = '';
    referenceDetails.clear();

    selectedCells.forEach(cellId => {
        // Ahora buscamos la canasta usando la propiedad ubicacion_consolidada
        const canasta = juguetesData.find(c => c.ubicacion_consolidada === cellId);
        if (canasta) {
            // Se utiliza la combinación de referencia y color como clave
            const key = `${canasta.referencia.toLowerCase()}-${canasta.color.toLowerCase()}`;
            if (referenceDetails.has(key)) {
                referenceDetails.get(key).cantidad += canasta.cantidad;
            } else {
                referenceDetails.set(key, { cantidad: canasta.cantidad, color: canasta.color || 'N/A', referencia: canasta.referencia });
            }
        }
    });

    if (referenceDetails.size > 0) {
        referenceDetails.forEach(({ cantidad, color, referencia }, key) => {
            const refDiv = document.createElement('div');
            refDiv.textContent = `Referencia: ${referencia}\nCantidad: ${cantidad}\nColor: ${color}`;
            refDiv.style.cursor = 'pointer';
            refDiv.onclick = function() {
                highlightCanastas(referencia);
            };
            floatingDiv.appendChild(refDiv);
        });
        floatingDiv.style.display = 'block';
    } else {
        floatingDiv.textContent = 'No se encontraron referencias coincidentes.';
        floatingDiv.style.display = 'block';
    }
}

// Resalta (o quita el resaltado) de la celda cuyo id coincide con la referencia (o se puede ajustar)
function highlightCanastas(reference) {
    const allCells = document.querySelectorAll('.cell, .cell2, .cell3, .cell4');
    allCells.forEach(cell => {
        // Se asume que el id de la celda es la ubicacion_consolidada
        if (cell.id === reference) {
            cell.classList.toggle('highlight');
        } else {
            cell.classList.remove('highlight');
        }
    });
}

// Actualiza la lista de canastas seleccionadas en el div correspondiente
function updateSelectedBasketList() {
    const selectedBasketList = document.getElementById('selectedBasketList');
    selectedBasketList.innerHTML = '';

    const basketCounts = new Map();

    selectedCells.forEach(cellId => {
        // Buscar la canasta usando la propiedad ubicacion_consolidada
        const canasta = juguetesData.find(c => c.ubicacion_consolidada === cellId);
        if (canasta) {
            const key = `${canasta.referencia.toLowerCase()}-${canasta.color.toLowerCase()}`;
            if (basketCounts.has(key)) {
                basketCounts.get(key).cantidad += canasta.cantidad;
            } else {
                basketCounts.set(key, { referencia: canasta.referencia, color: canasta.color, cantidad: canasta.cantidad });
            }
        }
    });
    basketCounts.forEach(({ referencia, color, cantidad }) => {
        const basketItem = document.createElement('div');
        basketItem.textContent = `Referencia: ${referencia}\nColor: ${color}\nCantidad: ${cantidad}`;
        selectedBasketList.appendChild(basketItem);
    });

    if (selectedBasketList.children.length === 0) {
        selectedBasketList.textContent = 'No hay canastas seleccionadas.';
    }
}

// Exporta los datos seleccionados a un archivo Excel
function exportToExcel() {
    const selectedData = [];
    selectedCells.forEach(cellId => {
        // Buscar la canasta usando ubicacion_consolidada
        const canasta = juguetesData.find(c => c.ubicacion_consolidada === cellId);
        if (canasta) {
            selectedData.push({
                Ubicación: canasta.ubicacion,
                'Descripción Canasta': canasta.descripcion_ubicacion,
                Referencia: canasta.referencia,
                'Descripción Referencia': canasta.descripcion_referencia,
                Color: canasta.color || 'N/A',
                Cantidad: canasta.cantidad,
                'Ubicación Consolidada': canasta.ubicacion_consolidada
            });
        }
    });

    if (selectedData.length === 0) {
        alert("No hay datos seleccionados para exportar.");
        return;
    }

    const ws = XLSX.utils.json_to_sheet(selectedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Canastas Seleccionadas");
    XLSX.writeFile(wb, "canastas_seleccionadas.xlsx");
}

// Carga los datos desde el backend (consulta la tabla stock)
// Se espera que el endpoint retorne un JSON con la forma: [ {ubicacion, descripcion_ubicacion, referencia, descripcion_referencia, color, cantidad, ubicacion_consolidada}, ... ]
async function loadJuguetesData() {
    try {
        const response = await fetch('http://localhost:10101/traerCanastasPedido');
        if (!response.ok) {
            throw new Error(`Error al cargar datos: ${response.status}`);
        }
        // Asumimos que se retorna un arreglo directamente
        juguetesData = await response.json();
        console.log('Datos cargados desde el backend (BD):', juguetesData);
    } catch (error) {
        console.error('Error al cargar datos desde el backend:', error);
    }
}

function toggleFloatingDiv() {
    const floatingDiv = document.getElementById('floatingDiv');
    floatingDiv.classList.toggle('View-div');
}

// Inicializar funciones al cargar la página
window.onload = function () {
    loadJuguetesData(); // Carga datos desde la BD mediante la API
    document.getElementById('exportButton').onclick = exportToExcel;
    document.getElementById('search').addEventListener('input', highlightAndFindReference);
    document.getElementById('toggleFloatingDiv').onclick = toggleFloatingDiv;
};