"use client";

import { jsPDF } from "jspdf";
import { AthleteProfile, RegistrationApplication } from "./synergia-store";
import { AnalyticsState, formatDuration } from "./analytics-store";

function drawSynergiaLetterhead(doc: jsPDF, subtitle: string): void {
  // Marco sutil de hoja membretada
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.rect(8, 8, 194, 281);

  // Cabecera membretada oficial SYNERGIA ALL STARS
  doc.setFillColor(7, 11, 20);
  doc.rect(8, 8, 194, 34, "F");

  // Acento lateral morado + turquesa
  doc.setFillColor(126, 61, 151);
  doc.rect(8, 8, 4, 34, "F");
  doc.setFillColor(0, 183, 164);
  doc.rect(12, 8, 2, 34, "F");

  // Franja dual inferior turquesa y morado del logo
  doc.setFillColor(0, 183, 164);
  doc.rect(8, 42, 118, 2.2, "F");
  doc.setFillColor(126, 61, 151);
  doc.rect(126, 42, 76, 2.2, "F");

  // Título principal
  doc.setTextColor(0, 183, 164);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("SYNERGIA ALL STARS", 19, 21);

  doc.setTextColor(241, 245, 249);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Club Deportivo de Porrismo · ${subtitle}`, 19, 28);

  doc.setTextColor(148, 163, 184);
  doc.setFontSize(7.8);
  doc.text(
    "Sedes: Los Dos Caminos (Av. El Centro) / Bellas Artes (GAN) · Caracas, Venezuela",
    19,
    35.5
  );

  // Insignia derecha en cabecera
  doc.setFillColor(126, 61, 151);
  doc.roundedRect(162, 14, 34, 10, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text("ALL STAR CLUB", 179, 20.5, { align: "center" });

  doc.setTextColor(148, 163, 184);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(`Emisión: ${new Date().toLocaleDateString("es-ES")}`, 196, 35.5, {
    align: "right",
  });
}

function drawSynergiaFooter(doc: jsPDF): void {
  doc.setFillColor(0, 183, 164);
  doc.rect(8, 281, 118, 1.5, "F");
  doc.setFillColor(126, 61, 151);
  doc.rect(126, 281, 76, 1.5, "F");

  doc.setTextColor(100, 116, 139);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(
    "SYNERGIA ALL STARS · Documento Oficial · Escuela Exclusiva de Porrismo",
    105,
    286.5,
    { align: "center" }
  );
}

export function generateEvaluationPdf(app: RegistrationApplication): void {
  if (!app.evaluation) return;

  const doc = new jsPDF();
  const ev = app.evaluation;

  drawSynergiaLetterhead(doc, "Reporte Oficial de Evaluación Deportiva");

  // Tarjeta de Datos del Aspirante
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.35);
  doc.roundedRect(14, 50, 182, app.isMinor && app.repName ? 44 : 38, 3, 3, "FD");

  // Barra lateral turquesa de la tarjeta
  doc.setFillColor(0, 183, 164);
  doc.rect(14, 50, 2.5, app.isMinor && app.repName ? 44 : 38, "F");

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("DATOS DEL ASPIRANTE Y EVALUACIÓN", 20, 58);

  doc.setFontSize(9.5);
  doc.setFont("helvetica", "normal");
  doc.text(`Nombre del Atleta: ${app.fullName}`, 20, 65);
  doc.text(`Documento: ${app.documentId}   |   Edad: ${app.age} años`, 20, 71);
  let infoY = 77;
  if (app.isMinor && app.repName) {
    doc.text(
      `Representante: ${app.repName} (${app.repRelationship ?? "Representante"}) · Doc: ${app.repDocumentId ?? ""}`,
      20,
      infoY
    );
    infoY += 6;
  }
  doc.text(`Formulario: ${ev.formName}`, 20, infoY);
  infoY += 6;
  doc.text(
    `Categoría: ${ev.category}   |   Fecha: ${new Date(ev.evaluatedAt).toLocaleString("es-ES")}`,
    20,
    infoY
  );

  // Tabla de Criterios
  let y = app.isMinor && app.repName ? 104 : 98;
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(14, y - 6, 182, 9, 1.5, 1.5, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("Actividad / Criterio Evaluado", 18, y);
  doc.text("Estado", 122, y);
  doc.text("Pond.", 148, y);
  doc.text("Nota", 174, y);

  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);

  ev.items.forEach((item, index) => {
    if (y > 235) {
      drawSynergiaFooter(doc);
      doc.addPage();
      drawSynergiaLetterhead(doc, "Reporte Oficial de Evaluación (Cont.)");
      y = 54;
    }
    const descLines = doc.splitTextToSize(item.description, 98);
    const rowHeight = Math.max(8.5, descLines.length * 5 + 3.5);

    if (index % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y - 5.2, 182, rowHeight, "F");
    }
    doc.setDrawColor(226, 232, 240);
    doc.line(14, y - 5.2 + rowHeight, 196, y - 5.2 + rowHeight);

    doc.setTextColor(15, 23, 42);
    doc.text(descLines, 18, y);
    if (item.checked) {
      doc.setTextColor(5, 150, 105);
      doc.setFont("helvetica", "bold");
      doc.text("Cumplido", 122, y);
    } else {
      doc.setTextColor(100, 116, 139);
      doc.setFont("helvetica", "normal");
      doc.text("Pendiente", 122, y);
    }
    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42);
    doc.text(`${item.weight} pts`, 148, y);
    doc.setFont("helvetica", "bold");
    doc.text(`${item.score} pts`, 174, y);
    doc.setFont("helvetica", "normal");

    y += rowHeight;
  });

  // Caja de Calificación Total
  y += 6;
  const pct = ev.maxScore > 0 ? Math.round((ev.totalScore / ev.maxScore) * 100) : 0;
  doc.setFillColor(240, 253, 250);
  doc.setDrawColor(0, 183, 164);
  doc.setLineWidth(0.6);
  doc.roundedRect(14, y, 182, app.assignedCategory || app.assignedPosition ? 22 : 14, 2.5, 2.5, "FD");

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11.5);
  doc.text(
    `CALIFICACIÓN TOTAL: ${ev.totalScore} / ${ev.maxScore} pts (${pct}%)`,
    18,
    y + 9
  );

  if (app.assignedCategory || app.assignedPosition) {
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105);
    doc.text(
      `Categoría asignada: ${app.assignedCategory ?? "Por definir"}   |   Posición: ${app.assignedPosition ?? "Por definir"}`,
      18,
      y + 16.5
    );
    y += 28;
  } else {
    y += 20;
  }

  if (ev.coachNotes) {
    doc.setFillColor(250, 245, 255);
    doc.setDrawColor(126, 61, 151);
    doc.setLineWidth(0.4);
    const notesLines = doc.splitTextToSize(ev.coachNotes, 170);
    const boxH = Math.max(18, notesLines.length * 5 + 12);
    doc.roundedRect(14, y, 182, boxH, 2.5, 2.5, "FD");
    doc.setFillColor(126, 61, 151);
    doc.rect(14, y, 2.5, boxH, "F");

    doc.setTextColor(88, 28, 135);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text("Observaciones del Entrenador:", 20, y + 7);
    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "normal");
    doc.text(notesLines, 20, y + 13);
  }

  // Firmas oficiales
  doc.setDrawColor(100, 116, 139);
  doc.setLineWidth(0.35);
  doc.line(22, 266, 88, 266);
  doc.line(122, 266, 188, 266);
  doc.setTextColor(51, 65, 85);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("Entrenador / Evaluador", 55, 271, { align: "center" });
  doc.text("Dirección General SYNERGIA ALL STARS", 155, 271, { align: "center" });

  drawSynergiaFooter(doc);

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

export function generateAnalyticsPdf(analytics: AnalyticsState): void {
  const doc = new jsPDF();
  drawSynergiaLetterhead(doc, "Reporte Oficial de Estadísticas y Métricas Web");

  const avgSeconds =
    analytics.totalVisits > 0
      ? analytics.totalDurationSeconds / analytics.totalVisits
      : 0;
  const rankedSections = Object.entries(analytics.sectionViews).sort(
    (a, b) => b[1] - a[1]
  );
  const topSection = rankedSections[0] ?? ["Inicio", 0];
  const rankedCountries = Object.entries(analytics.visitsByCountry).sort(
    (a, b) => b[1] - a[1]
  );
  const totalCountryVisits = Math.max(
    1,
    rankedCountries.reduce((s, [, v]) => s + v, 0)
  );

  let y = 46;
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("1. RESUMEN GENERAL DE MÉTRICAS", 14, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Fecha de Emisión: ${new Date().toLocaleString("es-ES")}`, 14, y);
  y += 6;
  doc.text(`Visitas Totales: ${analytics.totalVisits}`, 14, y);
  y += 6;
  doc.text(
    `Tiempo Total de Duración en Página: ${formatDuration(analytics.totalDurationSeconds)}`,
    14,
    y
  );
  y += 6;
  doc.text(
    `Tiempo Promedio de Duración por Visita: ${formatDuration(avgSeconds)}`,
    14,
    y
  );
  y += 6;
  doc.text(
    `Contenido Más Visto: ${topSection[0]} (${topSection[1]} vistas)`,
    14,
    y
  );

  y += 12;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("2. CONTENIDO MÁS VISTO", 14, y);
  y += 7;

  doc.setFillColor(241, 245, 249);
  doc.rect(14, y - 5, 182, 7, "F");
  doc.setFontSize(9.5);
  doc.text("Sección / Contenido", 16, y);
  doc.text("Vistas", 168, y);
  y += 7;

  doc.setFont("helvetica", "normal");
  rankedSections.forEach(([section, views]) => {
    doc.text(section, 16, y);
    doc.text(String(views), 168, y);
    y += 6;
  });

  y += 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("3. VISITAS POR PAÍS", 14, y);
  y += 7;

  doc.setFillColor(241, 245, 249);
  doc.rect(14, y - 5, 182, 7, "F");
  doc.setFontSize(9.5);
  doc.text("País / Región", 16, y);
  doc.text("Visitas", 140, y);
  doc.text("Porcentaje", 170, y);
  y += 7;

  doc.setFont("helvetica", "normal");
  if (rankedCountries.length === 0) {
    doc.text("Sin visitas registradas por país.", 16, y);
    y += 6;
  } else {
    rankedCountries.forEach(([country, count]) => {
      const pct = Math.round((count / totalCountryVisits) * 100);
      doc.text(country, 16, y);
      doc.text(String(count), 140, y);
      doc.text(`${pct}%`, 170, y);
      y += 6;
    });
  }

  doc.setDrawColor(100, 116, 139);
  doc.line(14, 265, 90, 265);
  doc.setFontSize(8.5);
  doc.text("Dirección General · SYNERGIA ALL STARS", 16, 270);

  doc.save("Reporte_Estadisticas_SYNERGIA.pdf");
}
