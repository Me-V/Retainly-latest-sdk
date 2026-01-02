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
  heading?: string;
  content?: string | React.ReactNode;
  cancelShow?: boolean;
  primaryText?: string;
  onPrimary?: () => void;
  secondaryText?: string;
  onSecondary?: () => void;
  dismissible?: boolean;
  theme?: "light" | "dark"; // New prop for styling
}

const PopupModal: React.FC<PopupModalProps> = ({
  isVisible,
  onClose,
  heading = "Alert",
  content = "",
  cancelShow = false,
  primaryText = "Ok",
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
      {/* Replaced View with LinearGradient */}
      <LinearGradient
        // Apply the requested gradient for Dark Mode, White for Light Mode
        colors={isDark ? ["#3B0A52", "#180323"] : ["#FFFFFF", "#FFFFFF"]}
        start={{ x: 0, y: 0 }} // Top
        end={{ x: 0, y: 1 }} // Bottom (180deg)
        style={{
          borderRadius: 24,
          width: width * 0.9,
          maxWidth: 420,
          paddingHorizontal: 24,
          paddingTop: 24,
          paddingBottom: 24,
          shadowColor: "#000",
          shadowOpacity: 0.25,
          shadowOffset: { width: 0, height: 4 },
          shadowRadius: 16,
          elevation: 10,
        }}
      >
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

        {typeof content === "string" ? (
          <ScrollView
            style={{ maxHeight: 220 }}
            showsVerticalScrollIndicator={false}
          >
            <Text
              style={{
                color: isDark ? "#E5E7EB" : "#374151",
                textAlign: "center",
                lineHeight: 22,
                fontSize: 16,
              }}
            >
              {content}
            </Text>
          </ScrollView>
        ) : (
          <View style={{ maxHeight: 260 }}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {content}
            </ScrollView>
          </View>
        )}

        <View
          style={{
            width: "100%",
            marginTop: 24,
            flexDirection: "row",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          {secondaryText ? (
            <TouchableOpacity
              onPress={handleSecondary}
              activeOpacity={0.85}
              style={{
                flex: 1,
                paddingVertical: 14,
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

          <TouchableOpacity
            onPress={handlePrimary}
            activeOpacity={0.85}
            style={{
              flex: 1,
              paddingVertical: 14,
              borderRadius: 16,
              backgroundColor: "#FF8A33",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "white", fontWeight: "600", fontSize: 15 }}>
              {primaryText}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Modal>
  );
};

export default PopupModal;
