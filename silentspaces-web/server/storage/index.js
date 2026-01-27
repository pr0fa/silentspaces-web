// Setting up the swap from JSON to MySQL without touching routes.

const { JsonRatingsStore } = require("./jsonRatingsStore");
const { MysqlRatingsStore } = require ("./mysqlRatingsStore");

function getStore(){
    const provider= (process.env.STORAGE_PROVIDER || "json").toLowerCase();

    if(provider === "mysql"){
        return new MysqlRatingsStore();
    }

    // as default
    return new JsonRatingsStore();
}

module.exports= { getStore };