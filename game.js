/**
 * Birthday Slot-Machine Game Engine
 *
 * Data-driven game that reveals character cards through slot machine spins.
 */

// ============================================
// Asset Path Configuration (Single Source of Truth)
// ============================================

const ASSET_PATHS = {
  images: 'images/',
  speechbubbles: 'speechbubbles/',
  slotSymbols: 'slot symbols/',
  sounds: 'sounds/'
};

// ============================================
// Asset Map - Maps symbolic names to filenames
// ============================================

const ASSET_MAP = {
  // Slot symbols
  'flower1': 'flower1.png',
  'flower2': 'flower2.png',
  'opera': 'opera.png',
  'explorer': 'explorer.png',
  'cassandra': 'cassandra.png',
  'wimbledon': 'wimbledon.png',
  'toadstool': 'toadstool.png',

  // Card images (final revealed state)
  'finaloperamaster': 'finaloperamaster.png',
  'finalmastertraveler': 'finalmastertraveler.png',
  'finalMasterKassa': 'finalMasterKassa.png',
  'wimbledonmaster': 'wimbledonmaster.png',
  'finalMAstertoadstool': 'finalMAstertoadstool.png',

  // Card tease images
  'operacloth': 'operacloth.png',
  'explorercloth': 'explorercloth.png',
  'cassandracloths': 'cassandracloths.png',
  'wimbledoncloth': 'wimbledoncloth.png',
  'toadstoolcloths': 'toadstoolcloths.png'
};

// ============================================
// Game State
// ============================================

const GameState = {
  currentEventId: 0,
  eventIndex: 0,
  cardsRevealed: new Set(),
  activeSpeaker: null,
  isSpinning: false,
  isFinale: false,
  initialized: false
};

// ============================================
// Audio System
// ============================================

const AudioManager = {
  contexts: {},

  getAudio(key) {
    if (!this.contexts[key]) {
      this.contexts[key] = new Audio();
    }
    return this.contexts[key];
  },

  play(key) {
    const audio = this.getAudio(key);
    // Resolve the path if it's a sound file
    const src = AssetHelper.resolveSound(key);
    audio.src = src;
    audio.currentTime = 0;
    return audio.play().catch(e => {
      console.warn(`Audio play failed for ${key}:`, e);
    });
  },

  stop(key) {
    const audio = this.getAudio(key);
    audio.pause();
    audio.currentTime = 0;
  },

  playMusic(key) {
    if (key) {
      this.stop('bg music');
      this.playMusicLoop(key);
    }
  },

  playMusicLoop(key) {
    const audio = this.getAudio('bg music');
    audio.src = `${ASSET_PATHS.sounds}${key}`;
    audio.loop = false;
    return audio.play().catch(e => {
      console.warn(`Music play failed for ${key}:`, e);
    });
  },

  stopAllAudio() {
    Object.values(this.contexts).forEach(audio => audio.pause());
  }
};

// ============================================
// Asset Helper
// ============================================

const AssetHelper = {

  // Resolve image path based on filename pattern or explicit type
  resolveImage(filename, type = null) {
    // Check if it's a speechbubble image (contains 'mono', 'dia' in name)
    const isSpeechBubble = /mono|dia/.test(filename);

    if (isSpeechBubble) {
      return `${ASSET_PATHS.speechbubbles}${filename}`;
    }

    // Check if it's in our asset map
    const mapped = ASSET_MAP[filename];
    if (mapped) {
      return `${ASSET_PATHS.images}${mapped}`;
    }

    // Check slot symbols
    const symbolPath = this.resolveSlotSymbol(filename);
    if (symbolPath) {
      return `${ASSET_PATHS.slotSymbols}${symbolPath}`;
    }

    // Default to images directory
    return `${ASSET_PATHS.images}${filename}`;
  },

  resolveSlotSymbol(name) {
    const symbols = ['flower1', 'flower2', 'opera', 'explorer', 'cassandra', 'wimbledon', 'toadstool'];
    if (symbols.includes(name)) {
      return `${ASSET_PATHS.slotSymbols}${name}.png`;
    }
    return null;
  },

  resolveSpeechbubble(name) {
    return `${ASSET_PATHS.speechbubbles}${name}`;
  },

  resolveSound(name) {
    return `${ASSET_PATHS.sounds}${name}`;
  }
};

// ============================================
// Scene Manager
// ============================================

