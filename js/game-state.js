// Game State Management
import { database } from './firebase-config.js';
import { ref, set, get, update, onValue, push, remove } from 'firebase/database';

class GameState {
    constructor() {
        this.roomCode = null;
        this.playerName = null;
        this.playerRole = null; // 'teacher' or 'student'
        this.gameMode = null; // 'alphabet-word', 'word-sentence', 'mixed-relay'
        this.listeners = {};
    }

    // Generate a random 6-character room code
    generateRoomCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    // Create a new game room (teacher)
    async createRoom(teacherName, mode, sourceText, duration) {
        this.roomCode = this.generateRoomCode();
        this.playerName = teacherName;
        this.playerRole = 'teacher';
        this.gameMode = mode;

        const roomData = {
            roomCode: this.roomCode,
            teacher: teacherName,
            mode: mode,
            sourceText: sourceText,
            duration: duration * 60, // Convert to seconds
            status: 'waiting', // waiting, active, paused, ended
            createdAt: Date.now(),
            students: {},
            targets: this.generateTargets(mode, sourceText),
            teamProgress: 0
        };

        try {
            await set(ref(database, `rooms/${this.roomCode}`), roomData);
            return this.roomCode;
        } catch (error) {
            console.error('Error creating room:', error);
            throw error;
        }
    }

    // Join an existing room (student)
    async joinRoom(studentName, roomCode) {
        this.roomCode = roomCode.toUpperCase();
        this.playerName = studentName;
        this.playerRole = 'student';

        try {
            // Check if room exists
            const roomSnapshot = await get(ref(database, `rooms/${this.roomCode}`));
            if (!roomSnapshot.exists()) {
                throw new Error('Room not found');
            }

            const roomData = roomSnapshot.val();
            this.gameMode = roomData.mode;

            // Add student to room
            const studentId = push(ref(database, `rooms/${this.roomCode}/students`)).key;
            const studentData = {
                id: studentId,
                name: studentName,
                lives: 3,
                score: 0,
                progress: 0,
                currentStage: 0,
                status: 'ready',
                joinedAt: Date.now()
            };

            await set(ref(database, `rooms/${this.roomCode}/students/${studentId}`), studentData);
            this.studentId = studentId;

            return roomData;
        } catch (error) {
            console.error('Error joining room:', error);
            throw error;
        }
    }

    // Generate targets based on mode and source text
    generateTargets(mode, sourceText) {
        // This is a simplified version - in production, you'd want more sophisticated parsing
        const targets = {
            words: [],
            sentences: []
        };

        if (mode === 'alphabet-word' || mode === 'mixed-relay') {
            // Extract key words (simplified - just gets longer words)
            const words = sourceText.match(/\b[a-zA-Z]{5,}\b/g) || [];
            targets.words = [...new Set(words)].slice(0, 8).map(word => word.toLowerCase());
        }

        if (mode === 'word-sentence' || mode === 'mixed-relay') {
            // Extract sentences (simplified - splits by periods)
            const sentences = sourceText.match(/[^.!?]+[.!?]/g) || [];
            targets.sentences = sentences.slice(0, 3).map(s => s.trim());
        }

        return targets;
    }

    // Update student progress
    async updateStudentProgress(progress, score, lives) {
        if (!this.studentId || !this.roomCode) return;

        try {
            await update(ref(database, `rooms/${this.roomCode}/students/${this.studentId}`), {
                progress,
                score,
                lives,
                lastUpdate: Date.now()
            });
        } catch (error) {
            console.error('Error updating progress:', error);
        }
    }

    // Update game status
    async updateGameStatus(status) {
        if (!this.roomCode) return;

        try {
            await update(ref(database, `rooms/${this.roomCode}`), {
                status,
                statusChangedAt: Date.now()
            });
        } catch (error) {
            console.error('Error updating game status:', error);
        }
    }

    // Listen to room changes
    listenToRoom(callback) {
        if (!this.roomCode) return;

        const roomRef = ref(database, `rooms/${this.roomCode}`);
        const listener = onValue(roomRef, (snapshot) => {
            if (snapshot.exists()) {
                callback(snapshot.val());
            }
        });

        this.listeners.room = listener;
    }

    // Listen to students (teacher only)
    listenToStudents(callback) {
        if (!this.roomCode) return;

        const studentsRef = ref(database, `rooms/${this.roomCode}/students`);
        const listener = onValue(studentsRef, (snapshot) => {
            const students = [];
            snapshot.forEach((child) => {
                students.push({ id: child.key, ...child.val() });
            });
            callback(students);
        });

        this.listeners.students = listener;
    }

    // Broadcast hint (teacher)
    async broadcastHint(hintText) {
        if (!this.roomCode) return;

        try {
            await update(ref(database, `rooms/${this.roomCode}`), {
                broadcastHint: {
                    text: hintText,
                    timestamp: Date.now()
                }
            });
        } catch (error) {
            console.error('Error broadcasting hint:', error);
        }
    }

    // Extend time (teacher)
    async extendTime(additionalSeconds) {
        if (!this.roomCode) return;

        try {
            const roomSnapshot = await get(ref(database, `rooms/${this.roomCode}`));
            const currentDuration = roomSnapshot.val().duration;

            await update(ref(database, `rooms/${this.roomCode}`), {
                duration: currentDuration + additionalSeconds
            });
        } catch (error) {
            console.error('Error extending time:', error);
        }
    }

    // Calculate team progress
    calculateTeamProgress(students) {
        if (!students || students.length === 0) return 0;

        const totalProgress = students.reduce((sum, student) => sum + student.progress, 0);
        return Math.round(totalProgress / students.length);
    }

    // Check if team completed
    checkTeamComplete(students) {
        if (!students || students.length === 0) return false;
        return students.every(student => student.progress >= 100);
    }

    // Clean up listeners
    cleanup() {
        Object.values(this.listeners).forEach(unsubscribe => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        });
        this.listeners = {};
    }

    // Leave room
    async leaveRoom() {
        if (this.playerRole === 'student' && this.studentId && this.roomCode) {
            try {
                await remove(ref(database, `rooms/${this.roomCode}/students/${this.studentId}`));
            } catch (error) {
                console.error('Error leaving room:', error);
            }
        }
        this.cleanup();
    }
}

// Export singleton instance
const gameState = new GameState();
export default gameState;
