export type Choice = { id: string; label: string; art: "apple" | "ball" | "cat" | "dog" | "fish" | "bird" };

export type LetterQuestion = {
  id: string;
  letter: string;
  word: string;
  prompt: string;
  art: Choice["art"];
  choices: Choice[];
};

export const letterQuestions: LetterQuestion[] = [
  { id: "letter-a", letter: "A", word: "apple", prompt: "Which letter starts apple?", art: "apple", choices: [{ id: "a", label: "A", art: "apple" }, { id: "m", label: "M", art: "apple" }, { id: "s", label: "S", art: "apple" }] },
  { id: "letter-b", letter: "B", word: "bird", prompt: "Which letter starts bird?", art: "bird", choices: [{ id: "d", label: "D", art: "bird" }, { id: "b", label: "B", art: "bird" }, { id: "p", label: "P", art: "bird" }] },
  { id: "letter-c", letter: "C", word: "cat", prompt: "Which letter starts cat?", art: "cat", choices: [{ id: "c", label: "C", art: "cat" }, { id: "t", label: "T", art: "cat" }, { id: "g", label: "G", art: "cat" }] },
];

export type AnimalQuestion = {
  id: string;
  animal: "cat" | "dog" | "fish";
  name: string;
  habitat: string;
  sound: string;
  prompt: string;
  choices: Array<{ id: string; name: string; animal: AnimalQuestion["animal"] }>;
};

export const animalQuestions: AnimalQuestion[] = [
  { id: "animal-meadow", animal: "dog", name: "Dog", habitat: "A cozy home", sound: "Woof!", prompt: "Which animal likes to wag its tail?", choices: [{ id: "dog", name: "Dog", animal: "dog" }, { id: "fish", name: "Fish", animal: "fish" }, { id: "cat", name: "Cat", animal: "cat" }] },
  { id: "animal-water", animal: "fish", name: "Fish", habitat: "A cool pond", sound: "Blub blub!", prompt: "Which animal swims with fins?", choices: [{ id: "cat", name: "Cat", animal: "cat" }, { id: "fish", name: "Fish", animal: "fish" }, { id: "dog", name: "Dog", animal: "dog" }] },
  { id: "animal-home", animal: "cat", name: "Cat", habitat: "A sunny windowsill", sound: "Meow!", prompt: "Which animal says meow?", choices: [{ id: "fish", name: "Fish", animal: "fish" }, { id: "dog", name: "Dog", animal: "dog" }, { id: "cat", name: "Cat", animal: "cat" }] },
];

export type ColorName = "yellow" | "blue";
export type ColorQuestion = { id: string; name: ColorName; prompt: string; hex: string; objects: Array<{ id: string; label: string; color: ColorName; shape: "circle" | "square" | "triangle" }> };

export const colorQuestions: ColorQuestion[] = [
  { id: "color-yellow", name: "yellow", prompt: "Find all the yellow things", hex: "#FFD968", objects: [{ id: "sun", label: "sun", color: "yellow", shape: "circle" }, { id: "boat", label: "boat", color: "blue", shape: "triangle" }, { id: "block", label: "block", color: "yellow", shape: "square" }, { id: "pond", label: "pond", color: "blue", shape: "circle" }] },
  { id: "color-blue", name: "blue", prompt: "Find all the blue things", hex: "#91D8F5", objects: [{ id: "kite", label: "kite", color: "blue", shape: "triangle" }, { id: "flower", label: "flower", color: "yellow", shape: "circle" }, { id: "box", label: "box", color: "blue", shape: "square" }, { id: "apple", label: "apple", color: "yellow", shape: "circle" }] },
];
