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

function convert(inName, outName, sheetName = 'Leads') {
  const csvPath = path.join(__dirname, 'out', inName);
  const outPath = path.join(__dirname, 'out', outName);
  const csv = fs.readFileSync(csvPath, 'utf8');
  const lines = csv.split(/\r?\n/).filter(Boolean);
  const rows = lines.map((line) => parseCSVLine(line));
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, outPath);
  console.log('Written:', outPath);
}

convert('saved_leads_page1.csv', 'saved_leads.xlsx', 'Saved Leads');
convert('saved_leads_new_format.csv', 'saved_leads_new_format.xlsx', 'Saved Leads (new format)');
