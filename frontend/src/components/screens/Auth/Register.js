import React, { useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Button,
} from "react-native";
import { AuthContext } from "../../../context/AuthContext";
// import Input from '../../common/Input';
// import Button from '../../common/Button';
import Loader from "../../common/Loader";

const Register = ({ navigation }) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("firefighter"); // Default role
  const { register, isLoading, error } = useContext(AuthContext);

  const roles = [
    { id: "duty", label: "Дежурный по зданию" },
    { id: "dispatcher", label: "Диспетчер" },
    { id: "firefighter", label: "Пожарный" },
  ];

  const handleRegister = async () => {
    // console.log(password, confirmPassword, fullName);
    if (password !== confirmPassword) {
      alert("Пароли не совпадают");
      return;
    }

    await register(firstName, lastName, username, email, password, role);
    navigation.navigate("Login");
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Регистрация</Text>
      <Text style={styles.subtitle}>
        Ваша заявка будет рассмотрена администратором
      </Text>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <TextInput
        style={styles.roleItem}
        placeholder="Фамилия"
        value={lastName}
        onChangeText={setLastName}
      />
      <TextInput
        style={styles.roleItem}
        placeholder="Имя"
        value={firstName}
        onChangeText={setFirstName}
      />
      <TextInput
        style={styles.roleItem}
        placeholder="Юзернейм"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.roleItem}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.roleItem}
        placeholder="Пароль"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TextInput
        style={styles.roleItem}
        placeholder="Подтвердите пароль"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      <Text style={styles.roleLabel}>Выберите роль:</Text>
      <View style={styles.rolesContainer}>
        {roles.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.roleItem,
              role === item.id && styles.roleItemSelected,
            ]}
            onPress={() => setRole(item.id)}
          >
            <Text
              style={[
                styles.roleText,
                role === item.id && styles.roleTextSelected,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Button
        title="Зарегистрироваться"
        onPress={handleRegister}
        disabled={isLoading}
      />

      <TouchableOpacity
        style={styles.loginLink}
        onPress={() => navigation.navigate("Login")}
      >
        <Text style={styles.loginText}>Уже есть аккаунт? Войти</Text>
      </TouchableOpacity>

      {isLoading && <Loader />}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 40,
    marginBottom: 10,
    color: "#d32f2f",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
    color: "#666",
  },
  errorText: {
    color: "red",
    marginBottom: 10,
    textAlign: "center",
  },
  roleLabel: {
    fontSize: 16,
    marginTop: 10,
    marginBottom: 10,
    color: "#333",
  },
  rolesContainer: {
    flexDirection: "column",
    marginBottom: 20,
  },
  roleItem: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  roleItemSelected: {
    backgroundColor: "#d32f2f",
    borderColor: "#d32f2f",
  },
  roleText: {
    fontSize: 16,
    color: "#333",
  },
  roleTextSelected: {
    color: "#fff",
  },
  loginLink: {
    marginTop: 20,
    alignSelf: "center",
    marginBottom: 40,
  },
  loginText: {
    color: "#d32f2f",
    fontSize: 16,
  },
});

export default Register;
