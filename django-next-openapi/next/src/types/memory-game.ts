import type { UnsplashPhoto, PhotoTheme } from "~/lib/unsplash"

export type GridSize = "4x4" | "6x6"

export interface GameSettings {
  gridSize: GridSize
  theme: PhotoTheme
}

export interface GameCard {
  id: string
  photo: UnsplashPhoto
  isFlipped: boolean
  isMatched: boolean
  pairId: string
}

export interface GameState {
  cards: GameCard[]
  flippedCards: string[]
  matchedPairs: number
  moves: number
  startTime: number | null
  endTime: number | null
  isGameComplete: boolean
  settings: GameSettings
}

export type GameScreen = "initial" | "playing" | "completed"
