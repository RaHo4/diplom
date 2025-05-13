import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useRoute } from '@react-navigation/native';
import Svg, { Circle, Rect } from 'react-native-svg';
import api from '../../../services/api';
import Loader from '../../common/Loader';

const BuildingPlan = ({ navigation }) => {
  const route = useRoute();
  const { buildingId } = route.params || {};
  
  const [building, setBuilding] = useState(null);
  const [floors, setFloors] = useState([]);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [alarms, setAlarms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
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
    setSelectedFloor(floor);
  };
  
  // Filter alarms for selected floor
  const floorAlarms = alarms.filter(alarm => alarm.floorId === selectedFloor?.id);
  
  // Check if any alarm is triggered on selected floor
  const isFloorAlarmTriggered = floorAlarms.some(alarm => alarm.status === 'triggered');
  
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
        <Text style={styles.buildingTitle}>{building?.name || 'План здания'}</Text>
        <Text style={styles.buildingAddress}>{building?.address || ''}</Text>
      </View>
      
      {floors.length > 1 && (
        <View style={styles.floorSelector}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {floors.map(floor => (
              <TouchableOpacity
                key={floor.id}
                style={[
                  styles.floorButton,
                  selectedFloor?.id === floor.id && styles.floorButtonSelected,
                  // Highlight floor if any alarm is triggered
                  alarms.some(alarm => alarm.floorId === floor.id && alarm.status === 'triggered') && 
                  styles.floorButtonAlarm
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
      
      <View style={[
        styles.planContainer,
        isFloorAlarmTriggered && styles.planContainerAlarm
      ]}>
        {selectedFloor ? (
          <View style={styles.planWrapper}>
            <Image
              source={{ uri: selectedFloor.planImageUrl }}
              style={styles.floorPlan}
              resizeMode="contain"
            />
            
            {/* Overlay SVG with fire alarm indicators */}
            <Svg style={StyleSheet.absoluteFill}>
              {floorAlarms.map(alarm => (
                <Circle
                  key={alarm.id}
                  cx={alarm.positionX}
                  cy={alarm.positionY}
                  r={alarm.status === 'triggered' ? 10 : 6}
                  fill={alarm.status === 'triggered' ? 'red' : 'green'}
                  opacity={alarm.status === 'triggered' ? (Math.sin(Date.now() / 200) + 1) / 2 : 1}
                />
              ))}
            </Svg>
          </View>
        ) : (
          <Text style={styles.noFloorText}>Нет доступных планов этажей</Text>
        )}
      </View>
      
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: 'green' }]} />
          <Text style={styles.legendText}>Нормальное состояние</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: 'red' }]} />
          <Text style={styles.legendText}>Тревога</Text>
        </View>
      </View>
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
  },
  buildingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  buildingAddress: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 5,
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
  floorButtonAlarm: {
    backgroundColor: '#ff6659',
  },
  floorButtonText: {
    color: '#333',
    fontWeight: '500',
  },
  floorButtonTextSelected: {
    color: '#fff',
  },
  planContainer: {
    flex: 1,
    padding: 10,
    backgroundColor: '#fff',
  },
  planContainerAlarm: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
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
  legend: {
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    color: '#333',
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
});

export default BuildingPlan;