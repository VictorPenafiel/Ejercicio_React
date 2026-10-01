// ═══════════════════════════════════════════════════════════
// Suite de Pruebas Unitarias: Lógica de Negocio y Funciones
// Tu Sitio Web 3.0 — Ingeniería QA
// ═══════════════════════════════════════════════════════════

const assert = require('assert');

// 1. Module under test: Currency Formatter
function formatCLP(num) {
  if (typeof num !== 'number' || isNaN(num)) throw new Error('Invalid number');
  return '$' + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' CLP';
}

// 2. Module under test: Budget & Timeline Calculator
const baseConfig = {
  landing: { name: 'Landing Page Pro', minPrice: 180000, maxPrice: 250000, minDays: 5, maxDays: 7 },
  corporate: { name: 'Sitio Web Corporativo', minPrice: 350000, maxPrice: 550000, minDays: 10, maxDays: 14 },
  ecommerce: { name: 'Tienda Online / E-commerce', minPrice: 550000, maxPrice: 890000, minDays: 15, maxDays: 21 },
  custom: { name: 'Software Web a Medida', minPrice: 850000, maxPrice: 1400000, minDays: 20, maxDays: 30 }
};

const featurePricing = {
  seo: { name: 'SEO Pro On-Page', price: 40000, days: 1 },
  whatsapp: { name: 'Chat WhatsApp Flotante', price: 0, days: 0 },
  blog: { name: 'Módulo Blog / Noticias', price: 60000, days: 2 },
  payment: { name: 'Pasarela de Pago (Webpay)', price: 90000, days: 3 },
  cms: { name: 'Panel Autoadministrable', price: 100000, days: 3 },
  multilang: { name: 'Multilenguaje (ES / EN)', price: 70000, days: 2 }
};

function calculateQuote(projectType, selectedFeatures = []) {
  const base = baseConfig[projectType] || baseConfig.landing;
  let minPrice = base.minPrice;
  let maxPrice = base.maxPrice;
  let minDays = base.minDays;
  let maxDays = base.maxDays;
  const featureNames = [];

  for (const featKey of selectedFeatures) {
    const feat = featurePricing[featKey];
    if (feat) {
      minPrice += feat.price;
      maxPrice += feat.price;
      minDays += feat.days;
      maxDays += feat.days;
      featureNames.push(feat.name);
    }
  }

  return {
    projectName: base.name,
    minPrice,
    maxPrice,
    formattedRange: `${formatCLP(minPrice)} - ${formatCLP(maxPrice)}`,
    minDays,
    maxDays,
    timelineText: `${minDays} a ${maxDays} días hábiles`,
    featureNames
  };
}

