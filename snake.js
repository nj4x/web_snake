// Game constants
const CELL_SIZE = 20;
const BOARD_WIDTH = 30;
const BOARD_HEIGHT = 20;

// Game difficulty settings
const DIFFICULTY_LEVELS = {
    easy: {
        speed: 180,
        speedIncrease: 3,
        minSpeed: 70,
        scoreMultiplier: 1
    },
    medium: {
        speed: 150,
        speedIncrease: 5,
        minSpeed: 50,
        scoreMultiplier: 1.5
    },
    hard: {
        speed: 120,
        speedIncrease: 7,
        minSpeed: 40,
        scoreMultiplier: 2
    }
};

// Game modes
const GAME_MODES = {
    classic: {
        name: 'Classic',
        description: 'Classic snake game - grow as you eat and avoid walls',
        wallCollision: true
    },
    noWalls: {
        name: 'No Walls',
        description: 'Snake wraps around when it hits the edges',
        wallCollision: false
    }
};

// Default settings
let currentDifficulty = DIFFICULTY_LEVELS.medium;
let currentMode = GAME_MODES.classic;
let GAME_SPEED_INITIAL = currentDifficulty.speed; // milliseconds
let SPEED_INCREASE_FACTOR = currentDifficulty.speedIncrease; // ms decrease per food eaten
let MIN_GAME_SPEED = currentDifficulty.minSpeed; // minimum speed in milliseconds

// Game variables
let snake = [];
let food = { row: 0, col: 0, type: 'regular' }; // Initialize with default values
let direction = 'RIGHT';
let nextDirection = 'RIGHT';
let gameInterval;
let gameSpeed = GAME_SPEED_INITIAL;
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let isPaused = false;
let gameStarted = false;

// Special food types
const FOOD_TYPES = [
    { 
        type: 'regular', 
        probability: 0.7,
        points: 10,
        color: '#e74c3c',
        effect: null
    },
    { 
        type: 'bonus', 
        probability: 0.15,
        points: 30,
        color: '#f39c12',
        effect: null
    },
    { 
        type: 'speed', 
        probability: 0.075,
        points: 15,
        color: '#3498db',
        effect: 'slowDown'
    },
    { 
        type: 'shrink', 
        probability: 0.075,
        points: 5,
        color: '#9b59b6',
        effect: 'shrink'
    }
];

// Special effect timers
let effectTimeout = null;

// DOM elements
const canvas = document.getElementById('game-board');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const gameMessage = document.getElementById('game-message');
const messageContent = document.getElementById('message-content');
const restartButton = document.getElementById('restart-button');
const startScreen = document.getElementById('start-screen');
const startButton = document.getElementById('start-button');
const gameContainer = document.querySelector('.game-container');
const pauseOverlay = document.getElementById('pause-overlay');

// Load images
const appleImg = new Image();
appleImg.onload = function() {
    console.log('Apple image loaded successfully');
    // If game was started before image loaded, redraw
    if (gameStarted) {
        render();
    }
};
appleImg.onerror = function() {
    console.error('Failed to load apple image - will use fallback red circle');
    // Force a render to draw the fallback
    if (gameStarted) {
        render();
    }
};
// Set source after defining handlers
appleImg.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAFz0lEQVRYR8WXe2xTVRzHP+fe27V9rOs2tjHGmICbQwEVUBmeookRCeADfAQFjajEGP4wJiZGE6MmxkQTFR+JRhN8RBAEEvEB8hAFEQEFBpiMsW5sY2Pb9bF2fdzec4y3a2Ed68bGxJO0yb33nPP7fs/v+/udU+F/bsot+iPAOmABUDBFXweB94CPbmpk1QVgtbLrXkf6O8AHgHeKTkeBZ4ENwMAbBeQGEI0CzwMbGZ/xejHIA/YDOXcC4FPgKeBaHB1rBj4E5t0JgD3AY3F0TAArgIXAOuBUIgDFQAEQjNdRAsDLwN+ThYgBKEA+8DPgjdOxE/gMeAFQ4wEYgbEmpQLjgYAB+BeYDgyN19FkAIaAHOBCHB1TgR+AJcCVeAAmUwWvAK8nQp0IwCPAJ3ECGKtjOfBtIgCTqYIvgOXA5UQAJqOC9wEp01CSQTJ5wFlgJvBPIgBjrcQKsBPwT2JgSYA+4HVg02QAxlIFa4EPgEuTGLzsgizgZ6AEODwZgLGq4Clgc5wqEIv5DpgN/JUIwFgr8TxgK3A+weCygd+BWcDRRADGUgUytbKd/pFgcOnAQaAYOJoIwFgq8QKgFjgXR3AZwAFgOnAiEYDRquBR4EvgbBwfpwIHgCKgPhGA0argeWAb8FccAMmA9F0I/JUIwGhVsAb4GDgTB4Bsv7I9FwB/JQIwWhWsBrYDp+KYAQlwCMgH/k4EYLQqWAV8CpyOYwYkwK9ADvBPIgCjVcEzwBdAUxwAcvORA6sAOJ4IwGhVsBL4BmicZAbkxpQFnEwEYLQqeArYATTEASDHsBzJeYkAjFYFy4HdQH0cAHLrlj1gOnAqEYDRquBJYBfwVxwAkgGZljzgTCIAo1XBE8D3wOk4ACQD+4Bs4GwiAKNVwePAXuBkHAByGpKpyQTOJQIwWhU8BvwA/BkHgGRgL5AOnE8EYLQqeBT4ETgRB4BkYA+QClyIZwYSVcFDQDVwLA4ACSBX9BTgYiIAiapgP/AL8EccAJKBXYADuDRegERVsBeoA47GASAZkEeyBbgyXoBEVbAHOAAcjgNAMvA9YASujhcgURXsBg4Bh+IAkAzIp5keuD5egERVsBM4DBxMAEAysA0wAJ54ARJVQRtwFPg9DgDJwLeABgglAiBH5T1j+Cq+AdgCqIlkYBj4GjADkYkApAFngZxR+k8DioAW4HKcQ2s+cBxQJEA8AIXyYTFO34+AN4Br8QqRfJmuAGQVTKQKrgKLgV/iuYxOJsX/AhO6D0jJVQM+wDURAOnzELAT8ExGOyZi8wNQClxKVAWSgb3ANKBlIr0n6isBZOVdTgRAZuBH+YbXMdFeTML/RqJX+URVsBs4J2/DE5lEYvftwHPAP+MFkADPAh8DgUnsB6OxkHtIJfBePBmQ9hLgPaAMiE5m8Akb7QKeBvZPBEDOgWeAD4GQPFkm2HEi7jeBZ4CLEwGQPsuArcClSexwXH7gEfkauj5egBRgNSAnm38iPU3ESfp+AjwJXBoLgALMBTYDHeO9jk2gT+kqhXctsA1QRwOQpf0EyPR3T6CjybpKIVoPvAsoIwHkAi8B84CLk+10knayAiqAz+W5NhJAkdzY5KQaTrKzybpJEK8BX8nHzr8A8mK5Biif7IBjtJNPu1eAL6WfnIRM4FlgCdA9xo4m6y7vhy8CX0sA+RySl8qFk+1gHHZy9a8EPv8XQN505Cl2fhwdTNZEvixXAztVoEq+YOQrdqqafBnLzWybAvwkj9RbwCVgpgp8ALQDF27BAHJIVgBvK0AZsEu+8m7BQKRLEbBRBZ4A3pVPrVs0+Ewgqih//hYD9EeANsWY3PvSv4mdTPvUdq98VAOcioZD+0yWFMP/MfhwnX2//KgoikokolXpDMZqRdGe+S8GHR7TZtDrUKMR1aiqqpFA0P+60WROxF9RVfKyU/YajcbF0n5kBv4BZFjJyHyb5PAAAAAASUVORK5CYII=';

