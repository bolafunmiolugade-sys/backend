// Init & Navigation
document.addEventListener('DOMContentLoaded', () => {
    // 1. Initial State
    const adminEmail = localStorage.getItem('adminEmail');
    if (adminEmail) {
        document.getElementById('adminEmailDisplay').textContent = adminEmail;
    }
    
    // 2. Setup Navigation
    const navCoursesBtn = document.getElementById('navCoursesBtn');
    const navLecturersBtn = document.getElementById('navLecturersBtn');
    const navSchedulesBtn = document.getElementById('navSchedulesBtn');
    const navStudentsBtn = document.getElementById('navStudentsBtn');
    const navAttendanceBtn = document.getElementById('navAttendanceBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    
    const coursesSection = document.getElementById('coursesSection');
    const lecturersSection = document.getElementById('lecturersSection');
    const schedulesSection = document.getElementById('schedulesSection');
    const studentsSection = document.getElementById('studentsSection');
    const attendanceSection = document.getElementById('attendanceSection');

    function switchTab(tab) {
        [navCoursesBtn, navLecturersBtn, navSchedulesBtn, navStudentsBtn, navAttendanceBtn].forEach(btn => {
            if (btn) {
                btn.style.background = 'transparent';
                btn.style.color = 'var(--text-muted)';
            }
        });

        [coursesSection, lecturersSection, schedulesSection, studentsSection, attendanceSection].forEach(sec => {
            if (sec) sec.style.display = 'none';
        });

        if (tab === 'courses') {
            if (coursesSection) coursesSection.style.display = 'block';
            if (navCoursesBtn) {
                navCoursesBtn.style.background = 'rgba(255,255,255,0.05)';
                navCoursesBtn.style.color = 'var(--text-main)';
            }
            loadCourses();
        } else if (tab === 'lecturers') {
            if (lecturersSection) lecturersSection.style.display = 'block';
            if (navLecturersBtn) {
                navLecturersBtn.style.background = 'rgba(255,255,255,0.05)';
                navLecturersBtn.style.color = 'var(--text-main)';
            }
            loadLecturers();
        } else if (tab === 'schedules') {
            if (schedulesSection) schedulesSection.style.display = 'block';
            if (navSchedulesBtn) {
                navSchedulesBtn.style.background = 'rgba(255,255,255,0.05)';
                navSchedulesBtn.style.color = 'var(--text-main)';
            }
            loadAdminSchedules();
        } else if (tab === 'students') {
            if (studentsSection) studentsSection.style.display = 'block';
            if (navStudentsBtn) {
                navStudentsBtn.style.background = 'rgba(255,255,255,0.05)';
                navStudentsBtn.style.color = 'var(--text-main)';
            }
            loadStudents();
        } else {
            if (attendanceSection) attendanceSection.style.display = 'block';
            if (navAttendanceBtn) {
                navAttendanceBtn.style.background = 'rgba(255,255,255,0.05)';
                navAttendanceBtn.style.color = 'var(--text-main)';
            }
            loadAttendance();
        }
    }

    if (navCoursesBtn) navCoursesBtn.addEventListener('click', () => switchTab('courses'));
    if (navLecturersBtn) navLecturersBtn.addEventListener('click', () => switchTab('lecturers'));
    if (navSchedulesBtn) navSchedulesBtn.addEventListener('click', () => switchTab('schedules'));
    if (navStudentsBtn) navStudentsBtn.addEventListener('click', () => switchTab('students'));
    if (navAttendanceBtn) navAttendanceBtn.addEventListener('click', () => switchTab('attendance'));

    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // 3. Global Modal Click Handler
    window.onclick = (e) => {
        if (e.target.id === 'assignModal') {
            document.getElementById('assignModal').style.display = 'none';
        }
        if (e.target.id === 'detailModal') {
            document.getElementById('detailModal').style.display = 'none';
        }
        if (e.target.id === 'scheduleDetailModal') {
            document.getElementById('scheduleDetailModal').style.display = 'none';
        }
    };

    // 4. Initial Load
    loadCourses();
    loadDepartments();
});

// --- Courses Management ---

async function loadCourses() {
    const department = document.getElementById('courseDeptFilter')?.value;
    const level = document.getElementById('courseLevelFilter')?.value;
    
    let url = '/api/courses';
    const params = new URLSearchParams();
    if (department) params.append('department', department);
    if (level) params.append('level', level);
    if (params.toString()) url += `?${params.toString()}`;

    try {
        const response = await adminFetch(url);
        const data = await response.json();
        
        if (data.success) {
            const tbody = document.getElementById('courseTableBody');
            if (!tbody) return;
            tbody.innerHTML = '';
            document.getElementById('courseCount').textContent = `${data.courses.length} Courses`;
            
            data.courses.forEach(course => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${course.course_id}</td>
                    <td>${course.course_name}</td>
                    <td>${course.department || 'N/A'} (${course.department_code || 'N/A'})</td>
                    <td>${course.level || 'N/A'}</td>
                    <td>${course.lecturer_name || '<span style="color: var(--text-muted)">Unassigned</span>'}</td>
                    <td>${course.center_lat}, ${course.center_lon}</td>
                    <td>${course.radius_m}m</td>
                    <td>
                        <div style="display: flex; gap: 0.5rem;">
                            <button class="action-btn assign-btn" data-id="${course.course_id}" data-name="${course.course_name}" data-dept="${course.department}" title="Assign Lecturer">👤</button>
                            <button class="action-btn delete-course-btn" data-id="${course.course_id}" title="Delete">🗑️</button>
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });
// ... (rest of the function stays same, adding listeners below)

            document.querySelectorAll('.delete-course-btn').forEach(btn => {
                btn.addEventListener('click', () => deleteCourse(btn.getAttribute('data-id')));
            });
            document.querySelectorAll('.assign-btn').forEach(btn => {
                btn.addEventListener('click', () => openAssignModal(
                    btn.getAttribute('data-id'), 
                    btn.getAttribute('data-name'),
                    btn.getAttribute('data-dept')
                ));
            });
        }
    } catch (err) {
        console.error('Failed to load courses', err);
    }
}

