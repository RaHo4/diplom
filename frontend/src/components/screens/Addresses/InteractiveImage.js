// components/InteractiveImageMap.tsx

import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import {
  View,
  // Image,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from "react-native";
import Animated, { runOnJS, useSharedValue } from "react-native-reanimated";
import {
  Gesture,
  GestureDetector,
  ScrollView as GestureScrollView,
  ScrollView,
  TextInput,
} from "react-native-gesture-handler";
import PinComponent from "./Pin";
import { Zoomable } from "@likashefqet/react-native-image-zoom";
import Icon from "react-native-vector-icons/MaterialIcons";
import { Image } from "expo-image";

const InteractiveImageMap = ({
  imageUrl,
  pins,
  setPins,
  currentFloor,
  setModalVisible,
  saveChanges,
}) => {
  const [coords, setCoords] = useState([0, 0]);
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [selectedPin, setSelectedPin] = useState(null);
  const scale = useSharedValue(1);

  const imageRef = useRef(null);

  const handleDoubleTap = (pin) => {
    const newPin = {
      _id: Date.now().toString(),
      coordinates: {
        x: coords[0] - 14,
        y: coords[1] - 14,
      },
      name: `Pin ${pins.length + 1}`,
      status: "normal",
      isNew: true,
    };
    runOnJS(setPinModalVisible)(true);
    runOnJS(setSelectedPin)(pin.absoluteX ? newPin : pin);
    // const updatedPins = [...pins, newPin];
    // runOnJS(setPins)(updatedPins);
  };

  const deletePin = (id) => {
    const updated = pins.map((pin) =>
      pin._id === id ? { ...pin, isDeleted: true } : pin
    );
    setPins(updated);
    setPinModalVisible(false);
  };

  const doubleTapGesture = Gesture.LongPress()
    // .numberOfTaps(2)
    .onStart(handleDoubleTap);

  const composedGestures = Gesture.Race(doubleTapGesture);

  const saveCoords = (ev) => {
    setCoords([ev.nativeEvent.locationX, ev.nativeEvent.locationY]);
  };

  const handleSavePin = () => {
    setPins([
      ...pins.filter((pin) => pin._id !== selectedPin._id),
      { ...selectedPin },
    ]);
    setPinModalVisible(false);
  };

  return (
    <>
      <View style={styles.container} onTouchStart={saveCoords}>
        <Zoomable
          // isPanEnabled={false}
          isSingleTapEnabled={false}
          ref={imageRef}
          minScale={1}
          maxScale={5}
          isDoubleTapEnabled
          scale={scale}
        >
          <GestureDetector gesture={composedGestures}>
            <Image
              style={styles.image}
              source={imageUrl}
              contentFit="contain"
            />
          </GestureDetector>

          {pins.map((pin) => (
            <PinComponent
              key={pin._id}
              pin={pin}
              onLongPress={handleDoubleTap}
              scale={scale}
            />
          ))}
        </Zoomable>
        <View
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-evenly",
            marginBottom: 16,
          }}
        >
          {currentFloor && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.addButtonText}>Image</Text>
            </TouchableOpacity>
          )}
          {currentFloor && (
            <TouchableOpacity style={styles.saveButton} onPress={saveChanges}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.resetButton}
            onPress={() => {
              imageRef.current.reset();
            }}
          >
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Modal
        animationType="fade"
        transparent={true}
        visible={pinModalVisible}
        onRequestClose={() => setPinModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Пожарный извещатель</Text>

            {selectedPin && (
              <ScrollView>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Название</Text>
                  <TextInput
                    style={styles.formInput}
                    value={selectedPin.name}
                    onChangeText={(text) =>
                      setSelectedPin({ ...selectedPin, name: text })
                    }
                  />
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Состояние</Text>
                  <View style={styles.roleSelector}>
                    {["normal", "alert", "disabled"].map((status) => (
                      <TouchableOpacity
                        key={status}
                        style={[
                          styles.roleOption,
                          selectedPin.status === status &&
                            styles.roleOptionSelected,
                        ]}
                        onPress={() =>
                          setSelectedPin({ ...selectedPin, status })
                        }
                      >
                        <Text
                          style={[
                            styles.roleOptionText,
                            selectedPin.status === status &&
                              styles.roleOptionTextSelected,
                          ]}
                        >
                          {status == "normal"
                            ? "OK"
                            : status == "alert"
                            ? "Тревога"
                            : "Выключен"}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deletePin(selectedPin._id)}
                  >
                    <Icon name="delete" size={18} color="#fff" />
                    <Text style={styles.deleteButtonText}>Удалить</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.saveButtonModal}
                    onPress={handleSavePin}
                  >
                    <Icon name="save" size={18} color="#fff" />
                    <Text style={styles.saveButtonTextModal}>Сохранить</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}

            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setPinModalVisible(false)}
            >
              <Text style={styles.closeModalButtonText}>Закрыть</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default InteractiveImageMap;

const styles = StyleSheet.create({
  saveButtonText: {
    color: "black",
  },
  saveButton: {
    // backgroundColor: "#4caf50",
    borderWidth: 2,
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 8,
    borderColor: "#4caf50",
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    zIndex: 1,
  },
  scrollContent: {},
  imageView: {
    display: "flex",
  },
  image: {
    height: "100%",
    width: "100%",
    // alignSelf: "flex-start",
  },
  pin: {
    position: "absolute",
    padding: 6,
    backgroundColor: "red",
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  pinLabel: {
    color: "white",
    fontSize: 10,
  },
  resetButton: {
    // position: "absolute",
    // bottom: 20,
    // right: 20,
    color: "red",
    backgroundColor: "#ffffff",
    borderColor: "red",
    borderWidth: 2,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  resetButtonText: {
    color: "black",
  },
  addButton: {
    // position: "absolute",
    // bottom: 20,
    // left: 20,
    color: "red",
    backgroundColor: "#ffffff",
    borderColor: "red",
    borderWidth: 2,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  userCard: {
    backgroundColor: "white",
    marginHorizontal: 15,
    marginVertical: 5,
    borderRadius: 8,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  avatarText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: "#777",
    marginBottom: 2,
  },
  userRole: {
    fontSize: 12,
    color: "#555",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: "#777",
    textAlign: "center",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 20,
  },
  modalContent: {
    width: "90%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
    textAlign: "center",
  },
  formGroup: {
    marginBottom: 15,
  },
  formLabel: {
    fontSize: 14,
    color: "#555",
    marginBottom: 5,
  },
  formInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    padding: 10,
    fontSize: 16,
  },
  roleSelector: {
    flexDirection: "column",
  },
  roleOption: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    marginBottom: 8,
  },
  roleOptionSelected: {
    backgroundColor: "#d32f2f",
    borderColor: "#d32f2f",
  },
  roleOptionText: {
    color: "#333",
    fontSize: 14,
  },
  roleOptionTextSelected: {
    color: "white",
    fontWeight: "bold",
  },
  dateText: {
    fontSize: 16,
    color: "#555",
    padding: 10,
    backgroundColor: "#f5f5f5",
    borderRadius: 4,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 20,
  },
  deleteButton: {
    backgroundColor: "#f44336",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    borderRadius: 4,
    flex: 1,
    marginRight: 10,
  },
  deleteButtonText: {
    color: "white",
    fontWeight: "bold",
    marginLeft: 5,
  },
  saveButtonModal: {
    backgroundColor: "#4caf50",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    borderRadius: 4,
    flex: 1,
    marginLeft: 10,
  },
  saveButtonTextModal: {
    color: "white",
    fontWeight: "bold",
    marginLeft: 5,
  },
  closeModalButton: {
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 4,
    marginTop: 10,
    alignItems: "center",
  },
  closeModalButtonText: {
    color: "#333",
    fontWeight: "bold",
  },
});
