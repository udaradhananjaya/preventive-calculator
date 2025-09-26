const { Task, Student, Credit } = require('../models'); // Adjust path as needed
const { Op } = require('sequelize');
const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const { Table } = require('pdfkit-table');

async function getReportData({ startDate, endDate, studentId }) {
  const { Op } = require('sequelize');
  const taskWhere = {};

  if (startDate || endDate) {
    taskWhere.createdAt = {};
    if (startDate) {
      // Start of the day
      taskWhere.createdAt[Op.gte] = new Date(startDate + 'T00:00:00.000Z');
    }
    if (endDate) {
      // End of the day
      taskWhere.createdAt[Op.lte] = new Date(endDate + 'T23:59:59.999Z');
    }
  }
  if (studentId) {
    taskWhere.studentId = studentId;
  }

  // Tasks per day (calendar)
  const tasks = await Task.findAll({
    where: taskWhere,
    attributes: ['createdAt', 'completedDate', 'status', 'studentId'],
    raw: true,
  });

  // Completed tasks per day
  const completedTasks = tasks.filter(t => t.status && t.completedDate);

  // Per-student stats
  const students = await Student.findAll({ raw: true });
  const credits = await Credit.findAll({ raw: true });

  // Aggregate per-student
  const studentStats = students.map(s => {
    const studentTasks = tasks.filter(t => t.studentId === s.id);
    const completed = studentTasks.filter(t => t.status).length;
    const pending = studentTasks.filter(t => !t.status).length;
    const totalCredits = credits.filter(c => c.studentId === s.id).reduce((sum, c) => sum + c.income, 0);
    return {
      id: s.id,
      name: s.name,
      total: studentTasks.length,
      completed,
      pending,
      credits: totalCredits,
    };
  });

  // Calendar: count tasks per day
  const calendar = {};
  tasks.forEach(t => {
    // const day = t.createdAt.toISOString().slice(0, 10); // <-- This line causes the error
    const day = typeof t.createdAt === 'string'
      ? t.createdAt.slice(0, 10)
      : t.createdAt?.toISOString().slice(0, 10);
    calendar[day] = (calendar[day] || 0) + 1;
  });

  // Completed per day
  const completedPerDay = {};
  completedTasks.forEach(t => {
    const day = t.completedDate;
    completedPerDay[day] = (completedPerDay[day] || 0) + 1;
  });

  // Prediction (simple moving average, 7-day window)
  const allDays = Object.keys(calendar).sort();
  const counts = allDays.map(d => calendar[d]);
  const movingAvg = [];
  for (let i = 0; i < counts.length; i++) {
    const window = counts.slice(Math.max(0, i - 6), i + 1);
    movingAvg.push(window.reduce((a, b) => a + b, 0) / window.length);
  }

  return {
    calendar,
    completedPerDay,
    prediction: { dates: allDays, movingAvg },
    studentStats,
    students,
    tasks,
    credits,
  };
}

// Export to CSV
async function exportCSV(data, filePath) {
  const parser = new Parser();
  const csv = parser.parse(data);
  fs.writeFileSync(filePath, csv);
}

// Export to PDF (summary table only)
async function exportPDF(studentStats, filePath) {
  const doc = new PDFDocument({ margin: 40 });
  doc.pipe(fs.createWriteStream(filePath));
  doc.fontSize(16).text('Student Task Summary', { align: 'center' });
  doc.moveDown();

  // Table setup
  doc.fontSize(12);
  const tableTop = doc.y + 10;
  const rowHeight = 24;
  const colWidths = [180, 70, 70, 70, 70];
  const startX = doc.page.margins.left;
  const headers = ['Name', 'Total', 'Completed', 'Pending', 'Credits'];

  // Draw header row with borders
  let x = startX;
  let y = tableTop;
  headers.forEach((header, i) => {
    doc.rect(x, y, colWidths[i], rowHeight).stroke();
    doc.text(header, x + 4, y + 6, { width: colWidths[i] - 8, align: 'left' });
    x += colWidths[i];
  });

  // Draw data rows with borders
  y += rowHeight;
  studentStats.forEach(s => {
    let x = startX;
    const row = [
      s.name,
      s.total,
      s.completed,
      s.pending,
      s.credits.toFixed(2)
    ];
    row.forEach((cell, i) => {
      doc.rect(x, y, colWidths[i], rowHeight).stroke();
      doc.text(cell.toString(), x + 4, y + 6, { width: colWidths[i] - 8, align: 'left' });
      x += colWidths[i];
    });
    y += rowHeight;
    // Add new page if needed
    if (y + rowHeight > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      y = doc.page.margins.top;
    }
  });

  doc.end();
}

module.exports = {
  getReportData,
  exportCSV,
  exportPDF,
};