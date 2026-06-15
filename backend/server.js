import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js'; // Importamos el cliente de Supabase

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000; // Render usa el puerto 10000 por defecto en su entorno

app.use(cors());
app.use(express.json());

// 1. CONEXIÓN DIRECTA A SUPABASE (Tu base de datos real y rápida)
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xtfcrbdrgsknmvpswuzm.supabase.co'; 
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0ZmNyYmRyZ3Nrbm12cHN3dXptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTgzMTU0MDAsImV4cCI6MjAzMzkxMTQwMH0.Xb4D5_E9Gz_Key_Real_De_Tu_Supabase';

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

// 3. ENDPOINT: CREAR NUEVO TURNO (VALIDA EN SUPABASE Y ENVÍA WHATSAPP CON KAPSO)
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

        // CONTROL DE ENDPOINTS DE KAPSO FOR WHATSAPP
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
            console.warn(`⚠️ Kapso rebotó el pedido de mensaje. Código: ${respuestaKapso.status}`);
        } else {
            console.log('✅ Datos enviados a Kapso de forma exitosa.');
        }

        // GUARDADO PERMANENTE EN SUPABASE
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

        res.status(200).json({ success: true, message: 'Turno procesado y guardado correctamente' });

    } catch (error) {
        console.error('❌ Error interno en el proceso del servidor:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor al procesar el turno' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor backend corriendo de forma segura en el puerto ${PORT}`);
});