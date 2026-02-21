import { and, eq, isNotNull, sql } from 'drizzle-orm';
import { db } from './client';
import { cardSetProgress, cardSets, type NewCardSet, practiceSessions } from './schema';

// 練習セッションを開始（開始時刻のみ記録）
export async function startPracticeSession(cardSetId?: number) {
  const result = await db
    .insert(practiceSessions)
    .values({
      startedAt: new Date(),
      cardSetId: cardSetId ?? null,
      createdAt: new Date(),
    })
    .returning();

  return result[0];
}

// 練習セッションを終了（終了時刻、経過時間、正誤、回答を記録）
export async function endPracticeSession(
  sessionId: number,
  data: {
    isCorrect: boolean;
    userAnswer: number;
  }
) {
  const session = await db
    .select()
    .from(practiceSessions)
    .where(eq(practiceSessions.id, sessionId))
    .limit(1);

  if (!session || session.length === 0) {
    throw new Error(`Session ${sessionId} not found`);
  }

  const endedAt = new Date();
  const startedAt = session[0].startedAt;
  const elapsedTime = endedAt.getTime() - startedAt.getTime();

  const result = await db
    .update(practiceSessions)
    .set({
      endedAt,
      elapsedTime,
      isCorrect: data.isCorrect,
      userAnswer: data.userAnswer,
    })
    .where(eq(practiceSessions.id, sessionId))
    .returning();

  return result[0];
}

// 最新のN件の練習セッションを取得
export async function getRecentSessions(limit = 10) {
  return await db.select().from(practiceSessions).limit(limit).orderBy(practiceSessions.createdAt);
}

// 統計情報を取得
export async function getSessionStats() {
  const sessions = await db.select().from(practiceSessions);

  const completedSessions = sessions.filter((s) => s.isCorrect !== null);
  const correctCount = completedSessions.filter((s) => s.isCorrect === true).length;
  const incorrectCount = completedSessions.filter((s) => s.isCorrect === false).length;
  const totalCount = completedSessions.length;

  const totalTime = completedSessions.reduce((sum, s) => sum + (s.elapsedTime || 0), 0);
  const averageTime = totalCount > 0 ? totalTime / totalCount : 0;

  return {
    correct: correctCount,
    incorrect: incorrectCount,
    total: totalCount,
    accuracy: totalCount > 0 ? (correctCount / totalCount) * 100 : 0,
    averageTime: Math.round(averageTime),
    totalTime,
  };
}

/**
 * 指定カードセットの日毎の平均回答時間を取得
 */
export async function getDailyAverageAnswerTimes(
  cardSetId: number,
  days = 30
): Promise<{ date: string; averageTime: number }[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  // mode: 'timestamp' はDBに秒単位で保存するため、秒に変換
  const cutoffTimestamp = Math.floor(cutoffDate.getTime() / 1000);

  const rows = await db
    .select({
      date: sql<string>`date(${practiceSessions.startedAt}, 'unixepoch', 'localtime')`,
      averageTime: sql<number>`avg(${practiceSessions.elapsedTime})`,
    })
    .from(practiceSessions)
    .where(
      and(
        eq(practiceSessions.cardSetId, cardSetId),
        isNotNull(practiceSessions.elapsedTime),
        sql`${practiceSessions.startedAt} >= ${cutoffTimestamp}`
      )
    )
    .groupBy(sql`date(${practiceSessions.startedAt}, 'unixepoch', 'localtime')`)
    .orderBy(sql`date(${practiceSessions.startedAt}, 'unixepoch', 'localtime')`);

  return rows.map((row) => ({
    date: row.date,
    averageTime: Math.round(row.averageTime),
  }));
}

// ============================================
// カードセット関連の関数
// ============================================

/**
 * カードセットを保存
 */
export async function saveCardSet(cardSet: Omit<NewCardSet, 'createdAt'>) {
  const result = await db
    .insert(cardSets)
    .values({
      ...cardSet,
      createdAt: new Date(),
    })
    .returning();

  return result[0];
}

/**
 * 全てのカードセットを取得
 */
export async function getAllCardSets() {
  return await db.select().from(cardSets).orderBy(cardSets.grade, cardSets.id);
}

/**
 * カードセットをIDで取得
 */
export async function getCardSetById(id: number) {
  const result = await db.select().from(cardSets).where(eq(cardSets.id, id)).limit(1);
  return result[0] || null;
}

/**
 * カードセットの進捗を開始
 */
export async function startCardSetProgress(cardSetId: number) {
  const result = await db
    .insert(cardSetProgress)
    .values({
      cardSetId,
      currentCardIndex: 0,
      completedCards: 0,
      correctCount: 0,
      incorrectCount: 0,
      startedAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return result[0];
}

/**
 * カードセットの進捗を取得
 */
export async function getCardSetProgress(cardSetId: number) {
  const result = await db
    .select()
    .from(cardSetProgress)
    .where(eq(cardSetProgress.cardSetId, cardSetId))
    .limit(1);

  return result[0] || null;
}

/**
 * カードセットの進捗を更新
 */
export async function updateCardSetProgress(
  progressId: number,
  data: {
    currentCardIndex?: number;
    completedCards?: number;
    correctCount?: number;
    incorrectCount?: number;
  }
) {
  const result = await db
    .update(cardSetProgress)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(cardSetProgress.id, progressId))
    .returning();

  return result[0];
}

/**
 * カードセットの進捗をリセット
 */
export async function resetCardSetProgress(cardSetId: number) {
  const progress = await getCardSetProgress(cardSetId);

  if (!progress) {
    // 進捗が存在しない場合は新規作成
    return await startCardSetProgress(cardSetId);
  }

  // 進捗をリセット
  const result = await db
    .update(cardSetProgress)
    .set({
      currentCardIndex: 0,
      completedCards: 0,
      correctCount: 0,
      incorrectCount: 0,
      updatedAt: new Date(),
    })
    .where(eq(cardSetProgress.id, progress.id))
    .returning();

  return result[0];
}
