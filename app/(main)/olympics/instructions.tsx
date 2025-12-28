import React from "react";
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons"; // Make sure you have this or use simple text

const InstructionScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Extract data passed from the List Screen
  const { quizId, title, description, duration, attempts } = params;

  const handleStart = () => {
    // Navigate to the actual Quiz Screen (This is where the API call & Timer start)
    router.replace({
      pathname: "/(main)/olympics/questions",
      params: { quizId: quizId } 
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 p-6">
        
        {/* Quiz Title Header */}
        <View className="mb-8 border-b border-gray-200 pb-4">
          <Text className="text-3xl font-bold text-slate-900 mb-2">
            {title}
          </Text>
          <Text className="text-gray-500 text-base">
            {description}
          </Text>
        </View>

        {/* Key Details Card */}
        <View className="flex-row justify-between bg-blue-50 p-4 rounded-xl mb-8 border border-blue-100">
          <View className="items-center flex-1">
            <Text className="text-2xl">⏳</Text>
            <Text className="font-bold text-slate-700 mt-1">{duration}</Text>
            <Text className="text-xs text-gray-500">Duration</Text>
          </View>
          <View className="w-[1px] bg-blue-200" />
          <View className="items-center flex-1">
            <Text className="text-2xl">Hz</Text>
            <Text className="font-bold text-slate-700 mt-1">{attempts}</Text>
            <Text className="text-xs text-gray-500">Attempts</Text>
          </View>
        </View>

        {/* Instructions List */}
        <Text className="text-xl font-semibold text-slate-800 mb-4">
          Instructions
        </Text>
        
        <View className="space-y-4">
          <InstructionItem 
            icon="time-outline" 
            text="The timer starts immediately after you click 'Start Quiz'. It cannot be paused." 
          />
          <InstructionItem 
            icon="wifi-outline" 
            text="Ensure you have a stable internet connection." 
          />
          <InstructionItem 
            icon="alert-circle-outline" 
            text="Do not close the app. If you exit, the timer will keep running." 
          />
          <InstructionItem 
            icon="checkmark-done-outline" 
            text="Click 'Save & Submit' on the last question to finish." 
          />
        </View>

      </ScrollView>

      {/* Footer Button */}
      <View className="p-4 border-t border-gray-100">
        <TouchableOpacity 
          onPress={handleStart}
          className="bg-blue-600 py-4 rounded-xl items-center shadow-md"
        >
          <Text className="text-white font-bold text-lg">Start Quiz</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// Helper component for bullet points
const InstructionItem = ({ icon, text }: { icon: any, text: string }) => (
  <View className="flex-row items-start mb-4">
    <View className="mr-3 mt-1">
      {/* If you don't have icons, just use a bullet point: <Text>•</Text> */}
      <Ionicons name={icon} size={20} color="#4B5563" /> 
    </View>
    <Text className="text-gray-600 text-base flex-1 leading-6">{text}</Text>
  </View>
);

export default InstructionScreen;