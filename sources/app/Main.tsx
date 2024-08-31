import * as React from "react";
import { SafeAreaView, StyleSheet, View } from "react-native";
import { RoundButton } from "./components/RoundButton";
import { Theme } from "./components/theme";
import { useDevice } from "../modules/useDevice";
import { DeviceView } from "./DeviceView";
import { startAudio, stopAudio } from "../modules/openai";
import { Agent } from "../agent/Agent";

export const Main = React.memo(() => {
  const [device, connectDevice] = useDevice();
  const [agent] = React.useState(() => new Agent());
  const [isCapturing, setIsCapturing] = React.useState(false);

  const toggleAudioCapture = React.useCallback(() => {
    if (isCapturing) {
      stopAudio();
      setIsCapturing(false);
    } else {
      startAudio((chunk) => {
        console.log("Audio chunk received", chunk.size);
        agent.addAudioChunk(chunk);
      }).catch((error) => console.error("Failed to start audio:", error));
      setIsCapturing(true);
    }
  }, [isCapturing, agent]);

  return (
    <SafeAreaView style={styles.container}>
      {!device && (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            alignSelf: "center",
          }}
        >
          <RoundButton title="Connect to the device" action={connectDevice} />
        </View>
      )}
      {device && (
        <>
          <DeviceView
            device={device}
            agent={agent}
            isCapturing={false}
            toggleAudioCapture={function (): void {
              throw new Error("Function not implemented.");
            }}
          />
          <RoundButton
            title={isCapturing ? "Stop Audio Capture" : "Start Audio Capture"}
            action={toggleAudioCapture}
          />
        </>
      )}
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.background,
    alignItems: "stretch",
    justifyContent: "center",
  },
});
