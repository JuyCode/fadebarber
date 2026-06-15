// Variable global para retener la info antes de mandar a la API
let turnoRegistrado = {};

// 1. CONTROL DE CALENDARIO: Bloquear días pasados y domingos + escuchar cambios
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

    // Escucha si cambia el barbero seleccionado para recalcular horarios al toque
    document.querySelectorAll('input[name="barber"]').forEach(radio => {
        radio.addEventListener('change', () => {
            generarHorariosDinamicos();
        });
    });
});

// 2. HORARIOS DINÁMICOS: LOS LUNES ABREN DESDE LAS 17 Y LOS OCUPADOS DESAPARECEN
async function generarHorariosDinamicos() {
    const barberoInput = document.querySelector('input[name="barber"]:checked');
    const dateInput = document.getElementById('appointment-date');
    const container = document.getElementById('time-slots-container');
    
    // Si falta elegir barbero o fecha, limpiamos el contenedor y no hacemos nada
    if (!barberoInput || !dateInput.value) {
        container.innerHTML = "";
        return;
    }

    const barbero = barberoInput.value;
    const fecha = dateInput.value; // Formato YYYY-MM-DD
    
    // Detectamos qué día de la semana es (0 = Domingo, 1 = Lunes, 2 = Martes, etc.)
    const numeroDiaSemana = new Date(fecha + 'T00:00:00').getDay();

    // Formato seguro con guiones invertidos (DD-MM-YYYY) para viajar limpio en la URL sin %2F
    const fechaParaEnviar = fecha.split('-').reverse().join('-'); 

    container.innerHTML = `<p style="color: #666; font-size: 14px;">Buscando horarios libres...</p>`;

    try {
        // Definimos la grilla de horarios base del local según el barbero o el día lunes
        let horasDisponibles = [];

        if (numeroDiaSemana === 1) {
            // 📌 REGLA ESPECIAL: Si es LUNES, abren solo desde las 17:00 hs para todos los barberos
            horasDisponibles = ["17:00", "18:00", "19:00", "20:00", "21:00"];
        } else {
            // Grilla normal para el resto de los días (Martes a Sábado)
            if (barbero === "Nico" || barbero === "Tito") {
                horasDisponibles = ["10:00", "11:00", "12:00", "13:00", "17:00", "18:00", "19:00", "20:00", "21:00"];
            } else {
                horasDisponibles = ["10:30", "12:00", "13:00", "15:00", "17:00", "19:00", "21:00"];
            }
        }

        // 🚀 CONSULTA REAL AL BACKEND EN RENDERS
        const respuesta = await fetch(`https://fadebarber.onrender.com/api/horarios-ocupados?fecha=${fechaParaEnviar}&barbero=${encodeURIComponent(barbero)}`);
        const datos = await respuesta.json();
        
        let turnosOcupados = [];
        if (datos.success) {
            turnosOcupados = datos.horariosOcupados; 
        }

        container.innerHTML = ""; // Limpiamos el texto de carga

        let horariosMostrados = 0;

        // Dibujamos los botones en la pantalla
        horasDisponibles.forEach(hora => {
            const estaOcupado = turnosOcupados.includes(hora);

            // Si está ocupado en Supabase, el bloque directamente desaparece
            if (estaOcupado) {
                return; 
            }

            // Si está libre, se genera el botón de forma normal
            horariosMostrados++;
            container.innerHTML += `
                <label class="time-option">
                    <input type="radio" name="time" value="${hora}">
                    <span>${hora} hs</span>
                </label>
            `;
        });

        // Alerta visual por si se reservó absolutamente todo ese día
        if (horariosMostrados === 0) {
            container.innerHTML = `<p style="color: #ff9800; font-size: 14px; font-weight: bold;">¡Se agotaron los turnos! Este barbero no tiene horarios disponibles para esta fecha.</p>`;
        }

    } catch (error) {
        console.error("❌ Error al conectar con el endpoint de horarios:", error);
        container.innerHTML = `<p style="color: #ff0000; font-size: 14px;">Error al cargar los horarios. Por favor, reintentá.</p>`;
    }
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

    let numeroBarbero = (barbero === "Nico") ? "5493885706742" : "5493884031208";

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

    document.getElementById('progress').style.width = "100%";

    // 🚀 PETICIÓN HTTP AL BACKEND REAL EN PRODUCTION
    fetch('https://fadebarber.onrender.com/api/nuevo-turno', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(datosTurno)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            document.querySelectorAll('.booking-section').forEach(s => s.classList.remove('active'));
            document.getElementById('step-5').classList.add('active');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            alert(data.error || "Hubo un problema al registrar el turno en el sistema. Por favor, reintentá.");
        }
    })
    .catch(error => {
        console.error("Error al conectar con el servidor:", error);
        alert("No se pudo conectar con el sistema de reservas. Por favor, intentá más tarde.");
    });
}