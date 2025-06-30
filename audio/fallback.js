/**
 * Fallback music generation if MP3 files aren't available
 * This uses the Web Audio API to generate simple background music
 */

let audioContext = null;
let oscillator = null;
let gainNode = null;

// Simple melody patterns
const FALLBACK_MELODIES = [
    // C major scale melody
    [
        {note: 'C4', duration: 0.25},
        {note: 'E4', duration: 0.25},
        {note: 'G4', duration: 0.5},
        {note: 'E4', duration: 0.25},
        {note: 'C4', duration: 0.75},
        {note: 'G3', duration: 0.25},
        {note: 'C4', duration: 0.5},
    ],
    // Simple descending pattern
    [
        {note: 'A4', duration: 0.3},
        {note: 'G4', duration: 0.3},
        {note: 'F4', duration: 0.3},
        {note: 'E4', duration: 0.3},
        {note: 'D4', duration: 0.3},
        {note: 'C4', duration: 0.5},
    ],
    // Bouncy pattern
    [
        {note: 'C4', duration: 0.2},
        {note: 'E4', duration: 0.2},
        {note: 'C4', duration: 0.2},
        {note: 'G4', duration: 0.4},
        {note: 'E4', duration: 0.2},
        {note: 'C4', duration: 0.3},
    ]
];

// Note frequency map
const NOTE_FREQUENCIES = {
    'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81, 'F3': 174.61,
    'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
    'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23,
    'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88
};

// Generate melody using Web Audio API
function generateFallbackMusic(melodyIndex) {
    try {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        const melody = FALLBACK_MELODIES[melodyIndex % FALLBACK_MELODIES.length];
        let time = audioContext.currentTime;

        // Play melody in a loop
        function playMelody() {
            for (let i = 0; i < melody.length; i++) {
                const note = melody[i];
                const freq = NOTE_FREQUENCIES[note.note];

                // Create oscillator for each note
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();

                osc.type = 'sine';
                osc.frequency.value = freq;

                // Get current volume setting
                const volumeSlider = document.getElementById('volume-slider');
                const maxVolume = volumeSlider ? volumeSlider.value / 100 * 0.3 : 0.2;

                // Apply envelope with current volume
                gain.gain.setValueAtTime(0, time);
                gain.gain.linearRampToValueAtTime(maxVolume, time + 0.05);
                gain.gain.linearRampToValueAtTime(maxVolume * 0.75, time + note.duration - 0.05);
                gain.gain.linearRampToValueAtTime(0, time + note.duration);

                // Connect and schedule
                osc.connect(gain);
                gain.connect(audioContext.destination);

                osc.start(time);
                osc.stop(time + note.duration);

                time += note.duration;
            }

            // Schedule next loop
            setTimeout(playMelody, time * 1000);
        }

        playMelody();
        return true;

    } catch (e) {
        console.error('Failed to generate fallback music:', e);
        return false;
    }
}

function stopFallbackMusic() {
    if (audioContext) {
        audioContext.close();
        audioContext = null;
    }
}
