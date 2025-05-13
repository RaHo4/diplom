import React, { useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  Button,
} from "react-native";
import { AuthContext } from "../../../context/AuthContext";
// import Input from "../../common/Input";
// import Button from "../../common/Button";
import Loader from "../../common/Loader";

const Login = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoading, error } = useContext(AuthContext);

  const handleLogin = async () => {
    await login(email, password);
  };

  return (
    <View style={styles.container}>
      <Image
        // source={require('../../assets/images/logo.png')}
        style={styles.logo}
      />
      <Text style={styles.title}>Система пожарной безопасности</Text>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <TextInput
        placeholder="Email"
        style={styles.container}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Пароль"
        style={styles.container}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Button title="Войти" onPress={handleLogin} disabled={isLoading}>
        Войти
      </Button>

      <TouchableOpacity
        style={styles.registerLink}
        onPress={() => navigation.navigate("Register")}
      >
        <Text style={styles.registerText}>
          Нет аккаунта? Зарегистрироваться
        </Text>
      </TouchableOpacity>

      {isLoading && <Loader />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
  },
  logo: {
    width: 100,
    height: 100,
    alignSelf: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
    color: "#d32f2f",
  },
  errorText: {
    color: "red",
    marginBottom: 10,
    textAlign: "center",
  },
  registerLink: {
    marginTop: 20,
    alignSelf: "center",
  },
  registerText: {
    color: "#d32f2f",
    fontSize: 16,
  },
});

export default Login;
