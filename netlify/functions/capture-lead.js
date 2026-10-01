/**
 * Netlify Serverless Function: capture-lead
 * Tu Sitio Web 3.0 — Motor de Captura Inbound & Notificación Instantánea
 * 
 * Flujo:
 * 1. Recibe POST con datos del prospecto (URL, Nombre, WhatsApp, Métricas estimadas).
 * 2. Valida payload y descarta bots (Honeypot).
 * 3. Si TELEGRAM_BOT_TOKEN y TELEGRAM_CHAT_ID están configurados, envía alerta PUSH a Telegram.
 * 4. Si LEAD_WEBHOOK_URL está configurado, reenvía a Make / n8n / Discord / Zapier / CRM.
 * 5. Responde 200 OK con confirmación y ID de lead para trazabilidad.
 */

// Headers CORS para llamadas AJAX seguras
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, X-Requested-With',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

/**
 * Sanitiza texto eliminando etiquetas HTML y caracteres potencialmente peligrosos.
 */
function sanitizeText(str, maxLength = 200) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, maxLength);
}

/**
 * Sanitiza y valida formato de número telefónico (énfasis en Chile +56).
 */
function sanitizePhone(phoneStr) {
  if (!phoneStr || typeof phoneStr !== 'string') return '';
  // Extrae solo dígitos y el signo + inicial
  let cleaned = phoneStr.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('569') && !cleaned.startsWith('+569')) {
    cleaned = '+' + cleaned;
  } else if (cleaned.startsWith('9') && cleaned.length === 9) {
    cleaned = '+56' + cleaned;
  }
  return cleaned.slice(0, 20);
}

/**
 * Formatea y envía alerta a Telegram Bot si las variables de entorno están presentes.
 */
async function sendTelegramAlert(lead) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    // Modo local / sin configurar Telegram aún
    return { sent: false, reason: 'TELEGRAM_CONFIG_MISSING' };
  }

  const phoneLink = lead.phone 
    ? `https://wa.me/${lead.phone.replace(/[^\d]/g, '')}?text=${encodeURIComponent(`Hola ${lead.businessName || ''}, te contacto de Tu Sitio Web 3.0 respecto al diagnóstico de ${lead.url}`)}`
    : null;

  const caption = [
    `🔥 *¡NUEVO LEAD INBOUND EN TUSITIOWEB3.CL!*`,
    ``,
    `🏢 *Negocio:* ${lead.businessName || 'No indicado'}`,
    `🌐 *Sitio Web:* [${lead.domain}](${lead.url})`,
    `📱 *WhatsApp:* \`${lead.phone || 'No registrado'}\``,
    ``,
    `📊 *Diagnóstico Inicial:*`,
    `• Velocidad Móvil: *${lead.perfScore ?? 'N/A'}/100* (${lead.loadTime ?? 'N/A'}s)`,
    `• Fuga Estimada: *${lead.lostVisits ? `~${lead.lostVisits} visitas/mes` : 'N/A'}*`,
    `• Origen: *${lead.source || 'Widget Auditoría'}*`,
    `• Fecha: \`${new Date().toLocaleString('es-CL', { timeZone: 'America/Santiago' })}\``,
    ``,
    phoneLink ? `👉 [Iniciar Chat de WhatsApp con el Lead](${phoneLink})` : `⚠️ *Sin teléfono: revisar analytics o web para contacto.*`
  ].join('\n');

  try {
    const telegramUrl = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: caption,
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      })
    });
    const data = await res.json();
    return { sent: data.ok, data };
  } catch (err) {
    console.error('Error enviando a Telegram:', err.message);
    return { sent: false, error: err.message };
  }
}

/**
 * Reenvía el lead a un webhook externo (Make/n8n/Discord/Zapier/CRM) si está configurado.
 */
async function sendWebhookAlert(lead) {
  const webhookUrl = process.env.LEAD_WEBHOOK_URL;
  if (!webhookUrl) {
    return { sent: false, reason: 'WEBHOOK_CONFIG_MISSING' };
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'inbound_lead_captured',
        timestamp: new Date().toISOString(),
        lead
      })
    });
    return { sent: res.ok, status: res.status };
  } catch (err) {
    console.error('Error enviando a Webhook externo:', err.message);
    return { sent: false, error: err.message };
  }
}

exports.handler = async (event) => {
  // Manejo de preflight CORS (OPTIONS)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: CORS_HEADERS,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Method Not Allowed. Use POST.' })
    };
  }

  try {
    let payload = {};
    if (event.body) {
      // Soporta tanto application/json como form-urlencoded
      if (event.headers['content-type']?.includes('application/x-www-form-urlencoded')) {
        const params = new URLSearchParams(event.body);
        payload = Object.fromEntries(params.entries());
      } else {
        payload = JSON.parse(event.body);
      }
    }

    // 1. Anti-Bot Honeypot: si el campo señuelo viene con datos, descartar silenciosamente
    if (payload.bot_field || payload['bot-field']) {
      console.warn('Bot submission descartada por honeypot.');
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: true, message: 'Processed' })
      };
    }

    // 2. Sanitización y validación de campos
    const rawUrl = sanitizeText(payload.url || payload['audit-url'] || '', 250);
    const businessName = sanitizeText(payload.name || payload['audit-name'] || payload.businessName || '', 120);
    const phone = sanitizePhone(payload.phone || payload['audit-phone'] || '');
    const source = sanitizeText(payload.source || 'audit-widget', 50);

    // Métricas calculadas o reportadas
    const perfScore = Number(payload.perfScore || payload.calculated_perf_score) || null;
    const loadTime = Number(payload.loadTime || payload.calculated_load_time) || null;
    const lostVisits = Number(payload.lostVisits || payload.estimated_lost_visits) || null;

    if (!rawUrl && !phone) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Debes proporcionar al menos una URL o teléfono de contacto.' })
      };
    }

    // Normalizar URL
    let fullUrl = rawUrl;
    if (fullUrl && !/^https?:\/\//i.test(fullUrl)) {
      fullUrl = 'https://' + fullUrl;
    }
    const domain = fullUrl ? fullUrl.replace(/^https?:\/\//i, '').split('/')[0].replace(/^www\./i, '') : '';

    const leadRecord = {
      id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      source,
      domain,
      url: fullUrl,
      businessName: businessName || domain || 'Comercio Local',
      phone,
      perfScore,
      loadTime,
      lostVisits,
      userAgent: event.headers['user-agent'] ? sanitizeText(event.headers['user-agent'], 150) : null
    };

    console.log(`[INBOUND LEAD CAPTURADO] ${leadRecord.businessName} (${leadRecord.domain}) - Tel: ${leadRecord.phone}`);

    // 3. Despacho asíncrono a canales de notificación
    const [telegramResult, webhookResult] = await Promise.all([
      sendTelegramAlert(leadRecord),
      sendWebhookAlert(leadRecord)
    ]);

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        success: true,
        message: 'Lead capturado exitosamente',
        leadId: leadRecord.id,
        telegramAlert: telegramResult.sent,
        webhookAlert: webhookResult.sent
      })
    };

  } catch (error) {
    console.error('Error procesando lead inbound:', error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: 'Error interno procesando lead',
        details: error.message
      })
    };
  }
};
