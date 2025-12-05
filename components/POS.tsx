'use client';

import { useState } from 'react';
import { useApp } from '@/lib/context';
import { getAllProducts, getAllMembers, getAllClassPackClients, createTransaction, getAllTransactions, Transaction, createInvoice, getAllInvoices, Invoice, refundInvoice, getRefundsByInvoice, Refund, getStaffSettings, getAllStaff } from '@/lib/dataStore';
import { ShoppingCart, AlertTriangle, Receipt, Tag, FileText, DollarSign, X } from 'lucide-react';
import { Product } from '@/lib/types';
import { hasPermission, getPermissionError } from '@/lib/permissions';
import { useToast } from '@/lib/useToast';
import ConfirmDialog from './ConfirmDialog';

type CartItem = {
  product: Product;
  quantity: number;
};

export default function POS() {
  const { location, userRole } = useApp();
  const { success, error, warning } = useToast();
  const [activeTab, setActiveTab] = useState<'pos' | 'inventory' | 'transactions' | 'invoices'>('pos');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [selectedSeller, setSelectedSeller] = useState<string>('');
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showConfirmRefund, setShowConfirmRefund] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');

  const staff = getAllStaff();
  const currentStaff = staff.find(s => s.role === userRole && s.location === location);
  const staffSettings = currentStaff ? getStaffSettings(currentStaff.id) : null;
  const hasPOSAccess = userRole === 'owner' || userRole === 'manager' || userRole === 'front-desk' || (userRole === 'coach' && staffSettings?.posAccess !== false);
  
  if (hasPOSAccess && !selectedSeller && currentStaff) {
    setTimeout(() => setSelectedSeller(currentStaff.id), 0);
  }

  const locationProducts = getAllProducts().filter(p => p.location === location);
  const allMembers = [...getAllMembers(), ...getAllClassPackClients()].filter(m => m.location === location);
  const transactions = getAllTransactions().filter(t => t.location === location);
  const invoices = getAllInvoices().filter(inv => inv.location === location);

  if (!hasPOSAccess) {
    return (
      <div className="p-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <AlertTriangle size={48} className="mx-auto mb-3 text-yellow-600" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">POS Access Restricted</h2>
          <p className="text-gray-700">
            You do not have permission to access the Point of Sale system. Please contact your manager or owner for access.
          </p>
        </div>
      </div>
    );
  }

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
      return;
    } else if (code === 'SAVE20') {
      setDiscount(0.20);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      return;
    } else if (code === 'WELCOME') {
      setDiscount(0.15);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      return;
    }
    
    try {
      const promoCodes = JSON.parse(localStorage.getItem('promoCodes') || '{}');
      if (promoCodes[code]) {
        const promoData = promoCodes[code];
        
        if (promoData.status !== 'active') {
          warning(`Promo code "${code}" is not currently active (Status: ${promoData.status})`);
          return;
        }
        
        const today = new Date().toISOString().split('T')[0];
        if (today < promoData.startDate || today > promoData.endDate) {
          warning(`Promo code "${code}" is not valid for today's date`);
          return;
        }
        
        setDiscount(promoData.discount);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
        return;
      }
    } catch (err) {
      console.error('Error checking promo codes:', err);
    }
    
    error('Invalid promo code');
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
    const seller = staff.find(s => s.id === selectedSeller);
    
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
      sellerId: selectedSeller || undefined,
      sellerName: seller?.name || undefined,
    });

    const invoice = createInvoice({
      memberId: selectedMember || undefined,
      memberName: member?.name || 'Guest',
      items: cart.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
        total: item.product.price * item.quantity,
      })),
      subtotal,
      discount: discountAmount,
      tax,
      total,
      amountPaid: total,
      amountRefunded: 0,
      status: 'paid',
      promoCode: promoCode || undefined,
      timestamp: new Date().toISOString(),
      location,
    });

    setLastTransaction(transaction);
    setSelectedInvoice(invoice);
    setShowReceipt(true);
    setCart([]);
    setSelectedMember('');
    setPromoCode('');
    setDiscount(0);
    success(`Sale completed! Total: $${total.toFixed(2)}`);
  };

  const handleRefund = () => {
    if (!hasPermission(userRole, 'refund:process')) {
      error(getPermissionError('refund:process'));
      return;
    }

    if (!selectedInvoice || !refundAmount || !refundReason) {
      warning('Please enter refund amount and reason');
      return;
    }

    const amount = parseFloat(refundAmount);
    if (isNaN(amount) || amount <= 0) {
      error('Please enter a valid refund amount');
      return;
    }

    const maxRefund = selectedInvoice.total - selectedInvoice.amountRefunded;
    if (amount > maxRefund) {
      error(`Maximum refund amount is $${maxRefund.toFixed(2)}`);
      return;
    }

    setShowConfirmRefund(true);
  };

  const confirmRefund = () => {
    if (!selectedInvoice || !refundAmount) return;

    try {
      const amount = parseFloat(refundAmount);
      refundInvoice(selectedInvoice.id, amount, refundReason, 'Owner');
      setShowRefundModal(false);
      setShowConfirmRefund(false);
      setRefundAmount('');
      setRefundReason('');
      setSelectedInvoice(null);
      success(`Refund of $${amount.toFixed(2)} processed successfully`);
    } catch {
      error('Error processing refund');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">POS & Inventory</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">Manage sales and inventory</p>
      </div>

      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="border-b border-gray-200 overflow-x-auto">
          <div className="flex min-w-max sm:min-w-0">
            <button
              onClick={() => setActiveTab('pos')}
              className={`px-4 sm:px-6 py-3 font-medium text-sm sm:text-base min-h-[48px] ${
                activeTab === 'pos'
                  ? 'text-red-600 border-b-2 border-red-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="hidden sm:inline">Point of Sale</span>
              <span className="sm:hidden">POS</span>
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-4 sm:px-6 py-3 font-medium text-sm sm:text-base min-h-[48px] ${
                activeTab === 'inventory'
                  ? 'text-red-600 border-b-2 border-red-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Inventory
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-4 sm:px-6 py-3 font-medium text-sm sm:text-base min-h-[48px] ${
                activeTab === 'transactions'
                  ? 'text-red-600 border-b-2 border-red-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Transactions
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-4 sm:px-6 py-3 font-medium text-sm sm:text-base min-h-[48px] ${
                activeTab === 'invoices'
                  ? 'text-red-600 border-b-2 border-red-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Invoices
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Seller
                    </label>
                    <select
                      value={selectedSeller}
                      onChange={(e) => setSelectedSeller(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                    >
                      <option value="">Select Seller</option>
                      {staff.filter(s => s.location === location).map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
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
                        <button 
                          onClick={() => {
                            const membershipProduct = locationProducts.find(p => p.id.includes('membership-1x'));
                            if (membershipProduct) {
                              addToCart(membershipProduct);
                            } else {
                              addToCart({ id: 'membership-1x-temp', name: '1x/week Membership', category: 'Membership', price: 99, stock: 999, location });
                            }
                          }}
                          className="p-4 border border-gray-300 rounded-lg hover:border-red-600 hover:bg-red-50 transition-colors text-left"
                        >
                          <p className="font-medium text-gray-900">1x/week</p>
                          <p className="text-lg font-bold text-red-600 mt-2">$99/mo</p>
                        </button>
                        <button 
                          onClick={() => {
                            const membershipProduct = locationProducts.find(p => p.id.includes('membership-2x'));
                            if (membershipProduct) {
                              addToCart(membershipProduct);
                            } else {
                              addToCart({ id: 'membership-2x-temp', name: '2x/week Membership', category: 'Membership', price: 149, stock: 999, location });
                            }
                          }}
                          className="p-4 border border-gray-300 rounded-lg hover:border-red-600 hover:bg-red-50 transition-colors text-left"
                        >
                          <p className="font-medium text-gray-900">2x/week</p>
                          <p className="text-lg font-bold text-red-600 mt-2">$149/mo</p>
                        </button>
                        <button 
                          onClick={() => {
                            const membershipProduct = locationProducts.find(p => p.id.includes('membership-unlimited'));
                            if (membershipProduct) {
                              addToCart(membershipProduct);
                            } else {
                              addToCart({ id: 'membership-unlimited-temp', name: 'Unlimited Membership', category: 'Membership', price: 199, stock: 999, location });
                            }
                          }}
                          className="p-4 border border-gray-300 rounded-lg hover:border-red-600 hover:bg-red-50 transition-colors text-left"
                        >
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
                    <button 
                      onClick={() => {
                        const packProduct = locationProducts.find(p => p.id.includes('5-pack'));
                        if (packProduct) {
                          addToCart(packProduct);
                        } else {
                          addToCart({ id: '5-pack-temp', name: '5-pack', category: 'Class Pack', price: 75, stock: 999, location });
                        }
                      }}
                      className="p-4 border border-gray-300 rounded-lg hover:border-red-600 hover:bg-red-50 transition-colors text-left"
                    >
                      <p className="font-medium text-gray-900">5-pack</p>
                      <p className="text-lg font-bold text-red-600 mt-2">$75</p>
                    </button>
                    <button 
                      onClick={() => {
                        const packProduct = locationProducts.find(p => p.id.includes('10-pack'));
                        if (packProduct) {
                          addToCart(packProduct);
                        } else {
                          addToCart({ id: '10-pack-temp', name: '10-pack', category: 'Class Pack', price: 140, stock: 999, location });
                        }
                      }}
                      className="p-4 border border-gray-300 rounded-lg hover:border-red-600 hover:bg-red-50 transition-colors text-left"
                    >
                      <p className="font-medium text-gray-900">10-pack</p>
                      <p className="text-lg font-bold text-red-600 mt-2">$140</p>
                    </button>
                    <button 
                      onClick={() => {
                        const packProduct = locationProducts.find(p => p.id.includes('20-pack'));
                        if (packProduct) {
                          addToCart(packProduct);
                        } else {
                          addToCart({ id: '20-pack-temp', name: '20-pack', category: 'Class Pack', price: 260, stock: 999, location });
                        }
                      }}
                      className="p-4 border border-gray-300 rounded-lg hover:border-red-600 hover:bg-red-50 transition-colors text-left"
                    >
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

      {activeTab === 'invoices' && (
        <div className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-900">All Invoices</h3>
            <p className="text-sm text-gray-600">View and manage invoices</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No invoices yet
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {inv.id.substring(0, 12)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{inv.memberName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(inv.timestamp).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${inv.total.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          inv.status === 'paid' ? 'bg-green-100 text-green-700' :
                          inv.status === 'refunded' ? 'bg-red-100 text-red-700' :
                          inv.status === 'partial' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => {
                            setSelectedInvoice(inv);
                            setShowReceipt(true);
                          }}
                          className="text-blue-600 hover:text-blue-700 mr-3"
                        >
                          <FileText size={16} className="inline" /> View
                        </button>
                        {inv.status !== 'refunded' && inv.amountRefunded < inv.total && hasPermission(userRole, 'refund:process') && (
                          <button
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setShowRefundModal(true);
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <DollarSign size={16} className="inline" /> Refund
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showRefundModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="bg-red-600 text-white p-4 flex justify-between items-center rounded-t-lg">
              <h2 className="text-xl font-bold">Process Refund</h2>
              <button onClick={() => setShowRefundModal(false)} className="hover:bg-red-700 p-1 rounded">
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600">Invoice: {selectedInvoice.id.substring(0, 12)}...</p>
                <p className="text-sm text-gray-600">Customer: {selectedInvoice.memberName}</p>
                <p className="text-sm text-gray-600">Total: ${selectedInvoice.total.toFixed(2)}</p>
                <p className="text-sm text-gray-600">Already Refunded: ${selectedInvoice.amountRefunded.toFixed(2)}</p>
                <p className="text-sm font-medium text-gray-900 mt-2">
                  Max Refund: ${(selectedInvoice.total - selectedInvoice.amountRefunded).toFixed(2)}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Refund Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                  <textarea
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                    rows={3}
                    placeholder="Enter refund reason..."
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowRefundModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRefund}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Process Refund
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showReceipt && (selectedInvoice || lastTransaction) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="bg-red-600 text-white p-4 flex justify-between items-center rounded-t-lg">
              <h2 className="text-xl font-bold">{selectedInvoice ? 'Invoice' : 'Receipt'}</h2>
              <button onClick={() => { setShowReceipt(false); setSelectedInvoice(null); }} className="hover:bg-red-700 p-1 rounded">
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              {(() => {
                const data = selectedInvoice || lastTransaction;
                if (!data) return null;
                
                const refunds = selectedInvoice ? getRefundsByInvoice(selectedInvoice.id) : [];
                
                return (
                  <>
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-bold text-gray-900">The LAB Tampa</h3>
                      <p className="text-sm text-gray-600">{location === 'athletic-club' ? 'Athletic Club' : 'Dance Studio'}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(data.timestamp).toLocaleString()}
                      </p>
                      {selectedInvoice && (
                        <p className="text-xs text-gray-500 mt-1">Invoice: {selectedInvoice.id.substring(0, 12)}...</p>
                      )}
                    </div>

                    <div className="border-t border-b border-gray-200 py-4 mb-4">
                      <p className="text-sm text-gray-600 mb-2">Customer: <span className="font-medium text-gray-900">{data.memberName}</span></p>
                      
                      <div className="space-y-2 mt-4">
                        {data.items.map((item: { quantity: number; productName: string; price: number }, idx: number) => (
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
                        <span className="text-gray-900">${data.subtotal.toFixed(2)}</span>
                      </div>
                      {data.discount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-green-600">Discount</span>
                          <span className="text-green-600">-${data.discount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tax</span>
                        <span className="text-gray-900">${data.tax.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-gray-300">
                        <span className="font-bold text-gray-900">Total</span>
                        <span className="font-bold text-red-600">${data.total.toFixed(2)}</span>
                      </div>
                      
                      {selectedInvoice && refunds.length > 0 && (
                        <>
                          <div className="pt-2 border-t border-gray-300 mt-2">
                            <p className="text-sm font-medium text-gray-700 mb-2">Refunds:</p>
                            {refunds.map((refund: Refund) => (
                              <div key={refund.id} className="flex justify-between text-sm text-red-600 mb-1">
                                <span>{new Date(refund.refundedAt).toLocaleDateString()} - {refund.reason}</span>
                                <span>-${refund.amount.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-between pt-2 border-t border-gray-300 font-bold">
                            <span className="text-gray-900">Net Total</span>
                            <span className="text-gray-900">${(selectedInvoice.total - selectedInvoice.amountRefunded).toFixed(2)}</span>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="mt-6 flex justify-end">
                      <button
                        onClick={() => { setShowReceipt(false); setSelectedInvoice(null); }}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                      >
                        Close
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showConfirmRefund}
        title="Confirm Refund"
        message={`Are you sure you want to process a refund of $${refundAmount}? This action cannot be undone.`}
        confirmText="Process Refund"
        cancelText="Cancel"
        confirmVariant="danger"
        onConfirm={confirmRefund}
        onCancel={() => setShowConfirmRefund(false)}
      />
    </div>
  );
}
