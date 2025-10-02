export default function Button({ children, className = '', variant = 'primary', size = 'md', ...props }) {
  const base = 'inline-flex items-center justify-center font-light disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none transition-all duration-300';
  const sizes = {
    sm: 'px-4 py-2 text-sm rounded-full',
    md: 'px-6 py-3 text-base rounded-full',
    lg: 'px-8 py-4 text-lg rounded-full',
  };
  const variants = {
    primary: 'bg-gray-900 text-white hover:bg-gray-800',
    secondary: 'bg-gray-50 text-gray-900 hover:bg-gray-100 border border-gray-200',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-50',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    success: 'bg-green-600 text-white hover:bg-green-700',
  };
  const cls = `${base} ${sizes[size]} ${variants[variant]} ${className}`;
  return (
    <button className={cls} {...props}>
      {children}
    </button>
  );
}
