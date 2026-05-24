/* =============================================================
   CricAI Pro - React Championship Hackathon Edition App
   ============================================================= */

// --- PROCEDURAL STADIUM AUDIO SYNTHESIZER ENGINE ---
let audioCtx = null;

function initAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playSynthSound(type, sfxEnabled) {
    if (!sfxEnabled) return;
    try {
        initAudioContext();
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        
        switch(type) {
            case 'bat':
                synthBatHit();
                break;
            case 'cheer':
                synthCrowdCheer(2.5, 900);
                break;
            case 'aww':
                synthCrowdDisappointment();
                break;
            case 'horn':
                synthTrumpetHorn();
                break;
            case 'whistle':
                synthUmpireWhistle();
                break;
            case 'dhol':
                synthDholLoop();
                break;
        }
    } catch (e) {
        console.error("Web Audio Synthesizer error:", e);
    }
}

function synthBatHit() {
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.type = 'triangle';
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
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    const noiseNode = audioCtx.createBufferSource();
    noiseNode.buffer = buffer;
    
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
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
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    const noiseNode = audioCtx.createBufferSource();
    noiseNode.buffer = buffer;
    
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(420, audioCtx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(170, audioCtx.currentTime + 0.7);
    filter.Q.setValueAtTime(2.2, audioCtx.currentTime);
    
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
    const timings = [0, 0.12, 0.24, 0.36, 0.48, 0.60];
    const durations = [0.1, 0.1, 0.1, 0.1, 0.1, 0.35];
    
    notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + timings[idx]);
        
        const vibrato = audioCtx.createOscillator();
        const vibratoGain = audioCtx.createGain();
        vibrato.frequency.value = 10;
        vibratoGain.gain.value = 6;
        vibrato.connect(vibratoGain);
        vibratoGain.connect(osc.frequency);
        
        gainNode.gain.setValueAtTime(0.001, audioCtx.currentTime + timings[idx]);
        gainNode.gain.linearRampToValueAtTime(0.12, audioCtx.currentTime + timings[idx] + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + timings[idx] + durations[idx]);
        
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        vibrato.start(audioCtx.currentTime + timings[idx]);
        osc.start(audioCtx.currentTime + timings[idx]);
        
        vibrato.stop(audioCtx.currentTime + timings[idx] + durations[idx]);
        osc.stop(audioCtx.currentTime + timings[idx] + durations[idx]);
    });
}

function synthUmpireWhistle() {
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2400, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(2550, audioCtx.currentTime + 0.06);
    osc.frequency.linearRampToValueAtTime(2400, audioCtx.currentTime + 0.12);
    
    const mod = audioCtx.createOscillator();
    const modGain = audioCtx.createGain();
    mod.frequency.value = 40;
    modGain.gain.value = 0.45;
    mod.connect(modGain);
    modGain.connect(gainNode.gain);
    
    gainNode.connect(audioCtx.destination);
    osc.connect(gainNode);
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.18, audioCtx.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.28);
    
    mod.start();
    osc.start();
    mod.stop(audioCtx.currentTime + 0.28);
    osc.stop(audioCtx.currentTime + 0.28);
}

// Global dhol loop tracker
let activeDholIntervalId = null;

function synthDholLoop() {
    if (activeDholIntervalId) {
        clearInterval(activeDholIntervalId);
    }
    let step = 0;
    const bpm = 135;
    const stepDuration = 60 / bpm / 2;
    
    activeDholIntervalId = setInterval(() => {
        if (step % 2 === 0) {
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(95, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(45, audioCtx.currentTime + 0.15);
            gainNode.gain.setValueAtTime(0.7, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.18);
            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.2);
        } else if (step === 3 || step === 7) {
            const bufferSize = audioCtx.sampleRate * 0.1;
            const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const noiseNode = audioCtx.createBufferSource();
            noiseNode.buffer = buffer;
            const filter = audioCtx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.setValueAtTime(1200, audioCtx.currentTime);
            const gainNode = audioCtx.createGain();
            gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.005, audioCtx.currentTime + 0.08);
            noiseNode.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            noiseNode.start();
        }
        step++;
        if (step >= 16) {
            clearInterval(activeDholIntervalId);
            activeDholIntervalId = null;
        }
    }, stepDuration * 1000);
}


// --- CRICAI HINGLISH DIALOGUE DATABASE ---
const DIALOGUE_LIBRARIES = {
    SIX: {
        filmy: [
            "Baap re baap! Yeh ball toh seedha ISRO ke rocket ki tarah Chandrayaan ke paas bhej di batsman ne!",
            "Gagan-chumbi chakka! Yeh shot dekh kar bowler ke toh tote udd gaye bhai, ball ab seedha stands ke paar!",
            "Bawaal boundary saheb! Khada khed kar helicopter shot ghuma diya, boundary ke log toh bas taali baja rahe hain!",
            "Kya bindaas timing hai yaar! Ball ko bheja hai seedha orbit mein, aerospace engineer bulao jaldi!"
        ],
        sarcastic: [
            "Yeh shot dekh kar toh lagta hai bowler ko bat pe bulaya tha par chhakka maar diya! Gazab beizzati hai bowler ki!",
            "Bhaisaab, thoda reham karo bowler pe! Kya gunde ki tarah de-maar chhakka laga diya bina puche!",
            "Fielder bechara ball ko boundary paar jaate dekh aise haath hila raha hai jaise shadi mein tata bol raha ho!"
        ],
        aggressive: [
            "Dhamakedar chakka! Pure brute force se ball ko udda ke rakh diya boundary line ke bohot door stands mein!",
            "Unbelievable power hitting! Bowler ka full toss mila aur batsman ne bat ka aisa muh khola ki hadd paar ho gayi!"
        ],
        death: [
            "Bhai sahab! Death overs mein poora stadium chhakke ke shor se gunj utha! Pressure cooker ko blast kar diya!",
            "OMG! Last overs ka suspense chal raha hai aur batsman ne ball ko tarbooj banake seedha sky-rocket kar diya!"
        ],
        lastball: [
            "Aakhri ball par chakka! Yeh toh pure Bollywood level drama finish hai dosto! Stadium is erupting like volcanic fire!"
        ]
    },
    FOUR: {
        filmy: [
            "Aha! Kya khoobsurat classic boundary tha, bilkul gap mein nikaal diya makkhan ki tarah!",
            "Shaandaar chauka! Fielder bechara bhaagte-bhaagte pareshan ho gaya par ball boundaries paar tapak hi gayi!",
            "Chabuk driving boundary! Bowler ne thodi si room di aur batsman ne poora tax vasool kar liya single ball pe!"
        ],
        sarcastic: [
            "Aisa cover drive maara jaise batsman bowler ka tax refund check clearance kar raha ho! Clean boundary!",
            "Gaps ko aise dhundha hai jaise shadi ke rishte mein ladki waale ladke ki kamiyan dhundhte hain! Kamaal timing!"
        ],
        aggressive: [
            "Kamaal ka bullet shot! Bat se nikli aur rocket ki speed se covers ko chirte hue boundary cross kar gayi!",
            "Shaandaar drive! Boundary lines pe aag lag chuki hai batsman ke aggressive timing se!"
        ],
        death: [
            "Pressure ke aakhri minute mein chaar runs bator liye! Bowler ka plan poora chaupat ho gaya yahan!"
        ],
        lastball: [
            "Boundary on the final delivery! Climax sequence check karo yaar, absolute thrill on visual show!"
        ]
    },
    WICKET: {
        filmy: [
            "Oh bhai, yeh kya ho gaya! Stumps ka danda ukhad gaya aur batsman bechara hairaan-pareshan khada hai!",
            "Howzzat! Catch pakad liya covers pe, kya gazab ka flying dive maara hai fielder ne!",
            "Clean bowled! Stump hawa mein dhol ki tarah gol-gol ghoom raha hai, bowler ka celebratory dance toh dekho!"
        ],
        sarcastic: [
            "Chale gaye dosto! Badi machhli jaal mein fas gayi aur batsman aise ja raha hai jaise exam room se fail ho ke nikla ho!",
            "Khatam, tata, bye-bye! Batsman ne galti ki aur dhar-dabocha gaya boundary line pe aasaani se!"
        ],
        aggressive: [
            "Cleaned him up! Starc style lightning delivery aur seedha stumps ukhad ke rakh diye! Big roar!",
            "Fatal error! Mistimed aggressive shot aur boundary line fielder ne clean overhead grab kar liya!"
        ],
        death: [
            "Death over pressure claims a wicket! Aakhri overs mein wicket khona matlab dalti local train se drop hona!",
            "Bowling team is completely in control now! Batsman fell trying to swing high!"
        ],
        lastball: [
            "Last ball and clean bowled! Bowling team ne match clean wrap up kar liya hai, extreme celebration scenes!"
        ]
    },
    DOT: {
        filmy: [
            "Kamaal ki bowling yaar, bilkul room nahi diya haath kholne ka batsman ko!",
            "Tight line aur length! Batsman keval bat ghumata reh gaya, run lena toh door ki baat hai!",
            "Dot ball! Bowler ne poora shor-sharaaba daba kar rakh diya stadium mein tight deliveries se!"
        ],
        sarcastic: [
            "Ek aur dot ball! Batsman ball ko aise touch kar raha hai jaise direct current ka shock laga ho!",
            "Dot ball ho gayi ji! Batsman ke face ka color dekh ke lag raha hai jaise marksheet aane waali ho class mein!"
        ],
        aggressive: [
            "Express speed yorker! Batsman ke bat par lagne ki bajaye straight pads ke paas se nikal gayi dot ball!",
            "Excellent tight containment! Bowler is dominating the batsman completely with dot balls!"
        ],
        death: [
            "Death overs mein dot ball sone se bhi mehengi hai boss! Bowler ne kya clutch yorker daali hai!"
        ],
        lastball: [
            "Dot ball on the last ball! Bowling team has clinically sealed the tournament victory, outstanding!"
        ]
    },
    RUNS: {
        filmy: [
            "Aasaani se single le liya aur strike rotation chalu hai, bilkul calculated game.",
            "Bhaagte hi do runs bacha liye! Gazab ki running between the wickets hai dono ki speed!",
            "Quick single! Aise bhaage dono jaise peeche stadium ka security guard pad gaya ho!"
        ],
        sarcastic: [
            "Ek run mil gaya aasaani se. Strike change hui, chalo thoda timepass toh badha game ka!",
            "Daud ke do runs pure kar liye. Batsman ka fitness level check kar ke Kohli bhi khush ho jaayega aaj!"
        ],
        aggressive: [
            "Sprint speed running! Boundary nahi mili par aggressively do runs convert kar liye fields mein!",
            "Hard run single keeping the score rolling smoothly!"
        ],
        death: [
            "Aakhri overs mein do runs! Bhaagne ka jazba aur boundaries avoid karna but score updates continuous!"
        ],
        lastball: [
            "Last ball single and match reaches the absolute finish line, what a thriller!"
        ]
    },
    EXTRA: {
        filmy: [
            "Oh ho! Bowler sahab lagta hai target pressure mein lane aur direction dono bhatak gaye hain.",
            "Wide ball! Umpire ne dono haath failaye, lagta hai titanic film ka romantic pose bana rahe hain!",
            "No ball! Free hit milegi ab! Batsman ke chehre par toh IPL trophy jeetne jaisi khushi saaf dikh rahi hai!"
        ],
        sarcastic: [
            "Extra runs mile free mein! Yeh free ka maal dekh kar batsman ka dimaag aur dil dono machal gaye hain!",
            "Bowler sahab aisi ball daal rahe hain ki keeper ko bhi boundary dive lagani pad rahi hai wide bachane ke liye!"
        ],
        aggressive: [
            "Wayward line! Starc-level pace check wide bouncers flying past the batsman's reach!",
            "No ball! Massive overstep line bowler error, batting team gets free hit now!"
        ],
        death: [
            "Aakhri overs mein extra dena matlab direct self-destruction mode active karna hai! Big mistake!"
        ],
        lastball: [
            "Wide on the final ball! Unbelievable tension levels! Pitch stands inside high anxiety!"
        ]
    }
};

