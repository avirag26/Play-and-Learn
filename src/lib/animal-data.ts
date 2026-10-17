export type Habitat = "safari" | "farm" | "ocean" | "forest";

export type AnimalId =
  | "lion" | "elephant" | "giraffe" | "zebra" | "monkey" | "hippopotamus"
  | "cow" | "horse" | "sheep" | "pig" | "chicken" | "duck"
  | "dolphin" | "whale" | "turtle" | "octopus" | "crab" | "fish"
  | "rabbit" | "fox" | "owl" | "bear" | "butterfly" | "frog";

export type AnimalEntry = {
  id: AnimalId;
  name: string;
  habitat: Habitat;
  /** Platform-rendered emoji: a local placeholder until original artwork is ready. Never a broken image. */
  illustration: string;
  pronunciation: string;
  fact: string;
  /** Describes the picture for screen readers. */
  alt: string;
  /** Name with a soft hyphen (­) for long words that must wrap in small answer cards. */
  wrapName?: string;
};

export const habitats: readonly { id: Habitat; label: string; emoji: string; tint: string }[] = [
  { id: "safari", label: "Safari", emoji: "🌍", tint: "bg-sunshine/45" },
  { id: "farm", label: "Farm", emoji: "🚜", tint: "bg-mint" },
  { id: "ocean", label: "Ocean", emoji: "🌊", tint: "bg-sky" },
  { id: "forest", label: "Forest & garden", emoji: "🌳", tint: "bg-lavender/60" },
];

export const animals: readonly AnimalEntry[] = [
  { id: "lion", name: "Lion", habitat: "safari", illustration: "🦁", pronunciation: "Lion", fact: "Lions live together in family groups called prides.", alt: "A lion with a big golden mane" },
  { id: "elephant", name: "Elephant", habitat: "safari", illustration: "🐘", pronunciation: "Elephant", fact: "Elephants use their long trunks to smell, drink, and pick up food.", alt: "A grey elephant with a long trunk" },
  { id: "giraffe", name: "Giraffe", habitat: "safari", illustration: "🦒", pronunciation: "Giraffe", fact: "A giraffe's long neck helps it reach leaves high up in the trees.", alt: "A spotted giraffe with a long neck" },
  { id: "zebra", name: "Zebra", habitat: "safari", illustration: "🦓", pronunciation: "Zebra", fact: "Every zebra has its very own pattern of black and white stripes.", alt: "A zebra with black and white stripes" },
  { id: "monkey", name: "Monkey", habitat: "safari", illustration: "🐒", pronunciation: "Monkey", fact: "Monkeys use their hands and feet to climb trees.", alt: "A brown monkey sitting up" },
  { id: "hippopotamus", name: "Hippopotamus", habitat: "safari", illustration: "🦛", pronunciation: "Hippopotamus", fact: "Hippos keep cool by resting in the water during the hot day.", alt: "A big round hippopotamus", wrapName: "Hippo­potamus" },
  { id: "cow", name: "Cow", habitat: "farm", illustration: "🐄", pronunciation: "Cow", fact: "Cows eat lots of grass, and they say moo!", alt: "A black and white cow" },
  { id: "horse", name: "Horse", habitat: "farm", illustration: "🐎", pronunciation: "Horse", fact: "Horses can rest and even doze while standing up.", alt: "A brown horse running" },
  { id: "sheep", name: "Sheep", habitat: "farm", illustration: "🐑", pronunciation: "Sheep", fact: "A sheep's soft, fluffy coat is called wool.", alt: "A fluffy white sheep" },
  { id: "pig", name: "Pig", habitat: "farm", illustration: "🐖", pronunciation: "Pig", fact: "Pigs roll in mud to stay cool on warm days.", alt: "A pink pig" },
  { id: "chicken", name: "Chicken", habitat: "farm", illustration: "🐔", pronunciation: "Chicken", fact: "Chickens lay eggs, and they say cluck cluck!", alt: "A chicken with a red comb" },
  { id: "duck", name: "Duck", habitat: "farm", illustration: "🦆", pronunciation: "Duck", fact: "Ducks have webbed feet that help them paddle in the water.", alt: "A duck with a green head" },
  { id: "dolphin", name: "Dolphin", habitat: "ocean", illustration: "🐬", pronunciation: "Dolphin", fact: "Dolphins breathe air through a little hole on top of their heads.", alt: "A blue dolphin jumping" },
  { id: "whale", name: "Whale", habitat: "ocean", illustration: "🐋", pronunciation: "Whale", fact: "The blue whale is the biggest animal in the whole world.", alt: "A big blue whale" },
  { id: "turtle", name: "Turtle", habitat: "ocean", illustration: "🐢", pronunciation: "Turtle", fact: "A turtle carries its hard shell with it everywhere it goes.", alt: "A green turtle with a shell" },
  { id: "octopus", name: "Octopus", habitat: "ocean", illustration: "🐙", pronunciation: "Octopus", fact: "An octopus has eight long, wiggly arms.", alt: "A pink octopus with eight arms" },
  { id: "crab", name: "Crab", habitat: "ocean", illustration: "🦀", pronunciation: "Crab", fact: "Crabs walk sideways across the sand.", alt: "A red crab with two claws" },
  { id: "fish", name: "Fish", habitat: "ocean", illustration: "🐟", pronunciation: "Fish", fact: "Fish breathe underwater using gills.", alt: "A blue fish swimming" },
  { id: "rabbit", name: "Rabbit", habitat: "forest", illustration: "🐇", pronunciation: "Rabbit", fact: "Rabbits hop along on their strong back legs.", alt: "A grey rabbit with long ears" },
  { id: "fox", name: "Fox", habitat: "forest", illustration: "🦊", pronunciation: "Fox", fact: "A fox wraps its big, bushy tail around itself to keep warm.", alt: "An orange fox face" },
  { id: "owl", name: "Owl", habitat: "forest", illustration: "🦉", pronunciation: "Owl", fact: "Most owls are awake at night and sleep in the day.", alt: "A brown owl with big eyes" },
  { id: "bear", name: "Bear", habitat: "forest", illustration: "🐻", pronunciation: "Bear", fact: "Some bears sleep for most of the cold winter.", alt: "A brown bear face" },
  { id: "butterfly", name: "Butterfly", habitat: "forest", illustration: "🦋", pronunciation: "Butterfly", fact: "A butterfly starts its life as a tiny caterpillar.", alt: "A blue butterfly with open wings" },
  { id: "frog", name: "Frog", habitat: "forest", illustration: "🐸", pronunciation: "Frog", fact: "Frogs use their long back legs to jump far.", alt: "A green frog face" },
];

const byId = new Map(animals.map((animal) => [animal.id, animal]));

export function getAnimal(id: AnimalId): AnimalEntry {
  const animal = byId.get(id);
  if (!animal) throw new Error(`Unknown animal: ${id}`);
  return animal;
}

export function isAnimalId(value: unknown): value is AnimalId {
  return typeof value === "string" && byId.has(value as AnimalId);
}
