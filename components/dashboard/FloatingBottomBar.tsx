import React from "react";
import { Text, TouchableOpacity } from "react-native";
import { Ionicons, MaterialIcons, Fontisto } from "@expo/vector-icons";

const FloatingBottomBar = () => {
  return (
    <>
      <TouchableOpacity className="items-center justify-center">
        <Ionicons name="home" size={24} color="#F59E51" />
        <Text className="text-[10px] text-white mt-1">Home</Text>
      </TouchableOpacity>

      <TouchableOpacity className="items-center justify-center opacity-60">
        <MaterialIcons name="my-library-books" size={24} color="white" />
        <Text className="text-[10px] text-white mt-1">Subjects</Text>
      </TouchableOpacity>

      <TouchableOpacity className="items-center justify-center opacity-60">
        <Fontisto name="heartbeat-alt" size={24} color="white" />
        <Text className="text-[10px] text-white mt-1">Progress</Text>
      </TouchableOpacity>
    </>
  );
};

export default FloatingBottomBar;