// Set canvas size (defined once here)
canvas.width = BOARD_WIDTH * CELL_SIZE;
canvas.height = BOARD_HEIGHT * CELL_SIZE;

// Stats variables
let foodEatenCount = 0;

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Load background music tracks
    loadBackgroundTracks();

    // Set up the initial game state
    updateScoreDisplay();

    // Add event listeners
    document.addEventListener('keydown', handleKeyPress);
    startButton.addEventListener('click', startGame);
    restartButton.addEventListener('click', startGame);

    // Volume slider functionality
    const volumeSlider = document.getElementById('volume-slider');
    if (volumeSlider) {
        volumeSlider.addEventListener('input', function() {
            const volume = this.value / 100;
            // Update MP3 player volume if active
            if (backgroundMusic) {
                backgroundMusic.volume = volume;
            }

            // Update fallback music volume if that's being used
            if (audioContext && audioContext.destination && audioContext.destination.gain) {
                audioContext.destination.gain.value = volume;
            }
        });
    }

    // Initialize high score from localStorage
    highScore = localStorage.getItem('snakeHighScore') || 0;
    highScoreElement.textContent = `High Score: ${highScore}`;

    // Add event listeners for game mode and difficulty buttons
    document.getElementById('mode-classic').addEventListener('click', () => setGameMode('classic'));
    document.getElementById('mode-no-walls').addEventListener('click', () => setGameMode('noWalls'));

    document.getElementById('difficulty-easy').addEventListener('click', () => setDifficulty('easy'));
    document.getElementById('difficulty-medium').addEventListener('click', () => setDifficulty('medium'));
    document.getElementById('difficulty-hard').addEventListener('click', () => setDifficulty('hard'));

    // Add event listener for music toggle button (now in HTML)
    const musicToggle = document.getElementById('music-toggle');
    if (musicToggle) {
        musicToggle.addEventListener('click', toggleBackgroundMusic);
    }
});

// Set game mode
function setGameMode(mode) {
    // Update button states
    document.getElementById('mode-classic').classList.remove('active');
    document.getElementById('mode-no-walls').classList.remove('active');
    document.getElementById(`mode-${mode === 'noWalls' ? 'no-walls' : mode}`).classList.add('active');

    // Set game mode
    currentMode = GAME_MODES[mode];

    // Update mode display if game has started
    if (gameStarted) {
        document.getElementById('game-mode').textContent = currentMode.name;
    }
}

// Set difficulty
function setDifficulty(level) {
    // Update button states
    document.getElementById('difficulty-easy').classList.remove('active');
    document.getElementById('difficulty-medium').classList.remove('active');
    document.getElementById('difficulty-hard').classList.remove('active');
    document.getElementById(`difficulty-${level}`).classList.add('active');

    // Set difficulty
    currentDifficulty = DIFFICULTY_LEVELS[level];

    // Update game settings
    GAME_SPEED_INITIAL = currentDifficulty.speed;
    SPEED_INCREASE_FACTOR = currentDifficulty.speedIncrease;
    MIN_GAME_SPEED = currentDifficulty.minSpeed;

    // If game is already in progress, update the speed
    if (gameStarted) {
        gameSpeed = Math.max(MIN_GAME_SPEED, GAME_SPEED_INITIAL - (foodEatenCount * SPEED_INCREASE_FACTOR));
        clearInterval(gameInterval);
        gameInterval = setInterval(gameLoop, gameSpeed);
        updateStatsDisplay();
    }
}

// Sound effects
const eatSound = document.getElementById('eat-sound');
const crashSound = document.getElementById('crash-sound');

// Try all approaches to play music - MP3 or synthesized fallback
function tryPlayMusic(trackIndex) {
    // First try to play MP3 file
    if (BACKGROUND_TRACKS.length > 0) {
        return playBackgroundTrack(trackIndex);
    }
    // If no MP3 files are available, try fallback synthesized music
    else if (typeof generateFallbackMusic === 'function') {
        if (generateFallbackMusic(trackIndex % 3)) {
            showTemporaryMessage("Playing synthesized music (fallback)", 2000);
            return true;
        }
    }

    // If all methods fail
    console.error("Unable to play any form of background music");
    return false;
}

