/**
 * AttendFlow - Modern Attendance Tracking & Analytics Engine
 * Pure Vanilla JavaScript (ES6+) with localStorage persistence,
 * Web Audio synthesizer feedback, CSV generation, and real-time statistics.
 */

// ==========================================================================
// 1. Audio Synthesizer (Zero External Dependencies)
// ==========================================================================
class SoundFX {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
  }

  playTone(freq, type = 'sine', duration = 0.1, gainVal = 0.15) {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      // Audio autoplay policy fallback
    }
  }

  click(type) {
    if (!this.enabled) return;
    switch (type) {
      case 'present':
        this.playTone(587.33, 'triangle', 0.12, 0.15); // D5
        setTimeout(() => this.playTone(880, 'sine', 0.15, 0.12), 60); // A5
        break;
      case 'absent':
        this.playTone(330, 'sawtooth', 0.15, 0.1); // E4
        break;
      case 'late':
        this.playTone(493.88, 'sine', 0.12, 0.12); // B4
        break;
      case 'excused':
        this.playTone(659.25, 'sine', 0.14, 0.12); // E5
        break;
      case 'success':
        // Celebratory arpeggio
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
          setTimeout(() => this.playTone(freq, 'sine', 0.18, 0.12), idx * 70);
        });
        break;
      case 'pop':
      default:
        this.playTone(440, 'triangle', 0.08, 0.08);
        break;
    }
  }
}

const sound = new SoundFX();

// ==========================================================================
// 2. State & Initial Data Management
// ==========================================================================
const STORAGE_KEYS = {
  CLASSES: 'attendflow_classes',
  ACTIVE_CLASS: 'attendflow_active_class',
  STUDENTS: 'attendflow_students',
  SETTINGS: 'attendflow_settings',
  THEME: 'attendflow_theme'
};

const DEFAULT_SETTINGS = {
  threshold: 75,
  soundEffects: true,
  lateHalfDay: false,
  viewMode: 'grid',
  activeFilter: 'all',
  sortBy: 'roll-asc'
};

const DEFAULT_CLASSES = [
  { id: 'cs101', name: 'Computer Science (CS-101)', description: 'Semester 4, Batch A' },
  { id: 'ds204', name: 'Data Structures (DS-204)', description: 'Morning Cohort' },
  { id: 'ai302', name: 'Artificial Intelligence (AI-302)', description: 'Senior Lab' }
];

/**
 * Generate 30 days of realistic past sample records
 */
function generateSampleStudents(classId = 'cs101') {
  const names = [
    { name: 'Alexander Wright', roll: '101', email: 'a.wright@univ.edu', tag: 'Honors', color: 'blue', reliability: 0.95 },
    { name: 'Sophia Chen', roll: '102', email: 's.chen@univ.edu', tag: 'Section A', color: 'indigo', reliability: 0.92 },
    { name: 'Liam Martinez', roll: '103', email: 'l.martinez@univ.edu', tag: 'Section A', color: 'emerald', reliability: 0.88 },
    { name: 'Emma Watson', roll: '104', email: 'e.watson@univ.edu', tag: 'Honors', color: 'purple', reliability: 0.98 },
    { name: 'Marcus Johnson', roll: '105', email: 'm.johnson@univ.edu', tag: 'Section B', color: 'amber', reliability: 0.68 }, // Defaulter (<75%)
    { name: 'Olivia Taylor', roll: '106', email: 'o.taylor@univ.edu', tag: 'Section B', color: 'rose', reliability: 0.82 },
    { name: 'Ethan Davis', roll: '107', email: 'e.davis@univ.edu', tag: 'Section A', color: 'cyan', reliability: 0.62 }, // Defaulter (<75%)
    { name: 'Ava Patel', roll: '108', email: 'a.patel@univ.edu', tag: 'Honors', color: 'blue', reliability: 0.96 },
    { name: 'Noah Miller', roll: '109', email: 'n.miller@univ.edu', tag: 'Section B', color: 'indigo', reliability: 0.85 },
    { name: 'Isabella Wilson', roll: '110', email: 'i.wilson@univ.edu', tag: 'Section A', color: 'emerald', reliability: 0.76 },
    { name: 'Lucas Garcia', roll: '111', email: 'l.garcia@univ.edu', tag: 'Sports Quota', color: 'amber', reliability: 0.70 }, // Defaulter (<75%)
    { name: 'Mia Robinson', roll: '112', email: 'm.robinson@univ.edu', tag: 'Honors', color: 'purple', reliability: 0.94 }
  ];

  const today = new Date();
  const students = [];

  names.forEach((item, index) => {
    const student = {
      id: `std_${classId}_${item.roll}`,
      classId: classId,
      name: item.name,
      roll: item.roll,
      email: item.email,
      tag: item.tag,
      avatarColor: item.color,
      attendance: {}
    };

    // Pre-populate last 28 days of attendance
    for (let i = 28; i >= 1; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      // Skip Sundays (day 0)
      if (d.getDay() === 0) continue;

      const dateStr = formatDateToISO(d);
      const rand = Math.random();

      if (rand < item.reliability) {
        student.attendance[dateStr] = { status: 'present', note: '', timestamp: d.getTime() };
      } else if (rand < item.reliability + 0.08) {
        student.attendance[dateStr] = { status: 'late', note: 'Traffic delay', timestamp: d.getTime() };
      } else if (rand < item.reliability + 0.12) {
        student.attendance[dateStr] = { status: 'excused', note: 'Medical note submitted', timestamp: d.getTime() };
      } else {
        student.attendance[dateStr] = { status: 'absent', note: '', timestamp: d.getTime() };
      }
    }

    students.push(student);
  });

  return students;
}

