import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
/** Resume a retained Canvas with a fresh frame, including reduced-motion mode. */
export function AvatarRenderControl({ rendering }: { rendering: boolean }) {
  const invalidate = useThree(state => state.invalidate);
  useEffect(() => {
    if (rendering) invalidate();
  }, [rendering, invalidate]);
  return null;
}
