// Teacher Controller
import gameState from './game-state.js';

class TeacherController {
    constructor() {
        this.students = [];
        this.gameStartTime = null;
        this.timerInterval = null;
        this.analytics = {
            totalAttempts: 0,
            correctAttempts: 0,
            commonErrors: {},
            completionTimes: []
        };
    }

    init() {
        this.setupCreateRoom();
    }

    setupCreateRoom() {
        const createBtn = document.getElementById('btn-create-room');
        const teacherNameInput = document.getElementById('teacher-name');
        const gameModeSelect = document.getElementById('game-mode');
        const sourceTextArea = document.getElementById('source-text');
        const readyPromptSelect = document.getElementById('ready-prompt');
        const gameDurationInput = document.getElementById('game-duration');

        // Handle ready prompt selection
        readyPromptSelect.addEventListener('change', (e) => {
            if (e.target.value) {
                // In production, this would call an API to generate content
                // For now, just show a placeholder
                sourceTextArea.value = `[Content will be generated based on: ${e.target.value}]\n\nPlaceholder text for demonstration. In production, this would use AI to generate appropriate content.`;
            }
        });

        createBtn.addEventListener('click', async () => {
            const name = teacherNameInput.value.trim();
            const mode = gameModeSelect.value;
            const sourceText = sourceTextArea.value.trim();
            const duration = parseInt(gameDurationInput.value);

            if (!name || !sourceText) {
                alert('Please fill in all required fields');
                return;
            }

            try {
                createBtn.disabled = true;
                createBtn.textContent = 'Creating...';

                const roomCode = await gameState.createRoom(name, mode, sourceText, duration);

                this.showControlRoom(roomCode, mode);
                this.startListening();

            } catch (error) {
                alert('Failed to create room: ' + error.message);
                createBtn.disabled = false;
                createBtn.textContent = 'Create Room';
            }
        });
    }

    showControlRoom(roomCode, mode) {
        document.getElementById('teacher-setup').classList.remove('active');
        document.getElementById('teacher-control').classList.add('active');

        // Display room info
        document.getElementById('display-room-code').textContent = roomCode;
        document.getElementById('display-mode').textContent = this.formatMode(mode);

        // Setup control buttons
        this.setupControlButtons();
    }

    setupControlButtons() {
        // Start game
        document.getElementById('btn-start-game').addEventListener('click', () => {
            this.startGame();
        });

        // Pause game
        document.getElementById('btn-pause-game').addEventListener('click', () => {
            this.togglePause();
        });

        // Broadcast hint
        document.getElementById('btn-broadcast-hint').addEventListener('click', () => {
            const hint = prompt('Enter hint to broadcast to all students:');
            if (hint) {
                gameState.broadcastHint(hint);
            }
        });

        // Extend time
        document.getElementById('btn-extend-time').addEventListener('click', () => {
            gameState.extendTime(30);
            alert('Added 30 seconds to the timer');
        });

        // End game
        document.getElementById('btn-end-game').addEventListener('click', () => {
            if (confirm('Are you sure you want to end the game?')) {
                this.endGame();
            }
        });
    }

    async startGame() {
        await gameState.updateGameStatus('active');
        this.gameStartTime = Date.now();

        document.getElementById('btn-start-game').disabled = true;
        document.getElementById('btn-start-game').textContent = 'Game Started';

        // Start timer display
        this.startTimerDisplay();
    }

    async togglePause() {
        const btn = document.getElementById('btn-pause-game');

        if (btn.textContent === 'Pause') {
            await gameState.updateGameStatus('paused');
            btn.textContent = 'Resume';
            this.stopTimerDisplay();
        } else {
            await gameState.updateGameStatus('active');
            btn.textContent = 'Pause';
            this.startTimerDisplay();
        }
    }

    async endGame() {
        await gameState.updateGameStatus('ended');
        this.stopTimerDisplay();

        // Calculate final analytics
        this.calculateFinalAnalytics();

        // Show results
        setTimeout(() => {
            this.showResults();
        }, 2000);
    }

    startListening() {
        // Listen to students joining and their progress
        gameState.listenToStudents((students) => {
            this.students = students;
            this.updateStudentsGrid(students);
            this.updateAnalytics(students);
        });

        // Listen to room changes for timer
        gameState.listenToRoom((roomData) => {
            if (roomData.status === 'active') {
                this.updateTimerFromRoom(roomData);
            }

            // Check for team complete
            if (gameState.checkTeamComplete(Object.values(roomData.students || {}))) {
                this.handleTeamComplete();
            }
        });
    }

    updateStudentsGrid(students) {
        const grid = document.getElementById('students-grid');
        grid.innerHTML = '';

        students.forEach(student => {
            const card = this.createStudentCard(student);
            grid.appendChild(card);
        });
    }

    createStudentCard(student) {
        const card = document.createElement('div');
        card.className = 'student-card';
        card.dataset.studentId = student.id;

        // Determine card status
        if (student.progress >= 100) {
            card.classList.add('completed');
        } else if (student.lives <= 1) {
            card.classList.add('struggling');
        }

        card.innerHTML = `
            <div class="student-name">${student.name}</div>

            <div class="student-status">
                <span class="status-label">Progress:</span>
                <span class="status-value">${student.progress}%</span>
            </div>

            <div class="student-progress">
                <div class="progress-fill" style="width: ${student.progress}%"></div>
            </div>

            <div class="student-status">
                <span class="status-label">Lives:</span>
                <div class="student-lives">
                    ${this.renderHearts(student.lives)}
                </div>
            </div>

            <div class="student-stats">
                <div class="stat-item">
                    <span class="stat-label">Score</span>
                    <span class="stat-value">${student.score}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Status</span>
                    <span class="stat-value">${student.status}</span>
                </div>
            </div>
        `;

        return card;
    }

