import express from 'express'

import { routerAccess } from './routes/Access.js'
import { routerUsers } from './routes/Users.js';
export const server = express()



server.use( express.json() )

server.use('/api/access', routerAccess);
server.use('/api/users', routerUsers);

