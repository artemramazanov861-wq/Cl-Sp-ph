// Cosmic Cleaner - Простая рабочая версия без багов

// Основные переменные игры
let canvas, ctx;
let gameRunning = false;
let gamePaused = false;
let gameLoop;
let soundEnabled = true;
let score = 0;
let health = 100;
let timeLeft = 60;
let power = 0;

// Игровые объекты
let player = {
    x: 200,
    y: 200,
    width: 40,
    height: 40,
    speed: 4,
    color: '#00ccff',
    isBoosting: false,
    magnetActive: false,
    shieldActive: false
};

// Массивы объектов
let debris = [];
let enemies = [];
let powerups = [];

// Джойстик
let joystick = {
    x: 0,
    y: 0,
    isActive: false,
    baseX: 0,
    baseY: 0,
    maxDistance: 40,
    touchId: null
};

// Настройки игры
const GAME_SETTINGS = {
    DEBRIS_COUNT: 15,
    ENEMY_COUNT: 3,
    POWERUP_COUNT: 2,
    DEBRIS_TO_WIN: 30,
    MAX_HEALTH: 100,
    INITIAL_TIME: 60,
    PLAYER_SPEED: 4,
    BOOST_SPEED: 6,
    MAGNET_RADIUS: 80
};

// Инициализация игры при загрузке страницы
window.addEventListener('DOMContentLoaded', () => {
    console.log('Страница загружена, начинаем инициализацию...');
    initGame();
});

// Основная функция инициализации
function initGame() {
    console.log('Инициализация игры...');
    
    // Сразу показываем загрузочный экран
    showLoadingScreen();
    
    // Настройка canvas
    setupCanvas();
    
    // Загрузка сохраненных данных
    loadGameData();
    
    // Настройка обработчиков событий
    setupEventListeners();
    
    // Настройка джойстика
    setupJoystick();
    
    // Запуск анимации загрузки
    startLoadingAnimation();
}

// Функция для запуска анимации загрузки
function startLoadingAnimation() {
    const loadingProgress = document.getElementById('loadingProgress');
    let progress = 0;
    
    // Анимация загрузки
    const interval = setInterval(() => {
        progress += 2;
        loadingProgress.style.width = `${progress}%`;
        
        if (progress >= 100) {
            clearInterval(interval);
            // После завершения загрузки показываем главное меню
            setTimeout(() => {
                hideLoadingScreen();
                showMainMenu();
                console.log('Игра загружена, показываем главное меню');
            }, 300);
        }
    }, 30);
}

// Показать/скрыть экран загрузки
function showLoadingScreen() {
    hideAllScreens();
    document.getElementById('loadingScreen').classList.add('active');
}

function hideLoadingScreen() {
    document.getElementById('loadingScreen').classList.remove('active');
}

// Настройка canvas
function setupCanvas() {
    canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error('Canvas не найден!');
        return;
    }
    
    ctx = canvas.getContext('2d');
    
    // Установка размеров canvas
    resizeCanvas();
    
    // Обработка изменения размера окна
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('orientationchange', () => {
        setTimeout(resizeCanvas, 100);
    });
}

// Изменение размера canvas
function resizeCanvas() {
    const gameArea = document.querySelector('.game-area');
    if (!gameArea) return;
    
    // Получаем размеры игровой области
    const width = gameArea.clientWidth;
    const height = gameArea.clientHeight;
    
    // Устанавливаем размеры canvas
    canvas.width = Math.max(300, width);
    canvas.height = Math.max(200, height);
    
    console.log('Canvas размер:', canvas.width, 'x', canvas.height);
    
    // Обновляем позицию игрока
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
}

