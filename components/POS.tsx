'use client';

import { useState } from 'react';
import { useApp } from '@/lib/context';
import { getAllProducts, getAllMembers, getAllClassPackClients, createTransaction, getAllTransactions, Transaction } from '@/lib/dataStore';
import { ShoppingCart, AlertTriangle, Receipt, Tag } from 'lucide-react';
import { Product } from '@/lib/types';

type CartItem = {
  product: Product;
  quantity: number;
};

export default function POS() {
  const { location } = useApp();
  const [activeTab, setActiveTab] = useState<'pos' | 'inventory' | 'transactions'>('pos');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);

  const locationProducts = getAllProducts().filter(p => p.location === location);
  const allMembers = [...getAllMembers(), ...getAllClassPackClients()].filter(m => m.location === location);
  const transactions = getAllTransactions().filter(t => t.location === location);

  const addToCart = (product: Product) => {
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

  const getSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  };

  const applyPromoCode = () => {
    const code = promoCode.toUpperCase();
    if (code === 'SAVE10') {
      setDiscount(0.10);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } else if (code === 'SAVE20') {
      setDiscount(0.20);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } else if (code === 'WELCOME') {
      setDiscount(0.15);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } else {
      alert('Invalid promo code');
    }
  };

  const getTotal = () => {
    const subtotal = getSubtotal();
    const discountAmount = subtotal * discount;
    const afterDiscount = subtotal - discountAmount;
    const tax = afterDiscount * 0.07; // 7% tax
    return afterDiscount + tax;
  };

  const completeSale = () => {
    const subtotal = getSubtotal();
    const discountAmount = subtotal * discount;
    const tax = (subtotal - discountAmount) * 0.07;
    const total = getTotal();

    const member = allMembers.find(m => m.id === selectedMember);
    
    const transaction = createTransaction({
      memberId: selectedMember || undefined,
      memberName: member?.name || 'Guest',
      items: cart.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
      })),
      subtotal,
      discount: discountAmount,
      tax,
      total,
      promoCode: promoCode || undefined,
      location,
    });

    setLastTransaction(transaction);
    setShowReceipt(true);
    setShowSuccess(true);
    setCart([]);
    setSelectedMember('');
    setPromoCode('');
    setDiscount(0);
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
            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'transactions'
                  ? 'text-red-600 border-b-2 border-red-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Transactions
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
                    <button 
                      onClick={() => {
                        const dropInProduct = locationProducts.find(p => p.id.includes('drop-in'));
                        if (dropInProduct) addToCart(dropInProduct);
                      }}
                      className="p-4 border border-blue-300 bg-blue-50 rounded-lg hover:border-blue-600 hover:bg-blue-100 transition-colors text-left"
                    >
                      <p className="font-medium text-gray-900">Drop-In Class</p>
                      <p className="text-lg font-bold text-blue-600 mt-2">$20</p>
                    </button>
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

                    <div className="border-t border-gray-300 pt-4 mb-4 space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="text-gray-900">${getSubtotal().toFixed(2)}</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-green-600">Discount ({(discount * 100).toFixed(0)}%)</span>
                          <span className="text-green-600">-${(getSubtotal() * discount).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Tax (7%)</span>
                        <span className="text-gray-900">${((getSubtotal() - getSubtotal() * discount) * 0.07).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                        <span className="text-lg font-bold text-gray-900">Total</span>
                        <span className="text-2xl font-bold text-red-600">${getTotal().toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Promo Code
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                          placeholder="Enter code"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                        />
                        <button
                          onClick={applyPromoCode}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                        >
                          <Tag size={16} />
                          Apply
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Try: SAVE10, SAVE20, WELCOME</p>
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
        ) : activeTab === 'inventory' ? (
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
        ) : (
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Transaction History</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Customer</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Items</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Total</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Promo</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        No transactions yet
                      </td>
                    </tr>
                  ) : (
                    transactions.slice().reverse().map(txn => (
                      <tr key={txn.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {new Date(txn.timestamp).toLocaleString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            hour: 'numeric', 
                            minute: '2-digit' 
                          })}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{txn.memberName}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{txn.items.length} items</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">${txn.total.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm">
                          {txn.promoCode ? (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                              {txn.promoCode}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <button
                            onClick={() => {
                              setLastTransaction(txn);
                              setShowReceipt(true);
                            }}
                            className="text-red-600 hover:text-red-700 flex items-center gap-1"
                          >
                            <Receipt size={16} />
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showReceipt && lastTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="bg-red-600 text-white p-4 flex justify-between items-center rounded-t-lg">
              <h2 className="text-xl font-bold">Receipt</h2>
              <button onClick={() => setShowReceipt(false)} className="hover:bg-red-700 p-1 rounded">
                ×
              </button>
            </div>

            <div className="p-6">
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">The LAB Tampa</h3>
                <p className="text-sm text-gray-600">{location === 'athletic-club' ? 'Athletic Club' : 'Dance Studio'}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(lastTransaction.timestamp).toLocaleString()}
                </p>
              </div>

              <div className="border-t border-b border-gray-200 py-4 mb-4">
                <p className="text-sm text-gray-600 mb-2">Customer: <span className="font-medium text-gray-900">{lastTransaction.memberName}</span></p>
                
                <div className="space-y-2 mt-4">
                  {lastTransaction.items.map((item, idx: number) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-gray-900">{item.quantity}x {item.productName}</span>
                      <span className="text-gray-900">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">${lastTransaction.subtotal.toFixed(2)}</span>
                </div>
                {lastTransaction.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Discount</span>
                    <span className="text-green-600">-${lastTransaction.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="text-gray-900">${lastTransaction.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-300">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="font-bold text-red-600">${lastTransaction.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowReceipt(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
