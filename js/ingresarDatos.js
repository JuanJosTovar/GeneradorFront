document.getElementById('excelFile').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;
    document.getElementById('fileNameDisplay').textContent = file.name;
  });
  
  document.getElementById('excelForm').addEventListener('submit', async function (event) {
    event.preventDefault(); // Evita que se recargue la página
  
    const fileInput = document.getElementById('excelFile');
    const file = fileInput.files[0];
    const responseDiv = document.getElementById('response');
  
    if (!file) {
      responseDiv.textContent = 'Por favor, seleccione un archivo Excel.';
      return;
    }
  
    try {
      const data = await file.arrayBuffer();
      // Se añade la opción cellDates: true para que las fechas se interpreten como objetos Date
      const workbook = XLSX.read(data, { type: 'array', cellDates: true });
      
      const sheetName = "CONSOLIDADO EPT-RPT";
      const worksheet = workbook.Sheets[sheetName];
      
      if (!worksheet) {
        responseDiv.textContent = `La hoja "${sheetName}" no existe en el archivo.`;
        return;
      }
      
      // Con defval: "" se asigna valor vacío a celdas sin datos.
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
      
      if (jsonData.length === 0) {
        responseDiv.textContent = 'El archivo está vacío o no contiene datos válidos.';
        return;
      }
      
      let responses = [];
      
      for (const [index, row] of jsonData.entries()) {
        // Se extrae la fecha del row; puede ser un objeto Date o un string
        const rawFecha = row['FECHA'] || row['fecha'] || row['Fecha'] || '';
        let fecha = rawFecha;
        
        // Si es un objeto Date, lo formateamos a "DD/MM/YYYY"
        if (rawFecha instanceof Date) {
          fecha = rawFecha.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
        }
        
        const tipo = row['TIPO'] || row['tipo'] || row['Tipo'] || '';
        const turno = row['TURNO'] || row['turno'] || row['Turno'] || '';
        const bodegaOrigen = row['Bod. Origen'] || row['bod. origen'] || row['Bod. origen'] || '';
        const descripcionBodegaOrigen = row['Descripción Bodega Origen'] || row['descripción bodega origen'] || row['Descripción bodega origen'] || '';
        const referencia = row['Ref. Fenix'] || row['ref. fenix'] || row['Ref. fenix'] || '';
        const descripcionReferencia = row['Descripción Producto'] || row['descripción producto'] || row['Descripción producto'] || '';
        const cantidad = row['Cantidad'] || row['cantidad'] || '';
        const UE = row['UE'] || row['ue'] || '';
        const canastaCodigo = row['Ubicación Final Fénix'] || row['ubicación final fenix'] || row['ubicación final fénix'] || '';
        const color = row['Color'] || row['color'] || '';
        const canastaUbicacion = row['Descripción Ubicación Fénix'] || row['descripción ubicación fenix'] || row['descripción ubicación fénix'] || '';
        const ubicacionConsolidada = row['Ubicación Consolidada'] || row['ubicación consolidada'] || row['Ubicación Consolidada'] || '';
  
        const payload = { 
          fecha, 
          tipo, 
          turno, 
          bodegaOrigen, 
          descripcionBodegaOrigen, 
          referencia, 
          descripcionReferencia, 
          cantidad, 
          UE, 
          canastaCodigo, 
          color, 
          canastaUbicacion, 
          ubicacionConsolidada  
        };
        
        
        try {
          const res = await fetch('http://localhost:10101/guardarDatos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          const data = await res.json();
          responses.push(`Fila ${index + 2} procesada (referencia: ${referencia}): ${JSON.stringify(data)}`);
        } catch (error) {
          responses.push(`Error en fila ${index + 2} (referencia: ${referencia}): ${error}`);
        }
      }
      
      responseDiv.textContent = responses.join('\n');
    } catch (error) {
      responseDiv.textContent = 'Error al leer el archivo: ' + error;
    }
  });
  