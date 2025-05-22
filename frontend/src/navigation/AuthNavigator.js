import React, { useContext } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from "react-native-vector-icons/MaterialIcons";
import { AuthContext } from "../context/AuthContext";

// Auth screens
import Login from "../components/screens/Auth/Login";
import Register from "../components/screens/Auth/Register";

// Common screens
import Profile from "../components/screens/Profile/Profile";
import BuildingPlan from "../components/screens/Building/BuildingPlan";
import EditBuildingPlan from "../components/screens/Building/EditBuildingPlan";

// Admin screens
import UsersList from "../components/screens/Users/UsersList";
import EditUser from "../components/screens/Users/EditUser";
// import AddressesList from "../components/screens/Addresses/AddressesList";
import EditAddress from "../components/screens/Addresses/EditAddress";
import PendingChanges from "../components/screens/Admin/PendingChanges";

// Duty screens
import FireAlarmHistory from "../components/screens/Building/FireAlarmHistory";

// Dispatcher screens
import FireAlerts from "../components/screens/Dispatcher/FireAlerts";
import TeamAssignment from "../components/screens/Dispatcher/TeamAssignment";

// Firefighter screens
import CurrentMission from "../components/screens/Firefighter/CurrentMission";
import RoleBasedNavigator from "./RoleNavigator";
import FloorSelector from "../components/screens/Building/FloorSelector";
import AddressList from "../components/screens/Addresses/AddressList";

const AuthStack = createStackNavigator();
const AppStack = createStackNavigator();
const Tab = createBottomTabNavigator();
const BuildingStack = createStackNavigator();

const BuildingStackScreen = () => {
  return (
    <BuildingStack.Navigator screenOptions={{ headerShown: false }}>
      <BuildingStack.Screen name="AddressList" component={AddressList} />
      <BuildingStack.Screen name="FloorSelector" component={FloorSelector} />
    </BuildingStack.Navigator>
  );
};

const AuthNavigator = () => {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={Login} />
      <AuthStack.Screen name="Register" component={Register} />
    </AuthStack.Navigator>
  );
};

// Admin Tab Navigator
const AdminTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === "Buildings") {
            iconName = "apartment";
          } else if (route.name === "Users") {
            iconName = "people";
          } else if (route.name === "Changes") {
            iconName = "history";
          } else if (route.name === "Profile") {
            iconName = "person";
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#d32f2f",
        tabBarInactiveTintColor: "gray",
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Buildings"
        component={BuildingStackScreen}
        options={{ title: "Здания" }}
      />
      <Tab.Screen
        name="Users"
        component={UsersList}
        options={{ title: "Пользователи" }}
      />
      <Tab.Screen
        name="Changes"
        component={PendingChanges}
        options={{ title: "Изменения" }}
      />
      <Tab.Screen
        name="Profile"
        component={Profile}
        options={{ title: "Профиль" }}
      />
    </Tab.Navigator>
  );
};

// Duty Tab Navigator
const DutyTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === "Buildings") {
            iconName = "apartment";
          } else if (route.name === "History") {
            iconName = "history";
          } else if (route.name === "Profile") {
            iconName = "person";
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#d32f2f",
        tabBarInactiveTintColor: "gray",
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Buildings"
        component={AddressList}
        options={{ title: "Здания" }}
      />
      <Tab.Screen
        name="History"
        component={FireAlarmHistory}
        options={{ title: "История" }}
      />
      <Tab.Screen
        name="Profile"
        component={Profile}
        options={{ title: "Профиль" }}
      />
    </Tab.Navigator>
  );
};

// Dispatcher Tab Navigator
const DispatcherTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === "Alerts") {
            iconName = "warning";
          } else if (route.name === "Teams") {
            iconName = "people";
          } else if (route.name === "Buildings") {
            iconName = "apartment";
          } else if (route.name === "Profile") {
            iconName = "person";
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#d32f2f",
        tabBarInactiveTintColor: "gray",
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Alerts"
        component={FireAlerts}
        options={{ title: "Тревоги" }}
      />
      <Tab.Screen
        name="Teams"
        component={TeamAssignment}
        options={{ title: "Бригады" }}
      />
      <Tab.Screen
        name="Buildings"
        component={BuildingStackScreen}
        options={{ title: "Здания" }}
      />
      <Tab.Screen
        name="Profile"
        component={Profile}
        options={{ title: "Профиль" }}
      />
    </Tab.Navigator>
  );
};

// Firefighter Tab Navigator
const FirefighterTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === "CurrentMission") {
            iconName = "local-fire-department";
          } else if (route.name === "Profile") {
            iconName = "person";
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#d32f2f",
        tabBarInactiveTintColor: "gray",
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="CurrentMission"
        component={CurrentMission}
        options={{ title: "Вызов" }}
      />
      <Tab.Screen
        name="Profile"
        component={Profile}
        options={{ title: "Профиль" }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <AppStack.Navigator screenOptions={{ headerShown: false }}>
        <AppStack.Screen name="Main" component={RoleBasedNavigator} />
        <AppStack.Screen name="Auth" component={AuthNavigator} />
      </AppStack.Navigator>
    </NavigationContainer>
  );
};

export {
  AppNavigator,
  AuthNavigator,
  AdminTabs,
  DutyTabs,
  DispatcherTabs,
  FirefighterTabs,
};
