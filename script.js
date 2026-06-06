// Función para avanzar de paso
function nextStep(stepNumber) {
    // Validaciones básicas antes de avanzar
    if (stepNumber === 2) {
        const barberSelected = document.querySelector('input[name="barber"]:checked');
        if (!barberSelected) {
            alert("Por favor, selecciona un barbero primero.");
            return;
        }
    }
    if (stepNumber === 3) {
        const dateSelected = document.getElementById('appointment-date').value;
        const timeSelected = document.querySelector('input[name="time"]:checked');
        if (!dateSelected || !timeSelected) {
            alert("Por favor, selecciona tanto el día como el horario.");
            return;
        }
    }

    // Ocultar todas las secciones y activar la siguiente
    document.querySelectorAll('.booking-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(`step-3`).scrollIntoView({ behavior: 'smooth' }); // Corrección visual rápida
    document.getElementById(`step-${stepNumber}`).classList.add('active');
}

// Función para retroceder de paso
function prevStep(stepNumber) {
    document.querySelectorAll('.booking-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(`step-${stepNumber}`).classList.add('active');
}

// Función final para confirmar y enviar a WhatsApp
function confirmarTurno() {
    const barbero = document.querySelector('input[name="barber"]:checked').value;
    const fecha = document.getElementById('appointment-date').value;
    const hora = document.querySelector('input[name="time"]:checked').value;
    const pago = document.querySelector('input[name="payment"]:checked');
    const nombre = document.getElementById('client-name').value.trim();
    const telefonoCliente = document.getElementById('client-phone').value.trim();

    // Validar que el paso 3 esté completo
    if (!pago || !nombre || !telefonoCliente) {
        alert("Por favor, completa todos los datos de contacto y el método de pago.");
        return;
    }

    // Formatear la fecha para que se lea mejor (opcional)
    const fechaFormateada = fecha.split('-').reverse().join('/');

    // Tu número de teléfono de la barbería adonde llegará el mensaje (Código de país + área + número sin el 15)
    // Ejemplo para Jujuy: 5493884123456
    const tuNumeroWhatsApp = "5493884418917"; 

    // Estructuramos el mensaje de texto automático
    const mensaje = `Hola! Me gustaría confirmar un turno:%0A` +
                    `💈 *Barbero:* ${barbero}%0A` +
                    `📅 *Fecha:* ${fechaFormateada}%0A` +
                    `⏰ *Hora:* ${hora} hs%0A` +
                    `💳 *Pago:* ${pago.value}%0A` +
                    `👤 *Cliente:* ${nombre}%0A` +
                    `📱 *WhatsApp:* ${telefonoCliente}`;

    // Creamos el enlace de la API de WhatsApp
    const urlWhatsApp = `https://wa.me/${tuNumeroWhatsApp}?text=${mensaje}`;

    // Abrimos el chat de WhatsApp en una pestaña nueva
    window.open(urlWhatsApp, '_blank');
}