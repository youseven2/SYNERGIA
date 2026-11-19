"use client";

import { jsPDF } from "jspdf";
import { RegistrationApplication } from "./synergia-store";

export function generateEvaluationPdf(app: RegistrationApplication): void {
  if (!app.evaluation) return;

  const doc = new jsPDF();
  const ev = app.evaluation;

  // Header
  doc.setFillColor(7, 11, 20);
  doc.rect(0, 0, 210, 32, "F");

  doc.setTextColor(16, 185, 129);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("SYNERGIA ALL STARS", 14, 15);

  doc.setTextColor(226, 232, 240);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Escuela Exclusiva de Porrismo · Reporte de Evaluación", 14, 23);

  // Athlete info
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Datos del Aspirante", 14, 44);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Nombre del Atleta: ${app.fullName}`, 14, 52);
  doc.text(`Documento: ${app.documentId}   |   Edad: ${app.age} años`, 14, 58);
  if (app.isMinor && app.repName) {
    doc.text(
      `Representante: ${app.repName} (${app.repRelationship ?? "Representante"}) - Doc: ${app.repDocumentId ?? ""}`,
      14,
      64
    );
  }
  doc.text(`Formulario: ${ev.formName}`, 14, 72);
  doc.text(`Categoría del Formulario: ${ev.category}`, 14, 78);
  doc.text(
    `Fecha de Evaluación: ${new Date(ev.evaluatedAt).toLocaleString("es-ES")}`,
    14,
    84
  );

  // Table header
  let y = 96;
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y - 6, 182, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.text("Actividad / Criterio", 16, y);
  doc.text("Check", 122, y);
  doc.text("Pond.", 148, y);
  doc.text("Nota", 174, y);

  y += 8;
  doc.setFont("helvetica", "normal");

  ev.items.forEach((item) => {
    if (y > 265) {
      doc.addPage();
      y = 20;
    }
    const descLines = doc.splitTextToSize(item.description, 100);
    doc.text(descLines, 16, y);
    doc.text(item.checked ? "[X] Sí" : "[ ] No", 122, y);
    doc.text(`${item.weight} pts`, 148, y);
    doc.text(`${item.score} pts`, 174, y);
    y += Math.max(8, descLines.length * 5 + 3);
  });

  // Total
  y += 4;
  doc.setDrawColor(16, 185, 129);
  doc.line(14, y, 196, y);
  y += 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(
    `CALIFICACIÓN TOTAL: ${ev.totalScore} / ${ev.maxScore} pts`,
    14,
    y
  );

  if (app.assignedCategory || app.assignedPosition) {
    y += 8;
    doc.setFontSize(10);
    doc.text(
      `Categoría asignada: ${app.assignedCategory ?? "Por definir"}   |   Posición: ${app.assignedPosition ?? "Por definir"}`,
      14,
      y
    );
  }

  if (ev.coachNotes) {
    y += 10;
    doc.setFont("helvetica", "bold");
    doc.text("Observaciones del Entrenador:", 14, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    const notesLines = doc.splitTextToSize(ev.coachNotes, 180);
    doc.text(notesLines, 14, y);
  }

  const safeName = app.fullName.replace(/[^a-zA-Z0-9_-]/g, "_");
  doc.save(`Evaluacion_${safeName}.pdf`);
}
