export type AlphabetEntry = {
  upper: string;
  lower: string;
  object: string;
  sentence: string;
  pronunciation: string;
  illustration: string;
};

// Emoji are local, platform-rendered illustration placeholders until original artwork is ready.
export const alphabet: readonly AlphabetEntry[] = [
  { upper: "A", lower: "a", object: "Apple", sentence: "An apple is crunchy and sweet.", pronunciation: "A. Apple.", illustration: "🍎" },
  { upper: "B", lower: "b", object: "Ball", sentence: "A ball can bounce and roll.", pronunciation: "B. Ball.", illustration: "⚽" },
  { upper: "C", lower: "c", object: "Cat", sentence: "A cat says meow.", pronunciation: "C. Cat.", illustration: "🐱" },
  { upper: "D", lower: "d", object: "Dog", sentence: "A dog likes to play.", pronunciation: "D. Dog.", illustration: "🐶" },
  { upper: "E", lower: "e", object: "Elephant", sentence: "An elephant has a long trunk.", pronunciation: "E. Elephant.", illustration: "🐘" },
  { upper: "F", lower: "f", object: "Fish", sentence: "A fish swims in water.", pronunciation: "F. Fish.", illustration: "🐟" },
  { upper: "G", lower: "g", object: "Giraffe", sentence: "A giraffe has a long neck.", pronunciation: "G. Giraffe.", illustration: "🦒" },
  { upper: "H", lower: "h", object: "House", sentence: "A house is a place to live.", pronunciation: "H. House.", illustration: "🏠" },
  { upper: "I", lower: "i", object: "Ice cream", sentence: "Ice cream is a cold treat.", pronunciation: "I. Ice cream.", illustration: "🍦" },
  { upper: "J", lower: "j", object: "Juice", sentence: "Juice comes from fruit.", pronunciation: "J. Juice.", illustration: "🧃" },
  { upper: "K", lower: "k", object: "Kite", sentence: "A kite flies in the wind.", pronunciation: "K. Kite.", illustration: "🪁" },
  { upper: "L", lower: "l", object: "Lion", sentence: "A lion has a loud roar.", pronunciation: "L. Lion.", illustration: "🦁" },
  { upper: "M", lower: "m", object: "Mango", sentence: "A mango is a sweet fruit.", pronunciation: "M. Mango.", illustration: "🥭" },
  { upper: "N", lower: "n", object: "Nest", sentence: "A bird can build a nest.", pronunciation: "N. Nest.", illustration: "🪺" },
  { upper: "O", lower: "o", object: "Orange", sentence: "An orange is round and juicy.", pronunciation: "O. Orange.", illustration: "🍊" },
  { upper: "P", lower: "p", object: "Parrot", sentence: "A parrot has colorful feathers.", pronunciation: "P. Parrot.", illustration: "🦜" },
  { upper: "Q", lower: "q", object: "Queen", sentence: "A queen may wear a crown.", pronunciation: "Q. Queen.", illustration: "👑" },
  { upper: "R", lower: "r", object: "Rabbit", sentence: "A rabbit can hop.", pronunciation: "R. Rabbit.", illustration: "🐰" },
  { upper: "S", lower: "s", object: "Sun", sentence: "The sun shines in the sky.", pronunciation: "S. Sun.", illustration: "☀️" },
  { upper: "T", lower: "t", object: "Turtle", sentence: "A turtle carries its shell.", pronunciation: "T. Turtle.", illustration: "🐢" },
  { upper: "U", lower: "u", object: "Umbrella", sentence: "An umbrella helps keep us dry.", pronunciation: "U. Umbrella.", illustration: "☂️" },
  { upper: "V", lower: "v", object: "Van", sentence: "A van can carry people.", pronunciation: "V. Van.", illustration: "🚐" },
  { upper: "W", lower: "w", object: "Whale", sentence: "A whale swims in the sea.", pronunciation: "W. Whale.", illustration: "🐳" },
  { upper: "X", lower: "x", object: "Xylophone", sentence: "A xylophone makes music.", pronunciation: "X. Xylophone.", illustration: "🎼" },
  { upper: "Y", lower: "y", object: "Yo-yo", sentence: "A yo-yo goes up and down.", pronunciation: "Y. Yo-yo.", illustration: "🪀" },
  { upper: "Z", lower: "z", object: "Zebra", sentence: "A zebra has stripes.", pronunciation: "Z. Zebra.", illustration: "🦓" },
];
