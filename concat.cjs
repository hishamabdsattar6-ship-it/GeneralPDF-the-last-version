const fs = require('fs');

const part1 = fs.readFileSync('part1.txt', 'utf8');
const part2 = fs.readFileSync('part2.txt', 'utf8');
const part3 = fs.readFileSync('part3.txt', 'utf8');

fs.writeFileSync('index.html', part1 + part2 + part3);
