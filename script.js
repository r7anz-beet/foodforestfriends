// Food Forest Friends - script.js
// Version: 2.0.2 (Rank Update, Achievements & SVG Deer)

(function() {
    document.addEventListener('DOMContentLoaded', () => {
        // --- DOM Elements ---
        const titleScreen = document.getElementById('title-screen');
        const startChallengeBtn = document.getElementById('start-challenge-btn');
        const startCreativeBtn = document.getElementById('start-creative-btn');
        const guideBtn = document.getElementById('guide-btn');
        const guideModal = document.getElementById('guide-modal');
        const closeGuideBtn = document.getElementById('close-guide-btn');
        const gameContainer = document.getElementById('game-container');

        // Declare variables for in-game elements, assigned later in getGameElementRefs
        let gardenElement, scoreElement, scoreGoalDisplayElement,
            energyElement, energyCapElement, energyCapDisplayElement,
            timerElement, fenceStatusElement,
            fertilizerStatusElement, muteBtn, weatherOverlayElement,
            soilPatchesContainer, guideTextElement,
            plantFruitTreeBtn, plantNutTreeBtn, plantCornBtn, plantBeanBtn, plantBerryBtn,
            plantGroundCoverBtn, plantHerbBtn,
            buyFenceBtn, buyFertilizerBtn,
            selectionStatusElement, instructionsElement,
            costFruitTreeElement, costNutTreeElement, costCornElement, costBeanElement, costBerryElement,
            costGroundCoverElement, costHerbElement,
            costFenceElement, costFertilizerElement,
            pointsFruitTreeElement, pointsNutTreeElement, pointsCornElement, pointsBeanElement, pointsBerryElement,
            pointsHerbElement,
            resetGameBtn, winMessageElement, finalTimeElement, winResetBtn, attackMessageElement,
            finalRankElement, challengeTimesElement,
            // --- UPDATED: Rank Time Display Elements ---
            platinumTimeElement, goldTimeElement, silverTimeElement, bronzeTimeElement, // Status Bar
            guidePlatinumTimeElement, guideGoldTimeElement, guideSilverTimeElement, guideBronzeTimeElement, // Guide Modal
            // ------------------------------------------
            animalWarningElement,
            diversityStatusElement,
            winAchievementElement; // Element for win screen achievement text


        // --- Game Configuration (v2.0.2) ---
        const config = {
            GOAL_SCORE: 1000,
            ENERGY_CAP: 100,
            ENERGY_REGEN_RATE: 1,
            PLANT_COST: { fruitTree: 50, nutTree: 70, corn: 25, bean: 20, berry: 15, groundCover: 10, herb: 12 },
            ITEM_POINTS: { fruitTree: 18, nutTree: 25, corn: 35, bean: 5, berry: 9, herb: 3, groundCover: 0 },
            GROW_TIME_MS: { fruitTree: 12000, nutTree: 20000, corn: 6000, bean: 5000, berry: 4000, groundCover: 3000, herb: 4500 },
            ITEM_DROP_INTERVAL_MS: { fruitTree: 15000, nutTree: 25000, berry: 7000 },
            ITEM_SPROUT_CHECK_INTERVAL_MS: 5000,
            ITEM_SPROUT_CHANCE: 0.10,
            MIN_PLANT_DISTANCE: 30,
            ITEM_SPREAD_RADIUS: 25,
            FENCE_COST: 50,
            FERTILIZER_COST: 75,
            FERTILIZER_DURATION_MS: 30000,
            FERTILIZER_BOOST_MULTIPLIER: 1.25,
            NITROGEN_FIX_ADJACENCY_BONUS: 1,
            BEAN_BOOST_RADIUS: 40,
            GROUND_COVER_FERTILITY_DURATION_MS: 20000,
            GROUND_COVER_FERTILITY_RADIUS: 35,
            GROUND_COVER_GROWTH_BOOST: 1.2,
            HERB_SPREAD_INTERVAL_MS: 15000, // Herb spread is guaranteed attempt
            HERB_SPREAD_RADIUS: 40,
            HERB_SPROUT_CHANCE_BOOST_FACTOR: 1.5, // Boosts item sprout chance nearby
            HERB_PEST_DETERRENT_RADIUS: 45,
            HERB_PEST_DETERRENT_CHANCE_REDUCTION: 0.3,
            ANIMAL_ATTACK_MIN_DELAY_MS: 20000,
            ANIMAL_ATTACK_MAX_DELAY_MS: 60000,
            ANIMAL_ATTACK_CHANCE: 0.75,
            ANIMAL_VISIBLE_DURATION_MS: 5000,
            MATURING_STAGE_FACTOR: 0.5,
            // --- UPDATED: Time Thresholds for Ranks (v2.0.2) ---
            TIME_THRESHOLDS: {
                platinum: 158, // ~2:38
                gold: 167,     // ~2:47
                silver: 200,   // ~3:20
                bronze: 250    // ~4:10
            },
            // -----------------------------------------------------
            WEATHER_CHECK_INTERVAL_MS: 25000,
            WEATHER_DURATION_MS: 45000,
            RAIN_CHANCE: 0.15,
            DROUGHT_CHANCE: 0.10,
            RAIN_ENERGY_BOOST_RATE: 0.5,
            DROUGHT_ENERGY_PENALTY_RATE: 0.5,
            MONOCULTURE_THRESHOLD_PERCENT: 0.75,
            MONOCULTURE_POINT_PENALTY_FACTOR: 0.8,
            DIVERSITY_POINT_BONUS_PER_SPECIES: 0.5,
            DIVERSITY_MAX_SPECIES_FOR_BONUS: 5,
            SAVE_KEY: 'foodForestFriendsGameV2.0.2' // Updated Save Key for v2.0.2
        };

        // --- Game State (v2.0.2) ---
        let state = {
            score: 0, energy: config.ENERGY_CAP, selectedPlantType: null, plants: [], items: [], hasFence: false,
            energyRegenIntervalId: null, gameTimerIntervalId: null, animalAttackTimeoutId: null,
            elapsedTimeSeconds: 0, timerStarted: false, activeAnimals: {}, plantsOrItemsExist: false, isGameOver: false, gameInitialized: false,
            fertilizerActive: false, fertilizerTimeoutId: null, fertilizerEndTime: 0, fertilePatches: [], gameMode: null,
            isMuted: false, currentWeather: 'none', weatherTimeoutId: null, weatherCheckIntervalId: null, scareCount: 0,
            // --- UPDATED: Achievements including Ranks ---
            achievements: {
                score100: false, score500: false, score1000: false, // Basic score
                firstTree: false, firstNut: false, // Planting
                scare10: false, // Interaction
                surviveDrought: false, // Weather
                // Rank Achievements
                achievedBronze: false,
                achievedSilver: false,
                achievedGold: false,
                achievedPlatinum: false
            },
            // --------------------------------------------
            diversityStatus: 'normal'
        };

        // --- SVG Deer Graphic String ---
        // Store the SVG markup in a constant for easier use
        const DEER_SVG_MARKUP = `
            <svg width="60" height="55" viewBox="0 0 60 55" xmlns="http://www.w3.org/2000/svg" style="overflow: visible; /* Allow parts outside viewbox */">
              <style>
                .deer-body { fill: var(--deer-body, #C8906F); }
                .deer-legs { fill: var(--deer-legs, #98644C); }
                .deer-head { fill: var(--deer-head, #C8906F); }
                .deer-neck { fill: var(--deer-neck, #C8906F); }
                .deer-tail { fill: var(--deer-tail, #B67E5B); }
                .deer-nose { fill: var(--deer-nose, #3E2925); }
                .deer-eye { fill: var(--deer-eye, #3E2B25); }
                .deer-ear-inner { fill: var(--deer-ear, #E1B49D); }
                .deer-hoof { fill: var(--deer-hoof, #7A564A); }
              </style>
              <rect class="deer-legs" x="5" y="38" width="5" height="15" rx="2"/>
              <rect class="deer-legs" x="12" y="38" width="5" height="15" rx="2"/>
              <rect class="deer-legs" x="35" y="38" width="5" height="15" rx="2"/>
              <rect class="deer-legs" x="42" y="38" width="5" height="15" rx="2"/>
              <rect class="deer-hoof" x="5" y="50" width="5" height="4" rx="1"/>
              <rect class="deer-hoof" x="12" y="50" width="5" height="4" rx="1"/>
              <rect class="deer-hoof" x="35" y="50" width="5" height="4" rx="1"/>
              <rect class="deer-hoof" x="42" y="50" width="5" height="4" rx="1"/>
              <path class="deer-tail" d="M 5 20 Q 0 25, 0 30 C 0 35, 5 38, 8 35 Q 10 30, 5 20 Z"/>
              <ellipse class="deer-body" cx="27" cy="30" rx="20" ry="12"/>
              <path class="deer-neck" d="M 40 25 C 45 15, 48 15, 50 20 L 45 30 C 42 28, 40 25, 40 25 Z"/>
              <ellipse class="deer-head" cx="50" cy="15" rx="8" ry="7"/>
              <path class="deer-head" d="M 48 5 Q 55 0, 58 8 L 52 10 Z"/>
              <path class="deer-ear-inner" d="M 50 6 Q 54 4, 56 8 L 52 9.5 Z"/>
              <circle class="deer-eye" cx="53" cy="14" r="1.5"/>
              <circle class="deer-nose" cx="57" cy="17" r="2"/>
            </svg>
        `;

        // --- Tone.js Sound Setup ---
        let synth, noiseSynth;
        function initializeAudio() { if (!synth && window.Tone) { try { Tone.start(); synth = new Tone.Synth({ oscillator: { type: 'triangle' }, envelope: { attack: 0.01, decay: 0.1, sustain: 0.1, release: 0.2 } }).toDestination(); noiseSynth = new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.005, decay: 0.05, sustain: 0 } }).toDestination(); noiseSynth.volume.value = -15; console.log("Audio Context Started"); synth.triggerAttackRelease("C1", "32n", Tone.now(), 0.01); } catch (e) { console.error("Failed to initialize Tone.js:", e); synth = null; noiseSynth = null; } } else if (!window.Tone) { console.warn("Tone.js library not loaded."); synth = null; noiseSynth = null; } }
        function playSound(type, note = 'C4', duration = '16n', velocity = 0.5, timeOffset = 0) { if (state.isMuted) return; let targetSynth = synth; if (!targetSynth && !noiseSynth) { initializeAudio(); if (!targetSynth && !noiseSynth) return; } switch(type) { case 'plant': note = 'C4'; duration = '16n'; velocity = 0.6; break; case 'harvestItem': note = 'E5'; duration = '16n'; velocity = 0.7; break; case 'harvestDirect': note = 'C5'; duration = '16n'; velocity = 0.6; break; case 'sprout': note = 'A4'; duration = '16n'; velocity = 0.3; break; case 'cutGroundCover': targetSynth = noiseSynth; note = null; duration = '8n'; velocity = 0.8; break; case 'scare': note = 'A#4'; duration = '8n'; velocity = 0.8; break; case 'animalAppear': note = 'G2'; duration = '8n'; velocity = 0.4; break; case 'animalEat': note = 'A#2'; duration = '4n'; velocity = 0.7; break; case 'fertilizerOn': note = 'G5'; duration = '4n'; velocity = 0.8; break; case 'fertilizerOff': note = 'C3'; duration = '4n'; velocity = 0.4; break; case 'win': note = 'G5'; duration = '2n'; velocity = 0.9; break; case 'buttonClick': targetSynth = noiseSynth; note = null; duration = '32n'; velocity = 0.5; break; case 'maturing': note = 'G4'; duration = '32n'; velocity = 0.2; break; default: console.warn("Unknown sound type:", type); return; } if (targetSynth) { try { const playTime = Tone.now() + timeOffset; if (note) { targetSynth.triggerAttackRelease(note, duration, playTime, velocity); } else if (targetSynth === noiseSynth) { targetSynth.triggerAttackRelease(duration, playTime, velocity); } } catch (e) { console.error("Error playing sound:", e); } } }

        // --- Main Game Flow ---
        function startGame(mode) { console.log(`DEBUG: startGame called with mode: ${mode}`); if (state.gameInitialized) { console.log("DEBUG: Game already initialized. Resetting implicitly via initializeGame..."); } state.gameMode = mode; initializeAudio(); if (titleScreen) titleScreen.classList.add('hidden'); if (gameContainer) gameContainer.classList.remove('hidden'); getGameElementRefs(); if (!gardenElement || !scoreElement || !energyElement) { console.error("Essential elements missing! Cannot init."); return; } initializeGame(); state.gameInitialized = true; console.log(`DEBUG: startGame completed. Mode: ${state.gameMode}.`); }

        // --- UPDATED: Get references including new rank elements ---
        function getGameElementRefs() {
            console.log("DEBUG: Getting IN-GAME element refs...");
            gardenElement = document.getElementById('garden'); scoreElement = document.getElementById('score'); scoreGoalDisplayElement = document.getElementById('score-goal-display'); energyElement = document.getElementById('energy'); energyCapElement = document.getElementById('energy-cap'); energyCapDisplayElement = document.getElementById('energy-cap-display'); timerElement = document.getElementById('timer'); fenceStatusElement = document.getElementById('fence-status'); fertilizerStatusElement = document.getElementById('fertilizer-status'); muteBtn = document.getElementById('mute-btn'); weatherOverlayElement = document.getElementById('weather-overlay'); soilPatchesContainer = document.getElementById('soil-patches'); guideTextElement = document.getElementById('guide-text'); plantFruitTreeBtn = document.getElementById('plant-fruitTree-btn'); plantNutTreeBtn = document.getElementById('plant-nutTree-btn'); plantCornBtn = document.getElementById('plant-corn-btn'); plantBeanBtn = document.getElementById('plant-bean-btn'); plantBerryBtn = document.getElementById('plant-berry-btn'); plantGroundCoverBtn = document.getElementById('plant-groundCover-btn'); plantHerbBtn = document.getElementById('plant-herb-btn'); buyFenceBtn = document.getElementById('buy-fence-btn'); buyFertilizerBtn = document.getElementById('buy-fertilizer-btn'); selectionStatusElement = document.getElementById('selection-status'); instructionsElement = gardenElement?.querySelector('.instructions'); costFruitTreeElement = document.querySelector('.cost-fruitTree'); costNutTreeElement = document.querySelector('.cost-nutTree'); costCornElement = document.querySelector('.cost-corn'); costBeanElement = document.querySelector('.cost-bean'); costBerryElement = document.querySelector('.cost-berry'); costGroundCoverElement = document.querySelector('.cost-groundCover'); costHerbElement = document.querySelector('.cost-herb'); costFenceElement = document.querySelector('.cost-fence'); costFertilizerElement = document.querySelector('.cost-fertilizer'); pointsFruitTreeElement = document.querySelector('.points-fruitTree'); pointsNutTreeElement = document.querySelector('.points-nutTree'); pointsCornElement = document.querySelector('.points-corn'); pointsBeanElement = document.querySelector('.points-bean'); pointsBerryElement = document.querySelector('.points-berry'); pointsHerbElement = document.querySelector('.points-herb'); resetGameBtn = document.getElementById('reset-game-btn'); winMessageElement = document.getElementById('win-message'); finalTimeElement = document.getElementById('final-time'); winResetBtn = document.getElementById('win-reset-btn'); attackMessageElement = document.getElementById('attack-message'); finalRankElement = document.getElementById('final-rank'); challengeTimesElement = document.getElementById('challenge-times');
            // Status Bar Rank Times
            platinumTimeElement = document.getElementById('platinum-time'); // <<< Get Plat element
            goldTimeElement = document.getElementById('gold-time');
            silverTimeElement = document.getElementById('silver-time');
            bronzeTimeElement = document.getElementById('bronze-time');
            // Guide Modal Rank Times
            guidePlatinumTimeElement = document.getElementById('guide-platinum-time'); // <<< Get Plat element
            guideGoldTimeElement = document.getElementById('guide-gold-time');
            guideSilverTimeElement = document.getElementById('guide-silver-time');
            guideBronzeTimeElement = document.getElementById('guide-bronze-time');
            animalWarningElement = document.querySelector('.animal-warning'); diversityStatusElement = document.getElementById('diversity-status');
            winAchievementElement = document.getElementById('win-achievement'); // <<< Get win achievement element
            console.log("DEBUG: In-game element refs obtained.");
        }
        function initializeGame() {
            console.log("DEBUG: initializeGame started.");
            const savedMuteState = state.isMuted || (localStorage.getItem('foodForestMuteState') ? JSON.parse(localStorage.getItem('foodForestMuteState')) : false);
            clearAllTimers();
            // --- UPDATED: Reset state with new achievements ---
            state = {
                score: 0, energy: config.ENERGY_CAP, selectedPlantType: null, plants: [], items: [], hasFence: false,
                energyRegenIntervalId: null, gameTimerIntervalId: null, animalAttackTimeoutId: null,
                elapsedTimeSeconds: 0, timerStarted: false, activeAnimals: {}, plantsOrItemsExist: false, isGameOver: false, gameInitialized: false,
                fertilizerActive: false, fertilizerTimeoutId: null, fertilizerEndTime: 0, fertilePatches: [], gameMode: state.gameMode,
                isMuted: savedMuteState, currentWeather: 'none', weatherTimeoutId: null, weatherCheckIntervalId: null, scareCount: 0,
                achievements: { score100: false, score500: false, score1000: false, firstTree: false, firstNut: false, scare10: false, surviveDrought: false, achievedBronze: false, achievedSilver: false, achievedGold: false, achievedPlatinum: false },
                diversityStatus: 'normal'
            };
            // ----------------------------------------------
            if (gardenElement) { gardenElement.querySelectorAll('.plant, .item, .animal').forEach(el => el.remove()); gardenElement.classList.remove('fenced'); }
            if (soilPatchesContainer) { soilPatchesContainer.innerHTML = ''; }
            if (winMessageElement) { winMessageElement.classList.add('hidden'); }
            if (animalWarningElement) { animalWarningElement.classList.add('hidden'); }
            if (attackMessageElement) { attackMessageElement.classList.remove('visible'); }
            if (weatherOverlayElement) { weatherOverlayElement.className = 'hidden'; }
            clearSelection();
            loadGame(); // Load save data *before* setting up UI based on mode
            if (state.gameMode === 'creative') {
                if (scoreGoalDisplayElement) scoreGoalDisplayElement.style.display = 'none';
                if (challengeTimesElement) { challengeTimesElement.style.display = 'none'; }
                if (winMessageElement) winMessageElement.classList.add('hidden');
                const title = gameContainer?.querySelector('h1'); if (title) title.textContent = "Food Forest Friends (Creative)";
                if (timerElement) timerElement.style.display = 'none';
                if (energyElement) energyElement.textContent = "∞";
                if (energyCapDisplayElement) energyCapDisplayElement.style.display = 'none';
                if (animalWarningElement) animalWarningElement.classList.add('hidden');
                if (diversityStatusElement) diversityStatusElement.parentElement.style.display = 'none';
            } else { // Challenge Mode (or loaded challenge save)
                if (scoreGoalDisplayElement) scoreGoalDisplayElement.style.display = 'inline';
                if (challengeTimesElement) { challengeTimesElement.style.display = 'block'; displayChallengeTimes(); } else { console.error("DEBUG: challengeTimesElement not found!"); }
                const title = gameContainer?.querySelector('h1'); if (title) title.textContent = "Food Forest Friends (Challenge)";
                if (timerElement) timerElement.style.display = 'inline';
                if (energyCapDisplayElement) energyCapDisplayElement.style.display = 'inline';
                if (animalWarningElement) animalWarningElement.classList.toggle('hidden', state.hasFence);
                 if (diversityStatusElement) diversityStatusElement.parentElement.style.display = 'inline-block';
            }
            updateUIDisplays(); updatePlantCostsAndPoints(); updateMuteButtonVisual(); startEnergyRegen(); renderAllPlants(); renderAllItems(); renderAllFertilePatches(); updateInstructions(); updateButtonStates(); updateDiversityStatus(); addEventListeners(); if (gardenElement) { gardenElement.classList.toggle('fenced', state.hasFence); } restoreFertilizerState(); restoreWeatherState();
            if (!state.isGameOver) {
                if (state.gameMode === 'challenge' && (state.timerStarted || state.plantsOrItemsExist)) { startGameTimer(); }
                if (state.gameMode === 'challenge') { scheduleNextAnimalAttack(); }
                startWeatherChecks();
                if (state.gameMode === 'challenge') { checkWinCondition(); }
            } else if (state.gameMode === 'challenge') { showWinMessage(); updateButtonStates(); }
            console.log(`DEBUG: initializeGame completed.`);
        }
        function addEventListeners() {
            console.log("DEBUG: Adding IN-GAME event listeners.");
            plantFruitTreeBtn?.removeEventListener('click', handlePlantButtonClick); plantNutTreeBtn?.removeEventListener('click', handlePlantButtonClick); plantCornBtn?.removeEventListener('click', handlePlantButtonClick); plantBeanBtn?.removeEventListener('click', handlePlantButtonClick); plantBerryBtn?.removeEventListener('click', handlePlantButtonClick); plantGroundCoverBtn?.removeEventListener('click', handlePlantButtonClick); plantHerbBtn?.removeEventListener('click', handlePlantButtonClick); buyFenceBtn?.removeEventListener('click', handleBuyFenceClick); buyFertilizerBtn?.removeEventListener('click', handleBuyFertilizerClick); resetGameBtn?.removeEventListener('click', handleResetGameClick); winResetBtn?.removeEventListener('click', handleResetGameClick); gardenElement?.removeEventListener('click', handleGardenInteraction); muteBtn?.removeEventListener('click', toggleMute);
            plantFruitTreeBtn?.addEventListener('click', handlePlantButtonClick); plantNutTreeBtn?.addEventListener('click', handlePlantButtonClick); plantCornBtn?.addEventListener('click', handlePlantButtonClick); plantBeanBtn?.addEventListener('click', handlePlantButtonClick); plantBerryBtn?.addEventListener('click', handlePlantButtonClick); plantGroundCoverBtn?.addEventListener('click', handlePlantButtonClick); plantHerbBtn?.addEventListener('click', handlePlantButtonClick); buyFenceBtn?.addEventListener('click', handleBuyFenceClick); buyFertilizerBtn?.addEventListener('click', handleBuyFertilizerClick); resetGameBtn?.addEventListener('click', handleResetGameClick); winResetBtn?.addEventListener('click', handleResetGameClick); if (gardenElement) { gardenElement.addEventListener('click', handleGardenInteraction); } muteBtn?.addEventListener('click', toggleMute);
            console.log("DEBUG: In-game listeners added/re-added.");
        }
        function handlePlantButtonClick(event) { playSound('buttonClick'); const type = event.target.closest('button').id.split('-')[1]; selectPlantType(type); }
        function handleBuyFenceClick() { playSound('buttonClick'); buyFence(); }
        function handleBuyFertilizerClick() { playSound('buttonClick'); buyFertilizer(); }
        function handleResetGameClick() { playSound('buttonClick'); handleResetGame(); }

        // --- Weather Logic ---
        function startWeatherChecks() { if (state.weatherCheckIntervalId) clearInterval(state.weatherCheckIntervalId); state.weatherCheckIntervalId = setInterval(checkWeather, config.WEATHER_CHECK_INTERVAL_MS); console.log("Started weather checks."); }
        function checkWeather() { if (state.isGameOver || state.currentWeather !== 'none') return; const rand = Math.random(); if (rand < config.RAIN_CHANCE) { startWeatherEvent('rain'); } else if (rand < config.RAIN_CHANCE + config.DROUGHT_CHANCE) { startWeatherEvent('drought'); } }
        function startWeatherEvent(type) { if (state.currentWeather !== 'none') return; console.log(`Weather starting: ${type}`); state.currentWeather = type; if (weatherOverlayElement) { weatherOverlayElement.className = 'visible ' + type; } if (state.weatherTimeoutId) clearTimeout(state.weatherTimeoutId); state.weatherTimeoutId = setTimeout(endWeatherEvent, config.WEATHER_DURATION_MS); saveGame(); }
        function endWeatherEvent() { if (state.currentWeather === 'none') return; console.log(`Weather ended: ${state.currentWeather}`); if(state.currentWeather === 'drought') checkAchievements('surviveDrought'); state.currentWeather = 'none'; state.weatherTimeoutId = null; if (weatherOverlayElement) { weatherOverlayElement.className = 'hidden'; } saveGame(); }
        function restoreWeatherState() { if (state.currentWeather !== 'none' && weatherOverlayElement) { weatherOverlayElement.className = 'visible ' + state.currentWeather; if (state.weatherTimeoutId) clearTimeout(state.weatherTimeoutId); state.weatherTimeoutId = setTimeout(endWeatherEvent, config.WEATHER_DURATION_MS); } else if (weatherOverlayElement) { weatherOverlayElement.className = 'hidden'; } startWeatherChecks(); }

        // --- Animal Attack Logic ---
        function scheduleNextAnimalAttack() { if (state.animalAttackTimeoutId) clearTimeout(state.animalAttackTimeoutId); if (state.isGameOver || state.gameMode === 'creative') return; const delay = config.ANIMAL_ATTACK_MIN_DELAY_MS + Math.random() * (config.ANIMAL_ATTACK_MAX_DELAY_MS - config.ANIMAL_ATTACK_MIN_DELAY_MS); state.animalAttackTimeoutId = setTimeout(tryAnimalAttack, delay); }
        function tryAnimalAttack() { if (state.isGameOver || state.hasFence || state.plants.length === 0 || state.gameMode === 'creative') { scheduleNextAnimalAttack(); return; } const vulnerablePlants = state.plants.filter(p => (p.type !== 'fruitTree' && p.type !== 'nutTree') || ((p.type === 'fruitTree' || p.type === 'nutTree') && p.state !== 'mature') ); if (vulnerablePlants.length === 0) { scheduleNextAnimalAttack(); return; } let attackChance = config.ANIMAL_ATTACK_CHANCE; const hasMatureHerbNearby = state.plants.some(herb => herb.type === 'herb' && herb.state === 'mature' && vulnerablePlants.some(vp => (Math.pow(herb.x - vp.x, 2) + Math.pow(herb.y - vp.y, 2)) < config.HERB_PEST_DETERRENT_RADIUS * config.HERB_PEST_DETERRENT_RADIUS ) ); if (hasMatureHerbNearby) { attackChance *= (1 - config.HERB_PEST_DETERRENT_CHANCE_REDUCTION); } if (Math.random() < attackChance) { const targetPlant = vulnerablePlants[Math.floor(Math.random() * vulnerablePlants.length)]; console.log(`Animal Attack! Target: ${targetPlant.type} (ID: ${targetPlant.id})`); showAnimalNearPlant('deer', targetPlant); playSound('animalAppear'); } else { scheduleNextAnimalAttack(); } }

        // --- UPDATED: Show Animal using SVG ---
        function showAnimalNearPlant(animalType, targetPlant) {
            if (!gardenElement) return;
            const animalId = `animal-${Date.now()}`;

            // Create the container div
            const container = document.createElement('div');
            container.classList.add('animal', animalType); // Basic classes for positioning/cursor
            container.dataset.animalId = animalId;
            container.style.left = `${targetPlant.x + 15}px`; // Position near plant
            container.style.top = `${targetPlant.y - 15}px`;

            // Set the innerHTML to the SVG markup
            if (animalType === 'deer') {
                container.innerHTML = DEER_SVG_MARKUP; // Use the SVG constant
            } else {
                // Placeholder for other potential animals
                container.textContent = animalType.toUpperCase();
            }

            gardenElement.appendChild(container);

            // Set timeout for eating
            const eatTimeoutId = setTimeout(() => {
                eatPlant(animalId, animalType, targetPlant.id);
            }, config.ANIMAL_VISIBLE_DURATION_MS);

            // Store animal state
            state.activeAnimals[animalId] = { type: animalType, targetPlantId: targetPlant.id, timeoutId: eatTimeoutId, element: container };
            if (animalWarningElement) animalWarningElement.classList.remove('hidden');
        }

        function eatPlant(animalId, animalType, targetPlantId) { const animal = state.activeAnimals[animalId]; if (!animal) return; const plantIndex = state.plants.findIndex(p => p.id === targetPlantId); if (plantIndex !== -1) { const plant = state.plants[plantIndex]; console.log(`Animal ate ${plant.type}`); playSound('animalEat'); showAttackMessage(`${animalType.toUpperCase()} ate your ${plant.type}!`, true); clearPlantTimers(plant); if (plant.element) plant.element.remove(); state.plants.splice(plantIndex, 1); checkIfEmpty(); updateButtonStates(); updateDiversityStatus(); saveGame(); } if (animal.element) animal.element.remove(); delete state.activeAnimals[animalId]; if (animalWarningElement && Object.keys(state.activeAnimals).length === 0 && !state.hasFence) { animalWarningElement.classList.add('hidden'); } scheduleNextAnimalAttack(); }
        function scareAnimal(animalId) { const animal = state.activeAnimals[animalId]; if (!animal) return; console.log(`Animal scared!`); playSound('scare'); showAttackMessage(`Scared the ${animal.type} away!`, false); state.scareCount++; checkAchievements('scare'); clearTimeout(animal.timeoutId); if (animal.element) animal.element.remove(); delete state.activeAnimals[animalId]; if (animalWarningElement && Object.keys(state.activeAnimals).length === 0 && !state.hasFence) { animalWarningElement.classList.add('hidden'); } scheduleNextAnimalAttack(); saveGame(); }
        function showAttackMessage(message, isAttack) { if (!attackMessageElement) return; attackMessageElement.textContent = message; attackMessageElement.style.color = isAttack ? 'white' : '#f0f0f0'; attackMessageElement.style.backgroundColor = isAttack ? 'rgba(200, 0, 0, 0.8)' : 'rgba(0, 100, 0, 0.8)'; attackMessageElement.classList.add('visible'); setTimeout(() => { if (attackMessageElement) attackMessageElement.classList.remove('visible'); }, 3000); }

        // --- Fence & Fertilizer Logic ---
        function buyFence() { if (state.isGameOver || state.hasFence) return; if (state.gameMode !== 'creative' && state.energy < config.FENCE_COST) { setStatusMessage("Not enough energy for fence!", "warn"); playSound('buttonClick', 'C3'); return; } if (state.gameMode !== 'creative') state.energy -= config.FENCE_COST; state.hasFence = true; playSound('plant', 'E4'); if (fenceStatusElement) { fenceStatusElement.textContent = "Built"; fenceStatusElement.className = 'built info-item'; } if (gardenElement) gardenElement.classList.add('fenced'); if (animalWarningElement) animalWarningElement.classList.add('hidden'); updateButtonStates(); updateUIDisplays(); setStatusMessage("Fence built! Animals deterred.", "success"); Object.keys(state.activeAnimals).forEach(animalId => { const animal = state.activeAnimals[animalId]; clearTimeout(animal.timeoutId); if(animal.element) animal.element.remove(); delete state.activeAnimals[animalId]; }); saveGame(); }
        function buyFertilizer() { if (state.isGameOver || state.fertilizerActive) return; if (state.gameMode !== 'creative' && state.energy < config.FERTILIZER_COST) { setStatusMessage("Not enough energy for fertilizer!", "warn"); playSound('buttonClick', 'C3'); return; } if (state.gameMode !== 'creative') state.energy -= config.FERTILIZER_COST; state.fertilizerActive = true; state.fertilizerEndTime = Date.now() + config.FERTILIZER_DURATION_MS; playSound('fertilizerOn'); if (state.fertilizerTimeoutId) clearTimeout(state.fertilizerTimeoutId); state.fertilizerTimeoutId = setTimeout(deactivateFertilizer, config.FERTILIZER_DURATION_MS); updateFertilizerStatus(); toggleFertilizerEffectOnPlants(true); updateButtonStates(); updateUIDisplays(); setStatusMessage("Fertilizer active! Harvest points boosted.", "success"); saveGame(); }
        function deactivateFertilizer() { state.fertilizerActive = false; state.fertilizerTimeoutId = null; state.fertilizerEndTime = 0; playSound('fertilizerOff'); updateFertilizerStatus(); toggleFertilizerEffectOnPlants(false); updateButtonStates(); setStatusMessage("Fertilizer wore off.", "info"); saveGame(); }
        function updateFertilizerStatus() { if (!fertilizerStatusElement) return; if (state.fertilizerActive) { const remainingSeconds = Math.max(0, Math.ceil((state.fertilizerEndTime - Date.now()) / 1000)); fertilizerStatusElement.textContent = `Active (${remainingSeconds}s)`; fertilizerStatusElement.className = 'active info-item'; } else { fertilizerStatusElement.textContent = "Inactive"; fertilizerStatusElement.className = 'inactive info-item'; } }
        function toggleFertilizerEffectOnPlants(isActive) { state.plants.forEach(plant => { if (plant.element) { plant.element.classList.toggle('fertilized', isActive); } }); }
        function restoreFertilizerState() { if (state.fertilizerActive && state.fertilizerEndTime > Date.now()) { const remainingTime = state.fertilizerEndTime - Date.now(); if (remainingTime > 0) { if (state.fertilizerTimeoutId) clearTimeout(state.fertilizerTimeoutId); state.fertilizerTimeoutId = setTimeout(deactivateFertilizer, remainingTime); updateFertilizerStatus(); toggleFertilizerEffectOnPlants(true); } else { deactivateFertilizer(); } } else { state.fertilizerActive = false; if (state.fertilizerTimeoutId) clearTimeout(state.fertilizerTimeoutId); state.fertilizerTimeoutId = null; state.fertilizerEndTime = 0; updateFertilizerStatus(); toggleFertilizerEffectOnPlants(false); } }

        // --- Core Game Logic ---
        function startGameTimer() { if (state.gameMode !== 'challenge' || state.timerStarted || state.isGameOver) return; state.timerStarted = true; console.log("Game timer started."); if (state.gameTimerIntervalId) clearInterval(state.gameTimerIntervalId); state.gameTimerIntervalId = setInterval(() => { if (state.isGameOver) { clearInterval(state.gameTimerIntervalId); return; } state.elapsedTimeSeconds++; updateTimerDisplay(); }, 1000); }
        function updateTimerDisplay() { if (timerElement) { timerElement.textContent = formatTime(state.elapsedTimeSeconds); } }
        function checkWinCondition() { if (state.gameMode !== 'challenge' || state.isGameOver) return; if (state.score >= config.GOAL_SCORE) { state.isGameOver = true; console.log("Challenge Complete!"); playSound('win'); checkAchievements('score'); clearAllTimers(); showWinMessage(); updateButtonStates(); saveGame(); } } // saveGame called in showWinMessage if needed

        // --- UPDATED: Show Win Message with New Ranks and Achievements ---
        function showWinMessage() {
            if (!winMessageElement || state.gameMode !== 'challenge') return;

            let rank = 'None';
            let rankClass = 'rank-none';
            let achievementText = "Good job finishing!";
            let achievementUnlocked = false; // Track if a *new* rank was achieved this time

            // Determine rank based on time thresholds
            if (state.elapsedTimeSeconds <= config.TIME_THRESHOLDS.platinum) {
                rank = 'Platinum'; rankClass = 'rank-platinum';
                achievementText = "Achievement Unlocked: Platinum Gardener!";
                if (!state.achievements.achievedPlatinum) { achievementUnlocked = true; }
                state.achievements.achievedPlatinum = true; // Set current and implied lower ranks
                state.achievements.achievedGold = true;
                state.achievements.achievedSilver = true;
                state.achievements.achievedBronze = true;
            } else if (state.elapsedTimeSeconds <= config.TIME_THRESHOLDS.gold) {
                rank = 'Gold'; rankClass = 'rank-gold';
                achievementText = "Achievement Unlocked: Gold Gardener!";
                 if (!state.achievements.achievedGold) { achievementUnlocked = true; }
                 state.achievements.achievedGold = true; // Set current and implied lower ranks
                 state.achievements.achievedSilver = true;
                 state.achievements.achievedBronze = true;
            } else if (state.elapsedTimeSeconds <= config.TIME_THRESHOLDS.silver) {
                rank = 'Silver'; rankClass = 'rank-silver';
                achievementText = "Achievement Unlocked: Silver Gardener!";
                 if (!state.achievements.achievedSilver) { achievementUnlocked = true; }
                 state.achievements.achievedSilver = true; // Set current and implied lower ranks
                 state.achievements.achievedBronze = true;
            } else if (state.elapsedTimeSeconds <= config.TIME_THRESHOLDS.bronze) {
                rank = 'Bronze'; rankClass = 'rank-bronze';
                achievementText = "Achievement Unlocked: Bronze Gardener!";
                 if (!state.achievements.achievedBronze) { achievementUnlocked = true; }
                 state.achievements.achievedBronze = true; // Set current rank
            } else {
                rank = '---'; // No rank if slower than Bronze
                rankClass = 'rank-none';
                achievementText = "Challenge Complete!"; // Default message if no rank
            }

            // Update display elements in the win message
            if (finalTimeElement) finalTimeElement.textContent = formatTime(state.elapsedTimeSeconds);
            if (finalRankElement) {
                finalRankElement.textContent = rank;
                finalRankElement.className = rankClass; // Apply class for rank color styling
            }
            if (winAchievementElement) {
                winAchievementElement.textContent = achievementText; // Display achievement message
            }

            // Make the win message visible
            winMessageElement.classList.remove('hidden');

            // Save game state only if a new rank achievement was unlocked
            if (achievementUnlocked) {
                console.log(`New rank achievement unlocked: ${rank}`);
                saveGame();
            }
        }

        function startEnergyRegen() { if (state.energyRegenIntervalId) clearInterval(state.energyRegenIntervalId); if (state.isGameOver) return; state.energyRegenIntervalId = setInterval(() => { if (state.isGameOver) { clearInterval(state.energyRegenIntervalId); return; } if (state.gameMode === 'creative') { if (energyElement) energyElement.textContent = "∞"; return; } let currentRegenRate = config.ENERGY_REGEN_RATE; if (state.currentWeather === 'rain') { currentRegenRate += config.RAIN_ENERGY_BOOST_RATE; } else if (state.currentWeather === 'drought') { currentRegenRate -= config.DROUGHT_ENERGY_PENALTY_RATE; } currentRegenRate = Math.max(0, currentRegenRate); if (state.energy < config.ENERGY_CAP) { state.energy += currentRegenRate; state.energy = Math.min(config.ENERGY_CAP, state.energy); updateUIDisplays(); updateButtonStates(); } }, 1000); }
        function selectPlantType(type) { if (state.isGameOver) return; state.selectedPlantType = type; const plantTypes = ['fruitTree', 'nutTree', 'corn', 'bean', 'berry', 'groundCover', 'herb']; const buttons = [plantFruitTreeBtn, plantNutTreeBtn, plantCornBtn, plantBeanBtn, plantBerryBtn, plantGroundCoverBtn, plantHerbBtn]; buttons.forEach((btn, index) => { if (btn) btn.classList.toggle('selected', type === plantTypes[index]); }); if (selectionStatusElement) selectionStatusElement.textContent = `Selected: ${type.replace(/([A-Z])/g, ' $1')}`; if (gardenElement) gardenElement.style.cursor = 'copy'; }
        function clearSelection() { state.selectedPlantType = null; const plantButtons = [plantFruitTreeBtn, plantNutTreeBtn, plantCornBtn, plantBeanBtn, plantBerryBtn, plantGroundCoverBtn, plantHerbBtn]; plantButtons.forEach(btn => { if (btn) btn.classList.remove('selected'); }); if (selectionStatusElement) selectionStatusElement.textContent = `Select a plant type`; if (gardenElement) gardenElement.style.cursor = 'crosshair'; }
        function handleGardenInteraction(event) { if (state.isGameOver || !gardenElement) return; const target = event.target; const clickedAnimal = target.closest('.animal'); if (clickedAnimal && clickedAnimal.dataset.animalId) { console.log("DEBUG: Clicked animal:", clickedAnimal.dataset.animalId); scareAnimal(clickedAnimal.dataset.animalId); return; } const clickedItem = target.closest('.item'); if (clickedItem && clickedItem.dataset.itemId) { console.log("DEBUG: Clicked item:", clickedItem.dataset.itemId); harvestItem(clickedItem.dataset.itemId); return; } const clickedPlant = target.closest('.plant.mature'); if (clickedPlant && clickedPlant.dataset.itemId) { if (clickedPlant.classList.contains('corn') || clickedPlant.classList.contains('bean') || clickedPlant.classList.contains('herb') || clickedPlant.classList.contains('groundCover')) { console.log("DEBUG: Clicked harvestable plant:", clickedPlant.dataset.itemId); harvestDirectPlant(clickedPlant.dataset.itemId); return; } } if (state.selectedPlantType && target === gardenElement) { const rect = gardenElement.getBoundingClientRect(); const clickX = event.clientX - rect.left; const clickY = event.clientY - rect.top; console.log(`Planting Attempt: Type=${state.selectedPlantType}, Client(${event.clientX},${event.clientY}), Rect(${rect.left.toFixed(1)},${rect.top.toFixed(1)}), Relative(${clickX.toFixed(1)}, ${clickY.toFixed(1)})`); tryPlanting(state.selectedPlantType, clickX, clickY); return; } if (!state.selectedPlantType && !clickedItem && !clickedAnimal && !clickedPlant && target === gardenElement) { setStatusMessage("Select a plant type or click an item/animal.", "info"); } }
        function isSpotFree(x, y, radius = config.MIN_PLANT_DISTANCE, ignoreId = null) { for (const plant of state.plants) { if (plant.id === ignoreId) continue; const dx = x - plant.x; const dy = y - plant.y; if ((dx * dx + dy * dy) < radius * radius) { return false; } } const itemCheckRadius = radius / 2; for (const item of state.items) { if (item.id === ignoreId) continue; const dx = x - item.x; const dy = y - item.y; if ((dx * dx + dy * dy) < itemCheckRadius * itemCheckRadius) { return false; } } return true; }
        function tryPlanting(type, x, y, isSprout = false, sourceId = null) { const cost = config.PLANT_COST[type]; let canPlant = false; if (isSprout) { if (isSpotFree(x, y, config.MIN_PLANT_DISTANCE, sourceId)) { canPlant = true; } else { console.log(`DEBUG: Sprout failed for item ${sourceId} - Spot not free at (${x.toFixed(0)}, ${y.toFixed(0)}).`); return false; } } else { if (!type) { setStatusMessage("Select a plant type first!", "warn"); return false; } if (!isSpotFree(x, y)) { setStatusMessage("Too close to another plant or item!", "warn"); return false; } if (state.gameMode !== 'creative') { if (state.energy < cost) { setStatusMessage("Not enough energy!", "warn"); return false; } state.energy -= cost; } canPlant = true; } if (!canPlant) return false; if (!isSprout) playSound('plant'); else playSound('sprout'); const plantId = `plant-${Date.now()}-${Math.random().toString(16).slice(2)}`; const startTime = Date.now(); let baseGrowTime = config.GROW_TIME_MS[type]; if (typeof baseGrowTime !== 'number' || isNaN(baseGrowTime)) { console.error(`Invalid GROW_TIME_MS for type: ${type}`); baseGrowTime = 5000; } const isOnFertilePatch = isFertilePatchNearby(x, y); if (isOnFertilePatch) { baseGrowTime /= config.GROUND_COVER_GROWTH_BOOST; } const maturingDuration = baseGrowTime * config.MATURING_STAGE_FACTOR; const matureDuration = baseGrowTime; const plantData = { id: plantId, type: type, x: x, y: y, state: 'growing', maturingTimeoutId: null, maturityTimeoutId: null, itemDropIntervalId: null, herbSpreadIntervalId: null, startTime: startTime, maturingDuration: maturingDuration, matureDuration: matureDuration, element: null, isOnFertilePatch: isOnFertilePatch }; const finalMaturingTime = Math.max(10, maturingDuration); const finalMatureTime = Math.max(10, matureDuration); if (!state.isGameOver) { if (finalMaturingTime < finalMatureTime - 10 && ['fruitTree', 'nutTree', 'berry'].includes(type)) { plantData.maturingTimeoutId = setTimeout(() => { makePlantMaturing(plantId); }, finalMaturingTime); } plantData.maturityTimeoutId = setTimeout(() => { makePlantMature(plantId); }, finalMatureTime); } state.plants.push(plantData); if (!state.plantsOrItemsExist) { state.plantsOrItemsExist = true; updateInstructions(); } plantData.element = createPlantElement(plantData); if (gardenElement) { gardenElement.appendChild(plantData.element); } else { console.error("Garden element not found! Cannot append plant element."); const index = state.plants.findIndex(p => p.id === plantId); if (index > -1) state.plants.splice(index, 1); if (!isSprout && state.gameMode !== 'creative') state.energy += cost; return false; } if (!isSprout && !state.timerStarted && state.plants.length > 0 && state.gameMode === 'challenge') { startGameTimer(); } if (!isSprout) { updateUIDisplays(); updateButtonStates(); clearSelection(); setStatusMessage(`Planted ${type.replace(/([A-Z])/g, ' $1')}!`, "success"); checkAchievements('plant', type); } updateDiversityStatus(); saveGame(); return true; }
        function createPlantElement(plantData) { const container = document.createElement('div'); container.classList.add('plant', plantData.type, plantData.state); container.style.left = `${plantData.x}px`; container.style.top = `${plantData.y}px`; container.dataset.itemId = plantData.id; if (plantData.type === 'bean') { const extraLeafDiv = document.createElement('div'); extraLeafDiv.classList.add('bean-extra-leaf'); container.appendChild(extraLeafDiv); } else if (plantData.type === 'berry') { const centerClumpDiv = document.createElement('div'); centerClumpDiv.classList.add('berry-center-clump'); container.appendChild(centerClumpDiv); } else if (plantData.type === 'herb') { const centerClumpDiv = document.createElement('div'); centerClumpDiv.classList.add('herb-center-clump'); container.appendChild(centerClumpDiv); } if (state.fertilizerActive) { container.classList.add('fertilized'); } if (plantData.isOnFertilePatch) { container.classList.add('on-fertile-patch'); } return container; }
        function makePlantMaturing(plantId) { const plant = state.plants.find(p => p.id === plantId); if (!plant || plant.state !== 'growing') return; const previousState = plant.state; plant.state = 'maturing'; if (plant.element) { plant.element.classList.remove(previousState); plant.element.classList.add(plant.state); } else { console.warn(`Element missing for maturing plant ${plantId}`); } plant.maturingTimeoutId = null; playSound('maturing'); saveGame(); }
        function makePlantMature(plantId) { const plant = state.plants.find(p => p.id === plantId); if (!plant || plant.state === 'mature') return; const previousState = plant.state; plant.state = 'mature'; if (plant.element) { plant.element.classList.remove(previousState); plant.element.classList.add(plant.state); } else { console.warn(`Element missing for mature plant ${plantId}`); } if (plant.maturingTimeoutId) clearTimeout(plant.maturingTimeoutId); if (plant.maturityTimeoutId) clearTimeout(plant.maturityTimeoutId); plant.maturingTimeoutId = null; plant.maturityTimeoutId = null; if (!state.isGameOver) { if (['fruitTree', 'nutTree', 'berry'].includes(plant.type) && config.ITEM_DROP_INTERVAL_MS[plant.type]) { const dropInterval = config.ITEM_DROP_INTERVAL_MS[plant.type]; if(plant.itemDropIntervalId) clearInterval(plant.itemDropIntervalId); plant.itemDropIntervalId = setInterval(() => { const currentPlant = state.plants.find(p => p.id === plantId); if (currentPlant && currentPlant.state === 'mature') dropItem(currentPlant); else if(plant.itemDropIntervalId) clearInterval(plant.itemDropIntervalId); }, dropInterval); } if (plant.type === 'herb') { if(plant.herbSpreadIntervalId) clearInterval(plant.herbSpreadIntervalId); plant.herbSpreadIntervalId = setInterval(() => { const currentPlant = state.plants.find(p => p.id === plantId); if (currentPlant && currentPlant.state === 'mature') tryHerbSpread(currentPlant); else if(plant.herbSpreadIntervalId) clearInterval(plant.herbSpreadIntervalId); }, config.HERB_SPREAD_INTERVAL_MS); } } saveGame(); }
        function createItemElement(itemData) { const container = document.createElement('div'); const itemClass = itemData.type.replace('Tree', '').replace('Bush', '').toLowerCase(); container.classList.add('item', itemClass); container.style.left = `${itemData.x}px`; container.style.top = `${itemData.y}px`; container.dataset.itemId = itemData.id; return container; }
        function sproutPlantFromItem(itemId) { const itemIndex = state.items.findIndex(i => i.id === itemId); if (itemIndex === -1) return; const item = state.items[itemIndex]; console.log(`Attempting sprout from item ${itemId} (Type: ${item.type}) at (${item.x.toFixed(0)}, ${item.y.toFixed(0)})`); if (item.sproutIntervalId) { clearInterval(item.sproutIntervalId); } if (item.element) item.element.remove(); state.items.splice(itemIndex, 1); checkIfEmpty(); const success = tryPlanting(item.type, item.x, item.y, true, item.id); if (!success) { console.log(`Sprout failed for item ${itemId} - likely spot conflict.`); } }
        function tryItemSprout(itemId) { const item = state.items.find(i => i.id === itemId); if (!item || state.isGameOver) { const potentiallyExistingItem = state.items.find(i => i.id === itemId); if (potentiallyExistingItem?.sproutIntervalId) { clearInterval(potentiallyExistingItem.sproutIntervalId); } return; } let currentSproutChance = config.ITEM_SPROUT_CHANCE; if (isHerbNearby(item.x, item.y)) { currentSproutChance *= config.HERB_SPROUT_CHANCE_BOOST_FACTOR; } if (Math.random() < currentSproutChance) { console.log(`Item ${itemId} succeeded sprout check!`); sproutPlantFromItem(itemId); } }
        function isBeanNearby(x, y, radius = config.BEAN_BOOST_RADIUS) { return state.plants.some(plant => plant.type === 'bean' && plant.state === 'mature' && (Math.pow(x - plant.x, 2) + Math.pow(y - plant.y, 2)) < radius * radius ); }
        function isHerbNearby(x, y, radius = config.HERB_SPREAD_RADIUS) { return state.plants.some(plant => plant.type === 'herb' && plant.state === 'mature' && (Math.pow(x - plant.x, 2) + Math.pow(y - plant.y, 2)) < radius * radius ); }
        function isFertilePatchNearby(x, y) { const now = Date.now(); return state.fertilePatches.some(patch => now < patch.endTime && (Math.pow(x - patch.x, 2) + Math.pow(y - patch.y, 2)) < config.GROUND_COVER_FERTILITY_RADIUS * config.GROUND_COVER_FERTILITY_RADIUS ); }
        function removeFertilePatch(patchId) { const patchIndex = state.fertilePatches.findIndex(p => p.id === patchId); if (patchIndex !== -1) { const patch = state.fertilePatches[patchIndex]; if (patch.element) patch.element.remove(); if (patch.timeoutId) clearTimeout(patch.timeoutId); state.fertilePatches.splice(patchIndex, 1); } }
        function createFertilePatchElement(patchData) { if (!soilPatchesContainer) return null; const element = document.createElement('div'); element.classList.add('fertile-patch'); const diameter = config.GROUND_COVER_FERTILITY_RADIUS * 2; element.style.width = `${diameter}px`; element.style.height = `${diameter}px`; element.style.left = `${patchData.x - config.GROUND_COVER_FERTILITY_RADIUS}px`; element.style.top = `${patchData.y - config.GROUND_COVER_FERTILITY_RADIUS}px`; element.dataset.patchId = patchData.id; soilPatchesContainer.appendChild(element); const fadeOutDuration = 1000; const remainingDuration = patchData.endTime - Date.now(); const fadeStartTime = Math.max(0, remainingDuration - fadeOutDuration); if (fadeStartTime > 0) { setTimeout(() => { if (element) element.classList.add('fading-out'); }, fadeStartTime); } else if (remainingDuration > 0) { element.classList.add('fading-out'); } return element; }
        function calculateAdjustedPoints(basePoints, plantX, plantY) { if (basePoints <= 0) return 0; let adjustedPoints = basePoints; let pointModifiers = []; if (isBeanNearby(plantX, plantY)) { adjustedPoints += config.NITROGEN_FIX_ADJACENCY_BONUS; pointModifiers.push('Bean+'); } const { uniqueSpeciesCount } = getDiversityStats(); const cappedSpeciesCount = Math.min(uniqueSpeciesCount, config.DIVERSITY_MAX_SPECIES_FOR_BONUS); if (cappedSpeciesCount > 1) { const diversityBonus = config.DIVERSITY_POINT_BONUS_PER_SPECIES * cappedSpeciesCount; adjustedPoints += diversityBonus; } if (state.diversityStatus === 'penalty') { adjustedPoints *= config.MONOCULTURE_POINT_PENALTY_FACTOR; } if (state.fertilizerActive) { adjustedPoints *= config.FERTILIZER_BOOST_MULTIPLIER; pointModifiers.push('Fertilizer+'); } adjustedPoints = Math.round(adjustedPoints); return { points: adjustedPoints, modifiers: pointModifiers }; }
        function harvestItem(itemId) { const itemIndex = state.items.findIndex(i => i.id === itemId); if (itemIndex === -1 || state.isGameOver) return; const item = state.items[itemIndex]; const basePoints = config.ITEM_POINTS[item.type]; const { points: pointsEarned, modifiers: pointModifiers } = calculateAdjustedPoints(basePoints, item.x, item.y); state.score += pointsEarned; playSound('harvestItem'); if (item.sproutIntervalId) { clearInterval(item.sproutIntervalId); } if (item.element) item.element.remove(); state.items.splice(itemIndex, 1); checkIfEmpty(); updateUIDisplays(); checkAchievements('score'); if (state.gameMode === 'challenge') checkWinCondition(); saveGame(); const itemTypeName = item.type.replace('Tree', '').replace('Bush',''); let statusMsg = `Harvested ${itemTypeName} +${pointsEarned} points!`; if (pointModifiers.length > 0) { statusMsg += ` (${pointModifiers.join(', ')})`; } if (state.diversityStatus === 'bonus') statusMsg += ' (Diversity Bonus!)'; if (state.diversityStatus === 'penalty') statusMsg += ' (Monoculture Penalty!)'; setStatusMessage(statusMsg, "success"); }
        function harvestDirectPlant(plantId) { const plantIndex = state.plants.findIndex(p => p.id === plantId); if (plantIndex === -1 || state.isGameOver) return; const plant = state.plants[plantIndex]; const harvestableTypes = ['corn', 'bean', 'herb', 'groundCover']; if (!harvestableTypes.includes(plant.type) || plant.state !== 'mature') { return; } const basePoints = config.ITEM_POINTS[plant.type]; if (plant.type === 'groundCover') { setStatusMessage(`Cut Ground Cover! Soil enriched nearby.`, "success"); playSound('cutGroundCover'); const patchId = `patch-${Date.now()}`; const patchEndTime = Date.now() + config.GROUND_COVER_FERTILITY_DURATION_MS; const patchData = { id: patchId, x: plant.x, y: plant.y, endTime: patchEndTime, element: null, timeoutId: null }; patchData.timeoutId = setTimeout(() => removeFertilePatch(patchId), config.GROUND_COVER_FERTILITY_DURATION_MS); patchData.element = createFertilePatchElement(patchData); if (patchData.element) { state.fertilePatches.push(patchData); } saveGame(); } else { const { points: pointsEarned, modifiers: pointModifiers } = calculateAdjustedPoints(basePoints, plant.x, plant.y); state.score += pointsEarned; updateUIDisplays(); checkAchievements('score'); if (state.gameMode === 'challenge') checkWinCondition(); saveGame(); let statusMsg = `Harvested ${plant.type} +${pointsEarned} points!`; if (pointModifiers.length > 0) { statusMsg += ` (${pointModifiers.join(', ')})`; } if (state.diversityStatus === 'bonus') statusMsg += ' (Diversity Bonus!)'; if (state.diversityStatus === 'penalty') statusMsg += ' (Monoculture Penalty!)'; setStatusMessage(statusMsg, "success"); playSound('harvestDirect'); } clearPlantTimers(plant); if (plant.element) plant.element.remove(); state.plants.splice(plantIndex, 1); checkIfEmpty(); updateDiversityStatus(); }
        function tryHerbSpread(herbPlant) { if (!herbPlant || herbPlant.type !== 'herb' || herbPlant.state !== 'mature' || state.isGameOver) return; const angle = Math.random() * 2 * Math.PI; const minRadius = config.MIN_PLANT_DISTANCE; const maxRadius = config.HERB_SPREAD_RADIUS; const radius = minRadius + Math.random() * (maxRadius - minRadius); const targetX = herbPlant.x + Math.cos(angle) * radius; const targetY = herbPlant.y + Math.sin(angle) * radius; const gardenRect = gardenElement?.getBoundingClientRect(); if (!gardenRect) return; const clampedX = Math.max(10, Math.min(targetX, gardenRect.width - 10)); const clampedY = Math.max(10, Math.min(targetY, gardenRect.height - 10)); console.log(`Herb ${herbPlant.id} GUARANTEED spread attempt to (${clampedX.toFixed(0)}, ${clampedY.toFixed(0)})`); tryPlanting('herb', clampedX, clampedY, true, herbPlant.id); }
        function dropItem(plant) { if (!plant || !config.ITEM_POINTS[plant.type] || !gardenElement || state.isGameOver) return; if (!['fruitTree', 'nutTree', 'berry'].includes(plant.type)) return; const rect = gardenElement.getBoundingClientRect(); const dropRadius = config.ITEM_SPREAD_RADIUS; const angle = Math.random() * Math.PI * 2; const distance = Math.random() * dropRadius; let offsetX = Math.cos(angle) * distance; let offsetY = Math.sin(angle) * distance; offsetY = offsetY * 0.5 - 5; const dropX = plant.x + offsetX; const dropY = plant.y + offsetY; const clampedX = Math.max(10, Math.min(dropX, rect.width - 10)); const clampedY = Math.max(10, Math.min(dropY, rect.height - 10)); const itemId = `item-${Date.now()}-${Math.random().toString(16).slice(2)}`; const itemData = { id: itemId, type: plant.type, x: clampedX, y: clampedY, sproutIntervalId: null, element: null }; if (!state.isGameOver) { itemData.sproutIntervalId = setInterval(() => { tryItemSprout(itemId); }, config.ITEM_SPROUT_CHECK_INTERVAL_MS); } state.items.push(itemData); if (!state.plantsOrItemsExist) { state.plantsOrItemsExist = true; updateInstructions(); } itemData.element = createItemElement(itemData); if (gardenElement) { gardenElement.appendChild(itemData.element); } else { console.error("Garden element not found, cannot append item element."); const index = state.items.findIndex(i => i.id === itemId); if (index > -1) state.items.splice(index, 1); if (itemData.sproutIntervalId) clearInterval(itemData.sproutIntervalId); return; } saveGame(); }

        // --- Timer Management ---
        function clearPlantTimers(plant) { if (!plant) return; if (plant.maturingTimeoutId) clearTimeout(plant.maturingTimeoutId); if (plant.maturityTimeoutId) clearTimeout(plant.maturityTimeoutId); if (plant.itemDropIntervalId) clearInterval(plant.itemDropIntervalId); if (plant.herbSpreadIntervalId) clearInterval(plant.herbSpreadIntervalId); plant.maturingTimeoutId = null; plant.maturityTimeoutId = null; plant.itemDropIntervalId = null; plant.herbSpreadIntervalId = null; }
        function clearItemTimers(item) { if (!item) return; if (item.sproutIntervalId) { clearInterval(item.sproutIntervalId); } item.sproutIntervalId = null; }
        function clearAllTimers() { console.log("Clearing all game timers..."); if (state.energyRegenIntervalId) clearInterval(state.energyRegenIntervalId); if (state.gameTimerIntervalId) clearInterval(state.gameTimerIntervalId); if (state.animalAttackTimeoutId) clearTimeout(state.animalAttackTimeoutId); if (state.fertilizerTimeoutId) clearTimeout(state.fertilizerTimeoutId); if (state.weatherTimeoutId) clearTimeout(state.weatherTimeoutId); if (state.weatherCheckIntervalId) clearInterval(state.weatherCheckIntervalId); state.energyRegenIntervalId = null; state.gameTimerIntervalId = null; state.animalAttackTimeoutId = null; state.fertilizerTimeoutId = null; state.weatherTimeoutId = null; state.weatherCheckIntervalId = null; state.plants.forEach(clearPlantTimers); state.items.forEach(clearItemTimers); Object.values(state.activeAnimals).forEach(a => { if (a.timeoutId) clearTimeout(a.timeoutId); }); state.activeAnimals = {}; state.fertilePatches.forEach(p => { if (p.timeoutId) clearTimeout(p.timeoutId); p.timeoutId = null; }); console.log("All game timers cleared."); }

        // --- Game State Checks ---
        function checkIfEmpty() { state.plantsOrItemsExist = state.plants.length > 0 || state.items.length > 0; updateInstructions(); }
        function handleResetGame() { let confirmReset = true; if (state.gameInitialized && !state.isGameOver) { if (state.gameMode === 'challenge') { confirmReset = confirm("Reset current Challenge progress?"); } else if (state.gameMode === 'creative') { confirmReset = confirm("Clear the current Creative forest?"); } } if (!confirmReset) return; console.log("Resetting game..."); playSound('buttonClick', 'C3', '2n', 0.3); clearAllTimers(); const currentMuteState = state.isMuted; state = { score: 0, energy: config.ENERGY_CAP, selectedPlantType: null, plants: [], items: [], hasFence: false, energyRegenIntervalId: null, gameTimerIntervalId: null, animalAttackTimeoutId: null, elapsedTimeSeconds: 0, timerStarted: false, activeAnimals: {}, plantsOrItemsExist: false, isGameOver: false, gameInitialized: false, fertilizerActive: false, fertilizerTimeoutId: null, fertilizerEndTime: 0, fertilePatches: [], gameMode: null, isMuted: currentMuteState, currentWeather: 'none', weatherTimeoutId: null, weatherCheckIntervalId: null, scareCount: 0, achievements: { score100: false, score500: false, score1000: false, firstTree: false, firstNut: false, scare10: false, surviveDrought: false, achievedBronze: false, achievedSilver: false, achievedGold: false, achievedPlatinum: false }, diversityStatus: 'normal' }; if (gardenElement) { gardenElement.querySelectorAll('.plant, .item, .animal').forEach(el => el.remove()); gardenElement.classList.remove('fenced'); } if (soilPatchesContainer) soilPatchesContainer.innerHTML = ''; if (winMessageElement) winMessageElement.classList.add('hidden'); if (attackMessageElement) attackMessageElement.classList.remove('visible'); if (weatherOverlayElement) weatherOverlayElement.className = 'hidden'; if (animalWarningElement) animalWarningElement.classList.add('hidden'); if (instructionsElement) instructionsElement.style.display = 'block'; localStorage.removeItem(config.SAVE_KEY); updateUIDisplays(); updateTimerDisplay(); updateButtonStates(); updateFertilizerStatus(); updateMuteButtonVisual(); updateDiversityStatus(); clearSelection(); setStatusMessage("Select a plant type", "info"); if (titleScreen) titleScreen.classList.remove('hidden'); if (gameContainer) gameContainer.classList.add('hidden'); console.log("Game reset complete. Returned to title screen."); }

        // --- UI Updates ---
        function updateUIDisplays() { if (scoreElement) scoreElement.textContent = state.score; if (energyElement) { energyElement.textContent = (state.gameMode === 'creative') ? "∞" : Math.floor(state.energy); } if (energyCapDisplayElement) { energyCapDisplayElement.style.display = (state.gameMode === 'creative') ? 'none' : 'inline'; } if (energyCapElement) { energyCapElement.textContent = config.ENERGY_CAP; } if (fenceStatusElement) { fenceStatusElement.textContent = state.hasFence ? "Built" : "None"; fenceStatusElement.className = state.hasFence ? 'built info-item' : 'none info-item'; } updateFertilizerStatus(); if (state.gameMode === 'challenge' && animalWarningElement) { animalWarningElement.classList.toggle('hidden', state.hasFence || Object.keys(state.activeAnimals).length === 0); } else if (animalWarningElement) { animalWarningElement.classList.add('hidden'); } }
        function updatePlantCostsAndPoints() { if (costGroundCoverElement) costGroundCoverElement.textContent = config.PLANT_COST.groundCover; if (costHerbElement) costHerbElement.textContent = config.PLANT_COST.herb; if (costBerryElement) costBerryElement.textContent = config.PLANT_COST.berry; if (costCornElement) costCornElement.textContent = config.PLANT_COST.corn; if (costBeanElement) costBeanElement.textContent = config.PLANT_COST.bean; if (costFruitTreeElement) costFruitTreeElement.textContent = config.PLANT_COST.fruitTree; if (costNutTreeElement) costNutTreeElement.textContent = config.PLANT_COST.nutTree; if (costFenceElement) costFenceElement.textContent = config.FENCE_COST; if (costFertilizerElement) costFertilizerElement.textContent = config.FERTILIZER_COST; if (pointsHerbElement) pointsHerbElement.textContent = config.ITEM_POINTS.herb; if (pointsBerryElement) pointsBerryElement.textContent = config.ITEM_POINTS.berry; if (pointsCornElement) pointsCornElement.textContent = config.ITEM_POINTS.corn; if (pointsBeanElement) pointsBeanElement.textContent = config.ITEM_POINTS.bean; if (pointsFruitTreeElement) pointsFruitTreeElement.textContent = config.ITEM_POINTS.fruitTree; if (pointsNutTreeElement) pointsNutTreeElement.textContent = config.ITEM_POINTS.nutTree; }
        function updateButtonStates() { const isCreative = state.gameMode === 'creative'; const plantButtons = { fruitTree: plantFruitTreeBtn, nutTree: plantNutTreeBtn, corn: plantCornBtn, bean: plantBeanBtn, berry: plantBerryBtn, groundCover: plantGroundCoverBtn, herb: plantHerbBtn }; for (const type in plantButtons) { const btn = plantButtons[type]; if (btn) { const cost = config.PLANT_COST[type]; btn.disabled = state.isGameOver || (!isCreative && state.energy < cost); } } if (buyFenceBtn) { buyFenceBtn.disabled = state.isGameOver || state.hasFence || (!isCreative && state.energy < config.FENCE_COST); buyFenceBtn.textContent = state.hasFence ? "Fence Built" : `Build Fence (${config.FENCE_COST} E)`; } if (buyFertilizerBtn) { buyFertilizerBtn.disabled = state.isGameOver || state.fertilizerActive || (!isCreative && state.energy < config.FERTILIZER_COST); } if(resetGameBtn) resetGameBtn.disabled = false; if(winResetBtn) winResetBtn.disabled = !state.isGameOver; }
        function updateInstructions() { if (instructionsElement) { instructionsElement.style.display = state.plantsOrItemsExist ? 'none' : 'block'; } }
        function setStatusMessage(message, type = "info") { if (!selectionStatusElement) return; selectionStatusElement.textContent = message; switch (type) { case "success": selectionStatusElement.style.color = "#2ecc71"; break; case "warn": selectionStatusElement.style.color = "#f39c12"; break; case "error": selectionStatusElement.style.color = "#e74c3c"; break; case "info": default: selectionStatusElement.style.color = "#555"; } }
        function getDiversityStats() { const plantCounts = {}; let totalPlants = state.plants.length; let uniqueSpeciesCount = 0; let maxCount = 0; if (totalPlants === 0) { return { uniqueSpeciesCount: 0, dominantSpeciesPercent: 0 }; } state.plants.forEach(plant => { plantCounts[plant.type] = (plantCounts[plant.type] || 0) + 1; }); uniqueSpeciesCount = Object.keys(plantCounts).length; for (const type in plantCounts) { if (plantCounts[type] > maxCount) { maxCount = plantCounts[type]; } } const dominantSpeciesPercent = maxCount / totalPlants; return { uniqueSpeciesCount, dominantSpeciesPercent }; }
        function updateDiversityStatus() { if (!diversityStatusElement || state.gameMode !== 'challenge') { if (diversityStatusElement) diversityStatusElement.textContent = 'N/A'; state.diversityStatus = 'normal'; return; } const { uniqueSpeciesCount, dominantSpeciesPercent } = getDiversityStats(); let statusText = "Normal"; let statusClass = "status-normal"; state.diversityStatus = 'normal'; if (uniqueSpeciesCount === 0) { statusText = "Empty"; statusClass = "status-normal"; } else if (dominantSpeciesPercent >= config.MONOCULTURE_THRESHOLD_PERCENT && uniqueSpeciesCount > 0) { statusText = "Monoculture Penalty!"; statusClass = "status-penalty"; state.diversityStatus = 'penalty'; } else if (uniqueSpeciesCount > 1) { const cappedBonusSpecies = Math.min(uniqueSpeciesCount, config.DIVERSITY_MAX_SPECIES_FOR_BONUS); const bonusAmount = (config.DIVERSITY_POINT_BONUS_PER_SPECIES * cappedBonusSpecies).toFixed(1); statusText = `Diversity Bonus (+${bonusAmount} pts)!`; statusClass = "status-bonus"; state.diversityStatus = 'bonus'; } diversityStatusElement.textContent = statusText; diversityStatusElement.className = statusClass; }

        // --- Guide Modal ---
        function showGuide() { if (guideModal) { populateGuide(); guideModal.classList.remove('hidden'); playSound('buttonClick'); } }
        function hideGuide() { if (guideModal) { guideModal.classList.add('hidden'); playSound('buttonClick'); } }
        // --- UPDATED: Populate guide with new rank times ---
        function populateGuide() {
            updatePlantCostsAndPoints(); // Update costs/points in guide
            displayChallengeTimes(); // Update rank times in guide
        }

        // --- Achievements ---
        // --- UPDATED: CheckAchievements only handles non-rank achievements now ---
        function checkAchievements(triggerType, detail = null) {
            let achievementUnlocked = false;
            let message = "";
            switch(triggerType) {
                case 'score': if (!state.achievements.score100 && state.score >= 100) { state.achievements.score100 = true; message = "Achievement: Score 100!"; achievementUnlocked = true; } if (!state.achievements.score500 && state.score >= 500) { state.achievements.score500 = true; message = "Achievement: Score 500!"; achievementUnlocked = true; } break;
                case 'plant': if (!state.achievements.firstTree && detail === 'fruitTree') { state.achievements.firstTree = true; message = "Achievement: First Fruit Tree!"; achievementUnlocked = true; } if (!state.achievements.firstNut && detail === 'nutTree') { state.achievements.firstNut = true; message = "Achievement: First Nut Tree!"; achievementUnlocked = true; } break;
                case 'scare': if (!state.achievements.scare10 && state.scareCount >= 10) { state.achievements.scare10 = true; message = "Achievement: Deer Scarer (x10)!"; achievementUnlocked = true; } break;
                case 'surviveDrought': if (!state.achievements.surviveDrought) { state.achievements.surviveDrought = true; message = "Achievement: Weathered the Drought!"; achievementUnlocked = true; } break;
            }
            if (achievementUnlocked) { console.log("Achievement Unlocked:", message); setStatusMessage(message, "success"); saveGame(); }
        }


        // --- Persistence (Save/Load) ---
        // --- UPDATED: Save/Load includes rank achievements ---
        function saveGame() {
            if (!state.gameInitialized || state.gameMode === null) return;
            try {
                const now = Date.now();
                const plantsToSave = state.plants.map(p => { let rMT = 0, rT = 0; if (!state.isGameOver && (p.maturingTimeoutId || p.maturityTimeoutId)) { const eMT = p.startTime + p.matureDuration; const eTi = p.startTime + p.maturingDuration; rT = Math.max(0, eMT - now); if (p.state === 'growing' && p.maturingTimeoutId) { rMT = Math.max(0, eTi - now); } } return { id: p.id, t: p.type, x: p.x, y: p.y, s: p.state, rMT: rMT, rT: rT, iFP: p.isOnFertilePatch }; });
                const itemsToSave = state.items.map(i => ({ id: i.id, t: i.type, x: i.x, y: i.y }));
                const patchesToSave = state.fertilePatches.map(p => ({ id: p.id, x: p.x, y: p.y, eT: p.endTime }));
                const stateToSave = { s: state.score, e: state.energy, eTS: state.elapsedTimeSeconds, iGO: state.isGameOver, hF: state.hasFence, tS: state.timerStarted, fA: state.fertilizerActive, fET: state.fertilizerEndTime, cW: state.currentWeather, gM: state.gameMode, iM: state.isMuted, sC: state.scareCount, a: state.achievements, pOIE: state.plantsOrItemsExist, p: plantsToSave, i: itemsToSave, fP: patchesToSave };
                localStorage.setItem(config.SAVE_KEY, JSON.stringify(stateToSave));
            } catch (error) { console.error("Error saving game:", error); setStatusMessage("Error saving game state!", "error"); }
        }
        function loadGame() {
            try {
                const savedStateJSON = localStorage.getItem(config.SAVE_KEY); if (!savedStateJSON) { console.log("No saved game found."); return; }
                const savedState = JSON.parse(savedStateJSON); console.log("Loading saved game...");
                state.score = savedState.s ?? 0; state.energy = savedState.e ?? config.ENERGY_CAP; state.elapsedTimeSeconds = savedState.eTS ?? 0; state.isGameOver = savedState.iGO ?? false; state.hasFence = savedState.hF ?? false; state.timerStarted = savedState.tS ?? false; state.fertilizerActive = savedState.fA ?? false; state.fertilizerEndTime = savedState.fET ?? 0; if (state.gameMode && savedState.gM && state.gameMode !== savedState.gM) { console.warn(`Loaded game mode (${savedState.gM}) differs from current mode (${state.gameMode}). Using current mode.`); } else if (!state.gameMode && savedState.gM) { console.warn("Game mode not set before load, using saved mode."); state.gameMode = savedState.gM; } state.isMuted = savedState.iM ?? false; state.currentWeather = savedState.cW ?? 'none';
                const defaultAchievements = { score100: false, score500: false, score1000: false, firstTree: false, firstNut: false, scare10: false, surviveDrought: false, achievedBronze: false, achievedSilver: false, achievedGold: false, achievedPlatinum: false };
                state.achievements = { ...defaultAchievements, ...(savedState.a ?? {}) };
                state.scareCount = savedState.sC ?? 0; state.plantsOrItemsExist = savedState.pOIE ?? false;
                state.plants = []; state.items = []; state.fertilePatches = []; const now = Date.now();
                 if (savedState.fP && Array.isArray(savedState.fP)) { savedState.fP.forEach(sp => { const rt = sp.eT - now; if (rt > 0 && !state.isGameOver) { const pd = { id: sp.id, x: sp.x, y: sp.y, endTime: sp.eT, element: null, timeoutId: setTimeout(() => removeFertilePatch(sp.id), rt) }; state.fertilePatches.push(pd); } }); }
                if (savedState.p && Array.isArray(savedState.p)) { savedState.p.forEach(sp => { const plantType = sp.t; if (!config.GROW_TIME_MS[plantType]) { console.warn(`Skipping loading plant with unknown type: ${plantType}`); return; } let bgt = config.GROW_TIME_MS[plantType]; let ifp = sp.iFP ?? false; if (ifp) { bgt /= config.GROUND_COVER_GROWTH_BOOST; } const md = bgt * config.MATURING_STAGE_FACTOR; const mad = bgt; const est = now - (mad - sp.rT); const pD = { id: sp.id, type: plantType, x: sp.x, y: sp.y, state: sp.s, maturingTimeoutId: null, maturityTimeoutId: null, itemDropIntervalId: null, herbSpreadIntervalId: null, element: null, startTime: est, maturingDuration: md, matureDuration: mad, isOnFertilePatch: ifp }; if (!state.isGameOver && pD.state !== 'mature') { const rm = Math.max(10, sp.rT); const rmm = Math.max(10, sp.rMT); if (pD.state === 'growing' && rmm > 0 && rmm < rm - 10 && ['fruitTree', 'nutTree', 'berry'].includes(pD.type)) { pD.maturingTimeoutId = setTimeout(() => makePlantMaturing(pD.id), rmm); } if (rm > 0) { pD.maturityTimeoutId = setTimeout(() => makePlantMature(pD.id), rm); } else { pD.state = 'mature'; } } if (pD.state === 'mature' && !state.isGameOver) { if (['fruitTree', 'nutTree', 'berry'].includes(pD.type) && config.ITEM_DROP_INTERVAL_MS[pD.type]) { const dI = config.ITEM_DROP_INTERVAL_MS[pD.type]; pD.itemDropIntervalId = setInterval(() => { const cp = state.plants.find(p=>p.id===pD.id); if (cp && cp.state==='mature') dropItem(cp); else if(pD.itemDropIntervalId) clearInterval(pD.itemDropIntervalId); }, dI); } if (pD.type === 'herb') { pD.herbSpreadIntervalId = setInterval(() => { const cp=state.plants.find(p=>p.id===pD.id); if (cp && cp.state==='mature') tryHerbSpread(cp); else if(pD.herbSpreadIntervalId) clearInterval(pD.herbSpreadIntervalId); }, config.HERB_SPREAD_INTERVAL_MS); } } state.plants.push(pD); }); }
                if (savedState.i && Array.isArray(savedState.i)) { savedState.i.forEach(si => { const itemType = si.t; if (!['fruitTree', 'nutTree', 'berry'].includes(itemType)) { console.warn(`Skipping loading item with non-sproutable type: ${itemType}`); return; } const iD = { id: si.id, type: itemType, x: si.x, y: si.y, sproutIntervalId: null, element: null }; if (!state.isGameOver) { iD.sproutIntervalId = setInterval(() => { tryItemSprout(iD.id); }, config.ITEM_SPROUT_CHECK_INTERVAL_MS); } state.items.push(iD); }); }
                console.log(`Game Loaded. Score: ${state.score}, Mode: ${state.gameMode}, Plants: ${state.plants.length}, Items: ${state.items.length}`);
            } catch (error) { console.error("Error loading game:", error); setStatusMessage("Error loading saved game! Resetting.", "error"); localStorage.removeItem(config.SAVE_KEY); }
        }

        // --- Rendering ---
        function renderAllPlants() { if (!gardenElement) return; state.plants.forEach(plantData => { if (!plantData.element || !gardenElement.contains(plantData.element)) { plantData.element = createPlantElement(plantData); gardenElement.appendChild(plantData.element); } else { const expectedClasses = ['plant', plantData.type, plantData.state]; if (state.fertilizerActive) expectedClasses.push('fertilized'); if (plantData.isOnFertilePatch) expectedClasses.push('on-fertile-patch'); plantData.element.className = ''; plantData.element.classList.add(...expectedClasses); plantData.element.style.left = `${plantData.x}px`; plantData.element.style.top = `${plantData.y}px`; } }); }
        function renderAllItems() { if (!gardenElement) return; state.items.forEach(itemData => { if (!itemData.element || !gardenElement.contains(itemData.element)) { itemData.element = createItemElement(itemData); gardenElement.appendChild(itemData.element); } else { itemData.element.style.left = `${itemData.x}px`; itemData.element.style.top = `${itemData.y}px`; } }); }
        function renderAllFertilePatches() { if (!soilPatchesContainer) return; state.fertilePatches.forEach(patchData => { if (!patchData.element || !soilPatchesContainer.contains(patchData.element)) { patchData.element = createFertilePatchElement(patchData); } else { const diameter = config.GROUND_COVER_FERTILITY_RADIUS * 2; patchData.element.style.width = `${diameter}px`; patchData.element.style.height = `${diameter}px`; patchData.element.style.left = `${patchData.x - config.GROUND_COVER_FERTILITY_RADIUS}px`; patchData.element.style.top = `${patchData.y - config.GROUND_COVER_FERTILITY_RADIUS}px`; } }); }

        // --- Utility Functions ---
        function formatTime(totalSeconds) { const minutes = Math.floor(totalSeconds / 60); const seconds = totalSeconds % 60; return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`; }
        // --- UPDATED: Display all rank times ---
        function displayChallengeTimes() {
            // Status Bar
            if (platinumTimeElement) platinumTimeElement.textContent = formatTime(config.TIME_THRESHOLDS.platinum);
            if (goldTimeElement) goldTimeElement.textContent = formatTime(config.TIME_THRESHOLDS.gold);
            if (silverTimeElement) silverTimeElement.textContent = formatTime(config.TIME_THRESHOLDS.silver);
            if (bronzeTimeElement) bronzeTimeElement.textContent = formatTime(config.TIME_THRESHOLDS.bronze);
            // Guide Modal
            if (guidePlatinumTimeElement) guidePlatinumTimeElement.textContent = formatTime(config.TIME_THRESHOLDS.platinum);
            if (guideGoldTimeElement) guideGoldTimeElement.textContent = formatTime(config.TIME_THRESHOLDS.gold);
            if (guideSilverTimeElement) guideSilverTimeElement.textContent = formatTime(config.TIME_THRESHOLDS.silver);
            if (guideBronzeTimeElement) guideBronzeTimeElement.textContent = formatTime(config.TIME_THRESHOLDS.bronze);
        }
        function toggleMute() { state.isMuted = !state.isMuted; updateMuteButtonVisual(); localStorage.setItem('foodForestMuteState', JSON.stringify(state.isMuted)); if (!state.isMuted) { playSound('buttonClick', 'E5'); } }
        function updateMuteButtonVisual() { if (!muteBtn) return; muteBtn.textContent = state.isMuted ? '🔇' : '🔊'; muteBtn.classList.toggle('muted', state.isMuted); }

        // --- Initial Setup ---
        console.log("DEBUG: Adding title screen/guide listeners...");
        startChallengeBtn?.addEventListener('click', () => { startGame('challenge'); });
        startCreativeBtn?.addEventListener('click', () => { startGame('creative'); });
        guideBtn?.addEventListener('click', showGuide);
        closeGuideBtn?.addEventListener('click', hideGuide);
        guideModal?.addEventListener('click', (e) => { if (e.target === guideModal) hideGuide(); });
        console.log("DEBUG: Initial listeners attached.");

    }); // End DOMContentLoaded listener

})(); // End IIFE
