import { useCallback, useEffect, useState } from 'react';
import { Button, ScrollView, StyleSheet, Text, View } from 'react-native';
import { initializeDatabase } from '@/shared/data/db/client';
import type { CardSet } from '@/shared/data/db/schema';
import { getAllCardSets, saveCardSet } from '@/shared/data/db/service';
import { GRADE1_CARD_SETS, GRADE2_CARD_SETS } from '@/shared/lib/card-set-generator';

interface CardSetSelectorProps {
  onSelectCardSet: (cardSet: CardSet) => void;
  selectedCardSetId?: number | null;
}

export default function CardSetSelector({
  onSelectCardSet,
  selectedCardSetId,
}: CardSetSelectorProps) {
  const [cardSets, setCardSets] = useState<CardSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbInitialized, setDbInitialized] = useState(false);

  // データベースを初期化
  useEffect(() => {
    initializeDatabase()
      .then(() => {
        console.log('[CardSetSelector] Database initialized');
        setDbInitialized(true);
      })
      .catch((error) => {
        console.error('[CardSetSelector] Failed to initialize database:', error);
        setDbInitialized(true); // エラーでも続行する
      });
  }, []);

  // デフォルトのカードセットを初期化
  const initializeDefaultCardSets = useCallback(async () => {
    try {
      // 既存のカードセットを取得
      const existingCardSets = await getAllCardSets();
      const existingNames = new Set(existingCardSets.map(cs => cs.name));

      // まだ存在しないカードセットのみを追加
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

  // カードセットをデータベースから読み込む
  const loadCardSets = useCallback(async () => {
    try {
      setLoading(true);

      // デフォルトのカードセットを初期化（既存のものはスキップ）
      await initializeDefaultCardSets();

      // カードセットを取得
      const sets = await getAllCardSets();
      setCardSets(sets);
    } catch (error) {
      console.error('[CardSetSelector] Failed to load card sets:', error);
    } finally {
      setLoading(false);
    }
  }, [initializeDefaultCardSets]);

  // データベース初期化完了後にカードセットを読み込む
  useEffect(() => {
    if (dbInitialized) {
      loadCardSets();
    }
  }, [dbInitialized, loadCardSets]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>カードセットを読み込み中...</Text>
      </View>
    );
  }

  if (cardSets.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>カードセットが見つかりません</Text>
        <Button title="再読み込み" onPress={loadCardSets} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>カードセットを選択してください</Text>
      {cardSets.map((cardSet) => (
        <View
          key={cardSet.id}
          style={[
            styles.cardSetItem,
            selectedCardSetId === cardSet.id && styles.selectedCardSetItem,
          ]}
        >
          <View style={styles.cardSetInfo}>
            <Text style={styles.cardSetName}>{cardSet.name}</Text>
            <Text style={styles.cardSetDetails}>
              {cardSet.operator === '+' && '足し算'}
              {cardSet.operator === '-' && '引き算'}
              {cardSet.operator === '*' && '掛け算'}
              {cardSet.operator === '/' && '割り算'} | 答え: {cardSet.answerMin}~
              {cardSet.answerMax} | {cardSet.totalCards}枚
            </Text>
          </View>
          <Button
            title={selectedCardSetId === cardSet.id ? '選択中' : '選択'}
            onPress={() => onSelectCardSet(cardSet)}
            color={selectedCardSetId === cardSet.id ? '#4CAF50' : '#2196F3'}
            disabled={selectedCardSetId === cardSet.id}
          />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#f44336',
    marginBottom: 20,
  },
  cardSetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedCardSetItem: {
    borderWidth: 2,
    borderColor: '#4CAF50',
    backgroundColor: '#e8f5e9',
  },
  cardSetInfo: {
    flex: 1,
    marginRight: 10,
  },
  cardSetName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  cardSetDetails: {
    fontSize: 12,
    color: '#666',
  },
});
