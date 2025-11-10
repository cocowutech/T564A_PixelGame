// Student Controller
// Uses global gameState, RunnerAnimation, and DragConnect classes

class StudentController {
    constructor() {
        this.lives = 3;
        this.score = 0;
        this.progress = 0;
        this.currentTarget = null;
        this.currentMode = null;
        this.runner = null;
        this.dragConnect = null;
        this.timerInterval = null;
        this.timeRemaining = 0;
    }

    init() {
        this.setupJoinScreen();
        this.setupSoloMode();
    }

    setupJoinScreen() {
        const joinBtn = document.getElementById('btn-join');
        const soloBtn = document.getElementById('btn-solo-play');
        const studentNameInput = document.getElementById('student-name');
        const roomCodeInput = document.getElementById('room-code');

        // Multiplayer join
        joinBtn.addEventListener('click', async () => {
            const name = studentNameInput.value.trim();
            const code = roomCodeInput.value.trim();

            if (!name || !code) {
                this.showFeedback('Please enter your name and room code', 'error');
                return;
            }

            try {
                joinBtn.disabled = true;
                joinBtn.textContent = 'Joining...';

                const roomData = await gameState.joinRoom(name, code);
                this.currentMode = roomData.mode;
                this.timeRemaining = roomData.duration;

                this.showStudentBoard();
                this.setupGameBoard(roomData);
                this.startListening();

                this.showFeedback('Joined successfully! Waiting for game to start...', 'success');
            } catch (error) {
                this.showFeedback(error.message || 'Failed to join room', 'error');
                joinBtn.disabled = false;
                joinBtn.textContent = 'Join';
            }
        });

        // Solo mode
        soloBtn.addEventListener('click', () => {
            const name = studentNameInput.value.trim();
            if (!name) {
                this.showFeedback('Please enter your name', 'error');
                return;
            }

            this.playerName = name;
            this.showSoloSetup();
        });
    }

    setupSoloMode() {
        const startBtn = document.getElementById('btn-start-solo');
        const backBtn = document.getElementById('btn-back-solo');
        const topicSelect = document.getElementById('solo-topic');
        const customTextArea = document.getElementById('solo-custom-text');

        // Show/hide custom text area
        topicSelect.addEventListener('change', () => {
            if (topicSelect.value === 'custom') {
                customTextArea.style.display = 'block';
            } else {
                customTextArea.style.display = 'none';
            }
        });

        // Start solo game
        startBtn.addEventListener('click', () => {
            this.startSoloGame();
        });

        // Back button
        backBtn.addEventListener('click', () => {
            document.getElementById('solo-setup').classList.remove('active');
            document.getElementById('student-join').classList.add('active');
        });
    }

    showSoloSetup() {
        document.getElementById('student-join').classList.remove('active');
        document.getElementById('solo-setup').classList.add('active');
    }

    startSoloGame() {
        const mode = document.getElementById('solo-mode').value;
        const difficulty = document.getElementById('solo-difficulty').value;
        const topic = document.getElementById('solo-topic').value;
        const goal = document.getElementById('solo-goal').value;
        const customText = document.getElementById('solo-custom-text').value.trim();

        // Set difficulty parameters
        const difficultySettings = {
            easy: { duration: 300, hintsEnabled: true, maxHints: 999 },
            medium: { duration: 180, hintsEnabled: true, maxHints: 5 },
            hard: { duration: 120, hintsEnabled: false, maxHints: 0 }
        };

        const settings = difficultySettings[difficulty];
        this.soloSettings = {
            mode,
            difficulty,
            topic,
            goal,
            hintsEnabled: settings.hintsEnabled,
            maxHints: settings.maxHints,
            hintsUsed: 0
        };

        // Get source text based on topic
        const sourceText = this.getSoloSourceText(topic, customText);

        // Create local room data (no Firebase needed)
        const roomData = {
            mode: mode,
            duration: settings.duration,
            status: 'active',
            targets: this.generateSoloTargets(mode, sourceText),
            isSolo: true
        };

        this.currentMode = mode;
        this.timeRemaining = settings.duration;

        // Show game board
        document.getElementById('solo-setup').classList.remove('active');
        this.showStudentBoard();
        this.setupGameBoard(roomData);

        // Start timer immediately in solo mode
        this.startTimer(settings.duration);

        this.showFeedback('Solo game started! Good luck!', 'success');
    }

