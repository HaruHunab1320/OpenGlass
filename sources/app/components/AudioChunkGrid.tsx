import React, { useState } from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Audio } from "expo-av";

interface AudioChunkGridProps {
  chunks: Blob[];
}

export const AudioChunkGrid: React.FC<AudioChunkGridProps> = ({ chunks }) => {
  const [playing, setPlaying] = useState<number | null>(null);

  const playChunk = async (index: number) => {
    try {
      console.log(`Playing chunk ${index}`);

      // Concatenate all chunks up to and including the selected one
      const blob = new Blob(chunks.slice(0, index + 1), {
        type: chunks[0].type,
      });
      console.log(`Combined blob size: ${blob.size} bytes, type: ${blob.type}`);

      const arrayBuffer = await blob.arrayBuffer();
      console.log(`Combined ArrayBuffer size: ${arrayBuffer.byteLength} bytes`);

      const audioContext = new ((window as any).AudioContext ||
        (window as any).webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);

      setPlaying(index);
      source.onended = () => setPlaying(null);

      source.start();
    } catch (error) {
      console.error(`Error playing audio chunk ${index}:`, error);
      setPlaying(null);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Audio Chunks: {chunks.length}</Text>
      <View style={styles.grid}>
        {chunks.map((chunk, index) => {
          const cumulativeSize = chunks
            .slice(0, index + 1)
            .reduce((acc, c) => acc + c.size, 0);
          return (
            <TouchableOpacity
              key={index}
              style={styles.chunk}
              onPress={() => playChunk(index)}
            >
              <Text style={styles.icon}>{playing === index ? "▶️" : "🔊"}</Text>
              <Text style={styles.chunkSize}>
                {(cumulativeSize / 1024).toFixed(2)} KB
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 10,
    borderRadius: 10,
    marginBottom: 20,
  },
  title: {
    color: "white",
    fontSize: 18,
    marginBottom: 10,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  chunk: {
    width: 80,
    height: 80,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
    margin: 5,
    borderRadius: 10,
  },
  icon: {
    fontSize: 24,
  },
  chunkSize: {
    fontSize: 12,
    color: "#333",
    marginTop: 5,
  },
});
