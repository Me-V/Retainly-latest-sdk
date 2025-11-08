// components/Popup-modal.tsx
import React from "react";
import {
  Dimensions,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import Modal from "react-native-modal";

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
  dismissible?: boolean; // NEW: default true
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
  dismissible = true, // default
}) => {
  const { width, height } = Dimensions.get("window");
  const handlePrimary = () => (onPrimary ? onPrimary() : onClose());
  const handleSecondary = () => (onSecondary ? onSecondary() : onClose());

  return (
    <Modal
      isVisible={isVisible}
      animationIn="zoomIn"
      animationOut="zoomOut"
      animationInTiming={200}
      animationOutTiming={180}
      backdropOpacity={0.5}
      backdropColor="#000"
      useNativeDriver
      useNativeDriverForBackdrop
      {...(dismissible
        ? { onBackdropPress: onClose, onBackButtonPress: onClose }
        : { onBackdropPress: undefined, onBackButtonPress: undefined })}
      avoidKeyboard
      statusBarTranslucent={false}
      coverScreen={true}
      deviceWidth={Dimensions.get("window").width}
      deviceHeight={Dimensions.get("window").height}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        margin: 0,
        justifyContent: "center",
        alignItems: "center",
      }}
      backdropTransitionOutTiming={0}
    >
      <View
        className="bg-white rounded-2xl"
        style={{
          width: width * 0.9,
          maxWidth: 420,
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 16,
          shadowColor: "#000",
          shadowOpacity: 0.15,
          shadowOffset: { width: 0, height: 4 },
          shadowRadius: 12,
          elevation: 6,
        }}
      >
        <Text
          style={{
            fontSize: 20,
            fontWeight: "700",
            color: "#F98455",
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
                color: "#374151",
                textAlign: "center",
                lineHeight: 20,
                fontSize: 14,
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
            marginTop: 16,
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "flex-end",
          }}
        >
          {secondaryText ? (
            <TouchableOpacity
              onPress={handleSecondary}
              activeOpacity={0.85}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#F98455",
                marginRight: 8,
                marginBottom: 8,
                minHeight: 44,
                justifyContent: "center",
              }}
              accessibilityRole="button"
              accessibilityLabel={secondaryText}
            >
              <Text style={{ color: "#F98455", fontWeight: "600" }}>
                {secondaryText}
              </Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            onPress={handlePrimary}
            activeOpacity={0.85}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 12,
              backgroundColor: "#F98455",
              marginBottom: 8,
              minHeight: 44,
              justifyContent: "center",
            }}
            accessibilityRole="button"
            accessibilityLabel={primaryText}
          >
            <Text style={{ color: "white", fontWeight: "600" }}>
              {primaryText}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default PopupModal;
