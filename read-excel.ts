import * as XLSX from 'xlsx';

const workbook = XLSX.readFile('SS3 Student Roster (Corrected Arms).xlsx');
console.log('Sheets:', workbook.SheetNames);
workbook.SheetNames.forEach(sheetName => {
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet);
  console.log(`\n--- ${sheetName} (${data.length} rows) ---`);
  console.log('Columns:', data[0] ? Object.keys(data[0]) : 'none');
  data.slice(0, 5).forEach((row, i) => console.log(`Row ${i+1}:`, row));
});