// Play background track from MP3 file
function playBackgroundTrack(trackIndex) {
    try {
        // Stop current track if playing
        stopBackgroundMusic();

        // Check if tracks are loaded
        if (BACKGROUND_TRACKS.length === 0) {
            console.log('No background tracks available');
            return;
        }

        // Verify that we haven't tried all tracks already
        if (!window.triedTracks) window.triedTracks = new Set();
        if (window.triedTracks.size >= BACKGROUND_TRACKS.length) {
            console.warn('All tracks have been tried and failed');
            showTemporaryMessage('Music playback unavailable', 2000);
            musicEnabled = false;

            const musicButton = document.getElementById('music-toggle');
            if (musicButton) {
                musicButton.textContent = 'Music: Off';
                musicButton.classList.remove('active');
            }

            return;
        }

        // Get new track
        currentTrackIndex = trackIndex;
        const track = BACKGROUND_TRACKS[currentTrackIndex];
        window.triedTracks.add(currentTrackIndex);

        // Create new audio element
        backgroundMusic = new Audio();

        // Add error handling before setting the source
        backgroundMusic.onerror = function(e) {
            console.error(`Error loading audio track: ${track.file}`, e);
            showTemporaryMessage('Error playing music track', 2000);

            // Try another track
            setTimeout(() => {
                let nextTrack = currentTrackIndex;
                do {
                    nextTrack = (nextTrack + 1) % BACKGROUND_TRACKS.length;
                } while (nextTrack === currentTrackIndex && BACKGROUND_TRACKS.length > 1);
                playBackgroundTrack(nextTrack);
            }, 500);
        };

        // Get volume from slider if available
        const volumeSlider = document.getElementById('volume-slider');
        const volume = volumeSlider ? volumeSlider.value / 100 : 0.3;

        // Show notification of track change
        showTemporaryMessage(`Now playing: ${track.name}`, 2000);

        // Set properties
        backgroundMusic.volume = 0; // Start at 0 for fade-in
        backgroundMusic.loop = true; // Loop the track
        backgroundMusic.src = `audio/${track.file}`;

        // Play the track with fade-in
        const fadePromise = backgroundMusic.play();

        if (fadePromise !== undefined) {
            fadePromise
                .then(() => {
                    // Reset tried tracks since we succeeded
                    window.triedTracks = new Set();

                    // Fade in volume
                    let vol = 0.0;
                    const volumeSlider = document.getElementById('volume-slider');
                    const targetVol = volumeSlider ? volumeSlider.value / 100 : 0.3;

                    const interval = setInterval(() => {
                        if (vol < targetVol) {
                            vol += 0.01;
                            if (backgroundMusic) backgroundMusic.volume = vol;
                        } else {
                            clearInterval(interval);
                        }
                    }, 50);
                })
                .catch(error => {
                    console.error('Error playing background music:', error);
                    // This is likely due to autoplay restrictions
                    showTemporaryMessage('Click anywhere to enable music', 3000);

                    // Set up a one-time click handler to start music
                    const startMusicOnClick = function() {
                        if (backgroundMusic) {
                            backgroundMusic.play()
                                .then(() => {
                                    console.log('Music started after user interaction');
                                    // Reset tried tracks
                                    window.triedTracks = new Set();
                                })
                                .catch(e => {
                                    console.error('Still failed to play music:', e);
                                    // Try another track
                                    setTimeout(() => changeBackgroundTrack(), 500);
                                });
                        }
                        document.removeEventListener('click', startMusicOnClick);
                    };

                    document.addEventListener('click', startMusicOnClick);
                });
        }

    } catch (e) {
        console.log('Error playing background track:', e);
        musicEnabled = false;
    }
}

// Stop background music
function stopBackgroundMusic() {
    try {
        // Stop MP3 playback if active
        if (backgroundMusic) {
            // Fade out and stop
            const fadeOut = setInterval(() => {
                if (backgroundMusic && backgroundMusic.volume > 0.02) {
                    backgroundMusic.volume -= 0.02;
                } else {
                    clearInterval(fadeOut);
                    if (backgroundMusic) {
                        backgroundMusic.pause();
                        backgroundMusic = null;
                    }
                }
            }, 50);
        }

        // Stop synthesized music if that's being used
        if (typeof stopFallbackMusic === 'function') {
            stopFallbackMusic();
        }
    } catch (e) {
        console.log('Error stopping background music:', e);
        // If stopping fails, just set to null
        if (backgroundMusic) {
            try {
                backgroundMusic.pause();
            } catch (err) {}
            backgroundMusic = null;
        }

        // Also stop fallback music
        if (typeof stopFallbackMusic === 'function') {
            stopFallbackMusic();
        }
    }
}

// Change to a random track
function changeBackgroundTrack() {
    // Skip if music is disabled
    if (!musicEnabled) return;

    // Select a random track different from the current one
    if (BACKGROUND_TRACKS.length === 0) {
        console.log('No background tracks available');
        return;
    }

    // Reset tried tracks on intentional change
    if (!window.triedTracks || window.triedTracks.size >= BACKGROUND_TRACKS.length) {
        window.triedTracks = new Set();
    }

    // Find a track that hasn't been tried yet if possible
    let attempts = 0;
    let newIndex;
    do {
        newIndex = Math.floor(Math.random() * BACKGROUND_TRACKS.length);
        attempts++;
        // Prevent infinite loop
        if (attempts > BACKGROUND_TRACKS.length * 2) break;
    } while ((newIndex === currentTrackIndex || window.triedTracks.has(newIndex)) &&
             BACKGROUND_TRACKS.length > window.triedTracks.size);

    // Try to play the selected track or fallback
    const result = tryPlayMusic(newIndex);

    // If we couldn't play any music but music is enabled, try fallback
    if (!result && musicEnabled) {
        console.log("Trying fallback music generation...");
        if (typeof generateFallbackMusic === 'function') {
            generateFallbackMusic(newIndex % 3);
        }
    }
}

