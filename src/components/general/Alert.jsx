export default function Alert({ title, messages = [] }) {
    if (!title && (!messages || messages.length === 0)) return null;

    return (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
            {title ? <p className="font-semibold text-red-800">{title}</p> : null}
            {messages?.length ? (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-700">
                    {messages.map((m, i) => <li key={i}>{m}</li>)}
                </ul>
            ) : null}
        </div>
    );
}
