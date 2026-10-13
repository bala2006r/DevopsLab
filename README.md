# AttendFlow - Modern Attendance Tracking & Analytics System

**AttendFlow** is a modern, responsive web application for tracking student and employee attendance. Built using vanilla HTML5, CSS3, and JavaScript with localStorage persistence, Web Audio tactile feedback, and comprehensive analytics.

---

## 🚀 Quick Start

To use the application:
1. Double-click [index.html](file:///d:/RPS/index.html) to open it in your web browser (Chrome, Edge, Firefox, Brave, Safari, etc.).
2. That's it! Everything works 100% locally and offline without requiring Node.js, Python, or external dependencies.

---

## ✨ Key Features

### 1. Attendance Marking & Fast Roll Calls
- **Tactile Status Selectors**: Mark **Present (P)**, **Absent (A)**, **Late (L)**, or **Excused (E)** with one click.
- **Bulk Actions**: One-click **All Present**, **All Absent**, and **Reset Day** buttons.
- **Daily Remarks**: Attach custom notes to any student on any date (e.g. medical leave, late bus, sports meet).
- **Dual View Modes**: Switch between **Card Grid View** and **Compact Table View** (optimized for rapid roll calls).

### 2. Real-Time Dashboard & Analytics
- **Live Summary Cards**: Real-time counts and percentages for Total Roster, Present, Absent, Late, and Excused.
- **Configurable Attendance Threshold**: Default **75%** minimum attendance rule with dynamic **⚠️ At-Risk** alert badges for defaulters.
- **Defaulters Warning Banner & Analytics Modal**: Comprehensive performance breakdown across the entire cohort.

### 3. Date Navigation & Calendar
- **Smooth Date Shifting**: Quick previous (`‹`) and next (`›`) day buttons, quick **Today** jump, and native calendar date picker.

### 4. Student Profiles & 30-Day Activity Heatmap
- Click any student card or table row to open their profile modal:
  - Cumulative attendance rate circle gauge.
  - Total days, present, absent, late, and excused counts.
  - Interactive **30-Day Activity Heatmap** showing color-coded daily presence.
  - Detailed chronological log of past dates and notes.
  - Edit or delete student options.

### 5. Multi-Class / Cohort Management
- Manage multiple classes or departments (e.g., *Computer Science CS-101*, *Data Structures DS-204*, *Artificial Intelligence AI-302*).
- Create custom cohorts and delete cohorts with automatic roster isolation.

### 6. Data Reporting & Backup
- **Export Today's Sheet (CSV)**: Generates a CSV file of the active date.
- **Export Full Monthly Matrix (CSV)**: Downloads a grid of every student with all recorded dates and overall percentages.
- **Export Defaulters (CSV)**: One-click export of all students below the minimum threshold.
- **Backup & Restore (JSON)**: Full database export and upload to preserve records across devices.
- **Print / PDF**: Specially designed `@media print` styles for clean paper reports.

### 7. Rich UI / UX & Synthesizer Audio
- **Dark & Light Mode**: Sleek modern dark glassmorphism theme with instant toggle and persistence.
- **Tactile Audio Feedback**: Pure Web Audio API synthesized chimes and clicks on status toggles (can be toggled in Settings).
- **Keyboard Shortcuts**:
  - `P` : Mark all present
  - `/` : Jump focus to search input
  - `←` / `→` : Navigate dates

---

## 📁 File Structure

- [index.html](file:///d:/RPS/index.html) - Semantic HTML5 interface, navigation, modal dialogs, and metrics.
- [style.css](file:///d:/RPS/style.css) - Modern CSS design system, glassmorphism, responsive breakpoints, and print styles.
- [app.js](file:///d:/RPS/app.js) - Application logic, state management, audio synth, CSV generator, and analytics.
