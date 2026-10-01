// ═══════════════════════════════════════════════════════════
// Suite de Pruebas de Seguridad (Security Audit): OWASP & CWE
// Tu Sitio Web 3.0 — Seguridad en Código Generado
// ═══════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const htmlPath = path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

const scriptPath = path.join(__dirname, '..', 'script.js');
const script = fs.readFileSync(scriptPath, 'utf8');

let passed = 0;
let failed = 0;

function it(desc, fn) {
  try {
    fn();
    console.log(`  ✔ PASS: ${desc}`);
    passed++;
  } catch (err) {
    console.error(`  ✖ FAIL: ${desc}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

console.log('\n=== INICIANDO AUDITORÍA DE SEGURIDAD (OWASP & CWE) ===\n');

// 1. CWE-798: Hardcoded Secrets & Sensitive Credentials
console.log('--- 1. CWE-798: Detección de Secretos y Llaves Expuestas ---');
it('no debe haber llaves de API privadas (OpenAI, AWS, Stripe secret, GitHub PAT, Supabase service_role)', () => {
  const secretPatterns = [
    /sk-[a-zA-Z0-9]{32,}/,
    /AKIA[0-9A-Z]{16}/,
    /ghp_[a-zA-Z0-9]{36}/,
    /eyJhbGciOi[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}/, // JWT format
    /service_role/i
  ];

  secretPatterns.forEach(pattern => {
    assert.ok(!pattern.test(script), `Patrón de secreto detectado en script.js: ${pattern}`);
    assert.ok(!pattern.test(html), `Patrón de secreto detectado en index.html: ${pattern}`);
  });
});

// 2. CWE-79: Cross-Site Scripting (XSS) Sinks
console.log('\n--- 2. CWE-79: Prevención de Inyección XSS y Manipulación de DOM ---');
it('no debe utilizar eval(), Function() o document.write() en script.js', () => {
  assert.ok(!/\beval\s*\(/.test(script), 'Se detectó eval() en script.js');
  assert.ok(!/\bFunction\s*\(/.test(script), 'Se detectó constructor Function() en script.js');
  assert.ok(!/document\.write\s*\(/.test(script), 'Se detectó document.write() en script.js');
});

it('las inserciones dinámicas de texto deben usar textContent y no concatenaciones inseguras en innerHTML', () => {
  // Check for dangerous innerHTML = var or template string with unvalidated variables
  const dangerousInnerHTML = /innerHTML\s*=\s*`[^`]*\$\{.*?\}[^`]*`/g;
  const matches = script.match(dangerousInnerHTML) || [];
  assert.strictEqual(matches.length, 0, `Posible XSS en innerHTML: ${matches.join(', ')}`);
});

// 3. Tabnapping Protection (rel="noopener noreferrer")
console.log('\n--- 3. OWASP: Prevención de Reverse Tabnapping en Enlaces Externos ---');
it('todos los enlaces target="_blank" en index.html deben tener rel="noopener noreferrer"', () => {
  const blankLinks = html.match(/<a[^>]+target=["']_blank["'][^>]*>/g) || [];
  assert.ok(blankLinks.length > 0, 'Deben existir enlaces externos');
  
  blankLinks.forEach(link => {
    const hasRel = /rel=["'][^"']*noopener[^"']*["']/.test(link) && /rel=["'][^"']*noreferrer[^"']*["']/.test(link);
    assert.ok(hasRel, `Enlace externo sin rel="noopener noreferrer": ${link}`);
  });
});

// 4. CWE-319: Cleartext Transmission of Sensitive Information
console.log('\n--- 4. CWE-319: Uso Exclusivo de HTTPS en Recursos Externos ---');
it('todos los recursos externos (scripts, hojas de estilo, fuentes, imágenes) deben usar HTTPS', () => {
  const insecureUrls = html.match(/(src|href)=["']http:\/\/[^"']+["']/g) || [];
  // Exclude XML namespaces or schema definitions
  const filtered = insecureUrls.filter(u => !u.includes('http://www.w3.org/2000/svg'));
  assert.strictEqual(filtered.length, 0, `Recursos inseguros con HTTP encontrados: ${filtered.join(', ')}`);
});

// 5. URL Encoding & Sanitization
console.log('\n--- 5. Sanitización de Parámetros en Enlaces Salientes (WhatsApp) ---');
it('script.js debe codificar parámetros dinámicos con encodeURIComponent', () => {
  assert.ok(script.includes('encodeURIComponent('), 'Falta encodeURIComponent para parámetros de WhatsApp');
});

console.log(`\n===========================================`);
console.log(`RESULTADO FINAL DE SEGURIDAD: ${passed} PASADAS, ${failed} FALLIDAS`);
console.log(`===========================================\n`);

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
