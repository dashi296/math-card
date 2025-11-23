/**
 * カードセット生成ロジックの検証スクリプト
 * 各カードセットが期待通りの枚数のカードを生成するか確認します
 */

import { GRADE1_CARD_SETS, validateCardSet } from '../utils/card-set-generator';

console.log('='.repeat(60));
console.log('カードセット生成ロジックの検証');
console.log('='.repeat(60));
console.log('');

let allValid = true;

for (const cardSet of GRADE1_CARD_SETS) {
  const result = validateCardSet(cardSet);
  console.log(result.message);

  if (!result.isValid) {
    allValid = false;
    console.log(`  期待: ${result.expectedCards}枚`);
    console.log(`  実際: ${result.actualCards}枚`);
    console.log('');
  }
}

console.log('');
console.log('='.repeat(60));

if (allValid) {
  console.log('✓ 全てのカードセットが正しく生成されました');
  process.exit(0);
} else {
  console.log('✗ 一部のカードセットで枚数が一致しません');
  process.exit(1);
}
