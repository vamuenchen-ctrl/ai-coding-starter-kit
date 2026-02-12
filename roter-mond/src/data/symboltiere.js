export const SYMBOLTIERE = {
  jungeFrau: {
    primaer: { name: 'Schmetterling', emoji: '🦋' },
    sekundaer: { name: 'Einhorn', emoji: '🦄' },
  },
  mutter: {
    primaer: { name: 'Taube', emoji: '🕊️' },
    sekundaer: { name: 'Pferd', emoji: '🐴' },
  },
  zauberin: {
    primaer: { name: 'Eule', emoji: '🦉' },
    sekundaer: { name: 'Kranich', emoji: '🦩' },
  },
  alteWeise: {
    primaer: { name: 'Hase', emoji: '🐇' },
    sekundaer: null,
  },
}

// Übergangstiere an Phasengrenzen (basierend auf Miranda Grays "Roter Mond")
// ersterTag/letzterTag: Tier + textQuelle (Phase, deren symboltier-Array die Texte enthält)
export const UEBERGANGSTIERE = {
  jungeFrau: {
    ersterTag: { name: 'Einhorn', emoji: '🦄', textQuelle: 'jungeFrau' },
    letzterTag: { name: 'Einhorn', emoji: '🦄', textQuelle: 'jungeFrau' },
  },
  mutter: {
    ersterTag: null,
    letzterTag: { name: 'Pferd', emoji: '🐴', textQuelle: 'mutter' },
  },
  zauberin: {
    ersterTag: { name: 'Pferd', emoji: '🐴', textQuelle: 'mutter' },
    letzterTag: null,
  },
  alteWeise: {
    ersterTag: { name: 'Eule', emoji: '🦉', textQuelle: 'zauberin' },
    letzterTag: null,
  },
}
