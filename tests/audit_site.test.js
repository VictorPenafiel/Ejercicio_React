// ═══════════════════════════════════════════════════════════
// Suite de Pruebas: Automatización #2 - Auditoría en Vivo con Datos Reales
// Tu Sitio Web 3.0 — Ingeniería QA
// ═══════════════════════════════════════════════════════════

const assert = require('assert');
const { handler } = require('../netlify/functions/audit-site');

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
  console.log('\n=== INICIANDO PRUEBAS DE AUTOMATIZACIÓN #2 (AUDITORÍA EN VIVO) ===\n');

  console.log('--- 1. Pruebas de la Serverless Function audit-site ---');

  await it('debe responder 204 No Content a solicitudes preflight OPTIONS (CORS)', async () => {
    const res = await handler({ httpMethod: 'OPTIONS', headers: {} });
    assert.strictEqual(res.statusCode, 204);
    assert.strictEqual(res.headers['Access-Control-Allow-Origin'], '*');
  });

  await it('debe rechazar solicitudes sin URL con 400 Bad Request', async () => {
    const res = await handler({ httpMethod: 'GET', queryStringParameters: {} });
    assert.strictEqual(res.statusCode, 400);
    const body = JSON.parse(res.body);
    assert.ok(body.error);
  });

  await it('debe soportar llamadas POST con JSON body', async () => {
    const res = await handler({
      httpMethod: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url: 'example.com' })
    });
    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.domain, 'example.com');
    assert.ok(typeof body.perfScore === 'number');
    assert.ok(typeof body.loadTime === 'number');
    assert.ok(Array.isArray(body.bottlenecks));
  });

  await it('debe retornar métricas reales de TTFB, CMS y Cuellos de Botella', async () => {
    const res = await handler({
      httpMethod: 'GET',
      queryStringParameters: { url: 'https://example.com' }
    });
    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.ok(body.serverTimeMs > 0, 'Debe medir el tiempo de respuesta del servidor (TTFB)');
    assert.ok(body.cms, 'Debe identificar el CMS o arquitectura');
    assert.ok(body.bottlenecks.length > 0, 'Debe listar cuellos de botella detectados');
    assert.ok(body.bounceRate > 0, 'Debe estimar tasa de rebote');
    assert.ok(body.lostVisits > 0, 'Debe estimar visitas perdidas');
  });

  await it('debe utilizar cache en memoria para consultas sucesivas del mismo dominio', async () => {
    const t0 = Date.now();
    const res1 = await handler({ httpMethod: 'GET', queryStringParameters: { url: 'https://example.com' } });
    const duration = Date.now() - t0;
    assert.strictEqual(res1.statusCode, 200);
    assert.ok(duration < 100, `La respuesta en cache debe ser inmediata (<100ms), tardó: ${duration}ms`);
  });

  console.log('\n===========================================');
  console.log(`RESULTADO AUTOMATIZACIÓN #2: ${passed} PASADAS, ${failed} FALLIDAS`);
  console.log('===========================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
