import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  SafeAreaView, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView
} from 'react-native';
import * as Speech from 'expo-speech';
import Ionicons from "@expo/vector-icons/Ionicons";

export default function VoiceTester() {
  const [inputText, setInputText] = useState("Hello! I am testing this specific voice.");
  const [voices, setVoices] = useState<Speech.Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null);

  // 1. Fetch all voices when the screen loads
  useEffect(() => {
    const fetchVoices = async () => {
      const allVoices = await Speech.getAvailableVoicesAsync();
      
      // Let's filter to only show English voices to keep the list clean
      const englishVoices = allVoices.filter(v => v.language.includes('en'));
      setVoices(englishVoices);
      
      // Set the first one as default if available
      if (englishVoices.length > 0) {
        setSelectedVoice(englishVoices[0].identifier);
      }
    };

    fetchVoices();
  }, []);

  // 2. Speak the text using the SELECTED voice identifier
  const handleListen = () => {
    Speech.stop(); 
    
    if (!inputText.trim() || !selectedVoice) return;

    Speech.speak(inputText, {
      voice: selectedVoice, // 🟢 THIS is how you change the specific voice pack!
      pitch: 1.0, 
      rate: 1.0,  
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1E1E2D' }}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, padding: 20 }}
      >
        <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold', marginBottom: 5, textAlign: 'center' }}>
          Select a Voice
        </Text>
        <Text style={{ color: 'gray', marginBottom: 20, textAlign: 'center' }}>
          Pick a voice, type a message, and listen.
        </Text>

        {/* 🟢 The Voice Selector List */}
        <View style={{ height: 200, marginBottom: 20 }}>
          <ScrollView showsVerticalScrollIndicator={true}>
            {voices.map((voice) => {
              const isSelected = selectedVoice === voice.identifier;
              return (
                <TouchableOpacity
                  key={voice.identifier}
                  onPress={() => setSelectedVoice(voice.identifier)}
                  style={{
                    padding: 12,
                    backgroundColor: isSelected ? '#EA580C' : '#2A2A40',
                    borderRadius: 10,
                    marginBottom: 8,
                    borderWidth: 1,
                    borderColor: isSelected ? '#FF8A33' : '#4A4A60',
                  }}
                >
                  <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
                    {voice.name} <Text style={{fontWeight: 'normal', color: 'rgba(255,255,255,0.6)'}}>({voice.language})</Text>
                  </Text>
                </TouchableOpacity>
              )
            })}
          </ScrollView>
        </View>

        {/* Text Input Box */}
        <View style={{
          backgroundColor: '#2A2A40',
          borderRadius: 16,
          borderWidth: 1,
          borderColor: '#4A4A60',
          padding: 16,
          marginBottom: 20,
          minHeight: 120,
        }}>
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type something here..."
            placeholderTextColor="gray"
            multiline
            style={{
              color: 'white',
              fontSize: 18,
              lineHeight: 26,
            }}
          />
        </View>

        {/* Listen Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleListen}
          style={{
            backgroundColor: '#EA580C',
            paddingVertical: 16,
            borderRadius: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="volume-high" size={24} color="white" style={{ marginRight: 10 }} />
          <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
            Listen
          </Text>
        </TouchableOpacity>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}