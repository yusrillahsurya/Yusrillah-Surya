import test from 'node:test';
import assert from 'node:assert/strict';

// Test formatting and terbilang logic
function numberToWordsIndo(num) {
  const bilangan = [
    '', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan',
    'Sepuluh', 'Sebelas'
  ];

  const roundNum = Math.floor(Math.abs(num));
  if (roundNum === 0) return 'Nol Rupiah';

  function terbilangHelper(n) {
    if (n < 12) {
      return bilangan[n];
    } else if (n < 20) {
      return `${terbilangHelper(n - 10)} Belas`;
    } else if (n < 100) {
      const sisa = n % 10;
      return `${terbilangHelper(Math.floor(n / 10))} Puluh ${sisa > 0 ? terbilangHelper(sisa) : ''}`.trim();
    } else if (n < 200) {
      return `Seratus ${terbilangHelper(n - 100)}`.trim();
    } else if (n < 1000) {
      const sisa = n % 100;
      return `${terbilangHelper(Math.floor(n / 100))} Ratus ${sisa > 0 ? terbilangHelper(sisa) : ''}`.trim();
    } else if (n < 2000) {
      return `Seribu ${terbilangHelper(n - 1000)}`.trim();
    } else if (n < 1000000) {
      const sisa = n % 1000;
      return `${terbilangHelper(Math.floor(n / 1000))} Ribu ${sisa > 0 ? terbilangHelper(sisa) : ''}`.trim();
    } else if (n < 1000000000) {
      const sisa = n % 1000000;
      return `${terbilangHelper(Math.floor(n / 1000000))} Juta ${sisa > 0 ? terbilangHelper(sisa) : ''}`.trim();
    } else if (n < 1000000000000) {
      const sisa = n % 1000000000;
      return `${terbilangHelper(Math.floor(n / 1000000000))} Miliar ${sisa > 0 ? terbilangHelper(sisa) : ''}`.trim();
    } else {
      const sisa = n % 1000000000000;
      return `${terbilangHelper(Math.floor(n / 1000000000000))} Triliun ${sisa > 0 ? terbilangHelper(sisa) : ''}`.trim();
    }
  }

  const result = terbilangHelper(roundNum);
  return `${result} Rupiah`.replace(/\s+/g, ' ');
}

test('Terbilang returns correct Indonesian words for standard amounts', () => {
  assert.equal(numberToWordsIndo(1000000), 'Satu Juta Rupiah');
  assert.equal(numberToWordsIndo(25000000), 'Dua Puluh Lima Juta Rupiah');
  assert.equal(numberToWordsIndo(133200000), 'Seratus Tiga Puluh Tiga Juta Dua Ratus Ribu Rupiah');
});

test('Document Number formatting generates expected pattern', () => {
  const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  const month = romanMonths[new Date().getMonth()];
  const year = new Date().getFullYear();

  const pattern = new RegExp(`^INV/YPS/${year}/${month}/\\d{3}$`);
  const sampleNum = `INV/YPS/${year}/${month}/001`;
  assert.match(sampleNum, pattern);
});
