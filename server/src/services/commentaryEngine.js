const DIALOGUE_LIBRARIES = {
  SIX: {
    filmy: [
      "Baap re baap! Yeh ball toh seedha ISRO ke rocket ki tarah Chandrayaan ke paas bhej di batsman ne!",
      "Gagan-chumbi chakka! Yeh shot dekh kar bowler ke toh tote udd gaye bhai, ball ab seedha stands ke paar!",
      "Bawaal boundary saheb! Khada khed kar helicopter shot ghuma diya!",
      "Kya bindaas timing hai yaar! Ball ko bheja hai seedha orbit mein!",
    ],
    sarcastic: [
      "Yeh shot dekh kar lagta hai bowler ko bat pe bulaya tha par chhakka maar diya!",
      "Bhaisaab, thoda reham karo bowler pe! Gunde ki tarah de-maar chhakka!",
      "Fielder bechara ball boundary paar jaate dekh haath hila raha hai jaise shadi mein tata bol raha ho!",
    ],
    aggressive: [
      "Dhamakedar chakka! Pure brute force se ball udda ke rakh di boundary ke bohot door!",
      "Unbelievable power hitting! Full toss mila aur bat ka muh khol diya!",
    ],
    death: [
      "Bhai sahab! Death overs mein poora stadium chhakke ke shor se gunj utha!",
      "OMG! Last overs ka suspense chal raha hai aur ball seedha sky-rocket ho gayi!",
    ],
    lastball: [
      "Aakhri ball par chakka! Yeh toh pure Bollywood level drama finish hai dosto!",
    ],
  },
  FOUR: {
    filmy: [
      "Aha! Kya khoobsurat classic boundary tha, bilkul gap mein nikaal diya!",
      "Shaandaar chauka! Fielder bhaagta raha par ball boundary paar tapak gayi!",
      "Chabuk driving boundary! Bowler ne room di aur batsman ne tax vasool kar liya!",
    ],
    sarcastic: [
      "Aisa cover drive maara jaise tax refund check clearance kar raha ho!",
      "Gaps ko aise dhundha hai jaise shadi mein rishte dhundhte hain! Kamaal timing!",
    ],
    aggressive: [
      "Kamaal ka bullet shot! Rocket speed se covers chirte hue boundary cross!",
      "Shaandaar drive! Boundary lines pe aag lag chuki hai!",
    ],
    death: ["Pressure ke aakhri minute mein chaar runs! Bowler ka plan chaupat!"],
    lastball: ["Boundary on the final delivery! Absolute thriller on visual show!"],
  },
  WICKET: {
    filmy: [
      "Oh bhai, yeh kya ho gaya! Stumps ka danda ukhad gaya!",
      "Howzzat! Catch pakad liya covers pe, kya flying dive!",
      "Clean bowled! Stump hawa mein gol-gol ghoom raha hai!",
    ],
    sarcastic: [
      "Chale gaye dosto! Badi machhli jaal mein fas gayi!",
      "Khatam, tata, bye-bye! Galti ki aur dhar-dabocha gaya!",
    ],
    aggressive: [
      "Cleaned him up! Lightning delivery aur seedha stumps ukhad diye!",
      "Fatal error! Mistimed shot aur clean overhead grab!",
    ],
    death: ["Death over pressure claims a wicket! Dalti train se drop hona jaisa!"],
    lastball: ["Last ball clean bowled! Bowling team ne match wrap kar liya!"],
  },
  DOT: {
    filmy: [
      "Kamaal ki bowling yaar, bilkul room nahi diya!",
      "Tight line aur length! Batsman keval bat ghumata reh gaya!",
      "Dot ball! Bowler ne poora shor-sharaaba daba diya!",
    ],
    sarcastic: [
      "Ek aur dot ball! Batsman ball ko aise touch kar raha hai jaise current laga ho!",
      "Dot ball! Face ka color marksheet aane jaisa ho gaya!",
    ],
    aggressive: [
      "Express yorker! Bat par lagne ki bajaye pads ke paas se nikal gayi!",
      "Excellent tight containment! Bowler dominating completely!",
    ],
    death: ["Death overs mein dot ball sone se mehengi! Clutch yorker!"],
    lastball: ["Dot on last ball! Bowling team ne victory seal kar di!"],
  },
  RUNS: {
    filmy: [
      "Aasaani se single le liya, strike rotation chalu hai!",
      "Bhaagte hi do runs bacha liye! Gazab running!",
      "Quick single! Dono aise bhaage jaise security guard pad gaya ho!",
    ],
    sarcastic: [
      "Ek run mil gaya. Strike change hui, thoda timepass badha!",
      "Daud ke do runs. Kohli bhi khush ho jaayega fitness dekh ke!",
    ],
    aggressive: [
      "Sprint speed running! Aggressively do runs convert kar liye!",
      "Hard run single keeping score rolling!",
    ],
    death: ["Aakhri overs mein do runs! Score update continuous!"],
    lastball: ["Last ball single — match finish line pe pahunch gaya!"],
  },
  EXTRA: {
    filmy: [
      "Oh ho! Bowler target pressure mein lane aur direction dono bhatak gaye!",
      "Wide ball! Umpire ne dono haath failaye!",
      "No ball! Free hit milegi ab! Batsman ke chehre pe trophy jaisi khushi!",
    ],
    sarcastic: [
      "Extra runs free mein! Dimaag aur dil dono machal gaye!",
      "Aisi ball daal rahe hain ki keeper ko boundary dive lagani padegi!",
    ],
    aggressive: [
      "Wayward line! Wide bouncers flying past reach!",
      "No ball! Overstep error — free hit for batting team!",
    ],
    death: ["Aakhri overs mein extra dena self-destruction mode hai!"],
    lastball: ["Wide on final ball! Unbelievable tension!"],
  },
};