// Fallback sound function using AudioContext API
function playFallbackSound(soundType) {
    try {
        // Create audio context
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

        if (soundType === 'eat') {
            // Create a more realistic apple crunch sound
            const duration = 300;

            // Create noise for the crunch
            const bufferSize = audioCtx.sampleRate * 0.3; // 300ms buffer
            const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
            const data = buffer.getChannelData(0);

            // Fill buffer with noise with varying amplitude to sound like a crunch
            for (let i = 0; i < bufferSize; i++) {
                // Decay the sound over time
                const decay = 1 - (i / bufferSize);

                // Create random noise bursts for crunch effect
                if (i % 800 < 300) { // Create burst patterns
                    data[i] = (Math.random() * 2 - 1) * decay * 0.5;
                } else {
                    data[i] = (Math.random() * 2 - 1) * decay * 0.2;
                }
            }

            // Create noise source
            const noise = audioCtx.createBufferSource();
            noise.buffer = buffer;

            // Create bandpass filter for crunch character
            const bandpass = audioCtx.createBiquadFilter();
            bandpass.type = 'bandpass';
            bandpass.frequency.value = 2200;
            bandpass.Q.value = 3;

            // Create gain node for volume control
            const gainNode = audioCtx.createGain();
            gainNode.gain.value = 0.4;

            // Connect nodes: noise -> bandpass -> gain -> output
            noise.connect(bandpass);
            bandpass.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            // Play the sound
            noise.start();
            noise.stop(audioCtx.currentTime + duration/1000);

        } else if (soundType === 'crash') {
            // Create a crash sound
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            // Set oscillator properties
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(150, audioCtx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.3);

            // Set volume envelope
            gainNode.gain.setValueAtTime(0.6, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);

            // Connect nodes
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            // Play the sound
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.5);
        }
    } catch (e) {
        console.log('Fallback sound also failed:', e);
    }
}

// Preload audio with muted play to fix autoplay restrictions
document.addEventListener('click', function() {
    if (!gameStarted) {
        // Initialize audio elements to fix autoplay restrictions
        eatSound.volume = 0;
        crashSound.volume = 0;

        try {
            // Initialize Web Audio API
            playFallbackSound(1, 1); // Just to initialize the AudioContext

            eatSound.play().then(() => {
                eatSound.pause();
                eatSound.currentTime = 0;
                eatSound.volume = 1;
            }).catch(error => {
                console.log('Audio preload error (expected):', error);
            });

            crashSound.play().then(() => {
                crashSound.pause();
                crashSound.currentTime = 0;
                crashSound.volume = 1;
            }).catch(error => {
                console.log('Audio preload error (expected):', error);
            });
        } catch (error) {
            console.log('Audio preload setup error:', error);
        }
    }
}, { once: true });

// DOM elements references for the grid-based approach (not used with canvas)
// const gameBoard = document.getElementById('game-board');

// Show a temporary message
function showTemporaryMessage(message, duration) {
    console.log('Showing temporary message:', message);

    const messageElement = document.createElement('div');
    messageElement.className = 'temp-message';
    messageElement.textContent = message;
    messageElement.style.position = 'absolute';
    messageElement.style.top = '10%';
    messageElement.style.left = '50%';
    messageElement.style.transform = 'translateX(-50%)';
    messageElement.style.padding = '10px 20px';
    messageElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    messageElement.style.color = 'white';
    messageElement.style.borderRadius = '5px';
    messageElement.style.fontWeight = 'bold';
    messageElement.style.zIndex = '100';
    messageElement.style.opacity = '1';
    messageElement.style.transition = 'opacity 0.5s';

    // Make sure the gameContainer is available
    if (gameContainer) {
        gameContainer.appendChild(messageElement);

        // Animate and remove the message
        setTimeout(() => {
            messageElement.style.opacity = '0';
            setTimeout(() => {
                try {
                    gameContainer.removeChild(messageElement);
                } catch (e) {
                    console.log('Error removing message element:', e);
                }
            }, 500);
        }, duration);
    } else {
        console.error('Game container not available for message display');
    }
}

// Show floating score text
function showFloatingText(text, row, col, color) {
    const floatingText = document.createElement('div');
    floatingText.className = 'floating-text';
    floatingText.textContent = text;
    floatingText.style.position = 'absolute';
    floatingText.style.color = color || '#fff';
    floatingText.style.fontSize = '16px';
    floatingText.style.fontWeight = 'bold';
    floatingText.style.textShadow = '1px 1px 2px rgba(0,0,0,0.7)';

    // Get the position of the canvas within the container
    const canvasRect = canvas.getBoundingClientRect();
    const containerRect = gameContainer.getBoundingClientRect();

    // Calculate the position relative to the container
    const relativeLeft = canvasRect.left - containerRect.left + (col * CELL_SIZE + CELL_SIZE/2);
    const relativeTop = canvasRect.top - containerRect.top + (row * CELL_SIZE + CELL_SIZE/2);

    floatingText.style.left = `${relativeLeft}px`;
    floatingText.style.top = `${relativeTop}px`;
    floatingText.style.transform = 'translate(-50%, -50%)';
    floatingText.style.zIndex = '50';
    floatingText.style.transition = 'top 1s, opacity 1s';
    floatingText.style.opacity = '1';

    gameContainer.appendChild(floatingText);

    // Animate and remove the text
    setTimeout(() => {
        floatingText.style.top = `${relativeTop - 30}px`;
        floatingText.style.opacity = '0';
        setTimeout(() => {
            try {
                gameContainer.removeChild(floatingText);
            } catch (e) {
                console.log('Error removing floating text element:', e);
            }
        }, 1000);
    }, 50);
}

