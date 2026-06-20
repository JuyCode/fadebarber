import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js'; // Importamos el cliente de Supabase

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000; // Render usa el puerto 10000 por defecto en su entorno

app.use(cors());
app.use(express.json());

// 1. CONEXIÓN DIRECTA A SUPABASE (Tus datos reales de la captura)
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://heirivzfsksbrfdesfwa.supabase.co'; 

// 📌 EN LAS COMILLAS DE ABAJO, BORRÁ LO QUE PUSE Y PEGÁ TU CLAVE (La que copiaste con los cuadraditos al lado de Publishable key)
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_gNLnzXOEvSoZqzJyA3LTOQ_P4kRbpJ_';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. ENDPOINT: CONSULTAR HORARIOS OCUPADOS DESDE SUPABASE
app.get('/api/horarios-ocupados', async (req, res) => {
    const { fecha, barbero } = req.query;

    if (!fecha || !barbero) {
        return res.status(400).json({ success: false, error: 'Faltan parámetros requeridos: fecha y barbero' });
    }

    try {
        // Buscamos en la tabla 'turnos' de Supabase los horarios reservados para ese barbero en ese día
        const { data: turnos, error } = await supabase
            .from('turnos')
            .select('hora')
            .eq('fecha', fecha)
            .eq('barbero', barbero);

        if (error) throw error;

        // Mapeamos para devolver solo un array con las horas ocupadas (ej: ["10:00", "13:00"])
        const horariosOcupados = turnos.map(t => t.hora);

        res.status(200).json({ success: true, horariosOcupados });
    } catch (error) {
        console.error('❌ Error al consultar horarios en Supabase:', error);
        res.status(500).json({ success: false, error: 'Error al consultar la grilla de horarios' });
    }
});

// 3. ENDPOINT: CREAR NUEVO TURNO (SOLO VALIDA Y GUARDA EN SUPABASE)
app.post('/api/nuevo-turno', async (req, res) => {
    const { cliente, barbero, servicio, fecha, hora, pago, precio, whatsapp_cliente, whatsapp_barbero } = req.body;
    console.log(`📡 Nuevo turno recibido de ${cliente} para el barbero ${barbero}`);

    try {
        // EL CANDADO: Validamos en Supabase si ya existe un turno para el mismo barbero, fecha y hora
        const { data: turnoExistente, error: errorBusqueda } = await supabase
            .from('turnos')
            .select('*')
            .eq('fecha', fecha)
            .eq('hora', hora)
            .eq('barbero', barbero)
            .maybeSingle();

        if (errorBusqueda) throw errorBusqueda;

        if (turnoExistente) {
            console.warn(`⚠️ Intento de duplicado bloqueado: El barbero ${barbero} ya tiene ocupado el horario de las ${hora} hs.`);
            return res.status(400).json({ success: false, error: `El horario de las ${hora} hs ya fue reservado para el barbero ${barbero}.` });
        }

        // GUARDADO PERMANENTE EN SUPABASE DIRECTO
        const { error: errorInsercion } = await supabase
            .from('turnos')
            .insert([
                { 
                    cliente, 
                    barbero, 
                    servicio, 
                    fecha, 
                    hora, 
                    pago, 
                    precio, 
                    whatsapp_cliente, 
                    whatsapp_barbero 
                }
            ]);

        if (errorInsercion) throw errorInsercion;
        console.log(`💾 Turno guardado exitosamente en Supabase para ${cliente}`);

        // Devolvemos éxito inmediato para que el frontend dispare el enlace wa.me
        res.status(200).json({ success: true, message: 'Turno procesado y guardado correctamente' });

    } catch (error) {
        console.error('❌ Error interno en el proceso del servidor:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor al procesar el turno' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor backend corriendo de forma segura en el puerto ${PORT}`);
});