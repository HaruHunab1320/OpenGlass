import * as React from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from "react-native";

type AgentResponseViewProps = {
  agentState: { loading: boolean; answer: string | null };
  onSubmit: (text: string) => void;
};

export const AgentResponseView: React.FC<AgentResponseViewProps> = ({
  agentState,
  onSubmit,
}) => {
  return (
    <View
      style={{
        backgroundColor: "rgb(28 28 28)",
        height: 500,
        width: 600,
        borderRadius: 64,
        flexDirection: "column",
        padding: 64,
        marginBottom: 20,
      }}
    >
      <View
        style={{ flexGrow: 1, justifyContent: "center", alignItems: "center" }}
      >
        {agentState.loading && (
          <ActivityIndicator size="large" color={"white"} />
        )}
        {agentState.answer && !agentState.loading && (
          <ScrollView style={{ flexGrow: 1, flexBasis: 0 }}>
            <Text style={{ color: "white", fontSize: 32 }}>
              {agentState.answer}
            </Text>
          </ScrollView>
        )}
      </View>
      <TextInput
        style={{
          color: "white",
          height: 64,
          fontSize: 32,
          borderRadius: 16,
          backgroundColor: "rgb(48 48 48)",
          padding: 16,
        }}
        placeholder="What do you need?"
        placeholderTextColor={"#888"}
        readOnly={agentState.loading}
        onSubmitEditing={(e) => onSubmit(e.nativeEvent.text)}
      />
    </View>
  );
};
