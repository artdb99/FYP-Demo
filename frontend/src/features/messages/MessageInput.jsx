import { useState } from 'react';

export default function MessageInput({ onSend, disabled }) {
  const [text, setText] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
  };

  return (
    <form onSubmit={submit} className="mt-3 flex gap-2">
      <input
        className="flex-1 rounded border px-3 py-2 focus:outline-none focus:ring"
        placeholder="Type a message..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={disabled}
      />
      <button
        type="submit"
        className="rounded bg-emerald-600 px-4 py-2 text-white disabled:opacity-50"
        disabled={disabled}
      >
        Send
      </button>
    </form>
  );
}
