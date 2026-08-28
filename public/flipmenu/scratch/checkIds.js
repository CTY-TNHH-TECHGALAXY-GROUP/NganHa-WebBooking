const fs = require('fs');
const code = fs.readFileSync('CelestialEngine.js', 'utf8');

// Phân tích và lấy tất cả các tham số truyền vào getElementById
const regex = /getElementById\(['"](.*?)['"]\)/g;
let match;
let ids = new Set();
while ((match = regex.exec(code)) !== null) {
    ids.add(match[1]);
}

console.log('Các ID được sử dụng:', Array.from(ids));
