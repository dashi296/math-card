import { Button, StyleSheet, Text, View } from 'react-native';
import { useVoiceNumberRecognition } from '../model/use-voice-number-recognition';

export default function VoiceNumberRecognition() {
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
    <View style={styles.container}>
      <Text style={styles.title}>数字を話してください</Text>

      <View style={styles.statusContainer}>
        {isListening && (
          <>
            <Text style={styles.listeningText}>🎤 聞き取り中...</Text>
            <Text style={styles.hintText}>ゆっくり、はっきりと発音してください</Text>
          </>
        )}
      </View>

      {interimText && (
        <View style={styles.interimContainer}>
          <Text style={styles.interimLabel}>認識中:</Text>
          <Text style={styles.interimText}>{interimText}</Text>
        </View>
      )}

      {recognizedText && (
        <View style={styles.resultContainer}>
          <Text style={styles.label}>認識されたテキスト:</Text>
          <Text style={styles.text}>{recognizedText}</Text>
        </View>
      )}

      {recognizedNumber && (
        <View style={styles.resultContainer}>
          <Text style={styles.label}>抽出された数字:</Text>
          <Text style={styles.number}>{recognizedNumber}</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.error}>{error}</Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <View style={styles.button}>
          <Button
            title={isListening ? '停止' : '🎤 音声認識'}
            onPress={isListening ? stopListening : startListening}
            color={isListening ? '#f44336' : '#4CAF50'}
          />
        </View>

        <View style={styles.button}>
          <Button
            title={autoRestart ? '連続OFF' : '連続ON'}
            onPress={() => {
              setAutoRestart(!autoRestart);
              if (!autoRestart && !isListening) {
                startListening();
              }
            }}
            color={autoRestart ? '#FF9800' : '#9E9E9E'}
          />
        </View>

        {(recognizedNumber || recognizedText) && (
          <View style={styles.button}>
            <Button title="クリア" onPress={clearResults} color="#757575" />
          </View>
        )}
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          💡 高精度認識のしくみ:{'\n'}• 複数の認識候補から最適な数字を自動選択
          {'\n'}• 短い発音（「に」「し」「く」等）も認識可能{'\n'}•
          暫定結果（オレンジ）でリアルタイム表示{'\n'}• 「連続ON」で次々と数字を認識できます{'\n'}•
          確定するまで少し待つとより正確{'\n'}
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
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
  },
  statusContainer: {
    minHeight: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  listeningText: {
    fontSize: 18,
    color: '#4CAF50',
    fontWeight: '600',
  },
  hintText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  interimContainer: {
    backgroundColor: '#fff3e0',
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffb74d',
  },
  interimLabel: {
    fontSize: 12,
    color: '#f57c00',
    marginBottom: 5,
  },
  interimText: {
    fontSize: 16,
    color: '#e65100',
    fontStyle: 'italic',
  },
  resultContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginVertical: 10,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  text: {
    fontSize: 18,
    color: '#333',
  },
  number: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
    width: '100%',
  },
  error: {
    color: '#c62828',
    textAlign: 'center',
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 30,
    gap: 10,
  },
  button: {
    minWidth: 120,
  },
  infoContainer: {
    marginTop: 40,
    padding: 15,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#1976d2',
    textAlign: 'left',
    lineHeight: 20,
  },
});
