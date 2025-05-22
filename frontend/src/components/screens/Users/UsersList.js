import React, { useState, useEffect } from "react";
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
import Icon from "react-native-vector-icons/MaterialIcons";
import api from "../../../services/api";
import Loader from "../../common/Loader";

const UsersList = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [pendingModalVisible, setPendingModalVisible] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = users.filter(
        (user) =>
          user.firstName.toLowerCase().includes(query) ||
          user.lastName.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          user.role.toLowerCase().includes(query)
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch confirmed users
      const usersResponse = await api.get("/users");
      setUsers(usersResponse.users);
      setFilteredUsers(usersResponse.data);

      // Fetch pending users
      const pendingResponse = await api.get("/users/pending");
      setPendingUsers(pendingResponse.users);
    } catch (error) {
      setError("Ошибка при загрузке пользователей");
      console.error("Users fetch error", error.response?.data || error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchUsers();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setUserModalVisible(true);
  };

  const handleDeleteUser = (userId) => {
    Alert.alert(
      "Подтверждение удаления",
      "Вы уверены, что хотите удалить этого пользователя?",
      [
        {
          text: "Отмена",
          style: "cancel",
        },
        {
          text: "Удалить",
          onPress: async () => {
            try {
              setIsLoading(true);
              await api.delete(`/users/${userId}`);

              // Refresh users list
              fetchUsers();

              setUserModalVisible(false);
              Alert.alert("Успешно", "Пользователь удален");
            } catch (error) {
              Alert.alert("Ошибка", "Не удалось удалить пользователя");
              console.error(
                "User deletion error",
                error.response?.data || error
              );
            } finally {
              setIsLoading(false);
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const handleSaveUser = async () => {
    try {
      setIsLoading(true);
      console.log(selectedUser);
      await api.put(`/users/${selectedUser._id}`, selectedUser);

      // Refresh users list
      fetchUsers();

      setUserModalVisible(false);
      Alert.alert("Успешно", "Данные пользователя обновлены");
    } catch (error) {
      Alert.alert("Ошибка", "Не удалось обновить пользователя");
      console.error("User update error", error.response?.data || error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprovePendingUser = async (userId) => {
    try {
      setIsLoading(true);

      await api.put(`/users/approve/${userId}`);

      // Refresh users list
      fetchUsers();

      Alert.alert("Успешно", "Пользователь подтвержден");
    } catch (error) {
      Alert.alert("Ошибка", "Не удалось подтвердить пользователя");
      console.error("User approval error", error.response?.data || error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectPendingUser = async (userId) => {
    try {
      setIsLoading(true);

      await api.delete(`/users/${userId}`);

      // Refresh users list
      fetchUsers();

      Alert.alert("Успешно", "Регистрация пользователя отклонена");
    } catch (error) {
      Alert.alert("Ошибка", "Не удалось отклонить пользователя");
      console.error("User rejection error", error.response?.data || error);
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

  if (isLoading && !isRefreshing) {
    return <Loader />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Управление пользователями</Text>

        {pendingUsers.length > 0 && (
          <TouchableOpacity
            style={styles.pendingButton}
            onPress={() => setPendingModalVisible(true)}
          >
            <Text style={styles.pendingButtonText}>{pendingUsers.length}</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#777" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Поиск по имени, email, роли..."
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
          <TouchableOpacity style={styles.retryButton} onPress={fetchUsers}>
            <Text style={styles.retryButtonText}>Повторить</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item._id}
        onRefresh={onRefresh}
        refreshing={isRefreshing}
        renderItem={({ item }) => (
          <TouchableOpacity
            // key={item.id}
            style={styles.userCard}
            onPress={() => handleUserSelect(item)}
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
                  {item.lastName.charAt(0).toUpperCase()}
                </Text>
              </View>

              <View style={styles.userDetails}>
                <Text style={styles.userName}>{item.lastName} {item.firstName}</Text>
                <Text style={styles.userEmail}>{item.email}</Text>
                <Text style={styles.userRole}>{getRoleName(item.role)}</Text>
              </View>
            </View>

            <Icon name="chevron-right" size={24} color="#bbb" />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="person-off" size={64} color="#bbb" />
            <Text style={styles.emptyText}>
              {searchQuery ? "Пользователи не найдены" : "Нет пользователей"}
            </Text>
          </View>
        }
      />

      {/* User Details Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={userModalVisible}
        onRequestClose={() => setUserModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Информация о пользователе</Text>

            {selectedUser && (
              <ScrollView>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Фамилия</Text>
                  <TextInput
                    style={styles.formInput}
                    value={selectedUser.lastName}
                    onChangeText={(text) =>
                      setSelectedUser({ ...selectedUser, lastName: text })
                    }
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Имя</Text>
                  <TextInput
                    style={styles.formInput}
                    value={selectedUser.firstName}
                    onChangeText={(text) =>
                      setSelectedUser({ ...selectedUser, firstName: text })
                    }
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Email</Text>
                  <TextInput
                    style={styles.formInput}
                    value={selectedUser.email}
                    onChangeText={(text) =>
                      setSelectedUser({ ...selectedUser, email: text })
                    }
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Роль</Text>
                  <View style={styles.roleSelector}>
                    {["admin", "duty", "dispatcher", "firefighter"].map(
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
                    )}
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Дата регистрации</Text>
                  <Text style={styles.dateText}>
                    {new Date(selectedUser.createdAt).toLocaleString()}
                  </Text>
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteUser(selectedUser._id)}
                  >
                    <Icon name="delete" size={18} color="#fff" />
                    <Text style={styles.deleteButtonText}>Удалить</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSaveUser}
                  >
                    <Icon name="save" size={18} color="#fff" />
                    <Text style={styles.saveButtonText}>Сохранить</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}

            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setUserModalVisible(false)}
            >
              <Text style={styles.closeModalButtonText}>Закрыть</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Pending Users Modal */}
      <Modal
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
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <View style={styles.pendingUserCard}>
                  <View style={styles.pendingUserInfo}>
                    <Text style={styles.pendingUserName}>{item.lastName} {item.firstName}</Text>
                    {/* <Text style={styles.pendingUserName}>{item.firstName}</Text> */}
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
      </Modal>

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

export default UsersList;
