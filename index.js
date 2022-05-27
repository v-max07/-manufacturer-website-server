const express = require('express');
const app = express();
var cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


require('dotenv').config()

const port = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());


async function run() {
    try {
        const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.en2si.mongodb.net/?retryWrites=true&w=majority`;
        const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
        await client.connect();
        const ServiceCollection = client.db("motoRide").collection('bikeParts');
        const UserCollection = client.db("motoRide").collection('User');
        const bookingCollection = client.db('motoRide').collection('booking');
        const adminCollection = client.db('motoRide').collection('admin');

        // lode all services
        app.get('/services', async (req, res) => {
            const query = {};
            const cursor = ServiceCollection.find(query);
            const result = await cursor.toArray();
            res.send(result)
        })

        // find a single service
        app.get('/service/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const service = await ServiceCollection.findOne(query);
            res.send(service);
        });


        //get a user email for show in user collection
        app.put('/User/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email }
            const options = { upsert: true };
            if (user.email && user.name) {
                const updateDoc = {
                    $set: {
                        email: user?.email,
                        name: user?.name
                    },
                };
                const result = await UserCollection.updateOne(filter, updateDoc, options);
                res.send(result)
            }
        });


        // make admin 
        app.put('/User/admin/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email }
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    email: user.email,
                    name: user.name,
                    role: user.role,
                },
            };
            const result = await UserCollection.updateOne(filter, updateDoc, options);
            res.send(result)

        })

        //order
        


        // for order collection 
        app.post('/order', async (req, res) => {
            const booking = req.body;
            const result = await bookingCollection.insertOne(booking);
            res.send(result)
        });

        // get all orders
        app.get('/order', async (req, res) => {
            const query = {};
            const cursor = bookingCollection.find(query);
            const result = await cursor.toArray();
            res.send(result)
        });

        // get order by user email
        app.get('/order/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const service = await bookingCollection.find(query);
            const cursor = await service.toArray();
            res.send(cursor)

        });

        // get all users
        app.get('/users', async (req, res) => {
            const query = {};
            const cursor = UserCollection.find(query);
            const result = await cursor.toArray();
            res.send(result)

        })

        // for find available parts products
        app.get('/available', async (req, res) => {
            const query = {};
            const cursor = ServiceCollection.find(query);
            const result = await cursor.toArray();

            const filter = {};
            const cursors = bookingCollection.find(filter);
            const booking = await cursors.toArray();
            result.forEach(single => {
                const booked = booking.filter(book => book.name === single.name);
                const signlebook = booked.map(b => b.quantity)
                const avail = single.quantity - signlebook;
                single.quantity = avail;
            })
            res.send(result)


        })
    }
    finally {

    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello Moto!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})