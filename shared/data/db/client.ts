import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from './schema';

// データベースを開く
const expoDb = openDatabaseSync('math-card.db');

// Drizzle ORMのインスタンスを作成
export const db = drizzle(expoDb, { schema });

// データベーステーブルを初期化
export async function initializeDatabase() {
  try {
    // practice_sessionsテーブル作成
    await expoDb.execAsync(`
      CREATE TABLE IF NOT EXISTS practice_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        started_at INTEGER NOT NULL,
        ended_at INTEGER,
        elapsed_time INTEGER,
        is_correct INTEGER,
        user_answer INTEGER,
        created_at INTEGER NOT NULL
      );
    `);

    // card_setsテーブル作成
    await expoDb.execAsync(`
      CREATE TABLE IF NOT EXISTS card_sets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        grade INTEGER NOT NULL,
        operator TEXT NOT NULL,
        answer_min INTEGER NOT NULL,
        answer_max INTEGER NOT NULL,
        num1_min INTEGER NOT NULL,
        num1_max INTEGER NOT NULL,
        num2_min INTEGER NOT NULL,
        num2_max INTEGER NOT NULL,
        total_cards INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      );
    `);

    // card_set_progressテーブル作成
    await expoDb.execAsync(`
      CREATE TABLE IF NOT EXISTS card_set_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        card_set_id INTEGER NOT NULL REFERENCES card_sets(id),
        current_card_index INTEGER NOT NULL DEFAULT 0,
        completed_cards INTEGER NOT NULL DEFAULT 0,
        correct_count INTEGER NOT NULL DEFAULT 0,
        incorrect_count INTEGER NOT NULL DEFAULT 0,
        started_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);

    console.log('[Database] Tables initialized successfully');
  } catch (error) {
    console.error('[Database] Initialization error:', error);
    throw error;
  }
}