// Initialize the game
function initializeGame() {
    // Initialize snake at the center of the board
    const centerY = Math.floor(BOARD_HEIGHT / 2);
    const centerX = Math.floor(BOARD_WIDTH / 4);

    snake = [
        { row: centerY, col: centerX },
        { row: centerY, col: centerX - 1 },
        { row: centerY, col: centerX - 2 }
    ];

    // Reset game state
    direction = 'RIGHT';
    nextDirection = 'RIGHT';
    score = 0;
    foodEatenCount = 0;
    gameSpeed = GAME_SPEED_INITIAL;
    isPaused = false;

    // Make sure pause overlay is hidden
    if (pauseOverlay) {
        pauseOverlay.classList.add('hidden');
    }

    // Resume background music if it was playing
    if (document.getElementById('music-toggle') &&
        document.getElementById('music-toggle').textContent === 'Music: On') {
        // If music exists but volume is very low, restore it
        if (backgroundMusic && backgroundMusic.volume <= 0.05) {
            // Get the desired volume from slider or use default
            const volumeSlider = document.getElementById('volume-slider');
            const targetVol = volumeSlider ? volumeSlider.value / 100 : 0.3;

            // Gradually restore volume
            let currentVol = backgroundMusic.volume;
            const fadeIn = setInterval(() => {
                if (currentVol < targetVol) {
                    currentVol = Math.min(targetVol, currentVol + 0.02);
                    backgroundMusic.volume = currentVol;
                } else {
                    clearInterval(fadeIn);
                }
            }, 50);
        } 
        // If no music is playing, start a new track
        else if (!backgroundMusic) {
            changeBackgroundTrack();
        }
    }

    // Place initial food
    console.log('Placing new food after eating');
    placeFood();

    // Update display
    updateScoreDisplay();
    render();

    // Start game loop
    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(gameLoop, gameSpeed);

    // Hide start screen and show game container
    startScreen.style.display = 'none';
    gameContainer.style.display = 'block';
    gameStarted = true;
}

// Start the game
function startGame() {
    // Hide any game messages that might be visible
    gameMessage.classList.add('hidden');

    // Make sure apple image is loaded
    if (!appleImg.complete) {
        console.log('Waiting for apple image to load...');
        appleImg.onload = function() {
            console.log('Apple image loaded, starting game');
            initializeGame();
        };
        return;
    }

    // Initialize the game
    initializeGame();
}

// Game loop
function gameLoop() {
    if (isPaused) return;

    // Update direction based on nextDirection
    direction = nextDirection;

    // Move the snake
    moveSnake();

    // Check for collisions
    if (checkCollision()) {
        endGame();
        return;
    }

    // Check if food is eaten
    const head = snake[0];
    const foodEaten = head.row === food.row && head.col === food.col;

    if (foodEaten) {
        console.log('Food eaten at position:', food.row, food.col, 'type:', food.type);
        eatFood(); // This will handle scoring and placing new food
        // Don't remove tail when food is eaten (snake grows)
    } else {
        // Remove tail only when no food was eaten
        snake.pop();
    }

    // Update the game display
    render();
}

// Move the snake based on the current direction
function moveSnake() {
    // Create new head position based on current direction
    const head = { ...snake[0] };

    switch (direction) {
        case 'UP':
            head.row -= 1;
            break;
        case 'DOWN':
            head.row += 1;
            break;
        case 'LEFT':
            head.col -= 1;
            break;
        case 'RIGHT':
            head.col += 1;
            break;
    }

    // Add new head to the snake
    snake.unshift(head);

    // Tail removal is handled in gameLoop based on food consumption
}

// Check for collisions with walls or self
function checkCollision() {
    const head = snake[0];

    // Check wall collision (only if in classic mode)
    if (currentMode.wallCollision) {
        if (head.row < 0 || head.row >= BOARD_HEIGHT || head.col < 0 || head.col >= BOARD_WIDTH) {
            return true;
        }
    } else {
        // In no-walls mode, wrap the snake around to the opposite side
        if (head.row < 0) head.row = BOARD_HEIGHT - 1;
        if (head.row >= BOARD_HEIGHT) head.row = 0;
        if (head.col < 0) head.col = BOARD_WIDTH - 1;
        if (head.col >= BOARD_WIDTH) head.col = 0;

        // Update the head position in the snake array
        snake[0] = head;
    }

    // Check self collision (start from index 1 to exclude the head itself)
    for (let i = 1; i < snake.length; i++) {
        if (snake[i].row === head.row && snake[i].col === head.col) {
            return true;
        }
    }

    return false;
}

// Place food randomly on the board
function placeFood() {
    console.log('Placing food, old position:', food.row, food.col);

    // Get all empty cells
    const emptyCells = [];

    for (let row = 0; row < BOARD_HEIGHT; row++) {
        for (let col = 0; col < BOARD_WIDTH; col++) {
            // Check if this position is empty (not occupied by snake)
            if (!snake.some(segment => segment.row === row && segment.col === col)) {
                emptyCells.push({ row, col });
            }
        }
    }

    // Check if there are any empty cells
    if (emptyCells.length === 0) {
        // Game is won - the snake fills the entire board
        showMessage('You Win! The board is full.', true);
        clearInterval(gameInterval);
        return;
    }

    // Store old position
    const oldRow = food.row;
    const oldCol = food.col;

    // Choose a random empty cell for food that's different from the current position
    let newPosition;

    // Only try to find a different position if there are multiple empty cells
    if (emptyCells.length > 1) {
        // Filter out the current position
        const newPositions = emptyCells.filter(cell => !(cell.row === oldRow && cell.col === oldCol));
        newPosition = newPositions[Math.floor(Math.random() * newPositions.length)];
    } else {
        // If only one position is available, use it
        newPosition = emptyCells[0];
    }

    food.row = newPosition.row;
    food.col = newPosition.col;

    // Debug logging
    console.log(`Food moved from (${oldRow},${oldCol}) to (${food.row},${food.col})`);

    // Select food type based on probability
    const random = Math.random();
    let cumulativeProbability = 0;
    let foundType = false;

    for (let i = 0; i < FOOD_TYPES.length; i++) {
        cumulativeProbability += FOOD_TYPES[i].probability;

        if (random <= cumulativeProbability) {
            food.type = FOOD_TYPES[i].type;
            foundType = true;
            break;
        }
    }

    // Fallback if no type was selected (should rarely happen)
    if (!foundType) {
        food.type = 'regular';
    }

    console.log(`Food placed at: ${food.row}, ${food.col}, type: ${food.type}`);
}

// Handle food consumption function is implemented below with special food effects

// Render the game state to the display
// Mobile touch controls (optional)
let touchStartX = 0;
let touchStartY = 0;

