import * as React from "react";
import { View } from "react-native";
import { Agent } from "../agent/Agent";

import { InvalidateSync } from "../utils/invalidateSync";
import { textToSpeech } from "../modules/openai";
import { usePhotos } from "../utils/usePhotos";
import { useAudio } from "../utils/useAudio";
import { PhotoGrid } from "./components/PhotoGrid";
import { AgentResponseView } from "./components/AgentResponseView";
import { AudioTranscriptionView } from "./components/AudioTranscriptionView";
import { RoundButton } from "./components/RoundButton";

type DeviceViewProps = {
  device: BluetoothRemoteGATTServer;
  agent: Agent;
  isCapturing: boolean;
  toggleAudioCapture: () => void;
};

export const DeviceView = React.memo(
  ({ device, agent, isCapturing, toggleAudioCapture }: DeviceViewProps) => {
    const [isImageCapturePaused, setIsImageCapturePaused] =
      React.useState(false);
    const [subscribed, photos] = usePhotos(device, isImageCapturePaused);
    const agentState = agent.use();
    const audioChunks = agent.getAudioChunks();

    const [transcriptionEnabled, setTranscriptionEnabled] =
      React.useState(false);
    const { transcription, resetAudio, isConnected } = useAudio(
      device.device,
      transcriptionEnabled,
      isCapturing,
      agent
    );

    console.log(
      "DeviceView render - isCapturing:",
      isCapturing,
      "isConnected:",
      isConnected
    );

    // Background processing agent
    const processedPhotos = React.useRef<Uint8Array[]>([]);
    const sync = React.useMemo(() => {
      let processed = 0;
      return new InvalidateSync(async () => {
        if (processedPhotos.current.length > processed) {
          let unprocessed = processedPhotos.current.slice(processed);
          processed = processedPhotos.current.length;
          await agent.addPhoto(unprocessed);
        }
      });
    }, []);

    React.useEffect(() => {
      processedPhotos.current = photos;
      sync.invalidate();
    }, [photos]);

    React.useEffect(() => {
      if (agentState.answer) {
        textToSpeech(agentState.answer);
      }
    }, [agentState.answer]);

    const toggleImageCapture = () => {
      setIsImageCapturePaused(!isImageCapturePaused);
    };

    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <PhotoGrid photos={photos} />
        <AgentResponseView
          agentState={agentState as { loading: boolean; answer: string | null }}
          onSubmit={(text) => agent.answer(text)}
        />
        <AudioTranscriptionView
          transcription={transcription}
          transcriptionEnabled={transcriptionEnabled}
          setTranscriptionEnabled={setTranscriptionEnabled}
          isCollecting={isCapturing}
          audioChunks={audioChunks}
          isConnected={isConnected}
        />
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            width: "100%",
            paddingHorizontal: 20,
          }}
        >
          <RoundButton
            title={isCapturing ? "Stop Audio Capture" : "Start Audio Capture"}
            action={toggleAudioCapture}
          />
          <RoundButton
            title={
              isImageCapturePaused
                ? "Resume Image Capture"
                : "Pause Image Capture"
            }
            action={toggleImageCapture}
          />
        </View>
      </View>
    );
  }
);
