import { StyleSheet, Text, View } from 'react-native';
import { Fonts } from '@/shared/config/theme';
import { useAppColors } from '@/shared/lib/use-app-colors';
import { AppButton } from '@/shared/ui/app-button';
import { useVoiceNumberRecognition } from '../model/use-voice-number-recognition';

export default function VoiceNumberRecognition() {
  const c = useAppColors();

  const {
    isListening,
    recognizedNumber,
    recognizedText,
    interimText,
    error,
    autoRestart,
    startListening,
    stopListening,
    clearResults,
    setAutoRestart,
  } = useVoiceNumberRecognition();

  return (
    <View style={[styles.container, { backgroundColor: c.surfaceSecondary }]}>
      <Text style={[styles.title, { color: c.textPrimary, fontFamily: Fonts?.rounded }]}>
        数字を話してください
      </Text>

      <View style={styles.statusArea}>
        {isListening && (
          <>
            <Text style={[styles.listeningText, { color: c.success, fontFamily: Fonts?.rounded }]}>
              🎤 聞き取り中...
            </Text>
            <Text style={[styles.hintText, { color: c.textMuted }]}>
              ゆっくり、はっきりと発音してください
            </Text>
          </>
        )}
      </View>

      {interimText && (
        <View
          style={[
            styles.interimCard,
            { backgroundColor: c.warningBg, borderColor: c.warningBorder },
          ]}
        >
          <Text style={[styles.interimLabel, { color: c.warningText }]}>認識中:</Text>
          <Text style={[styles.interimValue, { color: c.warningText, fontFamily: Fonts?.rounded }]}>
            {interimText}
          </Text>
        </View>
      )}

      {recognizedText && (
        <View
          style={[styles.resultCard, { backgroundColor: c.surface, shadowColor: c.cardShadow }]}
        >
          <Text style={[styles.resultLabel, { color: c.textMuted }]}>認識されたテキスト:</Text>
          <Text style={[styles.resultText, { color: c.textPrimary }]}>{recognizedText}</Text>
        </View>
      )}

      {recognizedNumber && (
        <View
          style={[styles.resultCard, { backgroundColor: c.surface, shadowColor: c.cardShadow }]}
        >
          <Text style={[styles.resultLabel, { color: c.textMuted }]}>抽出された数字:</Text>
          <Text style={[styles.numberText, { color: c.problemText, fontFamily: Fonts?.rounded }]}>
            {recognizedNumber}
          </Text>
        </View>
      )}

      {error && (
        <View
          style={[styles.errorCard, { backgroundColor: c.errorBg, borderColor: c.errorBorder }]}
        >
          <Text style={[styles.errorText, { color: c.errorText }]}>{error}</Text>
        </View>
      )}

      <View style={styles.buttonRow}>
        <AppButton
          title={isListening ? '停止' : '🎤 音声認識'}
          onPress={isListening ? stopListening : startListening}
          variant={isListening ? 'danger' : 'success'}
        />

        <AppButton
          title={autoRestart ? '連続OFF' : '連続ON'}
          onPress={() => {
            setAutoRestart(!autoRestart);
            if (!autoRestart && !isListening) {
              startListening();
            }
          }}
          variant={autoRestart ? 'warning' : 'ghost'}
        />

        {(recognizedNumber || recognizedText) && (
          <AppButton title="クリア" onPress={clearResults} variant="ghost" />
        )}
      </View>

      <View style={[styles.infoCard, { backgroundColor: c.infoBg, borderColor: c.infoBorder }]}>
        <Text style={[styles.infoText, { color: c.infoText }]}>
          💡 高精度認識のしくみ:{'\n'}・ 複数の認識候補から最適な数字を自動選択{'\n'}・
          短い発音（「に」「し」「く」等）も認識可能{'\n'}・ 暫定結果（オレンジ）でリアルタイム表示
          {'\n'}・ 「連続ON」で次々と数字を認識できます{'\n'}・ 確定するまで少し待つとより正確{'\n'}
          {'\n'}
          対応範囲: 0〜99999
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 28,
    letterSpacing: -0.3,
  },
  statusArea: {
    minHeight: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  listeningText: {
    fontSize: 18,
    fontWeight: '700',
  },
  hintText: {
    fontSize: 13,
    marginTop: 6,
  },
  interimCard: {
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  interimLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  interimValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  resultCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3,
  },
  resultLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resultText: {
    fontSize: 18,
    fontWeight: '600',
  },
  numberText: {
    fontSize: 48,
    fontWeight: '900',
  },
  errorCard: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    width: '100%',
    borderWidth: 1,
  },
  errorText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 28,
    gap: 12,
  },
  infoCard: {
    marginTop: 36,
    padding: 16,
    borderRadius: 14,
    width: '100%',
    borderWidth: 1,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 22,
    fontWeight: '500',
  },
});
