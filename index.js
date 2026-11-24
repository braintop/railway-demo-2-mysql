import express from 'express'
import cors from 'cors'
import mysql from 'mysql2/promise'

const app = express()
app.use(cors())
app.use(express.json())

// Railway יוצר את המשתנה MYSQL_URL בשירות ה-MySQL.
// בשירות השרת אנחנו מפנים אליו: ${{MySQL.MYSQL_URL}}
const pool = mysql.createPool(process.env.MYSQL_URL)

// יוצרים את הטבלה אם היא לא קיימת, כדי שלא נצטרך להריץ SQL ידנית
await pool.query(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    done BOOLEAN NOT NULL DEFAULT FALSE
  )
`)

app.get('/', (req, res) => {
  res.json({ message: 'MySQL API is running on Railway' })
})

app.get('/api/tasks', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM tasks ORDER BY id')
  // ב-MySQL ה-BOOLEAN נשמר כ-0/1, אז ממירים ל-true/false
  res.json(rows.map(r => ({ ...r, done: Boolean(r.done) })))
})

app.post('/api/tasks', async (req, res) => {
  const { title } = req.body
  if (!title) return res.status(400).json({ error: 'title is required' })

  const [result] = await pool.query('INSERT INTO tasks (title) VALUES (?)', [title])
  res.status(201).json({ id: result.insertId, title, done: false })
})

app.put('/api/tasks/:id', async (req, res) => {
  const { done } = req.body
  await pool.query('UPDATE tasks SET done = ? WHERE id = ?', [Boolean(done), req.params.id])
  res.json({ message: 'Task updated' })
})

app.delete('/api/tasks/:id', async (req, res) => {
  await pool.query('DELETE FROM tasks WHERE id = ?', [req.params.id])
  res.json({ message: 'Task deleted' })
})

const port = process.env.PORT || 3000
app.listen(port, () => console.log(`Server running on port ${port}`))
