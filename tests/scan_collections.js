const fs = require('fs');
const files = fs.readdirSync('.').filter(f => f.endsWith('.js'));
const collections = new Set();
files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const re = /\.collection\((['"])(.*?)\1\)/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    collections.add(m[2]);
  }
});
console.log('All collection names in codebase:', Array.from(collections).sort());
