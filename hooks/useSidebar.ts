// hooks/useSidebar.ts
import { useState, useEffect } from 'react'

export function useSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Persistir estado en localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved !== null) {
      setIsCollapsed(JSON.parse(saved))
    }
  }, [])

  // Guardar estado cuando cambie
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(isCollapsed))
  }, [isCollapsed])

  // Auto-colapsar en pantallas pequeñas
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1280) { // xl breakpoint
        setIsCollapsed(true)
      }
    }

    handleResize() // Ejecutar al montar
    window.addEventListener('resize', handleResize)
    
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const toggle = (collapsed?: boolean) => {
    setIsCollapsed(collapsed !== undefined ? collapsed : !isCollapsed)
  }

  return {
    isCollapsed,
    toggle
  }
}