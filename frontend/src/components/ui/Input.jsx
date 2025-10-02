export default function Input({ label, error, className = '', ...props }) {
  return (
    <div className={`${className}`}>
      {label && (
        <label className="block text-xs sm:text-sm font-light text-gray-700 mb-2 sm:mb-3">
          {label}
        </label>
      )}
      <input
        className={`w-full px-3 py-3 sm:px-4 sm:py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 placeholder:text-gray-400 bg-white font-light transition-all duration-200 text-sm sm:text-base ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
        {...props}
      />
      {error && (
        <div className="mt-2 text-xs sm:text-sm text-red-600 font-light">
          {error}
        </div>
      )}
    </div>
  );
}
