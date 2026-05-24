let audioCtx = null;
let activeDholIntervalId = null;

function initAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function synthBatHit() {
  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(160, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(75, audioCtx.currentTime + 0.07);
  gainNode.gain.setValueAtTime(0.7, audioCtx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
  osc.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.09);
}

function synthCrowdCheer(duration = 2.5, maxFreq = 950) {
  const bufferSize = audioCtx.sampleRate * duration;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const noiseNode = audioCtx.createBufferSource();
  noiseNode.buffer = buffer;
  const filter = audioCtx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(320, audioCtx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(maxFreq, audioCtx.currentTime + 0.4);
  filter.frequency.exponentialRampToValueAtTime(260, audioCtx.currentTime + duration);
  filter.Q.setValueAtTime(1.8, audioCtx.currentTime);
  const gainNode = audioCtx.createGain();
  gainNode.gain.setValueAtTime(0.001, audioCtx.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.35, audioCtx.currentTime + 0.4);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  noiseNode.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  noiseNode.start();
}

function synthCrowdDisappointment() {
  const duration = 2.0;
  const bufferSize = audioCtx.sampleRate * duration;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const noiseNode = audioCtx.createBufferSource();
  noiseNode.buffer = buffer;
  const filter = audioCtx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(420, audioCtx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(170, audioCtx.currentTime + 0.7);
  const gainNode = audioCtx.createGain();
  gainNode.gain.setValueAtTime(0.001, audioCtx.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.25, audioCtx.currentTime + 0.25);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  noiseNode.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  noiseNode.start();
}

function synthTrumpetHorn() {
  const notes = [392, 523, 659, 784, 659, 784];
  const timings = [0, 0.12, 0.24, 0.36, 0.48, 0.6];
  const durations = [0.1, 0.1, 0.1, 0.1, 0.1, 0.35];
  notes.forEach((freq, idx) => {
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime + timings[idx]);
    gainNode.gain.setValueAtTime(0.001, audioCtx.currentTime + timings[idx]);
    gainNode.gain.linearRampToValueAtTime(0.12, audioCtx.currentTime + timings[idx] + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + timings[idx] + durations[idx]);
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    osc.start(audioCtx.currentTime + timings[idx]);
    osc.stop(audioCtx.currentTime + timings[idx] + durations[idx]);
  });
}

function synthUmpireWhistle() {
  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(2400, audioCtx.currentTime);
  gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.18, audioCtx.currentTime + 0.02);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.28);
  osc.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.28);
}

function synthDholLoop() {
  if (activeDholIntervalId) clearInterval(activeDholIntervalId);
  let step = 0;
  const stepDuration = (60 / 135 / 2) * 1000;
  activeDholIntervalId = setInterval(() => {
    if (step % 2 === 0) {
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(95, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(45, audioCtx.currentTime + 0.15);
      gainNode.gain.setValueAtTime(0.7, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.18);
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.2);
    }
    step++;
    if (step >= 16) {
      clearInterval(activeDholIntervalId);
      activeDholIntervalId = null;
    }
  }, stepDuration);
}

export function playSynthSound(type, sfxEnabled) {
  if (!sfxEnabled) return;
  try {
    initAudioContext();
    if (audioCtx.state === "suspended") audioCtx.resume();
    switch (type) {
      case "bat":
        synthBatHit();
        break;
      case "cheer":
        synthCrowdCheer();
        break;
      case "aww":
        synthCrowdDisappointment();
        break;
      case "horn":
        synthTrumpetHorn();
        break;
      case "whistle":
        synthUmpireWhistle();
        break;
      case "dhol":
        synthDholLoop();
        break;
      default:
        break;
    }
  } catch (e) {
    console.error("Web Audio error:", e);
  }
}

export function playOutcomeSounds(outcome, sfxEnabled) {
  if (!sfxEnabled) return;
  if (outcome === "SIX") {
    setTimeout(() => {
      playSynthSound("cheer", sfxEnabled);
      playSynthSound("horn", sfxEnabled);
      playSynthSound("dhol", sfxEnabled);
    }, 150);
  } else if (outcome === "FOUR") {
    setTimeout(() => {
      playSynthSound("cheer", sfxEnabled);
      playSynthSound("dhol", sfxEnabled);
    }, 150);
  } else if (outcome === "WICKET") {
    setTimeout(() => {
      playSynthSound("aww", sfxEnabled);
      playSynthSound("whistle", sfxEnabled);
    }, 150);
  } else if (outcome === "RUNS") {
    setTimeout(() => playSynthSound("cheer", sfxEnabled), 200);
  } else if (outcome === "EXTRA") {
    setTimeout(() => playSynthSound("whistle", sfxEnabled), 100);
  }
}
