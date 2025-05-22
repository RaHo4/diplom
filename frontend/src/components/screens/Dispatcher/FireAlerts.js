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
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import api from "../../../services/api";
import { ActivityIndicator, Flex } from "@react-native-material/core";
import { AuthContext } from "../../../context/AuthContext";
// import Loader from '../../common/Loader';

const FireAlerts = ({ navigation }) => {
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [assignModalVisible, setAssignModalVisible] = useState(false);

  const { user } = useContext(AuthContext); // Получаем данные пользователя и logout
  const [intervalId, setIntervalId] = useState(null);

  useEffect(() => {
    if (!user) {
      console.log("Пользователь не авторизован — обновления остановлены");
      return;
    }

    fetchData();

    const id = setInterval(() => {
      if (!user) {
        clearInterval(id);
        return;
      }
      fetchAlerts();
    }, 15000);

    setIntervalId(id);

    return () => {
      if (id) clearInterval(id);
    };
  }, [user]);

  // Дополнительная проверка: если пользователь вышел — принудительно остановить все запросы
  useEffect(() => {
    if (!user && intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
  }, [user, intervalId]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      await Promise.all([fetchAlerts(), fetchTeams()]);
    } catch (error) {
      setError("Ошибка при загрузке данных");
      console.error("Data fetch error", error.response?.data || error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      const response = await api.get("/alarms/active");
      setActiveAlerts(response.alarms);
    } catch (error) {
      console.error("Alerts fetch error", error);
      throw error;
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await api.get("/brigades/available");
      setTeams(response.brigades);
    } catch (error) {
      console.error("Teams fetch error", error);
      throw error;
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchData();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleViewBuilding = (buildingId) => {
    navigation.navigate("BuildingPlan", { buildingId });
  };

  const handleAssignTeam = (alert) => {
    setSelectedAlert(alert);
    setAssignModalVisible(true);
  };

  const confirmAssignment = async (teamId) => {
    try {
      setIsLoading(true);

      await api.post("/fire-alerts/assign-team", {
        alertId: selectedAlert.id,
        teamId: teamId,
      });

      // Refresh data
      await fetchAlerts();
      await fetchTeams();

      Alert.alert("Успешно", "Пожарная бригада назначена на вызов");
      setAssignModalVisible(false);
    } catch (error) {
      Alert.alert("Ошибка", "Не удалось назначить пожарную бригаду");
      console.error("Team assignment error", error.response?.data || error);
    } finally {
      setIsLoading(false);
    }
  };

  const getAvailableTeams = () => {
    return teams.filter((team) => team.status === "available");
  };

  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Активные пожарные тревоги</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Icon name="refresh" size={24} color="#fff" />
          </TouchableOpacity>
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
        <Text style={styles.headerTitle}>Активные пожарные тревоги</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Icon name="refresh" size={24} color="#d32f2f" />
        </TouchableOpacity>
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

      {!error && activeAlerts.length === 0 ? (
        <Flex fill direction="column" justify="center">
          <View style={styles.emptyContainer}>
            <Icon name="water-drop" size={64} color="#4caf50" />
            <Text style={styles.emptyText}>Нет активных пожарных тревог</Text>
          </View>
        </Flex>
      ) : null}

      {!error && activeAlerts?.count > 0 ? (
        <FlatList
          data={activeAlerts}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
          renderItem={({ item }) => (
            <View style={styles.alertCard}>
              <View style={styles.alertHeader}>
                <Text style={styles.alertTimestamp}>
                  {new Date(item.timestamp).toLocaleString()}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    item.status === "unassigned"
                      ? styles.statusUnassigned
                      : item.status === "assigned"
                      ? styles.statusAssigned
                      : styles.statusResolving,
                  ]}
                >
                  <Text style={styles.statusText}>
                    {item.status === "unassigned"
                      ? "Ожидает"
                      : item.status === "assigned"
                      ? "Назначена бригада"
                      : "В процессе"}
                  </Text>
                </View>
              </View>

              <Text style={styles.buildingName}>{item.building.name}</Text>
              <Text style={styles.buildingAddress}>
                {item.building.address}
              </Text>

              <View style={styles.alertDetails}>
                <View style={styles.detailItem}>
                  <Icon name="warning" size={18} color="#d32f2f" />
                  <Text style={styles.detailText}>
                    {item.detectedAlarms}{" "}
                    {item.detectedAlarms === 1
                      ? "извещатель"
                      : item.detectedAlarms < 5
                      ? "извещателя"
                      : "извещателей"}
                  </Text>
                </View>

                <View style={styles.detailItem}>
                  <Icon name="layers" size={18} color="#333" />
                  <Text style={styles.detailText}>Этаж: {item.floorName}</Text>
                </View>

                {item.assignedTeam ? (
                  <View style={styles.detailItem}>
                    <Icon name="people" size={18} color="#1976d2" />
                    <Text style={styles.detailText}>
                      Бригада: {item.assignedTeam.name}
                    </Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleViewBuilding(item.building.id)}
                >
                  <Icon name="map" size={16} color="#fff" />
                  <Text style={styles.actionButtonText}>План</Text>
                </TouchableOpacity>

                {item.status === "unassigned" ? (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.assignButton]}
                    onPress={() => handleAssignTeam(item)}
                  >
                    <Icon name="assignment" size={16} color="#fff" />
                    <Text style={styles.actionButtonText}>
                      Назначить бригаду
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          )}
        />
      ) : null}

      {/* Team Assignment Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={assignModalVisible}
        onRequestClose={() => setAssignModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Выберите пожарную бригаду</Text>

            {getAvailableTeams().length === 0 ? (
              <View style={styles.noTeamsContainer}>
                <Icon name="error" size={48} color="#d32f2f" />
                <Text style={styles.noTeamsText}>
                  Нет доступных пожарных бригад
                </Text>
              </View>
            ) : (
              <FlatList
                data={getAvailableTeams()}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.teamItem}
                    onPress={() => confirmAssignment(item.id)}
                  >
                    <View style={styles.teamItemContent}>
                      <Icon name="people" size={24} color="#1976d2" />
                      <View style={styles.teamItemDetails}>
                        <Text style={styles.teamName}>{item.name}</Text>
                        <Text style={styles.teamMembers}>
                          {item.memberCount}{" "}
                          {item.memberCount === 1
                            ? "человек"
                            : item.memberCount < 5
                            ? "человека"
                            : "человек"}
                        </Text>
                      </View>
                    </View>
                    <Icon name="chevron-right" size={24} color="#777" />
                  </TouchableOpacity>
                )}
              />
            )}

            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setAssignModalVisible(false)}
            >
              <Text style={styles.closeModalButtonText}>Отмена</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {isLoading ? <ActivityIndicator /> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    // paddingTop: StatusBar.currentHeight,
    padding: 20,
    paddingTop: 10,
    backgroundColor: "white",
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#d32f2f",
  },
  refreshButton: {
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: "#4caf50",
    marginTop: 15,
    textAlign: "center",
  },
  alertCard: {
    backgroundColor: "white",
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 8,
    padding: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  alertHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  alertTimestamp: {
    fontSize: 12,
    color: "#777",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusUnassigned: {
    backgroundColor: "#ffd600",
  },
  statusAssigned: {
    backgroundColor: "#2196f3",
  },
  statusResolving: {
    backgroundColor: "#4caf50",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "white",
  },
  buildingName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  buildingAddress: {
    fontSize: 14,
    color: "#555",
    marginBottom: 12,
  },
  alertDetails: {
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 12,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: "#333",
    marginLeft: 8,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  actionButton: {
    backgroundColor: "#1976d2",
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginLeft: 10,
  },
  assignButton: {
    backgroundColor: "#4caf50",
  },
  actionButtonText: {
    color: "white",
    fontWeight: 500,
    fontSize: 14,
    marginLeft: 5,
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
  teamItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  teamItemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  teamItemDetails: {
    marginLeft: 12,
  },
  teamName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  teamMembers: {
    fontSize: 14,
    color: "#777",
  },
  noTeamsContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },
  noTeamsText: {
    marginTop: 15,
    fontSize: 16,
    color: "#777",
    textAlign: "center",
  },
  closeModalButton: {
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 4,
    marginTop: 20,
    alignItems: "center",
  },
  closeModalButtonText: {
    color: "#333",
    fontWeight: "bold",
  },
});

export default FireAlerts;
