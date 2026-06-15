import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 2. CONEXIÓN DIRECTA POR PUERTO WEB
const MONGO_URI = 'mongodb+srv://luchocatorcino60_db_user:d0ggAdUJ1Eyyex2n@cluster0.zcrdxb7.mongodb.net/barberia?retryWrites=true&w=majority&tls=true&srvMaxHosts=1';

mongoose.connect(MONGO_URI)
    .then(() => console.log('🍃 Conectado exitosamente a MongoDB Atlas (Base de Datos Real)'))
    .catch(err => console.error('❌ Error crítico al conectar a MongoDB:', err));

// 3. Estructura para guardar tus turnos en la base de datos
const turnoSchema = new mongoose.Schema({
    cliente: String,
    barbero: String,
    servicio: String,
    fecha: String,
    hora: String,
    pago: String,
    precio: String,
    whatsapp_cliente: String,
    whatsapp_barbero: String,
    creadoEn: { type: Date, default: Date.now }
});

const Turno = mongoose.model('Turno', turnoSchema);

app.post('/api/nuevo-turno', async (req, res) => {
    const { cliente, barbero, servicio, fecha, hora, pago, precio, whatsapp_cliente, whatsapp_barbero } = req.body;
    console.log(`📡 Nuevo turno recibido de ${cliente} para el barbero ${barbero}`);

    try {
        // 4. EL CANDADO: Validamos duplicados
        const turnoDuplicado = await Turno.findOne({ fecha, hora, barbero });
        if (turnoDuplicado) {
            console.warn(`⚠️ Intento de duplicado bloqueado: El barbero ${barbero} ya tiene ocupado el horario de las ${hora} hs.`);
            return res.status(400).json({ success: false, error: `El horario de las ${hora} hs ya fue reservado para el barbero ${barbero}.` });
        }

        // 5. Endpoints de Kapso
        const urlKapsoNico = "https://api.kapso.ai/platform/v1/workflows/361c3bc1-be2f-44ea-ab82-2cfb42ea4466/executions";
        const urlKapsoTito = "https://api.kapso.ai/platform/v1/workflows/b9b45fdd-9beb-4672-a239-fe54d5c42157/executions";
        const urlDestino = (barbero === "Nico") ? urlKapsoNico : urlKapsoTito;

        const datosParaKapso = {
            workflow_execution: {
                phone_number: whatsapp_cliente,
                variables: { nombre: cliente, fecha, hora, precio }
            }
        };

        const respuestaKapso = await fetch(urlDestino, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': '5a0a8128ff1d87ba2b54b0673f3ff75f56abd66bb0e207a8330cc9c865254105'
            },
            body: JSON.stringify(datosParaKapso)
        });

        if (!respuestaKapso.ok) {
            console.warn(`⚠️ Kapso rebotó el pedido. Código: ${respuestaKapso.status}`);
        } else {
            console.log('✅ Datos enviados a Kapso. Mensajes de WhatsApp en camino.');
        }

        // 6. GUARDADO PERMANENTE
        const nuevoTurno = new Turno({ cliente, barbero, servicio, fecha, hora, pago, precio, whatsapp_cliente, whatsapp_barbero });
        await nuevoTurno.save();
        console.log(`💾 Turno guardado exitosamente en MongoDB Atlas para ${cliente}`);

        res.status(200).json({ success: true, message: 'Turno procesado y guardado correctamente' });

    } catch (error) {
        console.error('❌ Error interno en el proceso del servidor:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor al procesar el turno' });
    }
});

// ... Resto del código de escucha igual ...
app.listen(PORT, () => {
    console.log(`🚀 Servidor backend corriendo de forma segura en el puerto ${PORT}`);
});