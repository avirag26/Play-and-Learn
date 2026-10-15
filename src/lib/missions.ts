export type MissionCategory = "Colors around the home" | "Counting familiar objects" | "Finding shapes" | "Nature observation" | "Helping tidy up" | "Healthy daily habits";

export type HomeMission = {
  id: string;
  category: MissionCategory;
  title: string;
  instruction: string;
  objective: string;
  duration: string;
  safety?: string;
};

export const missionCategories: MissionCategory[] = ["Colors around the home", "Counting familiar objects", "Finding shapes", "Nature observation", "Helping tidy up", "Healthy daily habits"];

export const homeMissions: HomeMission[] = [
  { id: "color-hunt", category: "Colors around the home", title: "Color Hunt", instruction: "Find three things that are yellow, with a grown-up nearby.", objective: "Practice color recognition and describing objects.", duration: "5 minutes", safety: "Stay in a safe room and ask before picking anything up." },
  { id: "color-sort", category: "Colors around the home", title: "Sock Rainbow", instruction: "Match clean socks by color and make a tiny rainbow pile.", objective: "Notice similarities, differences, and color order.", duration: "5–10 minutes", safety: "Use only clean, dry clothes on the floor or a bed." },
  { id: "color-cook", category: "Colors around the home", title: "Fruit Spotter", instruction: "With an adult, name the colors of the fruit you can see.", objective: "Build vocabulary and observation skills.", duration: "3 minutes", safety: "An adult handles washing and cutting; never use kitchen tools alone." },
  { id: "count-toys", category: "Counting familiar objects", title: "Toy Count", instruction: "Count five favorite toys, touching each one once.", objective: "Connect number words to one-to-one counting.", duration: "5 minutes", safety: "Choose toys with no small loose parts." },
  { id: "count-steps", category: "Counting familiar objects", title: "Step Stomp", instruction: "Count ten gentle steps across an open, clear room.", objective: "Practice counting in sequence and body awareness.", duration: "3 minutes", safety: "Walk, do not run, and keep away from stairs." },
  { id: "count-spoons", category: "Counting familiar objects", title: "Spoon Line", instruction: "Ask a grown-up for five safe spoons and line them up to count.", objective: "Compare groups and practice stable counting.", duration: "5 minutes", safety: "Use spoons only; an adult collects them afterward." },
  { id: "shape-windows", category: "Finding shapes", title: "Window Shapes", instruction: "Look for a circle, square, and rectangle in your room.", objective: "Recognize common 2D shapes in the environment.", duration: "5 minutes", safety: "Look from the floor; never climb or lean on furniture." },
  { id: "shape-build", category: "Finding shapes", title: "Shape Builder", instruction: "Use large blocks to make a triangle or a square on the floor.", objective: "Explore shape parts, edges, and corners.", duration: "10 minutes", safety: "Use large child-safe blocks and keep the floor clear." },
  { id: "shape-draw", category: "Finding shapes", title: "Air Shapes", instruction: "Trace a circle, triangle, and square in the air with your finger.", objective: "Strengthen shape memory and early mark-making skills.", duration: "3 minutes", safety: "Make space around your body before moving your arms." },
  { id: "cloud-watch", category: "Nature observation", title: "Cloud Watch", instruction: "With an adult, look outside and describe one cloud shape.", objective: "Practice patient observation and imaginative language.", duration: "5 minutes", safety: "Stay with your adult and observe from a safe place." },
  { id: "leaf-listen", category: "Nature observation", title: "Leaf Listener", instruction: "Listen quietly for two outdoor sounds and tell a grown-up what you heard.", objective: "Build listening focus and sensory vocabulary.", duration: "5 minutes", safety: "Stay on a safe path or near your home with an adult." },
  { id: "toy-tidy", category: "Helping tidy up", title: "Toy Team", instruction: "Put five toys into their home before the tidy-up song ends.", objective: "Practice sorting, following a sequence, and caring for belongings.", duration: "5 minutes", safety: "A grown-up chooses the safe toys and keeps walkways clear." },
  { id: "book-shelf", category: "Helping tidy up", title: "Book Rest", instruction: "Return three books to a low shelf with a grown-up.", objective: "Build responsibility and order awareness.", duration: "5 minutes", safety: "Use a low shelf only; never climb to reach books." },
  { id: "hand-wash", category: "Healthy daily habits", title: "Bubble Hands", instruction: "Sing a short song while washing and drying your hands.", objective: "Build a consistent hand-washing routine.", duration: "2 minutes", safety: "An adult helps with the tap if water is hot." },
  { id: "water-break", category: "Healthy daily habits", title: "Water Pause", instruction: "Take a calm drink of water with a grown-up, then stretch your arms.", objective: "Notice body needs and practice a gentle reset.", duration: "2 minutes", safety: "Use your own cup and sit down while drinking." },
];
