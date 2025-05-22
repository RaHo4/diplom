import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Button,
  Modal,
  TouchableOpacity,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import api from "../../../services/api";
import InteractiveImageMap from "../Addresses/InteractiveImage";
import { ROUTE } from "../../../utils/constants";
import Icon from "react-native-vector-icons/MaterialIcons";
// const { imageHash } = require("image-hash");

const FloorSelector = ({ route, navigation }) => {
  const [pins, setPins] = useState([]);
  const [buildingId, setBuildingId] = useState(route.params.buildingId || null);
  const [floorNumber, setFloorNumber] = useState(route.params.floor || null);
  const [imageUri, setImageUri] = useState(null); // URI загруженного изображения
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [isShouldSave, setIsShouldSave] = useState(false);
  const [toggleFetch, setToggleFetch] = useState(false);

  const [floors, setFloors] = useState([]); // Список этажей
  const [currentFloor, setCurrentFloor] = useState(null); // Текущий этаж

  // Загрузка данных при монтировании
  useEffect(() => {
    fetchBuilding();
  }, [toggleFetch]);

  useEffect(() => {
    if (imageUri && isShouldSave) {
      saveChanges();
      setIsShouldSave(false);
    }
    // prevImageUri.current = imageUri;
  }, [imageUri]);

  useEffect(() => {
    console.log(pins);
    // console.log(buildingId);
  }, [pins]);

  const fetchBuilding = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/floors/building/${buildingId}`);
      if (!response.success) throw new Error(response.message);

      const { floors } = response;

      if (floors.length > 0) {
        setFloors(floors);
        setCurrentFloor(floors[floorNumber - 1]); // По умолчанию первый этаж
        const imagePath = floors[floorNumber - 1].planImagePath;
        const imageUrl = `${ROUTE}/uploads/floors/${imagePath
          .split("\\")
          .pop()}`;

        setImageUri(imageUrl);
        const response = await api.get(
          `/alarms/floor/${floors[floorNumber - 1]._id}`
        );
        // console.log(alarms);
        if (response.success)
          setPins(response.alarms.map((alarm) => ({ ...alarm, isNew: false })));
      } else {
        setFloors([]);
        setCurrentFloor(null);
        setImageUri(null);
      }
    } catch (error) {
      console.error("Ошибка при получении плана здания:", error);
      Alert.alert("Ошибка", "Не удалось загрузить план этажа");
    } finally {
      setIsLoading(false);
    }
  };

  // Выбор изображения из галереи
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      // mediaTypes: ImagePicker.MediaType.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setModalVisible(false);
      setIsShouldSave(true);
    }
  };

  // Снимок с камеры (если нужно)
  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert("Нужны права доступа к камере");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [16, 9],
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setModalVisible(false);
      setIsShouldSave(true);
    }
  };

  // Отправка изменений на сервер
  const saveChanges = async () => {
    if (!imageUri) {
      Alert.alert("Ошибка", "Добавьте изображение перед сохранением");
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("planImage", {
        uri: imageUri,
        type: "image/jpeg",
        name: `test.jpg`,
      });
      // Отправляем на сервер
      let response;
      if (currentFloor) {
        formData.append("status", currentFloor.status);
        response = await api.put(`/floors/${currentFloor._id}`, formData);
      } else {
        formData.append("buildingId", buildingId);
        formData.append("floorNumber", floorNumber);
        response = await api.post(`/floors/`, formData);
      }

      if (!response.success) throw new Error(response.message);

      response = await Promise.all(
        pins.map(async (pin) => {
          if (pin.isNew)
            return await api.post("/alarms/", {
              buildingId: buildingId,
              floorId: currentFloor._id,
              name: pin.name,
              status: pin.status,
              coordinates: pin.coordinates,
            });
          if (pin.isDeleted && !pin.isNew)
            return await api.delete(`/alarms/${pin._id}`);
          if (!pin.isNew)
            return await api.put(`/alarms/${pin._id}`, {
              name: pin.name,
              status: pin.status,
              coordinates: pin.coordinates,
            });
        })
      );

      if (response.filter(res => !res.success).length) throw new Error(response.message);

      Alert.alert("Успех", "Изменения успешно сохранены");
      setToggleFetch(!toggleFetch);
    } catch (error) {
      console.error("Ошибка при сохранении изменений:", error);
      Alert.alert("Ошибка", "Не удалось сохранить изменения");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator />
        <Text>Загрузка плана этажа...</Text>
      </View>
    );
  }

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>План этажа</Text>
        </View>

        {/* Если нет этажей */}
        {!currentFloor ? (
          <View style={styles.noFloorContainer}>
            <Text style={styles.noFloorText}>Нет плана этажа</Text>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.uploadButtonText}>Загрузить план этажа</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <InteractiveImageMap
            imageUrl={{ uri: imageUri }}
            pins={pins}
            setPins={(newPins) => setPins(newPins)}
            currentFloor={currentFloor}
            setModalVisible={(value) => setModalVisible(value)}
            saveChanges={saveChanges}
          />
        )}

        <ScrollView horizontal style={styles.scroll}>
          {floors.map((floor, index) => (
            <TouchableOpacity
              key={index}
              activeOpacity={0.7}
              onPress={async () => {
                setCurrentFloor(floor);
                setFloorNumber(floor.floorNumber);
                setImageUri(floor.planImagePath);
                setToggleFetch(!toggleFetch);
                // await fetchBuilding();
              }}
            >
              <View style={styles.floorSelectorButton}>
                <Text>{`Этаж ${floor.floorNumber}`}</Text>
              </View>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              setCurrentFloor(null);
              setFloorNumber(floors.length + 1);
              setImageUri(null);
            }}
          >
            <View
              style={[
                styles.floorSelectorButton,
                { paddingBlock: 2.5, paddingInline: 20, borderColor: "green" },
              ]}
            >
              <Icon name={"add-home"} size={32} color={"green"}></Icon>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Модальное окно */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Выберите действие</Text>
            <TouchableOpacity style={styles.modalButton} onPress={pickImage}>
              <Text>Выбрать из галереи</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalButton} onPress={takePhoto}>
              <Text>Сделать фото</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={{ color: "#fff" }}>Отмена</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default FloorSelector;

const styles = StyleSheet.create({
  floorSelectorButton: {
    backgroundColor: "white",
    borderWidth: 1,
    paddingBlock: 10,
    paddingInline: 16,
    color: "black",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  addButton: {
    backgroundColor: "#2196f3",
    padding: 8,
    borderRadius: 4,
    position: "absolute",
    left: 0,
    top: 0,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 14,
  },
  scroll: {
    maxHeight: 60,
    marginVertical: 8,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  saveButton: {
    backgroundColor: "#4caf50",
    padding: 16,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

  // Стили для случая, когда нет этажей
  noFloorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  noFloorText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: "center",
    color: "red",
  },
  uploadButton: {
    borderColor: "#d32f2f",
    borderWidth: 2,
    // backgroundColor: "#d32f2f",
    padding: 12,
    borderRadius: 5,
  },
  uploadButtonText: {
    color: "#d32f2f",
    fontSize: 16,
  },

  // Стили модального окна
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContainer: {
    width: 300,
    padding: 20,
    backgroundColor: "white",
    borderRadius: 10,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    marginBottom: 15,
  },
  modalButton: {
    padding: 10,
    marginVertical: 5,
    backgroundColor: "#ddd",
    width: "100%",
    alignItems: "center",
    borderRadius: 5,
  },
  modalCancelButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#d32f2f",
    width: "100%",
    alignItems: "center",
    borderRadius: 5,
  },
  addButton: {
    backgroundColor: "#2196f3",
    padding: 8,
    borderRadius: 4,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 14,
  },
  scroll: {
    maxHeight: 60,
    marginVertical: 8,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  saveButton: {
    backgroundColor: "#4caf50",
    padding: 16,
    alignItems: "center",
    width: 100,
    marginHorizontal: "auto",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContainer: {
    width: 300,
    padding: 20,
    backgroundColor: "white",
    borderRadius: 10,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    marginBottom: 15,
  },
  modalButton: {
    padding: 10,
    marginVertical: 5,
    backgroundColor: "#ddd",
    width: "100%",
    alignItems: "center",
    borderRadius: 5,
  },
  modalCancelButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#d32f2f",
    width: "100%",
    alignItems: "center",
    borderRadius: 5,
  },
  floorLink: {
    padding: 20,
    // margin: 5,
    // borderRadius: 20,
    borderWidth: 1,
    borderColor: "black",
    backgroundColor: "white",
  },
  scroll: {
    flexGrow: 0,
    // backgroundColor: 'black',
    // display: "flex",
    // flexDirection: "row",
    zIndex: 1000000,
  },
  header: {
    // paddingTop: StatusBar.currentHeight,
    padding: 20,
    paddingTop: 10,
    backgroundColor: "white",
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    // position: "absolute",
    // top: 0,
    // left: 0,
    zIndex: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#d32f2f",
  },
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    position: "relative",
    // top: 0,
    // left: 0,
    // padding: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  imageContainer: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    overflow: "hidden",
  },
  imageWrapper: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  floorPlanImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
});
