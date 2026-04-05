import { useState } from 'react'
import { useCart } from '../context/CartContext'

function CourseCard({ course, onViewDetails }) {
  const { nr, level, title, hours, modality, priceCents, image, hasESocial, modalityIcon, id } = course
  const { addItem, openCart } = useCart()
  const [isAdding, setIsAdding] = useState(false)

  function handleAddToCart() {
    setIsAdding(true)
    addItem({
      id,
      nr,
      title,
      priceCents,
      image,
    })
    openCart()
    setTimeout(() => setIsAdding(false), 600)
  }

  return (
    <div className="bg-surface-container-lowest rounded-xl overflow-hidden group hover:shadow-[0_20px_40px_rgba(9,20,38,0.1)] transition-all duration-300 border border-transparent hover:border-outline-variant/30 flex flex-col">
      <div className="h-48 relative overflow-hidden">
        <img
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          src={image}
        />
        <div className="absolute top-4 left-4 flex gap-2">
          <span className="bg-primary text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-tighter">
            {nr}
          </span>
          <span className="bg-white/90 backdrop-blur text-primary text-[10px] font-bold px-2 py-1 rounded uppercase tracking-tighter">
            {level}
          </span>
        </div>
        {hasESocial && (
          <div className="absolute bottom-4 right-4 bg-tertiary-fixed text-on-tertiary-fixed text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
            <span
              className="material-symbols-outlined text-[12px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              verified
            </span>
            Válido p/ e-Social
          </div>
        )}
      </div>
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-headline font-bold text-primary leading-tight">
            {title}
          </h3>
        </div>
        <div className="flex items-center gap-4 text-xs text-on-surface-variant mb-6">
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">schedule</span>
            {hours}
          </div>
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">
              {modalityIcon}
            </span>
            {modality}
          </div>
        </div>
        <div className="mt-auto pt-6 border-t border-surface-container-low flex items-end justify-between gap-2">
          <div>
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">
              Preço por licença
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-bold text-primary">R$</span>
              <span className="text-2xl font-headline font-extrabold text-primary">
                {(priceCents / 100).toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onViewDetails && onViewDetails(course)}
              className="p-3 bg-white border-2 border-primary text-primary rounded-xl hover:bg-primary/5 transition-all active:scale-[0.98]"
              title="Ver detalhes"
            >
              <span className="material-symbols-outlined">visibility</span>
            </button>
            <button
              onClick={handleAddToCart}
              className={`p-3 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center ${isAdding
                  ? 'bg-green-600 text-white scale-110'
                  : 'bg-primary text-white hover:opacity-90'
                }`}
            >
              <span
                className={`material-symbols-outlined transition-transform duration-300 ${isAdding ? 'animate-bounce' : ''
                  }`}
              >
                {isAdding ? 'check' : 'add_shopping_cart'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CourseCard
