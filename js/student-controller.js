// Student Controller
import gameState from './game-state.js';
import RunnerAnimation from './runner-animation.js';
import DragConnect from './drag-connect.js';

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
    }

    setupJoinScreen() {
        const joinBtn = document.getElementById('btn-join');
        const studentNameInput = document.getElementById('student-name');
        const roomCodeInput = document.getElementById('room-code');

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
        document.getElementById('target-text').textContent = `Spell: ${this.currentTarget}`;

        // Create letter nodes
        const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
        const targetLetters = this.currentTarget.split('');

        // Shuffle and include target letters plus extras
        const allLetters = [...new Set([...targetLetters, ...this.getRandomLetters(15)])];
        this.shuffleArray(allLetters);

        const nodesData = allLetters.map(letter => ({
            value: letter,
            isCorrect: targetLetters.includes(letter)
        }));

        this.dragConnect.addNodes(nodesData, 'alphabet-word');

        // Override validation for alphabet mode
        this.dragConnect.validatePath = () => {
            const path = this.dragConnect.getCurrentPath();
            return path.join('') === this.currentTarget;
        };
    }

    setupWordSentenceMode(sentences) {
        if (sentences.length === 0) return;

        this.currentTarget = sentences[0];
        const words = this.currentTarget.split(' ').filter(w => w.length > 0);

        document.getElementById('target-text').textContent = `Build the sentence`;

        // Shuffle words and add some distractors
        const allWords = [...words, ...this.getDistractorWords(5)];
        this.shuffleArray(allWords);

        const nodesData = allWords.map(word => ({
            value: word,
            isCorrect: words.includes(word)
        }));

        this.dragConnect.addNodes(nodesData, 'word-sentence');

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
        // Cost: -10 points
        this.score = Math.max(0, this.score - 10);
        this.updateScoreDisplay();

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
        gameState.updateStudentProgress(this.progress, this.score, this.lives);
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
        resultsDiv.innerHTML = `
            <h3>Your Results</h3>
            <p>Score: ${this.score}</p>
            <p>Progress: ${this.progress}%</p>
            <p>Lives Remaining: ${this.lives}</p>
        `;
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
export default studentController;
