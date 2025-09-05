// Brainwave data fetching and display functionality with fortune integration

// Multi-sine wave brainwave generation with frequency weighting
function generateFrequencyWeightedWave(brainwaveType, amplitude, width = 80, height = 20) {
    const points = [];
    const centerY = height / 2;
    const maxAmplitude = height / 3;
    
    // Define frequency ranges for each brainwave type (in Hz)
    const brainwaveSpecs = {
        delta: { minHz: 0.5, maxHz:   4, centerHz: 2.25, numWaves: 7 },
        theta: { minHz:   4, maxHz:   8, centerHz:    6, numWaves: 13 },
        alpha: { minHz:   8, maxHz:  12, centerHz:   10, numWaves: 8 },
        beta:  { minHz:  12, maxHz:  30, centerHz:   21, numWaves: 10 },
        gamma: { minHz:  30, maxHz: 100, centerHz:   65, numWaves: 2 }
    };
    
    const spec = brainwaveSpecs[brainwaveType];
    if (!spec) return `M0,${centerY} L${width},${centerY}`;
    
    // Generate frequency components with weighted amplitudes
    const waveComponents = [];
    for (let i = 0; i < spec.numWaves; i++) {
        // Distribute frequencies across the range
        const freq = spec.minHz + (spec.maxHz - spec.minHz) * ((i + 1) / (spec.numWaves + 2));
        
        // Calculate amplitude weight based on distance from center frequency
        const distanceFromCenter = Math.abs(freq - spec.centerHz);
        const maxDistance = Math.max(spec.centerHz - spec.minHz, spec.maxHz - spec.centerHz);
        const weight = 1 - (distanceFromCenter / maxDistance) * 0.3; // 70% falloff at edges
        
        // Scale frequency for visualization (quarter second at 256 samples/sec gives us 64 samples)
        const visualFreq = freq / 20; // Scale down for visual appeal
        
        // Use position-based phase offset for consistent, pleasing interference patterns
        const positionRatio = (i + 1) / (spec.numWaves + 2); // 0 to 1 across the range
        const phaseOffset = i + positionRatio * Math.PI * 2; // Spread phases across 2π
        
        waveComponents.push({
            freq: visualFreq,
            amplitude: weight * amplitude,
            phase: phaseOffset // Position-based phase offset
        });
    }
    console.log(waveComponents)

    // Generate the wave by summing all components
    for (let x = 0; x < width; x++) {
        const t = (x / width) * Math.PI * 8; // Time parameter for quarter second
        let y = 0;
        
        // Sum all frequency components
        waveComponents.forEach(component => {
            y += Math.sin(t * component.freq + component.phase) * component.amplitude;
        });
        
        // Apply scaling and centering
        y = centerY - (y * maxAmplitude);
        
        // Clamp to bounds
        y = Math.max(1, Math.min(height - 1, y));
        points.push(`${x},${y}`);
    }
    
    return `M${points.join(' L')}`;
}

function updateWaveVisualization(waveId, brainwaveType, amplitude) {
    const wavePath = document.querySelector(`#${waveId} .wave-path`);
    if (!wavePath) return;
    
    const path = generateFrequencyWeightedWave(brainwaveType, amplitude);
    wavePath.setAttribute('d', path);
}

function updateAllWaveVisualizations(brainwaves) {
    // Use relative amplitudes based on the max value for better visual contrast
    let m = Math.max(brainwaves.delta, brainwaves.theta, brainwaves.alpha, brainwaves.beta, brainwaves.gamma);
    m *= (1.0 - 0.0);
    
    // Update each brainwave with realistic frequency patterns
    updateWaveVisualization('deltaWave', 'delta', 0.0 + brainwaves.delta / m);
    updateWaveVisualization('thetaWave', 'theta', 0.0 + brainwaves.theta / m);
    updateWaveVisualization('alphaWave', 'alpha', 0.0 + brainwaves.alpha / m);
    updateWaveVisualization('betaWave',  'beta',  0.0 + brainwaves.beta  / m);
    updateWaveVisualization('gammaWave', 'gamma', 0.0 + brainwaves.gamma / m);
}

function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const run = params.get('run');
    const headband = params.get('headband');
    
    return {
        run: run !== null ? parseInt(run) : 0,
        headband: headband !== null ? parseInt(headband) : 1
    };
}

