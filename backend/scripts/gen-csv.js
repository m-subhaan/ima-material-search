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

function generateSampleMaterialRequests() {
  const vendors = ['Caterpillar Inc.', 'Komatsu Ltd.', 'Volvo Construction Equipment', 'John Deere Construction', 'Liebherr Group', 'Hitachi Construction Machinery'];
  const plants = ['Houston Manufacturing Plant', 'Chicago Steel Works', 'Phoenix Concrete Facility', 'Atlanta Materials Hub', 'Denver Construction Center', 'Seattle Industrial Complex'];
  const statuses = ['pendingApproval', 'pendingIMA', 'completedByIMA'];
  const materialTypes = ['Steel Pipe', 'Aluminum Sheet', 'Copper Wire', 'Plastic Component', 'Rubber Gasket'];
  
  const materialRequests = [];
  
  for (let i = 1; i <= 15; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const materialRequest = {
      materialID: `MAT_REQ_${i.toString().padStart(6, '0')}`,
      materialName: `${materialTypes[Math.floor(Math.random() * materialTypes.length)]} ${i}`,
      vendor: vendors[Math.floor(Math.random() * vendors.length)],
      plant: plants[Math.floor(Math.random() * plants.length)],
      materialDescription: `High-quality material component for industrial use - Request ${i}`,
      firstName: ['John', 'Jane', 'Mike', 'Sarah', 'David'][Math.floor(Math.random() * 5)],
      lastName: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones'][Math.floor(Math.random() * 5)],
      email: `user${i}@company.com`,
      status: status,
      materialNumber: status === 'completedByIMA' ? `MAT${(1000 + i).toString()}` : '',
      createdAt: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
      createdBy: 'system',
      modifiedAt: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
      modifiedBy: status === 'completedByIMA' ? 'approver' : 'system'
    };
    materialRequests.push(materialRequest);
  }
  
  return materialRequests;
}

function main() {
  const outDir = path.join(__dirname, '..', 'db', 'data');
  ensureDir(outDir);

  // Generate sample material requests
  const materialRequests = generateSampleMaterialRequests();

  fs.writeFileSync(path.join(outDir, 'ima-MaterialRequests.csv'), toCSV(materialRequests));

  console.log('CSV generated in', outDir);
  console.log(`Generated ${materialRequests.length} material requests`);
}

main();


