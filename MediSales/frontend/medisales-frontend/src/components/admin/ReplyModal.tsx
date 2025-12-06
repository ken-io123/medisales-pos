import { useEffect, useState } from 'react';
import { Send, X } from 'lucide-react';
import type { Message } from '../../types/Message';
import { PH_LOCALE, PH_TIME_ZONE } from '../../utils/formatters';

export type ReplyModalProps = {
  open: boolean;
  message: Message | null;
  onClose: () => void;
  onSend: (messageId: number, replyText: string) => Promise<void>;
  sending: boolean;
};

const formatTimestamp = (value: string) => {
  return new Date(value).toLocaleString(PH_LOCALE, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: PH_TIME_ZONE,
  });
};

const ReplyModal = ({ open, message, onClose, onSend, sending }: ReplyModalProps) => {
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    if (open && message) {
      setReplyText('');
    }
  }, [open, message]);

  if (!open || !message) {
    return null;
  }

  const handleSubmit = async () => {
    if (!replyText.trim()) {
      return;
    }

    await onSend(message.messageId, replyText.trim());
    setReplyText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 py-8 backdrop-blur">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-brand-muted">Reply to Message</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">{message.sender?.fullName ?? 'Staff Member'}</h2>
            <p className="text-sm text-brand-muted">{formatTimestamp(message.sentAt)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-brand-background p-2 text-brand-muted transition hover:text-brand-primary"
            aria-label="Close reply modal"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <p className="font-semibold text-slate-900">{message.subject || 'Staff Message'}</p>
            <p className="mt-2 whitespace-pre-wrap text-slate-700">{message.body}</p>
          </div>

          <label className="block text-sm font-semibold text-slate-700">
            Your reply
            <textarea
              value={replyText}
              onChange={(event) => setReplyText(event.target.value)}
              rows={5}
              className="mt-2 w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-inner transition focus:border-brand-primary focus:outline-none focus:ring-4 focus:ring-brand-primary/20"
              placeholder="Type your response to the staff member here..."
            />
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
            disabled={sending}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-primary to-brand-secondary px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-primary/30 transition hover:brightness-105 disabled:opacity-70"
            disabled={sending || !replyText.trim()}
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            {sending ? 'Sending...' : 'Send reply'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReplyModal;
