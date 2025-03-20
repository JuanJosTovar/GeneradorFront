// VARIABLES GLOBALES
let juguetesData = []; 
let selectedCells = new Set();         // IDs (ubicacion_consolidada) de las celdas seleccionadas.
let selectedQuantities = new Map();      // Para cada celda, la cantidad "utilizada".
let referenceDetails = new Map();        // Para agrupar detalles en el resumen flotante.
let currentSearchRefs = new Set();       // Referencias ingresadas en el input (en minúsculas).
let lastSearchQuery = null;              // Objeto de la última consulta: { ref, required, color }.

// Función de normalización para referencia y color.
function normalizeText(str) {
  if (!str) return '';
  // Reemplaza múltiples espacios por uno, recorta y pasa a minúsculas.
  return str.replace(/\s+/g, ' ').trim().toLowerCase();
}

// ALTERNAR TEMA
document.getElementById('toggleTheme').onclick = function () {
  const body = document.body;
  body.classList.toggle('dark-mode');
  this.textContent = body.classList.contains('dark-mode') ? '𖤓' : '⏾';
};

// FUNCIÓN PRINCIPAL: Procesa el input y selecciona canastas según la consulta.
// Formato de cada línea: "referencia, cantidad, color" (el tercer parámetro es opcional)
function highlightAndFindReference() {
  const searchValue = document.getElementById('search').value.trim().toLowerCase();
  
  // Separa las líneas (soporta saltos de línea)
  const lines = searchValue.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
  // Parsear cada línea en { ref, required, color }
  const searchQueries = lines.map(line => {
    const parts = line.split(',');
    return { 
      ref: parts[0].trim(), 
      required: parts.length > 1 ? parseInt(parts[1].trim(), 10) : 0,
      color: parts.length > 2 ? parts[2].trim() : null
    };
  });
  
  // Usamos la primera línea para este ejemplo (se puede extender a múltiples)
  if (searchQueries.length > 0) {
    lastSearchQuery = searchQueries[0];
  } else {
    lastSearchQuery = null;
  }
  
  // Actualizamos el set de referencias buscadas (normalizadas)
  currentSearchRefs = new Set(searchQueries.map(q => normalizeText(q.ref)));
  
  // Limpiar clases y eventos de todas las celdas (incluye .cell, .cell2, .cell3, .cell4, .cell5, .cell6)
  const allCells = document.querySelectorAll('.cell, .cell2, .cell3, .cell4, .cell5, .cell6');
  allCells.forEach(cell => {
    cell.classList.remove('selected', 'deselected', 'highlight');
    cell.onmouseover = null;
    cell.onmouseout = null;
  });
  selectedCells.clear();
  selectedQuantities.clear();
  
  if (!juguetesData || !Array.isArray(juguetesData) || juguetesData.length === 0) return;
  
  // Orden de prioridad: menor índice = mayor prioridad.
  const priorityOrder = ['cell4', 'cell3', 'cell2', 'cell', 'cell5', 'cell6'];
  
  // Para cada consulta (aquí consideramos una sola consulta por línea)
  searchQueries.forEach(query => {
    let requiredQuantity = query.required;
    // Filtrar canastas que tengan la referencia EXACTA, normalizando el valor.
    let matchedCanastas = juguetesData.filter(canasta =>
      normalizeText(canasta.referencia) === normalizeText(query.ref)
    );

    
    // Si se ingresó color, se filtrará más adelante en el consumo (pero no se descartan canastas que no tengan ese color)
    // Mapear cada canasta para determinar la prioridad según la clase de su celda (usando id = ubicacion_consolidada)
    let canastasConPrioridad = matchedCanastas.map(canasta => {
      const cell = document.getElementById(canasta.ubicacion_consolidada);
      let priorityIndex = Infinity;
      if (cell) {
        priorityOrder.forEach((cls, idx) => {
          if (cell.classList.contains(cls) && idx < priorityIndex) {
            priorityIndex = idx;
          }
        });
      }
      return { canasta, priorityIndex };
    }).filter(item => item.priorityIndex !== Infinity);
    
    // Ordenar por prioridad
    canastasConPrioridad.sort((a, b) => a.priorityIndex - b.priorityIndex);
    
    // Recorrer las canastas ordenadas hasta consumir la cantidad requerida.
    for (const item of canastasConPrioridad) {
      if (requiredQuantity <= 0) break;
      const canasta = item.canasta;
      const cell = document.getElementById(canasta.ubicacion_consolidada);
      if (cell) {
        const available = canasta.cantidad; // Cantidad disponible
        // Si se especificó un color, se consume solo si la canasta tiene EXACTAMENTE ese color (normalizado).
        // De lo contrario, se consume la canasta completa.
        let useThis = true;
        if (query.color) {
          useThis = normalizeText(canasta.color) === normalizeText(query.color);
        }
        if (!useThis) continue; // Si la canasta no cumple con el criterio de color, se omite.
        
        const used = available > requiredQuantity ? requiredQuantity : available;
        cell.classList.add('selected');
        selectedCells.add(cell.id);
        // Si ya existe un valor, lo sumamos.
        selectedQuantities.set(cell.id, (selectedQuantities.get(cell.id) || 0) + used);
        cell.onmouseover = function (event) {
          const detalles = getDetalles(canasta);
          showInfoBox(event, detalles);
        };
        cell.onmouseout = hideInfoBox;
        cell.onclick = function () { toggleSelection(cell); };
        requiredQuantity -= used;
      }
    }
  });
  
  updateSelectedBasketList();
  updateFloatingDiv(Array.from(currentSearchRefs));
}