document.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
});

document.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].screenX;
    const touchEndY = e.changedTouches[0].screenY;

    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;

    // Determine if it was a swipe (not a tap)
    if (Math.abs(diffX) > 30 || Math.abs(diffY) > 30) {
        // Determine direction of swipe
        if (Math.abs(diffX) > Math.abs(diffY)) {
            // Horizontal swipe
            if (diffX > 0 && direction !== 'LEFT') {
                nextDirection = 'RIGHT';
            } else if (diffX < 0 && direction !== 'RIGHT') {
                nextDirection = 'LEFT';
            }
        } else {
            // Vertical swipe
            if (diffY > 0 && direction !== 'UP') {
                nextDirection = 'DOWN';
            } else if (diffY < 0 && direction !== 'DOWN') {
                nextDirection = 'UP';
            }
        }
    }
});
// Audio variables
let backgroundMusic = null;
let isMusicPlaying = false;
let currentTrackIndex = 0;

// Background music tracks
let BACKGROUND_TRACKS = [
    { name: "Playful Adventure", file: "audio/playful_adventure.mp3" },
    { name: "Arcade Game Loop", file: "audio/arcade_game_loop.mp3" },
    { name: "8-bit Adventure", file: "audio/8bit_adventure.mp3" },
    { name: "Digital Smoke", file: "audio/digital_smoke.mp3" }
];
let musicEnabled = false;

// Function to load and play background music
function loadBackgroundTracks() {
    // Try to load the first track
    backgroundMusic = new Audio(BACKGROUND_TRACKS[0].file);

    // Set up event listeners for audio
    backgroundMusic.addEventListener('error', function(e) {
        console.warn('Failed to load audio file:', e);

        // Try the next track if this one fails
        if (currentTrackIndex < BACKGROUND_TRACKS.length - 1) {
            currentTrackIndex++;
            backgroundMusic.src = BACKGROUND_TRACKS[currentTrackIndex].file;
        } else {
            console.warn('All audio tracks failed to load. Using fallback music.');
            // Try to use fallback synthesized music if available
            if (typeof generateFallbackMusic === 'function') {
                generateFallbackMusic(0);
            }
        }
    });

    // When track ends, play the next one
    backgroundMusic.addEventListener('ended', function() {
        // Move to next track in playlist
        currentTrackIndex = (currentTrackIndex + 1) % BACKGROUND_TRACKS.length;
        backgroundMusic.src = BACKGROUND_TRACKS[currentTrackIndex].file;
        backgroundMusic.play();
    });

    // Set initial volume
    const volumeSlider = document.getElementById('volume-slider');
    if (volumeSlider) {
        backgroundMusic.volume = volumeSlider.value / 100;
    } else {
        backgroundMusic.volume = 0.3; // Default volume
    }
}

// Toggle background music on/off
function toggleBackgroundMusic() {
    const musicToggle = document.getElementById('music-toggle');

    if (!isMusicPlaying) {
        // Start playing music
        if (backgroundMusic) {
            currentTrackIndex = (currentTrackIndex + 1) % BACKGROUND_TRACKS.length;
            backgroundMusic.src = BACKGROUND_TRACKS[currentTrackIndex].file;
            backgroundMusic.play().catch(e => {
                console.warn('Failed to play audio:', e);
                // Try fallback if available
                if (typeof generateFallbackMusic === 'function') {
                    generateFallbackMusic(currentTrackIndex);
                }
            });
        } else if (typeof generateFallbackMusic === 'function') {
            generateFallbackMusic(currentTrackIndex);
        }

        isMusicPlaying = true;
        if (musicToggle) musicToggle.textContent = 'Music: On';
        document.querySelector('.volume-control').style.display = 'block';
    } else {
        // Stop playing music
        if (backgroundMusic) {
            backgroundMusic.pause();
            backgroundMusic.currentTime = 0;
        } else if (typeof stopFallbackMusic === 'function') {
            stopFallbackMusic();
        }

        isMusicPlaying = false;
        if (musicToggle) musicToggle.textContent = 'Music: Off';
        document.querySelector('.volume-control').style.display = 'none';
    }
}
// Event listener for window resize
window.addEventListener('resize', () => {
    // Only adjust if game has started
    if (gameStarted) {
        // Update canvas size if needed
        render();
    }
});

