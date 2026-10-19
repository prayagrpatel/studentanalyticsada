 (function () {
    'use strict';

    /* ============ STATE ============ */
    const STORAGE_KEY = 'spa_students_v1';
    let students = [];

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        students = stored ? JSON.parse(stored) : [];
        if (!Array.isArray(students)) students = [];
    } catch (err) {
        students = [];
    }

    function saveData() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
        } catch (err) {
            console.warn('localStorage unavailable - data will not persist.');
        }
    }

    /* ============ HELPERS ============ */
    function $(id) {
        return document.getElementById(id);
    }

    function calcAverage(list) {
        if (!list.length) return 0;
        const sum = list.reduce((acc, s) => acc + s.cgpa, 0);
        return sum / list.length;
    }

    function calcMedian(list) {
        if (!list.length) return 0;
        const sorted = [...list].sort((a, b) => a.cgpa - b.cgpa);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 === 0
            ? (sorted[mid - 1].cgpa + sorted[mid].cgpa) / 2
            : sorted[mid].cgpa;
    }

    function findTopPerformer(list) {
        if (!list.length) return null;
        let top = list[0];
        for (let i = 1; i < list.length; i++) {
            if (list[i].cgpa > top.cgpa) top = list[i];
        }
        return top;
    }

    function escapeCsv(value) {
        return '"' + String(value == null ? '' : value).replace(/"/g, '""') + '"';
    }

    /* ============ NAVIGATION ============ */
    function showSection(id) {
        document.querySelectorAll('main section').forEach(s => s.classList.remove('active'));
        const target = $(id);
        if (target) target.classList.add('active');

        if (id === 'analysis') {
            drawGradeDistribution();
            drawSemesterComparison();
        }
    }

    /* ============ STATS ============ */
    function updateStats() {
        $('totalStudents').textContent = students.length;
        $('avgGPA').textContent = calcAverage(students).toFixed(2);
        $('medianGPA').textContent = calcMedian(students).toFixed(2);

        const top = findTopPerformer(students);
        $('topPerformer').textContent = top ? `${top.name} (${top.cgpa.toFixed(2)})` : '—';
    }

    /* ============ TABLE RENDER ============ */
    function renderStudentTable(list) {
        const tbody = $('studentList');
        tbody.innerHTML = '';

        if (!list.length) {
            const emptyRow = document.createElement('tr');
            const emptyCell = document.createElement('td');
            emptyCell.colSpan = 5;
            emptyCell.className = 'empty';
            emptyCell.textContent = 'No student records yet. Add one or click "Load Sample Data".';
            emptyRow.appendChild(emptyCell);
            tbody.appendChild(emptyRow);
            return;
        }

        list.forEach(s => {
            const tr = document.createElement('tr');

            [s.name, s.rollNo, s.semester, s.cgpa.toFixed(2)].forEach(val => {
                const td = document.createElement('td');
                td.textContent = val;
                tr.appendChild(td);
            });

            const actionCell = document.createElement('td');
            const btn = document.createElement('button');
            btn.className = 'action-btn';
            btn.textContent = 'Delete';
            btn.addEventListener('click', () => deleteStudent(s.id));
            actionCell.appendChild(btn);
            tr.appendChild(actionCell);

            tbody.appendChild(tr);
        });
    }

    function applyFilterAndRender() {
        const value = $('semesterFilter').value;
        const list = value === 'all'
            ? students
            : students.filter(s => s.semester === parseInt(value, 10));
        renderStudentTable(list);
    }

    /* ============ ACTIONS ============ */
    function deleteStudent(id) {
        if (!window.confirm('Delete this student record?')) return;
        students = students.filter(s => s.id !== id);
        saveData();
        refreshAll();
    }

    function validateStudent(s) {
        if (s.name.length < 3) {
            alert('Name must be at least 3 characters.');
            return false;
        }
        if (!s.rollNo) {
            alert('Roll number is required.');
            return false;
        }
        if (!(s.semester >= 1 && s.semester <= 8)) {
            alert('Semester must be between 1 and 8.');
            return false;
        }
        if (isNaN(s.cgpa) || s.cgpa < 0 || s.cgpa > 10) {
            alert('CGPA must be between 0 and 10.');
            return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.email)) {
            alert('Enter a valid email address.');
            return false;
        }
        return true;
    }

    function addStudentHandler(e) {
        e.preventDefault();

        const student = {
            id: Date.now(),
            name: $('name').value.trim(),
            rollNo: $('rollNo').value.trim(),
            semester: parseInt($('semester').value, 10),
            cgpa: parseFloat($('cgpa').value),
            email: $('email').value.trim()
        };

        if (!validateStudent(student)) return;

        students.push(student);
        saveData();
        $('studentForm').reset();
        refreshAll();
        showSection('dashboard');
    }

    function loadSampleData() {
        if (students.length && !window.confirm('Replace current data with sample data?')) return;

        const samples = [
            { name: 'Aarav Patel', rollNo: '21CE001', semester: 5, cgpa: 9.12, email: 'aarav@example.com' },
            { name: 'Diya Shah', rollNo: '21CE002', semester: 5, cgpa: 8.45, email: 'diya@example.com' },
            { name: 'Rohan Mehta', rollNo: '21CE003', semester: 5, cgpa: 6.80, email: 'rohan@example.com' },
            { name: 'Isha Desai', rollNo: '22CE014', semester: 3, cgpa: 9.65, email: 'isha@example.com' },
            { name: 'Kabir Joshi', rollNo: '22CE015', semester: 3, cgpa: 7.20, email: 'kabir@example.com' },
            { name: 'Meera Trivedi', rollNo: '20CE009', semester: 7, cgpa: 4.85, email: 'meera@example.com' },
            { name: 'Yash Chauhan', rollNo: '21CE021', semester: 5, cgpa: 5.95, email: 'yash@example.com' },
            { name: 'Nisha Rao', rollNo: '22CE030', semester: 3, cgpa: 8.05, email: 'nisha@example.com' }
        ];

        const base = Date.now();
        students = samples.map((s, i) => ({ ...s, id: base + i }));

        saveData();
        refreshAll();
    }

    function clearAll() {
        if (!students.length) {
            alert('Nothing to clear.');
            return;
        }
        if (!window.confirm('Delete ALL student records permanently?')) return;
        students = [];
        saveData();
        refreshAll();
    }

    function exportCSV() {
        if (!students.length) {
            alert('No data to export.');
            return;
        }

        const lines = ['Name,Roll No,Semester,CGPA,Email'];
        students.forEach(s => {
            lines.push([s.name, s.rollNo, s.semester, s.cgpa, s.email].map(escapeCsv).join(','));
        });

        const blob = new Blob(['\ufeff' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'student_records.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 800);
    }

    /* ============ SORTING ============ */
    function sortAlphabetically() {
        const sorted = [...students].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
        renderStudentTable(sorted);
    }

    function sortByGPA() {
        const sorted = [...students].sort((a, b) => b.cgpa - a.cgpa);
        renderStudentTable(sorted);
    }

    /* ============ CHART ENGINE ============ */
    function fitCanvas(canvas) {
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const w = Math.max(rect.width, 260);
        const h = Math.max(rect.height, 210);

        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);

        const ctx = canvas.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        return { ctx, w, h };
    }

    function drawGrid(ctx, padL, padT, plotW, plotH, maxVal, ticks, suffix) {
        ctx.strokeStyle = '#eceef5';
        ctx.lineWidth = 1;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#98a0b3';
        ctx.font = '12px Segoe UI, Arial, sans-serif';

        for (let i = 0; i <= ticks; i++) {
            const y = padT + plotH - (plotH * i / ticks);
            ctx.beginPath();
            ctx.moveTo(padL, y);
            ctx.lineTo(padL + plotW, y);
            ctx.stroke();
            ctx.fillText((maxVal * i / ticks).toFixed(suffix === 'cgpa' ? 1 : 0), padL - 8, y);
        }
    }

    function drawAxes(ctx, padL, padT, plotW, plotH) {
        ctx.strokeStyle = '#c9cddb';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(padL, padT);
        ctx.lineTo(padL, padT + plotH);
        ctx.lineTo(padL + plotW, padT + plotH);
        ctx.stroke();
    }

    function drawGradeDistribution() {
        const canvas = $('gradeChart');
        if (!canvas) return;

        const fit = fitCanvas(canvas);
        const { ctx, w, h } = fit;
        ctx.clearRect(0, 0, w, h);

        const buckets = [
            { label: '9 - 10', count: 0, color: '#2ecc71' },
            { label: '7 - 9', count: 0, color: '#3498db' },
            { label: '5 - 7', count: 0, color: '#f1c40f' },
            { label: 'Below 5', count: 0, color: '#e74c3c' }
        ];

        students.forEach(s => {
            if (s.cgpa >= 9) buckets[0].count++;
            else if (s.cgpa >= 7) buckets[1].count++;
            else if (s.cgpa >= 5) buckets[2].count++;
            else buckets[3].count++;
        });

        const padL = 42, padR = 14, padT = 22, padB = 52;
        const plotW = w - padL - padR;
        const plotH = h - padT - padB;

        let maxCount = 1;
        buckets.forEach(b => { if (b.count > maxCount) maxCount = b.count; });

        drawGrid(ctx, padL, padT, plotW, plotH, maxCount, 4, 'count');

        const slot = plotW / buckets.length;
        const barW = Math.min(slot * 0.55, 72);

        buckets.forEach((b, i) => {
            const x = padL + slot * i + (slot - barW) / 2;
            const barH = (b.count / maxCount) * plotH;
            const y = padT + plotH - barH;

            ctx.fillStyle = b.color;
            ctx.fillRect(x, y, barW, barH);

            ctx.fillStyle = '#39405a';
            ctx.font = 'bold 13px Segoe UI, Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(String(b.count), x + barW / 2, y - 5);

            ctx.fillStyle = '#5a6070';
            ctx.font = '12px Segoe UI, Arial, sans-serif';
            ctx.textBaseline = 'top';
            ctx.fillText(b.label, x + barW / 2, padT + plotH + 9);
        });

        drawAxes(ctx, padL, padT, plotW, plotH);

        ctx.fillStyle = '#98a0b3';
        ctx.font = '12px Segoe UI, Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText('Students', 6, 13);
        ctx.textAlign = 'center';
        ctx.fillText('CGPA Range', padL + plotW / 2, h - 6);
    }

    function drawSemesterComparison() {
        const canvas = $('semesterChart');
        if (!canvas) return;

        const fit = fitCanvas(canvas);
        const { ctx, w, h } = fit;
        ctx.clearRect(0, 0, w, h);

        const averages = [];
        for (let sem = 1; sem <= 8; sem++) {
            const group = students.filter(s => s.semester === sem);
            averages.push(group.length ? calcAverage(group) : null);
        }

        const padL = 42, padR = 16, padT = 22, padB = 38;
        const plotW = w - padL - padR;
        const plotH = h - padT - padB;
        const maxY = 10;

        drawGrid(ctx, padL, padT, plotW, plotH, maxY, 5, 'cgpa');
        drawAxes(ctx, padL, padT, plotW, plotH);

        const step = plotW / 7;

        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 2.5;
        ctx.lineJoin = 'round';
        ctx.beginPath();

        let drawing = false;
        averages.forEach((value, i) => {
            if (value === null) {
                drawing = false;
                return;
            }
            const x = padL + step * i;
            const y = padT + plotH - (value / maxY) * plotH;
            if (!drawing) {
                ctx.moveTo(x, y);
                drawing = true;
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();

        averages.forEach((value, i) => {
            const x = padL + step * i;

            if (value !== null) {
                const y = padT + plotH - (value / maxY) * plotH;
                ctx.beginPath();
                ctx.arc(x, y, 4.5, 0, Math.PI * 2);
                ctx.fillStyle = '#fff';
                ctx.fill();
                ctx.lineWidth = 2.5;
                ctx.strokeStyle = '#667eea';
                ctx.stroke();

                ctx.fillStyle = '#39405a';
                ctx.font = 'bold 11px Segoe UI, Arial, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                ctx.fillText(value.toFixed(1), x, y - 9);
            }

            ctx.fillStyle = '#5a6070';
            ctx.font = '12px Segoe UI, Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText('S' + (i + 1), x, padT + plotH + 9);
        });

        ctx.fillStyle = '#98a0b3';
        ctx.font = '12px Segoe UI, Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText('Avg CGPA', 4, 13);
    }

    /* ============ INSIGHTS ============ */
    function generateInsights() {
        const list = $('insightList');
        list.innerHTML = '';

        if (!students.length) {
            const li = document.createElement('li');
            li.textContent = 'No data available yet. Add student records to generate insights.';
            list.appendChild(li);
            return;
        }

        const messages = [];
        const avg = calcAverage(students);
        const median = calcMedian(students);
        const top = findTopPerformer(students);

        if (avg >= 8) {
            messages.push('Overall performance is strong — average CGPA is ' + avg.toFixed(2) + '.');
        } else if (avg >= 6) {
            messages.push('Moderate overall performance — average CGPA is ' + avg.toFixed(2) + ', with room to improve.');
        } else {
            messages.push('Average CGPA of ' + avg.toFixed(2) + ' indicates a need for academic support measures.');
        }

        if (median < avg) {
            messages.push('The mean sits above the median, meaning a few high scorers are lifting the average.');
        } else if (median > avg) {
            messages.push('The median exceeds the mean, suggesting a cluster of lower scores is dragging the average down.');
        } else {
            messages.push('Mean and median are equal — the score distribution is fairly symmetric.');
        }

        if (top) {
            messages.push('Top performer: ' + top.name + ' (Roll ' + top.rollNo + ') with a CGPA of ' + top.cgpa.toFixed(2) + '.');
        }

        const atRisk = students.filter(s => s.cgpa < 5);
        messages.push(atRisk.length
            ? atRisk.length + ' student(s) fall below a 5.0 CGPA and may need remedial attention.'
            : 'No student is currently below the 5.0 CGPA threshold.');

        const counts = {};
        students.forEach(s => { counts[s.semester] = (counts[s.semester] || 0) + 1; });

        let busiest = null;
        Object.keys(counts).forEach(key => {
            if (!busiest || counts[key] > counts[busiest]) busiest = key;
        });
        if (busiest) {
            messages.push('Semester ' + busiest + ' has the largest cohort with ' + counts[busiest] + ' student(s).');
        }

        messages.forEach(text => {
            const li = document.createElement('li');
            li.textContent = text;
            list.appendChild(li);
        });
    }

    /* ============ REFRESH ============ */
    function refreshAll() {
        updateStats();
        applyFilterAndRender();
        generateInsights();

        if ($('analysis').classList.contains('active')) {
            drawGradeDistribution();
            drawSemesterComparison();
        }
    }

    /* ============ RESIZE (debounced) ============ */
    let resizeTimer = null;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if ($('analysis').classList.contains('active')) {
                drawGradeDistribution();
                drawSemesterComparison();
            }
        }, 160);
    });

    /* ============ INIT ============ */
    function init() {
        document.querySelectorAll('nav button').forEach(btn => {
            btn.addEventListener('click', () => showSection(btn.dataset.section));
        });

        $('studentForm').addEventListener('submit', addStudentHandler);
        $('semesterFilter').addEventListener('change', applyFilterAndRender);
        $('sortNameBtn').addEventListener('click', sortAlphabetically);
        $('sortGpaBtn').addEventListener('click', sortByGPA);
        $('sampleBtn').addEventListener('click', loadSampleData);
        $('csvBtn').addEventListener('click', exportCSV);
        $('clearBtn').addEventListener('click', clearAll);

        refreshAll();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();