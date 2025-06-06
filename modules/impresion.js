import { jsPDF } from 'jspdf';
import { drawShape } from './figuras';

function pageToCanvas(page) {
  const canvas = document.createElement('canvas');
  canvas.width = page.width;
  canvas.height = page.height;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  page.shapes.forEach((shape) => drawShape(ctx, shape));
  return canvas;
}

export function savePDF(pages) {
  if (!Array.isArray(pages) || pages.length === 0) return;
  const first = pages[0];
  const pdf = new jsPDF({
    orientation: first.width > first.height ? 'landscape' : 'portrait',
    unit: 'px',
    format: [first.width, first.height],
  });
  pages.forEach((page, idx) => {
    if (idx > 0) {
      pdf.addPage([page.width, page.height], page.width > page.height ? 'landscape' : 'portrait');
    }
    const canvas = pageToCanvas(page);
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, 0, page.width, page.height);
  });
  pdf.save('design.pdf');
}

export function exportHTML(pages) {
  if (!Array.isArray(pages) || pages.length === 0) return;
  const images = pages
    .map((page) => {
      const canvas = pageToCanvas(page);
      return `<img src="${canvas.toDataURL('image/png')}" />`;
    })
    .join('');
  const html = `<!DOCTYPE html><html><body>${images}</body></html>`;
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'design.html';
  link.click();
  URL.revokeObjectURL(url);
}
