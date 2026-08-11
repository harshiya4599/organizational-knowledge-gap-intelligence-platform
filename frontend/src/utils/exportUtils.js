/**
 * exportUtils.js
 * Fully functional client-side export utility for CSV, Excel (.xls), PDF, and Print reporting.
 */

function escapeCSVCell(value) {
  if (value === null || value === undefined) return '""';
  let stringValue = String(value);
  if (Array.isArray(value)) {
    stringValue = value.join('; ');
  } else if (typeof value === 'object') {
    stringValue = JSON.stringify(value);
  }
  stringValue = stringValue.replace(/"/g, '""');
  return `"${stringValue}"`;
}

function resolveColumns(data, columns) {
  if (Array.isArray(columns) && columns.length > 0) {
    return columns;
  }
  if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
    return Object.keys(data[0]).map((key) => ({
      label: key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase()),
      key: key,
    }));
  }
  return [];
}

/**
 * 1. CSV Export - Triggers direct browser download of utf-8 CSV file
 */
export function exportToCSV(data, columns = [], filename = 'report') {
  if (!data || data.length === 0) {
    throw new Error('No data available to export.');
  }

  const cols = resolveColumns(data, columns);
  const headerRow = cols.map((col) => escapeCSVCell(col.label)).join(',');
  const dataRows = data.map((row) => {
    return cols
      .map((col) => {
        const val = row[col.key] !== undefined ? row[col.key] : '';
        return escapeCSVCell(val);
      })
      .join(',');
  });

  // UTF-8 BOM byte sequence so Excel opens CSV without encoding bugs
  const csvContent = '\uFEFF' + [headerRow, ...dataRows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 2. Excel (.xls) Export - Triggers direct browser download of Excel spreadsheet
 */
export function exportToExcel(data, columns = [], filename = 'report') {
  if (!data || data.length === 0) {
    throw new Error('No data available to export to Excel.');
  }

  const cols = resolveColumns(data, columns);

  let tableHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8" />
      <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Report</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
      <style>
        table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
        th { background-color: #1E3A8A; color: #FFFFFF; font-weight: bold; padding: 8px; border: 1px solid #CBD5E1; text-align: left; }
        td { padding: 6px 8px; border: 1px solid #CBD5E1; color: #1E293B; font-size: 12px; }
        tr:nth-child(even) { background-color: #F8FAFC; }
      </style>
    </head>
    <body>
      <h2>Organizational Knowledge Gap Intelligence Platform - Report</h2>
      <p>Generated on: ${new Date().toLocaleString()}</p>
      <table>
        <thead>
          <tr>
            ${cols.map((col) => `<th>${col.label}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data
            .map(
              (row) => `
            <tr>
              ${cols.map((col) => `<td>${row[col.key] !== undefined ? row[col.key] : ''}</td>`).join('')}
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 3. PDF Export - Generates styled PDF document print window & download
 */
export function exportToPDF(data, columns = [], filename = 'report') {
  if (!data || data.length === 0) {
    throw new Error('No data available for PDF export.');
  }

  const cols = resolveColumns(data, columns);
  const printWin = window.open('', '_blank');

  if (!printWin) {
    throw new Error('Popup window blocked. Please allow popups to export PDF.');
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${filename} - PDF Report</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #0F172A; padding: 30px; }
        .header { border-bottom: 2px solid #2563EB; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
        .title { font-size: 20px; font-weight: bold; color: #1E3A8A; }
        .subtitle { font-size: 12px; color: #64748B; margin-top: 4px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th { background-color: #2563EB; color: white; padding: 10px; font-size: 11px; text-align: left; text-transform: uppercase; letter-spacing: 0.5px; }
        td { border-bottom: 1px solid #E2E8F0; padding: 8px 10px; font-size: 11px; color: #334155; }
        tr:nth-child(even) { background-color: #F8FAFC; }
        .footer { margin-top: 30px; border-top: 1px solid #E2E8F0; pt-2; text-align: center; font-size: 10px; color: #94A3B8; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="title">Knowledge Gap Intelligence Platform</div>
          <div class="subtitle">Official Executive Report &middot; ${filename}</div>
        </div>
        <div style="font-size: 11px; color: #64748B;">Date: ${new Date().toLocaleDateString()}</div>
      </div>

      <table>
        <thead>
          <tr>
            ${cols.map((col) => `<th>${col.label}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data
            .map(
              (row) => `
            <tr>
              ${cols.map((col) => `<td>${row[col.key] !== undefined ? row[col.key] : ''}</td>`).join('')}
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>

      <div class="footer">
        Confidential &middot; Organizational Knowledge Gap Intelligence Platform &middot; Page 1 of 1
      </div>

      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  printWin.document.write(htmlContent);
  printWin.document.close();
}

/**
 * 4. Print Report - Triggers native window print dialog
 */
export function printReport() {
  window.print();
}
