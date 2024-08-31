import * as React from "react";
import { View, Text, ScrollView } from "react-native";
import { RoundButton } from "./RoundButton";
import { AudioChunkGrid } from "./AudioChunkGrid";

type AudioTranscriptionViewProps = {
  transcription: string;
  transcriptionEnabled: boolean;
  setTranscriptionEnabled: (enabled: boolean) => void;
  isCollecting: boolean;
  audioChunks: any[]; // Replace 'any' with the correct type
  isConnected: boolean;
};

export const AudioTranscriptionView: React.FC<AudioTranscriptionViewProps> = ({
  transcription,
  transcriptionEnabled,
  setTranscriptionEnabled,
  isCollecting,
  audioChunks,
  isConnected,
}) => {
  console.log(
    "AudioTranscriptionView render - isCollecting:",
    isCollecting,
    "isConnected:",
    isConnected
  );
  return (
    <View>
      <View style={{ marginBottom: 20 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <Text style={{ color: "white", fontSize: 24 }}>Audio Chunks:</Text>
          <RoundButton
            title={
              transcriptionEnabled
                ? "Disable Transcription"
                : "Enable Transcription"
            }
            action={() =>
              Promise.resolve(setTranscriptionEnabled(!transcriptionEnabled))
            }
            size="small"
          />
        </View>
        <AudioChunkGrid chunks={audioChunks} />
      </View>
      <View
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.1)",
          padding: 20,
          borderRadius: 16,
          width: 600,
        }}
      >
        <Text style={{ color: "white", fontSize: 24, marginBottom: 10 }}>
          Transcription:
        </Text>
        <Text style={{ color: "white", fontSize: 18 }}>{transcription}</Text>
      </View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "flex-end",
          marginTop: 10,
        }}
      >
        <Text style={{ color: isConnected ? "green" : "red", marginLeft: 10 }}>
          {isConnected ? "Connected" : "Disconnected"}
        </Text>
      </View>
    </View>
  );
};
