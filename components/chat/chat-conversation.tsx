'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { Send, Minimize2, Maximize2, X, Heart, Smile, ImagePlus, Reply, Check, CheckCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { api } from '@/lib/api/client';
import { useChat } from './chat-provider';
import type { ApiChatMessage, ApiChatReplyTo, ApiChatReaction } from '@/lib/api/types';
import { Avatar } from '@/components/avatar/avatar';
import { ImagePreview } from '@/components/ui/image-preview';
import { formatRelativeTime } from '@/lib/utils';

import { Theme as EmojiTheme } from 'emoji-picker-react';

const QUICK_REACTIONS = ['❤️', '👍', '😂', '😮', '😢'] as const;

const EmojiPicker = dynamic(
  () => import('emoji-picker-react').then((mod) => mod.default),
  { ssr: false }
);

interface ChatConversationProps {
  chatId: string;
  otherUser: { id: string; username: string | null; avatar_url: string | null };
  initialUnreadCount?: number;
  isFocused?: boolean;
  onFocus?: () => void;
  onClose: () => void;
}

export function ChatConversation({
  chatId,
  otherUser,
  initialUnreadCount = 0,
  isFocused = true,
  onFocus,
  onClose,
}: ChatConversationProps) {
  const [messages, setMessages] = useState<ApiChatMessage[]>([]);
  const [recipientLastReadAt, setRecipientLastReadAt] = useState<string | null>(null);
  const [myLastReadAt, setMyLastReadAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState('');
  const [clickedMessageId, setClickedMessageId] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<{ images: string[]; index: number } | null>(null);
  const [replyTo, setReplyTo] = useState<ApiChatReplyTo | null>(null);
  const [reactionPickerMessageId, setReactionPickerMessageId] = useState<string | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [pendingImages, setPendingImages] = useState<
    { id: string; preview: string; url?: string; uploading: boolean }[]
  >([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const reactionPickerRef = useRef<HTMLDivElement>(null);
  const isFocusedRef = useRef(isFocused);
  isFocusedRef.current = isFocused;
  const chatCtx = useChat();

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data: { user } }) => setCurrentUserId(user?.id ?? null));
  }, []);

  const loadMessages = useCallback(async () => {
    const { data } = await api.getChatMessages(chatId, 50, 0);
    if (data?.messages) {
      setMessages(data.messages);
    }
    setRecipientLastReadAt(data?.recipient_last_read_at ?? null);
    setMyLastReadAt(data?.my_last_read_at ?? null);
    setLoading(false);
    api.markChatRead(chatId);
    setMyLastReadAt(new Date().toISOString()); // We just viewed, so we've read all
    chatCtx?.refreshChatUnreadCount();
  }, [chatId, chatCtx]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Clear unread when this panel becomes focused
  useEffect(() => {
    if (isFocused && unreadCount > 0) {
      setUnreadCount(0);
      api.markChatRead(chatId);
    }
  }, [isFocused, chatId]); // eslint-disable-line react-hooks/exhaustive-deps -- only clear when focus changes

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
        async (payload) => {
          const row = payload.new as ApiChatMessage & { reply_to_id?: string };
          const fromThem = row.sender_id === otherUser.id;
          const focused = isFocusedRef.current;

          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev;
            const replyTo = row.reply_to_id ? prev.find((m) => m.id === row.reply_to_id) : null;
            const msg: ApiChatMessage = {
              ...row,
              reply_to: replyTo ? { id: replyTo.id, content: replyTo.content, sender_id: replyTo.sender_id } : null,
              reactions: [],
            };
            return [...prev, msg];
          });

          if (fromThem) {
            if (focused) {
              api.markChatRead(chatId);
              setMyLastReadAt(new Date().toISOString());
            } else {
              setUnreadCount((c) => c + 1);
            }
          }
          chatCtx?.refreshChatUnreadCount();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_message_reactions',
        },
        async (payload) => {
          const row = payload.new as { message_id: string; user_id: string; emoji: string };
          const myId = currentUserId ?? (await createClient().auth.getUser()).data.user?.id;
          if (row.user_id === myId) return;
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id !== row.message_id) return m;
              const reactions = [...(m.reactions ?? [])];
              const idx = reactions.findIndex((r) => r.emoji === row.emoji);
              if (idx >= 0) {
                const existing = reactions[idx];
                if (existing) {
                  reactions[idx] = {
                    emoji: existing.emoji,
                    count: existing.count + 1,
                    reacted_by_me: existing.reacted_by_me || row.user_id === myId,
                  };
                }
              } else {
                reactions.push({ emoji: row.emoji, count: 1, reacted_by_me: row.user_id === myId });
              }
              return { ...m, reactions };
            })
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_participants',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          const row = payload.new as { user_id: string; last_read_at: string | null };
          if (row.user_id === otherUser.id) {
            setRecipientLastReadAt(row.last_read_at);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'chat_message_reactions',
        },
        async (payload) => {
          const row = payload.old as { message_id: string; user_id: string; emoji: string };
          const myId = currentUserId ?? (await createClient().auth.getUser()).data.user?.id;
          if (row.user_id === myId) return;
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id !== row.message_id) return m;
              const reactions = (m.reactions ?? [])
                .map((r) =>
                  r.emoji === row.emoji
                    ? {
                        ...r,
                        count: Math.max(0, r.count - 1),
                        reacted_by_me: row.user_id === myId ? false : r.reacted_by_me,
                      }
                    : r
                )
                .filter((r) => r.count > 0);
              return { ...m, reactions };
            })
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, chatCtx, currentUserId, otherUser.id]);

  const handleSend = useCallback(async () => {
    const content = input.trim();
    const hasContent = content || pendingImages.length > 0;
    const allUploaded = pendingImages.every((p) => p.url);
    if (!hasContent || sending || !allUploaded) return;

    setSending(true);
    const urls = pendingImages.map((p) => p.url).filter((u): u is string => !!u);
    setPendingImages([]);
    const replyToId = replyTo?.id;
    setReplyTo(null);
    const { data } = await api.sendChatMessage(chatId, content || '', urls.length ? urls : undefined, replyToId);
    setInput('');
    setSending(false);

    if (data) {
      setMessages((prev) => (prev.some((m) => m.id === data.id) ? prev : [...prev, data]));
      chatCtx?.refreshChatUnreadCount();
    }
  }, [chatId, input, pendingImages, replyTo, sending, chatCtx]);

  const MAX_IMAGES = 5;

  const handleImageChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files?.length) return;
      const remaining = MAX_IMAGES - pendingImages.length;
      const toAdd = Array.from(files).filter((f) => f.type.startsWith('image/')).slice(0, remaining);
      if (toAdd.length === 0) return;

      const newItems = toAdd.map((file) => ({
        id: crypto.randomUUID() as string,
        preview: URL.createObjectURL(file),
        uploading: true as const,
      }));
      setPendingImages((prev) => [...prev, ...newItems].slice(0, MAX_IMAGES));
      e.target.value = '';

      for (let i = 0; i < toAdd.length; i++) {
        const file = toAdd[i];
        const itemId = newItems[i]?.id;
        if (!file || !itemId) continue;
        const { data } = await api.uploadChatImage(file);
        setPendingImages((prev) =>
          prev.map((p) =>
            p.id === itemId && p.uploading
              ? { ...p, url: data?.url, uploading: false }
              : p
          )
        );
      }
    },
    [pendingImages.length]
  );

  const pendingImagesRef = useRef(pendingImages);
  pendingImagesRef.current = pendingImages;

  const removePendingImage = useCallback((index: number) => {
    setPendingImages((prev) => {
      const item = prev[index];
      if (item?.preview?.startsWith('blob:')) URL.revokeObjectURL(item.preview);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  useEffect(() => {
    return () => {
      pendingImagesRef.current.forEach((p) => {
        if (p.preview?.startsWith('blob:')) URL.revokeObjectURL(p.preview);
      });
    };
  }, []);

  const handleSendLike = useCallback(async () => {
    if (sending) return;

    setSending(true);
    const { data } = await api.sendChatMessage(chatId, '❤️');
    setSending(false);

    if (data) {
      setMessages((prev) => (prev.some((m) => m.id === data.id) ? prev : [...prev, data]));
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
      if (
        reactionPickerMessageId &&
        reactionPickerRef.current &&
        !reactionPickerRef.current.contains(e.target as Node)
      ) {
        setReactionPickerMessageId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker, reactionPickerMessageId]);

  const handleToggleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      const { data } = await api.toggleChatReaction(chatId, messageId, emoji);
      if (data) {
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id !== messageId) return m;
            const reactions = [...(m.reactions ?? [])];
            const idx = reactions.findIndex((r) => r.emoji === emoji);
            if (idx >= 0) {
              const r = reactions[idx];
              if (r) {
                if (data.action === 'removed') {
                  const next: ApiChatReaction = { emoji: r.emoji, count: r.count - 1, reacted_by_me: false };
                  if (next.count <= 0) reactions.splice(idx, 1);
                  else reactions[idx] = next;
                } else {
                  reactions[idx] = { emoji: r.emoji, count: r.count + 1, reacted_by_me: true };
                }
              }
            } else if (data.action === 'added') {
              reactions.push({ emoji, count: 1, reacted_by_me: true });
            }
            return { ...m, reactions };
          })
        );
      }
      setReactionPickerMessageId(null);
    },
    [chatId]
  );

  const handleQuickReaction = useCallback(
    (messageId: string, emoji: string) => {
      handleToggleReaction(messageId, emoji);
    },
    [handleToggleReaction]
  );

  const scrollToMessage = useCallback((messageId: string) => {
    const el = document.getElementById(`msg-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setClickedMessageId(messageId);
      setHighlightedMessageId(messageId);
      setTimeout(() => setHighlightedMessageId(null), 2000);
    }
  }, []);

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
        onClick={(e) => {
          e.stopPropagation();
          if (!isFocused) {
            e.preventDefault();
            onFocus?.();
          } else {
            onClose();
          }
        }}
        className="flex min-w-0 flex-1 items-center gap-3"
      >
        <div className="relative">
          <Avatar src={otherUser.avatar_url ?? undefined} fallback={name} size="sm" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
        <span className="truncate font-medium text-white">@{name}</span>
      </Link>
      <div className="flex shrink-0 gap-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsMinimized(true);
          }}
          className="rounded-full p-1 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
          aria-label="Minimize"
        >
          <Minimize2 className="h-5 w-5" />
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

  const minimizedHeader = (
    <div className="flex items-center gap-3 border-b-0 px-4 py-3">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="relative">
          <Avatar src={otherUser.avatar_url ?? undefined} fallback={name} size="sm" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
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
        onClick={() => {
          setIsMinimized(false);
          onFocus?.();
        }}
        onKeyDown={(e) => e.key === 'Enter' && (setIsMinimized(false), onFocus?.())}
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

              const hasReactions = (msg.reactions?.length ?? 0) > 0;

              return (
                <div
                  id={`msg-${msg.id}`}
                  key={msg.id}
                  className={`flex items-end gap-1.5 ${groupSpacing} rounded-lg transition-colors duration-300 ${
                    highlightedMessageId === msg.id ? 'bg-blue-400/10' : ''
                  } ${isMe ? 'justify-end' : 'justify-start'}`}
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
                    <div className="flex items-end gap-1">
                      {isMe && showTime && (
                        <div className="flex shrink-0 flex-row items-center gap-0.5 pb-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setReplyTo({ id: msg.id, content: msg.content, sender_id: msg.sender_id });
                              setClickedMessageId(null);
                              textareaRef.current?.focus();
                            }}
                            className="rounded p-1 text-neutral-400 transition-colors hover:bg-neutral-700 hover:text-white"
                            aria-label="Reply"
                          >
                            <Reply className="h-3.5 w-3.5" />
                          </button>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setReactionPickerMessageId((id) => (id === msg.id ? null : msg.id));
                              }}
                              className="rounded p-1 text-neutral-400 transition-colors hover:bg-neutral-700 hover:text-white"
                              aria-label="React"
                            >
                              <Smile className="h-3.5 w-3.5" />
                            </button>
                            {reactionPickerMessageId === msg.id && (
                              <div
                                ref={reactionPickerRef}
                                className="absolute bottom-full right-0 left-auto z-50 mb-1 flex gap-0.5 rounded-xl border border-neutral-700 bg-neutral-900 p-1.5 shadow-xl"
                              >
                                {QUICK_REACTIONS.map((emoji) => (
                                  <button
                                    key={emoji}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleQuickReaction(msg.id, emoji);
                                    }}
                                    className="rounded p-1.5 text-lg transition-colors hover:bg-neutral-700"
                                    aria-label={`React with ${emoji}`}
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    <div className="relative">
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => setClickedMessageId((id) => (id === msg.id ? null : msg.id))}
                        onKeyDown={(e) => e.key === 'Enter' && setClickedMessageId((id) => (id === msg.id ? null : msg.id))}
                        className={`w-full cursor-pointer text-left px-3 py-1.5 ${bubbleRadius} ${
                          isMe ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-white'
                        } hover:opacity-95 transition-opacity`}
                      >
                      {msg.reply_to && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            scrollToMessage(msg.reply_to!.id);
                          }}
                          className={`mb-1.5 w-full cursor-pointer border-l-2 pl-2 text-left transition-opacity hover:opacity-90 ${isMe ? 'border-blue-400/60' : 'border-neutral-500/60'}`}
                        >
                          <p className="text-[10px] opacity-75">
                            Replying to {msg.reply_to!.sender_id === otherUser.id ? otherUser.username : 'you'}
                          </p>
                          <p className="truncate text-xs opacity-90">{msg.reply_to!.content || '❤️'}</p>
                        </button>
                      )}
                      {msg.media_urls && msg.media_urls.length > 0 && (
                        <div className="mb-2 flex flex-wrap gap-1">
                          {msg.media_urls.map((url, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setImagePreview({ images: msg.media_urls ?? [], index: idx });
                              }}
                              className="block shrink-0 overflow-hidden rounded-lg transition-opacity hover:opacity-90"
                            >
                              <Image
                                src={url}
                                alt=""
                                width={120}
                                height={120}
                                className="h-20 w-20 object-cover"
                                unoptimized={url.includes('supabase')}
                              />
                            </button>
                          ))}
                        </div>
                      )}
                      {msg.content ? <p className="break-words text-sm">{msg.content}</p> : null}
                      </div>
                      {hasReactions && (
                        <div
                          className={`absolute bottom-0 z-10 flex translate-y-1/2 flex-wrap gap-1 ${
                            isMe ? 'left-0 justify-start' : 'right-0 justify-end'
                          }`}
                        >
                          {msg.reactions!.map((r) => (
                            <button
                              key={r.emoji}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleReaction(msg.id, r.emoji);
                              }}
                              className={`flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs shadow-lg transition-colors ${
                                isMe
                                  ? r.reacted_by_me
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-blue-600/80 text-blue-100 hover:bg-blue-600'
                                  : r.reacted_by_me
                                    ? 'bg-neutral-800 text-white'
                                    : 'bg-neutral-800/90 text-neutral-300 hover:bg-neutral-800'
                              }`}
                            >
                              <span>{r.emoji}</span>
                              {r.count > 1 && <span className="text-[10px]">{r.count}</span>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                      {!isMe && showTime && (
                        <div className="flex shrink-0 flex-row items-center gap-0.5 pb-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setReplyTo({ id: msg.id, content: msg.content, sender_id: msg.sender_id });
                              setClickedMessageId(null);
                              textareaRef.current?.focus();
                            }}
                            className="rounded p-1 text-neutral-400 transition-colors hover:bg-neutral-700 hover:text-white"
                            aria-label="Reply"
                          >
                            <Reply className="h-3.5 w-3.5" />
                          </button>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setReactionPickerMessageId((id) => (id === msg.id ? null : msg.id));
                              }}
                              className="rounded p-1 text-neutral-400 transition-colors hover:bg-neutral-700 hover:text-white"
                              aria-label="React"
                            >
                              <Smile className="h-3.5 w-3.5" />
                            </button>
                            {reactionPickerMessageId === msg.id && (
                              <div
                                ref={reactionPickerRef}
                                className="absolute bottom-full left-0 z-50 mb-1 flex gap-0.5 rounded-xl border border-neutral-700 bg-neutral-900 p-1.5 shadow-xl"
                              >
                                {QUICK_REACTIONS.map((emoji) => (
                                  <button
                                    key={emoji}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleQuickReaction(msg.id, emoji);
                                    }}
                                    className="rounded p-1.5 text-lg transition-colors hover:bg-neutral-700"
                                    aria-label={`React with ${emoji}`}
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    {showTime && (
                      <div className="mt-1 flex items-center gap-1">
                        <p className={`text-[10px] ${isMe ? 'text-blue-200' : 'text-neutral-500'}`}>
                          {formatRelativeTime(msg.created_at)}
                        </p>
                        {isLastInGroup && (() => {
                          if (isMe) {
                            const seen =
                              recipientLastReadAt &&
                              new Date(recipientLastReadAt) >= new Date(msg.created_at);
                            const justSent =
                              !seen &&
                              (Date.now() - new Date(msg.created_at).getTime()) < 10_000;
                            return (
                              <span
                                className="shrink-0"
                                aria-label={seen ? 'Seen' : justSent ? 'Sent' : 'Delivered'}
                              >
                                {seen ? (
                                  <CheckCheck className="h-3.5 w-3.5 text-blue-400" />
                                ) : justSent ? (
                                  <Check className="h-3.5 w-3.5 text-neutral-400" />
                                ) : (
                                  <CheckCheck className="h-3.5 w-3.5 text-neutral-400" />
                                )}
                              </span>
                            );
                          }
                          const seen =
                            myLastReadAt &&
                            new Date(myLastReadAt) >= new Date(msg.created_at);
                          return (
                            <span
                              className="shrink-0"
                              aria-label={seen ? 'Seen' : 'Delivered'}
                            >
                              {seen ? (
                                <CheckCheck className="h-3.5 w-3.5 text-blue-400" />
                              ) : (
                                <CheckCheck className="h-3.5 w-3.5 text-neutral-400" />
                              )}
                            </span>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {imagePreview && (
        <ImagePreview
          images={imagePreview.images}
          initialIndex={imagePreview.index}
          alt="Chat image"
          onClose={() => setImagePreview(null)}
        />
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if ((input.trim() || pendingImages.length > 0) && pendingImages.every((p) => p.url))
            handleSend();
        }}
        className="relative border-t border-neutral-800/80 p-2"
      >
        {replyTo && (
          <div className="mb-2 flex items-center justify-between rounded-lg border border-neutral-700 bg-neutral-900/80 px-3 py-2">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-neutral-400">Replying to {replyTo.sender_id === otherUser.id ? `@${otherUser.username ?? 'unknown'}` : 'your message'}</p>
              <p className="truncate text-sm text-neutral-300">{replyTo.content || '❤️'}</p>
            </div>
            <button
              type="button"
              onClick={() => setReplyTo(null)}
              className="ml-2 shrink-0 rounded p-1 text-neutral-500 transition-colors hover:bg-neutral-700 hover:text-white"
              aria-label="Cancel reply"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        {pendingImages.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1">
            {pendingImages.map((item, idx) => (
              <div key={item.id} className="relative">
                <Image
                  src={item.url ?? item.preview}
                  alt=""
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-lg object-cover"
                  unoptimized={item.preview.startsWith('blob:') || item.url?.includes('supabase')}
                />
                {item.uploading && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-400 border-t-white" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removePendingImage(idx)}
                  className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-neutral-700 text-white hover:bg-neutral-600"
                  aria-label="Remove image"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            ))}
          </div>
        )}
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
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleImageChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={pendingImages.length >= MAX_IMAGES}
            className="flex shrink-0 items-center justify-center p-2.5 text-neutral-400 transition-colors hover:text-neutral-300 disabled:opacity-50"
            aria-label="Add image"
          >
            <ImagePlus className="h-5 w-5" />
          </button>
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
          {input.trim() || pendingImages.length > 0 ? (
            <button
              type="submit"
              disabled={sending || pendingImages.some((p) => p.uploading)}
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
