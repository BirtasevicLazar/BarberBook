import { createPortal } from 'react-dom';

export default function Modal({ open, onClose, children, title, description, actions }) {
	if (!open) return null;

		return createPortal(
			<div className="fixed inset-0 z-[999] flex items-center justify-center px-4">
			<div
				className="absolute inset-0 bg-black/40 backdrop-blur-sm"
				onClick={onClose}
				aria-hidden="true"
			/>

				<div className="relative z-[1000] w-full max-w-lg overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl">
					<button
						type="button"
						onClick={onClose}
						className="absolute right-4 top-4 rounded-full bg-zinc-100 p-2 text-zinc-500 transition hover:bg-zinc-200 hover:text-zinc-800"
						aria-label="Zatvori"
					>
						<svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
							<path d="M18 6 6 18" />
							<path d="m6 6 12 12" />
						</svg>
					</button>

					{(title || description) && (
						<div className="border-b border-zinc-100 px-6 py-5 pr-12">
							{title && <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>}
							{description && <p className="mt-1 text-sm text-zinc-500">{description}</p>}
						</div>
					)}

				<div className="px-6 py-5 text-sm text-zinc-600">{children}</div>

				{actions && actions.length > 0 && (
					<div className="flex flex-col gap-2 border-t border-zinc-100 bg-zinc-50 px-6 py-4 sm:flex-row sm:justify-end">
						{actions.map((action) => (
							<button
								key={action.label}
								onClick={action.onClick}
								className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition-colors ${
									action.variant === 'primary'
										? 'bg-zinc-900 text-white hover:bg-zinc-800'
										: 'bg-white text-zinc-700 hover:bg-zinc-100 border border-zinc-200'
								}`}
							>
								{action.label}
							</button>
						))}
					</div>
				)}
			</div>
		</div>,
		document.body
	);
}
