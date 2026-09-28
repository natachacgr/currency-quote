import {
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react'

import {
  ThemeContext,
  type Theme,
} from './theme-context'

const THEME_STORAGE_KEY = 'currency-quote:theme'

function getInitialTheme(): Theme {
  const storedTheme = localStorage.getItem(
    THEME_STORAGE_KEY,
  )

  if (
    storedTheme === 'light' ||
    storedTheme === 'dark'
  ) {
    return storedTheme
  }

  return window.matchMedia(
    '(prefers-color-scheme: dark)',
  ).matches
    ? 'dark'
    : 'light'
}

export function ThemeProvider({
  children,
}: PropsWithChildren) {
  const [theme, setTheme] =
    useState<Theme>(getInitialTheme)

  useEffect(() => {
    const root = document.documentElement

    root.classList.toggle(
      'dark',
      theme === 'dark',
    )

    localStorage.setItem(
      THEME_STORAGE_KEY,
      theme,
    )
  }, [theme])

  const toggleTheme = (): void => {
    setTheme((currentTheme) =>
      currentTheme === 'dark'
        ? 'light'
        : 'dark',
    )
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}