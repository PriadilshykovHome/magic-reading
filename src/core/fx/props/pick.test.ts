import { expect, test } from 'vitest';
import config from '../../../../content/config.json';
import { CoreConfigSchema } from '../../engine/schema';
import { pickProps, PROPS } from './pick';

const props = CoreConfigSchema.shape.props.parse(config.props);

test('props: seasonal ones first on their dates, at most two per screen, one per place, the same all day', () => {
  const ids = new Set(PROPS.map((p) => p.id));
  for (const id of [...Object.keys(props.dates), ...Object.keys(props.chance)]) expect(ids, id).toContain(id);

  // St Nicholas Day: the gift by the door; the carol star at Christmas, across the new year.
  expect(pickProps(props, 'door', new Date(2026, 11, 6))[0]).toBe('mykolai');
  expect(pickProps(props, 'door', new Date(2027, 0, 7))[0]).toBe('carolStar');
  expect(pickProps(props, 'door', new Date(2027, 0, 25))).not.toContain('carolStar');

  for (let day = 0; day < 366; day++) {
    for (const screen of ['door', 'map'] as const) {
      const date = new Date(2026, 0, 1 + day, 9);
      const picked = pickProps(props, screen, date);
      expect(picked.length).toBeLessThanOrEqual(props.perScreen);
      const slots = picked.flatMap((id) => PROPS.find((p) => p.id === id)!.slots);
      expect(new Set(slots).size).toBe(slots.length);
      expect(pickProps(props, screen, new Date(2026, 0, 1 + day, 20))).toEqual(picked);
    }
  }
});