const SceneManager = {

  // Show speech bubble over headmaster
  showHeadmasterSpeechBubble(imageFilename) {
    const bubble = document.getElementById('headmaster-speech-bubble');
    if (!bubble) return;

    const img = bubble.querySelector('img');
    if (img) {
      img.src = AssetHelper.resolveSpeechbubble(imageFilename);
    }
    bubble.classList.remove('hidden');
  },

  // Hide headmaster speech bubble
  hideHeadmasterSpeechBubble() {
    const bubble = document.getElementById('headmaster-speech-bubble');
    if (bubble) {
      bubble.classList.add('hidden');
    }
  },

  // Show speech bubble over a card
  showSpeechBubble(cardId, imageFilename) {
    const cardContainer = document.getElementById(`background`);
    console.log('=================cid: ' + cardId);

    if (!cardContainer) return;

    const bubble = document.createElement('div');
    bubble.className = 'speech-bubble';
    bubble.id = `bubble-card-${cardId}`;

    const img = document.createElement('img');
    img.src = AssetHelper.resolveSpeechbubble(imageFilename);
    img.style.width = '300px';
    img.style.height = 'auto';

    bubble.appendChild(img);

    // Position relative to viewport (absolute positioning on overlay)
    const rect = cardContainer.getBoundingClientRect();
    bubble.style.position = 'fixed';
    bubble.style.left = (cardId-1)*220 + 'px';
    bubble.style.top = '0px';
    if(cardId%2==0){
      bubble.style.marginTop = "-40px";
    }
    bubble.style.zIndex = 101;

    // Append to overlay instead of card container
    const overlay = document.getElementById('speech-bubble-overlay');
    if (overlay) {
      overlay.appendChild(bubble);
    }
  },

  // Remove speech bubble
  removeSpeechBubble(cardId) {
    const bubble = document.getElementById(`bubble-card-${cardId}`);
    if (bubble) {
      bubble.remove();
    }
  },

  // Clear all speech bubbles
  clearSpeechBubbles() {
    const overlay = document.getElementById('speech-bubble-overlay');
    if (overlay) {
      const bubbles = overlay.querySelectorAll('.speech-bubble');
      bubbles.forEach(b => b.remove());
    }
  },

  // Block/unblock slot machine clicks during events
  blockSlotMachine(block = true) {
    const blocker = document.getElementById('slot-machine-blocker');
    if (blocker) {
      if (block) blocker.classList.remove('hidden');
      else blocker.classList.add('hidden');
    }
  },

  // Dim the scene
  dimScene(dimmed = true) {
    console.log('why was this here');
  },

  // Show dialogue speakers
  showDialogueSpeaker(position, speakerName, imageFilename) {
    const speaker = document.getElementById(`speaker-${position}`);
    if (!speaker) return;

    // Map speakers to their card final images
    const speakerToCardImage = {
      'opera': 'finaloperamaster.png',
      'explorer': 'finalmastertraveler.png',
      'cassandra': 'finalMasterKassa.png',
      'wimbledon': 'wimbledonmaster.png',
      'toadstool': 'finalMAstertoadstool.png',
      'toadstoolParasite': 'finalMAstertoadstool.png'
    };

    speaker.innerHTML = '';

    // Create container for card image
    const cardImg = document.createElement('img');
    cardImg.src = AssetHelper.resolveImage(speakerToCardImage[speakerName] || 'finaloperamaster.png');
    cardImg.className = 'dialogue-card-img';

    // Create speechbubble image
    const bubbleImg = document.createElement('img');
    bubbleImg.src = AssetHelper.resolveSpeechbubble(imageFilename);
    if(speakerName == "toadstoolParasite"){
      bubbleImg.className = 'dialogue-bubble-img-para';
    }else{
      bubbleImg.className = 'dialogue-bubble-img';
    }


    speaker.appendChild(cardImg);
    speaker.appendChild(bubbleImg);
  },

  // Clear dialogue speakers
  clearDialogueSpeakers() {
    ['left', 'right'].forEach(pos => {
      const speaker = document.getElementById(`speaker-${pos}`);
      if (speaker) speaker.innerHTML = '';
    });
  },

  // Show monologue speaker (centered)
  showMonologueSpeaker(speakerName, imageFilename) {
    const speaker = document.getElementById('monologue-speaker');
    if (!speaker) return;

    // Map speakers to their card final images
    const speakerToCardImage = {
      'headmaster': 'headmistressrightside.png',
      'opera': 'finaloperamaster.png',
      'explorer': 'finalmastertraveler.png',
      'cassandra': 'finalMasterKassa.png',
      'wimbledon': 'wimbledonmaster.png',
      'toadstool': 'finalMAstertoadstool.png'
    };

    speaker.innerHTML = '';

    // Create container for card image
    const cardImg = document.createElement('img');
    cardImg.src = AssetHelper.resolveImage(speakerToCardImage[speakerName] || 'finaloperamaster.png');
    cardImg.className = 'monologue-card-img';

    // Create speechbubble image
    const bubbleImg = document.createElement('img');
    bubbleImg.src = AssetHelper.resolveSpeechbubble(imageFilename);
    bubbleImg.className = 'monologue-bubble-img';

    speaker.appendChild(cardImg);
    speaker.appendChild(bubbleImg);
  },

  // Clear monologue speaker
  clearMonologueSpeaker() {
    const speaker = document.getElementById('monologue-speaker');
    if (speaker) speaker.innerHTML = '';
  },

  // Update card image
  updateCard(cardId, imageFilename) {
    const container = document.getElementById(`card-${cardId}`);
    if (!container) return;

    // Remove old image classes
    ['card-covered', 'card-teased', 'card-revealed'].forEach(cls => {
      container.classList.remove(cls);
    });

    const img = document.createElement('img');
    img.src = AssetHelper.resolveImage(imageFilename);

    container.innerHTML = '';
    container.appendChild(img);
    container.classList.add('card-revealed');
  },

  // Show card tease (partially covered)
  showCardTease(cardId, imageFilename) {
    const container = document.getElementById(`card-${cardId}`);
    if (!container) return;

    container.classList.remove('card-revealed', 'card-covered');
    container.classList.add('card-teased');

    const img = document.createElement('img');
    img.src = AssetHelper.resolveImage(imageFilename);

    container.innerHTML = '';
    container.appendChild(img);
  },

  // Show covered card
  showCoveredCard(cardId) {
    const container = document.getElementById(`card-${cardId}`);
    if (!container) return;

    container.classList.remove('card-revealed', 'card-teased');
    container.classList.add('card-covered');

    const img = document.createElement('img');
    img.src = `${ASSET_PATHS.images}card-covered.png`;

    container.innerHTML = '';
    container.appendChild(img);
  },

  // Reveal cake
  revealCake() {
    const covered = document.getElementById('covered-cake');
    const actual = document.getElementById('centered-cake');

    if (covered) covered.classList.add('hidden');
    if (actual) {
      actual.classList.remove('hidden');
      // Scale to 80% initially
      actual.style.transform = 'translate(-50%, -50%) scale(0.8)';
    }
  },

  // Scale cake to full size
  scaleCakeFull() {
    const actual = document.getElementById('centered-cake');
    if (actual) {
      // Small delay before scaling up
      setTimeout(() => {
        actual.style.transform = 'translate(-50%, -50%) scale(1)';
      }, 50);
    }
  },

  // Fade out scene
  fadeOut(duration = 1000) {
    const overlay = document.getElementById('fade-overlay');
    if (!overlay) {
      // If no overlay, just wait
      return new Promise(resolve => setTimeout(resolve, duration));
    }
    return new Promise(resolve => {
      overlay.style.display = 'block';
      // Force reflow
      void overlay.offsetWidth;
      overlay.style.transition = `opacity ${duration}ms ease-in-out`;
      overlay.style.opacity = '1';
      setTimeout(() => resolve(), duration);
    });
  },

  // Fade in scene
  fadeIn(duration = 1500) {
    const overlay = document.getElementById('fade-overlay');
    if (!overlay) {
      // If no overlay, just wait
      return new Promise(resolve => setTimeout(resolve, duration));
    }
    return new Promise(resolve => {
      overlay.style.transition = `opacity ${duration}ms ease-in-out`;
      overlay.style.opacity = '0';
      setTimeout(() => {
        overlay.style.display = 'none';
        overlay.style.opacity = '';
        overlay.style.transition = '';
        resolve();
      }, duration);
    });
  }
};

