// Drag-to-Connect Mechanic
// Handles the core interaction of connecting nodes

class DragConnect {
    constructor(container, runner, onConnectionComplete, onConnectionError) {
        this.container = container;
        this.runner = runner;
        this.onConnectionComplete = onConnectionComplete;
        this.onConnectionError = onConnectionError;

        this.nodes = [];
        this.connections = [];
        this.currentPath = [];
        this.isDragging = false;
        this.startNode = null;
        this.tempLine = null;

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Mouse events
        this.container.addEventListener('mousedown', (e) => this.handleStart(e));
        this.container.addEventListener('mousemove', (e) => this.handleMove(e));
        this.container.addEventListener('mouseup', (e) => this.handleEnd(e));

        // Touch events
        this.container.addEventListener('touchstart', (e) => this.handleStart(e));
        this.container.addEventListener('touchmove', (e) => this.handleMove(e));
        this.container.addEventListener('touchend', (e) => this.handleEnd(e));

        // Prevent default touch behavior
        this.container.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
    }

    // Add nodes to the board
    addNodes(nodesData, mode) {
        this.nodes = [];
        this.clearContainer();

        const lane = document.createElement('div');
        lane.className = 'lane';
        lane.id = 'main-lane';

        nodesData.forEach((data, index) => {
            const node = document.createElement('div');
            node.className = `node ${mode === 'word-sentence' ? 'word' : ''}`;
            node.textContent = data.value;
            node.dataset.index = index;
            node.dataset.value = data.value;
            node.dataset.correct = data.isCorrect || false;

            this.nodes.push({
                element: node,
                value: data.value,
                index: index,
                isCorrect: data.isCorrect || false
            });

            lane.appendChild(node);
        });

        this.container.querySelector('.nodes-container').appendChild(lane);
    }

    // Handle start of drag
    handleStart(event) {
        const target = this.getNodeFromEvent(event);
        if (!target || target.classList.contains('disabled')) return;

        event.preventDefault();
        this.isDragging = true;
        this.startNode = target;
        this.currentPath = [target];

        target.classList.add('selected');

        // Move runner to start node
        const rect = target.getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();
        this.runner.setPosition(
            rect.left - containerRect.left + rect.width / 2 - 16,
            rect.top - containerRect.top + rect.height / 2 - 16
        );
    }

    // Handle drag movement
    handleMove(event) {
        if (!this.isDragging) return;

        event.preventDefault();
        const point = this.getEventPoint(event);

        // Draw temporary line
        this.drawTempLine(point);

        // Check if hovering over a new node
        const target = this.getNodeFromPoint(point);
        if (target && target !== this.currentPath[this.currentPath.length - 1]) {
            if (!this.currentPath.includes(target) && !target.classList.contains('disabled')) {
                this.addToPath(target);
            }
        }
    }

    // Handle end of drag
    async handleEnd(event) {
        if (!this.isDragging) return;

        event.preventDefault();
        this.isDragging = false;

        // Remove temp line
        if (this.tempLine) {
            this.tempLine.remove();
            this.tempLine = null;
        }

        // Validate the path
        const isValid = await this.validatePath();

        if (isValid) {
            // Correct connection
            await this.runner.dash(50);
            this.markPathCorrect();
            if (this.onConnectionComplete) {
                this.onConnectionComplete(this.currentPath.map(n => n.dataset.value));
            }
        } else {
            // Incorrect connection
            await this.runner.stumble();
            this.markPathIncorrect();
            if (this.onConnectionError) {
                this.onConnectionError(this.currentPath.map(n => n.dataset.value));
            }
        }

        // Clear selections after feedback
        setTimeout(() => {
            this.clearPath();
        }, 1000);
    }

    // Add node to current path
    addToPath(node) {
        this.currentPath.push(node);
        node.classList.add('selected');

        // Draw connection line
        const prevNode = this.currentPath[this.currentPath.length - 2];
        this.drawConnection(prevNode, node);

        // Move runner
        const rect = node.getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();
        this.runner.moveTo(
            rect.left - containerRect.left + rect.width / 2 - 16,
            rect.top - containerRect.top + rect.height / 2 - 16,
            200
        );
    }

    // Draw connection line between two nodes
    drawConnection(nodeA, nodeB, className = '') {
        const rectA = nodeA.getBoundingClientRect();
        const rectB = nodeB.getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();

        const x1 = rectA.left - containerRect.left + rectA.width / 2;
        const y1 = rectA.top - containerRect.top + rectA.height / 2;
        const x2 = rectB.left - containerRect.left + rectB.width / 2;
        const y2 = rectB.top - containerRect.top + rectB.height / 2;

        const line = document.createElement('div');
        line.className = `connection-line ${className}`;

        const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);

