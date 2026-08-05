//src/server.ts
import app from "./app"
import { env } from "./config/env"
import "./lib/queue"

app.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
})
