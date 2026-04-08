export function PlantzLogo({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 140 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Plantz">
            <g>
                {/* Main leaf — elegant curve */}
                <path d="M10 28C10 28 7 20 11 13C15 6 22 4 22 4C22 4 16 9 13 16C10 23 10 28 10 28Z" fill="currentColor" opacity="0.65" />
                {/* Secondary leaf — lighter, overlapping */}
                <path d="M14 28C14 28 19 19 16 12C13 5 6 2 6 2C6 2 11 8 12.5 15C14 22 14 28 14 28Z" fill="currentColor" opacity="0.4" />
                {/* Stem — thin, organic */}
                <path d="M12 14C12 18 11.5 24 11.5 30" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" fill="none" />
            </g>
            <text x="28" y="24" fontFamily="'Fraunces', Georgia, serif" fontWeight="600" fontSize="20" fill="currentColor" letterSpacing="-0.5">
                Plantz
            </text>
        </svg>
    );
}
