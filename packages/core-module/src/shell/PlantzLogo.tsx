export function PlantzLogo({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 140 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Plantz">
            <g>
                <path d="M8 28C8 28 6 20 10 14C14 8 20 6 20 6C20 6 14 10 12 16C10 22 8 28 8 28Z" fill="currentColor" opacity="0.7" />
                <path d="M14 28C14 28 18 20 16 14C14 8 8 4 8 4C8 4 12 10 13 16C14 22 14 28 14 28Z" fill="currentColor" opacity="0.5" />
                <line x1="11" y1="14" x2="11" y2="30" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
            </g>
            <text x="28" y="24" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="700" fontSize="20" fill="currentColor" letterSpacing="-0.5">
                Plantz
            </text>
        </svg>
    );
}
