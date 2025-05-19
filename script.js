// Game data
let gameData = null;

// Get DOM elements
const spinButton = document.getElementById('spinButton');
const result = document.getElementById('result');
const reels = [
    document.getElementById('reel1'),
    document.getElementById('reel2'),
    document.getElementById('reel3')
];

// Sound elements
const spinSound = document.getElementById('spinSound');
const stopSound = document.getElementById('stopSound');
const winSound = document.getElementById('winSound');
const soundToggle = document.getElementById('soundToggle');
let isMuted = false;

// Sound control functions
function toggleSound() {
    isMuted = !isMuted;
    spinSound.muted = isMuted;
    stopSound.muted = isMuted;
    winSound.muted = isMuted;
    
    // Update icon
    const icon = soundToggle.querySelector('i');
    icon.className = isMuted ? 'bi bi-volume-mute-fill' : 'bi bi-volume-up-fill';
}

// Add sound toggle event listener
soundToggle.addEventListener('click', toggleSound);

// Function to play sound
function playSound(sound) {
    if (!isMuted) {
        sound.currentTime = 0;
        sound.play().catch(error => console.log('Error playing sound:', error));
    }
}

// Function to stop audio
function stopAudio(sound) {
    sound.pause();
    sound.currentTime = 0;
}

// Function to load game data
async function loadGameData() {
    try {
        const response = await fetch('data.json');
        gameData = await response.json();
        initializeGame();
    } catch (error) {
        console.error('Error loading game data:', error);
    }
}

// Function to initialize the game
function initializeGame() {
    // Set titles
    document.getElementById('gameTitle').textContent = gameData.title;
    document.getElementById('imagesTitle').textContent = gameData.subtitle;

    // Create image cache
    const imageCache = {};
    gameData.images.forEach(img => {
        imageCache[img.id] = img.src;
    });

    // Preload images
    const preloadContainer = document.getElementById('preloadImages');
    gameData.images.forEach(img => {
        const preloadImg = new Image();
        preloadImg.src = img.src;
        preloadImg.alt = img.alt;
        preloadContainer.appendChild(preloadImg);
    });

    // Create image grid
    const imageGrid = document.getElementById('imageGrid');
    gameData.images.forEach(img => {
        const col = document.createElement('div');
        col.className = 'col-2';
        col.innerHTML = `
            <div class="image-preview">
                <img src="${img.src}" alt="${img.alt}" class="preview-img">
            </div>
            <div class="image-title">${img.title}</div>
        `;
        imageGrid.appendChild(col);
    });

    // Set initial reel images
    reels.forEach(reel => {
        reel.src = gameData.images[0].src;
    });
}

// Function to get random number between 1 and max
function getRandomReel() {
    return Math.floor(Math.random() * gameData.images.length) + 1;
}

// Function to check if all reels match
function checkWin(reels) {
    return reels.every((val, i, arr) => val === arr[0]);
}

// Function to show result message
function showResult(resultText, isWin = false) {
    result.textContent = resultText;
    result.className = isWin ? 'mt-4 h3 win' : 'mt-4 h3';
    
    // Play appropriate sound
    if (isWin) {
        playSound(winSound);
    }
}

// Function to create a new image element
function createImageElement(number) {
    const img = new Image();
    img.src = gameData.images[number - 1].src;
    img.className = 'reel-img';
    return img;
}

// Function to update reel with sliding animation
function updateReelWithSlide(reel, number) {
    const newImg = createImageElement(number);
    
    newImg.onload = () => {
        const container = reel.parentElement;
        container.appendChild(newImg);
        newImg.classList.add('sliding');
        
        setTimeout(() => {
            reel.src = newImg.src;
            container.removeChild(newImg);
        }, 200);
    };
}

// Function to animate a single reel
function animateReel(reel, duration, finalNumber) {
    return new Promise((resolve) => {
        const startTime = performance.now();
        let lastFrameTime = startTime;
        const frameInterval = 1000 / 30;
        
        function updateReel(currentTime) {
            const elapsed = currentTime - startTime;
            
            if (elapsed < duration) {
                if (currentTime - lastFrameTime >= frameInterval) {
                    const randomNum = getRandomReel();
                    updateReelWithSlide(reel, randomNum);
                    lastFrameTime = currentTime;
                }
                requestAnimationFrame(updateReel);
            } else {
                updateReelWithSlide(reel, finalNumber);
                // Play stop sound when reel stops
                playSound(stopSound);
                resolve(finalNumber);
            }
        }
        
        requestAnimationFrame(updateReel);
    });
}

// Main game function
async function startGame() {
    // Disable spin button during animation
    spinButton.disabled = true;
    result.textContent = '';
    
    // Play spin sound
    playSound(spinSound);
    
    // Define stop times for each reel (in milliseconds)
    const stopTimes = [1000, 2000, 3000]; // 1s, 2s, 3s
    
    // Generate final results for each reel
    const finalResults = reels.map(() => getRandomReel());
    
    // Start all reels with different durations and their final results
    const reelPromises = reels.map((reel, index) => 
        animateReel(reel, stopTimes[index], finalResults[index])
    );
    
    // Wait for all reels to stop and get their final results
    const results = await Promise.all(reelPromises);
    
    // Stop the spin sound when all reels have stopped
    stopAudio(spinSound);
    
    // Wait a bit for the last reel to settle
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check for win using the final results
    const isWin = checkWin(results);
    
    showResult(
        isWin ? '🎉 JACKPOT! You Win! 🎉' : 'ម្តងទៀត',
        isWin
    );
    
    // Re-enable spin button
    spinButton.disabled = false;
}

// Add click event listener to spin button
spinButton.addEventListener('click', startGame);

// Load game data when the page loads
window.addEventListener('load', loadGameData); 