const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
require('dotenv').config()
const app = express()
const cors = require('cors');
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 1000;

// midleware

app.use(cors())
app.use(express.json())
const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(401).send({ error: true, message: "Unauthorised Access !!!" })
    }
    //   bearer token
    const token = authorization.split(' ')[1]

    jwt.verify(token, process.env.Access_TOKEN_SECRET, (error, decoded) => {
        if (error) {
            return res.status(401).send({ error: true, message: "Forbiden Access !!!" })
        }
        req.decoded = decoded;
        next();
    })

}


app.get("/", (req, res) => {
    res.send("Rocky Boss Server Running")
})



const uri = `mongodb+srv://${process.env.ROCKY_USER}:${process.env.ROCKY_PASS}@cluster0.yaanftr.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const userDBcollection = client.db("rockyBossDB").collection("user");
        const rockyDBcollection = client.db("rockyBossDB").collection("menu");
        const reviewDBcollection = client.db("rockyBossDB").collection("reviews");
        const cartDBcollection = client.db("rockyBossDB").collection("cart");

        //JWT TOKEN 

        app.post("/jwt", (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.Access_TOKEN_SECRET, { expiresIn: "1h" })
            res.send(token)
        })
        //get data from mongodob
        app.get("/menus", async (req, res) => {
            // const query = {}
            const query = rockyDBcollection.find();
            const result = await query.toArray()
            res.send(result)
        })
        app.get("/reviews", async (req, res) => {
            // const query = {}
            const query = reviewDBcollection.find();
            const result = await query.toArray()
            res.send(result)
        })

        //post cart collection into db

        app.post("/carts", async (req, res) => {
            const item = req.body;
            console.log(item);
            const result = await cartDBcollection.insertOne(item)
            res.send(result)
        })

        //get cart collection from db

        app.get("/carts", verifyJWT, async (req, res) => {
            const email = req.query.email;
            if (!email) {
                res.send([])
            }

            const decodedMail = req.decoded.email;

            if (email !== decodedMail) {
                return res.status(403).send({ error: true, message: "Forbiden Access" })
            }
            const query = { email: email }
            const data = cartDBcollection.find(query)
            const result = await data.toArray()
            res.send(result)
        })

        //delete order item from db

        app.delete("/carts/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await cartDBcollection.deleteOne(query)
            res.send(result);
        })

        //post user info to db

        app.post("/users", async (req, res) => {
            const user = req.body;
            const query = { email: user.email }
            const existingUser = await userDBcollection.findOne(query)
            console.log("exist", existingUser);
            if (existingUser) {
                return res.send({ message: "user already exist" })
            }
            const result = await userDBcollection.insertOne(user);
            res.send(result);
        })

        //get data from users

        app.get("/users", async (req, res) => {
            // const query = {}
            const query = userDBcollection.find();
            const result = await query.toArray()
            res.send(result)
        })

        //delete user from db

        app.delete("/users/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await userDBcollection.deleteOne(query)
            res.send(result);
        })


        //getting spechific user from db

        app.get("/users/admin/:email", verifyJWT, async (req, res) => {
            const email = req.query.email;
            if (req.decoded.email !== email) {
                res.send({ admin: false })
            }
            const query = { email: email }
            const user = await userDBcollection.findOne(query);
            const result = { admin: user?.role === "admin" }
            res.send(result)
        })
        //convert user into Admin

        app.patch("/users/admin/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }

            const updateDoc = {
                $set: {
                    role: "admin"
                },
            };
            const result = await userDBcollection.updateOne(query, updateDoc)
            res.send(result)
        })
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.listen(port, () => {
    console.log(`Rocky Boss is running At Port: ${port}`);
})