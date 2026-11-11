const fs = require('node:fs');
const path = require('node:path');
const {Resvg} = require('@resvg/resvg-js');
const root = path.resolve(__dirname, '..');
const logo = fs.readFileSync(path.join(root, 'assets/imgs/Icon.svg'), 'utf8').replace(/<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/<rect[^>]*\/>/, '');
const size = 1024;
function svg(content, scale) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024"><g transform="translate(512 512) scale(${scale}) translate(-82 -82)">${content}</g></svg>`;
}
function render(source) { return new Resvg(source).render(); }
function radius(pixels) {
  let max = 0;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    if (pixels[(y * size + x) * 4 + 3] > 0) max = Math.max(max, Math.hypot(x + .5 - 512, y + .5 - 512));
  }
  return max;
}
// Android's guaranteed safe area is a centered circle of diameter 66/108.
// Use radius 300px on the 1024px layer, leaving extra margin for antialiasing.
const initialScale = 4.5;
const scale = initialScale * 299 / radius(render(svg(logo, initialScale)).pixels);
const foreground = svg(logo, scale);
const result = render(foreground);
if (radius(result.pixels) > 301) throw new Error('Android brand exceeds its safe circle');
fs.writeFileSync(path.join(root, 'assets/android-icon-foreground.svg'), foreground);
fs.writeFileSync(path.join(root, 'assets/android-icon-foreground.png'), result.asPng());
const mask = logo.replace(/fill="#(?:0095FF|7BFF00)"/g, 'fill="#ffffff"').replace(/fill="#002542"/g, 'fill="#000000"');
const mono = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><defs><mask id="brand">${svg(mask, scale).replace(/<svg[^>]*>/, '').replace(/<\/svg>$/, '')}</mask></defs><rect width="1024" height="1024" fill="white" mask="url(#brand)"/></svg>`;
fs.writeFileSync(path.join(root, 'assets/android-icon-monochrome.png'), render(mono).asPng());
fs.writeFileSync(path.join(root, 'assets/android-icon-background.png'), render('<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><rect width="1024" height="1024" fill="#002542"/></svg>').asPng());
fs.writeFileSync(path.join(root, 'assets/splash-icon.png'), render(svg(logo, 6.5)).asPng());
console.log(`Android symbol fits safe circle: radius ${radius(result.pixels).toFixed(1)}px of ${(1024*33/108).toFixed(1)}px available.`);
