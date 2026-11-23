/**
 * One-off asset generation: rasterize src/app/icon.svg into the PNG icons
 * the web app manifest + Apple touch icon need. Run with:
 *   node scripts/generate-pwa-icons.mjs
 * (also wired as `npm run icons`). High density keeps the SVG crisp when
 * scaled up from its 64x64 viewBox.
 */
import sharp from "sharp";

const src = "src/app/icon.svg";
const jobs = [
  { size: 192, out: "public/icon-192.png" },
  { size: 512, out: "public/icon-512.png" },
  { size: 180, out: "src/app/apple-icon.png" },
];
for (const { size, out } of jobs) {
  await sharp(src, { density: 384 }).resize(size, size).png().toFile(out);
  console.log(`wrote ${out} (${size}x${size})`);
}
