import { Server } from './server';
import cors from "cors";

let server = new Server().app;
let port = 5000;

server.listen(port, () => {
    console.log(`server is running at port ${port}`);
});

