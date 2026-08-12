const imgW = 2000, imgH = 2000;
const textH = 570, textW = 1951;
const textTop = (imgH - textH) / 2; // 715
const textBottom = textTop + textH; // 1285

const contW = 80, contH = 24;

const scaleX = contW / imgW; // 80 / 2000 = 0.04
const scaleY = contH / imgH; // 24 / 2000 = 0.012
const scale = Math.max(scaleX, scaleY); // 0.04

const renderedImgW = imgW * scale; // 80
const renderedImgH = imgH * scale; // 80

const renderedTextTop = textTop * scale; // 28.6
const renderedTextBottom = textBottom * scale; // 51.4
const renderedTextHeight = textH * scale; // 22.8

const topOffset = (renderedImgH - contH) / 2; // (80 - 24) / 2 = 28
const visibleTop = topOffset; // 28
const visibleBottom = topOffset + contH; // 52

console.log(`Rendered Text: ${renderedTextTop.toFixed(2)} to ${renderedTextBottom.toFixed(2)}`);
console.log(`Visible Area : ${visibleTop.toFixed(2)} to ${visibleBottom.toFixed(2)}`);
console.log(renderedTextTop >= visibleTop && renderedTextBottom <= visibleBottom ? "FITS!" : "DOES NOT FIT");
