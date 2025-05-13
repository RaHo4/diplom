import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  PanResponder,
  Alert,
  Modal
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Svg, { Circle, G } from 'react-native-svg';
import Icon from 'react-native-vector-icons/MaterialIcons';
import api from '../../../services/api';
import Loader from '../../common/Loader';

const EditBuildingPlan = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { buildingId } = route.params || {};
  
  const [building, setBuilding] = useState(null);
  const [floors, setFloors] = useState([]);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [alarms, setAlarms] = useState([]);
  const [selectedAlarm, setSelectedAlarm] = useState(null);
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Refs for plan dimensions
  const planContainerRef = useRef(null);
  const planDimensions = useRef({ width: 0, height: 0, x: 0, y: 0 });
  
  useEffect(() => {
    if (buildingId) {
      fetchBuildingData();
    }
  }, [buildingId]);
  
  const fetchBuildingData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch building details
      const buildingResponse = await api.get(`/buildings/${buildingId}`);
      setBuilding(buildingResponse.data);
      
      // Fetch floors
      const floorsResponse = await api.get(`/buildings/${buildingId}/floors`);
      setFloors(floorsResponse.data);
      
      // Set default selected floor (first floor)
      if (floorsResponse.data.length > 0) {
        setSelectedFloor(floorsResponse.data[0]);
      }
      
      // Fetch fire alarms for this building
      const alarmsResponse = await api.get(`/buildings/${buildingId}/alarms`);
      setAlarms(alarmsResponse.data);
      
    } catch (error) {
      setError('Ошибка при загрузке данных здания');
      console.error('Building data fetch error', error.response?.data || error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleFloorChange = (floor) => {
    if (hasChanges) {
      Alert.alert(
        "Несохраненные изменения",
        "У вас есть несохраненные изменения. Сохранить перед продолжением?",
        [
          {
            text: "Отмена",
            style: "cancel"
          },
          {
            text: "Отменить изменения",
            onPress: () => {
              setSelectedFloor(floor);
              setHasChanges(false);
            }
          },
          { 
            text: "Сохранить", 
            onPress: () => {
              saveChanges().then(() => {
                setSelectedFloor(floor);
              });
            } 
          }
        ]
      );
    } else {
      setSelectedFloor(floor);
    }
  };
  
  // Filter alarms for selected floor
  const floorAlarms = alarms.filter(alarm => alarm.floorId === selectedFloor?.id);
  
  // PanResponder for dragging alarms
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (_, gestureState) => {
      // Check if user tapped on an existing alarm
      if (!isAddingMode) {
        const { locationX, locationY } = _.nativeEvent;
        const tappedAlarm = findAlarmAtPosition(locationX, locationY);
        
        if (tappedAlarm) {
          setSelectedAlarm(tappedAlarm);
        }
      }
    },
    onPanResponderMove: (_, gestureState) => {
      if (selectedAlarm) {
        // Update position of selected alarm
        const updatedAlarms = alarms.map(alarm => {
          if (alarm.id === selectedAlarm.id) {
            return {
              ...alarm,
              positionX: Math.max(0, Math.min(planDimensions.current.width, gestureState.moveX - planDimensions.current.x)),
              positionY: Math.max(0, Math.min(planDimensions.current.height, gestureState.moveY - planDimensions.current.y))
            };
          }
          return alarm;
        });
        
        setAlarms(updatedAlarms);
        setHasChanges(true);
      }
    },
    onPanResponderRelease: () => {
      setSelectedAlarm(null);
    },
    onPanResponderTerminate: () => {
      setSelectedAlarm(null);
    }
  });
  
  // Function to find if an alarm is at the tapped position
  const findAlarmAtPosition = (x, y) => {
    const hitSlop = 20; // Area around the alarm that counts as a tap
    
    return floorAlarms.find(alarm => {
      const dx = Math.abs(alarm.positionX - x);
      const dy = Math.abs(alarm.positionY - y);
      
      return dx <= hitSlop && dy <= hitSlop;
    });
  };
  
  // Function to handle tap on the plan to add a new alarm
  const handlePlanTap = (event) => {
    if (isAddingMode && selectedFloor) {
      const { locationX, locationY } = event.nativeEvent;
      
      // Create a new alarm
      const newAlarm = {
        id: `temp-${Date.now()}`,
        floorId: selectedFloor.id,
        positionX: locationX,
        positionY: locationY,
        type: 'smoke',
        status: 'normal',
        isNew: true
      };
      
      setAlarms([...alarms, newAlarm]);
      setHasChanges(true);
      setIsAddingMode(false); // Exit adding mode after placing an alarm
    }
  };
  
  const handleDeleteAlarm = (alarmId) => {
    Alert.alert(
      "Подтверждение",
      "Вы уверены, что хотите удалить этот пожарный извещатель?",
      [
        {
          text: "Отмена",
          style: "cancel"
        },
        { 
          text: "Удалить", 
          onPress: () => {
            const updatedAlarms = alarms.filter(alarm => alarm.id !== alarmId);
            setAlarms(updatedAlarms);
            setHasChanges(true);
          },
          style: "destructive"
        }
      ]
    );
  };
  
  const saveChanges = async () => {
    try {
      setIsSaving(true);
      
      // Find new and updated alarms
      const newAlarms = alarms.filter(alarm => alarm.isNew);
      const updatedAlarms = alarms.filter(alarm => !alarm.isNew && alarm.updated);
      
      // Prepare the data to send
      const changesData = {
        buildingId,
        floorId: selectedFloor.id,
        newAlarms: newAlarms.map(({ id, ...rest }) => rest), // Remove temporary IDs
        updatedAlarms: updatedAlarms.map(({ updated, ...rest }) => rest), // Remove 'updated' flag
        deletedAlarmIds: [] // You need to track deleted alarms separately
      };
      
      // Send changes to backend
      await api.post('/buildings/alarms/update', changesData);
      
      // Refresh data
      await fetchBuildingData();
      
      setHasChanges(false);
      Alert.alert("Успешно", "Изменения сохранены и отправлены на утверждение администратору");
      
    } catch (error) {
      Alert.alert("Ошибка", "Не удалось сохранить изменения");
      console.error('Save changes error', error.response?.data || error);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle measuring the plan container
  const onPlanLayout = (event) => {
    const { width, height, x, y } = event.nativeEvent.layout;
    planDimensions.current = { width, height, x, y };
  };
  
  if (isLoading) {
    return <Loader />;
  }
  
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={fetchBuildingData}
        >
          <Text style={styles.retryButtonText}>Повторить</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => {
            if (hasChanges) {
              Alert.alert(
                "Несохраненные изменения",
                "У вас есть несохраненные изменения. Сохранить перед выходом?",
                [
                  {
                    text: "Отмена",
                    style: "cancel"
                  },
                  {
                    text: "Выйти без сохранения",
                    onPress: () => navigation.goBack()
                  },
                  { 
                    text: "Сохранить и выйти", 
                    onPress: () => {
                      saveChanges().then(() => {
                        navigation.goBack();
                      });
                    } 
                  }
                ]
              );
            } else {
              navigation.goBack();
            }
          }}
        >
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.buildingTitle}>
          Редактирование: {building?.name || 'План здания'}
        </Text>
      </View>
      
      {floors.length > 1 && (
        <View style={styles.floorSelector}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {floors.map(floor => (
              <TouchableOpacity
                key={floor.id}
                style={[
                  styles.floorButton,
                  selectedFloor?.id === floor.id && styles.floorButtonSelected
                ]}
                onPress={() => handleFloorChange(floor)}
              >
                <Text style={[
                  styles.floorButtonText,
                  selectedFloor?.id === floor.id && styles.floorButtonTextSelected
                ]}>
                  {floor.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
      
      <View style={styles.toolsContainer}>
        <TouchableOpacity 
          style={[styles.toolButton, isAddingMode && styles.toolButtonActive]}
          onPress={() => setIsAddingMode(!isAddingMode)}
        >
          <Icon name="add-circle" size={24} color={isAddingMode ? "#d32f2f" : "#555"} />
          <Text style={styles.toolButtonText}>Добавить</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.toolButton}
          onPress={() => setModalVisible(true)}
        >
          <Icon name="info" size={24} color="#555" />
          <Text style={styles.toolButtonText}>Инфо</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.toolButton, isSaving && styles.toolButtonDisabled]}
          disabled={isSaving || !hasChanges}
          onPress={saveChanges}
        >
          <Icon name="save" size={24} color={hasChanges ? "#d32f2f" : "#999"} />
          <Text style={[
            styles.toolButtonText, 
            hasChanges ? { color: '#d32f2f' } : { color: '#999' }
          ]}>
            Сохранить
          </Text>
        </TouchableOpacity>
      </View>
      
      <View 
        style={styles.planContainer}
        ref={planContainerRef}
        onLayout={onPlanLayout}
        {...panResponder.panHandlers}
      >
        {selectedFloor ? (
          <TouchableOpacity 
            activeOpacity={1}
            style={styles.planWrapper}
            onPress={handlePlanTap}
          >
            <Image
              source={{ uri: selectedFloor.planImageUrl }}
              style={styles.floorPlan}
              resizeMode="contain"
            />
            
            {/* Overlay SVG with fire alarm indicators */}
            <Svg style={StyleSheet.absoluteFill}>
              {floorAlarms.map(alarm => (
                <G key={alarm.id}>
                  <Circle
                    cx={alarm.positionX}
                    cy={alarm.positionY}
                    r={selectedAlarm?.id === alarm.id ? 10 : 6}
                    fill={alarm.isNew ? '#1976d2' : '#4caf50'}
                    opacity={selectedAlarm?.id === alarm.id ? 0.7 : 1}
                  />
                  
                  {/* Delete button appears when long-pressing an alarm */}
                  {selectedAlarm?.id === alarm.id && (
                    <G>
                      <Circle
                        cx={alarm.positionX}
                        cy={alarm.positionY - 25}
                        r={12}
                        fill="red"
                        onPress={() => handleDeleteAlarm(alarm.id)}
                      />
                      <Text
                        x={alarm.positionX}
                        y={alarm.positionY - 25}
                        fill="white"
                        fontSize={14}
                        textAnchor="middle"
                        alignmentBaseline="middle"
                      >
                        X
                      </Text>
                    </G>
                  )}
                </G>
              ))}
            </Svg>
          </TouchableOpacity>
        ) : (
          <Text style={styles.noFloorText}>Нет доступных планов этажей</Text>
        )}
      </View>
      
      {isAddingMode && (
        <View style={styles.addingModeIndicator}>
          <Text style={styles.addingModeText}>
            Режим добавления активен. Нажмите на план для размещения пожарного извещателя.
          </Text>
        </View>
      )}
      
      {/* Modal with instructions */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Инструкция по редактированию</Text>
            
            <View style={styles.instructionItem}>
              <Icon name="add-circle" size={20} color="#d32f2f" />
              <Text style={styles.instructionText}>
                Нажмите "Добавить" и затем коснитесь плана, чтобы разместить новый извещатель
              </Text>
            </View>
            
            <View style={styles.instructionItem}>
              <Icon name="drag-indicator" size={20} color="#d32f2f" />
              <Text style={styles.instructionText}>
                Перетаскивайте существующие извещатели для изменения их положения
              </Text>
            </View>
            
            <View style={styles.instructionItem}>
              <Icon name="delete" size={20} color="#d32f2f" />
              <Text style={styles.instructionText}>
                Удерживайте палец на извещателе для появления кнопки удаления
              </Text>
            </View>
            
            <View style={styles.instructionItem}>
              <Icon name="save" size={20} color="#d32f2f" />
              <Text style={styles.instructionText}>
                Нажмите "Сохранить" для отправки изменений на утверждение администратору
              </Text>
            </View>
            
            <TouchableOpacity 
              style={styles.closeModalButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeModalButtonText}>Закрыть</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {isSaving && <Loader />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#d32f2f',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  buildingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
  },
  floorSelector: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  floorButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
  },
  floorButtonSelected: {
    backgroundColor: '#d32f2f',
  },
  floorButtonText: {
    color: '#333',
    fontWeight: '500',
  },
  floorButtonTextSelected: {
    color: '#fff',
  },
  toolsContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    justifyContent: 'space-around',
  },
  toolButton: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 4,
  },
  toolButtonActive: {
    backgroundColor: 'rgba(211, 47, 47, 0.1)',
  },
  toolButtonDisabled: {
    opacity: 0.5,
  },
  toolButtonText: {
    fontSize: 12,
    marginTop: 4,
    color: '#555',
  },
  planContainer: {
    flex: 1,
    padding: 10,
    backgroundColor: '#fff',
  },
  planWrapper: {
    flex: 1,
    position: 'relative',
  },
  floorPlan: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  noFloorText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#666',
  },
  addingModeIndicator: {
    backgroundColor: 'rgba(25, 118, 210, 0.9)',
    padding: 15,
  },
  addingModeText: {
    color: 'white',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#d32f2f',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 4,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#d32f2f',
    textAlign: 'center',
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  instructionText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  closeModalButton: {
    backgroundColor: '#d32f2f',
    paddingVertical: 10,
    borderRadius: 4,
    marginTop: 10,
  },
  closeModalButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default EditBuildingPlan;