function render() {
    // Clear the canvas
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw snake
    snake.forEach((segment, index) => {
        if (index === 0) {
            // Draw head
            ctx.fillStyle = '#2d5a27';
            ctx.beginPath();
            ctx.arc(
                segment.col * CELL_SIZE + CELL_SIZE/2,
                segment.row * CELL_SIZE + CELL_SIZE/2,
                CELL_SIZE/2,
                0,
                Math.PI * 2
            );
            ctx.fill();

            // Draw eyes
            ctx.fillStyle = 'white';
            const eyeOffset = direction === 'LEFT' ? -3 : 3;
            ctx.beginPath();
            ctx.arc(
                segment.col * CELL_SIZE + CELL_SIZE/2 + eyeOffset,
                segment.row * CELL_SIZE + CELL_SIZE/2 - 2,
                2,
                0,
                Math.PI * 2
            );
            ctx.fill();
        } else {
            // Draw body segments
            ctx.fillStyle = index % 2 === 0 ? '#4CAF50' : '#388E3C';
            ctx.beginPath();
            ctx.arc(
                segment.col * CELL_SIZE + CELL_SIZE/2,
                segment.row * CELL_SIZE + CELL_SIZE/2,
                CELL_SIZE/2 - 1,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
    });

    // Draw food based on type
    const foodX = food.col * CELL_SIZE;
    const foodY = food.row * CELL_SIZE;

    // Find food configuration
    const foodConfig = FOOD_TYPES.find(item => item.type === food.type) || FOOD_TYPES[0];

    if (food.type === 'regular') {
        // Regular apple
        // Apple body (red circle)
        ctx.fillStyle = foodConfig.color;
        ctx.beginPath();
        ctx.arc(
            foodX + CELL_SIZE/2,
            foodY + CELL_SIZE/2,
            CELL_SIZE/2 - 2,
            0,
            Math.PI * 2
        );
        ctx.fill();

        // Apple stem
        ctx.fillStyle = '#6d4c41';
        ctx.fillRect(foodX + CELL_SIZE/2 - 1, foodY + 2, 2, 4);

        // Apple leaf
        ctx.fillStyle = '#4CAF50';
        ctx.beginPath();
        ctx.moveTo(foodX + CELL_SIZE/2 + 2, foodY + 3);
        ctx.quadraticCurveTo(
            foodX + CELL_SIZE/2 + 5,
            foodY + 1,
            foodX + CELL_SIZE/2 + 7,
            foodY + 5
        );
        ctx.quadraticCurveTo(
            foodX + CELL_SIZE/2 + 5,
            foodY + 4,
            foodX + CELL_SIZE/2 + 2,
            foodY + 3
        );
        ctx.fill();

        // Highlight on apple
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(
            foodX + CELL_SIZE/2 - 3,
            foodY + CELL_SIZE/2 - 3,
            3,
            0,
            Math.PI * 2
        );
        ctx.fill();
    } else if (food.type === 'bonus') {
        // Bonus food (golden apple)
        ctx.fillStyle = foodConfig.color;
        ctx.beginPath();
        ctx.arc(
            foodX + CELL_SIZE/2,
            foodY + CELL_SIZE/2,
            CELL_SIZE/2 - 1,
            0,
            Math.PI * 2
        );
        ctx.fill();

        // Star pattern
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        const centerX = foodX + CELL_SIZE/2;
        const centerY = foodY + CELL_SIZE/2;

        // Draw star shape
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * 2 * Math.PI / 5) - Math.PI/2;
            const x = centerX + 5 * Math.cos(angle);
            const y = centerY + 5 * Math.sin(angle);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.fill();
    } else if (food.type === 'speed') {
        // Speed food (blue clock/timer)
        ctx.fillStyle = foodConfig.color;
        ctx.beginPath();
        ctx.arc(
            foodX + CELL_SIZE/2,
            foodY + CELL_SIZE/2,
            CELL_SIZE/2 - 1,
            0,
            Math.PI * 2
        );
        ctx.fill();

        // Clock face details
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1.5;

        // Clock hands
        ctx.beginPath();
        ctx.moveTo(foodX + CELL_SIZE/2, foodY + CELL_SIZE/2);
        ctx.lineTo(foodX + CELL_SIZE/2, foodY + CELL_SIZE/2 - 5);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(foodX + CELL_SIZE/2, foodY + CELL_SIZE/2);
        ctx.lineTo(foodX + CELL_SIZE/2 + 4, foodY + CELL_SIZE/2 + 2);
        ctx.stroke();
    } else if (food.type === 'shrink') {
        // Shrink food (purple potion)
        ctx.fillStyle = foodConfig.color;
        ctx.beginPath();
        ctx.arc(
            foodX + CELL_SIZE/2,
            foodY + CELL_SIZE/2,
            CELL_SIZE/2 - 1,
            0,
            Math.PI * 2
        );
        ctx.fill();

        // Potion bubbles
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.arc(
            foodX + CELL_SIZE/2 - 3,
            foodY + CELL_SIZE/2 - 2,
            2,
            0,
            Math.PI * 2
        );
        ctx.arc(
            foodX + CELL_SIZE/2 + 2,
            foodY + CELL_SIZE/2 + 3,
            1.5,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }
}

// Update score display
function updateScoreDisplay() {
    scoreElement.textContent = `Score: ${score}`;
    highScoreElement.textContent = `High Score: ${highScore}`;
    updateStatsDisplay();
}

// Update game stats display
function updateStatsDisplay() {
    // Update snake length
    document.getElementById('snake-length').textContent = snake.length;

    // Update game speed as a multiplier (relative to initial speed)
    const speedMultiplier = GAME_SPEED_INITIAL / gameSpeed;
    document.getElementById('game-speed').textContent = speedMultiplier.toFixed(1) + 'x';

    // Update game mode
    document.getElementById('game-mode').textContent = currentMode.name;

    // Update food eaten
    document.getElementById('food-eaten').textContent = foodEatenCount;
}

// Event listeners for pause overlay
document.addEventListener('DOMContentLoaded', function() {
    const resumeButton = document.getElementById('resume-button');
    const restartFromPauseButton = document.getElementById('restart-from-pause-button');
    const settingsButton = document.getElementById('settings-button');

    if (resumeButton) {
        resumeButton.addEventListener('click', () => togglePause(false));
    }

    if (restartFromPauseButton) {
        restartFromPauseButton.addEventListener('click', () => {
            togglePause(false);
            startGame();
        });
    }

    if (settingsButton) {
        settingsButton.addEventListener('click', () => {
            togglePause(false);
            // For now, just go back to start screen
            gameContainer.style.display = 'none';
            startScreen.style.display = 'block';
            clearInterval(gameInterval);
            gameStarted = false;
        });
    }
});

// Pause overlay buttons are now set up in the DOMContentLoaded event

// Toggle pause state
function togglePause(state) {
    isPaused = state !== undefined ? state : !isPaused;

    if (!pauseOverlay) return;

    if (isPaused) {
        pauseOverlay.classList.remove('hidden');
    } else {
        pauseOverlay.classList.add('hidden');
    }
}

// Handle key press events
function handleKeyPress(e) {
    if (!gameStarted) return;

    // Pause/Unpause game
    if (e.key === 'p' || e.key === 'P') {
        togglePause();
        return;
    }

    // Toggle background music with 'M' key
    if (e.key === 'm' || e.key === 'M') {
        const musicToggle = document.getElementById('music-toggle');
        if (musicToggle) {
            toggleBackgroundMusic();
        }
        return;
    }

    // Skip if game is paused
    if (isPaused) return;

    // Prevent the snake from going in the opposite direction directly
    switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            if (direction !== 'DOWN') nextDirection = 'UP';
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            if (direction !== 'UP') nextDirection = 'DOWN';
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            if (direction !== 'RIGHT') nextDirection = 'LEFT';
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            if (direction !== 'LEFT') nextDirection = 'RIGHT';
            break;
    }
}

// Apply special food effects
function applyFoodEffect(effect) {
    console.log('Applying food effect:', effect);

    // Clear any existing effect timeout
    if (effectTimeout) {
        clearTimeout(effectTimeout);
        effectTimeout = null;
    }

    switch (effect) {
        case 'slowDown':
            // Temporarily slow down the game
            const originalSpeed = gameSpeed;
            gameSpeed = Math.min(GAME_SPEED_INITIAL * 1.5, gameSpeed * 1.5);
            clearInterval(gameInterval);
            gameInterval = setInterval(gameLoop, gameSpeed);

            // Set timeout to revert back to normal speed after 5 seconds
            effectTimeout = setTimeout(() => {
                gameSpeed = originalSpeed;
                clearInterval(gameInterval);
                gameInterval = setInterval(gameLoop, gameSpeed);
                try {
                    showTemporaryMessage('Speed returned to normal', 1500);
                } catch (e) {
                    console.log('Error showing temporary message:', e);
                }
            }, 5000);
            break;

        case 'shrink':
            // Remove tail segments if the snake is long enough
            if (snake.length > 5) {
                const segmentsToRemove = Math.min(3, Math.floor(snake.length / 3));
                snake = snake.slice(0, snake.length - segmentsToRemove);
                try {
                    showTemporaryMessage(`Snake shrunk by ${segmentsToRemove} segments!`, 1500);
                } catch (e) {
                    console.log('Error showing temporary message:', e);
                }
            }

            // Normal speed adjustment
            gameSpeed = Math.max(MIN_GAME_SPEED, gameSpeed - SPEED_INCREASE_FACTOR);
            clearInterval(gameInterval);
            gameInterval = setInterval(gameLoop, gameSpeed);
            break;
    }
}

// Handle food consumption
function eatFood() {
    // Play sound with robust error handling
    try {
        // Reset sound to beginning to ensure it plays every time
        eatSound.currentTime = 0;
        eatSound.volume = 1.0;

        // Create a promise to play the sound
        const playPromise = eatSound.play();

        // Handle the promise properly
        if (playPromise !== undefined) {
            playPromise.then(() => {
                // Sound played successfully
                console.log('Eat sound played successfully');
            }).catch(error => {
                // Create and play a fallback sound using AudioContext
                console.log('Using fallback audio for eat sound');
                playFallbackSound('eat');
            });
        }
    } catch (error) {
        console.log('Error playing eat sound:', error);
        // Play fallback sound
        playFallbackSound('eat');
    }

    // Find the food type configuration
    const foodConfig = FOOD_TYPES.find(item => item.type === food.type) || FOOD_TYPES[0];

    // Show the food effect message if applicable
    if (foodConfig.effect) {
        try {
            showTemporaryMessage(`${foodConfig.effect.charAt(0).toUpperCase() + foodConfig.effect.slice(1)} effect activated!`, 1500);
        } catch (e) {
            console.log('Error showing temporary message:', e);
        }
    }

    // Increase score based on food type
    const basePoints = foodConfig.points;
    const pointsEarned = Math.floor(basePoints * currentDifficulty.scoreMultiplier);
    score += pointsEarned;

    // Increment food eaten counter
    foodEatenCount++;

    // Show score animation
    try {
        showFloatingText(`+${pointsEarned}`, food.row, food.col, foodConfig.color);
    } catch (e) {
        console.log('Error showing floating text:', e);
    }

    updateScoreDisplay();

    // Update high score if needed
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
        updateScoreDisplay();
    }

    // Apply special effects
    if (foodConfig.effect) {
        try {
            applyFoodEffect(foodConfig.effect);
        } catch (e) {
            console.error('Error applying food effect:', e);
            // Fallback to normal speed adjustment
            gameSpeed = Math.max(MIN_GAME_SPEED, gameSpeed - SPEED_INCREASE_FACTOR);
            clearInterval(gameInterval);
            gameInterval = setInterval(gameLoop, gameSpeed);
        }
    } else {
        // Normal speed up for regular and bonus food
        gameSpeed = Math.max(MIN_GAME_SPEED, gameSpeed - SPEED_INCREASE_FACTOR);
        clearInterval(gameInterval);
        gameInterval = setInterval(gameLoop, gameSpeed);
    }

    // Place new food - ensure this is called
    placeFood();
}

