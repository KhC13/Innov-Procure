import { jsPDF } from 'jspdf';
import { Pilot, PilotKPI, PilotMilestone, User } from '../types';

export function formatINR(value?: number): string {
  if (value === undefined || value === null) return 'INR 0';
  if (value >= 10000000) return `INR ${(value / 10000000).toFixed(2)} Cr`;
  if (value >= 100000) return `INR ${(value / 100000).toFixed(2)} Lakhs`;
  return `INR ${value.toLocaleString('en-IN')}`;
}

const BLACK: [number, number, number] = [25, 25, 25];
const GREY: [number, number, number] = [238, 238, 238];
const BORDER: [number, number, number] = [45, 45, 45];

const clean = (value: unknown, fallback = 'N/A') => String(value ?? fallback).replace(/\s+/g, ' ').trim();
const shortDate = (value?: string) => value ? new Date(value).toLocaleDateString('en-IN') : 'N/A';

function fit(doc: jsPDF, value: unknown, width: number, maxLines = 1) {
  return doc.splitTextToSize(clean(value), width).slice(0, maxLines);
}

function cell(doc: jsPDF, x: number, y: number, width: number, height: number, value: unknown, options?: {
  bold?: boolean;
  size?: number;
  align?: 'left' | 'center' | 'right';
  fill?: [number, number, number];
  color?: [number, number, number];
  padding?: number;
}) {
  const padding = options?.padding ?? 2.4;
  doc.setFillColor(...(options?.fill ?? [255, 255, 255]));
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.25);
  doc.rect(x, y, width, height, 'FD');
  doc.setFont('helvetica', options?.bold ? 'bold' : 'normal');
  doc.setFontSize(options?.size ?? 7.5);
  doc.setTextColor(...(options?.color ?? BLACK));
  const lines = fit(doc, value, width - padding * 2, 2);
  const align = options?.align ?? 'left';
  const textX = align === 'center' ? x + width / 2 : align === 'right' ? x + width - padding : x + padding;
  doc.text(lines, textX, y + height / 2 - (lines.length - 1) * 1.7 + 1.7, { align, baseline: 'middle' });
}

function sectionBand(doc: jsPDF, x: number, y: number, width: number, title: string) {
  doc.setFillColor(...GREY);
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.rect(x, y, width, 7, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...BLACK);
  doc.text(title, x + 3, y + 4.8);
}

function drawKpiTable(doc: jsPDF, x: number, y: number, width: number, pilot: Pilot) {
  const labels = ['SANCTIONED BUDGET', 'STATUS', 'READINESS PROGRESS', 'SCALE & REACHNESS'];
  const values = [formatINR(pilot.budget), clean(pilot.status).replace(/_/g, ' '), `${clean(pilot.completion_percentage, '0')}%`, pilot.scale_readiness_score != null ? `${pilot.scale_readiness_score}/100` : 'PENDING'];
  const widthPerCell = width / labels.length;
  labels.forEach((label, index) => {
    const cellX = x + index * widthPerCell;
    cell(doc, cellX, y, widthPerCell, 16, '', { fill: [248, 248, 248] });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.4);
    doc.setTextColor(...BLACK);
    doc.text(label, cellX + widthPerCell / 2, y + 4.5, { align: 'center' });
    doc.setFontSize(10.5);
    doc.text(values[index], cellX + widthPerCell / 2, y + 11.5, { align: 'center' });
  });
}

