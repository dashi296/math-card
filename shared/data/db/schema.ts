import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// 演算子の型定義
export type OperatorType = '+' | '-' | '*' | '/';

// 練習セッションの記録テーブル
export const practiceSessions = sqliteTable('practice_sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  startedAt: integer('started_at', { mode: 'timestamp' }).notNull(),
  endedAt: integer('ended_at', { mode: 'timestamp' }),
  elapsedTime: integer('elapsed_time'), // ミリ秒
  isCorrect: integer('is_correct', { mode: 'boolean' }),
  userAnswer: integer('user_answer'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

// カードセットの定義テーブル
export const cardSets = sqliteTable('card_sets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(), // 例: "小学1年生のたしざん(1)"
  grade: integer('grade').notNull(), // 学年: 1, 2, 3...
  operator: text('operator').notNull().$type<OperatorType>(), // 演算子: +, -, *, /
  answerMin: integer('answer_min').notNull(), // 答えの最小値
  answerMax: integer('answer_max').notNull(), // 答えの最大値
  num1Min: integer('num1_min').notNull(), // 最初の数の最小値
  num1Max: integer('num1_max').notNull(), // 最初の数の最大値
  num2Min: integer('num2_min').notNull(), // 2番目の数の最小値
  num2Max: integer('num2_max').notNull(), // 2番目の数の最大値
  totalCards: integer('total_cards').notNull(), // カードの総枚数
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

// カードセットの進捗管理テーブル
export const cardSetProgress = sqliteTable('card_set_progress', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  cardSetId: integer('card_set_id')
    .notNull()
    .references(() => cardSets.id),
  currentCardIndex: integer('current_card_index').notNull().default(0), // 現在のカード番号（0から開始）
  completedCards: integer('completed_cards').notNull().default(0), // 完了したカード数
  correctCount: integer('correct_count').notNull().default(0), // 正解数
  incorrectCount: integer('incorrect_count').notNull().default(0), // 不正解数
  startedAt: integer('started_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

// 型定義
export type PracticeSession = typeof practiceSessions.$inferSelect;
export type NewPracticeSession = typeof practiceSessions.$inferInsert;
export type CardSet = typeof cardSets.$inferSelect;
export type NewCardSet = typeof cardSets.$inferInsert;
export type CardSetProgress = typeof cardSetProgress.$inferSelect;
export type NewCardSetProgress = typeof cardSetProgress.$inferInsert;
