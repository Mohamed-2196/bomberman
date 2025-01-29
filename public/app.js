import { Framework } from './js/framework.js'
import { Game } from './routes/game.js'

const app = new Framework()

app.route('/', Game)

app.start()
