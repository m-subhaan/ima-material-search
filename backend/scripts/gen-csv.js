const fs = require('fs');
const path = require('path');

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function toCSV(rows) {
  if (!rows || rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')];
  for (const row of rows) {
    const line = headers
      .map((h) => {
        const v = row[h] == null ? '' : String(row[h]);
        return '"' + v.replace(/"/g, '""') + '"';
      })
      .join(',');
    lines.push(line);
  }
  return lines.join('\n');
}

function main() {
  const projectRoot = path.resolve(__dirname, '..', '..');
  const srcMaterialsPath = path.join(projectRoot, 'webapp', 'model', 'data', 'materials.json');

  if (!fs.existsSync(srcMaterialsPath)) {
    console.error('Source file not found:', srcMaterialsPath);
    process.exit(1);
  }

  const src = JSON.parse(fs.readFileSync(srcMaterialsPath, 'utf8'));

  const outDir = path.join(projectRoot, 'backend', 'db', 'data');
  ensureDir(outDir);

  const plants = src.plants || [];
  const vendors = src.vendors || [];
  const materials = (src.materials || []).map((m) => {
    const details = m.requestorDetails || {};
    return {
      requestID: m.requestID || '',
      materialsID: m.materialsID || '',
      materialNumber: m.materialNumber || '',
      materialName: m.materialName || '',
      materialDescription: m.materialDescription || '',
      createdAt: m.createdAt || '',
      createdBy: m.createdBy || '',
      modifiedAt: m.modifiedAt || '',
      modifiedBy: m.modifiedBy || '',
      plant_ID: m.plant_ID || '',
      vendor_ID: m.vendor_ID || '',
      status: m.status || '',
      requestorFirstName: details.firstName || '',
      requestorLastName: details.lastName || '',
      requestorEmail: details.emailAddress || '',
    };
  });

  fs.writeFileSync(path.join(outDir, 'ima-Plants.csv'), toCSV(plants));
  fs.writeFileSync(path.join(outDir, 'ima-Vendors.csv'), toCSV(vendors));
  fs.writeFileSync(path.join(outDir, 'ima-Materials.csv'), toCSV(materials));

  console.log('CSV generated in', outDir);
}

main();


