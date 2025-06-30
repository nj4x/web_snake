/**
 * This is a utility script to download the required MP3 tracks for the Snake game.
 * Run this with Node.js to download all tracks to the audio directory.
 */

const fs = require('fs');
const https = require('https');
const path = require('path');

// Track information with download URLs
const tracks = [
  {
    name: "Playful Adventure",
    file: "playful_adventure.mp3",
    url: "https://cdn.pixabay.com/download/audio/2022/03/10/audio_944ccd2b49.mp3?filename=playful-adventure-158791.mp3"
  },
  {
    name: "Arcade Game Loop",
    file: "arcade_game_loop.mp3",
    url: "https://cdn.pixabay.com/download/audio/2021/10/25/audio_d8998975b8.mp3?filename=arcade-game-loop-73857.mp3"
  },
  {
    name: "8-bit Adventure",
    file: "8bit_adventure.mp3",
    url: "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d03e008440.mp3?filename=8-bit-adventure-142028.mp3"
  },
  {
    name: "Digital Smoke",
    file: "digital_smoke.mp3",
    url: "https://cdn.pixabay.com/download/audio/2022/04/20/audio_1f0a8385a3.mp3?filename=digital-smoke-164370.mp3"
  }
];

// Function to download a file
function downloadFile(url, destination) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destination);

    https.get(url, response => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}, status code: ${response.statusCode}`));
        return;
      }

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', err => {
      fs.unlink(destination, () => {});
      reject(err);
    });
  });
}

// Create audio directory if it doesn't exist
// Get absolute path to the audio directory
const audioDir = __dirname;
console.log('Audio directory:', audioDir);

if (!fs.existsSync(audioDir)) {
  console.log('Creating audio directory...');
  fs.mkdirSync(audioDir, { recursive: true });
}

// Download all tracks
async function downloadAllTracks() {
  console.log('Downloading audio tracks for Snake game...');

  for (const track of tracks) {
    const filePath = path.join(audioDir, track.file);

    if (fs.existsSync(filePath)) {
      console.log(`${track.name} already exists, skipping...`);
      continue;
    }

    console.log(`Downloading ${track.name}...`);

    try {
      await downloadFile(track.url, filePath);
      console.log(`✓ Downloaded ${track.name}`);
    } catch (error) {
      console.error(`✗ Failed to download ${track.name}: ${error.message}`);
    }
  }

  console.log('Download complete! All audio tracks are ready for use.');
}

// Run the download
downloadAllTracks();