function normalizeBrainwaves(rawValues) {
    let { alpha, beta, gamma, delta, theta } = rawValues;
    delta /= 20;
    const total = alpha + beta + gamma + delta + theta;
    
    if (total === 0) return rawValues;
    
    return {
        alpha: alpha / total,
        beta: beta / total,
        gamma: gamma / total,
        delta: delta / total,
        theta: theta / total
    };
}

const fortunes = {
    high_alpha: [
        "Your relaxed mind opens to creative possibilities. Trust the calm clarity within.",
        "In stillness, solutions emerge naturally. Let your awareness guide you.",
        "Creative energy flows when the mind is at peace. Embrace this moment."
    ],
    high_beta: [
        "Your active mind cuts through complexity with precision and focus.",
        "Problem-solving comes naturally when your awareness is sharp and engaged.",
        "Mental agility leads to breakthrough moments. Stay alert to opportunities."
    ],
    high_gamma: [
        "Your heightened mind makes connections others cannot see.",
        "Insight emerges from the synthesis of ideas. Trust your expanded awareness.",
        "The patterns of understanding reveal themselves to your awakened consciousness."
    ],
    high_delta: [
        "Your unconscious mind processes profound transformations in the depths.",
        "Deep currents of change flow beneath conscious awareness. Allow the process.",
        "In trance-like states, your deepest wisdom emerges from shadow into light."
    ],
    high_theta: [
        "Your subconscious mind weaves creativity and intuition into new forms.",
        "Meditative states reveal the hidden connections between all things.",
        "Insight flows from the deepest depths of your mind."
    ],
    balanced: [
        "All levels of consciousness work in harmony to create perfect understanding.",
        "Your integrated awareness brings balanced perspective to every situation.",
        "Mind, body, and spirit align to manifest your highest potential."
    ],
    high_focus: [
        "Concentrated attention becomes a laser that cuts through all obstacles.",
        "Your directed awareness transforms challenges into stepping stones.",
        "Single-pointed focus unlocks the door to extraordinary achievement."
    ],
    high_clear: [
        "Relaxed awareness brings crystal clarity to all that was once clouded.",
        "Creative understanding flows like light through a clear mind.",
        "Calm perception reveals the elegant simplicity within complexity."
    ],
    high_meditation: [
        "Transcendent stillness opens the gateway to infinite awareness.",
        "In the depths of silence, universal wisdom speaks without words.",
        "Your expanded consciousness touches the eternal source of all knowing."
    ],
    high_dream: [
        "Unconscious processing reveals symbolic truths through inner imagery.",
        "Trance-like states dissolve the boundaries between possible and real.",
        "Deep mind weaves visions that carry messages from beyond ordinary awareness."
    ]
}

function getDominantPattern(brainwaves, mlAnalysis) {
    // Check ML analysis first (they take priority)
    const { focus, clear, meditation, dream } = mlAnalysis;
    const mlMax = Math.max(focus, clear, meditation, dream);
    
    // Meditation is extremely rare and special
    if (meditation === mlMax && meditation > 0.6) {
        return 'high_meditation';
    }
    
    // Other ML patterns
    if (focus === mlMax && focus > 0.7) return 'high_focus';
    if (clear === mlMax && clear > 0.7) return 'high_clear';
    if (dream === mlMax && dream > 0.7) return 'high_dream';
    
    // Fall back to brainwave patterns (excluding delta)
    const { alpha, beta, gamma, theta } = brainwaves;
    const waves = { alpha, beta, gamma, theta };
    
    let maxWave = 'balanced';
    let maxValue = 0;
    
    for (const [wave, value] of Object.entries(waves)) {
        if (value > maxValue && value > 0.25) {
            maxValue = value;
            maxWave = `high_${wave}`;
        }
    }
    
    return maxWave;
}

function getRandomFortune(category, brainwaves, mlAnalysis) {
    const categoryFortunes = fortunes[category] || fortunes.balanced;
    
    // Create a deterministic seed based on the brainwave and ML values
    const seed = Math.round(
        (brainwaves.alpha * 1000) + 
        (brainwaves.beta * 2000) + 
        (brainwaves.gamma * 3000) + 
        (brainwaves.delta * 4000) + 
        (brainwaves.theta * 5000) +
        (mlAnalysis.focus * 6000) +
        (mlAnalysis.clear * 7000) +
        (mlAnalysis.meditation * 8000) +
        (mlAnalysis.dream * 9000)
    );
    
    // Use the seed to pick a deterministic fortune
    const index = seed % categoryFortunes.length;
    return categoryFortunes[index];
}

