import React from 'react';
import { BookOpen, FileText, Printer, Check, MapPin, Calendar, CreditCard } from 'lucide-react';
import { Order } from '../context/LibraryContext';

interface InvoiceProps {
  order: Order;
  onClose: () => void;
}

export const Invoice: React.FC<InvoiceProps> = ({ order, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-950/70 backdrop-blur-sm flex items-center justify-center p-4 print:p-0 print:bg-white">
      <div className="bg-white text-zinc-950 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] print:max-h-full print:shadow-none print:rounded-none">
        
        {/* Interactive Header Action (Hidden in Print) */}
        <div className="bg-zinc-900 text-white px-6 py-4 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-gold" />
            <h2 className="font-bold tracking-wide">DIGITAL INVOICE</h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-gold text-zinc-950 hover:bg-gold-hover font-bold px-4 py-2 rounded-xl text-xs tracking-wider transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              PRINT
            </button>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white transition-colors text-sm px-3 py-1.5 rounded-lg hover:bg-white/5"
            >
              CLOSE
            </button>
          </div>
        </div>

        {/* Printable Invoice Sheet */}
        <div className="p-8 md:p-12 overflow-y-auto flex-1 print:overflow-visible">
          
          {/* Document Branding */}
          <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-6 border-b border-zinc-200 pb-8 mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-gold text-zinc-950 p-2.5 rounded-2xl shadow-md">
                <BookOpen className="w-8 h-8 font-black" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-neutral-900">YOURBOOKSTORE</h1>
                <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">Knowledge Elevated</p>
              </div>
            </div>
            <div className="text-left md:text-right">
              <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Invoice Identifier</p>
              <p className="text-xl font-extrabold text-neutral-900">{order.invoiceNo}</p>
              <div className="flex items-center md:justify-end gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-xs font-bold text-emerald-600 uppercase bg-emerald-55/60 px-2 py-0.5 rounded-md">
                  {order.paymentStatus === 'Paid' ? 'PAID IN FULL' : 'PENDING PAYMENT'}
                </span>
              </div>
            </div>
          </div>

          {/* Invoice Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="p-5 bg-neutral-50 rounded-2xl border border-neutral-200/60">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                Shipping Recipient
              </h3>
              <p className="font-extrabold text-neutral-900 text-base">{order.shippingAddress.name}</p>
              <p className="text-sm text-zinc-600 mt-1">{order.shippingAddress.street}</p>
              <p className="text-sm text-zinc-650 font-medium">
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
              </p>
              <p className="text-sm text-zinc-600">{order.shippingAddress.country}</p>
            </div>

            <div className="p-5 bg-neutral-50 rounded-2xl border border-neutral-200/60 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                  Issue Profile
                </h3>
                <p className="text-xs font-bold text-zinc-400 uppercase">DATE</p>
                <p className="text-sm font-bold text-neutral-900 mb-2">
                  {new Date(order.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              </div>
              <div className="border-t border-zinc-200/80 pt-3 mt-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">METHOD</span>
                  <span className="text-xs font-extrabold text-neutral-800 flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5 text-zinc-500" />
                    {order.paymentMethod}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">STATUS</span>
                  <span className="text-xs font-extrabold text-neutral-800 uppercase">{order.status}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-8">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">PURCHASE SUMMARY</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-zinc-200 text-xs text-zinc-400 uppercase font-black uppercase tracking-wider">
                    <th className="py-3">Book Description</th>
                    <th className="py-3 text-center">Qty</th>
                    <th className="py-3 text-right">Unit Price</th>
                    <th className="py-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, index) => (
                    <tr key={index} className="border-b border-zinc-100 text-sm">
                      <td className="py-4">
                        <p className="font-extrabold text-neutral-900">{item.title}</p>
                        <p className="text-xs text-zinc-500 font-medium">by {item.author}</p>
                      </td>
                      <td className="py-4 text-center font-bold text-neutral-850">
                        {item.quantity}
                      </td>
                      <td className="py-4 text-right font-medium text-zinc-650">
                        ₹{item.price.toFixed(2)}
                      </td>
                      <td className="py-4 text-right font-black text-neutral-900">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals computation */}
          <div className="border-t border-zinc-200 pt-6 flex flex-col items-end">
            <div className="w-[280px] flex flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500 font-medium">Subtotal</span>
                <span className="font-bold text-neutral-900">₹{order.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500 font-medium">Shipping & Handling</span>
                <span className="text-emerald-600 font-extrabold">FREE</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500 font-medium">Taxes (calculated)</span>
                <span className="text-zinc-500 font-medium">₹0.00</span>
              </div>
              <div className="border-t border-zinc-200 pt-3 mt-2 flex justify-between items-center">
                <span className="text-base font-black text-neutral-900 uppercase">TOTAL</span>
                <span className="text-2xl font-black text-neutral-900">₹{order.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-12 pt-8 border-t border-zinc-150 text-center text-zinc-400 text-xs">
            <p className="font-semibold mb-1">Thank you for purchasing literature from the AI-Powered Bookstore!</p>
            <p>If you have any questions or require support, contact us at support@bookstore.com</p>
          </div>

        </div>

      </div>
    </div>
  );
};
