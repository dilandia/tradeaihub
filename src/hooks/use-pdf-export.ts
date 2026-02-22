"use client";

import { useRef, useCallback, useState } from "react";
import { usePlan } from "@/contexts/plan-context";

export function usePdfExport(filename: string) {
  const exportRef = useRef<HTMLDivElement>(null);
  const { canExportPdf } = usePlan();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = useCallback(async () => {
    if (!exportRef.current || !canExportPdf()) return;
    setIsExporting(true);

    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const canvas = await html2canvas(exportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        onclone: (clonedDoc) => {
          const root = clonedDoc.documentElement;
          const computed = getComputedStyle(document.documentElement);
          const vars = [
            "--profit",
            "--loss",
            "--score",
            "--foreground",
            "--muted-foreground",
            "--border",
            "--card",
            "--background",
            "--muted",
          ];
          vars.forEach((v) => {
            const val = computed.getPropertyValue(v).trim();
            if (val) root.style.setProperty(v, val);
          });
        },
      });

      const pdf = new jsPDF("p", "mm", "a4", true);
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 5;
      const usableWidth = pageWidth - margin * 2;

      const imgWidth = usableWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      if (imgHeight <= pageHeight - margin * 2) {
        const imgData = canvas.toDataURL("image/png");
        pdf.addImage(imgData, "PNG", margin, margin, imgWidth, imgHeight);
      } else {
        const usablePageHeight = pageHeight - margin * 2;
        const totalPages = Math.ceil(imgHeight / usablePageHeight);

        for (let page = 0; page < totalPages; page++) {
          if (page > 0) pdf.addPage();

          const sourceY =
            (page * usablePageHeight * canvas.width) / imgWidth;
          const sourceHeight = Math.min(
            (usablePageHeight * canvas.width) / imgWidth,
            canvas.height - sourceY
          );

          const sliceCanvas = document.createElement("canvas");
          sliceCanvas.width = canvas.width;
          sliceCanvas.height = sourceHeight;
          const ctx = sliceCanvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(
              canvas,
              0,
              sourceY,
              canvas.width,
              sourceHeight,
              0,
              0,
              canvas.width,
              sourceHeight
            );
          }

          const sliceData = sliceCanvas.toDataURL("image/png");
          const sliceImgHeight = (sourceHeight * imgWidth) / canvas.width;
          pdf.addImage(
            sliceData,
            "PNG",
            margin,
            margin,
            imgWidth,
            sliceImgHeight
          );
        }
      }

      pdf.save(`${filename}.pdf`);
    } catch (error) {
      console.error("[PDF Export]", error);
    } finally {
      setIsExporting(false);
    }
  }, [canExportPdf, filename]);

  return { exportRef, handleExport, isExporting, canExport: canExportPdf() };
}
