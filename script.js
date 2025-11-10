// ตัวแปรสำหรับเก็บข้อมูล
let tasks = JSON.parse(localStorage.getItem('studentTasks')) || [];
let subjectsList = []; // สร้างตัวแปรไว้เก็บวิชา
let currentEditingId = null; 

// (ลบฟังก์ชัน LINE ออกไปแล้ว)


// ========== ⬇️ ฟังก์ชันใหม่ (1/2): ขออนุญาตแจ้งเตือน ⬇️ ==========
function requestNotificationPermission() {
    if (!('Notification' in window)) {
        alert('เบราว์เซอร์นี้ไม่รองรับการแจ้งเตือน');
        return;
    }

    Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
            alert('✅ เปิดการแจ้งเตือนเรียบร้อย!');
            // ส่งการแจ้งเตือนทดสอบ
            showNotification('เปิดใช้งานสำเร็จ!', 'ตอนนี้คุณจะได้รับการแจ้งเตือนผ่านเบราว์เซอร์ครับ');
        } else if (permission === 'denied') {
            alert('❌ คุณปิดกั้นการแจ้งเตือนไว้');
        } else {
            alert('ℹ️ คุณยังไม่ได้อนุญาต (กดปิดไป)');
        }
    });
}
// ========== ⬆️ จบฟังก์ชัน ⬆️ ==========


// ========== ⬇️ ฟังก์ชันใหม่ (2/2): แสดงการแจ้งเตือน ⬇️ ==========
/**
 * แสดงการแจ้งเตือนผ่านเบราว์เซอร์
 * ถ้าไม่ได้รับอนุญาต จะ fallback ไปใช้ alert() ธรรมดา
 * @param {string} title - หัวข้อการแจ้งเตือน
 * @param {string} body - เนื้อหาการแจ้งเตือน
 */
function showNotification(title, body) {
    // เช็คว่าเคยขออนุญาตและได้รับ "อนุญาต" แล้วหรือยัง
    if (Notification.permission === 'granted') {
        // ถ้าใช่, สร้างการแจ้งเตือน
        new Notification(title, {
            body: body,
            icon: 'https://i.imgur.com/vP3eX5A.png' // ไอคอนหนังสือ
        });
    } else {
        // ถ้าไม่ (เพราะยังไม่กด, หรือกดปฏิเสธ)
        // ให้ใช้ alert() ธรรมดาแทน
        alert(title + "\n\n" + body);
    }
}
// ========== ⬆️ จบฟังก์ชัน ⬆️ ==========


// =========================================================================
// ✏️ ส่วนที่ได้รับการแก้ไข: ฟังก์ชันโหลดวิชา (รองรับข้อมูลที่ฝังใน HTML)
// =========================================================================
async function loadSubjects() {
    // 1. ตรวจสอบว่ามีตัวแปร SUBJECT_DATA ที่ฝังมาจาก index.html หรือไม่
    // (ตัวแปรนี้ถูกเพิ่มใน index.html เพื่อแก้ปัญหา CORS เมื่อเปิดไฟล์แบบ local)
    if (typeof SUBJECT_DATA !== 'undefined') {
        subjectsList = SUBJECT_DATA;
    } else {
        // 2. [Fallback]: ถ้าไม่มีข้อมูลฝังไว้ (เช่น ใน Production ที่ถูก Deploy แล้ว) 
        // ให้พยายาม Fetch ไฟล์ db.json ตามโค้ดเดิม
        try {
            const response = await fetch('db.json'); 
            if (!response.ok) {
                throw new Error('ไม่สามารถโหลดไฟล์ db.json ได้');
            }
            subjectsList = await response.json();
        } catch (error) {
            console.error('เกิดข้อผิดพลาดในการโหลดวิชา: ไม่พบข้อมูล SUBJECT_DATA หรือไม่สามารถ fetch db.json ได้', error);
            const subjectDropdown = document.getElementById('taskSubject');
            subjectDropdown.innerHTML = '<option value="other">ไม่พบรายวิชา (พิมพ์เอง)</option>';
            checkOtherSubject(subjectDropdown);
            return; // หยุดการทำงานถ้าโหลดไม่ได้จริงๆ
        }
    }

    // 3. แสดงผลใน Dropdown
    const subjectDropdown = document.getElementById('taskSubject');
    subjectDropdown.innerHTML = ''; 
    
    // เพิ่มตัวเลือกวิชาทั้งหมด
    subjectsList.forEach(subject => {
        const option = document.createElement('option');
        option.value = subject.name; 
        option.textContent = subject.name;
        subjectDropdown.appendChild(option);
    });
    
    // เพิ่มตัวเลือก "วิชาอื่นๆ (พิมพ์เอง)"
    const otherOption = document.createElement('option');
    otherOption.value = 'other';
    otherOption.textContent = 'วิชาอื่นๆ (พิมพ์เอง)';
    subjectDropdown.appendChild(otherOption);
}
// =========================================================================


