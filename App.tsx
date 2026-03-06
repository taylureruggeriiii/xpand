import { createClient } from '@supabase/supabase-js';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const supabase = createClient(
  'https://jfcibnfmhtymunptnrtr.supabase.co',
  'sb_publishable_al8sn_BRNjmaXKfcLKHxQA_uDCUZh2K'
);

const E = {
  cream: '#FAF7F2',
  warm: '#F2EDE4',
  sand: '#E8DDD0',
  clay: '#C4A882',
  rust: '#B5562B',
  espresso: '#2C1810',
  charcoal: '#1A1A1A',
  sage: '#7A8C6E',
  blush: '#E8C4B0',
  gold: '#C9A84C',
};

const SECTIONS = [
  { id: 'morning', label: '☀️ Brief', color: E.gold, accent: E.espresso, bg: '#1A1208' },
  { id: 'news', label: '📡 News', color: E.clay, accent: E.espresso, bg: '#120E08' },
  { id: 'mom', label: '🌿 Mama', color: E.sage, accent: E.espresso, bg: '#0A0F08' },
  { id: 'estral', label: '⚡ Estral', color: E.rust, accent: E.cream, bg: '#140806' },
  { id: 'creative', label: '🎨 Create', color: E.blush, accent: E.espresso, bg: '#140E0A' },
  { id: 'follows', label: '📱 Follow', color: E.sand, accent: E.espresso, bg: '#100C08' },
];

const IMAGES: Record<string, string[]> = {
  morning: [
    'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=600&q=80',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&q=80',
    'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=600&q=80',
  ],
  news: [
    'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600&q=80',
    'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=600&q=80',
    'https://images.unsplash.com/photo-1555255707-c07966088b7b?w=600&q=80',
    'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&q=80',
    'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=600&q=80',
  ],
  mom: [
    'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=600&q=80',
    'https://images.unsplash.com/photo-1489710437720-ebb67ec84dd2?w=600&q=80',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&q=80',
    'https://images.unsplash.com/photo-1498671546682-94a232c26d17?w=600&q=80',
  ],
  estral: [
    'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=600&q=80',
    'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=600&q=80',
    'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=600&q=80',
    'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=600&q=80',
  ],
  creative: [
    'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&q=80',
    'https://images.unsplash.com/photo-1542744094-3a31f272c490?w=600&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
    'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=600&q=80',
    'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=600&q=80',
  ],
  follows: [
    'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=600&q=80',
    'https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=600&q=80',
    'https://images.unsplash.com/photo-1611162618071-b39a2ec055fb?w=600&q=80',
    'https://images.unsplash.com/photo-1432888622747-4eb9a8f2c293?w=600&q=80',
  ],
};

type CardRow = {
  id: string;
  section_id?: string;
  emoji?: string | null;
  title?: string | null;
  body?: string | null;
  tag?: string | null;
  image_url?: string | null;
  [key: string]: unknown;
};

async function fetchCardsFromSupabase(sectionId: string): Promise<CardRow[]> {
  const { data } = await supabase
    .from('daily_cards')
    .select('*')
    .eq('section_id', sectionId);
  return Array.isArray(data) ? data : [];
}

function getClientX(e: { clientX?: number; touches?: { clientX: number }[]; changedTouches?: { clientX: number }[] }): number {
  if (typeof e.clientX === 'number') return e.clientX;
  if (e.touches?.[0]) return e.touches[0].clientX;
  if (e.changedTouches?.[0]) return e.changedTouches[0].clientX;
  return 0;
}

