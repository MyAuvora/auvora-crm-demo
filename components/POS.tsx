'use client';

import { useState } from 'react';
import { useApp } from '@/lib/context';
import { products, members, classPackClients } from '@/data/seedData';
import { ShoppingCart, Package, AlertTriangle } from 'lucide-react';

type CartItem = {
  product: any;
  quantity: number;
};

export default function POS() {
  const { location } = useApp();
  const [activeTab, setActiveTab] = useState<'pos' | 'inventory'>('pos');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);

  const locationProducts = products.filter(p => p.location === location);
  const allMembers = [...members, ...classPackClients].filter(m => m.location === location);

  const addToCart = (product: any) => {
    const existing = cart.find(item => item.product.id === product.id);
    if (existing) {
      setCart(cart.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart(cart.map(item =>
        item.product.id === productId
          ? { ...item, quantity }
          : item
      ));
    }
  };

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  };

  const completeSale = () => {
    setShowSuccess(true);
    setCart([]);
    setSelectedMember('');
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">POS & Inventory</h1>
        <p className="text-gray-600 mt-1">Manage sales and inventory</p>
      </div>

      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('pos')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'pos'
                  ? 'text-red-600 border-b-2 border-red-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Point of Sale
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'inventory'
                  ? 'text-red-600 border-b-2 border-red-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Inventory
            </button>
          </div>
        </div>

        {activeTab === 'pos' ? (
          <div className="p-6">
            {showSuccess && (
              <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg">
                Sale completed successfully!
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Member (Optional)
                  </label>
                  <select
                    value={selectedMember}
                    onChange={(e) => setSelectedMember(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                  >
                    <option value="">Guest / Walk-in</option>
                    {allMembers.map(member => (
                      <option key={member.id} value={member.id}>{member.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Products</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {locationProducts.map(product => (
                      <button
                        key={product.id}
                        onClick={() => addToCart(product)}
                        className="p-4 border border-gray-300 rounded-lg hover:border-red-600 hover:bg-red-50 transition-colors text-left"
                      >
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-600">{product.category}</p>
                        <p className="text-lg font-bold text-red-600 mt-2">${product.price}</p>
                        <p className="text-xs text-gray-500">Stock: {product.stock}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Memberships & Packs</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {location === 'athletic-club' && (
                      <>
                        <button className="p-4 border border-gray-300 rounded-lg hover:border-red-600 hover:bg-red-50 transition-colors text-left">
                          <p className="font-medium text-gray-900">1x/week</p>
                          <p className="text-lg font-bold text-red-600 mt-2">$99/mo</p>
                        </button>
                        <button className="p-4 border border-gray-300 rounded-lg hover:border-red-600 hover:bg-red-50 transition-colors text-left">
                          <p className="font-medium text-gray-900">2x/week</p>
                          <p className="text-lg font-bold text-red-600 mt-2">$149/mo</p>
                        </button>
                        <button className="p-4 border border-gray-300 rounded-lg hover:border-red-600 hover:bg-red-50 transition-colors text-left">
                          <p className="font-medium text-gray-900">Unlimited</p>
                          <p className="text-lg font-bold text-red-600 mt-2">$199/mo</p>
                        </button>
                      </>
                    )}
                    <button className="p-4 border border-gray-300 rounded-lg hover:border-red-600 hover:bg-red-50 transition-colors text-left">
                      <p className="font-medium text-gray-900">5-pack</p>
                      <p className="text-lg font-bold text-red-600 mt-2">$75</p>
                    </button>
                    <button className="p-4 border border-gray-300 rounded-lg hover:border-red-600 hover:bg-red-50 transition-colors text-left">
                      <p className="font-medium text-gray-900">10-pack</p>
                      <p className="text-lg font-bold text-red-600 mt-2">$140</p>
                    </button>
                    <button className="p-4 border border-gray-300 rounded-lg hover:border-red-600 hover:bg-red-50 transition-colors text-left">
                      <p className="font-medium text-gray-900">20-pack</p>
                      <p className="text-lg font-bold text-red-600 mt-2">$260</p>
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg h-fit">
                <div className="flex items-center gap-2 mb-4">
                  <ShoppingCart className="text-red-600" size={24} />
                  <h3 className="text-lg font-bold text-gray-900">Cart</h3>
                </div>

                {cart.length === 0 ? (
                  <p className="text-gray-600 text-center py-8">Cart is empty</p>
                ) : (
                  <>
                    <div className="space-y-3 mb-4">
                      {cart.map(item => (
                        <div key={item.product.id} className="flex items-center justify-between p-3 bg-white rounded border border-gray-200">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{item.product.name}</p>
                            <p className="text-sm text-gray-600">${item.product.price} each</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                            >
                              -
                            </button>
                            <span className="font-medium">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-gray-300 pt-4 mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-gray-900">Total</span>
                        <span className="text-2xl font-bold text-red-600">${getTotal().toFixed(2)}</span>
                      </div>
                    </div>

                    <button
                      onClick={completeSale}
                      className="w-full bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 transition-colors"
                    >
                      Complete Sale
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Product</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Category</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Price</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Stock</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {locationProducts.map(product => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{product.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{product.category}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">${product.price}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{product.stock}</td>
                      <td className="px-4 py-3 text-sm">
                        {product.stock < 10 ? (
                          <span className="flex items-center gap-1 text-red-600">
                            <AlertTriangle size={16} />
                            Low Stock
                          </span>
                        ) : (
                          <span className="text-green-600">In Stock</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
