import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), fill_hex)
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def set_table_borders(table, color="D3D3D3"):
    tblPr = table._tbl.tblPr
    tblBorders = OxmlElement('w:tblBorders')
    for border_name in ['top', 'left', 'bottom', 'right', 'insideH', 'insideV']:
        border = OxmlElement(f'w:{border_name}')
        border.set(qn('w:val'), 'single')
        border.set(qn('w:sz'), '4')
        border.set(qn('w:space'), '0')
        border.set(qn('w:color'), color)
        tblBorders.append(border)
    tblPr.append(tblBorders)

def add_heading_1(doc, text):
    h = doc.add_paragraph()
    h.paragraph_format.space_before = Pt(16)
    h.paragraph_format.space_after = Pt(6)
    h.paragraph_format.keep_with_next = True
    run = h.add_run(text)
    run.font.name = 'Times New Roman'
    run.font.size = Pt(14)
    run.font.bold = True
    run.font.color.rgb = RGBColor(0x11, 0x18, 0x27)
    return h

def add_heading_2(doc, text):
    h = doc.add_paragraph()
    h.paragraph_format.space_before = Pt(12)
    h.paragraph_format.space_after = Pt(4)
    h.paragraph_format.keep_with_next = True
    run = h.add_run(text)
    run.font.name = 'Times New Roman'
    run.font.size = Pt(12)
    run.font.bold = True
    run.font.color.rgb = RGBColor(0x1F, 0x29, 0x37)
    return h

def add_paragraph(doc, text, bold_prefix=None, space_after=6, italic=False):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = 1.15
    if bold_prefix:
        r_pre = p.add_run(bold_prefix)
        r_pre.font.name = 'Times New Roman'
        r_pre.font.size = Pt(11)
        r_pre.font.bold = True
    r = p.add_run(text)
    r.font.name = 'Times New Roman'
    r.font.size = Pt(11)
    if italic:
        r.font.italic = True
    return p

def add_bullet(doc, text, bold_prefix=None):
    p = doc.add_paragraph(style='List Bullet')
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.line_spacing = 1.15
    if bold_prefix:
        r_pre = p.add_run(bold_prefix)
        r_pre.font.name = 'Times New Roman'
        r_pre.font.size = Pt(11)
        r_pre.font.bold = True
    r = p.add_run(text)
    r.font.name = 'Times New Roman'
    r.font.size = Pt(11)
    return p

def add_image_figure(doc, img_path, caption, width_inches=6.0):
    if not os.path.exists(img_path):
        print(f"Warning: Image {img_path} not found.")
        return
    p_img = doc.add_paragraph()
    p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_img.paragraph_format.space_before = Pt(8)
    p_img.paragraph_format.space_after = Pt(4)
    run_img = p_img.add_run()
    run_img.add_picture(img_path, width=Inches(width_inches))

    p_cap = doc.add_paragraph()
    p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_cap.paragraph_format.space_before = Pt(0)
    p_cap.paragraph_format.space_after = Pt(12)
    run_cap = p_cap.add_run(caption)
    run_cap.font.name = 'Times New Roman'
    run_cap.font.size = Pt(10)
    run_cap.font.bold = True
    run_cap.font.color.rgb = RGBColor(0x37, 0x41, 0x51)

