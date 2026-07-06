const LEAF =
  "M0,0 l-0.725,-0.66 C-3.3,-2.995 -5,-4.535 -5,-6.425 C-5,-7.965 -3.79,-9.175 -2.25,-9.175 " +
  "c0.87,0 1.705,0.405 2.25,1.045 C0.545,-8.77 1.38,-9.175 2.25,-9.175 C3.79,-9.175 5,-7.965 5,-6.425 " +
  "c0,1.89 -1.7,3.43 -4.275,5.77 L0,0 Z";

const ROTATIONS = [0, 90, 180, -90];

export default function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      {ROTATIONS.map((angle) => (
        <path
          key={angle}
          d={LEAF}
          fill="var(--color-mint-400)"
          stroke="var(--color-ink)"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          transform={`translate(16,16) rotate(${angle})`}
        />
      ))}
    </svg>
  );
}
