import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Configuración de variables de entorno (para proteger tus tokens)
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Permite que tu web de GitHub Pages se conecte a este servidor sin bloqueos de CORS
app.use(cors());
app.use(express.json());

// Ruta para recibir los turnos desde el formulario web
app.post('/api/nuevo-turno', async (req, res) => {
    const { cliente, barbero, servicio, fecha, hora, pago, precio, whatsapp_cliente, whatsapp_barbero } = req.body;

    console.log(`📡 Nuevo turno recibido de ${cliente} para el barbero ${barbero}`);

    // NOTA: Mañana reemplazamos estos valores con los datos reales de tu chip nuevo en el archivo .env
    const token = process.env.META_ACCESS_TOKEN;
    const idTelefono = process.env.META_PHONE_ID;

    try {
        // Aquí irá la lógica fetch para mandarle los datos limpios a Meta.
        // Como ya no usamos Puppeteer ni abrimos Chrome de fondo, el servidor no consume nada.

        // Si todo sale bien, le avisamos a la web para que muestre el mensaje de éxito
        res.status(200).json({ success: true, message: 'Turno procesado correctamente' });

    } catch (error) {
        console.error('❌ Error al conectar con la API de Meta:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor backend corriendo de forma segura en el puerto ${PORT}`);
});