document.getElementById('courseForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        course_id: document.getElementById('course_id').value,
        course_name: document.getElementById('course_name').value,
        department: document.getElementById('department').value,
        department_code: document.getElementById('department_code').value,
        center_lat: parseFloat(document.getElementById('center_lat').value),
        center_lon: parseFloat(document.getElementById('center_lon').value),
        radius_m: parseInt(document.getElementById('radius_m').value)
    };

    const btn = document.getElementById('createBtn');
    const msg = document.getElementById('courseMessage');
    
    btn.disabled = true;
    msg.style.display = 'none';

    try {
        const response = await adminFetch('/api/courses', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            msg.textContent = 'Course added successfully!';
            msg.style.color = '#4ade80';
            msg.style.display = 'block';
            document.getElementById('courseForm').reset();
            loadCourses();
        } else {
            const data = await response.json();
            msg.textContent = data.message || 'Failed to add course';
            msg.style.color = 'var(--error-red)';
            msg.style.display = 'block';
        }
    } catch (err) {
        msg.textContent = 'Error connecting to server';
        msg.style.display = 'block';
    } finally {
        btn.disabled = false;
    }
});

async function deleteCourse(id) {
    if (!confirm(`Are you sure you want to delete ${id}?`)) return;

    try {
        const response = await adminFetch(`/api/courses/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            loadCourses();
        } else {
            alert('Failed to delete course');
        }
    } catch (err) {
        alert('Connection error');
    }
}

// --- Lecturer & Assignment ---

let lecturersData = [];

async function loadLecturers() {
    try {
        const response = await adminFetch('/api/admin/lecturers');
        const data = await response.json();
        
        if (data.success) {
            lecturersData = data.lecturers;
            displayLecturers(lecturersData);
            populateLecturerSelect(lecturersData);
        }
    } catch (err) {
        console.error('Failed to load lecturers', err);
    }
}

function displayLecturers(lecturers) {
    const tbody = document.getElementById('lecturerTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    document.getElementById('lecturerCount').textContent = `${lecturers.length} Lecturers`;
    
    lecturers.forEach(l => {
        const tr = document.createElement('tr');
        const courseNames = l.courses.length > 0 
            ? l.courses.map(c => `<span class="status-badge" style="background: rgba(255,255,255,0.1); margin-bottom: 0.2rem; display: inline-block;">${c.course_id}</span>`).join(' ')
            : '<span style="color: var(--text-muted)">No courses assigned</span>';
            
        tr.innerHTML = `
            <td>${l.full_name}</td>
            <td>${l.email}</td>
            <td>${l.department}</td>
            <td>${courseNames}</td>
        `;
        tbody.appendChild(tr);
    });
}

function populateLecturerSelect(lecturers) {
    const select = document.getElementById('lecturer_select');
    if (!select) return;
    
    while (select.options.length > 2) {
        select.remove(2);
    }
    
    lecturers.forEach(l => {
        const opt = document.createElement('option');
        opt.value = l.id;
        opt.textContent = `${l.full_name} (${l.department})`;
        select.appendChild(opt);
    });
}

async function openAssignModal(courseId, courseName, department) {
    const modal = document.getElementById('assignModal');
    if (!modal) return;
    
    document.getElementById('assign_course_id').value = courseId;
    document.getElementById('assignCourseName').textContent = `Assigning lecturer for: ${courseName} (${courseId})`;
    
    // Clear and show loading state
    const select = document.getElementById('lecturer_select');
    if (select) {
        while (select.options.length > 2) select.remove(2);
        const loadingOpt = document.createElement('option');
        loadingOpt.textContent = 'Loading lecturers...';
        loadingOpt.disabled = true;
        select.appendChild(loadingOpt);
    }
    
    modal.style.display = 'flex';

    try {
        // Fetch lecturers for this specific department
        const response = await adminFetch(`/api/admin/lecturers?department=${encodeURIComponent(department)}`);
        const data = await response.json();
        
        if (data.success) {
            populateLecturerSelect(data.lecturers);
        } else {
            console.error('Failed to load lecturers for department');
        }
    } catch (err) {
        console.error('Error fetching lecturers', err);
    }
}

document.getElementById('closeAssignModal')?.addEventListener('click', () => {
    document.getElementById('assignModal').style.display = 'none';
});

document.getElementById('assignForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const courseId = document.getElementById('assign_course_id').value;
    const lecturerId = document.getElementById('lecturer_select').value;
    
    try {
        const response = await adminFetch(`/api/admin/courses/${courseId}/assign`, {
            method: 'POST',
            body: JSON.stringify({ lecturer_id: lecturerId === 'null' ? null : lecturerId })
        });
        
        if (response.ok) {
            document.getElementById('assignModal').style.display = 'none';
            loadCourses();
        } else {
            const data = await response.json();
            alert(data.message || 'Assignment failed');
        }
    } catch (err) {
        alert('Connection error');
    }
});

// --- Schedules Management ---

async function loadAdminSchedules() {
    const department = document.getElementById('mainSchedDeptFilter')?.value;
    const level = document.getElementById('mainSchedLevelFilter')?.value;

    let url = '/api/admin/schedules';
    const params = new URLSearchParams();
    if (department) params.append('department', department);
    if (level) params.append('level', level);
    if (params.toString()) url += `?${params.toString()}`;

    try {
        const response = await adminFetch(url);
        const data = await response.json();
        if (data.success) {
            displayAdminSchedules(data.schedules);
        }
    } catch (err) {
        console.error('Failed to load admin schedules', err);
    }
}

function displayAdminSchedules(schedules) {
    const tbody = document.getElementById('scheduleTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    document.getElementById('scheduleCount').textContent = `${schedules.length} Schedules`;

    schedules.forEach(s => {
        const tr = document.createElement('tr');
        const reg = parseInt(s.registered_count) || 0;
        const present = parseInt(s.present_count) || 0;
        const absent = Math.max(0, reg - present);

        const startTime = new Date(s.class_start_time).toLocaleString();
        const endTime = new Date(s.class_end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        tr.innerHTML = `
            <td>${s.course_code}</td>
            <td>${s.course_name || 'N/A'}</td>
            <td>${s.department || 'N/A'}</td>
            <td>${s.level || 'N/A'}</td>
            <td>${s.lecturer_name || 'N/A'}</td>
            <td>${reg}</td>
            <td style="color: #4ade80; font-weight: 600;">${present}</td>
            <td style="color: #f87171; font-weight: 600;">${absent}</td>
            <td>
                <button class="action-btn sched-detail-btn" 
                        data-id="${s.id}" 
                        data-code="${s.course_code}" 
                        data-name="${s.course_name}" 
                        title="View Attendance Flow">👁️</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    document.querySelectorAll('.sched-detail-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            viewScheduleDetails(
                btn.getAttribute('data-id'), 
                btn.getAttribute('data-code'),
                btn.getAttribute('data-name')
            );
        });
    });
}

