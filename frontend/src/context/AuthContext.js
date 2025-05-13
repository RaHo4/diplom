import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../services/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadStoredUser();
  }, []);

  const loadStoredUser = async () => {
    try {
      setIsLoading(true);
      const storedUser = await AsyncStorage.getItem("user");
      const storedToken = await AsyncStorage.getItem("token");

      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
        // api.setAuthToken(storedToken);
      }
    } catch (error) {
      console.error("Failed to load stored user", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await api.post("/auth/login", { email, password });
      // console.log(response);
      const { user, token } = response;

      setUser(user);
      setToken(token);
      // api.setAuthToken(token);

      await AsyncStorage.setItem("user", JSON.stringify(user));
      await AsyncStorage.setItem("token", token);
    } catch (error) {
      setError(error.response?.data?.message || "Ошибка при входе");
      console.error("Login error", error.response?.data || error);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    firstName,
    lastName,
    username,
    email,
    password,
    role
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      await api.post("/auth/register", {
        firstName,
        lastName,
        username,
        email,
        password,
        role,
      });

      // Show success message but don't login the user as admin needs to approve
      alert(
        "Заявка на регистрацию успешно отправлена! Ожидайте подтверждения администратором."
      );

      return true;
    } catch (error) {
      setError(error.response?.data?.message || "Ошибка при регистрации");
      console.error("Registration error", error.response?.data || error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: api.getAuthToken(),
        isLoading,
        error,
        login,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// const logout = async () => {
//   try {
//     setIsLoading(true);

//     await AsyncStorage.removeItem("user");
//     await AsyncStorage.removeItem("token");

//     setUser(null);
//     setToken(null);
//     api.clearAuthToken();
//   } catch (error) {
//     console.error("Logout error", error);
//   } finally {
//     setIsLoading(false);
//   }
// };

// export default logout;
