"use client"

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Define directions
const directions = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
}

// Snake piece type
type SnakePiece = {
  x: number
  y: number
  direction: keyof typeof directions
}

// Snake types
const snakeTypes = {
  normal: { heads: 1 },
  doubleHead: { heads: 2 },
}

// Snake colors
const snakeColors = {
  black: '#000000',
  red: '#FF0000',
  blue: '#0000FF',
  yellow: '#FFFF00',
  orange: '#FFA500',
  pink: '#FFC0CB',
  brown: '#A52A2A',
  rainbow: 'rainbow',
}

// Food types
const foodTypes = {
  apple: { color: '#e74c3c', sound: '/sounds/chew.mp3' },
  watermelon: { color: '#2ecc71', sound: '/sounds/chew.mp3' },
  cherry: { color: '#9b59b6', sound: '/sounds/chew.mp3' },
  kiwi: { color: '#27ae60', sound: '/sounds/chew.mp3' },
  banana: { color: '#f1c40f', sound: '/sounds/chew.mp3' },
  berry: { color: '#8e44ad', sound: '/sounds/chew.mp3' },
  chilli: { color: '#c0392b', sound: '/sounds/chew.mp3' },
  rabbit: { color: '#95a5a6', sound: '/sounds/chew.mp3' },
  frog: { color: '#2ecc71', sound: '/sounds/chew.mp3' },
  tortoise: { color: '#34495e', sound: '/sounds/chew.mp3' },
  cheese: { color: '#f39c12', sound: '/sounds/chew.mp3' },
  mushroom: { color: '#ecf0f1', sound: '/sounds/chew.mp3' },
  carrot: { color: '#e67e22', sound: '/sounds/chew.mp3' },
  tomato: { color: '#e74c3c', sound: '/sounds/chew.mp3' },
}

// Eye styles
const eyeStyles = {
  normal: 'normal',
  angry: 'angry',
  cute: 'cute',
  sleepy: 'sleepy',
}

