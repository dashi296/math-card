import { StyleSheet, Text, View } from 'react-native';
import { Fonts } from '@/shared/config/theme';
import { useAppColors } from '@/shared/lib/use-app-colors';

interface AnswerTimeChartProps {
  answerTimes: number[];
  isCorrectResults: boolean[];
}

export default function AnswerTimeChart({ answerTimes, isCorrectResults }: AnswerTimeChartProps) {
  const c = useAppColors();

  if (answerTimes.length === 0) return null;

  const timesInSeconds = answerTimes.map((t) => t / 1000);
  const maxTime = Math.max(...timesInSeconds, 1);
  const averageTime = timesInSeconds.reduce((sum, t) => sum + t, 0) / timesInSeconds.length;
  const averageRatio = averageTime / maxTime;

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: c.textPrimary, fontFamily: Fonts?.rounded }]}>
        回答時間
      </Text>
      <Text style={[styles.averageLabel, { color: c.textSecondary }]}>
        平均: {averageTime.toFixed(1)}秒
      </Text>

      <View style={styles.chartArea}>
        {/* Y軸ラベル */}
        <View style={styles.yAxis}>
          <Text style={[styles.yLabel, { color: c.textMuted }]}>{maxTime.toFixed(0)}s</Text>
          <Text style={[styles.yLabel, { color: c.textMuted }]}>0s</Text>
        </View>

        {/* 棒グラフエリア */}
        <View style={styles.barsContainer}>
          {/* 平均ライン */}
          <View
            style={[
              styles.averageLine,
              {
                borderColor: c.warning,
                bottom: `${averageRatio * 100}%`,
              },
            ]}
          />

          {/* 棒グラフ */}
          <View style={styles.barsRow}>
            {timesInSeconds.map((time, index) => {
              const ratio = time / maxTime;
              const barColor = isCorrectResults[index] ? c.success : c.error;
              const key = `card-${index + 1}-${Math.round(time * 100)}`;

              return (
                <View key={key} style={styles.barWrapper}>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.bar,
                        {
                          backgroundColor: barColor,
                          height: `${Math.max(ratio * 100, 2)}%`,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.xLabel, { color: c.textMuted }]}>{index + 1}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* 凡例 */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: c.success }]} />
          <Text style={[styles.legendText, { color: c.textSecondary }]}>正解</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: c.error }]} />
          <Text style={[styles.legendText, { color: c.textSecondary }]}>不正解</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDash, { borderColor: c.warning }]} />
          <Text style={[styles.legendText, { color: c.textSecondary }]}>平均</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  averageLabel: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
  },
  chartArea: {
    flexDirection: 'row',
    height: 150,
  },
  yAxis: {
    width: 30,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 4,
    paddingBottom: 18,
  },
  yLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  barsContainer: {
    flex: 1,
    position: 'relative',
    paddingBottom: 18,
  },
  averageLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: 2,
    borderStyle: 'dashed',
    zIndex: 1,
  },
  barsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
  },
  barTrack: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: '70%',
    minWidth: 6,
    maxWidth: 28,
    borderRadius: 3,
  },
  xLabel: {
    fontSize: 9,
    fontWeight: '500',
    marginTop: 4,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendDash: {
    width: 12,
    height: 0,
    borderTopWidth: 2,
    borderStyle: 'dashed',
  },
  legendText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
