/**
 * Servicio del Agente de IA Potente (Google Gemini) para Adaptación Curricular TEA
 * Desarrollado para el sistema EDUMÁTICO TEA - UNERG
 */

const { GoogleGenAI } = require('@google/genai');

// Inicializamos el cliente oficial de Gemini utilizando la variable de entorno del archivo .env
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Envía el texto del docente y el perfil del estudiante al Agente de IA de Gemini
 * @param {String} textoOriginal - Contenido o guía cargada por el docente
 * @param {Object} perfilEstudiante - Preferencias cognitivas y sensoriales del estudiante TEA
 */
async function procesarAdaptacionIA(textoOriginal, perfilEstudiante) {
    try {
        // Validación básica por si el texto viene vacío
        if (!textoOriginal || textoOriginal.trim() === '') {
            return {
                success: false,
                message: 'El texto a procesar se encuentra vacío.'
            };
        }

        // Definir un perfil por defecto basado en los requerimientos de la UNERG
        const perfil = perfilEstudiante || {
            tipo_perfil: "TEA Nivel 1 - Apoyo Visual",
            estilo_aprendizaje: "Visual-Estructurado",
            preferencias: {
                usar_pictogramas: true,
                limite_parrafo_palabras: 40,
                tipo_lenguaje: "Directo, literal y sin metáforas complejas"
            }
        };

        // Construcción del Prompt Psicopedagógico Especializado para el Agente
        const promptSistema = `
            Actúa como un Agente Psicopedagógico y Docente Experto en Neurodiversidad, 
            Trastorno del Espectro Autista (TEA) y Accesibilidad Cognitiva en la carrera de Ingeniería en Informática.
            
            Tu tarea es analizar el siguiente texto académico proporcionado por un profesor universitario 
            y adaptarlo pedagógicamente según el perfil del estudiante.

            PERFIL DEL ESTUDIANTE:
            - Estilo: ${perfil.estilo_aprendizaje}
            - Necesita pictogramas/esquemas: ${perfil.preferencias.usar_pictogramas}
            - Estilo de lenguaje requerido: ${perfil.preferencias.tipo_lenguaje}

            TEXTO ORIGINAL DEL DOCENTE:
            "${textoOriginal}"

            INSTRUCCIONES OBLIGATORIAS:
            1. Evalúa la carga cognitiva y clasifícala estrictamente en un estado de semáforo: 
               - 'verde' (si el texto es claro y accesible), 
               - 'amarillo' (si requiere moderado apoyo visual o resúmenes), 
               - 'rojo' (si es demasiado denso, abstracto o extenso y requiere reestructuración profunda).
            2. Genera un diagnóstico pedagógico breve explicando por qué se asignó ese nivel.
            3. Reescribe el texto en "Lectura Fácil" (oraciones cortas, uso de viñetas, tono literal).
            4. Proporciona una lista de 2 o 3 recursos visuales recomendados (ej. "Pictograma de bucle", "Esquema de árbol binario", "Mapa conceptual").

            RESPONDE ÚNICAMENTE EN FORMATO JSON VÁLIDO (sin bloques de código markdown adicionales como \\\`json, solo el texto plano JSON), con esta estructura exacta:
            {
              "semaforo": "verde | amarillo | rojo",
              "analisis_ia": {
                "diagnostico_pedagogico": "texto aquí",
                "texto_adaptado_lectura_facil": "texto aquí",
                "recursos_sugeridos": ["recurso 1", "recurso 2"]
              }
            }
        `;

        // Llamada potente al modelo gemini-2.5-flash
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: promptSistema,
        });

        // Limpiar la respuesta del modelo por si devuelve formato markdown
        let respuestaTexto = response.text.trim();
        respuestaTexto = respuestaTexto.replace(/^json\s*/, '').replace(/^\s*/, '').replace(/\s*```$/, '');

        // Convertir la respuesta de texto a un objeto JSON utilizable por nuestra API
        const resultadoParseado = JSON.parse(respuestaTexto);

        return {
            success: true,
            semaforo: resultadoParseado.semaforo || 'amarillo',
            analisis_ia: resultadoParseado.analisis_ia
        };

    } catch (error) {
        console.error('⚠️ Error al conectar con el Agente de IA de Gemini:', error.message);
        
        // SISTEMA DE RESPALDO (FALLBACK): Regla algorítmica local por seguridad
        const totalPalabras = textoOriginal.trim().split(/\s+/).length;
        const semaforoLocal = totalPalabras > 100 ? 'rojo' : totalPalabras > 40 ? 'amarillo' : 'verde';

        return {
            success: true,
            semaforo: semaforoLocal,
            analisis_ia: {
                diagnostico_pedagogico: 'Adaptación procesada mediante sistema de respaldo local (Modo seguro).',
                texto_adaptado_lectura_facil: textoOriginal,
                recursos_sugeridos: ['Resumen estructurado', 'Esquema visual básico']
            }
        };
    }
}

// Exportamos la función usando sintaxis estándar de CommonJS
module.exports = {
    procesarAdaptacionIA
};