import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ApolloServerPlugin } from '@apollo/server';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { join } from 'path';
import { Request } from 'express';
import GraphQLJSON from 'graphql-type-json';
import { GraphQLError } from 'graphql';

const RequireOperationNamePlugin: ApolloServerPlugin = {
  async requestDidStart() {
    return {
      async didResolveOperation(requestContext) {
        if (!requestContext.operationName) {
          throw new GraphQLError(
            'GraphQL operations must have a name. Anonymous operations are not allowed.',
            {
              extensions: {
                code: 'OPERATION_NAME_REQUIRED',
                http: { status: 400 },
              },
            },
          );
        }
      },
    };
  },
};

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      introspection: true,
      playground: false,
      plugins: [
        ApolloServerPluginLandingPageLocalDefault({
          embed: true,
          includeCookies: true,
        }),
        RequireOperationNamePlugin,
      ],
      context: ({ req }: { req: Request }) => ({ req, user: req.user }),
      resolvers: { JSON: GraphQLJSON },
    }),
  ],
})
export class AppGraphQLModule {}
