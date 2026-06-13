import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

export default function BookingSuccessModal({ isOpen, onClose, title, message }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl flex flex-col items-center text-center space-y-5 border border-gold-500/20 relative overflow-hidden"
          >
            {/* Decorative background element */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-gold-400 via-gold-500 to-navy-500"></div>
            
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.15, type: 'spring', damping: 12, stiffness: 200 }}
              className="bg-emerald-50 text-emerald-500 p-4 rounded-full mt-2"
            >
              <CheckCircle className="w-12 h-12" />
            </motion.div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-serif font-black text-navy-900 tracking-wide">
                {title || 'Request Received!'}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed px-2">
                {message || 'Your booking request has been submitted. Please wait for an admin to approve it before proceeding to payment.'}
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onClose}
              className="w-full bg-navy-900 hover:bg-navy-800 text-white font-bold py-3.5 rounded-xl transition-all duration-200 shadow-md flex items-center justify-center space-x-2 mt-4"
            >
              <span>View My Bookings</span>
            </motion.button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