// Helpers for Date Formatting
function formatDateToISO(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseISODate(isoStr) {
  const parts = isoStr.split('-');
  return new Date(parts[0], parseInt(parts[1], 10) - 1, parts[2]);
}

function formatDisplayDate(isoStr) {
  const d = parseISODate(isoStr);
  const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
  return d.toLocaleDateString('en-US', options);
}

// ==========================================================================
// 3. Application Main Controller
// ==========================================================================
class AttendanceApp {
  constructor() {
    this.classes = [];
    this.activeClassId = 'cs101';
    this.students = [];
    this.currentDate = formatDateToISO(new Date());
    this.settings = { ...DEFAULT_SETTINGS };
    this.searchQuery = '';
    this.activeFilter = 'all';
    this.activeSort = 'roll-asc';
    this.viewMode = 'grid';

    // DOM references
    this.dom = {};
  }

  init() {
    this.cacheDOM();
    this.loadState();
    this.initTheme();
    this.bindEvents();
    this.renderClassDropdown();
    this.updateDateUI();
    this.render();
  }

  cacheDOM() {
    this.dom = {
      // Navbar & Navigation
      classSelect: document.getElementById('classSelect'),
      manageClassesBtn: document.getElementById('manageClassesBtn'),
      prevDateBtn: document.getElementById('prevDateBtn'),
      nextDateBtn: document.getElementById('nextDateBtn'),
      dateDisplayBtn: document.getElementById('dateDisplayBtn'),
      datePicker: document.getElementById('datePicker'),
      currentDateFormatted: document.getElementById('currentDateFormatted'),
      isTodayTag: document.getElementById('isTodayTag'),
      jumpTodayBtn: document.getElementById('jumpTodayBtn'),
      analyticsViewBtn: document.getElementById('analyticsViewBtn'),
      exportMenuBtn: document.getElementById('exportMenuBtn'),
      exportDropdownMenu: document.getElementById('exportDropdownMenu'),
      exportTodayCsvBtn: document.getElementById('exportTodayCsvBtn'),
      exportFullHistoryCsvBtn: document.getElementById('exportFullHistoryCsvBtn'),
      printReportBtn: document.getElementById('printReportBtn'),
      backupDataBtn: document.getElementById('backupDataBtn'),
      restoreDataTriggerBtn: document.getElementById('restoreDataTriggerBtn'),
      restoreDataInput: document.getElementById('restoreDataInput'),
      themeToggleBtn: document.getElementById('themeToggleBtn'),
      settingsBtn: document.getElementById('settingsBtn'),

      // Metrics
      statTotalStudents: document.getElementById('statTotalStudents'),
      statAttendanceStatusSummary: document.getElementById('statAttendanceStatusSummary'),
      statPresentCount: document.getElementById('statPresentCount'),
      statPresentPercent: document.getElementById('statPresentPercent'),
      statPresentBar: document.getElementById('statPresentBar'),
      statAbsentCount: document.getElementById('statAbsentCount'),
      statAbsentPercent: document.getElementById('statAbsentPercent'),
      statAbsentBar: document.getElementById('statAbsentBar'),
      statLateCount: document.getElementById('statLateCount'),
      statLatePercent: document.getElementById('statLatePercent'),
      statLateBar: document.getElementById('statLateBar'),
      statExcusedCount: document.getElementById('statExcusedCount'),
      statExcusedPercent: document.getElementById('statExcusedPercent'),
      statExcusedBar: document.getElementById('statExcusedBar'),

      // Toolbar
      markAllPresentBtn: document.getElementById('markAllPresentBtn'),
      markAllAbsentBtn: document.getElementById('markAllAbsentBtn'),
      clearTodayBtn: document.getElementById('clearTodayBtn'),
      searchInput: document.getElementById('searchInput'),
      clearSearchBtn: document.getElementById('clearSearchBtn'),
      filterPillsContainer: document.getElementById('filterPillsContainer'),
      filterCountAll: document.getElementById('filterCountAll'),
      filterCountPresent: document.getElementById('filterCountPresent'),
      filterCountAbsent: document.getElementById('filterCountAbsent'),
      filterCountLate: document.getElementById('filterCountLate'),
      filterCountExcused: document.getElementById('filterCountExcused'),
      filterCountRisk: document.getElementById('filterCountRisk'),
      sortBySelect: document.getElementById('sortBySelect'),
      viewGridBtn: document.getElementById('viewGridBtn'),
      viewTableBtn: document.getElementById('viewTableBtn'),
      addStudentModalBtn: document.getElementById('addStudentModalBtn'),
      shortcutsBar: document.getElementById('shortcutsBar'),
      dismissShortcutsBtn: document.getElementById('dismissShortcutsBtn'),

      // Rosters & Empty states
      studentGrid: document.getElementById('studentGrid'),
      studentTableView: document.getElementById('studentTableView'),
      studentTableBody: document.getElementById('studentTableBody'),
      emptyState: document.getElementById('emptyState'),
      emptyStateTitle: document.getElementById('emptyStateTitle'),
      emptyStateDesc: document.getElementById('emptyStateDesc'),
      emptyStateActionBtn: document.getElementById('emptyStateActionBtn'),

      // Modals
      studentModal: document.getElementById('studentModal'),
      studentForm: document.getElementById('studentForm'),
      studentFormId: document.getElementById('studentFormId'),
      studentModalTitle: document.getElementById('studentModalTitle'),
      studentNameInput: document.getElementById('studentNameInput'),
      studentRollInput: document.getElementById('studentRollInput'),
      studentEmailInput: document.getElementById('studentEmailInput'),
      studentTagInput: document.getElementById('studentTagInput'),
      studentAvatarColor: document.getElementById('studentAvatarColor'),
      avatarColorPalette: document.getElementById('avatarColorPalette'),

      profileModal: document.getElementById('profileModal'),
      profileAvatar: document.getElementById('profileAvatar'),
      profileName: document.getElementById('profileName'),
      profileMeta: document.getElementById('profileMeta'),
      profileRateVal: document.getElementById('profileRateVal'),
      profileStatusBadge: document.getElementById('profileStatusBadge'),
      pStatTotal: document.getElementById('pStatTotal'),
      pStatPresent: document.getElementById('pStatPresent'),
      pStatAbsent: document.getElementById('pStatAbsent'),
      pStatLate: document.getElementById('pStatLate'),
      pStatExcused: document.getElementById('pStatExcused'),
      profileHeatmap: document.getElementById('profileHeatmap'),
      profileHistoryTableBody: document.getElementById('profileHistoryTableBody'),
      deleteStudentBtn: document.getElementById('deleteStudentBtn'),
      editProfileBtn: document.getElementById('editProfileBtn'),

      remarksModal: document.getElementById('remarksModal'),
      remarksStudentId: document.getElementById('remarksStudentId'),
      remarksStudentInfo: document.getElementById('remarksStudentInfo'),
      remarksDateFormatted: document.getElementById('remarksDateFormatted'),
      remarksTextarea: document.getElementById('remarksTextarea'),
      clearRemarkBtn: document.getElementById('clearRemarkBtn'),
      saveRemarkBtn: document.getElementById('saveRemarkBtn'),

      manageClassesModal: document.getElementById('manageClassesModal'),
      newClassNameInput: document.getElementById('newClassNameInput'),
      addNewClassBtn: document.getElementById('addNewClassBtn'),
      classListContainer: document.getElementById('classListContainer'),

      analyticsModal: document.getElementById('analyticsModal'),
      analyticsSubtitle: document.getElementById('analyticsSubtitle'),
      analyticsAvgRate: document.getElementById('analyticsAvgRate'),
      analyticsHighCount: document.getElementById('analyticsHighCount'),
      analyticsMidCount: document.getElementById('analyticsMidCount'),
      analyticsDefaultersCount: document.getElementById('analyticsDefaultersCount'),
      analyticsWarningBanner: document.getElementById('analyticsWarningBanner'),
      exportDefaultersCsvBtn: document.getElementById('exportDefaultersCsvBtn'),
      analyticsTableBody: document.getElementById('analyticsTableBody'),

      settingsModal: document.getElementById('settingsModal'),
      thresholdInput: document.getElementById('thresholdInput'),
      soundEffectsToggle: document.getElementById('soundEffectsToggle'),
      lateHalfDayToggle: document.getElementById('lateHalfDayToggle'),
      resetSampleDataBtn: document.getElementById('resetSampleDataBtn'),

      // Footer
      footerClassStats: document.getElementById('footerClassStats'),
      attendanceRequirementBadge: document.getElementById('attendanceRequirementBadge'),
      toastContainer: document.getElementById('toastContainer'),
      printReportContainer: document.getElementById('printReportContainer')
    };
  }

  // ------------------------------------------------------------------------
  // State Persistence
  // ------------------------------------------------------------------------
  loadState() {
    try {
      const storedClasses = localStorage.getItem(STORAGE_KEYS.CLASSES);
      this.classes = storedClasses ? JSON.parse(storedClasses) : DEFAULT_CLASSES;

      const storedActiveClass = localStorage.getItem(STORAGE_KEYS.ACTIVE_CLASS);
      this.activeClassId = storedActiveClass || this.classes[0]?.id || 'cs101';

      const storedStudents = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      if (storedStudents) {
        this.students = JSON.parse(storedStudents);
      } else {
        // Seed initial sample data across classes
        this.students = [
          ...generateSampleStudents('cs101'),
          ...generateSampleStudents('ds204').slice(0, 8),
          ...generateSampleStudents('ai302').slice(0, 10)
        ];
        this.saveStudents();
      }

      const storedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (storedSettings) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(storedSettings) };
      }

      this.viewMode = this.settings.viewMode || 'grid';
      this.activeFilter = this.settings.activeFilter || 'all';
      this.activeSort = this.settings.sortBy || 'roll-asc';
      sound.enabled = this.settings.soundEffects !== false;

      // Update settings controls
      this.dom.thresholdInput.value = this.settings.threshold;
      this.dom.soundEffectsToggle.checked = this.settings.soundEffects;
      this.dom.lateHalfDayToggle.checked = this.settings.lateHalfDay;
      this.dom.attendanceRequirementBadge.textContent = `Required Target: ${this.settings.threshold}%`;

      if (this.dom.sortBySelect) this.dom.sortBySelect.value = this.activeSort;
    } catch (e) {
      console.error('Failed to load local storage state:', e);
      this.classes = DEFAULT_CLASSES;
      this.students = generateSampleStudents('cs101');
    }
  }

  saveClasses() {
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(this.classes));
  }

  saveStudents() {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(this.students));
  }

  saveSettings() {
    this.settings.threshold = parseInt(this.dom.thresholdInput.value, 10) || 75;
    this.settings.soundEffects = this.dom.soundEffectsToggle.checked;
    this.settings.lateHalfDay = this.dom.lateHalfDayToggle.checked;
    this.settings.viewMode = this.viewMode;
    this.settings.activeFilter = this.activeFilter;
    this.settings.sortBy = this.activeSort;

    sound.enabled = this.settings.soundEffects;
    this.dom.attendanceRequirementBadge.textContent = `Required Target: ${this.settings.threshold}%`;

    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));
  }

  initTheme() {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem(STORAGE_KEYS.THEME, next);
    sound.click('pop');
    this.showToast(`Switched to ${next === 'dark' ? 'Dark' : 'Light'} Mode`, 'info');
  }

  // ------------------------------------------------------------------------
  // Event Binding
  // ------------------------------------------------------------------------
  bindEvents() {
    // Theme toggle
    this.dom.themeToggleBtn.addEventListener('click', () => this.toggleTheme());

    // Settings
    this.dom.settingsBtn.addEventListener('click', () => this.openModal(this.dom.settingsModal));
    this.dom.thresholdInput.addEventListener('change', () => {
      this.saveSettings();
      this.render();
    });
    this.dom.soundEffectsToggle.addEventListener('change', () => this.saveSettings());
    this.dom.lateHalfDayToggle.addEventListener('change', () => {
      this.saveSettings();
      this.render();
    });
    this.dom.resetSampleDataBtn.addEventListener('click', () => {
      if (confirm('Load sample students and realistic 30-day attendance history? Current data will be replaced.')) {
        this.students = [
          ...generateSampleStudents('cs101'),
          ...generateSampleStudents('ds204').slice(0, 8),
          ...generateSampleStudents('ai302').slice(0, 10)
        ];
        this.saveStudents();
        this.closeModal(this.dom.settingsModal);
        this.render();
        sound.click('success');
        this.showToast('Sample dataset successfully loaded!', 'success');
      }
    });

    // Class selection
    this.dom.classSelect.addEventListener('change', (e) => {
      this.activeClassId = e.target.value;
      localStorage.setItem(STORAGE_KEYS.ACTIVE_CLASS, this.activeClassId);
      sound.click('pop');
      this.render();
    });

    this.dom.manageClassesBtn.addEventListener('click', () => {
      this.renderClassManagerList();
      this.openModal(this.dom.manageClassesModal);
    });

    this.dom.addNewClassBtn.addEventListener('click', () => this.handleCreateClass());
    this.dom.newClassNameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.handleCreateClass();
    });

    // Date Navigation
    this.dom.prevDateBtn.addEventListener('click', () => this.shiftDate(-1));
    this.dom.nextDateBtn.addEventListener('click', () => this.shiftDate(1));
    this.dom.jumpTodayBtn.addEventListener('click', () => {
      this.currentDate = formatDateToISO(new Date());
      this.updateDateUI();
      sound.click('pop');
      this.render();
    });

    this.dom.dateDisplayBtn.addEventListener('click', () => {
      this.dom.datePicker.showPicker ? this.dom.datePicker.showPicker() : this.dom.datePicker.focus();
    });

    this.dom.datePicker.addEventListener('change', (e) => {
      if (e.target.value) {
        this.currentDate = e.target.value;
        this.updateDateUI();
        sound.click('pop');
        this.render();
      }
    });

    // Bulk Attendance Actions
    this.dom.markAllPresentBtn.addEventListener('click', () => this.bulkMark('present'));
    this.dom.markAllAbsentBtn.addEventListener('click', () => this.bulkMark('absent'));
    this.dom.clearTodayBtn.addEventListener('click', () => this.bulkClear());

    // Search and Filters
    this.dom.searchInput.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.trim().toLowerCase();
      this.dom.clearSearchBtn.style.display = this.searchQuery ? 'block' : 'none';
      this.renderRoster();
    });

    this.dom.clearSearchBtn.addEventListener('click', () => {
      this.dom.searchInput.value = '';
      this.searchQuery = '';
      this.dom.clearSearchBtn.style.display = 'none';
      this.renderRoster();
    });

    this.dom.filterPillsContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-pill');
      if (!btn) return;
      this.dom.filterPillsContainer.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      this.activeFilter = btn.dataset.filter;
      sound.click('pop');
      this.renderRoster();
    });

    // Sorting
    this.dom.sortBySelect.addEventListener('change', (e) => {
      this.activeSort = e.target.value;
      sound.click('pop');
      this.renderRoster();
    });

    // View Switcher (Grid vs Table)
    this.dom.viewGridBtn.addEventListener('click', () => this.setViewMode('grid'));
    this.dom.viewTableBtn.addEventListener('click', () => this.setViewMode('table'));

    // Shortcuts banner dismissal
    this.dom.dismissShortcutsBtn.addEventListener('click', () => {
      this.dom.shortcutsBar.style.display = 'none';
    });

    // Add / Edit Student Modal Trigger
    this.dom.addStudentModalBtn.addEventListener('click', () => this.openStudentForm());
    this.dom.emptyStateActionBtn.addEventListener('click', () => this.openStudentForm());

    // Color Swatches in Form
    this.dom.avatarColorPalette.addEventListener('click', (e) => {
      const swatch = e.target.closest('.palette-swatch');
      if (!swatch) return;
      this.dom.avatarColorPalette.querySelectorAll('.palette-swatch').forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
      this.dom.studentAvatarColor.value = swatch.dataset.color;
    });

    // Save Student Form Submit
    this.dom.studentForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSaveStudent();
    });

    // Profile Modal Actions
    this.dom.deleteStudentBtn.addEventListener('click', () => {
      const studentId = this.dom.deleteStudentBtn.dataset.studentId;
      if (!studentId) return;
      const student = this.students.find(s => s.id === studentId);
      if (confirm(`Are you sure you want to delete ${student ? student.name : 'this student'}? This cannot be undone.`)) {
        this.students = this.students.filter(s => s.id !== studentId);
        this.saveStudents();
        this.closeModal(this.dom.profileModal);
        this.render();
        sound.click('absent');
        this.showToast('Student deleted successfully', 'info');
      }
    });

    this.dom.editProfileBtn.addEventListener('click', () => {
      const studentId = this.dom.deleteStudentBtn.dataset.studentId;
      const student = this.students.find(s => s.id === studentId);
      if (student) {
        this.closeModal(this.dom.profileModal);
        this.openStudentForm(student);
      }
    });

    // Remarks Modal Actions
    this.dom.saveRemarkBtn.addEventListener('click', () => this.handleSaveRemark());
    this.dom.clearRemarkBtn.addEventListener('click', () => {
      this.dom.remarksTextarea.value = '';
      this.handleSaveRemark();
    });

    // Analytics Modal Trigger
    this.dom.analyticsViewBtn.addEventListener('click', () => this.openAnalyticsModal());
    this.dom.exportDefaultersCsvBtn.addEventListener('click', () => this.exportDefaultersCsv());

    // Export Dropdown Trigger
    this.dom.exportMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.dom.exportMenuBtn.parentElement.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.dropdown-export-wrapper')) {
        document.querySelectorAll('.dropdown-export-wrapper').forEach(w => w.classList.remove('active'));
      }
    });

    // Export Actions
    this.dom.exportTodayCsvBtn.addEventListener('click', () => {
      this.exportTodayCsv();
      this.dom.exportMenuBtn.parentElement.classList.remove('active');
    });
    this.dom.exportFullHistoryCsvBtn.addEventListener('click', () => {
      this.exportFullHistoryCsv();
      this.dom.exportMenuBtn.parentElement.classList.remove('active');
    });
    this.dom.printReportBtn.addEventListener('click', () => {
      window.print();
      this.dom.exportMenuBtn.parentElement.classList.remove('active');
    });
    this.dom.backupDataBtn.addEventListener('click', () => {
      this.backupDataJson();
      this.dom.exportMenuBtn.parentElement.classList.remove('active');
    });
    this.dom.restoreDataTriggerBtn.addEventListener('click', () => {
      this.dom.restoreDataInput.click();
      this.dom.exportMenuBtn.parentElement.classList.remove('active');
    });
    this.dom.restoreDataInput.addEventListener('change', (e) => this.handleRestoreJson(e));

    // Global Modal Close Buttons (data-close-modal)
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modalId = e.currentTarget.getAttribute('data-close-modal');
        const modalEl = document.getElementById(modalId);
        if (modalEl) this.closeModal(modalEl);
      });
    });

    // Close modal on click background
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) this.closeModal(overlay);
      });
    });

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
      // Ignore if typing in input/textarea/modal
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      if (document.querySelector('.modal-overlay.active')) return;

      if (e.key === '/') {
        e.preventDefault();
        this.dom.searchInput.focus();
      } else if (e.key === 'ArrowLeft') {
        this.shiftDate(-1);
      } else if (e.key === 'ArrowRight') {
        this.shiftDate(1);
      } else if (e.key.toLowerCase() === 'p') {
        this.bulkMark('present');
      }
    });
  }

  // ------------------------------------------------------------------------
  // Date Handling
  // ------------------------------------------------------------------------
  shiftDate(deltaDays) {
    const curr = parseISODate(this.currentDate);
    curr.setDate(curr.getDate() + deltaDays);
    this.currentDate = formatDateToISO(curr);
    this.updateDateUI();
    sound.click('pop');
    this.render();
  }

  updateDateUI() {
    this.dom.datePicker.value = this.currentDate;
    this.dom.currentDateFormatted.textContent = formatDisplayDate(this.currentDate);

    const todayStr = formatDateToISO(new Date());
    if (this.currentDate === todayStr) {
      this.dom.isTodayTag.style.display = 'inline-block';
      this.dom.jumpTodayBtn.style.opacity = '0.5';
      this.dom.jumpTodayBtn.style.pointerEvents = 'none';
    } else {
      this.dom.isTodayTag.style.display = 'none';
      this.dom.jumpTodayBtn.style.opacity = '1';
      this.dom.jumpTodayBtn.style.pointerEvents = 'auto';
    }
  }

  // ------------------------------------------------------------------------
  // View Modes & Modals
  // ------------------------------------------------------------------------
  setViewMode(mode) {
    this.viewMode = mode;
    this.dom.viewGridBtn.classList.toggle('active', mode === 'grid');
    this.dom.viewTableBtn.classList.toggle('active', mode === 'table');
    this.saveSettings();
    sound.click('pop');
    this.renderRoster();
  }

  openModal(modalEl) {
    modalEl.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  closeModal(modalEl) {
    modalEl.classList.remove('active');
    document.body.style.overflow = '';
  }

  // ------------------------------------------------------------------------
  // Class Management
  // ------------------------------------------------------------------------
  renderClassDropdown() {
    this.dom.classSelect.innerHTML = this.classes.map(c => `
      <option value="${c.id}" ${c.id === this.activeClassId ? 'selected' : ''}>
        ${escapeHTML(c.name)}
      </option>
    `).join('');
  }

  renderClassManagerList() {
    this.dom.classListContainer.innerHTML = this.classes.map(c => {
      const count = this.students.filter(s => s.classId === c.id).length;
      return `
        <div class="class-item-row">
          <div>
            <span class="class-name-text">${escapeHTML(c.name)}</span>
            <span class="class-count-text">(${count} members)</span>
          </div>
          <div>
            ${this.classes.length > 1 ? `
              <button class="icon-btn-subtle text-rose" onclick="window.app.deleteClass('${c.id}')" title="Delete Cohort">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path></svg>
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  handleCreateClass() {
    const name = this.dom.newClassNameInput.value.trim();
    if (!name) return;

    const id = 'cls_' + Date.now().toString(36);
    this.classes.push({ id, name, description: '' });
    this.saveClasses();
    this.activeClassId = id;
    this.dom.newClassNameInput.value = '';
    this.renderClassDropdown();
    this.renderClassManagerList();
    this.render();
    sound.click('pop');
    this.showToast(`Cohort "${name}" created!`, 'success');
  }

  deleteClass(classId) {
    if (this.classes.length <= 1) {
      alert('You must have at least one active cohort.');
      return;
    }
    const c = this.classes.find(item => item.id === classId);
    if (confirm(`Delete cohort "${c ? c.name : classId}"? All member records in this cohort will be removed.`)) {
      this.classes = this.classes.filter(item => item.id !== classId);
      this.students = this.students.filter(item => item.classId !== classId);
      this.saveClasses();
      this.saveStudents();
      if (this.activeClassId === classId) {
        this.activeClassId = this.classes[0].id;
      }
      this.renderClassDropdown();
      this.renderClassManagerList();
      this.render();
      sound.click('absent');
      this.showToast('Cohort removed', 'info');
    }
  }

  // ------------------------------------------------------------------------
  // Student Enrollment & Editing
  // ------------------------------------------------------------------------
  openStudentForm(student = null) {
    if (student) {
      this.dom.studentModalTitle.textContent = 'Edit Member';
      this.dom.studentFormId.value = student.id;
      this.dom.studentNameInput.value = student.name;
      this.dom.studentRollInput.value = student.roll;
      this.dom.studentEmailInput.value = student.email || '';
      this.dom.studentTagInput.value = student.tag || '';
      this.dom.studentAvatarColor.value = student.avatarColor || 'blue';
    } else {
      this.dom.studentModalTitle.textContent = 'Add New Member';
      this.dom.studentFormId.value = '';
      this.dom.studentNameInput.value = '';
      // Propose next roll number
      const currentCohort = this.students.filter(s => s.classId === this.activeClassId);
      const nextRoll = currentCohort.length > 0 ? (Math.max(...currentCohort.map(s => parseInt(s.roll, 10) || 0)) + 1).toString() : '101';
      this.dom.studentRollInput.value = nextRoll;
      this.dom.studentEmailInput.value = '';
      this.dom.studentTagInput.value = 'General';
      this.dom.studentAvatarColor.value = 'blue';
    }

    // Set swatch selection
    const color = this.dom.studentAvatarColor.value;
    this.dom.avatarColorPalette.querySelectorAll('.palette-swatch').forEach(s => {
      s.classList.toggle('active', s.dataset.color === color);
    });

    this.openModal(this.dom.studentModal);
    this.dom.studentNameInput.focus();
  }

  handleSaveStudent() {
    const id = this.dom.studentFormId.value;
    const name = this.dom.studentNameInput.value.trim();
    const roll = this.dom.studentRollInput.value.trim();
    const email = this.dom.studentEmailInput.value.trim();
    const tag = this.dom.studentTagInput.value.trim();
    const avatarColor = this.dom.studentAvatarColor.value || 'blue';

    if (!name || !roll) {
      alert('Name and Roll/ID are required.');
      return;
    }

    if (id) {
      // Edit existing
      const student = this.students.find(s => s.id === id);
      if (student) {
        student.name = name;
        student.roll = roll;
        student.email = email;
        student.tag = tag;
        student.avatarColor = avatarColor;
      }
      this.showToast('Member updated', 'success');
    } else {
      // Create new
      const newStudent = {
        id: 'std_' + Date.now().toString(36),
        classId: this.activeClassId,
        name,
        roll,
        email,
        tag,
        avatarColor,
        attendance: {}
      };
      this.students.push(newStudent);
      this.showToast(`Enrolled ${name}!`, 'success');
    }

    this.saveStudents();
    this.closeModal(this.dom.studentModal);
    sound.click('pop');
    this.render();
  }

  // ------------------------------------------------------------------------
  // Attendance Marking Actions
  // ------------------------------------------------------------------------
  setStudentStatus(studentId, newStatus) {
    const student = this.students.find(s => s.id === studentId);
    if (!student) return;

    if (!student.attendance) student.attendance = {};
    const existing = student.attendance[this.currentDate];

    // Toggle off if clicking same status
    if (existing && existing.status === newStatus) {
      delete student.attendance[this.currentDate];
      sound.click('pop');
    } else {
      const existingNote = existing ? existing.note : '';
      student.attendance[this.currentDate] = {
        status: newStatus,
        note: existingNote,
        timestamp: Date.now()
      };
      sound.click(newStatus);
    }

    this.saveStudents();
    this.renderMetrics();
    this.renderRoster();
  }

  bulkMark(status) {
    const cohort = this.getActiveCohortStudents();
    if (cohort.length === 0) return;

    cohort.forEach(student => {
      if (!student.attendance) student.attendance = {};
      const existing = student.attendance[this.currentDate];
      student.attendance[this.currentDate] = {
        status: status,
        note: existing ? existing.note : '',
        timestamp: Date.now()
      };
    });

    this.saveStudents();
    sound.click('success');
    this.showToast(`Marked all ${cohort.length} students as ${status.toUpperCase()}!`, 'success');
    this.render();
  }

  bulkClear() {
    const cohort = this.getActiveCohortStudents();
    if (cohort.length === 0) return;

    cohort.forEach(student => {
      if (student.attendance && student.attendance[this.currentDate]) {
        delete student.attendance[this.currentDate];
      }
    });

    this.saveStudents();
    sound.click('pop');
    this.showToast(`Reset attendance records for ${formatDisplayDate(this.currentDate)}`, 'info');
    this.render();
  }

  // ------------------------------------------------------------------------
  // Remarks / Daily Note
  // ------------------------------------------------------------------------
  openRemarksModal(studentId) {
    const student = this.students.find(s => s.id === studentId);
    if (!student) return;

    this.dom.remarksStudentId.value = studentId;
    this.dom.remarksStudentInfo.textContent = `${student.name} (Roll #${student.roll})`;
    this.dom.remarksDateFormatted.textContent = formatDisplayDate(this.currentDate);

    const record = student.attendance && student.attendance[this.currentDate];
    this.dom.remarksTextarea.value = record ? (record.note || '') : '';

    this.openModal(this.dom.remarksModal);
    this.dom.remarksTextarea.focus();
  }

  handleSaveRemark() {
    const studentId = this.dom.remarksStudentId.value;
    const note = this.dom.remarksTextarea.value.trim();
    const student = this.students.find(s => s.id === studentId);

    if (student) {
      if (!student.attendance) student.attendance = {};
      if (!student.attendance[this.currentDate]) {
        // Default to present if unmarked but adding remark
        student.attendance[this.currentDate] = { status: 'present', note: note, timestamp: Date.now() };
      } else {
        student.attendance[this.currentDate].note = note;
      }
      this.saveStudents();
      this.render();
      sound.click('pop');
      this.showToast('Daily remark updated', 'info');
    }

    this.closeModal(this.dom.remarksModal);
  }

  // ------------------------------------------------------------------------
  // Profile & History Modal
  // ------------------------------------------------------------------------
  openProfileModal(studentId) {
    const student = this.students.find(s => s.id === studentId);
    if (!student) return;

    this.dom.deleteStudentBtn.dataset.studentId = student.id;

    // Profile Identity
    const initials = student.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    this.dom.profileAvatar.textContent = initials;
    this.dom.profileAvatar.className = `profile-header-avatar avatar-${student.avatarColor || 'blue'}`;
    this.dom.profileName.textContent = student.name;
    this.dom.profileMeta.textContent = `Roll #${student.roll} • ${student.tag || 'General'} • ${student.email || 'No email registered'}`;

    // Compute stats
    const stats = this.computeStudentStats(student);
    this.dom.profileRateVal.textContent = `${stats.percentage}%`;
    this.dom.pStatTotal.textContent = stats.total;
    this.dom.pStatPresent.textContent = stats.present;
    this.dom.pStatAbsent.textContent = stats.absent;
    this.dom.pStatLate.textContent = stats.late;
    this.dom.pStatExcused.textContent = stats.excused;

    // Threshold styling
    const isAtRisk = stats.percentage < this.settings.threshold;
    if (isAtRisk) {
      this.dom.profileStatusBadge.textContent = `At-Risk (<${this.settings.threshold}%)`;
      this.dom.profileStatusBadge.className = 'profile-status-pill-badge pill-absent';
      this.dom.profileRateVal.className = 'big-rate text-rose';
    } else {
      this.dom.profileStatusBadge.textContent = 'High Standing';
      this.dom.profileStatusBadge.className = 'profile-status-pill-badge pill-present';
      this.dom.profileRateVal.className = 'big-rate text-emerald';
    }

    // Render 30-Day Heatmap
    this.renderProfileHeatmap(student);

    // Render Logs Table
    this.renderProfileHistoryTable(student);

    this.openModal(this.dom.profileModal);
  }

  renderProfileHeatmap(student) {
    const today = new Date();
    const cells = [];

    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = formatDateToISO(d);
      const rec = student.attendance && student.attendance[dateStr];
      const status = rec ? rec.status : 'none';

      let cellClass = 'heatmap-none';
      let title = `${formatDisplayDate(dateStr)}: Unmarked`;
      let label = d.getDate();

      if (status === 'present') {
        cellClass = 'heatmap-p';
        title = `${formatDisplayDate(dateStr)}: Present`;
      } else if (status === 'absent') {
        cellClass = 'heatmap-a';
        title = `${formatDisplayDate(dateStr)}: Absent`;
      } else if (status === 'late') {
        cellClass = 'heatmap-l';
        title = `${formatDisplayDate(dateStr)}: Late`;
      } else if (status === 'excused') {
        cellClass = 'heatmap-e';
        title = `${formatDisplayDate(dateStr)}: Excused`;
      }

      cells.push(`
        <div class="heatmap-cell ${cellClass}" title="${title}">
          ${label}
        </div>
      `);
    }

    this.dom.profileHeatmap.innerHTML = cells.join('');
  }

  renderProfileHistoryTable(student) {
    if (!student.attendance || Object.keys(student.attendance).length === 0) {
      this.dom.profileHistoryTableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-dim); padding:1rem;">No historical records found for this student.</td></tr>`;
      return;
    }

    const sortedDates = Object.keys(student.attendance).sort().reverse();
    const rows = sortedDates.map(dateStr => {
      const rec = student.attendance[dateStr];
      const d = parseISODate(dateStr);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const statusPill = this.getStatusBadgeHTML(rec.status);
      const note = rec.note ? escapeHTML(rec.note) : '<span style="color:var(--text-dim);">—</span>';

      return `
        <tr>
          <td><strong>${dateStr}</strong></td>
          <td>${dayName}</td>
          <td>${statusPill}</td>
          <td>${note}</td>
        </tr>
      `;
    });

    this.dom.profileHistoryTableBody.innerHTML = rows.join('');
  }

  getStatusBadgeHTML(status) {
    switch (status) {
      case 'present': return `<span class="metric-pill pill-present">Present</span>`;
      case 'absent': return `<span class="metric-pill pill-absent">Absent</span>`;
      case 'late': return `<span class="metric-pill pill-late">Late</span>`;
      case 'excused': return `<span class="metric-pill pill-excused">Excused</span>`;
      default: return `<span class="metric-pill" style="background:var(--bg-tertiary);">Unmarked</span>`;
    }
  }

  // ------------------------------------------------------------------------
  // Analytics & Defaulters Modal
  // ------------------------------------------------------------------------
  openAnalyticsModal() {
    const cohort = this.getActiveCohortStudents();
    const currentClass = this.classes.find(c => c.id === this.activeClassId);
    this.dom.analyticsSubtitle.textContent = `Performance overview for ${currentClass ? currentClass.name : 'Active Cohort'} (${cohort.length} members)`;

    let totalPctSum = 0;
    let highCount = 0;
    let midCount = 0;
    let defaultersCount = 0;

    const rows = cohort.map(student => {
      const stats = this.computeStudentStats(student);
      totalPctSum += stats.percentage;

      if (stats.percentage >= 85) highCount++;
      else if (stats.percentage >= this.settings.threshold) midCount++;
      else defaultersCount++;

      const isRisk = stats.percentage < this.settings.threshold;
      const statusBadge = isRisk 
        ? `<span class="risk-tag">⚠️ At-Risk</span>` 
        : `<span class="today-tag">Standing</span>`;

      return `
        <tr>
          <td><code>${escapeHTML(student.roll)}</code></td>
          <td><strong>${escapeHTML(student.name)}</strong></td>
          <td class="text-emerald font-bold">${stats.present}</td>
          <td class="text-rose font-bold">${stats.absent}</td>
          <td class="text-amber font-bold">${stats.late}</td>
          <td>${stats.total}</td>
          <td>
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <span class="font-mono ${isRisk ? 'text-rose' : 'text-emerald'}" style="font-weight:700;">${stats.percentage}%</span>
            </div>
          </td>
          <td>${statusBadge}</td>
        </tr>
      `;
    });

    const avgRate = cohort.length > 0 ? (totalPctSum / cohort.length).toFixed(1) : 0;
    this.dom.analyticsAvgRate.textContent = `${avgRate}%`;
    this.dom.analyticsHighCount.textContent = highCount;
    this.dom.analyticsMidCount.textContent = midCount;
    this.dom.analyticsDefaultersCount.textContent = defaultersCount;

    if (defaultersCount > 0) {
      this.dom.analyticsWarningBanner.style.display = 'flex';
      document.getElementById('warningBannerText').textContent = 
        `${defaultersCount} student(s) currently fail the ${this.settings.threshold}% minimum attendance requirement.`;
    } else {
      this.dom.analyticsWarningBanner.style.display = 'none';
    }

    this.dom.analyticsTableBody.innerHTML = rows.join('');
    this.openModal(this.dom.analyticsModal);
  }

  // ------------------------------------------------------------------------
  // Metrics & Stats Calculation
  // ------------------------------------------------------------------------
  getActiveCohortStudents() {
    return this.students.filter(s => s.classId === this.activeClassId);
  }

  computeStudentStats(student) {
    if (!student.attendance) {
      return { total: 0, present: 0, absent: 0, late: 0, excused: 0, percentage: 100 };
    }

    const records = Object.values(student.attendance);
    const total = records.length;
    if (total === 0) {
      return { total: 0, present: 0, absent: 0, late: 0, excused: 0, percentage: 100 };
    }

    let present = 0;
    let absent = 0;
    let late = 0;
    let excused = 0;

    records.forEach(r => {
      if (r.status === 'present') present++;
      else if (r.status === 'absent') absent++;
      else if (r.status === 'late') late++;
      else if (r.status === 'excused') excused++;
    });

    // Credit calculation
    const effectivePresent = this.settings.lateHalfDay ? (present + (late * 0.5)) : (present + late);
    // Excused leaves don't penalize student denominator
    const denominator = Math.max(1, total - excused);
    const percentage = Math.min(100, Math.round((effectivePresent / denominator) * 100));

    return { total, present, absent, late, excused, percentage };
  }

  renderMetrics() {
    const cohort = this.getActiveCohortStudents();
    const total = cohort.length;

    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    let excusedCount = 0;

    cohort.forEach(s => {
      const rec = s.attendance && s.attendance[this.currentDate];
      if (rec) {
        if (rec.status === 'present') presentCount++;
        else if (rec.status === 'absent') absentCount++;
        else if (rec.status === 'late') lateCount++;
        else if (rec.status === 'excused') excusedCount++;
      }
    });

    const markedTotal = presentCount + absentCount + lateCount + excusedCount;

    // Percentages for today
    const pPct = total > 0 ? Math.round((presentCount / total) * 100) : 0;
    const aPct = total > 0 ? Math.round((absentCount / total) * 100) : 0;
    const lPct = total > 0 ? Math.round((lateCount / total) * 100) : 0;
    const ePct = total > 0 ? Math.round((excusedCount / total) * 100) : 0;

    this.dom.statTotalStudents.textContent = total;
    this.dom.statAttendanceStatusSummary.textContent = `${markedTotal} of ${total} recorded today`;

    this.dom.statPresentCount.textContent = presentCount;
    this.dom.statPresentPercent.textContent = `${pPct}%`;
    this.dom.statPresentBar.style.width = `${pPct}%`;

    this.dom.statAbsentCount.textContent = absentCount;
    this.dom.statAbsentPercent.textContent = `${aPct}%`;
    this.dom.statAbsentBar.style.width = `${aPct}%`;

    this.dom.statLateCount.textContent = lateCount;
    this.dom.statLatePercent.textContent = `${lPct}%`;
    this.dom.statLateBar.style.width = `${lPct}%`;

    this.dom.statExcusedCount.textContent = excusedCount;
    this.dom.statExcusedPercent.textContent = `${ePct}%`;
    this.dom.statExcusedBar.style.width = `${ePct}%`;

    // Filter pill counts
    this.dom.filterCountAll.textContent = total;
    this.dom.filterCountPresent.textContent = presentCount;
    this.dom.filterCountAbsent.textContent = absentCount;
    this.dom.filterCountLate.textContent = lateCount;
    this.dom.filterCountExcused.textContent = excusedCount;

    // Count at-risk students
    let riskCount = 0;
    cohort.forEach(s => {
      const stats = this.computeStudentStats(s);
      if (stats.percentage < this.settings.threshold) riskCount++;
    });
    this.dom.filterCountRisk.textContent = riskCount;

    // Footer stats
    this.dom.footerClassStats.textContent = `${total} enrolled in active cohort`;
  }

  // ------------------------------------------------------------------------
  // Roster Rendering (Grid & Table)
  // ------------------------------------------------------------------------
  render() {
    this.renderMetrics();
    this.renderRoster();
  }

  getFilteredAndSortedStudents() {
    const cohort = this.getActiveCohortStudents();

    // 1. Filter
    const filtered = cohort.filter(student => {
      // Search matching
      if (this.searchQuery) {
        const q = this.searchQuery;
        const matchesName = student.name.toLowerCase().includes(q);
        const matchesRoll = student.roll.toLowerCase().includes(q);
        const matchesTag = (student.tag || '').toLowerCase().includes(q);
        if (!matchesName && !matchesRoll && !matchesTag) return false;
      }

      // Status pill matching
      const rec = student.attendance && student.attendance[this.currentDate];
      const todayStatus = rec ? rec.status : 'unmarked';
      const stats = this.computeStudentStats(student);

      if (this.activeFilter === 'present') return todayStatus === 'present';
      if (this.activeFilter === 'absent') return todayStatus === 'absent';
      if (this.activeFilter === 'late') return todayStatus === 'late';
      if (this.activeFilter === 'excused') return todayStatus === 'excused';
      if (this.activeFilter === 'at-risk') return stats.percentage < this.settings.threshold;

      return true;
    });

    // 2. Sort
    filtered.sort((a, b) => {
      if (this.activeSort === 'roll-asc') {
        return (parseInt(a.roll, 10) || 0) - (parseInt(b.roll, 10) || 0);
      }
      if (this.activeSort === 'roll-desc') {
        return (parseInt(b.roll, 10) || 0) - (parseInt(a.roll, 10) || 0);
      }
      if (this.activeSort === 'name-asc') {
        return a.name.localeCompare(b.name);
      }
      if (this.activeSort === 'name-desc') {
        return b.name.localeCompare(a.name);
      }
      if (this.activeSort === 'rate-desc') {
        return this.computeStudentStats(b).percentage - this.computeStudentStats(a).percentage;
      }
      if (this.activeSort === 'rate-asc') {
        return this.computeStudentStats(a).percentage - this.computeStudentStats(b).percentage;
      }
      return 0;
    });

    return filtered;
  }

  renderRoster() {
    const students = this.getFilteredAndSortedStudents();
    const hasStudents = students.length > 0;

    this.dom.emptyState.style.display = hasStudents ? 'none' : 'flex';

    if (this.viewMode === 'grid') {
      this.dom.studentGrid.style.display = hasStudents ? 'grid' : 'none';
      this.dom.studentTableView.style.display = 'none';
      if (hasStudents) this.renderGrid(students);
    } else {
      this.dom.studentGrid.style.display = 'none';
      this.dom.studentTableView.style.display = hasStudents ? 'block' : 'none';
      if (hasStudents) this.renderTable(students);
    }
  }

  renderGrid(students) {
    const cards = students.map(student => {
      const rec = student.attendance && student.attendance[this.currentDate];
      const todayStatus = rec ? rec.status : 'unmarked';
      const hasNote = rec && rec.note && rec.note.length > 0;
      const stats = this.computeStudentStats(student);
      const isAtRisk = stats.percentage < this.settings.threshold;

      const initials = student.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
      const avatarClass = `student-avatar avatar-${student.avatarColor || 'blue'}`;

      let cardStatusClass = 'unmarked';
      if (todayStatus === 'present') cardStatusClass = 'marked-present';
      else if (todayStatus === 'absent') cardStatusClass = 'marked-absent';
      else if (todayStatus === 'late') cardStatusClass = 'marked-late';
      else if (todayStatus === 'excused') cardStatusClass = 'marked-excused';

      return `
        <div class="student-card ${cardStatusClass}" data-id="${student.id}">
          
          <!-- Card Top: Identity & Actions -->
          <div class="card-top">
            <div class="student-identity" onclick="window.app.openProfileModal('${student.id}')" title="Click to view detailed profile & attendance log">
              <div class="${avatarClass}">${initials}</div>
              <div class="student-meta-info">
                <span class="student-name">${escapeHTML(student.name)}</span>
                <div class="student-submeta">
                  <span class="roll-badge">#${escapeHTML(student.roll)}</span>
                  <span>•</span>
                  <span>${escapeHTML(student.tag || 'General')}</span>
                </div>
              </div>
            </div>

            <div class="card-top-actions">
              <button class="btn-card-icon" onclick="window.app.openRemarksModal('${student.id}')" title="${hasNote ? `Note: ${escapeHTML(rec.note)}` : 'Add daily note for this student'}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                ${hasNote ? '<span class="has-note-dot"></span>' : ''}
              </button>
            </div>
          </div>

          <!-- Cumulative Progress Row -->
          <div class="card-stats-row">
            <div class="overall-rate-group">
              <span class="overall-rate-text ${isAtRisk ? 'text-rose' : 'text-emerald'}">${stats.percentage}%</span>
              <div class="overall-progress-bar">
                <div class="overall-progress-fill ${isAtRisk ? 'fill-rose' : 'fill-emerald'}" style="width: ${stats.percentage}%;"></div>
              </div>
            </div>
            ${isAtRisk ? '<span class="risk-tag">⚠️ At-Risk</span>' : ''}
          </div>

          <!-- Status Selector Pill Buttons (P, A, L, E) -->
          <div class="status-pill-selector">
            <button class="btn-status-option ${todayStatus === 'present' ? 'active-present' : ''}" onclick="window.app.setStudentStatus('${student.id}', 'present')" title="Mark Present (P)">
              <span class="status-code">P</span>
              <span class="status-text">Present</span>
            </button>
            <button class="btn-status-option ${todayStatus === 'absent' ? 'active-absent' : ''}" onclick="window.app.setStudentStatus('${student.id}', 'absent')" title="Mark Absent (A)">
              <span class="status-code">A</span>
              <span class="status-text">Absent</span>
            </button>
            <button class="btn-status-option ${todayStatus === 'late' ? 'active-late' : ''}" onclick="window.app.setStudentStatus('${student.id}', 'late')" title="Mark Late (L)">
              <span class="status-code">L</span>
              <span class="status-text">Late</span>
            </button>
            <button class="btn-status-option ${todayStatus === 'excused' ? 'active-excused' : ''}" onclick="window.app.setStudentStatus('${student.id}', 'excused')" title="Mark Excused (E)">
              <span class="status-code">E</span>
              <span class="status-text">Excused</span>
            </button>
          </div>

        </div>
      `;
    });

    this.dom.studentGrid.innerHTML = cards.join('');
  }

  renderTable(students) {
    const rows = students.map((student, idx) => {
      const rec = student.attendance && student.attendance[this.currentDate];
      const todayStatus = rec ? rec.status : 'unmarked';
      const stats = this.computeStudentStats(student);
      const isAtRisk = stats.percentage < this.settings.threshold;
      const initials = student.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
      const hasNote = rec && rec.note && rec.note.length > 0;

      return `
        <tr>
          <td><span style="color:var(--text-dim);">${idx + 1}</span></td>
          <td><code>${escapeHTML(student.roll)}</code></td>
          <td>
            <div class="tbl-student-cell" onclick="window.app.openProfileModal('${student.id}')" style="cursor:pointer;">
              <div class="tbl-avatar avatar-${student.avatarColor || 'blue'}">${initials}</div>
              <div>
                <div class="tbl-name">${escapeHTML(student.name)}</div>
                <div style="font-size:0.75rem; color:var(--text-dim);">${escapeHTML(student.tag || '')}</div>
              </div>
            </div>
          </td>
          <td>
            <div style="display:flex; align-items:center; gap:0.4rem;">
              <span class="font-mono ${isAtRisk ? 'text-rose font-bold' : 'text-emerald font-bold'}">${stats.percentage}%</span>
              ${isAtRisk ? '<span class="risk-tag" style="padding:1px 4px; font-size:0.65rem;">⚠️ Low</span>' : ''}
            </div>
          </td>
          <td>
            <div class="tbl-status-pills">
              <button class="tbl-btn-status ${todayStatus === 'present' ? 'active-present' : ''}" onclick="window.app.setStudentStatus('${student.id}', 'present')">P</button>
              <button class="tbl-btn-status ${todayStatus === 'absent' ? 'active-absent' : ''}" onclick="window.app.setStudentStatus('${student.id}', 'absent')">A</button>
              <button class="tbl-btn-status ${todayStatus === 'late' ? 'active-late' : ''}" onclick="window.app.setStudentStatus('${student.id}', 'late')">L</button>
              <button class="tbl-btn-status ${todayStatus === 'excused' ? 'active-excused' : ''}" onclick="window.app.setStudentStatus('${student.id}', 'excused')">E</button>
            </div>
          </td>
          <td class="tbl-note-cell">
            <div class="tbl-note-preview" onclick="window.app.openRemarksModal('${student.id}')" title="Click to edit remark">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path></svg>
              <span>${hasNote ? escapeHTML(rec.note.substring(0, 18) + (rec.note.length > 18 ? '...' : '')) : '<span style="color:var(--text-dim);">Add Note</span>'}</span>
            </div>
          </td>
          <td style="text-align: right;">
            <button class="icon-btn-subtle" onclick="window.app.openProfileModal('${student.id}')" title="Detailed Analytics">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>
            </button>
          </td>
        </tr>
      `;
    });

    this.dom.studentTableBody.innerHTML = rows.join('');
  }

  // ------------------------------------------------------------------------
  // Export & Reporting Functions (CSV, JSON, PDF)
  // ------------------------------------------------------------------------
  downloadFile(content, fileName, mimeType = 'text/csv;charset=utf-8;') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    sound.click('pop');
    this.showToast(`Exported ${fileName}`, 'success');
  }

  exportTodayCsv() {
    const cohort = this.getActiveCohortStudents();
    const currentClass = this.classes.find(c => c.id === this.activeClassId);
    const className = currentClass ? currentClass.name : 'Class';

    const headers = ['Date', 'Cohort', 'Roll_No', 'Student_Name', 'Email', 'Tag', 'Status', 'Daily_Note'];
    const rows = [headers.join(',')];

    cohort.forEach(student => {
      const rec = student.attendance && student.attendance[this.currentDate];
      const status = rec ? rec.status.toUpperCase() : 'UNMARKED';
      const note = rec && rec.note ? `"${rec.note.replace(/"/g, '""')}"` : '""';

      const row = [
        `"${this.currentDate}"`,
        `"${className.replace(/"/g, '""')}"`,
        `"${student.roll}"`,
        `"${student.name.replace(/"/g, '""')}"`,
        `"${(student.email || '').replace(/"/g, '""')}"`,
        `"${(student.tag || '').replace(/"/g, '""')}"`,
        `"${status}"`,
        note
      ];
      rows.push(row.join(','));
    });

    this.downloadFile(rows.join('\r\n'), `attendance_${this.activeClassId}_${this.currentDate}.csv`);
  }

  exportFullHistoryCsv() {
    const cohort = this.getActiveCohortStudents();
    const currentClass = this.classes.find(c => c.id === this.activeClassId);
    const className = currentClass ? currentClass.name : 'Class';

    // Collect all unique dates across this cohort
    const dateSet = new Set();
    cohort.forEach(s => {
      if (s.attendance) {
        Object.keys(s.attendance).forEach(d => dateSet.add(d));
      }
    });

    const sortedDates = Array.from(dateSet).sort();

    const headers = ['Roll_No', 'Student_Name', 'Overall_Percentage', 'Total_Days', 'Present', 'Absent', 'Late', 'Excused', ...sortedDates];
    const rows = [headers.join(',')];

    cohort.forEach(student => {
      const stats = this.computeStudentStats(student);
      const studentData = [
        `"${student.roll}"`,
        `"${student.name.replace(/"/g, '""')}"`,
        `"${stats.percentage}%"`,
        stats.total,
        stats.present,
        stats.absent,
        stats.late,
        stats.excused
      ];

      sortedDates.forEach(d => {
        const rec = student.attendance && student.attendance[d];
        studentData.push(rec ? `"${rec.status.toUpperCase()}"` : '"-"');
      });

      rows.push(studentData.join(','));
    });

    this.downloadFile(rows.join('\r\n'), `attendance_matrix_${this.activeClassId}_full.csv`);
  }

  exportDefaultersCsv() {
    const cohort = this.getActiveCohortStudents();
    const defaulters = cohort.filter(s => this.computeStudentStats(s).percentage < this.settings.threshold);

    const headers = ['Roll_No', 'Student_Name', 'Email', 'Cumulative_Rate', 'Present_Days', 'Absent_Days', 'Total_Days', 'Threshold_Required'];
    const rows = [headers.join(',')];

    defaulters.forEach(s => {
      const stats = this.computeStudentStats(s);
      rows.push([
        `"${s.roll}"`,
        `"${s.name.replace(/"/g, '""')}"`,
        `"${(s.email || '').replace(/"/g, '""')}"`,
        `"${stats.percentage}%"`,
        stats.present,
        stats.absent,
        stats.total,
        `"${this.settings.threshold}%"`
      ].join(','));
    });

    this.downloadFile(rows.join('\r\n'), `defaulters_alert_${this.activeClassId}_below_${this.settings.threshold}pct.csv`);
  }

  backupDataJson() {
    const backupObj = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      classes: this.classes,
      students: this.students,
      settings: this.settings
    };
    const jsonStr = JSON.stringify(backupObj, null, 2);
    this.downloadFile(jsonStr, `attendflow_backup_${this.currentDate}.json`, 'application/json');
  }

  handleRestoreJson(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target.result);
        if (data.classes && data.students) {
          this.classes = data.classes;
          this.students = data.students;
          if (data.settings) this.settings = { ...this.settings, ...data.settings };
          this.saveClasses();
          this.saveStudents();
          this.saveSettings();
          this.renderClassDropdown();
          this.render();
          sound.click('success');
          this.showToast('Data backup restored successfully!', 'success');
        } else {
          alert('Invalid backup JSON structure.');
        }
      } catch (err) {
        alert('Could not parse JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  }

  // ------------------------------------------------------------------------
  // Toast Notifications
  // ------------------------------------------------------------------------
  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = `✓`;
    if (type === 'error') icon = `✕`;
    if (type === 'info') icon = `ℹ`;

    toast.innerHTML = `<span><strong>${icon}</strong> ${escapeHTML(message)}</span>`;
    this.dom.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 250);
    }, 2800);
  }
}

// Utility for HTML escaping
function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Instantiate on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new AttendanceApp();
  window.app.init();
});
