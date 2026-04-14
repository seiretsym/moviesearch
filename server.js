import express from 'express';
import axios from 'axios';
import path from 'path';

const app = express();
const PORT = process.env.PORT | 3377;
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "./client/index.html"));
})

app.get("/api", (req, res) => {
    // amc api stuff goes here
})

app.listen(PORT, () => console.log(`Server listening on ${PORT}`));