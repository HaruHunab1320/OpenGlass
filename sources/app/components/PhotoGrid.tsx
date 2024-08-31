import * as React from "react";
import { View, Image, ScrollView } from "react-native";
import { toBase64Image } from "../../utils/base64";

type PhotoGridProps = {
  photos: Uint8Array[];
};

export const PhotoGrid: React.FC<PhotoGridProps> = ({ photos }) => {
  return (
    <View
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <ScrollView>
        <View
          style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 20 }}
        >
          {photos.map((photo, index) => (
            <Image
              key={index}
              style={{ width: 100, height: 100, margin: 5 }}
              source={{ uri: toBase64Image(photo) }}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
};