const ENDINGS = [
    "CROWD GOES WILD! 🎉🏏",
    "Aaaaand the stadium erupts! 🏟️✨",
    "Sab log uth ke khade ho gaye hain! 👏🔥",
    "Stadium mein shor bemisaal hai boss! 📣🔊",
    "Tension badhta hi jaa raha hai, unbelievable atmosphere! 😬💥",
    "Cricket fans bilkul paagal ho chuke hain! 🤪🕺"
];

function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function compileHinglishCommentary(outcome, tone, scenario, striker, strikerStyle, bowler, customShotText = "") {
    let category = DIALOGUE_LIBRARIES[outcome];
    if (!category) category = DIALOGUE_LIBRARIES.DOT;

    let commentaryBase = "";
    if (scenario === "lastball" && category.lastball) {
        commentaryBase = getRandomItem(category.lastball);
    } else if (scenario === "death" && category.death) {
        commentaryBase = getRandomItem(category.death);
    } else if (category[tone]) {
        commentaryBase = getRandomItem(category[tone]);
    } else {
        commentaryBase = getRandomItem(category.filmy);
    }

    let shotPrefix = "";
    if (customShotText) {
        shotPrefix = `Aha! ${striker} ne khela aala darjey ka ${customShotText}! `;
    }

    let personalityPhrase = "";
    if (striker && !customShotText) {
        if (outcome === "SIX" || outcome === "FOUR") {
            if (strikerStyle === "Aggressive hitter") {
                personalityPhrase = ` Humne pehle hi bola tha ki ${striker} aaj bilkul attack mode mein hain, ball seedha boundary line paar hi milegi!`;
            } else if (strikerStyle === "Anchor") {
                personalityPhrase = ` ${striker} ki yeh solid and classical timing batati hai ki yeh captain material kyun hain! Super class!`;
            } else {
                personalityPhrase = ` Naye batsman ${striker} ne bilkul settle hone ka wait nahi kiya, aate hi dhaga khol diya bowler ka!`;
            }
        } else if (outcome === "WICKET") {
            personalityPhrase = ` ${striker} jaise set batsman ka is samay out hona poori batting unit ke liye bada setback hai! Shocked faces everywhere.`;
        } else if (outcome === "DOT") {
            if (strikerStyle === "Aggressive hitter") {
                personalityPhrase = ` ${bowler} ne ${striker} jaise heavy hitter ko dot balls daal ke baandh ke rakha hai, shabaash bowling!`;
            } else {
                personalityPhrase = ` ${striker} thoda pressure mein dikh rahe hain, unhe single rotation pe focus karna chahiye.`;
            }
        }
    }

    const ending = getRandomItem(ENDINGS);
    return `${shotPrefix}${commentaryBase}${personalityPhrase} ${ending}`;
}

// --- VOICE SYNTHESIS (TTS) SPEECH ENGINE ---
const speechSynth = window.speechSynthesis;
let hindiVoice = null;
let indianEngVoice = null;

function loadSpeechVoices() {
    if (!speechSynth) return;
    const voices = speechSynth.getVoices();
    hindiVoice = voices.find(v => v.lang.includes('hi-IN') || v.lang.includes('hi_IN'));
    indianEngVoice = voices.find(v => v.lang.includes('en-IN') || v.lang.includes('en_IN'));
}
if (speechSynth && speechSynth.onvoiceschanged !== undefined) {
    speechSynth.onvoiceschanged = loadSpeechVoices;
}
setTimeout(loadSpeechVoices, 800);


// --- CORE REACT APPLICATION COMPONENT ---
const { useState, useEffect, useRef } = React;

