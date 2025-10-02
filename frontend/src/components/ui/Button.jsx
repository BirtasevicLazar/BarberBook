export default function Button({
  as: Component = 'button',
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  ...props
}) {
  const base = 'inline-flex items-center justify-center font-light disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none transition-all duration-200 hover:scale-[1.02]';
  const sizes = {
    sm: 'px-3 py-1.5 text-sm rounded-full',
    md: 'px-4 py-2 text-sm rounded-full',
    lg: 'px-6 py-2.5 text-base rounded-full',
  };
  const variants = {
    primary: 'bg-zinc-900 text-white hover:bg-zinc-800',
    secondary: 'bg-zinc-50 text-zinc-900 hover:bg-zinc-100 border border-zinc-200',
    ghost: 'bg-transparent text-zinc-700 hover:bg-zinc-50',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    success: 'bg-green-600 text-white hover:bg-green-700',
  };
  const cls = `${base} ${sizes[size]} ${variants[variant]} ${className}`;
  const componentProps = { ...props };
  if (Component === 'button' && !('type' in componentProps)) {
    componentProps.type = 'button';
  }
  return (
    <Component className={cls} {...componentProps}>
      {children}
    </Component>
  );
}
