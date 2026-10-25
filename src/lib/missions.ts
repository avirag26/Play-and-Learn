export type MissionCategory = "Colors around the home" | "Counting familiar objects" | "Finding shapes" | "Nature observation" | "Helping tidy up" | "Healthy daily habits";

export type HomeMission = {
  id: string;
  category: MissionCategory;
  title: string;
  /** Big picture for children who can't read yet. */
  emoji: string;
  instruction: string;
  /** Short steps, read aloud one by one. */
  steps: readonly string[];
  objective: string;
  duration: string;
  /** Length of the optional timer. */
  minutes: number;
  safety?: string;
};

/** Each path has a picture, a color, and a badge earned by finishing all of its missions. */
export const missionCategoryInfo: Record<MissionCategory, { short: string; emoji: string; tint: string; badge: string }> = {
  "Colors around the home": { short: "Colors", emoji: "🎨", tint: "bg-coral/50", badge: "Color Explorer" },
  "Counting familiar objects": { short: "Counting", emoji: "🔢", tint: "bg-sky", badge: "Counting Champ" },
  "Finding shapes": { short: "Shapes", emoji: "🔺", tint: "bg-lavender/60", badge: "Shape Spotter" },
  "Nature observation": { short: "Nature", emoji: "🌿", tint: "bg-mint", badge: "Nature Friend" },
  "Helping tidy up": { short: "Tidy up", emoji: "🧺", tint: "bg-sunshine/60", badge: "Super Helper" },
  "Healthy daily habits": { short: "Healthy", emoji: "💧", tint: "bg-[#cdeaff]", badge: "Healthy Hero" },
};

export const missionCategories: MissionCategory[] = ["Colors around the home", "Counting familiar objects", "Finding shapes", "Nature observation", "Helping tidy up", "Healthy daily habits"];

