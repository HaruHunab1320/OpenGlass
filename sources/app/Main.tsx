import * as React from "react";
import { SafeAreaView, StyleSheet, View } from "react-native";
import { RoundButton } from "./components/RoundButton";
import { Theme } from "./components/theme";
import { useDevice } from "../modules/useDevice";
import { DeviceView } from "./DeviceView";
import { startAudio } from "../modules/openai";

export const Main = React.memo(() => {
  const [device, connectDevice] = useDevice();

  React.useEffect(() => {
    // Initialize audio context when the component mounts
    startAudio().catch((error) =>
      console.error("Failed to start audio:", error)
    );
  }, []);

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
      {device && <DeviceView device={device} />}
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