export default function EnhancedSnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [snake, setSnake] = useState<SnakePiece[]>([
    { x: 10, y: 10, direction: 'RIGHT' },
    { x: 9, y: 10, direction: 'RIGHT' },
  ])
  const [direction, setDirection] = useState(directions.RIGHT)
  const [food, setFood] = useState({ x: 15, y: 15 })
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [cellSize, setCellSize] = useState(32)
  const [selectedFood, setSelectedFood] = useState<keyof typeof foodTypes>('apple')
  const [selectedSnake, setSelectedSnake] = useState<keyof typeof snakeTypes>('normal')
  const [selectedColor, setSelectedColor] = useState<keyof typeof snakeColors>('black')
  const [selectedEyes, setSelectedEyes] = useState<keyof typeof eyeStyles>('normal')
  const [isEating, setIsEating] = useState(false)
  const [showTongue, setShowTongue] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  // Sound effects
  const chewSound = useRef<HTMLAudioElement | null>(null)
  const bumpSound = useRef<HTMLAudioElement | null>(null)
  const hissSound = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Load audio files
    const loadAudio = (url: string) => {
      return new Promise<HTMLAudioElement>((resolve, reject) => {
        const audio = new Audio(url)
        audio.addEventListener('canplaythrough', () => resolve(audio), { once: true })
        audio.addEventListener('error', reject)
        audio.load()
      })
    }

    Promise.all([
      loadAudio('/sounds/chew.mp3'),
      loadAudio('/sounds/bump.mp3'),
      loadAudio('/sounds/hiss.mp3')
    ]).then(([chewAudio, bumpAudio, hissAudio]) => {
      chewSound.current = chewAudio
      bumpSound.current = bumpAudio
      hissSound.current = hissAudio
    }).catch(error => {
      console.error('Failed to load audio:', error)
    })
  }, [])

  // Game loop
  useEffect(() => {
    if (gameOver) return

    const gameLoop = setInterval(() => {
      moveSnake()
    }, 150)

    return () => clearInterval(gameLoop)
  }, [snake, direction, food, gameOver])

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          if (direction !== directions.DOWN) setDirection(directions.UP)
          break
        case 'ArrowDown':
          if (direction !== directions.UP) setDirection(directions.DOWN)
          break
        case 'ArrowLeft':
          if (direction !== directions.RIGHT) setDirection(directions.LEFT)
          break
        case 'ArrowRight':
          if (direction !== directions.LEFT) setDirection(directions.RIGHT)
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [direction])

  // Touch controls
  useEffect(() => {
    let touchStartX = 0
    let touchStartY = 0

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX
      touchStartY = e.touches[0].clientY
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartX || !touchStartY) return

      const touchEndX = e.touches[0].clientX
      const touchEndY = e.touches[0].clientY

      const dx = touchEndX - touchStartX
      const dy = touchEndY - touchStartY

      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0 && direction !== directions.LEFT) setDirection(directions.RIGHT)
        else if (dx < 0 && direction !== directions.RIGHT) setDirection(directions.LEFT)
      } else {
        if (dy > 0 && direction !== directions.UP) setDirection(directions.DOWN)
        else if (dy < 0 && direction !== directions.DOWN) setDirection(directions.UP)
      }

      touchStartX = 0
      touchStartY = 0
    }

    window.addEventListener('touchstart', handleTouchStart)
    window.addEventListener('touchmove', handleTouchMove)

    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
    }
  }, [direction])

  // Responsive canvas
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current
      if (!canvas) return

      const containerWidth = canvas.parentElement?.clientWidth || window.innerWidth
      const containerHeight = window.innerHeight - 200 // Adjust this value as needed

      const size = Math.min(containerWidth, containerHeight)
      canvas.width = size
      canvas.height = size

      const newCellSize = size / 20
      setCellSize(newCellSize)
    }

    handleResize()
    window.addEventListener('resize', handleResize)

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Move snake
  const moveSnake = useCallback(() => {
    setSnake(prevSnake => {
      const newSnake = [...prevSnake]
      const head = { ...newSnake[0] }

      if (selectedSnake === 'doubleHead') {
        // Move only the first head, the second head follows
        head.x += direction.x
        head.y += direction.y
        newSnake.pop() // Remove the last piece
        newSnake.unshift(head) // Add the new head
      } else {
        // Normal snake movement
        head.x += direction.x
        head.y += direction.y
      }

      // Check collision with walls
      if (head.x < 0 || head.x >= 20 || head.y < 0 || head.y >= 20) {
        setGameOver(true)
        bumpSound.current?.play().catch(e => console.error("Error playing bump sound:", e))
        setShowSettings(true)
        return prevSnake
      }

      // Check collision with self
      if (newSnake.some((segment, index) => index !== 0 && segment.x === head.x && segment.y === head.y)) {
        setGameOver(true)
        bumpSound.current?.play().catch(e => console.error("Error playing bump sound:", e))
        setShowSettings(true)
        return prevSnake
      }

      // Check if food is eaten
      if (head.x === food.x && head.y === food.y) {
        setScore(prevScore => prevScore + 1)
        setIsEating(true)
        chewSound.current?.play().catch(e => console.error("Error playing chew sound:", e))
        setTimeout(() => setIsEating(false), 500)
        spawnFood()
        // Grow the snake
        newSnake.push({ ...newSnake[newSnake.length - 1] })
      }

      // Update head direction
      head.direction = Object.keys(directions).find(
        key => directions[key as keyof typeof directions] === direction
      ) as keyof typeof directions

      // Hiss randomly
      if (Math.random() < 0.05) {
        hissSound.current?.play().catch(e => console.error("Error playing hiss sound:", e))
        setShowTongue(true)
        setTimeout(() => setShowTongue(false), 300)
      }

      return newSnake
    })
  }, [direction, food, selectedSnake])

  // Spawn food
  const spawnFood = useCallback(() => {
    let newFood
    do {
      newFood = {
        x: Math.floor(Math.random() * 20),
        y: Math.floor(Math.random() * 20),
      }
    } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y))
    setFood(newFood)
  }, [snake])

  // Draw game
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx || !canvas) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw grass background
    const grassPattern = ctx.createPattern(createGrassPattern(cellSize), 'repeat')
    if (grassPattern) {
      ctx.fillStyle = grassPattern
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    // Draw snake
    snake.forEach((segment, index) => {
      const x = segment.x * cellSize
      const y = segment.y * cellSize

      // Snake body
      ctx.beginPath()
      ctx.arc(x + cellSize / 2, y + cellSize / 2, cellSize / 2 * (1 + index * 0.05), 0, Math.PI * 2)
      if (selectedColor === 'rainbow') {
        const hue = (index * 30) % 360
        ctx.fillStyle = `hsl(${hue}, 100%, 50%)`
      } else {
        ctx.fillStyle = snakeColors[selectedColor]
      }
      ctx.fill()

      // Snake eyes (for head and tail if double-headed)
      if (index === 0 || (selectedSnake === 'doubleHead' && index === snake.length - 1)) {
        const eyeSize = cellSize / 8
        const eyeOffset = cellSize / 4

        // Draw eyes based on selected style
        switch (selectedEyes) {
          case 'angry':
            ctx.fillStyle = 'white'
            ctx.beginPath()
            ctx.moveTo(x + eyeOffset, y + eyeOffset)
            ctx.lineTo(x + eyeOffset + eyeSize, y + eyeOffset + eyeSize)
            ctx.moveTo(x + cellSize - eyeOffset, y + eyeOffset)
            ctx.lineTo(x + cellSize - eyeOffset - eyeSize, y + eyeOffset + eyeSize)
            ctx.stroke()
            break
          case 'cute':
            ctx.fillStyle = 'black'
            ctx.beginPath()
            ctx.arc(x + eyeOffset, y + eyeOffset, eyeSize, 0, Math.PI * 2)
            ctx.arc(x + cellSize - eyeOffset, y + eyeOffset, eyeSize, 0, Math.PI * 2)
            ctx.fill()
            ctx.fillStyle = 'white'
            ctx.beginPath()
            ctx.arc(x + eyeOffset + eyeSize / 2, y + eyeOffset - eyeSize / 2, eyeSize / 2, 0, Math.PI * 2)
            ctx.arc(x + cellSize - eyeOffset + eyeSize / 2, y + eyeOffset - eyeSize / 2, eyeSize / 2, 0, Math.PI * 2)
            ctx.fill()
            break
          case 'sleepy':
            ctx.strokeStyle = 'black'
            ctx.beginPath()
            ctx.moveTo(x + eyeOffset - eyeSize, y + eyeOffset)
            ctx.lineTo(x + eyeOffset + eyeSize, y + eyeOffset)
            ctx.moveTo(x + cellSize - eyeOffset - eyeSize, y + eyeOffset)
            ctx.lineTo(x + cellSize - eyeOffset + eyeSize, y + eyeOffset)
            ctx.stroke()
            break
          default: // normal eyes
            ctx.fillStyle = 'white'
            ctx.beginPath()
            ctx.arc(x + eyeOffset, y + eyeOffset, eyeSize, 0, Math.PI * 

 2)
            ctx.arc(x + cellSize - eyeOffset, y + eyeOffset, eyeSize, 0, Math.PI * 2)
            ctx.fill()
            ctx.fillStyle = 'black'
            ctx.beginPath()
            ctx.arc(x + eyeOffset, y + eyeOffset, eyeSize / 2, 0, Math.PI * 2)
            ctx.arc(x + cellSize - eyeOffset, y + eyeOffset, eyeSize / 2, 0, Math.PI * 2)
            ctx.fill()
        }

        // Draw tongue
        if (showTongue && index === 0) {
          ctx.fillStyle = 'red'
          ctx.beginPath()
          ctx.moveTo(x + cellSize / 2, y + cellSize)
          ctx.lineTo(x + cellSize / 2 - cellSize / 8, y + cellSize + cellSize / 4)
          ctx.lineTo(x + cellSize / 2 + cellSize / 8, y + cellSize + cellSize / 4)
          ctx.closePath()
          ctx.fill()
        }

        // Open mouth when eating
        if (isEating && index === 0) {
          ctx.fillStyle = 'red'
          ctx.beginPath()
          ctx.arc(x + cellSize / 2, y + cellSize - eyeOffset, eyeSize, 0, Math.PI)
          ctx.fill()
        }
      }
    })

    // Draw food
    const foodX = food.x * cellSize
    const foodY = food.y * cellSize

    ctx.fillStyle = foodTypes[selectedFood].color
    ctx.beginPath()
    ctx.arc(foodX + cellSize / 2, foodY + cellSize / 2, cellSize / 2.5, 0, Math.PI * 2)
    ctx.fill()

    // Food highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
    ctx.beginPath()
    ctx.ellipse(foodX + cellSize / 3, foodY + cellSize / 3, cellSize / 8, cellSize / 16, Math.PI / 4, 0, Math.PI * 2)
    ctx.fill()

  }, [snake, food, cellSize, selectedFood, selectedSnake, selectedColor, selectedEyes, isEating, showTongue])

  // Create grass pattern
  const createGrassPattern = (size: number) => {
    const patternCanvas = document.createElement('canvas')
    patternCanvas.width = size
    patternCanvas.height = size
    const patternCtx = patternCanvas.getContext('2d')
    if (!patternCtx) return patternCanvas

    patternCtx.fillStyle = '#2ecc71'
    patternCtx.fillRect(0, 0, size, size)

    for (let i = 0; i < 5; i++) {
      patternCtx.strokeStyle = '#27ae60'
      patternCtx.beginPath()
      patternCtx.moveTo(Math.random() * size, Math.random() * size)
      patternCtx.lineTo(Math.random() * size, Math.random() * size)
      patternCtx.stroke()
    }

    return patternCanvas
  }

  // Reset game
  const resetGame = useCallback(() => {
    setSnake([
      { x: 10, y: 10, direction: 'RIGHT' },
      { x: 9, y: 10, direction: 'RIGHT' },
    ])
    setDirection(directions.RIGHT)
    spawnFood()
    setGameOver(false)
    setScore(0)
    setShowSettings(false)
  }, [spawnFood])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-4xl font-bold mb-4">Enhanced Snake Game</h1>
      <div className="relative w-full max-w-lg">
        <canvas ref={canvasRef} className="w-full h-auto border border-gray-300 rounded-lg shadow-lg" />
        {(gameOver || showSettings) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
            <div className="bg-white p-4 rounded-lg text-center">
              <h2 className="text-2xl font-bold mb-2">Game Over</h2>
              <p className="mb-4">Your score: {score}</p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Snake Type</label>
                <Select value={selectedSnake} onValueChange={(value: keyof typeof snakeTypes) => setSelectedSnake(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select snake type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(snakeTypes).map((snake) => (
                      <SelectItem key={snake} value={snake}>
                        {snake === 'normal' ? 'Normal' : 'Double Head'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Snake Color</label>
                <Select value={selectedColor} onValueChange={(value: keyof typeof snakeColors) => setSelectedColor(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select snake color" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(snakeColors).map((color) => (
                      <SelectItem key={color} value={color}>
                        {color.charAt(0).toUpperCase() + color.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Eye Style</label>
                <Select value={selectedEyes} onValueChange={(value: keyof typeof eyeStyles) => setSelectedEyes(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select eye style" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(eyeStyles).map((style) => (
                      <SelectItem key={style} value={style}>
                        {style.charAt(0).toUpperCase() + style.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Food</label>
                <Select value={selectedFood} onValueChange={(value: keyof typeof foodTypes) => setSelectedFood(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select food" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(foodTypes).map((food) => (
                      <SelectItem key={food} value={food}>
                        {food.charAt(0).toUpperCase() + food.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={resetGame}>Play Again</Button>
            </div>
          </div>
        )}
      </div>
      <p className="mt-4 text-xl">Score: {score}</p>
      <div className="mt-4 text-center">
        <p>Use arrow keys on desktop or swipe on mobile to control the snake.</p>
      </div>
    </div>
  )
}