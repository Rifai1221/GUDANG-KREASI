import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Project, FrameItem } from '../types';
import { formatRupiah } from './calculator';
import logoImg from '../assets/images/gudang_kreasi_logo_1790699886667.jpg';
import { getLocalShopProfile } from '../services/storageService';

export function generateProjectPdf(project: Project, includeDrawings: boolean = true) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const shopProfile = getLocalShopProfile();
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

  try {
    doc.addImage(logoImg, 'JPEG', 14, 4, 20, 20);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(shopProfile.name || 'GUDANG KREASI ALUMUNIUM', 38, 12);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225);
    const splitAddr = doc.splitTextToSize(shopProfile.address, 95);
    doc.text(splitAddr, 38, 18);
  } catch {
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text(shopProfile.name || 'GUDANG KREASI ALUMUNIUM', 14, 12);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225);
    const splitAddr = doc.splitTextToSize(shopProfile.address, 115);
    doc.text(splitAddr, 14, 18);
  }

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
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
  doc.text('Nama Proyek', 18, currentY + 6);
  doc.text(':', 46, currentY + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(project.title, 49, currentY + 6);

  doc.setFont('helvetica', 'bold');
  doc.text('Klien / Pemesan', 18, currentY + 13);
  doc.text(':', 46, currentY + 13);
  doc.setFont('helvetica', 'normal');
  doc.text(project.clientName, 49, currentY + 13);

  doc.setFont('helvetica', 'bold');
  doc.text('No. Telepon', 18, currentY + 20);
  doc.text(':', 46, currentY + 20);
  doc.setFont('helvetica', 'normal');
  doc.text(project.clientPhone || '-', 49, currentY + 20);

  // Column 2
  doc.setFont('helvetica', 'bold');
  doc.text('Alamat Proyek', 115, currentY + 6);
  doc.text(':', 140, currentY + 6);
  doc.setFont('helvetica', 'normal');
  const splitAddress = doc.splitTextToSize(project.clientAddress || '-', 52);
  doc.text(splitAddress, 143, currentY + 6);

  doc.setFont('helvetica', 'bold');
  doc.text('Status Dokumen', 115, currentY + 20);
  doc.text(':', 140, currentY + 20);
  doc.setFont('helvetica', 'normal');
  doc.text(project.status.toUpperCase(), 143, currentY + 20);

  currentY += 32;

  // 4. Items Table with All-In Blended Pricing
  const baseItemsTotal = project.items.reduce((sum, item) => sum + item.subtotalCost, 0) || 1;
  const targetSubtotal = project.grandTotal - (project.taxAmount || 0);
  const blendFactor = targetSubtotal / baseItemsTotal;

  let accumulatedBlended = 0;
  const blendedItems = project.items.map((item, idx) => {
    let itemTotal = Math.round(item.subtotalCost * blendFactor);
    if (idx === project.items.length - 1) {
      itemTotal = targetSubtotal - accumulatedBlended;
    } else {
      accumulatedBlended += itemTotal;
    }
    const unitPrice = Math.round(itemTotal / (item.quantity || 1));
    return {
      ...item,
      blendedUnitPrice: unitPrice,
      blendedSubtotal: itemTotal,
    };
  });

  const tableHead = [['No', 'Uraian Pekerja & Spesifikasi', 'Dimensi (LxT)', 'Vol', 'Satuan', 'Harga Satuan', 'Total (Rp)']];

  const tableBody = blendedItems.map((item, index) => {
    const specStr = `${item.brand} ${item.profileSize}\nWarna: ${item.color}\nKaca: ${item.glassType}`;
    const dimStr = `${item.widthMm} x ${item.heightMm} mm\n(${item.perimeterMeters} m1)`;

    return [
      index + 1,
      `${item.name}\n${specStr}`,
      dimStr,
      item.quantity,
      'Unit',
      formatRupiah(item.blendedUnitPrice),
      formatRupiah(item.blendedSubtotal),
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

  // 5. Cost Summary & Calculation Details Box (Clean All-In View)
  const summaryWidth = 95;
  const summaryX = pageWidth - summaryWidth - 14;
  const summaryHeight = project.taxPercentage > 0 ? 28 : 22;

  // Calculation summary box
  doc.setFillColor(...bgLight);
  doc.roundedRect(summaryX, currentY, summaryWidth, summaryHeight, 2, 2, 'FD');

  let calcY = currentY + 6;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textDark);
  doc.text('Total Biaya Pekerjaan:', summaryX + 4, calcY);
  doc.text(formatRupiah(targetSubtotal), pageWidth - 18, calcY, { align: 'right' });

  if (project.taxPercentage > 0) {
    calcY += 6;
    doc.text(`PPN (${project.taxPercentage}%):`, summaryX + 4, calcY);
    doc.text(formatRupiah(project.taxAmount), pageWidth - 18, calcY, { align: 'right' });
  }

  calcY += 7;
  doc.setFillColor(...secondaryColor);
  doc.rect(summaryX, calcY - 4, summaryWidth, 10, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('GRAND TOTAL (Rp):', summaryX + 4, calcY + 2.5);
  doc.text(formatRupiah(project.grandTotal), pageWidth - 18, calcY + 2.5, { align: 'right' });

  currentY += summaryHeight + 12;

  // Check page overflow for signatures
  if (currentY > 240) {
    doc.addPage();
    currentY = 20;
  }

  // 6. Signatures Section
  doc.setTextColor(...textDark);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');

  // Left Signature
  doc.text('Disetujui,', 30, currentY);
  doc.text('Dibuat Oleh,', pageWidth - 60, currentY);

  currentY += 22;
  doc.setFont('helvetica', 'bold');
  doc.text(`( ${project.clientName} )`, 30, currentY);
  doc.text(`( ${shopProfile.name || 'GUDANG KREASI ALUMUNIUM'} )`, pageWidth - 60, currentY);

  // =========================================================================
  // 7. LAMPIRAN GAMBAR TEKNIS & SKETSA UNIT (SHOP DRAWING ANNEX IN PDF)
  // =========================================================================
  if (includeDrawings && project.items.length > 0) {
    const itemsPerPage = 2;
    const totalDrawingPages = Math.ceil(project.items.length / itemsPerPage);

    for (let p = 0; p < totalDrawingPages; p++) {
      doc.addPage();

      // Header Banner Lampiran
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, pageWidth, 22, 'F');

      try {
        doc.addImage(logoImg, 'JPEG', 14, 3, 16, 16);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text(shopProfile.name || 'GUDANG KREASI ALUMUNIUM', 34, 10);

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(203, 213, 225);
        const splitAddr = doc.splitTextToSize(shopProfile.address, 95);
        doc.text(splitAddr, 34, 15);
      } catch {
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text(shopProfile.name || 'GUDANG KREASI ALUMUNIUM', 14, 10);

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(203, 213, 225);
        const splitAddr = doc.splitTextToSize(shopProfile.address, 115);
        doc.text(splitAddr, 14, 15);
      }

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`No. Dokumen: ${project.estimateNumber || 'RAB-2026-001'}`, pageWidth - 14, 10, { align: 'right' });
      doc.setFont('helvetica', 'bold');
      doc.text(`Total: ${formatRupiah(project.grandTotal)}`, pageWidth - 14, 16, { align: 'right' });

      let drawY = 28;
      const pageItems = project.items.slice(p * itemsPerPage, (p + 1) * itemsPerPage);

      pageItems.forEach((item, itemIdxOnPage) => {
        const globalIdx = p * itemsPerPage + itemIdxOnPage + 1;
        const cardH = 120;

        // Card Border
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(203, 213, 225);
        doc.roundedRect(14, drawY, pageWidth - 28, cardH, 2, 2, 'FD');

        // Card Header Strip
        doc.setFillColor(...primaryColor);
        doc.rect(14, drawY, pageWidth - 28, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.text(`[ITEM ${globalIdx}] ${item.name.toUpperCase()}`, 18, drawY + 5.5);
        doc.text(`JUMLAH: ${item.quantity} UNIT`, pageWidth - 18, drawY + 5.5, { align: 'right' });

        // Wireframe Diagram Area (Left)
        const diagramBoxX = 20;
        const diagramBoxY = drawY + 12;
        const diagramBoxW = 75;
        const diagramBoxH = 75;

        // Draw background box for diagram
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.rect(diagramBoxX, diagramBoxY, diagramBoxW, diagramBoxH, 'FD');

        // Proportional Frame Drawing
        const maxShapeW = diagramBoxW - 16;
        const maxShapeH = diagramBoxH - 16;
        const scale = Math.min(maxShapeW / item.widthMm, maxShapeH / item.heightMm);
        const shapeW = item.widthMm * scale;
        const shapeH = item.heightMm * scale;
        const shapeX = diagramBoxX + (diagramBoxW - shapeW) / 2;
        const shapeY = diagramBoxY + (diagramBoxH - shapeH) / 2;

        // Outer Frame
        doc.setDrawColor(15, 23, 42);
        doc.setLineWidth(0.6);
        doc.rect(shapeX, shapeY, shapeW, shapeH, 'S');

        // Glass Tint
        doc.setFillColor(224, 242, 254);
        doc.rect(shapeX + 1, shapeY + 1, shapeW - 2, shapeH - 2, 'F');

        // Divisions (Mullions / Doors / Boven)
        if (item.type === 'kusen_pintu_jendela_gabungan') {
          const doorW = shapeW * 0.45;
          doc.line(shapeX + doorW, shapeY, shapeX + doorW, shapeY + shapeH);
          // Door panel
          doc.setFillColor(241, 245, 249);
          doc.rect(shapeX + 1.5, shapeY + 1.5, doorW - 3, shapeH - 3, 'FD');
          // Swing indicator
          doc.setDrawColor(2, 132, 199);
          doc.line(shapeX + 1.5, shapeY + 1.5, shapeX + doorW - 1.5, shapeY + shapeH / 2);
          doc.line(shapeX + 1.5, shapeY + shapeH - 1.5, shapeX + doorW - 1.5, shapeY + shapeH / 2);
        } else if (item.type.includes('pintu')) {
          doc.setFillColor(241, 245, 249);
          doc.rect(shapeX + 2, shapeY + 2, shapeW - 4, shapeH - 4, 'FD');
          // Swing indicator
          doc.setDrawColor(2, 132, 199);
          doc.line(shapeX + 2, shapeY + 2, shapeX + shapeW - 2, shapeY + shapeH / 2);
          doc.line(shapeX + 2, shapeY + shapeH - 2, shapeX + shapeW - 2, shapeY + shapeH / 2);
        } else {
          // Mullions
          if (item.mullionVerticalCount > 0) {
            const step = shapeW / (item.mullionVerticalCount + 1);
            for (let m = 1; m <= item.mullionVerticalCount; m++) {
              doc.line(shapeX + m * step, shapeY, shapeX + m * step, shapeY + shapeH);
            }
          }
          if (item.mullionHorizontalCount > 0) {
            const step = shapeH / (item.mullionHorizontalCount + 1);
            for (let m = 1; m <= item.mullionHorizontalCount; m++) {
              doc.line(shapeX, shapeY + m * step, shapeX + shapeW, shapeY + m * step);
            }
          }
          // Window casement swing
          if (item.type === 'kusen_jendela_casement') {
            doc.setDrawColor(217, 119, 6);
            doc.line(shapeX + 1, shapeY + 1, shapeX + shapeW - 1, shapeY + shapeH / 2);
            doc.line(shapeX + 1, shapeY + shapeH - 1, shapeX + shapeW - 1, shapeY + shapeH / 2);
          }
        }

        // Dimension annotations on diagram
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.text(`${item.widthMm} mm`, diagramBoxX + diagramBoxW / 2, diagramBoxY + diagramBoxH + 4.5, { align: 'center' });
        doc.text(`${item.heightMm} mm`, diagramBoxX + diagramBoxW + 2, diagramBoxY + diagramBoxH / 2);

        // Right side Specs & Calculations Details
        const specX = 105;
        let specY = drawY + 15;

        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...primaryColor);
        doc.text('SPESIFIKASI TEKNIS:', specX, specY);

        specY += 5.5;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...textDark);
        doc.text(`• Dimensi Kusen: ${item.widthMm} mm (L) x ${item.heightMm} mm (T)`, specX, specY);

        specY += 5;
        doc.text(`• Profil Aluminium: ${item.brand} ${item.profileSize} (${item.color})`, specX, specY);

        specY += 5;
        doc.text(`• Panel / Kaca: ${item.doorPanelName || item.glassType}`, specX, specY);

        specY += 5;
        doc.text(`• Total Keliling Meter Lari: ${item.perimeterMeters} m1`, specX, specY);

        specY += 5;
        doc.text(`• Estimasi Kebutuhan Batang: ${item.aluminumBarsNeeded} Batang (6 Meter)`, specX, specY);

        specY += 5;
        doc.text(`• Aksesori & Hardware: Dilengkapi Sealant, Karet, Engsel & Kunci`, specX, specY);

        specY += 7;
        doc.setFillColor(241, 245, 249);
        doc.roundedRect(specX, specY - 3.5, pageWidth - specX - 18, 12, 1, 1, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(13, 148, 136);
        doc.text(`Subtotal Item: ${formatRupiah(item.subtotalCost)} (${item.quantity} Unit @ ${formatRupiah(item.subtotalCost / item.quantity)})`, specX + 3, specY + 3.5);

        drawY += cardH + 8;
      });
    }
  }

  // Footer page number for all pages
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
