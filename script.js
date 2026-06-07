// Función para avanzar de paso con validaciones
function nextStep(stepNumber) {
    // Validación del Paso 1: Seleccionar Barbero
    if (stepNumber === 2) {
        const barberSelected = document.querySelector('input[name="barber"]:checked');
        if (!barberSelected) {
            alert("Por favor, selecciona un barbero primero.");
            return;
        }
    }
    // Validación del Paso 2: Seleccionar Servicio
    if (stepNumber === 3) {
        const serviceSelected = document.querySelector('input[name="service"]:checked');
        if (!serviceSelected) {
            alert("Por favor, selecciona un servicio primero.");
            return;
        }
    }
    // Validación del Paso 3: Seleccionar Fecha y Hora
    if (stepNumber === 4) {
        const dateSelected = document.getElementById('appointment-date').value;
        const timeSelected = document.querySelector('input[name="time"]:checked');
        if (!dateSelected || !timeSelected) {
            alert("Por favor, selecciona tanto el día como el horario.");
            return;
        }
    }

    // Cambiar visualmente de sección
    document.querySelectorAll('.booking-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(`step-${stepNumber}`).classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Sube la pantalla al inicio del paso
}

// Función para retroceder de paso
function prevStep(stepNumber) {
    document.querySelectorAll('.booking-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(`step-${stepNumber}`).classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Confirmar y compilar mensaje para WhatsApp
function confirmarTurno() {
    const barbero = document.querySelector('input[name="barber"]:checked').value;
    const servicio = document.querySelector('input[name="service"]:checked').value;
    const fecha = document.getElementById('appointment-date').value;
    const hora = document.querySelector('input[name="time"]:checked').value;
    const pago = document.querySelector('input[name="payment"]:checked');
    const nombre = document.getElementById('client-name').value.trim();
    const telefonoCliente = document.getElementById('client-phone').value.trim();

    // Validar campos de contacto finales
    if (!pago || !nombre || !telefonoCliente) {
        alert("Por favor, completa todos los datos de contacto y el método de pago.");
        return;
    }

    const fechaFormateada = fecha.split('-').reverse().join('/');

    // Configura acá tu número real de la barbería (ej: 5493884123456)
    const tuNumeroWhatsApp = "549388XXXXXXX"; 

    // Mensaje automático estructurado incluyendo el servicio elegido
    const mensaje = `Hola! Me gustaría confirmar un turno:%0A` +
                    `💈 *Barbero:* ${barbero}%0A` +
                    `✂️ *Servicio:* ${servicio}%0A` +
                    `📅 *Fecha:* ${fechaFormateada}%0A` +
                    `⏰ *Hora:* ${hora} hs%0A` +
                    `💳 *Pago:* ${pago.value}%0A` +
                    `👤 *Cliente:* ${nombre}%0A` +
                    `📱 *WhatsApp:* ${telefonoCliente}`;

    const urlWhatsApp = `https://wa.me/${tuNumeroWhatsApp}?text=${mensaje}`;

    window.open(urlWhatsApp, '_blank');
}