    getSoloSourceText(topic, customText) {
        if (topic === 'custom' && customText) {
            return customText;
        }

        const texts = {
            general: "Learning wonderful process helps students develop skills through practice dedication. Knowledge grows stronger when challenge yourself daily. Success comes from persistent effort continuous improvement.",
            academic: "Research demonstrates significant correlation between vocabulary acquisition academic achievement. Scholars investigate phenomena utilizing empirical methodologies rigorous analysis. Comprehension facilitates effective communication professional contexts.",
            business: "Marketing strategy requires comprehensive analysis customer behavior market trends. Management focuses maximizing productivity efficiency organizational performance. Leadership involves strategic decision making effective communication.",
            technology: "Software development requires systematic approach problem solving debugging. Programming languages enable developers create innovative applications solutions. Technology advances rapidly requiring continuous learning adaptation."
        };

        return texts[topic] || texts.general;
    }

    generateSoloTargets(mode, sourceText) {
        const targets = { words: [], sentences: [] };

        if (mode === 'alphabet-word' || mode === 'mixed-relay') {
            const words = sourceText.match(/\b[a-zA-Z]{5,}\b/g) || [];
            targets.words = [...new Set(words)].slice(0, 8).map(word => word.toLowerCase());
        }

        if (mode === 'word-sentence' || mode === 'mixed-relay') {
            const sentences = sourceText.match(/[^.!?]+[.!?]/g) || [];
            targets.sentences = sentences.slice(0, 3).map(s => s.trim());
        }

        return targets;
    }

    showStudentBoard() {
        document.getElementById('student-join').classList.remove('active');
        document.getElementById('student-board').classList.add('active');
    }

    setupGameBoard(roomData) {
        // Initialize runner animation
        const canvas = document.getElementById('runner-canvas');
        this.runner = new RunnerAnimation(canvas);
        this.runner.start();

        // Initialize drag-connect
        const gameBoard = document.getElementById('game-board');
        this.dragConnect = new DragConnect(
            gameBoard,
            this.runner,
            (path) => this.handleCorrectConnection(path),
            (path) => this.handleIncorrectConnection(path)
        );

        // Setup controls
        this.setupControls();

        // Update UI
        this.updateLivesDisplay();
        this.updateScoreDisplay();

        // Setup target based on mode
        this.setupTarget(roomData);
    }

    setupTarget(roomData) {
        const targets = roomData.targets;

        if (this.currentMode === 'alphabet-word') {
            this.setupAlphabetWordMode(targets.words);
        } else if (this.currentMode === 'word-sentence') {
            this.setupWordSentenceMode(targets.sentences);
        } else if (this.currentMode === 'mixed-relay') {
            // Start with alphabet-word
            this.setupAlphabetWordMode(targets.words);
        }
    }

    setupAlphabetWordMode(words) {
        if (words.length === 0) return;

        this.currentTarget = words[0];

        // Show target VERY clearly
        const targetDisplay = document.getElementById('target-text');
        targetDisplay.innerHTML = `
            <div style="text-align: center; padding: 15px; background: var(--color-bg); border: 3px solid var(--color-accent); margin-bottom: 10px;">
                <div style="font-size: 14px; color: var(--color-text-dim); margin-bottom: 5px;">SPELL THIS WORD:</div>
                <div style="font-size: 32px; color: var(--color-accent); font-weight: bold; letter-spacing: 4px; text-transform: uppercase;">
                    ${this.currentTarget}
                </div>
                <div style="font-size: 12px; color: var(--color-primary); margin-top: 8px;">
                    Click letters in order • ${this.currentTarget.length} letters needed
                </div>
            </div>
        `;

        // Create letter nodes
        const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
        const targetLetters = this.currentTarget.split('');

        // Shuffle and include target letters plus extras
        const allLetters = [...new Set([...targetLetters, ...this.getRandomLetters(15)])];
        this.shuffleArray(allLetters);

        const nodesData = allLetters.map(letter => ({
            value: letter.toUpperCase(),
            isCorrect: targetLetters.includes(letter)
        }));

        this.dragConnect.addNodes(nodesData, 'alphabet-word', this.currentTarget);

        // Override validation for alphabet mode
        this.dragConnect.validatePath = () => {
            const path = this.dragConnect.getCurrentPath();
            return path.join('').toLowerCase() === this.currentTarget;
        };
    }