// Загрузка сохраненных данных
function loadGameData() {
    try {
        const savedBestScore = localStorage.getItem('cosmicCleanerBestScore');
        const savedTotalCleaned = localStorage.getItem('cosmicCleanerTotalCleaned');
        
        if (savedBestScore) {
            document.getElementById('bestScoreDisplay').textContent = savedBestScore;
            document.getElementById('totalCleanedDisplay').textContent = savedTotalCleaned || '0';
        }
    } catch (e) {
        console.log('Ошибка загрузки данных:', e);
    }
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Кнопки меню
    document.getElementById('startGame').addEventListener('click', startGame);
    document.getElementById('howToPlay').addEventListener('click', () => {
        hideAllScreens();
        document.getElementById('tutorialScreen').classList.add('active');
    });
    document.getElementById('highScoresBtn').addEventListener('click', () => {
        hideAllScreens();
        document.getElementById('highScoresScreen').classList.add('active');
    });
    document.getElementById('toggleSound').addEventListener('click', toggleSound);
    
    // Кнопки обучения
    document.getElementById('startTutorialGame').addEventListener('click', startGame);
    document.getElementById('backFromTutorial').addEventListener('click', showMainMenu);
    
    // Кнопки рекордов
    document.getElementById('backFromScores').addEventListener('click', showMainMenu);
    
    // Игровые кнопки
    document.getElementById('boostBtn').addEventListener('touchstart', (e) => {
        e.preventDefault();
        player.isBoosting = true;
    });
    
    document.getElementById('boostBtn').addEventListener('touchend', (e) => {
        e.preventDefault();
        player.isBoosting = false;
    });
    
    document.getElementById('magnetBtn').addEventListener('click', () => {
        if (power > 0) {
            player.magnetActive = true;
            setTimeout(() => {
                player.magnetActive = false;
            }, 3000);
        }
    });
    
    document.getElementById('shieldBtn').addEventListener('click', () => {
        player.shieldActive = true;
        setTimeout(() => {
            player.shieldActive = false;
        }, 5000);
    });
    
    document.getElementById('pauseBtn').addEventListener('click', togglePause);
    
    // Кнопки паузы
    document.getElementById('resumeGame').addEventListener('click', togglePause);
    document.getElementById('restartGame').addEventListener('click', startGame);
    document.getElementById('quitToMenu').addEventListener('click', showMainMenu);
    
    // Кнопки Game Over
    document.getElementById('restartAfterGameOver').addEventListener('click', startGame);
    document.getElementById('menuAfterGameOver').addEventListener('click', showMainMenu);
    
    // Кнопки победы
    document.getElementById('nextLevel').addEventListener('click', startGame);
    document.getElementById('menuAfterVictory').addEventListener('click', showMainMenu);
}

// Настройка джойстика - ПРОСТАЯ РАБОЧАЯ ВЕРСИЯ
function setupJoystick() {
    const joystickBase = document.getElementById('joystickBase');
    const joystickElement = document.getElementById('joystick');
    
    if (!joystickBase || !joystickElement) {
        console.error('Элементы джойстика не найдены!');
        return;
    }
    
    // Обновляем позицию основания джойстика
    const updateBasePosition = () => {
        const rect = joystickBase.getBoundingClientRect();
        joystick.baseX = rect.left + rect.width / 2;
        joystick.baseY = rect.top + rect.height / 2;
    };
    
    updateBasePosition();
    window.addEventListener('resize', updateBasePosition);
    
    // Обработка касаний
    joystickBase.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        joystick.isActive = true;
        joystick.touchId = touch.identifier;
        
        // Рассчитываем начальное смещение
        const rect = joystickBase.getBoundingClientRect();
        joystick.baseX = rect.left + rect.width / 2;
        joystick.baseY = rect.top + rect.height / 2;
        
        updateJoystickPosition(touch.clientX, touch.clientY, joystickElement);
    });
    
    document.addEventListener('touchmove', (e) => {
        if (!joystick.isActive || gamePaused || !gameRunning) return;
        
        // Находим нужное касание
        for (let touch of e.touches) {
            if (touch.identifier === joystick.touchId) {
                e.preventDefault();
                updateJoystickPosition(touch.clientX, touch.clientY, joystickElement);
                break;
            }
        }
    });
    
    document.addEventListener('touchend', (e) => {
        joystick.isActive = false;
        joystick.x = 0;
        joystick.y = 0;
        joystick.touchId = null;
        
        // Возвращаем джойстик в центр
        joystickElement.style.transform = 'translate(-50%, -50%)';
    });
}

function updateJoystickPosition(clientX, clientY, joystickElement) {
    if (!joystick.isActive) return;
    
    const deltaX = clientX - joystick.baseX;
    const deltaY = clientY - joystick.baseY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Ограничиваем расстояние
    const limitedDistance = Math.min(distance, joystick.maxDistance);
    
    if (distance > 0) {
        // Нормализуем вектор
        joystick.x = (deltaX / distance) * (limitedDistance / joystick.maxDistance);
        joystick.y = (deltaY / distance) * (limitedDistance / joystick.maxDistance);
        
        // Перемещаем визуальный элемент
        joystickElement.style.transform = `translate(calc(-50% + ${(deltaX / distance) * limitedDistance}px), calc(-50% + ${(deltaY / distance) * limitedDistance}px))`;
    } else {
        joystick.x = 0;
        joystick.y = 0;
    }
}