function updateBrainwaveDisplay(brainwaves, mlAnalysis) {
    // Update brainwave values in number boxes (normalized percentages)
    document.getElementById('deltaBox').textContent = (brainwaves.delta * 100).toFixed(0) + '%';
    document.getElementById('thetaBox').textContent = (brainwaves.theta * 100).toFixed(0) + '%';
    document.getElementById('alphaBox').textContent = (brainwaves.alpha * 100).toFixed(0) + '%';
    document.getElementById('betaBox').textContent = (brainwaves.beta * 100).toFixed(0) + '%';
    document.getElementById('gammaBox').textContent = (brainwaves.gamma * 100).toFixed(0) + '%';
    
    // Update ML analysis values in number boxes
    document.getElementById('focusBox').textContent = (mlAnalysis.focus * 100).toFixed(0) + '%';
    document.getElementById('clearBox').textContent = (mlAnalysis.clear * 100).toFixed(0) + '%';
    document.getElementById('meditationBox').textContent = (mlAnalysis.meditation * 100).toFixed(0) + '%';
    document.getElementById('dreamBox').textContent = (mlAnalysis.dream * 100).toFixed(0) + '%';
    
    // Update wave visualizations
    updateAllWaveVisualizations(brainwaves);
    
    // Update fortune based on the data
    const dominantPattern = getDominantPattern(brainwaves, mlAnalysis);
    const fortune = getRandomFortune(dominantPattern, brainwaves, mlAnalysis);
    document.getElementById('fortuneMessage').textContent = fortune;
    
    // Hide loading dots and scale in the data panel
    document.getElementById('loadingDots').style.display = 'none';
    const dataPanel = document.getElementById('dataPanel');
    dataPanel.style.opacity = '1';
    dataPanel.style.transform = 'scale(1)';
}

async function fetchBrainwaveData() {
    try {
        const urlParams = getUrlParams();
        console.log('URL Params:', urlParams);
        
        // Show loading dots
        document.getElementById('loadingDots').style.display = 'block';
        document.getElementById('fortuneMessage').textContent = 'Connecting to the cosmos...';
        
        const response = await fetch('https://bq3lmawgx4.execute-api.us-east-2.amazonaws.com/query_seventh_dimension_ITP_camp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "run": urlParams.run,
                "headband": urlParams.headband
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch brainwave data');
        }
        
        const data = await response.json();
        
        // Normalize brainwave values
        const rawBrainwaves = {
            alpha: data.alpha || 0,
            beta: data.beta || 0,
            gamma: data.gamma || 0,
            delta: data.delta || 0,
            theta: data.theta || 0
        };
        const brainwaves = normalizeBrainwaves(rawBrainwaves);
        
        // Extract ML analysis
        const mlAnalysis = {
            focus: data.focus || 0,
            clear: data.clear || 0,
            meditation: data.meditation || 0,
            dream: data.dream || 0
        };
        
        // Update the display
        updateBrainwaveDisplay(brainwaves, mlAnalysis);
        
        console.log('Brainwave data updated:', { brainwaves, mlAnalysis });
        
    } catch (error) {
        console.error('Error fetching brainwave data:', error);
        // Show error in display
        const errorMsg = 'X';
        document.getElementById('deltaBox').textContent = errorMsg;
        document.getElementById('thetaBox').textContent = errorMsg;
        document.getElementById('alphaBox').textContent = errorMsg;
        document.getElementById('betaBox').textContent = errorMsg;
        document.getElementById('gammaBox').textContent = errorMsg;
        document.getElementById('focusBox').textContent = errorMsg;
        document.getElementById('clearBox').textContent = errorMsg;
        document.getElementById('meditationBox').textContent = errorMsg;
        document.getElementById('dreamBox').textContent = errorMsg;
        document.getElementById('fortuneMessage').textContent = 'Unable to read brainwaves. The universe is cloudy today.';
        
        // Hide loading dots and still scale in the panel even on error
        document.getElementById('loadingDots').style.display = 'none';
        const dataPanel = document.getElementById('dataPanel');
        dataPanel.style.opacity = '1';
        dataPanel.style.transform = 'scale(1)';
    }
}

// Initialize when page loads
window.addEventListener('load', fetchBrainwaveData);