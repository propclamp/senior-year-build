/* Senior Year Build: the 38-week offseason, lineman track.
   Everything here is the plan itself. His numbers and logs live in the database, never in this file.
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
    measure: { n: 'Testing', cue: 'Full rest between attempts. Record the best one.' },
  };

  const WU = {
    lower: ['Bike or jump rope, 3 min', '90/90 hip switches, 8 per side', "World's greatest stretch, 5 per side", 'Goblet squat holds, 3 x 20 sec', 'Glute bridges, 15'],
    upper: ['Jump rope, 3 min', 'Band pull-aparts, 25', 'Scap push-ups, 12', 'Wall slides, 10', 'Band shoulder pass-throughs, 10'],
    speed: ['Light jog, 2 min', 'Leg swings, 10 each way', 'A-skips, 2 x 20 yards', 'High knees, 2 x 15 yards', 'Build-up runs, 3 x 20 yards at 70%'],
  };

  const TEST = '1x5@40,1x3@60,1x2@75,1x1@85,1x1@92.5,1x1@97.5,1x1@102.5';
  const REST_DAY = { title: 'Rest', kind: 'rest', min: 0, note: 'Full day off. Eat all your meals, get to bed early, and stay off your feet when you can.', items: [] };

  const testDay = (lifts, title) => ({
    title, kind: 'test', min: 75, warm: 'lower',
    note: 'Max day. Two spotters on squat and bench. Skip the last single if 97.5% was slow. Never miss a rep.',
    items: lifts.map(l => ({ x: l, base: l, s: TEST, rest: 240, test: true })),
  });
  const measureDay = (metrics) => ({
    title: 'Testing Day', kind: 'measure', min: 50, warm: 'speed',
    note: 'Measure the same way every time: same surface, same shoes, and a hand timer run by the same person.',
    items: metrics.map(m => ({ x: 'measure', metric: m })),
  });
  const rep225 = {
    title: '225 Test + Light Upper', kind: 'measure', min: 45, warm: 'upper',
    note: 'Fresh chest, one all-out set of 225 with a spotter. Then light pump work.',
    items: [
      { x: 'bars225', metric: 'reps225' },
      { x: 'csrow', s: '3x12', e: 'Easy' },
      { x: 'facepull', s: '3x15', e: 'Easy' },
      { x: 'neck', s: '2x15', e: 'Light' },
    ],
  };
  const easyDay = {
    title: 'Mobility + Easy Move', kind: 'speed', min: 25,
    note: 'Keep this one light. The goal is to walk out feeling better than you walked in.',
    items: [{ x: 'mobility', s: '1x12min' }, { x: 'bike', s: '1x15min' }],
  };

  const PHASES = [
    {
      id: 'reset', name: 'Reset', from: 1, to: 2, color: 'white',
      goal: 'Heal up from the season and get back in position.',
      why: 'A full season beats up the joints. Two lighter weeks now buys months of heavy lifting later.',
      days: {
        mon: { title: 'Lower', kind: 'lift', min: 60, warm: 'lower', items: [
          { x: 'squat', base: 'squat', s: ['3x8@60', '3x8@65'], rest: 120, note: '3 seconds down on every rep.' },
          { x: 'rdl', base: 'deadlift', s: ['3x10@45', '3x10@50'], rest: 90 },
          { x: 'lunge', s: '3x10/leg', e: 'Bodyweight or light', rest: 75 },
          { x: 'legcurl', s: '3x12', e: 'RPE 7', rest: 60 },
          { x: 'pallof', s: '3x10/side', e: 'Light', rest: 45 },
        ] },
        tue: { title: 'Upper', kind: 'lift', min: 60, warm: 'upper', items: [
          { x: 'bench', base: 'bench', s: ['3x8@60', '3x8@65'], rest: 120, note: 'Pause on the chest for one count.' },
          { x: 'csrow', s: '4x10', e: 'RPE 7', rest: 75 },
          { x: 'inclinedb', s: '3x10', e: 'RPE 7', rest: 75 },
          { x: 'pullup', s: '3x6', e: 'Clean reps', rest: 90 },
          { x: 'facepull', s: '3x15', e: 'Light', rest: 45 },
          { x: 'neck', s: '2x15', e: 'Light', rest: 45 },
        ] },
        wed: { title: 'Move', kind: 'speed', min: 30, items: [
          { x: 'mobility', s: '1x15min' },
          { x: 'sledwalk', s: '6x20yd', rest: 45 },
        ] },
        thu: { title: 'Lower Pull', kind: 'lift', min: 60, warm: 'lower', items: [
          { x: 'clean', base: 'clean', s: ['4x3@50', '4x3@55'], rest: 90, note: 'Technique only. Every rep crisp.' },
          { x: 'deadlift', base: 'deadlift', s: ['3x5@60', '3x5@65'], rest: 120 },
          { x: 'frontsquat', base: 'squat', s: ['3x8@45', '3x8@50'], rest: 90 },
          { x: 'backext', s: '3x12', e: 'Bodyweight', rest: 60 },
          { x: 'farmer', s: '3x40yd', rest: 60 },
        ] },
        fri: { title: 'Upper Build', kind: 'lift', min: 55, warm: 'upper', items: [
          { x: 'incline', base: 'bench', s: ['3x8@50', '3x8@55'], rest: 90 },
          { x: 'dbrow', s: '3x10/side', e: 'RPE 7', rest: 60 },
          { x: 'dbpress', s: '3x10', e: 'RPE 7', rest: 75 },
          { x: 'curl', s: '3x12', e: 'RPE 7', rest: 45 },
          { x: 'pushdown', s: '3x12', e: 'RPE 7', rest: 45 },
          { x: 'neck', s: '2x15', e: 'Light', rest: 45 },
        ] },
        sat: { title: 'Easy Conditioning', kind: 'cond', min: 30, items: [
          { x: 'sledwalk', s: '6x30yd', rest: 60 },
          { x: 'farmer', s: '3x40yd', rest: 60 },
          { x: 'bike', s: '1x15min' },
        ] },
      },
    },
    {
      id: 'mass', name: 'Mass', from: 3, to: 10, color: 'blue', deload: [6, 10],
      goal: 'Put on size. Highest volume of the year.',
      why: 'New muscle carries into every other phase. Two 4-week waves, each ending in a lighter week.',
      days: {
        mon: { title: 'Lower Heavy', kind: 'lift', min: 75, warm: 'lower', items: [
          { x: 'squat', base: 'squat', rest: 180, s: ['4x8@67.5', '4x8@70', '3x6@75,1x6+@75', '3x5@60', '4x8@70', '5x6@75', '3x5@77.5,1x5+@77.5', '3x5@60'] },
          { x: 'rdl', base: 'deadlift', rest: 120, s: ['4x8@55', '4x8@57.5', '4x8@60', '2x8@45', '4x8@57.5', '4x8@60', '4x8@62.5', '2x8@45'] },
          { x: 'bulgarian', s: '3x10/leg', e: 'RPE 8', rest: 90 },
          { x: 'legpress', s: '3x15', e: 'RPE 8', rest: 90 },
          { x: 'legcurl', s: '4x12', e: 'RPE 8', rest: 60 },
          { x: 'abwheel', s: '3x12', e: 'Clean reps', rest: 45 },
        ] },
        tue: { title: 'Upper Heavy', kind: 'lift', min: 75, warm: 'upper', items: [
          { x: 'bench', base: 'bench', rest: 180, s: ['4x8@67.5', '4x8@70', '3x6@75,1x6+@75', '3x5@60', '4x8@70', '5x6@75', '3x5@77.5,1x5+@77.5', '3x5@60'] },
          { x: 'wpullup', s: '4x8', e: 'RPE 8', rest: 120 },
          { x: 'inclinedb', s: '4x10', e: 'RPE 8', rest: 90 },
          { x: 'csrow', s: '4x12', e: 'RPE 8', rest: 75 },
          { x: 'laterals', s: '3x15', e: 'RPE 8', rest: 45 },
          { x: 'neck', s: '3x15', e: 'Light', rest: 45 },
        ] },
        wed: { title: 'First Step', kind: 'speed', min: 35, warm: 'speed', items: [
          { x: 'start3', s: '6x5yd', rest: 40 },
          { x: 'mbchest', s: '3x5', rest: 60 },
          { x: 'boxjump', s: '3x4', rest: 75 },
          { x: 'mobility', s: '1x10min' },
        ] },
        thu: { title: 'Lower Power', kind: 'lift', min: 75, warm: 'lower', items: [
          { x: 'clean', base: 'clean', rest: 120, s: ['5x3@60', '5x3@65', '5x3@67.5', '3x3@55', '5x3@67.5', '5x3@70', '5x2@72.5', '3x2@55'] },
          { x: 'deadlift', base: 'deadlift', rest: 180, s: ['4x5@70', '4x5@72.5', '5x4@75', '3x3@60', '4x5@72.5', '5x4@77.5', '5x3@80', '3x3@60'] },
          { x: 'frontsquat', base: 'squat', rest: 120, s: ['3x8@55', '3x8@57.5', '3x8@60', '2x6@45', '3x8@57.5', '3x8@60', '3x8@62.5', '2x6@45'] },
          { x: 'ghr', s: '3x10', e: 'Clean reps', rest: 75 },
          { x: 'sledpush', s: '4x20yd', rest: 75 },
          { x: 'legraise', s: '3x12', e: 'Clean reps', rest: 45 },
        ] },
        fri: { title: 'Upper Volume', kind: 'lift', min: 70, warm: 'upper', items: [
          { x: 'incline', base: 'bench', rest: 120, s: ['4x8@60', '4x8@62.5', '4x8@65', '3x6@50', '4x8@62.5', '4x8@65', '4x8@67.5', '3x6@50'] },
          { x: 'bbrow', s: '4x8', e: 'RPE 8', rest: 90 },
          { x: 'dips', s: '3x12', e: 'RPE 8', rest: 75 },
          { x: 'shrug', s: '4x12', e: 'RPE 8', rest: 60 },
          { x: 'curl', s: '4x12', e: 'RPE 8', rest: 45 },
          { x: 'pushdown', s: '4x12', e: 'RPE 8', rest: 45 },
          { x: 'neck', s: '3x15', e: 'Light', rest: 45 },
        ] },
        sat: { title: 'Sled Day', kind: 'cond', min: 30, items: [
          { x: 'sledpush', s: '8x15yd', rest: 60 },
          { x: 'farmer', s: '4x40yd', rest: 75 },
          { x: 'sleddrag', s: '4x30yd', rest: 60 },
        ] },
      },
    },
    {
      id: 'strength', name: 'Strength', from: 11, to: 14, color: 'yellow',
      test: 14,
      goal: 'Turn the new muscle into strength. First test in Week 14.',
      why: 'Reps come down and weight goes up. Week 14 sets new maxes, and every number in the plan moves up with them.',
      days: {
        mon: { title: 'Lower Heavy', kind: 'lift', min: 75, warm: 'lower', items: [
          { x: 'squat', base: 'squat', rest: 210, s: ['5x5@77.5', '5x4@80', '3x3@85,1x3+@85'] },
          { x: 'rdl', base: 'deadlift', rest: 120, s: ['3x6@65', '3x6@67.5', '3x6@70'] },
          { x: 'bulgarian', s: '3x8/leg', e: 'RPE 8', rest: 90 },
          { x: 'legcurl', s: '3x10', e: 'RPE 8', rest: 60 },
          { x: 'abwheel', s: '3x12', e: 'Clean reps', rest: 45 },
        ] },
        tue: { title: 'Upper Heavy', kind: 'lift', min: 75, warm: 'upper', items: [
          { x: 'bench', base: 'bench', rest: 210, s: ['5x5@77.5', '5x4@80', '3x3@85,1x3+@85'] },
          { x: 'wpullup', s: '4x6', e: 'RPE 8', rest: 120 },
          { x: 'closebench', base: 'bench', rest: 120, s: ['3x6@67.5', '3x6@70', '3x6@72.5'] },
          { x: 'csrow', s: '4x8', e: 'RPE 8', rest: 75 },
          { x: 'facepull', s: '3x15', e: 'Light', rest: 45 },
          { x: 'neck', s: '3x15', e: 'Light', rest: 45 },
        ] },
        wed: { title: 'First Step', kind: 'speed', min: 35, warm: 'speed', items: [
          { x: 'start3', s: '8x5yd', rest: 40 },
          { x: 'sledsprint', s: '6x10yd', rest: 60 },
          { x: 'mbscoop', s: '3x5', rest: 60 },
          { x: 'mobility', s: '1x10min' },
        ] },
        thu: { title: 'Lower Power', kind: 'lift', min: 75, warm: 'lower', items: [
          { x: 'clean', base: 'clean', rest: 150, s: ['5x2@75', '5x2@77.5', '4x2@80'] },
          { x: 'deadlift', base: 'deadlift', rest: 210, s: ['4x4@80', '4x3@82.5', '3x3@85'] },
          { x: 'frontsquat', base: 'squat', rest: 120, s: ['3x5@65', '3x5@67.5', '3x5@70'] },
          { x: 'ghr', s: '3x10', e: 'Clean reps', rest: 75 },
          { x: 'sledpush', s: '4x20yd', rest: 75 },
        ] },
        fri: { title: 'Upper Build', kind: 'lift', min: 65, warm: 'upper', items: [
          { x: 'incline', base: 'bench', rest: 150, s: ['4x6@70', '4x6@72.5', '4x5@75'] },
          { x: 'bbrow', s: '4x8', e: 'RPE 8', rest: 90 },
          { x: 'dips', s: '3x8', e: 'Add weight', rest: 90 },
          { x: 'shrug', s: '4x10', e: 'RPE 8', rest: 60 },
          { x: 'curl', s: '3x10', e: 'RPE 8', rest: 45 },
          { x: 'wrist', s: '3x2trips', e: 'Light', rest: 45 },
          { x: 'neck', s: '3x15', e: 'Light', rest: 45 },
        ] },
        sat: { title: 'Sled Day', kind: 'cond', min: 30, items: [
          { x: 'sledpush', s: '8x15yd', rest: 60 },
          { x: 'farmer', s: '4x40yd', rest: 75 },
          { x: 'pinch', s: '3x30sec', rest: 45 },
        ] },
      },
      override: {
        14: {
          mon: testDay(['squat'], 'Squat Max'),
          tue: testDay(['bench'], 'Bench Max'),
          wed: easyDay,
          thu: testDay(['clean', 'deadlift'], 'Clean + Deadlift Max'),
          fri: rep225,
          sat: measureDay(['ten', 'forty', 'shuttle', 'vertical', 'broad']),
        },
      },
    },
    {
      id: 'max', name: 'Max Strength', from: 15, to: 22, color: 'red', deload: [18, 22],
      goal: 'The heaviest block of the year. Build the top end.',
      why: 'Loads run 80-90% of the new maxes. Volume drops to recover from the heavy work.',
      days: {
        mon: { title: 'Lower Max', kind: 'lift', min: 75, warm: 'lower', items: [
          { x: 'squat', base: 'squat', rest: 240, s: ['5x3@82.5', '5x3@85', '2x3@87.5,1x3+@87.5', '3x3@65', '4x3@85', '4x2@87.5', '3x2@90,2x3@80', '3x3@65'] },
          { x: 'pausesquat', base: 'squat', rest: 150, s: ['3x3@70', '3x3@72.5', '3x3@75', '2x3@55', '3x3@72.5', '3x3@75', '3x3@75', '2x3@55'] },
          { x: 'rdl', base: 'deadlift', rest: 120, s: ['3x6@65', '3x6@67.5', '3x5@70', '2x6@50', '3x6@67.5', '3x5@70', '3x5@72.5', '2x6@50'] },
          { x: 'legcurl', s: '3x8', e: 'RPE 8', rest: 60 },
          { x: 'plank', s: '3x45sec', rest: 45 },
        ] },
        tue: { title: 'Upper Max', kind: 'lift', min: 75, warm: 'upper', items: [
          { x: 'bench', base: 'bench', rest: 240, s: ['5x3@82.5', '5x3@85', '2x3@87.5,1x3+@87.5', '3x3@65', '4x3@85', '4x2@87.5', '3x2@90,2x3@80', '3x3@65'] },
          { x: 'wpullup', s: '5x5', e: 'RPE 8', rest: 120 },
          { x: 'closebench', base: 'bench', rest: 150, s: ['3x5@72.5', '3x5@75', '3x4@77.5', '2x5@55', '3x5@75', '3x4@77.5', '3x4@80', '2x5@55'] },
          { x: 'csrow', s: '4x6', e: 'RPE 8', rest: 90 },
          { x: 'facepull', s: '3x15', e: 'Light', rest: 45 },
          { x: 'neck', s: '3x12', e: 'Light', rest: 45 },
        ] },
        wed: { title: 'Speed', kind: 'speed', min: 35, warm: 'speed', items: [
          { x: 'start3', s: '10x5yd', rest: 40 },
          { x: 'sledsprint', s: '6x10yd', rest: 60 },
          { x: 'broadjump', s: '3x3', rest: 75 },
          { x: 'mobility', s: '1x10min' },
        ] },
        thu: { title: 'Pull Max', kind: 'lift', min: 75, warm: 'lower', items: [
          { x: 'clean', base: 'clean', rest: 150, s: ['5x2@75', '5x2@77.5', '4x2@80', '3x2@60', '5x2@77.5', '4x2@80', '5x1@85', '3x2@60'] },
          { x: 'deadlift', base: 'deadlift', rest: 240, s: ['4x3@80', '4x3@82.5', '3x3@85', '3x2@65', '3x3@85', '3x2@87.5', '2x2@90,2x3@80', '3x2@65'] },
          { x: 'frontsquat', base: 'squat', rest: 120, s: ['3x3@70', '3x3@72.5', '3x3@75', '2x3@55', '3x3@72.5', '3x3@75', '3x3@75', '2x3@55'] },
          { x: 'ghr', s: '3x8', e: 'Clean reps', rest: 75 },
          { x: 'sledpush', s: '4x20yd', rest: 75 },
        ] },
        fri: { title: 'Upper Strength', kind: 'lift', min: 65, warm: 'upper', items: [
          { x: 'incline', base: 'bench', rest: 150, s: ['4x5@75', '4x5@77.5', '4x4@80', '3x5@60', '4x5@77.5', '4x4@80', '4x3@82.5', '3x5@60'] },
          { x: 'pushpress', base: 'bench', rest: 120, s: ['4x3@55', '4x3@57.5', '4x3@60', '2x3@45', '4x3@57.5', '4x3@60', '4x3@62.5', '2x3@45'] },
          { x: 'bbrow', s: '4x6', e: 'RPE 8', rest: 90 },
          { x: 'shrug', s: '4x8', e: 'Heavy', rest: 75 },
          { x: 'curl', s: '3x8', e: 'RPE 8', rest: 45 },
          { x: 'wrist', s: '3x2trips', e: 'Moderate', rest: 45 },
          { x: 'neck', s: '3x12', e: 'Light', rest: 45 },
        ] },
        sat: { title: 'Iron Saturday', kind: 'cond', min: 35, items: [
          { x: 'sledpush', s: '10x15yd', rest: 60 },
          { x: 'farmer', s: '5x40yd', rest: 75 },
          { x: 'pinch', s: '3x30sec', rest: 45 },
        ] },
      },
    },
    {
      id: 'power', name: 'Power', from: 23, to: 26, color: 'orange',
      test: 26,
      goal: 'Turn strength into explosion off the ball. Second test in Week 26.',
      why: 'Heavy lift, then an explosive move right after it. College coaches are often out at schools in the spring, so look the part.',
      days: {
        mon: { title: 'Lower Power', kind: 'lift', min: 70, warm: 'lower', items: [
          { x: 'squat', base: 'squat', rest: 210, s: ['4x3@80', '4x3@82.5', '3x2@87.5'] },
          { x: 'boxjump', s: '4x3', rest: 60, note: 'Do one set right after each squat set.' },
          { x: 'rdl', base: 'deadlift', rest: 120, s: ['3x5@65', '3x5@67.5', '3x5@70'] },
          { x: 'legcurl', s: '3x8', e: 'RPE 7', rest: 60 },
          { x: 'pallof', s: '3x10/side', e: 'Moderate', rest: 45 },
        ] },
        tue: { title: 'Upper Power', kind: 'lift', min: 70, warm: 'upper', items: [
          { x: 'bench', base: 'bench', rest: 210, s: ['4x3@80', '4x3@82.5', '3x2@87.5'] },
          { x: 'mbchest', s: '4x4', rest: 60, note: 'Do one set right after each bench set.' },
          { x: 'landmine', s: '3x6/side', e: 'Explosive', rest: 75 },
          { x: 'pullup', s: '4x8', e: 'Clean reps', rest: 90 },
          { x: 'csrow', s: '3x8', e: 'RPE 7', rest: 75 },
          { x: 'neck', s: '3x12', e: 'Light', rest: 45 },
        ] },
        wed: { title: 'First Step', kind: 'speed', min: 40, warm: 'speed', items: [
          { x: 'start3', s: '8x5yd', rest: 40 },
          { x: 'start10', s: '6x10yd', rest: 90 },
          { x: 'shuttledrill', s: '4x1rep', rest: 120 },
          { x: 'mobility', s: '1x10min' },
        ] },
        thu: { title: 'Pull Power', kind: 'lift', min: 70, warm: 'lower', items: [
          { x: 'clean', base: 'clean', rest: 150, s: ['5x2@80', '5x2@82.5', '4x1@87.5'] },
          { x: 'speeddead', base: 'deadlift', rest: 90, s: ['5x2@65', '5x2@67.5', '5x2@70'] },
          { x: 'broadjump', s: '4x3', rest: 75 },
          { x: 'sledsprint', s: '6x15yd', rest: 75 },
        ] },
        fri: { title: 'Upper Speed', kind: 'lift', min: 60, warm: 'upper', items: [
          { x: 'pushpress', base: 'bench', rest: 120, s: ['5x3@60', '5x3@62.5', '5x2@65'] },
          { x: 'speedbench', base: 'bench', rest: 60, s: ['6x3@55', '6x3@57.5', '6x3@60'] },
          { x: 'bbrow', s: '4x6', e: 'RPE 7', rest: 75 },
          { x: 'shrug', s: '3x8', e: 'RPE 8', rest: 60 },
          { x: 'wrist', s: '3x2trips', e: 'Moderate', rest: 45 },
          { x: 'neck', s: '3x12', e: 'Light', rest: 45 },
        ] },
        sat: { title: 'Sled + Bursts', kind: 'cond', min: 30, items: [
          { x: 'sledsprint', s: '8x15yd', rest: 60 },
          { x: 'drive', s: '1x8plays' },
          { x: 'farmer', s: '3x40yd', rest: 60 },
        ] },
      },
      override: {
        26: {
          mon: testDay(['squat'], 'Squat Max'),
          tue: testDay(['bench'], 'Bench Max'),
          wed: easyDay,
          thu: testDay(['clean', 'deadlift'], 'Clean + Deadlift Max'),
          fri: rep225,
          sat: measureDay(['ten', 'forty', 'shuttle', 'vertical', 'broad']),
        },
      },
    },
    {
      id: 'showcase', name: 'Showcase', from: 27, to: 32, color: 'green', deload: [30, 32],
      goal: 'Peak for camps. Fast, fresh, and at full strength when coaches are watching.',
      why: 'Lifts stay heavy but short. The extra energy goes to starts, shuttles and jumps. On camp weeks, skip Saturday and drop the deadlift.',
      days: {
        mon: { title: 'Lower Short', kind: 'lift', min: 55, warm: 'lower', items: [
          { x: 'squat', base: 'squat', rest: 210, s: ['4x3@80', '4x3@82.5', '3x3@85', '3x3@70', '3x2@85', '3x2@70'] },
          { x: 'boxjump', s: '3x3', rest: 60 },
          { x: 'rdl', base: 'deadlift', rest: 120, s: ['3x5@65', '3x5@65', '3x5@67.5', '2x5@50', '3x5@65', '2x5@50'] },
          { x: 'pallof', s: '3x10/side', e: 'Moderate', rest: 45 },
        ] },
        tue: { title: 'Upper Short', kind: 'lift', min: 55, warm: 'upper', items: [
          { x: 'bench', base: 'bench', rest: 210, s: ['4x3@80', '4x3@82.5', '3x3@85', '3x3@70', '3x2@85', '3x2@70'] },
          { x: 'mbchest', s: '3x4', rest: 60 },
          { x: 'pullup', s: '3x8', e: 'Clean reps', rest: 90 },
          { x: 'facepull', s: '3x15', e: 'Light', rest: 45 },
          { x: 'neck', s: '3x12', e: 'Light', rest: 45 },
        ] },
        wed: { title: 'Combine Prep', kind: 'speed', min: 45, warm: 'speed', items: [
          { x: 'start10', s: '6x10yd', rest: 90 },
          { x: 'shuttledrill', s: '4x1rep', rest: 120 },
          { x: 'broadjump', s: '3x3', rest: 90 },
          { x: 'mobility', s: '1x10min' },
        ] },
        thu: { title: 'Pull Short', kind: 'lift', min: 55, warm: 'lower', items: [
          { x: 'clean', base: 'clean', rest: 150, s: ['4x2@75', '4x2@77.5', '3x2@80', '3x2@65', '3x2@80', '3x1@70'] },
          { x: 'deadlift', base: 'deadlift', rest: 210, s: ['3x3@80', '3x3@82.5', '3x2@85', '2x3@65', '2x2@85', '2x2@65'] },
          { x: 'sledsprint', s: '6x15yd', rest: 75 },
        ] },
        fri: { title: 'Upper Pump', kind: 'lift', min: 50, warm: 'upper', items: [
          { x: 'inclinedb', s: '3x8', e: 'RPE 7', rest: 75 },
          { x: 'csrow', s: '3x10', e: 'RPE 7', rest: 75 },
          { x: 'curl', s: '3x10', e: 'RPE 7', rest: 45 },
          { x: 'pushdown', s: '3x10', e: 'RPE 7', rest: 45 },
          { x: 'neck', s: '3x12', e: 'Light', rest: 45 },
        ] },
        sat: { title: 'Bursts', kind: 'cond', min: 30, warm: 'speed', items: [
          { x: 'start3', s: '8x5yd', rest: 40 },
          { x: 'drive', s: '1x12plays' },
          { x: 'mobility', s: '1x10min' },
        ] },
      },
    },
    {
      id: 'camp', name: 'Camp Ready', from: 33, to: 38, color: 'ink',
      test: 36,
      goal: 'Football shape. Hold the strength and arrive ready for camp.',
      why: 'Conditioning takes over, built around how linemen actually play: 5-second bursts with short rest. Week 38 is a taper to show up fresh.',
      days: {
        mon: { title: 'Lower Hold', kind: 'lift', min: 55, warm: 'lower', items: [
          { x: 'squat', base: 'squat', rest: 210, s: ['4x3@80', '4x3@82.5', '3x2@87.5', null, '3x3@75', '2x3@65'] },
          { x: 'rdl', base: 'deadlift', rest: 120, s: ['3x5@62.5', '3x5@65', '3x5@65', null, '2x5@60', '2x5@50'] },
          { x: 'legcurl', s: '3x8', e: 'RPE 7', rest: 60 },
          { x: 'pallof', s: '3x10/side', e: 'Moderate', rest: 45 },
        ] },
        tue: { title: 'Upper Hold', kind: 'lift', min: 55, warm: 'upper', items: [
          { x: 'bench', base: 'bench', rest: 210, s: ['4x3@80', '4x3@82.5', '3x2@87.5', null, '3x3@75', '2x3@65'] },
          { x: 'pullup', s: '3x8', e: 'Clean reps', rest: 90 },
          { x: 'csrow', s: '3x8', e: 'RPE 7', rest: 75 },
          { x: 'neck', s: '3x12', e: 'Light', rest: 45 },
        ] },
        wed: { title: 'Drive Day', kind: 'cond', min: 40, warm: 'speed', note: 'Go early or late in the day. Water before, during and after. Stop if dizzy, confused, or the headache will not quit.', items: [
          { x: 'start3', s: '6x5yd', rest: 40 },
          { x: 'drive', s: '2x16plays', rest: 240 },
          { x: 'mobility', s: '1x10min' },
        ] },
        thu: { title: 'Pull Hold', kind: 'lift', min: 55, warm: 'lower', items: [
          { x: 'clean', base: 'clean', rest: 150, s: ['4x2@75', '4x2@77.5', '3x2@80', null, '3x2@70', '2x2@60'] },
          { x: 'deadlift', base: 'deadlift', rest: 210, s: ['3x3@80', '3x3@82.5', '2x2@87.5', null, '2x3@70', '2x2@60'] },
          { x: 'sledpush', s: '4x15yd', rest: 75 },
        ] },
        fri: { title: 'Upper Pump', kind: 'lift', min: 45, warm: 'upper', items: [
          { x: 'inclinedb', s: '3x8', e: 'RPE 7', rest: 75 },
          { x: 'dbrow', s: '3x10/side', e: 'RPE 7', rest: 60 },
          { x: 'facepull', s: '3x15', e: 'Light', rest: 45 },
          { x: 'neck', s: '3x12', e: 'Light', rest: 45 },
        ] },
        sat: { title: 'Two-Minute Drill', kind: 'cond', min: 40, warm: 'speed', note: 'Same heat rules as Drive Day. Hard, short, and done.', items: [
          { x: 'twomin', s: '3x1drill', rest: 180 },
          { x: 'sledsprint', s: '4x15yd', rest: 75 },
          { x: 'mobility', s: '1x10min' },
        ] },
      },
      override: {
        36: {
          mon: testDay(['squat'], 'Squat Max'),
          tue: testDay(['bench'], 'Bench Max'),
          wed: easyDay,
          thu: testDay(['clean', 'deadlift'], 'Clean + Deadlift Max'),
          fri: rep225,
          sat: measureDay(['ten', 'forty', 'shuttle', 'vertical', 'broad']),
        },
        38: { sat: easyDay },
      },
    },
  ];

  const WEEK_NOTES = {
    1: 'Week 1 should feel easy. That is the point. Get every rep perfect and leave the gym fresh.',
    2: 'Saturday: run the 10-yard, shuttle, vertical and broad once for a baseline if you can. Log them under Progress.',
    3: 'Thanksgiving is Thursday. Lift Wednesday instead, skip the speed session, and eat.',
    7: "Christmas is Friday. Move Friday's lift to Saturday and skip the sled. No school this week, so sleep in.",
    8: "New Year's Day is Friday. Move Friday's lift to Saturday and skip the sled.",
    14: 'Test week. Sleep and eat like it matters. New maxes reset every weight in the plan.',
    23: 'College coaches are often at high schools in April and May. Be early, be in the weight room, look the part.',
    26: 'Test week. These are the numbers for camp season.',
    27: 'Camp season. On any camp week, skip Saturday and drop the Thursday deadlift.',
    33: 'Summer heat. Get the running done early or late and drink water all day.',
    36: 'Final test week. Last set of numbers before senior year.',
    38: 'Taper week. Fresh legs for camp. Nothing here should be hard.',
  };

  const RULES = [
    ['Get cleared first', 'Get an OK from a doctor or athletic trainer before heavy lifting, especially with anything nagging from the season.'],
    ['Leave one in the tank', 'No grinding to failure. On "+" sets, stop one rep short. A missed rep teaches nothing and risks a lot.'],
    ['Always use a spotter', 'Spotter on every squat and bench set over 80%. Safety bars set for every squat.'],
    ['Form beats weight', 'If the form breaks down, the weight comes down. No exceptions, even on test days.'],
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
      let s = Array.isArray(it.s) ? it.s[idx] : it.s;
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
        key: it.x, n: EX[it.x].n, cue: EX[it.x].cue, note: it.note || '', effort: it.e || '',
        base: it.base || null, main: !!LIFTS[it.x], test: !!it.test,
        mode: timed ? 'tick' : 'load', rest: it.rest || 0, sets, groups,
      });
    }
    return { title: tpl.title, kind: tpl.kind, min: tpl.min, note: tpl.note || '', warm: WU[tpl.warm] || [], items, w, d, phase: p, deload };
  }

  const api = { START, WEEKS, DAYS, DAY_NAME, LIFTS, METRICS, EX, PHASES, WEEK_NOTES, RULES, RECRUIT, phaseOf, isDeload, isTest, session, round5 };
  if (typeof module !== 'undefined') module.exports = api;
  root.PROGRAM = api;
})(typeof window !== 'undefined' ? window : globalThis);
