const swaggerAutogen = require("swagger-autogen");

const doc = {
    info: {
        title: "User Service API",
        description: "Automatically generated Swagger docs",
        version: "1.0.0"
    },
    host: "localhost:6003",
    schemes: ["http"]
}

const outputFile = "./swagger-output.json"
const endpointsFiles = ["./routes/user.route.ts"]

swaggerAutogen()(outputFile, endpointsFiles, doc)