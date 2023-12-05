let db;
let health = 100;
let gold = 0;
let experience = 0;
let level = 1;
let enemyHealth = 50;
let specialAttackCooldown = 0;
const enemies = [
    { name: 'Goblin', health: 50, goldReward: 10, expReward: 20 },
    { name: 'Orc', health: 100, goldReward: 20, expReward: 40 }
];
let currentEnemyIndex = 0;

function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('IdleGameDB', 1);

        request.onerror = event => {
            console.error("Database error: ", event.target.errorCode);
            reject('Database error');
        };

        request.onupgradeneeded = event => {
            db = event.target.result;
            db.createObjectStore('gameState', { keyPath: 'id' });
        };

        request.onsuccess = event => {
            db = event.target.result;
            resolve(db);
        };
    });
}

function saveGameState() {
    const transaction = db.transaction(['gameState'], 'readwrite');
    const store = transaction.objectStore('gameState');
    store.put({ id: 1, health, gold, experience, level, enemyHealth });
}

function loadGameState() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['gameState'], 'readonly');
        const store = transaction.objectStore('gameState');
        const request = store.get(1);

        request.onsuccess = event => {
            if (event.target.result) {
                ({ health, gold, experience, level, enemyHealth } = event.target.result);
                updateDisplay();
            }
            resolve();
        };

        request.onerror = event => {
            console.error("Error fetching data: ", event.target.errorCode);
            reject('Error fetching data');
        };
    });
}

function checkLevelUp() {
    if (experience >= 100) {
        level++;
        experience = 0;
        health = 100;
        updateDisplay();
    }
}

function updateDisplay() {
    document.getElementById('player-health').style.width = (health / 100 * 100) + '%';
    document.getElementById('player-gold').textContent = gold;
    document.getElementById('player-exp').style.width = (experience / 100 * 100) + '%';
    document.getElementById('player-level').textContent = level;

    const enemy = enemies[currentEnemyIndex];
    let enemyHealthPercent = (enemyHealth / enemy.health * 100);
    enemyHealthPercent = enemyHealthPercent < 0 ? 0 : enemyHealthPercent;
    document.getElementById('enemy-health').style.width = enemyHealthPercent + '%';
}

function spawnNewEnemy() {
    currentEnemyIndex = (currentEnemyIndex + 1) % enemies.length;
    enemyHealth = enemies[currentEnemyIndex].health;
    updateEnemyDisplay();
}

function updateEnemyDisplay() {
    const enemy = enemies[currentEnemyIndex];
    document.getElementById('enemy-name').textContent = enemy.name;
    document.getElementById('enemy-health').style.width = '100%';
}

function handleEnemyDefeat() {
    gold += enemies[currentEnemyIndex].goldReward;
    experience += enemies[currentEnemyIndex].expReward;
    checkLevelUp();
    spawnNewEnemy();
}

document.addEventListener("DOMContentLoaded", function() {
    initDB().then(() => {
        loadGameState().then(() => {
            updateEnemyDisplay();
        });
    });

    document.getElementById('attack-button').addEventListener('click', function() {
        enemyHealth -= 10;
        if (enemyHealth <= 0) handleEnemyDefeat();
        updateDisplay();
    });

    document.getElementById('special-attack-button').addEventListener('click', function() {
        if (specialAttackCooldown === 0) {
            enemyHealth -= 30;
            specialAttackCooldown = 10;
            if (enemyHealth <= 0) handleEnemyDefeat();
            updateDisplay();
        }
    });

    document.getElementById('buy-health-potion').addEventListener('click', function() {
        if (gold >= 10) {
            gold -= 10;
            health += 20;
            if (health > 100) health = 100;
            updateDisplay();
        }
    });

    document.getElementById('buy-upgrade').addEventListener('click', function() {
        if (gold >= 50) {
            gold -= 50;
            updateDisplay();
        }
    });

    setInterval(function() {
        if (specialAttackCooldown > 0) {
            specialAttackCooldown--;
            document.getElementById('special-cooldown').textContent = specialAttackCooldown;
        }
    }, 1000);

    setInterval(function() {
        if (enemyHealth > 0) {
            enemyHealth -= 5;
            if (enemyHealth <= 0) handleEnemyDefeat();
        }
        updateDisplay();
    }, 1000);

    setInterval(saveGameState, 30000);
});
