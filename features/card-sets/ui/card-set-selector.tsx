import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Fonts } from '@/shared/config/theme';
import { initializeDatabase } from '@/shared/data/db/client';
import type { CardSet } from '@/shared/data/db/schema';
import { getAllCardSets, saveCardSet } from '@/shared/data/db/service';
import { GRADE1_CARD_SETS, GRADE2_CARD_SETS } from '@/shared/lib/card-set-generator';
import { useAppColors } from '@/shared/lib/use-app-colors';

interface CardSetSelectorProps {
  onSelectCardSet: (cardSet: CardSet) => void;
  selectedCardSetId?: number | null;
}

function getOperatorLabel(operator: string): string {
  switch (operator) {
    case '+':
      return '足し算';
    case '-':
      return '引き算';
    case '*':
      return '掛け算';
    case '/':
      return '割り算';
    default:
      return operator;
  }
}

function getOperatorEmoji(operator: string): string {
  switch (operator) {
    case '+':
      return '➕';
    case '-':
      return '➖';
    case '*':
      return '✖️';
    case '/':
      return '➗';
    default:
      return '🔢';
  }
}

export default function CardSetSelector({
  onSelectCardSet,
  selectedCardSetId,
}: CardSetSelectorProps) {
  const c = useAppColors();
  const [cardSets, setCardSets] = useState<CardSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbInitialized, setDbInitialized] = useState(false);

  useEffect(() => {
    initializeDatabase()
      .then(() => {
        console.log('[CardSetSelector] Database initialized');
        setDbInitialized(true);
      })
      .catch((error) => {
        console.error('[CardSetSelector] Failed to initialize database:', error);
        setDbInitialized(true);
      });
  }, []);

  const initializeDefaultCardSets = useCallback(async () => {
    try {
      const existingCardSets = await getAllCardSets();
      const existingNames = new Set(existingCardSets.map((cs) => cs.name));
      const allDefaultSets = [...GRADE1_CARD_SETS, ...GRADE2_CARD_SETS];
      let addedCount = 0;

      for (const cardSet of allDefaultSets) {
        if (!existingNames.has(cardSet.name)) {
          await saveCardSet(cardSet);
          addedCount++;
        }
      }

      console.log(`[CardSetSelector] Added ${addedCount} new card sets`);
    } catch (error) {
      console.error('[CardSetSelector] Failed to initialize default card sets:', error);
    }
  }, []);

  const loadCardSets = useCallback(async () => {
    try {
      setLoading(true);
      await initializeDefaultCardSets();
      const sets = await getAllCardSets();
      setCardSets(sets);
    } catch (error) {
      console.error('[CardSetSelector] Failed to load card sets:', error);
    } finally {
      setLoading(false);
    }
  }, [initializeDefaultCardSets]);

  useEffect(() => {
    if (dbInitialized) {
      loadCardSets();
    }
  }, [dbInitialized, loadCardSets]);

  if (loading) {
    return (
      <View style={[styles.centeredContainer, { backgroundColor: c.surfaceSecondary }]}>
        <Text style={[styles.loadingText, { color: c.textSecondary }]}>
          カードセットを読み込み中...
        </Text>
      </View>
    );
  }

  if (cardSets.length === 0) {
    return (
      <View style={[styles.centeredContainer, { backgroundColor: c.surfaceSecondary }]}>
        <Text style={[styles.errorText, { color: c.error }]}>カードセットが見つかりません</Text>
        <Pressable
          style={[styles.reloadButton, { backgroundColor: c.primary }]}
          onPress={loadCardSets}
        >
          <Text style={[styles.reloadButtonText, { color: c.primaryText }]}>再読み込み</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: c.surfaceSecondary }]}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={[styles.title, { color: c.textPrimary, fontFamily: Fonts?.rounded }]}>
        カードセットを選んでね
      </Text>
      <Text style={[styles.subtitle, { color: c.textSecondary }]}>
        練習したいセットをタップしてください
      </Text>

      {cardSets.map((cardSet) => {
        const isSelected = selectedCardSetId === cardSet.id;
        return (
          <Pressable
            key={cardSet.id}
            onPress={() => onSelectCardSet(cardSet)}
            style={({ pressed }) => [
              styles.cardItem,
              {
                backgroundColor: isSelected ? c.successBg : c.surface,
                borderColor: isSelected ? c.successBorder : c.border,
                shadowColor: c.cardShadow,
                opacity: pressed ? 0.85 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
          >
            <View style={[styles.operatorBadge, { backgroundColor: c.infoBg }]}>
              <Text style={styles.operatorEmoji}>{getOperatorEmoji(cardSet.operator)}</Text>
            </View>
            <View style={styles.cardItemContent}>
              <Text
                style={[styles.cardItemName, { color: c.textPrimary, fontFamily: Fonts?.rounded }]}
              >
                {cardSet.name}
              </Text>
              <Text style={[styles.cardItemDetails, { color: c.textMuted }]}>
                {getOperatorLabel(cardSet.operator)} ・ 答え {cardSet.answerMin}〜
                {cardSet.answerMax} ・ {cardSet.totalCards}枚
              </Text>
            </View>
            <View style={[styles.cardItemArrow, { backgroundColor: c.primary }]}>
              <Text style={[styles.cardItemArrowText, { color: c.primaryText }]}>▶</Text>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 16,
  },
  reloadButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  reloadButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  operatorBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  operatorEmoji: {
    fontSize: 20,
  },
  cardItemContent: {
    flex: 1,
    marginRight: 12,
  },
  cardItemName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 3,
  },
  cardItemDetails: {
    fontSize: 12,
    fontWeight: '500',
  },
  cardItemArrow: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardItemArrowText: {
    fontSize: 12,
    fontWeight: '800',
  },
});
