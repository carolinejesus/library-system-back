import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import livrosRoutes from "./routes/livrosRoutes.js";
import reservaRoutes from "./routes/reservaRoutes.js";
import usuarioRoutes from "./routes/usuarioRoutes.js";
import loginRoutes from "./routes/loginRoutes.js"
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";

dotenv.config();

const app = express();

const allowedOrigins = [
    "http://localhost:5173",
    "https://library-front-dusky.vercel.app" 
]
app.use(cors({
    origin: function(origin, callback){
        if(!origin) return callback(null, true);
        if(allowedOrigins.indexOf(origin) === -1){
            const msg = "O CORS não permite esta origem: "+ origin;
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use("/uploads/usuarios", express.static(path.join(__dirname, "uploads/usuarios")));

app.use("/livros", livrosRoutes);
app.use("/reservas", reservaRoutes);
app.use("/usuarios", usuarioRoutes);
app.use("/login", loginRoutes);
app.use("/uploads", express.static("uploads"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
