require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();
const PORT = process.env.PORT | 3377;
const apiKey = process.env.API_KEY;

// header info
const header = {
  "X-AMC-Vendor-Key": apiKey
}

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('client'));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "./client/index.html"));
})

app.get("/api/getTheatres", (req, res) => {
  // amc api stuff goes here
  const url = "https://api.amctheatres.com/v2/theatres";

  const params = {
    "page-size": 1000
  }
  axios.get(url, { headers: header, params: params }).then(({ data }) => res.json(data))
})

app.get("/api/getShowtimes", (req, res) => {
  const { id } = req.query;
  const url = `https://api.amctheatres.com/v2/theatres/${id}/showtimes`;

  const params = {
    "page-size": 10000
  }

  axios.get(url, { headers: header, params: params }).then(({ data }) => res.json(data))
})

app.listen(PORT, () => console.log(`Server listening on ${PORT}`));