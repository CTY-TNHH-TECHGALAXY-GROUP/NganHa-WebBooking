const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory) {
            // Không quét sâu vào node_modules hay public để tránh loãng
            if (f !== 'node_modules' && f !== 'public' && f !== 'references') {
                walkDir(dirPath, callback);
            }
        } else {
            callback(dirPath);
        }
    });
}

const rootPath = 'C:\\Users\\ADMIN\\OneDrive\\Desktop\\Ngan Ha';
console.log('--- Danh sách file trong các thư mục hiệu ứng ---');

['standalone-celestial-menu', 'standalone-celestial-menu (2)', 'flipmenu'].forEach(folder => {
    const targetDir = path.join(rootPath, folder);
    if (fs.existsSync(targetDir)) {
        console.log(`\n[Thư mục: ${folder}]`);
        walkDir(targetDir, (filePath) => {
            const ext = path.extname(filePath);
            if (['.html', '.js'].includes(ext)) {
                const stat = fs.statSync(filePath);
                const relPath = path.relative(targetDir, filePath);
                console.log(`- ${relPath} | Size: ${stat.size} bytes | Sửa lúc: ${stat.mtime.toLocaleString()}`);
            }
        });
    } else {
        console.log(`\n[Thư mục không tồn tại: ${folder}]`);
    }
});
