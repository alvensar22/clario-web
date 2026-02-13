'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { api } from '@/lib/api/client';
import { useChat } from './chat-provider';
import type { ApiChatMessage } from '@/lib/api/types';
import { Avatar } from '@/components/avatar/avatar';
import { formatRelativeTime } from '@/lib/utils';

interface ChatConversationProps {
  chatId: string;
  otherUser: { id: string; username: string | null; avatar_url: string | null };
  onClose: () => void;
}

export function ChatConversation({ chatId, otherUser, onClose }: ChatConversationProps) {
  const [messages, setMessages] = useState<ApiChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState('');
  const [clickedMessageId, setClickedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatCtx = useChat();

  const loadMessages = useCallback(async () => {
    const { data } = await api.getChatMessages(chatId, 50, 0);
    if (data?.messages) {
      setMessages(data.messages);
    }
    setLoading(false);
    api.markChatRead(chatId);
    chatCtx?.refreshChatUnreadCount();
  }, [chatId, chatCtx]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`chat:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          const row = payload.new as ApiChatMessage;
          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev;
            return [...prev, row];
          });
          api.markChatRead(chatId);
          chatCtx?.refreshChatUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, chatCtx]);

  const handleSend = useCallback(async () => {
    const content = input.trim();
    if (!content || sending) return;

    setSending(true);
    setInput('');
    const { data } = await api.sendChatMessage(chatId, content);
    setSending(false);

    if (data) {
      setMessages((prev) => [...prev, data]);
      chatCtx?.refreshChatUnreadCount();
    }
  }, [chatId, input, sending, chatCtx]);

  const name = otherUser.username ?? 'Unknown';

  return (
    <div className="flex h-[420px] w-[360px] flex-col overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950 shadow-2xl">
      <div className="flex items-center gap-3 border-b border-neutral-800/80 px-4 py-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-1 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
          aria-label="Close"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <Link
          href={`/profile/${name}`}
          onClick={onClose}
          className="flex min-w-0 flex-1 items-center gap-3"
        >
          <Avatar src={otherUser.avatar_url ?? undefined} fallback={name} size="sm" />
          <span className="truncate font-medium text-white">@{name}</span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-700 border-t-white" />
          </div>
        ) : messages.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-neutral-500">
            No messages yet. Say hello!
          </div>
        ) : (
          <div className="flex flex-col p-4">
            {messages.map((msg, i) => {
              const isMe = msg.sender_id !== otherUser.id;
              const prev = messages[i - 1];
              const next = messages[i + 1];
              const prevSameSender = prev?.sender_id === msg.sender_id;
              const nextSameSender = next?.sender_id === msg.sender_id;
              const isFirstInGroup = !prevSameSender;
              const isLastInGroup = !nextSameSender;
              const showAvatar = !isMe && isLastInGroup;
              const groupSpacing = nextSameSender ? 'mb-1.5' : 'mb-3';
              const showTime = isLastInGroup || clickedMessageId === msg.id;

              const bubbleRadius = (() => {
                const single = 'rounded-2xl';
                if (isMe) {
                  if (isFirstInGroup && isLastInGroup) return single;
                  if (isFirstInGroup) return 'rounded-tl-2xl rounded-tr-2xl';
                  if (isLastInGroup) return 'rounded-bl-2xl rounded-br-2xl';
                  return 'rounded-tl-2xl rounded-bl-2xl';
                } else {
                  if (isFirstInGroup && isLastInGroup) return single;
                  if (isFirstInGroup) return 'rounded-tl-2xl rounded-tr-2xl';
                  if (isLastInGroup) return 'rounded-bl-2xl rounded-br-2xl';
                  return 'rounded-tr-2xl rounded-br-2xl';
                }
              })();

              return (
                <div
                  key={msg.id}
                  className={`flex items-end gap-1.5 ${groupSpacing} ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  {!isMe && (
                    <div className="h-8 w-8 shrink-0">
                      {showAvatar ? (
                        <Avatar
                          src={otherUser.avatar_url ?? undefined}
                          fallback={otherUser.username ?? '?'}
                          size="sm"
                          className="mb-0.5"
                        />
                      ) : null}
                    </div>
                  )}
                  <div
                    className={`flex min-w-0 max-w-[75%] flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <button
                      type="button"
                      onClick={() => setClickedMessageId((id) => (id === msg.id ? null : msg.id))}
                      className={`w-full text-left px-3 py-1.5 ${bubbleRadius} ${
                        isMe ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-white'
                      } hover:opacity-95 transition-opacity`}
                    >
                      <p className="break-words text-sm">{msg.content}</p>
                    </button>
                    {showTime && (
                      <p
                        className={`mt-1 text-[10px] ${isMe ? 'text-blue-200' : 'text-neutral-500'}`}
                      >
                        {formatRelativeTime(msg.created_at)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="border-t border-neutral-800/80 p-2"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message..."
            className="flex-1 rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:border-neutral-600 focus:outline-none focus:ring-1 focus:ring-neutral-600"
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:bg-blue-500 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
