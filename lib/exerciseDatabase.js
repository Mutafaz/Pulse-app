export const SEED_DATABASE = [
  // ─── CHEST ───────────────────────────────────────────────────────────────
  {
    id: 'barbell-bench-press',
    name: 'Barbell Bench Press',
    primaryMuscle: 'chest',
    tags: ['compound', 'push', 'chest', 'triceps', 'shoulders', 'barbell'],
    equipment: 'barbell',
    mediaUrl: null,
    instructions: [
      'Lie flat on a bench with your eyes under the bar.',
      'Grip the bar slightly wider than shoulder-width.',
      'Unrack the bar and hold it directly over your chest.',
      'Lower the bar slowly to your mid-chest, keeping elbows at ~75 degrees.',
      'Press explosively back up to full arm extension.'
    ],
    hints: [
      'Drive your feet into the floor for stability.',
      'Keep your shoulder blades retracted and depressed throughout.',
      'Avoid flaring elbows out to 90 degrees — this stresses the shoulder joint.'
    ]
  },
  {
    id: 'incline-dumbbell-press',
    name: 'Incline Dumbbell Press',
    primaryMuscle: 'chest',
    tags: ['compound', 'push', 'chest', 'triceps', 'shoulders', 'dumbbell'],
    equipment: 'dumbbell',
    mediaUrl: null,
    instructions: [
      'Set an adjustable bench to 30–45 degrees incline.',
      'Sit back with a dumbbell in each hand resting on your thighs.',
      'Kick the dumbbells up and lie back, pressing them to shoulder height.',
      'Press both dumbbells upward until arms are fully extended.',
      'Lower slowly with control back to the start position.'
    ],
    hints: [
      'A steeper incline shifts emphasis higher up onto the upper chest.',
      'Keep the dumbbells in line with your lower chest, not your face.',
      'Squeeze your chest at the top of each rep.'
    ]
  },
  {
    id: 'cable-fly',
    name: 'Cable Fly',
    primaryMuscle: 'chest',
    tags: ['isolation', 'push', 'chest', 'cable'],
    equipment: 'cable',
    mediaUrl: null,
    instructions: [
      'Set dual cables to chest height (or high pulley for low cable fly).',
      'Stand in the center, grab one handle in each hand.',
      'Step forward slightly so there is tension on the cables.',
      'Bring both handles together in a wide arc in front of your chest.',
      'Slowly return to the start position, feeling a stretch in the pecs.'
    ],
    hints: [
      'Maintain a slight bend in your elbows throughout the movement.',
      'Focus on squeezing your chest together, not your arms.',
      'Control the eccentric (return) phase for maximum stretch.'
    ]
  },
  {
    id: 'dumbbell-fly',
    name: 'Dumbbell Fly',
    primaryMuscle: 'chest',
    tags: ['isolation', 'push', 'chest', 'dumbbell'],
    equipment: 'dumbbell',
    mediaUrl: null,
    instructions: [
      'Lie flat on a bench holding a dumbbell in each hand above your chest.',
      'With a slight bend in the elbows, lower the dumbbells in a wide arc.',
      'Feel a deep stretch at the bottom without touching the bench.',
      'Squeeze the chest and bring the dumbbells back up along the same arc.'
    ],
    hints: [
      'This is a stretch-focused movement — keep the weight moderate.',
      'Do not lock your elbows; the bend should remain constant throughout.'
    ]
  },
  {
    id: 'push-up',
    name: 'Push-Up',
    primaryMuscle: 'chest',
    tags: ['compound', 'push', 'chest', 'triceps', 'shoulders', 'bodyweight'],
    equipment: 'bodyweight',
    mediaUrl: null,
    instructions: [
      'Start in a high plank position with hands slightly wider than shoulder-width.',
      'Keep your body in a straight line from head to heels.',
      'Bend your elbows and lower your chest to just above the floor.',
      'Push forcefully back up to the starting position.'
    ],
    hints: [
      'Squeeze your glutes and core to keep your hips from sagging.',
      'Look slightly ahead, not straight down, to maintain neutral spine.'
    ]
  },

  // ─── LATS ─────────────────────────────────────────────────────────────────
  {
    id: 'pull-up',
    name: 'Pull-Up',
    primaryMuscle: 'lats',
    tags: ['compound', 'pull', 'lats', 'biceps', 'bodyweight'],
    equipment: 'bodyweight',
    mediaUrl: null,
    instructions: [
      'Hang from a pull-up bar with an overhand grip, hands slightly wider than shoulders.',
      'Engage your core and depress your shoulder blades.',
      'Pull your chest toward the bar by driving your elbows down and back.',
      'Lower yourself under control until arms are fully extended.'
    ],
    hints: [
      'Initiate the movement by retracting the scapulae before bending the elbows.',
      'Avoid kipping or swinging — keep the movement strict for muscle development.'
    ]
  },
  {
    id: 'lat-pulldown',
    name: 'Lat Pulldown',
    primaryMuscle: 'lats',
    tags: ['compound', 'pull', 'lats', 'biceps', 'cable'],
    equipment: 'cable',
    mediaUrl: null,
    instructions: [
      'Sit at a lat pulldown machine and secure your thighs under the pad.',
      'Grip the bar wider than shoulder-width with an overhand grip.',
      'Lean back slightly and pull the bar down to your upper chest.',
      'Squeeze your lats at the bottom, then slowly return to the start.'
    ],
    hints: [
      'Drive your elbows toward your hips — think of them as hooks.',
      'Avoid pulling behind the neck; it strains the cervical spine.'
    ]
  },
  {
    id: 'seated-cable-row',
    name: 'Seated Cable Row',
    primaryMuscle: 'lats',
    tags: ['compound', 'pull', 'lats', 'traps', 'biceps', 'cable'],
    equipment: 'cable',
    mediaUrl: null,
    instructions: [
      'Sit at a cable row machine and place feet on the platform.',
      'Grip the handle with both hands, keeping your back straight.',
      'Pull the handle into your lower abdomen, squeezing your shoulder blades together.',
      'Return to the start position with full arm extension.'
    ],
    hints: [
      'Do not round the lower back — keep a slight natural arch.',
      'Pause and squeeze for one second at peak contraction.'
    ]
  },
  {
    id: 'barbell-row',
    name: 'Barbell Bent-Over Row',
    primaryMuscle: 'lats',
    tags: ['compound', 'pull', 'lats', 'traps', 'biceps', 'barbell'],
    equipment: 'barbell',
    mediaUrl: null,
    instructions: [
      'Stand with feet hip-width apart, hinge at the hips to about 45 degrees.',
      'Grip the barbell with an overhand or underhand grip, hands shoulder-width apart.',
      'Pull the bar to your lower chest/upper abdomen, squeezing shoulder blades.',
      'Lower the bar with control back to the start.'
    ],
    hints: [
      'Keep your chest up and core braced throughout the movement.',
      'A slight knee bend keeps tension off the lower back.'
    ]
  },
  {
    id: 'single-arm-dumbbell-row',
    name: 'Single-Arm Dumbbell Row',
    primaryMuscle: 'lats',
    tags: ['compound', 'pull', 'lats', 'biceps', 'dumbbell'],
    equipment: 'dumbbell',
    mediaUrl: null,
    instructions: [
      'Place one knee and same-side hand on a bench for support.',
      'Hold a dumbbell in the opposite hand, arm hanging down.',
      'Pull the dumbbell up toward your hip, elbow driving back.',
      'Lower the weight back down with control.'
    ],
    hints: [
      'Think of your arm as a hook — let your lat do the pulling.',
      'Keep your spine parallel to the floor throughout.'
    ]
  },

  // ─── TRAPS ────────────────────────────────────────────────────────────────
  {
    id: 'barbell-shrug',
    name: 'Barbell Shrug',
    primaryMuscle: 'traps',
    tags: ['isolation', 'traps', 'barbell'],
    equipment: 'barbell',
    mediaUrl: null,
    instructions: [
      'Stand holding a barbell in front of you with an overhand grip.',
      'Keep arms straight and shrug your shoulders straight up toward your ears.',
      'Hold briefly at the top, then lower slowly.'
    ],
    hints: [
      'Do not roll your shoulders — straight up and down only.',
      'A slight pause at the top increases time under tension.'
    ]
  },
  {
    id: 'face-pull',
    name: 'Face Pull',
    primaryMuscle: 'traps',
    tags: ['isolation', 'pull', 'traps', 'shoulders', 'cable'],
    equipment: 'cable',
    mediaUrl: null,
    instructions: [
      'Set a cable machine to face height with a rope attachment.',
      'Grip the rope with both hands and step back from the machine.',
      'Pull the rope toward your face, flaring elbows out to the sides.',
      'At peak contraction, externally rotate the shoulders and squeeze.',
      'Return slowly to the start.'
    ],
    hints: [
      'This movement is excellent for shoulder health and rear delt development.',
      'Keep your elbows at or above shoulder height throughout.'
    ]
  },

  // ─── SHOULDERS ────────────────────────────────────────────────────────────
  {
    id: 'overhead-press',
    name: 'Barbell Overhead Press',
    primaryMuscle: 'shoulders',
    tags: ['compound', 'push', 'shoulders', 'triceps', 'barbell'],
    equipment: 'barbell',
    mediaUrl: null,
    instructions: [
      'Stand with feet shoulder-width apart and grip the barbell at shoulder height.',
      'Press the bar directly overhead until your arms are fully extended.',
      'Lower the bar back to shoulder height with control.'
    ],
    hints: [
      'Brace your abs hard — avoid excessive lower back arching.',
      'The bar should travel in a straight vertical path close to your face.'
    ]
  },
  {
    id: 'dumbbell-lateral-raise',
    name: 'Dumbbell Lateral Raise',
    primaryMuscle: 'shoulders',
    tags: ['isolation', 'push', 'shoulders', 'dumbbell'],
    equipment: 'dumbbell',
    mediaUrl: null,
    instructions: [
      'Stand holding a dumbbell in each hand at your sides.',
      'With a slight bend in the elbows, raise both arms out to the sides.',
      'Lift until arms are parallel to the floor (shoulder height).',
      'Slowly lower back to the starting position.'
    ],
    hints: [
      'Lead with your elbows, not your hands.',
      'Use lighter weight and avoid swinging for strict form.'
    ]
  },
  {
    id: 'arnold-press',
    name: 'Arnold Press',
    primaryMuscle: 'shoulders',
    tags: ['compound', 'push', 'shoulders', 'triceps', 'dumbbell'],
    equipment: 'dumbbell',
    mediaUrl: null,
    instructions: [
      'Sit on a bench holding dumbbells at shoulder height, palms facing you.',
      'As you press up, rotate your palms outward so they face away at the top.',
      'Fully extend your arms overhead.',
      'Reverse the rotation as you lower back to the start position.'
    ],
    hints: [
      'The rotation engages all three heads of the deltoid.',
      'Keep core tight to avoid lower back strain when pressing.'
    ]
  },
  {
    id: 'rear-delt-fly',
    name: 'Rear Delt Fly',
    primaryMuscle: 'shoulders',
    tags: ['isolation', 'pull', 'shoulders', 'traps', 'dumbbell'],
    equipment: 'dumbbell',
    mediaUrl: null,
    instructions: [
      'Sit at the edge of a bench, hinge forward so your chest nearly touches your thighs.',
      'Hold a dumbbell in each hand hanging under you.',
      'Raise both arms out to the sides until they are parallel with the floor.',
      'Lower slowly back to the starting position.'
    ],
    hints: [
      'Maintain a neutral wrist — avoid bending the wrists during the movement.',
      'Think about pinching your shoulder blades together at the top.'
    ]
  },

  // ─── BICEPS ───────────────────────────────────────────────────────────────
  {
    id: 'barbell-curl',
    name: 'Barbell Curl',
    primaryMuscle: 'biceps',
    tags: ['isolation', 'pull', 'biceps', 'forearms', 'barbell'],
    equipment: 'barbell',
    mediaUrl: null,
    instructions: [
      'Stand holding a barbell with an underhand grip at hip level.',
      'Keep your upper arms stationary at your sides.',
      'Curl the bar upward until your biceps are fully contracted.',
      'Lower under control back to the starting position.'
    ],
    hints: [
      'Avoid rocking your torso back — keep the movement strict.',
      'Squeeze at the top for maximum bicep activation.'
    ]
  },
  {
    id: 'incline-dumbbell-curl',
    name: 'Incline Dumbbell Curl',
    primaryMuscle: 'biceps',
    tags: ['isolation', 'pull', 'biceps', 'dumbbell'],
    equipment: 'dumbbell',
    mediaUrl: null,
    instructions: [
      'Set a bench to 60-degree incline, sit back with a dumbbell in each hand.',
      'Let your arms hang fully extended with a supinated grip.',
      'Curl both dumbbells up simultaneously, keeping upper arms stationary.',
      'Lower slowly to full extension.'
    ],
    hints: [
      'The incline stretches the long head of the bicep for a greater range of motion.',
      'Do not allow the elbows to drift forward during the curl.'
    ]
  },
  {
    id: 'hammer-curl',
    name: 'Hammer Curl',
    primaryMuscle: 'biceps',
    tags: ['isolation', 'pull', 'biceps', 'forearms', 'dumbbell'],
    equipment: 'dumbbell',
    mediaUrl: null,
    instructions: [
      'Stand holding dumbbells at your sides with a neutral (hammer) grip.',
      'Curl both dumbbells upward without rotating your wrists.',
      'Squeeze at the top, then lower back down slowly.'
    ],
    hints: [
      'Neutral grip targets the brachialis and brachioradialis more than supinated curls.',
      'Keep your upper arms pinned to your sides.'
    ]
  },

  // ─── TRICEPS ──────────────────────────────────────────────────────────────
  {
    id: 'tricep-pushdown',
    name: 'Tricep Pushdown',
    primaryMuscle: 'triceps',
    tags: ['isolation', 'push', 'triceps', 'cable'],
    equipment: 'cable',
    mediaUrl: null,
    instructions: [
      'Attach a rope or bar to a high cable pulley.',
      'Grip the attachment with both hands, elbows at your sides.',
      'Push the attachment downward until your arms are fully extended.',
      'Slowly return to the start position with control.'
    ],
    hints: [
      'Keep your elbows pinned to your sides — do not let them flare out.',
      'For the rope: flare your wrists out at the bottom for full extension.'
    ]
  },
  {
    id: 'overhead-tricep-extension',
    name: 'Overhead Tricep Extension',
    primaryMuscle: 'triceps',
    tags: ['isolation', 'push', 'triceps', 'dumbbell'],
    equipment: 'dumbbell',
    mediaUrl: null,
    instructions: [
      'Sit or stand holding one dumbbell with both hands overhead.',
      'Keep upper arms close to your head and lower the dumbbell behind your head.',
      'Extend your arms back to the overhead starting position.'
    ],
    hints: [
      'This movement stretches the long head of the tricep — do not skip it.',
      'Keep your core braced to avoid arching the lower back.'
    ]
  },
  {
    id: 'skull-crusher',
    name: 'Skull Crusher',
    primaryMuscle: 'triceps',
    tags: ['isolation', 'push', 'triceps', 'barbell'],
    equipment: 'barbell',
    mediaUrl: null,
    instructions: [
      'Lie on a flat bench and grip an EZ bar with a shoulder-width overhand grip.',
      'Hold the bar directly above your forehead with arms extended.',
      'Bend your elbows and lower the bar toward your forehead.',
      'Extend back to the start without locking out completely.'
    ],
    hints: [
      'Keep your upper arms vertical and still — only the forearms should move.',
      'Use moderate weight to protect the elbow joint.'
    ]
  },
  {
    id: 'dips',
    name: 'Tricep Dips',
    primaryMuscle: 'triceps',
    tags: ['compound', 'push', 'triceps', 'chest', 'shoulders', 'bodyweight'],
    equipment: 'bodyweight',
    mediaUrl: null,
    instructions: [
      'Grip parallel bars and push yourself up with arms fully extended.',
      'Keep your torso upright to emphasize triceps (lean forward for more chest).',
      'Lower yourself until your upper arms are parallel to the floor.',
      'Press back up to the top position.'
    ],
    hints: [
      'Keep elbows tracking behind you — not flaring outward.',
      'Add weight with a dip belt once bodyweight becomes too easy.'
    ]
  },

  // ─── FOREARMS ─────────────────────────────────────────────────────────────
  {
    id: 'wrist-curl',
    name: 'Wrist Curl',
    primaryMuscle: 'forearms',
    tags: ['isolation', 'forearms', 'barbell'],
    equipment: 'barbell',
    mediaUrl: null,
    instructions: [
      'Sit at the end of a bench and rest your forearms on your thighs.',
      'Hold a barbell with an underhand (supinated) grip, wrists beyond knees.',
      'Curl your wrists upward as far as possible.',
      'Lower under full control back to the starting position.'
    ],
    hints: [
      'Use a light weight and focus on the full range of motion.',
      'Try the reverse-grip version for the extensors on the other side.'
    ]
  },

  // ─── ABS ──────────────────────────────────────────────────────────────────
  {
    id: 'cable-crunch',
    name: 'Cable Crunch',
    primaryMuscle: 'abs',
    tags: ['isolation', 'abs', 'cable'],
    equipment: 'cable',
    mediaUrl: null,
    instructions: [
      'Attach a rope to a high cable pulley and kneel below it.',
      'Hold the rope behind your head and curl your torso downward.',
      'Contract your abs as you crunch, bringing elbows toward your knees.',
      'Slowly return to the upright starting position.'
    ],
    hints: [
      'The range of motion should come from your spine — not from your hips.',
      'Keep your hips stationary throughout the movement.'
    ]
  },
  {
    id: 'plank',
    name: 'Plank',
    primaryMuscle: 'abs',
    tags: ['isolation', 'abs', 'bodyweight'],
    equipment: 'bodyweight',
    mediaUrl: null,
    instructions: [
      'Get into a forearm plank position, elbows directly under shoulders.',
      'Keep your body in a straight line from head to heels.',
      'Hold the position for the target duration while breathing steadily.'
    ],
    hints: [
      'Squeeze your glutes and pull your navel toward your spine.',
      'Avoid raising or dropping your hips — stay completely neutral.'
    ]
  },
  {
    id: 'hanging-leg-raise',
    name: 'Hanging Leg Raise',
    primaryMuscle: 'abs',
    tags: ['isolation', 'abs', 'bodyweight'],
    equipment: 'bodyweight',
    mediaUrl: null,
    instructions: [
      'Hang from a pull-up bar with a shoulder-width overhand grip.',
      'With control, raise your legs until they are parallel to the floor (or higher).',
      'Lower back down slowly without swinging.'
    ],
    hints: [
      'Posterior pelvic tilt at the top maximizes lower ab engagement.',
      'If legs are too hard, start with bent-knee raises and progress.'
    ]
  },
  {
    id: 'ab-wheel-rollout',
    name: 'Ab Wheel Rollout',
    primaryMuscle: 'abs',
    tags: ['compound', 'abs', 'bodyweight'],
    equipment: 'bodyweight',
    mediaUrl: null,
    instructions: [
      'Kneel on the floor holding an ab wheel with both hands.',
      'Roll forward slowly, extending your body toward the floor.',
      'Use your abs to pull yourself back to the start position.'
    ],
    hints: [
      'Start with a small range of motion and build gradually.',
      'Keep a posterior pelvic tilt to protect your lower back.'
    ]
  },

  // ─── LOWER BACK ───────────────────────────────────────────────────────────
  {
    id: 'deadlift',
    name: 'Deadlift',
    primaryMuscle: 'lower_back',
    tags: ['compound', 'pull', 'lower_back', 'glutes', 'hamstrings', 'traps', 'barbell'],
    equipment: 'barbell',
    mediaUrl: null,
    instructions: [
      'Stand with feet hip-width apart, bar over mid-foot.',
      'Hinge at the hips and grip the bar just outside your legs.',
      'Take a big breath, brace your core hard, and drive your feet into the floor.',
      'Lift the bar by extending your hips and knees simultaneously.',
      'Lock out at the top by squeezing glutes, then hinge back down with control.'
    ],
    hints: [
      'The bar should stay in contact with your body the entire way up.',
      'Never round the lower back — maintain a neutral spine throughout.',
      'Think "chest up" and "hips back" at the setup.'
    ]
  },
  {
    id: 'back-extension',
    name: 'Back Extension',
    primaryMuscle: 'lower_back',
    tags: ['isolation', 'lower_back', 'glutes', 'bodyweight'],
    equipment: 'bodyweight',
    mediaUrl: null,
    instructions: [
      'Position yourself in a back extension machine, hips at the pad edge.',
      'Cross your arms or hold a plate on your chest.',
      'Lower your torso toward the floor, feeling a stretch in the hamstrings.',
      'Extend back up to a neutral spine position — do not hyperextend.'
    ],
    hints: [
      'Control the eccentric phase — do not drop quickly.',
      'Add a plate to increase resistance as you progress.'
    ]
  },

  // ─── GLUTES ───────────────────────────────────────────────────────────────
  {
    id: 'barbell-hip-thrust',
    name: 'Barbell Hip Thrust',
    primaryMuscle: 'glutes',
    tags: ['compound', 'glutes', 'hamstrings', 'barbell'],
    equipment: 'barbell',
    mediaUrl: null,
    instructions: [
      'Sit on the floor with your upper back against a bench.',
      'Roll a barbell over your hips (use padding for comfort).',
      'Plant your feet flat on the floor, about hip-width apart.',
      'Drive through your heels, extending your hips upward until fully extended.',
      'Lower back down with control.'
    ],
    hints: [
      'Squeeze your glutes hard at the top of each rep.',
      'Keep your chin tucked to maintain a neutral spine.'
    ]
  },
  {
    id: 'cable-kickback',
    name: 'Cable Kickback',
    primaryMuscle: 'glutes',
    tags: ['isolation', 'glutes', 'cable'],
    equipment: 'cable',
    mediaUrl: null,
    instructions: [
      'Attach an ankle cuff to a low cable pulley and attach it to one ankle.',
      'Face the machine and hold for support.',
      'Kick your leg back in a controlled arc, squeezing the glute at peak extension.',
      'Return to the starting position without swinging.'
    ],
    hints: [
      'Keep your lower back stable — movement should come from the hip joint only.',
      'Use a slow, controlled tempo for better mind-muscle connection.'
    ]
  },

  // ─── QUADS ────────────────────────────────────────────────────────────────
  {
    id: 'barbell-squat',
    name: 'Barbell Back Squat',
    primaryMuscle: 'quads',
    tags: ['compound', 'quads', 'glutes', 'hamstrings', 'barbell'],
    equipment: 'barbell',
    mediaUrl: null,
    instructions: [
      'Unrack the barbell on your upper traps / rear delts.',
      'Stand with feet shoulder-width apart, toes slightly out.',
      'Brace your core, then push your knees out and hinge at the hips simultaneously.',
      'Squat until thighs are at least parallel to the floor.',
      'Drive back up through the heels to the starting position.'
    ],
    hints: [
      'Keep your chest up and your torso as upright as possible.',
      'Knees should track over your toes — not caving inward.',
      'Take a deep belly breath and brace before each rep.'
    ]
  },
  {
    id: 'leg-press',
    name: 'Leg Press',
    primaryMuscle: 'quads',
    tags: ['compound', 'quads', 'glutes', 'hamstrings', 'machine'],
    equipment: 'machine',
    mediaUrl: null,
    instructions: [
      'Sit in the leg press machine with your back flat against the pad.',
      'Place feet shoulder-width apart on the platform.',
      'Release the safety handles and lower the platform until knees are at ~90 degrees.',
      'Press through your heels to extend your legs, not quite locking out.'
    ],
    hints: [
      'Do not let your lower back round off the pad at the bottom.',
      'A higher foot placement increases glute/hamstring involvement.'
    ]
  },
  {
    id: 'leg-extension',
    name: 'Leg Extension',
    primaryMuscle: 'quads',
    tags: ['isolation', 'quads', 'machine'],
    equipment: 'machine',
    mediaUrl: null,
    instructions: [
      'Sit in the leg extension machine with the pad resting on your shins.',
      'Extend your legs upward until they are fully straight.',
      'Squeeze your quads at the top, then lower slowly.'
    ],
    hints: [
      'Avoid locking the knees aggressively at the top to protect the joint.',
      'Use a slower eccentric (lowering) phase for greater stimulus.'
    ]
  },
  {
    id: 'bulgarian-split-squat',
    name: 'Bulgarian Split Squat',
    primaryMuscle: 'quads',
    tags: ['compound', 'quads', 'glutes', 'hamstrings', 'dumbbell', 'bodyweight'],
    equipment: 'dumbbell',
    mediaUrl: null,
    instructions: [
      'Stand a few feet in front of a bench and place one foot behind you on it.',
      'Lower your back knee toward the floor in a lunge motion.',
      'Drive through your front heel to return to the starting position.'
    ],
    hints: [
      'The further your front foot is from the bench, the more glute involvement.',
      'Keep your torso upright and your front knee tracking over the toes.'
    ]
  },

  // ─── HAMSTRINGS ───────────────────────────────────────────────────────────
  {
    id: 'romanian-deadlift',
    name: 'Romanian Deadlift',
    primaryMuscle: 'hamstrings',
    tags: ['compound', 'pull', 'hamstrings', 'glutes', 'lower_back', 'barbell'],
    equipment: 'barbell',
    mediaUrl: null,
    instructions: [
      'Stand holding a barbell at hip level with an overhand grip.',
      'Hinge at the hips, pushing them back as you lower the bar down your legs.',
      'Feel a deep stretch in your hamstrings at the bottom.',
      'Drive your hips forward to return to the start.'
    ],
    hints: [
      'Maintain a neutral spine throughout — do not round your lower back.',
      'The bar should stay close to your body throughout the movement.'
    ]
  },
  {
    id: 'leg-curl',
    name: 'Lying Leg Curl',
    primaryMuscle: 'hamstrings',
    tags: ['isolation', 'hamstrings', 'machine'],
    equipment: 'machine',
    mediaUrl: null,
    instructions: [
      'Lie face down on the leg curl machine, pad resting on your Achilles tendon area.',
      'Curl your legs upward toward your glutes.',
      'Squeeze at the top, then lower slowly back to the start.'
    ],
    hints: [
      'Avoid raising your hips as you curl — keep the pelvis flat.',
      'Plantarflex your feet (point toes) during the curl for extra hamstring contraction.'
    ]
  },
  {
    id: 'glute-ham-raise',
    name: 'Glute-Ham Raise',
    primaryMuscle: 'hamstrings',
    tags: ['compound', 'pull', 'hamstrings', 'glutes', 'bodyweight'],
    equipment: 'bodyweight',
    mediaUrl: null,
    instructions: [
      'Position yourself in a GHD machine, thighs on the pad and feet secured.',
      'Lower your torso toward the floor by extending at the knee and hip.',
      'Reverse the movement by curling your legs and raising your torso back up.'
    ],
    hints: [
      'This is a challenging movement — use assistance (a band) if needed.',
      'Keep your spine neutral and body in a straight line at the top.'
    ]
  },

  // ─── CALVES ───────────────────────────────────────────────────────────────
  {
    id: 'standing-calf-raise',
    name: 'Standing Calf Raise',
    primaryMuscle: 'calves',
    tags: ['isolation', 'calves', 'machine'],
    equipment: 'machine',
    mediaUrl: null,
    instructions: [
      'Stand on a calf raise machine or a step with your heels hanging off.',
      'Rise onto the balls of your feet as high as possible.',
      'Lower your heels below the step for a full stretch.',
      'Repeat for the target reps.'
    ],
    hints: [
      'Use a full range of motion — the stretch at the bottom is crucial for growth.',
      'Three different foot positions (straight, in, out) hit slightly different parts of the calf.'
    ]
  },
  {
    id: 'seated-calf-raise',
    name: 'Seated Calf Raise',
    primaryMuscle: 'calves',
    tags: ['isolation', 'calves', 'machine'],
    equipment: 'machine',
    mediaUrl: null,
    instructions: [
      'Sit in a seated calf raise machine with pads resting on your thighs.',
      'Position the balls of your feet on the platform, heels hanging.',
      'Raise your heels as high as possible.',
      'Lower slowly for a full stretch.'
    ],
    hints: [
      'The seated position targets the soleus (deeper calf muscle) more than standing raises.',
      'Use slow tempos (3-0-1) for better calf development.'
    ]
  },

  // ─── BONUS (additional to exceed 40) ─────────────────────────────────────
  {
    id: 'sumo-deadlift',
    name: 'Sumo Deadlift',
    primaryMuscle: 'hamstrings',
    tags: ['compound', 'pull', 'hamstrings', 'glutes', 'lower_back', 'barbell'],
    equipment: 'barbell',
    mediaUrl: null,
    instructions: [
      'Stand with feet wide apart, toes pointing outward at 45 degrees.',
      'Grip the bar between your legs with an overhand or mixed grip.',
      'Keep your chest up and hinge to the bar, back flat.',
      'Push the floor away and drive your hips forward to lock out.'
    ],
    hints: [
      'Push your knees out in line with your toes throughout the lift.',
      'Sumo stance reduces the range of motion and lower back stress vs conventional.'
    ]
  },
  {
    id: 'cable-lateral-raise',
    name: 'Cable Lateral Raise',
    primaryMuscle: 'shoulders',
    tags: ['isolation', 'push', 'shoulders', 'cable'],
    equipment: 'cable',
    mediaUrl: null,
    instructions: [
      'Set a cable to the lowest pulley position.',
      'Stand side-on to the machine and grab the handle with the far hand.',
      'Raise your arm out to the side to shoulder height.',
      'Lower slowly back down against the cable tension.'
    ],
    hints: [
      'Cable provides constant tension unlike dumbbells which lose tension at the top.',
      'Keep a slight forward lean for better deltoid isolation.'
    ]
  },
  {
    id: 'preacher-curl',
    name: 'Preacher Curl',
    primaryMuscle: 'biceps',
    tags: ['isolation', 'pull', 'biceps', 'barbell'],
    equipment: 'barbell',
    mediaUrl: null,
    instructions: [
      'Sit at a preacher curl bench and drape your upper arms over the pad.',
      'Grip an EZ bar with a supinated grip.',
      'Curl the bar upward until your biceps are fully contracted.',
      'Lower slowly to full arm extension.'
    ],
    hints: [
      'The preacher bench eliminates cheating by anchoring your upper arms.',
      'Do not lock out completely at the bottom — maintain tension.'
    ]
  },
  {
    id: 'close-grip-bench-press',
    name: 'Close-Grip Bench Press',
    primaryMuscle: 'triceps',
    tags: ['compound', 'push', 'triceps', 'chest', 'barbell'],
    equipment: 'barbell',
    mediaUrl: null,
    instructions: [
      'Lie on a flat bench and grip the barbell with hands ~shoulder-width apart.',
      'Unrack and hold the bar over your chest.',
      'Lower the bar to your lower chest, keeping elbows close to your body.',
      'Press explosively back to full extension.'
    ],
    hints: [
      'Keep your elbows close to your torso to maximize tricep engagement.',
      'Do not grip too narrow — inside shoulder width can strain the wrists.'
    ]
  },
  {
    id: 'front-squat',
    name: 'Front Squat',
    primaryMuscle: 'quads',
    tags: ['compound', 'quads', 'glutes', 'abs', 'barbell'],
    equipment: 'barbell',
    mediaUrl: null,
    instructions: [
      'Rest the barbell across the front of your shoulders in a clean grip or crossed-arm position.',
      'Stand with feet shoulder-width, toes slightly out.',
      'Keeping elbows high, squat deeply until thighs are parallel or below.',
      'Drive back up through the heels.'
    ],
    hints: [
      'High elbows are critical — if they drop, you will tip forward.',
      'Front squats demand more quad and core strength than back squats.'
    ]
  },
  {
    id: 'walking-lunge',
    name: 'Walking Lunge',
    primaryMuscle: 'quads',
    tags: ['compound', 'quads', 'glutes', 'hamstrings', 'dumbbell', 'bodyweight'],
    equipment: 'dumbbell',
    mediaUrl: null,
    instructions: [
      'Hold dumbbells at your sides or a barbell on your back.',
      'Step forward with one foot and lower your back knee toward the floor.',
      'Push off the back foot and bring it forward to step into the next lunge.',
      'Alternate legs for the target distance or reps.'
    ],
    hints: [
      'Keep your torso upright throughout the movement.',
      'Take a long enough stride to prevent the front knee from traveling past the toes.'
    ]
  },
  {
    id: 'incline-barbell-press',
    name: 'Incline Barbell Press',
    primaryMuscle: 'chest',
    tags: ['compound', 'push', 'chest', 'triceps', 'shoulders', 'barbell'],
    equipment: 'barbell',
    mediaUrl: null,
    instructions: [
      'Set a bench to 30–45 degrees incline and unrack a barbell.',
      'Lower the bar to your upper chest just below the collar bones.',
      'Press explosively back to full extension.'
    ],
    hints: [
      'A lower incline angle (30°) keeps more emphasis on the upper pec.',
      'Wider grip increases the stretch on the pectorals.'
    ]
  },
  {
    id: 'neutral-grip-pullup',
    name: 'Neutral-Grip Pull-Up',
    primaryMuscle: 'lats',
    tags: ['compound', 'pull', 'lats', 'biceps', 'bodyweight'],
    equipment: 'bodyweight',
    mediaUrl: null,
    instructions: [
      'Hang from parallel handles with a neutral (palms-facing) grip.',
      'Pull your chin above the handles by driving your elbows toward your hips.',
      'Lower under control back to a full hang.'
    ],
    hints: [
      'Neutral grip is often easier on the wrists and elbows than overhand.',
      'Full extension at the bottom is key — do not cut the range of motion short.'
    ]
  },
  // ── NEW CABLE & MACHINE EXERCISES ──────────────────────────────────────
  {
    id: 'cable-crossover',
    name: 'Cable Crossover',
    primaryMuscle: 'chest',
    tags: ['isolation', 'push', 'chest', 'cable'],
    equipment: 'cable',
    mediaUrl: null,
    instructions: [
      'Set pulleys on a dual cable machine to a high position.',
      'Grab the handles, step forward with one foot, and lean slightly forward.',
      'With a slight bend in your elbows, pull the handles down and across your body until your hands meet.',
      'Squeeze the chest, then slowly reverse the motion.'
    ],
    hints: [
      'Imagine hugging a large tree rather than pressing the weight.',
      'Do not let the weight pull your arms too far back behind your shoulders.'
    ]
  },
  {
    id: 'seated-cable-row',
    name: 'Seated Cable Row',
    primaryMuscle: 'lats',
    tags: ['compound', 'pull', 'lats', 'traps', 'cable'],
    equipment: 'cable',
    mediaUrl: null,
    instructions: [
      'Sit at a low pulley machine with a V-bar or straight bar attachment.',
      'Place feet on the footplates with knees slightly bent.',
      'Lean back slightly, keep your chest tall, and pull the handle to your abdomen.',
      'Squeeze your shoulder blades together, then slowly return to the starting position.'
    ],
    hints: [
      'Avoid using momentum by swinging your torso back and forth.',
      'Pull with your elbows, not just your hands.'
    ]
  },
  {
    id: 'face-pull',
    name: 'Face Pull',
    primaryMuscle: 'shoulders',
    tags: ['isolation', 'pull', 'shoulders', 'traps', 'cable'],
    equipment: 'cable',
    mediaUrl: null,
    instructions: [
      'Set a cable pulley to upper chest height and attach a rope.',
      'Grip the rope with thumbs pointing backward.',
      'Pull the rope directly toward your face, letting your hands separate as they pass your ears.',
      'Externally rotate your shoulders at the end of the movement (like hitting a double bicep pose).'
    ],
    hints: [
      'Focus on the rear delts and upper back rather than pulling heavy weight.',
      'Keep your elbows high throughout the movement.'
    ]
  },
  {
    id: 'leg-press',
    name: 'Leg Press',
    primaryMuscle: 'quads',
    tags: ['compound', 'push', 'quads', 'glutes', 'machine'],
    equipment: 'machine',
    mediaUrl: null,
    instructions: [
      'Sit on a leg press machine and place your feet shoulder-width apart on the sled.',
      'Unlatch the safety handles and lower the sled by bending your knees to 90 degrees.',
      'Press the weight back up through your heels and mid-foot.',
      'Do not lock out your knees at the top.'
    ],
    hints: [
      'Lower foot placement targets quads more; higher targets glutes and hamstrings.',
      'Never let your lower back round off the pad at the bottom of the movement.'
    ]
  },
  {
    id: 'hack-squat',
    name: 'Machine Hack Squat',
    primaryMuscle: 'quads',
    tags: ['compound', 'push', 'quads', 'machine'],
    equipment: 'machine',
    mediaUrl: null,
    instructions: [
      'Position your back flat against the pad and shoulders under the pads.',
      'Place feet mid-platform, shoulder-width apart.',
      'Lower yourself down until your thighs are at least parallel to the platform.',
      'Drive forcefully up to the starting position.'
    ],
    hints: [
      'Keep your heels flat on the platform at all times.',
      'This machine removes lower back strain compared to a barbell squat, allowing you to push closer to failure.'
    ]
  },
  {
    id: 'lat-pulldown',
    name: 'Lat Pulldown',
    primaryMuscle: 'lats',
    tags: ['compound', 'pull', 'lats', 'biceps', 'machine'],
    equipment: 'machine',
    mediaUrl: null,
    instructions: [
      'Sit at the lat pulldown machine and adjust the knee pad to lock you in.',
      'Take a wide overhand grip on the bar.',
      'Lean back slightly and pull the bar down to your upper chest.',
      'Control the eccentric on the way back up to a full stretch.'
    ],
    hints: [
      'Think about driving your elbows down into your back pockets.',
      'Do not pull the bar behind your neck.'
    ]
  },
  {
    id: 'cable-lateral-raise',
    name: 'Cable Lateral Raise',
    primaryMuscle: 'shoulders',
    tags: ['isolation', 'push', 'shoulders', 'cable'],
    equipment: 'cable',
    mediaUrl: null,
    instructions: [
      'Set a cable pulley to the lowest setting and attach a D-handle.',
      'Stand sideways to the machine, grabbing the handle with the far hand (cable runs in front or behind you).',
      'Raise your arm out to the side until it is parallel with the floor.',
      'Lower slowly under control.'
    ],
    hints: [
      'Cables provide constant tension unlike dumbbells which lose tension at the bottom.',
      'Lean slightly away from the machine to increase the range of motion.'
    ]
  },
  {
    id: 'tricep-pushdown-rope',
    name: 'Tricep Rope Pushdown',
    primaryMuscle: 'triceps',
    tags: ['isolation', 'push', 'triceps', 'cable'],
    equipment: 'cable',
    mediaUrl: null,
    instructions: [
      'Attach a rope to a high cable pulley.',
      'Keep your elbows pinned to your sides and push the rope down.',
      'At the bottom, spread the rope handles apart to fully contract the triceps.',
      'Return to the top under control until your forearms are above parallel.'
    ],
    hints: [
      'Do not let your elbows drift forward as the weight comes up.',
      'Keep your chest up and shoulders down.'
    ]
  },
  {
    id: 'ez-bar-skullcrusher',
    name: 'EZ-Bar Skullcrusher',
    primaryMuscle: 'triceps',
    tags: ['isolation', 'push', 'triceps', 'barbell'],
    equipment: 'barbell',
    mediaUrl: null,
    instructions: [
      'Lie on a flat bench holding an EZ-curl bar above your chest with a narrow overhand grip.',
      'Keeping upper arms stationary, bend the elbows to lower the bar toward your forehead.',
      'Extend the arms back to the starting position.'
    ],
    hints: [
      'For a deeper stretch and less elbow strain, lower the bar slightly behind your head instead of directly to your forehead.',
      'Keep elbows pointing straight up, not flared out.'
    ]
  },
  {
    id: 'bulgarian-split-squat',
    name: 'Bulgarian Split Squat',
    primaryMuscle: 'quads',
    tags: ['compound', 'push', 'quads', 'glutes', 'dumbbell'],
    equipment: 'dumbbell',
    mediaUrl: null,
    instructions: [
      'Hold a pair of dumbbells and stand a few feet in front of a bench.',
      'Rest the top of your rear foot on the bench behind you.',
      'Lower your hips until your front thigh is parallel to the floor.',
      'Drive through your front heel back to the top.'
    ],
    hints: [
      'Leaning the torso forward targets the glutes more; staying upright targets the quads.',
      'Use lifting straps if your grip fails before your legs do.'
    ]
  },
  {
    id: 'pec-deck',
    name: 'Pec Deck Machine',
    primaryMuscle: 'chest',
    tags: ['isolation', 'push', 'chest', 'machine'],
    equipment: 'machine',
    mediaUrl: null,
    instructions: [
      'Sit on the machine with your back flat against the pad.',
      'Grip the handles so your elbows are slightly below your shoulders.',
      'Bring the handles together in front of your chest, squeezing hard.',
      'Slowly let the handles return to the stretched position.'
    ],
    hints: [
      'Keep a slight bend in the elbows throughout.',
      'Do not overstretch at the back of the movement if you feel shoulder pain.'
    ]
  },
  {
    id: 'hammer-curl',
    name: 'Dumbbell Hammer Curl',
    primaryMuscle: 'biceps',
    tags: ['isolation', 'pull', 'biceps', 'forearms', 'dumbbell'],
    equipment: 'dumbbell',
    mediaUrl: null,
    instructions: [
      'Stand holding dumbbells at your sides with a neutral grip (palms facing your legs).',
      'Curl the weights up toward your shoulders, keeping your wrists neutral.',
      'Squeeze at the top, then lower under control.'
    ],
    hints: [
      'Hammer curls target the brachialis and brachioradialis, building arm thickness.',
      'Keep your elbows locked at your sides; do not swing them forward.'
    ]
  },
  {
    id: 'seated-calf-raise',
    name: 'Seated Calf Raise',
    primaryMuscle: 'calves',
    tags: ['isolation', 'push', 'calves', 'machine'],
    equipment: 'machine',
    mediaUrl: null,
    instructions: [
      'Sit on the machine, placing the balls of your feet on the platform and thighs under the pads.',
      'Unrack the weight and lower your heels as far down as possible (deep stretch).',
      'Press up onto your toes as high as possible.',
      'Hold the top contraction for 1 second before lowering.'
    ],
    hints: [
      'The seated variation specifically targets the soleus muscle.',
      'Do not bounce at the bottom. Pause to kill momentum.'
    ]
  },
  {
    id: 'ab-wheel-rollout',
    name: 'Ab Wheel Rollout',
    primaryMuscle: 'abs',
    tags: ['isolation', 'push', 'abs', 'bodyweight'],
    equipment: 'bodyweight',
    mediaUrl: null,
    instructions: [
      'Kneel on a soft pad and grip the ab wheel handles directly under your shoulders.',
      'Brace your core and slowly roll the wheel forward until your arms are fully extended.',
      'Contract your abs to pull the wheel back to the starting position.'
    ],
    hints: [
      'Never let your lower back sag. Keep a slight hollow-body position.',
      'If you cannot go all the way down, roll to a wall to limit the range of motion.'
    ]
  },
  {
    id: 'hanging-leg-raise',
    name: 'Hanging Leg Raise',
    primaryMuscle: 'abs',
    tags: ['isolation', 'pull', 'abs', 'bodyweight'],
    equipment: 'bodyweight',
    mediaUrl: null,
    instructions: [
      'Hang from a pull-up bar with an overhand grip.',
      'Keep your legs straight and raise them until they are parallel to the floor (or higher).',
      'Lower them slowly without swinging.'
    ],
    hints: [
      'To prevent swinging, engage your lats and keep constant tension in your core.',
      'If straight legs are too difficult, start with hanging knee raises.'
    ]
  }
];

