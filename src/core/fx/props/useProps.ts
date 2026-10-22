import { useState } from 'react';
import { game } from '@game';
import { forcedProps, today } from '../today';
import { pickProps, type PropScreen } from './pick';

/** Today's props for a screen (the same all day). */
export function useProps(screen: PropScreen): string[] {
  const [ids] = useState(() => forcedProps() ?? pickProps(game.content.config.props, screen, today()));
  return ids;
}
