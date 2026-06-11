export const RANKS = [
  { min: 0,    max: 50,   label: 'Newbie Digger',       icon: '🌱', color: '#7B9E6B' },
  { min: 51,   max: 200,  label: 'Vibe Dealer',          icon: '🎧', color: '#5B8FA8' },
  { min: 201,  max: 500,  label: 'Taste Maker',          icon: '🔥', color: '#D4824A' },
  { min: 501,  max: 1000, label: 'Curator',               icon: '💎', color: '#7B68C8' },
  { min: 1001, max: Infinity, label: 'Legend of the Groove', icon: '👑', color: '#C0A020' },
]

export const REACTIONS = [
  { key: 'red',    emoji: '5⭐', label: 'Heart-stopper', score: 5,  color: '#C0392B' },
  { key: 'orange', emoji: '4⭐',   label: "That's it!",    score: 3,  color: '#D48B2A' },
  { key: 'yellow', emoji: '3⭐',     label: 'Not bad',       score: 1,  color: '#C8A400' },
  { key: 'blue',   emoji: '2⭐',       label: 'Not my vibe',   score: 0,  color: '#2980B9' },
  { key: 'black',  emoji: '1⭐',         label: 'Skip',          score: -1, color: '#555555' },
]

export function getRank(score) {
  return RANKS.find(r => score >= r.min && score <= r.max) || RANKS[0]
}

export function getNextRank(score) {
  const idx = RANKS.findIndex(r => score >= r.min && score <= r.max)
  return RANKS[idx + 1] || null
}
