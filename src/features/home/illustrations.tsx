type IllustrationProps = { className?: string };

export function BearMascot({ className = "" }: IllustrationProps) {
  return (
    <svg className={className} viewBox="0 0 280 240" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="140" cy="120" r="116" fill="#BCEFD4" />
      <circle cx="75" cy="60" r="16" fill="#FFF9EC" opacity=".8" />
      <circle cx="219" cy="45" r="9" fill="#FFF9EC" opacity=".8" />
      <path d="M48 190C72 169 208 169 232 190V240H48V190Z" fill="#91DBB4" />
      <circle cx="79" cy="77" r="32" fill="#B77758" />
      <circle cx="201" cy="77" r="32" fill="#B77758" />
      <circle cx="140" cy="139" r="91" fill="#D99D73" />
      <ellipse cx="140" cy="161" rx="55" ry="43" fill="#F0C28F" />
      <circle cx="108" cy="132" r="7" fill="#30465D" />
      <circle cx="172" cy="132" r="7" fill="#30465D" />
      <ellipse cx="140" cy="155" rx="13" ry="9" fill="#30465D" />
      <path d="M128 171C134 180 146 180 152 171" stroke="#30465D" strokeWidth="5" strokeLinecap="round" />
      <path d="M69 155C47 142 31 125 39 108C47 91 69 99 79 121" fill="#D99D73" />
      <path d="M211 155C233 142 249 125 241 108C233 91 211 99 201 121" fill="#D99D73" />
      <path d="M45 103L31 87" stroke="#30465D" strokeWidth="6" strokeLinecap="round" />
      <path d="M235 103L249 87" stroke="#30465D" strokeWidth="6" strokeLinecap="round" />
      <circle cx="42" cy="110" r="5" fill="#FFB6A8" /><circle cx="238" cy="110" r="5" fill="#FFB6A8" />
    </svg>
  );
}

export function CategoryIllustration({ kind, className = "" }: { kind: "alphabet" | "numbers" | "animals" | "colors" | "shapes" } & IllustrationProps) {
  const shared = { className, viewBox: "0 0 120 100", fill: "none", xmlns: "http://www.w3.org/2000/svg", "aria-hidden": true } as const;
  if (kind === "alphabet") return <svg {...shared}><rect x="18" y="18" width="84" height="65" rx="24" fill="#FFF9EC"/><path d="M38 66L55 32L72 66M45 54H65" stroke="#30465D" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/><circle cx="87" cy="25" r="7" fill="#FFB6A8"/></svg>;
  if (kind === "numbers") return <svg {...shared}><circle cx="57" cy="51" r="38" fill="#FFF9EC"/><path d="M49 35L59 29V71M43 71H75" stroke="#30465D" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/><circle cx="91" cy="32" r="7" fill="#FFD968"/><circle cx="26" cy="75" r="6" fill="#BCEFD4"/></svg>;
  if (kind === "animals") return <svg {...shared}><path d="M28 38L22 20L42 29C53 23 67 23 78 29L98 20L92 47C92 70 77 83 60 83C43 83 28 70 28 47V38Z" fill="#FFB6A8"/><circle cx="46" cy="50" r="5" fill="#30465D"/><circle cx="74" cy="50" r="5" fill="#30465D"/><path d="M54 63C58 68 63 68 67 63" stroke="#30465D" strokeWidth="4" strokeLinecap="round"/><circle cx="22" cy="78" r="6" fill="#D9CBFF"/></svg>;
  if (kind === "colors") return <svg {...shared}><path d="M60 19C36 19 20 35 20 56C20 72 31 82 43 82H51C57 82 58 73 53 69C49 65 53 58 61 58H72C89 58 100 49 100 38C100 27 83 19 60 19Z" fill="#FFF9EC"/><circle cx="39" cy="47" r="7" fill="#FFB6A8"/><circle cx="57" cy="35" r="7" fill="#FFD968"/><circle cx="77" cy="37" r="7" fill="#BCEFD4"/><circle cx="84" cy="51" r="7" fill="#D9CBFF"/></svg>;
  return <svg {...shared}><circle cx="39" cy="39" r="19" fill="#FFB6A8"/><rect x="63" y="21" width="37" height="37" rx="8" fill="#FFD968"/><path d="M28 82L49 59L70 82H28Z" fill="#BCEFD4"/><path d="M86 62L103 80H69L86 62Z" fill="#D9CBFF"/></svg>;
}
