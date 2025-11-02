/**
 * Position Calculation Algorithm
 *
 * Implements a fractional positioning system for drag-and-drop reordering.
 * Allows unlimited insertions without database reindexing by using the midpoint
 * between two positions to calculate new positions.
 *
 * Algorithm: Given two positions, return their average (midpoint).
 * Special cases:
 * - First position: return target - 1
 * - Last position: return previous + 1
 * - Empty: return 1.0
 *
 * Time Complexity: O(1)
 * Space Complexity: O(1)
 *
 * @example
 * Initial: [1.0, 2.0, 3.0]
 * Insert between 1.0 and 2.0: [1.0, 1.5, 2.0, 3.0]
 * Insert between 1.0 and 1.5: [1.0, 1.25, 1.5, 2.0, 3.0]
 *
 * @param prevPosition - Position of the item before insertion point
 * @param nextPosition - Position of the item after insertion point
 * @returns The calculated position for the new item
 */
export function calculatePosition(prevPosition: number | null, nextPosition: number | null): number {
  if (prevPosition === null && nextPosition === null) return 1.0
  if (prevPosition === null) return nextPosition! - 1
  if (nextPosition === null) return prevPosition + 1
  return (prevPosition + nextPosition) / 2
}
