"use strict";

const axios = require("axios");
// import axios from "axios";

const BASE_URL = process.env.DORSEY_CLI_BASE_URL || "http://dorsey.cli.com:7001";

const request = axios.create({
  baseURL: BASE_URL,
  timeout: 5000,
});

request.interceptors.response.use(
  (respone) => {
    if (respone.status === 200) {
      return respone.data;
    } else {
      return null;
    }
  },
  (err) => {
    return Promise.reject(err);
  }
);

module.exports = request;
