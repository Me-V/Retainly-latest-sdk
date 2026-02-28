import React from "react";
import {
  Dimensions,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import Modal from "react-native-modal";
import { LinearGradient } from "expo-linear-gradient";

interface PopupModalProps {
  isVisible: boolean;
  onClose: () => void;
  icon?: React.ReactNode; // 🟢 NEW: Allow passing an icon/image
  heading?: string; // 🟢 Made optional (removed default "Alert")
  content?: string | React.ReactNode;
  cancelShow?: boolean;
  primaryText?: string;
  onPrimary?: () => void;
  secondaryText?: string;
  onSecondary?: () => void;
  dismissible?: boolean;
  theme?: "light" | "dark";
}

const PopupModal: React.FC<PopupModalProps> = ({
  isVisible,
  onClose,
  icon,
  heading,
  content = "",
  cancelShow = false,
  primaryText = "OK",
  onPrimary,
  secondaryText,
  onSecondary,
  dismissible = true,
  theme = "light",
}) => {
  const { width } = Dimensions.get("window");
  const isDark = theme === "dark";

  const handlePrimary = () => (onPrimary ? onPrimary() : onClose());
  const handleSecondary = () => (onSecondary ? onSecondary() : onClose());

  return (
    <Modal
      isVisible={isVisible}
      animationIn="zoomIn"
      animationOut="zoomOut"
      animationInTiming={200}
      animationOutTiming={180}
      backdropOpacity={0.6}
      backdropColor="#000"
      useNativeDriver
      useNativeDriverForBackdrop
      {...(dismissible
        ? { onBackdropPress: onClose, onBackButtonPress: onClose }
        : { onBackdropPress: undefined, onBackButtonPress: undefined })}
      avoidKeyboard
      statusBarTranslucent={false}
      coverScreen={true}
      style={{
        margin: 0,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <LinearGradient
        // 🟢 MATCHES SCREENSHOT: Deep dark purple gradient
        colors={isDark ? ["#2A0845", "#160324"] : ["#FFFFFF", "#FFFFFF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          borderRadius: 24,
          width: width * 0.85,
          maxWidth: 360,
          paddingHorizontal: 24,
          paddingTop: 32,
          paddingBottom: 24,
          shadowColor: "#000",
          shadowOpacity: 0.3,
          shadowOffset: { width: 0, height: 10 },
          shadowRadius: 20,
          elevation: 10,
          alignItems: "center", // Center everything vertically
        }}
      >
        {/* 🟢 Render Icon if provided */}
        {icon && <View style={{ marginBottom: 16 }}>{icon}</View>}

        {/* 🟢 Render Heading ONLY if provided */}
        {heading ? (
          <Text
            style={{
              fontSize: 22,
              fontWeight: "bold",
              color: isDark ? "white" : "#F98455",
              textAlign: "center",
              marginBottom: 12,
            }}
          >
            {heading}
          </Text>
        ) : null}

        {/* Render Content */}
        {typeof content === "string" ? (
          <Text
            style={{
              color: isDark ? "white" : "#374151",
              textAlign: "center",
              lineHeight: 26,
              fontSize: 18,
              fontWeight: "600", // 🟢 Bolder text matching the screenshot
              marginBottom: 24,
            }}
          >
            {content}
          </Text>
        ) : (
          <View style={{ maxHeight: 260, marginBottom: 24, width: "100%" }}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {content}
            </ScrollView>
          </View>
        )}

        {/* Buttons Container */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            gap: 12,
            width: "100%",
          }}
        >
          {secondaryText ? (
            <TouchableOpacity
              onPress={handleSecondary}
              activeOpacity={0.85}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 16,
                backgroundColor: isDark ? "#804A8A" : "transparent",
                borderWidth: isDark ? 0 : 1,
                borderColor: isDark ? "transparent" : "#F98455",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  color: isDark ? "white" : "#F98455",
                  fontWeight: "600",
                  fontSize: 15,
                }}
              >
                {secondaryText}
              </Text>
            </TouchableOpacity>
          ) : null}

          {/* 🟢 Primary Button (Stops stretching if it's the only button) */}
          <TouchableOpacity
            onPress={handlePrimary}
            activeOpacity={0.85}
            style={{
              flex: secondaryText ? 1 : undefined,
              paddingVertical: 12,
              paddingHorizontal: secondaryText ? 0 : 36, // Add side padding for standalone pill
              borderRadius: 14,
              backgroundColor: "#FF8A33",
              alignItems: "center",
              justifyContent: "center",
              minWidth: secondaryText ? undefined : 120,
            }}
          >
            <Text
              style={{
                color: "white",
                fontWeight: "bold",
                fontSize: 16,
                textTransform: "uppercase",
              }}
            >
              {primaryText}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Modal>
  );
};

export default PopupModal;
