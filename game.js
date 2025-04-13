// Game Constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const NUM_CATS = 10;
const MILK_SAUCERS = 5;

// Game State
const gameState = {
    cats: [],
    milkSaucers: [],
    ball: null,
    happiness: 0
};

// Initialize Game
function init() {
    const canvas = document.getElementById('gameCanvas');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    const ctx = canvas.getContext('2d');

    // Create game objects
    createCats();
    createMilkSaucers();
    createBall();

    // Start game loop
    gameLoop(ctx);
}

// Create cat objects
function createCats() {
    for (let i = 0; i < NUM_CATS; i++) {
        gameState.cats.push({
            x: Math.random() * CANVAS_WIDTH,
            y: Math.random() * CANVAS_HEIGHT,
            color: `hsl(${330 + Math.random() * 30}, 80%, 70%)`,
            energy: 50,
            nap: 50,
            happiness: 0,
            state: 'wandering'
        });
    }
}

// Create milk saucers
function createMilkSaucers() {
    for (let i = 0; i < MILK_SAUCERS; i++) {
        gameState.milkSaucers.push({
            x: Math.random() * CANVAS_WIDTH,
            y: Math.random() * CANVAS_HEIGHT,
            amount: 100
        });
    }
}

// Create ball
function createBall() {
    gameState.ball = {
        x: CANVAS_WIDTH / 2,
        y: CANVAS_HEIGHT / 2,
        radius: 10
    };
}

// Update cat behaviors
function updateCats() {
    gameState.cats.forEach(cat => {
        // State transitions
        if (cat.energy < 30 && cat.state !== 'drinking') {
            cat.state = 'drinking';
        } else if (cat.energy > 90 && cat.state === 'drinking') {
            cat.state = 'sleeping';
        } else if (cat.nap > 90 && cat.state === 'sleeping') {
            cat.state = 'playing';
        } else if (Math.random() < 0.01) {
            // Occasionally check if they should do something else
            if (cat.energy < 30) cat.state = 'drinking';
            else if (cat.nap < 30) cat.state = 'sleeping';
            else if (cat.happiness < 30) cat.state = 'playing';
            else cat.state = 'sleeping'; // Default to sleeping if no other needs
        }

        // Cat-to-cat collision
        gameState.cats.forEach(otherCat => {
            if (cat !== otherCat && distance(cat, otherCat) < 20) {
                const angle = Math.atan2(cat.y - otherCat.y, cat.x - otherCat.x);
                cat.x += Math.cos(angle) * 0.5;
                cat.y += Math.sin(angle) * 0.5;
            }
        });

        // State behaviors
        switch(cat.state) {
            case 'drinking':
                const nearestSaucer = findNearestSaucer(cat);
                if (nearestSaucer.amount > 0) {
                    moveToward(cat, nearestSaucer, 1.5);
                    if (distance(cat, nearestSaucer) < 20) {
                        cat.energy += 0.5;
                        nearestSaucer.amount = Math.max(0, nearestSaucer.amount - 0.2);
                    }
                } else {
                    cat.state = 'wandering';
                }
                break;
            case 'sleeping':
                cat.nap += 0.3;
                break;
            case 'playing':
                moveToward(cat, gameState.ball, 2);
                if (distance(cat, gameState.ball) < 20) {
                    gameState.ball.x += (Math.random() - 0.5) * 30;
                    gameState.ball.y += (Math.random() - 0.5) * 30;
                    cat.happiness += 1;
                }
                break;
            default:
                // Cats no longer wander - just stay in place
                cat.state = 'sleeping'; // Fallback to sleeping state
        }

        // Improved collision avoidance and following behavior
        gameState.cats.forEach(otherCat => {
            if (cat !== otherCat) {
                const dist = distance(cat, otherCat);
                if (dist < 30) {
                    const angle = Math.atan2(cat.y - otherCat.y, cat.x - otherCat.x);
                    cat.x += Math.cos(angle) * 0.8;
                    cat.y += Math.sin(angle) * 0.8;
                } else if (dist < 100 && Math.random() < 0.1) {
                    // Chance to follow another cat
                    cat.target = {x: otherCat.x, y: otherCat.y};
                }
            }
        });

        // Activity-based need decay
        switch(cat.state) {
            case 'wandering':
                cat.energy = Math.max(0, cat.energy - 0.1);
                cat.hunger = Math.max(0, cat.hunger - 0.15);
                cat.happiness = Math.max(0, cat.happiness - 0.05);
                break;
            case 'drinking':
                cat.energy = Math.min(100, cat.energy + 0.5);
                cat.hunger = Math.min(100, cat.hunger + 0.8);
                cat.happiness = Math.max(0, cat.happiness - 0.02);
                break;
            case 'sleeping':
                cat.energy = Math.min(100, cat.energy + 0.3);
                cat.nap = Math.min(100, cat.nap + 0.5);
                cat.hunger = Math.max(0, cat.hunger - 0.1);
                break;
            case 'playing':
                cat.energy = Math.max(0, cat.energy - 0.2);
                cat.happiness = Math.min(100, cat.happiness + 0.4);
                cat.hunger = Math.max(0, cat.hunger - 0.2);
                break;
        }
    });
}