// Показать главное меню
function showMainMenu() {
    hideAllScreens();
    document.getElementById('mainMenu').classList.add('active');
    gameRunning = false;
    gamePaused = false;
    
    if (gameLoop) {
        clearInterval(gameLoop);
        gameLoop = null;
    }
}

// Начать игру
function startGame() {
    console.log('Начинаем новую игру');
    
    // Сброс игровых данных
    score = 0;
    health = GAME_SETTINGS.MAX_HEALTH;
    timeLeft = GAME_SETTINGS.INITIAL_TIME;
    power = 0;
    
    // Обновляем размеры canvas
    resizeCanvas();
    
    // Инициализируем игровые объекты
    initializeGameObjects();
    
    // Показываем игровой экран
    hideAllScreens();
    document.getElementById('gameScreen').classList.add('active');
    
    // Запускаем игру
    gameRunning = true;
    gamePaused = false;
    
    if (gameLoop) {
        clearInterval(gameLoop);
    }
    
    gameLoop = setInterval(() => {
        if (!gamePaused) {
            updateGame();
            drawGame();
        }
    }, 1000 / 60);
    
    // Запускаем таймер
    startTimer();
    
    // Обновляем UI
    updateUI();
}

// Инициализация игровых объектов
function initializeGameObjects() {
    // Очищаем массивы
    debris = [];
    enemies = [];
    powerups = [];
    
    // Создаем мусор
    for (let i = 0; i < GAME_SETTINGS.DEBRIS_COUNT; i++) {
        debris.push({
            x: Math.random() * (canvas.width - 20) + 10,
            y: Math.random() * (canvas.height - 20) + 10,
            size: 12,
            color: '#00ff88',
            collected: false
        });
    }
    
    // Создаем врагов
    for (let i = 0; i < GAME_SETTINGS.ENEMY_COUNT; i++) {
        enemies.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: 25,
            color: '#ff3366',
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2
        });
    }
    
    // Создаем улучшения
    for (let i = 0; i < GAME_SETTINGS.POWERUP_COUNT; i++) {
        powerups.push({
            x: Math.random() * (canvas.width - 30) + 15,
            y: Math.random() * (canvas.height - 30) + 15,
            size: 20,
            color: '#ffaa00',
            type: 'speed',
            active: true
        });
    }
    
    // Сбрасываем игрока
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    player.isBoosting = false;
    player.magnetActive = false;
    player.shieldActive = false;
}

// Обновление игровой логики
function updateGame() {
    // Обновляем игрока
    updatePlayer();
    
    // Обновляем врагов
    updateEnemies();
    
    // Обновляем мусор
    updateDebris();
    
    // Обновляем улучшения
    updatePowerups();
    
    // Проверяем столкновения
    checkCollisions();
    
    // Обновляем UI
    updateUI();
    
    // Проверяем условия окончания игры
    checkGameEnd();
}

// Обновление игрока
function updatePlayer() {
    // Рассчитываем скорость
    let speed = GAME_SETTINGS.PLAYER_SPEED;
    if (player.isBoosting) {
        speed = GAME_SETTINGS.BOOST_SPEED;
    }
    
    // Применяем движение от джойстика
    const moveX = joystick.x * speed;
    const moveY = joystick.y * speed;
    
    // Обновляем позицию
    player.x += moveX;
    player.y += moveY;
    
    // Ограничиваем движение в пределах canvas
    player.x = Math.max(player.width / 2, Math.min(canvas.width - player.width / 2, player.x));
    player.y = Math.max(player.height / 2, Math.min(canvas.height - player.height / 2, player.y));
}

// Обновление врагов
function updateEnemies() {
    enemies.forEach(enemy => {
        // Обновляем позицию
        enemy.x += enemy.vx;
        enemy.y += enemy.vy;
        
        // Отталкиваем от краев
        if (enemy.x < 0 || enemy.x > canvas.width) enemy.vx *= -1;
        if (enemy.y < 0 || enemy.y > canvas.height) enemy.vy *= -1;
    });
}