// ALTERNAR SELECCIÓN MANUAL DE UNA CELDA.
function toggleSelection(cell) {
  const cellId = cell.id;
  if (selectedCells.has(cellId)) {
    selectedCells.delete(cellId);
    selectedQuantities.delete(cellId);
    cell.classList.remove('selected');
    cell.classList.add('deselected');
  } else {
    selectedCells.add(cellId);
    cell.classList.add('selected');
    cell.classList.remove('deselected');
  }
  updateSelectedBasketList();
}

// OBTENER DETALLES PARA LA INFOBOX.
function getDetalles(canasta) {
  return `Ubicación: ${canasta.ubicacion}
Descripción: ${canasta.descripcion_ubicacion}
Referencia: ${canasta.referencia}
Descripción Referencia: ${canasta.descripcion_referencia}
Color: ${canasta.color || 'N/A'}
Cantidad: ${canasta.cantidad}
Ubicación Consolidada: ${canasta.ubicacion_consolidada}`;
}

// MUESTRA LA INFOBOX EN LA POSICIÓN DEL MOUSE.
function showInfoBox(event, detalles) {
  const infoBox = document.getElementById('infoBox');
  infoBox.textContent = detalles;
  infoBox.style.display = 'block';
  infoBox.style.left = event.pageX + 'px';
  infoBox.style.top = event.pageY + 'px';
}

// OCULTA LA INFOBOX.
function hideInfoBox() {
  document.getElementById('infoBox').style.display = 'none';
}

// ACTUALIZA EL RESUMEN FLOTANTE (div "floatingSummary").
// Agrupa las cantidades "utilizadas" de las celdas seleccionadas para las referencias buscadas.
function updateFloatingDiv(references) {
  const summaryContainer = document.getElementById('floatingSummary');
  summaryContainer.innerHTML = ''; // Limpiar solo este contenedor.
  referenceDetails.clear();
  selectedCells.forEach(cellId, reference => {
    const canasta = juguetesData.find(c => c.ubicacion_consolidada === cellId);
    console.log(juguetesData.find(c => c.ubicacion_consolidada == cellId),121212);
    
    if (canasta) {
      if (references.includes(normalizeText(canasta.referencia))) {
        const used = selectedQuantities.get(cellId) || 0;
        const key = `${normalizeText(canasta.referencia)}-${normalizeText(canasta.color)}`;
        if (referenceDetails.has(key)) {
          referenceDetails.get(key).cantidad += used;
        } else {
          referenceDetails.set(key, { 
            cantidad: used, 
            color: canasta.color ? canasta.color.trim() : 'N/A', 
            referencia: canasta.referencia.trim() 
          });
        }
      }
    }
  });
  
  // Si se ingresó un color en la búsqueda, forzamos la cantidad para ese color a ser la requerida (si es menor)
  if (lastSearchQuery && lastSearchQuery.color) {
    const key = `${normalizeText(lastSearchQuery.ref)}-${normalizeText(lastSearchQuery.color)}`;
    if (referenceDetails.has(key)) {
      let data = referenceDetails.get(key);
      data.cantidad = Math.min(data.cantidad, lastSearchQuery.required);
      referenceDetails.set(key, data);
    }
  }
  
  if (referenceDetails.size > 0) {
    referenceDetails.forEach(({ cantidad, color, referencia }) => {
      const refDiv = document.createElement('div');
      refDiv.style.cursor = 'pointer';
      refDiv.onclick = function() {
        highlightCanastas(referencia);
      };
      summaryContainer.appendChild(refDiv);
    });
    summaryContainer.style.display = 'block';
  }
}

