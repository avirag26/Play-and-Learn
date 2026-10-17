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
