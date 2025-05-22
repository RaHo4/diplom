import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  StatusBar,
  SafeAreaView,
  ScrollView,
  TextInput,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import api from "../../../services/api";
import { ActivityIndicator, Flex } from "@react-native-material/core";
import { AuthContext } from "../../../context/AuthContext";
// import Loader from '../../common/Loader';

const Profile = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const { logout } = useContext(AuthContext);

  useEffect(() => {
    fetchData();
    // Poll for alerts every 15 seconds
    // const interval = setInterval(() => {
    //   fetchAlerts();
    // }, 15000);
    // return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      console.log(api.getAuthToken());
      const response = await api.get(`/auth/me`, {
        // responseType: "blob", // важно для получения blob
      });
      if (!response.success) throw new Error(response.message);

      setUser(response.user);
      // const url = URL.createObjectURL(response.data); // преобразование blob в URL
      // setImageUri(url);
      // console.log(response.user.assignedBuildings);
    } catch (error) {
      console.error("Ошибка при получении доступных зданий", error);
      Alert.alert("Ошибка", "Не удалось загрузить доступные здания");
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleName = (role) => {
    switch (role) {
      case "admin":
        return "Администратор";
      case "duty":
        return "Дежурный по зданию";
      case "dispatcher":
        return "Диспетчер";
      case "firefighter":
        return "Пожарный";
      default:
        return role;
    }
  };

  const handleSaveUser = async () => {
    try {
      setIsLoading(true);
      //   console.log(selectedUser);
      await api.put(`/users/${user._id}`, user);

      // Refresh users list
      //   fetchUsers();

      //   setUserModalVisible(false);
      Alert.alert("Успешно", "Данные пользователя обновлены");
    } catch (error) {
      Alert.alert("Ошибка", "Не удалось обновить пользователя");
      console.error("User update error", error.response?.data || error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Профиль</Text>
        </View>
        <Flex fill direction="column" justify="center">
          <ActivityIndicator></ActivityIndicator>
        </Flex>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Профиль</Text>
      </View>

      {error ? (
        <Flex fill direction="column" justify="center">
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
              <Text style={styles.retryButtonText}>Повторить</Text>
            </TouchableOpacity>
          </View>
        </Flex>
      ) : null}

      {user && (
        <>
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Фамилия</Text>
            <TextInput
              style={styles.formInput}
              value={user.lastName}
              onChangeText={(text) => setUser({ ...user, lastName: text })}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Имя</Text>
            <TextInput
              style={styles.formInput}
              value={user.firstName}
              onChangeText={(text) => setUser({ ...user, firstName: text })}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Email</Text>
            <TextInput
              style={styles.formInput}
              value={user.email}
              onChangeText={(text) => setUser({ ...user, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Дата регистрации</Text>
            <Text style={styles.dateText}>
              {new Date(user.createdAt).toLocaleString()}
            </Text>
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={async () => {
                await logout();
                navigation.navigate("Auth");
              }}
            >
              <Icon name="delete" size={18} color="#fff" />
              <Text style={styles.deleteButtonText}>Выйти</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveUser}
            >
              <Icon name="save" size={18} color="#fff" />
              <Text style={styles.saveButtonText}>Сохранить</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {isLoading ? <ActivityIndicator /> : null}
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
  formGroup: {
    marginHorizontal: 15,
    marginVertical: 15,
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
  // formGroup: {
  //   marginBottom: 15,
  // },
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
    // marginVertical: 20,
    marginHorizontal: 15,
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

export default Profile;
