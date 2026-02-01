"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { aspectosEvaluacionService, type Aspecto } from "@/src/api"

export type FormAspect = {
  id: number
  name: string
  active: boolean
}

const mapAspect = (aspect: Aspecto): FormAspect => ({
  id: aspect.id,
  name: aspect.nombre,
  active: true,
})

type FormContextType = {
  aspects: FormAspect[]
  toggleAspectActive: (id: number) => void
  activeAspects: FormAspect[]
  activeAspectIds: number[]
  isLoading: boolean
  error: string | null
  reloadAspects: () => Promise<void>
}

const FormContext = createContext<FormContextType | undefined>(undefined)

export function FormProvider({ children }: { children: ReactNode }) {
  const [aspects, setAspects] = useState<FormAspect[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const reloadAspects = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    const response = await aspectosEvaluacionService.getAll({ page: 1, limit: 1000 })

    if (response.success) {
      const items = Array.isArray(response.data?.data) ? response.data.data : []
      setAspects(items.map(mapAspect))
    } else {
      setAspects([])
      setError("No se pudieron cargar los aspectos.")
    }

    setIsLoading(false)
  }, [])

  useEffect(() => {
    const load = async () => {
      await reloadAspects()
    }

    load()
  }, [reloadAspects])

  const toggleAspectActive = useCallback((id: number) => {
    setAspects((prevAspects) =>
      prevAspects.map((aspect) => (aspect.id === id ? { ...aspect, active: !aspect.active } : aspect)),
    )
  }, [])

  // Memoize los aspectos activos para evitar recálculos innecesarios
  const activeAspects = useMemo(() => {
    return aspects.filter((aspect) => aspect.active)
  }, [aspects])

  // Memoize los IDs de aspectos activos para comparaciones rápidas
  const activeAspectIds = useMemo(() => {
    return activeAspects.map((aspect) => aspect.id)
  }, [activeAspects])

  // Memoize el valor del contexto para evitar re-renderizados innecesarios
  const contextValue = useMemo(
    () => ({
      aspects,
      toggleAspectActive,
      activeAspects,
      activeAspectIds,
      isLoading,
      error,
      reloadAspects,
    }),
    [aspects, activeAspects, activeAspectIds, isLoading, error, toggleAspectActive, reloadAspects],
  )

  return <FormContext.Provider value={contextValue}>{children}</FormContext.Provider>
}

export function useFormContext() {
  const context = useContext(FormContext)
  if (context === undefined) {
    throw new Error("useFormContext must be used within a FormProvider")
  }
  return context
}

