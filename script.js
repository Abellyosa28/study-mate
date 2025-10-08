document.addEventListener('DOMContentLoaded', () => {

    // Helper function to get data from localStorage
    const getFromLocalStorage = (key, defaultValue = []) => {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    };

    // Helper function to save data to localStorage
    const saveToLocalStorage = (key, data) => {
        localStorage.setItem(key, JSON.stringify(data));
    };

    // --- Theme Toggle Logic (Dark/Light Mode) ---
    const themeToggleBtn = document.getElementById('themeToggle');
    const applyTheme = (theme) => {
        document.body.classList.toggle('dark-mode', theme === 'dark');
        if (themeToggleBtn) {
            themeToggleBtn.innerHTML = theme === 'dark' ? '<i data-feather="sun"></i>' : '<i data-feather="moon"></i>';
            feather.replace(); // Re-initialize feather icons after changing
        }
    };

    if (themeToggleBtn) {
        let currentTheme = getFromLocalStorage('theme', 'light');
        applyTheme(currentTheme);

        themeToggleBtn.addEventListener('click', () => {
            currentTheme = currentTheme === 'light' ? 'dark' : 'light';
            saveToLocalStorage('theme', currentTheme);
            applyTheme(currentTheme);
        });
    }

    // --- LOGIKA HALAMAN LOGIN ---
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const users = getFromLocalStorage('users', []);

            const user = users.find(u => (u.username === username || u.email === username) && u.password === password);

            if (user) {
                alert('Login berhasil!');
                saveToLocalStorage('currentUser', { username: user.username, email: user.email }); // Save current user session
                window.location.href = 'utama.html';
            } else {
                alert('Username/Email atau password salah. Silakan coba lagi atau daftar.');
            }
        });
    }

    // --- LOGIKA HALAMAN REGISTRASI ---
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const username = document.getElementById('regUsername').value;
            const email = document.getElementById('regEmail').value;
            const password = document.getElementById('regPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            let users = getFromLocalStorage('users', []);

            if (password !== confirmPassword) {
                alert('Konfirmasi password tidak cocok.');
                return;
            }

            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{5,}$/;
            if (!passwordRegex.test(password)) {
                alert('Password harus minimal 5 karakter dan mengandung kombinasi huruf besar, huruf kecil, dan angka.');
                return;
            }

            if (users.some(u => u.username === username)) {
                alert('Username sudah terdaftar. Gunakan username lain.');
                return;
            }
            if (users.some(u => u.email === email)) {
                alert('Email sudah terdaftar. Gunakan email lain.');
                return;
            }

            users.push({ username, email, password });
            saveToLocalStorage('users', users);
            alert('Pendaftaran berhasil! Silakan login.');
            window.location.href = 'login.html';
        });
    }

    // --- LOGIKA HALAMAN LUPA PASSWORD ---
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('forgotEmail').value;
            const users = getFromLocalStorage('users', []);

            const user = users.find(u => u.email === email);

            if (user) {
                const verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase();

                saveToLocalStorage('resetCode_' + email, { code: verificationCode, timestamp: Date.now() });

                alert(`Kode verifikasi telah dikirim ke ${email} (simulasi): ${verificationCode}`);
                window.location.href = `reset_password.html?email=${encodeURIComponent(email)}`;
            } else {
                alert('Email tidak terdaftar.');
                window.location.href = 'login.html';
            }
        });
    }

    // --- LOGIKA HALAMAN RESET PASSWORD ---
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    if (resetPasswordForm) {
        const urlParams = new URLSearchParams(window.location.search);
        const emailFromUrl = urlParams.get('email');

        if (!emailFromUrl) {
            alert('Link reset password tidak valid atau kedaluwarsa.');
            window.location.href = 'login.html';
            return;
        }

        document.getElementById('resetEmailDisplay').textContent = emailFromUrl;

        resetPasswordForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const verificationCodeInput = document.getElementById('verificationCode').value.toUpperCase();
            const newPassword = document.getElementById('newPassword').value;
            const confirmNewPassword = document.getElementById('confirmNewPassword').value;

            const storedResetData = getFromLocalStorage('resetCode_' + emailFromUrl);

            if (!storedResetData || verificationCodeInput !== storedResetData.code) {
                alert('Kode verifikasi salah atau kedaluwarsa.');
                return;
            }

            if (newPassword !== confirmNewPassword) {
                alert('Konfirmasi password baru tidak cocok.');
                return;
            }

            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{5,}$/;
            if (!passwordRegex.test(newPassword)) {
                alert('Password baru harus minimal 5 karakter dan mengandung kombinasi huruf besar, huruf kecil, dan angka.');
                return;
            }

            let users = getFromLocalStorage('users', []);
            const userIndex = users.findIndex(u => u.email === emailFromUrl);

            if (userIndex !== -1) {
                users[userIndex].password = newPassword;
                saveToLocalStorage('users', users);
                localStorage.removeItem('resetCode_' + emailFromUrl);

                alert('Password Anda berhasil diubah! Silakan login dengan password baru.');
                window.location.href = 'login.html';
            } else {
                alert('Terjadi kesalahan. Pengguna tidak ditemukan.');
                window.location.href = 'login.html';
            }
        });
    }


    // --- LOGIKA HALAMAN UTAMA (DASHBOARD) ---
    const tugasForm = document.getElementById('tugasForm');
    const belumDikerjakanList = document.getElementById('belumDikerjakanList');
    const prosesList = document.getElementById('prosesList');
    const selesaiList = document.getElementById('selesaiList');
    const notifikasiList = document.getElementById('notifikasiList'); // For future notifications
    const quizForm = document.getElementById('quizForm');
    const scoreResult = document.getElementById('score-result');
    const startTimerBtn = document.getElementById('startTimer');
    const resetTimerBtn = document.getElementById('resetTimer');
    const timerDisplay = document.getElementById('timer-display');
    const logoutButton = document.getElementById('logoutButton');
    const catatanTextarea = document.getElementById('catatan');
    const saveCatatanBtn = document.querySelector('#fullNotesSection .btn-primary');
    const viewCatatanBtn = document.getElementById('viewCatatan');
    const uploadRingkasanInput = document.getElementById('uploadRingkasan');

    // Dashboard Metric Elements
    const currentUserDisplay = document.getElementById('currentUserDisplay');
    const tasksDueSoonDisplay = document.getElementById('tasksDueSoon');
    const pomodorosTodayDisplay = document.getElementById('pomodorosToday');
    const notesCountDisplay = document.getElementById('notesCount');
    const incompleteTasksCountDisplay = document.getElementById('incompleteTasksCount');
    const completedTasksCountDisplay = document.getElementById('completedTasksCount');
    const quizzesCompletedCountDisplay = document.getElementById('quizzesCompletedCount');

    const currentUser = getFromLocalStorage('currentUser');
    if (document.querySelector('.dashboard-page')) {
        if (!currentUser || !currentUser.username) {
            alert('Anda harus login untuk mengakses dashboard.');
            window.location.href = 'login.html';
            return;
        } else {
            if (currentUserDisplay) {
                currentUserDisplay.textContent = currentUser.username;
            }
        }
    }

    // Tab Navigation Logic
    const tabItems = document.querySelectorAll('.dashboard-nav .tab-item');
    const tabContents = document.querySelectorAll('.tab-content');

    tabItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetTab = e.target.dataset.tab;

            tabItems.forEach(tab => tab.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            e.target.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
        });
    });

    // Function to calculate days remaining
    function getDaysRemaining(deadline) {
        const deadlineDate = new Date(deadline);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize today's date
        deadlineDate.setHours(0, 0, 0, 0); // Normalize deadline date

        const diffTime = deadlineDate.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // Function to render tasks and update metrics
    function renderTasks() {
        const tasks = getFromLocalStorage('tasks', {
            belumDikerjakan: [],
            proses: [],
            selesai: []
        });

        belumDikerjakanList.innerHTML = '';
        prosesList.innerHTML = '';
        selesaiList.innerHTML = '';
        if (notifikasiList) notifikasiList.innerHTML = ''; // Clear notifications (if used)

        let incompleteCount = 0;
        let completedCount = 0;

        ['belumDikerjakan', 'proses', 'selesai'].forEach(status => {
            tasks[status].forEach(task => {
                const li = document.createElement('li');
                li.setAttribute('draggable', true);
                li.dataset.id = task.id;
                li.dataset.status = status;

                let taskText = task.name;
                let deadlineText = task.deadline;
                let accentColorClass = '';

                if (status !== 'selesai') {
                    const daysRemaining = getDaysRemaining(task.deadline);

                    if (daysRemaining > 14) {
                        accentColorClass = 'deadline-H14-plus'; // Blue
                    } else if (daysRemaining >= 7 && daysRemaining <= 14) {
                        accentColorClass = 'deadline-H7'; // Orange
                    } else if (daysRemaining >= 3 && daysRemaining <= 6) {
                        accentColorClass = 'deadline-H3'; // Red
                    } else if (daysRemaining === 1) {
                        accentColorClass = 'deadline-H1'; // Dark Red
                    } else if (daysRemaining === 0) {
                        accentColorClass = 'deadline-TODAY'; // Orange for today's deadline
                        taskText += ' - DEADLINE HARI INI!';
                    } else if (daysRemaining < 0) {
                        accentColorClass = 'deadline-OVERDUE'; // Red for overdue
                        taskText += ' - DEADLINE TERLEWAT!';
                    }
                }

                li.classList.add(accentColorClass); // Add the calculated class

                // Add drag and drop listeners
                li.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('text/plain', li.dataset.id);
                    e.dataTransfer.effectAllowed = 'move';
                });

                const taskInfo = document.createElement('div');
                taskInfo.classList.add('task-info');
                taskInfo.innerHTML = `<span class="task-name">${taskText}</span> <span class="task-deadline-text">(${deadlineText})</span>`;
                li.appendChild(taskInfo);

                const taskActions = document.createElement('div');
                taskActions.classList.add('task-actions');

                if (status === 'belumDikerjakan') {
                    incompleteCount++;
                    const startButton = document.createElement('button');
                    startButton.classList.add('icon-btn');
                    startButton.innerHTML = '<i data-feather="play"></i>';
                    startButton.title = 'Mulai Kerjakan';
                    startButton.onclick = () => {
                        if (confirm(`Apakah kamu ingin mengerjakan tugas "${task.name}" sekarang?`)) {
                            moveTask(task.id, 'proses');
                        }
                    };
                    taskActions.appendChild(startButton);

                    const deleteButton = document.createElement('button');
                    deleteButton.classList.add('icon-btn');
                    deleteButton.innerHTML = '<i data-feather="trash-2"></i>';
                    deleteButton.title = 'Hapus Tugas';
                    deleteButton.onclick = () => {
                        if (confirm(`Apakah kamu yakin ingin menghapus tugas "${task.name}"?`)) {
                            deleteTask(task.id, status);
                        }
                    };
                    taskActions.appendChild(deleteButton);
                    belumDikerjakanList.appendChild(li);

                } else if (status === 'proses') {
                    incompleteCount++;
                    const doneButton = document.createElement('button');
                    doneButton.classList.add('icon-btn');
                    doneButton.innerHTML = '<i data-feather="check"></i>';
                    doneButton.title = 'Tandai Selesai';
                    doneButton.onclick = () => {
                        if (confirm(`Apakah tugas "${task.name}" sudah kamu selesaikan?`)) {
                            moveTask(task.id, 'selesai');
                            alert(`Selamat! Tugas "${task.name}" telah selesai!`);
                        }
                    };
                    taskActions.appendChild(doneButton);

                    const deleteButton = document.createElement('button');
                    deleteButton.classList.add('icon-btn');
                    deleteButton.innerHTML = '<i data-feather="trash-2"></i>';
                    deleteButton.title = 'Hapus Tugas';
                    deleteButton.onclick = () => {
                        if (confirm(`Apakah kamu yakin ingin menghapus tugas "${task.name}"?`)) {
                            deleteTask(task.id, status);
                        }
                    };
                    taskActions.appendChild(deleteButton);
                    prosesList.appendChild(li);
                } else { // status === 'selesai'
                    completedCount++;
                    li.classList.add('task-completed'); // Add a specific class for completed tasks
                    li.style.textDecoration = 'line-through';

                    const deleteButton = document.createElement('button');
                    deleteButton.classList.add('icon-btn');
                    deleteButton.innerHTML = '<i data-feather="trash-2"></i>';
                    deleteButton.title = 'Hapus Tugas';
                    deleteButton.onclick = () => {
                        if (confirm(`Apakah kamu yakin ingin menghapus tugas "${task.name}"?`)) {
                            deleteTask(task.id, status);
                        }
                    };
                    taskActions.appendChild(deleteButton);

                    selesaiList.appendChild(li);
                }
                li.appendChild(taskActions);
                feather.replace(); // Re-initialize feather icons for new buttons
            });
        });

        // Update Dashboard Metrics
        if (incompleteTasksCountDisplay) tasksDueSoonDisplay.textContent = `${incompleteCount} Tugas`; // Update "Tugas" total
        if (incompleteTasksCountDisplay) incompleteTasksCountDisplay.textContent = incompleteCount;
        if (completedTasksCountDisplay) completedTasksCountDisplay.textContent = completedCount;

        // Update notes count (assuming 'studyNotes' is a single string)
        const notesContent = getFromLocalStorage('studyNotes', '');
        if (notesCountDisplay) notesCountDisplay.textContent = notesContent.trim().length > 0 ? '1 Catatan' : '0 Catatan'; // Simplified count
    }

    // Function to move task between columns
    function moveTask(taskId, newStatus) {
        let tasks = getFromLocalStorage('tasks', {
            belumDikerjakan: [],
            proses: [],
            selesai: []
        });

        let taskFound = false;
        ['belumDikerjakan', 'proses', 'selesai'].forEach(status => {
            tasks[status] = tasks[status].filter(task => {
                if (task.id == taskId) {
                    task.status = newStatus;
                    tasks[newStatus].push(task);
                    taskFound = true;
                    return false; // Remove from old status list
                }
                return true;
            });
        });
        saveToLocalStorage('tasks', tasks);
        renderTasks();
        updateAllMetrics(); // Update all dashboard metrics after task change
    }

    // Function to delete task
    function deleteTask(taskId, currentStatus) {
        let tasks = getFromLocalStorage('tasks', {
            belumDikerjakan: [],
            proses: [],
            selesai: []
        });

        tasks[currentStatus] = tasks[currentStatus].filter(task => task.id != taskId);
        saveToLocalStorage('tasks', tasks);
        renderTasks();
        updateAllMetrics(); // Update all dashboard metrics after task deletion
    }


    // Function to handle drag over
    function handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        e.currentTarget.classList.add('dropzone'); // Add visual feedback
    }

    // Function to handle drag leave
    function handleDragLeave(e) {
        e.currentTarget.classList.remove('dropzone');
    }

    // Function to handle drop
    function handleDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('dropzone'); // Remove visual feedback
        const taskId = e.dataTransfer.getData('text/plain');
        const draggedElement = document.querySelector(`[data-id="${taskId}"]`);
        const targetList = e.currentTarget;
        const newStatus = targetList.id.replace('List', '');

        if (draggedElement && targetList) {
            if (draggedElement.dataset.status === newStatus) {
                return;
            }

            let confirmationMessage = '';
            const taskName = draggedElement.querySelector('.task-name').textContent.split(' - ')[0].trim(); // Get original task name
            if (newStatus === 'proses') {
                confirmationMessage = `Apakah kamu ingin mengerjakan tugas "${taskName}" sekarang?`;
            } else if (newStatus === 'selesai') {
                confirmationMessage = `Apakah tugas "${taskName}" sudah kamu selesaikan?`;
            }

            if (confirmationMessage && !confirm(confirmationMessage)) {
                return;
            }

            moveTask(taskId, newStatus);
            if (newStatus === 'selesai') {
                alert(`Selamat! Tugas "${taskName}" telah selesai!`);
            }
        }
    }

    // Add drag and drop event listeners to task columns
    if (belumDikerjakanList && prosesList && selesaiList) {
        [belumDikerjakanList, prosesList, selesaiList].forEach(list => {
            list.addEventListener('dragover', handleDragOver);
            list.addEventListener('dragleave', handleDragLeave); // New event listener
            list.addEventListener('drop', handleDrop);
        });
    }


    // --- Dashboard Sections Toggling ---
    const addScheduleCard = document.getElementById('addScheduleCard');
    const startPomodoroCard = document.getElementById('startPomodoroCard');
    const writeNotesCard = document.getElementById('writeNotesCard');
    const doQuizCard = document.getElementById('doQuizCard');

    const fullScheduleSection = document.getElementById('fullScheduleSection');
    const fullPomodoroSection = document.getElementById('fullPomodoroSection');
    const fullNotesSection = document.getElementById('fullNotesSection');
    const fullQuizSection = document.getElementById('fullQuizSection');

    const sections = [fullScheduleSection, fullPomodoroSection, fullNotesSection, fullQuizSection];

    function hideAllSections() {
        sections.forEach(section => {
            if (section) section.style.display = 'none';
        });
    }

    // Event listeners for quick action cards
    if (addScheduleCard) {
        addScheduleCard.addEventListener('click', () => { hideAllSections(); fullScheduleSection.style.display = 'block'; });
        startPomodoroCard.addEventListener('click', () => { hideAllSections(); fullPomodoroSection.style.display = 'block'; });
        writeNotesCard.addEventListener('click', () => { hideAllSections(); fullNotesSection.style.display = 'block'; });
        doQuizCard.addEventListener('click', () => { hideAllSections(); fullQuizSection.style.display = 'block'; });
    }

    // --- Initial Load for Dashboard ---
    function updateAllMetrics() {
        // Update Task Metrics
        renderTasks(); // This function already updates task counts

        // Update Pomodoro Count
        const pomodoroSessions = getFromLocalStorage('pomodoroSessions', 0);
        if (pomodorosTodayDisplay) pomodorosTodayDisplay.textContent = `${pomodoroSessions} Sesi`;

        // Update Notes Count
        const notesContent = getFromLocalStorage('studyNotes', '');
        if (notesCountDisplay) notesCountDisplay.textContent = notesContent.trim().length > 0 ? '1 Catatan' : '0 Catatan';

        // Update Quizzes Completed Count
        const quizzesCompleted = getFromLocalStorage('quizzesCompleted', 0);
        if (quizzesCompletedCountDisplay) quizzesCompletedCountDisplay.textContent = quizzesCompleted;
    }

    if (document.querySelector('.dashboard-page')) {
        updateAllMetrics(); // Initial update when dashboard page loads
    }


    // 1. Menambah Tugas Baru
    if (tugasForm) {
        tugasForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const namaTugas = document.getElementById('namaTugas').value;
            const deadlineTugas = document.getElementById('deadlineTugas').value;

            if(namaTugas.trim() !== '' && deadlineTugas.trim() !== '') {
                let tasks = getFromLocalStorage('tasks', {
                    belumDikerjakan: [],
                    proses: [],
                    selesai: []
                });
                const newTaskId = Date.now();
                tasks.belumDikerjakan.push({ id: newTaskId, name: namaTugas, deadline: deadlineTugas, status: 'belumDikerjakan' });
                saveToLocalStorage('tasks', tasks);
                renderTasks();
                updateAllMetrics(); // Update dashboard counts
                tugasForm.reset();
            } else {
                alert('Mohon lengkapi nama tugas dan deadline.');
            }
        });
    }

    // 2. Menghitung Skor Kuis
    if (quizForm) {
        quizForm.addEventListener('submit', (e) => {
            e.preventDefault();
            let score = 0;
            const jawabanBenarQ1 = 'a'; // HyperText Markup Language

            const jawabanUserQ1 = document.querySelector('input[name="q1"]:checked');
            const jawabanUserQ2 = quizForm.querySelector('textarea[name="q2"]').value;

            if (jawabanUserQ1 && jawabanUserQ1.value === jawabanBenarQ1) {
                score += 50;
            }

            if (jawabanUserQ2.trim().toLowerCase().includes('cascading style sheets') || jawabanUserQ2.trim().toLowerCase().includes('desain tampilan')) {
                 score += 50;
            }

            if (scoreResult) {
                scoreResult.textContent = `Skor Anda: ${score} / 100`;
                scoreResult.style.display = 'block';
            }
            alert(`Kuis selesai! Skor Anda: ${score}/100`);

            // Increment quizzes completed count
            let quizzesCompleted = getFromLocalStorage('quizzesCompleted', 0);
            quizzesCompleted++;
            saveToLocalStorage('quizzesCompleted', quizzesCompleted);
            updateAllMetrics();
        });
    }

    // 3. Logika Alarm Belajar (Timer Pomodoro)
    let timerInterval;
    let totalSeconds = 25 * 60; // 25 menit
    let isTimerRunning = false;

    function updateTimerDisplay() {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        if (timerDisplay) {
            timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    if(startTimerBtn){
        updateTimerDisplay(); // Initial display
        startTimerBtn.addEventListener('click', () => {
            if (!isTimerRunning) {
                startTimerBtn.textContent = 'Jeda';
                isTimerRunning = true;
                timerInterval = setInterval(() => {
                    if (totalSeconds <= 0) {
                        clearInterval(timerInterval);
                        alert('Waktu belajar selesai! Ambil istirahat.');
                        startTimerBtn.textContent = 'Mulai';
                        isTimerRunning = false;
                        totalSeconds = 25 * 60; // Reset for next session
                        updateTimerDisplay();

                        // Increment pomodoro sessions
                        let pomodoroSessions = getFromLocalStorage('pomodoroSessions', 0);
                        pomodoroSessions++;
                        saveToLocalStorage('pomodoroSessions', pomodoroSessions);
                        updateAllMetrics();
                        return;
                    }
                    totalSeconds--;
                    updateTimerDisplay();
                }, 1000);
            } else {
                startTimerBtn.textContent = 'Mulai';
                isTimerRunning = false;
                clearInterval(timerInterval);
            }
        });
    }

    if(resetTimerBtn){
        resetTimerBtn.addEventListener('click', () => {
            clearInterval(timerInterval);
            startTimerBtn.textContent = 'Mulai';
            isTimerRunning = false;
            totalSeconds = 25 * 60;
            updateTimerDisplay();
        });
    }

    // 4. Catatan Ringkasan Belajar
    if (catatanTextarea) {
        // Load notes from localStorage
        catatanTextarea.value = getFromLocalStorage('studyNotes', '');

        if (saveCatatanBtn) {
            saveCatatanBtn.addEventListener('click', () => {
                saveToLocalStorage('studyNotes', catatanTextarea.value);
                alert('Catatan berhasil disimpan!');
                updateAllMetrics();
            });
        }

        if (viewCatatanBtn) {
            viewCatatanBtn.addEventListener('click', () => {
                const savedNotes = getFromLocalStorage('studyNotes', 'Belum ada catatan.');
                catatanTextarea.value = savedNotes;
                alert('Catatan Anda telah dimuat ke dalam area teks.');
            });
        }

        // Handle file upload
        if (uploadRingkasanInput) {
            uploadRingkasanInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const currentNotes = catatanTextarea.value;
                        const newContent = event.target.result;
                        // Append new content, ensuring a separator if there's existing text
                        catatanTextarea.value = (currentNotes.trim() ? currentNotes + "\n\n--- Catatan dari File ---\n" : "") + newContent;
                        saveToLocalStorage('studyNotes', catatanTextarea.value);
                        alert(`File "${file.name}" berhasil diupload dan ditambahkan ke catatan.`);
                        updateAllMetrics();
                    };
                    reader.readAsText(file);
                }
            });
        }
    }


    // 5. Logout
    if(logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('currentUser'); // Clear current user session
            localStorage.removeItem('pomodoroSessions'); // Reset pomodoro count on logout for demo
            localStorage.removeItem('quizzesCompleted'); // Reset quiz count on logout for demo
            alert('Anda telah logout.');
            window.location.href = 'login.html';
        });
    }
});