// ============================================
// Slot Machine
// ============================================

const SlotMachine = {

  symbols: ['flower1', 'flower2', 'opera', 'explorer', 'cassandra', 'wimbledon', 'toadstool'],

  spin(reel1, reel2, reel3) {
    return new Promise(resolve => {
      GameState.isSpinning = true;

      const reel1El = document.getElementById('reel-1');
      const reel2El = document.getElementById('reel-2');
      const reel3El = document.getElementById('reel-3');

      // Play spin sound
      AudioManager.play('SlotMash.mp3');

      let spins = 0;
      const maxSpins = 15;

      const getRandomSymbol = () => {
        // Get a random symbol for this reel
        return SlotMachine.symbols[Math.floor(Math.random() * SlotMachine.symbols.length)];
      };

      const getRandomSymbolExcluding = (excluded) => {
        // Get a random symbol that's different from excluded
        let symbol;
        do {
          symbol = SlotMachine.symbols[Math.floor(Math.random() * SlotMachine.symbols.length)];
        } while (symbol === excluded && SlotMachine.symbols.length > 1);
        return symbol;
      };

      const interval = setInterval(() => {
        // Generate three different random symbols for the spin animation
        const sym1 = getRandomSymbol();
        let sym2 = getRandomSymbolExcluding(sym1);
        let sym3 = getRandomSymbolExcluding(sym2);

        const path1 = AssetHelper.resolveSlotSymbol(sym1);
        const path2 = AssetHelper.resolveSlotSymbol(sym2);
        const path3 = AssetHelper.resolveSlotSymbol(sym3);

        // Update image src directly (reelEl IS the img element)
        reel1El.src = path1;
        reel2El.src = path2;
        reel3El.src = path3;

        spins++;

        if (spins >= maxSpins) {
          clearInterval(interval);

          // Set final symbols
          reel1El.src = AssetHelper.resolveSlotSymbol(reel1);
          reel2El.src = AssetHelper.resolveSlotSymbol(reel2);
          reel3El.src = AssetHelper.resolveSlotSymbol(reel3);

          GameState.isSpinning = false;
          resolve();
        }
      }, 80);
    });
  },

  getRandomSymbol() {
    return SlotMachine.symbols[Math.floor(Math.random() * SlotMachine.symbols.length)];
  },

  getSymbolText(symbolName) {
    // Convert filename to display text
    const name = symbolName.replace('.png', '');
    return ' ' + name.charAt(0).toUpperCase() + name.slice(1);
  }
};

