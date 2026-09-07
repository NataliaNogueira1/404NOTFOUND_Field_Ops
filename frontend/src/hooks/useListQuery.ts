import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

const PAGE_SIZES = [10, 25, 50]

export function useListQuery(defaultSort = 'name,asc') {
  const [params, setParams] = useSearchParams()
  const parsedPage = Number(params.get('page') ?? 0)
  const parsedSize = Number(params.get('size') ?? 10)
  const page = Number.isInteger(parsedPage) && parsedPage >= 0 ? parsedPage : 0
  const size = PAGE_SIZES.includes(parsedSize) ? parsedSize : 10
  const sort = params.get('sort') || defaultSort

  function value(name: string) {
    return params.get(name) ?? ''
  }

  function update(name: string, nextValue: string, resetPage = true) {
    const next = new URLSearchParams(params)
    if (nextValue) next.set(name, nextValue)
    else next.delete(name)
    if (resetPage) next.set('page', '0')
    setParams(next, { replace: true })
  }

  function setPage(nextPage: number) {
    update('page', String(Math.max(0, nextPage)), false)
  }

  function setSize(nextSize: number) {
    const next = PAGE_SIZES.includes(nextSize) ? nextSize : 10
    update('size', String(next))
  }

  function toggleSort(key: string) {
    const [currentKey, direction = 'asc'] = sort.split(',')
    update('sort', `${key},${currentKey === key && direction === 'asc' ? 'desc' : 'asc'}`)
  }

  function clear(names: string[]) {
    const next = new URLSearchParams(params)
    names.forEach(name => next.delete(name))
    next.set('page', '0')
    setParams(next, { replace: true })
  }

  return { page, size, sort, value, update, setPage, setSize, toggleSort, clear }
}

export function useDebouncedValue<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(timer)
  }, [delay, value])
  return debounced
}
