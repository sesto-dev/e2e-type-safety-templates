export type GridSize = "3x3" | "4x4" | "5x5" | "6x6" | "7x7"

export type TileType = "start" | "end" | "straight" | "bend"

export type Direction = "north" | "south" | "east" | "west"

export interface Position {
  row: number
  col: number
}

export interface PipeTile {
  id: string
  type: TileType
  rotation: number // 0, 90, 180, 270 degrees
  position: Position
  connections: Direction[] // which directions this tile connects to based on type and rotation
}

export interface GameSettings {
  gridSize: GridSize
}

export interface GameState {
  tiles: PipeTile[]
  gridSize: GridSize
  isGameComplete: boolean
  timeRemaining: number
  gameStarted: boolean
  gameOver: boolean
  connectedTiles: Set<string> // IDs of tiles that are part of the connected path
}

export type GameScreen = "initial" | "playing" | "completed" | "gameOver"

// Helper function to get connections based on tile type and rotation
export function getTileConnections(type: TileType, rotation: number): Direction[] {
  const baseConnections: Record<TileType, Direction[]> = {
    start: ["east"], // green dot with line going east
    end: ["west"], // red dot with line going west
    straight: ["north", "south"], // vertical line by default
    bend: ["north", "east"], // L-shape by default
  }

  const base = baseConnections[type]

  // Rotate connections based on rotation angle
  const rotationSteps = rotation / 90
  return base.map((dir) => rotateDirection(dir, rotationSteps))
}

function rotateDirection(direction: Direction, steps: number): Direction {
  const directions: Direction[] = ["north", "east", "south", "west"]
  const currentIndex = directions.indexOf(direction)
  const newIndex = (currentIndex + steps) % 4
  return directions[newIndex]
}

// Helper function to get time limit based on grid size
export function getTimeLimit(gridSize: GridSize): number {
  switch (gridSize) {
    case "3x3":
      return 60
    case "4x4":
      return 90
    case "5x5":
      return 120
    default:
      return 90
  }
}

export function getDirectionBetween(from: Position, to: Position): Direction {
  if (to.row < from.row) return "north"
  if (to.row > from.row) return "south"
  if (to.col > from.col) return "east"
  return "west"
}
