export type Activity = { id:string; title:string; subtitle:string; category:string; color:"mint"|"coral"|"lavender"; emoji:string };
export const activities: Activity[] = [
  { id:"sound-safari", title:"Sound Safari", subtitle:"Listen & find", category:"Sounds", color:"mint", emoji:"🦁" },
  { id:"color-garden", title:"Color Garden", subtitle:"Sort & spot", category:"Colors", color:"coral", emoji:"🌼" },
  { id:"tiny-builders", title:"Tiny Builders", subtitle:"Make & imagine", category:"Making", color:"lavender", emoji:"🧱" },
];
