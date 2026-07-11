import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import api from '../api/client'
import Navbar from '../components/ui/Navbar'
import toast from 'react-hot-toast'
import { ShoppingCart, Plus, Minus, BookOpen, Package } from 'lucide-react'

export default function Shop() {
  const [cart, setCart] = useState([])
  const [showCart, setShowCart] = useState(false)

  const { data } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.get('/products').then(r => r.data),
  })

  const addToCart = (product) => {
    setCart(prev => {
      const exists = prev.find(i => i.id === product.id)
      if (exists) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { ...product, qty: 1 }]
    })
    toast.success('Added to cart!')
  }

  const updateQty = (id, delta) => {
    setCart(prev => {
      const updated = prev.map(i => i.id === id ? { ...i, qty: i.qty + delta } : i)
      return updated.filter(i => i.qty > 0)
    })
  }

  const cartTotal = cart.reduce((a, i) => a + (i.sale_price || i.price) * i.qty, 0)
  const cartCount = cart.reduce((a, i) => a + i.qty, 0)

  const orderMutation = useMutation({
    mutationFn: () => api.post('/products/orders/create', {
      items: cart.map(i => ({ product_id: i.id, quantity: i.qty })),
      payment_method: 'khalti',
    }),
    onSuccess: ({ data }) => {
      toast.success(`Order #${data.orderNumber} placed!`)
      setCart([])
      setShowCart(false)
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Order failed'),
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Book Store</h1>
            <p className="text-gray-500 mt-1">Study materials, books and resources</p>
          </div>
          <button onClick={() => setShowCart(!showCart)}
            className="btn-secondary flex items-center gap-2 relative">
            <ShoppingCart size={18} />
            Cart
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-indigo-600 text-white text-xs rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>

        {/* Cart */}
        {showCart && cart.length > 0 && (
          <div className="card p-5 mb-8">
            <h3 className="font-semibold text-gray-900 mb-4">Your Cart</h3>
            {cart.map(item => (
              <div key={item.id} className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0">
                <img src={item.thumbnail_url || 'https://placehold.co/48x48?text=Book'}
                  className="w-12 h-12 rounded-lg object-cover" alt="" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{item.title}</p>
                  <p className="text-sm text-indigo-600">NPR {item.sale_price || item.price}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQty(item.id, -1)}
                    className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50">
                    <Minus size={14} />
                  </button>
                  <span className="w-6 text-center text-sm font-medium">{item.qty}</span>
                  <button onClick={() => updateQty(item.id, 1)}
                    className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50">
                    <Plus size={14} />
                  </button>
                </div>
                <p className="text-sm font-semibold w-20 text-right">
                  NPR {((item.sale_price || item.price) * item.qty).toFixed(0)}
                </p>
              </div>
            ))}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-xl font-bold text-gray-900">NPR {cartTotal.toFixed(0)}</p>
              </div>
              <button onClick={() => orderMutation.mutate()}
                disabled={orderMutation.isPending}
                className="btn-primary">
                {orderMutation.isPending ? 'Placing...' : 'Place Order'}
              </button>
            </div>
          </div>
        )}

        {/* Products grid */}
        <div className="grid grid-cols-4 gap-6">
          {data?.products?.map(product => (
            <div key={product.id} className="card overflow-hidden hover:shadow-md transition-all hover:-translate-y-0.5">
              <img src={product.thumbnail_url || 'https://placehold.co/300x200?text=Book'}
                alt={product.title} className="w-full h-44 object-cover" />
              <div className="p-4">
                <span className="badge bg-indigo-50 text-indigo-600 text-xs mb-2">
                  {product.type === 'book' ? <BookOpen size={10} /> : <Package size={10} />}
                  {product.type}
                </span>
                <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1 text-sm">{product.title}</h3>
                <div className="flex items-center gap-2 mb-3">
                  {product.sale_price ? (
                    <>
                      <span className="font-bold text-indigo-600">NPR {product.sale_price}</span>
                      <span className="text-xs text-gray-400 line-through">NPR {product.price}</span>
                    </>
                  ) : (
                    <span className="font-bold text-gray-900">NPR {product.price}</span>
                  )}
                </div>
                {product.stock > 0 || product.is_digital ? (
                  <button onClick={() => addToCart(product)} className="btn-primary w-full text-sm">
                    Add to Cart
                  </button>
                ) : (
                  <button disabled className="btn-secondary w-full text-sm opacity-50 cursor-not-allowed">
                    Out of Stock
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}