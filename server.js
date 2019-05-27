const newrelic = require("newrelic");
const express = require("express");
const { GraphQLServer } = require("graphql-yoga");

const typeDefs = `
  type Query {
    hello17(name: String): String!
    hellomorning(name: String): String!
  }
`;

const helloHandle = next => async (root, args, ctx, info) => {
  return next(root, args, ctx, info);
};

const resolvers = {
  Query: {
    hello17: helloHandle(async (root, args, ctx) => {
      // throw new Error("this is error hellomorning");s
      return args.name;
    }),
  }
};

const options = {
  port: 8000,
  endpoint: "/",
  subscriptions: "/subscriptions",
  playground: "/playground",
  formatError: error => {
    return error;
  }
};

const errorCatch = async (resolve, root, args, ctx, info) => {
  const object = args.object || {};
  try {
    const result = await resolve(root, args, ctx, info);
    newrelic.setTransactionName(info.path.key);
    return result;
  } catch (err) {
    newrelic.setTransactionName(`${info.path.key}:${err.toString()}`);
    newrelic.noticeError(err, { ...object });
    return err;
  }
};

const server = new GraphQLServer({
  typeDefs,
  resolvers,
  context: ({ request }) => {
    return { next: request.next, res: request.res };
  },
  middlewares: [errorCatch],
  tracing: true
});
server.express.enable("trust proxy");
server.express.use(express.static("static"));

server.start(options, ({ port }) =>
  console.log(
    `Server started, listening on port ${port} for incoming requests.`
  )
);
