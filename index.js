const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
require('dotenv').config()
const app = express()
const cors = require('cors');

const port = process.env.PORT || 1000;

// midleware

app.use(cors())
app.use(express.json())



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

        const rockyDBcollection = client.db("rockyBossDB").collection("menu");
        const reviewDBcollection = client.db("rockyBossDB").collection("reviews");
        const cartDBcollection = client.db("rockyBossDB").collection("cart");

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

        app.get("/carts", async (req, res) => {
            const email = req.query.email;
            if (!email) {
                res.send([])
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