    renderHearts(count) {
        let hearts = '';
        for (let i = 0; i < 5; i++) {
            hearts += `<span class="heart ${i < count ? '' : 'empty'}">♥</span>`;
        }
        return hearts;
    }

    updateAnalytics(students) {
        const analyticsDisplay = document.getElementById('analytics-display');
        analyticsDisplay.innerHTML = '';

        // Average progress
        const avgProgress = students.length > 0
            ? Math.round(students.reduce((sum, s) => sum + s.progress, 0) / students.length)
            : 0;

        // Average score
        const avgScore = students.length > 0
            ? Math.round(students.reduce((sum, s) => sum + s.score, 0) / students.length)
            : 0;

        // Students struggling (lives <= 1)
        const struggling = students.filter(s => s.lives <= 1).length;

        // Students completed
        const completed = students.filter(s => s.progress >= 100).length;

        // Create analytics cards
        analyticsDisplay.innerHTML = `
            <div class="analytics-card">
                <div class="analytics-title">Total Students</div>
                <div class="analytics-value">${students.length}</div>
            </div>

            <div class="analytics-card">
                <div class="analytics-title">Avg Progress</div>
                <div class="analytics-value">${avgProgress}%</div>
            </div>

            <div class="analytics-card">
                <div class="analytics-title">Avg Score</div>
                <div class="analytics-value">${avgScore}</div>
            </div>

            <div class="analytics-card">
                <div class="analytics-title">Completed</div>
                <div class="analytics-value">${completed}</div>
            </div>

            <div class="analytics-card">
                <div class="analytics-title">Struggling</div>
                <div class="analytics-value" style="color: var(--color-error)">${struggling}</div>
            </div>

            <div class="analytics-card" style="grid-column: span 2;">
                <div class="analytics-title">Progress Distribution</div>
                <div class="analytics-chart">
                    ${this.renderProgressHistogram(students)}
                </div>
            </div>
        `;
    }

    renderProgressHistogram(students) {
        const ranges = [
            { min: 0, max: 20, label: '0-20%' },
            { min: 20, max: 40, label: '20-40%' },
            { min: 40, max: 60, label: '40-60%' },
            { min: 60, max: 80, label: '60-80%' },
            { min: 80, max: 100, label: '80-100%' }
        ];

        const distribution = ranges.map(range => {
            return students.filter(s => s.progress >= range.min && s.progress < range.max).length;
        });

        const maxCount = Math.max(...distribution, 1);

        const bars = distribution.map((count, index) => {
            const height = (count / maxCount) * 100;
            return `
                <div class="histogram-bar" style="height: ${height}%">
                    <span class="histogram-label">${ranges[index].label}</span>
                </div>
            `;
        }).join('');

        return `<div class="histogram">${bars}</div>`;
    }

    startTimerDisplay() {
        // This would sync with the actual game timer
        // For now, just a placeholder
        this.timerInterval = setInterval(() => {
            // Update timer in control room
        }, 1000);
    }

    stopTimerDisplay() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateTimerFromRoom(roomData) {
        const elapsed = Math.floor((Date.now() - roomData.createdAt) / 1000);
        const remaining = Math.max(0, roomData.duration - elapsed);

        const minutes = Math.floor(remaining / 60);
        const seconds = remaining % 60;
        const display = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        document.getElementById('control-timer').textContent = display;

        if (remaining <= 0) {
            this.endGame();
        }
    }

    handleTeamComplete() {
        alert('Team Complete! All students have finished their stages.');
        this.endGame();
    }

    calculateFinalAnalytics() {
        // Calculate completion times, accuracy, common errors, etc.
        this.analytics.completionTimes = this.students.map(s => {
            const joinTime = s.joinedAt || 0;
            const completeTime = Date.now();
            return (completeTime - joinTime) / 1000; // in seconds
        });
    }

    showResults() {
        document.getElementById('teacher-control').classList.remove('active');
        document.getElementById('results-screen').classList.add('active');

        // Display team results
        const teamResultsDiv = document.getElementById('team-results');
        const avgScore = this.students.length > 0
            ? Math.round(this.students.reduce((sum, s) => sum + s.score, 0) / this.students.length)
            : 0;

        const completedCount = this.students.filter(s => s.progress >= 100).length;

        teamResultsDiv.innerHTML = `
            <h3>Team Results</h3>
            <p>Students Completed: ${completedCount} / ${this.students.length}</p>
            <p>Average Score: ${avgScore}</p>
            <p>Team Status: ${completedCount === this.students.length ? 'TEAM COMPLETE!' : 'Incomplete'}</p>
        `;

        // Display individual results
        const individualResultsDiv = document.getElementById('individual-results');
        const sortedStudents = [...this.students].sort((a, b) => b.score - a.score);

        individualResultsDiv.innerHTML = `
            <h3>Individual Results</h3>
            <table style="width: 100%; color: var(--color-text);">
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Name</th>
                        <th>Score</th>
                        <th>Progress</th>
                        <th>Lives</th>
                    </tr>
                </thead>
                <tbody>
                    ${sortedStudents.map((s, i) => `
                        <tr>
                            <td>${i + 1}</td>
                            <td>${s.name}</td>
                            <td>${s.score}</td>
                            <td>${s.progress}%</td>
                            <td>${s.lives}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        // Setup new game button
        document.getElementById('btn-new-game').addEventListener('click', () => {
            location.reload();
        });
    }

    formatMode(mode) {
        const modes = {
            'alphabet-word': 'Alphabet → Word',
            'word-sentence': 'Word → Sentence',
            'mixed-relay': 'Mixed Relay'
        };
        return modes[mode] || mode;
    }
}

const teacherController = new TeacherController();
export default teacherController;