// Обновление мусора
function updateDebris() {
    debris.forEach(deb => {
        if (deb.collected) return;
        
        // Притяжение магнитом
        if (player.magnetActive && power > 0) {
            const dx = player.x - deb.x;
            const dy = player.y - deb.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < GAME_SETTINGS.MAGNET_RADIUS) {
                deb.x += (dx / distance) * 6;
                deb.y += (dy / distance) * 6;
                power -= 0.1;
            }
        }
    });
}

// Обновление улучшений
function updatePowerups() {
    // Пока ничего не делаем, улучшения статичны
}

// Проверка столкновений
function checkCollisions() {
    // Столкновения с мусором
    debris.forEach(deb => {
        if (deb.collected) return;
        
        const dx = player.x - deb.x;
        const dy = player.y - deb.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < (player.width/2 + deb.size/2)) {
            // Собираем мусор
            deb.collected = true;
            score++;
            power += 2;
            
            // Обновляем статистику
            updateStats();
            
            // Добавляем новый мусор
            if (debris.filter(d => !d.collected).length < GAME_SETTINGS.DEBRIS_COUNT) {
                debris.push({
                    x: Math.random() * (canvas.width - 20) + 10,
                    y: Math.random() * (canvas.height - 20) + 10,
                    size: 12,
                    color: '#00ff88',
                    collected: false
                });
            }
        }
    });
    
    // Столкновения с врагами
    enemies.forEach(enemy => {
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < (player.width/2 + enemy.size/2)) {
            if (!player.shieldActive) {
                // Получаем урон
                health -= 10;
            }
            
            // Отталкиваем врага
            enemy.vx = (Math.random() - 0.5) * 4;
            enemy.vy = (Math.random() - 0.5) * 4;
        }
    });
    
    // Столкновения с улучшениями
    powerups.forEach(powerup => {
        if (!powerup.active) return;
        
        const dx = player.x - powerup.x;
        const dy = player.y - powerup.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < (player.width/2 + powerup.size/2)) {
            // Активируем улучшение
            powerup.active = false;
            
            if (powerup.type === 'speed') {
                player.speed *= 1.5;
                setTimeout(() => {
                    player.speed = GAME_SETTINGS.PLAYER_SPEED;
                }, 10000);
            }
        }
    });
}

// Обновление статистики
function updateStats() {
    // Сохраняем лучший результат
    const bestScore = localStorage.getItem('cosmicCleanerBestScore') || 0;
    if (score > bestScore) {
        localStorage.setItem('cosmicCleanerBestScore', score.toString());
        localStorage.setItem('cosmicCleanerTotalCleaned', 
            (parseInt(localStorage.getItem('cosmicCleanerTotalCleaned') || 0) + 1).toString());
    }
}

// Отрисовка игры
function drawGame() {
    // Очищаем canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Рисуем фон
    drawBackground();
    
    // Рисуем мусор
    debris.forEach(deb => {
        if (deb.collected) return;
        drawDebris(deb);
    });
    
    // Рисуем улучшения
    powerups.forEach(powerup => {
        if (!powerup.active) return;
        drawPowerup(powerup);
    });
    
    // Рисуем врагов
    enemies.forEach(enemy => {
        drawEnemy(enemy);
    });
    
    // Рисуем игрока
    drawPlayer();
    
    // Рисуем эффекты
    if (player.magnetActive) {
        drawMagnetEffect();
    }
    
    if (player.shieldActive) {
        drawShieldEffect();
    }
}

function drawBackground() {
    // Темный фон
    ctx.fillStyle = '#050510';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Звезды
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    for (let i = 0; i < 50; i++) {
        const x = (i * 17) % canvas.width;
        const y = (i * 13) % canvas.height;
        ctx.fillRect(x, y, 1, 1);
    }
}

function drawDebris(deb) {
    ctx.fillStyle = deb.color;
    ctx.beginPath();
    ctx.arc(deb.x, deb.y, deb.size/2, 0, Math.PI * 2);
    ctx.fill();
}

function drawEnemy(enemy) {
    ctx.fillStyle = enemy.color;
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, enemy.size/2, 0, Math.PI * 2);
    ctx.fill();
    
    // Глаза
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(enemy.x - enemy.size/4, enemy.y, 3, 0, Math.PI * 2);
    ctx.arc(enemy.x + enemy.size/4, enemy.y, 3, 0, Math.PI * 2);
    ctx.fill();
}

