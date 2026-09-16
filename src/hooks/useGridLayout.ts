'use client'
import { useState, useEffect } from 'react'

export function useGridLayout() {
  const [isGrid, setIsGrid] = useState(false)

  useEffect(() => {
    setIsGrid(localStorage.getItem('grid-layout') === 'true')
    
    function handleStorage(e?: Event) {
      setIsGrid(localStorage.getItem('grid-layout') === 'true')
    }
    
    window.addEventListener('storage', handleStorage)
    window.addEventListener('grid-layout-change', handleStorage)
    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('grid-layout-change', handleStorage)
    }
  }, [])

  return isGrid
}