// ฟังก์ชันสำหรับ Dropdown วิชา (เหมือนเดิม)
function checkOtherSubject(selectElement) {
    const otherInput = document.getElementById('taskSubjectOther');
    if (selectElement.value === 'other') {
        otherInput.style.display = 'block';
        otherInput.focus();
    } else {
        otherInput.style.display = 'none';
        otherInput.value = '';
    }
}

// อัพเดทสถิติ (เหมือนเดิม)
function updateStats() {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const pendingTasks = totalTasks - completedTasks;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); 

    const todayTasks = tasks.filter(t => {
        const dueDate = new Date(t.due + 'T00:00:00');
        dueDate.setHours(0, 0, 0, 0);
        return dueDate.getTime() === today.getTime() && !t.completed;
    }).length;

    const overdueTasks = tasks.filter(t => {
        const dueDate = new Date(t.due + 'T00:00:00');
        return dueDate < today && !t.completed;
    }).length;

document.getElementById('statsGrid').innerHTML = `
        <div class="stat-card stat-total">
            <div class="stat-number">${totalTasks}</div>
            <div class="stat-label">งานทั้งหมด</div>
        </div>
        <div class="stat-card stat-completed">
            <div class="stat-number">${completedTasks}</div>
            <div class="stat-label">เสร็จแล้ว</div>
        </div>
        <div class="stat-card stat-pending">
            <div class="stat-number">${pendingTasks}</div>
            <div class="stat-label">รอดำเนินการ</div>
        </div>
        <div class="stat-card stat-overdue">
            <div class="stat-number">${overdueTasks}</div>
            <div class="stat-label">เลยกำหนด</div>
        </div>
        <div class="stat-card stat-today">
            <div class="stat-number">${todayTasks}</div>
            <div class="stat-label">งานวันนี้</div>
        </div>
    `;
}

// เพิ่มงานใหม่ (แก้ไขให้รองรับการ Edit)
function addTask() {
    const name = document.getElementById('taskName').value.trim();
    const assignedOn = document.getElementById('taskAssignedOn').value;
    const due = document.getElementById('taskDue').value; 
    const priority = document.getElementById('taskPriority').value;
    const description = document.getElementById('taskDescription').value.trim();

    if (!name || !due) {
        alert('❌ กรุณากรอกข้อมูล "ชื่องาน" และ "วันส่ง/วันสอบ" ให้ครบ');
        return;
    }
    
    if (assignedOn === 'ไม่ระบุ') {
        alert('❌ กรุณาเลือก "วันที่สั่งงาน" ด้วยครับ (ช่องนี้บังคับกรอก)');
        return;
    }

    let subject = document.getElementById('taskSubject').value;
    if (subject === 'other') {
        subject = document.getElementById('taskSubjectOther').value.trim();
    }
    if (!subject) {
        subject = "(ไม่มีวิชา)"; 
    }

    // --- ตรรกะใหม่ ---
    if (currentEditingId !== null) {
        // โหมดแก้ไข: หางานเดิมแล้วอัปเดต
        const task = tasks.find(t => t.id === currentEditingId);
        if (task) {
            task.name = name;
            task.subject = subject;
            task.assignedOn = assignedOn;
            task.due = due;
            task.priority = priority;
            task.description = description;
        }
        alert('✅ แก้ไขงานเรียบร้อย!');
    } else {
        // โหมดเพิ่มใหม่: สร้างงานใหม่
        const newTask = {
            id: Date.now(),
            name: name,
            subject: subject,
            assignedOn: assignedOn, 
            due: due, 
            priority: priority,
            description: description,
            completed: false,
            createdAt: new Date().toISOString()
        };
        tasks.push(newTask);
        alert('✅ เพิ่มงานเรียบร้อย!');
    }
    // --- จบตรรกะใหม่ ---

    saveTasks();
    renderTasks();
    updateStats();
    clearForm(); // clearForm จะรีเซ็ต currentEditingId ให้เอง
}