export const homeMissions: HomeMission[] = [
  { id: "color-hunt", category: "Colors around the home", title: "Color Hunt", emoji: "🟡", instruction: "Find three things that are yellow, with a grown-up nearby.", steps: ["Look around the room.", "Find three yellow things.", "Point to each one and say “yellow!”"], objective: "Practice color recognition and describing objects.", duration: "5 minutes", minutes: 5, safety: "Stay in a safe room and ask before picking anything up." },
  { id: "color-sort", category: "Colors around the home", title: "Sock Rainbow", emoji: "🧦", instruction: "Match clean socks by color and make a tiny rainbow pile.", steps: ["Get a pile of clean socks.", "Put socks of the same color together.", "Line the piles up like a rainbow."], objective: "Notice similarities, differences, and color order.", duration: "5–10 minutes", minutes: 8, safety: "Use only clean, dry clothes on the floor or a bed." },
  { id: "color-cook", category: "Colors around the home", title: "Fruit Spotter", emoji: "🍎", instruction: "With an adult, name the colors of the fruit you can see.", steps: ["Look at the fruit with your grown-up.", "Say the color of each fruit.", "Which color did you see the most?"], objective: "Build vocabulary and observation skills.", duration: "3 minutes", minutes: 3, safety: "An adult handles washing and cutting; never use kitchen tools alone." },
  { id: "count-toys", category: "Counting familiar objects", title: "Toy Count", emoji: "🧸", instruction: "Count five favorite toys, touching each one once.", steps: ["Choose five favorite toys.", "Line them up in a row.", "Touch each toy and count: 1, 2, 3, 4, 5!"], objective: "Connect number words to one-to-one counting.", duration: "5 minutes", minutes: 5, safety: "Choose toys with no small loose parts." },
  { id: "count-steps", category: "Counting familiar objects", title: "Step Stomp", emoji: "👣", instruction: "Count ten gentle steps across an open, clear room.", steps: ["Stand at one side of the room.", "Take gentle steps and count out loud.", "Stop when you reach ten!"], objective: "Practice counting in sequence and body awareness.", duration: "3 minutes", minutes: 3, safety: "Walk, do not run, and keep away from stairs." },
  { id: "count-spoons", category: "Counting familiar objects", title: "Spoon Line", emoji: "🥄", instruction: "Ask a grown-up for five safe spoons and line them up to count.", steps: ["Ask a grown-up for five spoons.", "Line the spoons up in a row.", "Count them, then count backwards!"], objective: "Compare groups and practice stable counting.", duration: "5 minutes", minutes: 5, safety: "Use spoons only; an adult collects them afterward." },
  { id: "shape-windows", category: "Finding shapes", title: "Window Shapes", emoji: "🪟", instruction: "Look for a circle, square, and rectangle in your room.", steps: ["Look for something round like a circle.", "Find something with four equal sides, a square.", "Find a long box shape, a rectangle."], objective: "Recognize common 2D shapes in the environment.", duration: "5 minutes", minutes: 5, safety: "Look from the floor; never climb or lean on furniture." },
  { id: "shape-build", category: "Finding shapes", title: "Shape Builder", emoji: "🧱", instruction: "Use large blocks to make a triangle or a square on the floor.", steps: ["Get some big blocks.", "Make a shape with three sides, a triangle.", "Now make a square with four sides!"], objective: "Explore shape parts, edges, and corners.", duration: "10 minutes", minutes: 10, safety: "Use large child-safe blocks and keep the floor clear." },
  { id: "shape-draw", category: "Finding shapes", title: "Air Shapes", emoji: "☝️", instruction: "Trace a circle, triangle, and square in the air with your finger.", steps: ["Hold up one finger.", "Draw a big circle in the air.", "Now draw a triangle, then a square!"], objective: "Strengthen shape memory and early mark-making skills.", duration: "3 minutes", minutes: 3, safety: "Make space around your body before moving your arms." },
  { id: "cloud-watch", category: "Nature observation", title: "Cloud Watch", emoji: "☁️", instruction: "With an adult, look outside and describe one cloud shape.", steps: ["Look at the sky with your grown-up.", "Pick one cloud.", "What does it look like? An animal? A boat?"], objective: "Practice patient observation and imaginative language.", duration: "5 minutes", minutes: 5, safety: "Stay with your adult and observe from a safe place. Never look at the sun." },
  { id: "leaf-listen", category: "Nature observation", title: "Leaf Listener", emoji: "👂", instruction: "Listen quietly for two outdoor sounds and tell a grown-up what you heard.", steps: ["Sit very still and quiet.", "Listen for two sounds outside.", "Tell your grown-up what you heard."], objective: "Build listening focus and sensory vocabulary.", duration: "5 minutes", minutes: 5, safety: "Stay on a safe path or near your home with an adult." },
  { id: "plant-count", category: "Nature observation", title: "Leaf Counter", emoji: "🌱", instruction: "Find a plant with a grown-up and count its leaves or petals.", steps: ["Find a plant or flower with your grown-up.", "Look closely at its leaves or petals.", "Count them gently without picking."], objective: "Combine careful looking with counting.", duration: "5 minutes", minutes: 5, safety: "Look and count without touching or tasting plants." },
  { id: "toy-tidy", category: "Helping tidy up", title: "Toy Team", emoji: "🚂", instruction: "Put five toys into their home before the tidy-up song ends.", steps: ["Start the timer or sing a tidy-up song.", "Pick up one toy at a time.", "Put five toys back in their home!"], objective: "Practice sorting, following a sequence, and caring for belongings.", duration: "5 minutes", minutes: 3, safety: "A grown-up chooses the safe toys and keeps walkways clear." },
  { id: "book-shelf", category: "Helping tidy up", title: "Book Rest", emoji: "📚", instruction: "Return three books to a low shelf with a grown-up.", steps: ["Find three books on the floor or table.", "Carry them one at a time.", "Stand them neatly on a low shelf."], objective: "Build responsibility and order awareness.", duration: "5 minutes", minutes: 5, safety: "Use a low shelf only; never climb to reach books." },
  { id: "shoe-pairs", category: "Helping tidy up", title: "Shoe Pairs", emoji: "👟", instruction: "Match shoes into pairs and line them up by the door.", steps: ["Find the shoes by the door.", "Match each shoe with its partner.", "Line the pairs up neatly."], objective: "Practice matching, pairs, and tidy habits.", duration: "5 minutes", minutes: 5, safety: "Keep the walkway clear so nobody trips." },
  { id: "hand-wash", category: "Healthy daily habits", title: "Bubble Hands", emoji: "🫧", instruction: "Sing a short song while washing and drying your hands.", steps: ["Wet your hands and add soap.", "Rub and sing until the song ends.", "Rinse, then dry your hands."], objective: "Build a consistent hand-washing routine.", duration: "2 minutes", minutes: 2, safety: "An adult helps with the tap if water is hot." },
  { id: "water-break", category: "Healthy daily habits", title: "Water Pause", emoji: "🥤", instruction: "Take a calm drink of water with a grown-up, then stretch your arms.", steps: ["Sit down with your own cup.", "Take slow sips of water.", "Stretch your arms up high!"], objective: "Notice body needs and practice a gentle reset.", duration: "2 minutes", minutes: 2, safety: "Use your own cup and sit down while drinking." },
  { id: "teeth-count", category: "Healthy daily habits", title: "Sparkly Teeth", emoji: "🪥", instruction: "Brush your teeth while a grown-up counts slowly to twenty.", steps: ["Put a tiny bit of toothpaste on your brush.", "Brush the top teeth and bottom teeth.", "Keep brushing while your grown-up counts to twenty."], objective: "Build a brushing routine and hear counting in order.", duration: "2 minutes", minutes: 2, safety: "A grown-up helps with toothpaste and checks the brushing." },
];
