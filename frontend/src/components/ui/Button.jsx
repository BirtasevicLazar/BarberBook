export default function Button({ children, className = '', variant = 'primary', size = 'md', ...props }) {
  const base = 'inline-flex items-center justify-center font-medium disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none';
  const sizes = {
    sm: 'px-3 py-2 text-sm rounded-lg',
    md: 'px-4 py-2 text-sm rounded-lg',
    lg: 'px-6 py-3 text-base rounded-lg',
  };
  const variants = {
    primary: 'bg-gray-900 text-white',
    secondary: 'bg-gray-100 text-gray-900',
    ghost: 'bg-transparent text-gray-700',
    danger: 'bg-red-600 text-white',
    success: 'bg-green-600 text-white',
  };
  const cls = `${base} ${sizes[size]} ${variants[variant]} ${className}`;
  return (
    <button className={cls} {...props}>
      {children}
    </button>
  );
}