function SwipeCard({
  card,
  image,
  sec,
  onSwipeOut,
  isTop,
  stackIndex,
}: {
  card: CardRow;
  image: string;
  sec: (typeof SECTIONS)[0];
  onSwipeOut: (dir: 'left' | 'right') => void;
  isTop: boolean;
  stackIndex: number;
}) {
  const [x, setX] = useState(0);
  const [rotate, setRotate] = useState(0);
  const [gone, setGone] = useState<'left' | 'right' | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const startClientX = useRef(0);
  const currentX = useRef(0);

  const handleMove = useCallback(
    (e: { clientX?: number; touches?: { clientX: number }[] }) => {
      if (!isTop || gone) return;
      const clientX = getClientX(e);
      const dx = clientX - startClientX.current;
      currentX.current = dx;
      setX(dx);
      setRotate(dx * 0.07);
    },
    [isTop, gone]
  );

  const swipeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleEnd = useCallback(() => {
    if (!isTop) return;
    const dx = currentX.current;
    if (Math.abs(dx) > 85) {
      const dir = dx > 0 ? 'right' : 'left';
      setGone(dir);
      setX(dir === 'right' ? 420 : -420);
      setRotate(dir === 'right' ? 22 : -22);
      setIsDragging(false);
      swipeTimeout.current = setTimeout(() => onSwipeOut(dir), 320);
    } else {
      setX(0);
      setRotate(0);
      setIsDragging(false);
    }
  }, [isTop, onSwipeOut]);

  const handleStart = useCallback(
    (clientX: number) => {
      if (!isTop || gone) return;
      startClientX.current = clientX;
      currentX.current = 0;
      setIsDragging(true);
    },
    [isTop, gone]
  );

  useEffect(() => {
    if (!isDragging) return;
    const onMouseMove = (e: MouseEvent) => handleMove({ clientX: e.clientX });
    const onMouseUp = () => handleEnd();
    const onTouchMove = (e: TouchEvent) => {
      handleMove({ touches: e.touches });
      if (e.cancelable) e.preventDefault();
    };
    const onTouchEnd = () => handleEnd();
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      if (swipeTimeout.current) clearTimeout(swipeTimeout.current);
    };
  }, [isDragging, handleMove, handleEnd]);

  const scale = isTop ? 1 : stackIndex === 1 ? 0.95 : 0.91;
  const translateY = isTop ? 0 : stackIndex === 1 ? 14 : 26;

  const tag = card.tag ?? 'Card';
  const emoji = card.emoji ?? '✨';
  const title = card.title ?? '';
  const body = card.body ?? '';

  const cardStyle: Record<string, unknown> = {
    transform: [
      { translateX: x },
      { rotate: `${rotate}deg` },
      { scale },
      { translateY },
    ],
    opacity: gone !== null ? 0 : 1,
    zIndex: isTop ? 10 : 10 - stackIndex,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: isTop ? 20 : 6 },
    shadowOpacity: isTop ? 0.6 : 0.4,
    shadowRadius: isTop ? 60 : 24,
    elevation: isTop ? 12 : 6,
  };
  if (typeof document !== 'undefined') {
    const webStyle = cardStyle as Record<string, string>;
    webStyle.transition = isDragging
      ? 'none'
      : 'transform 0.32s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.32s ease';
    if (isTop) webStyle.cursor = 'grab';
  }

  const onPointerDown = useCallback(
    (e: { nativeEvent: { clientX?: number; touches?: { clientX: number }[] } }) => {
      if (!isTop || gone) return;
      handleStart(getClientX(e.nativeEvent));
    },
    [isTop, gone, handleStart]
  );

  return (
    <View
      style={[styles.cardWrapper, cardStyle]}
      onMouseDown={onPointerDown}
      onTouchStart={onPointerDown}
    >
      <View style={[styles.cardInner, { borderTopColor: sec.color }]}>
        <View style={styles.cardImageWrap}>
          <Image source={{ uri: image }} style={styles.cardImage} resizeMode="cover" />
          <View style={[styles.tagPill, { backgroundColor: sec.color }]}>
            <Text style={[styles.tagText, { color: sec.accent }]}>{tag}</Text>
          </View>
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardEmoji}>{emoji}</Text>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardBody}>{body}</Text>
          {isTop && (
            <View style={styles.cardFooter}>
              <Text style={styles.footerHint}>← skip</Text>
              <View style={[styles.footerBtn, { backgroundColor: sec.color }]}>
                <Text style={{ color: sec.accent, fontSize: 14 }}>→</Text>
              </View>
              <Text style={styles.footerHint}>save →</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

function Deck({
  sectionId,
  sec,
}: {
  sectionId: string;
  sec: (typeof SECTIONS)[0];
}) {
  const [cards, setCards] = useState<CardRow[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [idx, setIdx] = useState(0);
  const [saved, setSaved] = useState<CardRow[]>([]);
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    setLoading(true);
    setIdx(0);
    setSaved([]);
    setShowSaved(false);
    fetchCardsFromSupabase(sectionId).then((data) => {
      const safeData = Array.isArray(data) ? data : [];
      const bank = IMAGES[sectionId] ?? IMAGES.news ?? [];
      setCards(safeData);
      setImages(safeData.map((_, i) => bank[i % bank.length] ?? bank[0] ?? ''));
      setLoading(false);
    });
  }, [sectionId]);

  const onSwipeOut = useCallback(
    (dir: 'left' | 'right', cardIdx: number) => {
      if (dir === 'right') setSaved((s) => [...s, cards[cardIdx]]);
      setIdx((i) => i + 1);
    },
    [cards]
  );

  const visible = cards.slice(idx, idx + 3);

  if (loading)
    return (
      <View style={styles.loadingWrap}>
        <View style={[styles.spinner, { borderTopColor: sec.color }]} />
        <Text style={styles.loadingText}>LOADING INTEL...</Text>
      </View>
    );

  if (cards.length === 0)
    return (
      <View style={styles.allCaughtUp}>
        <Text style={{ fontSize: 44 }}>📭</Text>
        <Text style={styles.allCaughtUpTitle}>No cards yet</Text>
        <Text style={styles.savedCount}>Tap another section or add cards in Supabase.</Text>
      </View>
    );

  if (idx >= cards.length && cards.length > 0)
    return (
      <View style={styles.allCaughtUp}>
        <Text style={{ fontSize: 44 }}>✨</Text>
        <Text style={styles.allCaughtUpTitle}>All caught up!</Text>
        {saved.length > 0 && (
          <Text style={styles.savedCount}>
            {saved.length} card{saved.length > 1 ? 's' : ''} saved ♥
          </Text>
        )}
        {saved.length > 0 && (
          <Pressable
            onPress={() => setShowSaved(!showSaved)}
            style={[styles.viewSavedBtn, { backgroundColor: sec.color }]}
          >
            <Text style={[styles.viewSavedBtnText, { color: sec.accent }]}>
              {showSaved ? 'Hide Saved' : 'View Saved ♥'}
            </Text>
          </Pressable>
        )}
        {showSaved && (
          <ScrollView style={styles.savedList} contentContainerStyle={styles.savedListContent}>
            {saved.map((c, i) => (
              <View key={i} style={[styles.savedCard, { borderLeftColor: sec.color }]}>
                <Text style={styles.savedCardTitle}>
                  {c.emoji ?? '✨'} {c.title ?? ''}
                </Text>
                <Text style={styles.savedCardBody}>{c.body ?? ''}</Text>
              </View>
            ))}
          </ScrollView>
        )}
        <Pressable
          onPress={() => {
            setIdx(0);
            setSaved([]);
            setShowSaved(false);
          }}
          style={styles.replayBtn}
        >
          <Text style={styles.replayBtnText}>↺ Replay</Text>
        </Pressable>
      </View>
    );

  return (
    <View style={styles.deck}>
      {/* Progress bar */}
      <View style={styles.progressRow}>
        {cards.map((_, i) => (
          <View
            key={i}
            style={[
              styles.progressDot,
              i < idx
                ? { backgroundColor: sec.color }
                : i === idx
                  ? { backgroundColor: E.clay + '99' }
                  : { backgroundColor: E.clay + '28' },
            ]}
          />
        ))}
        <Text style={styles.progressLabel}>{cards.length - idx} left</Text>
      </View>

      {/* Stack */}
      <View style={styles.stack}>
        {[...visible].reverse().map((card, revI) => {
          const stackIdx = visible.length - 1 - revI;
          const absIdx = idx + stackIdx;
          return (
            <SwipeCard
              key={card.id ?? absIdx}
              card={card}
              image={images[absIdx] ?? images[0] ?? ''}
              sec={sec}
              onSwipeOut={(dir) => onSwipeOut(dir, absIdx)}
              isTop={stackIdx === 0}
              stackIndex={stackIdx}
            />
          );
        })}
      </View>
    </View>
  );
}

export default function EstralApp() {
  const [active, setActive] = useState(0);
  const navRef = useRef<ScrollView>(null);
  const touchStartX = useRef<number | null>(null);
  const sec = SECTIONS[active];
  const { width } = Dimensions.get('window');
  const maxW = Math.min(width, 430);

  useEffect(() => {
    navRef.current?.scrollTo({ x: active * 90, animated: true });
  }, [active]);

  const onTouchStart = useCallback((e: { nativeEvent: { touches: { clientX: number }[] } }) => {
    touchStartX.current = e.nativeEvent.touches[0]?.clientX ?? null;
  }, []);
  const onTouchEnd = useCallback(
    (e: { nativeEvent: { changedTouches: { clientX: number }[] } }) => {
      if (touchStartX.current === null) return;
      const endX = e.nativeEvent.changedTouches[0]?.clientX ?? 0;
      const dx = endX - touchStartX.current;
      if (Math.abs(dx) > 70) {
        if (dx < 0 && active < SECTIONS.length - 1) setActive((i) => i + 1);
        if (dx > 0 && active > 0) setActive((i) => i - 1);
      }
      touchStartX.current = null;
    },
    [active]
  );

  return (
    <View
      style={[styles.screen, { backgroundColor: sec.bg, maxWidth: maxW }]}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <StatusBar style="light" />

      {/* Ambient glow */}
      <View style={[styles.glow, { shadowColor: sec.color }]} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>estral</Text>
          <Text style={[styles.sublogo, { color: sec.color }]}>ai briefing</Text>
        </View>
        <View style={styles.datePill}>
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Nav pills */}
      <ScrollView
        ref={navRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.navRow}
        style={styles.navScroll}
      >
        {SECTIONS.map((s, i) => (
          <Pressable
            key={s.id}
            onPress={() => setActive(i)}
            style={[
              styles.navPill,
              active === i && { backgroundColor: s.color, borderWidth: 0 },
              active === i && { transform: [{ scale: 1.06 }], shadowColor: s.color, shadowOpacity: 0.33, shadowRadius: 18 },
            ]}
          >
            <Text style={[styles.navPillText, active === i && { color: s.accent, fontWeight: '600' }]}>
              {s.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Card deck */}
      <View style={styles.deckContainer}>
        <Deck key={sec.id} sectionId={sec.id} sec={sec} />
      </View>

      {/* Bottom dots */}
      <View style={styles.dots}>
        {SECTIONS.map((s, i) => (
          <Pressable
            key={s.id}
            onPress={() => setActive(i)}
            style={[
              styles.dot,
              active === i && { width: 24, backgroundColor: s.color },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignSelf: 'center',
    width: '100%',
  },
  glow: {
    position: 'absolute',
    top: -60,
    left: '50%',
    marginLeft: -130,
    width: 260,
    height: 220,
    borderRadius: 999,
    backgroundColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.13,
    shadowRadius: 80,
    elevation: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 8,
    zIndex: 10,
  },
  logo: {
    fontFamily: 'Georgia',
    fontSize: 28,
    fontWeight: '700',
    color: E.cream,
    letterSpacing: -0.5,
  },
  sublogo: {
    fontSize: 9,
    letterSpacing: 3.5,
    fontWeight: '500',
    marginTop: 3,
    textTransform: 'uppercase',
  },
  datePill: {
    backgroundColor: E.cream + '12',
    borderWidth: 1,
    borderColor: E.clay + '30',
    borderRadius: 50,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  dateText: {
    fontSize: 10,
    color: E.clay,
    letterSpacing: 1.5,
  },
  navScroll: { maxHeight: 44, zIndex: 10 },
  navRow: {
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: 22,
    paddingVertical: 6,
    paddingBottom: 12,
  },
  navPill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 50,
    backgroundColor: E.cream + '0D',
    borderWidth: 1,
    borderColor: E.clay + '25',
  },
  navPillText: {
    fontSize: 12,
    color: E.clay,
    fontWeight: '400',
    letterSpacing: 0.2,
  },
  deckContainer: {
    flex: 1,
    paddingHorizontal: 18,
    minHeight: 0,
    zIndex: 5,
  },
  deck: { flex: 1, minHeight: 0 },
  progressRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 12,
    alignItems: 'center',
  },
  progressDot: {
    flex: 1,
    height: 2.5,
    borderRadius: 2,
  },
  progressLabel: {
    fontSize: 11,
    color: E.clay,
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  stack: {
    flex: 1,
    position: 'relative',
  },
  cardWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: E.cream,
  },
  cardInner: {
    flex: 1,
    borderTopWidth: 3,
    overflow: 'hidden',
  },
  cardImageWrap: {
    height: '52%',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  tagPill: {
    position: 'absolute',
    bottom: 14,
    left: 18,
    borderRadius: 50,
    paddingVertical: 5,
    paddingHorizontal: 14,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  stamp: {
    position: 'absolute',
    top: 36,
    borderWidth: 3,
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(250,247,242,0.85)',
  },
  stampSave: {
    left: 20,
    borderColor: E.sage,
    transform: [{ rotate: '-14deg' }],
  },
  stampSaveText: { color: E.sage, fontWeight: '700', fontSize: 19, letterSpacing: 2 },
  stampSkip: {
    right: 20,
    borderColor: E.rust,
    transform: [{ rotate: '14deg' }],
  },
  stampSkipText: { color: E.rust, fontWeight: '700', fontSize: 19, letterSpacing: 2 },
  cardContent: {
    flex: 1,
    backgroundColor: E.cream,
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 20,
  },
  cardEmoji: { fontSize: 26, marginBottom: 10 },
  cardTitle: {
    fontFamily: 'Georgia',
    fontSize: 20,
    fontWeight: '700',
    color: E.espresso,
    marginBottom: 10,
    lineHeight: 25,
  },
  cardBody: {
    fontSize: 13,
    fontWeight: '400',
    color: '#3D2A1F',
    lineHeight: 21,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: E.sand,
  },
  footerHint: {
    fontSize: 10,
    color: E.clay,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  footerBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  spinner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: E.sand + '44',
    borderTopColor: E.gold,
  },
  loadingText: {
    color: E.clay,
    fontSize: 12,
    letterSpacing: 2,
  },
  allCaughtUp: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },
  allCaughtUpTitle: {
    fontFamily: 'Georgia',
    fontSize: 26,
    color: E.cream,
    textAlign: 'center',
  },
  savedCount: { fontSize: 13, color: E.clay },
  viewSavedBtn: {
    borderRadius: 50,
    paddingVertical: 11,
    paddingHorizontal: 26,
  },
  viewSavedBtnText: { fontWeight: '600', fontSize: 13 },
  savedList: { width: '100%', maxHeight: 260 },
  savedListContent: { gap: 10, paddingVertical: 8 },
  savedCard: {
    backgroundColor: E.cream,
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 3,
  },
  savedCardTitle: {
    fontFamily: 'Georgia',
    fontSize: 15,
    color: E.espresso,
    marginBottom: 5,
  },
  savedCardBody: { fontSize: 12, color: '#3D2A1F', lineHeight: 19 },
  replayBtn: {
    borderWidth: 1,
    borderColor: E.clay + '55',
    borderRadius: 50,
    paddingVertical: 9,
    paddingHorizontal: 22,
  },
  replayBtnText: { fontSize: 12, color: E.clay },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 10,
    paddingBottom: 20,
    zIndex: 10,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: E.clay + '40',
  },
});
