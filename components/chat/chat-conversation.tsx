'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Send, Minimize2, Maximize2, X, Heart, Smile } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { api } from '@/lib/api/client';
import { useChat } from './chat-provider';
import type { ApiChatMessage } from '@/lib/api/types';
import { Avatar } from '@/components/avatar/avatar';
import { formatRelativeTime } from '@/lib/utils';

import { Theme as EmojiTheme } from 'emoji-picker-react';

const EmojiPicker = dynamic(
  () => import('emoji-picker-react').then((mod) => mod.default),
  { ssr: false }
);

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
  const [isMinimized, setIsMinimized] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
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

  const handleSendLike = useCallback(async () => {
    if (sending) return;

    setSending(true);
    const { data } = await api.sendChatMessage(chatId, '❤️');
    setSending(false);

    if (data) {
      setMessages((prev) => [...prev, data]);
      chatCtx?.refreshChatUnreadCount();
    }
  }, [chatId, sending, chatCtx]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
    }
  }, [input]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        showEmojiPicker &&
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(e.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);

  const handleEmojiClick = useCallback(
    (emojiData: { emoji: string }) => {
      const ta = textareaRef.current;
      if (ta) {
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const before = input.slice(0, start);
        const after = input.slice(end);
        setInput(before + emojiData.emoji + after);
        requestAnimationFrame(() => {
          ta.focus();
          const pos = start + emojiData.emoji.length;
          ta.setSelectionRange(pos, pos);
        });
      } else {
        setInput((prev) => prev + emojiData.emoji);
      }
    },
    [input]
  );

  const name = otherUser.username ?? 'Unknown';

  const header = (
    <div className="flex items-center gap-3 border-b border-neutral-800/80 px-4 py-3">
      <Link
        href={`/profile/${name}`}
        onClick={onClose}
        className="flex min-w-0 flex-1 items-center gap-3"
      >
        <Avatar src={otherUser.avatar_url ?? undefined} fallback={name} size="sm" />
        <span className="truncate font-medium text-white">@{name}</span>
      </Link>
      <div className="flex shrink-0 gap-1">
        <button
          type="button"
          onClick={() => setIsMinimized(true)}
          className="rounded-full p-1 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
          aria-label="Minimize"
        >
          <Minimize2 className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-1 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );

  const minimizedHeader = (
    <div className="flex items-center gap-3 border-b-0 px-4 py-3">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar src={otherUser.avatar_url ?? undefined} fallback={name} size="sm" />
        <span className="truncate font-medium text-white">@{name}</span>
      </div>
      <div className="flex shrink-0 gap-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsMinimized(false);
          }}
          className="rounded-full p-1 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
          aria-label="Expand"
        >
          <Maximize2 className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="rounded-full p-1 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );

  if (isMinimized) {
    return (
      <div
        className="flex w-[280px] cursor-pointer flex-col overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950 shadow-2xl"
        onClick={() => setIsMinimized(false)}
        onKeyDown={(e) => e.key === 'Enter' && setIsMinimized(false)}
        role="button"
        tabIndex={0}
        aria-label="Expand chat"
      >
        {minimizedHeader}
      </div>
    );
  }

  return (
    <div className="flex h-[420px] w-[360px] flex-col overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950 shadow-2xl">
      {header}

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
          if (input.trim()) handleSend();
        }}
        className="relative border-t border-neutral-800/80 p-2"
      >
        {showEmojiPicker && (
          <div
            ref={emojiPickerRef}
            className="absolute bottom-full left-2 mb-1 overflow-hidden rounded-xl shadow-xl"
          >
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              theme={EmojiTheme.DARK}
              width={320}
              height={360}
            />
          </div>
        )}
        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={() => setShowEmojiPicker((v) => !v)}
            className={`flex shrink-0 items-center justify-center p-2.5 transition-colors ${
              showEmojiPicker
                ? 'text-blue-500'
                : 'text-neutral-400 hover:text-neutral-300'
            }`}
            aria-label="Insert emoji"
          >
            <Smile className="h-5 w-5" />
          </button>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (input.trim()) handleSend();
              }
            }}
            placeholder="Message..."
            rows={1}
            className="min-h-[42px] max-h-[120px] flex-1 resize-none overflow-y-auto rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:border-neutral-600 focus:outline-none focus:ring-1 focus:ring-neutral-600"
          />
          {input.trim() ? (
            <button
              type="submit"
              disabled={sending}
              className="flex shrink-0 items-center justify-center p-2.5 text-blue-500 transition-opacity hover:text-blue-400 hover:opacity-90 disabled:opacity-50"
              aria-label="Send message"
            >
              <Send className="h-5 w-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSendLike}
              disabled={sending}
              className="flex shrink-0 items-center justify-center p-2.5 text-neutral-400 transition-colors hover:text-red-400 disabled:opacity-50"
              aria-label="Send like"
            >
              <Heart className="h-5 w-5" />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