let currentSchedId = null;
let currentSchedCode = null;
let currentSchedName = null;

async function viewScheduleDetails(id, courseCode, courseName) {
    currentSchedId = id;
    currentSchedCode = courseCode;
    currentSchedName = courseName;
    
    // Reset filters when opening new schedule
    const lvlFilter = document.getElementById('schedLevelFilter');
    const deptFilter = document.getElementById('schedDeptFilter');
    if (lvlFilter) lvlFilter.value = '';
    if (deptFilter) deptFilter.value = '';

    await fetchAndDisplayScheduleDetails();
}

async function fetchAndDisplayScheduleDetails() {
    if (!currentSchedId) return;

    const level = document.getElementById('schedLevelFilter')?.value;
    const department = document.getElementById('schedDeptFilter')?.value;
    
    let url = `/api/admin/schedules/${currentSchedId}/details?course_code=${encodeURIComponent(currentSchedCode)}`;
    if (level) url += `&level=${level}`;
    if (department) url += `&department=${encodeURIComponent(department)}`;

    try {
        const response = await adminFetch(url);
        const data = await response.json();
        if (data.success) {
            displayScheduleDetails(data.details, currentSchedCode, currentSchedName);
        }
    } catch (err) {
        console.error(err);
        alert('Failed to load schedule details');
    }
}

