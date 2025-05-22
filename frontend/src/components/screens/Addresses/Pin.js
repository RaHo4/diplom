// PinComponent.tsx
import React, { useEffect } from "react";
import { View, TouchableOpacity } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolateColor,
  runOnJS,
} from "react-native-reanimated";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const PinComponent = ({ pin, onLongPress, scale }) => {
  const backgroundColorAnim = useSharedValue(0); // начальное значение

  const getIconFromStatus = () => {
    if (pin.status === "normal") return "sprinkler-fire";
    if (pin.status === "alert") return "fire-alert";
    return "skull-crossbones";
  };

  // Анимированный стиль
  const animatedStyle = useAnimatedStyle(() => {
    const alertColor = interpolateColor(
      backgroundColorAnim.value,
      [0, 1],
      ["white", "red"]
    );

    const nonAlertColor = interpolateColor(
      backgroundColorAnim.value,
      [0, 1],
      ["green", "green"]
    );

    const disabledColor = interpolateColor(
      backgroundColorAnim.value,
      [0, 1],
      ["grey", "grey"]
    );

    return {
      transform: [{ scaleX: 1 / scale.value }, { scaleY: 1 / scale.value }],
      backgroundColor:
        pin.status === "alert"
          ? alertColor
          : pin.status === "normal"
          ? nonAlertColor
          : disabledColor,
    };
  });

  // Запуск анимации при изменении статуса
  useEffect(() => {
    if (pin.status === "alert") {
      backgroundColorAnim.value = withRepeat(
        withTiming(1, { duration: 700 }),
        -1,
        true
      );
    } else {
      backgroundColorAnim.value = 0;
    }

    return () => {
      backgroundColorAnim.value = 0; // Очистка
    };
  }, [pin.status]);

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          position: "absolute",
          zIndex: pin.status == "alert" ? 1000 : 100,
          top: pin.coordinates.y,
          left: pin.coordinates.x,
          display: pin.isDeleted ? "none" : "",
          borderRadius: 50,
        },
      ]}
    >
      <TouchableOpacity
        onLongPress={() => {
          console.log("LONG PRESS PIN");
          onLongPress(pin);
        }}
        activeOpacity={0.7}
      >
        <View style={{ padding: 6 }}>
          <Icon name={getIconFromStatus()} size={16} color="white" />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default PinComponent;
