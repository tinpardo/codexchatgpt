import { jsPDF } from 'jspdf';

export function savePDF(canvas) {
  if (!canvas) return;
  const orientation = canvas.width > canvas.height ? 'landscape' : 'portrait';
  const pdf = new jsPDF({
    orientation,
    unit: 'px',
    format: [canvas.width, canvas.height],
  });
  const imgData = canvas.toDataURL('image/png');
  pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
  pdf.save('design.pdf');
}

export function exportHTML(canvas) {
  if (!canvas) return;
  const imgData = canvas.toDataURL('image/png');
  const html = `<!DOCTYPE html><html><body><img src="${imgData}" /></body></html>`;
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'design.html';
  link.click();
  URL.revokeObjectURL(url);
}