// Helper functions
function findNearestSaucer(cat) {
    return gameState.milkSaucers.reduce((nearest, saucer) => {
        const dist = distance(cat, saucer);
        return dist < distance(cat, nearest) ? saucer : nearest;
    }, gameState.milkSaucers[0]);
}

function moveToward(obj, target, speed) {
    const dx = target.x - obj.x;
    const dy = target.y - obj.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist > 5) {
        obj.x = Math.max(10, Math.min(CANVAS_WIDTH-10, obj.x + (dx/dist) * speed));
        obj.y = Math.max(10, Math.min(CANVAS_HEIGHT-10, obj.y + (dy/dist) * speed));
    }
}

function checkBoundaries(obj) {
    obj.x = Math.max(10, Math.min(CANVAS_WIDTH-10, obj.x));
    obj.y = Math.max(10, Math.min(CANVAS_HEIGHT-10, obj.y));
}

function distance(a, b) {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}

function findNapSpot(cat) {
    // Try to find a spot at least 50px away from other cats
    for (let attempt = 0; attempt < 10; attempt++) {
        const spot = {
            x: Math.random() * CANVAS_WIDTH,
            y: Math.random() * CANVAS_HEIGHT
        };
        
        const tooClose = gameState.cats.some(otherCat => 
            otherCat !== cat && distance(spot, otherCat) < 50
        );
        
        if (!tooClose) return spot;
    }
    return null; // No suitable spot found
}

function findNearestObject(cat) {
    const allObjects = [...gameState.milkSaucers, gameState.ball];
    return allObjects.reduce((nearest, obj) => {
        const dist = distance(cat, obj);
        return dist < distance(cat, nearest) ? obj : nearest;
    }, allObjects[0]);
}

function updateHappiness() {
    // Update individual cat happiness displays if needed
    gameState.cats.forEach((cat, index) => {
        const element = document.getElementById(`cat-${index}-happiness`);
        if (element) {
            element.textContent = `${Math.min(100, Math.max(0, cat.happiness))}%`;
        }
    });
}

// Drawing functions
function drawMilkSaucers(ctx) {
    gameState.milkSaucers.forEach(saucer => {
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(saucer.x, saucer.y, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // Milk level - ensure radius is never negative
        const milkRadius = 15 * Math.max(0, saucer.amount) / 100;
        ctx.fillStyle = '#ADD8E6';
        ctx.beginPath();
        ctx.arc(saucer.x, saucer.y, milkRadius, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawBall(ctx) {
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(gameState.ball.x, gameState.ball.y, gameState.ball.radius, 0, Math.PI * 2);
    ctx.fill();
}

function drawCats(ctx) {
    gameState.cats.forEach(cat => {
        ctx.fillStyle = cat.color;
        ctx.beginPath();
        ctx.arc(cat.x, cat.y, 10, 0, Math.PI * 2);
        ctx.fill();

        // Draw only the relevant status bar
        switch(cat.state) {
            case 'drinking':
                drawStatusBar(ctx, cat.x, cat.y - 15, cat.energy, 'hunger-bar', 'Energy');
                break;
            case 'sleeping':
                drawStatusBar(ctx, cat.x, cat.y - 15, cat.nap, 'nap-bar', 'Nap');
                break;
            case 'playing':
                drawStatusBar(ctx, cat.x, cat.y - 15, cat.happiness, 'fun-bar', 'Fun');
                break;
        }

        // Draw state label
        ctx.fillStyle = '#000000';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(cat.state.toUpperCase(), cat.x, cat.y - 30);
    });
}

function drawStatusBar(ctx, x, y, value, className, label) {
    const width = 40 * (value / 100);
    ctx.fillStyle = getComputedStyle(document.documentElement)
        .getPropertyValue(`--${className}`) || '#FFFFFF';
    ctx.fillRect(x - 20, y, width, 5);
    ctx.strokeStyle = '#000000';
    ctx.strokeRect(x - 20, y, 40, 5);
}

function drawUI(ctx) {
    // Happiness is already updated in DOM
}

// Main game loop
function gameLoop(ctx) {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    updateCats();
    updateHappiness();
    drawMilkSaucers(ctx);
    drawBall(ctx);
    drawCats(ctx);
    drawUI(ctx);
    requestAnimationFrame(() => gameLoop(ctx));
}

window.onload = init;
