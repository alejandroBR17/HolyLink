const imgW = 2000, imgH = 2000;
const textH = 570, textW = 1951;
const textTop = (imgH - textH) / 2; // 715
const textBottom = textTop + textH; // 1285

const contW = 86, contH = 24;

// object-cover scales the image so both dimensions are >= container
const scaleX = contW / imgW; // 86 / 2000 = 0.043
const scaleY = contH / imgH; // 24 / 2000 = 0.012
const scale = Math.max(scaleX, scaleY); // 0.043

const renderedImgW = imgW * scale; // 86
const renderedImgH = imgH * scale; // 86

const renderedTextTop = textTop * scale; // 715 * 0.043 = 30.745
const renderedTextBottom = textBottom * scale; // 1285 * 0.043 = 55.255
const renderedTextHeight = textH * scale; // 570 * 0.043 = 24.51

console.log(`Rendered Image: ${renderedImgW}x${renderedImgH}`);
console.log(`Rendered Text Top: ${renderedTextTop}, Bottom: ${renderedTextBottom}, Height: ${renderedTextHeight}`);

// object-center centers the 86x86 image in the 86x24 container
const topOffset = (renderedImgH - contH) / 2; // (86 - 24) / 2 = 31
const visibleTop = topOffset; // 31
const visibleBottom = topOffset + contH; // 31 + 24 = 55

console.log(`Container Visible Area: Top=${visibleTop}, Bottom=${visibleBottom}`);

// With object-[center_35%]
const topOffset35 = renderedImgH * 0.35 - contH / 2; // 86 * 0.35 = 30.1 - 12 = 18.1
const visibleTop35 = topOffset35;
const visibleBottom35 = topOffset35 + contH;
console.log(`Container Visible Area (35%): Top=${visibleTop35}, Bottom=${visibleBottom35}`);

