const imgW = 2000, imgH = 2000;
const textH = 570, textW = 1951;
const textTop = (imgH - textH) / 2; // 715
const textBottom = textTop + textH; // 1285

const contW = 90, contH = 28;

const scaleX = contW / imgW; 
const scaleY = contH / imgH; 
const scale = Math.max(scaleX, scaleY); 

const renderedImgW = imgW * scale; 
const renderedImgH = imgH * scale; 

const renderedTextTop = textTop * scale; 
const renderedTextBottom = textBottom * scale; 

const topOffset = (renderedImgH - contH) / 2; 
const visibleTop = topOffset; 
const visibleBottom = topOffset + contH; 

console.log(`w=${contW} h=${contH}`);
console.log(`Rendered Text: ${renderedTextTop.toFixed(2)} to ${renderedTextBottom.toFixed(2)}`);
console.log(`Visible Area : ${visibleTop.toFixed(2)} to ${visibleBottom.toFixed(2)}`);
console.log(renderedTextTop >= visibleTop && renderedTextBottom <= visibleBottom ? "FITS!" : "DOES NOT FIT");
