import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import {
  AuthNavigator,
  AdminTabs,
  DutyTabs,
  DispatcherTabs,
  FirefighterTabs,
} from "./AuthNavigator";

const RoleBasedNavigator = ({ navigation }) => {
  const { user } = useContext(AuthContext);

  if (!user) {
    // return navigation.navigate("Auth");
    return <AuthNavigator />;
  }

  switch (user.role) {
    case "admin":
      return <AdminTabs />;
    case "duty":
      return <DutyTabs />;
    case "dispatcher":
      return <DispatcherTabs />;
    case "firefighter":
      return <FirefighterTabs />;
    default:
      return <AuthNavigator />;
  }
};

export default RoleBasedNavigator;