function displayScheduleDetails(details, code, name) {
    const modal = document.getElementById('scheduleDetailModal');
    const tbody = document.getElementById('schedDetailTableBody');
    if (!modal || !tbody) return;

    document.getElementById('schedDetailTitle').textContent = `Attendance List: ${code}`;
    document.getElementById('schedDetailSubtitle').textContent = name;
    
    tbody.innerHTML = '';
    details.forEach(d => {
        const tr = document.createElement('tr');
        const status = d.status || 'ABSENT';
        const statusClass = status === 'VALID' ? 'status-active' : (status === 'ABSENT' ? 'status-inactive' : '');
        const markedAt = d.marked_at ? new Date(d.marked_at).toLocaleTimeString() : '-';
        const distance = d.distance_m ? `${d.distance_m}m` : '-';

        tr.innerHTML = `
            <td>${d.full_name}</td>
            <td>${d.matric_number}</td>
            <td>${d.department || 'N/A'}</td>
            <td>${d.level || 'N/A'}</td>
            <td><span class="status-badge ${statusClass}">${status}</span></td>
            <td>${markedAt}</td>
            <td>${distance}</td>
        `;
        tbody.appendChild(tr);
    });

    modal.style.display = 'flex';
}

document.getElementById('closeSchedDetailModal')?.addEventListener('click', () => {
    document.getElementById('scheduleDetailModal').style.display = 'none';
});

document.getElementById('schedLevelFilter')?.addEventListener('change', fetchAndDisplayScheduleDetails);
document.getElementById('schedDeptFilter')?.addEventListener('change', fetchAndDisplayScheduleDetails);

async function loadDepartments() {
    try {
        const response = await adminFetch('/api/admin/departments');
        const data = await response.json();
        if (data.success) {
            populateDepartmentSelects(data.departments);
        }
    } catch (err) {
        console.error('Failed to load departments', err);
    }
}

function populateDepartmentSelects(departments) {
    const mainSelect = document.getElementById('mainSchedDeptFilter');
    const detailSelect = document.getElementById('schedDeptFilter');
    const courseSelect = document.getElementById('courseDeptFilter');
    const studentSelect = document.getElementById('deptFilter');
    const attendanceSelect = document.getElementById('attendanceDeptFilter');
    
    [mainSelect, detailSelect, courseSelect, studentSelect, attendanceSelect].forEach(select => {
        if (!select) return;
        // Keep the first "All" option
        while (select.options.length > 1) {
            select.remove(1);
        }
        departments.forEach(dept => {
            const opt = document.createElement('option');
            opt.value = dept;
            opt.textContent = dept;
            select.appendChild(opt);
        });
    });
}

// --- Students Management ---

async function loadStudents() {
    const level = document.getElementById('levelFilter')?.value;
    const department = document.getElementById('deptFilter')?.value;
    
    let url = '/api/admin/students';
    const params = new URLSearchParams();
    if (level) params.append('level', level);
    if (department) params.append('department', department);
    if (params.toString()) url += `?${params.toString()}`;

    try {
        const response = await adminFetch(url);
        const data = await response.json();
        if (data.success) {
            displayStudents(data.students);
        }
    } catch (err) {
        console.error('Failed to load students', err);
    }
}