function drawPowerup(powerup) {
    ctx.fillStyle = powerup.color;
    ctx.beginPath();
    ctx.arc(powerup.x, powerup.y, powerup.size/2, 0, Math.PI * 2);
    ctx.fill();
    
    // Иконка
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚡', powerup.x, powerup.y);
}

function drawPlayer() {
    // Корпус
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x - player.width/2, player.y - player.height/2, player.width, player.height);
    
    // Кабина
    ctx.fillStyle = '#aaddff';
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.width/3, 0, Math.PI * 2);
    ctx.fill();
    
    // Двигатели
    if (player.isBoosting) {
        ctx.fillStyle = '#ffaa00';
        ctx.fillRect(player.x - player.width/2 - 5, player.y - player.height/4, 5, player.height/2);
        ctx.fillRect(player.x + player.width/2, player.y - player.height/4, 5, player.height/2);
    }
}

function drawMagnetEffect() {
    ctx.strokeStyle = 'rgba(0, 204, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(player.x, player.y, GAME_SETTINGS.MAGNET_RADIUS, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
}

function drawShieldEffect() {
    ctx.strokeStyle = 'rgba(255, 0, 255, 0.5)';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.width/2 + 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
}

// Обновление UI
function updateUI() {
    document.getElementById('score').textContent = `${score}/${GAME_SETTINGS.DEBRIS_TO_WIN}`;
    document.getElementById('health').textContent = `${Math.max(0, Math.round(health))}%`;
    document.getElementById('time').textContent = `${Math.max(0, Math.ceil(timeLeft))}с`;
    
    // Обновляем шкалу энергии
    const powerFill = document.getElementById('powerFill');
    const powerPercent = Math.min(100, (power / 50) * 100);
    powerFill.style.width = `${powerPercent}%`;
    
    // Изменяем цвет здоровья
    const healthElement = document.getElementById('health');
    if (health > 70) {
        healthElement.style.color = '#00ff88';
    } else if (health > 30) {
        healthElement.style.color = '#ffaa00';
    } else {
        healthElement.style.color = '#ff3366';
    }
}

// Таймер игры
function startTimer() {
    const timer = setInterval(() => {
        if (!gamePaused && gameRunning) {
            timeLeft -= 1;
            
            if (timeLeft <= 0) {
                clearInterval(timer);
                gameOver();
            }
        }
        
        if (!gameRunning) {
            clearInterval(timer);
        }
    }, 1000);
}

// Проверка условий окончания игры
function checkGameEnd() {
    // Проигрыш при нулевом здоровье
    if (health <= 0) {
        gameOver();
        return;
    }
    
    // Победа при сборе достаточного количества мусора
    if (score >= GAME_SETTINGS.DEBRIS_TO_WIN) {
        victory();
        return;
    }
}

// Game Over
function gameOver() {
    gameRunning = false;
    clearInterval(gameLoop);
    
    // Обновляем статистику
    document.getElementById('finalScore').textContent = score;
    document.getElementById('finalBestScore').textContent = localStorage.getItem('cosmicCleanerBestScore') || 0;
    
    // Показываем экран Game Over
    hideAllScreens();
    document.getElementById('gameOverScreen').classList.add('active');
}

// Победа
function victory() {
    gameRunning = false;
    clearInterval(gameLoop);
    
    // Обновляем статистику
    document.getElementById('victoryScore').textContent = score;
    document.getElementById('victoryHealth').textContent = `${Math.round(health)}%`;
    document.getElementById('victoryTime').textContent = `${GAME_SETTINGS.INITIAL_TIME - timeLeft}с`;
    
    // Показываем экран победы
    hideAllScreens();
    document.getElementById('victoryScreen').classList.add('active');
}

// Пауза
function togglePause() {
    if (!gameRunning) return;
    
    gamePaused = !gamePaused;
    
    if (gamePaused) {
        hideAllScreens();
        document.getElementById('pauseScreen').classList.add('active');
    } else {
        hideAllScreens();
        document.getElementById('gameScreen').classList.add('active');
    }
}

// Управление звуком
function toggleSound() {
    soundEnabled = !soundEnabled;
    const soundBtn = document.getElementById('toggleSound');
    const icon = soundBtn.querySelector('i');
    icon.className = soundEnabled ? 'fas fa-volume-up' : 'fas fa-volume-mute';
}

// Вспомогательные функции
function hideAllScreens() {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
}