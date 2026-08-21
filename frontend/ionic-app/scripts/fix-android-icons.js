// @capacitor/assets genera bien el ícono adaptativo (ic_launcher.xml con
// capas background/foreground separadas, la que usan Android 8+), pero deja
// los PNG legacy (ic_launcher.png / ic_launcher_round.png, para launchers
// viejos que no soportan íconos adaptativos) sin aplanar: el fondo de color
// no se compone con el bus, así que quedan con fondo transparente. Este
// script los aplana a mano (compone background + foreground, y recorta el
// "_round" en círculo) justo después de "capacitor-assets generate".
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const resDir = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');

function readPng(filePath) {
  return PNG.sync.read(fs.readFileSync(filePath));
}

function compositeOver(background, foreground) {
  const out = new PNG({ width: background.width, height: background.height });
  background.data.copy(out.data);
  for (let y = 0; y < foreground.height; y++) {
    for (let x = 0; x < foreground.width; x++) {
      const i = (foreground.width * y + x) << 2;
      const srcA = foreground.data[i + 3] / 255;
      if (srcA === 0) continue;
      for (let c = 0; c < 3; c++) {
        out.data[i + c] = Math.round(foreground.data[i + c] * srcA + out.data[i + c] * (1 - srcA));
      }
      out.data[i + 3] = 255;
    }
  }
  return out;
}

function maskToCircle(png) {
  const { width, height } = png;
  const cx = width / 2;
  const cy = height / 2;
  const r = Math.min(cx, cy);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      if (dx * dx + dy * dy > r * r) {
        const i = (width * y + x) << 2;
        png.data[i + 3] = 0;
      }
    }
  }
  return png;
}

if (!fs.existsSync(resDir)) {
  console.log('No existe android/app/src/main/res todavía — corre "npx cap add android" primero.');
  process.exit(0);
}

let fixed = 0;
for (const dir of fs.readdirSync(resDir)) {
  if (!dir.startsWith('mipmap-') || dir === 'mipmap-anydpi-v26') continue;
  const dirPath = path.join(resDir, dir);
  const bgPath = path.join(dirPath, 'ic_launcher_background.png');
  const fgPath = path.join(dirPath, 'ic_launcher_foreground.png');
  const squarePath = path.join(dirPath, 'ic_launcher.png');
  const roundPath = path.join(dirPath, 'ic_launcher_round.png');
  if (!fs.existsSync(bgPath) || !fs.existsSync(fgPath)) continue;

  const bg = readPng(bgPath);
  const fg = readPng(fgPath);
  const flattened = compositeOver(bg, fg);

  if (fs.existsSync(squarePath)) {
    fs.writeFileSync(squarePath, PNG.sync.write(flattened));
    fixed++;
  }
  if (fs.existsSync(roundPath)) {
    const rounded = maskToCircle(compositeOver(bg, fg));
    fs.writeFileSync(roundPath, PNG.sync.write(rounded));
    fixed++;
  }
}

console.log(`✅ ${fixed} íconos legacy (pre-Android 8) corregidos con el fondo de color aplicado.`);
