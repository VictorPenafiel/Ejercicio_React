// ═══════════════════════════════════════════════════════════
// Suite de Pruebas de Integración: DOM, Accesibilidad y Eventos
// Tu Sitio Web 3.0 — Ingeniería QA
// ═══════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const htmlPath = path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

const scriptPath = path.join(__dirname, '..', 'script.js');
const script = fs.readFileSync(scriptPath, 'utf8');

const cssPath = path.join(__dirname, '..', 'styles.css');
const css = fs.readFileSync(cssPath, 'utf8');

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

console.log('\n=== INICIANDO SUITE DE PRUEBAS DE INTEGRACIÓN ===\n');

// 1. Structural Binding: Required IDs in index.html
console.log('--- 1. Verificación de Enlaces e IDs entre script.js e index.html ---');
const requiredIds = [
  'footer-year',
  'nav-toggle',
  'drawer-close',
  'mobile-drawer',
  'drawer-backdrop',
  'site-nav',
  'scroll-progress',
  'terminal-content',
  'terminal-replay',
  'tab-term',
  'tab-stack',
  'tab-metrics',
  'pane-term',
  'pane-stack',
  'pane-metrics',
  'counter-years',
  'counter-custom',
  'counter-score',
  'project-modal',
  'modal-close',
  'modal-close-btn',
  'modal-image',
  'modal-badge',
  'modal-project-title',
  'modal-desc',
  'modal-solution',
  'modal-techs',
  'modal-live-link',
  'project-type-options',
  'calc-whatsapp-btn',
  'summary-title',
  'summary-price',
  'summary-timeline',
  'copy-email-card',
  'toast-msg',
  'toast-text',
  'res-source-badge',
  'res-cms-pill',
  'res-bottlenecks-list'
];

requiredIds.forEach(id => {
  it(`el elemento #${id} debe existir en index.html`, () => {
    const regex = new RegExp(`id=["']${id}["']`);
    assert.ok(regex.test(html), `Falta el elemento con id="${id}" en index.html`);
  });
});

// 2. Accessibility & ARIA Integrity
console.log('\n--- 2. Verificación de Accesibilidad y Roles ARIA ---');
it('el menú móvil (drawer) debe contar con role="dialog" y aria-modal="true"', () => {
  assert.ok(/id=["']mobile-drawer["'][^>]*role=["']dialog["']/.test(html));
  assert.ok(/id=["']mobile-drawer["'][^>]*aria-modal=["']true["']/.test(html));
});

it('el modal de proyectos debe contar con role="dialog" y aria-modal="true"', () => {
  assert.ok(/id=["']project-modal["'][^>]*role=["']dialog["']/.test(html));
  assert.ok(/id=["']project-modal["'][^>]*aria-modal=["']true["']/.test(html));
});

it('los controles de terminal deben tener role="tablist" y role="tab"', () => {
  assert.ok(/role=["']tablist["']/.test(html));
  assert.ok(/role=["']tab["'][^>]*data-tab=["']term["']/.test(html));
  assert.ok(/role=["']tab["'][^>]*data-tab=["']stack["']/.test(html));
  assert.ok(/role=["']tab["'][^>]*data-tab=["']metrics["']/.test(html));
});

it('todas las imágenes deben tener atributo alt descriptivo', () => {
  const imgMatches = html.match(/<img[^>]+>/g) || [];
  assert.ok(imgMatches.length > 0, 'Debe haber imágenes en la página');
  imgMatches.forEach(img => {
    assert.ok(/alt=["'][^"']+["']/.test(img), `Imagen sin alt: ${img}`);
  });
});

// 3. Styling Tokens & Classes Verification
console.log('\n--- 3. Verificación de Clases y Tokens CSS ---');
it('styles.css debe definir tokens de color con buen contraste y glassmorphism', () => {
  assert.ok(css.includes('--bg-primary: #080C14;'));
  assert.ok(css.includes('--copper: #F97316;'));
  assert.ok(css.includes('--text-primary: #F8FAFC;'));
  assert.ok(css.includes('.glass-card'));
  assert.ok(css.includes('.mobile-drawer'));
  assert.ok(css.includes('.project-modal-backdrop'));
});

it('styles.css debe incluir soporte para prefers-reduced-motion', () => {
  assert.ok(css.includes('@media (prefers-reduced-motion: reduce)'));
});

console.log(`\n===========================================`);
console.log(`RESULTADO FINAL: ${passed} PASADAS, ${failed} FALLIDAS`);
console.log(`===========================================\n`);

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