function drawKpis(doc: jsPDF, x: number, y: number, width: number, kpis: PilotKPI[]) {
  const columns = [width * 0.29, width * 0.19, width * 0.19, width * 0.21, width * 0.12];
  const headers = ['METRIC NAME', 'BASELINE', 'TARGET', 'CURRENT RECORDED', 'STATUS'];
  let offset = x;
  headers.forEach((header, index) => {
    cell(doc, offset, y, columns[index], 7, header, { bold: true, size: 6.8, align: 'center', fill: GREY });
    offset += columns[index];
  });
  const rows = kpis.slice(0, 4);
  rows.forEach((kpi, rowIndex) => {
    const rowY = y + 7 + rowIndex * 7;
    const unit = clean(kpi.metric_unit, '');
    const status = kpi.status === 'EXCEEDED' || kpi.status === 'ON_TRACK' ? 'ACHIEVED' : 'AT RISK';
    const values = [clean(kpi.name), `${clean(kpi.baseline_value)} ${unit}`, `${clean(kpi.target_value)} ${unit}`, `${clean(kpi.current_value)} ${unit}`, status];
    offset = x;
    values.forEach((value, index) => {
      cell(doc, offset, rowY, columns[index], 7, value, { bold: index === 0 || index === 4, size: 7, align: index === 0 ? 'left' : 'center', color: index === 4 && status === 'ACHIEVED' ? [25, 80, 35] : BLACK });
      offset += columns[index];
    });
  });
  return 7 + Math.max(rows.length, 1) * 7;
}

function drawMilestones(doc: jsPDF, x: number, y: number, width: number, milestones: PilotMilestone[]) {
  const columns = [width * 0.36, width * 0.27, width * 0.14, width * 0.11, width * 0.12];
  const headers = ['MILESTONE DELIVERABLE', 'LEAD / OWNER', 'DUE DATE', 'COMPL. %', 'STATUS'];
  let offset = x;
  headers.forEach((header, index) => {
    cell(doc, offset, y, columns[index], 7, header, { bold: true, size: 6.7, align: 'center', fill: GREY });
    offset += columns[index];
  });
  const rows = milestones.slice(0, 4);
  rows.forEach((milestone, rowIndex) => {
    const rowY = y + 7 + rowIndex * 7;
    const values = [clean(milestone.title), clean(milestone.owner, 'Project Lead'), shortDate(milestone.due_date), `${milestone.completion_percentage}%`, milestone.status.replace(/_/g, ' ')];
    offset = x;
    values.forEach((value, index) => {
      cell(doc, offset, rowY, columns[index], 7, value, { bold: index === 0 || index === 4, size: 6.8, align: index === 0 ? 'left' : 'center', color: index === 4 && milestone.status === 'COMPLETED' ? [25, 80, 35] : BLACK });
      offset += columns[index];
    });
  });
  return 7 + Math.max(rows.length, 1) * 7;
}

