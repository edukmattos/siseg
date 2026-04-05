import { useState } from 'react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import CheckoutFlow from './CheckoutFlow'

function CartDrawer({ onShowLogin, onShowCompanyRegister }) {
  const { items, itemCount, totalPrice, isOpen, closeCart, removeItem, updateQuantity } = useCart()
  const { isAuthenticated, hasCompany } = useAuth()
  const [showCheckout, setShowCheckout] = useState(false)

  if (!isOpen) return null

  function formatPrice(cents) {
    return (cents / 100).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  function handleCheckout() {
    if (!isAuthenticated) {
      closeCart()
      if (onShowLogin) onShowLogin()
      return
    }
    if (!hasCompany) {
      closeCart()
      if (onShowCompanyRegister) onShowCompanyRegister()
      return
    }
    setShowCheckout(true)
  }

  // eslint-disable-next-line no-unused-vars
  function handleBackToCart() {
    setShowCheckout(false)
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-50 transition-opacity"
        onClick={() => { closeCart(); setShowCheckout(false) }}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-surface-container-lowest z-50 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-surface-container-high">
          <div>
            <h2 className="text-xl font-headline font-extrabold text-primary">
              {showCheckout ? 'Checkout' : 'Carrinho'}
            </h2>
            {!showCheckout && (
              <p className="text-sm text-on-surface-variant">
                {itemCount} {itemCount === 1 ? 'licença' : 'licenças'}
              </p>
            )}
          </div>
          <button
            onClick={() => { closeCart(); setShowCheckout(false) }}
            className="p-2 rounded-xl hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-on-surface-variant">
              close
            </span>
          </button>
        </div>

        {/* Content */}
        {showCheckout ? (
          <div className="flex-1 overflow-y-auto p-6">
            <CheckoutFlow onClose={() => { closeCart(); setShowCheckout(false) }} />
          </div>
        ) : (
          <>
            {/* Items */}
            <div className="flex-1 overflow-y-auto p-6">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <span className="material-symbols-outlined text-6xl text-outline-variant mb-4">

                  </span>
                  <p className="text-on-surface-variant font-headline font-bold">
                    Carrinho vazio
                  </p>
                  <p className="text-sm text-on-surface-variant mt-1">
                    Adicione cursos para começar
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-4 p-4 bg-surface-container rounded-xl"
                    >
                      {/* Thumbnail */}
                      <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-primary uppercase tracking-tighter">
                              {item.nr}
                            </p>
                            <h3 className="text-sm font-headline font-bold text-primary leading-tight truncate">
                              {item.title}
                            </h3>
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-1 rounded-lg hover:bg-surface-container-high transition-colors shrink-0"
                          >
                            <span className="material-symbols-outlined text-xs text-on-surface-variant">
                              delete
                            </span>
                          </button>
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          {/* Quantity Controls */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                updateQuantity(item.id, item.quantity - 1)
                              }
                              className="w-7 h-7 rounded-lg bg-surface-container-high flex items-center justify-center hover:bg-surface-container-highest transition-colors"
                            >
                              <span className="material-symbols-outlined text-sm">
                                remove
                              </span>
                            </button>
                            <span className="text-sm font-bold text-primary w-6 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(item.id, item.quantity + 1)
                              }
                              className="w-7 h-7 rounded-lg bg-surface-container-high flex items-center justify-center hover:bg-surface-container-highest transition-colors"
                            >
                              <span className="material-symbols-outlined text-sm">
                                add
                              </span>
                            </button>
                          </div>

                          {/* Price */}
                          <span className="text-sm font-headline font-extrabold text-primary">
                            R$ {formatPrice(item.priceCents * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-surface-container-high p-6 space-y-4">
                {/* Subtotal */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-on-surface-variant">Sub-total</span>
                  <span className="text-lg font-headline font-extrabold text-primary">
                    R$ {formatPrice(totalPrice)}
                  </span>
                </div>

                {/* CTA */}
                <button
                  onClick={handleCheckout}
                  className="w-full bg-primary text-white py-4 rounded-xl font-headline font-bold text-sm hover:opacity-90 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">
                    lock
                  </span>
                  Finalizar Compra
                </button>

                <button
                  onClick={closeCart}
                  className="w-full text-sm text-on-surface-variant hover:text-primary transition-colors py-2 font-medium"
                >
                  Continuar navegando
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}

export default CartDrawer
