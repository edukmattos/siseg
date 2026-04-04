import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const CartContext = createContext(null)

function getInitialCart() {
  try {
    const saved = localStorage.getItem('cart')
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

// eslint-disable-next-line react-refresh/only-export-components
export function CartProvider({ children }) {
  const [items, setItems] = useState(getInitialCart)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items))
  }, [items])

  const addItem = useCallback((course) => {
    setItems((prev) => {
      const exists = prev.find((item) => item.id === course.id)
      if (exists) {
        return prev.map((item) =>
          item.id === course.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { ...course, quantity: 1 }]
    })
  }, [])

  const removeItem = useCallback((courseId) => {
    setItems((prev) => prev.filter((item) => item.id !== courseId))
  }, [])

  const updateQuantity = useCallback((courseId, quantity) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((item) => item.id !== courseId))
      return
    }
    setItems((prev) =>
      prev.map((item) =>
        item.id === courseId ? { ...item, quantity } : item
      )
    )
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  const toggleCart = useCallback(() => {
    setIsOpen((prev) => !prev)
  }, [])

  const closeCart = useCallback(() => {
    setIsOpen(false)
  }, [])

  const openCart = useCallback(() => {
    setIsOpen(true)
  }, [])

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce(
    (sum, item) => sum + item.priceCents * item.quantity,
    0
  )

  const value = {
    items,
    itemCount,
    totalPrice,
    isOpen,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    toggleCart,
    closeCart,
    openCart,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

export default CartContext
