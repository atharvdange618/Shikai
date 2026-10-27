import { VideoView, useVideoPlayer } from "expo-video";
import {
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";

import { Radius, Spacing } from "@/constants/theme";

interface VideoViewerProps {
  url: string;
}

export function VideoViewer({ url }: VideoViewerProps) {
  const { width: screenWidth } = useWindowDimensions();
  const player = useVideoPlayer({ uri: url });

  return (
    <ScrollView
      style={s.contentScroll}
      contentContainerStyle={s.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={s.videoWrapper}>
        <VideoView
          player={player}
          style={{
            width: screenWidth - Spacing.lg * 2,
            height: 300,
            borderRadius: Radius.md,
          }}
          contentFit="contain"
          nativeControls
        />
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  contentScroll: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
  },

  videoWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    minHeight: 400,
  },
});
