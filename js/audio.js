/**
 * GameAudio - Procedural BGM and SFX using Web Audio API.
 * No external audio files required.
 */
var GameAudio = (function () {
  var ctx = null;
  var masterGain = null;
  var bgmGain = null;
  var sfxGain = null;
  var bgmPlaying = false;
  var bgmNodes = [];
  var bgmTempo = 100;
  var bgmInterval = null;

  function init() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.5;
    masterGain.connect(ctx.destination);

    bgmGain = ctx.createGain();
    bgmGain.gain.value = 0.3;
    bgmGain.connect(masterGain);

    sfxGain = ctx.createGain();
    sfxGain.gain.value = 0.6;
    sfxGain.connect(masterGain);
  }

  // === BGM ===

  var chords = [
    [220, 261.63, 329.63],       // Am
    [174.61, 220, 261.63],       // F
    [261.63, 329.63, 392],       // C
    [196, 246.94, 293.66],       // G
  ];
  var currentChord = 0;
  var beatInChord = 0;
  var beatsPerChord = 8;

  function startBGM() {
    if (bgmPlaying) return;
    bgmPlaying = true;
    currentChord = 0;
    beatInChord = 0;

    // Bass drone
    var bass = ctx.createOscillator();
    bass.type = 'sine';
    bass.frequency.value = 55;
    var bassGain = ctx.createGain();
    bassGain.gain.value = 0.15;
    bass.connect(bassGain);
    bassGain.connect(bgmGain);
    bass.start();
    bgmNodes.push(bass, bassGain);

    // LFO on bass
    var lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.3;
    var lfoGain = ctx.createGain();
    lfoGain.gain.value = 5;
    lfo.connect(lfoGain);
    lfoGain.connect(bass.frequency);
    lfo.start();
    bgmNodes.push(lfo, lfoGain);

    scheduleBeat();
  }

  function scheduleBeat() {
    if (!bgmPlaying) return;

    var interval = 60000 / bgmTempo;
    bgmInterval = setTimeout(function () {
      playBeat();
      scheduleBeat();
    }, interval);
  }

  function playBeat() {
    var chord = chords[currentChord];
    var noteIndex = beatInChord % chord.length;
    var octaveShift = (beatInChord < 4) ? 1 : 2;
    var freq = chord[noteIndex] * octaveShift;

    var osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = freq;

    var gain = ctx.createGain();
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(bgmGain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.25);

    beatInChord++;
    if (beatInChord >= beatsPerChord) {
      beatInChord = 0;
      currentChord = (currentChord + 1) % chords.length;
    }
  }

  function setBGMTempo(bpm) {
    bgmTempo = bpm;
  }

  function stopBGM() {
    bgmPlaying = false;
    clearTimeout(bgmInterval);
    bgmNodes.forEach(function (node) {
      try { node.stop(); } catch (e) {}
      try { node.disconnect(); } catch (e) {}
    });
    bgmNodes = [];
  }

  // === SFX ===

  function playLaser(weaponPower) {
    if (!ctx) return;
    var freq = 800 + weaponPower * 10;
    var osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.1);

    var gain = ctx.createGain();
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(sfxGain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.12);
  }

  function playHit() {
    if (!ctx) return;
    // Noise burst
    var bufferSize = ctx.sampleRate * 0.05;
    var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    var noise = ctx.createBufferSource();
    noise.buffer = buffer;

    var gain = ctx.createGain();
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    noise.connect(gain);
    gain.connect(sfxGain);
    noise.start(ctx.currentTime);

    // Low thud
    var osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 80;
    var oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.1, ctx.currentTime);
    oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.connect(oscGain);
    oscGain.connect(sfxGain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
  }

  function playExplosion() {
    if (!ctx) return;
    // Long noise burst
    var bufferSize = ctx.sampleRate * 0.8;
    var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }
    var noise = ctx.createBufferSource();
    noise.buffer = buffer;

    var gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

    noise.connect(gain);
    gain.connect(sfxGain);
    noise.start(ctx.currentTime);

    // Low sine undertone
    var osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(60, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.5);
    var oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.2, ctx.currentTime);
    oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.connect(oscGain);
    oscGain.connect(sfxGain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.7);
  }

  function playShieldBurst() {
    if (!ctx) return;
    var osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.3);
    var gain = ctx.createGain();
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(sfxGain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  }

  function playCloak() {
    if (!ctx) return;
    var osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2000, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.3);
    var gain = ctx.createGain();
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(sfxGain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  }

  function playEMP() {
    if (!ctx) return;
    // Low rumble
    var bufferSize = ctx.sampleRate * 0.4;
    var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.5);
    }
    var noise = ctx.createBufferSource();
    noise.buffer = buffer;
    var filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 300;
    var gain = ctx.createGain();
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(sfxGain);
    noise.start(ctx.currentTime);
  }

  function playTeleport() {
    if (!ctx) return;
    var osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.1);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.25);
    var gain = ctx.createGain();
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(sfxGain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.35);
  }

  function playOverdrive() {
    if (!ctx) return;
    var osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.3);
    var gain = ctx.createGain();
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(sfxGain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  }

  function playMineDeploy() {
    if (!ctx) return;
    var osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = 800;
    var gain = ctx.createGain();
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(sfxGain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.06);
  }

  function playMineDetonate() {
    if (!ctx) return;
    playExplosion(); // Reuse explosion with slightly different volume
  }

  function playVictoryFanfare() {
    if (!ctx) return;
    // Major chord arpeggio
    var notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach(function (freq, i) {
      var osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      var gain = ctx.createGain();
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.15);
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + i * 0.15 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.8);
      osc.connect(gain);
      gain.connect(sfxGain);
      osc.start(ctx.currentTime + i * 0.15);
      osc.stop(ctx.currentTime + i * 0.15 + 0.9);
    });
  }

  function playAbility(abilityKey) {
    var sfxMap = {
      shield_burst: playShieldBurst,
      cloak: playCloak,
      emp_blast: playEMP,
      teleport: playTeleport,
      overdrive: playOverdrive,
      mine_layer: playMineDeploy
    };
    if (sfxMap[abilityKey]) sfxMap[abilityKey]();
  }

  return {
    init: init,
    startBGM: startBGM,
    stopBGM: stopBGM,
    setBGMTempo: setBGMTempo,
    playLaser: playLaser,
    playHit: playHit,
    playExplosion: playExplosion,
    playAbility: playAbility,
    playVictoryFanfare: playVictoryFanfare
  };
})();
