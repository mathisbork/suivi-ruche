require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcrypt");

const app = express();

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) return console.error("Erreur MySQL :", err);
  console.log("Connecté à MySQL !");
});

// --- ROUTES AUTH ---
app.post("/api/register", async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql =
      "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)";
    db.query(sql, [username, email, hashedPassword], (err, result) => {
      if (err) return res.status(500).json(err);
      res.status(201).json({ message: "Utilisateur créé !" });
    });
  } catch (e) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  const sqlSelect = "SELECT * FROM users WHERE email = ?";
  db.query(sqlSelect, [email], async (err, results) => {
    if (err) return res.status(500).json(err);
    if (results.length === 0)
      return res.status(401).json({ message: "Inconnu" });

    const user = results[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (match) {
      res.json({
        message: "Succès",
        user: { id: user.id, username: user.username, role: user.role },
      });
    } else {
      res.status(401).json({ message: "Mauvais mot de passe" });
    }
  });
});

// --- ROUTES STOCKS ---
app.get("/api/stocks/:userId", (req, res) => {
  const userId = req.params.userId;
  const sql = "SELECT * FROM stocks_miel WHERE user_id = ? ORDER BY annee DESC";
  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

app.post("/api/stocks", (req, res) => {
  const { type_miel, annee, poids_total, prix_kg, user_id } = req.body;
  const pots_500g = req.body.pots_500g || 0;
  const pots_250g = req.body.pots_250g || 0;
  const sql =
    "INSERT INTO stocks_miel (type_miel, annee, poids_total, pots_500g, pots_250g, prix_kg, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)";

  db.query(
    sql,
    [type_miel, annee, poids_total, pots_500g, pots_250g, prix_kg, user_id],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res
        .status(201)
        .json({ message: "Récolte ajoutée !", id: result.insertId });
    },
  );
});

app.delete("/api/stocks/:id", (req, res) => {
  const id = req.params.id;
  const sql = "DELETE FROM stocks_miel WHERE id = ?";
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Supprimé" });
  });
});

app.put("/api/stocks/:id", (req, res) => {
  const id = req.params.id;
  const { pots_500g, pots_250g, poids_total } = req.body;
  const sql =
    "UPDATE stocks_miel SET pots_500g = ?, pots_250g = ?, poids_total = ? WHERE id = ?";
  db.query(sql, [pots_500g, pots_250g, poids_total, id], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Mis à jour" });
  });
});

// --- ROUTES COMMANDES ---

// 1. Récupérer l'historique
app.get("/api/orders/:userId", (req, res) => {
  const userId = req.params.userId;
  const sql =
    "SELECT * FROM commande WHERE id_user = ? ORDER BY date_creation DESC";
  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json({ error: "Erreur serveur" });
    res.json(results);
  });
});

// 2. Créer une commande (LA SEULE ET L'UNIQUE ROUTE)
app.post("/api/orders", (req, res) => {
  const { user_id, items, total, date } = req.body;

  if (!user_id || !items || !total) {
    return res.status(400).json({ error: "Données manquantes" });
  }

  const sqlCommande =
    "INSERT INTO commande (id_user, total_ttc, date_creation) VALUES (?, ?, ?)";

  db.query(sqlCommande, [user_id, total, new Date(date)], (err, result) => {
    if (err) {
      console.error("Erreur insertion commande:", err);
      return res.status(500).json({ error: "Erreur BDD" });
    }

    const commandeId = result.insertId;
    console.log(`✅ Commande ${commandeId} créée.`);

    // Décrémentation des stocks
    items.forEach((item) => {
      let sqlUpdate = "";
      if (item.type_pot === "500g")
        sqlUpdate =
          "UPDATE stocks_miel SET pots_500g = pots_500g - ? WHERE id = ?";
      if (item.type_pot === "250g")
        sqlUpdate =
          "UPDATE stocks_miel SET pots_250g = pots_250g - ? WHERE id = ?";

      if (sqlUpdate) {
        db.query(sqlUpdate, [item.quantity, item.id], (e) => {
          if (e) console.error("Erreur stock:", e);
        });
      }
    });

    // Réponse au client
    return res
      .status(200)
      .json({ message: "Commande validée", id: commandeId });
  });
});

app.listen(3000, () => {
  console.log("Serveur prêt sur http://localhost:3000");
});

app.get("/api/admin/orders", (req, res) => {
  const sql = `
    SELECT c.*, u.username, u.email 
    FROM commande c 
    JOIN users u ON c.id_user = u.id 
    ORDER BY c.date_creation DESC
  `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

app.put("/api/orders/:id/status", (req, res) => {
  const id = req.params.id;
  const { statut } = req.body; // "Validée", "Payée", "Annulée"

  const sql = "UPDATE commande SET statut = ? WHERE id_commande = ?";
  db.query(sql, [statut, id], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Statut mis à jour" });
  });
});
