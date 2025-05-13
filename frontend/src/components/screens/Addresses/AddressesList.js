import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
// import {
//   getBuildings,
//   deleteBuilding,
// } from '../../redux/actions/buildingActions';
// import { Colors } from '../../theme/colors';

const BuildingsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { buildings, loading } = useSelector((state) => state.buildings);
  
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    dispatch(getBuildings());
  }, [dispatch]);

  const handleEditBuilding = (building) => {
    navigation.navigate('BuildingEdit', { buildingId: building?._id });
  };

  const handleDeleteBuilding = (building) => {
    Alert.alert(
      'Подтверждение удаления',
      `Вы уверены, что хотите удалить здание по адресу "${building.address}"? Это действие нельзя отменить.`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: () => {
            dispatch(deleteBuilding(building._id)).then(() => {
              dispatch(getBuildings());
            });
          },
        },
      ]
    );
  };

  const filteredBuildings = buildings.filter((building) =>
    building.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderBuildingItem = ({ item }) => {
    const hasActiveAlarms = item.activeAlarmCount > 0;
    
    return (
      <View
        style={[
          styles.buildingItem,
          hasActiveAlarms && styles.alarmBuildingItem,
        ]}>
        <View style={styles.buildingInfo}>
          <View
            style={[
              styles.buildingIcon,
              hasActiveAlarms && styles.alarmBuildingIcon,
            ]}>
            <Icon
              name={hasActiveAlarms ? 'bell-ring' : 'office-building'}
              size={24}
              // color={Colors.white}
            />
          </View>
          
          <View style={styles.buildingDetails}>
            <Text style={styles.buildingAddress}>{item.address}</Text>
            <View style={styles.buildingMeta}>
              <Text style={styles.floorsCount}>
                Этажей: {item.numberOfFloors}
              </Text>
              <Text style={styles.sensorsCount}>
                Датчиков: {item.alarmsCount || 0}
              </Text>
            </View>
            {hasActiveAlarms && (
              <View style={styles.alarmContainer}>
                {/* <Icon name="alert" size={16} color={Colors.error} /> */}
                <Text style={styles.alarmText}>
                  Активных тревог: {item.activeAlarmCount}
                </Text>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.buildingActions}>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => handleEditBuilding(item)}>
            {/* <Icon name="eye" size={20} color={Colors.white} /> */}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleEditBuilding(item)}>
            {/* <Icon name="pencil" size={20} color={Colors.white} /> */}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteBuilding(item)}>
            {/* <Icon name="delete" size={20} color={Colors.white} /> */}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInput}>
          {/* <Icon name="magnify" size={20} color={Colors.textLight} /> */}
          <TextInput
            placeholder="Поиск по адресу"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.input}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              {/* <Icon name="close" size={20} color={Colors.textLight} /> */}
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          {/* <ActivityIndicator size="large" color={Colors.primary} /> */}
        </View>
      ) : (
        <>
          <View style={styles.buildingStats}>
            <Text style={styles.buildingCount}>
              {filteredBuildings.length} {getBuildingCountText(filteredBuildings.length)}
            </Text>
            {buildings.filter((b) => b.activeAlarmCount > 0).length > 0 && (
              <Text style={styles.alarmsCount}>
                {buildings.filter((b) => b.activeAlarmCount > 0).length} с тревогой
              </Text>
            )}
          </View>
          
          <FlatList
            data={filteredBuildings}
            renderItem={renderBuildingItem}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.buildingList}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Icon
                  name="office-building-off"
                  size={48}
                  // color={Colors.textLight}
                />
                <Text style={styles.emptyText}>
                  Здания не найдены
                </Text>
              </View>
            }
          />
          
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => handleEditBuilding()}>
            {/* <Icon name="plus" size={24} color={Colors.white} /> */}
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

// Вспомогательная функция для корректного склонения слова "здание"
const getBuildingCountText = (count) => {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;
  
  if (lastDigit === 1 && lastTwoDigits !== 11) {
    return 'здание';
  } else if (
    [2, 3, 4].includes(lastDigit) &&
    ![12, 13, 14].includes(lastTwoDigits)
  ) {
    return 'здания';
  } else {
    return 'зданий';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: Colors.background,
  },
  searchContainer: {
    padding: 15,
    // backgroundColor: Colors.white,
    borderBottomWidth: 1,
    // borderBottomColor: Colors.border,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor: Colors.lightGray,
    borderRadius: 5,
    paddingHorizontal: 10,
  },
  input: {
    flex: 1,
    height: 40,
    paddingHorizontal: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buildingStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    // backgroundColor: Colors.white,
    borderBottomWidth: 1,
    // borderBottomColor: Colors.border,
  },
  buildingCount: {
    fontSize: 14,
    // color: Colors.textDark,
  },
  alarmsCount: {
    fontSize: 14,
    // color: Colors.error,
    fontWeight: 'bold',
  },
  buildingList: {
    padding: 10,
  },
  buildingItem: {
    // backgroundColor: Colors.white,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  alarmBuildingItem: {
    borderLeftWidth: 5,
    // borderLeftColor: Colors.error,
  },
  buildingInfo: {
    flexDirection: 'row',
    padding: 15,
  },
  buildingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    // backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  alarmBuildingIcon: {
    // backgroundColor: Colors.error,
  },
  buildingDetails: {
    flex: 1,
  },
  buildingAddress: {
    fontSize: 16,
    fontWeight: 'bold',
    // color: Colors.textDark,
    marginBottom: 5,
  },
  buildingMeta: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  floorsCount: {
    fontSize: 14,
    // color: Colors.textLight,
    marginRight: 15,
  },
  sensorsCount: {
    fontSize: 14,
    // color: Colors.textLight,
  },
  alarmContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alarmText: {
    fontSize: 14,
    // color: Colors.error,
    marginLeft: 5,
    fontWeight: 'bold',
  },
  buildingActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    // borderTopColor: Colors.border,
  },
  viewButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: Colors.secondary,
    padding: 10,
  },
  editButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: Colors.primary,
    padding: 10,
  },
  deleteButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: Colors.error,
    padding: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    // color: Colors.textLight,
    textAlign: 'center',
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    // backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
});

export default BuildingsScreen;