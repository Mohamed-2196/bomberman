import { Framework } from './js/framework.js'
import { Game } from './routes/game.js'
import {HomeComponent} from './LandingPage/HomeComponent.js'

const app = new Framework()
console.log("owowo")
app.route("/", HomeComponent)
app.route('/game', Game)

app.start()