    setupWordSentenceMode(sentences) {
        if (sentences.length === 0) return;

        this.currentTarget = sentences[0];
        const words = this.currentTarget.split(' ').filter(w => w.length > 0);

        // Show target sentence VERY clearly
        const targetDisplay = document.getElementById('target-text');
        targetDisplay.innerHTML = `
            <div style="text-align: center; padding: 15px; background: var(--color-bg); border: 3px solid var(--color-accent); margin-bottom: 10px;">
                <div style="font-size: 14px; color: var(--color-text-dim); margin-bottom: 5px;">BUILD THIS SENTENCE:</div>
                <div style="font-size: 24px; color: var(--color-accent); font-weight: bold; line-height: 1.4;">
                    "${this.currentTarget}"
                </div>
                <div style="font-size: 12px; color: var(--color-primary); margin-top: 8px;">
                    Click words in order • ${words.length} words needed
                </div>
            </div>
        `;

        // Shuffle words and add some distractors
        const allWords = [...words, ...this.getDistractorWords(5)];
        this.shuffleArray(allWords);

        const nodesData = allWords.map(word => ({
            value: word,
            isCorrect: words.includes(word)
        }));

        this.dragConnect.addNodes(nodesData, 'word-sentence', this.currentTarget);

        // Show mini-map if sentence is long
        if (words.length > 6) {
            this.showMiniMap(nodesData);
        }

        // Override validation for word-sentence mode
        this.dragConnect.validatePath = () => {
            const path = this.dragConnect.getCurrentPath();
            const builtSentence = path.join(' ');
            return builtSentence.toLowerCase() === this.currentTarget.toLowerCase();
        };
    }

