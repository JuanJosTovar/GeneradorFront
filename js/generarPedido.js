// Variable para los datos cargados desde el backend (antes era del JSON)
let juguetesData = {};
let selectedCells = new Set();
let referenceDetails = new Map(); // Mapa para almacenar detalles de las referencias

document.getElementById('toggleTheme').onclick = function () {
    const body = document.body;
    body.classList.toggle('dark-mode'); // Alterna el modo oscuro

    // Cambiar el texto del botón según el modo actual
    if (body.classList.contains('dark-mode')) {
        this.textContent = '𖤓';
    } else {
        this.textContent = '⏾';
    }
};

// Función para buscar coincidencias y resaltar celdas basadas en la referencia ingresada
function highlightAndFindReference() {
    const searchValue = document.getElementById('search').value.trim().toLowerCase();
    
    // Limpiar selección anterior
    const allCells = document.querySelectorAll('.cell4, .cell3, .cell2, .cell');
    allCells.forEach(cell => {
        cell.classList.remove('selected', 'deselected', 'highlight');
        cell.onmouseover = null;
        cell.onmouseout = null;
    });
    selectedCells.clear();

    if (!juguetesData.canastas) return;

    const references = searchValue.split('\n').map(ref => ref.trim()).filter(ref => ref.length > 0);

    // Objeto para almacenar las canastas encontradas por prioridad
    const foundCanastas = {
        cell4: [],
        cell3: [],
        cell2: [],
        cell: []
    };

    // Iterar sobre las canastas y clasificar las coincidencias
    Object.values(juguetesData.canastas).forEach(canasta => {
        references.forEach(ref => {
            const hasMatch = canasta.referencias.some(reference => reference.ref.toLowerCase() === ref);
            if (hasMatch) {
                const cell = document.getElementById(canasta.ubicacion);
                if (cell) {
                    if (cell.classList.contains('cell4')) foundCanastas.cell4.push(canasta);
                    else if (cell.classList.contains('cell3')) foundCanastas.cell3.push(canasta);
                    else if (cell.classList.contains('cell2')) foundCanastas.cell2.push(canasta);
                    else if (cell.classList.contains('cell')) foundCanastas.cell.push(canasta);
                }
            }
        });
    });

    // Resaltar canastas según prioridad
    const priorityOrder = ['cell4', 'cell3', 'cell2', 'cell'];
    references.forEach(ref => {
        let found = false;
        priorityOrder.forEach(className => {
            const canastaFound = foundCanastas[className].find(canasta => 
                canasta.referencias.some(reference => reference.ref.toLowerCase() === ref)
            );
            if (canastaFound && !found) {
                const cell = document.getElementById(canastaFound.ubicacion);
                if (cell) {
                    cell.classList.add('selected');
                    selectedCells.add(canastaFound.ubicacion);
                    found = true;
                    cell.onmouseover = function(event) {
                        const detalles = getDetalles(canastaFound, references);
                        showInfoBox(event, detalles);
                    };
                    cell.onmouseout = function() {
                        hideInfoBox();
                    };
                    cell.onclick = function() {
                        toggleSelection(cell);
                    };
                }
            }
        });
    });

    updateSelectedBasketList();
}

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

function getDetalles(canasta, references) {
    return canasta.referencias
        .filter(ref => references.includes(ref.ref.toLowerCase()))
        .map(ref => `Código: ${canasta.codigo}  ${canasta.nombre}\nReferencia: ${ref.ref}\nColor: ${ref.color || 'N/A'}\nCantidad: ${ref.cantidad}`)
        .join("\n\n");
}

function showInfoBox(event, detalles) {
    const infoBox = document.getElementById('infoBox');
    infoBox.textContent = detalles;
    infoBox.style.display = 'block';
    infoBox.style.left = event.pageX + 'px';
    infoBox.style.top = event.pageY + 'px';
}

function hideInfoBox() {
    document.getElementById('infoBox').style.display = 'none';
}

