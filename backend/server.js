import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Configuración de variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Ruta para recibir los turnos desde el formulario web
app.post('/api/nuevo-turno', async (req, res) => {
    const { cliente, barbero, servicio, fecha, hora, pago, precio, whatsapp_cliente, whatsapp_barbero } = req.body;

    console.log(`📡 Nuevo turno recibido de ${cliente} para el barbero ${barbero}`);

    // 1. Definimos las URLs de Kapso (Nico viejo y Tito Nuevo)
    const urlKapsoNico = "https://api.kapso.ai/platform/v1/workflows/361c3bc1-be2f-44ea-ab82-2cfb42ea4466/executions";
    const urlKapsoTito = "https://api.kapso.ai/platform/v1/workflows/b9b45fdd-9beb-4672-a239-fe54d5c42157/executions";
    
    // Elegimos el endpoint de Kapso según el barbero seleccionado
    const urlDestino = (barbero === "Nico") ? urlKapsoNico : urlKapsoTito;

    try {
        // 2. Armamos el paquete incluyendo "phone_number" a nivel raíz del workflow como exige Kapso
        const datosParaKapso = {
            workflow_execution: {
                phone_number: whatsapp_cliente, // <--- ACÁ lo pide Kapso para la cajita del cliente
                variables: {
                    nombre: cliente,      // Coincide con {{trigger.body.variables.nombre}}
                    fecha: fecha,         // Coincide con {{trigger.body.variables.fecha}}
                    hora: hora,           // Coincide con {{trigger.body.variables.hora}}
                    precio: precio        // Coincide con {{trigger.body.variables.precio}}
                }
            }
        };

        // 3. Le avisamos a Kapso mediante un POST incluyendo tu API Key de seguridad real
        const respuestaKapso = await fetch(urlDestino, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': '5a0a8128ff1d87ba2b54b0673f3ff75f56abd66bb0e207a8330cc9c865254105'
            },
            body: JSON.stringify(datosParaKapso)
        });

        // REVISIÓN DE RESPUESTA DE KAPSO
        if (!respuestaKapso.ok) {
            const errorDetalle = await respuestaKapso.text();
            console.warn(`⚠️ Kapso rebotó el pedido. Código de estado: ${respuestaKapso.status}`);
            console.warn(`💬 Detalle del error de Kapso: ${errorDetalle}`);
        } else {
            console.log('✅ Datos enviados a Kapso. Mensajes de WhatsApp en camino.');
        }

        // Respondemos éxito al frontend de tu página web
        res.status(200).json({ success: true, message: 'Turno procesado correctamente' });

    } catch (error) {
        console.error('❌ Error al conectar con Kapso:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor backend corriendo de forma segura en el puerto ${PORT}`);
});