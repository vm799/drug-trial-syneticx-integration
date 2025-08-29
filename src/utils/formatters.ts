// Utility functions for number formatting and display

export const formatLargeNumber = (num: number): string => {
  if (!num || num === 0) return '0'
  
  if (num >= 1000000000) {
    return `${(num / 1000000000).toFixed(1)}B`
  } else if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`
  }
  
  return num.toLocaleString()
}

export const formatCurrency = (num: number): string => {
  if (!num || num === 0) return '$0'
  
  if (num >= 1000000000) {
    return `$${(num / 1000000000).toFixed(1)}B`
  } else if (num >= 1000000) {
    return `$${(num / 1000000).toFixed(1)}M`
  } else if (num >= 1000) {
    return `$${(num / 1000).toFixed(1)}K`
  }
  
  return `$${num.toLocaleString()}`
}

export const formatPercentage = (num: number): string => {
  return `${num.toFixed(1)}%`
}

export const formatDate = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString()
  } catch {
    return dateString
  }
}