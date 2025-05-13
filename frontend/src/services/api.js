import AsyncStorage from "@react-native-async-storage/async-storage";

const ROUTE = "http://192.168.1.106:5000/api";

class Api {
  #token = "";
  async post(handle, body) {
    try {
      await this.getAuthToken();
      const response = await fetch(`${ROUTE}${handle}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json;charset=utf-8",
          Authorisation: this.#token ? `Bearer ${this.#token}` : "",
        },
        body: JSON.stringify(body),
      });
      if (response.ok) {
        const json = await response.json();
        return json;
      } else {
        if (e.message === "Аккаунт деактивирован") {
          this.#logout();
          return;
        }
        console.error("Error:" + response.message);
        throw new Error(json.message);
      }
    } catch (e) {
      console.error(e);
      throw new Error(e);
    }
  }
  async get(handle) {
    try {
      await this.getAuthToken();
      const response = await fetch(`${ROUTE}${handle}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json;charset=utf-8",
          Authorisation: "Bearer " + this.#token ?? "",
        },
      });
      const json = await response.json();
      if (response.ok) {
        return json;
      } else {
        console.error("Ошибка:" + json.message);
        throw new Error(json.message);
      }
    } catch (e) {
      // console.log(e.message)
      if (e.message === "Аккаунт деактивирован") {
        this.#logout();
        return;
      }
      console.error(e);
      throw new Error(e);
    }
  }
  setAuthToken(token) {
    this.#token = token;
  }
  async getAuthToken() {
    this.#token = await AsyncStorage.getItem("token");
    return this.#token;
  }

  async #logout() {
    await AsyncStorage.removeItem("user");
    await AsyncStorage.removeItem("token");
    this.#token = null;
  }
}

const api = new Api();
export default api;
