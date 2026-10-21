import { parseSeason, seasonFor, type Season } from './season';

// `?season=winter` in the URL previews another season (before the #/ part of the address).
export function currentSeason(): Season {
  return parseSeason(new URLSearchParams(window.location.search).get('season')) ?? seasonFor(new Date());
}
