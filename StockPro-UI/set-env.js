const fs = require('fs');
const path = require('path');

const envFile = path.join(__dirname, 'src/environments/environment.prod.ts');
let envContent = fs.readFileSync(envFile, 'utf8');

const vars = [
  'AUTH_API_URL',
  'PRODUCT_API_URL',
  'WAREHOUSE_API_URL',
  'MOVEMENT_API_URL',
  'PURCHASE_API_URL',
  'ALERT_API_URL',
  'ANALYTICS_API_URL'
];

vars.forEach(v => {
  const value = (process.env[v] || 'http://localhost:5000').trim();
  console.log(`Injecting ${v}: ${value}`);
  envContent = envContent.replace(`\${${v}}`, value);
});

fs.writeFileSync(envFile, envContent);
console.log('Production environment variables injected successfully.');
