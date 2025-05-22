import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ScrollView,
} from "react-native";
import IconBuilding from "react-native-vector-icons/FontAwesome6";
import Icon from "react-native-vector-icons/MaterialIcons";
import api from "../../../services/api";
import Loader from "../../common/Loader";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContext } from "../../../context/AuthContext";

const AddressList = ({ navigation }) => {
  const [addresses, setAddresses] = useState([]);
  const [filteredAddresses, setFilteredAddresses] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [addBuildingModal, setAddBuildingModal] = useState(false);
  const [name, setName] = useState(null);
  const [address, setAddress] = useState(null);
  const [floors, setFloors] = useState(null);
  const [dutyOfficers, setDutyOfficers] = useState([]);
  const [toggle, setToggle] = useState(false);

  const { user } = useContext(AuthContext);

  useEffect(() => {
    fetchAddresses();
  }, [toggle, user]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredAddresses(addresses);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = addresses.filter(
        (address) =>
          address.address.toLowerCase().includes(query) ||
          address.name.toLowerCase().includes(query) ||
          address.floors.toLowerCase().includes(query)
      );
      setFilteredAddresses(filtered);
    }
  }, [searchQuery, addresses]);

  const fetchAddresses = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const addressesResponse = await api.get("/buildings");
      setAddresses(addressesResponse.buildings);
      setFilteredAddresses(addressesResponse.buildings);
    } catch (error) {
      setError("Ошибка при загрузке зданий");
      console.error("Building fetch error", error.response?.data || error);
    } finally {
      setIsLoading(false);
    }
  };

  //   const saveChanges = async () => {
  //     if (!imageUri) {
  //       Alert.alert("Ошибка", "Добавьте изображение перед сохранением");
  //       return;
  //     }

  //     setIsLoading(true);
  //     try {
  //       const formData = new FormData();
  //       formData.append("planImage", {
  //         uri: imageUri,
  //         type: "image/jpeg",
  //         name: `test.jpg`,
  //       });
  //       // Отправляем на сервер
  //       let response;
  //       if (currentFloor) {
  //         formData.append("status", currentFloor.status);
  //         response = await api.put(`/floors/${currentFloor._id}`, formData);
  //       } else {
  //         formData.append("buildingId", buildingId);
  //         formData.append("floorNumber", floorNumber);
  //         response = await api.post(`/floors/`, formData);
  //       }

  //       if (!response.success) throw new Error(response.message);

  //       response = await Promise.all(
  //         pins.map(async (pin) => {
  //           if (pin.isNew)
  //             return await api.post("/alarms/", {
  //               buildingId: buildingId,
  //               floorId: currentFloor._id,
  //               name: pin.name,
  //               status: pin.status,
  //               coordinates: pin.coordinates,
  //             });
  //           if (pin.isDeleted && !pin.isNew)
  //             return await api.delete(`/alarms/${pin._id}`);
  //           if (!pin.isNew)
  //             return await api.put(`/alarms/${pin._id}`, {
  //               name: pin.name,
  //               status: pin.status,
  //               coordinates: pin.coordinates,
  //             });
  //         })
  //       );

  //       if (response.filter((res) => !res.success).length)
  //         throw new Error(response.message);

  //       Alert.alert("Успех", "Изменения успешно сохранены");
  //       setToggleFetch(!toggleFetch);
  //     } catch (error) {
  //       console.error("Ошибка при сохранении изменений:", error);
  //       Alert.alert("Ошибка", "Не удалось сохранить изменения");
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };

  const addBuilding = async () => {
    try {
      if (!name || !address || !floors) {
        Alert.alert("Ошибка", "Заполните все поля перед сохранением");
        return;
      }
      const response = await api.post("/buildings/", {
        name: name,
        floors: floors,
        address: address,
      });

      if (!response.success) throw new Error(response.message);

      Alert.alert("Успех", "Изменения успешно сохранены");
    } catch (e) {
      console.error("Ошибка при сохранении изменений:", error);
      Alert.alert("Ошибка", "Не удалось сохранить изменения");
    } finally {
      setIsLoading(false);
      setAddBuildingModal(false);
      setToggle(!toggle);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchAddresses();
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading && !isRefreshing) {
    return <Loader />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Список зданий</Text>
      </View>

      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#777" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Поиск по адресу, названию, кол-ву этажей..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => setSearchQuery("")}
          >
            <Icon name="close" size={20} color="#777" />
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchAddresses}>
            <Text style={styles.retryButtonText}>Повторить</Text>
          </TouchableOpacity>
        </View>
      )}
      <View>
        <FlatList
          data={filteredAddresses}
          keyExtractor={(item) => item._id}
          onRefresh={onRefresh}
          refreshing={isRefreshing}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.userCard}
              onPress={() =>
                navigation.navigate("FloorSelector", {
                  buildingId: item._id,
                  floor: 1,
                })
              }
            >
              <View style={styles.userInfo}>
                <View
                  style={[
                    styles.userAvatar,
                    {
                      backgroundColor:
                        item.role === "admin"
                          ? "#d32f2f"
                          : item.role === "duty"
                          ? "#ff9800"
                          : item.role === "dispatcher"
                          ? "#2196f3"
                          : "#4caf50",
                    },
                  ]}
                >
                  <Text style={styles.avatarText}>
                    {item.name.charAt(0).toUpperCase()}
                  </Text>
                </View>

                <View style={styles.userDetails}>
                  <Text style={styles.userName}>{item.name}</Text>
                  <Text style={styles.userEmail}>{item.address}</Text>
                  {/* <Text style={styles.userRole}>{getRoleName(item.role)}</Text> */}
                </View>
              </View>

              <Icon name="chevron-right" size={24} color="#bbb" />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <IconBuilding
                name="building-circle-xmark"
                size={64}
                color="#bbb"
              />
              <Text style={styles.emptyText}>
                {searchQuery ? "Здания не найдены" : "Нет зданий"}
              </Text>
            </View>
          }
        />
        <TouchableOpacity
          style={styles.userCard}
          onPress={() => setAddBuildingModal(true)}
        >
          <View style={styles.userInfo}>
            <View style={[styles.userAvatar, { backgroundColor: "#4caf50" }]}>
              <Icon name="add-circle" size={40} color="#4caf50"></Icon>
            </View>

            <View style={styles.userDetails}>
              <Text style={styles.userName}>Добавить</Text>
            </View>
          </View>

          <Icon name="chevron-right" size={24} color="#bbb" />
        </TouchableOpacity>
      </View>

      {/* User Details Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={addBuildingModal}
        onRequestClose={() => setAddBuildingModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Добавить здание на учёт</Text>

            {/* {selectedUser && ( */}
            <ScrollView>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Название учреждения</Text>
                <TextInput
                  style={styles.formInput}
                  value={name}
                  onChangeText={(text) => setName(text)}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Адрес</Text>
                <TextInput
                  style={styles.formInput}
                  value={address}
                  onChangeText={(text) => setAddress(text)}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Количество этажей</Text>
                <TextInput
                  style={styles.formInput}
                  value={floors}
                  onChangeText={(text) => setFloors(text)}
                  keyboardType="decimal-pad"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Назначенные пожарные</Text>
                <View style={styles.roleSelector}>
                  {/* {["admin", "duty", "dispatcher", "firefighter"].map(
                    (role) => (
                      <TouchableOpacity
                        key={role}
                        style={[
                          styles.roleOption,
                          selectedUser.role === role &&
                            styles.roleOptionSelected,
                        ]}
                        onPress={() =>
                          setSelectedUser({ ...selectedUser, role })
                        }
                      >
                        <Text
                          style={[
                            styles.roleOptionText,
                            selectedUser.role === role &&
                              styles.roleOptionTextSelected,
                          ]}
                        >
                          {getRoleName(role)}
                        </Text>
                      </TouchableOpacity>
                    )
                  )} */}
                </View>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={addBuilding}
                >
                  <Icon name="save" size={18} color="#fff" />
                  <Text style={styles.saveButtonText}>Сохранить</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
            {/* )} */}

            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setAddBuildingModal(false)}
            >
              <Text style={styles.closeModalButtonText}>Закрыть</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Pending Users Modal */}
      {/* <Modal
        animationType="slide"
        transparent={true}
        visible={pendingModalVisible}
        onRequestClose={() => setPendingModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ожидающие подтверждения</Text>

            <FlatList
              data={pendingUsers}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.pendingUserCard}>
                  <View style={styles.pendingUserInfo}>
                    <Text style={styles.pendingUserName}>{item.lastName}</Text>
                    <Text style={styles.pendingUserName}>{item.firstName}</Text>
                    <Text style={styles.pendingUserEmail}>{item.email}</Text>
                    <Text style={styles.pendingUserRole}>
                      {getRoleName(item.role)}
                    </Text>
                    <Text style={styles.pendingUserDate}>
                      Запрос: {new Date(item.createdAt).toLocaleString()}
                    </Text>
                  </View>

                  <View style={styles.pendingActions}>
                    <TouchableOpacity
                      style={styles.rejectButton}
                      onPress={() => handleRejectPendingUser(item._id)}
                    >
                      <Icon name="close" size={20} color="#fff" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.approveButton}
                      onPress={() => handleApprovePendingUser(item._id)}
                    >
                      <Icon name="check" size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    Нет ожидающих подтверждения пользователей
                  </Text>
                </View>
              }
            />

            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setPendingModalVisible(false)}
            >
              <Text style={styles.closeModalButtonText}>Закрыть</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal> */}

      {isLoading && <Loader />}
    </View>
  );
};

const styles = StyleSheet.create({
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
  pendingButton: {
    backgroundColor: "white",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  pendingButtonText: {
    color: "#d32f2f",
    fontWeight: "bold",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    marginHorizontal: 15,
    marginVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
  },
  clearButton: {
    padding: 5,
  },
  errorContainer: {
    padding: 20,
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: "red",
    marginBottom: 15,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#d32f2f",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 4,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "bold",
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
  saveButton: {
    backgroundColor: "#4caf50",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    borderRadius: 4,
    flex: 1,
    marginLeft: 10,
  },
  saveButtonText: {
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
  pendingUserCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#ff9800",
  },
  pendingUserInfo: {
    marginBottom: 10,
  },
  pendingUserName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 2,
  },
  pendingUserEmail: {
    fontSize: 14,
    color: "#555",
    marginBottom: 2,
  },
  pendingUserRole: {
    fontSize: 14,
    fontWeight: "500",
    color: "#ff9800",
    marginBottom: 2,
  },
  pendingUserDate: {
    fontSize: 12,
    color: "#777",
  },
  pendingActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  rejectButton: {
    backgroundColor: "#f44336",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  approveButton: {
    backgroundColor: "#4caf50",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default AddressList;