export function generatePilotPdf(pilot: Pilot, user?: User | null) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 10;
  const width = pageWidth - margin * 2;
  const ref = `INNOV-PILOT-${clean(pilot.problem_code, 'REF')}-${pilot.id.slice(0, 8).toUpperCase()}`;
  const generatedAt = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const officer = user ? `${clean(user.name)} (${clean(user.role).replace(/_/g, ' ')})` : 'Authorized Procurement Officer';
  let y = 10;

  doc.setTextColor(...BLACK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('GOVERNMENT OF INDIA', pageWidth / 2, y + 7, { align: 'center' });
  doc.setFontSize(15);
  doc.text('INNOVPROCURE PLATFORM', pageWidth / 2, y + 14, { align: 'center' });
  doc.setFontSize(8.5);
  doc.text('Find Pilot Projects Verification & Scale Readiness Summary Dossier', pageWidth / 2, y + 21, { align: 'center' });
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.35);
  doc.line(margin, y + 27, pageWidth - margin, y + 27);
  y += 32;

  const metaWidths = [width * 0.4, width * 0.3, width * 0.3];
  const meta = [['Ref. No.', ref], ['Generated On', generatedAt], ['Authorized Officer', officer]];
  let metaX = margin;
  meta.forEach(([label, value], index) => {
    cell(doc, metaX, y, metaWidths[index], 16, '', { fill: [255, 255, 255] });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text(label, metaX + 3, y + 4.8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.6);
    doc.text(fit(doc, value, metaWidths[index] - 6, 2), metaX + 3, y + 9.5);
    metaX += metaWidths[index];
  });
  y += 20;

  sectionBand(doc, margin, y, width, clean(pilot.title, 'Pilot Project'));
  doc.setDrawColor(...BORDER);
  doc.rect(margin, y + 7, width, 24);
  const identity = [
    ['Department / Ministry', clean(pilot.department_name, 'Public Sector Department')],
    ['Sector Provider', `${clean(pilot.company_name)}${pilot.startup_location ? ` (${pilot.startup_location})` : ''}`],
    ['Geozone / State / Cities', clean(pilot.startup_location, 'India')],
    ['Implementation Window', `${shortDate(pilot.start_date)} to ${shortDate(pilot.end_date)}`],
  ];
  identity.forEach(([label, value], index) => {
    const lineY = y + 12 + index * 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text(label, margin + 3, lineY);
    doc.setFont('helvetica', 'normal');
    doc.text(':', margin + 49, lineY);
    doc.text(fit(doc, value, width - 56, 1), margin + 53, lineY);
  });
  y += 36;

  drawKpiTable(doc, margin, y, width, pilot);
  y += 22;

  sectionBand(doc, margin, y, width, '1. PILOT OBJECTIVES & OPERATIONAL MANDATE');
  const objectiveLines = fit(doc, pilot.objectives, width - 8, 2);
  const outcomeLines = fit(doc, pilot.expected_outcomes, width - 8, 2);
  const objectiveHeight = 9 + objectiveLines.length * 3.8 + (pilot.expected_outcomes ? 6 + outcomeLines.length * 3.8 : 0);
  doc.rect(margin, y + 7, width, objectiveHeight);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(objectiveLines, margin + 3, y + 13);
  if (pilot.expected_outcomes) {
    doc.setFont('helvetica', 'bold');
    doc.text('Targeted Public Deliverables & Impact Metrics:', margin + 3, y + 18 + objectiveLines.length * 3.8);
    doc.setFont('helvetica', 'normal');
    doc.text(outcomeLines, margin + 3, y + 22 + objectiveLines.length * 3.8);
  }
  y += 9 + objectiveHeight;

  sectionBand(doc, margin, y, width, '2. PERFORMANCE TELEMETRY (KPIS & BENCHMARKS)');
  const kpiHeight = drawKpis(doc, margin, y + 7, width, pilot.kpis ?? []);
  y += 9 + kpiHeight;

  sectionBand(doc, margin, y, width, '3. SLA MILESTONE TRACKING & DELIVERY VERIFICATION');
  const milestoneHeight = drawMilestones(doc, margin, y + 7, width, pilot.milestones ?? []);
  y += 9 + milestoneHeight;

  sectionBand(doc, margin, y, width, '4. RISK MITIGATION & PROTOCOL SAFEGUARDS');
  const risk = pilot.risks?.[0];
  const riskTitle = risk ? `${risk.severity} SEVERITY: ${risk.title}` : 'No active risks recorded for this pilot';
  const riskBody = risk ? `Mitigation: ${risk.mitigation}` : 'The project record contains no active risk entries at the time of generation.';
  doc.setFillColor(248, 248, 248);
  doc.rect(margin, y + 7, width, 14, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.8);
  doc.text(fit(doc, riskTitle, width - 8, 1), margin + 3, y + 13);
  doc.setFont('helvetica', 'normal');
  doc.text(fit(doc, riskBody, width - 8, 1), margin + 3, y + 18);

  const footerY = pageHeight - 16;
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.35);
  doc.line(margin, footerY, pageWidth - margin, footerY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.text(`Report ID: ${ref}`, margin, footerY + 5);
  doc.setFont('helvetica', 'normal');
  doc.text('This is a system generated report and does not require a physical signature.', margin, footerY + 9);
  doc.text('Page 1 of 1', pageWidth - margin, footerY + 5, { align: 'right' });
  doc.text(generatedAt, pageWidth - margin, footerY + 9, { align: 'right' });

  const safeFilename = `innovprocure-pilot-${pilot.problem_code || 'summary'}-${pilot.id.slice(0, 8)}.pdf`.toLowerCase();
  doc.save(safeFilename);
}
