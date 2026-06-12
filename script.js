// Variable global para retener la info antes de mandar a WhatsApp
let turnoRegistrado = {};

// 1. CONTROL DE CALENDARIO: Bloquear días pasados y domingos
document.addEventListener("DOMContentLoaded", () => {
    const dateInput = document.getElementById('appointment-date');
    if(dateInput) {
        const hoy = new Date();
        const yyyy = hoy.getFullYear();
        let mm = hoy.getMonth() + 1;
        let dd = hoy.getDate();

        if (dd < 10) dd = '0' + dd;
        if (mm < 10) mm = '0' + mm;

        // Setea el día mínimo para que no elijan fechas pasadas
        dateInput.min = `${yyyy}-${mm}-${dd}`;

        // Escucha si cambia la fecha para validar que no sea Domingo
        dateInput.addEventListener('change', (e) => {
            const elDia = new Date(e.target.value + 'T00:00:00').getDay();
            if (elDia === 0) { // 0 es Domingo
                alert("Los domingos el local permanece cerrado. Por favor, elegí otro día.");
                e.target.value = "";
                document.getElementById('time-slots-container').innerHTML = "";
            } else {
                generarHorariosDinamicos();
            }
        });
    }
});

// 2. HORARIOS DINÁMICOS EN BASE AL BARBERO
function generarHorariosDinamicos() {
    const barbero = document.querySelector('input[name="barber"]:checked').value;
    const container = document.getElementById('time-slots-container');
    container.innerHTML = ""; // Limpiamos

    // Simulamos listas de horarios distintos para demostrar dinamismo
    let horasDisponibles = [];
    if (barbero === "Nico" || barbero === "Tito") {
        horasDisponibles = ["10:00", "11:00", "12:00","13:00", "17:00", "18:00", "19:00"," 20:00", "21:00"];
    } else {
        horasDisponibles = ["10:30", "12:00", "13:00", "15:00", "17:00", "19:00", "21:00"];
    }

    horasDisponibles.forEach(hora => {
        container.innerHTML += `
            <label class="time-option">
                <input type="radio" name="time" value="${hora}">
                <span>${hora} hs</span>
            </label>
        `;
    });
}

// 3. NAVEGACIÓN Y BARRA DE PROGRESO CONTROLADA
function nextStep(stepNumber) {
    if (stepNumber === 2) {
        if (!document.querySelector('input[name="barber"]:checked')) {
            alert("Por favor, selecciona un barbero primero."); return;
        }
    }
    if (stepNumber === 3) {
        if (!document.querySelector('input[name="service"]:checked')) {
            alert("Por favor, selecciona un servicio primero."); return;
        }
    }
    if (stepNumber === 4) {
        const dateSelected = document.getElementById('appointment-date').value;
        const timeSelected = document.querySelector('input[name="time"]:checked');
        if (!dateSelected || !timeSelected) {
            alert("Por favor, selecciona tanto la fecha como la hora."); return;
        }
    }

    // Actualizar barra de progreso (porcentaje visual)
    const progreso = (stepNumber / 4) * 100;
    document.getElementById('progress').style.width = `${progreso}%`;

    // Cambiar de pantalla
    document.querySelectorAll('.booking-section').forEach(s => s.classList.remove('active'));
    document.getElementById(`step-${stepNumber}`).classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function prevStep(stepNumber) {
    const progreso = (stepNumber / 4) * 100;
    document.getElementById('progress').style.width = `${progreso}%`;

    document.querySelectorAll('.booking-section').forEach(s => s.classList.remove('active'));
    document.getElementById(`step-${stepNumber}`).classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 4. CONFIRMACIÓN Y ARMADO DE TICKET INTERACTIVO (PASO 5)
function confirmarTurno() {
    const barbero = document.querySelector('input[name="barber"]:checked').value;
    const servicioInput = document.querySelector('input[name="service"]:checked');
    const fecha = document.getElementById('appointment-date').value;
    const hora = document.querySelector('input[name="time"]:checked').value;
    const pago = document.querySelector('input[name="payment"]:checked');
    const nombre = document.getElementById('client-name').value.trim();
    const telefonoCliente = document.getElementById('client-phone').value.trim();

    if (!pago || !nombre || !telefonoCliente) {
        alert("Por favor, completa todos los datos de contacto."); return;
    }

    const fechaFormateada = fecha.split('-').reverse().join('/');
    const precioServicio = servicioInput.getAttribute('data-price');

    // Guardamos los datos globalmente para usarlos en el botón de envío posterior
    turnoRegistrado = {
        cliente: nombre, barbero: barbero, servicio: servicioInput.value,
        fecha: fechaFormateada, hora: hora, pago: pago.value,
        telefono: telefonoCliente, precio: precioServicio
    };

    // Inyectamos los datos dinámicamente directamente en las etiquetas del Ticket del Paso 5
    document.getElementById('tk-cliente').innerText = nombre;
    document.getElementById('tk-barbero').innerText = barbero;
    document.getElementById('tk-servicio').innerText = servicioInput.value;
    document.getElementById('tk-fecha').innerText = fechaFormateada;
    document.getElementById('tk-hora').innerText = hora + " hs";
    document.getElementById('tk-pago').innerText = pago.value;
    document.getElementById('tk-total').innerText = precioServicio;

    // Llenamos la barra al 100% y mostramos el Ticket
    document.getElementById('progress').style.width = "100%";
    document.querySelectorAll('.booking-section').forEach(s => s.classList.remove('active'));
    document.getElementById('step-5').classList.add('active');
}

// 5. ENVIAR DATOS DE FONDO AL CHATBOT PROPIO 🤖 (CONEXIÓN CON NGROK)
function enviarMensajeWhatsApp() {
    // Definimos los números reales de los barberos
    let numeroBarbero = "";
    if (turnoRegistrado.barbero === "Nico") {
        numeroBarbero = "5493885706742"; 
    } else {
        numeroBarbero = "5493884031208"; 
    }

    // Armamos el paquete de datos para el servidor local
    const datosParaElBot = {
        cliente: turnoRegistrado.cliente,
        barbero: turnoRegistrado.barbero,
        servicio: turnoRegistrado.servicio,
        fecha: turnoRegistrado.fecha,
        hora: turnoRegistrado.hora,
        pago: turnoRegistrado.pago,
        precio: turnoRegistrado.precio,
        whatsapp_cliente: turnoRegistrado.telefono, // Número que cargó el cliente en el formulario
        whatsapp_barbero: numeroBarbero       // Número del barbero asignado arriba
    };

    // Petición HTTP al túnel seguro de Ngrok que conecta con tu Node.js local
    fetch('https://f924-181-111-205-181.ngrok-free.app/api/nuevo-turno', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(datosParaElBot)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(`¡Turno confirmado de forma automática! El bot ya despachó los WhatsApps de confirmación.`);
            location.reload(); // Reinicia la página para el próximo cliente
        } else {
            alert("El bot recibió los datos pero no pudo enviar el mensaje. Revisá que el celular del bot tenga internet.");
        }
    })
    .catch(error => {
        console.error("Error al conectar con el bot:", error);
        alert("No se pudo conectar con el Chatbot. Asegurate de tener la terminal de Ngrok y la de Node activas de fondo.");
    });
}