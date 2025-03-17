import { Environment } from "./environment";

export const DevEnvironment = {
    db_uri: process.env.DB_URI || "mongodb+srv://bhoomi2004:2ujipSZ023Pzk4Hd@stickynotes.52fsj.mongodb.net/?retryWrites=true&w=majority&appName=StickyNotes",
    
    jwt_secret_key: 'secretkey'

};
