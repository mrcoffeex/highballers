export function shouldShowEntitySkeleton(
  entity: unknown,
  collectionLoaded: boolean,
  collectionEmpty: boolean,
): boolean {
  if (entity) return false;
  if (!collectionLoaded || collectionEmpty) return true;
  return false;
}