const ENDINGS = [
  "CROWD GOES WILD! 🎉🏏",
  "Aaaaand the stadium erupts! 🏟️✨",
  "Sab log uth ke khade ho gaye hain! 👏🔥",
  "Stadium mein shor bemisaal hai boss! 📣🔊",
  "Tension badhta hi jaa raha hai! 😬💥",
  "Cricket fans bilkul paagal ho chuke hain! 🤪🕺",
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function compileHinglishCommentary(
  outcome,
  tone,
  scenario,
  striker,
  strikerStyle,
  bowler,
  customShotText = ""
) {
  let category = DIALOGUE_LIBRARIES[outcome];
  if (!category) category = DIALOGUE_LIBRARIES.DOT;

  let commentaryBase = "";
  if (scenario === "lastball" && category.lastball) {
    commentaryBase = pick(category.lastball);
  } else if (scenario === "death" && category.death) {
    commentaryBase = pick(category.death);
  } else if (category[tone]) {
    commentaryBase = pick(category[tone]);
  } else {
    commentaryBase = pick(category.filmy);
  }

  let shotPrefix = "";
  if (customShotText) {
    shotPrefix = `Aha! ${striker} ne khela aala darjey ka ${customShotText}! `;
  }

  let personalityPhrase = "";
  if (striker && !customShotText) {
    if (outcome === "SIX" || outcome === "FOUR") {
      if (strikerStyle === "Aggressive hitter") {
        personalityPhrase = ` ${striker} aaj bilkul attack mode mein hai — ball seedha boundary paar!`;
      } else if (strikerStyle === "Anchor") {
        personalityPhrase = ` ${striker} ki solid classical timing captain material hai!`;
      } else {
        personalityPhrase = ` Naye batsman ${striker} ne settle hone ka wait nahi kiya!`;
      }
    } else if (outcome === "WICKET") {
      personalityPhrase = ` ${striker} jaise set batsman ka out hona bada setback hai!`;
    } else if (outcome === "DOT") {
      if (strikerStyle === "Aggressive hitter") {
        personalityPhrase = ` ${bowler} ne ${striker} ko dot balls se baandh ke rakha hai!`;
      } else {
        personalityPhrase = ` ${striker} thoda pressure mein — single rotation pe focus chahiye.`;
      }
    }
  }

  return `${shotPrefix}${commentaryBase}${personalityPhrase} ${pick(ENDINGS)}`;
}
