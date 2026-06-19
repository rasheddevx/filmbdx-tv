export interface Match {
  id: number;
  date: string;
  teamA: {
    name: string;
    code: string;
  };
  teamB: {
    name: string;
    code: string;
  };
  group: string;
  venue?: string;
  isFinal?: boolean;
}

export const matchSchedule: Match[] = [
  { id: 1, date: "2026-06-13T22:00:00Z", teamA: { name: "Qatar", code: "qa" }, teamB: { name: "Switzerland", code: "ch" }, group: "Group B" },
  { id: 2, date: "2026-06-14T04:00:00Z", teamA: { name: "Brazil", code: "br" }, teamB: { name: "Morocco", code: "ma" }, group: "Group C" },
  { id: 3, date: "2026-06-14T07:00:00Z", teamA: { name: "Haiti", code: "ht" }, teamB: { name: "Scotland", code: "gb-sct" }, group: "Group C" },
  { id: 4, date: "2026-06-14T10:00:00Z", teamA: { name: "Australia", code: "au" }, teamB: { name: "Türkiye", code: "tr" }, group: "Group D" },
  { id: 5, date: "2026-06-14T23:00:00Z", teamA: { name: "Germany", code: "de" }, teamB: { name: "Curaçao", code: "cw" }, group: "Group E" },
  { id: 6, date: "2026-06-15T02:00:00Z", teamA: { name: "Netherlands", code: "nl" }, teamB: { name: "Japan", code: "jp" }, group: "Group F" },
  { id: 7, date: "2026-06-15T05:00:00Z", teamA: { name: "Ivory Coast", code: "ci" }, teamB: { name: "Ecuador", code: "ec" }, group: "Group E" },
  { id: 8, date: "2026-06-15T08:00:00Z", teamA: { name: "Sweden", code: "se" }, teamB: { name: "Tunisia", code: "tn" }, group: "Group F" },
  { id: 9, date: "2026-06-15T10:00:00Z", teamA: { name: "Spain", code: "es" }, teamB: { name: "Cabo Verde", code: "cv" }, group: "Group H" },
  { id: 10, date: "2026-06-16T01:00:00Z", teamA: { name: "Belgium", code: "be" }, teamB: { name: "Egypt", code: "eg" }, group: "Group G" },
  { id: 11, date: "2026-06-16T04:00:00Z", teamA: { name: "Saudi Arabia", code: "sa" }, teamB: { name: "Uruguay", code: "uy" }, group: "Group H" },
  { id: 12, date: "2026-06-16T07:00:00Z", teamA: { name: "Iran", code: "ir" }, teamB: { name: "New Zealand", code: "nz" }, group: "Group G" },
  { id: 13, date: "2026-06-17T01:00:00Z", teamA: { name: "France", code: "fr" }, teamB: { name: "Senegal", code: "sn" }, group: "Group I" },
  { id: 14, date: "2026-06-17T04:00:00Z", teamA: { name: "Iraq", code: "iq" }, teamB: { name: "Norway", code: "no" }, group: "Group I" },
  { id: 15, date: "2026-06-17T07:00:00Z", teamA: { name: "Argentina", code: "ar" }, teamB: { name: "Algeria", code: "dz" }, group: "Group J" },
  { id: 16, date: "2026-06-17T10:00:00Z", teamA: { name: "Austria", code: "at" }, teamB: { name: "Jordan", code: "jo" }, group: "Group J" },
  { id: 17, date: "2026-06-17T23:00:00Z", teamA: { name: "Portugal", code: "pt" }, teamB: { name: "DR Congo", code: "cd" }, group: "Group K" },
  { id: 18, date: "2026-06-18T02:00:00Z", teamA: { name: "England", code: "gb-eng" }, teamB: { name: "Croatia", code: "hr" }, group: "Group L" },
  { id: 19, date: "2026-06-18T05:00:00Z", teamA: { name: "Ghana", code: "gh" }, teamB: { name: "Panama", code: "pa" }, group: "Group L" },
  { id: 20, date: "2026-06-18T08:00:00Z", teamA: { name: "Uzbekistan", code: "uz" }, teamB: { name: "Colombia", code: "co" }, group: "Group K" },
  { id: 21, date: "2026-06-18T22:00:00Z", teamA: { name: "Czechia", code: "cz" }, teamB: { name: "South Africa", code: "za" }, group: "Group A" },
  { id: 22, date: "2026-06-19T01:00:00Z", teamA: { name: "Switzerland", code: "ch" }, teamB: { name: "Bosnia and Herzegovina", code: "ba" }, group: "Group B" },
  { id: 23, date: "2026-06-19T04:00:00Z", teamA: { name: "Canada", code: "ca" }, teamB: { name: "Qatar", code: "qa" }, group: "Group B" },
  { id: 24, date: "2026-06-19T07:00:00Z", teamA: { name: "Mexico", code: "mx" }, teamB: { name: "South Korea", code: "kr" }, group: "Group A" },
  { id: 25, date: "2026-06-20T01:00:00Z", teamA: { name: "USA", code: "us" }, teamB: { name: "Australia", code: "au" }, group: "Group D" },
  { id: 26, date: "2026-06-20T04:00:00Z", teamA: { name: "Scotland", code: "gb-sct" }, teamB: { name: "Morocco", code: "ma" }, group: "Group C" },
  { id: 27, date: "2026-06-20T06:30:00Z", teamA: { name: "Brazil", code: "br" }, teamB: { name: "Haiti", code: "ht" }, group: "Group C" },
  { id: 28, date: "2026-06-20T09:00:00Z", teamA: { name: "Türkiye", code: "tr" }, teamB: { name: "Paraguay", code: "py" }, group: "Group D" },
  { id: 29, date: "2026-06-20T23:00:00Z", teamA: { name: "Netherlands", code: "nl" }, teamB: { name: "Sweden", code: "se" }, group: "Group F" },
  { id: 30, date: "2026-06-21T02:00:00Z", teamA: { name: "Germany", code: "de" }, teamB: { name: "Ivory Coast", code: "ci" }, group: "Group E" },
  { id: 31, date: "2026-06-21T06:00:00Z", teamA: { name: "Ecuador", code: "ec" }, teamB: { name: "Curaçao", code: "cw" }, group: "Group E" },
  { id: 32, date: "2026-06-21T10:00:00Z", teamA: { name: "Tunisia", code: "tn" }, teamB: { name: "Japan", code: "jp" }, group: "Group F" },
  { id: 33, date: "2026-06-21T22:00:00Z", teamA: { name: "Spain", code: "es" }, teamB: { name: "Saudi Arabia", code: "sa" }, group: "Group H" },
  { id: 34, date: "2026-06-22T01:00:00Z", teamA: { name: "Belgium", code: "be" }, teamB: { name: "Iran", code: "ir" }, group: "Group G" },
  { id: 35, date: "2026-06-22T04:00:00Z", teamA: { name: "Uruguay", code: "uy" }, teamB: { name: "Cabo Verde", code: "cv" }, group: "Group H" },
  { id: 36, date: "2026-06-22T07:00:00Z", teamA: { name: "New Zealand", code: "nz" }, teamB: { name: "Egypt", code: "eg" }, group: "Group G" },
  { id: 37, date: "2026-06-22T23:00:00Z", teamA: { name: "Argentina", code: "ar" }, teamB: { name: "Austria", code: "at" }, group: "Group J" },
  { id: 38, date: "2026-06-23T03:00:00Z", teamA: { name: "France", code: "fr" }, teamB: { name: "Iraq", code: "iq" }, group: "Group I" },
  { id: 39, date: "2026-06-23T06:00:00Z", teamA: { name: "Norway", code: "no" }, teamB: { name: "Senegal", code: "sn" }, group: "Group I" },
  { id: 40, date: "2026-06-23T09:00:00Z", teamA: { name: "Jordan", code: "jo" }, teamB: { name: "Algeria", code: "dz" }, group: "Group J" },
  { id: 41, date: "2026-06-23T23:00:00Z", teamA: { name: "Portugal", code: "pt" }, teamB: { name: "Uzbekistan", code: "uz" }, group: "Group K" },
  { id: 42, date: "2026-06-24T02:00:00Z", teamA: { name: "England", code: "gb-eng" }, teamB: { name: "Ghana", code: "gh" }, group: "Group L" },
  { id: 43, date: "2026-06-24T05:00:00Z", teamA: { name: "Panama", code: "pa" }, teamB: { name: "Croatia", code: "hr" }, group: "Group L" },
  { id: 44, date: "2026-06-24T08:00:00Z", teamA: { name: "Colombia", code: "co" }, teamB: { name: "DR Congo", code: "cd" }, group: "Group K" },
  { id: 45, date: "2026-06-25T01:00:00Z", teamA: { name: "Switzerland", code: "ch" }, teamB: { name: "Canada", code: "ca" }, group: "Group B" },
  { id: 46, date: "2026-06-25T01:00:00Z", teamA: { name: "Bosnia and Herzegovina", code: "ba" }, teamB: { name: "Qatar", code: "qa" }, group: "Group B" },
  { id: 47, date: "2026-06-25T04:00:00Z", teamA: { name: "Morocco", code: "ma" }, teamB: { name: "Haiti", code: "ht" }, group: "Group C" },
  { id: 48, date: "2026-06-25T04:00:00Z", teamA: { name: "Scotland", code: "gb-sct" }, teamB: { name: "Brazil", code: "br" }, group: "Group C" },
  { id: 49, date: "2026-06-25T07:00:00Z", teamA: { name: "South Africa", code: "za" }, teamB: { name: "South Korea", code: "kr" }, group: "Group A" },
  { id: 50, date: "2026-06-25T07:00:00Z", teamA: { name: "Czechia", code: "cz" }, teamB: { name: "Mexico", code: "mx" }, group: "Group A" },
  { id: 51, date: "2026-06-26T02:00:00Z", teamA: { name: "Curaçao", code: "cw" }, teamB: { name: "Ivory Coast", code: "ci" }, group: "Group E" },
  { id: 52, date: "2026-06-26T02:00:00Z", teamA: { name: "Ecuador", code: "ec" }, teamB: { name: "Germany", code: "de" }, group: "Group E" },
  { id: 53, date: "2026-06-26T05:00:00Z", teamA: { name: "Tunisia", code: "tn" }, teamB: { name: "Netherlands", code: "nl" }, group: "Group F" },
  { id: 54, date: "2026-06-26T05:00:00Z", teamA: { name: "Japan", code: "jp" }, teamB: { name: "Sweden", code: "se" }, group: "Group F" },
  { id: 55, date: "2026-06-26T08:00:00Z", teamA: { name: "Türkiye", code: "tr" }, teamB: { name: "USA", code: "us" }, group: "Group D" },
  { id: 56, date: "2026-06-26T08:00:00Z", teamA: { name: "Paraguay", code: "py" }, teamB: { name: "Australia", code: "au" }, group: "Group D" },
  { id: 57, date: "2026-06-27T01:00:00Z", teamA: { name: "Norway", code: "no" }, teamB: { name: "France", code: "fr" }, group: "Group I" },
  { id: 58, date: "2026-06-27T01:00:00Z", teamA: { name: "Senegal", code: "sn" }, teamB: { name: "Iraq", code: "iq" }, group: "Group I" },
  { id: 59, date: "2026-06-27T06:00:00Z", teamA: { name: "Cabo Verde", code: "cv" }, teamB: { name: "Saudi Arabia", code: "sa" }, group: "Group H" },
  { id: 60, date: "2026-06-27T06:00:00Z", teamA: { name: "Uruguay", code: "uy" }, teamB: { name: "Spain", code: "es" }, group: "Group H" },
  { id: 61, date: "2026-06-27T09:00:00Z", teamA: { name: "New Zealand", code: "nz" }, teamB: { name: "Belgium", code: "be" }, group: "Group G" },
  { id: 62, date: "2026-06-27T09:00:00Z", teamA: { name: "Egypt", code: "eg" }, teamB: { name: "Iran", code: "ir" }, group: "Group G" },
  { id: 63, date: "2026-06-28T03:00:00Z", teamA: { name: "Panama", code: "pa" }, teamB: { name: "England", code: "gb-eng" }, group: "Group L" },
  { id: 64, date: "2026-06-28T03:00:00Z", teamA: { name: "Croatia", code: "hr" }, teamB: { name: "Ghana", code: "gh" }, group: "Group L" },
  { id: 65, date: "2026-06-28T05:30:00Z", teamA: { name: "Colombia", code: "co" }, teamB: { name: "Portugal", code: "pt" }, group: "Group K" },
  { id: 66, date: "2026-06-28T05:30:00Z", teamA: { name: "DR Congo", code: "cd" }, teamB: { name: "Uzbekistan", code: "uz" }, group: "Group K" },
  { id: 67, date: "2026-06-28T08:00:00Z", teamA: { name: "Algeria", code: "dz" }, teamB: { name: "Austria", code: "at" }, group: "Group J" },
  { id: 68, date: "2026-06-28T08:00:00Z", teamA: { name: "Jordan", code: "jo" }, teamB: { name: "Argentina", code: "ar" }, group: "Group J" },
  
  // Custom Final Match highlighting
  { id: 69, date: "2026-07-19T20:00:00Z", teamA: { name: "TBD", code: "xx" }, teamB: { name: "TBD", code: "xx" }, group: "Final", venue: "MetLife Stadium", isFinal: true }
];
