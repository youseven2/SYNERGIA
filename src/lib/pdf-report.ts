"use client";

import { jsPDF } from "jspdf";
import { AthleteProfile, RegistrationApplication } from "./synergia-store";

function drawSynergiaLetterhead(doc: jsPDF, subtitle: string): void {
  // Cabecera membretada oficial SYNERGIA ALL STARS
  doc.setFillColor(7, 11, 20);
  doc.rect(0, 0, 210, 34, "F");

  // Franja dual turquesa y morado del logo
  doc.setFillColor(0, 183, 164);
  doc.rect(0, 34, 125, 2.2, "F");
  doc.setFillColor(126, 61, 151);
  doc.rect(125, 34, 85, 2.2, "F");

  doc.setTextColor(0, 183, 164);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("SYNERGIA ALL STARS", 14, 15);

  doc.setTextColor(226, 232, 240);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Club Deportivo de Porrismo · ${subtitle}`, 14, 22);

  doc.setTextColor(148, 163, 184);
  doc.setFontSize(8);
  doc.text(
    "Sedes: Los Dos Caminos (Av. El Centro) / Bellas Artes (GAN) · Caracas",
    14,
    29
  );
}

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

export function generateAthleteProfilePdf(athlete: AthleteProfile): void {
  const doc = new jsPDF();
  drawSynergiaLetterhead(doc, "Ficha Oficial de Perfil del Atleta");

  // Foto tipo carnet en la esquina superior derecha si existe
  if (athlete.photoDataUrl && athlete.photoDataUrl.startsWith("data:image/")) {
    try {
      const format = athlete.photoDataUrl.includes("image/png") ? "PNG" : "JPEG";
      doc.setDrawColor(0, 183, 164);
      doc.rect(158, 42, 36, 44);
      doc.addImage(athlete.photoDataUrl, format, 159, 43, 34, 42);
    } catch {
      // ignorar si la imagen no es compatible con jsPDF
    }
  }

  let y = 46;
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("1. DATOS DEL DEPORTISTA", 14, y);
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const addLine = (label: string, val: string, maxW = 138) => {
    const lines = doc.splitTextToSize(`${label}: ${val}`, maxW);
    doc.text(lines, 14, y);
    y += Math.max(6, lines.length * 5);
  };

  addLine("Nombre Completo", athlete.fullName);
  addLine("ID Oficial", athlete.athleteId);
  addLine("Cédula de Identidad", athlete.documentId || "No registrada");
  addLine(
    "Fecha de Nacimiento / Edad",
    `${athlete.birthDate || "N/A"} (${athlete.age} años)`
  );
  addLine("Categoría / Posición", `${athlete.category} · ${athlete.position}`);
  addLine(
    "Fecha de Ingreso al Club",
    athlete.clubJoinDate || athlete.formalizedAt.slice(0, 10)
  );
  addLine("Dirección", athlete.homeAddress || "No registrada", 180);

  y += 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("2. INFORMACIÓN MÉDICA Y ALERGIAS", 14, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  addLine("Tipo de Sangre", athlete.bloodType || "No registrado", 180);
  addLine(
    "Enfermedad, condición médica o lesión previa",
    athlete.hasMedicalCondition
      ? `SÍ — ${athlete.medicalConditionDetail || "Sin detalle"}`
      : "NO",
    180
  );
  addLine(
    "Alérgico/a a algún medicamento",
    athlete.hasAllergies
      ? `SÍ — ${athlete.allergiesDetail || "Sin detalle"}`
      : "NO",
    180
  );

  y += 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("3. DATOS DEL REPRESENTANTE / CONTACTO", 14, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  addLine(
    "Nombre y Apellido del Representante",
    athlete.repName || athlete.fullName,
    180
  );
  addLine(
    "Cédula del Representante",
    athlete.repDocumentId || athlete.documentId || "No registrada",
    180
  );
  addLine(
    "Contacto Principal",
    athlete.repPhone || athlete.phone || "No registrado",
    180
  );
  addLine(
    "Contacto Secundario",
    athlete.repSecondaryPhone || athlete.emergencyPhone || "No registrado",
    180
  );

  y += 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("4. DOCUMENTOS Y COMPROMISOS LEGALES", 14, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);

  addLine(
    "Partida de nacimiento o cédula del deportista",
    athlete.athleteIdDocName ? `Adjunto (${athlete.athleteIdDocName})` : "Pendiente",
    180
  );
  addLine(
    "Foto tipo carnet (fondo blanco)",
    athlete.photoDataUrl ? "Adjunta" : "Pendiente",
    180
  );
  addLine(
    "Cédula del representante",
    athlete.repIdDocName ? `Adjunto (${athlete.repIdDocName})` : "Pendiente",
    180
  );
  addLine(
    "Términos y Condiciones del Club",
    athlete.acceptedTerms ? "ACEPTADOS" : "Pendiente",
    180
  );
  addLine(
    "Relevo de Responsabilidad del Club",
    athlete.acceptedWaiver ? "ACEPTADO" : "Pendiente",
    180
  );

  // Pie de hoja membretada
  if (y < 260) y = 262;
  doc.setDrawColor(100, 116, 139);
  doc.line(14, y, 85, y);
  doc.line(120, y, 194, y);
  doc.setFontSize(8.5);
  doc.text("Firma del Representante / Atleta", 22, y + 5);
  doc.text("Dirección SYNERGIA ALL STARS", 132, y + 5);

  const safeName = athlete.fullName.replace(/[^a-zA-Z0-9_-]/g, "_");
  doc.save(`Perfil_Membretado_${safeName}.pdf`);
}

export function generateAthletesListPdf(
  athletes: AthleteProfile[],
  categoryLabel: string
): void {
  const doc = new jsPDF();
  drawSynergiaLetterhead(doc, "Listado Oficial de Atletas en la Academia");

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`Filtro de Categoría: ${categoryLabel}`, 14, 45);
  doc.text(`Total de Atletas: ${athletes.length}`, 14, 51);

  let y = 60;
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y - 5, 182, 8, "F");
  doc.setFontSize(9);
  doc.text("#", 16, y);
  doc.text("ID Oficial", 24, y);
  doc.text("Nombre Completo", 58, y);
  doc.text("Edad", 112, y);
  doc.text("Categoría", 124, y);
  doc.text("Teléfono", 168, y);

  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);

  athletes.forEach((ath, idx) => {
    if (y > 275) {
      doc.addPage();
      drawSynergiaLetterhead(doc, "Listado Oficial de Atletas (Cont.)");
      y = 46;
    }
    doc.text(String(idx + 1), 16, y);
    doc.text(ath.athleteId.slice(0, 16), 24, y);
    doc.text(ath.fullName.slice(0, 26), 58, y);
    doc.text(`${ath.age}`, 112, y);
    doc.text(ath.category.split("(")[0].trim().slice(0, 20), 124, y);
    doc.text((ath.repPhone || ath.phone || "").slice(0, 15), 168, y);
    y += 6.5;
  });

  doc.save(`Listado_Atletas_SYNERGIA_${athletes.length}.pdf`);
}
