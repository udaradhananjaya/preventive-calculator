const { Task, Student, Credit } = require('../models'); // Adjust path as needed
const { Op } = require('sequelize');
const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');
const fs = require('fs');

async function getReportData({ startDate, endDate, studentId }) {
  // Build where clauses
  const dateFilter = {};
  if (startDate) dateFilter[Op.gte] = new Date(startDate);
  if (endDate) dateFilter[Op.lte] = new Date(endDate);

  const taskWhere = {};
  if (startDate || endDate) taskWhere.createdAt = dateFilter;
  if (studentId) taskWhere.studentId = studentId;

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
    const totalCredits = credits.filter(c => c.studentId === s.id).reduce((sum, c) => sum + c.amount, 0);
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
  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream(filePath));
  doc.fontSize(16).text('Student Task Summary', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12);
  // Table header
  doc.text('Name\tTotal\tCompleted\tPending\tCredits');
  studentStats.forEach(s => {
    doc.text(`${s.name}\t${s.total}\t${s.completed}\t${s.pending}\t${s.credits}`);
  });
  doc.end();
}

module.exports = {
  getReportData,
  exportCSV,
  exportPDF,
};