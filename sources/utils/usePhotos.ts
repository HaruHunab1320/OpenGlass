import * as React from "react";
import { rotateImage } from "../modules/imaging";
import {
  SERVICE_UUID,
  PHOTO_DATA_UUID,
  PHOTO_CONTROL_UUID,
} from "../utils/bluetoothUUIDs";

export function usePhotos(
  device: BluetoothRemoteGATTServer,
  isPaused: boolean
) {
  const [photos, setPhotos] = React.useState<Uint8Array[]>([]);
  const [subscribed, setSubscribed] = React.useState<boolean>(false);
  const photoControlCharacteristicRef =
    React.useRef<BluetoothRemoteGATTCharacteristic | null>(null);

  React.useEffect(() => {
    let previousChunk = -1;
    let buffer: Uint8Array = new Uint8Array(0);

    function onChunk(id: number | null, data: Uint8Array) {
      if (previousChunk === -1) {
        if (id === null) return;
        if (id === 0) {
          previousChunk = 0;
          buffer = new Uint8Array(0);
        } else {
          return;
        }
      } else {
        if (id === null) {
          console.log("Photo received", buffer);
          rotateImage(buffer, "270").then((rotated) => {
            console.log("Rotated photo", rotated);
            setPhotos((p) => [...p, rotated]);
          });
          previousChunk = -1;
          return;
        } else {
          if (id !== previousChunk + 1) {
            previousChunk = -1;
            console.error("Invalid chunk", id, previousChunk);
            return;
          }
          previousChunk = id;
        }
      }

      buffer = new Uint8Array([...buffer, ...data]);
    }

    async function setupPhotoCharacteristic() {
      try {
        const service = await device.getPrimaryService(
          SERVICE_UUID.toLowerCase()
        );
        const photoCharacteristic = await service.getCharacteristic(
          PHOTO_DATA_UUID
        );
        const photoControlCharacteristic = await service.getCharacteristic(
          PHOTO_CONTROL_UUID
        );
        photoControlCharacteristicRef.current = photoControlCharacteristic;

        const handleNotifications = (e: Event) => {
          if (!isPaused) {
            let value = (e.target as BluetoothRemoteGATTCharacteristic).value!;
            let array = new Uint8Array(value.buffer);
            if (array[0] == 0xff && array[1] == 0xff) {
              onChunk(null, new Uint8Array());
            } else {
              let packetId = array[0] + (array[1] << 8);
              let packet = array.slice(2);
              onChunk(packetId, packet);
            }
          }
        };

        await photoCharacteristic.startNotifications();
        photoCharacteristic.addEventListener(
          "characteristicvaluechanged",
          handleNotifications
        );
        setSubscribed(true);

        return () => {
          photoCharacteristic.removeEventListener(
            "characteristicvaluechanged",
            handleNotifications
          );
        };
      } catch (error) {
        console.error("Failed to setup photo characteristic:", error);
        setSubscribed(false);
      }
    }

    const cleanup = setupPhotoCharacteristic();
    return () => {
      cleanup.then((cleanupFn) => {
        if (cleanupFn) cleanupFn();
      });
    };
  }, [device, isPaused]);

  // Effect to handle pausing and resuming photo capture
  React.useEffect(() => {
    const toggleCapture = async () => {
      if (photoControlCharacteristicRef.current) {
        try {
          if (isPaused) {
            await photoControlCharacteristicRef.current.writeValue(
              new Uint8Array([0x00])
            ); // Stop capture
          } else {
            await photoControlCharacteristicRef.current.writeValue(
              new Uint8Array([0x05])
            ); // Start capture every 5s
          }
        } catch (error) {
          console.error("Error toggling photo capture:", error);
        }
      }
    };
    toggleCapture();
  }, [isPaused]);

  return [subscribed, photos] as const;
}
