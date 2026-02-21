import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { join } from 'path';
import { Request } from 'express';
import GraphQLJSON from 'graphql-type-json';

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
      ],
      context: ({ req }: { req: Request }) => ({ req, user: req.user }),
      resolvers: { JSON: GraphQLJSON },
    }),
  ],
})
export class AppGraphQLModule {}
