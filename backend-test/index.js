import express, { json } from 'express'
import cors from 'cors'
const app = express()
const port = 8080

app.use(cors());
app.use(json());

app.get('/', (req, res) => {
  res.json("Hello World!");
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})