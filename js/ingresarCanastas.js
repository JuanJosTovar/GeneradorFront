document.getElementById('excelFile').addEventListener('change', function (e) {
  const file = e.target.files[0];
  console.log(file,2112);
  
  if (!file) return;
  document.getElementById('fileNameDisplay').textContent = file.name
})

document.getElementById('excelForm').addEventListener('submit', async function(event) {
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
    const workbook = XLSX.read(data, { type: 'array' });

    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

    if (jsonData.length === 0) {
      responseDiv.textContent = 'El archivo está vacío o no contiene datos válidos.';
      return;
    }

    // Preparar un arreglo para acumular respuestas de cada solicitud
    let responses = [];

    for (const [index, row] of jsonData.entries()) {
      // Se buscan las columnas "codigo" y "nombre" (se pueden ajustar según el encabezado del Excel)
      const codigo = row['codigo'] || row['Codigo'] || row['CODIGO'];
      const nombre = row['nombre'] || row['Nombre'] || row['NOMBRE'];

      if (!codigo || !nombre) {
        responses.push(`Fila ${index + 2} incompleta: ${JSON.stringify(row)}`);
        continue;
      }

      const payload = { codigo, nombre };

      try {
        const res = await fetch('http://localhost:10101/registrarCanasta', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        responses.push(`Fila ${index + 2} procesada (codigo: ${codigo}): ${JSON.stringify(data)}`);
      } catch (error) {
        responses.push(`Error en fila ${index + 2} (codigo: ${codigo}): ${error}`);
      }
    }

    // Mostrar los resultados en el div de respuesta
    responseDiv.textContent = responses.join('\n');
  } catch (error) {
    responseDiv.textContent = 'Error al leer el archivo: ' + error;
  }
});
