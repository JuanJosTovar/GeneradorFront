document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('dataForm');

    function navigateTo() {
        window.location.href = '../menu.html';
    }
    
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
  
      const nombre_usuario = document.getElementById('nombre_de_usuario').value.trim().toLowerCase();
      const password = document.getElementById('password').value;
    
      if (!nombre_usuario || !password) {
        mostrarNotificacion("Por favor completa todos los campos.", false);
        return;
      }
    
      // Construye el payload a enviar
      const payload = {
        nombre_usuario,
        password
      };
    
      try {
        const res = await fetch('http://localhost:10101/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
            mostrarNotificacion("Inicio de sesión exitoso!", true);
        } else {
            const errorData = await res.json();
            mostrarNotificacion("Fallo en el inicio de sesión: ", false);
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
        navigateTo();
      }, 3000);
    }
  });