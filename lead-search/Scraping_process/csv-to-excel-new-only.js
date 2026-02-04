const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

function parseCSVLine(line) {
  const row = [];
  let cell = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') inQuotes = !inQuotes;
    else if (c === ',' && !inQuotes) {
      row.push(cell.trim());
      cell = '';
    } else cell += c;
  }
  row.push(cell.trim());
  return row;
}

const base = path.join(__dirname, 'out');
const csv = fs.readFileSync(path.join(base, 'saved_leads_new_format.csv'), 'utf8');
const rows = csv.split(/\r?\n/).filter(Boolean).map(parseCSVLine);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Leads');
const tsv = rows.map((r) => r.map((c) => (c.includes('\t') ? `"${c.replace(/"/g, '""')}"` : c)).join('\t')).join('\r\n');
fs.writeFileSync(path.join(base, 'saved_leads_new_format.tsv'), tsv, 'utf8');
try {
  XLSX.writeFile(wb, path.join(base, 'saved_leads_new_format.xlsx'));
  console.log('Written: out/saved_leads_new_format.xlsx');
} catch (e) {
  XLSX.writeFile(wb, path.join(base, 'saved_leads_new_format_latest.xlsx'));
  console.log('Written: out/saved_leads_new_format_latest.xlsx (original was locked)');
}
console.log('Written: out/saved_leads_new_format.tsv');
