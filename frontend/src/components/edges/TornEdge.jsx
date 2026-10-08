import './TornEdge.css';

/**
 * Stage layer 3 — torn chapter edge (M1, v1).
 * Spec: docs-backup/MOTION_ANALYSIS.md (M1) & the stage plan (docs-backup/CHANGELOG.md).
 *
 * A torn-paper seam between two chapters. `fill` must equal the NEXT
 * section's ground colour; the tear is pulled up over the previous
 * section by exactly its own height, so the page below is untouched.
 * `flip` mirrors the tear for variety between seams.
 *
 * v1 is a static divider; the scroll-driven wipe upgrade is deferred
 * to the polish phase.
 */

const TEAR =
  'M0 90 L0 58 L38 52 L71 60 L104 47 L150 55 L189 42 L236 53 L275 46 ' +
  'L318 57 L361 44 L404 54 L447 41 L495 52 L540 45 L586 56 L629 43 ' +
  'L674 53 L719 40 L766 51 L809 46 L854 57 L899 44 L944 54 L989 42 ' +
  'L1036 53 L1079 45 L1124 56 L1169 43 L1214 52 L1259 41 L1306 51 ' +
  'L1349 46 L1394 55 L1440 48 L1440 90 Z';

export default function TornEdge({ fill, flip = false }) {
  return (
    <div className={`torn-edge${flip ? ' torn-edge--flip' : ''}`} aria-hidden="true">
      <svg viewBox="0 0 1440 90" preserveAspectRatio="none">
        <path d={TEAR} fill={fill} />
      </svg>
    </div>
  );
}
