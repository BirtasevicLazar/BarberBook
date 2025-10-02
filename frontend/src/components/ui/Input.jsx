export default function Input({ label, error, className = '', ...props }) {
  return (
    <div className={`${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-900 mb-2">
          {label}
        </label>
      )}
      <input
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder:text-gray-400 ${error ? 'border-red-500 focus:ring-red-500' : ''}`}
        {...props}
      />
      {error && (
        <div className="mt-1 text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
}
