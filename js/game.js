function initGame() {
    const container = document.getElementById('game-container');
    if (!container) {
        console.error('Game container not found');
        return;
    }

    let pacman;
    let coins = [];
    let coinPositions = [];

    function getRandomLetter() {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        return alphabet[Math.floor(Math.random() * alphabet.length)];
    }

    function createCoinGrid() {
        const coinSize = 5; // Now in vw units
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        const horizontalCount = Math.ceil(100 / coinSize) + 1;
        const verticalCount = Math.ceil(100 * (viewportHeight / viewportWidth) / coinSize) + 1;

        console.log(`Viewport size: ${viewportWidth}x${viewportHeight}`);
        console.log(`Creating coin grid: ${horizontalCount}x${verticalCount}`);

        for (let y = 0; y < verticalCount; y++) {
            for (let x = 0; x < horizontalCount; x++) {
                const coin = document.createElement('div');
                coin.className = 'coin';
                coin.style.left = `${x * coinSize}vw`;
                coin.style.top = `${y * coinSize}vw`;
                coin.textContent = getRandomLetter();
                container.appendChild(coin);
                coins.push(coin);
                coinPositions.push({x: x * coinSize, y: y * coinSize});
            }
        }

        console.log(`Created ${coinPositions.length} coins`);
    }

    function movePacman() {
        let currentCoin = 0;
        let direction = 1; // 1 for right, -1 for left

        function moveToNextCoin() {
            if (currentCoin >= coinPositions.length) {
                currentCoin = 0;
                direction = 1;
                coins.forEach(coin => {
                    if (coin && coin.style) {
                        coin.style.opacity = '0.5';
                        coin.textContent = getRandomLetter();
                    }
                });
            }

            if (!coinPositions[currentCoin]) {
                console.error('Invalid coin position');
                return;
            }

            const {x, y} = coinPositions[currentCoin];

            const horizontalCount = Math.ceil(100 / 5) + 1; // 5 is coinSize
            if (direction === 1 && (currentCoin + 1) % horizontalCount === 0) {
                direction = -1;
                currentCoin += horizontalCount;
            } else if (direction === -1 && currentCoin % horizontalCount === 0) {
                direction = 1;
                currentCoin += horizontalCount;
            } else {
                currentCoin += direction;
            }

            pacman.style.transform = `scaleX(${direction})`;

            const animation = pacman.animate([
                { left: `${pacman.offsetLeft}px`, top: `${pacman.offsetTop}px` },
                { left: `${x}vw`, top: `${y}vw` }
            ], {
                duration: 300,
                easing: 'linear',
                fill: 'forwards'
            });

            const mouthAnimation = pacman.animate([
                { backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='16' fill='%2339FF14'/%3E%3Ccircle cx='20' cy='8' r='2' fill='%23000'/%3E%3Cpath id='mouth' fill='%23000' d='M16,16 L32,16 L32,26 L16,16 Z'%3E%3C/path%3E%3C/svg%3E\")" },
                { backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='16' fill='%2339FF14'/%3E%3Ccircle cx='20' cy='8' r='2' fill='%23000'/%3E%3C/svg%3E\")" },
                { backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='16' fill='%2339FF14'/%3E%3Ccircle cx='20' cy='8' r='2' fill='%23000'/%3E%3Cpath id='mouth' fill='%23000' d='M16,16 L32,16 L32,26 L16,16 Z'%3E%3C/path%3E%3C/svg%3E\")" }
            ], {
                duration: 300,
                easing: 'linear',
                iterations: 1
            });

            animation.onfinish = () => {
                pacman.style.left = `${x}vw`;
                pacman.style.top = `${y}vw`;

                if (Math.random() < 0.7 && coins[currentCoin] && coins[currentCoin].style) {
                    coins[currentCoin].style.opacity = '0';
                }

                moveToNextCoin();
            };
        }

        moveToNextCoin();
    }

    console.log('Initializing game');
    container.innerHTML = '';
    coins = [];
    coinPositions = [];
    createCoinGrid();

    console.log(`Coin positions: ${coinPositions.length}`);

    if (coinPositions.length > 0) {
        pacman = document.createElement('div');
        pacman.className = 'pacman';
        pacman.style.left = `${coinPositions[0].x}vw`;
        pacman.style.top = `${coinPositions[0].y}vw`;
        container.appendChild(pacman);
        movePacman();
    } else {
        console.error('No coin positions available');
    }
}

// Run initGame when the DOM is fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    initGame();
}

// Reinitialize the game on window resize
window.addEventListener('resize', initGame);