// End the game
function endGame() {
    // Play crash sound with robust error handling
    try {
        // Reset sound to beginning to ensure it plays every time
        crashSound.currentTime = 0;
        crashSound.volume = 1.0;

        // Create a promise to play the sound
        const playPromise = crashSound.play();

        // Handle the promise properly
        if (playPromise !== undefined) {
            playPromise.then(() => {
                // Sound played successfully
                console.log('Crash sound played successfully');
            }).catch(error => {
                // Create and play a fallback sound using AudioContext
                console.log('Using fallback audio for crash sound');
                playFallbackSound('crash');
            });
        }
    } catch (error) {
        console.log('Error playing crash sound:', error);
        // Play fallback sound
        playFallbackSound('crash');
    }

    // Clear game interval
    clearInterval(gameInterval);

    // Pause background music but don't stop it completely
    if (backgroundMusic) {
        try {
            // Reduce volume gradually
            const fadeOut = setInterval(() => {
                if (backgroundMusic && backgroundMusic.volume > 0.02) {
                    backgroundMusic.volume -= 0.02;
                } else {
                    clearInterval(fadeOut);
                    // Don't fully stop since the player might restart
                }
            }, 50);

        } catch (e) {
            console.log('Error fading out background music:', e);
        }
    }

    // Show game over message
    showMessage('Game Over!', true);
}

// Show message
function showMessage(message, isGameOver) {
    messageContent.textContent = message;
    gameMessage.classList.remove('hidden');

    if (isGameOver) {
        // Update high score if needed
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('snakeHighScore', highScore);
            updateScoreDisplay();
        }
    }
}

// The checkCollision function was previously defined above
// No duplicate function needed here