import { describe, it, expect } from 'vitest'
import { berechneMondphase } from './mondphasen'

describe('berechneMondphase', () => {
  describe('bekannte Neumond-Daten', () => {
    const neumondDaten = [
      new Date(Date.UTC(2000, 0, 6)),   // 6. Januar 2000 (Referenz-Neumond)
      new Date(Date.UTC(2024, 0, 11)),   // 11. Januar 2024
      new Date(Date.UTC(2024, 3, 8)),    // 8. April 2024
      new Date(Date.UTC(2025, 0, 29)),   // 29. Januar 2025
    ]

    neumondDaten.forEach((datum) => {
      it(`erkennt Neumond am ${datum.toISOString().split('T')[0]}`, () => {
        const ergebnis = berechneMondphase(datum)
        expect(ergebnis.phase).toBe('neumond')
        expect(ergebnis.beleuchtung).toBeLessThanOrEqual(5)
        expect(ergebnis.symbol).toBe('🌑')
      })
    })
  })

  describe('bekannte Vollmond-Daten', () => {
    const vollmondDaten = [
      new Date(Date.UTC(2000, 0, 21)),   // 21. Januar 2000
      new Date(Date.UTC(2024, 0, 25)),   // 25. Januar 2024
      new Date(Date.UTC(2024, 3, 23)),   // 23. April 2024
      new Date(Date.UTC(2025, 1, 12)),   // 12. Februar 2025
    ]

    vollmondDaten.forEach((datum) => {
      it(`erkennt Vollmond am ${datum.toISOString().split('T')[0]}`, () => {
        const ergebnis = berechneMondphase(datum)
        expect(ergebnis.phase).toBe('vollmond')
        expect(ergebnis.beleuchtung).toBeGreaterThanOrEqual(95)
        expect(ergebnis.symbol).toBe('🌕')
      })
    })
  })

  describe('zunehmender Mond', () => {
    it('erkennt zunehmenden Mond zwischen Neumond und Vollmond', () => {
      // 7 Tage nach dem Referenz-Neumond (6.1.2000)
      const datum = new Date(Date.UTC(2000, 0, 13))
      const ergebnis = berechneMondphase(datum)
      expect(ergebnis.phase).toBe('zunehmend')
      expect(ergebnis.beleuchtung).toBeGreaterThan(10)
      expect(ergebnis.beleuchtung).toBeLessThan(90)
    })
  })

  describe('abnehmender Mond', () => {
    it('erkennt abnehmenden Mond nach Vollmond', () => {
      // ca. 7 Tage nach Vollmond am 21.1.2000
      const datum = new Date(Date.UTC(2000, 0, 28))
      const ergebnis = berechneMondphase(datum)
      expect(ergebnis.phase).toBe('abnehmend')
      expect(ergebnis.beleuchtung).toBeGreaterThan(10)
      expect(ergebnis.beleuchtung).toBeLessThan(90)
    })
  })

  describe('Beleuchtung', () => {
    it('gibt ~0% Beleuchtung bei Neumond', () => {
      const datum = new Date(Date.UTC(2000, 0, 6))
      const ergebnis = berechneMondphase(datum)
      expect(ergebnis.beleuchtung).toBeLessThanOrEqual(5)
    })

    it('gibt ~100% Beleuchtung bei Vollmond', () => {
      const datum = new Date(Date.UTC(2000, 0, 21))
      const ergebnis = berechneMondphase(datum)
      expect(ergebnis.beleuchtung).toBeGreaterThanOrEqual(95)
    })

    it('gibt mittlere Beleuchtung beim Halbmond', () => {
      // Erstes Viertel, ca. 7 Tage nach Neumond
      const datum = new Date(Date.UTC(2000, 0, 14))
      const ergebnis = berechneMondphase(datum)
      expect(ergebnis.beleuchtung).toBeGreaterThan(30)
      expect(ergebnis.beleuchtung).toBeLessThan(70)
    })
  })

  describe('Anzeigetext', () => {
    it('zeigt "Neumond" bei Neumond', () => {
      const datum = new Date(Date.UTC(2000, 0, 6))
      const ergebnis = berechneMondphase(datum)
      expect(ergebnis.anzeigeText).toBe('Neumond')
    })

    it('zeigt "Vollmond" bei Vollmond', () => {
      const datum = new Date(Date.UTC(2000, 0, 21))
      const ergebnis = berechneMondphase(datum)
      expect(ergebnis.anzeigeText).toBe('Vollmond')
    })

    it('zeigt Tage bis Vollmond bei zunehmendem Mond', () => {
      const datum = new Date(Date.UTC(2000, 0, 13))
      const ergebnis = berechneMondphase(datum)
      expect(ergebnis.anzeigeText).toMatch(/^Zunehmend – noch \d+ Tage? bis Vollmond$/)
    })

    it('zeigt Tage bis Neumond bei abnehmendem Mond', () => {
      const datum = new Date(Date.UTC(2000, 0, 28))
      const ergebnis = berechneMondphase(datum)
      expect(ergebnis.anzeigeText).toMatch(/^Abnehmend – noch \d+ Tage? bis Neumond$/)
    })
  })

  describe('nächste Mondphasen', () => {
    it('berechnet den nächsten Vollmond', () => {
      const datum = new Date(Date.UTC(2000, 0, 6))
      const ergebnis = berechneMondphase(datum)
      expect(ergebnis.naechsterVollmond).toBeInstanceOf(Date)
      expect(ergebnis.naechsterVollmond.getTime()).toBeGreaterThan(datum.getTime())
    })

    it('berechnet den nächsten Neumond', () => {
      const datum = new Date(Date.UTC(2000, 0, 6))
      const ergebnis = berechneMondphase(datum)
      expect(ergebnis.naechsterNeumond).toBeInstanceOf(Date)
      expect(ergebnis.naechsterNeumond.getTime()).toBeGreaterThan(datum.getTime())
    })

    it('nächster Vollmond liegt ca. 14-15 Tage nach Neumond', () => {
      const datum = new Date(Date.UTC(2000, 0, 6))
      const ergebnis = berechneMondphase(datum)
      const diffTage = (ergebnis.naechsterVollmond.getTime() - datum.getTime()) / (1000 * 60 * 60 * 24)
      expect(diffTage).toBeGreaterThan(13)
      expect(diffTage).toBeLessThan(16)
    })
  })

  describe('Symbole', () => {
    it('gibt 🌑 bei Neumond', () => {
      const datum = new Date(Date.UTC(2000, 0, 6))
      expect(berechneMondphase(datum).symbol).toBe('🌑')
    })

    it('gibt 🌕 bei Vollmond', () => {
      const datum = new Date(Date.UTC(2000, 0, 21))
      expect(berechneMondphase(datum).symbol).toBe('🌕')
    })

    it('gibt ein Mond-Emoji zurück', () => {
      const mondEmojis = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘']
      const datum = new Date(Date.UTC(2000, 0, 10))
      expect(mondEmojis).toContain(berechneMondphase(datum).symbol)
    })
  })

  describe('Rückgabe-Objekt', () => {
    it('enthält alle erwarteten Felder', () => {
      const ergebnis = berechneMondphase(new Date())
      expect(ergebnis).toHaveProperty('phase')
      expect(ergebnis).toHaveProperty('tageImZyklus')
      expect(ergebnis).toHaveProperty('beleuchtung')
      expect(ergebnis).toHaveProperty('naechsterVollmond')
      expect(ergebnis).toHaveProperty('naechsterNeumond')
      expect(ergebnis).toHaveProperty('anzeigeText')
      expect(ergebnis).toHaveProperty('symbol')
    })

    it('tageImZyklus liegt zwischen 0 und 30', () => {
      const ergebnis = berechneMondphase(new Date())
      expect(ergebnis.tageImZyklus).toBeGreaterThanOrEqual(0)
      expect(ergebnis.tageImZyklus).toBeLessThan(30)
    })

    it('beleuchtung liegt zwischen 0 und 100', () => {
      const ergebnis = berechneMondphase(new Date())
      expect(ergebnis.beleuchtung).toBeGreaterThanOrEqual(0)
      expect(ergebnis.beleuchtung).toBeLessThanOrEqual(100)
    })
  })
})
