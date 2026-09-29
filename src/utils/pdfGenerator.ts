import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Project } from '../types';
import { formatRupiah } from './calculator';

export function generateProjectPdf(project: Project) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 15;

  // Primary Theme Colors (Navy & Emerald Accent)
  const primaryColor: [number, number, number] = [15, 23, 42]; // Slate 900
  const secondaryColor: [number, number, number] = [13, 148, 136]; // Teal 600
  const textDark: [number, number, number] = [30, 41, 59]; // Slate 800
  const bgLight: [number, number, number] = [248, 250, 252]; // Slate 50

  // 1. Header Banner
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('GUDANG KREASI ALUMUNIUM', 14, 12);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Kalkulasi Presisi Kusen, Pintu, Jendela & Facade Glass', 14, 18);
  doc.text(`No. Dokumen: ${project.estimateNumber || 'RAB-2026-001'}`, pageWidth - 14, 12, { align: 'right' });
  doc.text(`Tanggal: ${project.date || new Date().toLocaleDateString('id-ID')}`, pageWidth - 14, 18, { align: 'right' });

  currentY = 36;

  // 2. Title Section
  doc.setTextColor(...primaryColor);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('RINCIAN ANGGARAN BIAYA (RAB)', 14, currentY);

  currentY += 6;

  // 3. Client & Project Info Box
  doc.setFillColor(...bgLight);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, currentY, pageWidth - 28, 26, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setTextColor(...textDark);

  // Column 1
  doc.setFont('helvetica', 'bold');
  doc.text('Nama Proyek:', 18, currentY + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(project.title, 42, currentY + 6);

  doc.setFont('helvetica', 'bold');
  doc.text('Klien / Pemesan:', 18, currentY + 13);
  doc.setFont('helvetica', 'normal');
  doc.text(project.clientName, 45, currentY + 13);

  doc.setFont('helvetica', 'bold');
  doc.text('No. Telepon:', 18, currentY + 20);
  doc.setFont('helvetica', 'normal');
  doc.text(project.clientPhone || '-', 42, currentY + 20);

  // Column 2
  doc.setFont('helvetica', 'bold');
  doc.text('Alamat Proyek:', 115, currentY + 6);
  doc.setFont('helvetica', 'normal');
  const splitAddress = doc.splitTextToSize(project.clientAddress || '-', 75);
  doc.text(splitAddress, 140, currentY + 6);

  doc.setFont('helvetica', 'bold');
  doc.text('Status Proyek:', 115, currentY + 20);
  doc.setFont('helvetica', 'normal');
  doc.text(project.status.toUpperCase(), 140, currentY + 20);

  currentY += 32;

  // 4. Items Table
  const tableHead = [['No', 'Uraian Pekerja & Spesifikasi', 'Dimensi (LxT)', 'Vol', 'Satuan', 'Harga Satuan', 'Total (Rp)']];

  const tableBody = project.items.map((item, index) => {
    const specStr = `${item.brand} ${item.profileSize}\nWarna: ${item.color}\nKaca: ${item.glassType}`;
    const dimStr = `${item.widthMm} x ${item.heightMm} mm\n(${item.perimeterMeters} m1)`;
    const unitPrice = item.subtotalCost / item.quantity;

    return [
      index + 1,
      `${item.name}\n${specStr}`,
      dimStr,
      item.quantity,
      'Unit',
      formatRupiah(unitPrice),
      formatRupiah(item.subtotalCost),
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center',
    },
    bodyStyles: {
      textColor: textDark,
      fontSize: 8.5,
      valign: 'middle',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { cellWidth: 62 },
      2: { halign: 'center', cellWidth: 28 },
      3: { halign: 'center', cellWidth: 12 },
      4: { halign: 'center', cellWidth: 14 },
      5: { halign: 'right', cellWidth: 28 },
      6: { halign: 'right', cellWidth: 28 },
    },
    margin: { left: 14, right: 14 },
  });

  // @ts-expect-error - jspdf-autotable extends jsPDF instance
  currentY = doc.lastAutoTable.finalY + 8;

  // Check page overflow
  if (currentY > 210) {
    doc.addPage();
    currentY = 20;
  }

  // 5. Cost Summary & Calculation Details Box
  const summaryWidth = 95;
  const summaryX = pageWidth - summaryWidth - 14;

  // Optional general notes if specified by user in project
  if (project.notes) {
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('CATATAN KHUSUS:', 14, currentY + 4);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textDark);
    const splitNotes = doc.splitTextToSize(project.notes, summaryX - 22);
    doc.text(splitNotes, 14, currentY + 10);
  }

  // Calculation summary box
  doc.setFillColor(...bgLight);
  doc.roundedRect(summaryX, currentY, summaryWidth, 48, 2, 2, 'FD');

  let calcY = currentY + 6;
  doc.setFontSize(8.5);

  doc.setFont('helvetica', 'normal');
  doc.text('Total Biaya Material:', summaryX + 4, calcY);
  doc.text(formatRupiah(project.totalMaterialCost), pageWidth - 18, calcY, { align: 'right' });

  calcY += 6;
  doc.text('Total Upah Pekerja/Tukang:', summaryX + 4, calcY);
  doc.text(formatRupiah(project.totalLaborCost), pageWidth - 18, calcY, { align: 'right' });

  if (project.totalOperationalCost > 0) {
    calcY += 6;
    doc.text('Biaya Operasional & Transport:', summaryX + 4, calcY);
    doc.text(formatRupiah(project.totalOperationalCost), pageWidth - 18, calcY, { align: 'right' });
  }

  if (project.markupPercentage > 0) {
    calcY += 6;
    doc.text(`Jasa & Margin Profit (${project.markupPercentage}%):`, summaryX + 4, calcY);
    doc.text(formatRupiah(project.markupAmount), pageWidth - 18, calcY, { align: 'right' });
  }

  if (project.taxPercentage > 0) {
    calcY += 6;
    doc.text(`PPN (${project.taxPercentage}%):`, summaryX + 4, calcY);
    doc.text(formatRupiah(project.taxAmount), pageWidth - 18, calcY, { align: 'right' });
  }

  calcY += 8;
  doc.setFillColor(...secondaryColor);
  doc.rect(summaryX, calcY - 4, summaryWidth, 10, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('GRAND TOTAL (Rp):', summaryX + 4, calcY + 2);
  doc.text(formatRupiah(project.grandTotal), pageWidth - 18, calcY + 2, { align: 'right' });

  currentY += 56;

  // Check page overflow for signatures
  if (currentY > 240) {
    doc.addPage();
    currentY = 20;
  }

  // 6. Signatures Section
  doc.setTextColor(...textDark);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');

  // Left Signature
  doc.text('Disetujui Oleh (Klien),', 30, currentY);
  doc.text('Dibuat Oleh (Kontraktor),', pageWidth - 60, currentY);

  currentY += 22;
  doc.setFont('helvetica', 'bold');
  doc.text(`( ${project.clientName} )`, 30, currentY);
  doc.text('( GUDANG KREASI ALUMUNIUM )', pageWidth - 60, currentY);

  // Footer page number
  const pageCount = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Halaman ${i} dari ${pageCount} — GUDANG KREASI ALUMUNIUM`, pageWidth / 2, 290, { align: 'center' });
  }

  // Save PDF
  const filename = `RAB_Alumunium_${project.clientName.replace(/[^a-zA-Z0-9]/g, '_')}_${project.estimateNumber}.pdf`;
  doc.save(filename);
}
