const fs = require('fs');
const vm = require('vm');

try {
    let js = fs.readFileSync('CelestialEngine.js', 'utf8');
    
    // Tạm thời vô hiệu hóa các câu lệnh import ở đầu file để trình biên dịch Node.js không phàn nàn về URL HTTPS
    js = js.replace(/import\s+[^;]+/g, (m) => `// ${m}`);
    // Tạm thời bỏ chữ export để biên dịch ở dạng Script thường
    js = js.replace(/export\s+class\s+CelestialEngine/, 'class CelestialEngine');

    // Chạy kiểm tra cú pháp bằng Virtual Machine của Node.js
    new vm.Script(js);
    console.log("SYNTAX_CHECK: OK");
} catch (e) {
    console.error("SYNTAX_CHECK: FAILED", e);
}
