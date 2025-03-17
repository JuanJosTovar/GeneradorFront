document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('dataForm');
  
  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const nombres = document.getElementById('nombres').value.trim().toLowerCase();
    const apellidos = document.getElementById('apellidos').value.trim().toLowerCase();
    const password = document.getElementById('password').value;
  
    if (!nombres || !apellidos || !password) {
      mostrarNotificacion("Por favor completa todos los campos.", false);
      return;
    }
  
    const inicialNombre = nombres.charAt(0); 
    const inicialApellido = apellidos.charAt(0); 
    const randomNumber = Math.floor(Math.random() * 900) + 100;
    const nombre_usuario = `${inicialNombre}${inicialApellido}${randomNumber}`;
  
    // Construye el payload a enviar
    const payload = {
      nombres,
      apellidos,
      password,
      nombre_usuario
    };
  
    try {
      const res = await fetch('http://localhost:10101/registrarUsuario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
          mostrarNotificacion("Registro exitoso!", true);
      } else {
          const errorData = await res.json();
          mostrarNotificacion("Error en el registro: " + (errorData.message || "Inténtalo de nuevo."), false);
      }
    } catch (error) {
      console.error("Error en la conexión:", error);
      mostrarNotificacion("Error de conexión con el servidor.", false);
    }
  });

  function mostrarNotificacion(mensaje, exito) {
    const overlay = document.getElementById('modalOverlay');
    const modal = document.getElementById('modalNotification');

    modal.style.backgroundColor = exito ? '#d4edda' : '#f8d7da';
    modal.style.color = exito ? '#155724' : '#721c24';
    modal.style.border = exito ? '1px solid #c3e6cb' : '1px solid #f5c6cb';

    modal.textContent = mensaje;

    overlay.style.display = 'block';
    modal.style.display = 'block';
  
    setTimeout(() => {
      overlay.style.display = 'none';
      modal.style.display = 'none';
    }, 3000);
  }
});