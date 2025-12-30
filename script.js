class Snake {
    constructor(tileSize) {
        this.tileSize = tileSize;
        this.reset();
    }

    reset() {
        this.body = [
            {x: 10, y: 10}, 
            {x: 9, y: 10}, 
            {x: 8, y: 10}
        ];
        this.dx = 0;       
        this.dy = 0;       
        this.nextDx = 0;   
        this.nextDy = 0;
    }

    update() {
        this.dx = this.nextDx;
        this.dy = this.nextDy;
        
        const head = { x: this.body[0].x + this.dx, y: this.body[0].y + this.dy };
        this.body.unshift(head);
        return head;
    }

    draw(ctx) {
        this.body.forEach((part, index) => {
            ctx.fillStyle = index === 0 ? "#00ff41" : "#008f11";
            ctx.shadowBlur = index === 0 ? 15 : 0;
            ctx.shadowColor = "#00ff41";
            ctx.fillRect(part.x * this.tileSize, part.y * this.tileSize, this.tileSize - 2, this.tileSize - 2);
        });
        ctx.shadowBlur = 0;
    }
}


class Food {
    constructor(tileSize, tileCount) {
        this.tileSize = tileSize;
        this.tileCount = tileCount;
        this.x = 5;
        this.y = 5;
    }

    spawn(snakeBody) {
        let newX = Math.floor(Math.random() * this.tileCount);
        let newY = Math.floor(Math.random() * this.tileCount);
        
        // Проверка: чтобы еда не появилась внутри змейки
        const isOnSnake = snakeBody.some(part => part.x === newX && part.y === newY);
        
        if (isOnSnake) {
            this.spawn(snakeBody);
        } else {
            this.x = newX;
            this.y = newY;
        }
    }

    draw(ctx) {
        ctx.fillStyle = "#ff003c";
        ctx.shadowBlur = 20;
        ctx.shadowColor = "#ff003c";
        ctx.fillRect(this.x * this.tileSize, this.y * this.tileSize, this.tileSize - 2, this.tileSize - 2);
        ctx.shadowBlur = 0;
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('snakeGame');
        this.ctx = this.canvas.getContext('2d');
        this.tileSize = 20;
        this.tileCount = this.canvas.width / this.tileSize;

        this.snake = new Snake(this.tileSize);
        this.food = new Food(this.tileSize, this.tileCount);
        
        this.score = 0;
        this.speed = 100;
        this.currentMode = 'NORMAL';
        this.isGameOver = false;
        this.directionLocked = false;

        this.highScores = JSON.parse(localStorage.getItem('snakeHighScores')) || {
            'SLOW': 0, 'NORMAL': 0, 'FAST': 0
        };

        document.getElementById('startButton').onclick = () => this.start();
        document.getElementById('resetScoreButton').onclick = () => this.resetHighScores();
        document.addEventListener('keydown', this.handleInput.bind(this));
        
        this.updateMenuHighScore();
        this.render();
    }

    updateMenuHighScore() {
        const speedInput = document.querySelector('input[name="speed"]:checked');
        this.currentMode = speedInput.nextElementSibling.innerText;
        const record = this.highScores[this.currentMode];
        
        document.getElementById('bestScore').innerText = record;
        document.getElementById('highScore').innerText = record;
    }

    start() {
        const speedInput = document.querySelector('input[name="speed"]:checked');
        this.speed = parseInt(speedInput.value);
        this.currentMode = speedInput.nextElementSibling.innerText;

        document.getElementById('startMenu').style.display = 'none';
        this.food.spawn(this.snake.body);
        
        this.snake.nextDx = 1;
        this.snake.nextDy = 0;
        
        this.gameLoop();
    }

    handleInput(e) {
        if (this.directionLocked) return;

        const key = e.keyCode;
        if (key === 37 && this.snake.dx !== 1) { this.snake.nextDx = -1; this.snake.nextDy = 0; }
        if (key === 38 && this.snake.dy !== 1) { this.snake.nextDx = 0; this.snake.nextDy = -1; }
        if (key === 39 && this.snake.dx !== -1) { this.snake.nextDx = 1; this.snake.nextDy = 0; }
        if (key === 40 && this.snake.dy !== -1) { this.snake.nextDx = 0; this.snake.nextDy = 1; }
        
        this.directionLocked = true;
    }

    checkCollision(head) {
        const hitWall = head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount;
        const hitSelf = this.snake.body.slice(1).some(p => p.x === head.x && p.y === head.y);
        return hitWall || hitSelf;
    }

    gameLoop() {
        if (this.isGameOver) return;
        this.directionLocked = false;

        const head = this.snake.update();

        if (this.checkCollision(head)) {
            this.endGame();
            return;
        }

        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            document.getElementById('score').innerText = this.score;
            this.food.spawn(this.snake.body);
        } else {
            this.snake.body.pop();
        }

        this.render();
        setTimeout(() => this.gameLoop(), this.speed);
    }

    render() {
        this.ctx.fillStyle = "#000";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.strokeStyle = "#111";
        for(let i=0; i<this.canvas.width; i+=this.tileSize) {
            this.ctx.strokeRect(i, 0, this.tileSize, this.canvas.height);
            this.ctx.strokeRect(0, i, this.canvas.width, this.tileSize);
        }

        this.food.draw(this.ctx);
        this.snake.draw(this.ctx);
    }

    resetHighScores() {
        Swal.fire({
            title: 'Сбросить рекорды?',
            text: "Это действие нельзя отменить!",
            icon: 'warning',
            showCancelButton: true,
            background: '#0a0a0a',
            color: '#fff',
            confirmButtonColor: '#ff003c',
            cancelButtonColor: '#333',
            confirmButtonText: 'Да, сбросить!',
            cancelButtonText: 'Отмена',
            heightAuto: false

        }).then((result) => {
            if (result.isConfirmed) {
                this.highScores = { 'SLOW': 0, 'NORMAL': 0, 'FAST': 0 };
                localStorage.setItem('snakeHighScores', JSON.stringify(this.highScores));
                this.updateMenuHighScore();
                Swal.fire({
                    title: 'Сброшено!',
                    icon: 'success',
                    background: '#0a0a0a',
                    color: '#00ff41',
                    heightAuto: false
                });
            }
        });
    }

    endGame() {
        this.isGameOver = true;
        let isNewRecord = false;

        if (this.score > this.highScores[this.currentMode]) {
            this.highScores[this.currentMode] = this.score;
            localStorage.setItem('snakeHighScores', JSON.stringify(this.highScores));
            isNewRecord = true;
        }

        Swal.fire({
            title: isNewRecord ? 'НОВЫЙ РЕКОРД!' : 'ИГРА ОКОНЧЕНА',
            text: `Ваш результат: ${this.score}`,
            icon: isNewRecord ? 'success' : 'info',
            background: '#0a0a0a',
            color: '#00ff41',
            confirmButtonText: 'Играть снова',
            confirmButtonColor: '#008f11',
            heightAuto: false
        }).then(() => {
            location.reload();
        });
    }
}

const game = new Game();