    setupControls() {
        // Undo button
        document.getElementById('btn-undo').addEventListener('click', () => {
            this.dragConnect.undo();
        });

        // Hint button
        document.getElementById('btn-hint').addEventListener('click', () => {
            this.useHint();
        });

        // Clear button
        document.getElementById('btn-clear').addEventListener('click', () => {
            this.dragConnect.clearPath();
        });

        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                this.dragConnect.undo();
            }
            if (e.key === 'h' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                this.useHint();
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                this.dragConnect.clearPath();
            }
        });
    }

    handleCorrectConnection(path) {
        // Increase score and add life
        this.score += 100 * path.length;
        if (this.lives < 5) {
            this.lives++;
        }

        this.progress += 20; // Increment progress

        this.updateLivesDisplay();
        this.updateScoreDisplay();
        this.updateProgress();

        this.showFeedback('Correct! +1 Life', 'success');

        // Move to next target or complete
        setTimeout(() => {
            this.nextTarget();
        }, 1500);
    }

    handleIncorrectConnection(path) {
        // Decrease lives
        this.lives--;

        this.updateLivesDisplay();

        this.showFeedback('Incorrect! -1 Life', 'error');

        if (this.lives <= 0) {
            this.handleOutOfLives();
        }
    }

    handleOutOfLives() {
        this.showFeedback('Out of lives! Brief cooldown...', 'error');

        // Brief cooldown
        setTimeout(() => {
            this.lives = 1; // Resume with 1 life
            this.updateLivesDisplay();
            this.showFeedback('Resumed with 1 life', 'success');
        }, 3000);
    }

    useHint() {
        // Check if hints are disabled in solo mode
        if (this.soloSettings && !this.soloSettings.hintsEnabled) {
            this.showFeedback('Hints are disabled in this difficulty!', 'error');
            return;
        }

        // Check hint limit in solo mode
        if (this.soloSettings && this.soloSettings.hintsUsed >= this.soloSettings.maxHints) {
            this.showFeedback('No hints remaining!', 'error');
            return;
        }

        // Cost: -10 points
        this.score = Math.max(0, this.score - 10);
        this.updateScoreDisplay();

        // Track hints used in solo mode
        if (this.soloSettings) {
            this.soloSettings.hintsUsed++;
        }

        if (this.currentMode === 'alphabet-word') {
            // Show next letter
            const currentPath = this.dragConnect.getCurrentPath();
            const nextIndex = currentPath.length;
            if (nextIndex < this.currentTarget.length) {
                const nextLetter = this.currentTarget[nextIndex];
                this.showFeedback(`Next letter: ${nextLetter.toUpperCase()}`, 'success');
            }
        } else if (this.currentMode === 'word-sentence') {
            // Show next word
            const words = this.currentTarget.split(' ');
            const currentPath = this.dragConnect.getCurrentPath();
            const nextIndex = currentPath.length;
            if (nextIndex < words.length) {
                const nextWord = words[nextIndex];
                this.showFeedback(`Next word: ${nextWord}`, 'success');
            }
        }
    }

    nextTarget() {
        // This is simplified - in production, fetch next target from room data
        if (this.progress >= 100) {
            this.completeStage();
        } else {
            // For demo, just reset with same target
            this.setupTarget({ targets: gameState.targets || { words: ['example'], sentences: ['This is an example.'] } });
        }
    }

    completeStage() {
        this.progress = 100;
        this.updateProgress();
        this.showFeedback('Stage Complete!', 'success');

        // Notify server
        gameState.updateStudentProgress(this.progress, this.score, this.lives);
    }

    updateLivesDisplay() {
        const heartsContainer = document.getElementById('lives-hearts');
        heartsContainer.innerHTML = '';

        for (let i = 0; i < 5; i++) {
            const heart = document.createElement('span');
            heart.className = `heart ${i < this.lives ? '' : 'empty'}`;
            heart.textContent = '♥';
            heartsContainer.appendChild(heart);
        }
    }

    updateScoreDisplay() {
        document.getElementById('current-score').textContent = this.score;
    }

    updateProgress() {
        // Skip Firebase updates in solo mode
        if (!this.soloSettings) {
            gameState.updateStudentProgress(this.progress, this.score, this.lives);
        }
    }

    startTimer(duration) {
        this.timeRemaining = duration;
        this.updateTimerDisplay();

        this.timerInterval = setInterval(() => {
            this.timeRemaining--;
            this.updateTimerDisplay();

            if (this.timeRemaining <= 0) {
                this.handleTimeUp();
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateTimerDisplay() {
        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = this.timeRemaining % 60;
        const display = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById('time-remaining').textContent = display;

        // Warning at 30 seconds
        if (this.timeRemaining <= 30) {
            document.getElementById('time-remaining').classList.add('warning');
        }
    }

    handleTimeUp() {
        this.stopTimer();
        this.showFeedback('Time is up!', 'error');
        this.dragConnect.clearContainer();
    }

    startListening() {
        // Listen for game status changes
        gameState.listenToRoom((roomData) => {
            if (roomData.status === 'active' && !this.timerInterval) {
                this.startTimer(roomData.duration);
            } else if (roomData.status === 'paused') {
                this.stopTimer();
            } else if (roomData.status === 'ended') {
                this.handleGameEnd();
            }

            // Update team progress
            this.updateTeamProgress(roomData);

            // Check for broadcast hints
            if (roomData.broadcastHint && roomData.broadcastHint.timestamp > Date.now() - 5000) {
                this.showFeedback(`Teacher: ${roomData.broadcastHint.text}`, 'success');
            }
        });
    }

    updateTeamProgress(roomData) {
        const students = Object.values(roomData.students || {});
        const teamProgress = gameState.calculateTeamProgress(students);

        const progressBar = document.getElementById('team-progress-bar');
        progressBar.innerHTML = '';

        students.forEach((student, index) => {
            const runner = document.createElement('div');
            runner.className = 'team-runner';
            runner.style.left = `${student.progress}%`;

            const label = document.createElement('span');
            label.className = 'team-runner-label';
            label.textContent = student.name;

            runner.appendChild(label);
            progressBar.appendChild(runner);
        });
    }

    showMiniMap(nodesData) {
        const miniMap = document.getElementById('mini-map');
        miniMap.classList.remove('hidden');
        miniMap.innerHTML = '';

        nodesData.forEach((node, index) => {
            const dot = document.createElement('div');
            dot.className = 'mini-map-node';
            dot.style.left = `${(index / nodesData.length) * 100}%`;
            miniMap.appendChild(dot);
        });
    }

    showFeedback(message, type) {
        const modal = document.getElementById('feedback-modal');
        const messageEl = document.getElementById('feedback-message');

        messageEl.textContent = message;
        messageEl.className = `feedback-message ${type}`;

        modal.classList.remove('hidden');

        setTimeout(() => {
            modal.classList.add('hidden');
        }, 2000);
    }

    handleGameEnd() {
        this.stopTimer();
        this.showFeedback('Game ended!', 'success');

        setTimeout(() => {
            this.showResults();
        }, 2000);
    }

    showResults() {
        document.getElementById('student-board').classList.remove('active');
        document.getElementById('results-screen').classList.add('active');

        // Show individual results
        const resultsDiv = document.getElementById('individual-results');

        let resultsHTML = `<h3>Your Results</h3>`;

        if (this.soloSettings) {
            // Solo mode results with more details
            const goalMessages = {
                score: this.score >= 500 ? 'High Score Achieved!' : 'Keep practicing for higher scores!',
                time: this.progress >= 100 ? 'Speed Challenge Complete!' : 'Almost there!',
                accuracy: this.soloSettings.hintsUsed === 0 && this.lives === 5 ? 'Perfect Accuracy!' : 'Try for no hints next time!',
                practice: 'Great practice session!'
            };

            resultsHTML += `
                <div style="margin: 20px 0; padding: 20px; background: var(--color-bg-secondary); border: 2px solid var(--color-primary);">
                    <h4 style="color: var(--color-accent); margin-bottom: 15px;">Solo Mode - ${this.soloSettings.difficulty.toUpperCase()}</h4>
                    <p style="color: var(--color-success); font-size: 18px; margin-bottom: 10px;">${goalMessages[this.soloSettings.goal]}</p>
                    <p><strong>Score:</strong> ${this.score}</p>
                    <p><strong>Progress:</strong> ${this.progress}%</p>
                    <p><strong>Lives Remaining:</strong> ${this.lives}/5</p>
                    <p><strong>Hints Used:</strong> ${this.soloSettings.hintsUsed}/${this.soloSettings.maxHints === 999 ? '∞' : this.soloSettings.maxHints}</p>
                    <p><strong>Topic:</strong> ${this.soloSettings.topic.charAt(0).toUpperCase() + this.soloSettings.topic.slice(1)}</p>
                </div>
                <button onclick="location.reload()" class="action-btn" style="margin-top: 20px;">Play Again</button>
            `;
        } else {
            // Multiplayer results
            resultsHTML += `
                <p>Score: ${this.score}</p>
                <p>Progress: ${this.progress}%</p>
                <p>Lives Remaining: ${this.lives}</p>
            `;
        }

        resultsDiv.innerHTML = resultsHTML;
    }

    // Helper methods
    getRandomLetters(count) {
        const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
        const result = [];
        for (let i = 0; i < count; i++) {
            result.push(letters[Math.floor(Math.random() * letters.length)]);
        }
        return result;
    }

    getDistractorWords(count) {
        const words = ['the', 'and', 'but', 'not', 'very', 'much', 'some', 'many'];
        return words.slice(0, count);
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}

const studentController = new StudentController();
