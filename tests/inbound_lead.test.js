// ═══════════════════════════════════════════════════════════
// Suite de Pruebas: Automatización #1 - Captura de Leads Inbound
// Tu Sitio Web 3.0 — Ingeniería QA
// ═══════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const { handler } = require('../netlify/functions/capture-lead');
const htmlPath = path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

let passed = 0;
let failed = 0;

function it(desc, fn) {
  return Promise.resolve()
    .then(() => fn())
    .then(() => {
      console.log(`  ✔ PASS: ${desc}`);
      passed++;
    })
    .catch((err) => {
      console.error(`  ✖ FAIL: ${desc}`);
      console.error(`    ${err.message}`);
      failed++;
    });
}

async function runTests() {
  console.log('\n=== INICIANDO PRUEBAS DE AUTOMATIZACIÓN #1 (CAPTURA INBOUND) ===\n');

  console.log('--- 1. Pruebas de la Serverless Function capture-lead ---');

  await it('debe responder 204 No Content a solicitudes preflight OPTIONS (CORS)', async () => {
    const res = await handler({ httpMethod: 'OPTIONS', headers: {} });
    assert.strictEqual(res.statusCode, 204);
    assert.strictEqual(res.headers['Access-Control-Allow-Origin'], '*');
  });

  await it('debe rechazar métodos no permitidos (GET) con 405 Method Not Allowed', async () => {
    const res = await handler({ httpMethod: 'GET', headers: {} });
    assert.strictEqual(res.statusCode, 405);
    const body = JSON.parse(res.body);
    assert.ok(body.error.includes('Method Not Allowed'));
  });

  await it('debe descartar silenciosamente envíos con honeypot completado (Anti-Bot)', async () => {
    const res = await handler({
      httpMethod: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        url: 'spamsite.com',
        bot_field: 'soy un bot malicioso'
      })
    });
    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
  });

  await it('debe rechazar solicitudes vacías sin URL ni teléfono con 400 Bad Request', async () => {
    const res = await handler({
      httpMethod: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({})
    });
    assert.strictEqual(res.statusCode, 400);
    const body = JSON.parse(res.body);
    assert.ok(body.error);
  });

  await it('debe procesar exitosamente un lead válido, normalizar dominio y generar leadId', async () => {
    const res = await handler({
      httpMethod: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        url: 'turismopucon.cl',
        name: 'Turismo Pucón Aventura',
        phone: '983824327',
        perfScore: 28,
        loadTime: 4.2,
        lostVisits: 620
      })
    });
    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.success, true);
    assert.ok(body.leadId.startsWith('lead_'));
  });

  console.log('\n--- 2. Pruebas de Configuración de Formularios en index.html ---');

  await it('el formulario #audit-live-form debe incluir atributos Netlify Forms nativos', () => {
    assert.ok(/id=["']audit-live-form["'][^>]*data-netlify=["']true["']/.test(html));
    assert.ok(/name=["']audit-lead["']/.test(html));
    assert.ok(/netlify-honeypot=["']bot-field["']/.test(html));
  });

  await it('debe contener los campos ocultos de persistencia de métricas calculadas', () => {
    assert.ok(/id=["']audit-hidden-perf["']/.test(html));
    assert.ok(/id=["']audit-hidden-time["']/.test(html));
    assert.ok(/id=["']audit-hidden-loss["']/.test(html));
  });

  console.log('\n===========================================');
  console.log(`RESULTADO AUTOMATIZACIÓN #1: ${passed} PASADAS, ${failed} FALLIDAS`);
  console.log('===========================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