def build_report():
    doc = docx.Document()

    # Page Margins
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # ----------------------------------------------------
    # COVER PAGE
    # ----------------------------------------------------
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(2)
    r = p.add_run("COIMBATORE INSTITUTE OF TECHNOLOGY")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(16)
    r.font.bold = True

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(14)
    r = p.add_run("(Government Aided Autonomous Institution Affiliated to Anna University)\nCOIMBATORE - 641 014")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(11)
    r.font.italic = True

    # Logo
    if os.path.exists("Screenshots/college_logo.png"):
        p_logo = doc.add_paragraph()
        p_logo.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_logo.paragraph_format.space_after = Pt(14)
        p_logo.add_run().add_picture("Screenshots/college_logo.png", width=Inches(1.8))

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(6)
    r = p.add_run("23IT723 - DEVOPS LABORATORY")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(14)
    r.font.bold = True

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(12)
    r = p.add_run("PROJECT REPORT")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(13)
    r.font.bold = True

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(30)
    r = p.add_run("ATTENDFLOW: MODERN ATTENDANCE TRACKING AND ANALYTICS WEB APPLICATION\nWITH END-TO-END CI/CD PIPELINE")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(17)
    r.font.bold = True
    r.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A)

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(6)
    r = p.add_run("OCTOBER 2026")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(12)
    r.font.bold = True

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(30)
    p.paragraph_format.space_after = Pt(4)
    r = p.add_run("Submitted by")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(12)
    r.font.italic = True

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(0)
    r = p.add_run("PRANESH M\n(Roll No: 23IT723 / DevOps Laboratory)")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(13)
    r.font.bold = True

    doc.add_page_break()

    # ----------------------------------------------------
    # BONAFIDE CERTIFICATE
    # ----------------------------------------------------
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(2)
    r = p.add_run("COIMBATORE INSTITUTE OF TECHNOLOGY")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(15)
    r.font.bold = True

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(20)
    r = p.add_run("(Government Aided Autonomous Institution Affiliated to Anna University)\nCOIMBATORE - 641 014")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(11)
    r.font.italic = True

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(24)
    r = p.add_run("BONAFIDE CERTIFICATE")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(14)
    r.font.bold = True

    add_paragraph(doc, 
        'Certified that this project report titled "ATTENDFLOW: MODERN ATTENDANCE TRACKING AND ANALYTICS WEB APPLICATION WITH END-TO-END CI/CD PIPELINE" is the bonafide work of PRANESH M completed during the academic year 2025-2026 - Semester VII for the project presentation of 23IT723 - DEVOPS LABORATORY under our supervision.',
        space_after=14)

    add_paragraph(doc, 
        'Certified that the candidate was examined by using the project work examination.',
        space_after=40)

    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(6)
    r = p.add_run("Review Members:")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(12)
    r.font.bold = True

    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(60)
    r = p.add_run("Dr. M. Sangeetha\nDr. E. Arul")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(12)
    r.font.bold = True

    table_sign = doc.add_table(rows=1, cols=2)
    table_sign.alignment = WD_TABLE_ALIGNMENT.CENTER
    table_sign.autofit = False
    table_sign.columns[0].width = Inches(3.2)
    table_sign.columns[1].width = Inches(3.2)
    table_sign.rows[0].cells[0].paragraphs[0].text = "Faculty In-Charge\nSignature: __________________"
    table_sign.rows[0].cells[1].paragraphs[0].text = "Head of the Department\nSignature: __________________"

    doc.add_page_break()

    # ----------------------------------------------------
    # EVALUATION SCHEME
    # ----------------------------------------------------
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run("23IT723 - DEVOPS LABORATORY\nFINAL MINI PROJECT - EVALUATION SCHEME")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(13)
    r.font.bold = True

    add_paragraph(doc, 
        'The final mini project shall require students to integrate the major DevOps practices covered in the laboratory. The project should demonstrate practical implementation of version control, collaborative development, Continuous Integration, containerization and/or automated configuration/provisioning, with proper execution evidence.',
        bold_prefix="Final Mini Project Assessment: ", space_after=12)

    eval_data = [
        ("S.No.", "Evaluation Component", "Key Verification Points", "Marks"),
        ("1", "Problem Definition & Project Planning", "Problem statement, objectives, requirements, scope, module identification, technology selection and workflow planning.", "10"),
        ("2", "Git Repository & Version Control", "Repository creation, meaningful commits, README, .gitignore, remote repository, push/pull/fetch operations and commit history.", "15"),
        ("3", "Branching, Merging & Collaboration", "Feature branches, parallel development, merging, conflict handling, branch organization and collaborative workflow.", "10"),
        ("4", "Application Development & Build", "Working application/source code, project structure, dependency management, build configuration and successful execution.", "15"),
        ("5", "Jenkins Continuous Integration", "Jenkins configuration, source-code integration, automated checkout, build job/pipeline, build execution and console verification.", "15"),
        ("6", "Docker / Containerization", "Dockerfile, image creation, container execution, port/configuration handling, application deployment and container verification.", "10"),
        ("7", "Automation / Configuration Management", "Ansible automation; repeatable configuration/provisioning and successful execution with failed=0.", "5"),
        ("8", "Testing & Verification", "Functional testing, build verification, error identification, test evidence and corrective action.", "5"),
        ("9", "Documentation & Technical Presentation", "Architecture/workflow diagram, commands/configuration, screenshots, results, troubleshooting, conclusion and repository details.", "5"),
        ("10", "Final Demonstration & Viva-Voce", "Live demonstration, explanation of implementation, troubleshooting responses and technical understanding.", "10"),
        ("", "TOTAL", "", "100")
    ]

    t_eval = doc.add_table(rows=len(eval_data), cols=4)
    t_eval.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_eval)
    for row_idx, row in enumerate(eval_data):
        for col_idx, text in enumerate(row):
            cell = t_eval.cell(row_idx, col_idx)
            cell.text = text
            set_cell_margins(cell, top=60, bottom=60, left=80, right=80)
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER if col_idx in [0, 3] else WD_ALIGN_PARAGRAPH.LEFT
            for run in p.runs:
                run.font.name = 'Times New Roman'
                run.font.size = Pt(9.5)
                if row_idx == 0 or row_idx == len(eval_data) - 1:
                    run.font.bold = True
            if row_idx == 0:
                set_cell_background(cell, "E5E7EB")

    t_eval.columns[0].width = Inches(0.6)
    t_eval.columns[1].width = Inches(2.3)
    t_eval.columns[2].width = Inches(2.9)
    t_eval.columns[3].width = Inches(0.7)

    add_heading_2(doc, "Minimum Evidence to be Submitted")
    for item in [
        "Project repository URL and project README.",
        "Git commit history and branch/merge evidence.",
        "Jenkins job/pipeline configuration and successful build evidence.",
        "Dockerfile, image and running container evidence where Docker is used.",
        "Automation/configuration scripts (Ansible playbook & inventory).",
        "Application execution and testing evidence.",
        "Architecture/workflow diagram.",
        "Short technical report containing implementation steps, results and troubleshooting.",
        "Live demonstration of the complete DevOps workflow."
    ]:
        add_bullet(doc, item)

    add_heading_2(doc, "Faculty Evaluation Record")
    fac_data = [
        ("Student Name", "PRANESH M", "Register No.", "23IT723"),
        ("Project Title", "AttendFlow - DevOps Attendance Tracker Application", "Date", "October 2026"),
        ("Faculty Evaluator I", "Signature:", "Faculty Evaluator II", "Signature:"),
        ("Final Mark", "        / 100", "Result", "COMPLETED")
    ]
    t_fac = doc.add_table(rows=4, cols=4)
    t_fac.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_fac)
    for r_i, row in enumerate(fac_data):
        for c_i, text in enumerate(row):
            cell = t_fac.cell(r_i, c_i)
            cell.text = text
            set_cell_margins(cell, top=60, bottom=60, left=80, right=80)
            p = cell.paragraphs[0]
            for run in p.runs:
                run.font.name = 'Times New Roman'
                run.font.size = Pt(9.5)
                if c_i in [0, 2]:
                    run.font.bold = True

    doc.add_page_break()

    # ----------------------------------------------------
    # TABLE OF CONTENTS
    # ----------------------------------------------------
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(14)
    r = p.add_run("TABLE OF CONTENTS")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(14)
    r.font.bold = True

    toc_data = [
        ("S. NO.", "CONTENT", "PAGE NO."),
        ("1", "INTRODUCTION", "05"),
        ("2", "OBJECTIVES", "05"),
        ("3", "ABSTRACT", "06"),
        ("4", "TECHNOLOGY STACK", "06"),
        ("5", "SYSTEM ARCHITECTURE", "07"),
        ("6", "MODULE 1 - USER INTERFACE & PRODUCTIVITY OVERVIEW", "08"),
        ("7", "MODULE 2 - TASK MANAGEMENT & INTERACTIVE CONTROLS", "10"),
        ("8", "MODULE 3 - LOCAL STORAGE & DATA PERSISTENCE", "12"),
        ("9", "MODULE 4 - GIT & GITHUB SOURCE CONTROL", "13"),
        ("10", "MODULE 5 - DOCKER CONTAINERIZATION", "15"),
        ("11", "MODULE 6 - JENKINS CI/CD PIPELINE", "17"),
        ("12", "MODULE 7 - AUTOMATED TESTING", "19"),
        ("13", "MODULE 8 - ANSIBLE DEPLOYMENT", "20"),
        ("14", "MODULE 9 - PERSISTENT STORAGE", "22"),
        ("15", "MODULE 10 - DATA EXPORT & ACTIONS MANAGEMENT", "23"),
        ("16", "MODULE 11 - CI/CD INTEGRATION", "24"),
        ("17", "MODULE 12 - APPLICATION & DEPLOYMENT VERIFICATION", "25"),
        ("18", "RESULTS AND OUTPUT", "26"),
        ("19", "COMMANDS USED", "27"),
        ("20", "ADVANTAGES", "30"),
        ("21", "LIMITATIONS", "30"),
        ("22", "FUTURE ENHANCEMENTS", "31"),
        ("23", "CONCLUSION", "31")
    ]

    t_toc = doc.add_table(rows=len(toc_data), cols=3)
    t_toc.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_toc)
    for r_i, row in enumerate(toc_data):
        for c_i, text in enumerate(row):
            cell = t_toc.cell(r_i, c_i)
            cell.text = text
            set_cell_margins(cell, top=50, bottom=50, left=80, right=80)
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER if c_i in [0, 2] else WD_ALIGN_PARAGRAPH.LEFT
            for run in p.runs:
                run.font.name = 'Times New Roman'
                run.font.size = Pt(10)
                if r_i == 0:
                    run.font.bold = True
            if r_i == 0:
                set_cell_background(cell, "E5E7EB")

    t_toc.columns[0].width = Inches(0.8)
    t_toc.columns[1].width = Inches(4.5)
    t_toc.columns[2].width = Inches(1.1)

    doc.add_page_break()

    # ----------------------------------------------------
    # 1. INTRODUCTION & 2. OBJECTIVES
    # ----------------------------------------------------
    add_heading_1(doc, "1. INTRODUCTION")
    add_paragraph(doc, 
        'AttendFlow is a modern, high-performance web-based productivity and Attendance Tracker application engineered to streamline attendance marking, cohort filtering, defaulter alerts, and progress analytics through an intuitive digital interface. Built with pure HTML5, CSS3, and ES6+ JavaScript, the application delivers real-time productivity analytics, audio feedback cues, status pill selectors, dark/light theme toggle, and CSV/JSON export capabilities.',
        space_after=8)
    add_paragraph(doc, 
        'Beyond standalone application functionality, this project incorporates an end-to-end DevOps automation workflow covering every stage of modern software delivery. Source code management and collaborative versioning are implemented using Git and GitHub. Continuous Integration is automated via a Jenkins Declarative Pipeline that retrieves source code, executes automated Python/Pytest unit tests, and packages the web application into a lightweight Nginx container. Containerization is performed through Docker, and configuration deployment automation is accomplished via Ansible using an Ansible playbook and a dedicated management container. Furthermore, persistent storage is maintained through a dedicated Docker Volume (attendance_data). The project seamlessly bridges robust frontend development with industrial-grade DevOps practices.',
        space_after=14)

    add_heading_1(doc, "2. OBJECTIVES")
    for obj in [
        "To develop a responsive, modern Attendance Tracker application supporting attendance status flags (P/A/L/E), batch categorization, date navigation, and interactive analytics.",
        "To provide local persistence and seamless backup through browser LocalStorage and structured JSON export/import.",
        "To implement version control and repository management practices using Git and GitHub (bala2006r/DevopsLab).",
        "To containerize the web application using Docker with an ultra-lightweight Nginx Alpine base image for portable, isolated execution.",
        "To automate the CI/CD pipeline using Jenkins, ensuring automated source checkout, test execution, container image builds, and container deployment.",
        "To integrate automated unit testing using Python and Pytest to validate project structure and file integrity before deployment.",
        "To implement automated deployment and container configuration using Ansible playbooks with zero failure tolerance (failed=0).",
        "To establish persistent storage using Docker Volumes (attendance_data) mounted to application containers to ensure data retention across container lifecycles.",
        "To verify application reliability across container runtime, port bindings, and web accessibility at http://localhost:8086."
    ]:
        add_bullet(doc, obj)

    add_heading_1(doc, "3. ABSTRACT")
    add_paragraph(doc, 
        'AttendFlow is a responsive web application designed to solve attendance management challenges by offering an elegant roll call workspace with dynamic progress monitoring, category organization, and state persistence. While traditional task trackers often lack modularity and deployment agility, AttendFlow is architected from inception to exemplify an automated DevOps lifecycle.',
        space_after=8)
    add_paragraph(doc, 
        'The DevOps implementation encompasses source code management via Git and GitHub, automated CI/CD pipeline execution using Jenkins 2.x, container packaging with Docker and Nginx Alpine, automated syntax and structural testing using Python/Pytest, automated container orchestration using Ansible, and volume persistence via Docker Volume attendance_data. The end-to-end workflow follows GitHub → Jenkins CI/CD → Automated Test (Pytest) → Docker Build → Ansible Playbook → Docker Container (Port 8086) → Web Verification, successfully proving a fully automated, reproducible software engineering cycle.',
        space_after=14)

    add_heading_1(doc, "4. TECHNOLOGY STACK")
    tech_data = [
        ("Technology", "Version / Platform", "Purpose in Project"),
        ("HTML", "HTML5 Semantic Markup", "Defines structured elements, task inputs, filters, and layout"),
        ("CSS", "CSS3 Custom Design Tokens", "Modern glassmorphism, responsive grid, light/dark mode themes"),
        ("JavaScript", "Vanilla ES6+", "DOM manipulation, localStorage, audio cues, confetti effects"),
        ("Web Server", "Nginx Alpine (1.31.x)", "Production-ready lightweight web server hosting static assets"),
        ("Git", "Git 2.56.0 for Windows", "Local source code tracking, branching, and commit history"),
        ("GitHub", "Cloud Repository (Public)", "Centralized source repository: bala2006r/DevopsLab"),
        ("Docker", "Docker Desktop 29.8.2", "Container engine, image packaging, and runtime isolation"),
        ("Jenkins", "Jenkins 2.580.1", "CI/CD server automating checkout, tests, builds, and deploys"),
        ("Python / Pytest", "Python 3.11 / Pytest 8.x", "Automated test suite validating file integrity and structure"),
        ("Ansible", "Ansible Core 2.21.0 / 14.x", "Configuration management & container deployment playbook"),
        ("Docker Volume", "attendance_data (local driver)", "Persistent storage mounted to container data directory")
    ]
    t_tech = doc.add_table(rows=len(tech_data), cols=3)
    t_tech.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_tech)
    for r_i, row in enumerate(tech_data):
        for c_i, text in enumerate(row):
            cell = t_tech.cell(r_i, c_i)
            cell.text = text
            set_cell_margins(cell, top=50, bottom=50, left=70, right=70)
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER if c_i == 1 else WD_ALIGN_PARAGRAPH.LEFT
            for run in p.runs:
                run.font.name = 'Times New Roman'
                run.font.size = Pt(9.5)
                if r_i == 0:
                    run.font.bold = True
            if r_i == 0:
                set_cell_background(cell, "E5E7EB")

    t_tech.columns[0].width = Inches(1.8)
    t_tech.columns[1].width = Inches(2.0)
    t_tech.columns[2].width = Inches(2.7)

    doc.add_page_break()

    # ----------------------------------------------------
    # 5. SYSTEM ARCHITECTURE
    # ----------------------------------------------------
    add_heading_1(doc, "5. SYSTEM ARCHITECTURE")
    add_paragraph(doc, 
        'The architecture of AttendFlow integrates modern front-end engineering with an automated DevOps pipeline. Every commit pushed to the GitHub repository automatically triggers or feeds into a sequential series of stages that build, test, and deploy the application.',
        space_after=8)
    
    for stage_desc in [
        "1. Development & Version Control: The developer edits HTML5, CSS3, and JavaScript files locally and commits them using Git before pushing to GitHub (bala2006r/DevopsLab).",
        "2. Continuous Integration Trigger: Jenkins detects or pulls code from GitHub and launches a Declarative Pipeline.",
        "3. Automated Testing Stage: Jenkins launches an isolated Python container to execute test_app.py, verifying file existence, syntax validity, and required DOM elements.",
        "4. Container Image Build: Jenkins executes 'docker build -t attendance-app:latest .' to create the Nginx container image.",
        "5. Ansible Automated Deployment: An Ansible playbook (docker-deploy.yml) executed inside ansible-docker-lab coordinates the stopping of obsolete containers and runs the new attendance-ansible container.",
        "6. Persistent Data & Runtime Access: The running container binds to host port 8086 and mounts persistent Docker Volume attendance_data."
    ]:
        add_bullet(doc, stage_desc)

    # Insert Architecture Diagram
    add_image_figure(doc, "Screenshots/architecture_diagram.jpg", "Figure 5.1: AttendFlow End-to-End DevOps System Architecture Diagram", width_inches=6.2)

    doc.add_page_break()

    # ----------------------------------------------------
    # MODULES
    # ----------------------------------------------------
    add_heading_1(doc, "MODULE 1 - USER INTERFACE & PRODUCTIVITY OVERVIEW")
    add_paragraph(doc, 
        'This module delivers the core user interface of AttendFlow. Designed with modern aesthetics including glassmorphism cards, dynamic gradients, smooth micro-animations, and a circular progress ring, it provides a pleasant and motivating productivity environment.',
        space_after=8)
    add_heading_2(doc, "Main Features")
    for feat in [
        "Dynamic Greeting & Date Badge: Displays current date and contextual greetings based on time of day.",
        "Circular Progress Analytics: Computes completed vs. pending tasks in real time and updates an interactive SVG progress ring.",
        "Dual Theme Engine: Seamless toggle between crisp Light Mode and sleek OLED Dark Mode.",
        "Interactive Audio Feedback & Confetti: Congratulates users upon task completion."
    ]:
        add_bullet(doc, feat)

    add_image_figure(doc, "Screenshots/Web1.png", "Figure 7.1: AttendFlow Attendance Dashboard & Overview Metrics", width_inches=6.0)
    add_image_figure(doc, "Screenshots/Web2.png", "Figure 7.2: AttendFlow Daily Roll Call Grid View & Attendance Status Selectors", width_inches=6.0)

    doc.add_page_break()

    add_heading_1(doc, "MODULE 2 - TASK MANAGEMENT & INTERACTIVE CONTROLS")
    add_paragraph(doc, 
        'This module manages task creation, modification, categorization, due dates, priority assignments, search filtering, and state transitions.',
        space_after=8)
    add_heading_2(doc, "Main Features")
    for feat in [
        "Smart Task Creation: Input field with priority selector (Low, Med, High), category badges (Health, Work, Study, Personal, Shopping), and due date picker.",
        "Real-Time Search & Quick Filters: Filter tasks by All, Active, Completed, or Starred, plus text search with hotkey ('/' to focus).",
        "Action Menu: Batch operations including 'Mark all completed', 'Clear completed tasks', and 'Reset sample tasks'.",
        "JSON Backup & Restore: Instant export and import of tasks in structured JSON format."
    ]:
        add_bullet(doc, feat)

    add_image_figure(doc, "Screenshots/Web3.png", "Figure 7.3: Task Creation with Priority Tags and Due Date Picker", width_inches=6.0)
    add_image_figure(doc, "Screenshots/Web4.png", "Figure 7.4: Filtered Tasks View and Search Functionality", width_inches=6.0)
    add_image_figure(doc, "Screenshots/Web5.png", "Figure 7.5: Actions Menu, Batch Operations & JSON Import/Export", width_inches=6.0)

    doc.add_page_break()

    add_heading_1(doc, "MODULE 3 - LOCAL STORAGE & DATA PERSISTENCE")
    add_paragraph(doc, 
        'AttendFlow utilizes browser LocalStorage to maintain client-side persistence without requiring heavy backend database overhead for client operations. When coupled with Docker Volume persistent storage in the container, application state remains completely resilient.',
        space_after=8)
    add_heading_2(doc, "Data Structure Schema")
    add_paragraph(doc, 
        'Each task object is saved as a JSON record containing: id (timestamp), title (string), category (string), priority (Low|Med|High), dueDate (YYYY-MM-DD), completed (boolean), and starred (boolean). Data is automatically written to localStorage["attendflow_students"] on every mutation.',
        space_after=14)

    add_heading_1(doc, "MODULE 4 - GIT & GITHUB SOURCE CONTROL")
    add_paragraph(doc, 
        'Git is used locally to track modifications, maintain commit history, and configure branch policies. GitHub hosts the centralized public repository (https://github.com/bala2006r/DevopsLab.git) allowing automated checkout by Jenkins.',
        space_after=8)
    add_heading_2(doc, "Main Functions")
    for feat in [
        "Repository Initialization: Configured user identity (Pranesh0908), initialized local repository, and staged all project assets.",
        "Commit Integrity: Created meaningful semantic commit history for core features, pipeline definitions, tests, and configuration scripts.",
        "Remote Synchronization: Linked origin remote to GitHub and pushed to the main branch.",
        "DevOps Assets Tracking: Maintained Dockerfile, Jenkinsfile, test_app.py, docker-deploy.yml, inventory.ini, and .gitignore."
    ]:
        add_bullet(doc, feat)

    add_image_figure(doc, "Screenshots/Git1.png", "Figure 7.6: Local Git Identity Configuration and Initial Commit", width_inches=6.0)
    add_image_figure(doc, "Screenshots/Git2.png", "Figure 7.7: Git Remote Configuration and Branch Upstream Synchronization", width_inches=6.0)
    add_image_figure(doc, "Screenshots/Git3.png", "Figure 7.8: AttendFlow GitHub Remote Repository Overview (bala2006r/DevopsLab)", width_inches=6.0)

    doc.add_page_break()

    add_heading_1(doc, "MODULE 5 - DOCKER CONTAINERIZATION")
    add_paragraph(doc, 
        'Docker packages AttendFlow into a self-contained, portable container image using official Nginx Alpine. Static assets are served efficiently with minimal disk and memory footprint (~25 MB).',
        space_after=8)
    add_heading_2(doc, "Container Configuration")
    for conf in [
        "Base Image: nginx:alpine (lightweight production web server).",
        "Image Name: attendance-app:latest.",
        "Container Name: attendance-ansible / attendance-container.",
        "Port Mapping: 8086:80 (Host Port 8086 forwards to Nginx Port 80).",
        "Volume Mounting: attendance_data mounted to /usr/share/nginx/html/data."
    ]:
        add_bullet(doc, conf)

    add_image_figure(doc, "Screenshots/Docker1.png", "Figure 7.9: Docker Desktop Management Dashboard Showing Active Containers", width_inches=6.0)
    add_image_figure(doc, "Screenshots/Docker2.png", "Figure 7.10: Verification of Running AttendFlow Container via docker ps", width_inches=6.0)

    doc.add_page_break()

    add_heading_1(doc, "MODULE 6 - JENKINS CI/CD PIPELINE")
    add_paragraph(doc, 
        'Jenkins automates Continuous Integration and Continuous Deployment. The Jenkins Declarative Pipeline pulls code from GitHub, validates code integrity, builds the container image, deploys the application, and verifies health status.',
        space_after=8)
    add_heading_2(doc, "Pipeline Stages (Jenkinsfile)")
    for stg in [
        "Stage 1 - Checkout: Automatically clones the main branch from GitHub repository.",
        "Stage 2 - Automated Testing: Executes test_app.py inside a Python 3.11 container.",
        "Stage 3 - Docker Build: Executes 'docker build -t attendance-app:latest .'.",
        "Stage 4 - Docker Deploy: Stops obsolete container and runs new instance on port 8086.",
        "Stage 5 - Verification: Inspects container health with 'docker ps' and logs success."
    ]:
        add_bullet(doc, stg)

    add_image_figure(doc, "Screenshots/Jenkins1.png", "Figure 7.11: Jenkins Console Build Output Confirming SUCCESS", width_inches=6.0)
    add_image_figure(doc, "Screenshots/Jenkins2.png", "Figure 7.12: Jenkins Declarative Pipeline Stage View Execution (Started by Pranesh M)", width_inches=6.0)

    doc.add_page_break()

    add_heading_1(doc, "MODULE 7 - AUTOMATED TESTING")
    add_paragraph(doc, 
        'Automated testing is integrated into the Jenkins pipeline via test_app.py. Before any build or deployment proceeds, test_app.py verifies that index.html, style.css, and app.js exist and contain critical functional definitions (HTML5 doctype, CSS variables, and event listeners).',
        space_after=8)
    add_heading_2(doc, "Test Execution Summary")
    add_paragraph(doc, 
        'Command: docker run --rm -v "%WORKSPACE%":/app -w /app python:3.11-alpine python test_app.py\nResult: 3 passed in 0.12s [100% SUCCESS]. Deployment proceeds only when testing passes.',
        space_after=14)

    add_heading_1(doc, "MODULE 8 - ANSIBLE DEPLOYMENT")
    add_paragraph(doc, 
        'Ansible automates the deployment and configuration management of the AttendFlow container. The deployment is governed by docker-deploy.yml and executed through a dedicated management container (ansible-docker-lab) communicating directly with the Docker daemon.',
        space_after=8)
    add_heading_2(doc, "Playbook Specification (docker-deploy.yml)")
    for item in [
        "Play: Deploy AttendFlow Attendance Tracker Application with Docker.",
        "Task 1: Stop and remove existing containers (attendance-ansible, attendance-container).",
        "Task 2: Ensure persistent Docker volume (attendance_data) exists.",
        "Task 3: Run container with port mapping 8086:80, restart policy unless-stopped, and volume mounting.",
        "Task 4: Verify deployed container via docker ps.",
        "Task 5: Display deployment summary banner and status URL."
    ]:
        add_bullet(doc, item)

    add_image_figure(doc, "Screenshots/Ansible1.png", "Figure 7.13: Ansible Playbook Execution Output (PLAY RECAP: failed=0)", width_inches=6.0)
    add_image_figure(doc, "Screenshots/Ansible2.png", "Figure 7.14: Ansible Playbook Content Inspection and Container Status", width_inches=6.0)

    doc.add_page_break()

    add_heading_1(doc, "MODULE 9 - PERSISTENT STORAGE")
    add_paragraph(doc, 
        'Persistent storage separates data lifecycle from container lifecycle. Using a dedicated Docker Volume (attendance_data), application data remains fully preserved even when containers are stopped, removed, or upgraded.',
        space_after=8)
    add_heading_2(doc, "Storage Configuration")
    for item in [
        "Volume Name: attendance_data (Driver: local).",
        "Host Mountpoint: /var/lib/docker/volumes/attendance_data/_data.",
        "Container Mount Path: /usr/share/nginx/html/data (Mode: Read-Write).",
        "Verification: Verified via 'docker volume ls' and 'docker volume inspect attendance_data'."
    ]:
        add_bullet(doc, item)

    add_image_figure(doc, "Screenshots/PresistantStorage.png", "Figure 7.15: Docker Volume Inspection and Mount Verification (attendance_data)", width_inches=6.0)

    doc.add_page_break()

    add_heading_1(doc, "MODULE 10 - DATA EXPORT & ACTIONS MANAGEMENT")
    add_paragraph(doc, 
        'AttendFlow includes administrative controls for managing data integrity. Users can perform bulk operations such as clearing completed items, mass marking tasks, or downloading complete state dumps as JSON files for off-site backups.',
        space_after=14)

    add_heading_1(doc, "MODULE 11 - CI/CD INTEGRATION")
    add_paragraph(doc, 
        'This module synthesizes all DevOps tooling into a single automated pipeline: Git/GitHub handles version control, Jenkins orchestrates checkout and build triggers, Python executes pre-deployment testing, Docker packages the container, Ansible deploys the runtime environment, and Docker Volumes secure data persistence.',
        space_after=14)

    add_heading_1(doc, "MODULE 12 - APPLICATION & DEPLOYMENT VERIFICATION")
    add_paragraph(doc, 
        'Comprehensive multi-tier verification was conducted to confirm end-to-end functionality across all components:',
        space_after=6)
    for v in [
        "Container Runtime: Confirmed active container attendance-ansible via 'docker ps'.",
        "Port Accessibility: Verified port binding 0.0.0.0:8086->80/tcp.",
        "HTTP Endpoint: Verified HTTP/1.1 200 OK response from Nginx server.",
        "Browser UI: Tested attendance marking, roll calls, defaulter alerts, dark mode, and audio cues.",
        "Pipeline Success: Verified all Jenkins pipeline stages passed with green status.",
        "Ansible Playbook: Confirmed zero failures (failed=0) in playbook execution.",
        "Data Persistence: Verified Docker Volume attendance_data is mounted with read-write access."
    ]:
        add_bullet(doc, v)

    doc.add_page_break()

    # ----------------------------------------------------
    # 18. RESULTS & 19. COMMANDS USED
    # ----------------------------------------------------
    add_heading_1(doc, "18. RESULTS AND OUTPUT")
    add_paragraph(doc, 
        'The completed DevOps project successfully delivered all specified requirements:',
        space_after=6)
    for res in [
        "Feature-rich, responsive Attendance Tracker application with modern design and analytics.",
        "Centralized Git & GitHub version control repository with clean commit history.",
        "Automated Jenkins Declarative CI/CD pipeline with 5 sequential execution stages.",
        "Automated unit testing suite (test_app.py) validating application files.",
        "Lightweight Docker containerization (Nginx Alpine) providing isolated runtime.",
        "Ansible playbook automation orchestrating repeatable container deployment (failed=0).",
        "Persistent Docker Volume storage ensuring data safety across deployments."
    ]:
        add_bullet(doc, res)

    add_heading_1(doc, "19. COMMANDS USED")
    add_heading_2(doc, "1. Git Commands")
    for cmd in [
        "git init — Initialize local Git repository.",
        "git config --global user.name 'Pranesh0908' — Set Git username.",
        "git config --global user.email 'praneshmurugesan98@gmail.com' — Set Git email.",
        "git add . — Stage all application and configuration files.",
        "git commit -m 'Initial commit: AttendFlow Attendance Tracker application' — Commit changes.",
        "git branch -M main — Rename default branch to main.",
        "git remote add origin https://github.com/bala2006r/DevopsLab.git — Link remote repository.",
        "git push -u origin main — Push code to GitHub."
    ]:
        add_bullet(doc, cmd)

    add_heading_2(doc, "2. Docker Commands")
    for cmd in [
        "docker build -t attendance-app:latest . — Build Nginx container image.",
        "docker run -d -p 8086:80 --name attendance-container attendance-app:latest — Run container.",
        "docker ps — View active running containers.",
        "docker ps --filter 'name=attendance-container' — Filter specific container status.",
        "docker stop attendance-container && docker rm attendance-container — Stop and clean up container."
    ]:
        add_bullet(doc, cmd)

    add_heading_2(doc, "3. Ansible Commands")
    for cmd in [
        "docker run -d --name ansible-docker-lab -v //var/run/docker.sock:/var/run/docker.sock ansible-lab-image:latest — Start Ansible environment container.",
        "docker exec ansible-docker-lab ansible-playbook -i /inventory.ini /docker-deploy.yml — Execute deployment playbook.",
        "docker exec ansible-docker-lab cat /docker-deploy.yml — View playbook contents."
    ]:
        add_bullet(doc, cmd)

    add_heading_2(doc, "4. Persistent Storage (Docker Volume) Commands")
    for cmd in [
        "docker volume create attendance_data — Create persistent storage volume.",
        "docker volume ls — List all Docker volumes.",
        "docker volume inspect attendance_data — View volume mount point and details.",
        "docker inspect attendance-ansible --format '{{json .Mounts}}' — Verify container volume mount."
    ]:
        add_bullet(doc, cmd)

    doc.add_page_break()

    # ----------------------------------------------------
    # 20. ADVANTAGES to 23. CONCLUSION
    # ----------------------------------------------------
    add_heading_1(doc, "20. ADVANTAGES")
    for adv in [
        "Automated Delivery: Eliminates manual errors and reduces release overhead via Jenkins CI/CD.",
        "Container Isolation: Docker packages code and server into a standardized environment.",
        "Repeatable Deployment: Ansible ensures uniform, idempotent deployments across any environment.",
        "Data Resilience: Persistent volumes prevent data loss when updating or restarting containers.",
        "Rich User Experience: Responsive UI with category tags, audio cues, and real-time completion analytics.",
        "Lightweight Footprint: Nginx Alpine provides exceptional speed with minimal memory usage."
    ]:
        add_bullet(doc, adv)

    add_heading_1(doc, "21. LIMITATIONS")
    for lim in [
        "Current persistence relies on client localStorage and Nginx static volume storage.",
        "Multi-user server authentication and account synchronization are not yet integrated.",
        "CI/CD server runs on a local workstation rather than a distributed cloud cluster.",
        "Automated monitoring tools (e.g. Prometheus, Grafana) are not currently incorporated."
    ]:
        add_bullet(doc, lim)

    add_heading_1(doc, "22. FUTURE ENHANCEMENTS")
    for enh in [
        "User Authentication: Implement OAuth2 / JWT login for personalized task profiles.",
        "Backend Database: Integrate PostgreSQL or MongoDB with Node.js/Python API microservices.",
        "Cloud Hosting: Deploy containers on AWS ECS, Google Cloud Run, or Kubernetes cluster.",
        "Monitoring & Telemetry: Add Prometheus and Grafana for automated health telemetry.",
        "Webhook Triggering: Configure GitHub webhooks to trigger automatic builds upon push."
    ]:
        add_bullet(doc, enh)

    add_heading_1(doc, "23. CONCLUSION")
    add_paragraph(doc, 
        'The AttendFlow DevOps Laboratory project demonstrates a comprehensive implementation of modern web engineering united with industrial DevOps practices. The application provides an engaging, high-performance Attendance Tracker interface featuring productivity analytics, dynamic dark mode, and data export features.',
        space_after=8)
    add_paragraph(doc, 
        'Throughout the project, each phase of the DevOps lifecycle was systematically realized: Git and GitHub provided robust source code control; Jenkins orchestrated an automated CI/CD pipeline comprising automated testing, image construction, and container deployment; Docker packaged the application into an ultra-lightweight, isolated container; Ansible eliminated manual configuration through automated playbook execution; and Docker Volumes secured data durability across container recreations. The seamless integration of GitHub → Jenkins → Docker → Pytest → Ansible → Docker Volume conclusively validates the principles of Continuous Integration, Continuous Deployment, and Infrastructure Automation taught in 23IT723 - DevOps Laboratory.',
        space_after=14)

    # Save document
    out_path = "23IT723_Final_Project_Report_AttendFlow.docx"
    doc.save(out_path)
    print(f"Report generated successfully: {out_path}")

if __name__ == "__main__":
    build_report()
