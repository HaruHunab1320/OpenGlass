import * as React from "react";
import { transcribeAudio } from "../modules/openai";
import { int16ArrayToWav, mulawToLinear } from "../utils/audioUtils";
import {
  SERVICE_UUID,
  AUDIO_DATA_UUID,
  AUDIO_CODEC_UUID,
} from "../utils/bluetoothUUIDs";
import { Agent } from "../agent/Agent";

export function useAudio(
  device: BluetoothDevice | null,
  transcriptionEnabled: boolean,
  isCollecting: boolean,
  agent: Agent
) {
  const [audioBuffer, setAudioBuffer] = React.useState<Int16Array>(
    new Int16Array()
  );
  const [transcription, setTranscription] = React.useState<string>("");
  const [isConnected, setIsConnected] = React.useState(false);
  const audioCharacteristicRef =
    React.useRef<BluetoothRemoteGATTCharacteristic | null>(null);
  const codecCharacteristicRef =
    React.useRef<BluetoothRemoteGATTCharacteristic | null>(null);

  const handleAudioData = React.useCallback(
    (event: Event) => {
      if (!isCollecting) return;
      const value = (event.target as BluetoothRemoteGATTCharacteristic).value;
      if (value) {
        const int8Array = new Int8Array(value.buffer);
        const int16Array = new Int16Array(int8Array.length);
        for (let i = 0; i < int8Array.length; i++) {
          int16Array[i] = mulawToLinear(int8Array[i]);
        }
        const wavBuffer = int16ArrayToWav(int16Array);
        const blob = new Blob([wavBuffer], { type: "audio/wav" });
        console.log(
          `Created audio chunk: size ${blob.size} bytes, type ${blob.type}`
        );
        agent.addAudioChunk(blob);
        setAudioBuffer((prevBuffer) => {
          const newBuffer = new Int16Array(
            prevBuffer.length + int16Array.length
          );
          newBuffer.set(prevBuffer);
          newBuffer.set(int16Array, prevBuffer.length);
          return newBuffer;
        });
      }
    },
    [isCollecting, agent]
  );
  const connectToDevice = React.useCallback(async () => {
    if (!device) {
      console.error("No device available");
      return false;
    }

    try {
      console.log("Attempting to connect to the device...");
      const server = await device.gatt?.connect();
      if (!server) {
        throw new Error("Failed to connect to GATT server");
      }
      console.log("Connected to GATT server");
      setIsConnected(true);
      return true;
    } catch (error) {
      console.error("Failed to connect to device:", error);
      setIsConnected(false);
      return false;
    }
  }, [device]);

  const setupAudioCharacteristics = React.useCallback(async () => {
    if (!device || !device.gatt?.connected) {
      console.error("Device not connected");
      return;
    }

    try {
      console.log("Attempting to get audio service with UUID:", SERVICE_UUID);
      const service = await device.gatt.getPrimaryService(SERVICE_UUID);
      console.log("Audio service obtained successfully");

      console.log("Getting all characteristics");
      const characteristics = await service.getCharacteristics();
      console.log(
        "All characteristics:",
        characteristics.map((c) => c.uuid)
      );

      console.log("Finding data characteristic with UUID:", AUDIO_DATA_UUID);
      const dataCharacteristic = characteristics.find(
        (c) => c.uuid === AUDIO_DATA_UUID
      );
      if (!dataCharacteristic) {
        throw new Error(
          `Audio data characteristic not found. Available characteristics: ${characteristics
            .map((c) => c.uuid)
            .join(", ")}`
        );
      }
      console.log("Data characteristic found");

      console.log("Starting notifications for data characteristic");
      await dataCharacteristic.startNotifications();
      dataCharacteristic.addEventListener(
        "characteristicvaluechanged",
        handleAudioData
      );
      audioCharacteristicRef.current = dataCharacteristic;
      console.log("Notifications started for data characteristic");

      console.log("Finding codec characteristic with UUID:", AUDIO_CODEC_UUID);
      const codecCharacteristic = characteristics.find(
        (c) => c.uuid === AUDIO_CODEC_UUID
      );
      if (!codecCharacteristic) {
        throw new Error(
          `Audio codec characteristic not found. Available characteristics: ${characteristics
            .map((c) => c.uuid)
            .join(", ")}`
        );
      }
      console.log("Codec characteristic found");

      codecCharacteristicRef.current = codecCharacteristic;

      console.log("Setting codec to mu-law");
      await codecCharacteristic.writeValue(new Uint8Array([0x00]));
      console.log("Codec set to mu-law");

      console.log("Audio characteristics setup complete");
    } catch (error) {
      console.error("Failed to setup audio characteristics:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
    }
  }, [device, handleAudioData]);

  const startAudioCollection = React.useCallback(async () => {
    if (!isConnected) {
      const connected = await connectToDevice();
      if (!connected) return;
    }
    await setupAudioCharacteristics();
  }, [isConnected, connectToDevice, setupAudioCharacteristics]);

  React.useEffect(() => {
    console.log("isCollecting changed:", isCollecting);
    if (isCollecting && device && isConnected) {
      console.log("Starting audio collection");
      startAudioCollection();
    } else if (!isCollecting && audioCharacteristicRef.current) {
      console.log("Stopping audio notifications");
      audioCharacteristicRef.current
        .stopNotifications()
        .then(() => console.log("Audio notifications stopped"))
        .catch((error) =>
          console.error("Error stopping audio notifications:", error)
        );
    }

    return () => {
      if (audioCharacteristicRef.current) {
        console.log("Cleaning up audio notifications");
        audioCharacteristicRef.current
          .stopNotifications()
          .then(() => console.log("Audio notifications cleaned up"))
          .catch((error) =>
            console.error("Error cleaning up audio notifications:", error)
          );
        audioCharacteristicRef.current.removeEventListener(
          "characteristicvaluechanged",
          handleAudioData
        );
      }
    };
  }, [
    device,
    isCollecting,
    isConnected,
    startAudioCollection,
    handleAudioData,
  ]);

  React.useEffect(() => {
    const processAudio = async () => {
      if (audioBuffer.length > 8000 && transcriptionEnabled) {
        const wavBuffer = int16ArrayToWav(audioBuffer);
        try {
          const blob = new Blob([wavBuffer], { type: "audio/wav" });
          const result = await transcribeAudio(blob);
          setTranscription((prev) => prev + " " + result);
        } catch (error) {
          console.error("Transcription failed:", error);
        }
        setAudioBuffer(new Int16Array());
      }
    };

    const timer = setInterval(processAudio, 1000);

    return () => clearInterval(timer);
  }, [audioBuffer, transcriptionEnabled]);

  const resetAudio = React.useCallback(() => {
    setAudioBuffer(new Int16Array());
    setTranscription("");
  }, []);

  return { transcription, resetAudio, startAudioCollection, isConnected };
}
