// Variable global para retener la info antes de mandar a la API
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
// 2. HORARIOS DINÁMICOS EN BASE AL BARBERO Y TURNOS OCUPADOS
// 2. HORARIOS DINÁMICOS EN BASE AL BARBERO Y TURNOS OCUPADOS
function generarHorariosDinamicos() {
    const barbero = document.querySelector('input[name="barber"]:checked').value;
    const container = document.getElementById('time-slots-container');
    container.innerHTML = ""; // Limpiamos

    // 1. Definimos la grilla de horarios del local según el barbero
    let horasDisponibles = [];
    if (barbero === "Nico" || barbero === "Tito") {
        horasDisponibles = ["10:00", "11:00", "12:00", "13:00", "17:00", "18:00", "19:00", "20:00", "21:00"];
    } else {
        horasDisponibles = ["10:30", "12:00", "13:00", "15:00", "17:00", "19:00", "21:00"];
    }

    // 2. SIMULACIÓN DE TURNOS OCUPADOS (Mañana vendrá de la base de datos)
    let turnosOcupados = []; 
    if (barbero === "Nico") {
        turnosOcupados = ["12:00", "18:00"]; 
    }
    if (barbero === "Tito") {
        turnosOcupados = ["17:00"];
    }

    // 3. Dibujamos los botones en la pantalla
    horasDisponibles.forEach(hora => {
        const estaOcupado = turnosOcupados.includes(hora);

        if (estaOcupado) {
            // Versión limpia: mismo diseño, pero grisado y deshabilitado
            container.innerHTML += `
                <label class="time-option" style="background-color: #eaeaea; border-color: #d1d1d1; color: #aaaaaa; cursor: not-allowed; opacity: 0.6;">
                    <input type="radio" name="time" value="${hora}" disabled>
                    <span>${hora} hs</span>
                </label>
            `;
        } else {
            // Botón normal disponible
            container.innerHTML += `
                <label class="time-option">
                    <input type="radio" name="time" value="${hora}">
                    <span>${hora} hs</span>
                </label>
            `;
        }
    });
}

// 3. NAVEGACIÓN Y BARRA DE PROGRESO
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

    const progreso = (stepNumber / 4) * 100;
    document.getElementById('progress').style.width = `${progreso}%`;

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

// 4. CONFIRMACIÓN DIRECTA Y ENVÍO AL BACKEND EN LA NUBE 🤖
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

    // Mapeo directo de los números reales de los barberos
    let numeroBarbero = (barbero === "Nico") ? "5493885706742" : "5493884031208";

    // Armamos el JSON limpio para el nuevo backend
    const datosTurno = {
        cliente: nombre,
        barbero: barbero,
        servicio: servicioInput.value,
        fecha: fechaFormateada,
        hora: hora,
        pago: pago.value,
        precio: precioServicio,
        whatsapp_cliente: telefonoCliente,
        whatsapp_barbero: numeroBarbero
    };

    // Actualizamos la barra visual al 100%
    document.getElementById('progress').style.width = "100%";

    // 🚀 PETICIÓN HTTP AL BACKEND DEFINITIVO EN INTERNET
    // NOTA: Cuando hagas el deploy de tu server.js en Render o Railway,
    // vas a reemplazar 'http://localhost:3000' por la URL real que te den.
    fetch('http://localhost:3000/api/nuevo-turno', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(datosTurno)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Pasamos directo a la pantalla final de éxito limpia
            document.querySelectorAll('.booking-section').forEach(s => s.classList.remove('active'));
            document.getElementById('step-5').classList.add('active');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            alert("Hubo un problema al registrar el turno en el sistema. Por favor, reintentá.");
        }
    })
    .catch(error => {
        console.error("Error al conectar con el servidor:", error);
        alert("No se pudo conectar con el sistema de reservas. Por favor, intentá más tarde.");
    });
}