export const MUSCLE_GROUPS = [
  'All',
  'Chest',
  'Lats',
  'Traps',
  'Shoulders',
  'Biceps',
  'Triceps',
  'Forearms',
  'Abs',
  'Lower Back',
  'Glutes',
  'Quads',
  'Hamstrings',
  'Calves'
];

/**
 * Search and filter exercises by muscle group and/or name/tag query.
 * Merges built-in EXERCISE_DATABASE with any user-created customExercises.
 */
export function searchExercises(query, muscleFilter, globalExercises = [], customExercises = []) {
  const combined = [...globalExercises, ...customExercises];
  let results = combined;

  if (muscleFilter && muscleFilter !== 'All') {
    const key = muscleFilter.toLowerCase().replace(' ', '_');
    results = results.filter(ex => ex.primaryMuscle === key);
  }

  if (query.trim()) {
    const q = query.toLowerCase();
    results = results.filter(ex =>
      ex.name.toLowerCase().includes(q) ||
      ex.tags.some(t => t.includes(q)) ||
      ex.primaryMuscle.includes(q)
    );
  }

  return results;
}

/**
 * Automatically generate tags for a custom exercise based on name and muscle.
 */
export function autoTagExercise(name, primaryMuscle) {
  const tags = [primaryMuscle];
  const lower = name.toLowerCase();

  if (['bench', 'press', 'push', 'dip', 'fly'].some(k => lower.includes(k))) tags.push('push');
  if (['row', 'pull', 'curl', 'pulldown', 'pullup', 'chinup'].some(k => lower.includes(k))) tags.push('pull');

  if (['squat', 'deadlift', 'press', 'bench', 'row'].some(k => lower.includes(k))) {
    tags.push('compound');
  } else {
    tags.push('isolation');
  }

  if (['barbell'].some(k => lower.includes(k))) tags.push('barbell');
  if (['dumbbell', 'db'].some(k => lower.includes(k))) tags.push('dumbbell');
  if (['cable'].some(k => lower.includes(k))) tags.push('cable');
  if (['machine'].some(k => lower.includes(k))) tags.push('machine');
  if (['bodyweight', 'pushup', 'pullup', 'dip', 'plank'].some(k => lower.includes(k))) tags.push('bodyweight');

  return [...new Set(tags)];
}

/**
 * Convert an exercise name into a URL-safe slug for Firestore document IDs.
 */
export function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
