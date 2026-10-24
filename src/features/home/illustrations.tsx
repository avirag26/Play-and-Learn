type IllustrationProps = { className?: string };

/** The home screen's sunny hill, with a tablet of letters, numbers and shapes for the mascots to share. */
export function HomeScene({ className = "" }: IllustrationProps) {
  return (
    <svg className={className} viewBox="0 0 320 200" preserveAspectRatio="xMidYMax slice" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="276" cy="36" r="20" fill="#FFD968" />
      <g stroke="#FFD968" strokeWidth="4" strokeLinecap="round">
        <path d="M276 6v-4M276 70v-4M246 36h-4M310 36h-4M255 15l-3-3M300 60l-3-3M297 15l3-3M252 60l3-3" />
      </g>
      <path d="M40 46c0-9 8-15 16-13 3-8 15-10 20-2 9-1 15 6 13 14H40Z" fill="#FFF9EC" />
      <path d="M176 26c0-7 6-11 12-10 3-6 12-7 15-1 7-1 11 4 10 11h-37Z" fill="#FFF9EC" opacity=".85" />
      <path d="M-10 150C50 118 112 122 160 138C212 156 266 120 330 132V210H-10Z" fill="#91DBB4" />
      <path d="M-10 172C64 150 132 160 176 170C232 182 280 158 330 164V210H-10Z" fill="#6FC79A" />
      <g stroke="#4FAE7D" strokeWidth="3" strokeLinecap="round">
        <path d="M30 184v-7M36 186v-9M290 182v-7M296 184v-9M150 192v-6M156 193v-8" />
      </g>
      <rect x="112" y="118" width="96" height="66" rx="10" fill="#30465D" />
      <rect x="119" y="125" width="82" height="52" rx="6" fill="#FFF9EC" />
      <text x="134" y="158" fontSize="22" fontWeight="900" fill="#76AAE0" fontFamily="Nunito, Trebuchet MS, sans-serif">A</text>
      <text x="152" y="158" fontSize="22" fontWeight="900" fill="#FF8FA3" fontFamily="Nunito, Trebuchet MS, sans-serif">1</text>
      <circle cx="178" cy="141" r="7" fill="#FFD968" stroke="#30465D" strokeWidth="2" />
      <path d="M172 167l6-11 6 11Z" fill="#7AD9A6" stroke="#30465D" strokeWidth="2" strokeLinejoin="round" />
      <rect x="186" y="156" width="10" height="10" rx="1.5" fill="#B49CFF" stroke="#30465D" strokeWidth="2" />
    </svg>
  );
}

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
