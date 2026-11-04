/* Senior Year Build: the 38-week offseason, lineman track.
   Everything here is the plan itself. Personal numbers and logs live in the database, never in this file.
   Scheme strings: "4x8@70" = 4 sets of 8 at 70% of the base lift's max.
   "1x5+@75" = last set for max reps, stopping 1 rep short of failure. Groups are joined with commas. */
(function (root) {
  const START = '2026-11-09';
  const WEEKS = 38;
  const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const DAY_NAME = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' };

  const LIFTS = {
    squat: 'Back Squat',
    bench: 'Bench Press',
    deadlift: 'Deadlift',
    clean: 'Hang Power Clean',
    press: 'Strict Press',
  };

  const METRICS = {
    reps225: { n: '225 Bench Reps', unit: 'reps', goal: 18, better: 'up' },
    ten: { n: '10-Yard Split', unit: 'sec', goal: 1.85, better: 'down' },
    forty: { n: '40-Yard Dash', unit: 'sec', goal: 5.2, better: 'down' },
    shuttle: { n: '5-10-5 Shuttle', unit: 'sec', goal: 4.7, better: 'down' },
    vertical: { n: 'Vertical Jump', unit: 'in', goal: 28, better: 'up' },
    broad: { n: 'Broad Jump', unit: 'in', goal: 104, better: 'up' },
  };

  const EX = {
    squat: { n: 'Back Squat', cue: 'Big breath, brace hard, knees out. Hit depth on every rep.' },
    bench: { n: 'Bench Press', cue: 'Shoulder blades pinched, feet driving. Touch the chest, press back over the shoulders.' },
    deadlift: { n: 'Deadlift', cue: 'Bar over mid-foot, lats tight, push the floor away. Reset every rep.' },
    clean: { n: 'Hang Power Clean', cue: 'Bar to mid-thigh, jump, shrug, fast elbows. Speed first, weight second.' },
    pausesquat: { n: 'Pause Squat', cue: 'Two-second dead stop in the hole. Stay tight, then explode up.' },
    frontsquat: { n: 'Front Squat', cue: 'Elbows high, chest up. If the elbows drop, the weight is too heavy.' },
    rdl: { n: 'Romanian Deadlift', cue: 'Soft knees, push the hips back until the hamstrings load. Bar stays on the legs.' },
    bulgarian: { n: 'Bulgarian Split Squat', cue: 'Back foot on a bench, front heel down. Control the bottom.' },
    lunge: { n: 'Walking Lunge', cue: 'Long step, back knee kisses the floor, stay tall.' },
    legpress: { n: 'Leg Press', cue: 'Full range, no bouncing, hips stay on the pad.' },
    legcurl: { n: 'Leg Curl', cue: 'Squeeze at the top, three seconds down.' },
    ghr: { n: 'Glute-Ham Raise', cue: 'Body straight from knee to shoulder. Use a band or do Nordic curls if there is no machine.' },
    backext: { n: 'Back Extension', cue: 'Squeeze the glutes at the top. Do not over-arch.' },
    incline: { n: 'Incline Bench Press', cue: 'Low incline, bar to upper chest, elbows slightly tucked.' },
    inclinedb: { n: 'Incline Dumbbell Press', cue: 'Deep stretch at the bottom, drive up and slightly in.' },
    dbpress: { n: 'Dumbbell Shoulder Press', cue: 'Ribs down, press straight overhead.' },
    pushpress: { n: 'Push Press', cue: 'Short dip, drive with the legs, lock out over the ears.' },
    closebench: { n: 'Close-Grip Bench', cue: 'Hands just inside shoulder width. This is the lockout that finishes a punch.' },
    speedbench: { n: 'Speed Bench', cue: 'Every rep as fast as possible. If it slows down, the set is over.' },
    speeddead: { n: 'Speed Deadlift', cue: 'Yank nothing. Get tight, then rip it off the floor as fast as you can.' },
    dips: { n: 'Dips', cue: 'Chest slightly forward, elbows to 90 degrees. Add weight when all reps are clean.' },
    pullup: { n: 'Pull-Up', cue: 'Full hang to chin over the bar. Use a band if reps fall short.' },
    wpullup: { n: 'Weighted Pull-Up', cue: 'Full hang to chin over the bar. Add weight only when every rep is clean.' },
    csrow: { n: 'Chest-Supported Row', cue: 'Chest stays on the pad. Pull elbows back, pause, lower slow.' },
    bbrow: { n: 'Barbell Row', cue: 'Flat back, pull to the belly button, no heaving.' },
    dbrow: { n: 'One-Arm Dumbbell Row', cue: 'Long stretch at the bottom, elbow to the hip.' },
    facepull: { n: 'Face Pull', cue: 'Pull to the forehead, thumbs back. Keeps the shoulders healthy.' },
    laterals: { n: 'Lateral Raise', cue: 'Light and strict, lead with the elbows.' },
    shrug: { n: 'Barbell Shrug', cue: 'Straight up, hold one second at the top. No rolling.' },
    curl: { n: 'Barbell Curl', cue: 'Elbows stay pinned. No swinging.' },
    pushdown: { n: 'Triceps Pushdown', cue: 'Elbows pinned, lock out hard.' },
    neck: { n: '4-Way Neck', cue: 'Front, back, both sides. Light, slow and controlled with a harness or partner. Never jerk it.' },
    wrist: { n: 'Wrist Roller', cue: 'Up and down counts as one trip. Strong hands win at the line.' },
    pinch: { n: 'Plate Pinch Hold', cue: 'Pinch two plates smooth-side out. Hold for the full time.' },
    farmer: { n: "Farmer's Carry", cue: 'Heavy dumbbells or handles. Tall posture, quick steps.' },
    sledpush: { n: 'Heavy Sled Push', cue: 'Hips low, flat back, drive like you are firing off the ball.' },
    sledwalk: { n: 'Easy Sled Walk', cue: 'Light load, long steady steps. This one is for recovery.' },
    sleddrag: { n: 'Backward Sled Drag', cue: 'Stay low and pull with the quads. Great for sore knees.' },
    sledsprint: { n: 'Sled Sprint', cue: 'Light enough to stay fast. Low and violent from a 3-point stance.' },
    pallof: { n: 'Pallof Press', cue: 'Press the band out and do not let it turn you.' },
    abwheel: { n: 'Ab Wheel', cue: 'Ribs down, roll only as far as you can hold a flat back.' },
    legraise: { n: 'Hanging Leg Raise', cue: 'No swinging. Curl the hips up at the top.' },
    plank: { n: 'Weighted Plank', cue: 'Plate on the back, squeeze the glutes, breathe.' },
    start3: { n: '3-Point Starts', cue: 'First step is six inches. Fire out low and punch the hands through.' },
    start10: { n: '10-Yard Starts', cue: 'Full speed from a 3-point stance. Walk back and rest fully.' },
    shuttledrill: { n: '5-10-5 Shuttle Drill', cue: 'Stay low into each cut and touch the line. Rest fully.' },
    mbchest: { n: 'Med Ball Chest Pass', cue: 'Explode off the chest like a punch. 10-14 lb ball into a wall.' },
    mbscoop: { n: 'Med Ball Scoop Toss', cue: 'Load the hips, throw it as high and far as you can.' },
    boxjump: { n: 'Box Jump', cue: 'Land soft in a quarter squat. Step down, never jump down.' },
    broadjump: { n: 'Broad Jump', cue: 'Swing hard and stick the landing on every rep.' },
    landmine: { n: 'Landmine Punch Press', cue: 'Drive off the back foot and punch through the bar.' },
    mobility: { n: 'Mobility Flow', cue: '90/90 hips, couch stretch, T-spine rotations, ankle rocks. Slow and easy.' },
    bike: { n: 'Easy Bike or Walk', cue: 'Nose breathing pace. You should be able to hold a conversation.' },
    drive: { n: '16-Play Drive', cue: 'Burst 5 seconds, walk back, go again every 30 seconds. One rep equals one play.' },
    twomin: { n: 'Two-Minute Drill', cue: '10 bursts of 10 yards, 15 seconds between. Rest 3 minutes between drills.' },
    bars225: { n: '225 Bench Rep Test', cue: 'Touch the chest and lock out every rep. Spotter stands by. Stop when a rep slows way down.' },
    press: { n: 'Strict Press', cue: 'Squeeze the glutes, ribs down, no leg drive. Finish with the bar over the ears.' },
    seateddb: { n: 'Seated Dumbbell Press', cue: 'Back on the pad, lower to the ears, press straight up.' },
    reardelt: { n: 'Rear Delt Fly', cue: 'Light and strict. Lead with the elbows and squeeze the upper back.' },
    skull: { n: 'Skull Crushers', cue: 'Elbows stay in and pointed up. Lower to the forehead, press back up.' },
    inclinecurl: { n: 'Incline Dumbbell Curl', cue: 'Arms hang straight down behind you. Full stretch, no swinging.' },
    ohext: { n: 'Overhead Triceps Extension', cue: 'Elbows pointed at the ceiling. Get the full stretch at the bottom.' },
    hammer: { n: 'Hammer Curl', cue: 'Thumbs up, elbows pinned, control it down.' },
    ropepush: { n: 'Rope Pushdown', cue: 'Pull the rope apart at the bottom and lock out hard.' },
    trapbar: { n: 'Trap Bar Deadlift', cue: 'Hips low, chest up, drive the floor away. Stand tall and finish every rep.' },
    trapjump: { n: 'Trap Bar Jump', cue: 'Light load. Jump as high as you can and land soft. Reset every rep.' },
    yoke: { n: 'Yoke Walk', cue: 'Brace hard, stand it up, then quick short steps. Set it down under control.' },
    kickslide: { n: 'Pass-Set Kick Slides', cue: '2-point stance. Kick then slide, stay low, hands ready, never cross the feet.' },
    measure: { n: 'Testing', cue: 'Full rest between attempts. Record the best one.' },
  };

  const WU = {
    lower: ['Bike or jump rope, 3 min', '90/90 hip switches, 8 per side', "World's greatest stretch, 5 per side", 'Goblet squat holds, 3 x 20 sec', 'Glute bridges, 15'],
    upper: ['Jump rope, 3 min', 'Band pull-aparts, 25', 'Scap push-ups, 12', 'Wall slides, 10', 'Band shoulder pass-throughs, 10'],
    speed: ['Light jog, 2 min', 'Leg swings, 10 each way', 'A-skips, 2 x 20 yards', 'High knees, 2 x 15 yards', 'Build-up runs, 3 x 20 yards at 70%'],
  };

  const TEST = '1x5@40,1x3@60,1x2@75,1x1@85,1x1@92.5,1x1@97.5,1x1@102.5,1x1@105';
  const REST_DAY = { title: 'Rest', kind: 'rest', min: 0, note: 'Full day off. Eat all your meals, get to bed early, and stay off your feet when you can.', items: [] };

  const testDay = (lifts, title, warm) => ({
    title, kind: 'test', min: 75, warm,
    note: 'Max day. Two spotters on squat and bench. Only take the next single if the last one moved fast. Never miss a rep.',
    items: lifts.map(l => ({ x: l, base: l, s: TEST, rest: 240, test: true })),
  });
  const measureDay = (metrics) => ({
    title: 'Testing Day', kind: 'measure', min: 60, warm: 'speed',
    note: 'Measure the same way every time: same surface, same shoes, same person on the timer. Do the 225 test last, with a spotter.',
    items: metrics.map(m => ({ x: 'measure', metric: m })),
  });
  const easyDay = {
    title: 'Mobility + Easy Move', kind: 'speed', min: 25,
    note: 'Keep this one light. The goal is to walk out feeling better than you walked in.',
    items: [{ x: 'mobility', s: '1x12min' }, { x: 'bike', s: '1x15min' }],
  };

  /* Arm work. Each pair runs back to back, then rest. fail adds a last set to failure, per week when it is an array. */
  const withFail = (text, fail) => {
    const add = (f) => (f ? `${text} Last set to failure.` : text).trim();
    return Array.isArray(fail) ? fail.map(add) : add(fail);
  };
  const armWork = (a, b, c, fail) => [
    { x: 'curl', s: a, e: 'RPE 8', note: 'Back to back with skull crushers, then rest.' },
    { x: 'skull', s: a, e: 'RPE 8', rest: 75 },
    { x: 'inclinecurl', s: b, e: 'RPE 8', note: 'Back to back with overhead extensions, then rest.' },
    { x: 'ohext', s: b, e: 'RPE 8', rest: 75 },
    { x: 'hammer', s: c, e: 'RPE 9', note: withFail('Back to back with rope pushdowns, then rest.', fail) },
    { x: 'ropepush', s: c, e: 'RPE 9', rest: 75, note: withFail('', fail) },
  ];
  const armPump = [
    { x: 'curl', s: '2x15', e: 'Pump', note: 'Arm pump. Back to back with pushdowns, short rest.' },
    { x: 'pushdown', s: '2x15', e: 'Pump', rest: 30 },
  ];

  const pressDay = {
    title: 'Press Max + Arms', kind: 'test', min: 70, warm: 'upper',
    note: 'Strict press max first, no leg drive. Then arms. Never miss a rep.',
    items: [{ x: 'press', base: 'press', s: TEST, rest: 240, test: true }, ...armWork('3x10', '3x12', '2x15', false)],
  };
  const testWeek = (sat) => ({
    mon: testDay(['squat'], 'Squat Max', 'lower'),
    tue: testDay(['bench'], 'Bench Max', 'upper'),
    wed: easyDay,
    thu: testDay(['clean', 'deadlift'], 'Clean + Deadlift Max', 'lower'),
    fri: pressDay,
    sat,
  });
  const fullTesting = measureDay(['ten', 'forty', 'shuttle', 'vertical', 'broad', 'reps225']);

  const PHASES = [
    {
      id: 'ramp', name: 'Ramp Up', from: 1, to: 2, color: 'white',
      goal: 'Shake off the season and get moving heavy again.',
      why: 'Real weight on the bar, but smooth and fast. Arm volume starts lower and builds over the first few weeks.',
      days: {
        mon: { title: 'Lower', kind: 'lift', min: 65, warm: 'lower', items: [
          { x: 'squat', base: 'squat', s: ['4x6@70', '4x5@75'], rest: 150, note: 'Smooth and fast. Nothing here should be a grind.' },
          { x: 'rdl', base: 'deadlift', s: ['3x10@50', '3x10@55'], rest: 90 },
          { x: 'lunge', s: '3x10/leg', e: 'Moderate', rest: 75 },
          { x: 'legcurl', s: '3x12', e: 'RPE 7', rest: 60 },
          { x: 'pallof', s: '3x10/side', e: 'Moderate', rest: 45 },
        ] },
        tue: { title: 'Upper', kind: 'lift', min: 65, warm: 'upper', items: [
          { x: 'bench', base: 'bench', s: ['4x6@70', '4x5@75'], rest: 150, note: 'Pause on the chest for one count.' },
          { x: 'pullup', s: '3x6', e: 'Clean reps', rest: 90 },
          { x: 'seateddb', s: '3x10', e: 'RPE 7', rest: 75 },
          { x: 'csrow', s: '4x10', e: 'RPE 7', rest: 75 },
          { x: 'facepull', s: '3x15', e: 'Light', rest: 45 },
          { x: 'neck', s: '2x15', e: 'Light', rest: 45 },
        ] },
        wed: { title: 'Move', kind: 'speed', min: 30, items: [
          { x: 'mobility', s: '1x15min' },
          { x: 'kickslide', s: '4x5yd', rest: 40 },
          { x: 'sledwalk', s: '6x20yd', rest: 45 },
        ] },
        thu: { title: 'Lower Pull', kind: 'lift', min: 65, warm: 'lower', items: [
          { x: 'clean', base: 'clean', s: ['4x3@60', '4x3@65'], rest: 90, note: 'Technique first. Every rep crisp.' },
          { x: 'deadlift', base: 'deadlift', s: ['4x4@70', '4x3@75'], rest: 150 },
          { x: 'frontsquat', base: 'squat', s: ['3x6@55', '3x6@60'], rest: 90 },
          { x: 'backext', s: '3x12', e: 'Bodyweight', rest: 60 },
          { x: 'shrug', s: '3x12', e: 'RPE 7', rest: 60 },
          { x: 'farmer', s: '3x40yd', rest: 60 },
        ] },
        fri: { title: 'Shoulders + Arms', kind: 'lift', min: 65, warm: 'upper', items: [
          { x: 'press', base: 'press', s: ['4x6@70', '4x5@75'], rest: 150, note: 'Starting max is an estimate. If this feels too light, raise it in Settings.' },
          { x: 'seateddb', s: '3x10', e: 'RPE 7', rest: 75 },
          { x: 'laterals', s: '3x15', e: 'RPE 7', rest: 45 },
          { x: 'reardelt', s: '2x15', e: 'Light', rest: 45 },
          ...armWork(['3x10', '3x10'], ['2x12', '3x12'], ['2x15', '2x15'], false),
          { x: 'neck', s: '2x15', e: 'Light', rest: 45 },
        ] },
        sat: { title: 'Yoke + Sled Intro', kind: 'cond', min: 30, items: [
          { x: 'yoke', s: '4x20yd', rest: 75, note: 'Light. Learn the pick and the walk first.' },
          { x: 'sledwalk', s: '6x30yd', rest: 60 },
          { x: 'farmer', s: '3x40yd', rest: 60 },
        ] },
      },
    },
    {
      id: 'mass', name: 'Mass', from: 3, to: 8, color: 'blue', deload: [7], test: 8,
      goal: 'Put on size. Highest volume of the year. First max-out in Week 8.',
      why: 'New muscle carries into every other phase. Four hard weeks, one lighter week, then max out over Christmas break.',
      days: {
        mon: { title: 'Lower Heavy', kind: 'lift', min: 80, warm: 'lower', items: [
          { x: 'squat', base: 'squat', rest: 180, s: ['4x8@72.5', '4x8@75', '5x6@77.5', '3x5@82.5,1x5+@82.5', '3x5@70'] },
          { x: 'rdl', base: 'deadlift', rest: 120, s: ['4x8@60', '4x8@62.5', '4x8@65', '4x8@67.5', '2x8@50'] },
          { x: 'bulgarian', s: '3x10/leg', e: 'RPE 8', rest: 90 },
          { x: 'legpress', s: '3x15', e: 'RPE 8', rest: 90 },
          { x: 'legcurl', s: '4x12', e: 'RPE 8', rest: 60 },
          { x: 'abwheel', s: '3x12', e: 'Clean reps', rest: 45 },
        ] },
        tue: { title: 'Upper Heavy', kind: 'lift', min: 80, warm: 'upper', items: [
          { x: 'bench', base: 'bench', rest: 180, s: ['4x8@72.5', '4x8@75', '5x6@77.5', '3x5@82.5,1x5+@82.5', '3x5@70'] },
          { x: 'wpullup', s: '4x8', e: 'RPE 8', rest: 120 },
          { x: 'seateddb', s: '4x8', e: 'RPE 8', rest: 90 },
          { x: 'bbrow', s: '4x8', e: 'RPE 8', rest: 90 },
          { x: 'facepull', s: '3x15', e: 'Light', rest: 45 },
          { x: 'neck', s: '3x15', e: 'Light', rest: 45 },
        ] },
        wed: { title: 'First Step + Arm Pump', kind: 'speed', min: 45, warm: 'speed', items: [
          { x: 'start3', s: '6x5yd', rest: 40 },
          { x: 'kickslide', s: '6x5yd', rest: 40 },
          { x: 'mbchest', s: '3x5', rest: 60 },
          { x: 'boxjump', s: '3x4', rest: 75 },
          ...armPump,
        ] },
        thu: { title: 'Lower Power', kind: 'lift', min: 80, warm: 'lower', items: [
          { x: 'clean', base: 'clean', rest: 120, s: ['5x3@65', '5x3@67.5', '5x3@70', '5x2@75', '3x2@60'] },
          { x: 'trapbar', base: 'deadlift', big: true, noPlates: true, rest: 180, s: ['4x5@72.5', '4x5@75', '5x4@80', '5x3@82.5', '3x3@70'] },
          { x: 'frontsquat', base: 'squat', rest: 120, s: ['3x8@60', '3x8@62.5', '3x8@65', '3x8@67.5', '2x6@50'] },
          { x: 'ghr', s: '3x10', e: 'Clean reps', rest: 75 },
          { x: 'shrug', s: '4x12', e: 'RPE 8', rest: 60 },
          { x: 'sledpush', s: '4x20yd', rest: 75 },
        ] },
        fri: { title: 'Shoulders + Arms', kind: 'lift', min: 75, warm: 'upper', items: [
          { x: 'press', base: 'press', rest: 180, s: ['5x5@72.5', '5x5@75', '5x5@77.5', '4x5@80,1x5+@80', '3x5@70'] },
          { x: 'seateddb', s: '4x8', e: 'RPE 8', rest: 90 },
          { x: 'laterals', s: '4x15', e: 'RPE 8', rest: 45 },
          { x: 'reardelt', s: '3x15', e: 'RPE 8', rest: 45 },
          ...armWork(['3x10', '4x10', '4x10', '4x10', '3x10'], '3x12', ['2x15', '2x15', '3x15', '3x15', '2x15'], [false, false, true, true, false]),
          { x: 'neck', s: '3x15', e: 'Light', rest: 45 },
        ] },
        sat: { title: 'Yoke + Sled', kind: 'cond', min: 35, items: [
          { x: 'yoke', s: '5x30yd', rest: 90 },
          { x: 'sledpush', s: '6x15yd', rest: 60 },
          { x: 'farmer', s: '4x40yd', rest: 75 },
        ] },
      },
      override: { 8: testWeek(easyDay) },
    },
    {
      id: 'strength', name: 'Strength', from: 9, to: 14, color: 'yellow', deload: [13], test: 14,
      goal: 'Turn the new muscle into strength. Max out in Week 14.',
      why: 'Reps come down and weight goes up, all off the new Week 8 maxes.',
      days: {
        mon: { title: 'Lower Heavy', kind: 'lift', min: 75, warm: 'lower', items: [
          { x: 'squat', base: 'squat', rest: 210, s: ['5x5@80', '5x4@82.5', '5x3@87.5', '3x3@90,1x3+@90', '3x3@70'] },
          { x: 'rdl', base: 'deadlift', rest: 120, s: ['3x6@67.5', '3x6@70', '3x6@72.5', '3x5@72.5', '2x6@55'] },
          { x: 'bulgarian', s: '3x8/leg', e: 'RPE 8', rest: 90 },
          { x: 'legcurl', s: '3x10', e: 'RPE 8', rest: 60 },
          { x: 'abwheel', s: '3x12', e: 'Clean reps', rest: 45 },
        ] },
        tue: { title: 'Upper Heavy', kind: 'lift', min: 75, warm: 'upper', items: [
          { x: 'bench', base: 'bench', rest: 210, s: ['5x5@80', '5x4@82.5', '5x3@87.5', '3x3@90,1x3+@90', '3x3@70'] },
          { x: 'wpullup', s: '4x6', e: 'RPE 8', rest: 120 },
          { x: 'seateddb', s: '4x8', e: 'RPE 8', rest: 90 },
          { x: 'bbrow', s: '4x6', e: 'RPE 8', rest: 90 },
          { x: 'facepull', s: '3x15', e: 'Light', rest: 45 },
          { x: 'neck', s: '3x15', e: 'Light', rest: 45 },
        ] },
        wed: { title: 'First Step + Arm Pump', kind: 'speed', min: 45, warm: 'speed', items: [
          { x: 'start3', s: '8x5yd', rest: 40 },
          { x: 'kickslide', s: '6x5yd', rest: 40 },
          { x: 'sledsprint', s: '6x10yd', rest: 60 },
          { x: 'mbscoop', s: '3x5', rest: 60 },
          ...armPump,
        ] },
        thu: { title: 'Lower Power', kind: 'lift', min: 75, warm: 'lower', items: [
          { x: 'clean', base: 'clean', rest: 150, s: ['5x2@77.5', '5x2@80', '4x2@82.5', '4x2@85', '3x2@65'] },
          { x: 'deadlift', base: 'deadlift', rest: 210, s: ['4x4@82.5', '4x3@85', '4x3@87.5', '3x2@90', '3x2@70'] },
          { x: 'frontsquat', base: 'squat', rest: 120, s: ['3x5@67.5', '3x5@70', '3x5@72.5', '3x5@75', '2x5@55'] },
          { x: 'ghr', s: '3x10', e: 'Clean reps', rest: 75 },
          { x: 'shrug', s: '4x10', e: 'RPE 8', rest: 60 },
          { x: 'sledpush', s: '4x20yd', rest: 75 },
        ] },
        fri: { title: 'Shoulders + Arms', kind: 'lift', min: 75, warm: 'upper', items: [
          { x: 'press', base: 'press', rest: 180, s: ['5x4@80', '5x3@82.5', '5x3@85', '3x3@87.5,1x3+@87.5', '3x3@70'] },
          { x: 'seateddb', s: '4x8', e: 'RPE 8', rest: 90 },
          { x: 'laterals', s: '4x15', e: 'RPE 8', rest: 45 },
          { x: 'reardelt', s: '3x15', e: 'RPE 8', rest: 45 },
          ...armWork('4x10', '3x12', '3x15', [true, true, true, true, false]),
          { x: 'neck', s: '3x15', e: 'Light', rest: 45 },
        ] },
        sat: { title: 'Yoke + Sled', kind: 'cond', min: 35, items: [
          { x: 'yoke', s: '6x30yd', rest: 90 },
          { x: 'sledpush', s: '6x15yd', rest: 60 },
          { x: 'farmer', s: '4x40yd', rest: 75 },
          { x: 'pinch', s: '3x30sec', rest: 45 },
        ] },
      },
      override: { 14: testWeek(fullTesting) },
    },
    {
      id: 'max', name: 'Max Strength', from: 15, to: 20, color: 'red', deload: [19], test: 20,
      goal: 'The heaviest block of the year. Max out in Week 20.',
      why: 'Loads run 85-95% of current maxes. Accessory volume drops to recover from the heavy work.',
      days: {
        mon: { title: 'Lower Max', kind: 'lift', min: 75, warm: 'lower', items: [
          { x: 'squat', base: 'squat', rest: 240, s: ['5x3@85', '5x3@87.5', '3x3@90,1x3+@90', '3x2@90,2x1@95', '3x3@70'] },
          { x: 'pausesquat', base: 'squat', rest: 150, s: ['3x3@72.5', '3x3@75', '3x3@75', '3x2@75', '2x3@55'] },
          { x: 'rdl', base: 'deadlift', rest: 120, s: ['3x6@67.5', '3x5@70', '3x5@72.5', '3x5@72.5', '2x6@55'] },
          { x: 'legcurl', s: '3x8', e: 'RPE 8', rest: 60 },
          { x: 'plank', s: '3x45sec', rest: 45 },
        ] },
        tue: { title: 'Upper Max', kind: 'lift', min: 75, warm: 'upper', items: [
          { x: 'bench', base: 'bench', rest: 240, s: ['5x3@85', '5x3@87.5', '3x3@90,1x3+@90', '3x2@90,2x1@95', '3x3@70'] },
          { x: 'wpullup', s: '5x5', e: 'RPE 8', rest: 120 },
          { x: 'seateddb', s: '4x6', e: 'RPE 8', rest: 90 },
          { x: 'csrow', s: '4x6', e: 'RPE 8', rest: 90 },
          { x: 'facepull', s: '3x15', e: 'Light', rest: 45 },
          { x: 'neck', s: '3x12', e: 'Light', rest: 45 },
        ] },
        wed: { title: 'Speed + Arm Pump', kind: 'speed', min: 45, warm: 'speed', items: [
          { x: 'start3', s: '10x5yd', rest: 40 },
          { x: 'kickslide', s: '6x5yd', rest: 40 },
          { x: 'sledsprint', s: '6x10yd', rest: 60 },
          { x: 'broadjump', s: '3x3', rest: 75 },
          ...armPump,
        ] },
        thu: { title: 'Pull Max', kind: 'lift', min: 75, warm: 'lower', items: [
          { x: 'clean', base: 'clean', rest: 150, s: ['5x2@80', '5x2@82.5', '4x2@85', '5x1@87.5', '3x2@65'] },
          { x: 'deadlift', base: 'deadlift', rest: 240, s: ['4x3@82.5', '4x3@85', '3x3@87.5', '3x2@90,1x1@95', '3x2@70'] },
          { x: 'frontsquat', base: 'squat', rest: 120, s: ['3x3@72.5', '3x3@75', '3x3@77.5', '3x3@77.5', '2x3@60'] },
          { x: 'ghr', s: '3x8', e: 'Clean reps', rest: 75 },
          { x: 'shrug', s: '4x8', e: 'Heavy', rest: 75 },
          { x: 'sledpush', s: '4x20yd', rest: 75 },
        ] },
        fri: { title: 'Shoulders + Arms', kind: 'lift', min: 75, warm: 'upper', items: [
          { x: 'press', base: 'press', rest: 210, s: ['5x3@82.5', '5x3@85', '3x3@87.5,1x3+@87.5', '3x2@90,2x1@92.5', '3x3@70'] },
          { x: 'seateddb', s: '4x6', e: 'RPE 8', rest: 90 },
          { x: 'laterals', s: '4x15', e: 'RPE 8', rest: 45 },
          { x: 'reardelt', s: '3x15', e: 'RPE 8', rest: 45 },
          ...armWork('4x10', '3x12', '3x15', [true, true, true, true, false]),
          { x: 'neck', s: '3x12', e: 'Light', rest: 45 },
        ] },
        sat: { title: 'Iron Saturday', kind: 'cond', min: 40, items: [
          { x: 'yoke', s: '6x40yd', rest: 90 },
          { x: 'sledpush', s: '8x15yd', rest: 60 },
          { x: 'farmer', s: '5x40yd', rest: 75 },
          { x: 'pinch', s: '3x30sec', rest: 45 },
        ] },
      },
      override: { 20: testWeek(easyDay) },
    },
    {
      id: 'power', name: 'Power', from: 21, to: 26, color: 'orange', deload: [25], test: 26,
      goal: 'Turn strength into explosion off the ball. Max out in Week 26.',
      why: 'Heavy lift, then an explosive move right after it. College coaches are often out at schools in the spring, so look the part.',
      days: {
        mon: { title: 'Lower Power', kind: 'lift', min: 70, warm: 'lower', items: [
          { x: 'squat', base: 'squat', rest: 210, s: ['4x3@82.5', '4x3@85', '3x3@87.5', '3x2@90', '3x3@70'] },
          { x: 'boxjump', s: '4x3', rest: 60, note: 'Do one set right after each squat set.' },
          { x: 'rdl', base: 'deadlift', rest: 120, s: ['3x5@67.5', '3x5@70', '3x5@72.5', '3x5@72.5', '2x5@55'] },
          { x: 'legcurl', s: '3x8', e: 'RPE 7', rest: 60 },
          { x: 'pallof', s: '3x10/side', e: 'Moderate', rest: 45 },
        ] },
        tue: { title: 'Upper Power', kind: 'lift', min: 75, warm: 'upper', items: [
          { x: 'bench', base: 'bench', rest: 210, s: ['4x3@82.5', '4x3@85', '3x3@87.5', '3x2@90', '3x3@70'] },
          { x: 'mbchest', s: '4x4', rest: 60, note: 'Do one set right after each bench set.' },
          { x: 'landmine', s: '3x6/side', e: 'Explosive', rest: 75 },
          { x: 'pullup', s: '4x8', e: 'Clean reps', rest: 90 },
          { x: 'seateddb', s: '3x8', e: 'RPE 8', rest: 90 },
          { x: 'neck', s: '3x12', e: 'Light', rest: 45 },
        ] },
        wed: { title: 'First Step + Arm Pump', kind: 'speed', min: 45, warm: 'speed', items: [
          { x: 'start3', s: '8x5yd', rest: 40 },
          { x: 'kickslide', s: '6x5yd', rest: 40 },
          { x: 'start10', s: '6x10yd', rest: 90 },
          { x: 'shuttledrill', s: '4x1rep', rest: 120 },
          ...armPump,
        ] },
        thu: { title: 'Pull Power', kind: 'lift', min: 70, warm: 'lower', items: [
          { x: 'clean', base: 'clean', rest: 150, s: ['5x2@82.5', '5x2@85', '4x1@90', '4x1@90', '3x2@65'] },
          { x: 'trapjump', base: 'deadlift', noPlates: true, rest: 90, s: ['4x3@30', '4x3@30', '4x3@30', '4x3@30', '2x3@25'] },
          { x: 'speeddead', base: 'deadlift', rest: 90, s: ['5x2@70', '5x2@72.5', '5x2@75', '5x2@75', '3x2@60'] },
          { x: 'shrug', s: '3x8', e: 'RPE 8', rest: 60 },
          { x: 'sledsprint', s: '6x15yd', rest: 75 },
        ] },
        fri: { title: 'Shoulders + Arms', kind: 'lift', min: 75, warm: 'upper', items: [
          { x: 'press', base: 'press', rest: 180, s: ['3x3@85', '3x3@87.5', '3x2@90', '3x2@90', '2x3@70'] },
          { x: 'pushpress', base: 'press', rest: 120, s: ['4x3@100', '4x3@105', '4x2@110', '4x2@110', '2x3@85'] },
          { x: 'laterals', s: '4x15', e: 'RPE 8', rest: 45 },
          { x: 'reardelt', s: '3x15', e: 'RPE 8', rest: 45 },
          ...armWork('4x10', '3x12', '3x15', [true, true, true, true, false]),
          { x: 'neck', s: '3x12', e: 'Light', rest: 45 },
        ] },
        sat: { title: 'Sled + Bursts', kind: 'cond', min: 35, items: [
          { x: 'yoke', s: '4x30yd', rest: 90 },
          { x: 'sledsprint', s: '8x15yd', rest: 60 },
          { x: 'drive', s: '1x8plays' },
          { x: 'farmer', s: '3x40yd', rest: 60 },
        ] },
      },
      override: { 26: testWeek(fullTesting) },
    },
    {
      id: 'showcase', name: 'Showcase', from: 27, to: 32, color: 'green', deload: [31], test: 32,
      goal: 'Peak for camps. Fast, fresh and strong when coaches are watching.',
      why: 'Lifts stay heavy but short, and more energy goes to starts, shuttles and jumps. On camp weeks, skip Saturday and drop the deadlift. Move the Week 32 max-out if a camp lands on it.',
      days: {
        mon: { title: 'Lower Short', kind: 'lift', min: 55, warm: 'lower', items: [
          { x: 'squat', base: 'squat', rest: 210, s: ['4x3@82.5', '4x3@85', '3x3@87.5', '3x2@90', '3x3@70'] },
          { x: 'boxjump', s: '3x3', rest: 60 },
          { x: 'rdl', base: 'deadlift', rest: 120, s: ['3x5@65', '3x5@67.5', '3x5@67.5', '3x5@67.5', '2x5@55'] },
          { x: 'pallof', s: '3x10/side', e: 'Moderate', rest: 45 },
        ] },
        tue: { title: 'Upper Short', kind: 'lift', min: 60, warm: 'upper', items: [
          { x: 'bench', base: 'bench', rest: 210, s: ['4x3@82.5', '4x3@85', '3x3@87.5', '3x2@90', '3x3@70'] },
          { x: 'mbchest', s: '3x4', rest: 60 },
          { x: 'pullup', s: '3x8', e: 'Clean reps', rest: 90 },
          { x: 'seateddb', s: '3x8', e: 'RPE 8', rest: 90 },
          { x: 'facepull', s: '3x15', e: 'Light', rest: 45 },
          { x: 'neck', s: '3x12', e: 'Light', rest: 45 },
        ] },
        wed: { title: 'Combine Prep + Arm Pump', kind: 'speed', min: 50, warm: 'speed', items: [
          { x: 'start10', s: '6x10yd', rest: 90 },
          { x: 'kickslide', s: '6x5yd', rest: 40 },
          { x: 'shuttledrill', s: '4x1rep', rest: 120 },
          { x: 'broadjump', s: '3x3', rest: 90 },
          ...armPump,
        ] },
        thu: { title: 'Pull Short', kind: 'lift', min: 55, warm: 'lower', items: [
          { x: 'clean', base: 'clean', rest: 150, s: ['4x2@77.5', '4x2@80', '3x2@82.5', '3x2@85', '3x1@70'] },
          { x: 'deadlift', base: 'deadlift', rest: 210, s: ['3x3@82.5', '3x3@85', '3x2@87.5', '2x2@90', '2x2@70'] },
          { x: 'sledsprint', s: '6x15yd', rest: 75 },
        ] },
        fri: { title: 'Shoulders + Arms', kind: 'lift', min: 65, warm: 'upper', items: [
          { x: 'press', base: 'press', rest: 180, s: ['4x3@82.5', '4x3@85', '3x3@87.5', '3x2@90', '3x3@70'] },
          { x: 'seateddb', s: '3x8', e: 'RPE 8', rest: 90 },
          { x: 'laterals', s: '3x15', e: 'RPE 8', rest: 45 },
          ...armWork('3x10', '3x12', '2x15', [true, true, true, true, false]),
          { x: 'neck', s: '3x12', e: 'Light', rest: 45 },
        ] },
        sat: { title: 'Bursts', kind: 'cond', min: 30, warm: 'speed', items: [
          { x: 'start3', s: '8x5yd', rest: 40 },
          { x: 'yoke', s: '4x30yd', rest: 90 },
          { x: 'drive', s: '1x12plays' },
        ] },
      },
      override: { 32: testWeek(easyDay) },
    },
    {
      id: 'camp', name: 'Camp Ready', from: 33, to: 38, color: 'ink', deload: [35], test: 36,
      goal: 'Football shape. Hold the strength and arrive ready for camp.',
      why: 'Conditioning takes over, built around how linemen actually play: 5-second bursts with short rest. Arm volume comes down to stay fresh. Week 38 is a taper.',
      days: {
        mon: { title: 'Lower Hold', kind: 'lift', min: 55, warm: 'lower', items: [
          { x: 'squat', base: 'squat', rest: 210, s: ['4x3@85', '3x2@92.5', '3x3@70', null, '3x3@75', '2x3@65'] },
          { x: 'rdl', base: 'deadlift', rest: 120, s: ['3x5@65', '3x5@65', '2x5@55', null, '2x5@60', '2x5@50'] },
          { x: 'legcurl', s: '3x8', e: 'RPE 7', rest: 60 },
          { x: 'pallof', s: '3x10/side', e: 'Moderate', rest: 45 },
        ] },
        tue: { title: 'Upper Hold', kind: 'lift', min: 55, warm: 'upper', items: [
          { x: 'bench', base: 'bench', rest: 210, s: ['4x3@85', '3x2@92.5', '3x3@70', null, '3x3@75', '2x3@65'] },
          { x: 'pullup', s: '3x8', e: 'Clean reps', rest: 90 },
          { x: 'seateddb', s: '3x8', e: 'RPE 7', rest: 90 },
          { x: 'neck', s: '3x12', e: 'Light', rest: 45 },
        ] },
        wed: { title: 'Drive Day', kind: 'cond', min: 40, warm: 'speed', note: 'Go early or late in the day. Water before, during and after. Stop if dizzy, confused, or the headache will not quit.', items: [
          { x: 'start3', s: '6x5yd', rest: 40 },
          { x: 'kickslide', s: '4x5yd', rest: 40 },
          { x: 'drive', s: '2x16plays', rest: 240 },
          { x: 'mobility', s: '1x10min' },
        ] },
        thu: { title: 'Pull Hold', kind: 'lift', min: 55, warm: 'lower', items: [
          { x: 'clean', base: 'clean', rest: 150, s: ['4x2@80', '3x2@85', '3x2@65', null, '3x2@70', '2x2@60'] },
          { x: 'deadlift', base: 'deadlift', rest: 210, s: ['3x3@85', '2x2@90', '2x3@70', null, '2x3@75', '2x2@65'] },
          { x: 'sledpush', s: '4x15yd', rest: 75 },
        ] },
        fri: { title: 'Shoulders + Arms', kind: 'lift', min: 55, warm: 'upper', items: [
          { x: 'press', base: 'press', rest: 180, s: ['4x3@85', '3x2@90', '3x3@70', null, '3x3@75', '2x3@65'] },
          { x: 'laterals', s: '3x15', e: 'RPE 7', rest: 45 },
          ...armWork(['3x10', '3x10', '3x10', null, '3x10', '2x10'], ['2x12', '2x12', '2x12', null, '2x12', null], ['2x15', '2x15', '2x15', null, '2x15', null], [true, true, false, false, false, false]),
          { x: 'neck', s: '3x12', e: 'Light', rest: 45 },
        ] },
        sat: { title: 'Two-Minute Drill', kind: 'cond', min: 40, warm: 'speed', note: 'Same heat rules as Drive Day. Hard, short, and done.', items: [
          { x: 'twomin', s: '3x1drill', rest: 180 },
          { x: 'sledsprint', s: '4x15yd', rest: 75 },
          { x: 'mobility', s: '1x10min' },
        ] },
      },
      override: {
        36: testWeek(fullTesting),
        38: { sat: easyDay },
      },
    },
  ];

  const WEEK_NOTES = {
    1: 'Heavier start than a normal first week, so stay smooth. Get every rep perfect and do not chase extra weight yet.',
    2: 'Saturday: run the 10-yard, shuttle, vertical and broad once for a baseline if you can. Log them under Progress.',
    3: 'Thanksgiving is Thursday. Lift Wednesday instead, skip the speed session, and eat.',
    7: "Lighter week before the first max-out. Christmas is Friday, so move Friday's session to Saturday.",
    8: "First max-out week, during Christmas break. New Year's Day is Friday, so move the press max to Saturday if needed.",
    14: 'Max-out week. Sleep and eat like it matters. New maxes reset every weight in the plan.',
    20: 'Max-out week. This one comes off the heaviest block of the year.',
    23: 'College coaches are often at high schools in April and May. Be early, be in the weight room, look the part.',
    26: 'Max-out week. These are the numbers for camp season.',
    27: 'Camp season. On any camp week, skip Saturday and drop the Thursday deadlift.',
    32: 'Max-out week. If a camp lands this week, move the test to the next open week.',
    33: 'Summer heat. Get the running done early or late and drink water all day.',
    36: 'Final max-out week. Last set of numbers before senior year.',
    38: 'Taper week. Fresh legs for camp. Nothing here should be hard.',
  };

  const RULES = [
    ['Get cleared first', 'Get an OK from a doctor or athletic trainer before heavy lifting, especially with anything nagging from the season.'],
    ['Leave one in the tank', 'No grinding to failure on big lifts. On "+" sets, stop one rep short. The only sets that go to failure are the arm sets the plan marks.'],
    ['Know the danger signs', 'Dark or cola-colored urine, or an arm that is badly swollen or will not straighten after a hard session, means go to the ER right away. Extreme high-rep work can cause rhabdo, a dangerous muscle breakdown.'],
    ['Always use a spotter', 'Spotter on every squat and bench set over 80%. Safety bars set for every squat.'],
    ['Form beats weight', 'If the form breaks down, the weight comes down. No exceptions, even on max days.'],
    ['Pain is a stop sign', 'Sharp pain means stop and tell an adult. Low-back pain lasting more than a week needs a doctor, because teens who lift heavy can get stress fractures there.'],
    ['Missed a day', 'Do it the next day and drop the next Wed or Sat session. Never do two lifts in one day to catch up.'],
    ['Nothing banned, ever', 'No steroids, SARMs, or "test boosters." They are dangerous at 17 and can end a career. Run any supplement by a doctor first.'],
  ];

  const RECRUIT = [
    ['film', 'Cut a highlight film from this season, best 5 plays first'],
    ['ncaa', 'Register with the NCAA Eligibility Center'],
    ['grades', 'Check core classes and GPA with the school counselor'],
    ['list', 'Build a list of 15-20 target schools at a realistic level'],
    ['coachref', 'Ask the head coach to call or email those programs'],
    ['reachout', 'Send film and verified numbers to position coaches'],
    ['camps', 'Sign up for June camps at top schools'],
    ['measure', 'Get measured height and weight at a camp'],
  ];

  const parseGroup = (g) => {
    const m = /^(\d+)x(\d+)([a-z/]*)(\+?)(?:@([\d.]+))?$/.exec(g.trim());
    if (!m) throw new Error('Bad scheme: ' + g);
    return { sets: +m[1], reps: +m[2], unit: m[3], amrap: m[4] === '+', pct: m[5] ? +m[5] : null };
  };
  const round5 = (n) => Math.round(n / 5) * 5;

  const phaseOf = (w) => PHASES.find(p => w >= p.from && w <= p.to);
  const isDeload = (w) => { const p = phaseOf(w); return !!(p && p.deload && p.deload.includes(w)); };
  const isTest = (w) => { const p = phaseOf(w); return !!(p && p.test === w); };

  /* Builds one day's session. maxes = {squat, bench, deadlift, clean} */
  function session(w, d, maxes) {
    const p = phaseOf(w);
    if (!p) return null;
    const over = p.override && p.override[w] && p.override[w][d];
    const tpl = d === 'sun' ? REST_DAY : (over || p.days[d] || REST_DAY);
    const deload = isDeload(w);
    if (deload && d === 'sat') return { ...REST_DAY, note: 'Deload week. No Saturday session. Take a walk, stretch and eat.', items: [], w, d, phase: p };
    const idx = w - p.from;
    const items = [];
    for (const it of tpl.items) {
      const s = Array.isArray(it.s) ? it.s[idx] : it.s;
      if (it.metric) { items.push({ ...EX[it.x], key: it.metric, metric: it.metric, mode: 'metric', n: METRICS[it.metric].n, sets: [], rest: 0 }); continue; }
      if (s == null) continue;
      const groups = s.split(',').map(parseGroup);
      if (deload && !it.base) groups.forEach(g => { g.sets = Math.max(2, g.sets - 1); });
      const sets = [];
      for (const g of groups) {
        const load = (it.base && g.pct != null) ? round5(maxes[it.base] * g.pct / 100) : null;
        for (let i = 0; i < g.sets; i++) sets.push({ reps: g.reps, unit: g.unit, amrap: g.amrap, pct: g.pct, load });
      }
      const u = groups[0].unit;
      const timed = /^(yd|min|sec|plays|rep|drill|trips)$/.test(u) || ['boxjump', 'broadjump', 'mbchest', 'mbscoop'].includes(it.x);
      items.push({
        key: it.x, n: EX[it.x].n, cue: EX[it.x].cue, note: (Array.isArray(it.note) ? it.note[idx] : it.note) || '', effort: it.e || '',
        base: it.base || null, main: !!LIFTS[it.x] || !!it.big, test: !!it.test, noPlates: !!it.noPlates,
        mode: timed ? 'tick' : 'load', rest: it.rest || 0, sets, groups,
      });
    }
    return { title: tpl.title, kind: tpl.kind, min: tpl.min, note: tpl.note || '', warm: WU[tpl.warm] || [], items, w, d, phase: p, deload };
  }

  const api = { START, WEEKS, DAYS, DAY_NAME, LIFTS, METRICS, EX, PHASES, WEEK_NOTES, RULES, RECRUIT, phaseOf, isDeload, isTest, session, round5 };
  if (typeof module !== 'undefined') module.exports = api;
  root.PROGRAM = api;
})(typeof window !== 'undefined' ? window : globalThis);