function updateFloatingDiv(references) {
    const floatingDiv = document.getElementById('floatingDiv');
    floatingDiv.innerHTML = '';
    referenceDetails.clear();

    selectedCells.forEach(cellId => {
        const canasta = juguetesData.canastas[cellId];
        if (canasta) {
            const referenciasFiltradas = canasta.referencias.filter(ref =>
                references.includes(ref.referencia.toLowerCase())
            );
            referenciasFiltradas.forEach(ref => {
                const key = `${ref.referencia.toLowerCase()}-${ref.color.toLowerCase()}`;
                if (referenceDetails.has(key)) {
                    referenceDetails.get(key).cantidad += ref.cantidad;
                } else {
                    referenceDetails.set(key, { cantidad: ref.cantidad, color: ref.color || 'N/A' });
                }
            });
        }
    });

    if (referenceDetails.size > 0) {
        referenceDetails.forEach(({ cantidad, color }, key) => {
            const [reference, colorValue] = key.split('-');
            const refDiv = document.createElement('div');
            refDiv.textContent = `Referencia: ${reference}\nCantidad: ${cantidad}\nColor: ${colorValue}`;
            refDiv.style.cursor = 'pointer';
            refDiv.onclick = function() {
                highlightCanastas(reference);
            };
            floatingDiv.appendChild(refDiv);
        });
        floatingDiv.style.display = 'block';
    } else {
        floatingDiv.textContent = 'No se encontraron referencias coincidentes.';
        floatingDiv.style.display = 'block';
    }
}

function highlightCanastas(reference) {
    const allCells = document.querySelectorAll('.cell, .cell2, .cell3, .cell4');
    allCells.forEach(cell => {
        if (cell.id === reference) {
            cell.classList.toggle('highlight');
        } else {
            cell.classList.remove('highlight');
        }
    });
}

function updateSelectedBasketList() {
    const selectedBasketList = document.getElementById('selectedBasketList');
    const searchValue = document.getElementById('search').value.trim().toLowerCase();
    const references = searchValue.split('\n').map(ref => ref.trim()).filter(ref => ref.length > 0);
    selectedBasketList.innerHTML = '';

    const basketCounts = new Map();

    selectedCells.forEach(cellId => {
        const canasta = juguetesData.canastas.find(c => c.ubicacion === cellId);
        if (canasta) {
            canasta.referencias
                .filter(ref => references.includes(ref.ref.toLowerCase()))
                .forEach(ref => {
                    const key = `${ref.ref.toLowerCase()}-${ref.color.toLowerCase()}`;
                    if (basketCounts.has(key)) {
                        basketCounts.get(key).cantidad += ref.cantidad;
                    } else {
                        basketCounts.set(key, { referencia: ref.ref, color: ref.color, cantidad: ref.cantidad });
                    }
                });
        }
    });
    console.log(selectedCells);
    basketCounts.forEach(({ referencia, color, cantidad }) => {
        const basketItem = document.createElement('div');
        basketItem.textContent = `Referencia: ${referencia}\nColor: ${color}\nCantidad: ${cantidad}`;
        selectedBasketList.appendChild(basketItem);
    });

    if (selectedBasketList.children.length === 0) {
        selectedBasketList.textContent = 'No hay canastas seleccionadas.';
    }
}

function exportToExcel() {
    const selectedData = [];
    const searchValue = document.getElementById('search').value.trim().toLowerCase();
    const references = searchValue.split(',').map(ref => ref.trim()).filter(ref => ref.length > 0);

    selectedCells.forEach(cellId => {
        const canasta = juguetesData.canastas.find(c => c.ubicacion === cellId);
        if (canasta) {
            canasta.referencias
                .filter(ref => references.includes(ref.ref.toLowerCase()))
                .forEach(ref => {
                    selectedData.push({
                        Código: `${canasta.codigo} - ${canasta.nombre}`,
                        Ubicación: canasta.ubicacion,
                        Referencia: ref.ref,
                        Cantidad: ref.cantidad,
                        Color: ref.color || 'N/A'
                    });
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

// Función para cargar datos desde el backend en lugar de un JSON local
function loadJuguetesData() {
    fetch('http://localhost:3000/api/juguetes')
        .then(response => {
            if (!response.ok) throw new Error(`Error al cargar datos: ${response.status}`);
            return response.json();
        })
        .then(data => {
            juguetesData = data; // Se espera que data tenga la forma { canastas: [...] }
            console.log('Datos cargados desde el backend:', juguetesData);
        })
        .catch(error => console.error('Error al cargar datos desde el backend:', error));
}

function toggleFloatingDiv() {
    const floatingDiv = document.getElementById('floatingDiv');
    floatingDiv.classList.toggle('View-div');
}

// Inicializar funciones al cargar la página
window.onload = function () {
    loadJuguetesData();
    document.getElementById('exportButton').onclick = exportToExcel;
    document.getElementById('search').addEventListener('input', highlightAndFindReference);
    document.getElementById('toggleFloatingDiv').onclick = toggleFloatingDiv;
};
