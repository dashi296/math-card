/**
 * カードセット生成の詳細デバッグスクリプト
 */

import { GRADE1_CARD_SETS, generateCardsForSet } from '../utils/card-set-generator';

for (const cardSet of GRADE1_CARD_SETS) {
  console.log('='.repeat(60));
  console.log(`カードセット: ${cardSet.name}`);
  console.log(`定義: 演算子=${cardSet.operator}, 答え=${cardSet.answerMin}~${cardSet.answerMax}`);
  console.log(`      num1=${cardSet.num1Min}~${cardSet.num1Max}, num2=${cardSet.num2Min}~${cardSet.num2Max}`);
  console.log(`期待枚数: ${cardSet.totalCards}枚`);
  console.log('');

  const cards = generateCardsForSet(cardSet);
  console.log(`実際の枚数: ${cards.length}枚`);
  console.log('');

  // 最初の10枚を表示
  console.log('最初の10枚:');
  cards.slice(0, 10).forEach((card, index) => {
    console.log(`  ${index + 1}. ${card.num1} ${card.operator} ${card.num2} = ${card.answer}`);
  });

  if (cards.length > 10) {
    console.log('  ...');
  }

  console.log('');
}
