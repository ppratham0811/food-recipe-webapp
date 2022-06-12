const { MongoClient } = require("mongodb");

// connect to your Atlas cluster
const uri =
    process.env.DB_URL;

const client = new MongoClient(uri);
let docs = [];
async function run() {
    try {
        await client.connect();

        // set namespace
        const database = client.db("test");
        const coll = database.collection("recipes");

        // define pipeline
        const agg = [
            // [
            //     {
            //       '$search': {
            //         'index': 'default',
            //         'text': {
            //           'query': 'lemon',
            //           'path': {
            //             'wildcard': '*'
            //           }
            //         }
            //       }
            //     }
            //   ],
            {$search: {text: {query: "lemon", path: "title"}}},
            {$limit: 20},
            {$project: {_id: 1,title: 1, description: 1, ingredients: 1, method: 1, cook: 1 }}
        ];
        // run pipeline
        const result = await coll.aggregate(agg);

        // print results
        await result.forEach((doc) => {
            console.log(doc);
            // docs.push(doc);
        });
    } finally {
        // module.exports = docs;
        await client.close();
    }
}
run().catch(console.dir);
