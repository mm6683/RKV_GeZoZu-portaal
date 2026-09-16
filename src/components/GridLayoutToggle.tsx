'use client'
import { useEffect, useState } from 'react'
import { useGridLayout } from '@/hooks/useGridLayout'

export default function GridLayoutToggle() {
  const isGrid = useGridLayout()

  function toggle() {
    const next = !isGrid
    try { localStorage.setItem('grid-layout', next ? 'true' : 'false') } catch {}
    window.dispatchEvent(new Event('grid-layout-change'))
  }

  return (
    <button
      onClick={toggle}
      title={isGrid ? 'Schakel naar lijstweergave' : 'Schakel naar rasterweergave'}
      aria-label={isGrid ? 'Schakel naar lijstweergave' : 'Schakel naar rasterweergave'}
      className={`flex items-center justify-center w-9 h-9 rounded-xl hover:bg-rkv-gray transition-colors text-rkv-teal-dark flex-shrink-0`}
    >
      {isGrid ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
      )}
    </button>
  )
}
