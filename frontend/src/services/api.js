import AsyncStorage from "@react-native-async-storage/async-storage";

import { ROUTE } from "../utils/constants";

class Api {
  #token = "";
  async post(handle, body) {
    try {
      await this.getAuthToken();

      const isFormData = body instanceof FormData;

      const response = await fetch(`${ROUTE}/api${handle}`, {
        method: "POST",
        headers: {
          // Если это FormData, НЕ ставим Content-Type — браузер/натив сам проставит правильный
          // Authorisation: this.#token ? `Bearer ${this.#token}` : "",
          ...(isFormData
            ? {}
            : { "Content-Type": "application/json;charset=utf-8" }),
          Authorisation: this.#token ? `Bearer ${this.#token}` : "",
        },
        body: isFormData ? body : JSON.stringify(body),
      });

      const json = await response.json();
      if (response.ok) {
        return json;
      } else {
        console.error("Ошибка:" + json.message);
        throw new Error(json.message);
      }
    } catch (e) {
      if (
        e.message === "Аккаунт деактивирован" ||
        e.message.includes("токен недействителен")
      ) {
        this.logout();
        return;
      }
      console.error(e);
      throw new Error(e);
    }
  }
  async get(handle) {
    try {
      const token = await this.getAuthToken();
      console.log("GET", token);
      const response = await fetch(`${ROUTE}/api${handle}`, {
        method: "GET",
        headers: {
          // "Content-Type": "application/json;charset=utf-8",
          Authorisation: token ? `Bearer ${token}` : "",
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
      if (
        e.message === "Аккаунт деактивирован" ||
        e.message.includes("токен недействителен")
      ) {
        await this.logout();
        return;
      }
      console.error(e);
      throw new Error(e);
    }
  }

  async put(handle, body) {
    try {
      await this.getAuthToken();
      const isFormData = body instanceof FormData;
      const response = await fetch(`${ROUTE}/api${handle}`, {
        method: "PUT",
        headers: {
          ...(isFormData
            ? {}
            : { "Content-Type": "application/json;charset=utf-8" }),
          Authorisation: this.#token ? `Bearer ${this.#token}` : "",
        },
        body: isFormData ? body : JSON.stringify(body),
      });
      const json = await response.json();
      if (response.ok) {
        return json;
      } else {
        console.error("Ошибка:" + json.message);
        throw new Error(json.message);
      }
    } catch (e) {
      if (
        e.message === "Аккаунт деактивирован" ||
        e.message.includes("токен недействителен")
      ) {
        await this.logout();
        return;
      }
      console.error(e);
      throw new Error(e);
    }
  }

  async delete(handle, body) {
    try {
      await this.getAuthToken();
      const response = await fetch(`${ROUTE}/api${handle}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json;charset=utf-8",
          Authorisation: this.#token ? `Bearer ${this.#token}` : "",
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
      if (
        e.message === "Аккаунт деактивирован" ||
        e.message.includes("токен недействителен")
      ) {
        this.logout();
        return;
      }
      console.error(e);
      throw new Error(e);
    }
  }
  setAuthToken(token) {
    this.#token = token;
    console.log("SETAUTHTOKEN", token, this.#token);
  }
  async getAuthToken() {
    const token = await AsyncStorage.getItem("token");
    this.#token = token;
    console.log("GETAUTHTOKEN", token);
    return token;
  }

  async logout() {
    await AsyncStorage.removeItem("user");
    await AsyncStorage.removeItem("token");
    this.#token = null;
  }
}

const api = new Api();
export default api;
