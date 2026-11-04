import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  MessageSquare,
  Users,
  Server,
  Activity,
  Send,
  Search,
  RefreshCw,
  LogOut,
  ShieldCheck,
  Globe,
  ArrowLeft,
  CheckCheck,
  Check,
  Sparkles,
  Layers,
  Lock,
  ArrowRight,
  ExternalLink,
  Hash,
  X,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Clock
} from "lucide-react";
import { api } from "./lib/api";
import type {
  AdminOverview,
  ChatMessage,
  ConversationSummary,
  Profile,
  ReadReceiptEvent,
  SearchUser
} from "./types/chat";

const DEFAULT_IMG =
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80";

const AVATAR_GRADIENTS = [
  "from-indigo-500 to-purple-600",
  "from-emerald-400 to-teal-600",
  "from-blue-500 to-cyan-600",
  "from-rose-500 to-pink-600",
  "from-amber-400 to-orange-500",
  "from-violet-500 to-fuchsia-600"
];

function getAvatarGradient(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[index];
}

function getInitials(name: string) {
  if (!name) return "?";
  const clean = name.replace(/@.*$/, "");
  return clean.substring(0, 2).toUpperCase();
}

function formatTimestamp(value?: string) {
  if (!value) return "just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "just now";
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return "방금 전";
  if (diffMinutes < 60) return `${diffMinutes}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays === 1) return "어제";
  if (diffDays < 7) return `${diffDays}일 전`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function UserAvatar({
  src,
  name,
  size = "md"
}: {
  src?: string;
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-11 w-11 text-sm",
    lg: "h-14 w-14 text-base"
  };

  const [hasError, setHasError] = useState(false);

  if (src && !hasError && src !== DEFAULT_IMG) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setHasError(true)}
        className={`${sizeClasses[size]} rounded-2xl object-cover ring-2 ring-white shadow-sm flex-shrink-0`}
      />
    );
  }

  const gradient = getAvatarGradient(name);
  return (
    <div
      className={`${sizeClasses[size]} ${gradient} bg-gradient-to-br rounded-2xl flex items-center justify-center font-bold text-white shadow-sm ring-2 ring-white flex-shrink-0`}
    >
      {getInitials(name)}
    </div>
  );
}

function LoginRequired() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 p-8 sm:p-12 shadow-xl backdrop-blur-md">
      <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
      <div className="absolute -bottom-12 -left-12 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="relative z-10 max-w-xl">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3.5 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
          <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
          Cloud Native Realtime Chat
        </span>
        <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          환영합니다! 로그인이 필요합니다
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          실시간 공개/개인 메시징과 Kubernetes 클러스터 모니터링을 이용하려면 로그인하세요.
          Google OAuth2 또는 기본 이메일 계정으로 안전하게 접속할 수 있습니다.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="/auth/login"
            className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition-all hover:bg-indigo-700 hover:shadow-indigo-500/30 hover:-translate-y-0.5 active:translate-y-0"
          >
            <span>로그인하기</span>
            <ArrowRight className="h-4 w-4" />
          </a>
          <a
            href="/backoffice"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-300"
          >
            <ShieldCheck className="h-4 w-4 text-slate-500" />
            <span>Admin Backoffice</span>
          </a>
        </div>
      </div>
    </section>
  );
}

function AppShell({
  currentUser,
  children
}: {
  currentUser: string | null;
  children: ReactNode;
}) {
  const location = useLocation();

  const navLinks = [
    { to: "/", label: "Direct Chat", icon: MessageSquare },
    { to: "/public-room", label: "Public Lounge", icon: Globe },
    { to: "/backoffice", label: "K8s Ops", icon: ShieldCheck }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100/60 to-indigo-50/30 text-slate-900 antialiased">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 text-white shadow-md shadow-indigo-500/25 transition-transform group-hover:scale-105">
                <Radio className="h-5 w-5 animate-pulse" />
              </div>
              <div className="hidden sm:block">
                <span className="font-display text-lg font-bold tracking-tight text-slate-900">
                  CloudChat
                </span>
                <span className="ml-1.5 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-600 ring-1 ring-inset ring-indigo-500/20">
                  v2.0
                </span>
              </div>
            </Link>

            {/* Navigation Tabs */}
            <nav className="flex items-center gap-1">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.to === "/"
                    ? location.pathname === "/" || location.pathname.startsWith("/dm/")
                    : location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold transition-all ${
                      isActive
                        ? "bg-slate-900 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User actions */}
          <div className="flex items-center gap-2">
            <a
              href="/profile"
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 hover:border-slate-300"
            >
              <span>Profile</span>
              <ExternalLink className="h-3 w-3 text-slate-400" />
            </a>

            {currentUser ? (
              <a
                href="/auth/logout"
                title="로그아웃"
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-rose-50 hover:text-rose-600"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </a>
            ) : (
              <a
                href="/auth/login"
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
              >
                Login
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        {/* User Status Bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white/70 px-4 py-2.5 text-xs sm:text-sm shadow-xs backdrop-blur">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span
                className={`absolute inline-flex h-full w-full animate-ping rounded-full ${
                  currentUser ? "bg-emerald-400" : "bg-slate-300"
                } opacity-75`}
              />
              <span
                className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                  currentUser ? "bg-emerald-500" : "bg-slate-400"
                }`}
              />
            </span>
            <span className="text-slate-500 font-medium">상태:</span>
            <span className="font-semibold text-slate-800">
              {currentUser ? currentUser : "로그인 정보 없음 (Guest)"}
            </span>
          </div>
          <div className="flex items-center gap-3 text-slate-500 text-xs">
            <span className="hidden md:inline">Microservices: Spring Boot 3.4.13 • Java 21</span>
            <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-600">
              k8s-ready
            </span>
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}

