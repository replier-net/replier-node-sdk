// Mark each output folder with its module type so Node loads both builds correctly.
const fs = require('fs');
fs.writeFileSync('dist/esm/package.json', JSON.stringify({ type: 'module' }));
fs.writeFileSync('dist/cjs/package.json', JSON.stringify({ type: 'commonjs' }));