        line.style.width = `${length}px`;
        line.style.left = `${x1}px`;
        line.style.top = `${y1}px`;
        line.style.transform = `rotate(${angle}deg)`;

        this.container.querySelector('.connection-layer').appendChild(line);
        this.connections.push(line);
    }

    // Draw temporary line while dragging
    drawTempLine(point) {
        if (!this.startNode) return;

        // Remove previous temp line
        if (this.tempLine) {
            this.tempLine.remove();
        }

        const lastNode = this.currentPath[this.currentPath.length - 1];
        const rect = lastNode.getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();

        const x1 = rect.left - containerRect.left + rect.width / 2;
        const y1 = rect.top - containerRect.top + rect.height / 2;
        const x2 = point.x - containerRect.left;
        const y2 = point.y - containerRect.top;

        const line = document.createElement('div');
        line.className = 'connection-line';
        line.style.opacity = '0.5';

        const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);

        line.style.width = `${length}px`;
        line.style.left = `${x1}px`;
        line.style.top = `${y1}px`;
        line.style.transform = `rotate(${angle}deg)`;

        this.container.querySelector('.connection-layer').appendChild(line);
        this.tempLine = line;
    }

    // Validate the connection path
    async validatePath() {
        // Override this method based on game mode
        return true;
    }

    // Mark path as correct
    markPathCorrect() {
        this.currentPath.forEach(node => {
            node.classList.remove('selected');
            node.classList.add('correct');
            node.classList.add('disabled');
        });

        this.connections.forEach(line => {
            line.classList.add('correct');
        });
    }

    // Mark path as incorrect
    markPathIncorrect() {
        this.currentPath.forEach(node => {
            node.classList.remove('selected');
            node.classList.add('incorrect');
        });

        this.connections.forEach(line => {
            line.classList.add('incorrect');
        });

        // Shake animation
        this.container.classList.add('shake');
        setTimeout(() => {
            this.container.classList.remove('shake');
        }, 300);
    }

    // Clear current path
    clearPath() {
        this.currentPath.forEach(node => {
            node.classList.remove('selected', 'incorrect');
        });

        // Remove incorrect connections
        this.connections.forEach(line => {
            if (line.classList.contains('incorrect')) {
                line.remove();
            }
        });

        this.connections = this.connections.filter(line => line.classList.contains('correct'));
        this.currentPath = [];
        this.startNode = null;
    }

    // Undo last connection
    undo() {
        if (this.currentPath.length <= 1) return;

        const lastNode = this.currentPath.pop();
        lastNode.classList.remove('selected');

        // Remove last connection
        const lastConnection = this.connections.pop();
        if (lastConnection) {
            lastConnection.remove();
        }

        // Move runner back
        if (this.currentPath.length > 0) {
            const prevNode = this.currentPath[this.currentPath.length - 1];
            const rect = prevNode.getBoundingClientRect();
            const containerRect = this.container.getBoundingClientRect();
            this.runner.moveTo(
                rect.left - containerRect.left + rect.width / 2 - 16,
                rect.top - containerRect.top + rect.height / 2 - 16,
                200
            );
        }
    }

    // Helper: Get node element from event
    getNodeFromEvent(event) {
        const point = this.getEventPoint(event);
        return this.getNodeFromPoint(point);
    }

    // Helper: Get node element from point
    getNodeFromPoint(point) {
        const elements = document.elementsFromPoint(point.x, point.y);
        return elements.find(el => el.classList.contains('node'));
    }

    // Helper: Get point from event
    getEventPoint(event) {
        if (event.touches && event.touches.length > 0) {
            return {
                x: event.touches[0].clientX,
                y: event.touches[0].clientY
            };
        }
        return {
            x: event.clientX,
            y: event.clientY
        };
    }

    // Clear all nodes and connections
    clearContainer() {
        const nodesContainer = this.container.querySelector('.nodes-container');
        const connectionLayer = this.container.querySelector('.connection-layer');

        if (nodesContainer) nodesContainer.innerHTML = '';
        if (connectionLayer) connectionLayer.innerHTML = '';

        this.nodes = [];
        this.connections = [];
        this.currentPath = [];
    }

    // Get current path
    getCurrentPath() {
        return this.currentPath.map(node => node.dataset.value);
    }
}

export default DragConnect;