function DashboardPage({ currentUser }: { currentUser: string | null }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [conversationError, setConversationError] = useState<string | null>(null);

  const profileTargets = useMemo(() => {
    const targets = new Set<string>();
    searchResults.forEach((user) => targets.add(user.email));
    conversations.forEach((conversation) => targets.add(conversation.peerUser));
    return [...targets];
  }, [searchResults, conversations]);

  const fetchConversations = useCallback(() => {
    if (!currentUser) return;
    setIsRefreshing(true);
    api
      .getConversations()
      .then((rows) => {
        setConversations(rows);
        setConversationError(null);
      })
      .catch(() => setConversationError("대화 목록을 불러오지 못했습니다."))
      .finally(() => setIsRefreshing(false));
  }, [currentUser]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(() => {
      setIsLoadingSearch(true);
      api
        .searchUsers(query.trim())
        .then((rows) => setSearchResults(rows.filter((user) => user.email !== currentUser)))
        .finally(() => setIsLoadingSearch(false));
    }, 250);

    return () => clearTimeout(timer);
  }, [query, currentUser]);

  useEffect(() => {
    if (!profileTargets.length) return;

    const missing = profileTargets.filter((email) => !profiles[email]);
    if (!missing.length) return;

    Promise.all(
      missing.map(async (email) => {
        try {
          const profile = await api.getProfile(email);
          return [email, profile] as const;
        } catch {
          return [email, { email }] as const;
        }
      })
    ).then((entries) => {
      setProfiles((prev) => {
        const next = { ...prev };
        entries.forEach(([email, profile]) => {
          next[email] = profile;
        });
        return next;
      });
    });
  }, [profileTargets, profiles]);

  if (!currentUser) {
    return <LoginRequired />;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      {/* Left Column: User Search & Instant DM */}
      <section className="lg:col-span-5 space-y-4">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-600">
                <Search className="h-3 w-3" />
                Find People
              </span>
              <h2 className="mt-2 font-display text-2xl font-bold text-slate-900">사용자 검색</h2>
              <p className="mt-1 text-xs text-slate-500">
                대화하고 싶은 동료의 이메일을 검색하여 1:1 대화를 시작하세요.
              </p>
            </div>
          </div>

          <div className="mt-4 relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="이메일 검색 (예: user@example.com)"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-10 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {isLoadingSearch && (
            <div className="mt-4 flex items-center justify-center gap-2 py-4 text-xs text-slate-500">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-600" />
              <span>사용자 검색 중...</span>
            </div>
          )}

          <div className="mt-4 space-y-2 max-h-[380px] overflow-y-auto">
            {searchResults.map((user) => {
              const profile = profiles[user.email];
              const name = profile?.displayName || user.email;
              return (
                <button
                  key={user.email}
                  type="button"
                  onClick={() => navigate(`/dm/${encodeURIComponent(user.email)}`)}
                  className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-3 text-left transition hover:border-indigo-200 hover:bg-indigo-50/40 hover:shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <UserAvatar src={profile?.profilePicUrl} name={name} size="md" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900 group-hover:text-indigo-600">
                        {name}
                      </p>
                      <p className="truncate text-xs text-slate-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 rounded-xl bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 shadow-xs border border-slate-200 group-hover:border-indigo-300 group-hover:text-indigo-600">
                    <span>Chat</span>
                    <ArrowRight className="h-3 w-3" />
                  </div>
                </button>
              );
            })}

            {query && !isLoadingSearch && !searchResults.length && (
              <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500">
                검색된 사용자가 없습니다.
              </div>
            )}

            {!query && (
              <div className="rounded-2xl bg-slate-50 p-5 text-center text-xs text-slate-500">
                이메일 주소의 일부를 입력하면 일치하는 사용자를 바로 찾을 수 있습니다.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Right Column: Recent Conversations Inbox */}
      <section className="lg:col-span-7 space-y-4">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                <MessageSquare className="h-3 w-3" />
                Inbox
              </span>
              <h2 className="mt-2 font-display text-2xl font-bold text-slate-900">
                최근 대화 목록
              </h2>
            </div>
            <button
              type="button"
              onClick={fetchConversations}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${isRefreshing ? "animate-spin" : ""}`} />
              <span>새로고침</span>
            </button>
          </div>

          {conversationError && (
            <div className="mb-4 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
              {conversationError}
            </div>
          )}

          <div className="space-y-2.5">
            {conversations.map((conversation) => {
              const profile = profiles[conversation.peerUser];
              const name = profile?.displayName || conversation.peerUser;
              return (
                <button
                  key={conversation.conversationId}
                  type="button"
                  onClick={() => navigate(`/dm/${encodeURIComponent(conversation.peerUser)}`)}
                  className="group flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-3.5 text-left transition hover:border-indigo-300 hover:bg-indigo-50/30 hover:shadow-md"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <UserAvatar src={profile?.profilePicUrl} name={name} size="md" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-bold text-slate-900 group-hover:text-indigo-600">
                          {name}
                        </p>
                        <span className="text-[11px] text-slate-400">
                          {formatTimestamp(conversation.lastMessageAt)}
                        </span>
                      </div>
                      <p className="truncate text-xs text-slate-500 mt-0.5">
                        {conversation.lastMessagePreview || "대화가 시작되었습니다."}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {conversation.unreadCount > 0 && (
                      <span className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-2.5 py-0.5 text-xs font-bold text-white shadow-sm animate-pulse">
                        {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
                      </span>
                    )}
                    <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition" />
                  </div>
                </button>
              );
            })}

            {!conversations.length && (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-12 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <h3 className="mt-3 text-sm font-bold text-slate-800">최근 대화가 없습니다</h3>
                <p className="mt-1 text-xs text-slate-500">
                  왼쪽의 사용자 검색에서 이메일로 검색하여 새 대화를 시작해보세요!
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function PublicRoomPage({ currentUser }: { currentUser: string | null }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!currentUser) return;

    api
      .getPublicMessages()
      .then((data) => {
        setMessages(data);
        setTimeout(scrollToBottom, 100);
      })
      .catch(() => setMessages([]));

    const client = new Client({
      webSocketFactory: () => new SockJS("/chat"),
      reconnectDelay: 2000
    });

    client.onConnect = () => {
      setConnected(true);
      client.subscribe("/topic/messages", (frame) => {
        const message = JSON.parse(frame.body) as ChatMessage;
        setMessages((prev) => [...prev, message]);
        setTimeout(scrollToBottom, 50);
      });
    };

    client.onDisconnect = () => setConnected(false);
    client.onStompError = () => setConnected(false);
    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
    };
  }, [currentUser]);

  const sendMessage = () => {
    if (!input.trim() || !clientRef.current || !currentUser) return;
    clientRef.current.publish({
      destination: "/app/sendMessage",
      body: JSON.stringify({
        sender: currentUser,
        content: input.trim()
      })
    });
    setInput("");
  };

  if (!currentUser) {
    return <LoginRequired />;
  }

  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white shadow-sm overflow-hidden flex flex-col h-[75vh] min-h-[520px]">
      {/* Room Header */}
      <div className="flex items-center justify-between border-b border-slate-200/80 bg-slate-50/60 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
            <Hash className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-slate-900">
              public-lounge
            </h1>
            <p className="text-xs text-slate-500">
              클러스터 내 모든 사용자가 참여하는 오픈 광장 채널입니다.
            </p>
          </div>
        </div>

        {/* Live status badge */}
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
              connected
                ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20"
                : "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                connected ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
              }`}
            />
            {connected ? "Live Connected" : "Connecting..."}
          </span>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 space-y-4 overflow-y-auto p-6 bg-slate-50/30">
        {messages.map((message, index) => {
          const isMine = message.sender === currentUser;
          return (
            <div
              key={`${message.sender}-${message.timestamp ?? index}-${index}`}
              className={`flex items-start gap-3 ${isMine ? "flex-row-reverse" : "flex-row"}`}
            >
              <UserAvatar name={message.sender} size="sm" />
              <div className={`max-w-[75%] sm:max-w-[65%] ${isMine ? "text-right" : "text-left"}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-semibold ${isMine ? "text-indigo-600 ml-auto" : "text-slate-800"}`}>
                    {message.sender}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {formatTimestamp(message.timestamp)}
                  </span>
                </div>
                <div
                  className={`inline-block rounded-2xl px-4 py-2.5 text-sm shadow-xs break-words text-left ${
                    isMine
                      ? "bg-gradient-to-tr from-indigo-600 to-indigo-700 text-white rounded-tr-xs"
                      : "bg-white border border-slate-200/90 text-slate-800 rounded-tl-xs"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            </div>
          );
        })}

        {!messages.length && (
          <div className="flex h-full flex-col items-center justify-center text-center text-slate-400 py-12">
            <Globe className="h-10 w-10 text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-600">아직 등록된 메시지가 없습니다</p>
            <p className="text-xs text-slate-400">첫 번째 메시지를 남겨보세요!</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Footer */}
      <div className="border-t border-slate-200/80 bg-white p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="공개 채널에 메시지 입력 (Enter로 전송)..."
            className="flex-1 rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="inline-flex items-center gap-1.5 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span>전송</span>
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </section>
  );
}

function PrivateRoomPage({ currentUser }: { currentUser: string | null }) {
  const navigate = useNavigate();
  const params = useParams<{ recipient: string }>();
  const recipient = params.recipient ? decodeURIComponent(params.recipient) : "";
  const [conversationId, setConversationId] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const [readStatus, setReadStatus] = useState<string | null>(null);
  const clientRef = useRef<Client | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!currentUser || !recipient) return;

    api
      .getOrCreatePrivateConversation(recipient)
      .then((conversation) => {
        setConversationId(conversation.conversationId);
        return api.getPrivateMessages(conversation.conversationId);
      })
      .then((rows) => {
        setMessages(rows);
        setTimeout(scrollToBottom, 100);
      })
      .catch(() => {
        setMessages([]);
      });
  }, [currentUser, recipient]);

  useEffect(() => {
    if (!currentUser || !recipient || !conversationId) return;

    const client = new Client({
      webSocketFactory: () => new SockJS("/chat"),
      reconnectDelay: 2000
    });

    client.onConnect = () => {
      setConnected(true);
      client.subscribe(`/user/queue/private/${conversationId}`, (frame) => {
        const message = JSON.parse(frame.body) as ChatMessage;
        setMessages((prev) => [...prev, message]);
        setTimeout(scrollToBottom, 50);
        if (message.sender !== currentUser) {
          api.markAsRead(conversationId).catch(() => undefined);
        }
      });
      client.subscribe(`/user/queue/private/${conversationId}/read`, (frame) => {
        const readReceipt = JSON.parse(frame.body) as ReadReceiptEvent;
        if (readReceipt.reader === recipient) {
          setReadStatus(`읽음 (${formatTimestamp(readReceipt.readAt)})`);
        }
      });
      api.markAsRead(conversationId).catch(() => undefined);
    };

    client.onDisconnect = () => setConnected(false);
    client.onStompError = () => setConnected(false);
    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
    };
  }, [currentUser, recipient, conversationId]);

  const sendMessage = () => {
    if (!input.trim() || !clientRef.current || !currentUser || !recipient) return;
    clientRef.current.publish({
      destination: "/app/private/chat",
      body: JSON.stringify({
        sender: currentUser,
        recipient,
        content: input.trim()
      })
    });
    setInput("");
  };

  if (!currentUser) {
    return <LoginRequired />;
  }

  if (!recipient) {
    return <Navigate to="/" replace />;
  }

  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white shadow-sm overflow-hidden flex flex-col h-[75vh] min-h-[520px]">
      {/* Chat Room Header */}
      <div className="flex items-center justify-between border-b border-slate-200/80 bg-slate-50/70 px-6 py-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/")}
            title="목록으로 이동"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-xs transition hover:bg-slate-100"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <UserAvatar name={recipient} size="md" />
          <div>
            <h1 className="font-display text-lg font-bold text-slate-900">{recipient}</h1>
            <p className="text-xs text-slate-500">1:1 비공개 대화방</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {readStatus && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              <CheckCheck className="h-3.5 w-3.5 text-indigo-600" />
              {readStatus}
            </span>
          )}
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
              connected
                ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20"
                : "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                connected ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
              }`}
            />
            {connected ? "Connected" : "Offline"}
          </span>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 space-y-4 overflow-y-auto p-6 bg-slate-50/30">
        {messages.map((message, index) => {
          const isMine = message.sender === currentUser;
          return (
            <div
              key={`${message.sender}-${message.timestamp ?? index}-${index}`}
              className={`flex items-start gap-2.5 ${isMine ? "flex-row-reverse" : "flex-row"}`}
            >
              <UserAvatar name={message.sender} size="sm" />
              <div className={`max-w-[75%] sm:max-w-[65%] ${isMine ? "text-right" : "text-left"}`}>
                <div
                  className={`inline-block rounded-2xl px-4 py-2.5 text-sm shadow-xs break-words text-left ${
                    isMine
                      ? "bg-gradient-to-tr from-indigo-600 to-indigo-700 text-white rounded-tr-xs"
                      : "bg-white border border-slate-200/90 text-slate-800 rounded-tl-xs"
                  }`}
                >
                  {message.content}
                </div>
                <div className={`flex items-center gap-1 mt-1 text-[10px] text-slate-400 ${isMine ? "justify-end" : "justify-start"}`}>
                  <span>{formatTimestamp(message.timestamp)}</span>
                  {isMine && <Check className="h-3 w-3 text-slate-400" />}
                </div>
              </div>
            </div>
          );
        })}

        {!messages.length && (
          <div className="flex h-full flex-col items-center justify-center text-center text-slate-400 py-12">
            <MessageSquare className="h-10 w-10 text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-600">{recipient} 님과의 대화가 시작되었습니다</p>
            <p className="text-xs text-slate-400">인사를 건네보세요!</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="border-t border-slate-200/80 bg-white p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="메시지를 입력하세요 (Enter로 전송)..."
            className="flex-1 rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="inline-flex items-center gap-1.5 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span>전송</span>
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </section>
  );
}

function MetricTile({
  title,
  value,
  description,
  icon: Icon,
  colorScheme = "indigo"
}: {
  title: string;
  value: string | number;
  description: string;
  icon: typeof Activity;
  colorScheme?: "indigo" | "emerald" | "amber" | "cyan";
}) {
  const colors = {
    indigo: {
      bg: "bg-indigo-50",
      text: "text-indigo-600",
      border: "border-indigo-100"
    },
    emerald: {
      bg: "bg-emerald-50",
      text: "text-emerald-600",
      border: "border-emerald-100"
    },
    amber: {
      bg: "bg-amber-50",
      text: "text-amber-600",
      border: "border-amber-100"
    },
    cyan: {
      bg: "bg-cyan-50",
      text: "text-cyan-600",
      border: "border-cyan-100"
    }
  };

  const current = colors[colorScheme];

  return (
    <article className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:shadow-md">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</p>
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${current.bg} ${current.text}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{description}</p>
    </article>
  );
}

function BackofficePage() {
  const [email, setEmail] = useState("admin@test.com");
  const [password, setPassword] = useState("123456");
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [filterQuery, setFilterQuery] = useState("");

  const loadOverview = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await api.getAdminOverview();
      setOverview(data);
    } catch {
      setErrorMessage("모니터링 데이터를 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const session = await api.getAdminMe();
        if (!mounted) return;
        setAdminEmail(session.email);
        const data = await api.getAdminOverview();
        if (!mounted) return;
        setOverview(data);
      } catch {
        if (!mounted) return;
        setAdminEmail(null);
      } finally {
        if (mounted) {
          setIsCheckingSession(false);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const session = await api.adminLogin(email.trim(), password);
      setAdminEmail(session.email);
      const data = await api.getAdminOverview();
      setOverview(data);
    } catch {
      setErrorMessage("관리자 로그인에 실패했습니다. 계정 정보를 확인하세요.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await api.adminLogout();
    setAdminEmail(null);
    setOverview(null);
    setEmail("admin@test.com");
    setPassword("123456");
  };

  const runningPods = overview?.podPhaseSummary?.Running ?? 0;
  const readyNodes = overview?.nodes?.filter((node) => node.ready).length ?? 0;

  const filteredPods = useMemo(() => {
    if (!overview?.pods) return [];
    if (!filterQuery.trim()) return overview.pods;
    const q = filterQuery.toLowerCase();
    return overview.pods.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.nodeName && p.nodeName.toLowerCase().includes(q))
    );
  }, [overview?.pods, filterQuery]);

  const filteredNodes = useMemo(() => {
    if (!overview?.nodes) return [];
    if (!filterQuery.trim()) return overview.nodes;
    const q = filterQuery.toLowerCase();
    return overview.nodes.filter(
      (n) => n.name.toLowerCase().includes(q) || n.role.toLowerCase().includes(q)
    );
  }, [overview?.nodes, filterQuery]);

  if (isCheckingSession) {
    return (
      <section className="rounded-3xl border border-slate-200/80 bg-white p-8 text-center shadow-sm">
        <RefreshCw className="mx-auto h-6 w-6 animate-spin text-indigo-600 mb-2" />
        <p className="text-sm text-slate-600">백오피스 세션을 확인하는 중입니다...</p>
      </section>
    );
  }

  if (!adminEmail) {
    return (
      <section
        data-testid="admin-login-page"
        className="mx-auto max-w-lg rounded-3xl border border-slate-200/80 bg-white p-8 shadow-xl"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-4">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <span className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
          DevOps Backoffice
        </span>
        <h1 className="mt-3 font-display text-3xl font-extrabold text-slate-900">Admin Login</h1>
        <p className="mt-2 text-sm text-slate-600">
          Kubernetes 클러스터 리소스(Node/Pod) 및 실시간 채팅 서비스 통합 지표 관리자입니다.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleLogin}>
          <div>
            <label
              htmlFor="admin-email"
              className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500"
            >
              Email
            </label>
            <input
              id="admin-email"
              name="admin-email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
            />
          </div>
          <div>
            <label
              htmlFor="admin-password"
              className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500"
            >
              Password
            </label>
            <input
              id="admin-password"
              name="admin-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
            />
          </div>

          {errorMessage && (
            <p className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            data-testid="admin-login-button"
            disabled={isLoading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>로그인 중...</span>
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                <span>관리자 로그인</span>
              </>
            )}
          </button>
        </form>
      </section>
    );
  }

  return (
    <section data-testid="admin-dashboard" className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              Kubernetes + Chat Ops
            </span>
            <span className="rounded-md bg-slate-100 px-2.5 py-0.5 font-mono text-xs text-slate-600">
              ns: {overview?.namespace ?? "default"}
            </span>
          </div>
          <h1 className="mt-2 font-display text-2xl sm:text-3xl font-extrabold text-slate-900">
            Cluster & Chat Monitoring
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            접속 계정: <span className="font-semibold text-slate-700">{adminEmail}</span> |
            API Server: <span className="font-mono text-slate-600">{overview?.apiServer || "connected"}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadOverview}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${isLoading ? "animate-spin" : ""}`} />
            <span>새로고침</span>
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 rounded-2xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-slate-800"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>로그아웃</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
          {errorMessage}
        </div>
      )}

      {overview?.kubernetesError && (
        <div className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
          <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
          <span>{overview.kubernetesError}</span>
        </div>
      )}

      {/* Metric Tiles */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile
          title="Chat Rooms"
          value={overview?.chatMetrics.totalRoomCount ?? 0}
          description={`비공개: ${overview?.chatMetrics.privateRoomCount ?? 0}개, 공개방 1개`}
          icon={MessageSquare}
          colorScheme="indigo"
        />
        <MetricTile
          title="Participants"
          value={overview?.chatMetrics.participantCount ?? 0}
          description="개인 채팅 기준 고유 활성 사용자"
          icon={Users}
          colorScheme="cyan"
        />
        <MetricTile
          title="Nodes Ready"
          value={`${readyNodes}/${overview?.nodes.length ?? 0}`}
          description="Kubernetes /api/v1/nodes"
          icon={Server}
          colorScheme="emerald"
        />
        <MetricTile
          title="Pods Running"
          value={`${runningPods}/${overview?.pods.length ?? 0}`}
          description={`네임스페이스: ${overview?.namespace ?? "default"}`}
          icon={Layers}
          colorScheme="amber"
        />
      </div>

      {/* Filter Bar */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          placeholder="노드 또는 파드 이름으로 필터링..."
          className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
        />
      </div>

      {/* Tables: Nodes & Pods */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Nodes Table */}
        <article className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
              <Server className="h-4 w-4 text-indigo-600" />
              <span>Kubernetes Nodes ({filteredNodes.length})</span>
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2.5 pr-3 font-bold">Node Name</th>
                  <th className="py-2.5 pr-3 font-bold">Role</th>
                  <th className="py-2.5 pr-3 font-bold">Status</th>
                  <th className="py-2.5 pr-3 font-bold">Version</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredNodes.map((node) => (
                  <tr key={node.name} className="hover:bg-slate-50/50">
                    <td className="py-2.5 pr-3 font-mono font-medium text-slate-800">{node.name}</td>
                    <td className="py-2.5 pr-3 text-slate-600">{node.role}</td>
                    <td className="py-2.5 pr-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          node.ready
                            ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20"
                            : "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20"
                        }`}
                      >
                        {node.ready && <CheckCircle2 className="h-3 w-3" />}
                        {node.status}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 font-mono text-[11px] text-slate-500">
                      {node.kubeletVersion || "-"}
                    </td>
                  </tr>
                ))}
                {!filteredNodes.length && (
                  <tr>
                    <td className="py-4 text-center text-slate-400" colSpan={4}>
                      노드 정보가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>

        {/* Pods Table */}
        <article className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
              <Layers className="h-4 w-4 text-indigo-600" />
              <span>Pods in {overview?.namespace ?? "-"} ({filteredPods.length})</span>
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2.5 pr-3 font-bold">Pod Name</th>
                  <th className="py-2.5 pr-3 font-bold">Phase</th>
                  <th className="py-2.5 pr-3 font-bold">Ready</th>
                  <th className="py-2.5 pr-3 font-bold">Node</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPods.map((pod) => {
                  const isRunning = pod.phase === "Running";
                  return (
                    <tr key={pod.name} className="hover:bg-slate-50/50">
                      <td className="py-2.5 pr-3 font-mono font-medium text-slate-800 truncate max-w-[160px]" title={pod.name}>
                        {pod.name}
                      </td>
                      <td className="py-2.5 pr-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            isRunning
                              ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20"
                              : "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20"
                          }`}
                        >
                          {pod.phase}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 font-mono text-[11px] text-slate-600">{pod.ready}</td>
                      <td className="py-2.5 pr-3 font-mono text-[11px] text-slate-500 truncate max-w-[120px]" title={pod.nodeName}>
                        {pod.nodeName || "-"}
                      </td>
                    </tr>
                  );
                })}
                {!filteredPods.length && (
                  <tr>
                    <td className="py-4 text-center text-slate-400" colSpan={4}>
                      파드 정보가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
      </div>
    </section>
  );
}

function RootApp() {
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  useEffect(() => {
    fetch("/chat/whoami", { credentials: "include" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data && data.username) {
          setCurrentUser(data.username as string);
        } else {
          setCurrentUser(null);
        }
      })
      .catch(() => setCurrentUser(null));
  }, []);

  return (
    <BrowserRouter>
      <AppShell currentUser={currentUser}>
        <Routes>
          <Route path="/" element={<DashboardPage currentUser={currentUser} />} />
          <Route path="/public-room" element={<PublicRoomPage currentUser={currentUser} />} />
          <Route path="/dm/:recipient" element={<PrivateRoomPage currentUser={currentUser} />} />
          <Route path="/backoffice" element={<BackofficePage />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}

export default RootApp;
