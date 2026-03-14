// Init
document.addEventListener('DOMContentLoaded', () => {
    const adminEmail = localStorage.getItem('adminEmail');
    if (adminEmail) {
        document.getElementById('adminEmailDisplay').textContent = adminEmail;
    }
    loadCourses();
});

// Load Courses
async function loadCourses() {
    try {
        const response = await fetch('/api/courses');
        const data = await response.json();
        
        if (data.success) {
            const tbody = document.getElementById('courseTableBody');
            tbody.innerHTML = '';
            document.getElementById('courseCount').textContent = `${data.courses.length} Courses`;
            
            data.courses.forEach(course => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${course.course_id}</td>
                    <td>${course.course_name}</td>
                    <td>${course.center_lat}, ${course.center_lon}</td>
                    <td>${course.radius_m}m</td>
                    <td>
                        <button class="action-btn delete-course-btn" data-id="${course.course_id}" title="Delete">🗑️</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });

            // Add event listeners to delete buttons
            document.querySelectorAll('.delete-course-btn').forEach(btn => {
                btn.addEventListener('click', () => deleteCourse(btn.getAttribute('data-id')));
            });
        }
    } catch (err) {
        console.error('Failed to load courses', err);
    }
}

// Create Course
document.getElementById('courseForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        course_id: document.getElementById('course_id').value,
        course_name: document.getElementById('course_name').value,
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

// Delete Course
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

// Attendance Record Management
let attendanceData = [];

async function loadAttendance() {
    try {
        const response = await adminFetch('/api/admin/attendance');
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
    if (!logId) {
        alert("No Log ID found for this record.");
        return;
    }
    try {
        const response = await adminFetch(`/api/admin/attendance/${logId}`);
        const data = await response.json();
        if (data.success) {
            const log = data.attendance;
            const modal = document.getElementById('detailModal');
            const content = document.getElementById('modalContent');
            
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
            
            modal.style.display = 'flex';
        } else {
            alert(data.message || "Failed to load details");
        }
    } catch (err) {
        console.error(err);
        alert("Error loading details");
    }
}

document.getElementById('closeModal')?.addEventListener('click', () => {
    document.getElementById('detailModal').style.display = 'none';
});

window.onclick = (e) => {
    if (e.target.id === 'detailModal') {
        document.getElementById('detailModal').style.display = 'none';
    }
};

// Student Management
async function loadStudents() {
    const level = document.getElementById('levelFilter').value;
    const department = document.getElementById('deptFilter').value;
    
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

document.getElementById('levelFilter')?.addEventListener('change', loadStudents);
document.getElementById('deptFilter')?.addEventListener('input', debounce(loadStudents, 500));

function debounce(func, wait) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Search Attendance
document.getElementById('attendanceSearch')?.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filtered = attendanceData.filter(log => 
        log.matric_number.toLowerCase().includes(searchTerm) || 
        log.student_name?.toLowerCase().includes(searchTerm) ||
        log.course_id.toLowerCase().includes(searchTerm)
    );
    displayAttendance(filtered);
});

// Navigation Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    const navCoursesBtn = document.getElementById('navCoursesBtn');
    const navStudentsBtn = document.getElementById('navStudentsBtn');
    const navAttendanceBtn = document.getElementById('navAttendanceBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    
    const coursesSection = document.getElementById('coursesSection');
    const studentsSection = document.getElementById('studentsSection');
    const attendanceSection = document.getElementById('attendanceSection');

    function switchTab(tab) {
        // Reset all buttons
        [navCoursesBtn, navStudentsBtn, navAttendanceBtn].forEach(btn => {
            if (btn) {
                btn.style.background = 'transparent';
                btn.style.color = 'var(--text-muted)';
            }
        });

        // Hide all sections
        [coursesSection, studentsSection, attendanceSection].forEach(sec => {
            if (sec) sec.style.display = 'none';
        });

        if (tab === 'courses') {
            coursesSection.style.display = 'block';
            navCoursesBtn.style.background = 'rgba(255,255,255,0.05)';
            navCoursesBtn.style.color = 'var(--text-main)';
            loadCourses();
        } else if (tab === 'students') {
            studentsSection.style.display = 'block';
            navStudentsBtn.style.background = 'rgba(255,255,255,0.05)';
            navStudentsBtn.style.color = 'var(--text-main)';
            loadStudents();
        } else {
            attendanceSection.style.display = 'block';
            navAttendanceBtn.style.background = 'rgba(255,255,255,0.05)';
            navAttendanceBtn.style.color = 'var(--text-main)';
            loadAttendance();
        }
    }

    if (navCoursesBtn) navCoursesBtn.addEventListener('click', () => switchTab('courses'));
    if (navStudentsBtn) navStudentsBtn.addEventListener('click', () => switchTab('students'));
    if (navAttendanceBtn) navAttendanceBtn.addEventListener('click', () => switchTab('attendance'));

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (typeof logout === 'function') logout();
            else {
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminEmail');
                window.location.href = 'index.html';
            }
        });
    }
});
