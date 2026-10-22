import { ageOn, isBirthday } from '../engine/calendar';
import { useAccount } from '../store/account';
import { birthdayOverride, today } from './today';

/** Whether today is his birthday (from the private profile, or `?birthday=` to preview), and his new age. */
export function useBirthday(): { birthday: boolean; age?: number } {
  const date = useAccount((s) => s.profile?.birthday) ?? birthdayOverride();
  const now = today();
  return isBirthday(now, date) ? { birthday: true, age: ageOn(now, date) } : { birthday: false };
}