// 3. Module under test: WhatsApp Message Generator & URL Encoder
function generateWhatsAppQuoteUrl(phone, quoteData) {
  if (!phone || typeof phone !== 'string') throw new Error('Phone must be a valid string');
  const featuresText = quoteData.featureNames.length > 0 
    ? quoteData.featureNames.join(', ') 
    : 'Ninguna adicional';

  const message = `Hola Víctor, coticé en el sitio web de Tu Sitio Web 3.0:\n` +
    `• Tipo de proyecto: ${quoteData.projectName}\n` +
    `• Funcionalidades elegidas: ${featuresText}\n` +
    `• Rango estimado: ${quoteData.formattedRange}\n` +
    `• Plazo estimado: ${quoteData.timelineText}\n\n` +
    `¿Podríamos conversar para afinar los detalles?`;

  return `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
}

// 4. Module under test: Portfolio Filter Predicate
function isProjectMatchingFilter(categoriesArray, selectedFilter) {
  if (!selectedFilter || selectedFilter === 'all') return true;
  if (!Array.isArray(categoriesArray)) return false;
  return categoriesArray.includes(selectedFilter);
}

// 5. Module under test: EaseOutCubic algorithm
function easeOutCubic(progress) {
  const p = Math.max(0, Math.min(progress, 1));
  return 1 - Math.pow(1 - p, 3);
}

// ═══════════════════════════════════════════════════════════
// Test Execution Suite
// ═══════════════════════════════════════════════════════════

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

console.log('\n=== INICIANDO SUITE DE PRUEBAS UNITARIAS ===\n');

// Group: formatCLP
console.log('--- Pruebas Unitarias: Formateador de Moneda CLP ---');
it('debe formatear números enteros con separadores de miles y sufijo CLP', () => {
  assert.strictEqual(formatCLP(180000), '$180.000 CLP');
  assert.strictEqual(formatCLP(1400000), '$1.400.000 CLP');
  assert.strictEqual(formatCLP(0), '$0 CLP');
});

it('debe arrojar error ante valores numéricos inválidos', () => {
  assert.throws(() => formatCLP('10000'), /Invalid number/);
  assert.throws(() => formatCLP(NaN), /Invalid number/);
});

// Group: calculateQuote
console.log('\n--- Pruebas Unitarias: Calculadora de Presupuesto ---');
it('debe calcular valores base para Landing Page sin extras', () => {
  const result = calculateQuote('landing', []);
  assert.strictEqual(result.projectName, 'Landing Page Pro');
  assert.strictEqual(result.minPrice, 180000);
  assert.strictEqual(result.maxPrice, 250000);
  assert.strictEqual(result.minDays, 5);
  assert.strictEqual(result.maxDays, 7);
  assert.strictEqual(result.formattedRange, '$180.000 CLP - $250.000 CLP');
});

it('debe sumar correctamente precio y días al agregar SEO Pro y Pasarela Webpay', () => {
  const result = calculateQuote('corporate', ['seo', 'payment']);
  // Corporate base: 350.000 - 550.000, 10-14 days
  // SEO: +40.000, +1 day
  // Payment: +90.000, +3 days
  // Totals: min 480.000, max 680.000, 14 - 18 days
  assert.strictEqual(result.minPrice, 480000);
  assert.strictEqual(result.maxPrice, 680000);
  assert.strictEqual(result.minDays, 14);
  assert.strictEqual(result.maxDays, 18);
  assert.strictEqual(result.featureNames.length, 2);
  assert.ok(result.featureNames.includes('SEO Pro On-Page'));
  assert.ok(result.featureNames.includes('Pasarela de Pago (Webpay)'));
});

it('debe manejar fallback a landing si se pasa un tipo inexistente', () => {
  const result = calculateQuote('non_existent', []);
  assert.strictEqual(result.projectName, 'Landing Page Pro');
});

// Group: WhatsApp URL Generator
console.log('\n--- Pruebas Unitarias: Generador de URLs de WhatsApp ---');
it('debe generar una URL wa.me segura con teléfono sanitizado y mensaje codificado', () => {
  const quote = calculateQuote('ecommerce', ['whatsapp']);
  const url = generateWhatsAppQuoteUrl('+56 9 8382 4327', quote);
  assert.ok(url.startsWith('https://wa.me/56983824327?text='));
  assert.ok(url.includes(encodeURIComponent('Tienda Online / E-commerce')));
  assert.ok(url.includes(encodeURIComponent(quote.formattedRange)));
  // Check no raw newlines or unsafe characters in URL
  assert.ok(!url.includes('\n'));
});

// Group: Portfolio Filter
console.log('\n--- Pruebas Unitarias: Filtro de Categorías del Portafolio ---');
it('debe coincidir con "all" para cualquier conjunto de categorías', () => {
  assert.strictEqual(isProjectMatchingFilter(['wellness'], 'all'), true);
  assert.strictEqual(isProjectMatchingFilter(['turismo', 'ecommerce'], 'all'), true);
});

it('debe validar pertenencia exacta a la categoría', () => {
  assert.strictEqual(isProjectMatchingFilter(['turismo', 'ecommerce'], 'ecommerce'), true);
  assert.strictEqual(isProjectMatchingFilter(['wellness'], 'ecommerce'), false);
  assert.strictEqual(isProjectMatchingFilter(null, 'ecommerce'), false);
});

// Group: EaseOutCubic
console.log('\n--- Pruebas Unitarias: Curva de Animación Easing ---');
it('debe calcular valores en los límites 0 y 1', () => {
  assert.strictEqual(easeOutCubic(0), 0);
  assert.strictEqual(easeOutCubic(1), 1);
  assert.ok(easeOutCubic(0.5) > 0.5); // Ease out starts faster
});

console.log(`\n===========================================`);
console.log(`RESULTADO FINAL: ${passed} PASADAS, ${failed} FALLIDAS`);
console.log(`===========================================\n`);

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