function displayStudents(students) {
    const tbody = document.getElementById('studentTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    document.getElementById('studentCount').textContent = `${students.length} Students`;
    
    students.forEach(s => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${s.full_name}</td>
            <td>${s.matric_number}</td>
            <td>${s.email}</td>
            <td>${s.level}</td>
            <td>${s.department}</td>
        `;
        tbody.appendChild(tr);
    });
}

// --- Attendance Management ---

let attendanceData = [];

async function loadAttendance() {
    const level = document.getElementById('attendanceLevelFilter')?.value;
    const department = document.getElementById('attendanceDeptFilter')?.value;

    let url = '/api/admin/attendance';
    const params = new URLSearchParams();
    if (level) params.append('level', level);
    if (department) params.append('department', department);
    if (params.toString()) url += `?${params.toString()}`;

    try {
        const response = await adminFetch(url);
        const data = await response.json();
        
        if (data.success) {
            attendanceData = data.attendance;
            displayAttendance(attendanceData);
        }
    } catch (err) {
        console.error('Failed to load attendance', err);
    }
}

function displayAttendance(data) {
    const tbody = document.getElementById('attendanceTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    document.getElementById('attendanceCount').textContent = `${data.length} Records`;
    
    data.forEach(log => {
        const tr = document.createElement('tr');
        const statusClass = log.status === 'VALID' ? 'status-active' : 'status-inactive';
        const dateStr = log.log_date ? new Date(log.log_date).toLocaleDateString() : 'N/A';
        tr.innerHTML = `
            <td>${log.student_name || 'Unknown User'}</td>
            <td>${log.matric_number}</td>
            <td>${log.course_name || 'Unknown Course'} (${log.course_id})</td>
            <td><span class="status-badge ${statusClass}">${log.status}</span></td>
            <td>${dateStr}</td>
            <td>${log.distance_m}m</td>
            <td>
                <button class="action-btn detail-btn" data-id="${log.log_id || log.id}" title="Details">👁️</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    document.querySelectorAll('.detail-btn').forEach(btn => {
        btn.addEventListener('click', () => showAttendanceDetails(btn.getAttribute('data-id')));
    });
}

async function showAttendanceDetails(logId) {
    if (!logId) return;
    try {
        const response = await adminFetch(`/api/admin/attendance/${logId}`);
        const data = await response.json();
        if (data.success) {
            const log = data.attendance;
            const detailModal = document.getElementById('detailModal');
            const content = document.getElementById('modalContent');
            
            if (detailModal && content) {
                content.innerHTML = `
                    <div><strong>Student:</strong> ${log.student_name || 'N/A'}</div>
                    <div><strong>Matric No:</strong> ${log.matric_number}</div>
                    <div><strong>Course:</strong> ${log.course_name} (${log.course_id})</div>
                    <div><strong>Status:</strong> ${log.status}</div>
                    <div><strong>Date:</strong> ${new Date(log.log_date).toLocaleDateString()}</div>
                    <div><strong>Distance:</strong> ${log.distance_m}m</div>
                    <div><strong>Accuracy:</strong> ${log.accuracy_m}m</div>
                    <div><strong>Device UUID:</strong> ${log.device_uuid || 'N/A'}</div>
                    <div><strong>Schedule ID:</strong> ${log.schedule_id || 'N/A'}</div>
                `;
                detailModal.style.display = 'flex';
            }
        }
    } catch (err) {
        console.error(err);
    }
}

document.getElementById('closeModal')?.addEventListener('click', () => {
    document.getElementById('detailModal').style.display = 'none';
});

// --- Listeners & Utils ---

document.getElementById('levelFilter')?.addEventListener('change', loadStudents);
document.getElementById('deptFilter')?.addEventListener('change', loadStudents);

document.getElementById('courseLevelFilter')?.addEventListener('change', loadCourses);
document.getElementById('courseDeptFilter')?.addEventListener('change', loadCourses);

document.getElementById('lecturerSearch')?.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filtered = lecturersData.filter(l => 
        l.full_name.toLowerCase().includes(searchTerm) || 
        l.email.toLowerCase().includes(searchTerm) ||
        l.department.toLowerCase().includes(searchTerm)
    );
    displayLecturers(filtered);
});

document.getElementById('mainSchedLevelFilter')?.addEventListener('change', loadAdminSchedules);
document.getElementById('mainSchedDeptFilter')?.addEventListener('change', loadAdminSchedules);

document.getElementById('attendanceSearch')?.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filtered = attendanceData.filter(log => 
        log.matric_number.toLowerCase().includes(searchTerm) || 
        log.student_name?.toLowerCase().includes(searchTerm) ||
        log.course_id.toLowerCase().includes(searchTerm)
    );
    displayAttendance(filtered);
});

document.getElementById('attendanceLevelFilter')?.addEventListener('change', loadAttendance);
document.getElementById('attendanceDeptFilter')?.addEventListener('change', loadAttendance);

function debounce(func, wait) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}
