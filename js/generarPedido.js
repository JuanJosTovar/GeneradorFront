let juguetesData = [];
let selectedCells = new Set();
let referenceDetails = new Map(); // Mapa para almacenar detalles agrupados
let currentSearchRefs = new Set(); // Almacena las referencias buscadas (en minúsculas)

// Alternar tema (modo oscuro/claro)
document.getElementById('toggleTheme').onclick = function () {
  const body = document.body;
  body.classList.toggle('dark-mode');
  this.textContent = body.classList.contains('dark-mode') ? '𖤓' : '⏾';
};

// Función para buscar coincidencias y resaltar celdas basadas en la(s) referencia(s) ingresadas
// El input debe tener varias líneas con el formato "referencia,cantidadRequerida"
// Por ejemplo:
// pf944,32
// pf950,50
function highlightAndFindReference() {
  const searchValue = document.getElementById('search').value.trim().toLowerCase();
  
  // Separa las líneas del input y extrae las referencias (la parte antes de la coma)
  const lines = searchValue.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  currentSearchRefs = new Set(lines.map(line => {
    const parts = line.split(',');
    return parts[0].trim(); // ya están en minúsculas porque searchValue se convirtió a lowerCase
  }));
  
  // Limpiar clases y eventos de todas las celdas
  const allCells = document.querySelectorAll('.cell, .cell2, .cell3, .cell4');
  allCells.forEach(cell => {
    cell.classList.remove('selected', 'deselected', 'highlight', 'insuficiente');
    cell.onmouseover = null;
    cell.onmouseout = null;
  });
  selectedCells.clear();
  
  if (!juguetesData || !Array.isArray(juguetesData) || juguetesData.length === 0) return;
  
  // Procesa cada línea del input
  lines.forEach(line => {
    const parts = line.split(',');
    const refInput = parts[0].trim(); // Valor exacto ingresado (por ejemplo, "pf930c-1")
    let cantidadRequerida = 0;
    if (parts.length > 1) {
      cantidadRequerida = parseInt(parts[1].trim(), 10) || 0;
    }
    
    // Usamos una expresión regular para comparar exactamente la referencia
    const regex = new RegExp(`^${refInput}$`, 'i');
    const matches = juguetesData.filter(c => regex.test(c.referencia.trim()));
    
    console.log(`Referencia: ${refInput} - Cantidad requerida: ${cantidadRequerida}`);
    
    matches.forEach(canasta => {
      if (canasta.cantidad >= cantidadRequerida) {
        const cell = document.getElementById(canasta.ubicacion_consolidada); 
        if (cell) {
          cell.classList.add('selected');
          selectedCells.add(canasta.ubicacion_consolidada);
          cell.onmouseover = function (event) {
            const detalles = getDetalles(canasta);
            showInfoBox(event, detalles);
          };
          cell.onmouseout = function () {
            hideInfoBox();
          };
          cell.onclick = function () {
            toggleSelection(cell);
          };
        }
      }
    });
  });
  
  updateSelectedBasketList();
  updateFloatingDiv();
  
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

// Función para obtener los detalles de la canasta que se mostrarán en la infoBox
function getDetalles(canasta) {
  return `Ubicación: ${canasta.ubicacion}
Descripción: ${canasta.descripcion_ubicacion}
Referencia: ${canasta.referencia}
Descripción Referencia: ${canasta.descripcion_referencia}
Color: ${canasta.color || 'N/A'}
Cantidad: ${canasta.cantidad}
Ubicación Consolidada: ${canasta.ubicacion_consolidada}`;
}

// Mostrar la caja de información en la posición del mouse
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

// Actualiza el div flotante con detalles agrupados (este bloque es opcional)
function updateFloatingDiv() {
  const summaryContainer = document.getElementById('floatingSummary');
  summaryContainer.innerHTML = ''; // Borramos solo el resumen
  referenceDetails.clear();

  // Recorre cada celda seleccionada y agrupa por referencia y color
  selectedCells.forEach(cellId => {
    const canastas = juguetesData.filter(c => 
      c.ubicacion_consolidada === cellId &&
      currentSearchRefs.has(c.referencia.trim().toLowerCase())
    );
    
    canastas.forEach(canasta => {
      // Normalizamos referencia y color
      const refNorm = canasta.referencia.trim().toLowerCase();
      const colorNorm = (canasta.color ? canasta.color.trim() : 'n/a').toLowerCase();
      const key = `${refNorm}-${colorNorm}`;

      if (referenceDetails.has(key)) {
        referenceDetails.get(key).cantidad += canasta.cantidad;
      } else {
        referenceDetails.set(key, { 
          cantidad: canasta.cantidad, 
          color: canasta.color ? canasta.color.trim() : 'N/A', 
          referencia: canasta.referencia.trim() 
        });
      }
    });
  });
}



// Función para resaltar o quitar el resaltado de la celda cuyo id coincide con la referencia
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

// Actualiza la lista de canastas seleccionadas en el div correspondiente
function updateSelectedBasketList() {
  const selectedBasketList = document.getElementById('selectedBasketList');
  console.log(selectedBasketList,211221);
  
  selectedBasketList.innerHTML = '';

  const basketCounts = new Map();

  selectedCells.forEach(cellId => {
    const canastas = juguetesData.filter(c => 
      c.ubicacion_consolidada === cellId &&
      currentSearchRefs.has(c.referencia.trim().toLowerCase())
    );
    canastas.forEach(canasta => {
      // Normalizamos referencia y color para la clave
      const refNorm = canasta.referencia.trim().toLowerCase();
      const colorNorm = (canasta.color ? canasta.color.trim() : 'n/a').toLowerCase();
      const key = `${refNorm}-${colorNorm}`;
      
      if (basketCounts.has(key)) {
        basketCounts.get(key).cantidad += canasta.cantidad;
      } else {
        basketCounts.set(key, { 
          referencia: canasta.referencia.trim(), 
          color: canasta.color ? canasta.color.trim() : 'N/A', 
          cantidad: canasta.cantidad 
        });
      }
    });
  });

  basketCounts.forEach(({ referencia, color, cantidad }) => {
    const basketItem = document.createElement('div');
    basketItem.textContent = `Referencia: ${referencia}\nColor: ${color}\nCantidad: ${cantidad}`;

    const previewButton = document.createElement('button');
    previewButton.textContent = 'Vista Previa';
    previewButton.onclick = function (e) {
      e.stopPropagation();
      console.log(`Clic en Vista Previa para ${referencia} - ${color}`); // Depuración
      previewCells(referencia, color);
    };

    selectedBasketList.appendChild(basketItem);
    selectedBasketList.appendChild(previewButton)
  });

  if (selectedBasketList.children.length === 0) {
    selectedBasketList.textContent = 'No hay canastas seleccionadas.';
  }
}


// Resalta todas las ubicaciones consolidadas que coincidan con los datos traídos desde el backend
function highlightAllConsolidatedLocations() {
  juguetesData.forEach(canasta => {
    const cell = document.getElementById(canasta.ubicacion_consolidada);
    if (cell) {
      cell.classList.add('selected');
      selectedCells.add(canasta.ubicacion_consolidada);
      cell.onmouseover = function (event) {
        const detalles = getDetalles(canasta);
        showInfoBox(event, detalles);
      };
      cell.onmouseout = function () {
        hideInfoBox();
      };
      cell.onclick = function () {
        toggleSelection(cell);
      };
    }
  });
  updateSelectedBasketList();
}

// Exporta los datos seleccionados a un archivo Excel (requiere la librería XLSX)
function exportToExcel() {
  const selectedData = [];
  selectedCells.forEach(cellId => {
    const canasta = juguetesData.find(c => c.ubicacion_consolidada === cellId);
    if (canasta) {
      selectedData.push({
        'Ubicación': canasta.ubicacion,
        'Descripción Canasta': canasta.descripcion_ubicacion,
        'Referencia': canasta.referencia,
        'Descripción Referencia': canasta.descripcion_referencia,
        'Color': canasta.color || 'N/A',
        'Cantidad': canasta.cantidad,
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

// Carga los datos desde el backend (consulta la tabla stock en MySQL)
async function loadJuguetesData() {
  try {
    const response = await fetch('http://localhost:10101/traerCanastasPedido');
    if (!response.ok) {
      throw new Error(`Error al cargar datos: ${response.status}`);
    }
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

// Inicialización al cargar la página
window.onload = function () {
  loadJuguetesData();
  document.getElementById('exportButton').onclick = exportToExcel;
  document.getElementById('search').addEventListener('input', highlightAndFindReference);
  document.getElementById('toggleFloatingDiv').onclick = toggleFloatingDiv;
};


function previewCells(reference, color) {
  // Normalizamos la referencia y el color
  const refNorm = reference.trim().toLowerCase();
  const colorNorm = (color ? color.trim() : 'n/a').toLowerCase();

  // Primero, quitamos la clase de vista previa de todas las celdas para resetear el estado
  const allCells = document.querySelectorAll('.cell, .cell2, .cell3, .cell4');
  allCells.forEach(cell => {
    cell.classList.remove('preview-highlight');
  });

  // Recorremos las celdas seleccionadas
  selectedCells.forEach(cellId => {
    // Obtenemos todos los registros que correspondan a esta celda y que cumplan con la combinación
    const matchingCanastas = juguetesData.filter(c => 
      c.ubicacion_consolidada === cellId &&
      c.referencia.trim().toLowerCase() === refNorm &&
      ((c.color ? c.color.trim() : 'n/a').toLowerCase() === colorNorm)
    );
    if (matchingCanastas.length > 0) {
      const cell = document.getElementById(cellId);
      if (cell) {
        cell.classList.add('preview-highlight');
      }
    }
  });
}