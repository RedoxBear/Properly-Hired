import React from 'react'
import { useTheme } from '@/components/ThemeProvider'
import { Moon, Sun, Monitor } from 'lucide-react'

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Prevent hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="p-2 rounded-lg w-9 h-9 bg-muted animate-pulse" />
    )
  }

  // Cycle through: light -> dark -> system
  const cycleTheme = () => {
    if (theme === 'light') {
      setTheme('dark')
    } else if (theme === 'dark') {
      setTheme('system')
    } else {
      setTheme('light')
    }
  }

  const getIcon = () => {
    if (theme === 'system') {
      return <Monitor className="w-5 h-5 text-blue-500 dark:text-blue-400" />
    }
    if (resolvedTheme === 'dark') {
      return <Sun className="w-5 h-5 text-amber-500" />
    }
    return <Moon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
  }

  const getTitle = () => {
    if (theme === 'system') {
      return 'Using system preference - click for light mode'
    }
    if (theme === 'dark') {
      return 'Dark mode - click for system preference'
    }
    return 'Light mode - click for dark mode'
  }

  return (
    <button
      onClick={cycleTheme}
      className="p-2 rounded-lg hover:bg-accent transition-colors duration-200"
      title={getTitle()}
      aria-label="Toggle theme"
    >
      {getIcon()}
    </button>
  )
}