function App() {
    // Scoreboard states
    const [score, setScore] = useState(144);
    const [wickets, setWickets] = useState(4);
    const [overs, setOvers] = useState(19.0);
    const [ballsInOver, setBallsInOver] = useState(0);
    const [target, setTarget] = useState(163);
    const [scenario, setScenario] = useState("death");
    
    // Players states
    const [striker, setStriker] = useState("Virat Kohli");
    const [strikerStyle, setStrikerStyle] = useState("Anchor");
    const [bowler, setBowler] = useState("Jasprit Bumrah");
    
    // Systems toggles
    const [ttsEnabled, setTtsEnabled] = useState(true);
    const [sfxEnabled, setSfxEnabled] = useState(true);
    const [isSpeaking, setIsSpeaking] = useState(false);
    
    // Modes and Customizations
    const [playMode, setPlayMode] = useState("free"); // free, game, live
    const [commentaryStyle, setCommentaryStyle] = useState("filmy");
    const [speechRate, setSpeechRate] = useState(1.0);
    const [customPrompt, setCustomPrompt] = useState("");
    
    // Dynamic lists and details
    const [feedHistory, setFeedHistory] = useState([]);
    const [feedCount, setFeedCount] = useState(0);
    const [commentaryText, setCommentaryText] = useState("Namaste cricket fans! React CricAI commentary box and stadium lights are active. Bowl the first delivery to get rolling! 🏏✨");
    const [commentaryHighlight, setCommentaryHighlight] = useState("");
    const [crowdMeterFill, setCrowdMeterFill] = useState(60);
    const [crowdMeterStatus, setCrowdMeterStatus] = useState("Loud & Cheering");
    
    // Modals
    const [showJudgeModal, setShowJudgeModal] = useState(false);
    const [showVictoryModal, setShowVictoryModal] = useState(false);
    const [victoryData, setVictoryData] = useState({ title: "", message: "" });
    
    // Live match polling state
    const [liveMatches, setLiveMatches] = useState([]);
    const [selectedLiveMatch, setSelectedLiveMatch] = useState("demo");
    const [liveConnectionStatus, setLiveConnectionStatus] = useState("Connected. Awaiting events...");
    
    // AI Copilot Chat state hooks
    const [chatMessages, setChatMessages] = useState([
        { sender: "agent", text: "Namaste! Main hoon CricAI AI Agent Copilot. Type kijiye six, wicket, dhol, or players like Dhoni, and I will command the pitch!" }
    ]);
    const [isAgentTyping, setIsAgentTyping] = useState(false);
    
    // Cyber Wagon Wheel Shot Placement Trackers
    const [wagonWheel, setWagonWheel] = useState([]);
    const [showWagonWheel, setShowWagonWheel] = useState(true);
    
    // Mock MERN Stack MongoDB REST API Ledger Logs
    const [mernLogs, setMernLogs] = useState([
        { method: "GET", endpoint: "/api/innings/status", timestamp: new Date().toLocaleTimeString(), payload: "{}", response: "{ \"status\": 200, \"dbConnected\": true, \"cluster\": \"MongoDB Atlas\", \"latency\": \"14ms\" }" }
    ]);
    
    const logMernRequest = (method, endpoint, payload, response) => {
        const timestamp = new Date().toLocaleTimeString();
        setMernLogs(prev => [{
            method,
            endpoint,
            timestamp,
            payload: typeof payload === 'object' ? JSON.stringify(payload, null, 2) : payload,
            response: typeof response === 'object' ? JSON.stringify(response, null, 2) : response
        }, ...prev].slice(0, 7));
    };
    
    // Ref hooks for timers & speech tracking
    const livePollTimer = useRef(null);
    const liveDemoIndex = useRef(0);
    const lastScoreString = useRef("");
    const lastRuns = useRef(null);
    const lastWickets = useRef(null);
    const lastOvers = useRef(null);

    // Initial configuration on mount
    useEffect(() => {
        loadSpeechVoices();
        return () => {
            stopLiveMatchPolling();
        };
    }, []);

    // Win probabilities ratio calculator
    const getWinProbabilities = () => {
        if (score >= target) return { batting: 100, bowling: 0 };
        if (wickets >= 10) return { batting: 0, bowling: 100 };
        
        let batting = 50;
        const diff = target - score;
        
        if (scenario === "death" || scenario === "lastball") {
            const currentTotalBalls = (Math.floor(overs) * 6) + ballsInOver;
            const ballsRemaining = Math.max(1, 120 - currentTotalBalls);
            const reqRunRate = (diff / ballsRemaining) * 6;
            
            if (reqRunRate > 18) batting = 8;
            else if (reqRunRate > 13) batting = 22;
            else if (reqRunRate > 9) batting = 45;
            else batting = 78;
            
            batting -= (wickets * 4.5);
            batting = Math.max(4, Math.min(96, batting));
        } else {
            batting = 65 - (wickets * 6);
            batting = Math.max(10, Math.min(90, batting));
        }
        return { batting, bowling: 100 - batting };
    };

    const probabilities = getWinProbabilities();

    // 2D Visual ball animator helper
    const triggerVisualFieldAnimation = (outcome, callback) => {
        const ball = document.getElementById('field-ball');
        const spark = document.getElementById('bat-hit-spark');
        const trajectory = document.getElementById('ball-trajectory');
        const visualBowler = document.getElementById('visual-bowler');
        const visualStriker = document.getElementById('visual-striker');
        const fieldHint = document.getElementById('stadium-sub-status');
        
        if (!ball) {
            if (callback) callback();
            return;
        }
        
        // Reset Visual shapes
        ball.style.display = 'block';
        ball.style.left = '31%';
        ball.style.top = '50%';
        ball.style.transform = 'translate(-50%, -50%) scale(1)';
        
        spark.style.transform = 'translate(50%, -50%) scale(0)';
        trajectory.style.opacity = '0';
        
        fieldHint.innerText = `${bowler} is delivering the ball...`;
        fieldHint.className = 'field-hint text-yellow';
        
        // Delivery run
        visualBowler.classList.add('delivering');
        setTimeout(() => {
            visualBowler.classList.remove('delivering');
        }, 500);

        // Ball movement from Bowler to Batsman
        setTimeout(() => {
            ball.style.transition = 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            ball.style.left = '68%';
            
            // Swing swing
            setTimeout(() => {
                visualStriker.classList.add('swinging');
                setTimeout(() => {
                    visualStriker.classList.remove('swinging');
                }, 400);
            }, 250);
            
            // Hit collision
            setTimeout(() => {
                playSynthSound('bat', sfxEnabled);
                spark.style.transform = 'translate(50%, -50%) scale(1.6)';
                
                trajectory.style.left = '68%';
                trajectory.style.top = '50%';
                trajectory.style.opacity = '0.5';
                
                if (outcome === 'SIX') {
                    ball.style.transition = 'all 0.7s cubic-bezier(0.19, 1, 0.22, 1)';
                    ball.style.left = '88%';
                    ball.style.top = '15%'; // Wicket stands
                    ball.style.transform = 'translate(-50%, -50%) scale(2.2)';
                    
                    trajectory.style.width = '120px';
                    trajectory.style.transform = 'rotate(-45deg)';
                    fieldHint.innerText = 'IT\'S A GIGANTIC SIX! 🎉';
                    fieldHint.className = 'field-hint text-yellow text-pulse';
                    
                    setTimeout(() => {
                        playSynthSound('cheer', sfxEnabled);
                        playSynthSound('horn', sfxEnabled);
                        playSynthSound('dhol', sfxEnabled);
                    }, 150);
                } else if (outcome === 'FOUR') {
                    ball.style.transition = 'all 0.6s cubic-bezier(0.165, 0.84, 0.44, 1)';
                    ball.style.left = '92%';
                    ball.style.top = '78%'; // Covers bound
                    
                    trajectory.style.width = '140px';
                    trajectory.style.transform = 'rotate(35deg)';
                    fieldHint.innerText = 'STUNNING BOUNDARY FOUR! ⚡';
                    fieldHint.className = 'field-hint text-blue text-pulse';
                    
                    setTimeout(() => {
                        playSynthSound('cheer', sfxEnabled);
                        playSynthSound('dhol', sfxEnabled);
                    }, 150);
                } else if (outcome === 'WICKET') {
                    ball.style.transition = 'all 0.4s ease-out';
                    ball.style.left = '74%';
                    ball.style.top = '30%'; // broken stumps
                    
                    trajectory.style.width = '40px';
                    trajectory.style.transform = 'rotate(-85deg)';
                    fieldHint.innerText = 'OUT! BOWLED HIM! 💀';
                    fieldHint.className = 'field-hint text-red text-pulse';
                    
                    setTimeout(() => {
                        playSynthSound('aww', sfxEnabled);
                        playSynthSound('whistle', sfxEnabled);
                    }, 150);
                } else if (outcome === 'RUNS') {
                    ball.style.transition = 'all 0.5s ease-out';
                    ball.style.left = '80%';
                    ball.style.top = '58%'; // Field stop
                    
                    trajectory.style.width = '80px';
                    trajectory.style.transform = 'rotate(15deg)';
                    fieldHint.innerText = 'Quick running in active ground!';
                    fieldHint.className = 'field-hint text-green';
                    
                    setTimeout(() => {
                        playSynthSound('cheer', sfxEnabled);
                    }, 200);
                } else if (outcome === 'EXTRA') {
                    ball.style.transition = 'all 0.3s ease-out';
                    ball.style.left = '72%';
                    ball.style.top = '65%';
                    fieldHint.innerText = 'EXTRA RUN FOR BATTING TEAM!';
                    fieldHint.className = 'field-hint text-yellow';
                    
                    setTimeout(() => {
                        playSynthSound('whistle', sfxEnabled);
                    }, 100);
                } else {
                    ball.style.transition = 'all 0.25s ease-out';
                    ball.style.left = '70%';
                    fieldHint.innerText = 'Dot ball, solid block.';
                    fieldHint.className = 'field-hint text-green';
                }
                
                setTimeout(() => {
                    spark.style.transform = 'translate(50%, -50%) scale(0)';
                    trajectory.style.opacity = '0';
                    if (callback) callback();
                }, 750);
                
            }, 400);
        }, 50);
    };

    // Text to Speech executor
    const speakCommentaryText = (text, outcome) => {
        if (!ttsEnabled || !speechSynth) return;
        speechSynth.cancel();
        
        let spokenText = text.replace(/🎮|🏏|🏟️|✨|👏|🔥|📣|🔊|😬|💥|🤪|🕺|🎉|OMG/gi, '');
        spokenText = spokenText.replace(/CROWD GOES WILD/gi, 'Crowd goes wild');
        const utterance = new SpeechSynthesisUtterance(spokenText);
        
        let rateMult = speechRate;
        if (outcome === 'SIX' || outcome === 'WICKET') {
            utterance.pitch = 1.35;
            utterance.rate = rateMult * 1.15;
        } else if (outcome === 'FOUR') {
            utterance.pitch = 1.15;
            utterance.rate = rateMult * 1.05;
        } else {
            utterance.pitch = 1.0;
            utterance.rate = rateMult * 0.95;
        }
        
        if (hindiVoice) utterance.voice = hindiVoice;
        else if (indianEngVoice) utterance.voice = indianEngVoice;
        
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        
        speechSynth.speak(utterance);
    };

    // Update state scorecard & check end game
    const handleScoreboardUpdate = (outcome, customRuns = 0, isExtra = false) => {
        let runsAdded = 0;
        let isBall = true;
        
        if (outcome === "SIX") runsAdded = 6;
        else if (outcome === "FOUR") runsAdded = 4;
        else if (outcome === "RUNS") runsAdded = customRuns > 0 ? customRuns : Math.floor(Math.random() * 3) + 1;
        else if (outcome === "WICKET") {
            setWickets(prev => {
                const updated = prev + 1;
                checkVictoryCondition(score, updated, overs);
                return updated;
            });
            isBall = true;
        } else if (outcome === "EXTRA") {
            runsAdded = 1;
            isBall = false;
        }
        
        let nextScore = score + runsAdded;
        setScore(nextScore);
        
        let nextOvers = overs;
        if (isBall) {
            let nextBalls = ballsInOver + 1;
            if (nextBalls >= 6) {
                nextOvers = parseFloat((overs + 1.0).toFixed(0));
                setOvers(nextOvers);
                setBallsInOver(0);
            } else {
                nextOvers = parseFloat((Math.floor(overs) + nextBalls / 10).toFixed(1));
                setOvers(nextOvers);
                setBallsInOver(nextBalls);
            }
        }
        
        // Calculate Wagon Wheel shot geometries
        let shotAngle = 0;
        let shotLength = 0;
        if (outcome === "SIX") {
            shotAngle = -45 + Math.random() * 90; // Leg/off boundaries
            shotLength = 110 + Math.random() * 25;
        } else if (outcome === "FOUR") {
            shotAngle = -75 + Math.random() * 150;
            shotLength = 85 + Math.random() * 15;
        } else if (outcome === "RUNS") {
            shotAngle = -90 + Math.random() * 180;
            shotLength = 40 + Math.random() * 35;
        } else if (outcome === "WICKET" || outcome === "DOT") {
            shotAngle = -10 + Math.random() * 20; // Straight to fielders
            shotLength = 15 + Math.random() * 25;
        }
        
        if (shotLength > 0) {
            setWagonWheel(prev => [...prev, { outcome, angle: shotAngle, length: shotLength, runs: runsAdded }]);
        }
        
        // Log MERN mock HTTP transaction to active dashboard console
        logMernRequest("POST", "/api/innings/ball-log", {
            matchScenario: scenario,
            ballNumber: `${Math.floor(nextOvers)}.${ballsInOver}`,
            striker,
            bowler,
            ballOutcome: outcome,
            runsAdded,
            isExtra
        }, {
            status: 201,
            ok: true,
            dbStatus: "MongoDB Atlas synchronized",
            recordId: "rec_" + Math.random().toString(36).substring(3, 11)
        });
        
        checkVictoryCondition(nextScore, wickets, nextOvers);
    };

    const checkVictoryCondition = (cRuns, cWickets, cOvers) => {
        let title = "";
        let msg = "";
        let ended = false;
        
        if (cRuns >= target) {
            title = `${striker} Finished Off In Style! 🏆`;
            msg = `"Yeh shot toh kamaal tha dosto! Aakhri over ka pressure khatam, batting team ne cup utha liya! pure stadium mein dhol-nagada baj raha hai!"`;
            ended = true;
        } else if (cWickets >= 10) {
            title = `${bowler} Wins the Championship! 👑`;
            msg = `"Danda hi ukhad diya bowler ne! All out ho gayi batting team, kya clutch bowling perform ki hai bowler ne! Bowling team is CHAMPION!"`;
            ended = true;
        } else if (scenario === "death" || scenario === "lastball") {
            const currentTotalBalls = (Math.floor(cOvers) * 6) + (cOvers % 1 * 10);
            if (currentTotalBalls >= 120 && cRuns < target) {
                title = `${bowler} Defends the Title! 🌟`;
                msg = `"Khatam, tata, bye-bye! Overs khatam ho gaye dosto par target poora nahi ho paaya! Bowler ne saans rok kar target defend kar liya!"`;
                ended = true;
            }
        }
        
        if (ended) {
            setVictoryData({ title, message: msg });
            setTimeout(() => {
                setShowVictoryModal(true);
                playSynthSound('horn', sfxEnabled);
                setTimeout(() => {
                    playSynthSound('cheer', sfxEnabled);
                    playSynthSound('dhol', sfxEnabled);
                }, 400);
            }, 1200);
        }
    };

    // Mode-specific Play Dispatcher
    const handleBowlBall = (outcome) => {
        if (score >= target || wickets >= 10) {
            triggerToast("Match completed! Reset scoreboard to play another over.");
            return;
        }
        
        triggerVisualFieldAnimation(outcome, () => {
            const com = compileHinglishCommentary(outcome, commentaryStyle, scenario, striker, strikerStyle, bowler);
            setCommentaryText(com);
            
            // Set Highlight classes
            if (outcome === 'SIX') setCommentaryHighlight("highlight-six");
            else if (outcome === 'FOUR') setCommentaryHighlight("highlight-four");
            else if (outcome === 'WICKET') setCommentaryHighlight("highlight-wicket");
            else setCommentaryHighlight("");
            
            speakCommentaryText(com, outcome);
            handleScoreboardUpdate(outcome);
            addToFeedTimeline(outcome, com);
            adjustCrowdMeter(outcome);
        });
    };

    // Batting Challenge shot choices
    const handlePlayBattingShot = (shotType) => {
        if (score >= target || wickets >= 10) {
            triggerToast("Match completed! Reset scoreboard to play another over.");
            return;
        }
        
        // Procedural outcome calculator
        let roll = Math.random() * 100;
        let outcome = "DOT";
        let shotText = "";
        
        if (shotType === "helicopter") {
            shotText = "mighty Helicopter Shot";
            let sixThreshold = striker === "MS Dhoni" ? 65 : 40;
            let wicketThreshold = striker === "MS Dhoni" ? 10 : 20;
            if (bowler === "Jasprit Bumrah") {
                sixThreshold -= 15;
                wicketThreshold += 15;
            }
            if (roll < sixThreshold) outcome = "SIX";
            else if (roll < sixThreshold + 15) outcome = "FOUR";
            else if (roll < sixThreshold + 15 + wicketThreshold) outcome = "WICKET";
            else if (roll < sixThreshold + 15 + wicketThreshold + 15) outcome = "RUNS";
        } else if (shotType === "coverdrive") {
            shotText = "stunning Cover Drive";
            let fourThreshold = striker === "Virat Kohli" ? 60 : 35;
            let wicketThreshold = striker === "Virat Kohli" ? 5 : 10;
            if (roll < fourThreshold) outcome = "FOUR";
            else if (roll < fourThreshold + 30) outcome = "RUNS";
            else if (roll < fourThreshold + 30 + wicketThreshold) outcome = "WICKET";
            else if (roll < fourThreshold + 30 + wicketThreshold + 5) outcome = "SIX";
        } else if (shotType === "nudge") {
            shotText = "smart Nudge & Run";
            if (roll < 70) outcome = "RUNS";
            else if (roll < 92) outcome = "DOT";
            else outcome = "WICKET";
        } else {
            shotText = "tactical Leave";
            outcome = roll < 18 ? "EXTRA" : "DOT";
        }
        
        triggerVisualFieldAnimation(outcome, () => {
            const com = compileHinglishCommentary(outcome, commentaryStyle, scenario, striker, strikerStyle, bowler, shotText);
            setCommentaryText(com);
            
            if (outcome === 'SIX') setCommentaryHighlight("highlight-six");
            else if (outcome === 'FOUR') setCommentaryHighlight("highlight-four");
            else if (outcome === 'WICKET') setCommentaryHighlight("highlight-wicket");
            else setCommentaryHighlight("");
            
            speakCommentaryText(com, outcome);
            handleScoreboardUpdate(outcome);
            addToFeedTimeline(outcome, com);
            adjustCrowdMeter(outcome);
        });
    };

    // Feed Timeline Updater
    const addToFeedTimeline = (outcome, text) => {
        setFeedCount(prev => prev + 1);
        const item = {
            outcome,
            text,
            ballNo: (Math.floor(overs) + ballsInOver / 10).toFixed(1),
            batsman: striker,
            bowler: bowler
        };
        setFeedHistory(prev => [item, ...prev]);
    };

    const adjustCrowdMeter = (outcome) => {
        let level = 60;
        let status = "Loud & Cheering";
        
        if (outcome === 'SIX') {
            level = 99;
            status = "DEAFENING ROAR! 🎉🏟️";
        } else if (outcome === 'FOUR') {
            level = 88;
            status = "Crowd is Dancing! 🥳🔥";
        } else if (outcome === 'WICKET') {
            level = 28;
            status = "Stunned silence... 😲🤫";
        } else if (outcome === 'EXTRA') {
            level = 78;
            status = "Booing the bowler! 😤⚠️";
        } else if (outcome === 'DOT') {
            level = 48;
            status = "High anxiety tension 😬";
        }
        
        setCrowdMeterFill(level);
        setCrowdMeterStatus(status);
    };

    // AI Copilot Chat Executor Methods
    const handleSendChatMessage = (text) => {
        if (!text.trim()) return;
        
        // Add User message
        const userMsg = { sender: "user", text };
        setChatMessages(prev => [...prev, userMsg]);
        setCustomPrompt("");
        
        // Set typing indicator
        setIsAgentTyping(true);
        
        // Auto scroll messages list
        setTimeout(() => {
            const listEl = document.getElementById('chat-msg-list');
            if (listEl) listEl.scrollTop = listEl.scrollHeight;
        }, 60);
        
        // Dynamic NLP Agent Parsing Delay
        setTimeout(() => {
            const { reply, actionTriggered } = parseAgentIntent(text);
            
            setIsAgentTyping(false);
            setChatMessages(prev => [...prev, { sender: "agent", text: reply }]);
            
            // Synthesize agent whistle alert
            playSynthSound('whistle', sfxEnabled);
            
            setTimeout(() => {
                const listEl = document.getElementById('chat-msg-list');
                if (listEl) listEl.scrollTop = listEl.scrollHeight;
            }, 60);
        }, 1100);
    };

    // Fuzzy token scorer — counts how many alias tokens match
    const nlpScore = (text, tokens) => tokens.filter(t => text.includes(t)).length;

    const parseAgentIntent = (userText) => {
        const text = userText.toLowerCase().trim();
        let reply = "";
        let actionTriggered = false;

        // Player detection with Hinglish aliases
        const isDhoni  = nlpScore(text, ["dhoni","mahi","ms dhoni","msd","captain cool","thala"]) > 0;
        const isKohli  = nlpScore(text, ["kohli","virat","king kohli","vk","king"]) > 0;
        const isBumrah = nlpScore(text, ["bumrah","jasprit","jassi","malinga"]) > 0;
        const isSachin = nlpScore(text, ["sachin","tendulkar","master blaster","god of cricket"]) > 0;
        const isRohit  = nlpScore(text, ["rohit","hitman","ro hit","rohit sharma"]) > 0;

        // Outcome detection with Hinglish aliases
        const isSix    = nlpScore(text, ["six","sixer","chakka","chhakka","6","helicopter","maximum","boundary six"]) > 0;
        const isFour   = nlpScore(text, ["four","chauka","4","drive","cut shot","pull","boundary"]) > 0;
        const isWicket = nlpScore(text, ["wicket","out","bold","bowled","caught","lbw","dismiss","stumped","stump"]) > 0;
        const isDhol   = nlpScore(text, ["dhol","drum","punjabi","balle","beat","dholak","tabla"]) > 0;
        const isTrump  = nlpScore(text, ["trumpet","horn","ipl music","ipl sound","bugle","fanfare"]) > 0;
        const isCheer  = nlpScore(text, ["cheer","crowd","roar","stadium","shor","applause"]) > 0;
        const isStats  = nlpScore(text, ["probability","win","chance","analys","predict","odds","kya lagta","kitna"]) > 0;
        const isReset  = nlpScore(text, ["reset","restart","new match","start over","shuru se","naya match"]) > 0;
        const isDot    = nlpScore(text, ["dot","maiden","dot ball","no run","tight","defend"]) > 0;
        const isExtra  = nlpScore(text, ["wide","no ball","extra","noball","wides"]) > 0;

        if (isDhoni && isSix) {
            setStriker("MS Dhoni"); setStrikerStyle("Aggressive hitter");
            reply = "Mahi bhai ka order mila hai! 🚁 Helicopter shot connect kiya — ball orbit mein bhej di! Visual stadium BLAST active dosto!";
            setTimeout(() => handleBowlBall("SIX"), 800); actionTriggered = true;
        } else if (isSachin && isSix) {
            setStriker("Sachin Tendulkar"); setStrikerStyle("Anchor");
            reply = "God of Cricket on pitch! 🙏 Master Blaster ne straight six maar diya — stadium mein goosebumps chal rahe hain!";
            setTimeout(() => handleBowlBall("SIX"), 800); actionTriggered = true;
        } else if (isRohit && isSix) {
            setStriker("Rohit Sharma"); setStrikerStyle("Aggressive hitter");
            reply = "HITMAN UNLEASHED! 💥 Rohit ne pull shot se seedha bleachers mein bhej di ball — Wankhede is on FIRE!";
            setTimeout(() => handleBowlBall("SIX"), 800); actionTriggered = true;
        } else if (isKohli && isSix) {
            setStriker("Virat Kohli"); setStrikerStyle("Anchor");
            reply = "King Kohli ne straight drive nahi — CHAKKA MAAR DIYA! 👑 Unbelievable six, King is on the throne!";
            setTimeout(() => handleBowlBall("SIX"), 800); actionTriggered = true;
        } else if (isDhoni && isFour) {
            setStriker("MS Dhoni"); setStrikerStyle("Anchor");
            reply = "Cool Dhoni ne precision timing se cover boundary — chaar runs, Captain Cool class! 🧊🏏";
            setTimeout(() => handleBowlBall("FOUR"), 800); actionTriggered = true;
        } else if (isKohli && isFour) {
            setStriker("Virat Kohli"); setStrikerStyle("Anchor");
            reply = "King Kohli on visual pitch! 👑 Stunning cover drive four through the gaps — pure class, pure elegance!";
            setTimeout(() => handleBowlBall("FOUR"), 800); actionTriggered = true;
        } else if (isBumrah && isWicket) {
            setBowler("Jasprit Bumrah");
            reply = "BUMRAH IN! 💀 Lethal toe-crushing yorker absolutely rattles the stumps! Zero room, zero mercy — BOWLED HIM!";
            setTimeout(() => handleBowlBall("WICKET"), 800); actionTriggered = true;
        } else if (isDhoni && isWicket) {
            setStriker("MS Dhoni");
            reply = "Dhoni stumped out!? 😲 Nahi yaar — yeh toh bilkul unexpected tha! Stadium shocked silence hai!";
            setTimeout(() => handleBowlBall("WICKET"), 800); actionTriggered = true;
        } else if (isDhol) {
            reply = "Balle Balle! 🥁 Desi Dhol Punjabi beats chalu ho gaye — Hype ek sau paanch percent!";
            playSynthSound("dhol", sfxEnabled); actionTriggered = true;
        } else if (isTrump) {
            reply = "IPL stadium trumpet sequence playing on air! 📣🏟️ Goosebumps guaranteed dosto!";
            playSynthSound("horn", sfxEnabled); actionTriggered = true;
        } else if (isCheer) {
            reply = "Crowd roar unleashed! 🏟️ Stadium mein 50,000 log ek saath cheering kar rahe hain!";
            playSynthSound("cheer", sfxEnabled); actionTriggered = true;
        } else if (isStats) {
            const probs = getWinProbabilities();
            const runNeeded = target - score;
            const ballsLeft = Math.max(1, 120 - (Math.floor(overs) * 6 + ballsInOver));
            const rrr = ((runNeeded / ballsLeft) * 6).toFixed(2);
            reply = `📊 CricAI Analytics:\n• Batting win prob: ${probs.batting.toFixed(0)}%\n• Score: ${score}/${wickets} | Target: ${target}\n• Need: ${runNeeded} runs in ${ballsLeft} balls\n• Required RR: ${rrr} per over`;
            actionTriggered = true;
        } else if (isReset) {
            reply = "Nayi inning shuru! 🏏 Scoreboard reset, naya match loading — khelo dosto, khelo!";
            setTimeout(() => handleResetAll(), 500); actionTriggered = true;
        } else if (isSix) {
            reply = "Boom! 💥 Massive sixer over deep mid-wicket — crowd goes absolutely wild!";
            setTimeout(() => handleBowlBall("SIX"), 800); actionTriggered = true;
        } else if (isFour) {
            reply = "Beautifully timed cover boundary! 🔵 Bullet chauka — fielder had no chance!";
            setTimeout(() => handleBowlBall("FOUR"), 800); actionTriggered = true;
        } else if (isWicket) {
            reply = "Clean bowled! 💀 Stump ukhad ke rakh diya — celebratory whistle active!";
            setTimeout(() => handleBowlBall("WICKET"), 800); actionTriggered = true;
        } else if (isDot) {
            reply = "Dot ball! 🎯 Bowler ne poora room band kar diya — tight line and length!";
            setTimeout(() => handleBowlBall("DOT"), 800); actionTriggered = true;
        } else if (isExtra) {
            reply = "Arey! Wide ball! 😤 Umpire ne dono haath failaye — free run batting team ko!";
            setTimeout(() => handleBowlBall("EXTRA"), 800); actionTriggered = true;
        } else if (text.includes("sarcast")) {
            setCommentaryStyle("sarcastic"); reply = "😏 Sarcastic Desi fun commentary active!";
        } else if (text.includes("filmy")) {
            setCommentaryStyle("filmy"); reply = "🎬 Bollywood Filmy drama commentary active!";
        } else if (text.includes("aggress") || text.includes("aggressive")) {
            setCommentaryStyle("aggressive"); reply = "⚡ Aggressive High-Voltage commentary active!";
        } else {
            reply = "🤖 CricAI Copilot ready! Try:\n• six / chhakka / 6\n• four / chauka / boundary\n• wicket / bold / out\n• dhol / drum / balle\n• Dhoni six / Kohli drive / Bumrah wicket\n• Sachin six / Rohit hitman six\n• win probability / analytics\n• reset / naya match";
        }
        
        return { reply, actionTriggered };
    };

    const handleQuickPromptClick = (type) => {
        let val = "";
        if (type === "dhoni") val = "MS Dhoni six";
        else if (type === "kohli") val = "Virat Kohli cover drive four";
        else val = "Jasprit Bumrah yorker wicket";
        
        handleSendChatMessage(val);
    };

    // Scenario setups loader
    const handleLoadScenario = (sc) => {
        setScenario(sc);
        let runs = 144;
        let wkts = 4;
        let ov = 19.0;
        let tg = 163;
        
        if (sc === "powerplay") {
            runs = 12;
            tg = 180;
            ov = 1.0;
        } else if (sc === "middle") {
            runs = 76;
            tg = 150;
            ov = 9.0;
        } else if (sc === "lastball") {
            runs = 157;
            tg = 163;
            ov = 19.5;
        }
        
        setScore(runs);
        setWickets(wkts);
        setOvers(ov);
        setBallsInOver(0);
        setTarget(tg);
        
        setCommentaryText(`React CricAI Arena setup configured for ${sc} overs! Bowl a delivery to broadcast live.`);
        setCommentaryHighlight("");
    };

    // Live XML Scoreboard Polling Controllers
    const startLiveMatchPolling = () => {
        stopLiveMatchPolling();
        lastScoreString.current = "";
        lastRuns.current = null;
        lastWickets.current = null;
        lastOvers.current = null;
        liveDemoIndex.current = 0;
        
        setLiveConnectionStatus("Live Broadcaster link active. Listening for match events...");
        
        livePollTimer.current = setInterval(() => {
            pollLiveMatchesData();
        }, 9000);
    };

    const stopLiveMatchPolling = () => {
        if (livePollTimer.current) {
            clearInterval(livePollTimer.current);
            livePollTimer.current = null;
        }
    };

    const pollLiveMatchesData = async () => {
        // 1. Demo Broadcaster Feed
        if (selectedLiveMatch === "demo") {
            if (liveDemoIndex.current >= DEMO_LIVE_TIMELINE.length) {
                setLiveConnectionStatus("Demo match completed! Restarting Simulated Broadcaster...");
                liveDemoIndex.current = 0;
                return;
            }
            const curr = DEMO_LIVE_TIMELINE[liveDemoIndex.current];
            liveDemoIndex.current++;
            
            executeLivePolledBall(curr.outcome, curr.score, curr.wickets, curr.overs, `Simulated Live Feed: ${curr.desc}`);
            return;
        }
        
        // 2. Real Cricinfo Feed
        try {
            const proxy = "https://corsproxy.io/?url=https://www.espncricinfo.com/rss/livescores.xml";
            const response = await fetch(proxy);
            if (!response.ok) return;
            const xmlText = await response.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, "text/xml");
            const items = xmlDoc.querySelectorAll('item');
            
            let foundTitle = null;
            items.forEach((item) => {
                const guid = item.querySelector('guid') ? item.querySelector('guid').textContent : '';
                if (guid === selectedLiveMatch) {
                    foundTitle = item.querySelector('title').textContent;
                }
            });
            
            if (!foundTitle) {
                setLiveConnectionStatus("Selected match went offline or completed.");
                return;
            }
            
            if (foundTitle === lastScoreString.current) {
                setLiveConnectionStatus("Polling live feed... awaiting next ball delivery.");
                return;
            }
            
            lastScoreString.current = foundTitle;
            setLiveConnectionStatus("Live Scoreboard Updated! Broadcaster evaluating details...");
            
            const parsed = parseESPNLiveTitle(foundTitle);
            if (!parsed) return;
            
            if (lastRuns.current === null) {
                // Baseline setting
                lastRuns.current = parsed.runs;
                lastWickets.current = parsed.wickets;
                lastOvers.current = parsed.overs;
                
                setScore(parsed.runs);
                setWickets(parsed.wickets);
                setOvers(parsed.overs);
                triggerToast(`Connected live tracking to ${parsed.team}!`);
                return;
            }
            
            // Calculate differentials
            let outcome = "DOT";
            const runsDiff = parsed.runs - lastRuns.current;
            const wicketDiff = parsed.wickets - lastWickets.current;
            const oversDiff = parsed.overs - lastOvers.current;
            
            if (wicketDiff > 0) outcome = "WICKET";
            else if (runsDiff === 6) outcome = "SIX";
            else if (runsDiff === 4) outcome = "FOUR";
            else if (runsDiff > 0 && runsDiff <= 3) outcome = "RUNS";
            else if (runsDiff === 1 && oversDiff === 0) outcome = "EXTRA";
            else if (runsDiff === 0 && oversDiff > 0) outcome = "DOT";
            
            lastRuns.current = parsed.runs;
            lastWickets.current = parsed.wickets;
            lastOvers.current = parsed.overs;
            
            executeLivePolledBall(outcome, parsed.runs, parsed.wickets, parsed.overs, `Real match update for ${parsed.team}`);
            
        } catch (e) {
            console.error("XML poll error:", e);
        }
    };

    const executeLivePolledBall = (outcome, curRuns, curWickets, curOvers, desc) => {
        setScore(curRuns);
        setWickets(curWickets);
        setOvers(curOvers);
        setBallsInOver(Math.round((curOvers % 1) * 10));
        
        triggerVisualFieldAnimation(outcome, () => {
            const com = compileHinglishCommentary(outcome, commentaryStyle, scenario, striker, strikerStyle, bowler);
            const liveCom = `Stadium Broadcast update! ${desc}. CricAI live says - ${com}`;
            
            setCommentaryText(liveCom);
            speakCommentaryText(liveCom, outcome);
            
            if (outcome === 'SIX') setCommentaryHighlight("highlight-six");
            else if (outcome === 'FOUR') setCommentaryHighlight("highlight-four");
            else if (outcome === 'WICKET') setCommentaryHighlight("highlight-wicket");
            else setCommentaryHighlight("");
            
            addToFeedTimeline(outcome, liveCom);
            adjustCrowdMeter(outcome);
        });
    };

    const triggerFetchLiveMatches = async () => {
        setLiveConnectionStatus("Fetching active live matches from Cricinfo...");
        try {
            const proxy = "https://corsproxy.io/?url=https://www.espncricinfo.com/rss/livescores.xml";
            const response = await fetch(proxy);
            if (!response.ok) throw new Error("CORS Proxy error");
            const xmlText = await response.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, "text/xml");
            const items = xmlDoc.querySelectorAll('item');
            
            const list = [];
            items.forEach((item, index) => {
                const title = item.querySelector('title').textContent;
                const guid = item.querySelector('guid') ? item.querySelector('guid').textContent : `match-${index}`;
                list.push({ title, guid });
            });
            
            setLiveMatches(list);
            if (list.length === 0) {
                setLiveConnectionStatus("No active matches. Running Simulated Live Broadcaster!");
            } else {
                setLiveConnectionStatus(`Connected. Loaded ${list.length} live matches.`);
            }
        } catch (e) {
            console.warn(e);
            setLiveConnectionStatus("Server busy. Simulated Live Broadcaster active!");
        }
    };

    // Mode toggler triggers
    const handleSwitchMode = (mode) => {
        setPlayMode(mode);
        stopLiveMatchPolling();
        
        if (mode === "live") {
            triggerFetchLiveMatches();
            setSelectedLiveMatch("demo");
            
            // Timeout to give state time to register demo
            setTimeout(() => {
                startLiveMatchPolling();
            }, 300);
        }
        triggerToast(`Mode switched to: ${mode === 'free' ? 'Free Play' : mode === 'game' ? 'Batting Game' : 'Live Broadcast'}`);
    };

    const handleSelectMatchChange = (e) => {
        const val = e.target.value;
        setSelectedLiveMatch(val);
        
        // Restart polling with new values
        setTimeout(() => {
            startLiveMatchPolling();
        }, 100);
    };

    // Utility Toasts
    const triggerToast = (msg) => {
        const toast = document.getElementById('voice-toast');
        if (toast) {
            document.getElementById('toast-text').innerText = msg;
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 3200);
        }
    };

    const handleResetAll = () => {
        handleLoadScenario(scenario);
        setFeedHistory([]);
        setFeedCount(0);
        triggerToast("Match scoreboard reset!");
    };

    return (
        <div className="app-container">
            {/* Header */}
            <header className="app-header">
                <div className="logo-area">
                    <span className="live-tag">REACT HACKATHON PRO</span>
                    <h1>Cric<span>AI Pro</span></h1>
                    <p className="tagline">Desi Dil, Electric Commentary & React Component State! 🏏⚡</p>
                </div>
                <div className="header-controls">
                    <button className={`control-btn ${ttsEnabled ? 'active' : ''}`} onClick={() => setTtsEnabled(!ttsEnabled)}>
                        <i className={ttsEnabled ? "fas fa-volume-up" : "fas fa-volume-mute"}></i>
                        <span>Voice: {ttsEnabled ? 'ON' : 'OFF'}</span>
                    </button>
                    <button className={`control-btn ${sfxEnabled ? 'active' : ''}`} onClick={() => setSfxEnabled(!sfxEnabled)}>
                        <i className="fas fa-music"></i>
                        <span>SFX: {sfxEnabled ? 'ON' : 'OFF'}</span>
                    </button>
                    <button className="control-btn highlight-gold" onClick={() => setShowJudgeModal(true)}>
                        <i className="fas fa-award"></i>
                        <span>Judge's Spec</span>
                    </button>
                </div>
            </header>

            {/* Problem Statement Hero Banner */}
            <div className="problem-banner">
                <div className="problem-banner-icon">
                    <i className="fas fa-satellite-dish"></i>
                </div>
                <div className="problem-banner-text">
                    <span className="problem-label">💡 THE PROBLEM WE SOLVE</span>
                    <p>Millions of cricket fans across rural India miss IPL commentary — language barriers, no Star Sports subscriptions, low bandwidth. <strong>CricAI delivers real-time Hinglish commentary on-device with zero audio assets, zero API keys, and zero internet dependency.</strong></p>
                </div>
                <div className="problem-banner-stats">
                    <div className="pb-stat"><span>0 KB</span><small>Audio Files</small></div>
                    <div className="pb-stat"><span>0</span><small>API Keys</small></div>
                    <div className="pb-stat"><span>∞</span><small>Commentary Lines</small></div>
                    <div className="pb-stat"><span>6</span><small>Tech Pillars</small></div>
                </div>
            </div>

            {/* Main Arena Workspace */}
            <main className="arena-grid">
                {/* Left Panel */}
                <section className="left-panel">
                    
                    {/* Scoreboard Card */}
                    <div className="card scoreboard-card">
                        <div className="card-header">
                            <h2><i className="fas fa-chart-line"></i> LIVE ARENA SCOREBOARD</h2>
                            <span className="match-stage" id="match-stage-indicator">{scenario === 'death' ? 'Death Overs' : scenario === 'powerplay' ? 'Powerplay' : scenario === 'lastball' ? 'Last Ball Climax' : 'Middle Overs'}</span>
                        </div>
                        <div className="scoreboard-grid">
                            <div className="score-display">
                                <span className="score-label">RUNS/WKTS</span>
                                <span className="digital-number" id="digital-score">{score}/{wickets}</span>
                            </div>
                            <div className="overs-display">
                                <span className="score-label">OVERS</span>
                                <span className="digital-number" id="digital-overs">{overs.toFixed(1)}</span>
                            </div>
                            <div className="target-display">
                                <span className="score-label">TARGET</span>
                                <span className="digital-number text-yellow" id="digital-target">{target}</span>
                            </div>
                            <div className="need-display">
                                <span className="score-label">REQUIRED</span>
                                <span className="digital-msg text-pulse" id="digital-need">
                                    {score >= target ? 'Batting team WON! 🏆' : wickets >= 10 ? 'All Out! 👑' : `${target - score} runs needed`}
                                </span>
                            </div>
                        </div>
                        <div className="progress-bar-container">
                            <div className="progress-bar-label">
                                <span id="win-probability-text">Win Probability: Batting {probabilities.batting.toFixed(0)}% | Bowling {probabilities.bowling.toFixed(0)}%</span>
                            </div>
                            <div className="probability-track">
                                <div className="prob-team-a" style={{ width: `${probabilities.batting}%` }}></div>
                                <div className="prob-team-b" style={{ width: `${probabilities.bowling}%` }}></div>
                            </div>
                        </div>
                    </div>

                    {/* Setup Controls Card */}
                    <div className="card setup-card">
                        <div className="card-header">
                            <h2><i className="fas fa-gamepad"></i> MATCH SETUP & MODE</h2>
                            <div className="mode-toggles">
                                <button className={`mode-btn ${playMode === 'free' ? 'active' : ''}`} onClick={() => handleSwitchMode('free')}>Free Play</button>
                                <button className={`mode-btn ${playMode === 'game' ? 'active' : ''}`} onClick={() => handleSwitchMode('game')}>Interactive Game</button>
                                <button className={`mode-btn ${playMode === 'live' ? 'active' : ''}`} onClick={() => handleSwitchMode('live')}>Live Match Feed</button>
                            </div>
                        </div>
                        <div className="setup-form">
                            <div className="form-row">
                                <div className="input-group">
                                    <label>Striker</label>
                                    <select value={striker} onChange={(e) => {
                                        setStriker(e.target.value);
                                        setStrikerStyle(e.target.options[e.target.selectedIndex].dataset.style);
                                    }}>
                                        <option value="MS Dhoni" data-style="Aggressive hitter">MS Dhoni (The Finisher)</option>
                                        <option value="Virat Kohli" data-style="Anchor">Virat Kohli (Run Machine)</option>
                                        <option value="Hardik Pandya" data-style="Aggressive hitter">Hardik Pandya (Hitter)</option>
                                        <option value="Rinku Singh" data-style="Aggressive hitter">Rinku Singh (Clutch Finisher)</option>
                                        <option value="Yashasvi Jaiswal" data-style="New batsman">Yashasvi Jaiswal (Young Gun)</option>
                                        <option value="Shubman Gill" data-style="Anchor">Shubman Gill (Prince of Timing)</option>
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label>Bowler</label>
                                    <select value={bowler} onChange={(e) => setBowler(e.target.value)}>
                                        <option value="Jasprit Bumrah">Jasprit Bumrah (Yorker Master)</option>
                                        <option value="Lasith Malinga">Lasith Malinga (Slingy Legend)</option>
                                        <option value="Rashid Khan">Rashid Khan (Spin Wizard)</option>
                                        <option value="Mitchell Starc">Mitchell Starc (Express Pace)</option>
                                        <option value="Yuzvendra Chahal">Yuzvendra Chahal (Chahal TV)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="input-group">
                                    <label>Championship Scenarios</label>
                                    <div className="scenario-chips">
                                        <button className={`chip ${scenario === 'death' ? 'active' : ''}`} onClick={() => handleLoadScenario('death')}>
                                            <i className="fas fa-skull"></i> 20th Over (19 runs needed)
                                        </button>
                                        <button className={`chip ${scenario === 'powerplay' ? 'active' : ''}`} onClick={() => handleLoadScenario('powerplay')}>
                                            <i className="fas fa-bolt"></i> Powerplay Attack (1.2 overs)
                                        </button>
                                        <button className={`chip ${scenario === 'middle' ? 'active' : ''}`} onClick={() => handleLoadScenario('middle')}>
                                            <i className="fas fa-chess-knight"></i> Middle Overs Build-up
                                        </button>
                                        <button className={`chip ${scenario === 'lastball' ? 'active' : ''}`} onClick={() => handleLoadScenario('lastball')}>
                                            <i className="fas fa-film"></i> Last Ball Drama (6 runs needed)
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Animated Field Card */}
                    <div className="card field-card">
                        <div className="card-header">
                            <h2><i className="fas fa-compass"></i> STADIUM LIVE FIELD</h2>
                            <span id="stadium-sub-status" className="field-hint text-green">Bowler is warming up at run-up...</span>
                        </div>
                        <div className="stadium-field-outer">
                            <div className="cricket-field" id="cricket-field">
                                <div className="inner-circle-line"></div>
                                <div className="turf-pitch">
                                    <div className="crease bowler-crease"></div>
                                    <div className="crease batsman-crease"></div>
                                    <div className="wicket-stumps stumps-bowler"></div>
                                    <div className="wicket-stumps stumps-batsman"></div>
                                </div>
                                <div className="field-ball" id="field-ball"></div>
                                <div className="bat-hit-spark" id="bat-hit-spark"></div>
                                <div className="ball-trajectory" id="ball-trajectory"></div>
                                
                                {/* Dynamic Hackathon Wagon Wheel Trajectories */}
                                {showWagonWheel && wagonWheel.map((shot, idx) => {
                                    const colorMap = {
                                        SIX: 'var(--neon-yellow)',
                                        FOUR: 'var(--neon-blue)',
                                        WICKET: 'var(--neon-red)',
                                        RUNS: 'var(--neon-green)',
                                        DOT: '#64748b'
                                    };
                                    const color = colorMap[shot.outcome] || '#cbd5e1';
                                    return (
                                        <div 
                                            key={idx}
                                            className="wagon-wheel-line"
                                            style={{
                                                position: 'absolute',
                                                left: '68%',
                                                top: '50%',
                                                width: `${shot.length}px`,
                                                height: '2px',
                                                background: `linear-gradient(90deg, transparent, ${color})`,
                                                boxShadow: `0 0 6px ${color}`,
                                                transform: `rotate(${shot.angle}deg)`,
                                                transformOrigin: 'left center',
                                                opacity: 0.85,
                                                zIndex: 3
                                            }}
                                        />
                                    );
                                })}
                                
                                <div className="fielder f-covers" data-name="Covers Fielder">🛡️</div>
                                <div className="fielder f-midwicket" data-name="Deep Mid-Wicket">🛡️</div>
                                <div className="fielder f-longon" data-name="Long On">🛡️</div>
                                
                                <div className="fielder-striker" id="visual-striker" title="Striker">🏏</div>
                                <div className="fielder-bowler" id="visual-bowler" title="Bowler">⚾</div>
                            </div>
                        </div>
                        
                        {/* Wagon Wheel Toggle Bar */}
                        <div className="wagon-wheel-toggle-bar">
                            <button className={`control-btn ${showWagonWheel ? 'active' : ''}`} onClick={() => setShowWagonWheel(!showWagonWheel)}>
                                <i className="fas fa-bullseye"></i> Wagon Wheel Map: {showWagonWheel ? 'ON' : 'OFF'}
                            </button>
                            <button className="control-btn" onClick={() => setWagonWheel([])}>
                                <i className="fas fa-trash-alt"></i> Clear Wagon Wheel ({wagonWheel.length} shots)
                            </button>
                        </div>

                        {/* Free Play Controls panel */}
                        {playMode === 'free' && (
                            <div className="mode-container" id="free-play-controls">
                                <div className="outcome-controls">
                                    <button className="outcome-btn btn-six" onClick={() => handleBowlBall('SIX')}>
                                        <span className="btn-icon">⚡</span>
                                        <span className="btn-text">6 Runs</span>
                                    </button>
                                    <button className="outcome-btn btn-four" onClick={() => handleBowlBall('FOUR')}>
                                        <span className="btn-icon">🔥</span>
                                        <span className="btn-text">4 Runs</span>
                                    </button>
                                    <button className="outcome-btn btn-wicket" onClick={() => handleBowlBall('WICKET')}>
                                        <span class="btn-icon">💀</span>
                                        <span class="btn-text">Wicket</span>
                                    </button>
                                    <button className="outcome-btn btn-dot" onClick={() => handleBowlBall('DOT')}>
                                        <span class="btn-icon">🎯</span>
                                        <span class="btn-text">Dot Ball</span>
                                    </button>
                                    <button className="outcome-btn btn-runs" onClick={() => handleBowlBall('RUNS')}>
                                        <span class="btn-icon">🏃</span>
                                        <span class="btn-text">1-3 Runs</span>
                                    </button>
                                    <button className="outcome-btn btn-extra" onClick={() => handleBowlBall('EXTRA')}>
                                        <span class="btn-icon">⚠️</span>
                                        <span class="btn-text">Wide / No Ball</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Interactive Game Controls panel */}
                        {playMode === 'game' && (
                            <div className="mode-container" id="interactive-game-controls">
                                <div className="batting-instruction">
                                    <span>The bowler is running in! Select your batting response:</span>
                                </div>
                                <div className="game-actions-grid">
                                    <button className="game-btn btn-helicopter" onClick={() => handlePlayBattingShot('helicopter')}>
                                        <span className="game-btn-title">Helicopter Shot 🚁</span>
                                        <span className="game-btn-desc">High risk boundary shot</span>
                                    </button>
                                    <button className="game-btn btn-coverdrive" onClick={() => handlePlayBattingShot('coverdrive')}>
                                        <span className="game-btn-title">Stunning Cover Drive 🏏</span>
                                        <span className="game-btn-desc">Classy placement & timing</span>
                                    </button>
                                    <button className="game-btn btn-nudge" onClick={() => handlePlayBattingShot('nudge')}>
                                        <span className="game-btn-title">Nudge & Run 🏃‍♂️</span>
                                        <span className="game-btn-desc">Safe strike rotation</span>
                                    </button>
                                    <button className="game-btn btn-leave" onClick={() => handlePlayBattingShot('leave')}>
                                        <span className="game-btn-title">Leave Ball 👀</span>
                                        <span className="game-btn-desc">Safe dot, check wide/yorker</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Live Broadcaster Controls panel */}
                        {playMode === 'live' && (
                            <div className="mode-container" id="live-match-controls">
                                <div className="live-match-setup">
                                    <div className="batting-instruction">
                                        <span>Real Match Live Broadcaster:</span>
                                    </div>
                                    <div className="live-select-row">
                                        <select value={selectedLiveMatch} onChange={handleSelectMatchChange}>
                                            <option value="demo">Demo Live Feed: RCB vs CSK (Simulated Live Match)</option>
                                            {liveMatches.map((m) => (
                                                <option key={m.guid} value={m.guid}>{m.title}</option>
                                            ))}
                                        </select>
                                        <button className="control-btn" title="Refresh Live Scoreboard Feed" onClick={triggerFetchLiveMatches}>
                                            <i className="fas fa-sync-alt"></i>
                                        </button>
                                    </div>
                                    <div className="live-status-row">
                                        <span className="live-pulse-green"></span>
                                        <span className="status-msg">{liveConnectionStatus}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* Right Panel */}
                <section className="right-panel">
                    
                    {/* Commentary Card */}
                    <div className="card commentary-card">
                        <div className="card-header">
                            <div className="live-mic-title">
                                <span className="pulsing-red-dot"></span>
                                <h2>CRICAI COMMENTARY BOX</h2>
                            </div>
                            <span className="mic-status"><i className="fas fa-microphone"></i> ON AIR</span>
                        </div>
                        <div className="commentary-screen-outer">
                            <div className="commentary-screen">
                                <p className={commentaryHighlight || 'placeholder-text'}>{commentaryText}</p>
                            </div>
                        </div>
                        <div className={`audio-wave-container ${isSpeaking ? 'speaking' : ''}`}>
                            {[...Array(15)].map((_, i) => <div key={i} className="wave-bar"></div>)}
                        </div>
                    </div>

                    {/* AI Copilot Agent Chat Panel */}
                    <div className="card custom-commentary-card">
                        <div className="card-header">
                            <h2><i className="fas fa-robot text-blue"></i> CRICAI AI COPILOT AGENT</h2>
                        </div>
                        <div className="agent-chat-box">
                            {/* Chat history list */}
                            <div className="chat-box-messages" id="chat-msg-list">
                                {chatMessages.map((msg, index) => (
                                    <div key={index} className={`chat-msg ${msg.sender}`}>
                                        {msg.text}
                                    </div>
                                ))}
                                {isAgentTyping && (
                                    <div className="chat-msg agent typing">
                                        <span className="live-pulse-green" style={{ display: 'inline-block', marginRight: '6px' }}></span>
                                        CricAI is analyzing stadium data...
                                    </div>
                                )}
                            </div>
                            
                            {/* Input control row */}
                            <div className="prompt-input-wrapper">
                                <input 
                                    type="text" 
                                    value={customPrompt} 
                                    onChange={(e) => setCustomPrompt(e.target.value)} 
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSendChatMessage(customPrompt);
                                    }}
                                    placeholder="e.g. Dhoni six, Bumrah wicket, play dhol beats..." 
                                />
                                <button onClick={() => handleSendChatMessage(customPrompt)}>
                                    <i className="fas fa-paper-plane"></i>
                                </button>
                            </div>
                            
                            {/* Quick Prompt Suggester Chips */}
                            <div className="quick-prompts">
                                <button className="quick-prompt-btn" onClick={() => handleQuickPromptClick('dhoni')}>Dhoni Helicopter Six! 🚁</button>
                                <button className="quick-prompt-btn" onClick={() => handleQuickPromptClick('kohli')}>Kohli Classic Drive! 🏏</button>
                                <button className="quick-prompt-btn" onClick={() => handleQuickPromptClick('bumrah')}>Bumrah Lethal Yorker! 💀</button>
                            </div>
                        </div>
                    </div>

                    {/* Voice Adjuster Panel */}
                    <div className="card voice-panel-card">
                        <div className="card-header">
                            <h2><i className="fas fa-sliders-h"></i> CRICAI VOICE & STYLE</h2>
                        </div>
                        <div className="voice-controls-grid">
                            <div className="control-row">
                                <label>Commentary Style</label>
                                <select value={commentaryStyle} onChange={(e) => setCommentaryStyle(e.target.value)}>
                                    <option value="filmy">Bollywood Masala Drama (Filmy)</option>
                                    <option value="sarcastic">Desi Sarcasm & Crowd Fun</option>
                                    <option value="aggressive">Aggressive High-Voltage</option>
                                </select>
                            </div>
                            <div className="control-row">
                                <label>Speech Rate (Speed)</label>
                                <div className="slider-wrapper">
                                    <input type="range" min="0.8" max="1.5" step="0.1" value={speechRate} onChange={(e) => setSpeechRate(parseFloat(e.target.value))} />
                                    <span id="speed-val">{speechRate.toFixed(1)}x</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Atmosphere soundboard card */}
                    <div className="card atmosphere-card">
                        <div className="card-header">
                            <h2><i className="fas fa-volume-up"></i> STADIUM SOUNDBOARD & CHEER</h2>
                        </div>
                        <div className="soundboard-grid">
                            <button className="sfx-btn" onClick={() => playSynthSound('cheer', sfxEnabled)}>
                                <i className="fas fa-users"></i>
                                <span>Stadium Roar</span>
                            </button>
                            <button className="sfx-btn" onClick={() => playSynthSound('horn', sfxEnabled)}>
                                <i className="fas fa-bullhorn"></i>
                                <span>IPL Trumpet</span>
                            </button>
                            <button className="sfx-btn" onClick={() => playSynthSound('dhol', sfxEnabled)}>
                                <i className="fas fa-drum"></i>
                                <span>Desi Dhol Beats</span>
                            </button>
                            <button className="sfx-btn" onClick={() => playSynthSound('bat', sfxEnabled)}>
                                <i className="fas fa-hammer"></i>
                                <span>Bat Impact</span>
                            </button>
                            <button className="sfx-btn" onClick={() => playSynthSound('aww', sfxEnabled)}>
                                <i className="fas fa-heart-broken"></i>
                                <span>Crowd Sigh</span>
                            </button>
                            <button className="sfx-btn" onClick={() => playSynthSound('whistle', sfxEnabled)}>
                                <i className="fas fa-arrow-circle-right"></i>
                                <span>Umpire Whistle</span>
                            </button>
                        </div>
                        <div className="crowd-meter-wrapper">
                            <span className="meter-label">Stadium Crowd Hype Meter</span>
                            <div className="meter-track">
                                <div className="meter-fill" style={{ width: `${crowdMeterFill}%` }}></div>
                            </div>
                            <div className="meter-stats">
                                <span id="crowd-percentage">{crowdMeterFill}% Hyped</span>
                                <span id="crowd-status">{crowdMeterStatus}</span>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Double column Hackathon Feed & API Ledger section */}
            <section className="feed-section">
                <div className="feed-grid">
                    
                    {/* Left Column: Inning history timeline list */}
                    <div className="card feed-card">
                        <div className="card-header">
                            <h2><i className="fas fa-stream"></i> INNING OVER FEED (BALL-BY-BALL)</h2>
                            <span className="feed-count">{feedCount} Ball{feedCount !== 1 ? 's' : ''} Bowled</span>
                            <button id="reset-btn" className="control-btn" onClick={handleResetAll} style={{ marginLeft: 'auto' }}><i className="fas fa-sync"></i> Reset scoreboard</button>
                        </div>
                        <div className="feed-list">
                            {feedHistory.length === 0 ? (
                                <div className="empty-feed-placeholder">
                                    <i className="fas fa-history"></i>
                                    <p>Awaiting game action. Start playing above to construct the live match inning history!</p>
                                </div>
                            ) : (
                                feedHistory.map((item, idx) => (
                                    <div key={idx} className={`feed-item outcome-${item.outcome.toLowerCase()}`}>
                                        <div className="feed-item-header">
                                            <span className="feed-ball-no">Ball {item.ballNo}</span>
                                            <span className={`feed-badge badge-${item.outcome.toLowerCase()}`}>{item.outcome}</span>
                                        </div>
                                        <div className="feed-players">
                                            {item.batsman} <span>vs</span> {item.bowler}
                                        </div>
                                        <div className="feed-commentary-text">{item.text}</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Right Column: Glowing MERN API Console */}
                    <div className="card feed-card">
                        <div className="card-header">
                            <h2><i className="fas fa-database text-green"></i> MERN STACK DATABASE & REST API LEDGER</h2>
                            <span className="feed-count" style={{ borderColor: 'var(--neon-green)', color: 'var(--neon-green)' }}>MongoDB Active</span>
                        </div>
                        <div className="mern-terminal">
                            {mernLogs.map((log, idx) => (
                                <div key={idx} className="mern-log-item">
                                    <div className="mern-log-header">
                                        <div>
                                            <span className={`mern-method ${log.method}`}>{log.method}</span>
                                            <span className="mern-endpoint">{log.endpoint}</span>
                                        </div>
                                        <span className="mern-time">{log.timestamp}</span>
                                    </div>
                                    <div className="mern-details">
                                        <div className="mern-payload">
                                            <span className="mern-payload-label">Request Payload:</span> {log.payload}
                                        </div>
                                        <div className="mern-response">
                                            <span className="mern-response-label">Response Data:</span> {log.response}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </section>

            {/* Success Trophy Modal Overlay */}
            {showVictoryModal && (
                <div className="modal-overlay">
                    <div className="modal-card victory-card-glow">
                        <div className="modal-header center-title">
                            <h2 className="animate-bounce"><i className="fas fa-trophy text-gold"></i> MATCH FINISHED!</h2>
                        </div>
                        <div className="modal-body text-center">
                            <h1>{victoryData.title}</h1>
                            <p className="commentary-quote">{victoryData.message}</p>
                            <div className="audio-wave-container speaking victory-eq">
                                <div className="wave-bar"></div><div class="wave-bar"></div><div class="wave-bar"></div>
                                <div class="wave-bar"></div><div class="wave-bar"></div><div class="wave-bar"></div>
                            </div>
                        </div>
                        <div className="modal-footer center-footer">
                            <button className="action-btn btn-gold-neon" onClick={() => {
                                setShowVictoryModal(false);
                                handleResetAll();
                            }}>Play Another Inning</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Tech Spec Sheet Modal Overlay */}
            {showJudgeModal && (
                <div className="modal-overlay">
                    <div className="modal-card modal-card-wide">
                        <div className="modal-header">
                            <h2><i className="fas fa-award"></i> HACKATHON TECH SPEC SHEET</h2>
                            <button className="close-modal-btn" onClick={() => setShowJudgeModal(false)}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <div className="spec-grid">
                                <div className="spec-section">
                                    <div className="spec-icon"><i className="fas fa-atom"></i></div>
                                    <h3>1. React 18 State Architecture</h3>
                                    <p>25+ declarative useState hooks sync scoreboard, Wagon Wheel vectors, MongoDB logs, AI chat, and audio — zero manual DOM mutations.</p>
                                    <span className="spec-tag">React 18 · Babel CDN · Zero Build Tools</span>
                                </div>
                                <div className="spec-section">
                                    <div className="spec-icon"><i className="fas fa-satellite-dish"></i></div>
                                    <h3>2. ESPN Live XML Broadcaster</h3>
                                    <p>Real-world ESPN Cricinfo RSS XML polling via keyless CORS proxy. Detects run/wicket differentials every 9s and auto-triggers animations.</p>
                                    <span className="spec-tag">corsproxy.io · RSS XML · DOMParser API</span>
                                </div>
                                <div className="spec-section">
                                    <div className="spec-icon"><i className="fas fa-wave-square"></i></div>
                                    <h3>3. Procedural Audio Synthesis</h3>
                                    <p>Zero audio assets. Dhol, IPL trumpets, crowd roars, bat impacts, and whistles synthesized live via oscillators, sawtooth waves & noise filters.</p>
                                    <span className="spec-tag">Web Audio API · 0 KB Assets · 5 Instruments</span>
                                </div>
                                <div className="spec-section">
                                    <div className="spec-icon"><i className="fas fa-robot"></i></div>
                                    <h3>4. Fuzzy NLP Copilot Agent</h3>
                                    <p>Token-scoring NLP engine understands Hinglish: Mahi, King Kohli, Hitman, chhakka, shor. Controls pitch animations, sounds & analytics via chat.</p>
                                    <span className="spec-tag">Fuzzy NLP · Hinglish Aliases · 10 Intent Classes</span>
                                </div>
                                <div className="spec-section">
                                    <div className="spec-icon"><i className="fas fa-bullseye"></i></div>
                                    <h3>5. Wagon Wheel Shot Analytics</h3>
                                    <p>Every ball computes a vector angle + length. Rendered as color-coded neon trajectory lines over the 2D pitch — live Star Sports-style shot map.</p>
                                    <span className="spec-tag">CSS Rotation Vectors · React State · 5 Colors</span>
                                </div>
                                <div className="spec-section">
                                    <div className="spec-icon"><i className="fas fa-database"></i></div>
                                    <h3>6. MERN Stack API Console</h3>
                                    <p>Simulated MongoDB Atlas REST terminal. Every ball fires POST /api/innings/ball-log with structured JSON payload & response — production-ready.</p>
                                    <span className="spec-tag">MongoDB · Express · React · Node · REST API</span>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <div className="tech-stack-pills">
                                <span className="pill pill-react"><i className="fab fa-react"></i> React 18</span>
                                <span className="pill pill-js"><i className="fab fa-js"></i> Vanilla JS</span>
                                <span className="pill pill-db"><i className="fas fa-database"></i> MongoDB Ready</span>
                                <span className="pill pill-audio"><i className="fas fa-music"></i> Web Audio</span>
                                <span className="pill pill-tts"><i className="fas fa-microphone"></i> Speech API</span>
                            </div>
                            <p style={{marginTop:'12px', color:'#64748b', fontSize:'0.82rem'}}>Opens instantly in browser. No npm install, no build step, no API keys required. 🚀</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className="app-footer">
                <p>&copy; 2026 CricAI Pro Arena. Crafted with cyber-sports dark luxury styling.</p>
                <p className="small-text">React 18 & Web Audio Synthesizer Integration.</p>
            </footer>

            {/* Toast Notice Container */}
            <div id="voice-toast" className="toast">
                <i className="fas fa-bell"></i>
                <span id="toast-text">Voice commentary active!</span>
            </div>
        </div>
    );
}

// Render root App node
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
