import type { AnimalId } from "@/lib/animal-data";

export type AnimalSoundCredit = { file: string; source: string; author: string; license: string; url: string };

/*
 * Real animal sound recordings, keyed by animal id, with the credit each licence requires.
 * All come from Wikimedia Commons and are public domain, CC0, CC BY, or CC BY-SA. Each clip
 * was trimmed to its first few seconds of sound, loudness-normalised, and saved as mono MP3
 * (CC BY-SA clips are shared under the same licence). Credits are shown on the grown-ups page.
 *
 * To add a sound: save public/sounds/animals/<animal-id>.mp3 (1–4 seconds of one clear sound),
 * then add an entry here with its source and licence. `npm run test:games` checks every file exists.
 * The sound quiz turns on once at least three animals have sounds, and only uses those animals.
 */
export const animalSoundCredits: Partial<Record<AnimalId, AnimalSoundCredit>> = {
  cow: { file: "/sounds/animals/cow.mp3", source: "Mudchute cow 1.ogg", author: "Secretlondon", license: "CC BY-SA 3.0", url: "https://commons.wikimedia.org/wiki/File:Mudchute_cow_1.ogg" },
  sheep: { file: "/sounds/animals/sheep.mp3", source: "Mudchute sheep 1.ogg", author: "Secretlondon", license: "CC BY-SA 3.0", url: "https://commons.wikimedia.org/wiki/File:Mudchute_sheep_1.ogg" },
  pig: { file: "/sounds/animals/pig.mp3", source: "Pig grunt - Erdie.ogg", author: "erdie", license: "CC BY 3.0", url: "https://commons.wikimedia.org/wiki/File:Pig_grunt_-_Erdie.ogg" },
  chicken: { file: "/sounds/animals/chicken.mp3", source: "Hen announcing shes lain an egg.ogg", author: "alys", license: "Public domain", url: "https://commons.wikimedia.org/wiki/File:Hen_announcing_shes_lain_an_egg.ogg" },
  duck: { file: "/sounds/animals/duck.mp3", source: "Anas platyrhynchos - Mallard - XC62258.ogg", author: "Jonathon Jongsma", license: "CC BY-SA 3.0", url: "https://commons.wikimedia.org/wiki/File:Anas_platyrhynchos_-_Mallard_-_XC62258.ogg" },
  horse: { file: "/sounds/animals/horse.mp3", source: "Wiehern.ogg", author: "Hü.", license: "Public domain", url: "https://commons.wikimedia.org/wiki/File:Wiehern.ogg" },
  lion: { file: "/sounds/animals/lion.mp3", source: "Lion raring-sound1TamilNadu178.ogg", author: "த*உழவன்", license: "Public domain", url: "https://commons.wikimedia.org/wiki/File:Lion_raring-sound1TamilNadu178.ogg" },
  elephant: { file: "/sounds/animals/elephant.mp3", source: "Elephant voice - trumpeting.ogg", author: "தகவலுழவன்", license: "CC0", url: "https://commons.wikimedia.org/wiki/File:Elephant_voice_-_trumpeting.ogg" },
  owl: { file: "/sounds/animals/owl.mp3", source: "Strix aluco male.oga", author: "Vianney Bajart", license: "CC BY-SA 4.0", url: "https://commons.wikimedia.org/wiki/File:Strix_aluco_male.oga" },
  frog: { file: "/sounds/animals/frog.mp3", source: "Single Frog Croak.oga", author: "MichaeltheFox8621", license: "CC BY-SA 4.0", url: "https://commons.wikimedia.org/wiki/File:Single_Frog_Croak.oga" },
  monkey: { file: "/sounds/animals/monkey.mp3", source: "Howler monkey.ogg", author: "David O'Hara", license: "CC BY 3.0", url: "https://commons.wikimedia.org/wiki/File:Howler_monkey.ogg" },
  dolphin: { file: "/sounds/animals/dolphin.mp3", source: "dolphin-screaming-underwater-in-caribbean-sea-mexico.wav", author: "felix.blume (Freesound)", license: "CC0", url: "https://commons.wikimedia.org/wiki/File:161691_felixblume_dolphin-screaming-underwater-in-caribbean-sea-mexico.wav" },
  whale: { file: "/sounds/animals/whale.mp3", source: "Akhumphi1x.ogg (Alaska humpback whale)", author: "Unknown", license: "Public domain", url: "https://commons.wikimedia.org/wiki/File:Akhumphi1x.ogg" },
  bear: { file: "/sounds/animals/bear.mp3", source: "Bear growl.ogg", author: "Shizhao", license: "CC BY 3.0", url: "https://commons.wikimedia.org/wiki/File:Bear_growl.ogg" },
};

export const animalSoundFiles: Partial<Record<AnimalId, string>> = Object.fromEntries(
  Object.entries(animalSoundCredits).map(([id, credit]) => [id, credit.file]),
);