// บันทึกงาน (เหมือนเดิม)
function saveTasks() {
    localStorage.setItem('studentTasks', JSON.stringify(tasks));
}

// ล้างฟอร์ม (แก้ไข)
function clearForm() {
    document.getElementById('taskName').value = '';
    
    const subjectDropdown = document.getElementById('taskSubject');
    if (subjectDropdown.options.length > 0) {
        subjectDropdown.value = subjectDropdown.options[0].value; 
    }
    document.getElementById('taskSubjectOther').value = '';
    document.getElementById('taskSubjectOther').style.display = 'none';
    document.getElementById('taskAssignedOn').value = 'ไม่ระบุ';
    document.getElementById('taskDue').value = ''; 
    document.getElementById('taskPriority').value = 'normal';
    document.getElementById('taskDescription').value = '';

    currentEditingId = null; 

    // ★★★ เพิ่ม 3 บรรทัดนี้ (จุดที่ 1/2) ★★★
    // (สลับปุ่มกลับเป็น "เพิ่มงาน" หลังจากบันทึกหรือล้างฟอร์ม)
    const submitButton = document.getElementById('submitTaskButton');
    submitButton.innerHTML = '➕ เพิ่มงาน';
    submitButton.classList.remove('btn-warning'); // (ลบสีเหลืองออก)
}