// ============================================
// Script Engine
// ============================================

const ScriptEngine = {

  script: null,

  async loadScript() {
    try {
      const response = await fetch('script.json');
      this.script = await response.json();
      console.log('Script loaded:', this.script.version, 'events:', this.script.script.length);
    } catch (e) {
      console.error('Failed to load script.json:', e);
    }
  },

  getCurrentEvent() {
    if (!this.script) return null;

    // Find next event with ID greater than current
    const events = this.script.script.sort((a, b) => a.id - b.id);

    for (const event of events) {
      if (event.id > GameState.currentEventId) {
        return event;
      }
    }

    // If all events processed, find finale
    for (const event of events) {
      if (event.type === 'finale') return event;
    }

    return null;
  },

  async processEvent(event) {
    if (!event) {
      console.log('No more events to process');
      return null;
    }

    GameState.currentEventId = event.id;
    console.log('Processing event', event.id, 'type:', event.type);

    // Update slot machine display to match stage
    // Slot spins are triggered by user clicks in handleSlotClick, not here

    // Handle sound effects
    if (event.stage && event.stage.sfx) {
      AudioManager.play(event.stage.sfx);
    }

    // Handle music
    if (event.stage && event.stage.music) {
      AudioManager.playMusic(event.stage.music);
    }

    // Process based on event type
    switch (event.type) {
      case 'monologue':
        await this.handleMonologue(event);
        break;

      case 'dialogue':
        await this.handleDialogue(event);
        break;

      case 'cardTease':
        await this.handleCardTease(event);
        break;

      case 'cardReveal':
        await this.handleCardReveal(event);
        break;

      case 'ambient':
        // Just wait briefly for the scene to settle
        await new Promise(resolve => setTimeout(resolve, 500));
        break;

      case 'finale':
        await this.handleFinale(event);
        break;
    }

    return event;
  },

  async handleMonologue(event) {
    // Block slot machine clicks during event processing
    SceneManager.blockSlotMachine(true);

    const speaker = event.speaker || 'headmaster';

    // Show monologue container (remove hidden class)
    const monologueContainer = document.getElementById('monologue-container');
    if (monologueContainer) {
      monologueContainer.classList.remove('hidden');
    }

    // Show speaker in monologue container
    for (let i = 0; i < event.lines.length; i++) {
      const line = event.lines[i];

      SceneManager.showMonologueSpeaker(speaker, line.image);
      await this.waitForTextDisplay();

      // If more lines, wait 1 second before next bubble
      if (i < event.lines.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Clear speaker and hide monologue container
    setTimeout(() => {
      SceneManager.clearMonologueSpeaker();

      // Hide monologue container
      if (monologueContainer) {
        monologueContainer.classList.add('hidden');
      }
      // Unblock slot machine
      SceneManager.blockSlotMachine(false);
    }, 3000);

    await new Promise(resolve => setTimeout(resolve, 3500));
    // Unblock slot machine after full duration
    SceneManager.blockSlotMachine(false);
  },

  async handleDialogue(event) {
    // Block slot machine clicks during event processing
    SceneManager.blockSlotMachine(true);

    // Dim the scene
    SceneManager.dimScene(true);

    // Show dialogue container (remove hidden class)
    const dialogueContainer = document.getElementById('dialogue-container');
    if (dialogueContainer) {
      dialogueContainer.classList.remove('hidden');
    }

    // Show speakers in dialogue container
    for (let i = 0; i < event.lines.length; i++) {
      const line = event.lines[i];
      const speaker = line.speaker;

      // Determine position (left for first speaker, right for others)
      const position = i % 2 === 0 ? 'left' : 'right';

      SceneManager.showDialogueSpeaker(position, speaker, line.image);
      await this.waitForTextDisplay();
    }

    // Clear speakers, undim, and hide dialogue container
    setTimeout(() => {
      SceneManager.clearDialogueSpeakers();
      SceneManager.dimScene(false);

      // Hide dialogue container
      if (dialogueContainer) {
        dialogueContainer.classList.add('hidden');
      }
      // Unblock slot machine
      SceneManager.blockSlotMachine(false);
    }, 3000);

    await new Promise(resolve => setTimeout(resolve, 3500));
    // Unblock slot machine after full duration
    SceneManager.blockSlotMachine(false);
  },

  async handleCardTease(event) {
    // Block slot machine clicks during event processing
    SceneManager.blockSlotMachine(true);

    const cardId = event.card;
    const image = event.image;

    SceneManager.showCardTease(cardId, image);

    // Unblock slot machine
    SceneManager.blockSlotMachine(false);
  },

  async handleCardReveal(event) {
    // Block slot machine clicks during event processing
    SceneManager.blockSlotMachine(true);

    const cardId = event.card;
    const image = event.image;

    // Play reveal sound
    AudioManager.play('revealsong.mp3');

    SceneManager.updateCard(cardId, image);
    GameState.cardsRevealed.add(cardId);

    // Unblock slot machine
    SceneManager.blockSlotMachine(false);
  },

  async handleFinale(event) {
    GameState.isFinale = true;

    // Fade out
  //  await SceneManager.fadeOut(3000);
    AudioManager.stopAllAudio();

    // Play squeeky sound and show cake
    AudioManager.play('squeeky.mp3');
    SceneManager.revealCake();

    // Wait 3 seconds in darkness
//    await new Promise(resolve => setTimeout(resolve, 3000));

    // Fade back up
    await SceneManager.fadeIn(1500);

    const happyBirthday = AudioManager.getAudio('happybirthday');
    happyBirthday.src = `${ASSET_PATHS.sounds}happybirthday.mp3`;
    happyBirthday.loop = false;  // Disable native loop
    happyBirthday.playCount = 0;  // Track play count manually

    // Map speakers to card IDs for bubble positioning
    const speakerCardMap = {
      'opera': 1,
      'toadstool': 2,
      'explorer': 3,
      'wimbledon': 4,
      'cassandra': 5
    };

    // Play each line/speaker
    for (const [index, line] of event.lines.entries()) {
      // Scale cake to full when opera starts (second speaker, index 1)
      if (index === 1 && line.speaker === 'opera') {
        SceneManager.scaleCakeFull();
      }

      // Show the speaker's bubble
      if (line.speaker === 'headmaster') {
        SceneManager.showHeadmasterSpeechBubble(line.image);
      } else {
        // Show bubble over the appropriate card
        const cardId = speakerCardMap[line.speaker];
        if (cardId) {
          SceneManager.showSpeechBubble(cardId, line.image);
        } else {
          SceneManager.showHeadmasterSpeechBubble(line.image);
        }
      }

      // Start/continue playing happy birthday song (non-blocking)
      happyBirthday.play().catch(() => {});

      // Track plays - stop after 2 loops
      happyBirthday.playCount = (happyBirthday.playCount || 0) + 1;

      // Clear bubble after 3.5 seconds (non-blocking)
      await new Promise(resolve => setTimeout(resolve, 3500));

      if (line.speaker === 'headmaster') {
        SceneManager.hideHeadmasterSpeechBubble();
      } else {
        const cardId = speakerCardMap[line.speaker];
        if (cardId) {
          //SceneManager.removeSpeechBubble(cardId);
        }
      }

      // If this is the last line, show final screen
      if (index === event.lines.length - 1) {
        const finalScreen = document.getElementById('final-screen');
        // Show the final screen
        finalScreen.classList.remove('hidden');
        happyBirthday.onended = () => {
          AudioManager.stopAllAudio();
        };
      }
    }
  },

  resetGame() {
    // Hide final screen
    const finalScreen = document.getElementById('final-screen');
    if (finalScreen) {
      finalScreen.classList.add('hidden');
    }

    // Show start screen
    const startScreen = document.getElementById('start-screen');
    if (startScreen) {
      startScreen.classList.remove('hidden');
    }

    // Reset game state
    GameState.currentEventId = 0;
    GameState.eventIndex = 0;
    GameState.cardsRevealed.clear();
    GameState.activeSpeaker = null;
    GameState.isSpinning = false;
    GameState.isFinale = false;
    GameState.initialized = false;

    console.log('Game reset. Ready to begin.');
  },

  waitForTextDisplay() {
    return new Promise(resolve => setTimeout(resolve, 6000));
  }
};

// ============================================
// Game Controller
// ============================================

const GameController = {

  init() {
    // Add click listener to start screen
    const clickToBegin = document.getElementById('click-to-begin');
    if (clickToBegin) {
      clickToBegin.addEventListener('click', () => {
        GameController.startGame();
      });
    }

    // Add click listener to slot machine
    const slotMachine = document.getElementById('slot-machine');
    if (slotMachine) {
      slotMachine.addEventListener('click', () => {
        GameController.handleSlotClick();
      });
    }

    // Add click listener to restart the game
    const clickToRestart = document.getElementById('click-to-restart');
    if (clickToRestart) {
      clickToRestart.addEventListener('click', () => {
        GameController.resetGame();
      });
    }

    console.log('Game initialized');
  },

  async startGame() {
    // Hide start screen (which contains click-to-begin)
    const startScreen = document.getElementById('start-screen');
    if (startScreen) {
      startScreen.classList.add('hidden');
    }

    // Initialize game state
    GameState.initialized = true;

    // Load script (await the promise)
    await ScriptEngine.loadScript();

    // Start from event 1 (headmaster introduction)
    GameState.currentEventId = 0;

    // Process intro event only
    await this.processNextEvent();  // Event 1

    console.log('Intro complete. Waiting for slot machine click...');
  },

  async processNextEvent() {
    if (!GameState.initialized) return;

    const event = ScriptEngine.getCurrentEvent();

    if (event && !GameState.isSpinning) {
      await ScriptEngine.processEvent(event);

      // Game loop continues - if finale, stop here
      if (!GameState.isFinale) {
        console.log('Event processed. Waiting for next slot machine click...');
      }
    } else if (event && GameState.isSpinning) {
      // Wait for spin to complete
      const checkInterval = setInterval(() => {
        if (!GameState.isSpinning) {
          clearInterval(checkInterval);
          console.log('Spin complete, waiting for next slot machine click...');
        }
      }, 100);
    }
  },

  async handleSlotClick() {
    if (GameState.isSpinning) return;

    // Get the next event to determine if it has slotImages
    const nextEvent = ScriptEngine.getCurrentEvent();

    let reel1, reel2, reel3;

    // Use event's slotImages if available for the spin
    if (nextEvent && nextEvent.stage && nextEvent.stage.slotImages) {
      reel1 = nextEvent.stage.slotImages[0];
      reel2 = nextEvent.stage.slotImages[1];
      reel3 = nextEvent.stage.slotImages[2];
    } else {
      // Generate random symbols for events without slotImages
      reel1 = SlotMachine.getRandomSymbol();
      reel2 = SlotMachine.getRandomSymbol();
      reel3 = SlotMachine.getRandomSymbol();
    }

    // Spin with appropriate symbols
    await SlotMachine.spin(reel1, reel2, reel3);

    // Process the next event
    await this.processNextEvent();
  }
};

// ============================================
// Bootstrap
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  GameController.init();
});
