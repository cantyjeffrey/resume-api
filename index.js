require("dotenv").config();
const express = require("express");
const graphqlHTTP = require("express-graphql");
const graphql = require("cf-graphql");
const cors = require("cors");

const createGraphQLClient = async ({ spaceId, cdaToken, cmaToken }) => {
  return graphql.createClient({ spaceId, cdaToken, cmaToken });
};

const generateSchema = async client => {
  return client
    .getContentTypes()
    .then(graphql.prepareSpaceGraph)
    .then(graphql.createSchema);
};

const startServer = async (config, client, schema) => {
  const { port } = config;
  const app = express();
  app.use(cors());
  app.get("/ping", (req, res) => res.send("pong"));
  app.use(
    "/",
    graphqlHTTP(function() {
      return {
        schema,
        context: { entryLoader: client.createEntryLoader() },
        graphiql: true
      };
    })
  );

  const opts = { version: false, timeline: false, detailedErrors: false };
  const ext = graphql.helpers.expressGraphqlExtension(client, schema, opts);
  app.use("/graphql", graphqlHTTP(ext));
  app.listen(port);
};

(async () => {
  const config = {
    spaceId: process.env.CONTENTFUL_SPACE_ID,
    cdaToken: process.env.CONTENTFUL_CDA_TOKEN,
    cmaToken: process.env.CONTENTFUL_CMA_TOKEN,
    port: process.env.PORT || 3000
  };
  const client = await createGraphQLClient(config);
  const schema = await generateSchema(client);
  await startServer(config, client, schema);
})().catch(err => {
  console.log(err);
});