// แสดงงาน (เหมือนเดิม)
function renderTasks() {
    const tasksList = document.getElementById('tasksList');
    
    if (tasks.length === 0) {
        tasksList.innerHTML = `
            <div class="empty-state">
                <div class="icon">📝</div>
                <h3>ยังไม่มีงาน</h3>
                <p>เริ่มต้นด้วยการเพิ่มงานแรกของคุณ</p>
            </div>
        `;
        return;
    }

    const sortedTasks = [...tasks].sort((a, b) => {
        if (a.completed !== b.completed) {
            return a.completed ? 1 : -1;
        }
        const priorityOrder = { urgent: 3, important: 2, normal: 1 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return new Date(a.due + 'T00:00:00') - new Date(b.due + 'T00:00:00');
    });

    tasksList.innerHTML = sortedTasks.map(task => {
        const dueDate = new Date(task.due + 'T00:00:00');
        const today = new Date();
        today.setHours(0, 0, 0, 0); 
        
        const taskDueDate = new Date(task.due + 'T00:00:00');
        taskDueDate.setHours(0, 0, 0, 0);

        const isOverdue = taskDueDate < today && !task.completed;
        const isToday = taskDueDate.getTime() === today.getTime();
        
        let statusClass = '';
        let statusText = '';
        
        if (task.completed) {
            statusClass = 'completed';
            statusText = '<span class="status-badge status-completed">✅ เสร็จแล้ว</span>';
        } else if (isOverdue) {
            statusClass = 'overdue';
            statusText = '<span class="status-badge status-overdue">⚠️ เลยกำหนด</span>';
        } else if (task.priority === 'urgent') {
            statusClass = 'urgent';
            statusText = '<span class="status-badge status-urgent">🔴 เร่งด่วน</span>';
        } else {
            statusText = '<span class="status-badge status-pending">⏳ รอดำเนินการ</span>';
        }

        const assignedOnText = task.assignedOn && task.assignedOn !== 'ไม่ระบุ' 
            ? `🕒 สั่งงานเมื่อ: ${task.assignedOn}<br>` 
            : '';
            
        const subjectText = (task.subject && task.subject !== '(ไม่มีวิชา)')
            ? `<div class="task-subject">${task.subject}</div>`
            : ''; 

        return `
            <div class="task-item ${statusClass}">
                <div class="task-header">
                    <div class="task-title">${task.name}</div>
                    ${subjectText}
                </div>
                
                <div class="task-details">
                    ${assignedOnText} 
                    📅 วันส่ง: ${formatThaiDate(dueDate)} ${isToday && !task.completed ? '(วันนี้!)' : ''}
                    <br>
                    ⚡ ความสำคัญ: ${getPriorityText(task.priority)}
                    ${task.description ? `<div class="task-description">📋 ${task.description}</div>` : ''}
                </div>

                <div class="task-actions">
                    ${statusText}
                    <button class="btn btn-small ${task.completed ? 'btn-warning' : 'btn-success'}" 
                            onclick="toggleTaskComplete(${task.id})">
                        ${task.completed ? '↩️ ยกเลิก' : '✅ เสร็จแล้ว'}
                    </button>
                    <button class="btn btn-small btn-info" onclick="editTask(${task.id})">
                        ✏️ แก้ไข
                    </button>
                    <button class="btn btn-small btn-danger" onclick="deleteTask(${task.id})">
                        🗑️ ลบ
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// แปลงวันที่เป็นภาษาไทย (เหมือนเดิม)
function formatThaiDate(date) {
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        weekday: 'long'
    };
    return date.toLocaleDateString('th-TH', options); 
}


// แปลง priority เป็นข้อความ (เหมือนเดิม)
function getPriorityText(priority) {
    const priorities = {
        normal: '🟢 ปกติ',
        important: '🟡 สำคัญ',
        urgent: '🔴 เร่งด่วน'
    };
    return priorities[priority] || '🟢 ปกติ';
}

// เปลี่ยนสถานะงาน (เหมือนเดิม)
function toggleTaskComplete(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
        updateStats(); 
    }
}

// ลบงาน (เหมือนเดิม)
function deleteTask(taskId) {
    // เพิ่มการตรวจสอบว่ากำลังแก้ไขอยู่หรือไม่
    if (currentEditingId === taskId) {
        alert('❌ ไม่สามารถลบงานที่กำลังแก้ไขได้');
        return;
    }
    
    if (confirm('🗑️ คุณแน่ใจหรือไม่ที่จะลบงานนี้?')) {
        tasks = tasks.filter(t => t.id !== taskId);
        saveTasks();
        renderTasks();
        updateStats(); 
    }
}

// แก้ไขงาน (แก้ไข)
function editTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        // --- ส่วนที่ 1: เอาข้อมูลมาใส่ฟอร์ม (เหมือนเดิม) ---
        document.getElementById('taskName').value = task.name;
        
        const subjectDropdown = document.getElementById('taskSubject');
        const otherSubjectInput = document.getElementById('taskSubjectOther');
        const isKnownSubject = subjectsList.some(s => s.name === task.subject);

        if (isKnownSubject && task.subject !== '(ไม่มีวิชา)') {
            subjectDropdown.value = task.subject;
            otherSubjectInput.style.display = 'none';
        } else {
            subjectDropdown.value = 'other';
            otherSubjectInput.value = (task.subject === '(ไม่มีวิชา)') ? '' : task.subject;
            otherSubjectInput.style.display = 'block';
        }

        document.getElementById('taskAssignedOn').value = task.assignedOn || 'ไม่ระบุ';
        document.getElementById('taskDue').value = task.due; 
        document.getElementById('taskPriority').value = task.priority;
        document.getElementById('taskDescription').value = task.description || '';
        
        // --- ส่วนที่ 2: เปลี่ยนตรรกะใหม่ ---
        currentEditingId = taskId; 

        window.scrollTo(0, 0);
        document.getElementById('taskName').focus();

        // ★★★ เพิ่ม 3 บรรทัดนี้ (จุดที่ 2/2) ★★★
        // (สลับปุ่มเป็น "บันทึก" เมื่อกดแก้ไข)
        const submitButton = document.getElementById('submitTaskButton');
        submitButton.innerHTML = '💾 บันทึกการแก้ไข';
        submitButton.classList.add('btn-warning'); // (เพิ่มสีเหลืองให้ปุ่ม)
    }
}


// ========== ⬇️ ฟังก์ชันแจ้งเตือน (เหมือนเดิม) ⬇️ ==========

async function checkTodayTasks() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayTasks = tasks.filter(t => {
        const dueDate = new Date(t.due + 'T00:00:00'); 
        dueDate.setHours(0, 0, 0, 0);
        return dueDate.getTime() === today.getTime() && !t.completed;
    });

    const title = `📅 งานวันนี้ (${formatThaiDate(new Date())})`;
    let body;

    if (todayTasks.length === 0) {
        body = "🎉 ไม่มีงานที่ต้องส่งวันนี้! 😎";
    } else {
        body = `คุณมีงานที่ต้องส่งวันนี้ ${todayTasks.length} งาน\n`;
        todayTasks.forEach((task, index) => {
            body += `\n${index + 1}. ${task.name}`;
        });
        body += `\n\n💪 ไฟท์ๆ นะ!`;
    }
    showNotification(title, body); // <-- เรียกใช้ฟังก์ชันใหม่
}

async function checkUpcomingTasks() {
    const today = new Date();
    const next7Days = new Date(today);
    next7Days.setDate(today.getDate() + 7);

    const upcomingTasks = tasks.filter(t => {
        const dueDate = new Date(t.due + 'T00:00:00'); 
        return dueDate > today && dueDate <= next7Days && !t.completed;
    });

    const title = `📅 งานที่จะถึงกำหนด (7 วันข้างหน้า)`;
    let body;

    if (upcomingTasks.length === 0) {
        body = "🎉 ไม่มีงานที่จะถึงกำหนดในอีก 7 วันข้างหน้า!";
    } else {
        body = `มีงานที่จะถึงกำหนด ${upcomingTasks.length} งาน:\n`;
        upcomingTasks.forEach((task, index) => {
            const dueDate = new Date(task.due + 'T00:00:00');
            const daysLeft = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
            body += `\n${index + 1}. ${task.name} (เหลืออีก ${daysLeft} วัน)`;
        });
    }
    showNotification(title, body); // <-- เรียกใช้ฟังก์ชันใหม่
}

async function checkOverdueTasks() {
    const today = new Date();
    today.setHours(0, 0, 0, 0); 

    const overdueTasks = tasks.filter(t => {
        const dueDate = new Date(t.due + 'T00:00:00'); 
        return dueDate < today && !t.completed;
    });

    const title = `⚠️ งานที่เลยกำหนดแล้ว`;
    let body;

    if (overdueTasks.length === 0) {
        body = "🎉 ไม่มีงานที่เลยกำหนด! 👏";
    } else {
        body = `❗ มีงานที่เลยกำหนด ${overdueTasks.length} งาน:\n`;
        overdueTasks.forEach((task, index) => {
            body += `\n${index + 1}. ${task.name} (${task.subject})`;
        });
        body += `\n\n🚨 รีบจัดการงานเหล่านี้นะ!`;
    }
    showNotification(title, body); // <-- เรียกใช้ฟังก์ชันใหม่
}

async function sendWeeklySummary() {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const pendingTasks = totalTasks - completedTasks;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const overdueTasksCount = tasks.filter(t => new Date(t.due + 'T00:00:00') < today && !t.completed).length;

    const next7Days = new Date(today);
    next7Days.setDate(today.getDate() + 7);
    const upcomingTasksCount = tasks.filter(t => {
        const dueDate = new Date(t.due + 'T00:00:00');
        return dueDate > today && dueDate <= next7Days && !t.completed;
    }).length;

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const title = `📊 สรุปงานประจำสัปดาห์`;
    const body = `
• งานทั้งหมด: ${totalTasks} งาน
• เสร็จแล้ว: ${completedTasks} งาน (${completionRate}%)
• รอดำเนินการ: ${pendingTasks} งาน
• งานเลยกำหนด: ${overdueTasksCount} งาน
• งานที่จะถึงกำหนด (7 วัน): ${upcomingTasksCount} งาน

${completionRate >= 80 ? '🎉 คุณทำงานได้ดีมาก!' : 
  completionRate >= 60 ? '😊 ผลงานอยู่ในเกณฑ์ดี' : 
  '💪 ลุยต่อไป คุณทำได้!'}`;

    showNotification(title, body); // <-- เรียกใช้ฟังก์ชันใหม่
}
// ========== ⬆️ จบส่วนแจ้งเตือน ⬆️ ==========


// เริ่มต้นโปรแกรม (เหมือนเดิม)
document.addEventListener('DOMContentLoaded', function() {
    loadSubjects(); 
    renderTasks();
    updateStats();
    
    // เคลียร์ฟอร์ม เผื่อมีการรีเฟรชระหว่างแก้ไข
    clearForm(); 
});
