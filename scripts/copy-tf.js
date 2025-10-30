const fs = require('fs');
const path = require('path');
const os = require('os');

if (os.platform() !== 'win32') {
  console.log('⚠️ Not Windows, skipping tensorflow.dll copy');
  process.exit(0);
}

const src = path.join(__dirname, '..', 'node_modules', '@tensorflow', 'tfjs-node', 'lib', 'napi-v9', 'tensorflow.dll');
const destDir = path.join(__dirname, '..', 'node_modules', '@tensorflow', 'tfjs-node', 'lib', 'napi-v8');
const dest = path.join(destDir, 'tensorflow.dll');

try {
  if (!fs.existsSync(dest)) {
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    fs.copyFileSync(src, dest);
    console.log('✅ tensorflow.dll copied to napi-v8.');
  } else {
    console.log('⚠️ tensorflow.dll already exists, skipping copy.');
  }
} catch (err) {
  console.error('❌ Error copying tensorflow.dll:', err);
  process.exit(1);
}