// ACTUALIZA EL LISTADO DE CANASTAS SELECCIONADAS EN <ul id="selectedBasketList">.
// Solo se muestran las canastas cuya referencia esté en currentSearchRefs, usando la cantidad "utilizada".
function updateSelectedBasketList() {
  const selectedBasketList = document.getElementById('selectedBasketList');
  selectedBasketList.innerHTML = '';
  
  const basketCounts = new Map();
  
  selectedCells.forEach(cellId => {
    const canasta = juguetesData.find(c => c.ubicacion_consolidada === cellId);
    if (canasta && currentSearchRefs.has(normalizeText(canasta.referencia))) {
      const used = selectedQuantities.get(cellId) || 0;
      const key = `${normalizeText(canasta.referencia)}-${normalizeText(canasta.color)}`;
      if (basketCounts.has(key)) {
        basketCounts.get(key).cantidad += used;
      } else {
        basketCounts.set(key, { 
          referencia: canasta.referencia.trim(), 
          color: canasta.color ? canasta.color.trim() : 'N/A', 
          cantidad: used 
        });
      }
    }
  });
  
  basketCounts.forEach(({ referencia, color, cantidad }) => {
    const basketItem = document.createElement('div');
    basketItem.textContent = `Referencia: ${referencia}\nColor: ${color}\nCantidad: ${cantidad}`;
    
    // Botón de vista previa.
    const previewButton = document.createElement('button');
    previewButton.classList.add('vista-prev');
    previewButton.textContent = '👁️';
    previewButton.onclick = function(e) {
      e.stopPropagation();
      console.log(`Clic en Vista Previa para ${referencia} - ${color}`);
      previewCells(referencia, color);
    };
    
    basketItem.appendChild(previewButton);
    selectedBasketList.appendChild(basketItem);
  });
  
  if (selectedBasketList.children.length === 0) {
    selectedBasketList.textContent = 'No hay canastas seleccionadas.';
  }
}

// RESALTA (o quita) el resaltado de las celdas que tengan la referencia dada (vista previa).
function highlightCanastas(reference) {
  const allCells = document.querySelectorAll('.cell, .cell2, .cell3, .cell4, .cell5, .cell6');
  allCells.forEach(cell => {
    if (cell.id === reference) {
      cell.classList.toggle('highlight');
    } else {
      cell.classList.remove('highlight');
    }
  });
}

// EXPORTA LOS DATOS SELECCIONADOS A UN ARCHIVO EXCEL (requiere XLSX).
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

// FUNCION PARA MOSTRAR VISTA PREVIA: Resalta las celdas que correspondan a la referencia y color indicados.
function previewCells(reference, color) {
  const refNorm = normalizeText(reference);
  const colorNorm = normalizeText(color);
  
  const allCells = document.querySelectorAll('.cell, .cell2, .cell3, .cell4, .cell5, .cell6');
  allCells.forEach(cell => {
    cell.classList.remove('preview-highlight');
  });
  
  selectedCells.forEach(cellId => {
    const matchingCanastas = juguetesData.filter(c =>
      c.ubicacion_consolidada === cellId &&
      normalizeText(c.referencia) === refNorm &&
      normalizeText(c.color) === colorNorm
    );
    if (matchingCanastas.length > 0) {
      const cell = document.getElementById(cellId);
      if (cell) {
        cell.classList.add('preview-highlight');
      }
    }
  });
}

// CARGA LOS DATOS DESDE EL BACKEND.
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

// INICIALIZACIÓN AL CARGAR LA PÁGINA.
window.onload = function () {
  loadJuguetesData();
  document.getElementById('exportButton').onclick = exportToExcel;
  document.getElementById('search').addEventListener('input', highlightAndFindReference);
  document.getElementById('toggleFloatingDiv').onclick = toggleFloatingDiv;
};
