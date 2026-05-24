export function getScenarioDefaults(scenario) {
  const base = {
    scenario,
    striker: "Virat Kohli",
    strikerStyle: "Anchor",
    bowler: "Jasprit Bumrah",
    ballsInOver: 0,
  };

  switch (scenario) {
    case "powerplay":
      return { ...base, score: 12, wickets: 0, overs: 1.0, target: 180 };
    case "middle":
      return { ...base, score: 76, wickets: 2, overs: 9.0, target: 150 };
    case "lastball":
      return { ...base, score: 157, wickets: 4, overs: 19.5, target: 163 };
    case "death":
    default:
      return { ...base, score: 144, wickets: 4, overs: 19.0, target: 163 };
  }
}
