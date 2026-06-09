import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Calendar, ArrowRight, Home } from 'lucide-react';

export default function PaymentSuccess() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center bg-sand-50/50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center bg-white p-8 rounded-2xl shadow-xl border border-gold-500/15 space-y-6"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="inline-block"
        >
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
        </motion.div>

        <div className="space-y-2">
          <h1 className="text-3xl font-serif font-black text-navy-500 tracking-wider">Payment Confirmed</h1>
          <p className="text-sm text-gray-500">
            Thank you! Your Egyptian booking has been processed successfully and is now confirmed.
          </p>
        </div>

        <div className="bg-sand-50 p-4 rounded-xl border border-gold-500/10 text-xs text-gray-600 leading-relaxed">
          An email receipt containing check-in guides, tickets, and voucher files has been dispatched to your registered address.
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Link
            to="/dashboard"
            className="flex items-center justify-center space-x-1.5 bg-navy-500 hover:bg-navy-600 text-white font-bold py-3 px-6 rounded-lg text-xs shadow-md transition"
          >
            <Calendar className="h-4 w-4 text-gold-500" />
            <span>Go to My Bookings</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            to="/"
            className="flex items-center justify-center space-x-1.5 bg-gray-100 hover:bg-gray-200 text-navy-900 font-bold py-3 px-6 rounded-lg text-xs transition"
          >
            <Home className="h-4 w-4" />
            <span>Home</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
